/*
  Motion 5, full-screen menu takeover per Document 3 Section 8.

  Default nav is minimal (wordmark + Menu text). Click "Menu" and
  the takeover slides down from above with link stagger.

  Open:
    T=0     container slides translateY -100% to 0% over 300ms
            (250ms mobile), ease 'furnishAnticipate'
    T=200   links stagger fade-in (50ms apart, 400ms each)
    T=550   complete

  Close:
    T=0     container slides translateY 0% to -100% over 400ms,
            ease 'furnishInOut'
    T=400   container display:none, body scroll unlocked

  Body scroll locks while open. Escape closes. Focus trap is the
  caller's responsibility (use a focus-trap library on the React
  component side; the motion functions only handle motion).
*/

import { getGsap } from './gsap-loader';
import { getDurationSec, isMobile } from './durations';

let scrollLockState: { paddingRight: string; overflow: string } | null = null;

/*
  Lock body scroll while menu is open. Reads the current scrollbar
  width and pins paddingRight so content does not shift when the
  scrollbar disappears.
*/
function lockBodyScroll(): void {
  if (typeof document === 'undefined' || scrollLockState) return;
  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;
  scrollLockState = {
    paddingRight: document.body.style.paddingRight,
    overflow: document.body.style.overflow,
  };
  document.body.style.paddingRight = `${scrollbarWidth}px`;
  document.body.style.overflow = 'hidden';
}

function unlockBodyScroll(): void {
  if (typeof document === 'undefined' || !scrollLockState) return;
  document.body.style.paddingRight = scrollLockState.paddingRight;
  document.body.style.overflow = scrollLockState.overflow;
  scrollLockState = null;
}

export async function openMenu(
  containerEl: HTMLElement,
  links: HTMLElement[],
  prefersReducedMotion: boolean,
): Promise<void> {
  const gsap = await getGsap();

  if (prefersReducedMotion) {
    gsap.set(containerEl, { y: '0%', display: 'block' });
    gsap.set(links, { opacity: 1, y: 0 });
    lockBodyScroll();
    return;
  }

  /* Container fade-down with anticipation. */
  const containerDur = isMobile() ? 0.25 : getDurationSec('base') * 0.75;
  const linkDur = getDurationSec('base');

  gsap.set(containerEl, { display: 'block' });

  const tl = gsap.timeline();

  tl.fromTo(
    containerEl,
    { y: '-100%' },
    {
      y: '0%',
      duration: containerDur,
      ease: 'furnishAnticipate',
    },
  );

  tl.fromTo(
    links,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: linkDur,
      ease: 'furnishOut',
      stagger: 0.05,
    },
    '-=0.1',
  );

  lockBodyScroll();
  await tl;
}

export async function closeMenu(
  containerEl: HTMLElement,
  prefersReducedMotion: boolean,
): Promise<void> {
  const gsap = await getGsap();

  if (prefersReducedMotion) {
    gsap.set(containerEl, { display: 'none' });
    unlockBodyScroll();
    return;
  }

  await gsap.to(containerEl, {
    y: '-100%',
    duration: getDurationSec('base'),
    ease: 'furnishInOut',
  });

  gsap.set(containerEl, { display: 'none' });
  unlockBodyScroll();
}
