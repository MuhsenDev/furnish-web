/*
  CLI: blast the T-1-week pre-launch email to every waitlist row.

  Usage:
    pnpm email:prelaunch:dry  --launch-day=Tuesday --launch-date=2026-08-12
    pnpm email:prelaunch      --launch-day=Tuesday --launch-date=2026-08-12

  Args:
    --launch-day=<dayName>   Display string used in the body, e.g. "Tuesday".
                              Required.
    --launch-date=<YYYY-MM-DD> ISO date. Formatted as "August 12" for
                              display in the body. Required.
    --dry-run                 Iterate the list and log what WOULD be
                              sent without calling Resend. Skips the
                              "type 'send' to confirm" prompt.

  Behavior:
    - Loads .env.local for SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
      RESEND_API_KEY.
    - Pulls every row from the waitlist table via the service-role
      key (bypasses RLS, returns the full list).
    - In live mode, prompts for "send" before firing the first email
      so you cannot accidentally blast the list.
    - Throttles to 10 sends/sec to stay under the Resend free tier
      rate limit (we sleep ~110 ms between sends; conservative).
    - Per-email errors are caught + logged, the batch keeps going.
    - Final summary prints the count of successes, failures, and the
      list of failed addresses.

  Sent-email logging is intentionally NOT persisted to the DB. Resend
  keeps delivery logs in their dashboard; we don't need a duplicate.
*/

import 'dotenv/config';
import * as readline from 'node:readline';
import { sendPrelaunchEmail } from '../src/lib/email';

interface CliArgs {
  launchDay: string;
  launchDate: string;
  dryRun: boolean;
}

interface WaitlistRow {
  email: string;
  position: number;
}

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/* Resend free tier is 10 req/sec. 110 ms between sends gives ~9/sec
   peak, leaves slack for jitter / network re-tries inside the SDK. */
const THROTTLE_MS = 110;

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const out: Partial<CliArgs> = { dryRun: false };
  for (const raw of args) {
    if (raw === '--dry-run') {
      out.dryRun = true;
    } else if (raw.startsWith('--launch-day=')) {
      out.launchDay = raw.substring('--launch-day='.length).trim();
    } else if (raw.startsWith('--launch-date=')) {
      out.launchDate = raw.substring('--launch-date='.length).trim();
    } else {
      console.error(`Unknown arg: ${raw}`);
      process.exit(1);
    }
  }
  if (!out.launchDay || !out.launchDate) {
    console.error(
      'Required: --launch-day=Tuesday --launch-date=2026-08-12 [--dry-run]',
    );
    process.exit(1);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(out.launchDate)) {
    console.error(`--launch-date must be YYYY-MM-DD, got "${out.launchDate}"`);
    process.exit(1);
  }
  return out as CliArgs;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/* Format an ISO date (YYYY-MM-DD) as "August 12". UTC parsing so the
   day-of-month doesn't shift on the developer's local timezone. */
function formatDateForDisplay(iso: string): string {
  const [yStr, mStr, dStr] = iso.split('-');
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);
  if (
    !MONTHS[m - 1] ||
    Number.isNaN(d) ||
    d < 1 ||
    d > 31 ||
    !yStr ||
    Number.isNaN(parseInt(yStr, 10))
  ) {
    throw new Error(`Invalid launch date: ${iso}`);
  }
  return `${MONTHS[m - 1]} ${d}`;
}

async function fetchAllRows(): Promise<WaitlistRow[]> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env. ' +
        'Set them in .env.local before running this script.',
    );
  }

  /* Order by position so the live-progress log reads roughly in
     waitlist order (mostly cosmetic). */
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
  const launchDateDisplay = formatDateForDisplay(args.launchDate);

  console.log(
    `[prelaunch] mode=${args.dryRun ? 'DRY-RUN' : 'LIVE'} ` +
      `day=${args.launchDay} date=${args.launchDate} ` +
      `(displayed as "${launchDateDisplay}")`,
  );

  const rows = await fetchAllRows();
  if (rows.length === 0) {
    console.log('[prelaunch] no rows in waitlist; nothing to send.');
    return;
  }
  console.log(`[prelaunch] fetched ${rows.length} waitlist rows.`);

  if (!args.dryRun) {
    if (!process.env.RESEND_API_KEY) {
      console.warn(
        '[prelaunch] WARNING: RESEND_API_KEY is not set. Sends would log to ' +
          'console only. Use --dry-run for that path.',
      );
    }
    const subject = 'Furnish goes live one week from today';
    const answer = await ask(
      `\nYou're about to send ${rows.length} pre-launch emails. ` +
        `Subject: '${subject}'. ` +
        `First recipient: '${rows[0].email}'. ` +
        `Type 'send' to confirm or anything else to abort: `,
    );
    if (answer !== 'send') {
      console.log('[prelaunch] aborted.');
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
          `[prelaunch] DRY ${i + 1}/${rows.length}: would send to ${row.email} ` +
            `(position #${row.position}, launch ${args.launchDay}, ${launchDateDisplay})`,
        );
        successCount += 1;
      } else {
        const result = await sendPrelaunchEmail({
          to: row.email,
          position: row.position,
          launchDay: args.launchDay,
          launchDate: launchDateDisplay,
        });
        if (result.ok) {
          successCount += 1;
          console.log(
            `[prelaunch] sent ${i + 1}/${rows.length}: ${row.email}`,
          );
        } else {
          failures.push({ email: row.email, error: result.error ?? 'unknown' });
          console.log(
            `[prelaunch] FAIL ${i + 1}/${rows.length}: ${row.email} (${result.error})`,
          );
        }
      }
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? String(err);
      failures.push({ email: row.email, error: msg });
      console.log(
        `[prelaunch] EXCEPTION ${i + 1}/${rows.length}: ${row.email} (${msg})`,
      );
    }

    if (!args.dryRun && i < rows.length - 1) {
      await sleep(THROTTLE_MS);
    }
  }

  console.log('---');
  console.log(
    `[prelaunch] DONE. Sent ${successCount} successfully. ` +
      `Failed: ${failures.length}.`,
  );
  if (failures.length > 0) {
    console.log('[prelaunch] failed addresses:');
    for (const f of failures) {
      console.log(`  - ${f.email}: ${f.error}`);
    }
  }
}

main().catch((err) => {
  console.error('[prelaunch] fatal:', err);
  process.exit(1);
});
