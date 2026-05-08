/*
  Transactional email via Resend.

  Single export: sendConfirmationEmail. Called from the waitlist
  signup API route after a successful database insert. The call
  is fire-and-forget on the API route side so a slow Resend roundtrip
  doesn't block the user response.

  Resilience:
    - If RESEND_API_KEY is unset (dev / pre-launch), the function
      logs the email contents to the server console and returns
      success without throwing. Lets the app run end-to-end
      locally before Hassan finishes domain verification at Resend.
    - Any thrown error from the SDK is caught and logged; never
      bubbles up to the caller.

  Domain note:
    The `from` address uses `Furnish <hello@furnish.live>`. Hassan
    has to verify the furnish.live domain in Resend's dashboard
    (Domains -> Add Domain -> add SPF/DKIM/DMARC DNS records) before
    real emails will deliver. Until then, Resend will accept the
    API call but reject the actual send.
*/

import { Resend } from 'resend';

export interface SendConfirmationEmailArgs {
  to: string;
  position: number;
  referralCode: string;
}

interface ConfirmationCopy {
  subject: string;
  html: string;
  text: string;
}

const FROM_ADDRESS = 'Furnish <hello@furnish.live>';
const SITE_URL = 'https://furnish.live';

function formatPosition(position: number): string {
  return position.toLocaleString('en-US');
}

function buildCopy({
  position,
  referralCode,
}: {
  position: number;
  referralCode: string;
}): ConfirmationCopy {
  const referralLink = `${SITE_URL}/?ref=${encodeURIComponent(referralCode)}`;
  const positionDisplay = formatPosition(position);

  /* Plain-text fallback. Mirrors the HTML body line-for-line so
     clients that strip HTML (or that the user reads via screen
     reader) still get a coherent message. */
  const text = [
    `Hi,`,
    ``,
    `You're #${positionDisplay} on the waitlist for Furnish.`,
    ``,
    `We're an iOS app launching later this year. Take a photo of any`,
    `room, our AI redesigns it in any style, and every piece you see`,
    `is shoppable. Free to use, ad-free, no subscription.`,
    ``,
    `Want to move up the list? Every friend who joins through your`,
    `link bumps you up 25 spots:`,
    ``,
    referralLink,
    ``,
    `We'll keep emails minimal, a quick heads up the week before`,
    `launch, then a note when we ship. No drip sequences, no`,
    `newsletters.`,
    ``,
    `If you want to read what we're up to between now and then, the`,
    `blog is here: ${SITE_URL}/blog`,
    ``,
    `Thanks for getting on the list early.`,
    ``,
    `Hassan`,
    `Founder, Furnish`,
    `furnish.live`,
  ].join('\n');

  /* HTML body. Plain-prose formatting, single brand-color link, no
     images or tracking pixels. max-width 560 px so it doesn't
     stretch on desktop email clients. system-font stack matches
     across Gmail, Outlook, Apple Mail. */
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>You're on the Furnish list</title>
  </head>
  <body style="margin:0;padding:24px;background:#FAF6EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2B1E18;line-height:1.55;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;border:1px solid rgba(43,30,24,0.08);">
      <p style="margin:0 0 16px 0;">Hi,</p>
      <p style="margin:0 0 16px 0;">You're <strong>#${positionDisplay}</strong> on the waitlist for Furnish.</p>
      <p style="margin:0 0 16px 0;">
        We're an iOS app launching later this year. Take a photo of any room,
        our AI redesigns it in any style, and every piece you see is shoppable.
        Free to use, ad-free, no subscription.
      </p>
      <p style="margin:0 0 16px 0;">
        Want to move up the list? Every friend who joins through your link
        bumps you up 25 spots:
      </p>
      <p style="margin:0 0 24px 0;">
        <a href="${referralLink}" style="color:#8B6F47;text-decoration:underline;font-weight:600;word-break:break-all;">${referralLink}</a>
      </p>
      <p style="margin:0 0 16px 0;">
        We'll keep emails minimal, a quick heads up the week before launch,
        then a note when we ship. No drip sequences, no newsletters.
      </p>
      <p style="margin:0 0 24px 0;">
        If you want to read what we're up to between now and then, the blog
        is at <a href="${SITE_URL}/blog" style="color:#8B6F47;text-decoration:underline;">${SITE_URL}/blog</a>.
      </p>
      <p style="margin:0 0 4px 0;">Thanks for getting on the list early.</p>
      <p style="margin:0 0 4px 0;">Hassan</p>
      <p style="margin:0;color:rgba(43,30,24,0.6);font-size:14px;">Founder, Furnish &middot; furnish.live</p>
    </div>
  </body>
</html>`;

  return {
    subject: "You're on the Furnish list",
    html,
    text,
  };
}

export async function sendConfirmationEmail({
  to,
  position,
  referralCode,
}: SendConfirmationEmailArgs): Promise<{ ok: boolean; error?: string }> {
  const copy = buildCopy({ position, referralCode });
  return sendEmail({ to, subject: copy.subject, html: copy.html, text: copy.text });
}

/* ---------------------------------------------------------------- */
/* Pre-launch reminder (T-1 week)                                   */
/* ---------------------------------------------------------------- */

export interface SendPrelaunchEmailArgs {
  to: string;
  position: number;
  /** Day name to display in the body, e.g. "Tuesday". */
  launchDay: string;
  /** Pretty-formatted launch date for body display, e.g. "August 12". */
  launchDate: string;
}

interface PrelaunchCopy {
  subject: string;
  html: string;
  text: string;
}

function buildPrelaunchCopy({
  position,
  launchDay,
  launchDate,
}: {
  position: number;
  launchDay: string;
  launchDate: string;
}): PrelaunchCopy {
  const positionDisplay = formatPosition(position);

  /* Plaintext body. Hassan-voice: short, direct, no marketing-run-up.
     DRAFT copy: review before the actual T-1-week send. */
  const text = [
    `Hi,`,
    ``,
    `Quick note: Furnish goes live on the App Store one week from`,
    `today, on ${launchDay}, ${launchDate}.`,
    ``,
    `You're #${positionDisplay} on the waitlist.`,
    ``,
    `When the app drops you'll get one more email from me with the`,
    `App Store link. That's it. No marketing run-up between now and`,
    `then.`,
    ``,
    `See you on launch day.`,
    ``,
    `Hassan`,
    `Founder, Furnish`,
    `furnish.live`,
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Furnish goes live one week from today</title>
  </head>
  <body style="margin:0;padding:24px;background:#FAF6EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2B1E18;line-height:1.55;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;border:1px solid rgba(43,30,24,0.08);">
      <p style="margin:0 0 16px 0;">Hi,</p>
      <p style="margin:0 0 16px 0;">
        Quick note: <strong>Furnish</strong> goes live on the App Store one
        week from today, on <strong>${launchDay}, ${launchDate}</strong>.
      </p>
      <p style="margin:0 0 16px 0;">
        You're <strong>#${positionDisplay}</strong> on the waitlist.
      </p>
      <p style="margin:0 0 24px 0;">
        When the app drops you'll get one more email from me with the App
        Store link. That's it. No marketing run-up between now and then.
      </p>
      <p style="margin:0 0 4px 0;">See you on launch day.</p>
      <p style="margin:0 0 4px 0;">Hassan</p>
      <p style="margin:0;color:rgba(43,30,24,0.6);font-size:14px;">Founder, Furnish &middot; furnish.live</p>
    </div>
  </body>
</html>`;

  return {
    subject: 'Furnish goes live one week from today',
    html,
    text,
  };
}

export async function sendPrelaunchEmail(
  args: SendPrelaunchEmailArgs,
): Promise<{ ok: boolean; error?: string }> {
  const copy = buildPrelaunchCopy(args);
  return sendEmail({
    to: args.to,
    subject: copy.subject,
    html: copy.html,
    text: copy.text,
  });
}

/* ---------------------------------------------------------------- */
/* Launch day                                                       */
/* ---------------------------------------------------------------- */

export interface SendLaunchEmailArgs {
  to: string;
  position: number;
  /** App Store URL pulled from App Store Connect at send time. */
  appStoreUrl: string;
}

interface LaunchCopy {
  subject: string;
  html: string;
  text: string;
}

function buildLaunchCopy({
  position,
  appStoreUrl,
}: {
  position: number;
  appStoreUrl: string;
}): LaunchCopy {
  const positionDisplay = formatPosition(position);

  /* Hassan-voice draft: short, direct, single CTA, signs off the
     three-email sequence. Review before the launch-day blast. */
  const text = [
    `Hi,`,
    ``,
    `Furnish is live.`,
    ``,
    `Take a photo of any room, AI redesigns it in your style, every`,
    `piece is shoppable. Free to use, ad-free, no subscription.`,
    ``,
    `Download here:`,
    ``,
    appStoreUrl,
    ``,
    `You were #${positionDisplay} on the waitlist. Thanks for being`,
    `early.`,
    ``,
    `That's the last email from me. Have at it.`,
    ``,
    `Hassan`,
    `Founder, Furnish`,
    `furnish.live`,
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Furnish is live</title>
  </head>
  <body style="margin:0;padding:24px;background:#FAF6EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2B1E18;line-height:1.55;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;border:1px solid rgba(43,30,24,0.08);">
      <p style="margin:0 0 16px 0;">Hi,</p>
      <p style="margin:0 0 16px 0;"><strong>Furnish</strong> is live.</p>
      <p style="margin:0 0 16px 0;">
        Take a photo of any room, AI redesigns it in your style, every
        piece is shoppable. Free to use, ad-free, no subscription.
      </p>
      <p style="margin:0 0 24px 0;">
        <a href="${appStoreUrl}" style="color:#8B6F47;text-decoration:underline;font-weight:600;word-break:break-all;">${appStoreUrl}</a>
      </p>
      <p style="margin:0 0 16px 0;">
        You were <strong>#${positionDisplay}</strong> on the waitlist.
        Thanks for being early.
      </p>
      <p style="margin:0 0 24px 0;">That's the last email from me. Have at it.</p>
      <p style="margin:0 0 4px 0;">Hassan</p>
      <p style="margin:0;color:rgba(43,30,24,0.6);font-size:14px;">Founder, Furnish &middot; furnish.live</p>
    </div>
  </body>
</html>`;

  return { subject: 'Furnish is live', html, text };
}

export async function sendLaunchEmail(
  args: SendLaunchEmailArgs,
): Promise<{ ok: boolean; error?: string }> {
  const copy = buildLaunchCopy(args);
  return sendEmail({
    to: args.to,
    subject: copy.subject,
    html: copy.html,
    text: copy.text,
  });
}

/* ---------------------------------------------------------------- */
/* Shared transport: every send funnels through here                */
/* ---------------------------------------------------------------- */

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailArgs): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.log(
      `[email] (no RESEND_API_KEY) skipping send to ${to}; subject="${subject}"`,
    );
    return { ok: true };
  }

  try {
    const client = new Resend(apiKey);
    const { error } = await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error(`[email] resend send failed for ${to}:`, error);
      return { ok: false, error: 'resend_send_failed' };
    }

    return { ok: true };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[email] resend exception for ${to}:`, err);
    return { ok: false, error: 'resend_exception' };
  }
}
