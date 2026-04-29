# ONBOARDING_AUDIT.md

**Status:** STEP 1 of 5 complete. **Awaiting your approval before STEP 3 implementation.**

This audit walks every surface in the codebase tied to the current onboarding/preferences flow, lists what gets replaced, removed, or added under the new 10-question system, and flags conflicts the audit caught that I want resolved before code is written.

---

## The new model (the contract this audit enforces)

Replace the 4-question style quiz + the multi-select chip grids in profile preferences with a **10-question flow** whose every answer maps to a concrete AI generation parameter. Style emerges from `vibe + color_appetite + materials`, not from a literal style-name picker. Style names like "Mid-Century Modern" never enter the AI prompt unless the user explicitly typed/selected one.

**State shape (target):** every profile gets a single `profile.answers` object keyed by question ID:

```js
profile.answers = {
  vibe: 'calm_grounded',                    // single
  color_appetite: 'mostly_neutral',         // single
  decor_density: 'a_little_personality',    // single
  scope: 'furniture_decor',                 // single
  natural_light: 'unsure',                  // single
  budget_tier: 'smart',                     // single
  materials: ['warm_woods', 'soft_fabrics'],// multi (max 2)
  room_use: 'lived_in_all_day',             // single
  avoid: ['too_modern', 'busy_prints'],     // multi (max 3) — 'nothing' is exclusive
  dealbreaker: { kind: 'furniture', text: 'walnut sideboard' }  // single + followup
};
```

The `profile.answers` object becomes the canonical input for the AI prompt builder. Per-question metadata + analytics events all key off these stable IDs.

---

## Section A — Current onboarding state shape (what gets replaced)

| Field | Type | Where set | Where read | Action |
|---|---|---|---|---|
| `profile.styles` | string[] (style ids from `window.STYLES`) | `app.js:1071,1090,1174,1361,1592` (quiz finishQuiz, skipQuiz default, prefs chip grid) | `app.js:1361,2855,4003,4131,4604,4803,4847` (prefs chips render, lifecycle banner styles, `pickItemsForRoom`, room.versions, swap filter, reshuffle) | **REPLACED.** Style emerges from new `answers.vibe + answers.color_appetite + answers.materials` combination. Field deprecated; legacy reads in `pickItemsForRoom` rewritten to derive scoring weights from new answers. |
| `profile.colors` | string[] (color-mood ids from `window.COLOR_MOODS`) | `app.js:1362,1543` (prefs color chips) | `app.js:4004,4131,4604,4803,4847` (`pickItemsForRoom` color matching) | **REPLACED.** New single-select `answers.color_appetite` (4 buckets: neutrals_only / mostly_neutral / confident_color / bold) drives palette intensity. |
| `profile.customColors` | hex[] | `app.js:1577-1586` (custom color picker append) | `app.js:1561-1572` (render list) | **REMOVED entirely** from onboarding + preferences. Custom-hex is a power-user feature that doesn't map to any of the 10 new questions. Flag for DEFERRED.md as a future "advanced palette" Pro feature. |
| `profile.budget` | number ($50–$10,000+) | `app.js:1505-1514` (slider input) | `app.js:4006,4053,4803,4847` (`pickItemsForRoom` budget cap) | **KEPT** as the continuous slider — it's the user's lever to dial real prices. Augmented by new `answers.budget_tier` which signals AI quality intent. Per Hassan: "budget_tier" is informational/AI-prompt input; the **slider** stays as the catalog filter. |
| `profile.keepExisting` | bool | `app.js:248,4146,4791` (default false; results screen toggle) | `pickItemsForRoom({ keepMode })` | **REPLACED + UPGRADED.** Boolean becomes derivable from new `answers.scope` (4 buckets: just_furniture / furniture_decor / whole_room / surprise_me). The results-screen toggle stays as override. The new `answers.dealbreaker` adds a richer "preserve THIS specific element" capability that the old boolean couldn't express. |
| `profile.seenFinale` | bool | `app.js:249,1175,2919` | gate for `playQuizFinale` | **KEPT.** Quiz finale celebration still triggers; just on completion of the 10-Q flow instead of the 4-Q. |
| `state.quiz` | `{ profileId, step, scores, answers }` | `app.js:1074,1102,1109,1160` | `renderQuizStep`, `finishQuiz` | **REPLACED.** New shape: `{ profileId, step, answers: {qid: value}, viewedAt: {qid: ts}, skippedAt: {qid: bool} }`. The score-aggregation logic disappears — answers map directly to AI params, no scoring needed. |
| Default profile creation | `{styles:[], colors:[], customColors:[], budget:1500, keepExisting:false, seenFinale:false}` (`app.js:248,722,836`) | profile-creation paths | — | **MIGRATED.** New default: `{answers: {}, budget: 1500, seenFinale: false}`. Two legacy duplicate paths in `app.js:722,836` already dead-code; flag for cleanup. |

## Section B — Current quiz screens & UI markup (what gets replaced)

| Surface | Path | Current | Action |
|---|---|---|---|
| Quiz intro screen | `index.html:264-278` | `<section data-screen="quiz-intro">` with badge "4 questions · ~30 seconds" + Start/Skip buttons | **REWRITE.** Same structure, badge becomes "10 questions · ~90 seconds — every answer shapes the AI". Start button label unchanged. Skip button kept but copy adjusted: "Use defaults — show me a redesign now." |
| Quiz screen | `index.html:281-296` | Topbar + back + progress text + progress bar fill + question card with `<h3 id="quizQuestion">` + options grid + "None of these — skip" button | **KEEP STRUCTURE, REWORK INTERNALS.** Add subhead element for `multi_select_max_2` instructions. Add per-question type-specific render mode (single-select tile, multi-select tile, color-swatch tile, icon tile). Add image placeholder slot per option. Skip button gets the 1.5s reveal-delay per spec. |
| Quiz progress text | `app.js:1118` | `${state.quiz.step + 1} / ${window.QUIZ.length}` (e.g. "3 / 4") | **KEEP** but reads `/ 10` after migration. Add the dot/bar progress visualization Hassan called out (Reforge User Psychology: dots feel light, % feels like work). |
| Quiz progress bar | `app.js:1120-1122` (`#qpbFill`) | Width = pct of completed questions | **KEEP.** Same logic, denominator becomes 10. |
| Question rendering | `app.js:1115-1152` (`renderQuizStep`) | Renders 4 hardcoded `kind` types: photo / palette / icon / face | **REWRITE.** New renderer reads question metadata: TYPE (single_select / multi_select_max_2 / single_select_with_followup), AI_PARAM, IMAGE_HINT (asset slot or icon). Multi-select adds visible counter + max-cap enforcement. |
| Option click handler | `app.js:1145-1149` | Mark selected, debounce 240ms, advance | **REWRITE.** Single-select: keeps current debounce-advance pattern. Multi-select: tap toggles selection, advance only when "Continue" is pressed (no auto-advance — user might want to pick 2). Q9 "Nothing — show me anything" must be **exclusive** (deselects others when picked, others deselect it). |
| `selectQuizOption` | `app.js:1154-1168` | Score-style aggregation; advance | **REPLACE.** New: `recordAnswer(qid, value)` writes directly to `state.quiz.answers[qid]`, advances. No score map. |
| `finishQuiz` | `app.js:1170-1186` | Compute top-3 styles from scores, write to `profile.styles` | **REPLACE.** New: copy `state.quiz.answers` → `profile.answers`; track `onboarding_completed`; play finale; route to capture. |
| "None of these — skip" button | `index.html:294`, handler `app.js:1107-1113` | Skips question without scoring | **KEEP semantics, RENAME copy.** Per spec the skip button should be low-emphasis and revealed 1.5s into each question. Copy: "Skip — use default" so the user knows the AI will fill in. |
| Quiz back button | `app.js:1098-1104` | Steps back, pops last answer | **KEEP semantics.** `state.quiz.answers[qid]` is mutated (delete prior answer on step-back). Q10's followup screen also gets back-traversal. |
| Quiz finale animation | `app.js:1188-1265` (`playQuizFinale`) | 240-piece furniture rain | **KEEP UNCHANGED.** Still triggers on quiz completion. The trigger condition just moves from "scored top-3 styles" to "completed 10-Q flow." |

## Section C — Profile preferences screen (post-redesign edit surface)

| Surface | Path | Current | Action |
|---|---|---|---|
| Section: Styles chip grid | `index.html:341-342`, `app.js:1361` | Multi-select chip grid driven by `window.STYLES` writing `profile.styles` | **REMOVE.** Style is no longer a direct user preference. |
| Section: Color Moods chip grid | `index.html:344-345`, `app.js:1362,1542` | Multi-select chip grid driven by `window.COLOR_MOODS` writing `profile.colors` | **REMOVE.** Replaced by Q2 single-select. |
| Section: Custom colors expander | `index.html:346-356`, `app.js:1561,1577` | `<details>` with native color picker + add-to-palette + list | **REMOVE.** Power-user feature, doesn't fit the 10-Q model. Flag for DEFERRED.md as a future Pro feature. |
| Section: Budget per Room | `index.html:358-372`, `app.js:1504-1514` | `$1,500` display + slider 0-1000 with tick labels $50/$500/$2k/$5k/$10k+ | **KEEP UNCHANGED.** Slider remains the catalog price filter. Stays the centerpiece of the first-redesign tutorial. |
| Profile photo / name section | `index.html:306-339` | Avatar + name input + take-photo / import / remove | **KEEP UNCHANGED.** |
| Save & Continue button | `index.html:374-376`, `app.js:1589-1599` | Validates `p.styles.length > 0`, saves, toasts, routes home | **REWRITE VALIDATION.** New validation: `p.answers` has at least Q1 (vibe) + Q6 (budget_tier) + Q7 (materials) — the three load-bearing fields for the AI prompt. Other fields use defaults. |
| **NEW** — 10-Q editor section | — | doesn't exist | **ADD.** Renders all 10 questions as collapsible cards with current answer pre-selected. Tap any card to edit. Per Hassan's spec: "post-redesign profile screen shows ALL 10 questions as editable." |

## Section D — AI prompt builder (`pickItemsForRoom` and `buildRoomFromDraft`)

| Surface | Path | Current | Action |
|---|---|---|---|
| `buildRoomFromDraft(styleOverride, colorOverride)` | `app.js:4000-4031` | Reads `profile.styles`, `profile.colors`; builds room with `styles` + `colors` arrays on each version | **REWRITE SIGNATURE.** New: `buildRoomFromDraft(answersOverride)`. Reads `profile.answers`; passes the full 10-answer object into `pickItemsForRoom`. The version snapshot stores `answers` (so reshuffle/rerun works). |
| `pickItemsForRoom(draft, styleIds, colorIds, budgetVal, opts)` | `app.js:4043` | Scores items by style-set hit + color-set hit + random + anchor-color closeness; budget-caps; slot-fills | **REWRITE.** New signature: `pickItemsForRoom(draft, answers, opts)`. Translates `answers` into scoring weights via a new `deriveScoringWeights(answers)` helper that maps: `vibe` → mood multiplier, `color_appetite` → palette intensity bias, `materials` → material-tag boost, `decor_density` → number-of-decor-extras cap, `scope` → which slot-types to fill, `room_use` → functional bias, `avoid` → negative penalty per matching tag, `dealbreaker.text` → text-match boost on item names. |
| Reshuffle pick | `app.js:4847` | `pickItemsForRoom(draftLike, profile.styles, profile.colors, profile.budget, ...)` | Update to new signature: `pickItemsForRoom(draftLike, profile.answers, ...)` |
| Swap pick | `app.js:4803` | Same call pattern | Update to new signature. |
| Room version snapshot | `app.js:4022-4028` | `{styles, colors}` recorded on v1 | Replaced with `{answers}` snapshot. Legacy `styles/colors` fields kept blank/optional during transition. |
| **NEW** — `buildAIPrompt(answers, draft)` | doesn't exist | — | **ADD.** Single function that produces the prompt string passed to the (future) Replicate-backed AI. Skeleton from spec: *"Generate an interior redesign with [vibe] feeling, using a [color_appetite] palette dominated by [materials]. Decoration density: [decor_density]. Redesign scope: [scope]. Lighting strategy: [natural_light]. Optimize for [budget_tier] price tier. Room is primarily used for [room_use]. AVOID: [avoid items]. PRESERVE: [dealbreaker_element if specified]."* Per Hassan's spec: **NEVER** insert literal style names like "Mid-Century Modern" or "Scandinavian" — style emerges from vibe+color+materials. The function is called now (logs the resulting prompt to `state._lastAIPrompt`) so the future backend can wire to it without a refactor. |
| `window.STYLES` | `furniture.js:4-20` | 15 style ids + labels | **KEEP for catalog filtering.** Items still tagged with style IDs in `FURNITURE_DB`. The picker still reads those tags, just maps from `answers.materials/vibe` rather than `profile.styles`. The styles list is no longer surfaced in onboarding/prefs. |
| `window.COLOR_MOODS` | `furniture.js:22-31` | 8 color-mood ids + labels + hex | **KEEP for catalog filtering.** Items tagged with color-mood IDs. Picker maps from `answers.color_appetite` to a derived set of color-mood IDs (e.g. "neutrals_only" → `['warm','neutral','whites']`). |

## Section E — First-redesign tutorial (TUTORIAL_STEPS)

| Surface | Path | Current | Action |
|---|---|---|---|
| TUTORIAL_STEPS const | `app.js:3749-3775` | 3 steps: `#stylesGrid`, `#colorsGrid`, `.budget-card` | **REWRITE.** New 3 steps point at the new prefs sections: (a) the Q1 vibe card, (b) the Q7 materials card, (c) the budget slider (still the centerpiece, unchanged emphasis). Spec said "first-redesign tutorial that highlights the budget slider stays — verify the tutorial copy references the new question IDs." This is the verification: copy needs rewriting, but the budget step's selector + emphasis stays. |
| Tutorial step body copy | same | "These chips shape every redesign...", "The vibe of the room..." | **REWRITE.** New copy points at the new sections. Budget step copy unchanged ("This is the most important one. Drag it to your real budget so the prices match.") |

## Section F — Skip-quiz and default flow

| Surface | Path | Current | Action |
|---|---|---|---|
| `skipQuizBtn` handler | `app.js:1083-1097` | Sets `p.styles = ['modern','scandinavian','minimalist']` + tracks `setup_style_selected{source:'skip_default'}` + routes to capture | **REWRITE.** Per Hassan: skipping at any question → AI fills in defaults. The button now applies the 10 specific defaults (vibe→calm_grounded, color_appetite→mostly_neutral, etc. per spec). Tracks `onboarding_skipped_full`. Same route to capture. |
| Per-question skip button | `app.js:1107-1113` (`quizNoneBtn` handler) | Pushes `-1` to answers, advances | **REWRITE.** New: writes the per-question default to `state.quiz.answers[qid]`, sets `state.quiz.skippedAt[qid] = true`, advances. Tracks `onboarding_question_skipped`. Skip button gets the 1.5s reveal delay per spec. |

## Section G — Analytics events

### Events to RETIRE
- `setup_style_selected` (fires from `finishQuiz` and `skipQuiz`) — no styles array anymore.
- `quiz_question_answered` (referenced in `optimization/13_instrumentation.md` as "to add" — never landed in code; nothing to remove).
- `quiz_completed`, `quiz_skipped`, `quiz_back_clicked`, `quiz_started` — same: doc-only, nothing in code yet.

### Events to RENAME (per spec)
- `setup_style_selected` → migrated semantically. The new flow doesn't fit a single setup-style event; instead, the per-question events below capture the granular signal.

### NEW events (per spec)
- `onboarding_question_viewed { question_id, question_index }` — fires on each question's first paint.
- `onboarding_question_answered { question_id, answer_value, time_to_answer_ms }` — fires on selection (single) or Continue tap (multi).
- `onboarding_question_skipped { question_id }` — fires on Skip-button tap per question.
- `onboarding_completed { total_questions_answered, total_skipped, total_time_ms }` — fires from `finishQuiz`.
- `onboarding_skipped_full { from_question_index }` — fires when the global Skip-quiz button on the intro is tapped, OR when the per-question Skip is tapped from Q1 (full bail).
- `preferences_edited_post_redesign { question_id, old_value, new_value }` — fires when the post-redesign prefs editor changes any answer.

### Events KEPT unchanged
- `setup_photo_uploaded`, `setup_room_type_selected`, `setup_complete` — capture-flow events, not onboarding-question events.
- `aha_first_results`, `aha_quality_signal`, `habit_second_room` — activation milestone events.
- `tutorial_started`, `tutorial_step_viewed`, `tutorial_completed`, `tutorial_skipped` — tutorial lifecycle.

## Section H — `furniture.js` data layer

| Surface | Action |
|---|---|
| `window.QUIZ` (`furniture.js:387-428`) | **REPLACE.** New `window.QUIZ` is the 10-question array with full metadata: id, type, ai_param, headline, subhead, options[], image_hints, default. |
| `window.QUIZ_SVGS` (`furniture.js:431+`) | **MOSTLY KEEP.** The 4-question quiz only used a few SVGs (wall-plain, wall-few, etc.). Most QUIZ_SVGS entries are reusable as fallback icons for the new questions where `IMAGE_HINT: not required, can use icons`. New SVGs added for: lighting (sun / window / moon), room-use (bed / desk / dinner / aspirational), avoid markers (circle-slash overlays). Unused SVGs flagged for cleanup but not deleted (low risk, future use possible). |
| `window.STYLES` | **KEEP** — used by `pickItemsForRoom` catalog filtering + Style Pulse weekly drop. |
| `window.COLOR_MOODS` | **KEEP** — used by `pickItemsForRoom` catalog filtering. |
| **NEW** `window.ONBOARDING_QUESTIONS` config file | **ADD.** Per Hassan's spec: "Images should be swappable via a config file — don't hardcode image references inside components." This becomes the single source of truth for the 10 questions, their option image paths, defaults, and AI param mapping. Living next to `window.QUIZ` in `furniture.js` keeps it co-located with other static config. |

## Section I — State + persistence

| Concern | Current | Action |
|---|---|---|
| Anonymous-pre-signup persistence | `state.profiles[].styles/colors/budget` saved to `localStorage` via `save()` on each chip toggle / slider input | **KEEP MECHANISM.** New: `state.profiles[].answers[qid] = value` saved on each selection. Skip-with-default fills the matching answer with the default value before save. |
| Sign-up migration | Auth-flow rebuilds `state.user` (preserving `generationsUsed`, `isPro`, `firstRedesignTutorialSeen`) but profiles are independent. `profile.answers` lives on the profile object, untouched by auth-rebuild. | **NO CHANGE NEEDED** to auth flow. The profile-with-answers persists across signin because profiles aren't touched by the auth-state rebuild. |
| Supabase sync | `profiles` table currently stores `styles, colors, custom_colors, budget` columns | **DEFERRED MIGRATION.** When the real backend lands, add `answers jsonb default '{}'::jsonb` column; the `profileToRow`/`rowToProfile` mappers in `supabase-client.js` need updating to write `answers` and read it back. Flag in DEFERRED.md. The legacy columns can stay during transition. |
| Editable post-redesign | Profile prefs page currently re-renders the same chip grids that were used in the quiz | **KEEP PRINCIPLE.** Post-redesign edit uses the same per-question card UI as the quiz, just rendered in collapsed-list form on the prefs screen. Tap a card to expand + change. |

## Section J — Q10 dealbreaker followup (the spatial-marking decision)

Q10 has a follow-up screen if the user picked any option except "Nothing." Hassan's spec offers two options:
- **(a)** Tap-to-mark on their uploaded photo (preferred — gives the AI exact spatial anchoring)
- **(b)** Text description fallback

The catch: at the time Q10 is asked, the user **may not have uploaded a photo yet** because the quiz runs BEFORE capture (`finishQuiz` → `prepareCapture` → user uploads photo). So tap-to-mark requires either (i) deferring the Q10 followup until after the photo is captured, or (ii) reordering the flow to capture-photo-first-quiz-second.

**My recommendation: ship text-only for now (option b), defer spatial-marking to a future enhancement.** Reasoning:

1. Reordering capture-before-quiz is a bigger change than the audit covers — it ripples into the D7 reveal-gate timing, the tutorial trigger logic, and the lifecycle-banner-on-home reflow. Out of scope for this pass.
2. The spatial-marking version requires real implementation work (canvas-based marker UI, hit-testing against draft.photo dims, persisting marker coordinates) that's a half-day of work in itself.
3. Text-only still feeds the AI a meaningful preserve directive ("preserve the walnut sideboard against the south wall"). The model can do its own spatial reasoning from the photo + that text.

**Plan:** Q10 followup screen ships with a text input + character cap (~120 chars) + "Skip — full creative freedom" button. Stash `answers.dealbreaker = { kind, text }`. Flag spatial-marking in DEFERRED.md as the future enhancement with the existing `state.draft.photo` as the canvas source once capture-before-quiz is reordered (or an alternative capture-during-quiz interstitial is added).

## Section K — Conflicts the audit caught

### CONFLICT 1 — Custom-colors removal
The current preferences screen lets users add hex accents via `<details>` expander. Spec doesn't include this in the new 10 questions. **My recommendation:** remove the UI, archive the field on existing profiles (don't delete data), flag in DEFERRED.md as a future Pro feature ("advanced palette: pick exact hex accents"). Per Hassan's tone (Pro = depth features), this fits. **Decision needed:** confirm removal is OK, or want it kept as a sub-section in the 10-Q editor.

### CONFLICT 2 — `keepExisting` boolean lives on after `scope` question
Q4 (scope) has 4 options; "just_furniture" maps cleanly to the old `keepExisting: true`. The other 3 don't. The results-screen `keepExistingSwitch` toggle currently lets users override mid-redesign. **My recommendation:** the toggle stays as a results-screen control (room-level override), and the new `answers.scope` is the *initial* value the toggle defaults to. Mapping: `scope === 'just_furniture'` → `keepMode = true` initially; other scopes → false. **Decision needed:** confirm this mapping is right.

### CONFLICT 3 — Tutorial coachmarks now point at NEW question IDs
Spec says: "verify the tutorial copy references the new question IDs and doesn't reference removed fields." The tutorial currently points at `#stylesGrid`, `#colorsGrid`, `.budget-card`. Under the new prefs editor, the new selectors will be e.g. `[data-q-id="vibe"]`, `[data-q-id="materials"]`, `.budget-card`. **My recommendation:** rewrite the 3 tutorial steps to point at vibe + materials + budget — these are the 3 most user-comprehensible levers. **Decision needed:** confirm vibe + materials + budget is the right trio (vs. e.g. color_appetite + materials + budget).

### CONFLICT 4 — Q10 spatial-marking deferred (already detailed in §J above)
Decision needed: confirm text-only ships now and spatial-marking is DEFERRED.md.

### CONFLICT 5 — `pickItemsForRoom` is the JS-only catalog picker, NOT the AI generation backend
Important framing: there is no real AI backend yet. `pickItemsForRoom` is a deterministic JS picker that scores items in `FURNITURE_DB`. The `buildAIPrompt(answers, draft)` function called out in Section D is **scaffolding** — its output is logged to `state._lastAIPrompt` for future backend wiring. The actual visible result on the results screen still comes from `pickItemsForRoom`. **My recommendation:** wire both. The picker gets the new answer-driven scoring; the prompt builder's output gets logged + analytics-tracked for future use. **No decision needed unless you want one or the other only.**

### CONFLICT 6 — Style Pulse / Use Template flows still use `profile.styles`
The Style Pulse weekly drop uses `THIS_WEEK_CONFIG.styleId` and `useTemplateFromCard()` reads `THIS_WEEK_CONFIG.styleId` directly (not `profile.styles`). However the `pickItemsForRoom` call at the end of that flow needs answers. **My recommendation:** when a Use Template click fires, synthesize a transient answer set from the template's metadata: `{vibe: <derived from style-mood map>, color_appetite: 'mostly_neutral', materials: <derived>, scope: 'whole_room'}` and merge it with the user's `profile.answers` for the catalog pick. The template's *style* doesn't pollute the user's profile — only the per-room generation. **Decision needed:** confirm this hybrid approach is right.

### CONFLICT 7 — Multiple legacy profile-creation paths write the old shape
`app.js:248,722,836` all create profile objects with the legacy field set. **My recommendation:** unify on one factory function `createProfile(name)` that returns the new shape. The two duplicate paths at 722 and 836 look like dead code (one writes `budget: 'mid'` which isn't even valid under the current slider model — string vs. number) — flag for deletion during the migration. **No decision needed; proceeding with cleanup unless flagged.**

### CONFLICT 8 — Capture flow's `state.draft.styleOverride` and `colorOverride`
`startFromTemplate` writes `state.draft.styleOverride` and `colorOverride`, then `buildRoomFromDraft` reads them. Under the new model these become `state.draft.answersOverride: { vibe, color_appetite, materials, ... }`. **My recommendation:** rename + reshape during the implementation. **No decision needed.**

---

## Files touched (preview)

| File | Sections affected |
|---|---|
| `furniture.js` | A (defaults), G (analytics), H (window.QUIZ replace + new ONBOARDING_QUESTIONS config) |
| `app.js` | A (state shape), B (renderQuizStep + finishQuiz + selectQuizOption), C (preferences renderer), D (buildRoomFromDraft + pickItemsForRoom + new buildAIPrompt), E (TUTORIAL_STEPS), F (skip handlers), G (analytics events), I (validation + persistence) |
| `index.html` | B (quiz-intro + quiz screens markup), C (preferences screen markup) |
| `styles.css` | New rules for: per-question render variants (single-tile / multi-tile / image-tile / color-swatch), Q9 exclusive-option visual state, Q10 followup text input, post-redesign 10-Q editor cards, image-placeholder slot styling |
| `DEFERRED.md` | Q10 spatial-marking + custom-colors-as-Pro + Supabase `answers jsonb` migration |
| `CHANGES_APPLIED.md` | Migration log appended |
| Optionally: `MONETIZATION_AUDIT.md`, `MONETIZATION_PROPAGATION_AUDIT.md` | Stale references to `profile.styles`/`colors` should be left as historical archives (per existing rule). |

---

## Implementation order (locked when you approve)

1. **Layer 1 — Data layer.** Add `window.ONBOARDING_QUESTIONS` to `furniture.js` with the 10-Q config + defaults + image-asset slots. Replace `window.QUIZ` to point at the same source (or alias `window.QUIZ = window.ONBOARDING_QUESTIONS` for back-compat).
2. **Layer 2 — State + profile shape.** `createProfile()` factory. Migrate any read of `profile.styles/colors` to a fallback chain: `profile.answers ?? profile.styles?.length ? deriveAnswersFromLegacy(profile) : DEFAULTS`. Cleanup the dead-code profile-creation paths.
3. **Layer 3 — Quiz renderer.** Rewrite `renderQuizStep`, `selectQuizOption`, `recordAnswer`, `finishQuiz`, `skipQuizBtn` handler, per-question Skip handler. Add Q10 followup screen render.
4. **Layer 4 — AI prompt builder.** Add `deriveScoringWeights(answers)` helper + `buildAIPrompt(answers, draft)` function. Rewrite `pickItemsForRoom` signature.
5. **Layer 5 — Preferences screen.** Replace chip grids with the 10-Q editor. Keep budget slider + profile photo/name section. Wire `preferences_edited_post_redesign` event.
6. **Layer 6 — Tutorial.** Rewrite `TUTORIAL_STEPS` to point at vibe/materials/budget. Verify selectors match new prefs markup.
7. **Layer 7 — Analytics.** Add new events. Retire `setup_style_selected`.
8. **Layer 8 — Validation + skip flows.** Skip-button reveal-after-1.5s timer. Q9 exclusive-option logic. Q7 max-2 enforcement.
9. **Layer 9 — Image placeholders + config.** Verify the placeholder slot renders cleanly when image paths are missing. Document the swap-images-via-config pattern.
10. **Layer 10 — Sweep.** Confirm zero remaining reads of `profile.styles`, `profile.colors`, `profile.customColors` outside of legacy-migration code paths.
11. **Layer 11 — Docs.** Append migration log to `CHANGES_APPLIED.md`. Update DEFERRED.md with Q10 spatial-marking + Supabase migration + custom-colors-as-Pro entries.

---

## Stop point

This file = STEP 1 deliverable. **Awaiting your review.**

Specifically I need:
- Confirmation or override of any item in Sections A–J
- Resolution of the 8 conflicts in Section K (5 require explicit decisions: 1 custom-colors removal, 2 keepExisting mapping, 3 tutorial trio, 4 Q10 spatial deferred, 6 Use Template hybrid)
- Any item I missed

Once approved, I'll execute Layers 1–11 in order, run STEP 4 sweep, and append migration log to `CHANGES_APPLIED.md`.
