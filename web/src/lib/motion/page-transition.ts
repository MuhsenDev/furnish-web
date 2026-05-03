/*
  Motion 7, page transitions per Document 3 Section 10.

  PHASE 2 ENHANCEMENT. Document 3 Section 10.1 explicitly defers
  this to post-launch. Phase 1 (launch) uses standard browser
  navigation; the destination page's hero reveal (Motion 2)
  serves as the visual transition.

  This file is a STUB so the public API in index.ts can re-export
  the function name without breaking. Calling it at v1 returns a
  no-op promise; the real implementation arrives in Phase 2 per
  Document 11 (Launch Roadmap).

  When Phase 2 ships, the implementation:
    T=0     overlay slides translateY -100% to 0% over 300ms
    T=300   overlay covers screen, new page route loads
    T=600   overlay slides translateY 0% to -100% over 300ms
    T=900   overlay removed; destination hero reveal begins

  Overlay bg is var(--color-accent), z-index 9500 (below loader,
  above menu).
*/

export interface PageTransitionOptions {
  prefersReducedMotion?: boolean;
}

export async function playPageTransition(
  _options: PageTransitionOptions = {},
): Promise<void> {
  /* Phase 2 stub. Returns immediately so callers don't block. */
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[motion/page-transition] Phase 2 stub. Implementation pending Document 11 launch roadmap.',
    );
  }
}
