'use client';

/*
  RoomShowcaseSection, three SVG isometric rooms displayed
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
      `:scope > g[id]` selector, only top-level NAMED groups
      become drop-in candidates.

  Inlining strategy: fetch the .svg as text, insert via innerHTML
  on a wrapper div, then query for top-level groups. This avoids
  touching next.config.js (no SVGR, no webpack changes). The
  fetched SVGs are static assets, not run through next/image, so
  there's no optimization layer to fight.

  Animation plumbing:
    - Per-item entry: Web Animations API (g.animate(...)), direct
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
   (items disappear). NO scale "breath" anymore, Hassan: shorten
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
   content's smaller dimension.

   Hassan tightened this from 0.02 (2%) to 0.005 (0.5%) so the
   card border hugs the room art just slightly larger than the
   animation itself. The card's aspect-ratio is set to this
   padded viewBox's aspect, so the room renders edge-to-edge
   inside the card with only a hairline gap on each side. */
const VIEWBOX_TRIM_PADDING_FRACTION = 0.005;

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
  /* Optional desktop-only (lg+) label override. When present, the
     mobile `label` is rendered for screens < lg and `labelLg` is
     rendered for lg+. Currently unused (no room in ROOMS supplies
     a labelLg), the prop + Room rendering path is kept so a future
     desktop-only caption can be reintroduced without re-plumbing. */
  labelLg?: string;
  alt: string;
}

/* Mobile labels read together left-to-right form the section's
   tagline phrase: "EVERY. SINGLE. STYLE." (Hassan-specified,
   replacing the prior LIVING ROOM / KITCHEN / BEDROOM labels).
   On desktop (lg+) only the first room renders (the SINGLE and
   STYLE rooms are CSS-hidden via lg:hidden), so on desktop the
   "Every." label sits as a small standalone caption under the
   single rendered room. Alt text for accessibility still describes
   the actual room illustration the SVG depicts. */
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
   whitespace, geometric bbox isn't enough because walls/floors
   are drawn with paths whose bbox extends past the visible art. */
async function tightenViewBoxToVisualBounds(
  svg: SVGSVGElement,
): Promise<{ width: number; height: number } | null> {
  /* Wait for layout to settle before reading geometry. When the
     SVG is inlined via innerHTML and getBBox() is called
     immediately, desktop Chrome often returns 0,0,0,0 (paint/
     layout hasn't completed), leading to a stale geometric bbox
     and over-aggressive cropping. iOS Safari schedules layout
     aggressively enough that the issue doesn't surface there;
     hence the cross-browser divergence Hassan reported.

     Race two requestAnimationFrames against a 250 ms hard timeout.
     In a normal (visible) tab the RAFs win in ~32 ms. In a hidden
     tab, Chrome PAUSES RAF callbacks indefinitely, without the
     timeout this await would hang forever, the entire trim
     function would never complete, and setSvgLoaded(true) would
     never fire. The timeout fallback lets the trim still run with
     whatever geometry is available; pixel-bbox path is unaffected
     by this either way. */
  await Promise.race<void>([
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    ),
    new Promise<void>((resolve) => window.setTimeout(resolve, 250)),
  ]);

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
    /* IMPORTANT: do NOT set img.crossOrigin = 'anonymous' here.
       A previous iteration of this code did, intending to defend
       against canvas taint, but blob URLs don't emit CORS response
       headers, and Chrome treats `crossOrigin='anonymous'` on a
       blob URL as a CORS failure that hangs the load (neither
       onload nor onerror fires reliably). On iOS Safari the load
       still succeeded, masking the bug locally, that's why the
       rooms came up correctly there but came up untrimmed on
       desktop. Same-origin blob URLs don't taint the canvas
       anyway. Race the load against a 4-second hard timeout so a
       wedged Image can never block setSvgLoaded(true). */
    imageBitmap = await Promise.race<HTMLImageElement | null>([
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = url;
      }),
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 4000)),
    ]);
    if (!imageBitmap) {
      URL.revokeObjectURL(url);
      return null;
    }
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
     0 (any non-fully-transparent pixel counts), was 1, which
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
     or near-bg fills), walls in 6.svg / 7.svg specifically have
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
     came back, a single valid bbox isn't representative enough to
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
  /* Optional desktop-only (lg+) eyebrow override. Renders alongside
     the mobile label with responsive visibility classes so the
     same Room can show different copy on the two breakpoints
     without re-rendering. */
  labelLg?: string;
  index: number;
  /* Flips true once the section enters the viewport. Until then,
     items stay hidden (opacity 0) and no animation runs. */
  shouldEnter: boolean;
  /* True when this room is the one currently performing its
     entry → lift+glow → fade-out sequence. Exactly one room has
     isActive=true at any moment after the section comes into
     view. Flips every CYCLE_DURATION_MS. */
  isActive: boolean;
  /* When true, the per-active-turn sequence runs entry + view
     and STOPS before the fade-out, so items remain visible
     indefinitely. Used by the desktop solo-EVERY layout where
     the section no longer cycles through siblings and the room
     should sit fully populated after its entry, not fade to
     opacity 0 with no follow-up cycle to bring it back. */
  skipFadeOut?: boolean;
  prefersReducedMotion: boolean;
}

function Room({
  src,
  alt,
  label,
  labelLg,
  index,
  shouldEnter,
  isActive,
  skipFadeOut,
  prefersReducedMotion,
}: RoomProps) {
  const svgContainerRef = React.useRef<HTMLDivElement>(null);
  const animatableRef = React.useRef<SVGGElement[]>([]);
  const [svgLoaded, setSvgLoaded] = React.useState(false);
  const [itemCount, setItemCount] = React.useState(0);
  /* Card aspect-ratio defaults to 1.0 (square) and switches to the
     SVG's actual trimmed content aspect once the trim completes.
     Default chosen to minimize the visible "snap" between first
     paint and trim resolution, the 3 rooms typically trim to
     aspects in the 0.9-1.1 band so a square default is closer to
     the eventual value than the previous 3/2. The card therefore
     always hugs its room art edge-to-edge, no internal letterboxing,
     which is what Hassan was after with "make sure the images are
     larger to tightly fit the border". */
  const [cardAspect, setCardAspect] = React.useState<number>(1);

  /* Fetch + inline the SVG once on mount. Set up the initial state
     of each animatable group so it sits offscreen above with 0
     opacity, ready for the entry animation to kick in. */
  React.useEffect(() => {
    let aborted = false;

    async function loadSvg() {
      try {
        const res = await fetch(src);
        if (!res.ok) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.error(`Room SVG fetch failed: ${src} (${res.status})`);
          }
          return;
        }
        const text = await res.text();
        if (aborted || !svgContainerRef.current) return;

        svgContainerRef.current.innerHTML = text;
        const svg = svgContainerRef.current.querySelector('svg');
        if (!svg) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.error(`Room SVG had no <svg> root: ${src}`);
          }
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

        /* Direct child <g id="..."> only, never reach into nested
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
               "they still too small", the room illustrations
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
        /* Trim is best-effort: if it throws or times out we fall
           back to the natural viewBox + the default 3/2 card
           aspect. Critically we ALWAYS reach setSvgLoaded(true)
           below so the entry/cycle effects can run regardless. */
        let trimmed: { width: number; height: number } | null = null;
        try {
          trimmed = await tightenViewBoxToVisualBounds(
            svg as SVGSVGElement,
          );
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[RoomShowcase] trim threw, using natural viewBox', src, err);
          }
        }
        if (trimmed && trimmed.width > 0 && trimmed.height > 0) {
          /* Use the trimmed aspect directly. The previous iteration
             clamped this to [0.85, 1.80], which forced rooms whose
             trimmed content fell outside that band to render with
             letterbox whitespace inside the card. The card's border
             surrounded the full card box, while the room art floated
             with a side or top/bottom gap, producing the "misaligned
             border" mobile defect Hassan flagged 2026-05-16: border
             reads as not hugging the art because the art literally
             doesn't reach it.

             Dropping the clamp lets each card take its room's true
             content aspect. Three rooms with slightly different
             heights on mobile is acceptable, items-center on the
             grid keeps the stacked layout balanced. On desktop only
             room 0 renders so there's no sibling-height concern at
             all. */
          const rawAspect = trimmed.width / trimmed.height;
          setCardAspect(rawAspect);
        }

        setSvgLoaded(true);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.error('Room SVG load error:', src, err);
        }
      }
    }

    loadSvg();
    return () => {
      aborted = true;
    };
  }, [src, prefersReducedMotion]);

  /* Per-active-turn sequence:
       1. ENTRY: each item drops in (Web Animations API, staggered)
       2. VIEW: still hold, items sit, glow stays bright, no
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

          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.info(
              `[RoomShowcase] entry kicked off for ${src}, items=${items.length}, stagger=${cappedStagger * 1000}ms`,
            );
          }

          /* Safety net: WAAPI's fill: 'forwards' does not always
             persist on inline-SVG <g> elements in some Chrome
             versions, items can revert to their inline initial
             state (opacity 0, translated off-screen) after the
             animation's active period ends. This was the most
             likely cause of the desktop "animation doesn't fire"
             report from Hassan 2026-05-16: items animated in then
             snapped back to invisible. Force the final inline state
             via setTimeout sized to the expected entry duration so
             the room is definitively visible regardless of WAAPI
             behavior. If WAAPI persisted correctly, this is a
             no-op overwrite of identical values. */
          const lastItemEndMs =
            Math.ceil(
              cappedStagger * Math.max(items.length - 1, 0) * 1000 +
                ENTRY_ITEM_DURATION_S * 1000,
            ) + 100;
          const safetyId = window.setTimeout(() => {
            if (cancelled) return;
            for (const g of items) {
              g.style.transform = 'translateY(0) scale(1)';
              g.style.opacity = '1';
            }
          }, lastItemEndMs);
          timeouts.push(safetyId);

          /* === VIEW: still hold, no scale/lift "breath" === */
          await waitMs(CYCLE_PHASE_ENTRY_MS + CYCLE_PHASE_VIEW_MS);
          if (cancelled) return;

          /* Desktop solo-EVERY layout: there is no follow-up cycle
             that would bring the room back, so skipping the fade-out
             leaves the room fully populated. Mobile keeps the
             original entry → view → fade-out → next room rotation. */
          if (skipFadeOut) return;

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
    skipFadeOut,
    index,
  ]);

  /* Constant idle levitation. The wrapping HTML <div>
     (svgContainerRef) gets a CSS keyframe animation that bobs it
     vertically forever.

     Why the div, not the SVG: the SVG defaults to
     transform-box: view-box, so a CSS translateY(-Npx) on it
     means -N units in SVG userspace, not screen pixels. With our
     SVGs (viewBox ~1440 wide rendered to ~520px on screen, ~2.8×
     shrink), translateY on the SVG would shrink proportionally.
     Animating the wrapping HTML div instead applies the transform
     in real screen pixels.

     Why CSS keyframes, not Web Animations API: WAAPI in some
     preview / iframe contexts reports the animation as "running"
     but never advances currentTime (the document timeline doesn't
     tick). CSS keyframes don't have that failure mode.

     Amplitude 6 px (well inside the card's overflow-hidden clip),
     5 s period, ease-in-out, repeats forever. prefers-reduced-
     motion users get no animation. */
  const levitationAnimation = prefersReducedMotion
    ? undefined
    : 'roomLevitate 5s ease-in-out infinite';

  /* For diagnostics in dev, Hassan can pop the console open and
     see how many animatable items each room found. */
  React.useEffect(() => {
    if (svgLoaded && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.info(
        `[RoomShowcase] ${src} loaded, ${itemCount} animatable items.`,
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
      {/* Card frame hugs the illustration tight, sharp corners,
          no inner padding (Hassan: "outerbox should shrink down
          tight against the image generation"). Walls + floors of
          the room art now sit flush to all four edges of the card.

          aspect-ratio is set DYNAMICALLY to the SVG's trimmed
          content aspect (default 3/2, switches once trim resolves).
          Means each card hugs its room exactly, no internal
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
        )}
        /* aspect-ratio is set ONCE per room (default 3/2 → trimmed
           value after the first paint). No transition: it's a
           one-time snap on mount, and adding `transition-[aspect-
           ratio]` was causing the new value to never visually
           apply in environments where requestAnimationFrame is
           paused (e.g., a backgrounded tab, where the transition
           sits frozen at its start frame). */
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

        {/* SVG container, fills the card box exactly. A separate
            useEffect attaches a gentle continuous levitation
            animation to the inlined SVG via the Web Animations
            API (see the "constant idle levitation" effect below).
            We use the WAAPI directly rather than wrapping this
            div in motion.div because Framer Motion's transform
            handoff was getting clobbered by the innerHTML
            replacement that mounts the inline SVG. */}
        <div
          ref={svgContainerRef}
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            zIndex: 1,
            animation: levitationAnimation,
            willChange: levitationAnimation ? 'transform' : undefined,
          }}
        />
        </div>
      </div>

      {/* Label sits OUTSIDE the card, in the eyebrow style used
          across the site for section eyebrows ("EVERY ROOM",
          "SEE THE MAGIC", etc.), uppercase, tracked-out, muted
          warm brown.

          When `labelLg` is provided, render BOTH variants and use
          responsive visibility classes so mobile shows the small
          `label` and lg+ shows the longer `labelLg`. No room
          currently supplies a labelLg (the desktop-only caption
          was removed 2026-05-16), the prop path is kept for
          future use. The eyebrow class applies text-transform:
          uppercase automatically, so source strings are sentence-
          cased for readability in the ROOMS table above. */}
      {labelLg ? (
        <>
          <p className="eyebrow mt-5 lg:hidden">{label}</p>
          <p className="eyebrow mt-5 hidden lg:block">{labelLg}</p>
        </>
      ) : (
        <p className="eyebrow mt-5">{label}</p>
      )}
    </div>
  );
}

export function RoomShowcaseSection() {
  const reduced = useReducedMotion() ?? false;
  const sectionRef = React.useRef<HTMLElement>(null);
  const [hasEnteredView, setHasEnteredView] = React.useState(false);
  const [activeIdx, setActiveIdx] = React.useState(0);
  /* Tracks whether the viewport is at the lg breakpoint or above
     (Tailwind's lg = 1024px). Drives a desktop-only layout where
     only the first room (EVERY) renders, centered, with its
     labelLg eyebrow. Mobile behavior is unchanged: all three
     rooms stack, the cycle rotates EVERY → SINGLE → STYLE, and
     the fade-out runs between turns. Initialized false so the
     first paint matches the mobile layout; the matchMedia effect
     below flips it to the correct value before the cycle starts. */
  const [isLg, setIsLg] = React.useState(false);

  /* Detect the lg breakpoint via matchMedia. Listening for
     changes keeps the state correct if a user resizes the window
     across the threshold (rare on production traffic but real in
     dev, and free to support). matchMedia is supported everywhere
     we care about. */
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsLg(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsLg(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* IntersectionObserver, flip hasEnteredView the first time the
     section comes into view, then disconnect. The cycle starts
     immediately after that flip (no separate entry phase wait -
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
     which equals the full per-room sequence (entry → view →
     fade-out). Loops forever until unmount or reduced-motion.

     Desktop short-circuit: on lg+ only the EVERY room renders
     (SINGLE and STYLE are CSS-hidden), so there are no siblings
     to rotate to. We skip the interval entirely. activeIdx
     remains 0 so the EVERY room is permanently active; combined
     with skipFadeOut={true} below, its entry sequence runs once
     when the section scrolls into view and the items stay in
     place. Re-resizing back to mobile re-enables the cycle. */
  React.useEffect(() => {
    if (reduced || !hasEnteredView) return;
    if (isLg) {
      setActiveIdx(0);
      return;
    }
    const interval = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % ROOMS.length);
    }, CYCLE_DURATION_MS);
    return () => window.clearInterval(interval);
  }, [reduced, hasEnteredView, isLg]);

  return (
    <section
      ref={sectionRef}
      aria-label="Furnish room showcase"
      aria-live="off"
      className={cn('relative bg-cream', 'py-section-y')}
    >
      {/* Section header (eyebrow + headline + supporting line)
          was removed 2026-05-16 per Hassan's "Surface 4" cleanup,
          the room SVGs stand on their own now. Section opens
          directly into the rooms grid below; the section's
          py-section-y provides the top breathing room that the
          header used to anchor.

          NOTE for follow-up: the three room SVGs are full-color
          isometric illustrations (~10–90 named groups each). A
          proper recolor to a 2–3 tone brand palette (cream / warm
          brown / accent tan) requires a programmatic pass over
          every fill in each .svg file. The cards frame the
          illustrations in a way that feels intentional even before
          the recolor; revisit when there's time to script the fill
          remap. */}
      {/* Container "wide" (1440px) instead of "default" (1200px) so
          the 3 rooms read as a generous gallery rather than a
          cramped strip. This matches the "wide" token's documented
          use case ("Gallery grids" per Document 2 §4.2), the
          three-room showcase IS a gallery. */}
      <Container width="wide">
        <div
          className={cn(
            /* Mobile: 3 stacked rooms (grid-cols-1). Desktop: only
               the EVERY room renders (SINGLE + STYLE are CSS-
               hidden via lg:hidden wrappers below), so the desktop
               grid drops to a single centered column. The
               justify-items-center on the grid keeps the lone
               desktop card centered inside the wide container.

               No top margin: the section's own py-section-y is
               enough breathing room above the first row now that
               the previous header block is gone. */
            'grid grid-cols-1 lg:grid-cols-1',
            'gap-10 lg:gap-6 xl:gap-8',
            'items-center justify-items-center',
          )}
        >
          {ROOMS.map((room, idx) => {
            const room0 = idx === 0;
            return (
              <div
                key={room.src}
                /* SINGLE (idx 1) and STYLE (idx 2) are stacked
                   below EVERY on mobile and hidden entirely on
                   lg+. EVERY (idx 0) is always rendered. */
                className={cn('w-full', !room0 && 'lg:hidden')}
              >
                <Room
                  src={room.src}
                  alt={room.alt}
                  label={room.label}
                  labelLg={room.labelLg}
                  index={idx}
                  shouldEnter={hasEnteredView}
                  isActive={hasEnteredView && idx === activeIdx}
                  /* Desktop solo-EVERY: skip fade-out so the room
                     stays visible after entry instead of going to
                     opacity 0 with no follow-up cycle to bring it
                     back. Mobile keeps the original fade-out so
                     the SINGLE → STYLE rotation reads cleanly. */
                  skipFadeOut={room0 && isLg}
                  prefersReducedMotion={reduced}
                />
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
