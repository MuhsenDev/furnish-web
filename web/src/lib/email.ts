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
    `We'll email you exactly once more, when the app goes live. No`,
    `drip sequences, no newsletters. Promise.`,
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
        We'll email you exactly once more, when the app goes live. No drip
        sequences, no newsletters. Promise.
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
  const apiKey = process.env.RESEND_API_KEY;
  const copy = buildCopy({ position, referralCode });

  if (!apiKey) {
    /* Dev / pre-launch fallback: never error on missing key.
       Logs enough so a developer can verify content shape. */
    // eslint-disable-next-line no-console
    console.log(
      `[email] (no RESEND_API_KEY) skipping send to ${to}; subject="${copy.subject}"`,
    );
    return { ok: true };
  }

  try {
    const client = new Resend(apiKey);
    const { error } = await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: copy.subject,
      html: copy.html,
      text: copy.text,
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
