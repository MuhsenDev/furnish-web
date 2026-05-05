'use client';

/*
  RoomShowcaseSection — three SVG isometric rooms displayed
  side-by-side on desktop / stacked on mobile.

  Substantial rework from the previous jump+spin version (commit
  7a32915). Hassan relabeled the SVG assets so individual furniture
  pieces are now named <g> groups inside each SVG, which lets us:

    1) Inline-load each SVG (so JS can reach its child <g> nodes).
    2) Drop in each non-static piece from above on first scroll-in
       (per-item velocity-pop entry, staggered).
    3) Replace the 360° spin with a confident lift + bronze glow
       ceremony that cycles 1 -> 2 -> 3 -> 1 -> ... forever.

  Asset convention (per the artist's labeling):
    - <g id="static-...">       => architecture / fixed scenery,
                                   never animates.
    - <g id="apart_of_bed[-N]"> => bed structural pieces in 7.svg
                                   that the artist forgot to prefix
                                   with `static-`. Treated as static.
    - <g id="anything-else">    => animatable item, drops in on
                                   entry, stays put afterward.
    - Unnamed <g> tags (clip-path wrappers, isolation containers,
      rendering plumbing) are skipped automatically by the
      `:scope > g[id]` selector — only top-level NAMED groups
      become drop-in candidates.

  Inlining strategy: fetch the .svg as text, insert via innerHTML
  on a wrapper div, then query for top-level groups. This avoids
  touching next.config.js (no SVGR, no webpack changes). The
  fetched SVGs are static assets, not run through next/image, so
  there's no optimization layer to fight.

  Animation plumbing:
    - Per-item entry: Web Animations API (g.animate(...)) — direct
      DOM, no React rerenders per item.
    - Per-room idle levitation + lift+glow: Framer Motion on the
      wrapping motion.div (room-level transforms compose with the
      SVG's internal per-item transforms cleanly).
    - Cycle state machine: useState/useEffect, setInterval after
      the entry phase completes.

  Reduced motion: items render at final position immediately, no
  idle levitation, no lift+glow ceremony, glow held at default
  0.3 opacity.
*/

import * as React from 'react';
import { motion, useAnimation, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/Container';
import { cn } from '@/lib/utils';

/* === Tunables ============================================ */

/* Per-item drop entry. */
const ENTRY_ITEM_DURATION_S = 0.8;
const ENTRY_ITEM_STAGGER_S = 0.08;
const ENTRY_ITEM_STAGGER_MOBILE_S = 0.06; /* Faster on mobile per spec */
const ENTRY_ROOM_OFFSET_S = 0.5; /* Time between Room 1 entry start and Room 2 entry start. */
const ENTRY_INITIAL_Y_PX = -200;
const ENTRY_INITIAL_SCALE = 0.8;
const ENTRY_OVERSHOOT_SCALE = 1.04;

/* Hard cap on per-room entry duration, in case a room has dozens
   of items (e.g. 6.svg has 95 named groups, many of which are
   "Unknown-not-visable-N" Sketch artifacts that still iterate).
   Without this cap, total entry phase could stretch to 8+ seconds.
   Effective per-item stagger is min(spec, cap / itemCount). */
const ENTRY_ROOM_TOTAL_BUDGET_S = 1.6;

/* Lift + glow ceremony (per room when active). */
const CYCLE_DURATION_MS = 3500;
const CYCLE_LIFT_PX = 80;
const CYCLE_LIFT_SCALE_PEAK = 1.05;
const CYCLE_PHASE_HOLD_MS = 200;
const CYCLE_PHASE_LIFT_MS = 1000;
const CYCLE_PHASE_PEAK_MS = 700;
const CYCLE_PHASE_RETURN_MS = 1600;

/* Idle levitation. */
const IDLE_AMPLITUDE_PX = 8;
const IDLE_PERIOD_S = 4;
const IDLE_PHASE_SHIFT_S = 1.3;

/* The Vercel curve. Used for both entry deceleration and the
   lift/return phases of the active ceremony. */
const VERCEL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const VERCEL_EASE_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)';

/* === / Tunables ========================================== */

interface RoomConfig {
  src: string;
  label: string;
  alt: string;
}

const ROOMS: RoomConfig[] = [
  {
    src: '/Animations/SVG/2.svg',
    label: 'Living Room',
    alt: 'Isometric illustration of a designed living room',
  },
  {
    src: '/Animations/SVG/6.svg',
    label: 'Kitchen',
    alt: 'Isometric illustration of a designed kitchen',
  },
  {
    src: '/Animations/SVG/7.svg',
    label: 'Bedroom',
    alt: 'Isometric illustration of a designed bedroom',
  },
];

/* Returns true if the group should NOT animate (architecture,
   scenery, posed humans, structural bed pieces). */
function isStatic(groupId: string): boolean {
  if (!groupId) return true;
  const lowered = groupId.toLowerCase();
  return (
    lowered.startsWith('static-') ||
    lowered.startsWith('apart_of_bed') ||
    lowered.startsWith('apart-of-bed')
  );
}

interface RoomProps {
  src: string;
  alt: string;
  label: string;
  index: number;
  /* Flips true once the section enters the viewport. Each room's
     entry animation starts at `index * ENTRY_ROOM_OFFSET_S` after
     this becomes true. */
  shouldEnter: boolean;
  /* Flips true after the entry phase has settled. Once true, the
     parent will alternately set isActive on each room every
     CYCLE_DURATION_MS. */
  cycleStarted: boolean;
  isActive: boolean;
  prefersReducedMotion: boolean;
}

function Room({
  src,
  alt,
  label,
  index,
  shouldEnter,
  cycleStarted,
  isActive,
  prefersReducedMotion,
}: RoomProps) {
  const svgContainerRef = React.useRef<HTMLDivElement>(null);
  const animatableRef = React.useRef<SVGGElement[]>([]);
  const [svgLoaded, setSvgLoaded] = React.useState(false);
  const [itemCount, setItemCount] = React.useState(0);
  const liftControls = useAnimation();
  const ceremonyTaskRef = React.useRef<number | null>(null);

  /* Fetch + inline the SVG once on mount. Set up the initial state
     of each animatable group so it sits offscreen above with 0
     opacity, ready for the entry animation to kick in. */
  React.useEffect(() => {
    let aborted = false;

    async function loadSvg() {
      try {
        const res = await fetch(src);
        if (!res.ok) {
          // eslint-disable-next-line no-console
          console.error(`Room SVG fetch failed: ${src} (${res.status})`);
          return;
        }
        const text = await res.text();
        if (aborted || !svgContainerRef.current) return;

        svgContainerRef.current.innerHTML = text;
        const svg = svgContainerRef.current.querySelector('svg');
        if (!svg) {
          // eslint-disable-next-line no-console
          console.error(`Room SVG had no <svg> root: ${src}`);
          return;
        }

        /* Strip width/height attributes from the SVG and let it
           fill the parent's aspect-ratio box via CSS. */
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.setAttribute(
          'preserveAspectRatio',
          'xMidYMid meet',
        );
        const svgEl = svg as SVGSVGElement;
        svgEl.style.display = 'block';
        svgEl.style.width = '100%';
        svgEl.style.height = '100%';

        /* Direct child <g id="..."> only — never reach into nested
           groups (those are clip-path / isolation plumbing). */
        const topLevelNamedGroups = Array.from(
          svg.querySelectorAll(':scope > g[id]'),
        ) as SVGGElement[];
        const animatable = topLevelNamedGroups.filter(
          (g) => !isStatic(g.id),
        );
        animatableRef.current = animatable;
        setItemCount(animatable.length);

        if (!prefersReducedMotion) {
          /* Hide each animatable item above its final position so
             the entry animation can drop it in. transform-box:
             fill-box makes CSS transforms behave relative to the
             group's own bounding box (not the SVG viewport),
             which is what we need for a clean translateY. */
          for (const g of animatable) {
            g.style.transformBox = 'fill-box';
            g.style.transformOrigin = 'center';
            g.style.transform = `translateY(${ENTRY_INITIAL_Y_PX}px) scale(${ENTRY_INITIAL_SCALE})`;
            g.style.opacity = '0';
            g.style.willChange = 'transform, opacity';
          }
        }

        setSvgLoaded(true);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Room SVG load error:', src, err);
      }
    }

    loadSvg();
    return () => {
      aborted = true;
    };
  }, [src, prefersReducedMotion]);

  /* Trigger the per-item drop-in entry once shouldEnter flips true. */
  React.useEffect(() => {
    if (!svgLoaded || !shouldEnter || prefersReducedMotion) return;

    const items = animatableRef.current;
    if (items.length === 0) return;

    /* Per-item stagger, clamped so a many-item room doesn't take
       eight seconds to enter. */
    const isMobile =
      typeof window !== 'undefined' && window.innerWidth < 1024;
    const baseStagger = isMobile
      ? ENTRY_ITEM_STAGGER_MOBILE_S
      : ENTRY_ITEM_STAGGER_S;
    const cappedStagger = Math.min(
      baseStagger,
      ENTRY_ROOM_TOTAL_BUDGET_S / Math.max(items.length, 1),
    );

    /* Per-room offset so Room 2 starts after Room 1 begins, etc. */
    const roomDelayMs = index * ENTRY_ROOM_OFFSET_S * 1000;

    items.forEach((g, i) => {
      const itemDelayMs = roomDelayMs + i * cappedStagger * 1000;
      g.animate(
        [
          {
            transform: `translateY(${ENTRY_INITIAL_Y_PX}px) scale(${ENTRY_INITIAL_SCALE})`,
            opacity: 0,
          },
          {
            transform: `translateY(0) scale(${ENTRY_OVERSHOOT_SCALE})`,
            opacity: 1,
            offset: 0.85,
          },
          {
            transform: 'translateY(0) scale(1)',
            opacity: 1,
          },
        ],
        {
          duration: ENTRY_ITEM_DURATION_S * 1000,
          easing: VERCEL_EASE_CSS,
          delay: itemDelayMs,
          fill: 'forwards',
        },
      );
    });
  }, [svgLoaded, shouldEnter, prefersReducedMotion, index]);

  /* Idle levitation + lift+glow ceremony state machine. */
  React.useEffect(() => {
    if (prefersReducedMotion) {
      liftControls.set({ y: 0, scale: 1 });
      return;
    }

    /* Don't levitate before the entry phase has even begun — the
       items are still tucked up at -200px and we don't want their
       collective drop-in to also be sliding the whole room. */
    if (!shouldEnter) {
      liftControls.set({ y: 0, scale: 1 });
      return;
    }

    if (isActive) {
      /* Lift + glow ceremony. Run imperatively so we can hold at
         peak and run the return as a separate phase. */
      let cancelled = false;
      const ceremony = async () => {
        try {
          await new Promise<void>((resolve) => {
            const id = window.setTimeout(resolve, CYCLE_PHASE_HOLD_MS);
            ceremonyTaskRef.current = id;
          });
          if (cancelled) return;
          await liftControls.start({
            y: -CYCLE_LIFT_PX,
            scale: CYCLE_LIFT_SCALE_PEAK,
            transition: {
              duration: CYCLE_PHASE_LIFT_MS / 1000,
              ease: VERCEL_EASE,
            },
          });
          if (cancelled) return;
          await new Promise<void>((resolve) => {
            const id = window.setTimeout(resolve, CYCLE_PHASE_PEAK_MS);
            ceremonyTaskRef.current = id;
          });
          if (cancelled) return;
          await liftControls.start({
            y: 0,
            scale: 1,
            transition: {
              duration: CYCLE_PHASE_RETURN_MS / 1000,
              ease: VERCEL_EASE,
            },
          });
        } catch {
          /* `controls.start` rejects on interrupt — expected. */
        }
      };
      ceremony();
      return () => {
        cancelled = true;
        if (ceremonyTaskRef.current !== null) {
          window.clearTimeout(ceremonyTaskRef.current);
          ceremonyTaskRef.current = null;
        }
      };
    }

    /* Not active: idle levitation. Phase-shift each room so the
       three never bob in unison. */
    liftControls.start({
      y: [0, -IDLE_AMPLITUDE_PX, 0, IDLE_AMPLITUDE_PX, 0],
      scale: 1,
      transition: {
        duration: IDLE_PERIOD_S,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: index * IDLE_PHASE_SHIFT_S,
      },
    });

    return undefined;
  }, [
    isActive,
    shouldEnter,
    cycleStarted,
    liftControls,
    prefersReducedMotion,
    index,
  ]);

  /* For diagnostics in dev — Hassan can pop the console open and
     see how many animatable items each room found. */
  React.useEffect(() => {
    if (svgLoaded && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.info(
        `[RoomShowcase] ${src} loaded — ${itemCount} animatable items.`,
      );
    }
  }, [svgLoaded, itemCount, src]);

  /* Glow opacity drives by isActive. Animated via a separate
     motion.div so the lift transform on the room doesn't compose
     into the glow (we want the glow to stay anchored to the
     room's baseline, growing in intensity, not riding up with the
     lift). */
  const glowOpacity = prefersReducedMotion
    ? 0.3
    : isActive
      ? 0.85
      : 0.3;

  return (
    <div
      role="img"
      aria-label={`${label} design ${index + 1} of ${ROOMS.length}: ${alt}`}
      className={cn(
        'mx-auto w-full max-w-[300px] lg:max-w-[400px]',
        'flex flex-col items-center',
      )}
    >
      {/* Card frame around the illustration. Slightly darker cream
          than the section background (--color-editorial-accent-bg
          = #F5EBDC vs --color-cream = #FAF3E7), with the same
          shadow-1 ambient lift and rounded-[var(--radius)] (16px)
          used by the standard image Card variant elsewhere on the
          site. The padding inset (p-3 sm:p-4) matches Card's image
          variant so the SVG sits inside the frame with breathing
          room. The lift+glow ceremony composes inside this frame —
          glow extends past the frame's rounded edges naturally
          because we don't set overflow-hidden, so an active room
          briefly halos out into the surrounding cream. */}
      <div
        className={cn(
          'relative w-full',
          'rounded-[var(--radius)]',
          'bg-[var(--color-editorial-accent-bg)]',
          'border border-[rgba(43,30,24,0.08)]',
          'shadow-1',
          'p-3 sm:p-4',
        )}
      >
        <div className="relative w-full aspect-[3/2]">
        {/* Bronze warm glow beneath the room. Sits at z=0 so the
            room's SVG stacks on top of it. Width 110% / height 70%
            with bottom alignment makes the glow puddle out from
            below the room. */}
        <motion.div
          className={cn(
            'absolute pointer-events-none',
            'left-[-5%] right-[-5%] bottom-0',
            'h-[70%]',
          )}
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(212, 175, 130, 0.55) 0%, rgba(139, 111, 71, 0.35) 30%, rgba(62, 39, 35, 0) 70%)',
            filter: 'blur(40px)',
            zIndex: 0,
          }}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: glowOpacity }}
          transition={{
            duration: isActive ? 1.0 : 1.2,
            ease: VERCEL_EASE,
          }}
          aria-hidden="true"
        />

        {/* Lift + idle motion wrapper. Sits ABSOLUTE inset-0 inside
            the aspect-ratio container so it fills the box without
            its child SVG's intrinsic dimensions pushing the
            container's height. (Earlier the wrapper was `relative
            w-full h-full` and the SVG's own viewBox aspect
            (e.g. 0.91 for 2.svg, 2.46 for 6.svg) was overriding the
            container's aspect-[3/2], stretching every room to a
            different shape.)

            Per-item entry transforms compose with this wrapper's
            transform cleanly because they're on different DOM
            levels — this div translateY shifts the whole SVG box,
            <g> elements inside the SVG have their own transforms
            relative to their fill-box. */}
        <motion.div
          animate={liftControls}
          initial={{ y: 0, scale: 1 }}
          className="absolute inset-0 will-change-transform"
          style={{ zIndex: 1 }}
        >
          <div
            ref={svgContainerRef}
            className="absolute inset-0"
            aria-hidden="true"
          />
        </motion.div>
        </div>
      </div>

      {/* Label sits OUTSIDE the card, in the eyebrow style used
          across the site for section eyebrows ("EVERY ROOM",
          "SEE THE MAGIC", etc.) — uppercase, tracked-out, muted
          warm brown. */}
      <p className="eyebrow mt-5">{label}</p>
    </div>
  );
}

export function RoomShowcaseSection() {
  const reduced = useReducedMotion() ?? false;
  const sectionRef = React.useRef<HTMLElement>(null);
  const [hasEnteredView, setHasEnteredView] = React.useState(false);
  const [cycleStarted, setCycleStarted] = React.useState(false);
  const [activeIdx, setActiveIdx] = React.useState(0);

  /* IntersectionObserver — flip hasEnteredView the first time the
     section comes into view, then disconnect. Pre-mount delays in
     React (esp. in dev with Strict Mode double-invocation) make
     the timing of `useEffect`-based entry feel inconsistent;
     gating by viewport intersection guarantees the entry plays
     when the user actually sees the section. */
  React.useEffect(() => {
    if (!sectionRef.current) return;

    /* Reduced motion + SSR fallback: just flip immediately so the
       static layout shows from page load. */
    if (
      reduced ||
      typeof window === 'undefined' ||
      !('IntersectionObserver' in window)
    ) {
      setHasEnteredView(true);
      return;
    }

    const target = sectionRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setHasEnteredView(true);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [reduced]);

  /* After all 3 rooms have completed their entry, start the
     cycle. Wait the entry phase out: ENTRY_ROOM_OFFSET * (N-1)
     for the room-stagger, plus one full per-item entry duration,
     plus a short breath. */
  React.useEffect(() => {
    if (reduced || !hasEnteredView) return;
    const entryPhaseMs =
      ENTRY_ROOM_OFFSET_S * (ROOMS.length - 1) * 1000 +
      ENTRY_ITEM_DURATION_S * 1000 +
      ENTRY_ROOM_TOTAL_BUDGET_S * 1000 +
      400; /* breath */
    const startTimer = window.setTimeout(() => {
      setCycleStarted(true);
    }, entryPhaseMs);
    return () => window.clearTimeout(startTimer);
  }, [reduced, hasEnteredView]);

  /* Active-room cycle. Each room takes its turn for CYCLE_DURATION_MS,
     then the next one takes over. Loops forever until unmount or
     reduced-motion preference change. */
  React.useEffect(() => {
    if (reduced || !cycleStarted) return;
    const interval = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % ROOMS.length);
    }, CYCLE_DURATION_MS);
    return () => window.clearInterval(interval);
  }, [reduced, cycleStarted]);

  return (
    <section
      ref={sectionRef}
      aria-label="Furnish room showcase"
      aria-live="off"
      className={cn('relative bg-cream', 'py-section-y')}
    >
      {/* Visual treatment refactored to match the rest of the home
          page (hero, compare slider, gallery preview): cream
          background, espresso headline, muted-brown eyebrow, full-
          opacity body copy. The earlier dark espresso bg with cream
          text broke continuity with the surrounding sections.

          NOTE for follow-up: the three room SVGs are full-color
          isometric illustrations (~10–90 named groups each). A
          proper recolor to a 2–3 tone brand palette (cream / warm
          brown / accent tan) requires a programmatic pass over
          every fill in each .svg file — out of scope for this
          visual refactor. The cards now frame the illustrations in
          a way that feels intentional even before the recolor;
          revisit when there's time to script the fill remap. */}
      <Container width="default">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Every room</p>
          <h2
            className={cn(
              'mt-3 font-display tracking-display-tight',
              'text-deep text-display-l lg:text-display-xl',
              'leading-display',
            )}
          >
            Designed for the way you actually live.
          </h2>
          <p className="mt-4 text-body-l text-ink opacity-90">
            Take a photo. Pick a style. The AI handles the rest.
          </p>
        </div>

        <div
          className={cn(
            'mt-12 sm:mt-16 lg:mt-20',
            'grid grid-cols-1 lg:grid-cols-3',
            'gap-14 lg:gap-10 xl:gap-12',
            'items-center',
          )}
        >
          {ROOMS.map((room, idx) => (
            <Room
              key={room.src}
              src={room.src}
              alt={room.alt}
              label={room.label}
              index={idx}
              shouldEnter={hasEnteredView}
              cycleStarted={cycleStarted}
              isActive={cycleStarted && idx === activeIdx}
              prefersReducedMotion={reduced}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
