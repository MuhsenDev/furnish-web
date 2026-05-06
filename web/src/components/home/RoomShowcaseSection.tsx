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
import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/Container';
import { cn } from '@/lib/utils';

/* === Tunables ============================================ */

/* Per-active-turn sequence: ENTRY (items drop in) → VIEW (still
   hold so the user can absorb the finished room) → FADE-OUT
   (items disappear). NO scale "breath" anymore — Hassan: shorten
   or remove the breath that played after items fully landed. The
   only motion is now the per-item drop-in and the glow's
   brightness ramp. The room itself never moves or scales. This
   also fully resolves the right-wall / bottom-floor clipping that
   the 1.04 scale was causing on rooms 1 and 2 (the scale was
   pushing edge content past the overflow-hidden card boundary). */

const ENTRY_ITEM_DURATION_S = 0.4;
const ENTRY_ITEM_STAGGER_S = 0.04;
const ENTRY_ITEM_STAGGER_MOBILE_S = 0.025;
const ENTRY_INITIAL_Y_PX = -160;
const ENTRY_INITIAL_SCALE = 0.85;
const ENTRY_OVERSHOOT_SCALE = 1.02;
const ENTRY_ROOM_TOTAL_BUDGET_S = 0.3;

const CYCLE_DURATION_MS = 1800;
const CYCLE_PHASE_ENTRY_MS = 600;
const CYCLE_PHASE_VIEW_MS = 1000; /* still hold, no movement, no scale */
const CYCLE_PHASE_FADE_OUT_MS = 200;
/* Total: 600 + 1000 + 200 = 1800ms per room ✓ Full loop: 5.4s. */

/* Padding around the visible-content bbox after we tighten the
   viewBox at runtime. A small margin keeps the room art from
   touching the card edges. Specified as a fraction of the
   content's smaller dimension. */
const VIEWBOX_TRIM_PADDING_FRACTION = 0.02;

/* Rasterization resolution for pixel-bbox detection. Long side in
   px on the offscreen canvas. Higher = faint walls/floor edges
   produce more pixels above the alpha threshold and get caught;
   lower = faster but misses thin strokes. 2400 chosen empirically:
   high enough to register stroke-only walls in 6.svg / 7.svg even
   on desktop Chrome where the rasterizer was leaving them out at
   the previous 1500. */
const RASTER_LONG_SIDE_PX = 2400;

/* How far the geometric bbox can EXTEND the pixel bbox per side,
   as a fraction of the pixel-bbox dimension. The cap exists to
   prevent oversized static-walls paths (whose getBBox extends to
   the SVG corners even though their painted content is interior)
   from inflating the trim. Bumped 0.25 → 0.50: when desktop
   rasterization drops faint walls entirely from the pixel scan,
   25% wasn't enough room to recover them via the geometric
   fallback; 50% gives the geometric bbox enough latitude to put
   walls back in without unfettered access to the SVG corners. */
const GEO_EXTENSION_CAP = 0.50;

/* The Vercel curve. Used for the entry deceleration, the
   lift/return phases of the active ceremony, and the fade-out. */
const VERCEL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const VERCEL_EASE_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)';

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

/* Rasterize the inline SVG, scan pixel alpha to find the opaque-
   content bbox, and rewrite the SVG's viewBox to match. This is
   how we make the room art FILL its card without trailing
   whitespace — geometric bbox isn't enough because walls/floors
   are drawn with paths whose bbox extends past the visible art. */
async function tightenViewBoxToVisualBounds(
  svg: SVGSVGElement,
): Promise<{ width: number; height: number } | null> {
  /* CRITICAL: wait two animation frames before reading geometry.
     Hassan reported the rooms render correctly on iOS Safari but
     come up undersized + missing walls/floors on desktop Chrome.
     Root cause: when the SVG is inlined via innerHTML and we
     immediately call getBBox() on its child <g> elements, desktop
     Chrome often returns 0,0,0,0 (paint/layout hasn't completed).
     The geometric-bbox union below ends up incomplete (e.g.,
     missing the static-walls bbox), and the union math then caps
     the pixel-bbox extension at a stale geo bound — cropping the
     walls right out of the trimmed viewBox.

     iOS Safari schedules layout aggressively enough that the
     synchronous-after-innerHTML getBBox call usually returns real
     values. Desktop Chrome doesn't, hence the cross-browser
     divergence. Two RAFs guarantees layout has settled before we
     query geometry. */
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

  /* Capture the natural viewBox (after the inline SVG mounts the
     viewBox is already what was in the source file). */
  const vbAttr = svg.getAttribute('viewBox');
  if (!vbAttr) return null;
  const vb = vbAttr.split(/\s+/).map(Number);
  if (vb.length !== 4 || !vb.every(Number.isFinite)) return null;
  const [vbX, vbY, vbW, vbH] = vb;

  /* Rasterize at RASTER_LONG_SIDE_PX (2400) so faint walls and
     anti-aliased stroke edges produce enough pixels above the
     alpha threshold. Was 1500; bump caught additional faint paint
     on desktop where the rasterizer leaves walls thinner. */
  const longSide = Math.max(vbW, vbH);
  const scale = RASTER_LONG_SIDE_PX / longSide;
  const cw = Math.max(1, Math.round(vbW * scale));
  const ch = Math.max(1, Math.round(vbH * scale));

  /* Clone the SVG so we don't disturb the live element. Keep all
     children (defs, paths, groups). Set explicit width/height for
     image() rasterization. */
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(cw));
  clone.setAttribute('height', String(ch));
  clone.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
  /* Inline namespace to be safe across browsers. */
  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  const xml = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  let imageBitmap: HTMLImageElement | null = null;
  try {
    imageBitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      /* crossOrigin='anonymous' is safe here even though the blob
         is same-origin; it explicitly tells Chrome to treat the
         image as CORS-clean so getImageData below doesn't taint
         the canvas in any browser edge case. */
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = url;
    });
  } catch (_) {
    URL.revokeObjectURL(url);
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(url);
    return null;
  }
  ctx.drawImage(imageBitmap, 0, 0, cw, ch);
  URL.revokeObjectURL(url);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, cw, ch).data;
  } catch (_) {
    /* Tainted canvas (shouldn't happen with same-origin SVG, but
       guard anyway). */
    return null;
  }

  /* Scan alpha channel to find tightest opaque bbox. Threshold is
     0 (any non-fully-transparent pixel counts) — was 1, which
     excluded pixels at exactly alpha=1. Stroke anti-aliasing on
     thin walls leaves a fringe of alpha=1 pixels that the previous
     threshold dropped, contributing to the desktop "missing walls"
     symptom. */
  const ALPHA_THRESHOLD = 0;
  let minX = cw,
    minY = ch,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < ch; y += 1) {
    for (let x = 0; x < cw; x += 1) {
      const a = data[(y * cw + x) * 4 + 3];
      if (a > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;

  /* Convert pixel bbox back to SVG viewBox coords. */
  const pxBboxX = vbX + (minX / cw) * vbW;
  const pxBboxY = vbY + (minY / ch) * vbH;
  const pxBboxW = ((maxX - minX) / cw) * vbW;
  const pxBboxH = ((maxY - minY) / ch) * vbH;

  /* Union with the geometric bbox of named groups (excluding
     unknown-not-visable). Pixel-scan can miss faintly-painted
     structural elements (walls, floors drawn with thin strokes
     or near-bg fills) — walls in 6.svg / 7.svg specifically have
     paths whose painted content barely registers above the alpha
     threshold but whose geometry IS where the room frame sits.
     Taking the union catches both the visible paint and the
     structural geometry; padding then runs over the union. */
  let geoMinX = Infinity,
    geoMinY = Infinity,
    geoMaxX = -Infinity,
    geoMaxY = -Infinity;
  let validBboxCount = 0;
  const namedCandidates = Array.from(svg.children).filter((el) => {
    if (el.tagName === 'defs') return false;
    if (el.tagName !== 'g') return true;
    const id = (el.id || '').toLowerCase();
    return !id.startsWith('unknown-not-visable');
  });
  for (const el of namedCandidates) {
    try {
      const node = el as unknown as SVGGraphicsElement;
      if (typeof node.getBBox !== 'function') continue;
      const b = node.getBBox();
      if (b.width === 0 && b.height === 0) continue;
      validBboxCount += 1;
      if (b.x < geoMinX) geoMinX = b.x;
      if (b.y < geoMinY) geoMinY = b.y;
      if (b.x + b.width > geoMaxX) geoMaxX = b.x + b.width;
      if (b.y + b.height > geoMaxY) geoMaxY = b.y + b.height;
    } catch (_) {
      /* skip */
    }
  }

  /* Union with geometric bbox, but CAP each side's extension at
     GEO_EXTENSION_CAP (50%) of the pixel bbox dimension so we don't
     pull in massive amounts of whitespace from a static-walls path
     that happens to extend to the SVG corners. The cap lets us
     reach walls that are drawn slightly past the painted content
     while still rejecting the full geometric corner of an oversized
     SVG. Skip the union entirely if too few valid getBBox results
     came back — a single valid bbox isn't representative enough to
     trust as a recovery floor. */
  const maxExtX = pxBboxW * GEO_EXTENSION_CAP;
  const maxExtY = pxBboxH * GEO_EXTENSION_CAP;
  let finalMinX = pxBboxX;
  let finalMinY = pxBboxY;
  let finalMaxX = pxBboxX + pxBboxW;
  let finalMaxY = pxBboxY + pxBboxH;
  if (validBboxCount >= 2 && Number.isFinite(geoMinX)) {
    finalMinX = Math.max(geoMinX, pxBboxX - maxExtX);
    finalMinY = Math.max(geoMinY, pxBboxY - maxExtY);
    finalMaxX = Math.min(geoMaxX, pxBboxX + pxBboxW + maxExtX);
    finalMaxY = Math.min(geoMaxY, pxBboxY + pxBboxH + maxExtY);
  }
  const newX = finalMinX;
  const newY = finalMinY;
  const newW = finalMaxX - finalMinX;
  const newH = finalMaxY - finalMinY;

  /* Sanity bail: if the union math collapsed (shouldn't happen but
     guard so we never set a degenerate viewBox), keep the natural
     viewBox by returning early. */
  if (newW <= 0 || newH <= 0) return null;

  /* Padding for stroke/anti-alias safety. */
  const pad = Math.min(newW, newH) * VIEWBOX_TRIM_PADDING_FRACTION;
  const finalW = newW + 2 * pad;
  const finalH = newH + 2 * pad;
  svg.setAttribute(
    'viewBox',
    `${newX - pad} ${newY - pad} ${finalW} ${finalH}`,
  );
  return { width: finalW, height: finalH };
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
  /* Card aspect-ratio defaults to 3/2 (landscape isometric room
     framing) and switches to the SVG's actual trimmed content
     aspect once the trim completes. The card therefore always
     hugs its room art edge-to-edge — no internal letterboxing,
     which is what Hassan was after with "make sure the images are
     larger to tightly fit the border". */
  const [cardAspect, setCardAspect] = React.useState<number>(3 / 2);

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

        /* Hide animatable items above their final position so the
           per-active-turn entry drop animation can play. transform-
           box: fill-box makes CSS transforms behave relative to the
           group's own bounding box (not the SVG viewport), which
           is what we need for a clean translateY. */
        if (!prefersReducedMotion) {
          for (const g of animatable) {
            g.style.transformBox = 'fill-box';
            g.style.transformOrigin = 'center';
            g.style.transform = `translateY(${ENTRY_INITIAL_Y_PX}px) scale(${ENTRY_INITIAL_SCALE})`;
            g.style.opacity = '0';
            g.style.willChange = 'transform, opacity';
          }
        }

        /* Tighten the viewBox to the actual VISUAL paint area
           (where opaque pixels sit), not the geometric bbox.
           Geometric bbox (from getBBox) tends to be looser than
           the visible content because:
             - 6.svg has 64 Unknown-not-visable groups that inflate
               the geometric bounds to aspect 2.46.
             - walls/floors in each SVG are drawn with paths whose
               geometric bbox extends to the corners of the natural
               viewBox even when the visible art is smaller (Hassan:
               "they still too small" — the room illustrations
               occupied ~65% of the card area with the rest empty).

           Approach: rasterize the SVG to a hidden canvas at low
           resolution, scan pixel alpha to find the tightest
           opaque-content bbox in canvas coords, convert back to
           SVG-viewport coords, and set that as the new viewBox.
           This catches walls/floors (they have visible pixels) but
           ignores the bbox-only contributions from invisible
           Unknown groups and trailing whitespace.

           Adds a small padding fraction so stroke widths and
           anti-aliased edges don't get clipped at the card frame. */
        const trimmed = await tightenViewBoxToVisualBounds(
          svg as SVGSVGElement,
        );
        if (trimmed && trimmed.width > 0 && trimmed.height > 0) {
          /* Clamp the dynamic aspect to a sensible band so a wildly
             portrait or landscape trim result doesn't make this
             room's card visually dwarf its siblings in the row.
             Range 1.10–1.80 covers all three current rooms after a
             healthy trim (isometric room framing tends to land near
             1.4–1.55) while still letting each card adopt its own
             natural proportions. */
          const rawAspect = trimmed.width / trimmed.height;
          const clamped = Math.max(1.1, Math.min(1.8, rawAspect));
          setCardAspect(clamped);
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

  /* Per-active-turn sequence:
       1. ENTRY: each item drops in (Web Animations API, staggered)
       2. VIEW: still hold — items sit, glow stays bright, no
                movement on the room. (Replaced the previous lift+
                peak+return "breath" Hassan asked to remove.)
       3. FADE-OUT: items fade to opacity 0.

     When inactive, items remain hidden until this room's next
     turn. The room frame itself never scales or translates.
     Glow brightness alone signals which room is featured. */
  React.useEffect(() => {
    if (prefersReducedMotion) {
      const items = animatableRef.current;
      for (const g of items) {
        g.style.transform = 'none';
        g.style.opacity = '1';
      }
      return;
    }

    if (!shouldEnter || !svgLoaded) return;

    const items = animatableRef.current;

    if (isActive && items.length > 0) {
      let cancelled = false;
      const timeouts: number[] = [];
      const waitMs = (ms: number) =>
        new Promise<void>((resolve) => {
          const id = window.setTimeout(resolve, ms);
          timeouts.push(id);
        });

      const sequence = async () => {
        try {
          /* === ENTRY: items drop in === */
          for (const g of items) {
            for (const a of g.getAnimations()) a.cancel();
            g.style.transform = `translateY(${ENTRY_INITIAL_Y_PX}px) scale(${ENTRY_INITIAL_SCALE})`;
            g.style.opacity = '0';
          }

          const isMobile =
            typeof window !== 'undefined' && window.innerWidth < 1024;
          const baseStagger = isMobile
            ? ENTRY_ITEM_STAGGER_MOBILE_S
            : ENTRY_ITEM_STAGGER_S;
          const cappedStagger = Math.min(
            baseStagger,
            ENTRY_ROOM_TOTAL_BUDGET_S / Math.max(items.length, 1),
          );

          items.forEach((g, i) => {
            const itemDelayMs = i * cappedStagger * 1000;
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

          /* === VIEW: still hold, no scale/lift "breath" === */
          await waitMs(CYCLE_PHASE_ENTRY_MS + CYCLE_PHASE_VIEW_MS);
          if (cancelled) return;

          /* === FADE-OUT === */
          for (const g of items) {
            g.animate(
              [{ opacity: 1 }, { opacity: 0 }],
              {
                duration: CYCLE_PHASE_FADE_OUT_MS,
                easing: VERCEL_EASE_CSS,
                fill: 'forwards',
              },
            );
          }
        } catch {
          /* expected on interrupt */
        }
      };

      sequence();

      return () => {
        cancelled = true;
        for (const id of timeouts) window.clearTimeout(id);
      };
    }

    return undefined;
  }, [
    isActive,
    shouldEnter,
    svgLoaded,
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
        /* Generous max-w so the rooms read as gallery centerpieces
           rather than thumbnails. Bumped lg cap from 480 → 520 per
           Hassan's "make sure the images are larger" follow-up. */
        'mx-auto w-full max-w-[340px] lg:max-w-[520px]',
        'flex flex-col items-center',
      )}
    >
      {/* Card frame hugs the illustration tight — sharp corners,
          no inner padding (Hassan: "outerbox should shrink down
          tight against the image generation"). Walls + floors of
          the room art now sit flush to all four edges of the card.

          aspect-ratio is set DYNAMICALLY to the SVG's trimmed
          content aspect (default 3/2, switches once trim resolves).
          Means each card hugs its room exactly — no internal
          letterboxing, no whitespace around the art. Different
          rooms may end up with slightly different card heights
          (clamped 1.10–1.80) but the row still reads as a unified
          gallery thanks to the items-center grid alignment. */}
      <div
        className={cn(
          'relative w-full',
          'bg-[var(--color-editorial-accent-bg)]',
          'border border-[rgba(43,30,24,0.08)]',
          'shadow-1',
          'overflow-hidden',
          'transition-[aspect-ratio] duration-300 ease-premium',
        )}
        style={{ aspectRatio: cardAspect }}
      >
        <div className="absolute inset-0">
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

        {/* SVG container — fills the card box exactly. No transform
            wrapper anymore; the room frame never moves or scales,
            so we just need a static positioning context. */}
        <div
          ref={svgContainerRef}
          className="absolute inset-0"
          aria-hidden="true"
          style={{ zIndex: 1 }}
        />
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
