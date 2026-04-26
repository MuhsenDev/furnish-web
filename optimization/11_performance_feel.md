# 11 — Performance and Feel

**Dimension scope:** Speed perception, haptic + audio feedback, and "magic moment" choreography for the reveal.

**Reforge frameworks invoked:**
- *Retention + Engagement → Activation → Defining Your Aha Moment* (the reveal IS the aha moment; design the qualitative moment first, the metric second; "time is of the essence" curve)
- *Product Management Foundations → Feature Design → Constrained Divergence* (desirability vs viability vs feasibility — most micro-interaction proposals here live in the "differentiation" half of desirability, NOT core functionality)
- *Mastering Product Management → Decision Architecture → Decision Budget & Circles* (most performance/feel decisions are HIGH-impact, REVERSIBLE — invest, then iterate post-decision; do not boil the ocean upfront)

**Caveat owned upfront:** Reforge is a growth/PM curriculum, not a UX micro-interaction curriculum. Sections A and C lean partially on original recommendations marked `[Original]`. The WHY is Reforge-grounded; the HOW (motion timing, easing, choreography) is judgment.

**Critical context for this dimension:** The current "fake-fast" experience (mocked AI, instant return) **will not survive backend cutover**. Real Flux Schnell takes 3–15 sec; Flux Kontext Pro takes 15–45 sec. Per CLAUDE.md, real AI is item #1 on DEFERRED.md. The analyzing-screen choreography MUST be designed NOW so the moment real generation lands the experience does not collapse into a blank spinner with a 30-second freeze.

---

## Section A — Speed perception strategies

Speed perception ≠ speed. The user judges *perceived* responsiveness against the rhythm of micro-feedback. Per Reforge's Aha-Moment framework, every minute since signup that the user has not reached the moment, retention probability collapses (the "tick-tock" curve — *Retention + Engagement, Defining Your Aha Moment*, p.14). The corollary at micro-scale: every second of unfilled latency between tap and perceived progress, drop-off probability climbs. Skeletons, optimistic UI, and motion-as-progress all buy you slack against that curve.

### A.1 Skeleton screens

**Current state:** None. The app uses spinners (`.loader` on analyzing screen, `index.html:628`) and bare `innerHTML = ''` reflows on items list, saved rooms list, wishlist list, and price tags. On a slow phone or laggy localStorage parse, the user briefly sees an empty container before contents pop in. That is perceived as broken, not slow.

**Proposal:** Add skeleton placeholders for four surfaces:
1. **Items list on results screen** (`renderItemsList` near `app.js:~4490`) — when reshuffling layout or switching rooms, render 4–6 grey card skeletons for one frame, then swap to real content.
2. **Saved rooms / Home grid** — on first home open while localStorage parses photos, render skeleton cards.
3. **Wishlist list** — on tab switch, skeleton during the inevitable repaint.
4. **Price tags on results** — skeleton dots on the room image while `renderPriceTags` runs and computes positions.

**Effort:** Tier S (small). One CSS class `.skeleton` with a shimmer keyframe + a render guard. Estimated 1–2 hours.

**Reforge cite:** Per *Feature Design → Constrained Divergence*, this is a **differentiation constraint** (not core functionality) — solving the user's problem in a uniquely smooth way. Low-bar to clear since competing AI room apps almost universally ship raw spinners.

---

### A.2 Optimistic UI

**Current state:** Mostly already optimistic by accident — wishlist add, theme flip, profile switch are all in-memory and instant. The app commits to localStorage *after* the visual update, which is correct.

**Proposals (gaps):**
1. **Wishlist heart fill** — already instant in-memory, but flag this is at risk when Supabase sync goes live (DEFERRED #1). Rule: visual confirms in <16ms; server reconciles silently. If reconciliation fails, show a quiet toast `"Saved offline — we'll sync when you're back"` (no error theatre).
2. **Bookmark room** — same pattern: optimistic add to `bookmarkedRooms`, retry sync in background.
3. **Lighting chip change** (`app.js:4116-4209` overlay swap) — already instant. Keep.
4. **Furniture rearrange / drag end** — when user releases a price tag at a new position, the position should commit to `room.layout` *before* any save round-trip. Verify in code; if it currently awaits save, fix.
5. **What you CANNOT optimistic-render:** the AI redesign itself. The output is not predictable. Don't attempt fake-rendered intermediate states from the user's photo — uncanny-valley risk is high. Mask with motion + story instead (see A.4).

**Effort:** Tier XS (most already done). Add the offline-toast fallback when Supabase ships.

**Reforge cite:** Per *Decision Architecture* (p.20), this is a high-impact, reversible decision — invest enough to ship a sane offline-first pattern; iterate post-cutover.

---

### A.3 Progressive disclosure on the reveal

**Current state:** The results screen renders everything at once: the room image, before/after slider, price tags, items list, lighting chips, totals card, palette. Then 600ms later the first-aha hint pulses (`app.js:4157`). At 6s, the first-redesign tutorial overlay drops in (`queueFirstRedesignTutorial`). Premium upsell can also fire post-3rd-gen. That's a lot to land on the user simultaneously.

**Proposal — staged reveal:**
- **Frame 0** (0ms): Room image fades in.
- **Frame 1** (200ms): Subtle scale-from-center pop (1.02 → 1.00), `cubic-bezier(0.34, 1.56, 0.64, 1)`.
- **Frame 2** (400–600ms): "Designed with Furnish" overlay text fades in, holds 800ms, fades out.
- **Frame 3** (1200ms): Price tags ripple in, 80ms stagger, scale 0.7 → 1.0.
- **Frame 4** (2000ms): Totals card slides up from bottom.
- **Frame 5** (2500ms): Items list section fades in below the fold (no jarring jump).
- **Frame 6** (3500ms): First-aha coachmark fires (delay current `setTimeout(showFirstAhaHint, 600)` → bump to ~3500 to land *after* the choreography settles).
- **Frame 7** (10000ms): Coachmark dismisses if untapped (already implemented).

**Why staged:** The current "everything at 600ms" pattern is a missed peak. Per Reforge's *Aha Moment* framework (*Retention + Engagement*, p.5–7), the qualitative description is "feels like you've gained a special ability you haven't had before." Splatter-rendering the whole results screen flattens that into "a lot of UI appeared." Staged disclosure forces the eye through a story: *room → label → tags → price → items*. Each layer earns the next click.

**Effort:** Tier M (medium). Sequence the existing render calls behind a single `revealResultsChoreography(room)` function. Most pieces already exist; the work is timing.

**Reforge cite:** *Defining Your Aha Moment*, p.5: "feels like you've gained a special ability." Choreography enforces that *feeling*; chaos defeats it.

---

### A.4 Motion to mask latency (THE big one — analyzing screen)

**Current state (verified at `index.html:625-638`):**
```html
<div class="loader"></div>
<h2>Designing your room…</h2>
<ul class="loader-steps" id="loaderSteps">
  <li data-step="measuring">Measuring your space</li>
  <li data-step="matching">Matching your style profile</li>
  <li data-step="curating">Curating pieces from our partners</li>
  <li data-step="arranging">Arranging the layout</li>
</ul>
```

The 4 step labels exist in markup but I cannot find any code in `app.js` that activates them sequentially (no `loaderSteps li.active` toggling logic was visible in the slices read). Right now they are a static list under a generic spinner. **Wasted real estate.**

**Proposal — story-driven analyzing screen (CRITICAL FOR REAL AI CUTOVER):**

When real Flux Schnell ships (3–15 sec) or Flux Kontext Pro (15–45 sec), users will sit on this screen for an eternity by app standards. The fake-fast mock hides the problem; cutover will surface it brutally.

Make each `<li>` activate sequentially with a check-mark animation, weighted to the actual model latency:

| Step | Schnell (~10s budget) | Kontext Pro (~30s budget) |
|---|---|---|
| Measuring your space | 0–1.5s | 0–4s |
| Matching your style profile | 1.5–3s | 4–10s |
| Curating pieces from our partners | 3–6s | 10–20s |
| Arranging the layout | 6–9s | 20–28s |
| (final beat — pre-render hold) | 9–10s | 28–30s |

**Implementation rules:**
- Each step gets an active state (text crispens, mini check-mark slides in on completion).
- The final step hangs slightly longer than its budget if needed — never finish all 4 steps before the API actually returns. Empty success states feel broken.
- If the API exceeds budget (slow network), pause on step 4 with a subtle pulsating ellipsis. **Never** show an explicit "this is taking longer than usual" message — that erodes the magic.
- One continuous loop is *worse* than a story. Per Reforge *Defining Your Aha Moment* (p.14), time-bound metrics matter; the user is implicitly time-budgeting too.

**Effort:** Tier M (medium). New JS function `runAnalyzingStoryline(durationMs, onComplete)`. Required regardless of when AI ships — design and implement now so cutover is a one-line swap.

**Reforge cite:** *Aha Moment* (p.14): "Every minute since signup that you haven't gotten them to the aha moment your probability of retaining them decreases." At micro-scale, every unfilled second of latency = drop-off risk. Storytelling motion defers the perception that "nothing is happening."

---

### A.5 Predictive prefetch

**Current state:** None observed. Each step waits for user action before doing any background work.

**Proposal:**
1. When user taps "Redesign" → start prefetching the items DB candidates *in parallel* with the AI call. By the time the image returns, the price-tag candidate items are already in memory.
2. When user opens a room results screen → prefetch the affiliate URL metadata (image, title) for top-3 items so the item sheet opens instantly.
3. When user enters the quiz → prefetch quiz finale assets (the SVG glyph strings are already inline; verify no on-demand loading).

**Effort:** Tier S. Wrap existing functions with `requestIdleCallback`-gated prefetches.

**Reforge cite:** *Decision Architecture* (p.20): make the high-impact decision (redesign) feel reversible by removing perceived cost — prefetch reduces "if I tap this, will it work?" hesitation.

---

### A.6 Cache strategy (PWA service worker)

**Current state:** App is "PWA-able" per CLAUDE.md (`manifest.json` exists). No service worker confirmed in repo.

**Proposal:** Defer a real service worker until Capacitor decision (DEFERRED #4). Document that deferral here so it doesn't get re-evaluated mid-quarter. **However**: cache the last-rendered redesign image in localStorage (or IndexedDB if size becomes an issue) so when the user returns home and reopens the most recent room, it loads instantly instead of re-rendering from `room.photo` base64.

**Effort:** Tier S for last-redesign cache. Tier L for full SW (deferred).

**Reforge cite:** *Decision Architecture* (p.18): pricing/infrastructure decisions are "irreversible and high-impact" — deciding to ship a SW now would lock you into PWA-first vs. native-first. Wait.

---

## Section B — Haptic + audio feedback map

**Reality check (must be said):** Web `navigator.vibrate()` is supported on Android Chrome/Firefox but **silently ignored on iOS Safari**. There is no cross-browser way to deliver haptic feedback consistently in a PWA. iOS doesn't expose haptics until Capacitor wraps the app (DEFERRED #4). Until then, every haptic recommendation below is "designed but not shipped" — code with feature detection, leave the shape ready, fire only on supported platforms.

**Audio reality check:** Most users have phones on silent. Audio cues that fire uninvited will annoy. **Audio must be opt-in via Settings, off by default.** Per Reforge *Constrained Divergence* (p.13), differentiation via delight is only worth pursuing in highly competitive environments — the AI-room-design space *is* competitive, but blasting a noise at someone is not delight, it is intrusion.

### Moment-by-moment table

| Moment | Web (current/today) | Capacitor native (post-#4) | Audio (proposed, opt-in) |
|---|---|---|---|
| Quiz answer tap | none | light tap (10ms) | none |
| Quiz step transition | none | none (visual only) | none |
| Quiz finale: rain peak (2.8s) | none | medium impact | optional whoosh, 600ms |
| Quiz finale: theme flicker | none | tiny ticks per flicker (3x) | optional sparkle, layered |
| Quiz finale: congrats reveal | none | success haptic (notification.success) | optional soft chime |
| Photo capture | none | light tap on shutter | none (camera shutter is OS-handled) |
| Photo upload complete | none | light tap | none |
| Analyzing → step transition | none | tiny tick on each step complete | none |
| **Reveal screen open** | none | success haptic | optional reveal swoosh |
| Reveal: price tags ripple-in | none | none (would conflict w/ stagger) | none |
| Slider drag | none | NONE — continuous drag = no haptic | none |
| Slider snap to 0/50/100 | none | tiny tick at the snap | none |
| Lighting chip switch | none | light tap | none |
| Wishlist save (heart fill) | none | light tap | optional tiny ding (very short) |
| Bookmark room | none | light tap | none |
| Affiliate shop tap | none | light tap | none |
| Affiliate URL opens (new tab) | none | none (OS handoff) | none |
| Paywall open | none | none | none |
| Paywall conversion success | none | success haptic | none (revenue moment — let the user feel it visually) |
| Paywall dismiss | none | none | none |
| Push pre-prompt slide-in | none | none | none |
| Push pre-prompt accept | none | success haptic | none |
| Push pre-prompt dismiss | none | none | none |
| Toast (success) | none | light tap | none |
| Toast (error) | none | light error haptic | none |
| Modal open (item sheet, etc.) | none | none | none |
| Modal close | none | none | none |
| Pull-to-refresh trigger | none | medium impact at trigger threshold | none |
| Reach Pro page | none | none | none |
| First-aha coachmark appears | none | light tap | none |

**Design principle (Reforge-grounded):** Per *Constrained Divergence* (p.13), only invest in delight features when they materially differentiate. Every haptic in the table above earns its place by either (a) confirming a state change the user can't easily see (slider snap), or (b) marking a peak moment (reveal, conversion, finale). Random taps on every interaction = annoyance, not delight.

**Cross-platform consistency rule:** ship the native haptic via Capacitor or do not ship it at all. Do **not** ship a half-broken Android-only `navigator.vibrate()` implementation that creates unequal experiences. (This is a *Decision Architecture* p.20 call: it's a high-impact, irreversible UX-consistency decision — wait for the Capacitor wrap to ship the whole table at once.)

**Audio rollout plan:**
1. Ship Settings toggle: "Sound effects (off)" with description "Subtle audio at peak moments. Off by default."
2. When user toggles on, gate ALL audio cues behind that flag.
3. Use Web Audio API's `AudioContext` to detect silent mode where possible; if silent, even if toggle is on, suppress.
4. Asset budget: 4 SFX max (whoosh, sparkle, chime, ding). Each <50KB compressed.

**Effort:** Tier M for haptic table (post-Capacitor); Tier M for audio system + assets.

---

## Section C — Magic-moment choreography for the reveal

**Why this section is the most important in the dimension:**

Per Reforge's *Aha Moment* framework (*Retention + Engagement → Activation*, lesson 03), the aha moment is **the user experiencing the core value prop for the first time**. For Furnish, that is the *reveal* — when the redesigned room appears on screen. The qualitative description (p.5–7) is "feels like you've gained a special ability." If the reveal is just "show the room with overlays," you have FAILED the qualitative test before any metric is even measured.

The quiz finale (240 piece rain, theme flicker, settle) is *carefully crafted*. The reveal currently is *not*. That asymmetry is wrong: the quiz is a setup-moment, the reveal is the aha moment. The aha moment deserves *more* craft than the setup, not less.

Per Reforge *Decision Architecture* (p.30): "decisions are reversible — invest less upfront and more in iteration." So: ship choreography v1 now, instrument it (where do users skip past? where do they linger?), iterate.

### Frame-by-frame plan (assumes real AI has just returned)

```
T = 0 ms    [API responds with image URL]
            - Begin pre-render: insert image into hidden DOM, wait for `onload`.
            - Continue holding the analyzing-screen story on its final beat.

T = 0 ms (after onload)   [Image is decoded and ready]
            - Cross-fade analyzing screen → results screen.
            - results screen starts at opacity:0, full dim overlay over photo.

T = 100 ms  Frame 0 — DIM
            - Background screen dims to 0.4 alpha (focuses eye on incoming room).

T = 200 ms  Frame 1 — IMAGE FADE IN (behind frosted layer)
            - The redesigned image fades in (0 → 1 over 400ms).
            - A frosted-glass layer (backdrop-filter: blur(20px) + 0.3 white tint)
              sits ON TOP of the image. So the user sees a "fog" with hints
              of color/shape underneath. Builds anticipation.

T = 600 ms  Frame 2 — SCALE-FROM-CENTER POP
            - Image element transforms from scale(1.02) → scale(1.00),
              cubic-bezier(0.34, 1.56, 0.64, 1), 240ms.
            - Subtle but felt.

T = 800 ms  Frame 3 — FROSTED LAYER FADES OUT
            - Backdrop-filter eases off (blur 20 → 0px over 600ms).
            - White tint fades out simultaneously.
            - Reveal completes at T = 1400ms. Full sharp image is visible.

T = 1400 ms Frame 4 — "DESIGNED WITH FURNISH" OVERLAY
            - Existing #roomOverlay text fades in (opacity 0 → 1 over 400ms).
            - Holds visible 800ms.
            - Then fades out (opacity 1 → 0 over 600ms).
            - Total overlay lifecycle: 1400 → 3200ms.
            - This text is the verbal anchor of the magic moment. Currently
              it just sits there from the start, which dilutes it.

T = 2000 ms Frame 5 — PRICE TAGS RIPPLE IN
            - Each price tag enters from its position with scale(0.7) → scale(1.0)
              and opacity(0) → opacity(1), 200ms each, 80ms stagger between tags.
            - For 5 tags, total ripple = 200 + (4 × 80) = 520ms.
            - Lands at 2520ms.

T = 2700 ms Frame 6 — TOTALS CARD + PALETTE SLIDE UP
            - #totalsCard slides from translateY(20px) → translateY(0),
              opacity(0) → opacity(1), 400ms.
            - Palette chips fade in just after totals.

T = 3300 ms Frame 7 — ITEMS LIST FADES IN BELOW FOLD
            - If user has already started scrolling, this is invisible — ok.
            - If not, the section fades in so it's there when they do scroll.

T = 3500 ms Frame 8 — FIRST-AHA COACHMARK
            - Existing coachmark + price-tag pulse fires.
            - Move the existing setTimeout(showFirstAhaHint, 600) → setTimeout(showFirstAhaHint, 3500).
            - Coachmark hangs 8s (existing behavior, keep) → dismisses at T = 11500ms.

T = 11500 ms Frame 9 — IDLE STATE
             - All choreography complete.
             - Tutorial (if first redesign) fires at 6s overlap with this — adjust.
             - Premium upsell hint (if 3rd+ gen) fires after coachmark dismisses.
```

### What ships as CSS vs JS

**CSS animations** (most of it):
- `.results-image.entering` keyframe (fade + scale + frosted overlay)
- `.price-tag.entering` keyframe (ripple-in)
- `.overlay-text.flashing` keyframe (the "Designed with Furnish" timed fade)
- `.totals-card.entering` keyframe (slide up)

**JS sequencing** (lightweight):
- A single `revealChoreography(room)` function that adds/removes the entering classes in sequence.
- Use `Promise` + `setTimeout` chain or `Web Animations API` `animate().finished`.
- Existing `showFirstAhaHint` delay just needs the timeout adjusted.

### Implementation file mapping

| Phase | File / location |
|---|---|
| Image entry + frosted overlay | `styles.css` (new keyframes); `app.js:4116-4209` (`openRoom` adds class) |
| "Designed with Furnish" timed text | `styles.css` (new); `app.js:4185` (already injects the text — wrap in animation class) |
| Price tag ripple | `styles.css` (new keyframe `.price-tag.entering`); `app.js:4322` (`renderPriceTags` adds class with stagger delay) |
| Totals card slide | `styles.css`; `app.js:4304` (`renderRoomPieces`) |
| Coachmark timing | `app.js:4157` (change `600` → `3500`) |

### Peak-end rule (Reforge-aligned)

Per Reforge *Retention + Engagement* — engagement strategies module repeatedly references that the moments users *remember* are the peak (highest emotion) and the end. The reveal IS the peak. Most apps blow this on the end (abrupt screen, generic modal). Furnish should:
1. Make the reveal peak unambiguously (frames 0–4).
2. Make the EXIT from the results screen end on a positive beat — when user navigates away, a tiny "Saved your room" toast (already exists for bookmark, extend to home-button taps too).

---

## Section D — Recommendation entries (≥6)

### D.1 Build story-driven analyzing screen NOW (before AI ships)

**File path:** `index.html:625-638` (markup exists), `app.js` (new function `runAnalyzingStoryline`), `styles.css` (new step-active keyframes).

**Current state:** Static spinner + 4 unused `<li>` step labels. No JS animates them.

**Proposed change:** Implement sequential step activation with check-mark on completion. Make timing configurable via duration argument so the same component scales from mock (1s total) to Schnell (10s) to Kontext Pro (30s).

```css
.loader-steps li {
  opacity: 0.4;
  transition: opacity 320ms ease, transform 320ms ease;
}
.loader-steps li.active {
  opacity: 1;
  transform: translateX(4px);
}
.loader-steps li.done::before {
  content: "✓";
  color: var(--accent);
  animation: stepCheck 240ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes stepCheck {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

```js
// app.js — new function near analyzing flow
function runAnalyzingStoryline(durationMs, onComplete) {
  const steps = document.querySelectorAll('#loaderSteps li');
  const beats = [0.15, 0.40, 0.70, 0.95]; // % of duration when each step activates
  const completes = [0.35, 0.65, 0.90, 0.99]; // % when each step marks done
  let i = 0;
  const tickActivate = () => {
    if (i >= steps.length) return;
    steps[i].classList.add('active');
    setTimeout(() => steps[i].classList.add('done'), (completes[i] - beats[i]) * durationMs);
    i++;
  };
  beats.forEach((pct, idx) => setTimeout(tickActivate, pct * durationMs));
  setTimeout(onComplete, durationMs);
}
```

**Reforge cite:** *Defining Your Aha Moment* (p.14) — time-bound metrics; the user is time-budgeting too. Storytelling motion expands the perceived budget.

**Expected impact:** +8pp on `analyzing → aha_results_fired` completion when real AI ships (current mock is too fast for the metric to mean anything; this measure becomes critical post-cutover). Drop-off mitigation worth multiples of this in retained users.

**Effort:** Tier M (~3-4 hours).

**Dependencies:** None for v1 (mock duration). Real AI integration (DEFERRED #1) reuses the same component.

**What breaks:** Nothing. The current `<li>` markup is already in place.

---

### D.2 Stage the reveal choreography per Section C

**File path:** `app.js:4116-4209` (`openRoom`), `styles.css` (new keyframes), `app.js:4322` (`renderPriceTags` for stagger).

**Current state:** All results render simultaneously; coachmark fires at 600ms which collides with everything else landing.

**Proposed change:** Implement the 9-frame reveal choreography from Section C. Most lifts to CSS keyframes; JS only sequences class additions.

**Reforge cite:** *Aha Moment* qualitative test — "feels like you've gained a special ability" (p.5). Currently fails because nothing in the rendering signals "moment of reveal." Choreography enforces that.

**Expected impact:** +5pp on `aha_results_reached → first_save` (wishlist OR bookmark within 60s of reveal). The argument: a memorable reveal triggers more emotional investment, which lowers the cost of the next action.

**Effort:** Tier M (~6-8 hours including QA across screen sizes).

**Dependencies:** Section A.3 progressive disclosure spec is the contract. No backend dependency.

**What breaks:** Nothing structural. The first-aha coachmark timing changes (`app.js:4157` `600` → `3500`); document this in CHANGES_APPLIED.md. Watch for race condition with `queueFirstRedesignTutorial` (also fires at 6s — push to 12s if reveal is happening, otherwise unchanged).

---

### D.3 Add skeleton screens for items list, saved rooms, wishlist, price tags

**File path:** `styles.css` (new `.skeleton` class + shimmer), `app.js:4490` (`renderItemsList`), `app.js:4322` (`renderPriceTags`), `app.js` (wishlist render), `app.js` (home rooms render).

**Current state:** Empty containers during render = perceived broken.

**Proposed change:**

```css
.skeleton {
  background: linear-gradient(90deg,
    var(--surface-2) 0%,
    var(--surface-3) 50%,
    var(--surface-2) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: 8px;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
```

JS pattern:
```js
function renderItemsList(room) {
  const list = $('#itemsList');
  list.innerHTML = `
    <div class="item-card skeleton" style="height:88px"></div>
    <div class="item-card skeleton" style="height:88px"></div>
    <div class="item-card skeleton" style="height:88px"></div>
  `;
  requestAnimationFrame(() => {
    // Real render
    list.innerHTML = '';
    room.items.forEach(item => list.appendChild(buildItemCard(item, room)));
  });
}
```

**Reforge cite:** *Constrained Divergence* (p.6) — desirability constraint, the "differentiation" topping. Solving the same user problem (waiting) in a more pleasant way.

**Expected impact:** +2pp on `home_session > 30s` (not feeling broken on first open). Subjective polish gain disproportionate to engineering cost.

**Effort:** Tier S (~2 hours).

**Dependencies:** None.

**What breaks:** Nothing.

---

### D.4 Cache last-rendered redesign for instant home reload [Original recommendation, not Reforge-grounded]

**File path:** `app.js` near `state.rooms` save logic (search for `save()` calls); new in-memory cache `state._lastRenderedImage`.

**Current state:** When user returns home and re-opens the most recent room, the app re-reads `room.photo` from base64 in localStorage. On a 12MB photo (the upload max per CLAUDE.md), this is a noticeable parse hit.

**Proposed change:** Keep the most recent rendered redesign image as a decoded `Image` object in memory between navigations. On home → room transition, reuse the decoded image instead of re-parsing base64.

```js
let _lastRoomImageCache = null; // { roomId, img: HTMLImageElement }

function getRoomImage(room) {
  if (_lastRoomImageCache && _lastRoomImageCache.roomId === room.id) {
    return Promise.resolve(_lastRoomImageCache.img);
  }
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      _lastRoomImageCache = { roomId: room.id, img };
      resolve(img);
    };
    img.src = room.photo;
  });
}
```

**Reforge cite:** None directly — this is original. *Decision Architecture* (p.18) does support: low-impact, irreversible architectural decision, so do it once correctly.

**Expected impact:** +0.5s perceived speed on returning to last room (largest single perceived-speed win for returning users).

**Effort:** Tier S (~1-2 hours).

**Dependencies:** None.

**What breaks:** Nothing if cache is invalidated on room edit. Add invalidation on any `room.id`-affecting save.

---

### D.5 Add Settings toggle for sound effects (off by default)

**File path:** `index.html` (settings screen — search for `data-screen="settings"`), `styles.css`, `app.js`.

**Current state:** No audio system at all.

**Proposed change:** Ship the toggle UI + the off-by-default behavior. Do NOT ship any audio assets in this batch — that's a separate decision. Just lay the rails.

```html
<div class="settings-row">
  <label class="settings-label">
    <span>Sound effects</span>
    <span class="muted small">Subtle audio at peak moments. Off by default.</span>
  </label>
  <button class="toggle-switch" id="soundToggle" aria-checked="false">
    <span class="toggle-thumb"></span>
  </button>
</div>
```

```js
// state.settings.soundEnabled = false (default)
$('#soundToggle')?.addEventListener('click', () => {
  state.settings = state.settings || {};
  state.settings.soundEnabled = !state.settings.soundEnabled;
  save();
  // re-render toggle visual
});

function playSfx(name) {
  if (!state.settings?.soundEnabled) return;
  // Future: load + play actual SFX. For v1, this is a no-op stub.
}
```

**Reforge cite:** *Constrained Divergence* (p.13) — delight differentiation, prioritize ONLY in competitive environments. AI-room-design is competitive but audio bombing is not delight; opt-in respects user autonomy.

**Expected impact:** Defensive — prevents shipping audio that fires uninvited and causes uninstalls. Hard to A/B; lean toward "don't break what isn't broken."

**Effort:** Tier XS (~1 hour for toggle + stub).

**Dependencies:** Audio assets are a separate, later batch.

**What breaks:** Nothing. Pure addition.

---

### D.6 Push existing showFirstAhaHint timing from 600ms → 3500ms post-Frame-7

**File path:** `app.js:4157` — `setTimeout(() => showFirstAhaHint(), 600)`.

**Current state:** Coachmark fires 600ms after results screen opens. This is concurrent with the existing first-redesign tutorial (6s) and the staggered render of all results UI. Three timers fighting for the same screen real estate.

**Proposed change:** Single line change — `600` → `3500`. Coachmark now lands AFTER the choreography from Section C completes (Frame 7 ends at 3300ms). Tag pulses against a settled, attention-hungry user instead of one still parsing 8 things at once.

```js
// app.js:4157
if (isFirstResultsForProfile && !state._tourShown) {
  state._tourShown = true;
  save();
  setTimeout(() => showFirstAhaHint(), 3500); // was 600
}
```

**Reforge cite:** *Aha Moment* (p.14) — the user's attention budget at the moment of reveal is fixed. Distributing competing CTAs across that budget = low conversion on each. Sequencing them = higher per-CTA attention.

**Expected impact:** +3pp on `coachmark_shown → first_price_tag_tap`. Coachmark currently fires before users even register what they're looking at.

**Effort:** Tier XS (~5 minutes).

**Dependencies:** Should ship in same batch as D.2 (reveal choreography) so the 3500ms lands correctly.

**What breaks:** Nothing.

---

### D.7 Document haptic feedback table NOW so it ships day 1 with Capacitor wrap [Original]

**File path:** `DEFERRED.md` item #4 — append the haptic table from Section B.

**Current state:** No spec exists. When Capacitor wrap happens, the team will face a green-field "what haptics do we ship?" question and likely default to "everything" (annoying) or "nothing" (missed opportunity).

**Proposed change:** Append Section B's table verbatim to DEFERRED.md item #4 (Capacitor wrap), with a clear "ship these on day 1, not as an afterthought" note.

**Reforge cite:** *Decision Architecture* (p.27) — low-impact, irreversible decisions are the ones PMs under-invest in. Native haptic patterns ARE low-impact in the moment but irreversible (changing established haptic patterns post-launch erodes trust). Do the work upfront.

**Expected impact:** Defensive but high-leverage. Prevents day-1 native UX from feeling stale.

**Effort:** Tier XS (~30 min — copy table into doc).

**Dependencies:** None.

**What breaks:** Nothing.

---

### D.8 Move "Designed with Furnish" overlay text from static-on to timed flash [Original]

**File path:** `app.js:4185` — currently injects overlay text into `#roomOverlay` and leaves it sitting forever:
```js
$('#roomOverlay').innerHTML = `
  <div class="overlay-label">${profile?.name || ''}</div>
  <div class="overlay-title">Designed with Furnish</div>
`;
```

**Current state:** Overlay is always visible in the corner of the photo. Visual noise. The branding moment is diluted because it's not a "moment" — it's just permanent text.

**Proposed change:** Make the overlay flash in at 1400ms (Frame 4 of Section C choreography), hold 800ms, fade out. This converts dead static text into a *peak-end* memorable beat. The branding hits exactly when the user is parsing the reveal — better recall, less ongoing visual debt.

```css
.room-overlay {
  opacity: 0;
  pointer-events: none;
}
.room-overlay.flashing {
  animation: overlayFlash 2200ms ease-out forwards;
}
@keyframes overlayFlash {
  0%   { opacity: 0; transform: translateY(8px); }
  18%  { opacity: 1; transform: translateY(0); }
  64%  { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(0); }
}
```

```js
// In openRoom, after setting innerHTML:
$('#roomOverlay').classList.remove('flashing');
requestAnimationFrame(() => {
  setTimeout(() => $('#roomOverlay').classList.add('flashing'), 1400);
});
```

**Reforge cite:** *Aha Moment* (p.5–7) — qualitative description "feels like a special ability." A flashed brand moment co-occurs with the reveal peak; a static label does not. Peak-end rule (Retention + Engagement engagement strategies) supports timed delivery over persistent display.

**Expected impact:** +4pp on aided brand recall ("which app made this?"). Hard to measure short-term; defensible for share-out / social referrals long-term.

**Effort:** Tier XS (~1 hour).

**Dependencies:** Should ship with D.2 (reveal choreography).

**What breaks:** Profile name display (`overlay-label`) goes with it — consider whether profile name should stay persistent or also flash. Recommendation: flash both together; the user knows their own profile name.

---

## Top 3 priorities for this dimension

1. **D.1 — Story-driven analyzing screen.** This is the **most urgent** item in the entire dimension. Real AI is item #1 on DEFERRED.md. The current fake-fast experience masks the latency reality. When backend ships and Schnell takes 10s (or Kontext Pro takes 30s), a generic spinner will tank `analyzing → aha_results` completion. Build the storyline component now, parameterize duration, and the AI cutover becomes a one-line swap. **Tier M effort, multi-X retention impact.**

2. **D.2 + D.8 — Reveal choreography (frames 0–8) + timed brand overlay.** The reveal IS the aha moment per Reforge. The current rendering is "everything appears at once with a coachmark at 600ms" — which fails the qualitative test ("feels like a special ability"). Sequenced choreography enforces the *feeling*. Pair with D.8 (timed brand flash) to convert static dead text into a peak-end beat. Together: ~10 hours of work, the highest-leverage UX investment in this dimension.

3. **D.6 — Coachmark timing fix (600ms → 3500ms).** Five-minute change, +3pp expected on coachmark conversion. Must ship in same batch as D.2 — they are coupled. The current 600ms timing fights the reveal moment instead of completing it. This is the textbook Reforge *Decision Architecture* example of a "low-cost, high-impact, reversible" — make it now, iterate post-launch.

**Items D.3, D.4, D.5, D.7 can all ship later batches.** They're high-quality, but the top 3 above set the *floor* for what "good performance and feel" means in the post-cutover world. Without them, the rest is rearranging deck chairs.

---

## What is NOT in this dimension (out of scope, flagged for cross-dimension owners)

- **Empty states** (handled by 01_visual_design): the `<div class="empty-state">` patterns are well done; no perception change recommended.
- **Onboarding pacing** (handled by 02_psychology / 03_conversion): tutorial fire timing is tangentially affected by D.2 but the *content* of the tutorial is not in this dimension.
- **Paywall conversion timing** (handled by 03_conversion): premium upsell post-3rd-gen is a conversion-pacing decision, not a perception one.
- **Real Replicate API integration** (handled in implementation phase): this dimension says "design the analyzing screen for it"; the integration itself is a separate engineering scope.

---

*End of dimension 11 — Performance and Feel.*
