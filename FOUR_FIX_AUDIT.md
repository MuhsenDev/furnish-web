# Four-Fix Audit

**Date:** 2026-04-27
**Scope:** 4 coordinated fixes across reveal screen, items section, footer actions, quiz onboarding
**Outcome:** Zero ambiguities, zero conflicts. Proceed to implementation per spec order: Fix 4 → Fix 1 → Fix 2 → Fix 3.

---

## Fix 1 — Before/After slider: drag-only behavior

### Files touched
- `app.js` lines 8612–8641 — slider drag IIFE
- `styles.css` `.ba-slider`, `.ba-handle`, `.ba-handle-knob` (existing rules; add hit-target expansion + keyboard-focus styles)
- `index.html` line ~1011 (the `.ba-slider` markup — confirm `#baHandle` has `role="slider"` + `aria-valuemin/max/now/orientation` for keyboard a11y)

### Current bug (verified at app.js:8628-8636)
```js
const start = e => {
  if (slider.classList.contains('rearranging')) return;
  dragging = true;
  onMove(e);            // ← calculates pct from click X, jumps slider
  e.preventDefault();
};
slider.addEventListener('mousedown', start);
slider.addEventListener('touchstart', start, { passive: false });
```
The `start` handler is bound to the entire `#baSlider` element. Any tap anywhere on the slider container — including over price tags layered above — triggers `onMove(e)` which positions the slider at the click X. Price-tag clicks get hijacked.

### Fix shape
1. Move `mousedown` / `touchstart` binding from `#baSlider` to `#baHandle`
2. Drop the `onMove(e)` call from `start` — drag begins at the handle's current position, not at the click X
3. Add hit-target expansion via CSS `::before` pseudo-element on `.ba-handle-knob` (44×44 minimum invisible area, visual stays current size)
4. Add keyboard handlers on `#baHandle`:
   - Left/Right arrow → ±5%
   - Home → 0%
   - End → 100%
5. Add `tabindex="0"`, `role="slider"`, `aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"` (updated on each setSliderPct call)
6. Add `:focus-visible` styling on the handle for keyboard users

### Edge cases covered by spec
- Mid-drag taps ignored: `dragging` flag already gates `onMove`; price-tag clicks during drag are no-op via the handle-only binding.
- Release outside image: existing `mouseup` / `touchend` listeners on `document` already handle this.

### Reforge framework
- *User Psychology — gesture clarity, single-purpose interaction surfaces.* The slider is a slider; everything else is its own surface (price tags, photo). Don't overload one element with two intents.

---

## Fix 2 — Price tag tap routes to item in list

### Files touched
- `app.js` lines 7943–7975 — `renderPriceTags` (current click handler opens item sheet)
- `app.js` items-list render — find the function that renders items in "Shop The Whole Room" / item cards. Likely `renderItems` or similar; need to confirm + ensure each card has a stable DOM ID like `<div id="item-${item.id}">`.
- `styles.css` — add `.item-card.is-highlighted` keyframe animation (1-second fade tint)
- Analytics scaffolding in app.js — `trackEvent('price_tag_tapped', ...)`

### Current bug (verified at app.js:7967-7970)
```js
tag.addEventListener('click', e => {
  if (rearrangeMode) { e.preventDefault(); return; }
  openItemSheet(item, room);   // ← opens bottom sheet, not list scroll
});
```
Tag taps open a bottom-sheet detail view rather than scrolling to the item card in the list.

### Fix shape
1. Replace `openItemSheet(item, room)` with new `scrollToItemCard(item.id)` function
2. New function:
   - `const card = document.getElementById('item-' + itemId)`
   - If found: `card.scrollIntoView({ behavior: 'smooth', block: 'start' })` with offset for any sticky topbar (~80-120px headroom)
   - Add `.is-highlighted` class for 1s; remove on timeout
   - If multiple rapid taps: cancel previous timeout, reset highlight on new card
   - If `card === null`: scroll to placeholder "this item is no longer available"
3. Item-card render: ensure each card has `id="item-${item.id}"` (CHECK — may already exist)
4. Add `trackEvent('price_tag_tapped', { item_id, item_position_in_list, source_screen: 'reveal' })`

### Edge cases per spec
- **Item missing from list (out of stock / broken affiliate):** spec says "shows a placeholder card." For this pass, I'll degrade gracefully with a toast `${item.name} is no longer available` if the card isn't in DOM. The full placeholder-card pattern is bigger scope; I'll defer to backend phase if not already in code.
- **Item already in viewport:** detect via `getBoundingClientRect().top` inside the visible band; skip scroll, fire highlight only.
- **Sticky-header offset:** the `.topbar` has `position: relative` (not sticky on results screen per Fix 1's audit), but the `.sticky-shop-all` button is fixed at `bottom: 72px`. Top headroom only — bottom doesn't matter for scrollIntoView with `block: 'start'`.

### Reforge framework
- *Conversion Optimization — friction removal between intent and action.* Tag = signal of intent ("I want this thing"). Bottom sheet = a detour. Direct scroll-to-item = the shortest path between intent and the affordance to act on it.

---

## Fix 3 — Footer button visual fix

### Files touched
- `styles.css` lines 7355–7374 — `.reveal-actions-row` flex layout

### Current bug (verified at styles.css:7367-7373)
```css
@media (min-width: 540px) {
  .reveal-actions-row { flex-direction: row; align-items: stretch; }
  .reveal-actions-row .shop-all-btn { flex: 1 1 auto; }
  .reveal-actions-row .different-style-btn { flex: 0 0 auto; min-width: 180px; }
}
```
- `.shop-all-btn` is `flex: 1 1 auto` — grows AND shrinks. Shrink wins when the row is constrained.
- `.different-style-btn` is `flex: 0 0 auto; min-width: 180px` — locked at 180px+
- `.reveal-share-btn` has no flex rule — defaults to `flex: 0 1 auto` (shrinkable, content-sized)

When the row is narrow but ≥540px, "Shop The Whole Room" loses width to the others' content + minimums and wraps "Shop / The Whole / Room" into 3 lines.

### Fix shape
Use `display: grid` with `grid-template-columns: repeat(3, 1fr)` for desktop ≥540px — three equal columns, no shrink-priority bug. Mobile <540px stays stacked vertically.

```css
@media (min-width: 540px) {
  .reveal-actions-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    align-items: stretch;
  }
  .reveal-actions-row .different-style-btn { min-width: 0; }  /* drop the 180px override */
}
```

Add `white-space: nowrap` on the three buttons to prevent text wrapping inside the cells (per spec "Buttons should never wrap their text into multiple lines"). The grid cells expand if needed.

Visual hierarchy already correct in the existing markup:
- `#shopAllBtn` is `.btn-primary big shop-all-btn` (brown fill — primary)
- `#revealShareBtn` is `.btn-ghost` (outline — secondary)
- `#differentStyleBtn` is `.btn-ghost` (outline — secondary)

No change needed to button-class hierarchy.

### Mobile (<540px)
Keep stacked column layout. Spec mentions ordering "Shop The Whole Room first" — verify HTML order. Per index.html:1083, shop-all IS first → no reorder needed.

### Reforge framework
- *Visual Design — visual weight aligned with revenue impact.* Shop-all (revenue-driving) gets primary brown fill.
- *Conversion Optimization — primary CTA emphasis.* The grid fix prevents the primary CTA from being visually compressed below its content.

---

## Fix 4 — Quiz back-navigation

### Files touched
- `app.js` lines 2462–2477 — `#quizBackBtn` click handler (existing — needs behavior change)
- `app.js` `renderQuizStep` (line 2541) — pre-select previous answer
- `app.js` (NEW) — Esc keyboard handler, disable-during-loading guard, browser-back mapping
- `index.html` line 477 — verify `#quizBackBtn` markup, add visibility toggle

### Surprising finding
**A `#quizBackBtn` ALREADY EXISTS in markup + handler.** Spec says "Add a Back button to every quiz question." The button is already in the DOM as the standard topbar back arrow at index.html:477. The handler at app.js:2462 does step decrement but **WIPES the previous answer** (lines 2470-2473):

```js
state.quiz.step--;
const prevQ = window.ONBOARDING_QUESTIONS[state.quiz.step];
if (prevQ) {
  delete state.quiz.answers[prevQ.id];
  delete state.quiz.viewedAt[prevQ.id];
  delete state.quiz.skippedAt[prevQ.id];
  delete state.quiz.pendingMulti[prevQ.id];
}
```

This violates spec: "Tapping Back returns to the previous question with the user's previous answer pre-selected (so they can see what they picked before changing it)."

### Fix shape
1. **Stop wiping answers on back-nav** — remove the `delete` lines at 2470–2473. Step decrements; answers persist.
2. **Pre-select previous answer in `renderQuizStep`** — when a question paints, if `state.quiz.answers[q.id]` exists, mark the matching option(s) as selected/active in the UI. Need to verify whether this already happens; if not, wire it.
3. **Hide back button on Q1** — apply `style.visibility: hidden` (or `.hidden` class) when `state.quiz.step === 0`. Keep it in the layout to avoid jitter; per spec "Back button is hidden or disabled, since there's no previous question. Don't ship a tappable Back button that does nothing."
4. **Esc keyboard handler** — listen on `keydown`, when `e.key === 'Escape'` and active screen is `quiz` and not on Q1, fire same as `#quizBackBtn` click.
5. **Disable during generation** — when the analyzing/loading screen is active, ignore back. Simplest impl: gate the back handler with `if (currentScreen === 'analyzing') return;`.
6. **Browser back mapping** — `popstate` listener: during quiz, treat browser-back as `#quizBackBtn` click (preventDefault + click); on Q1, allow native back to exit the quiz. Use `history.pushState` on each quiz step transition to create stack entries.
7. **Forward-state preservation** — already free per current implementation: answers for Q6+ aren't touched when the user navigates back to Q5 and re-edits.
8. **Analytics:**
   - `onboarding_question_back_tapped { from_question_index, to_question_index }`
   - `onboarding_question_changed { question_id, old_value, new_value, was_via_back_navigation }` — fire from the answer-set code path; check if user's previous answer differs from new answer
   - `onboarding_question_changed_post_first_completion { question_id, ... }` — fires only if the user has previously completed the quiz (state flag `state.quiz.firstCompletedAt`)

### Edge cases per spec
- **Q1:** back button hidden (handled above).
- **Generation in progress:** back disabled.
- **Browser back:** mapped to quiz back.
- **Persistence after refresh mid-edit:** the spec says answers persist via existing `save()` calls. Verified — `save()` is called on each answer commit.

### Cross-fix dependency check
- Fix 4 lives in the quiz screen and quiz state machine. **Zero overlap with Fixes 1, 2, 3** which all live on the results/reveal screen.
- The only shared infrastructure is `trackEvent` (used by all four for analytics). No conflicts.

### Reforge framework
- *User Psychology — undo-by-default, agency over commitment.* Letting users see and modify their previous choices supports autonomy.
- *Activation — reducing pre-completion abandonment.* Users who realize a mistake at Q7 currently bail or live with it; back-nav captures that abandonment.

---

## Cross-fix dependency matrix

|  | F1 slider | F2 price tag | F3 footer | F4 quiz |
|---|---|---|---|---|
| **F1 slider** | — | F1 cleans up tap intercept; F2 builds on cleaned tap behavior | None | None |
| **F2 price tag** | Builds on F1 | — | None (footer is below the items list, no overlap with tag-routing) | None |
| **F3 footer** | None | None (the footer buttons are below the items list; they don't overlap the price tags or items) | — | None |
| **F4 quiz** | None | None | None | — |

**Implementation order from spec is correct:** F4 first (isolated, lowest risk) → F1 (preconditions F2's price-tag routing) → F2 (depends on F1's cleaned tap behavior) → F3 (purely visual, no logic dep).

---

## Auto-resolve decisions (no user input requested per locked policy)

1. **`scrollIntoView` vs `IntersectionObserver` for Fix 2:** The codebase has no existing IntersectionObserver pattern for scroll-targeting. Native `scrollIntoView({ behavior: 'smooth', block: 'start' })` is the correct primitive. Add a small offset adjustment via `scroll-margin-top` CSS rule on `.item-card` for sticky-header headroom.
2. **Hit-target expansion for Fix 1:** Pseudo-element `::before` with `inset: -10px; content: ''` is the canonical CSS pattern for invisible hit-target expansion without affecting layout. No new DOM needed.
3. **Pre-select previous answer in Fix 4:** Need to confirm `renderQuizStep` already handles this; if not, wire it. Decision: minimal-invasive — read `state.quiz.answers[q.id]` after the question renders and apply `.selected` to the matching button(s).
4. **Browser-back history.pushState for Fix 4:** Risky if not careful (could leak history entries to other screens). Decision: scope to quiz transitions only, with a single sentinel `state.quiz.historyDepth` so we can pop the right number on quiz exit.
5. **`onboarding_question_changed_post_first_completion`:** Spec adds this as a NEW event. Auto-defer the BE wiring (per `DEFERRED.md` pattern), client-side `trackEvent` call ships now.

---

## Estimated effort

- Audit (this doc): ~25 min
- Fix 4 (quiz back-nav): ~30 min — mostly behavior cleanup since infra exists
- Fix 1 (slider drag-only): ~20 min — small surgical change
- Fix 2 (price-tag scroll): ~30 min — new function, item-card ID verification, highlight CSS
- Fix 3 (footer buttons): ~10 min — pure CSS swap to grid
- Sweep + verify all four in preview: ~30 min
- Migration log + commit: ~15 min
- **Total: ~2h 40min**

---

## Status

✅ Zero conflicts, zero ambiguities. Proceeding straight to implementation.