/*
  getGsap()

  Lazy-loads GSAP plus the ScrollTrigger and Flip plugins after
  first paint. Per Document 2 Section 11, GSAP weight is roughly
  70kb gzipped and must NOT block initial render. Components
  awaiting motion call getGsap() inside an effect so the bundle
  splits at the dynamic-import boundary.

  Returns a singleton-promise so repeat calls share one fetch.

  Document 3 builds the actual animation timelines on top of this
  loader. Phase 1F ships the loader stub only.
*/

import type { gsap as GsapType } from 'gsap';

type GsapInstance = typeof GsapType;

let gsapPromise: Promise<GsapInstance> | null = null;

export function getGsap(): Promise<GsapInstance> {
  if (typeof window === 'undefined') {
    return Promise.reject(
      new Error('getGsap() called on the server. Use inside a useEffect or client component.'),
    );
  }

  if (gsapPromise) return gsapPromise;

  gsapPromise = (async () => {
    const [{ default: gsap }, { ScrollTrigger }, { Flip }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
      import('gsap/Flip'),
    ]);

    gsap.registerPlugin(ScrollTrigger, Flip);

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
