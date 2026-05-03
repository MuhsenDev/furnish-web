/*
  Waitlist API stub per Document 5 build sequence.

  Accepts POST with { email: string }, validates the format, and
  returns { ok: true } on success. Real persistence (Supabase,
  ConvertKit, Mailchimp, or similar) is a Document 9 / launch
  concern. For now the email is logged server-side so Hassan can
  inspect Vercel function logs during pre-launch testing.

  The endpoint is rate-limit-friendly: a single submit per request,
  no batch behavior, no GET handler.
*/

import { type NextRequest, NextResponse } from 'next/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: 'invalid_email' },
      { status: 400 },
    );
  }

  /* Persistence stub. Replace with the real ESP integration when
     Document 9 lands (likely a fetch to Supabase, ConvertKit, or
     similar). For now the email lands in the Vercel logs so Hassan
     can manually export pre-launch signups during the early days. */
  console.log(`[waitlist] received signup: ${email}`);

  return NextResponse.json({ ok: true });
}
