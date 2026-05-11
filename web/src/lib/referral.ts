/*
  Referral helpers.

  - generateReferralCode(): 8-char lookalikes-safe alphanumeric. The
    alphabet excludes 0/O, 1/l/I to keep codes legible if a user
    has to type one out. Used by the signup API route to produce a
    new code per signup; collision retries handled at the call site.
  - REFERRAL_COOKIE_NAME, REFERRAL_COOKIE_MAX_AGE_DAYS: shared
    constants so client and server agree on the storage shape.
  - REFERRAL_BUMP: how many list spots a successful referral grants
    the inviter. The DB trigger applies the actual decrement.
*/

/** Days the ?ref= attribution survives in the user's cookie /
    localStorage. */
export const REFERRAL_COOKIE_MAX_AGE_DAYS = 30;

/** Cookie + localStorage key used for client-side persistence of
    a captured referral code. */
export const REFERRAL_COOKIE_NAME = 'furnish_ref';

/** Position bump applied to the referrer when a new signup
    attributes them. */
export const REFERRAL_BUMP = 25;

const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const CODE_LEN = 8;

/**
 * Generate a random 8-character referral code from the lookalikes-
 * safe alphabet. NOT cryptographically strong by itself; collision
 * resistance comes from the database UNIQUE index plus retries at
 * the call site (the signup route retries up to 5 times if the
 * generated code is already taken).
 */
export function generateReferralCode(): string {
  let out = '';
  /* Web Crypto if available (Node 20+ globals + edge runtime); fall
     back to Math.random for ancient targets. */
  const cryptoGlobal: Crypto | undefined =
    typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
      ? crypto
      : undefined;
  if (cryptoGlobal) {
    const bytes = new Uint8Array(CODE_LEN);
    cryptoGlobal.getRandomValues(bytes);
    for (let i = 0; i < CODE_LEN; i += 1) {
      out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
    }
    return out;
  }
  for (let i = 0; i < CODE_LEN; i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}
