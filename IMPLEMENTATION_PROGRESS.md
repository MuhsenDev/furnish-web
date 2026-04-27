# IMPLEMENTATION_PROGRESS.md — 10-Q Onboarding Migration

**Status: ALL 11 LAYERS COMPLETE.** Audit-then-approved-then-implemented per Hassan's protocol.

**Spec:** `ONBOARDING_AUDIT.md` (approved 2026-04-26).
**Predecessor:** prior 4-Q style quiz (kept as historical reference in `MONETIZATION_AUDIT.md` archived).

---

## Approved decisions (from Step 2)

1. **Custom-colors:** kept as future Pro feature. DOM preserved (hidden), `profile.customColors` field intact, JS handlers null-guarded.
2. **`keepExisting` mapping:** `scope === 'just_furniture'` → initial `keepMode = true`. Results-screen toggle stays as override.
3. **Tutorial coachmark trio:** **vibe + materials + budget**. (color_appetite dropped — already engaged with in Q2.)
4. **Q10 spatial-marking:** text-only ships now; spatial-marking deferred per CONFLICT 4.
5. **Use Template hybrid:** `synthesizeAnswersFromTemplate(t)` produces transient answers, merged with profile.answers for the catalog pick. Saved profile NOT mutated.

Self-resolved (approved as-is):
- Legacy duplicate profile-creation paths cleaned up (`createProfile()` factory).
- `pickItemsForRoom` is JS-side scaffolding; `buildAIPrompt(answers, draft)` is the future Replicate-bound function.
- `state.draft.styleOverride/colorOverride` retired.

---

## Layer 1 — Data layer

**`furniture.js`**
- ✅ Added `window.ONBOARDING_QUESTIONS` constant — 10 questions with full metadata (id, type, ai_param, headline, options[], default, image_kind, max_selections, exclusive_option_id, followup config).
- ✅ Q9 `avoid` declared with `exclusive_option_id: 'nothing'` so the renderer enforces "Nothing — show me anything" as deselecting all others.
- ✅ Q10 `dealbreaker` declared with `followup.mode: 'text'` per CONFLICT 4 (spatial-marking deferred to DEFERRED.md).
- ✅ Backward-compat alias: `window.QUIZ = window.ONBOARDING_QUESTIONS;` for any straggler readers (Layer 10 sweep verified zero).
- ✅ `window.STYLES` and `window.COLOR_MOODS` kept untouched — used by the catalog picker, not by onboarding.

**Reforge framework citations baked into the code comments:**
- User Psychology (Loewenstein information-gap) — front-loaded fun questions create curiosity carrying through practical ones.
- Progressive disclosure — multi-select questions show the cap inline.
- Anchoring — Q6 `dream_first` option signals aspirational quality without locking pricing.
- Loss aversion — Q9 negative-prompts let users articulate what they DON'T want.

## Layer 2 — State + profile shape

**`app.js`** added 7 helpers + 1 boot hook:
- ✅ `ONBOARDING_DEFAULTS()` — reads `q.default` from each question. Single source of truth for defaults.
- ✅ `createProfile(name, opts)` — factory returning the new profile shape: `{id, name, avatar, answers, budget, styles, colors, customColors, keepExisting, seenFinale}`. Replaces 3 inline profile-creation paths at `app.js:248,722,836` (the latter two of which wrote `budget: 'mid'` — broken under the slider model).
- ✅ `getEffectiveAnswers(profile)` — read-with-fallback; never returns undefined for any question id.
- ✅ `deriveStylesFromAnswers(answers)` — catalog-bridge: maps `vibe + materials` → `window.STYLES` IDs.
- ✅ `deriveColorsFromAnswers(answers)` — catalog-bridge: maps `color_appetite` → `window.COLOR_MOODS` IDs.
- ✅ `migrateLegacyProfileToAnswers(profile)` — backfills `profile.answers` from legacy `profile.styles` heuristics (idempotent).
- ✅ `migrateAllProfiles()` — boot-time migration over `state.profiles`. Wired into `boot()`.
- Public surface: `window.FurnishCreateProfile = createProfile;`

## Layer 3 — Quiz renderer

**`index.html`** — quiz screens rebuilt internally:
- ✅ `<section data-screen="quiz-intro">` — badge updated to "10 questions · ~90 seconds"; skip CTA copy clarifies "AI fills in defaults."
- ✅ `<section data-screen="quiz">` — added `#quizSubhead`, `#quizProgressDots`, `#quizMultiActions` (counter + Continue), revised `#quizNoneBtn` with `data-revealed` attribute for the 1.5s reveal delay.
- ✅ NEW `<section data-screen="quiz-dealbreaker">` — Q10 followup screen with text input, char counter (0 / 120), Continue button, Skip button.

**`app.js`** — quiz logic completely replaced:
- ✅ `state.quiz` shape: `{ profileId, step, answers, viewedAt, skippedAt, pendingMulti, startedAt }`.
- ✅ `openQuizIntro(profileId)` rewritten — no more `scores` map; `answers` keyed by question ID.
- ✅ `renderQuizStep()` — paints headline, subhead, dot progress, options grid by `image_kind`, multi-select Continue, skip-button-reveal-after-1.5s timer.
- ✅ `handleSingleSelectTap(q, opt, btn)` — single-select advance with 240ms debounce.
- ✅ `handleMultiSelectTap(q, opt, btn)` — multi-select toggle + cap enforcement + Q9 exclusive-option logic.
- ✅ `updateMultiCounter(q)` — repaint counter + Continue-disabled state.
- ✅ `advanceQuiz()` — step++ or finishQuiz when at end.
- ✅ `openDealbreakerFollowup(kind)` — routes to `quiz-dealbreaker` screen with placeholder text per chosen kind.
- ✅ `finishQuiz()` — merges answers with defaults; writes to `profile.answers`; derives legacy bridge fields (`styles`, `colors`, `keepExisting`); sets `seenFinale`; logs the AI prompt to `state._lastAIPrompt`; plays finale; routes to capture.
- ✅ Skip handlers: global `#skipQuizBtn` applies all defaults; per-question `#quizNoneBtn` applies single default + records `skippedAt[qid]`.
- ✅ Q10 followup wiring: `#dealbreakerBackBtn`, `#dealbreakerInput` (input event for char count), `#dealbreakerContinueBtn`, `#dealbreakerSkipBtn`.

## Layer 4 — AI prompt builder + pickItemsForRoom rewrite

**`app.js`** — the core inference layer:
- ✅ NEW `buildAIPrompt(answers, draft)` — single source of truth for the prompt string. NEVER includes literal style names per spec; style emerges from vibe + color + materials. Currently logs to `state._lastAIPrompt`; future Replicate-backed backend wires here without refactor.
- ✅ NEW `synthesizeAnswersFromTemplate(t)` — CONFLICT 5 helper; produces a partial answers object from template metadata. Used by `applyCollection()` and `startFromTemplate(t)` calls — saved profile NOT mutated.
- ✅ NEW `deriveScoringWeights(answers)` — bridge between answers and the catalog picker's scoring inputs.
- ✅ `buildRoomFromDraft(answersOverride)` — rewritten signature. Reads `getEffectiveAnswers(profile)`, optionally merges `answersOverride` (Use Template path). Stores `answers` on `room` AND on `room.versions[0]` for reshuffle/rerun reproducibility. Stores `aiPrompt` on the version snapshot for debugging.
- ✅ `pickItemsForRoom(draft, answers, budgetVal, opts)` — rewritten signature. Replaces `(styleIds, colorIds, ...)`. Internal scoring uses `deriveScoringWeights`. NEW: Q3 `decor_density` controls extras-cap (clean→0, a_little→1, lived_in→3, maximalist→5). NEW: Q9 `avoid` IDs map to per-style + per-color penalties.
- ✅ Call sites updated: `buildRoomFromDraft()` paths in analyzeBtn + `startFromTemplate`; `pickItemsForRoom` paths in `keepExistingSwitch` toggle + reshuffle + swap.

## Layer 5 — Preferences screen 10-Q editor

**`index.html`** — preferences markup:
- ✅ Removed `<h3>Styles</h3> <div id="stylesGrid">` and `<h3>Color Moods</h3> <div id="colorsGrid">` and the chip-grid versions.
- ✅ Added `<h3>Your answers</h3> <div id="answersEditor">` — the new collapsible 10-Q editor target.
- ✅ Custom-color `<details>` block hidden via `hidden` attribute. Preserved in DOM per CONFLICT 1 (future Pro feature).

**`app.js`** — replaced chip-grid renderers with the answers editor:
- ✅ NEW `renderAnswersEditor(profile)` — builds 10 cards from `window.ONBOARDING_QUESTIONS`.
- ✅ NEW `buildAnswerCard(q, profile)` — single accordion card with summary (current selection) + collapsible detail (option grid).
- ✅ NEW `paintAnswerCardSummary(card, q, profile)` — paints the current-answer label.
- ✅ NEW `paintAnswerCardDetail(card, q, profile)` — paints the option grid + Q10 followup textarea + multi-select counter.
- ✅ NEW `handleAnswerCardTap(card, q, opt, profile)` — handles both single + multi + followup; fires `preferences_edited_post_redesign` analytic.
- ✅ `openPreferences(profileId)` rewired to call `renderAnswersEditor(p)` instead of the old chip grids.
- ✅ `savePrefsBtn` validation rewritten: requires `answers.vibe + answers.materials.length + answers.budget_tier`. Re-derives legacy bridge fields after save.
- ✅ Public surface: `window.FurnishRenderAnswersEditor`.
- ✅ `renderColorChips()` and `renderCustomColorList()` null-guarded so they're inert when their DOM elements are gone.

## Layer 6 — Tutorial

**`app.js:TUTORIAL_STEPS`** rewritten per CONFLICT 3:
- ✅ Step 1 (`vibe`) — selector `.answer-card[data-q-id="vibe"]`. Title "Your vibe".
- ✅ Step 2 (`materials`) — selector `.answer-card[data-q-id="materials"]`. Title "Your materials".
- ✅ Step 3 (`budget`) — selector `.budget-card`. **Centerpiece preserved (`emphasized: true`).** Same copy: "Drag this to match your real budget."
- ✅ Per CONFLICT 3: `color_appetite` removed from the trio because the user already engaged with it pre-redesign in Q2.

## Layer 7 — Analytics

**`app.js`** event renames + retirements:
- 🗑️ Retired: `setup_style_selected` (the `ACTIVATION.SETUP_STYLE` constant deleted; no callers remain).
- ✅ NEW: `onboarding_question_viewed { question_id, question_index }` — fires from `renderQuizStep` on first paint.
- ✅ NEW: `onboarding_question_answered { question_id, answer_value, time_to_answer_ms }` — fires from `handleSingleSelectTap` + `quizContinueBtn` (multi) + `dealbreakerContinueBtn` (Q10 followup).
- ✅ NEW: `onboarding_question_skipped { question_id }` — fires from `quizNoneBtn` + `dealbreakerSkipBtn`.
- ✅ NEW: `onboarding_completed { total_questions_answered, total_skipped, total_time_ms, total_questions }` — fires from `finishQuiz`.
- ✅ NEW: `onboarding_skipped_full { from_question_index }` — fires from `skipQuizBtn` (global skip from intro).
- ✅ NEW: `preferences_edited_post_redesign { question_id, old_value, new_value }` — fires from `handleAnswerCardTap`.

Existing events untouched: `signup_started`, `setup_photo_uploaded`, `setup_room_type_selected`, `setup_complete`, `aha_first_results`, `aha_quality_signal`, `habit_second_room`, `tutorial_*`, `pro_action_*`, etc.

## Layer 8 — Skip flows + validation

- ✅ Skip-button reveal-after-1.5s wired in `renderQuizStep` (clears prior timer, sets `data-revealed='false'` on each render, flips to `'true'` after 1500ms).
- ✅ CSS `.quiz-none-btn[data-revealed="false"] { opacity: 0; pointer-events: none; }` enforces the timing visually + functionally.
- ✅ Q9 exclusive-option logic in `handleMultiSelectTap` — picking 'nothing' deselects others; picking any other deselects 'nothing'.
- ✅ Q7 max-2 enforcement in `handleMultiSelectTap` — `while (next.length > cap) next.shift();` drops oldest pick when over cap.
- ✅ Multi-select Continue button disabled when 0 picks (`updateMultiCounter`).
- ✅ Back-navigation in quiz pops the prior answer + viewed timestamp + skip flag from `state.quiz` so re-paint re-fires the `onboarding_question_viewed` event.

## Layer 9 — Image placeholders + config

- ✅ Renderer falls back to a clean placeholder slot when `opt.image == null`. Visual treatment: subtle brand-brown gradient + dashed border + small SVG icon. Per spec: "Hassan should be able to drop in images by editing one config."
- ✅ Image references live ONLY in `window.ONBOARDING_QUESTIONS[*].options[*].image`. No image paths hardcoded in components.
- ✅ Each option also has `svg:` for icon-driven questions (Q4 scope, Q5 light, Q8 use, Q9 avoid, Q10 dealbreaker). Renderer picks `image` first, then falls back to `svg`, then to `defaultPlaceholderSvg()`.
- ✅ CSS `.qoc-photo--placeholder` styled with `data-image-pending="true"` attribute — easy to target for "show placeholder badge" UX if desired later.

## Layer 10 — Sweep

Walked the codebase for stale references:
- ✅ Zero call sites of `gateGeneration` (the prior 2-lifetime-quota gate). All use `routeGenerationByModelTier`.
- ✅ Zero call sites of `pickItemsForRoom(draft, styleIds, colorIds, ...)` legacy signature. All updated.
- ✅ Zero reads of `profile.styles` or `profile.colors` outside the catalog-bridge code paths (`deriveStylesFromAnswers`, `deriveColorsFromAnswers`, lifecycle banner fallback, the catalog picker itself).
- ✅ `window.QUIZ` only referenced via the alias `= window.ONBOARDING_QUESTIONS`. Layer 1 alias keeps any future straggler readers safe.
- ✅ The two intentional `#colorsGrid` / `#customColor` references are inside the now-null-guarded preserved-for-Pro functions.

## Layer 11 — Docs

- ✅ `DEFERRED.md` — added new section **Pro feature backlog** with three entries:
  1. Custom palette / hex color picker (CONFLICT 1)
  2. Q10 spatial-marking on uploaded photo (CONFLICT 4)
  3. Supabase migration — `answers jsonb` column
- ✅ `IMPLEMENTATION_PROGRESS.md` (this file) — full migration log.

---

## Verification checklist (per ONBOARDING_AUDIT spec)

- [x] All 10 questions render in the new flow, in spec order
- [x] Q1–Q5 single-select with 240ms tap-debounce auto-advance
- [x] Q6 budget_tier `dream_first` option does NOT lock pricing
- [x] Q7 multi-select max 2 enforced; counter visible; Continue button drives advance
- [x] Q8 single-select
- [x] Q9 multi-select max 3 with `nothing` exclusive (deselects + is deselected by others)
- [x] Q10 single-select with text-only followup screen (spatial-marking deferred per CONFLICT 4)
- [x] Skip button reveals 1.5s after each question loads
- [x] Per-question skip applies that question's default, advances
- [x] Global skip on intro applies ALL defaults, routes to capture
- [x] Back navigation preserves prior answers; clears the answer being re-viewed so analytics re-fire
- [x] All 10 questions editable post-redesign in profile preferences
- [x] First-redesign tutorial points at vibe + materials + budget cards (budget centerpiece preserved)
- [x] AI prompt never includes literal style names — emerges from vibe + color + materials
- [x] Use Template path synthesizes transient answers, merges with profile.answers, never overwrites saved profile
- [x] All 6 new analytics events fire as specified
- [x] `setup_style_selected` retired
- [x] Image placeholders work with null image paths; swappable via single config edit
- [x] Quiz finale animation still fires on completion + first-time prefs save
- [x] Custom-color picker preserved in DOM (hidden) for future Pro feature

---

## Surface area for future backend wiring

When the real Replicate-backed AI generation backend lands:
1. Replace the `state._lastAIPrompt` log inside `finishQuiz` and `buildRoomFromDraft` with a fetch POST to the backend's generation endpoint.
2. The endpoint receives the prompt string from `buildAIPrompt(answers, draft)` plus the model tier from `currentModelTier()` (compute-quality routing — see CHANGES_APPLIED.md).
3. No client refactor required beyond the call-site swap.

When Supabase schema migration lands:
1. Add `answers jsonb default '{}'::jsonb` column to `profiles`.
2. Update `profileToRow` / `rowToProfile` in `supabase-client.js`.
3. Run `migrateLegacyProfileToAnswers(profile)` after deserializing rows.

---
---

# Batch 1 — Dim 09 Content & Copy + Dim 10 Trust & Credibility + Dim 14 Edge Cases

**Date:** 2026-04-26
**Source audit:** `BATCH_1_AUDIT.md` (47 proposed changes; 30 unblocked + 12 conflict-blocked at audit time, all unblocked by Hassan's same-day decisions)
**Conflicts resolved:** 1, 2, 3, 4, 9 (see `CONFLICTS_RESOLVED.md`)
**Conflicts still open:** 5, 6, 7, 8 (later batches)

## Decisions locked in this batch

- **OKT (One Key Takeaway):** *"Your household, your style, sharper."* Stored as `FURNISH_OKT` in `app.js`. Cross-referenced in `CLAUDE.md` and `VOICE.md`.
- **Brand personality words:** Concrete, Confident, Warm, Calm. Locked in `VOICE.md`.
- **Hard rules (locked permanent):** No fake numbers (Rule 1, Conflict 4). No calendar-period language in user copy (Rule 2, Conflict 1). Promise-Fit (Rule 3, Conflict 9).
- **Referral currency:** "5 HD redesigns + 2 style packs over 90 days" replaces "1 month Pro free" (Conflict 2). Backend redemption ledger spec'd in `DEFERRED.md`.
- **Pro card vaporware:** Multi-room batch + Style learns over time **removed** from visible bullets, moved to opt-in roadmap modal in paywall footer (Conflict 3).
- **Welcome time microcopy:** "About a minute — sit tight." replaces "~30 seconds" (Conflict 9). Hero retains "Watch any room transform" but drops the "20 seconds" claim — replaced with experiential framing.
- **Solo-founder copy:** "Built by Hassan." (NC-3, Hassan confirmed solo founder per ABOUT_FURNISH.md).

## Files changed in Batch 1

| File | Lines changed | Summary |
|------|---------------|---------|
| `index.html` | ~80 (many small edits) | Welcome tagline + subtext + qualitative trust strip; D7 reveal-gate trust strip; rooms empty state; affiliate disclosure V2 with custom SVG lightbulb; wishlist empty state HTML fallback; share modal referral note (new credit-pack currency); paywall sub + paywall card stars + Pro bullets (cut 2 vaporware) + roadmap link in footer; photo tip card on capture; Different Style? CTA on reveal; new Roadmap modal + Different Style modal markup |
| `app.js` | ~280 lines added/changed | Sign-in failed copy; welcome toast `!` removal (2 sites); FAQ toast `!`; FREE_PLAN_CARD footer; PAYWALL_COPY (cut 2 vaporware contexts, rewrote `generic`); Pick image / Image too large errors; new `FURNISH_OKT` constant; `RETAILER_SEARCH` map + `isHomepageStub` + rewrote `buildAffiliateUrl` with search-fallback + analytics; `FIT_WARN_SVG` + `fitWarningCopy` for "may not fit" rewrite; Aha Off-vote 24h soft-avoid + picker integration in `pickItemsForRoom`; reshuffle toast honesty; wishlist empty in JS render; live counter rotation rewrite (cut 4 fictitious variants → 4 positioning claims); activation lifecycle banner copy (no calendar-period language); paywall roadmap modal wiring; photo tip card config (`PHOTO_TIP_CONFIG`) + render; Different Style modal handlers (`openStylePivotModal`, `pivotToStyle`); localStorage quota `pruneState` + `safeSave` wrapper; wishlist orphan `gcOrphanedWishlist`; camera fallback timer; HTTPS-context detection banner; analyze double-tap single-flight guard; native share fallback `FurnishShare`; sign-out state snapshot + restore prompt; multi-device tier conflict softening (3s defensive re-pull); picker under-populated 20% budget retry + `picker_underpopulated` event; bottom-sheet fit warning de-emoji'd; share caption de-emoji'd |
| `styles.css` | +270 lines | New "BATCH 1 — Dim 09/10/14" section: `.welcome-proof .wp-claim`, `.affiliate-disclosure-v2` family, `.photo-tip` family, `.reveal-actions-row` + `.different-style-btn`, `.different-style-card` + `.different-style-grid` + `.different-style-chip`, `.paywall-footnote-sep` + `.paywall-roadmap-link` + `.paywall-roadmap-card` family, `.insecure-context-banner`, `.upload-recommended` hook |
| `CLAUDE.md` | +12 lines | OKT reference, VOICE.md link, hard rules summary, links to all canonical strategy docs (CONFLICTS_RESOLVED, OPTIMIZATION_PLAN, IMPLEMENTATION_PROGRESS, DEFERRED) |
| `DEFERRED.md` | +60 lines | New backend-phase items: Live room counter (NC-4 / Dim 10 #6); Referral redemption ledger (Conflict 2); Email-only cohort spec (Conflict 5 placeholder) |
| `CONFLICTS_RESOLVED.md` | ~120 lines | Locked Conflicts 1, 2, 3, 4, 9 with Hassan's decisions; quick-decision summary table at top |
| `VOICE.md` | NEW (320 lines) | OKT + 4 personality words + tonality dial + 6 hard rules + Thoughtful Contractor Test + per-surface playbook + token table + audit cadence |
| `optimization/creative-briefs/welcome.md` | NEW | Reforge creative brief for welcome surface |
| `optimization/creative-briefs/paywall.md` | NEW | Reforge creative brief for paywall surface |
| `optimization/creative-briefs/lifecycle.md` | NEW | Reforge creative brief for lifecycle banners + push + email |
| `optimization/creative-briefs/errors-empty-states.md` | NEW | Reforge creative brief for errors + empty states |

## Audit results (post-implementation sweep)

Grep sweep run for: `12,400`, `2,400+`, `Most members redesign`, `less than a coffee`, `coming soon` (in user copy), `Want more?`, `No saved items yet`, `No rooms yet`, `Image too large (12MB`, `Pick an image file`, `Welcome,...!`, `FAQ coming soon...!`, `Fresh picks curated`, `⚠ may not fit`, `⏰ Only`, `Don't miss out`, `Hey there!`, plus emoji `⚠ 🛋 💡 🎉 ✨ 🚀 💰 ✅ ❌ ⏰ 🔔` in user-facing strings.

**Findings:**
- All Batch 1-scope user copy violations are clean. ✅
- Remaining `12,400` / `2,400+` / `coming soon` matches are all in **documentation files** (`DEFERRED.md`, `BATCH_1_AUDIT.md`) describing the legacy state — historical record, not user copy.
- Remaining emoji at `app.js:6290` (`item.icon || '🛋️'` fallback) is structural — FURNITURE_DB icon field uses emoji across all ~80 catalog entries. Refactor requires real product photos or SVG line-art for every catalog row. **Flagged for a future catalog-asset batch.**
- Remaining `toast('Apple sign-in coming soon')` (app.js:648) and `toast('FAQ coming soon. You\'re early.')` (app.js:825): both are honest "feature not built yet" disclosures, NOT vaporware-being-charged-for. Acceptable per Conflict 3 lock interpretation.

## What did NOT ship in Batch 1 (deferred to later batches)

- **APP-14: LIFECYCLE_CAMPAIGNS tokenization.** L effort (~4 hours). Current implementation works with hardcoded copy; tokenization is a quality improvement that needs its own focus + token-source mapping verification. Templates spec'd in `optimization/09_content_copy.md` Section C remain canonical. Queued for a future copy-infrastructure batch.
- **APP-20 picker style-adjacency expansion.** Full version requires authoring `style.adjacent` mappings in `furniture.js` for all ~30 styles. Batch 1 ships only the budget +20% retry + `picker_underpopulated` analytics event so the catalog team can see which combos need more inventory.
- **Dim 10 Recommendation 7 — comparison gallery on welcome.** Highest-impact Dim 10 item but needs 4–5 real before/after photos. Asset work — Hassan's task.
- **Renovation-cost anchor on paywall** (Master Priority Stack #5). Out of scope this batch to keep paywall changes scoped to trust violations + bullet cleanup. Queued for a paywall-pricing batch.
- **AST-1 tip-example.jpg.** Per Hassan's ship call, IDX-12 ships with text-only fallback (custom SVG room icon). When the photo lands, flip `PHOTO_TIP_CONFIG.examplePath` and the image renders without component changes.
- **NC-4 live room counter.** Deferred to backend phase per Hassan's decision. Spec in `DEFERRED.md`.

## Compatibility / migration notes

- **`pickItemsForRoom`** now reads `state.user._styleAvoid` for soft-avoid scoring. Existing callers unaffected — passes through gracefully when the map is empty/absent. Safe to deploy without migration.
- **`buildAffiliateUrl`** signature unchanged. Existing callers continue to work; the function now returns search-URLs instead of homepage stubs when per-item URLs are placeholder. **No caller change required.**
- **`save()` wrapper.** Original `save()` is unchanged; `safeSave()` is exposed as `window.FurnishSafeSave` for future opt-in. Existing call sites continue using `save()` directly.
- **Sign-out backup keys** (`furnish.state.backup.{userId}`) are write-only on sign-out. Reading is gated by `maybeOfferStateRestore` which only fires when the user signs back in. Backup persists across sessions; no automatic prune. Future batch can add a sweep policy if backup keys grow.
- **Post-Batch-1 line-number drift:** every reference to a specific `app.js` or `index.html` line number predating this batch is stale. Re-grep current locations before any future batch references them.

## Verification plan

- **Manual smoke test:** Welcome → quiz skip → photo upload → analyze → reveal. Confirm:
  - Welcome tagline + subtext + trust strip read as expected (no "20 seconds", no "12,400+")
  - Photo tip card appears on capture with text fallback (custom SVG room icon)
  - Reveal screen shows both `Shop The Whole Room` AND `Different Style?` CTAs
  - Different Style modal opens, shows up to 6 chips, pivots to a new style with a versioned save
  - Aha "Off" vote triggers reshuffle with toast "Got it — pulling a different direction…"
  - Reshuffle toast says "Different items, same style."
  - Affiliate disclosure V2 block renders with custom SVG lightbulb (not emoji)
- **Paywall test:** Trigger any paywall context (e.g., add 2nd profile, premium-quality post-3rd-gen). Confirm:
  - Sub copy is the new OKT-laddered version (no "less than a coffee a month")
  - Pro bullets list 5 features (no "coming soon" rows)
  - Roadmap link in footer opens the modal listing planned features
  - Stars/reviews block replaced with cancel-policy trust line
- **Edge-case test:** Upload non-image file → "That file isn't a photo. Try a JPG or PNG." Upload >12MB image → "Image is over 12MB. Try a smaller photo or screenshot."
- **Live counter rotation:** Wait 4 review-bar cycles. Counter row should rotate through 4 positioning claims (no fictitious numbers).
- **Sign-out + sign-back-in:** Sign out, then sign back in with same identity. Should offer "Restore your previous library?" prompt.
- **Build sanity:** Open `start-windows.bat` (or `bash start-mac-linux.sh`); confirm no console errors at boot.

## Reforge framework citations (touched in Batch 1)

- *Brand Marketing — Defining Your Brand Personality* (Word Game, Attitudinal Ranges, "Who We're Not")
- *Brand Marketing — Bringing Your Brand To Life* (Brand Guidelines as third building block)
- *Brand Marketing — Evangelizing Brand Guidelines* (point 21 — fictitious anchors erode trust)
- *Brand Marketing — Building Blocks of Brand Identity* (point 75 — verbal cues)
- *Product Marketing — Finding Your One Key Takeaway* (Strategic Emphasis Archetypes — Audience-Based)
- *Product Marketing — Building Proof Point Pillars* (House Framework)
- *Product Marketing — Defining Effective Creative Briefs*
- *Monetization + Pricing — Packaging Strategies* (don't price what doesn't exist)
- *Monetization + Pricing — Convert lesson* (value-moment triggers, real-alternative anchoring)
- *Retention + Engagement — Setup Moment Experience* (must-have inputs at setup time)
- *Retention + Engagement — Engagement Strategies → Habit Reinforcement* (feedback must change behavior)
- *Retention + Engagement — Strategies For At-Risk Users → Use Case Transition* (Trello example)
- *Retention + Engagement — Resurrecting Voluntary Dormant Users* (5-step framework, Reasons #1–6)
- *Retention + Engagement — Resurrecting Involuntary Dormant Users* (Category One: Product Issue)
- *Advanced Growth Strategy — Financial Viral Loops Lesson 3* (currency-alignment with natural-frequency window)
- *Advanced Growth Strategy — Content Loops* (silent share failures)
- *PM Foundations — Feature Development* (idempotency baseline) + *Feature Design* (edge cases first-class)
- *Experimentation + Testing — Negative-Path Validation*
- *User Insights for Product Decisions* (research validation, "feedback that doesn't change behavior is fake feedback")

## Time spent

- Audit (Step 1–3): ~45 min
- Conflict resolution lock + DEFERRED + CLAUDE.md updates (Phase A): ~20 min
- index.html implementation (Phase B): ~30 min
- app.js implementation (Phase C): ~75 min
- styles.css additions (Phase D): ~15 min
- New files: VOICE.md + 4 creative briefs + this section (Phase E): ~40 min
- Sweep + de-emoji fixes (Phase F): ~15 min
- **Total: ~4 hours of execution.**

## Next batch — recommended

Pick from Master Priority Stack tier B/C and the remaining 4 PENDING conflicts (5, 6, 7, 8). Two strong options:

- **D7-reveal-gate batch:** covers Conflict 5 (soft email lane) + IDX-14 email stash + lifecycle "guest-email-only" cohort. High immediate value (recovers the ~30–50% of bailers at D7).
- **Onboarding-architecture batch:** covers Conflict 7 (tutorial deferral to session 2) + Conflict 8 (Q3 material → room type swap) + APP-14 LIFECYCLE_CAMPAIGNS tokenization. Higher structural impact but more code-touch.

Both are clear shipping paths. Hassan's call.

---
---

# Batch 2 — Dim 01 Visual Design + Dim 11 Performance & Feel — COMPLETE

**Date:** 2026-04-26
**Source audit:** `BATCH_2_AUDIT.md` (streamlined-gate pass — 0 conflicts, 0 NCs, 0 ambiguities, proceeded immediately to implementation)
**Conflicts touched:** none new. Conflict 3 already resolved in Batch 1; Rec 08 (paywall noise reduction) ships against the resolved 5-bullet layout.
**Items shipped:** 20 of 21 (Rec 12 Brex Word Game already done in Batch 1 as VOICE.md).

## Decisions made (auto-resolve / auto-defer rules applied)

- **Rec 02 photographic welcome demo:** photo assets deferred (Hassan supplies). Shipped a config-driven slot — when photos land, swap `assets/quiz/q1/*.jpg` references in `index.html:54,56` and the slot renders them with the new `--shadow-2` + inset border treatment.
- **Rec 09 empty-state SVG illustrations:** designer asset deferred. Shipped placeholder slot with `.empty-art` class + forward-leaning copy already in place from Batch 1 (VOICE.md B.3 patterns).
- **Rec 10 logo lockup:** Option A shipped (wordmark in `--font-display` at hero scale). Option B (custom wordmark SVG) deferred — needs designer.
- **Rec 11 styles.css de-dup:** full audit deferred (L effort). Shipped **targeted approach** — Batch 2 visual changes added as an OVERRIDE BLOCK at the bottom of styles.css (cascade gives it last-rule priority, overrides all earlier duplicate definitions). Full de-dup audit queued for a future cleanup batch.
- **D.1 story-driven analyzing screen:** within budget, shipped.
- **D.5 sound-effects:** toggle UI shipped (off by default), `playSfx` is a stub. Audio assets are a separate decision.
- **D.7 haptic table:** shipped as DEFERRED.md addendum to item 4 (Capacitor wrap). Day-1 native shipping spec is now canonical.

## Files changed

| File | Lines changed | Summary |
|------|---------------|---------|
| `styles.css` | +50 (top tokens) + ~410 (Batch 2 override block at bottom) | Top: `--font-display`, `--font-body`, multi-layer shadows (`--shadow-1/2/3` with legacy aliases), `--ease-premium`, dark-mode shadow re-tuning. Bottom: full Batch 2 override block — button micro-interactions, multi-layer shadows on cards, frosted-glass price tags, editorial price treatment, welcome whitespace, logo wordmark in display serif, paywall noise reduction (glow off, badge plain, frosted bullets), modal-card surface+glow, hero-demo placeholder treatment, empty-state placeholder slot, skeleton + shimmer keyframe, overlay timed flash, reveal choreography keyframes (image fade-pop, price-tag ripple, totals slide), analyzing-step active/done states with check-mark pop animation, sound-toggle UI styles. Dark-mode coverage on every new component. |
| `index.html` | +9 / ~3 changed | Google Fonts `<link>` for Fraunces + Inter (preconnect-warmed); sound-effects toggle in profile-page settings list. |
| `app.js` | ~150 lines | `runAnalyzerAnimation` rewritten to take `totalDurationMs` arg with story-driven beat percentages (parameterized for mock / Schnell / Kontext Pro durations); `runRevealChoreography()` orchestrator at end of `openRoom`; coachmark `setTimeout` 600ms → 3500ms; new helpers `getRoomImage` / `invalidateRoomImageCache` (last-redesign image cache), `playSfx` stub, `wireSoundToggle`, `showSkeletons` helper. All exposed on `window.Furnish*` for future call sites. |
| `DEFERRED.md` | +60 | Haptic feedback table appended as addendum to item 4 (Capacitor wrap). |

## Reforge framework citations (touched in Batch 2)

- *Brand Marketing — Building Blocks of Brand Identity* (Lesson 1) — typography, color, form/shape as brand assets
- *Brand Marketing — Defining Your Brand Personality* (Lesson 2) — voice/personality (was Batch 1)
- *Brand Marketing — Creating Brand Assets, Part I* (Lesson 3) — Design Sprint, asset development
- *Mastering Product Management — Decision Architecture* (Decision Budget & Circles) — welcome whitespace argument
- *Product Marketing — Finding Your One Key Takeaway* — paywall noise reduction (one primary takeaway per surface)
- *Retention + Engagement — Defining Your Aha Moment* (p.5-7, p.14) — reveal choreography qualitative test ("special ability") + time-budget curve
- *Product Management Foundations — Constrained Divergence* (p.6, p.13) — skeleton screens + audio-as-delight justification
- *Apple HIG / Material Motion / Stripe* — [Original] for motion timing (220ms hover-in, 80ms active-snap)

## Verification plan

- **Build sanity:** open the app, confirm no console errors. Fraunces font should load (h1 should be serif, not Inter).
- **Light mode:** welcome should breathe more (64px hero padding); h1 + price values render in serif; price tags read as frosted pills (no triangle pointer); item cards have layered shadow that lifts on hover; paywall glow doesn't pulse anymore.
- **Dark mode:** every component above renders correctly with dark-mode shadow + frosted-glass tones.
- **Mobile narrow viewport (320px):** welcome whitespace doesn't overflow; reveal-actions-row stacks (already from Batch 1).
- **Reveal choreography:** finish a redesign — image fades in with scale-pop; "Designed with Furnish" overlay flashes at ~1.4s; price tags ripple in at ~2s with 80ms stagger; totals card slides up at ~2.7s; first-aha coachmark fires at ~3.5s (was 0.6s).
- **Analyzing storyline:** `runAnalyzerAnimation()` defaults to ~3.4s mock duration; check that all 4 steps activate sequentially with check-mark pop; window.FurnishAnalyzerAnimation accepts a custom duration.
- **Sound toggle:** open Profile screen → see "Sound Effects" row → toggle switches state but plays no audio (stub by design).
- **Empty states:** wishlist empty + rooms empty render with new `.empty-state` styling (centered, muted color, larger padding).
- **Edge cases:** off-vote → reshuffle still uses Batch 1 soft-avoid + new "Different items, same style" copy.

## Compatibility / migration notes

- **`--shadow` and `--shadow-lg` are now aliases** to `--shadow-2` and `--shadow-3`. Existing call sites continue to work; new code should reference the tier explicitly (`var(--shadow-1)` etc).
- **Override-block strategy:** any future visual change to a Batch 2-affected selector should also live in the override block (or replace it directly). The override block is clearly marked at the top of its section with `BATCH 2 — Dim 01 + Dim 11`.
- **`runAnalyzerAnimation` signature change:** now takes optional `totalDurationMs` parameter. Existing callers (`app.js:3980`, `app.js:4162`) pass nothing → fall back to ~3.4s mock default. When real AI ships, callers wrap as `runAnalyzerAnimation(estimatedDurationMs)` — typically the model's median latency from analytics.
- **Coachmark timing 600 → 3500ms:** documented in `app.js` comment at the call site. If reveal choreography is later disabled, coachmark timing should drop back to 600ms for consistency.
- **`#baAfterImg.entering` class:** added by `runRevealChoreography` and removed after 700ms. Does not persist across re-renders.

## What did NOT ship in Batch 2

- **Rec 02 photographic welcome demo assets** — Hassan's task. Slot is config-ready.
- **Rec 09 empty-state SVG illustrations** — designer task. Slot is config-ready.
- **Rec 10 Option B custom wordmark logo** — designer task.
- **Rec 11 full styles.css de-dup audit** — L effort, future cleanup batch. Targeted overrides via cascade ship in this batch.
- **D.5 audio assets** — separate decision.
- **D.7 native haptic implementation** — Capacitor cutover (DEFERRED.md item 4).

## Time spent

- Audit + streamlined-gate: ~10 min
- Phase A design tokens + font loading: ~10 min
- Phase B+D component override block: ~25 min
- Phase C JS (runAnalyzerAnimation + runRevealChoreography + cache + sound toggle + skeleton helpers): ~30 min
- Phase E haptic table → DEFERRED.md: ~10 min
- Phase F sweep + class-mismatch fix: ~5 min
- Phase G this log + commit: ~10 min
- **Total: ~1h 40min execution.**

## Status: ✅ COMPLETE

Next batch — same recommendations as Batch 1's "next batch" note: D7-reveal-gate batch (Conflict 5) or Onboarding-architecture batch (Conflicts 7 + 8). Both cleanly defined.

---
---

# Batch 3 — Dim 04 Activation + Dim 12 Onboarding + Dim 03 Conversion — COMPLETE

**Date:** 2026-04-26
**Source audit:** `BATCH_3_AUDIT.md` — stopped ONCE with consolidated decision request, Hassan approved all 8 calls + locked the "approve all changes" policy going forward.
**Conflicts touched:** 5, 7, 8 — all locked in this batch. Only Conflict 6 remains pending.

## Decisions locked in this batch

- **A1 = B+C:** Quiz architecture — kept current order (capture-after-quiz preserves the consistency boost since the 10-Q onboarding already sequences low-friction asks before the photo step). Q3 swap proposal (Conflict 8) was OBSOLETED — the 10-Q onboarding migration already replaced the old 4-Q structure. Documented as obsolete in CONFLICTS_RESOLVED.md.
- **A2 = MODIFY:** Price tags delayed to Frame 5 of Batch 2 reveal choreography — the infrastructure was already in place from Batch 2; semantics now align with ELMR (emotion lands first, logic ripples in 1500ms later).
- **A3 = DEMOTE:** Skip button on quiz intro now styled as a small text link (CSS override on `#skipQuipBtn`).
- **A4 = CONFIRM (Conflict 5 lock):** Soft email capture lane added before the D7 reveal gate. `softEmailCapture()` writes `state.user.recoveryEmail` + `state.emailIntent`; backend send wired at cutover.
- **A5 = DEFER:** Quarterly Core flip (Dim 04 R7) explicitly deferred to a structural batch. Conflict 1's lock honored.
- **A6 = KEEP CURRENT:** Hero tagline unchanged ("Watch any room transform — about a minute, sit tight.") — none of the Dim 03 R-Top3 candidates beat it on voice rubric.
- **A7 = APPROVE:** Aha event split. `aha_gate_reached` fires on render; `aha_moment_reached` fires only on user-signaled experience (Love-tap, Close-tap, item-tap, Shop-all, wishlist-save, or 10s dwell). Per-room single-fire flag prevents double-counting.
- **A8 = APPROVE (Conflict 7 lock):** Tutorial defers to session 2 home arrival. `queueFirstRedesignTutorial()` is now a no-op on first reveal; `maybeFireSessionTwoTutorial()` gates on `state.user.sessionCount >= 2 && state.rooms.length >= 1 && !firstRedesignTutorialSeen`.

## Decision policy update (locked in CLAUDE.md)
Hassan locked: "From here on out I APPROVE ALL CHANGES." When an audit raises ambiguity, the recommended call is approved and shipped — do NOT stop and ask. Streamlined-gate still applies; cross-dim disagreements still get surfaced for visibility, but ship with the recommended call.

## Files changed

| File | Lines changed | Summary |
|------|---------------|---------|
| `app.js` | +250 (Batch 3 block) + ~40 surgical edits | Batch 3 functions: `fireAhaMomentIfFresh` + `scheduleAhaDwellTimer` (Aha split), `isSessionTwoArrival` + `maybeIncrementSessionCount` + `maybeFireSessionTwoTutorial` (tutorial defer), `isReturningGuestWithProgress` (returning-guest skip), `logHabitAction` (habit metric), `softEmailCapture` + `wireSoftEmailCaptureForm` (Conflict 5), `showPromiseFitMicrosurvey` (post-Love survey), `maybeFireValueMomentPaywall` (value-moment paywall triggers), `rankItemsForCondensedList` (top-3 expander), `wireStickyShopAllCTA`. Wired into existing `openRoom` (Aha gate fire + dwell timer + 2nd-redesign habit log), Aha-feedback Love/Close handlers (Aha experience signal + microsurvey), `toggleWishlist` (Aha + habit + 3rd-save value-moment), `shopAllBtn` (Aha shop signal), item-sheet open (Aha item-tap), `style_pulse_shown` (habit log), `price_drop_banner_clicked` (habit log), `welcomeStartBtn` (returning-guest skip), `queueFirstRedesignTutorial` (no-op + comment redirect to session-2 trigger), `openPaywall` (8→3 layout class). PAYWALL_LAYOUTS + PAYWALL_CONTEXT_LAYOUT consolidation map. |
| `index.html` | ~40 changed | Welcome screen: trust-strip chips ABOVE CTA (No signup / ~1 min / Free), `.hd-frame.auto-play` class on welcome demo. Capture screen: progress bar + headline change to "Last Step — Your Room Photo". Signin screen: Google OAuth promoted to `btn-primary big` ("Reveal in 1 tap with Google"), Apple/Amazon demoted to side-by-side ghost row, soft email-capture lane added between social row and email form, divider copy refined. Paywall card: "MOST POPULAR" pill + "Save $24/yr" anchor (replaces "Save 33%"). |
| `styles.css` | +320 (Batch 3 override block) | Auto-playing welcome demo keyframes (with `prefers-reduced-motion` fallback), `.hero-trust-strip` + `.hts-chip`, `.signin-google-primary` + `.signin-social-secondary`, `.signin-soft-capture` family (with dark-mode coverage), `.capture-progress` family, `.items-expander`, `.sticky-shop-all` family, `.promise-fit-survey` family, `.pw-most-popular` pill + paywall-layout color tints (A_quality / B_power / C_save), Skip-button demote, `.quiz-reassurance`, `.quiz-help-btn` + `.quiz-help-tooltip`. |
| `CLAUDE.md` | +6 | Decision policy: "approve all changes" locked. |
| `CONFLICTS_RESOLVED.md` | ~10 | Conflicts 5, 7, 8 locked. Conflict 8 marked OBSOLETE (old 4-Q quiz superseded by 10-Q onboarding). |
| `DEFERRED.md` | +4 | Email recovery dependency (Conflict 5 backend half), push timing change (item 7 push), tutorial sync semantics (item 3 — session-2 trigger). |
| `BATCH_3_AUDIT.md` | NEW | Streamlined-gate audit + consolidated decision request + decision matrix. |

## What did NOT ship

- **Q2 palette room thumbs (E2):** asset task — config-driven slot ready (Hassan supplies images later).
- **Capture "What works" tip strip (E9):** asset task — slot ready.
- **A1 Path A (full Setup-after-Aha):** structural batch later. Ships if Hassan wants to scrap the 10-Q onboarding entirely (unlikely given recent migration investment).
- **A5 Quarterly Core flip:** structural batch later (Conflict 1 lock honored).
- **Hero tagline rewrite (A6):** kept current.
- **Skip-default 5-second taste filter (E4):** scoped out — the 10-Q onboarding's defaults are richer than the old 4-Q minimalist trio; the proposal was framed against a flow that no longer exists. If Hassan still wants this, file as a follow-up.
- **Per-question "?" tooltip + Q3 reassurance (E10/E11):** CSS hooks shipped (`.quiz-help-btn`, `.quiz-reassurance`); JS wiring deferred since the 10-Q renderer doesn't yet have a per-question copy table for the help text. Future copy task.
- **HD-export value-moment trigger:** `maybeFireValueMomentPaywall('hd_export_attempt')` exists; call site needs HD-export feature first (DEFERRED.md item — HD export is a Pro feature whose UI is partially built).
- **2nd-room-intent value-moment trigger:** `maybeFireValueMomentPaywall('second_room_intent')` exists; call site is "user taps New from Photo when state.rooms.length >= 1 and !isPro". Wire when home-screen state allows.
- **Love-dwell 5min value-moment trigger:** function exposed; needs a 5min dwell timer on the results screen — not wired this batch.
- **Progressive disclosure on prefs (E6):** scoped out — the 10-Q onboarding has progressive disclosure built into the per-question flow already.
- **Promise-Fit microsurvey JS wiring beyond Love-tap:** complete; only fires once per user on Love.
- **Email backend send:** DEFERRED.md item 6.
- **Native push timing change:** DEFERRED.md item 7.

## Verification plan

- **New user, full flow (cold start):** Welcome → trust strip visible above CTA → "Redesign My Room" → 10-Q onboarding → capture (with progress bar showing 90%) → analyze → reveal. After reveal: Love-tap → microsurvey appears within 600ms. Wishlist 1st save: push pre-prompt fires. 3rd save: value-moment paywall fires. Sticky shop CTA appears on scroll past totals card.
- **Returning guest (rooms exist OR draft set):** Welcome → "Redesign My Room" → routes directly to home (skips onboarding). Test: `state.rooms.length === 1 && isGuest()`.
- **Session 2 home arrival:** Open app → bump session count → on home arrival with prior redesign + tutorial unseen → tutorial coachmarks fire (Styles → Color Moods → Budget). Test: simulate by clearing `_lastSessionStart` to >1h ago.
- **Aha event split:** confirm `aha_gate_reached` fires on results render; `aha_moment_reached` only fires on Love OR item-tap OR Shop-all OR wishlist-save OR 10s dwell. Verify single-fire per room (`room._ahaMomentFired` flag).
- **Soft email capture:** open D7 reveal gate as guest → enter email in soft-capture lane → tap "Save & Skip Signin" → toast confirms → `state.user.recoveryEmail` set → returns to welcome. `state.emailIntent` map populated.
- **Paywall layout consolidation:** trigger `openPaywall('premium_quality')` → modal opens with `layout-A_quality` class + tan badge. `openPaywall('profile')` → `layout-B_power` + brown badge. `openPaywall('advanced_price_filters')` → `layout-C_save` + green badge.
- **Habit metric:** save 2 wishlist items in <28d → `state.user.habitFormed = true`, `habit_formed` event fires.
- **Items list top-3:** open a room with >4 items → only 3 visible by default + "See all N pieces" expander; tap expander → all items render, sticky.
- **Welcome demo loop:** confirm BEFORE/sweep/AFTER cycle plays automatically every ~4s (and respects `prefers-reduced-motion`).

## Reforge framework citations (Batch 3)

- *Retention + Engagement — Module 03* (Defining Aha / Setup / Habit moments)
- *Retention + Engagement — Module 04* (Activation Strategies — Aha experience, Setup experience, Habit experience)
- *Retention + Engagement — Module 02* (Natural Behavior Use Cases)
- *Retention + Engagement — Module 06* (Engagement Strategies / Frequency Strategy)
- *Retention + Engagement — Module 09 BONUS* (Managing Infrequent Products / ICED Theory) — Expanding Touchpoints
- *Retention + Engagement — Module 04* (Four Activation Fits + PNIP Pyramid)
- *Monetization + Pricing* (Convert And Activate — Optimization Equation, value-moment triggers)
- *Product Marketing — Positioning And Messaging* (One Key Takeaway — paywall consolidation)
- *Growth Series — User Psychology* (ELMR Decision Hill, Motivational Boosts: Consistency, Completion, Bargain, Belonging)
- *Mastering Product Management — Decision Architecture* (Decision Budget & Circles)

## Time spent

- Phase A audit + cross-dim disagreement surfacing: ~30 min
- Conflicts lock + DEFERRED + CLAUDE.md policy update: ~10 min
- Phase A-D app.js work: ~80 min
- index.html edits (welcome trust strip + signin OAuth + soft email + capture progress + paywall anchor): ~25 min
- styles.css Batch 3 block: ~30 min
- This log + commit: ~15 min
- **Total: ~3h 10min execution.**

## Status: ✅ COMPLETE

Conflicts 5, 7, 8 locked. Conflict 6 (gen-50 power-user signal) remains pending — file under monetization-batch when that runs.

Three batches down, three to go. Remaining major dimensions:
- **Dim 05 Retention** (engagement loops, content cadence) — depends on logged habit-action data
- **Dim 06 Monetization** (pricing psych, Pro entitlement bundling) — Conflict 6 territory
- **Dim 07 Personalization** + **Dim 08 Social** + **Dim 13 Instrumentation** — could group together as a "data + commerce backbone" batch

Pick when ready.