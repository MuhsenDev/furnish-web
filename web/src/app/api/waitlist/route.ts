/*
  Waitlist API per Document 9 §8.2.

  Accepts POST with { email: string }. Validates format. Inserts
  into the Supabase 'waitlist' table via the service-role key
  (server-only; bypasses RLS).

  Behavior when Supabase is not configured (env vars unset):
  the endpoint accepts the email, logs it server-side, and
  returns success. This keeps local development and pre-Supabase
  prod testing functional. Once SUPABASE_URL and
  SUPABASE_SERVICE_ROLE_KEY are set in Vercel, real inserts begin.

  Rate limit: simple per-IP token bucket (20 requests per hour
  per IP). Hassan tunes if real abuse appears.

  Idempotency: the waitlist table should have a unique constraint
  on email; duplicate inserts return ok=true to the client (no
  signal that an email was already on the list, which would leak
  signup membership information).
*/

import { type NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseInsert } from '@/lib/supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Per-IP rate limiter. In-memory; resets on cold start. Acceptable
   for this volume; if the site needs hardened rate limiting, switch
   to Upstash or Vercel KV. */
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 20;
const ipBuckets = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  /* Prefer x-forwarded-for first IP, then x-real-ip, then unknown.
     Vercel and most edge proxies set x-forwarded-for. */
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429 },
    );
  }

  let body: { email?: unknown };
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

  /* If Supabase is configured, insert the row. If not, log and
     return ok so local dev and pre-config prod still work. */
  if (isSupabaseConfigured()) {
    const result = await supabaseInsert('waitlist', {
      email,
      source: 'website',
      created_at: new Date().toISOString(),
    });

    /* Idempotent on duplicate email: status 409 from Supabase means
       the unique constraint blocked the insert, which is fine for
       the user (they are already on the list). Return ok. */
    if (!result.ok && result.status !== 409) {
      console.error(
        `[waitlist] supabase insert failed for ${email}: ${result.error}`,
      );
      return NextResponse.json(
        { ok: false, error: 'persistence_failed' },
        { status: 500 },
      );
    }
  } else {
    console.log(`[waitlist] received signup (no Supabase): ${email}`);
  }

  return NextResponse.json({ ok: true });
}
