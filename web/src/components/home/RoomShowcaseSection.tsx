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

/* Items render at their natural SVG positions and STAY there —
   no jumping. Hassan: "MAKE THEM FIT AND SIT IN THEIR COORDINATED
   BOXES."

   The active-room ceremony is now stillness + glow + a barely-
   perceptible scale up (1.04 at peak). NO Y translation on the
   room — that read as "jumping" even though items themselves
   weren't transforming. Inactive rooms also DON'T idle-bob
   (amplitude 0) — total stillness across the section, just glow
   intensity changes to indicate which room is "active". */

const CYCLE_DURATION_MS = 3500;
const CYCLE_LIFT_PX = 0; /* NO Y movement — Hassan: no jumping. */
const CYCLE_LIFT_SCALE_PEAK = 1.04; /* Subtle "this one is featured" scale */
const CYCLE_PHASE_HOLD_MS = 200;
const CYCLE_PHASE_LIFT_MS = 1000;
const CYCLE_PHASE_PEAK_MS = 700;
const CYCLE_PHASE_RETURN_MS = 1600;
/* Total: 3500ms ✓ */

/* Idle: total stillness. No bob. */
const IDLE_AMPLITUDE_PX = 0;
const IDLE_PERIOD_S = 4;
const IDLE_PHASE_SHIFT_S = 1.3;

/* Padding around the visible-content bbox after we tighten the
   viewBox at runtime. A small margin keeps the room art from
   touching the card edges. Specified as a fraction of the
   content's smaller dimension. */
const VIEWBOX_TRIM_PADDING_FRACTION = 0.02;

/* The Vercel curve. Used for the lift/return phases of the
   active ceremony. */
const VERCEL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* === / Tunables ========================================== */

interface RoomConfig {
  src: string;
  label: string;
  alt: string;
}

/* Labels read together left-to-right form the section's
   tagline phrase: "EVERY. SINGLE. STYLE." (Hassan-specified,
   replacing the prior LIVING ROOM / KITCHEN / BEDROOM labels).
   Alt text for accessibility still describes the actual room
   illustration the SVG depicts. */
const ROOMS: RoomConfig[] = [
  {
    src: '/Animations/SVG/2.svg',
    label: 'Every.',
    alt: 'Isometric illustration of a designed living room',
  },
  {
    src: '/Animations/SVG/6.svg',
    label: 'Single.',
    alt: 'Isometric illustration of a designed kitchen',
  },
  {
    src: '/Animations/SVG/7.svg',
    label: 'Style.',
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
  /* Flips true once the section enters the viewport. Until then,
     items stay hidden (opacity 0) and no animation runs. */
  shouldEnter: boolean;
  /* True when this room is the one currently performing its
     entry → lift+glow → fade-out sequence. Exactly one room has
     isActive=true at any moment after the section comes into
     view. Flips every CYCLE_DURATION_MS. */
  isActive: boolean;
  prefersReducedMotion: boolean;
}

function Room({
  src,
  alt,
  label,
  index,
  shouldEnter,
  isActive,
  prefersReducedMotion,
}: RoomProps) {
  const svgContainerRef = React.useRef<HTMLDivElement>(null);
  const animatableRef = React.useRef<SVGGElement[]>([]);
  const [svgLoaded, setSvgLoaded] = React.useState(false);
  const [itemCount, setItemCount] = React.useState(0);
  const liftControls = useAnimation();

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

        /* Tighten the viewBox to the visible-content bbox.

           6.svg in particular has 64 "Unknown-not-visable-*" Sketch
           artifact groups that artificially expand its viewBox to
           4592×1866 (aspect 2.46), even though the actual visible
           kitchen art only occupies the left 1693×1866 (aspect
           0.91). With the original wide viewBox, the kitchen card
           rendered the room art tiny in the upper-left with most
           of the card empty. Trimming the viewBox to just the
           visible bbox makes the room fill the card.

           Apply to all 3 SVGs uniformly so any future asset edits
           that introduce hidden-but-named groups get the same
           treatment. SVGs that already have a tight viewBox
           (like 2.svg and 7.svg) get a no-op effective change. */
        const visibleGroups = topLevelNamedGroups.filter((g) => {
          const id = (g.id || '').toLowerCase();
          return !id.startsWith('unknown-not-visable');
        });
        if (visibleGroups.length > 0) {
          let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
          for (const g of visibleGroups) {
            try {
              const b = g.getBBox();
              if (b.width === 0 && b.height === 0) continue;
              if (b.x < minX) minX = b.x;
              if (b.y < minY) minY = b.y;
              if (b.x + b.width > maxX) maxX = b.x + b.width;
              if (b.y + b.height > maxY) maxY = b.y + b.height;
            } catch (_) {
              /* getBBox throws if element isn't in render tree yet —
                 skip silently. */
            }
          }
          if (Number.isFinite(minX) && maxX > minX && maxY > minY) {
            const w = maxX - minX;
            const h = maxY - minY;
            const pad = Math.min(w, h) * VIEWBOX_TRIM_PADDING_FRACTION;
            svg.setAttribute(
              'viewBox',
              `${minX - pad} ${minY - pad} ${w + 2 * pad} ${h + 2 * pad}`,
            );
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

  /* Per-active-turn lift + glow ceremony, plus idle levitation
     when inactive. Items inside the SVG don't move — they ride
     along with the room's translateY transform when this room is
     active, and bob with the idle levitation when inactive. The
     items themselves never animate independently (Hassan: "no
     jumping animation, MAKE THEM FIT AND SIT IN THEIR COORDINATED
     BOXES"). */
  React.useEffect(() => {
    if (prefersReducedMotion) {
      liftControls.set({ y: 0, scale: 1 });
      return;
    }

    if (!shouldEnter || !svgLoaded) {
      liftControls.set({ y: 0, scale: 1 });
      return;
    }

    if (isActive) {
      let cancelled = false;
      const timeouts: number[] = [];
      const waitMs = (ms: number) =>
        new Promise<void>((resolve) => {
          const id = window.setTimeout(resolve, ms);
          timeouts.push(id);
        });

      const ceremony = async () => {
        try {
          /* HOLD before the lift, so the cycle handoff between
             rooms reads as deliberate. */
          await waitMs(CYCLE_PHASE_HOLD_MS);
          if (cancelled) return;

          /* LIFT: room translates up + scales up. */
          await liftControls.start({
            y: -CYCLE_LIFT_PX,
            scale: CYCLE_LIFT_SCALE_PEAK,
            transition: {
              duration: CYCLE_PHASE_LIFT_MS / 1000,
              ease: VERCEL_EASE,
            },
          });
          if (cancelled) return;

          /* PEAK hold with maximum glow. */
          await waitMs(CYCLE_PHASE_PEAK_MS);
          if (cancelled) return;

          /* RETURN to baseline, smooth. */
          await liftControls.start({
            y: 0,
            scale: 1,
            transition: {
              duration: CYCLE_PHASE_RETURN_MS / 1000,
              ease: VERCEL_EASE,
            },
          });
        } catch {
          /* controls.start rejects on interrupt — expected. */
        }
      };

      ceremony();

      return () => {
        cancelled = true;
        for (const id of timeouts) window.clearTimeout(id);
      };
    }

    /* Not active: idle levitation. Phase-shift per index so the
       three rooms never bob in unison. */
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
    svgLoaded,
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
        /* Bumped from max-w-[300px] lg:max-w-[400px] to give each
           room significantly more presence on desktop. With 3
           columns and reduced grid gaps, each cell is now ~440px
           wide on a 1200px container — the rooms read as the
           centerpiece of this section instead of small thumbnails. */
        'mx-auto w-full max-w-[340px] lg:max-w-[480px]',
        'flex flex-col items-center',
      )}
    >
      {/* Card frame around the illustration. Slightly darker cream
          than the section background (--color-editorial-accent-bg
          = #F5EBDC vs --color-cream = #FAF3E7), with shadow-1 lift
          and rounded-[var(--radius)] (16px). Padding shrunk from
          p-3/p-4 to p-2/p-3 so the illustration fills more of the
          card frame (Hassan: rooms should be as big as possible
          without clutter). Glow extends past the frame's rounded
          edges naturally because overflow stays visible. */}
      <div
        className={cn(
          'relative w-full',
          'rounded-[var(--radius)]',
          'bg-[var(--color-editorial-accent-bg)]',
          'border border-[rgba(43,30,24,0.08)]',
          'shadow-1',
          'p-2 sm:p-3',
        )}
      >
        {/* aspect-[10/11] (= 0.909) matches each SVG's natural
            visible-content aspect (0.91 for all 3 after the
            viewBox trim above). The room art now fills the card
            edge-to-edge with only ~0.5pp of letterbox margin. */}
        <div className="relative w-full aspect-[10/11]">
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
  const [activeIdx, setActiveIdx] = React.useState(0);

  /* IntersectionObserver — flip hasEnteredView the first time the
     section comes into view, then disconnect. The cycle starts
     immediately after that flip (no separate entry phase wait —
     each room's items only appear during its own active turn,
     not on first scroll-in). */
  React.useEffect(() => {
    if (!sectionRef.current) return;

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

  /* Active-room cycle. activeIdx advances every CYCLE_DURATION_MS,
     which equals the full per-room sequence (entry → ceremony →
     fade-out). Loops forever until unmount or reduced-motion. */
  React.useEffect(() => {
    if (reduced || !hasEnteredView) return;
    const interval = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % ROOMS.length);
    }, CYCLE_DURATION_MS);
    return () => window.clearInterval(interval);
  }, [reduced, hasEnteredView]);

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
      {/* Container "wide" (1440px) instead of "default" (1200px) so
          the 3 rooms read as a generous gallery rather than a
          cramped strip. This matches the "wide" token's documented
          use case ("Gallery grids" per Document 2 §4.2) — the
          three-room showcase IS a gallery. The section header
          inside still centers in max-w-3xl so the headline doesn't
          spread too wide. */}
      <Container width="wide">
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
            /* Tighter gutters so the rooms can be larger without
               the section feeling cluttered (Hassan: rooms should
               be as big as possible). On mobile we keep gap-10 for
               vertical breathing between stacked cards; on lg the
               horizontal gap drops to gap-6 / xl:gap-8. */
            'gap-10 lg:gap-6 xl:gap-8',
            'items-center justify-items-center',
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
              isActive={hasEnteredView && idx === activeIdx}
              prefersReducedMotion={reduced}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
