# Furnish. Document 3 of 11: Animation System

**Purpose:** The complete technical specification for every animation, transition, and micro-interaction on furnish.live. Where Document 2 names the motion moments and locks GSAP as the library, this document specifies every choreography in full: timeline code, easing curves, durations, stagger values, scroll trigger configurations, mobile adaptations, reduced-motion fallbacks, and performance budgets. Claude Code uses this as the single source of truth for all motion work.

**Audience:** Claude Code (primary executor), front-end engineers, motion designers iterating later.

**Status:** Locked unless explicitly revised.

**Reference standards:** This site's motion targets fromanother.love-level choreography. Every animation should feel intentional, polished, and crafted, never decorative or arbitrary. If a motion designer reviewed this site, they should recognize the discipline behind every transition.

**Dependencies:** Documents 1 (brand voice for any animated text), 2 (visual tokens, motion library locked as GSAP, motion principles).

**Critical brand rule:** No em dashes anywhere on the site. Applies even to code comments, console.log messages, and Git commit messages on motion-related work.

---

## 0. Locked decisions summary

| Decision | Locked value |
|---|---|
| Motion library | GSAP (core) + ScrollTrigger + Flip + CustomEase + SplitText (optional Phase 2) |
| GSAP version | 3.12.x (latest stable) |
| GSAP licensing | Free version at v1. Business Green ($99/year) when commercial. |
| Default easing | `cubic-bezier(0.22, 1, 0.36, 1)` (custom ease named `ease-furnish-out`) |
| Reduced motion | All non-essential animations skipped. Final state shown immediately. |
| Mobile adaptation | Transforms reduced by 30-50%. Durations reduced by 20-30%. Some sequences simplified. |
| First-paint blocking | Zero. GSAP lazy-loaded after interactive. |
| Animation namespace | All motion code lives in `src/lib/motion/` |
| Performance budget per animation | 60fps on mid-tier mobile (iPhone 12 baseline) |
| Reusable hooks | `useScrollReveal`, `useStaggeredReveal`, `useHeroSequence`, `useReducedMotion`, `useCompareSlider` |

---

## 1. Animation philosophy

### 1.1 Five principles

1. **Motion serves clarity.** Every animation has a job: directing attention, signaling state change, revealing content at the right moment, communicating spatial relationships. Never animate "because we can."
2. **Easing matters more than duration.** Linear easing reads as mechanical and AI-generated. Use natural easing curves with deliberate character.
3. **Stagger creates rhythm.** Items revealed simultaneously feel like a stack. Items revealed in sequence feel like a story. Default to staggered reveals for groups.
4. **Reduced motion is non-negotiable.** Every animation has a graceful no-motion fallback. Users who set `prefers-reduced-motion` see instant final states.
5. **Mobile is restrained.** Big hero animations get scaled down on mobile. Phones should not struggle. Battery should not drain. Don't make motion that punishes users on cellular networks.

### 1.2 The "feel test" for every animation

Before shipping any motion, ask:

1. **Does it match the easing language of fromanother.love?** Sharp acceleration, gentle deceleration, slight overshoot allowed for delight moments only.
2. **Does it land on a clean state?** No mid-transition jitter on resize. No animation that leaves elements in awkward intermediate positions.
3. **Does it respect the user's tempo?** If the user is scrolling fast, the animation should not block content. Reveals fire immediately, not after a delay.
4. **Does it match Document 2's brand emotional adjectives?** Creative, Easy to Use, Exciting, Aspirational. Not Playful (no bounces), not Edgy (no glitch effects), not Corporate (no robotic timing).
5. **Does it run at 60fps on a 3-year-old phone?** Profile before shipping.

### 1.3 What this document does NOT cover

- App-internal animations (those live in the iOS app's separate motion spec)
- Loading skeletons inside specific components (covered in component-specific docs)
- Form validation animations (covered in Document 8 for static pages)
- Pre-launch motion testing schedule (covered in Document 11 §4.5)

---

## 2. Easing curves

### 2.1 The five easing curves used on the site

Every animation on furnish.live uses one of these five curves. No exceptions.

```css
/* tokens.css additions for motion */
:root {
  /* The default. Sharp acceleration, gentle deceleration. Used for 80% of animations. */
  --ease-furnish-out: cubic-bezier(0.22, 1, 0.36, 1);

  /* Symmetric. Used when an element needs to feel "decided" at both ends. */
  --ease-furnish-in-out: cubic-bezier(0.65, 0, 0.35, 1);

  /* Overshoot, slight bounce. Used SPARINGLY for delight moments only. */
  --ease-furnish-back: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Anticipatory. Pulls back slightly before moving forward. Used for "wow" reveals. */
  --ease-furnish-anticipate: cubic-bezier(0.7, -0.4, 0.4, 1.4);

  /* Quick. For micro-interactions like hover states. */
  --ease-furnish-quick: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 2.2 Easing assignment by interaction type

| Interaction | Easing | Why |
|---|---|---|
| Section reveals on scroll | `ease-furnish-out` | Content arrives confidently, settles gently |
| Hero headline lines | `ease-furnish-out` | Each line lands deliberately |
| Page transitions | `ease-furnish-in-out` | Symmetric departure and arrival |
| Modal/lightbox open | `ease-furnish-out` | Confident appearance |
| Modal/lightbox close | `ease-furnish-in-out` | Deliberate dismissal |
| Card hover lift | `ease-furnish-quick` | Responsive feel |
| Button hover | `ease-furnish-quick` | Snappy feedback |
| Compare slider drag | None (1:1 follow) | Direct manipulation |
| Compare slider auto-demo | `ease-furnish-out` | Showy reveal |
| Number counter | `ease-furnish-in-out` | Mechanical precision |
| Loading sequence | `ease-furnish-out` | Welcoming arrival |
| Menu takeover open | `ease-furnish-anticipate` | Dramatic reveal |
| Menu takeover close | `ease-furnish-in-out` | Decisive close |

### 2.3 GSAP equivalents

GSAP doesn't use cubic-bezier strings natively. Define these curves as registered GSAP eases at app load:

```typescript
// src/lib/motion/eases.ts
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

CustomEase.create("furnishOut", "0.22, 1, 0.36, 1");
CustomEase.create("furnishInOut", "0.65, 0, 0.35, 1");
CustomEase.create("furnishBack", "0.34, 1.56, 0.64, 1");
CustomEase.create("furnishAnticipate", "0.7, -0.4, 0.4, 1.4");
CustomEase.create("furnishQuick", "0.4, 0, 0.2, 1");
```

After registration, use as `ease: "furnishOut"` in GSAP timelines.

**Note:** CustomEase is a GSAP premium plugin (free for non-commercial). At launch, Furnish qualifies. Once commercial, the Business Green license covers it. If licensing becomes an issue, fall back to inline cubic-bezier strings in CSS-driven animations and use GSAP's default `power2.out` (close approximation) for GSAP timelines.

---

## 3. Duration scale

### 3.1 Locked duration tokens

All animations on the site use these standard durations. No custom values per component.

```css
:root {
  --duration-instant: 100ms;     /* Hover state changes, focus rings */
  --duration-quick: 200ms;       /* Card lifts, button feedback */
  --duration-base: 400ms;        /* Standard transitions, reveals */
  --duration-medium: 600ms;      /* Section reveals, content fades */
  --duration-long: 800ms;        /* Hero image fade, page transitions */
  --duration-extended: 1200ms;   /* Complex orchestrated sequences */
  --duration-loader: 2000ms;     /* The loading sequence (capped at 2s) */
}
```

### 3.2 Mobile duration multipliers

On mobile (`max-width: 768px`), durations multiply by 0.75. This makes the site feel snappier on touch devices where users expect quick feedback.

```typescript
// src/lib/motion/durations.ts
export const isMobile = () => window.innerWidth < 768;

export const duration = {
  instant: () => (isMobile() ? 75 : 100),
  quick: () => (isMobile() ? 150 : 200),
  base: () => (isMobile() ? 300 : 400),
  medium: () => (isMobile() ? 450 : 600),
  long: () => (isMobile() ? 600 : 800),
  extended: () => (isMobile() ? 900 : 1200),
  loader: () => (isMobile() ? 1500 : 2000),
};
```

GSAP durations are in seconds. Divide by 1000 when passing to GSAP timelines.

### 3.3 Reduced motion override

When `prefers-reduced-motion: reduce`:

```typescript
export const respectReducedMotion = (prefersReduced: boolean) => {
  if (prefersReduced) {
    return {
      instant: 0,
      quick: 0,
      base: 0,
      medium: 0,
      long: 0,
      extended: 0,
      loader: 0,
    };
  }
  return duration;
};
```

All animations skip to final state immediately. No transitions visible.

---

## 4. Motion 1: Loading sequence

The first 1.5 to 2.5 seconds of every fresh page load. This is the brand's first impression.

### 4.1 Sequence breakdown

```
T=0ms       Page request begins
T=0ms       Loader element fades in (covers entire viewport)
T=200ms     "Furnish" wordmark fades in, 0% to 100% opacity, 600ms duration
T=400ms     Horizontal accent line begins growing from center, 0% to 100% width
T=1200ms    Horizontal line completes
T=1400ms    Brief hold (200ms) at full state
T=1600ms    "Furnish" wordmark animates to navbar position (top-left)
T=1600ms    Loader bg fades to transparent over 400ms
T=2000ms    Hero content begins reveal (Motion 2 takes over)
T=2000ms    Loader element removed from DOM
```

### 4.2 Element specifications

**Loader container:**
- Position: fixed, full viewport
- Background: `var(--color-background)` solid
- Z-index: 9999 (above everything)
- Display: flex, centered both axes

**"Furnish" wordmark:**
- Font: Fraunces or display font
- Size: `--text-display-l`
- Color: `var(--color-ink)`
- Letter-spacing: -0.03em
- Initial state: opacity 0, transform scale(0.95)
- Final state in loader: opacity 1, transform scale(1.0)
- Then animates to navbar slot: x to top-left, scale to navbar size

**Horizontal accent line:**
- Width starts at 0%, grows to 100% of a max-width 320px container below the wordmark
- Height: 1px
- Color: `var(--color-accent)`
- Margin-top: 24px from wordmark
- Origin: center (grows outward both directions)

### 4.3 GSAP implementation

```typescript
// src/lib/motion/loader.ts
import { getGsap } from "./gsap-loader";

export async function playLoaderSequence(
  loaderElement: HTMLElement,
  wordmarkElement: HTMLElement,
  lineElement: HTMLElement,
  navbarSlotElement: HTMLElement,
  prefersReducedMotion: boolean
): Promise<void> {
  const gsap = await getGsap();

  if (prefersReducedMotion) {
    // Skip the loader entirely
    gsap.set(loaderElement, { display: "none" });
    return;
  }

  const tl = gsap.timeline();

  // Wordmark fade in
  tl.fromTo(
    wordmarkElement,
    { opacity: 0, scale: 0.95 },
    { opacity: 1, scale: 1.0, duration: 0.6, ease: "furnishOut" },
    0.2
  );

  // Line grows from center
  tl.fromTo(
    lineElement,
    { scaleX: 0, transformOrigin: "center" },
    { scaleX: 1, duration: 0.8, ease: "furnishOut" },
    0.4
  );

  // Hold at full state
  tl.to({}, { duration: 0.2 });

  // Wordmark moves to navbar position
  const navbarRect = navbarSlotElement.getBoundingClientRect();
  const wordmarkRect = wordmarkElement.getBoundingClientRect();
  const deltaX = navbarRect.left - wordmarkRect.left;
  const deltaY = navbarRect.top - wordmarkRect.top;
  const scale = navbarRect.height / wordmarkRect.height;

  tl.to(
    wordmarkElement,
    {
      x: deltaX,
      y: deltaY,
      scale: scale,
      duration: 0.6,
      ease: "furnishInOut",
    },
    "+=0"
  );

  // Loader bg fades out
  tl.to(
    loaderElement,
    { opacity: 0, duration: 0.4, ease: "furnishOut" },
    "-=0.4"
  );

  // Line fades out simultaneously
  tl.to(
    lineElement,
    { opacity: 0, duration: 0.3, ease: "furnishOut" },
    "<"
  );

  return tl.then();
}
```

### 4.4 First-load only behavior

The loader appears ONLY on the first page load of a session. After that, page transitions take over (see Motion 7).

Implementation:

```typescript
// src/components/Loader.tsx
"use client";
import { useEffect, useState } from "react";

export function Loader() {
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("furnish-loaded");
    if (seen) {
      setHasLoaded(true);
      return;
    }

    sessionStorage.setItem("furnish-loaded", "true");
    // Run loader sequence
    // ...
  }, []);

  if (hasLoaded) return null;
  // Render loader markup
}
```

### 4.5 Mobile adaptation

On mobile, the loader runs at 0.75x duration (1.5s total instead of 2s). The wordmark size adjusts to `--text-display-m` instead of `--text-display-l` so it fits the viewport without cropping.

### 4.6 Performance budget

- Loader element creation: under 16ms (one frame)
- GSAP timeline cost: under 2ms per frame during animation
- No layout thrashing: all animation properties are transform and opacity only
- Loader DOM removed after sequence completes: yes, to free the z-index 9999 slot

---

## 5. Motion 2: Hero reveal

Once the loader completes, the hero content reveals in a deliberate sequence.

### 5.1 Sequence breakdown

```
T=0ms       Hero image begins fade in, 0% to 100% opacity, 800ms
T=200ms     Eyebrow ("From the founder" or section marker) fades in, 400ms
T=400ms     Headline line 1 ("Take a photo.") slides up + fades in, 600ms
T=600ms     Headline line 2 ("Furnish does") slides up + fades in, 600ms
T=800ms     Headline line 3 ("the rest.") slides up + fades in, 600ms
T=1200ms    Subhead fades in, 600ms
T=1400ms    Primary CTA fades in + scales from 0.95 to 1.0, 400ms
T=1600ms    Secondary CTA (if present) fades in, 400ms
T=2000ms    Sequence complete
```

### 5.2 Element specifications

**Hero image:**
- Initial: opacity 0
- Final: opacity 1
- No transform applied (no Ken Burns, no zoom on load)
- Duration: 800ms
- Easing: furnishOut

**Eyebrow text:**
- Initial: opacity 0, y +12px
- Final: opacity 1, y 0
- Duration: 400ms
- Easing: furnishOut

**Headline lines (3 separate elements):**
- Initial: opacity 0, y +30px
- Final: opacity 1, y 0
- Duration: 600ms each
- Stagger: 200ms between lines
- Easing: furnishOut

**Subheadline:**
- Initial: opacity 0, y +20px
- Final: opacity 1, y 0
- Duration: 600ms
- Easing: furnishOut

**Primary CTA:**
- Initial: opacity 0, scale 0.95
- Final: opacity 1, scale 1.0
- Duration: 400ms
- Easing: furnishOut

### 5.3 GSAP implementation

```typescript
// src/lib/motion/hero.ts
import { getGsap } from "./gsap-loader";

export async function playHeroReveal(
  imageEl: HTMLElement,
  eyebrowEl: HTMLElement,
  headlineLines: HTMLElement[],
  subheadEl: HTMLElement,
  primaryCtaEl: HTMLElement,
  secondaryCtaEl: HTMLElement | null,
  prefersReducedMotion: boolean
): Promise<void> {
  const gsap = await getGsap();

  if (prefersReducedMotion) {
    // Show all elements immediately at final state
    gsap.set(
      [imageEl, eyebrowEl, ...headlineLines, subheadEl, primaryCtaEl, secondaryCtaEl].filter(Boolean),
      { opacity: 1, y: 0, scale: 1 }
    );
    return;
  }

  const tl = gsap.timeline();

  tl.fromTo(imageEl, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "furnishOut" }, 0);
  tl.fromTo(eyebrowEl, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: "furnishOut" }, 0.2);
  tl.fromTo(headlineLines, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: "furnishOut", stagger: 0.2 }, 0.4);
  tl.fromTo(subheadEl, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "furnishOut" }, 1.2);
  tl.fromTo(primaryCtaEl, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.4, ease: "furnishOut" }, 1.4);

  if (secondaryCtaEl) {
    tl.fromTo(secondaryCtaEl, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: "furnishOut" }, 1.6);
  }

  return tl.then();
}
```

### 5.4 Reusable hook

```typescript
// src/lib/motion/hooks.ts
"use client";
import { useEffect, useRef } from "react";
import { playHeroReveal } from "./hero";
import { useReducedMotion } from "./reduced-motion";

export function useHeroSequence() {
  const heroRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!heroRef.current) return;

    const imageEl = heroRef.current.querySelector("[data-hero-image]") as HTMLElement;
    const eyebrowEl = heroRef.current.querySelector("[data-hero-eyebrow]") as HTMLElement;
    const headlineLines = Array.from(
      heroRef.current.querySelectorAll("[data-hero-headline-line]")
    ) as HTMLElement[];
    const subheadEl = heroRef.current.querySelector("[data-hero-subhead]") as HTMLElement;
    const primaryCtaEl = heroRef.current.querySelector("[data-hero-cta-primary]") as HTMLElement;
    const secondaryCtaEl = heroRef.current.querySelector("[data-hero-cta-secondary]") as HTMLElement | null;

    playHeroReveal(imageEl, eyebrowEl, headlineLines, subheadEl, primaryCtaEl, secondaryCtaEl, prefersReduced);
  }, [prefersReduced]);

  return heroRef;
}
```

Usage:

```tsx
function HeroSection() {
  const heroRef = useHeroSequence();
  return (
    <section ref={heroRef}>
      <img data-hero-image src="..." alt="..." />
      <p data-hero-eyebrow>From the founder</p>
      <h1>
        <span data-hero-headline-line>Take a photo.</span>
        <span data-hero-headline-line>Furnish does</span>
        <span data-hero-headline-line>the rest.</span>
      </h1>
      {/* ... */}
    </section>
  );
}
```

### 5.5 Mobile adaptation

On mobile:
- Headline transform reduced: y starts at +20px instead of +30px
- Headline stagger reduced: 150ms instead of 200ms
- Total sequence duration capped at 1500ms

### 5.6 Performance budget

- Hero element setup: under 16ms
- GSAP timeline overhead: under 2ms per frame
- All transforms are GPU-accelerated (translate3d, scale, opacity only)
- No layout reads during animation: all measurements done before timeline starts

---

## 6. Motion 3: Scroll-triggered section reveals

Every major section on every page reveals as it enters the viewport. This is the most-used animation on the site.

### 6.1 The pattern

When a section's top edge crosses 75% of the viewport:

```
T=0ms       Section content visible (was opacity 0)
T=0ms       Children animate up + fade in
T=600ms     All children reach final state
```

Children are typically: section eyebrow, section headline, body copy, supporting elements (cards, images, CTAs).

### 6.2 Element specifications

**Standard reveal:**
- Initial: opacity 0, y +40px
- Final: opacity 1, y 0
- Duration: 600ms
- Easing: furnishOut
- Stagger between children: 100ms

**Hero-tier reveal (used 1-2x per page for high-impact sections):**
- Initial: opacity 0, y +60px
- Final: opacity 1, y 0
- Duration: 800ms
- Easing: furnishOut
- Stagger: 150ms

### 6.3 GSAP ScrollTrigger implementation

```typescript
// src/lib/motion/scroll-reveal.ts
import { getGsap } from "./gsap-loader";

export async function setupScrollReveal(
  containerEl: HTMLElement,
  options: {
    childSelector?: string;
    yOffset?: number;
    duration?: number;
    stagger?: number;
    ease?: string;
    triggerStart?: string;
  } = {}
): Promise<void> {
  const gsap = await getGsap();
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  gsap.registerPlugin(ScrollTrigger);

  const {
    childSelector = "[data-reveal]",
    yOffset = 40,
    duration = 0.6,
    stagger = 0.1,
    ease = "furnishOut",
    triggerStart = "top 75%",
  } = options;

  const children = containerEl.querySelectorAll(childSelector);
  if (children.length === 0) return;

  // Set initial state
  gsap.set(children, { opacity: 0, y: yOffset });

  // Create scroll-triggered timeline
  ScrollTrigger.create({
    trigger: containerEl,
    start: triggerStart,
    once: true, // Only fire once, do not reverse
    onEnter: () => {
      gsap.to(children, {
        opacity: 1,
        y: 0,
        duration,
        ease,
        stagger,
      });
    },
  });
}
```

### 6.4 Reusable hook

```typescript
// src/lib/motion/hooks.ts
import { useEffect, useRef } from "react";
import { setupScrollReveal } from "./scroll-reveal";
import { useReducedMotion } from "./reduced-motion";

export function useScrollReveal(options?: Parameters<typeof setupScrollReveal>[1]) {
  const ref = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!ref.current) return;

    if (prefersReduced) {
      // Show everything immediately
      const children = ref.current.querySelectorAll(options?.childSelector || "[data-reveal]");
      children.forEach((el) => {
        (el as HTMLElement).style.opacity = "1";
        (el as HTMLElement).style.transform = "translateY(0)";
      });
      return;
    }

    setupScrollReveal(ref.current, options);
  }, [prefersReduced, options]);

  return ref;
}
```

Usage:

```tsx
function ValuePropSection() {
  const ref = useScrollReveal();
  return (
    <section ref={ref}>
      <p data-reveal>Eyebrow</p>
      <h2 data-reveal>Headline</h2>
      <p data-reveal>Body copy</p>
      <div data-reveal>
        <Button>CTA</Button>
      </div>
    </section>
  );
}
```

### 6.5 Mobile adaptation

On mobile:
- yOffset reduced: 40px → 24px
- Duration reduced: 600ms → 450ms
- Stagger reduced: 100ms → 75ms
- triggerStart adjusted to "top 85%" so reveals fire slightly earlier (mobile users scroll faster)

### 6.6 Performance budget

- Each ScrollTrigger costs roughly 0.5ms per scroll event
- A page with 12 scroll-revealed sections = 6ms total scroll cost (acceptable)
- All animations use transform and opacity only (GPU-accelerated)
- ScrollTrigger.refresh() called on resize and route changes

### 6.7 Edge cases

**Section visible on initial load:** If a section is already in viewport when the page loads (above the fold but not the hero), do NOT animate it from offset. Show it at final state immediately. The `triggerStart: "top 75%"` handles this correctly with the `onEnter` callback only firing on actual scroll-into-view events.

**Sections shorter than viewport:** Some sections (e.g., a single quote block) are shorter than the viewport height. The trigger still works because ScrollTrigger uses the section's top edge, not its bounding box.

**Resize during animation:** ScrollTrigger.refresh() runs on window resize. Mid-animation resizes are rare; if they happen, the animation completes at the new layout.

---

## 7. Motion 4: Before/after compare slider

The "wow" moment of the home page. Used 1-3 times per page maximum.

### 7.1 Anatomy

A draggable slider over a paired before/after image:
- Two images stacked at the same dimensions
- "After" image on top, "before" beneath
- A clip-path on the "after" image controlled by the slider position
- A vertical drag handle in the middle
- Labels "BEFORE" and "AFTER" on each side

### 7.2 Interaction states

**Initial state on viewport entry:**
- Slider at 50%
- Auto-demo animation runs: slider animates 50% → 80% → 50% over 1.6 seconds
- This shows the user the interaction is interactive

**User-controlled states:**
- Drag with mouse: slider follows cursor
- Drag with touch: slider follows touch
- Click anywhere on image: slider jumps to click position with smooth tween
- Keyboard: left/right arrows move 5% per press, page up/down move 25%
- Tab focus: handle gets focus ring, keyboard listeners active

### 7.3 GSAP implementation

```typescript
// src/lib/motion/compare-slider.ts
import { getGsap } from "./gsap-loader";

export interface CompareSliderInstance {
  setPosition: (percent: number, animate?: boolean) => void;
  destroy: () => void;
}

export async function createCompareSlider(
  containerEl: HTMLElement,
  beforeImg: HTMLImageElement,
  afterImg: HTMLImageElement,
  handleEl: HTMLElement,
  options: {
    initialPosition?: number;
    autoDemo?: boolean;
    prefersReducedMotion?: boolean;
  } = {}
): Promise<CompareSliderInstance> {
  const gsap = await getGsap();
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");

  const { initialPosition = 50, autoDemo = true, prefersReducedMotion = false } = options;
  let position = initialPosition;

  const updatePosition = (percent: number, animate = false) => {
    const clamped = Math.max(0, Math.min(100, percent));
    position = clamped;

    if (animate && !prefersReducedMotion) {
      gsap.to(afterImg, {
        clipPath: `inset(0 ${100 - clamped}% 0 0)`,
        duration: 0.4,
        ease: "furnishOut",
      });
      gsap.to(handleEl, {
        left: `${clamped}%`,
        duration: 0.4,
        ease: "furnishOut",
      });
    } else {
      afterImg.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
      handleEl.style.left = `${clamped}%`;
    }
  };

  // Initialize position
  updatePosition(initialPosition, false);

  // Mouse drag handlers
  let isDragging = false;

  const onPointerDown = (e: PointerEvent) => {
    isDragging = true;
    handleEl.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isDragging) return;
    const rect = containerEl.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    updatePosition(percent, false);
  };

  const onPointerUp = (e: PointerEvent) => {
    isDragging = false;
    handleEl.releasePointerCapture(e.pointerId);
  };

  handleEl.addEventListener("pointerdown", onPointerDown);
  handleEl.addEventListener("pointermove", onPointerMove);
  handleEl.addEventListener("pointerup", onPointerUp);

  // Click anywhere on image to jump
  const onContainerClick = (e: MouseEvent) => {
    if (isDragging) return;
    const rect = containerEl.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    updatePosition(percent, true);
  };

  containerEl.addEventListener("click", onContainerClick);

  // Keyboard handlers
  const onKeyDown = (e: KeyboardEvent) => {
    if (document.activeElement !== handleEl) return;
    let delta = 0;
    if (e.key === "ArrowLeft") delta = -5;
    if (e.key === "ArrowRight") delta = +5;
    if (e.key === "PageDown") delta = -25;
    if (e.key === "PageUp") delta = +25;
    if (delta !== 0) {
      e.preventDefault();
      updatePosition(position + delta, true);
    }
  };

  handleEl.addEventListener("keydown", onKeyDown);

  // Auto-demo on viewport entry
  if (autoDemo && !prefersReducedMotion) {
    ScrollTrigger.create({
      trigger: containerEl,
      start: "top 70%",
      once: true,
      onEnter: () => {
        gsap
          .timeline()
          .to({ pos: 50 }, {
            pos: 80,
            duration: 0.8,
            ease: "furnishOut",
            onUpdate: function () {
              updatePosition(this.targets()[0].pos, false);
            },
          })
          .to({ pos: 80 }, {
            pos: 50,
            duration: 0.8,
            ease: "furnishInOut",
            onUpdate: function () {
              updatePosition(this.targets()[0].pos, false);
            },
            delay: 0.4,
          });
      },
    });
  }

  // Cleanup function
  const destroy = () => {
    handleEl.removeEventListener("pointerdown", onPointerDown);
    handleEl.removeEventListener("pointermove", onPointerMove);
    handleEl.removeEventListener("pointerup", onPointerUp);
    handleEl.removeEventListener("keydown", onKeyDown);
    containerEl.removeEventListener("click", onContainerClick);
  };

  return { setPosition: updatePosition, destroy };
}
```

### 7.4 Component usage

```tsx
"use client";
import { useEffect, useRef } from "react";
import { createCompareSlider, useReducedMotion } from "@/lib/motion";

export function CompareSlider({ beforeSrc, afterSrc, beforeAlt, afterAlt }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeRef = useRef<HTMLImageElement>(null);
  const afterRef = useRef<HTMLImageElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!containerRef.current || !beforeRef.current || !afterRef.current || !handleRef.current) return;

    const slider = createCompareSlider(
      containerRef.current,
      beforeRef.current,
      afterRef.current,
      handleRef.current,
      { prefersReducedMotion: prefersReduced }
    );

    return () => {
      slider.then((s) => s.destroy());
    };
  }, [prefersReduced]);

  return (
    <div ref={containerRef} className="relative aspect-video overflow-hidden rounded-lg">
      <img ref={beforeRef} src={beforeSrc} alt={beforeAlt} className="absolute inset-0 w-full h-full object-cover" />
      <img ref={afterRef} src={afterSrc} alt={afterAlt} className="absolute inset-0 w-full h-full object-cover" />
      <div
        ref={handleRef}
        role="slider"
        tabIndex={0}
        aria-label="Compare before and after"
        aria-valuenow={50}
        aria-valuemin={0}
        aria-valuemax={100}
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
        style={{ left: "50%", transform: "translateX(-50%)" }}
      >
        {/* Visible handle pill */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center">
          {/* Drag indicator icon */}
        </div>
      </div>
      <span className="absolute top-4 left-4 text-white text-xs uppercase tracking-wider">Before</span>
      <span className="absolute top-4 right-4 text-white text-xs uppercase tracking-wider">After</span>
    </div>
  );
}
```

### 7.5 Mobile adaptation

On touch devices, the auto-demo runs once on viewport entry but the animation duration is shortened (1200ms total instead of 1600ms). Drag interaction uses touch events natively (pointer events handle this transparently).

### 7.6 Reduced motion

When `prefers-reduced-motion: reduce`:
- No auto-demo on viewport entry
- Drag interactions still work (but no smooth tween on click-jump; instant)
- Slider remains at 50% by default

### 7.7 Performance budget

- Auto-demo timeline: under 4ms per frame
- Drag interaction: under 2ms per pointermove event
- clip-path animation is GPU-accelerated
- No re-renders triggered during drag (vanilla JS, not React state)

---

## 8. Motion 5: Full-screen menu takeover

The navigation menu opens as a full-screen overlay with dramatic timing.

### 8.1 Sequence breakdown

**Open:**
```
T=0ms       Menu container slides down from above (translateY -100% → 0%)
T=300ms     Container reaches final position
T=300ms     Menu links begin staggered fade-in (50ms apart per link)
T=550ms     All links visible
```

**Close:**
```
T=0ms       Menu container slides up (translateY 0% → -100%)
T=400ms     Container fully hidden, removed from interactive layer
```

### 8.2 Element specifications

**Menu container:**
- Position: fixed, full viewport
- Background: `var(--color-background)` solid (not transparent)
- Z-index: 9000 (below loader, above page content)
- Initial: translateY -100%
- Final (open): translateY 0%
- Duration: 300ms (open), 400ms (close)
- Easing: furnishAnticipate (open), furnishInOut (close)

**Menu links:**
- Initial: opacity 0, y +20px
- Final: opacity 1, y 0
- Duration: 400ms each
- Stagger: 50ms between links
- Easing: furnishOut

### 8.3 GSAP implementation

```typescript
// src/lib/motion/menu.ts
import { getGsap } from "./gsap-loader";

export async function openMenu(
  containerEl: HTMLElement,
  links: HTMLElement[],
  prefersReducedMotion: boolean
): Promise<void> {
  const gsap = await getGsap();

  if (prefersReducedMotion) {
    gsap.set(containerEl, { y: "0%", display: "block" });
    gsap.set(links, { opacity: 1, y: 0 });
    return;
  }

  const tl = gsap.timeline();

  gsap.set(containerEl, { display: "block" });

  tl.fromTo(
    containerEl,
    { y: "-100%" },
    { y: "0%", duration: 0.3, ease: "furnishAnticipate" }
  );

  tl.fromTo(
    links,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.4, ease: "furnishOut", stagger: 0.05 },
    "-=0.1"
  );

  return tl.then();
}

export async function closeMenu(
  containerEl: HTMLElement,
  prefersReducedMotion: boolean
): Promise<void> {
  const gsap = await getGsap();

  if (prefersReducedMotion) {
    gsap.set(containerEl, { display: "none" });
    return;
  }

  return gsap
    .to(containerEl, { y: "-100%", duration: 0.4, ease: "furnishInOut" })
    .then(() => {
      gsap.set(containerEl, { display: "none" });
    });
}
```

### 8.4 Body scroll lock

While the menu is open, body scrolling is locked:

```typescript
const lockBodyScroll = () => {
  document.body.style.overflow = "hidden";
  document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
};

const unlockBodyScroll = () => {
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
};
```

The padding-right adjustment prevents content shift when the scrollbar disappears.

### 8.5 Escape key support

When the menu is open, the Escape key closes it:

```typescript
useEffect(() => {
  if (!isMenuOpen) return;
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") closeMenu();
  };
  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, [isMenuOpen]);
```

### 8.6 Focus trap

While the menu is open, focus is trapped within the menu links. Tab key cycles through menu items only. Use a focus-trap library or implement manually with first/last element references.

### 8.7 Performance budget

- Menu open animation: under 4ms per frame
- Body scroll lock: instant, no animation
- All transforms GPU-accelerated

---

## 9. Motion 6: Hover states

Desktop-only delight on every interactive element.

### 9.1 Card hover

**Element:** Any `<Card>` component on desktop (`min-width: 1024px`)

**Specification:**
- Initial: translateY 0, shadow `--shadow-sm`
- Hover: translateY -4px, shadow `--shadow-md`
- Duration: 200ms
- Easing: furnishQuick

```css
.card {
  transition: transform var(--duration-quick) var(--ease-furnish-quick),
              box-shadow var(--duration-quick) var(--ease-furnish-quick);
}

@media (hover: hover) and (pointer: fine) {
  .card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
  }
}
```

### 9.2 Button hover

**Primary button:**
- Initial: scale 1, bg `--color-accent`
- Hover: scale 1.02, bg darker shade of accent (use color-mix)
- Active: scale 0.98
- Duration: 150ms
- Easing: furnishQuick

**Secondary button:**
- Initial: bg transparent, border `--color-ink` at 12%
- Hover: bg `--color-ink` at 6%
- Duration: 150ms

```css
.btn-primary {
  transition: transform var(--duration-quick) var(--ease-furnish-quick),
              background-color var(--duration-quick) var(--ease-furnish-quick);
}

@media (hover: hover) and (pointer: fine) {
  .btn-primary:hover {
    transform: scale(1.02);
    background-color: color-mix(in srgb, var(--color-accent) 92%, black);
  }
}

.btn-primary:active {
  transform: scale(0.98);
}
```

### 9.3 Link underline reveal

**Element:** Inline body links and footer links

**Specification:**
- Initial: underline width 0, anchored left
- Hover: underline width 100%
- Duration: 250ms
- Easing: furnishQuick

```css
.link {
  position: relative;
  text-decoration: none;
}

.link::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 100%;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--duration-quick) var(--ease-furnish-quick);
}

@media (hover: hover) and (pointer: fine) {
  .link:hover::after {
    transform: scaleX(1);
  }
}
```

### 9.4 Hover-only delight (per Document 2 §8.3)

Three specific hover delights:

**Sample gallery card:**
- On hover, a small "Style: [name]" label fades in over the image at the bottom
- Initial: opacity 0
- Hover: opacity 1
- Duration: 200ms

**Hero CTA button arrow:**
- A small arrow icon slides in from the right
- Initial: opacity 0, x -8px
- Hover: opacity 1, x 0
- Duration: 200ms

**Footer email link:**
- On hover, text changes to "click to copy"
- On click, briefly shows a checkmark and "copied"
- Implementation: state-driven, 1.5 second timeout to revert

### 9.5 Mobile/touch behavior

All hover effects use `@media (hover: hover) and (pointer: fine)` to apply only on devices with a real cursor. Touch devices skip these entirely.

### 9.6 Reduced motion

Reduced motion users get instant state changes (opacity changes still happen, transforms do not):

```css
@media (prefers-reduced-motion: reduce) {
  .card,
  .btn-primary,
  .link::after {
    transition: none;
  }
  .card:hover {
    transform: none;
  }
  .btn-primary:hover {
    transform: none;
  }
}
```

---

## 10. Motion 7: Page transitions

Phase 2 enhancement, not Phase 1.

### 10.1 Phase 1 (launch): Standard navigation

When user clicks a link, browser navigates normally. The new page's hero reveal sequence (Motion 2) provides the visual transition.

### 10.2 Phase 2 (post-launch): Custom transitions

Add a brief overlay that slides in from top during navigation:

```
T=0ms       Click triggers navigation
T=0ms       Overlay slides down from top (translateY -100% → 0%)
T=300ms     Overlay covers screen
T=300ms     New page route loads in background
T=600ms     Overlay slides up (translateY 0% → -100%)
T=900ms     Overlay removed, new page hero reveal begins
```

**Overlay specifications:**
- Background: `var(--color-accent)`
- Z-index: 9500 (below loader, above menu)
- Duration: 300ms in, 300ms hold, 300ms out

This is a Phase 2 enhancement. Document 11 (Launch Roadmap) marks this as a post-launch feature.

---

## 11. Motion 8: Compare slider lightbox

Used on /gallery for tap-to-enlarge interactions.

### 11.1 Sequence

```
T=0ms       User taps a gallery card
T=0ms       Card image animates to lightbox position using GSAP Flip
T=400ms     Image reaches full lightbox size
T=400ms     Lightbox bg fades in (opacity 0 → 1, 200ms)
T=600ms     Caption fades in
T=800ms     Sequence complete

Close:
T=0ms       User taps X or escape
T=0ms       Caption fades out
T=200ms     Image animates back to original card position
T=600ms     Lightbox bg fades out
T=600ms     Lightbox removed from DOM
```

### 11.2 GSAP Flip implementation

```typescript
import { Flip } from "gsap/Flip";

const openLightbox = (cardImage: HTMLImageElement, lightboxContainer: HTMLElement) => {
  const state = Flip.getState(cardImage);

  // Move the image element to the lightbox container in DOM
  lightboxContainer.appendChild(cardImage);

  // Animate from original position to new position
  Flip.from(state, {
    duration: 0.4,
    ease: "furnishOut",
    scale: true,
    absolute: true,
  });

  // Fade in lightbox bg
  gsap.fromTo(
    lightboxContainer,
    { opacity: 0 },
    { opacity: 1, duration: 0.2, ease: "furnishOut" }
  );
};
```

### 11.3 Performance budget

- Flip operation: under 8ms (one-time cost on open/close)
- All transforms GPU-accelerated

---

## 12. Motion 9: Number counters

Used on /home in the comparison table to show "8 seconds" etc. counting up.

### 12.1 Specification

When a number counter enters viewport:
- Counter animates from 0 to target over 1.2 seconds
- Easing: furnishInOut
- Number formatting maintained throughout (commas, decimals, currency)

### 12.2 GSAP implementation

```typescript
import { gsap } from "gsap";

export function animateNumber(
  el: HTMLElement,
  target: number,
  options: {
    duration?: number;
    format?: (n: number) => string;
    prefix?: string;
    suffix?: string;
  } = {}
) {
  const {
    duration = 1.2,
    format = (n) => Math.round(n).toString(),
    prefix = "",
    suffix = "",
  } = options;

  const obj = { value: 0 };
  gsap.to(obj, {
    value: target,
    duration,
    ease: "furnishInOut",
    onUpdate: () => {
      el.textContent = `${prefix}${format(obj.value)}${suffix}`;
    },
  });
}
```

### 12.3 Reduced motion

Skip the animation. Set the final value immediately.

---

## 13. Motion 10: Form interactions

Minimal but deliberate.

### 13.1 Input focus

```css
.input {
  border: 1px solid color-mix(in srgb, var(--color-ink) 16%, transparent);
  transition: border-color var(--duration-quick) var(--ease-furnish-quick);
}

.input:focus {
  border-color: var(--color-accent);
  outline: none;
}

.input:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 25%, transparent);
}
```

### 13.2 Submit button states

```typescript
// Submit button states: idle → loading → success/error
const STATES = {
  idle: { label: "Submit", spinner: false },
  loading: { label: "Sending...", spinner: true },
  success: { label: "Sent ✓", spinner: false },
  error: { label: "Try again", spinner: false },
};
```

State transitions are instant for label, with optional 200ms fade for the spinner icon.

### 13.3 Success confirmation

After waitlist email submitted:
- Form fades out (200ms)
- Success message fades in (200ms)
- "Thanks. We will email you when Furnish launches."

---

## 14. Reduced motion: complete reference

All animations on the site MUST respect `prefers-reduced-motion`. Here is the canonical implementation.

### 14.1 The hook

```typescript
// src/lib/motion/reduced-motion.ts
"use client";
import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}
```

### 14.2 Global CSS reset

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This is the safety net. Even if a developer forgets to check the hook, CSS-driven animations get nulled.

### 14.3 GSAP-driven animation handling

Every animation function in this document accepts a `prefersReducedMotion` parameter. When true:
- Skip the animation entirely
- Set the final state immediately using `gsap.set()`
- Return immediately from the function

### 14.4 Per-animation reduced-motion behavior

| Animation | Reduced motion behavior |
|---|---|
| Loading sequence | Skipped entirely. Loader removed immediately. |
| Hero reveal | All elements shown at final state immediately |
| Scroll reveals | All elements shown at final state immediately |
| Compare slider auto-demo | No auto-demo. Drag still works. |
| Compare slider drag | Drag still works (interaction, not animation) |
| Menu open/close | Instant show/hide |
| Card hover lift | Instant shadow change, no transform |
| Button hover scale | Instant background change, no scale |
| Link underline | Instant underline appearance |
| Number counter | Final value shown immediately |
| Form transitions | Instant state changes |

---

## 15. Mobile adaptations: complete reference

### 15.1 Detection

```typescript
const isMobile = () => window.innerWidth < 768;
const isTablet = () => window.innerWidth >= 768 && window.innerWidth < 1024;
const isDesktop = () => window.innerWidth >= 1024;
```

For motion purposes, mobile = `< 768px`.

### 15.2 Per-animation mobile adjustments

| Animation | Desktop | Mobile |
|---|---|---|
| Loading sequence duration | 2000ms | 1500ms |
| Loading wordmark size | display-l | display-m |
| Hero stagger | 200ms | 150ms |
| Hero y-offset | 30px | 20px |
| Hero total duration | 2000ms | 1500ms |
| Scroll reveal y-offset | 40px | 24px |
| Scroll reveal duration | 600ms | 450ms |
| Scroll reveal stagger | 100ms | 75ms |
| Scroll trigger start | top 75% | top 85% |
| Compare slider auto-demo | 1600ms total | 1200ms total |
| Menu open duration | 300ms | 250ms |
| Card hover | Active | Disabled (hover:hover query) |
| Page transition | Active (Phase 2) | Disabled |

### 15.3 Battery and data considerations

On mobile, GSAP still loads but only animations that run during initial pageload are eagerly evaluated. Subsequent animations (scroll reveals on later sections) are registered but only fire when triggered.

---

## 16. Performance budgets per animation

| Animation | Budget | Measurement |
|---|---|---|
| Loading sequence | 2ms per frame, 60fps held | Chrome DevTools Performance tab |
| Hero reveal | 2ms per frame | Chrome DevTools Performance tab |
| Each scroll reveal | 0.5ms per scroll event | Chrome DevTools Scrolling tab |
| Compare slider drag | 2ms per pointermove | Chrome DevTools Performance tab |
| Compare slider auto-demo | 4ms per frame | Chrome DevTools Performance tab |
| Menu open/close | 4ms per frame | Chrome DevTools Performance tab |
| Hover states (card, button) | 1ms per frame | Chrome DevTools Performance tab |
| Number counter | 1ms per frame | Chrome DevTools Performance tab |
| Page transition (Phase 2) | 4ms per frame | Chrome DevTools Performance tab |

### 16.1 Profiling protocol

Before launch, run these checks:
1. Open Chrome DevTools Performance tab
2. Throttle CPU to 4x slowdown (simulates mid-tier mobile)
3. Throttle network to Fast 3G
4. Record a full session: load → scroll → click compare slider → open menu → navigate
5. Verify no animation drops below 60fps for more than 3 frames
6. Verify total scripting time per frame stays under 16ms

If any animation fails, simplify it. Better to drop a fancy animation than ship a janky one.

---

## 17. The motion library structure

```
src/lib/motion/
├── index.ts              // Public API exports
├── gsap-loader.ts        // Lazy-loads GSAP, registers plugins
├── eases.ts              // Custom ease registrations
├── durations.ts          // Duration tokens with mobile adjustments
├── reduced-motion.ts     // useReducedMotion hook
├── hooks.ts              // useScrollReveal, useStaggeredReveal, useHeroSequence
├── loader.ts             // Motion 1: loading sequence
├── hero.ts               // Motion 2: hero reveal
├── scroll-reveal.ts      // Motion 3: scroll-triggered reveals
├── compare-slider.ts     // Motion 4: before/after slider
├── menu.ts               // Motion 5: full-screen menu
├── hover.css             // Motion 6: hover states (CSS-only)
├── page-transition.ts    // Motion 7: page transitions (Phase 2)
├── lightbox.ts           // Motion 8: gallery lightbox
├── number-counter.ts     // Motion 9: number counters
└── forms.ts              // Motion 10: form interactions
```

### 17.1 Public API

`src/lib/motion/index.ts` exports the curated public API:

```typescript
// Hooks
export { useReducedMotion } from "./reduced-motion";
export { useScrollReveal, useStaggeredReveal, useHeroSequence } from "./hooks";

// Imperative motion functions
export { createCompareSlider } from "./compare-slider";
export { animateNumber } from "./number-counter";
export { openMenu, closeMenu } from "./menu";
export { playLoaderSequence } from "./loader";
export { playHeroReveal } from "./hero";
export { setupScrollReveal } from "./scroll-reveal";

// Types
export type { CompareSliderInstance } from "./compare-slider";
```

Components import only from `@/lib/motion`, never from internal motion files. This keeps the public API clean.

The React component wrapper `<CompareSlider>` shown in §7.4 lives in `src/components/shared/CompareSlider.tsx` and consumes `createCompareSlider` from the public API. Same pattern for any other React component wrapper around motion functions.

### 17.2 GSAP loader pattern

```typescript
// src/lib/motion/gsap-loader.ts
let gsapInstance: typeof import("gsap").gsap | null = null;
let registered = false;

export async function getGsap() {
  if (gsapInstance && registered) return gsapInstance;

  const gsapModule = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  const { Flip } = await import("gsap/Flip");
  const { CustomEase } = await import("gsap/CustomEase");

  gsapModule.gsap.registerPlugin(ScrollTrigger, Flip, CustomEase);

  // Register custom eases
  CustomEase.create("furnishOut", "0.22, 1, 0.36, 1");
  CustomEase.create("furnishInOut", "0.65, 0, 0.35, 1");
  CustomEase.create("furnishBack", "0.34, 1.56, 0.64, 1");
  CustomEase.create("furnishAnticipate", "0.7, -0.4, 0.4, 1.4");
  CustomEase.create("furnishQuick", "0.4, 0, 0.2, 1");

  gsapInstance = gsapModule.gsap;
  registered = true;
  return gsapInstance;
}
```

GSAP loads once per session, after first paint, and is cached for subsequent uses.

### 17.3 Bundle size

GSAP core: ~30KB gzipped
ScrollTrigger: ~20KB gzipped
Flip: ~10KB gzipped
CustomEase: ~3KB gzipped
**Total motion bundle:** ~63KB gzipped

This loads after first paint via dynamic import, so it does not block LCP.

---

## 18. Animation testing checklist

For each animation, before declaring complete:

- [ ] Runs at 60fps on Chrome desktop
- [ ] Runs at 60fps on Chrome mobile (or 4x CPU throttled)
- [ ] Runs at 60fps on Safari iOS
- [ ] Reduced motion fallback works (test by enabling "Reduce Motion" in OS settings)
- [ ] Keyboard accessibility (where applicable: drag-slider has arrow keys, menu has Escape, etc.)
- [ ] No layout thrashing (Performance tab shows zero forced reflows)
- [ ] Animation completes cleanly even if interrupted (e.g., user navigates away mid-animation)
- [ ] Resize during animation doesn't break layout
- [ ] Mobile uses adapted durations and offsets
- [ ] No console errors or warnings
- [ ] Lighthouse Performance score 90+ on the page containing the animation

---

## 19. Cross-document references

This document specifies the technical implementation. Other documents specify the where:

- **Document 2 §5:** Names the motion moments at a high level. Locks GSAP.
- **Document 5 (Home Page):** References Motion 2 (hero reveal), Motion 4 (compare slider), Motion 3 (scroll reveals), Motion 9 (number counters)
- **Document 6 (Gallery):** References Motion 3 (scroll reveals), Motion 8 (lightbox)
- **Document 7 (Blog):** References Motion 3 only (scroll reveals on post content)
- **Document 8 (Static Pages):** References Motion 3 (scroll reveals), Motion 6 (hover states), Motion 10 (form interactions)
- **Document 9 (Tech Stack):** Specifies GSAP installation and bundle configuration
- **Document 11 (Launch Roadmap):** Schedules motion work in Phase 1 (Days 1-3) and Phase 2 (post-launch enhancements)

---

## Appendix A: Quick reference card for Claude Code

When implementing any animation, refer to this card first:

**Need a scroll-triggered reveal?** Use `useScrollReveal()` hook.
**Need a staggered group reveal?** Use `useStaggeredReveal()` hook.
**Need the hero sequence?** Use `useHeroSequence()` hook.
**Need to know reduced motion state?** Use `useReducedMotion()` hook.
**Need a custom GSAP timeline?** Call `getGsap()` async, build timeline, check reduced motion before playing.

**Default values to use unless overridden:**
- Duration: 600ms
- Easing: furnishOut
- Stagger: 100ms
- yOffset: 40px
- triggerStart: top 75%

**Default behavior to apply unless overridden:**
- Animations fire once (`once: true` on ScrollTrigger)
- All animations check reduced motion
- All animations have mobile-adjusted durations
- All transforms use opacity and transform only (GPU-accelerated)

---

## Appendix B: GSAP cheat sheet for this project

```typescript
// Load
const gsap = await getGsap();

// Standard tween
gsap.to(element, { x: 100, duration: 0.6, ease: "furnishOut" });

// FromTo (specify both states)
gsap.fromTo(element, { opacity: 0 }, { opacity: 1, duration: 0.4 });

// Set (instant, no animation)
gsap.set(element, { opacity: 1, y: 0 });

// Timeline (sequence)
const tl = gsap.timeline();
tl.to(a, { x: 100, duration: 0.4 })
  .to(b, { y: 50, duration: 0.4 }, "-=0.2"); // overlap by 200ms

// Stagger
gsap.to(elements, { opacity: 1, stagger: 0.1, duration: 0.6 });

// ScrollTrigger
ScrollTrigger.create({
  trigger: element,
  start: "top 75%",
  once: true,
  onEnter: () => {/* ... */},
});

// Flip (layout transition)
const state = Flip.getState(element);
// move element in DOM
Flip.from(state, { duration: 0.4, ease: "furnishOut" });
```

---

## Appendix C: Anti-patterns to reject

These motion patterns are forbidden on furnish.live:

1. **Continuous loops** (e.g., always-spinning icons) except for genuine loading indicators.
2. **Parallax scrolling** of any kind. (Cliché, dated, hurts performance.)
3. **Cursor-follow effects** (e.g., gradients that follow the mouse). Reject.
4. **Particle systems** (floating particles, sparkles, confetti). Reject.
5. **Marquee scrollers** for testimonials or logos. We do not have testimonials.
6. **3D card tilts** on hover (popular on dribbble, looks AI-generated). Reject.
7. **Glitch effects** for any reason.
8. **Typewriter animations** for text reveals.
9. **Animations triggered by mouse movement** rather than scroll or interaction.
10. **Auto-playing video** anywhere on the site.

If any future request asks for one of these patterns, flag it and propose an alternative from this document.

---

**End of Document 3 of 11.**

Next document: **Site Architecture**. The sitemap, page hierarchy, navigation structure, URL strategy, and which pages get built v1 vs. v2.
