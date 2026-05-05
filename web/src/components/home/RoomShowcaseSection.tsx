'use client';

/*
  RoomShowcaseSection — three SVG isometric rooms displayed
  side-by-side on desktop / stacked on mobile, each levitating
  gently. One room at a time performs a "jump + 360° Y-axis spin"
  active turn while the other two continue idling. The active turn
  cycles 1 -> 2 -> 3 -> 1 -> ... forever.

  Replaced the previous three.js / .glb apartment scroll-fill
  experience. All three.js deps were uninstalled at the same time
  as this section landed; framer-motion was added for the room
  state-machine animation.

  Timing constants are exported at module top so Hassan can tune
  cadence / amplitude without diving into the animation logic.

  Reduced motion: rooms render static, no levitation, no jump.
  Section text + layout stays.
*/

import * as React from 'react';
import Image from 'next/image';
import { motion, useAnimation, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/Container';
import { cn } from '@/lib/utils';

/* === Tunables ============================================ */
/* Each room's "active turn" lasts this long before the next room
   takes over. 4s/room × 3 rooms = 12s full loop. */
const TURN_DURATION_MS = 4000;

/* Idle levitation: ±IDLE_AMPLITUDE_PX over IDLE_PERIOD_S. Each
   room is phase-shifted by IDLE_PHASE_SHIFT_S so the three don't
   move in unison. */
const IDLE_AMPLITUDE_PX = 8;
const IDLE_PERIOD_S = 4;
const IDLE_PHASE_SHIFT_S = 1.3;

/* Active jump+spin parameters. Hold time (1s) is the room
   levitating before the jump kicks in; the brief calls this the
   "transition window." */
const ACTIVE_HOLD_MS = 1000;
const ACTIVE_JUMP_S = 1.5;
const ACTIVE_LAND_S = 1.0;
const ACTIVE_JUMP_PX = 60;
const ACTIVE_SCALE_PEAK = 1.08;

/* The Vercel curve. Used for jump + land easing. */
const VERCEL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
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

interface RoomProps {
  src: string;
  alt: string;
  label: string;
  index: number;
  isActive: boolean;
  prefersReducedMotion: boolean;
}

function Room({
  src,
  alt,
  label,
  index,
  isActive,
  prefersReducedMotion,
}: RoomProps) {
  const controls = useAnimation();
  const activeTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    /* Reduced motion: pin to neutral and bail. */
    if (prefersReducedMotion) {
      controls.set({ y: 0, rotateY: 0, scale: 1 });
      return;
    }

    if (isActive) {
      /* When isActive flips on, the previous idle animation keeps
         running for ACTIVE_HOLD_MS (the "transition window") so the
         room doesn't freeze. After the hold, run the jump + spin
         imperatively. */
      activeTimeoutRef.current = window.setTimeout(async () => {
        /* Reset rotateY to 0 instantly so each cycle animates a
           fresh 0->360 sweep regardless of where the previous
           cycle left it. Visually invisible since 360 ≡ 0. */
        controls.set({ rotateY: 0 });
        try {
          await controls.start({
            y: -ACTIVE_JUMP_PX,
            rotateY: 360,
            scale: ACTIVE_SCALE_PEAK,
            transition: { duration: ACTIVE_JUMP_S, ease: VERCEL_EASE },
          });
          await controls.start({
            y: 0,
            scale: 1,
            transition: { duration: ACTIVE_LAND_S, ease: VERCEL_EASE },
          });
          /* After landing the room sits at y=0 for the remaining
             window (ACTIVE_HOLD_MS + ACTIVE_JUMP_S + ACTIVE_LAND_S
             = 3.5s; the 4s turn ends 0.5s later). When isActive
             flips off, the idle effect below picks up smoothly
             from y=0. */
        } catch {
          /* `controls.start` rejects when interrupted by another
             call; that's expected on quick state changes. */
        }
      }, ACTIVE_HOLD_MS);
    } else {
      /* Resume idle levitation. Phase shift via initial delay so
         the three rooms don't move in unison. */
      controls.start({
        y: [0, -IDLE_AMPLITUDE_PX, 0, IDLE_AMPLITUDE_PX, 0],
        transition: {
          duration: IDLE_PERIOD_S,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: index * IDLE_PHASE_SHIFT_S,
        },
      });
    }

    return () => {
      if (activeTimeoutRef.current !== null) {
        window.clearTimeout(activeTimeoutRef.current);
        activeTimeoutRef.current = null;
      }
    };
  }, [isActive, controls, prefersReducedMotion, index]);

  return (
    <div
      role="img"
      aria-label={`${label} design ${index + 1} of ${ROOMS.length}`}
      className={cn(
        'mx-auto w-full max-w-[300px] lg:max-w-[400px]',
        'flex flex-col items-center',
      )}
    >
      <motion.div
        animate={controls}
        initial={{ y: 0, rotateY: 0, scale: 1 }}
        /* `perspective` on the wrapper lets rotateY produce a
           visible 3D spin instead of a flat skew. */
        style={{
          perspective: 1200,
          /* Soft warm aura beneath the room. drop-shadow follows
             the SVG silhouette so it feels grounded and floating
             at the same time. */
          filter:
            'drop-shadow(0 18px 40px rgba(196, 154, 117, 0.25)) drop-shadow(0 6px 14px rgba(43, 30, 24, 0.20))',
        }}
        /* `w-full` is REQUIRED here. The parent <div> has
           `flex flex-col items-center`, so without an explicit
           width on this motion.div the cross-axis sizing falls
           back to min-content (= 0 for a wrapper around a fill-
           image), and the entire 3-room composition collapses to
           0x0. Was the bug shipped in commit 7a32915. */
        className="w-full will-change-transform"
      >
        {/* The room SVGs (1560x1040) are 3:2, NOT square. Earlier
            iteration used `aspect-square` which both squished the
            illustration AND was the second contributor to the 0x0
            collapse (in combination with the missing w-full above). */}
        <div className="relative aspect-[3/2] w-full">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            priority={false}
            unoptimized
            className="object-contain"
          />
        </div>
      </motion.div>

      <p
        className={cn(
          'mt-5 text-body-s font-semibold tracking-wider uppercase',
          'text-cream/70',
        )}
      >
        {label}
      </p>
    </div>
  );
}

export function RoomShowcaseSection() {
  const reduced = useReducedMotion() ?? false;
  const [activeIdx, setActiveIdx] = React.useState(0);

  /* Cycle activeIdx every TURN_DURATION_MS. Pause when the user
     prefers reduced motion. */
  React.useEffect(() => {
    if (reduced) return;
    const interval = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % ROOMS.length);
    }, TURN_DURATION_MS);
    return () => window.clearInterval(interval);
  }, [reduced]);

  return (
    <section
      aria-label="Furnish room showcase"
      aria-live="off"
      className={cn(
        'relative bg-deep',
        'py-section-y',
      )}
    >
      <Container width="default">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow text-cream/65">Every room</p>
          <h2
            className={cn(
              'mt-3 font-display tracking-display-tight',
              /* twMerge handles `text-cream` vs custom font-size
                 utilities cleanly now (extended config in
                 lib/utils.ts), so this composition is safe. */
              'text-cream text-display-l lg:text-display-xl',
              'leading-display-tight',
            )}
          >
            Designed for the way you actually live.
          </h2>
          <p className="mt-4 text-body-l text-cream/75">
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
              isActive={idx === activeIdx}
              prefersReducedMotion={reduced}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
