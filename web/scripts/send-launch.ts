/*
  CLI: blast the launch-day email to every waitlist row.

  Usage:
    pnpm email:launch:dry  --app-store-url=https://apps.apple.com/...
    pnpm email:launch      --app-store-url=https://apps.apple.com/...

  Args:
    --app-store-url=<url>  The live App Store URL from App Store
                            Connect. Required.
    --dry-run               Iterate the list and log what WOULD be
                            sent without calling Resend. Skips the
                            "type 'send' to confirm" prompt.

  Behavior mirrors send-prelaunch.ts (env loading, full-table fetch
  with the service-role key, throttle at ~9/sec, per-email error
  isolation, end-of-run summary). Pre-flight prompt requires typing
  'send' before the first email leaves Resend.

  Sent-email logging is intentionally NOT persisted to the DB. Resend
  keeps delivery logs in their dashboard; we don't need a duplicate.
*/

/* See send-prelaunch.ts for the rationale; dotenv auto-loads `.env`
   only, so we point it at `.env.local` explicitly first. */
import * as dotenv from 'dotenv';
import * as path from 'node:path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

import * as readline from 'node:readline';
import { sendLaunchEmail } from '../src/lib/email';

interface CliArgs {
  appStoreUrl: string;
  dryRun: boolean;
}

interface WaitlistRow {
  email: string;
  position: number;
}

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const THROTTLE_MS = 110;

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const out: Partial<CliArgs> = { dryRun: false };
  for (const raw of args) {
    if (raw === '--dry-run') {
      out.dryRun = true;
    } else if (raw.startsWith('--app-store-url=')) {
      out.appStoreUrl = raw.substring('--app-store-url='.length).trim();
    } else {
      console.error(`Unknown arg: ${raw}`);
      process.exit(1);
    }
  }
  if (!out.appStoreUrl) {
    console.error(
      'Required: --app-store-url=https://apps.apple.com/... [--dry-run]',
    );
    process.exit(1);
  }
  if (!/^https?:\/\//i.test(out.appStoreUrl)) {
    console.error(
      `--app-store-url must start with http:// or https://, got "${out.appStoreUrl}"`,
    );
    process.exit(1);
  }
  return out as CliArgs;
}

async function fetchAllRows(): Promise<WaitlistRow[]> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env. ' +
        'Set them in .env.local before running this script.',
    );
  }

  const url =
    `${SUPABASE_URL}/rest/v1/waitlist` +
    `?select=email,position&order=position.asc`;

  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase fetch failed: ${res.status} ${body}`);
  }

  return (await res.json()) as WaitlistRow[];
}

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

async function main(): Promise<void> {
  const args = parseArgs();

  console.log(
    `[launch] mode=${args.dryRun ? 'DRY-RUN' : 'LIVE'} ` +
      `app-store-url=${args.appStoreUrl}`,
  );

  const rows = await fetchAllRows();
  if (rows.length === 0) {
    console.log('[launch] no rows in waitlist; nothing to send.');
    return;
  }
  console.log(`[launch] fetched ${rows.length} waitlist rows.`);

  if (!args.dryRun) {
    if (!process.env.RESEND_API_KEY) {
      console.warn(
        '[launch] WARNING: RESEND_API_KEY is not set. Sends would log to ' +
          'console only. Use --dry-run for that path.',
      );
    }
    const subject = 'Furnish is live';
    const answer = await ask(
      `\nYou're about to send ${rows.length} launch emails. ` +
        `Subject: '${subject}'. ` +
        `First recipient: '${rows[0].email}'. ` +
        `Type 'send' to confirm or anything else to abort: `,
    );
    if (answer !== 'send') {
      console.log('[launch] aborted.');
      return;
    }
  }

  const failures: { email: string; error: string }[] = [];
  let successCount = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];

    try {
      if (args.dryRun) {
        console.log(
          `[launch] DRY ${i + 1}/${rows.length}: would send to ${row.email} ` +
            `(position #${row.position}, app-store ${args.appStoreUrl})`,
        );
        successCount += 1;
      } else {
        const result = await sendLaunchEmail({
          to: row.email,
          position: row.position,
          appStoreUrl: args.appStoreUrl,
        });
        if (result.ok) {
          successCount += 1;
          console.log(`[launch] sent ${i + 1}/${rows.length}: ${row.email}`);
        } else {
          failures.push({ email: row.email, error: result.error ?? 'unknown' });
          console.log(
            `[launch] FAIL ${i + 1}/${rows.length}: ${row.email} (${result.error})`,
          );
        }
      }
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? String(err);
      failures.push({ email: row.email, error: msg });
      console.log(
        `[launch] EXCEPTION ${i + 1}/${rows.length}: ${row.email} (${msg})`,
      );
    }

    if (!args.dryRun && i < rows.length - 1) {
      await sleep(THROTTLE_MS);
    }
  }

  console.log('---');
  console.log(
    `[launch] DONE. Sent ${successCount} successfully. ` +
      `Failed: ${failures.length}.`,
  );
  if (failures.length > 0) {
    console.log('[launch] failed addresses:');
    for (const f of failures) {
      console.log(`  - ${f.email}: ${f.error}`);
    }
  }
}

main().catch((err) => {
  console.error('[launch] fatal:', err);
  process.exit(1);
});
