# USE_TEMPLATE_AUDIT.md

**Status:** STEP 1 of 4 complete. **Awaiting your approval before STEP 3 implementation.**

This audit walks every "Use Template" CTA instance currently rendered, traces what each one does on tap today, and proposes the unified behavior under your new spec.

---

## Headline finding — buttons aren't actually dead

**Important caveat upfront:** every "Use Template" button I can find DOES have a click handler wired and DOES route to generation today. They are not silently broken. What's broken is **the behavior they perform on tap** — specifically, the current path uses the template's image AS the room canvas (replacing the user's own room), which doesn't match your new spec where the template should be a *style anchor* layered over the user's room photo.

If you've been testing and seeing zero response from a tap, there may be a deeper bug (e.g. `getActiveProfile()` returning null, or a state issue) that I can't reproduce without your repro steps. Flag this as **CONFLICT 1** below — please share the exact tap + state where you see no response so I can confirm I'm not missing a real dead-button regression.

The rest of this audit assumes the spec change you described (template as style anchor over user's room) is the primary intent. The audit will fix dead-button regressions if any are found during the implementation sweep.

---

## Section A — Every "Use Template" CTA instance

| # | Surface | Render path | Shared component? | Click handler | Routes to |
|---|---|---|---|---|---|
| A1 | **Style Pulse homepage row** (Bedroom + Living Room cards) | `renderStylePulse()` → `renderImageCard()` | ✅ YES | `cta.addEventListener('click', e => { e.stopPropagation(); useTemplateFromCard(spec, 'style_pulse'); });` (inside renderImageCard, app.js:~2521) | `useTemplateFromCard` → `startFromTemplate(tpl)` |
| A2 | **Dedicated /this-week page** (all 9 room cards) | `renderThisWeekPage()` → `renderImageCard()` | ✅ YES | Same shared handler from `renderImageCard` (source: `'this_week_page'`) | Same path |
| A3 | **Trending Styles strip** (homepage) | `renderCollections()` → `buildMarquee()` → `buildCollectionCard()` | ❌ NO — custom render path | `cta.addEventListener('click', e => { e.stopPropagation(); useTemplateFromCard({...}, 'collection_card'); });` (app.js:3637) | Same path |
| A4 | **Seasonal strip** (homepage) | Same `buildCollectionCard()` | ❌ NO — custom render path | Same handler as A3 | Same path |
| A5 | **Templates browse screen** (data-screen="templates") | `renderTemplates()` → custom DIV markup with inner `<button>` | ❌ NO — custom render path | Outer `card.addEventListener('click', fire)` AND inner `<button>` click bubbles to outer (no `stopPropagation` on inner). `fire = () => startFromTemplate(t);` (app.js:3844) | Calls `startFromTemplate(t)` directly (skips `useTemplateFromCard`) |
| A6 | **Discover More tile** (homepage Style Pulse 3rd element) | `renderDiscoverMoreTile()` | n/a | `data-go="this-week"` (no template logic) | Navigation only — NOT a Use Template surface |

**Total tappable Use Template buttons currently in the app: 5 surfaces.** A6 is navigation-only, not in scope.

### Sub-finding — A5 has a double-fire bug

In `renderTemplates`, the outer card has `click → fire`, AND the inner `<button class="imgcard-cta">` doesn't `stopPropagation`. So when the user taps the button, BOTH the inner button click AND the outer card click fire — calling `startFromTemplate(t)` twice in quick succession. This isn't reproducible as "dead button" but it IS a real concurrency bug — the second call sets `state.draft` over the first, and analyses race. Flag as **CONFLICT 2**.

---

## Section B — Single source of truth verification

| Function | Caller count | Used by |
|---|---|---|
| `useTemplateFromCard(spec, source)` (app.js:2434) | 3 surfaces (A1, A2, A3+A4) | Shared component + collection card |
| `startFromTemplate(t)` (app.js:3867) | 1 direct caller (A5) + downstream from `useTemplateFromCard` | All 5 surfaces eventually |

`startFromTemplate(t)` IS the single bottleneck — every Use Template CTA reaches it. Good. But A5 bypasses `useTemplateFromCard` (skipping the analytic event + the `tpl` object normalization).

---

## Section C — What `startFromTemplate(t)` does today

```js
function startFromTemplate(t) {
  // Pro-template gate (KEEP)
  if (t.pro && !isPro()) { openPaywall('template_pro'); return; }
  routeGenerationByModelTier('new_redesign_template', (tier) => {
    state.draft = {
      photo: t.photo || placeholderImageFor(t.type),  // ← bug per spec: replaces user's room
      type: t.type,
      dims: { ...t.dims },
      keep: false,
      styleOverride: t.styles,
      colorOverride: t.colors,
      fromTemplate: t.id
    };
    save();
    showScreen('analyzing');
    runAnalyzerAnimation().then(() => {
      const transient = synthesizeAnswersFromTemplate(t);
      const room = buildRoomFromDraft(transient);
      ...
    });
  });
}
```

**Behavior gaps vs. your new spec:**
1. **Template image overwrites user's room photo.** Spec says template is a *style anchor*, not the canvas. The user's photo (or `state.draft.photo` if they're mid-capture) should be the canvas; the template's image should ride along as `state.draft.styleAnchorImage` for the AI prompt.
2. **No photo-first routing for users without a photo.** Spec: "If user has NOT uploaded a photo of their own room yet → take them to photo upload first, then preferences, with the template carried through as a style anchor stored in state." Current code instead uses the template image as the photo and skips capture.
3. **No confirm dialog for returning users with a saved photo.** Spec: "We'll redesign [their room] in this style" confirmation before kicking off.
4. **No mid-redesign confirm.** Spec: "User is mid-redesign with their own photo when they tap Use Template from a notification or deep link — show a confirm dialog." Current code blows away `state.draft` silently.
5. **No "Card B replaces Card A" handling.** Spec says no merging; current code already does this implicitly (each tap rebuilds `tpl`), so this is FINE — flag as confirmed-correct.
6. **No second-template-use Pro upsell.** Spec says fire upsell on the SECOND template use in a session, not the first. No tracking of `_sessionTemplateCount` exists today.
7. **No graceful fallback for broken template image.** If `t.photo` 404s, the current code still proceeds (uses placeholderImageFor as fallback), but there's no user-visible error. Spec wants "This template is unavailable right now" toast instead of silent fallback when the user explicitly chose this template.

---

## Section D — Behavior changes the implementation must make

| # | Change | Where | Notes |
|---|---|---|---|
| D1 | **Stash template selection in `state._pendingTemplate` BEFORE any routing decision** | New helper, called at top of `useTemplateFromCard` | Survives navigation, auth gate, photo capture. Cleared on Back from Use-Template-routed screens or on completion. |
| D2 | **Template stops being the photo. Photo stays the user's room.** | Rewrite `startFromTemplate(t)` body | New: `state.draft.styleAnchorImage = t.photo;` carried through to `buildAIPrompt` as a style-reference URL. The picker continues to use `state.draft.photo` (user's room) as canvas. |
| D3 | **Photo-first routing if user has no photo** | New router `routeUseTemplate(spec)` called from `useTemplateFromCard` | Decision tree: if `state.draft?.photo` OR most-recent `state.rooms[].photo` exists → confirm + route to flow; else → route to `capture`, stash `state._pendingTemplate`, after photo upload resume into generation. |
| D4 | **Confirm dialog for returning user with saved photo** | New helper `showUseTemplateConfirm(spec, photoSrc)` | Modal: "We'll redesign [room name] in this style." Confirm → proceed; Cancel → return to source surface, clear stash. |
| D5 | **Mid-redesign confirm** | Detect `state.draft?.photo && !state.draft?.fromTemplate` (user mid-flow with own photo) | Modal: "Switch to template-based redesign? Your in-progress redesign will be saved." Confirm → save current draft to a temporary slot OR discard; proceed. Cancel → keep current draft. |
| D6 | **Pro upsell on 2nd template use in session** | `state._sessionTemplateCount` increments per `useTemplateFromCard` call | If `count >= 2 && !isPro()` → fire `openPaywall('premium_quality')` AFTER the redesign reveals (don't gate the action — surface the upsell as a soft hint per Reforge User Psychology pacing). Reuses existing `renderPremiumUpsellHint` infrastructure on the results screen. |
| D7 | **Graceful fallback for broken template image** | Inside `useTemplateFromCard` — pre-load image, on error toast "This template is unavailable right now" | Image preload via `new Image(); img.onload/onerror;` race. Don't proceed if onerror fires. |
| D8 | **Back button clears template selection** | Listener for nav events while `state._pendingTemplate` is set | When user navigates back to home/this-week from capture/preferences without completing the flow → clear `state._pendingTemplate`. |
| D9 | **A5 (Templates browse) routed through `useTemplateFromCard`** | Refactor `renderTemplates` to call `useTemplateFromCard` instead of `startFromTemplate` directly | Unifies the analytics surface + the new pre-flow logic. Fixes the current double-fire bug from Section A sub-finding. |
| D10 | **A3 + A4 (Collection cards) refactored to share more of `renderImageCard`'s structure** | New helper `attachUseTemplateCta(card, spec, source)` | Single function that builds the CTA + click handler. Used by `renderImageCard`, `buildCollectionCard`, and `renderTemplates`. Keeps the outer container layouts (collection-card, template-card) where they differ visually, but the CTA is one source of truth. |

## Section E — Analytics events to add

| Event | Props | Fires when |
|---|---|---|
| `use_template_clicked` | `template_id, source_surface, user_state ('new'\|'returning'), session_template_count` | Inside `useTemplateFromCard` immediately on tap. Replaces the existing single-prop event of the same name. |
| `use_template_redesign_started` | `template_id, model_tier ('standard'\|'premium')` | Inside `startFromTemplate` when `routeGenerationByModelTier` callback fires. |
| `use_template_redesign_completed` | `template_id, time_from_click_ms, items_in_result, total_value` | After `buildRoomFromDraft` returns — measures generation completion. |
| `use_template_abandoned` | `template_id, abandoned_at_step` | Fires if user navigates away from capture/preferences/analyzing while `state._pendingTemplate` is set. |

Existing event `use_template_clicked { source, roomType, styleId, hasImage, imageType }` (current shape) is **superseded** — new shape adds `template_id`, `user_state`, `session_template_count`. Old props can be dropped or kept as supplementary metadata. Recommend keeping `source` (renamed to `source_surface`) and dropping `hasImage`/`imageType` (rarely useful).

## Section F — Conflicts the audit caught

### CONFLICT 1 — "buttons render but do nothing on tap"
Per the headline finding: I cannot reproduce a dead button at the code level — every CTA has a wired handler that routes to `startFromTemplate`. **Decision needed:** can you share the exact reproduction steps where a tap produces no response? Possibilities I haven't ruled out:
- A specific browser tab where state is corrupted (no `state.activeProfileId` → `getActiveProfile()` returns null → `startFromTemplate` bails with `toast('Pick a profile first')` — which technically IS a response but might feel like nothing if the toast is dismissed quickly)
- An interaction where `state.draft` is mid-flow and the new code path I'm about to write would have triggered a confirm dialog that doesn't exist yet (so the current code ALSO does nothing because routeGenerationByModelTier is awaiting an in-flight promise)
- Something specific to the new 10-Q migration that I missed in the consistency sweep

If the reproduction is "tap any Use Template button on Style Pulse from a fresh load," the audit will catch it during the implementation sweep and I'll fix it.

### CONFLICT 2 — Templates browse double-fire
Section A sub-finding. Outer `<div role="button">` AND inner `<button class="imgcard-cta">` both fire `startFromTemplate(t)` on inner-button taps. Need to either (a) refactor outer to non-clickable shell + only inner CTA fires, or (b) add `e.stopPropagation()` to the inner CTA. Recommend (a) — cleaner and matches the renderImageCard pattern. **Decision needed:** is the outer "tap anywhere on the card" UX intended, or should only the explicit CTA fire?

### CONFLICT 3 — When does `state._pendingTemplate` get cleared?
The Back button case (D8) is conceptually clear but technically tricky — Furnish uses `data-go` attributes for navigation, not history-based routing. There's no global "user navigated back" hook. Cleanest options:
- **(a)** Clear on every `data-go="home"` and `data-go="this-week"` click while `state._pendingTemplate` is set + on the user dropdown's Switch Account / Sign Out actions.
- **(b)** Add a `state._pendingTemplate.startedAt` timestamp; auto-expire after 10 minutes if the redesign hasn't completed.
- Recommend (a) and (b) combined — explicit clear on backward nav, with a stale-stash safety expiry. **Decision needed:** confirm both, or just (a)?

### CONFLICT 4 — Where does the Pro upsell fire on 2nd template use?
Spec says "fire on SECOND template use in a session, not the first." Two possible firing surfaces:
- **(a)** Soft toast/banner after the second redesign reveals: "Liked that? Pro renders these in premium quality."
- **(b)** Reuse existing `renderPremiumUpsellHint(room)` on the results screen — ignore its current "gen #3" gating in favor of "session_template_count >= 2."
Recommend (b) but with a flag — add `state._sessionTemplateCount` and OR-condition it into the existing pacing logic. **Decision needed:** confirm (b), or want a separate Pro surface specifically for template upsells?

### CONFLICT 5 — Image preload check timing
D7 says "pre-load image, on error toast." If we wait for the preload before proceeding, it adds 100-500ms latency on slow connections. Alternative: kick off the routing immediately, and if the image errors during the analyzing animation, fail fast then. Recommend **kick-off-then-validate** — proceed with the flow, and if the image is broken, the analyzer screen catches it and reverts. **Decision needed:** preload-blocking (clean but slow) or kick-off-then-validate (snappy but more complex)?

---

## Section G — Files touched (preview)

| File | What changes |
|---|---|
| `app.js` | New helpers: `routeUseTemplate(spec)`, `attachUseTemplateCta(card, spec, source)`, `showUseTemplateConfirm()`, `clearPendingTemplate()`, `_sessionTemplateCount` tracking. Rewrite `useTemplateFromCard` and `startFromTemplate`. Refactor `renderTemplates` to call `useTemplateFromCard`. Refactor `buildCollectionCard` CTA wiring through `attachUseTemplateCta`. Refactor `renderImageCard` CTA wiring through the same helper. New analytics events. |
| `index.html` | New confirm modal `<div id="useTemplateConfirmModal">` (template + canvas + Cancel/Confirm buttons). |
| `styles.css` | Confirm modal styling — small modal card with two-button row, dark-mode parity. |
| `DEFERRED.md` | Backend hook for `state.draft.styleAnchorImage` — when the real Replicate-backed AI lands, the prompt POST includes both the canvas photo AND the style-anchor image. |
| `CHANGES_APPLIED.md` | Migration log appended. |

---

## Section H — Implementation order plan (locked when you approve)

1. **Layer 1 — Shared CTA helper.** Extract `attachUseTemplateCta(card, spec, source)` and migrate the 3 caller paths (`renderImageCard`, `buildCollectionCard`, `renderTemplates`). Confirms single-source-of-truth.
2. **Layer 2 — Pre-flow routing.** Add `routeUseTemplate(spec)` deciding photo-first vs. confirm vs. proceed. Add `state._pendingTemplate` stash.
3. **Layer 3 — Template-as-style-anchor refactor.** Rewrite `startFromTemplate(t)` to NOT overwrite the photo; add `state.draft.styleAnchorImage`; thread through `buildAIPrompt`.
4. **Layer 4 — Confirm modals.** Both flavors (returning-user + mid-redesign).
5. **Layer 5 — Pro upsell on 2nd use.** `state._sessionTemplateCount` + condition into `renderPremiumUpsellHint`.
6. **Layer 6 — Image preload + graceful fallback.** Per CONFLICT 5 resolution.
7. **Layer 7 — Back-button stash clear.** Per CONFLICT 3 resolution.
8. **Layer 8 — Analytics events.**
9. **Layer 9 — Sweep + verification.** Tap each of the 5 sites, confirm correct behavior + correct event fires.
10. **Layer 10 — Migration log to CHANGES_APPLIED.md.**

---

## Stop point

This file = STEP 1 deliverable. **Awaiting your review.**

Specifically I need:
- Reproduction for CONFLICT 1 (or confirmation that the spec change IS the "dead button" you're seeing, not a literal no-response bug)
- Resolution of CONFLICTS 2–5 (Templates browse outer-click; pendingTemplate clear strategy; Pro upsell surface; preload timing)
- Confirmation of any item in Sections A–E that you want changed
- Anything I missed

Once approved, I'll execute Layers 1–10 in order, then sweep + document.
