/*
  Waitlist API per Document 9 §8.2 + 2026-05-08 referral mechanics.

  POST { email: string, referredBy?: string }
    -> { ok: true, position: number, referralCode: string,
                   referredCount: number, alreadyOnList?: boolean }

  Behavior:
    - Validates email format.
    - If `referredBy` is provided, looks up the referrer. If the
      code doesn't resolve to a real row, silently drops it (don't
      break a signup over a bogus param).
    - Generates an 8-char referral_code; retries up to 5 times on
      collision (UNIQUE index in the DB).
    - Inserts the row. The DB sequence handles position assignment
      atomically; the after-insert trigger applies the +referrer
      bump + referred_count increment when referred_by is set.
    - Returns the new user's position + code so the UI can swap to
      the confirmation screen.
    - Fires sendConfirmationEmail without awaiting so a slow Resend
      roundtrip doesn't slow the user response. Failures are logged
      server-side, not surfaced to the client.

  Duplicate email handling:
    - Returns 200 with `alreadyOnList: true` and the EXISTING user's
      position + code, so the UI can still show the confirmation
      screen. Avoids leaking signup membership to fishing attempts
      (a 409 would confirm "yes, this email is on the list"). Spec
      explicitly asks for this UX: "you're already on the list" not
      "this email exists".

  Behavior when Supabase isn't configured (env vars unset): the
  endpoint synthesizes a plausible position + code, returns success,
  and skips the persistence + email steps. Keeps local development
  and pre-Supabase prod testing functional.
*/

import { type NextRequest, NextResponse } from 'next/server';
import {
  isSupabaseConfigured,
  supabaseInsert,
  supabaseSelect,
  supabaseCount,
} from '@/lib/supabase';
import { sendConfirmationEmail } from '@/lib/email';
import { generateReferralCode } from '@/lib/referral';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REFERRAL_CODE_RE = /^[a-z0-9]{4,16}$/;

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;
const ipBuckets = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    ipBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return true;
  bucket.count += 1;
  return false;
}

interface WaitlistRow {
  email: string;
  position: number;
  referral_code: string;
  referred_count: number;
}

interface SignupSuccessBody {
  ok: true;
  position: number;
  referralCode: string;
  referredCount: number;
  alreadyOnList?: boolean;
}

interface SignupErrorBody {
  ok: false;
  error: string;
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<SignupSuccessBody | SignupErrorBody>> {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429 },
    );
  }

  let body: { email?: unknown; referredBy?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_json' },
      { status: 400 },
    );
  }

  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { ok: false, error: 'invalid_email' },
      { status: 400 },
    );
  }

  /* Sanitize referredBy: must be a short alphanumeric string. */
  const referredByRaw =
    typeof body.referredBy === 'string'
      ? body.referredBy.trim().toLowerCase()
      : '';
  const referredBy = REFERRAL_CODE_RE.test(referredByRaw)
    ? referredByRaw
    : null;

  /* Without Supabase (local dev / pre-config), synthesize a
     plausible response so the UI flow works end-to-end. The
     position is a fixed 1 (the honest stub when no row count is
     available) and the referral code is freshly generated and
     not persisted. */
  if (!isSupabaseConfigured()) {
    const fallbackPosition = 1;
    const fallbackCode = generateReferralCode();
    // eslint-disable-next-line no-console
    console.log(
      `[waitlist] received signup (no Supabase): ${email} (referredBy=${referredBy ?? 'none'})`,
    );
    /* Fire and forget: still hit Resend in dev so the email module's
       console-fallback path runs, useful for content QA. */
    void sendConfirmationEmail({
      to: email,
      position: fallbackPosition,
      referralCode: fallbackCode,
    });
    return NextResponse.json({
      ok: true,
      position: fallbackPosition,
      referralCode: fallbackCode,
      referredCount: 0,
    });
  }

  /* Validate referrer exists. If the param is set but no row
     resolves, drop it silently (don't error). */
  let validReferralCode: string | null = null;
  if (referredBy) {
    const refLookup = await supabaseSelect<{ referral_code: string }>(
      'waitlist',
      `select=referral_code&referral_code=eq.${encodeURIComponent(referredBy)}&limit=1`,
    );
    if (refLookup.ok && refLookup.data && refLookup.data.length > 0) {
      validReferralCode = refLookup.data[0].referral_code;
    }
  }

  /* Duplicate-email pre-check: return the existing row's position +
     code instead of letting the unique constraint fire. Lets the UI
     show the confirmation screen with accurate data. */
  const existing = await supabaseSelect<WaitlistRow>(
    'waitlist',
    `select=email,position,referral_code,referred_count&email=eq.${encodeURIComponent(email)}&limit=1`,
  );
  if (existing.ok && existing.data && existing.data.length > 0) {
    const row = existing.data[0];
    return NextResponse.json({
      ok: true,
      position: row.position,
      referralCode: row.referral_code,
      referredCount: row.referred_count,
      alreadyOnList: true,
    });
  }

  /* Generate a unique referral code. Retry up to 5x on collision
     (UNIQUE index will reject duplicates with status 409 from
     PostgREST; we handle that defensively). */
  let referralCode = '';
  let inserted: WaitlistRow | null = null;
  let lastError = '';
  for (let attempt = 0; attempt < 5; attempt += 1) {
    referralCode = generateReferralCode();
    const insertResult = await supabaseInsert<WaitlistRow>(
      'waitlist',
      {
        email,
        source: 'website',
        created_at: new Date().toISOString(),
        referral_code: referralCode,
        referred_by: validReferralCode,
      },
      { returning: true },
    );

    if (insertResult.ok && insertResult.data && insertResult.data.length > 0) {
      inserted = insertResult.data[0];
      break;
    }

    lastError = insertResult.error ?? 'unknown';

    /* 409 = unique violation; could be email or referral_code. If
       it's email, the existing-check above already handled it (race
       between check and insert). If referral_code, retry with a new
       code. We don't know which without parsing the body, so retry
       a few times then fall through. */
    if (insertResult.status !== 409) break;
  }

  if (!inserted) {
    // eslint-disable-next-line no-console
    console.error(
      `[waitlist] supabase insert failed for ${email}: ${lastError}`,
    );

    /* If we hit 409 repeatedly, the email might have been inserted
       between our pre-check and our retries (race). Re-check the
       existing row and return that. */
    if (lastError.endsWith('409')) {
      const refetch = await supabaseSelect<WaitlistRow>(
        'waitlist',
        `select=email,position,referral_code,referred_count&email=eq.${encodeURIComponent(email)}&limit=1`,
      );
      if (refetch.ok && refetch.data && refetch.data.length > 0) {
        const row = refetch.data[0];
        return NextResponse.json({
          ok: true,
          position: row.position,
          referralCode: row.referral_code,
          referredCount: row.referred_count,
          alreadyOnList: true,
        });
      }
    }

    return NextResponse.json(
      { ok: false, error: 'persistence_failed' },
      { status: 500 },
    );
  }

  /* Fire-and-forget the email so a slow Resend call doesn't slow
     the user response. Errors are logged inside sendConfirmationEmail. */
  void sendConfirmationEmail({
    to: email,
    position: inserted.position,
    referralCode: inserted.referral_code,
  });

  return NextResponse.json({
    ok: true,
    position: inserted.position,
    referralCode: inserted.referral_code,
    referredCount: inserted.referred_count,
  });
}

/*
  GET /api/waitlist returns the public aggregate signup count, the
  real DB row count with no offset applied. The homepage renders
  server-side and re-fetches per request (supabaseCount uses
  cache: 'no-store'). Kept on the same route so the API surface
  stays compact.
*/
interface CountSuccessBody {
  ok: true;
  count: number;
}

interface CountErrorBody {
  ok: false;
  error: string;
}

export async function GET(): Promise<NextResponse<CountSuccessBody | CountErrorBody>> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, count: 0 });
  }

  const result = await supabaseCount('waitlist');
  if (!result.ok || result.count == null) {
    return NextResponse.json(
      { ok: false, error: 'count_failed' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    count: result.count,
  });
}
