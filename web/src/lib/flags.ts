/*
  Feature flags per Document 4 Section 4D and Document 5 Section 0.2.

  At v1 the only flag is APP_LAUNCHED, which controls the dual-state
  CTA text and the App Store redirects. Read at module level so all
  consumers see the same value within a single build.

  Flags are read from NEXT_PUBLIC_* env vars so they work in both
  server and client components without a separate runtime fetch.
*/

export const APP_LAUNCHED: boolean =
  process.env.NEXT_PUBLIC_APP_LAUNCHED === 'true';

export const APP_STORE_URL: string =
  process.env.NEXT_PUBLIC_APP_STORE_URL ?? '/';

/*
  Convenience helper that picks between two values based on the flag.
  Components use this to avoid sprinkling APP_LAUNCHED checks
  everywhere.

    const ctaText = pickByLaunch('Join the Waitlist', 'Get the App');
*/
export function pickByLaunch<T>(preLaunch: T, postLaunch: T): T {
  return APP_LAUNCHED ? postLaunch : preLaunch;
}
