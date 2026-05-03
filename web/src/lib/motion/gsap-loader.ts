/*
  getGsap()

  Lazy-loads GSAP plus ScrollTrigger, Flip, and CustomEase plugins
  after first paint. Per Document 2 Section 11 and Document 3
  Section 17.3, the total motion bundle is roughly 63KB gzipped
  and must NOT block initial render. Components awaiting motion
  call getGsap() inside an effect so the bundle splits at the
  dynamic-import boundary.

  Returns a singleton-promise so repeat calls share one fetch.
  Registers all five custom eases on first load (idempotent).

  Document 3 Section 17.2 specifies this loader as the SINGLE
  entry point to GSAP. Components must NEVER import gsap directly,
  always go through getGsap().
*/

import type { gsap as GsapType } from 'gsap';
import { registerFurnishEases } from './eases';

type GsapInstance = typeof GsapType;

let gsapPromise: Promise<GsapInstance> | null = null;

export function getGsap(): Promise<GsapInstance> {
  if (typeof window === 'undefined') {
    return Promise.reject(
      new Error(
        'getGsap() called on the server. Use inside a useEffect or client component.',
      ),
    );
  }

  if (gsapPromise) return gsapPromise;

  gsapPromise = (async () => {
    const [
      { default: gsap },
      { ScrollTrigger },
      { Flip },
      { CustomEase },
    ] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
      import('gsap/Flip'),
      import('gsap/CustomEase'),
    ]);

    gsap.registerPlugin(ScrollTrigger, Flip, CustomEase);
    registerFurnishEases(gsap, CustomEase);

    return gsap;
  })();

  return gsapPromise;
}

/*
  Test helper, not exported from the public index. Allows component
  tests to reset the singleton between cases.
*/
export function __resetGsapForTests(): void {
  gsapPromise = null;
}
