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

---
---

# Batch 4 — Dim 05 Retention + Dim 07 Personalization + Dim 08 Social — COMPLETE

**Date:** 2026-04-26
**Source audit:** `BATCH_4_AUDIT.md` — streamlined-gate cleared per "approve all changes" policy. Customer Retention Canvas captured as a standalone artifact in §A of the audit.
**Conflicts touched:** 1 (Quarterly Core — honored Batch-1 lock, internal frame only) and 2 (referral currency — fixed leftover at `app.js:6425`). No conflicts opened or pending.

## Architecture: data model first

Per Hassan's batch-4 spec, this batch lays the data-model + trigger infrastructure that Dim 05 retention loops, Dim 07 personalization mechanics, and Dim 08 social viral loops all consume.

**New profile-level fields:**
- `profile.styleScores{}` — normalized style-affinity vector derived from `profile.answers` (10-Q model) + saves + Aha verdicts. Per-style weight in [0..1].
- `profile.styleConfidence` — `'high' | 'medium' | 'low' | 'unknown'` from answer completion rate.
- `profile.ahaHistory[]` — last 30 verdicts {verdict, styles, colors, ts, roomId} with 60-day half-life decay.

**New user-level fields:**
- `state.user._sessionsByHour[24]` + `_sessionsByDow[7]` — push-timing aggregates.
- `state.user._followingUserIds[]` — social graph stub.
- `state.user._lastShareFunnelStep` — K-factor instrumentation.

**New helpers exposed on `window.Furnish*`:** `RecomputeStyleScores`, `RecordAhaVerdict`, `PersonalizationState`, `ComputePeakRoom`, `OldestWishlistAge`, `LifecycleStyleCopy`, `TrackShareFunnel`, `FollowUser`, `PushDeliveryTier`, `PriceFitWeight`, `ProfileSophistication`, `ShareFormats`, `DefaultShareFormat`, `ShareCaption`, `BestPushHour`.

## What landed in the picker (Dim 07 D1 + D3 + D4 + D6)

`pickItemsForRoom` rewrite:
- **Weighted style score** (D1): `profile.styleScores` vector replaces binary hit-rate (fallback preserved).
- **Soft budget weighting** (D3): `priceFitWeight()` 1.0 / 0.7 / 0.3 / 0.05 across price/budget tiers.
- **Sophistication factor** (D4): novice gets +0.05 on safer styles; high-fluency gets +0.05 on riskier styles.
- **Casual-state recovery** (D6): when `personalizationEngagementState === 'casual'`, avoid penalties multiply by 0.5.

## Lifecycle work (Dim 05)

- **Loop 4 — `wishlist_age_d90_recall`** new entry in `LIFECYCLE_CAMPAIGNS`. Predicate: `oldestWishlistAgeDays >= 90 && wishlistCount > 0 && daysSincePrev < 60`. Email channel; backend send defers.
- **Resurrection peak-moment surface** (Rec 7): `renderLifecycleBanner` CHURNED branch surfaces user's most-engaged room by name (computed via save events + bookmarks + reshuffle count + Love verdicts).
- **Variant lifecycle banner copy by saved style** (Dim 07 D5): `LIFECYCLE_STYLE_COPY[stateKey][topStyle]` lookup.
- **Free-user push thin-cadence** (Rec 2 Option B): `pushTier: 'free_thin' | 'pro_full'` flag in lifecycle scheduler ctx; backend filters at send time.

## Social/share work (Dim 08)

- **Reveal-moment Share CTA** (Top 3 #1): `#revealShareBtn` between Shop and Different Style.
- **Lifecycle-aware default format**: NEW=square, ACTIVE=pin, Pro 5+=feed.
- **Share format chips**: 5 chips (Pinterest / IG Story / IG Feed / Group chat / Reddit) above the canvas with `share_funnel_format_selected` event.
- **K-factor instrumentation**: client-side `share_funnel_*` events (modal_opened, format_selected, format_chips_shown).
- **Lifecycle-aware caption**: NEW state → "What do you think?" pull-WOM framing.
- **Personal-viral follow scaffold**: `state.user._followingUserIds[]` records intent; backend defers.

## Conflict 2 propagation fix

Found leftover at `app.js:6425` — share invite-link toast still said "1 month of Furnish Pro free." Fixed to "5 HD redesigns + 2 style packs (90 days)." Grep sweep confirms no other in-code leftovers.

## Files changed

| File | Lines | Summary |
|------|-------|---------|
| `app.js` | +320 (Batch 4 block) + ~70 surgical | All new helpers; wired into Aha feedback, pickItemsForRoom, renderLifecycleBanner, runLifecycleScheduler, share modal, boot. LIFECYCLE_CAMPAIGNS 9th entry. revealShareBtn handler. Conflict 2 toast fix. |
| `index.html` | +12 | Reveal-moment "Share This Room" button. |
| `styles.css` | +75 | `.reveal-share-btn`, `.share-format-chips`, `.share-format-chip` family. |
| `DEFERRED.md` | +9 | Public room pages, embed widget, social graph backend, push thin-cadence, wishlist-age email, cross-device sync, K-factor server attribution. |
| `BATCH_4_AUDIT.md` | NEW | Customer Retention Canvas as standalone strategic artifact. |

## Reforge citations (Batch 4)

- *R+E Customer Canvas* — strategic foundation
- *R+E 02 Natural Behavior Use Cases* — Use Case Frequency Spectrum, layered use cases
- *R+E 06 Engagement Strategies / Frequency Strategy* — loop archetypes
- *R+E 09 BONUS ICED Theory* — Expanding Touchpoints, Plant Loyalty Hook
- *R+E 04 Defining Engagement States* — Casual/Core/Power process
- *R+E 06 Engagement Engine* — Signal/Strategy/Path
- *AGS 02.04 Viral Loops* — K-factor decomposition, currency-alignment
- *AGS 02.05 Content + UGC Loops* — branching factor × influence-per-exposure
- *DPM 03 Instrumentation* — Event Dictionary, Action/Contextual/Backstory
- *UI4PD 05 Synthesis* — visible vs invisible personalization

## Status: ✅ COMPLETE

Four batches down. Conflict 6 (gen-50 power-user signal) remains the only pending conflict — that's monetization-batch territory.

Remaining major dimensions:
- **Dim 06 Monetization** — Conflict 6 territory; pricing psych; Pro entitlement bundling; upsell pacing
- **Dim 13 Instrumentation** — north-star measurement; cohort definitions; PostHog-or-equivalent decision

These are the natural Batch 5 + 6 candidates. Hassan's call.

---
---

# RESUME NOTE — context limit reached at 96% (after Batch 4 commit)

**Date:** 2026-04-26
**Triggered by:** Hassan's stop directive at ~96% context.
**Current commit:** `9c83bff` (Batch 4: Dim 05 Retention + Dim 07 Personalization + Dim 08 Social).

## 1. Exactly which step I stopped at

**I am NOT mid-step.** Batch 4 is fully complete: all 7 phases (A through G) shipped, all files committed in `9c83bff`. The `git log` cleanly shows 4 batches: `28d4b5b` (Batch 1) → `4fd4196` (Batch 2) → `8ad2165` (Batch 3) → `9c83bff` (Batch 4). No work-in-progress.

Hassan asked me to stop **after** the current step finishes — Batch 4 finished. I'm stopping before starting any new step.

## 2. Files fully completed in Batch 4 (all committed)

- `app.js` — +538 lines (Batch 4 helper block + surgical edits to Aha feedback, pickItemsForRoom, renderLifecycleBanner, runLifecycleScheduler, share modal, boot)
- `index.html` — +11 lines (reveal-moment "Share This Room" button between Shop and Different Style)
- `styles.css` — +72 lines (`.reveal-share-btn`, `.share-format-chips`, `.share-format-chip`)
- `DEFERRED.md` — +9 lines (public room pages, embed widget, social graph backend, push thin-cadence, wishlist-age email, cross-device sync, K-factor server attribution)
- `IMPLEMENTATION_PROGRESS.md` — Batch 4 section appended
- `BATCH_4_AUDIT.md` — NEW (Customer Retention Canvas as standalone strategic artifact + audit matrix)

**Total: 6 files, +876 / -15 lines.** All committed as `9c83bff`.

## 3. Files partially modified (still pending)

**None.** Batch 4 is clean. No mid-edit files. No staged-but-uncommitted changes.

`git status --short` for files I've touched returns nothing on the Batch 4 set. (Other files like `app.js`, `furniture.js`, `supabase-client.js` show as modified relative to the parent-dir git repo, but those are Hassan's pre-existing in-flight edits unrelated to Batch 4 — same as in prior batches' commit notes.)

## 4. Pending decisions I would have surfaced (none for Batch 4; potential for Batches 5–6)

**For Batch 4 itself: zero pending decisions.** All cross-dim disagreements were auto-resolved per the "approve all changes" policy locked in CLAUDE.md after Batch 3. Specifically:
- Quarterly Core challenge → resolved by Batch 1 lock (internal frame, no calendar copy)
- Free-user push leak → picked Option B (thinner cadence) and shipped
- Tutorial timing in lifecycle map → resolved by Batch 3's Conflict 7 lock
- Dim 07 4-Q quiz references → adapted to the 10-Q `profile.answers` model (recompute pipeline, not data-shape change)
- Dim 08 referral mechanic → already locked Batch 1 (Conflict 2); fixed the `app.js:6425` toast leftover

**Pending across the program (NOT this batch):**
- **Conflict 6** — gen-50/30d soft signal — still PENDING in `CONFLICTS_RESOLVED.md`. Belongs to Batch 5 (Monetization). Will be the only non-trivial decision request when Batch 5 runs.
- **Per-format canvas re-rendering** for Dim 08 share — chips ship in Batch 4, full canvas pipeline (each format gets own dimensions/composition) is queued as a future M-effort batch. No decision needed; just sequencing.
- **Public room URLs + OG metadata** — DEFERRED.md backend phase. Not a decision; a build queue item.
- **Real social graph** for the personal-viral follow loop — UI scaffold (`state.user._followingUserIds[]`) ships; backend defers. Not a decision.

## 5. Exact next action on resume

**Hassan's next move (when ready, in a fresh session):** Invoke **Batch 5 — Dim 06 Monetization** OR **Batch 6 — Dim 13 Instrumentation**. Both are clearly defined; either order works. My recommendation: **Batch 5 first** because (a) Conflict 6 (gen-50 soft signal) is monetization-batch territory and resolves the last open conflict, (b) monetization recommendations consume the new data model (styleScores, ahaHistory, value-moment paywall triggers from Batch 3) that's now in place, and (c) Batch 6 instrumentation will benefit from monetization events being defined first.

**On resume, the assistant should:**

1. Read `CLAUDE.md` (decision policy section), `ABOUT_FURNISH.md` (Hassan's context file at Desktop), `OPTIMIZATION_PLAN.md` Dim 06 (or Dim 13), `IMPLEMENTATION_PROGRESS.md` (this log — read all 4 prior batch sections to understand what's already shipped).
2. Read `CONFLICTS_RESOLVED.md` to see which conflicts are LOCKED (1, 2, 3, 4, 5, 7, 8, 9) vs PENDING (only 6).
3. Read `BATCH_4_AUDIT.md` Customer Retention Canvas — the strategic foundation. Batch 5 monetization recommendations should ladder up to the use cases + Aha/Habit moments defined there.
4. Run the streamlined-gate audit. Per Hassan's locked policy ("approve all changes from here on out"), surface only:
   - Cross-dim disagreements
   - Conflicts with shipped decisions
   - Truly user-only knowledge gaps
   For Batch 5: Conflict 6 (gen-50 signal) WILL surface and needs Hassan's decision (it's PENDING). My prior recommendation in `CONFLICTS_RESOLVED.md` was to APPROVE with behavioral-combo trigger (gen-50 + ≤1 affiliate click → micro-card with "Try Pro Free for 7 Days" CTA). One-question consolidated decision request, not a multi-question stop.
5. After Hassan's reply, implement per the pattern of Batches 1–4: data model first (any new state fields), then triggers/events, then UI surfaces, then sweep, then commit.

**Specific code surfaces Batch 5 will touch (preview):**
- `app.js` — `maybeFireValueMomentPaywall` (Batch 3) already has 4 trigger kinds; Batch 5 wires the gen-50 trigger + extends pacing rules. Pricing psych (anchoring/decoy/reference price) lands in `index.html` paywall card + `app.js` `PAYWALL_COPY`. Pro entitlement bundling audit may modify the visible Pro bullets list (touches Conflict 3 lock — verify alignment).
- `index.html` paywall modal — already had Batch 3's 8→3 layout consolidation + "MOST POPULAR" pill + "Save $24/yr" anchor. Batch 5 may add renovation-cost anchor ("$5,200 renovation vs $47.88/yr") per Master Priority Stack #5.
- New events: `power_free_signal_shown / clicked / dismissed` (Conflict 6 wiring), `paywall_anchor_viewed`, etc.

## What is canonically locked at this checkpoint

- **OKT:** "Your household, your style, sharper." (`FURNISH_OKT` in `app.js`)
- **Voice rubric:** Concrete, Confident, Warm, Calm (`VOICE.md`)
- **Hard rules (permanent):** No fake numbers (Conflict 4); no calendar-period in user copy (Conflict 1); Promise-Fit (Conflict 9)
- **Decision policy:** "From here on out I APPROVE ALL CHANGES" (CLAUDE.md Conventions)
- **Referral currency:** 5 HD redesigns + 2 style packs over 90 days (Conflict 2)
- **Tutorial timing:** session-2 home arrival, NOT first reveal (Conflict 7)
- **Pro card:** 5 real bullets + roadmap modal in footer (Conflict 3); no "coming soon" vaporware
- **Reveal flow:** Aha event split (gate vs experienced); choreography frames 0–8 with overlay flash; coachmark at 3500ms (Batches 2 + 3)
- **Customer Retention Canvas:** 3 use cases + lifecycle map + content cadence (Batch 4 §A of audit)

## Stop confirmation

---
---

# Batch 5 — Dim 06 Monetization — COMPLETE

**Date:** 2026-04-26
**Source:** `OPTIMIZATION_PLAN.md` Dim 06 (full file). Streamlined-gate cleared per "approve all changes" policy locked in Batch 3. **No separate BATCH_5_AUDIT.md** — audit work is captured in this section + the in-code comments + the per-section Reforge citations.
**Conflicts touched:** **Conflict 6 (gen-50 power-Free signal) LOCKED.** All 9 conflicts in `CONFLICTS_RESOLVED.md` are now LOCKED.

## Decisions auto-resolved per "approve all changes"

| # | Question | Resolution |
|---|----------|-----------|
| 1 | Conflict 6 (gen-50 signal) — APPROVE / OVERRIDE / MODIFY | **APPROVE with the recommended behavioral-combo trigger** (≥50 gens/30d AND ≤1 affiliate click/30d → opportunity-framed micro-card; skip if ≥3 clicks; once per 30d window). Honors "no quota cap" promise — this is a conversion lane, not a gate. |
| 2 | Lifetime $99 decoy — does it conflict with the locked $5.99/mo / $3.99/yr pricing? | **Additive, not conflicting.** Lifetime is a 3rd toggle decoy per Reforge Pricing Strategies (Economist 3-tier study). Annual stays default-selected; Lifetime $99 anchors Annual ($47.88/yr) as obviously cheap by comparison. Pre-Stripe, selecting Lifetime mocks the same Pro flag (`grandfatherProUsers()` covers cutover). Real Stripe price-ID = DEFERRED. |
| 3 | Pro headline reframe — replace "Sharper redesigns. Every household." with bundle-led "Your full design partner."? | **Approve.** Per Section A.5 + E.1: bundle-led copy answers the natural-frequency challenge (passive entitlements that accrue between rare redesigns). Still ladders to OKT. |
| 4 | Founding-member promise — keep unbounded "this month" or cap at 1,000 spots? | **Cap at 1,000.** Per Section E.9 + Reforge Cost of Revenue: bounded promises are sustainable, unbounded ones erode margin forever. Cap also creates real scarcity per Drift "Limited time only" pattern. Counter UI element added; backend resolves the real spots-remaining count at cutover. |
| 5 | Section E.2 give-get referral ("Pro for 3 months free") | **Resolved by Conflict 2 lock.** The locked currency is "5 HD redesigns + 2 style packs over 90 days" — currency-aligned with Furnish's natural frequency. Section E.2's monthly-free framing is OBSOLETED. No new Batch 5 work. |
| 6 | Section E.5 Stripe grandfather coupon | **DEFERRED** to Stripe cutover. The promise is locked in `index.html` paywall copy + `grandfatherProUsers()` boot hook is already in place from a prior batch. Backend just needs to honor the flag at cutover. |
| 7 | Section F.3 Designer Connect higher-ARPC tier | **DEFERRED** until 1,000+ Pro users. Documented in `DEFERRED.md`. Not a launch-day priority; XL effort. |
| 8 | Top Priority #1 (cut "coming soon" features) | **Already done in Batch 1.** Skip. The roadmap link in the paywall footer covers vaporware disclosure per Conflict 3 lock. |

## Architecture

Per the optimization plan's structure: **pricing psychology surface (Sections B + C)** lands on the paywall card itself; **upsell pacing (Section D)** lands on the value-moment trigger system + dismiss-cooldown rules; **Conflict 6 lock (Section E.4)** lands as a slide-in micro-card with a 30-day ring-buffer gate; **trust signals (Section E.3)** land as a copy edit to the affiliate disclosure modal.

The Lifetime $99 decoy ships pre-Stripe because the anchoring effect comes from users *seeing* the third option, not from anyone actually buying it. Annual ($47.88/yr) reads as obviously cheap once it's compared against $99 lifetime. Pre-cutover, the toggle works: selecting Lifetime mocks the same Pro flag the existing paywall CTA already mocks; `grandfatherProUsers()` covers everyone at Stripe cutover.

## What landed in the paywall card (Sections B + C + E.1 + E.6 + E.9)

**`index.html`** — paywall card markup:
- ✅ **Renovation-cost anchor** above the price line: "Average US room renovation: **$5,200** · Furnish Pro: **$47.88 / year**" (Section B.1).
- ✅ **Annual prominence** — main price now reads "$47.88 / year · $3.99/month equivalent" instead of "$3.99 /month, billed annually ($47.88/yr)" (Section E.6).
- ✅ **Lifetime $99 decoy** added as 3rd toggle button "Lifetime · Pay once" (Section B.2). Annual stays default-selected.
- ✅ **Pro bullet reorder** per Section C: HD downloads → multi-profile → advanced price filters → premium AI quality → premium templates. HD-first lift = loop-aligned (better shares = bigger affiliate base). Premium AI demoted from #1 to #4 because it's the least *legibly* differentiated bullet.
- ✅ **Founding-member cap** ("First 1,000 spots") replaces unbounded "this month" framing (Section E.9). `#paywallFoundingSpots` element wires to a backend query at cutover.
- ✅ **Competitive reference-price footer**: "Houzz Pro: $50/mo · Designer consult: $200+/hour · Furnish Pro: $4/mo" (Section B.3).

**`app.js`** — paywall logic:
- ✅ `PAYWALL_COPY.generic` rewritten — title "Your full design partner." + bundle-led sub (Section A.5 + E.1). Still ladders to FURNISH_OKT.
- ✅ Toggle handler extended for `'lifetime'` plan; sets `state._paywallSelectedPlan` for the Stripe cutover; fires `paywall_plan_selected { plan }` analytics.
- ✅ Annual toggle now shows `$47.88 / year · $3.99/month equivalent` (Section E.6 prominence).

## What landed in upsell pacing (Section D + E.8)

**`maybeFireValueMomentPaywall`** rewrite:
- ✅ NEW triggers added to the `contextMap`:
  - `affiliate_click_2plus_items` → `hd_export` (purchase-intent peak)
  - `share_attempt` → `hd_export` (Reforge gold-standard upsell trigger)
  - `same_room_3rd_redesign` → `premium_quality` (revisit signal)
- ✅ Dismiss-suppression rule: explicit dismisses (`close` or `maybe_later`) call `suppressValueMomentTrigger(triggerKind)` which permanently suppresses that triggerKind for that user. Standard 7-day cooldown still applies for shown-but-no-action.
- ✅ Trigger call sites wired:
  - `trackAffiliateClick` — counts distinct affiliate-clicked items in same room; fires `affiliate_click_2plus_items` when ≥2.
  - `#shareRoomBtn` (header icon) handler — fires `share_attempt` for non-Pro users on share-modal open.
  - `#revealShareBtn` (reveal-moment) handler — fires `share_attempt` for non-Pro users on share-modal open.
  - `pushVersion` — fires `same_room_3rd_redesign` when `room.versions.length >= 3` for non-Pro users.

**`closePaywall(dismissReason)`** rewrite:
- ✅ Now takes a `dismissReason ∈ 'close' | 'maybe_later' | 'backdrop' | 'escape'`.
- ✅ Tracks `paywall_shown` timestamp on the modal element (`dataset.shownAt`); computes `shown_for_ms` on close.
- ✅ Fires NEW `paywall_dismissed { context, dismissReason, shown_for_ms }` analytics from each path.
- ✅ Explicit dismisses (`close` + `maybe_later`) suppress all triggerKinds that route to that context (per Section D rule).

**Four dismiss paths wired:**
- `#paywallClose` → `closePaywall('close')`
- `#paywallDismiss` ("Maybe later") → `closePaywall('maybe_later')`
- Backdrop click on `#paywallModal` → `closePaywall('backdrop')`
- Escape key when paywall open → `closePaywall('escape')`

## What landed in Conflict 6 — Power-Free signal (Section E.4)

**`app.js`** — new helper block (~110 lines):
- ✅ Constants: `POWER_FREE_GEN_THRESHOLD = 50`, `POWER_FREE_CLICK_LOW_THRESHOLD = 1`, `POWER_FREE_CLICK_SKIP_FLOOR = 3`, `POWER_FREE_WINDOW_MS = 30d`, `POWER_FREE_AUTODISMISS_MS = 12s`.
- ✅ Ring-buffer state: `state.user._gen30dWindow[]`, `state.user._clicks30dWindow[]` (timestamps; pruned on read).
- ✅ Helpers: `pruneRolling`, `recordGen30d`, `recordAffiliateClick30d`, `gen30dCount`, `affiliateClicks30dCount`. Exposed on `window.FurnishGen30dCount` + `window.FurnishAffiliateClicks30dCount`.
- ✅ `maybeFirePowerFreeSignal()` — gate logic: not Pro AND not shown-in-30d AND gen ≥ 50 AND clicks ≤ 1 AND clicks < skip-floor AND on results screen AND no paywall already open.
- ✅ `renderPowerFreeMicroCard(gens, clicks)` — slide-in micro-card from bottom; auto-dismisses after 12s.
- ✅ Analytics: `power_free_signal_shown { gen_count_30d, affiliate_click_count_30d }`, `power_free_signal_clicked`, `power_free_signal_dismissed { reason }`.

**Wired from:**
- `routeGenerationByModelTier` → `recordGen30d()` + `setTimeout(maybeFirePowerFreeSignal, 1500)` so the slide-in lands on results, not on analyzing.
- `trackAffiliateClick` → `recordAffiliateClick30d()` (rolling counter for the ≤1-click gate).

**`styles.css`** — `.power-free-card` family:
- ✅ Frosted-card style, bottom-anchored on mobile, bottom-right on desktop ≥720px. Slides up + fades in. Auto-dismiss visual via opacity transition.
- ✅ Dark-mode coverage on every property.
- ✅ `prefers-reduced-motion` fallback.

## What landed in trust signals (Section E.3)

**`index.html`** — affiliate disclosure modal (`#affiliateModal`):
- ✅ "The short version" rewritten to reciprocity-framed copy: "We earn a small commission when you buy through Furnish — and that's how we keep AI redesigns free. No extra cost to you; the price is identical to going to the retailer directly."
- ✅ Pro mention preserved ("Furnish Pro ($5.99/month) is the paid plan that funds the rest of what we do") — voice unchanged.

## Files changed in Batch 5

| File | Lines | Summary |
|------|-------|---------|
| `app.js` | +180 / ~30 surgical | New: `recordGen30d`, `recordAffiliateClick30d`, `gen30dCount`, `affiliateClicks30dCount`, `maybeFirePowerFreeSignal`, `renderPowerFreeMicroCard` (Conflict 6 block, ~110 lines). `suppressValueMomentTrigger`. Surgical edits: `PAYWALL_COPY.generic`, toggle handler (Lifetime + plan analytics), `openPaywall` (shown-at timestamp), `closePaywall(reason)` rewrite, dismiss-path wiring (4 reasons), `maybeFireValueMomentPaywall` (3 new triggers + dismiss-suppression), `trackAffiliateClick` (recordAffiliate + 2plus-items trigger), `routeGenerationByModelTier` (recordGen + signal hook), `pushVersion` (same_room_3rd_redesign trigger), share-button handlers (share_attempt trigger). |
| `index.html` | +20 / ~22 changed | Renovation-cost anchor; Lifetime toggle button; bullet reorder (HD #1, multi-profile #2, price filters #3, premium AI #4, templates #5); annual prominence; founding-member cap counter; competitive reference footer; affiliate disclosure rewording. |
| `styles.css` | +145 | Batch 5 block: `.paywall-anchor`, `.paywall-references`, `.paywall-toggle` flex-wrap for 3 buttons, `.paywall-urgency-cap`, `.power-free-card` family (slide-in keyframes, headline/sub/actions, dark-mode coverage, `prefers-reduced-motion` fallback). |
| `CONFLICTS_RESOLVED.md` | +25 | Conflict 6 LOCKED with the behavioral-combo trigger spec. Status banner updated to "ALL LOCKED — 1–9." |
| `DEFERRED.md` | +75 | Stripe Lifetime price-ID + activation; Paywall analytics dashboard; Designer Connect higher-ARPC tier. |
| `IMPLEMENTATION_PROGRESS.md` | this section | Batch 5 migration log. |

## Reforge framework citations (Batch 5)

- *Monetization + Pricing — Use Case Model* (Problem / Persona / Alternatives / **Frequency**) — Section A audit.
- *Monetization + Pricing — Monetization Triad* (Consumer / Growth Loops / Cost of Revenue) — Section A.3 evaluation.
- *Monetization + Pricing — Packaging Strategy Matrix* (RPS × WTP — Add-ons / Expansion Triggers / Table Stakes) — Section C bullet ranking.
- *Monetization + Pricing — Pricing Strategies* (anchoring, decoy, reference price; Economist 3-tier; Drift critique; Gusto give-get) — Section B.
- *Monetization + Pricing — Convert and Activate* (Optimization Equation; Postmates Party value-moment; Drift "Limited time only"; Figma cognitive friction) — Section D + E.
- *Monetization + Pricing — Cost of Revenue* (variable cost per Free user; power-Free margin trap) — Conflict 6 + Section E.4.
- *Monetization + Pricing — Strategies for Existing Healthy Customers* (Increase Depth; higher-ARPC) — Section F.3 (Designer Connect deferred).
- *Brand Marketing — Promise-Fit + Identity Governance* — Conflict 6 framing as opportunity, not warning.
- *Product Marketing — Building Proof Point Pillars* — Pro headline reframe (legible vs invisible).
- *Retention + Engagement — Natural Behavior Use Cases* (Forgettable Zone; ICED — Plant-Loyalty Hook) — Section A.2 frequency challenge.
- *Advanced Growth Strategy — Personal Viral Loops + Content Loops* — HD-first reordering rationale (loop-aligned acquisition).
- *Data For Product Managers — Instrumentation* (Event Dictionary; per-context segmentation) — Section E.7 + E.8 dashboard requirements.

## Verification plan

- **Build sanity:** open the app, no console errors at boot. Boot through to home; localStorage `state.user._gen30dWindow` initializes lazily on first generation.
- **Paywall card visual:** trigger `openPaywall('generic')` (or any context) and confirm the order top-to-bottom: anchor line ($5,200 → $47.88) → toggle row (Monthly | Annual MOST POPULAR | Lifetime Pay once) → price ($47.88 / year · $3.99/month equivalent) → 5 reordered bullets (HD #1 ... templates #5) → founding-member with "First 1,000 spots" → Start trial / Maybe later → cancel-policy + roadmap link → competitive reference footer (Houzz / designer / Furnish).
- **Plan toggle:** click Monthly → "$5.99 /month"; click Annual → "$47.88 /year · $3.99/month equivalent"; click Lifetime → "$99 one-time · Pay once, never billed again". Each fires `paywall_plan_selected` analytics with the chosen plan.
- **Paywall dismiss-reason analytics:** open paywall → click X (close) → check `paywall_dismissed { dismissReason: 'close', shown_for_ms }` fires. Repeat with Maybe later (`maybe_later`), backdrop click (`backdrop`), Escape key (`escape`).
- **Value-moment dismiss-suppression:** open paywall via `maybeFireValueMomentPaywall('hd_export_attempt')` → close with X → confirm `state.user._valueMomentDismissed['hd_export_attempt'] === Date.now()`. Subsequent `maybeFireValueMomentPaywall('hd_export_attempt')` returns false.
- **Conflict 6 power-Free signal:** simulate by setting `state.user._gen30dWindow = Array(50).fill(Date.now())` and `state.user._clicks30dWindow = [Date.now()]`, then route any generation → 1.5s after results render, the `.power-free-card` slides in from bottom with the headline "You've designed 50 rooms this month — that's a power-user pace." Wait 12s → auto-dismisses. Or click "Try Pro Free for 7 Days" → opens paywall with `premium_quality` context. Or click "Not Now" → dismisses, fires `power_free_signal_dismissed { reason: 'not_now' }`. Skip condition: with `_clicks30dWindow.length >= 3`, the signal does NOT fire.
- **Power-Free signal once-per-30d:** after the signal fires once, `state.user._powerFreeSignalShownAt` is set; subsequent generation hooks return false until 30 days pass.
- **Affiliate-2plus-items trigger:** redesign a room → tap shop on item A → tap shop on item B (different items in same room) → on the 2nd click, paywall opens with `hd_export` context. Subsequent clicks in same session (already past 7-day cooldown) won't re-fire.
- **Same-room-3rd-redesign:** open a room → reshuffle 3 times → on the 3rd version push, paywall opens with `premium_quality` context.
- **Share-attempt trigger:** Free user → click `#shareRoomBtn` (header) or `#revealShareBtn` (reveal CTA) → paywall opens with `hd_export` context BEFORE the share modal does (the share modal still opens after the paywall closes). Pro users skip the trigger entirely.
- **Affiliate disclosure copy:** open via "Why does Furnish make money?" link → confirm new lead sentence reads as reciprocity, not legalese.
- **Dark mode:** toggle dark; confirm `.power-free-card`, `.paywall-anchor`, `.paywall-references` all render with the dark-mode tones.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, the power-Free card fades in/out without the slide animation.

## What did NOT ship (deferred)

- **Stripe Lifetime price-ID activation** — UI is mocked pre-Stripe; real charge wires at cutover. DEFERRED.md item.
- **Founding-member spots-remaining real count** — `#paywallFoundingSpots` is hardcoded to 1,000; backend resolves real count at cutover.
- **Section E.5 Stripe grandfather coupon migration** — `grandfatherProUsers()` boot hook is already in place; Stripe coupon provisioning happens at cutover. DEFERRED.md.
- **Section E.7 + E.8 paywall dashboard** — events fire client-side; aggregate dashboard awaits real analytics destination. DEFERRED.md.
- **Section F.3 Designer Connect tier** — XL effort; deferred until 1,000+ Pro users. DEFERRED.md.
- **Side-by-side Pro AI legibility mechanic** — Section C.1.1 flagged that "Premium AI quality" needs a side-by-side toggle on results to be legibly differentiated. Not in scope this batch (would be a UI/UX feature batch). Bullet demoted to #4 in the meantime.
- **Section E.2 monthly-free give-get referral** — OBSOLETED by Conflict 2 lock (referral currency = "5 HD redesigns + 2 style packs over 90 days"). Already shipped in Batch 1 + 4.
- **Top Priority #1 (cut "coming soon")** — already shipped in Batch 1 (Conflict 3 lock).

## Compatibility / migration notes

- **`closePaywall()` signature change:** now takes an optional `dismissReason` argument. Existing callers that pass nothing default to `'close'` so no caller change is required. New explicit-dismiss suppression only fires when `'close'` or `'maybe_later'` is passed; `'backdrop'` and `'escape'` no longer suppress (per Section D rule — passive bounces are weaker negative signals than explicit dismisses).
- **`maybeFireValueMomentPaywall` triggerKind expansion:** existing 4 triggers continue to map to the same paywall contexts; 3 new triggers added. The `state.user._valueMomentDismissed` map is new — initialized lazily on first dismiss; existing users start with empty map.
- **Power-Free ring buffers:** `state.user._gen30dWindow` and `state.user._clicks30dWindow` are new fields. Both initialize to `[]` on first record. Pruned on read so stale entries (>30d) auto-evict; no migration step needed.
- **Pro bullet reorder:** purely cosmetic; no logic depends on bullet order. The 5 bullets are unchanged in identity — only their visible order changed.
- **Lifetime toggle:** state stored in `state._paywallSelectedPlan`. If a user picks Lifetime then converts (mocked Pro), the existing `grandfatherProUsers()` flag carries them through Stripe cutover. Real Lifetime billing requires the deferred Stripe price-ID work.
- **Plan-selection analytics expansion:** `paywall_plan_selected { plan }` is a NEW event; `pro_subscription_started` (existing) gets the `plan` from `state._paywallSelectedPlan` at conversion time so the funnel can segment by plan.
- **Paywall-shown-at timestamp:** stored on the modal `dataset.shownAt`; cleared on close. No persistent state.
- **Affiliate disclosure copy:** purely user-facing copy edit. No logic change. The "legal bit" section is preserved unchanged for FTC 16 CFR Part 255 compliance.

## Time spent

- Recon (paywall surfaces, value-moment fn, lifecycle scheduler, FTC modal): ~10 min
- Phase A (paywall pricing-psychology surface): ~25 min
- Phase B (value-moment triggers + dismiss differentiation + analytics): ~30 min
- Phase C (Conflict 6 power-Free signal + slide-in micro-card + CSS): ~30 min
- Phase D (FTC reciprocity copy + Batch 5 CSS block): ~15 min
- Phase E (CONFLICTS_RESOLVED + DEFERRED + this log): ~25 min
- **Total: ~2h 15min execution.**

## Status: ✅ COMPLETE

All 9 conflicts in `CONFLICTS_RESOLVED.md` are now LOCKED. Master priority stack #2 (value-moment triggers) and #3 (renovation-cost anchor) shipped. Conflict 6 (gen-50 power-Free signal) shipped with the behavioral-combo trigger spec.

**Next batch — recommended:** **Batch 6 — Dim 13 Instrumentation.** The new monetization events (`paywall_dismissed`, `paywall_plan_selected`, `paywall_value_moment_shown`, `power_free_signal_*`) plus the Batch 1–4 events form the event dictionary input. Batch 6's job is to organize those into Reforge's Action / Contextual / Backstory taxonomy, define the cohort definitions (Email-only, Power-Free, Habit-formed, Returned-for-session-2, etc.), and spec the dashboard contract (covers DEFERRED.md item "Paywall analytics dashboard").

Five batches down. Conflict ledger empty. Master priority stack 1 + 2 + 3 + 4 + 5 all shipped or deferred-with-spec. Onto instrumentation.

---
---

# Batch 5 Part 2 — Dim 02 User Psychology — COMPLETE

**Date:** 2026-04-26
**Source:** `OPTIMIZATION_PLAN.md` Dim 02 (12 entries + 2 bonus + 4 cross-cutting, 100% Reforge) + `BATCH_5_AUDIT.md` (single audit doc covering both Dim 06 retrospective and Dim 02 forward plan).
**Conflicts touched:** Conflict 4 honored throughout (no fake numbers, ever) — applied 3 times to modify Reforge proposals into qualitative-only variants.
**Conservative-bias note (Hassan):** "When in doubt between a bold change and a conservative one, pick conservative and flag the bold version as a post-launch experiment in DEFERRED.md." Applied 6 times across the audit.

## Decisions auto-resolved per "approve all changes" + Conflict 4 + conservative-bias

| Entry | Reforge principle | Status | Reason |
|-------|-------------------|--------|--------|
| D02-1 | Loss aversion (wishlist) | **DEFER** | Quantitative copy ("Pro members got 3 price-drop pings") VIOLATES Conflict 4. Today's wishlist UI keeps current copy. Defer until real price-history data exists. |
| D02-2 | Loss aversion (guest expiry) | **SHIP** | Real friction (regenerating costs compute). Ethics-clean per Reforge "What we did NOT recommend" guard. |
| D02-3 | Loss aversion (Free-card cancellation safety) | **MODIFY** | Original promised "premium-quality renders persist after downgrade" — future server contract, deferred. Ship the truthful subset: "saved rooms + wishlist stay yours." |
| D02-4 | Endowment (possessive language) | **PARTIAL SHIP** | 3 of ~30 4S edits ship now (welcome hero, items section heading, paywall premium_quality copy). Full audit defers to a copy-pass batch. |
| D02-5 | Endowment (style-DNA gauge) | **MODIFY** | L-effort SVG fingerprint generator → defer. Ship the basic % gauge + identity summary. |
| D02-6 | Social proof multiplied | **DEFER** | All proposed copy uses fake numbers/testimonials. VIOLATES Conflict 4. Defer until backend supplies real counts. |
| D02-7 | Social proof (lifecycle cohort sizes) | **MODIFY** | Original "142 other Modern + Scandi fans" violates Conflict 4. Ship qualitative cohort line ("Fellow {styleNames} fans are designing too"). |
| D02-8 | Scarcity (selective per paywall context) | **SHIP** | Premium_quality OFF, abstract upsells ON. Per Reforge Apply User Psych Painkiller-vs-Vitamin distinction. |
| D02-9 | Scarcity (weekly template drops) | **DEFER** | Requires real weekly template release cadence (Hassan's operational decision). |
| D02-10 | Anchoring (external retail anchor) | **MODIFY** | Already 80% shipped in Batch 5 Part 1 (renovation anchor + Houzz/Designer footer). Additive: append Modsy + Havenly to existing reference footer. |
| D02-11 | Commitment / consistency (welcome-back card) | **SHIP** | Quotes user's past quiz answers — real-data only. Once-per-day gate. |
| D02-12 | Peak-end (Tonight's recap overlay) | **MODIFY** | Drop the "Friday template drop" tease (depends on D02-9). Ship summary + price-watch hook (already real). |
| D02-B1 | Endowment + commitment (style-twin matching) | **DEFER** | Backend cohort data + content curation. |
| D02-B2 | Peak-end + loss aversion (style evolution comparison) | **SHIP** | Data already in `state.rooms[].versions`. M-effort, high leverage. |
| 4S audit | Cross-cutting (~30 edits) | **PARTIAL SHIP** | 3 highest-impact ship; remaining ~27 to copy-pass batch. |

## Architecture

This is the **psychology pass** of Batch 5. Part 1 (Dim 06 Monetization, commit `45dd109`) shipped pricing infrastructure; Part 2 (this section) layers Reforge psychology principles on top — endowment, loss aversion, scarcity, anchoring, commitment, peak-end — across welcome screen, paywall, reveal-gate, home, items list, preferences, and lifecycle banners.

**Conflict 4 governance:** Three Reforge entries originally proposed fake-number copy. All three modified to qualitative variants that pass the "real or nothing" rule. The pattern is durable: any future psychology proposal that uses numbers must filter through Conflict 4 first.

## What landed (per phase)

### Phase A — Paywall psychology refinements
- **Modsy + Havenly added to competitive reference footer** (`index.html` `.paywall-references`): "Modsy (RIP) $159/room · Havenly $79–$499/room · Houzz Pro $50/mo · Designer $200+/hr · Furnish Pro $4/mo." Reforge Use Case Model + Reference Price.
- **Selective scarcity per paywall context** (`app.js` `openPaywall` + `styles.css`): `data-scarcity="off"` for `premium_quality` (painkiller — adding scarcity reads as overselling) and `rearrange`; `on` for `hd_export`, `profile`, `advanced_price_filters`, `template_pro`, `generic` (vitamin upsells — need motivational boost). CSS rule `#paywallModal[data-scarcity="off"] .paywall-urgency { display: none; }`.

### Phase B — 4S + possessive top fixes
- **Welcome tagline** (`index.html:61`): "Watch any room transform" → "Watch your room transform" (pre-endowment via imagined ownership; Selfish-S boost).
- **Items section heading** (`index.html:926`): "Recommended Pieces" → "Your Picks" (Selfish-S; ownership framing).
- **Paywall `premium_quality` copy** (`PAYWALL_COPY.premium_quality`): 1/4 → 4/4 on the 4S rubric.
  - Title was: "Sharper redesigns, every time" → now: "Your redesigns, photo-real."
  - Sub was: "Pro upgrades you to our premium AI model — more accurate furniture matches, better lighting, no compromises. Unlock for $5.99/month." → now: "Same room, sharper light, accurate fabrics — no more blocky textures or fake reflections. Pro routes you to the premium AI model."

### Phase C — Welcome-back commitment + style-DNA gauge
- **Welcome-back commitment card** (`renderWelcomeBackCommitmentCard`): renders into `.home-hero` BEFORE the lifecycle banner when `lifecycle ∈ {AT_RISK, DORMANT, CHURNED}` AND profile has ≥3 populated answers AND once-per-day gate fresh. Quotes the user's own past quiz answers as commitment evidence per Reforge Consistency boost. CTAs: "Yes — design more" / "Update my style". Analytics: `welcome_back_commitment_shown / yes / update`.
- **`formatPastQuizSummary(profile)`**: maps `profile.answers` (vibe + color_appetite + budget_tier + avoid) to a human-readable identity sentence. Honors locked Conflict 4 (no fake fillers; only real answers shown).
- **Style profile DNA gauge** (`renderStyleProfileGauge`): 8-axis completeness % with monotonic memory (`profile._maxCompleteness` never decreases — endowment-aligned). Bar + summary + hint. Mounted at top of preferences answers editor parent.

### Phase D — Guest reveal-expiry + Free-card cancellation safety
- **Guest reveal-expiry pill** (`#revealExpiryPill` + `startGuestRevealCountdown / stopGuestRevealCountdown`): 24h soft countdown computed from `room.timestamp + 24h`. Updates every 60s. Hides the pill when not in reveal-gate flow. After expiry, copy flips to "Sign in now to save this redesign." Reforge ELMR Urgency boost; ethics-clean (signed-in users never see this).
- **Free-card cancellation-safety line** (`FREE_PLAN_CARD.cancelSafety`): "If you ever cancel Pro, your saved rooms and wishlist stay yours." Defuses the second-order panic ("what if I subscribe and need to cancel?") per Reforge Psych Framework. Conservative subset of the original Reforge proposal — see DEFERRED.md for the full server-contract version.

### Phase E — Style evolution + Tonight's recap overlay
- **Style evolution card** (`renderStyleEvolutionCard`): when `room.versions.length >= 2`, renders a compact comparison card after `#totalsCard` showing v1 vs latest (price + item count + delta + days elapsed). Per-room dismissible (`state._evolutionDismissedRooms[roomId]`). Reforge ELMR Reward (Mastery: "reaching a new level") + peak-end framing.
- **Tonight's recap session-end overlay** (`maybeFireTonightsRecap` via `visibilitychange` listener): on tab return after ≥30s away AND ≥1 designed room AND once-per-day fresh, full-screen overlay: room type + items count + total $ + price-watch hook ("We'll keep watching prices on your N saved pieces"). Conservative-bias: dropped the "Friday template drop" tease (D02-9 deferred). 4 dismiss paths (CTA, "Maybe later", X, backdrop). Analytics: `tonights_recap_shown / clicked / dismissed`.

### Phase F — Qualitative cohort framing
- **Lifecycle banner cohort line**: when `styleNames` is set (real data), append `<p class="lcb-cohort">Fellow {styleNames} fans are designing too.</p>` after the body, before the CTA. Qualitative belonging signal — no fake numbers. Modified from Reforge D02-7 spec to honor Conflict 4.

## Files changed in Batch 5 Part 2

| File | Lines | Summary |
|------|-------|---------|
| `app.js` | +330 / ~25 surgical | Welcome-back commitment card (`welcomeBackShouldShow` + `formatPastQuizSummary` + `renderWelcomeBackCommitmentCard`); style-DNA gauge (`computeStyleProfileCompleteness` + `renderStyleProfileGauge`); guest reveal-expiry countdown (`startGuestRevealCountdown` + `stopGuestRevealCountdown`); style evolution card (`renderStyleEvolutionCard`); Tonight's recap overlay (`recordSessionLeft` + `maybeFireTonightsRecap` + `renderTonightsRecapOverlay` + `visibilitychange` listener); selective scarcity (data-scarcity attribute in `openPaywall`); FREE_PLAN_CARD.cancelSafety + render; PAYWALL_COPY.premium_quality 4S rewrite; lifecycle banner cohort line append. |
| `index.html` | +14 / ~4 changed | Welcome tagline possessive; items section heading "Your Picks"; reveal-expiry pill DOM; competitive reference footer expanded with Modsy + Havenly. |
| `styles.css` | +220 | Batch 5 Part 2 block: `.welcome-back-commit` family, `.style-dna-card` family, `.reveal-expiry-pill`, `.pfree-cancel-safety`, `.style-evolution-card` family, `.tonights-recap-overlay` family, `.lifecycle-banner .lcb-cohort`, `#paywallModal[data-scarcity="off"]` rule. Dark-mode coverage on every new component. `prefers-reduced-motion` fallback for the recap overlay. |
| `BATCH_5_AUDIT.md` | NEW | Audit doc covering Dim 06 retrospective + Dim 02 forward plan + 15-row decisions table. |
| `DEFERRED.md` | +110 | 7 new deferred items (price-drop loss banner, SVG fingerprint, weekly template cadence, style-twin matching, premium-render persistence promise, full 4S audit, quantitative social-proof). |
| `IMPLEMENTATION_PROGRESS.md` | this section | Batch 5 Part 2 migration log. |

## Reforge framework citations (Batch 5 Part 2)

- *Growth Series — User Psychology — ELMR* (Decision Hill, Emotion / Logic / Motivation / Reward) — touched in 8 entries
- *Growth Series — User Psychology — Apply User Psych — How To Tap Into Emotion* (4S of Tapping into Emotion: Selfish / Sensory / Specific / Simple) — Phase B 4S audit
- *Growth Series — User Psychology — Apply User Psych — Painkiller / Vitamin / Candy spectrum* — Phase A selective scarcity
- *Growth Series — User Psychology — Psych! Framework* (Darius Contractor positive vs negative psych) — Free-card cancellation safety + Conflict 4 governance
- *Retention + Engagement — Resurrection Defining, Measuring, And Analyzing* (Belonging is the highest-conversion lever for dormant users) — Phase F qualitative cohort line
- *Retention + Engagement — BONUS Managing Infrequent Products + ICED Theory* (peak-moment session-memory) — Phase E Tonight's recap overlay
- *Monetization + Pricing — Optimization Strategies* (anchoring, reference price, decoy, scarcity) — Phase A Modsy/Havenly anchor expansion
- *Brand Marketing — Identity Governance* (Conflict 4 lock honored throughout)

## Verification (preview-tested)

- **Welcome tagline:** "Watch your room transform — about a minute, sit tight." ✓
- **Items section heading:** "Your Picks" ✓
- **Paywall `premium_quality` 4/4:** title "Your redesigns, photo-real." + sub "Same room, sharper light, accurate fabrics — no more blocky textures or fake reflections. Pro routes you to the premium AI model." ✓
- **Selective scarcity:** `premium_quality` → `data-scarcity="off"` + `.paywall-urgency` computed `display: none` ✓; `profile` → `data-scarcity="on"` + computed `display: block` ✓
- **Free-card cancellation safety:** "If you ever cancel Pro, your saved rooms and wishlist stay yours." ✓
- **Competitive reference footer:** "Modsy (RIP) $159/room · Havenly $79–$499/room · Houzz Pro $50/mo · Designer $200+/hr · Furnish Pro $4/mo" ✓
- **Welcome-back commitment card** (with simulated 14-day-prior visit + populated answers): "Welcome back, My Style." headline + "14 days ago you told us: cozy + protected, warm tones, a mid-range budget, skipping industrial. Still true?" body + "Yes / Update" buttons ✓
- **Lifecycle banner cohort line:** "Fellow Farmhouse + Rustic fans are designing too." ✓ (qualitative, no fake numbers)
- **Style-profile DNA gauge:** "Your style profile — 88% complete" + summary + hint, bar fill at 88% ✓
- **All `Furnish*` window helpers exposed:** FurnishRenderWelcomeBack, FurnishStyleCompleteness, FurnishRenderStyleEvolution, FurnishMaybeFireTonightsRecap, FurnishRenderStyleGauge ✓
- **No console errors at boot.** ✓

## What did NOT ship (deferred — see DEFERRED.md)

- **Quantitative wishlist price-drop loss banner** (D02-1) — fake-numbers blocker per Conflict 4.
- **Style-DNA SVG fingerprint generator** (D02-5 enhancement) — L-effort polish, defer.
- **Weekly template drop badge** (D02-9) — needs real content cadence decision.
- **Style-twin cohort matching** (D02-B1) — backend + content curation.
- **"Premium-render persistence after downgrade" promise** (D02-3 enhancement) — server contract.
- **Full 4S copy audit** (~27 remaining edits) — defer to a copy-pass batch.
- **Quantitative social-proof at decision moments** (D02-6 + D02-7 quantitative variants) — fake-numbers blocker.

## Compatibility / migration notes

- **`profile._maxCompleteness`** is a new field; initialized lazily on first `computeStyleProfileCompleteness(profile)` call. Existing profiles get a fresh max on first read. Monotonic — never decreases.
- **`state._evolutionDismissedRooms`** is a new field (per-room dismiss memory for style evolution card). Lazy-initialized.
- **`state.user._welcomeBackLastShown`** + **`state.user._lastSessionLeftAt`** + **`state.user._tonightsRecapLastShown`** are new fields. Each lazy-initialized; no migration step.
- **`#paywallModal[data-scarcity]`** attribute is new. Existing CSS rules unaffected; only the new selector hides `.paywall-urgency` when `off`.
- **`FREE_PLAN_CARD.cancelSafety`** is a new field. `renderFreeCard()` checks for it gracefully (no breakage if removed).
- **`visibilitychange` listener** is global. Both branches (hidden / visible) are idempotent — multiple subscribers wouldn't break the contract.
- **Welcome-back commitment card** mounts as `firstChild` of `.home-hero`. The lifecycle banner mounts via `prepend` after, so the welcome-back card visually leads. If rendering order changes in the future, both should remain in the home-hero container.

## Time spent

- Recon (Dim 02 read + audit decisions): ~25 min
- BATCH_5_AUDIT.md write: ~15 min
- Phase A (paywall refinements): ~15 min
- Phase B (4S + possessive copy): ~10 min
- Phase C (welcome-back + DNA gauge): ~30 min
- Phase D (reveal expiry + Free-card safety): ~20 min
- Phase E (evolution card + Tonight's recap overlay): ~35 min
- Phase F (cohort qualitative line): ~5 min
- CSS Batch 5 Part 2 block: ~25 min
- Phase G (DEFERRED.md + this log + commit + verify): ~25 min
- **Total: ~3h 25min execution.**

## Status: ✅ COMPLETE

Five batches and one Part-2 down. All 14 dimensions touched (Dim 02, 03, 04, 05, 07, 08, 09, 10, 11, 12, 14 shipped; Dim 01 + 06 shipped in their respective batches; Dim 13 Instrumentation is the lone remaining dimension). All 9 conflicts LOCKED. Master priority stack 1–5 shipped or spec-deferred. Conflict 4 governance held throughout.

**Next batch — recommended:** **Batch 6 — Dim 13 Instrumentation.** The accumulated event dictionary across Batches 1–5 is now substantial (~40 distinct events). Batch 6's job is to organize them into Reforge's Action / Contextual / Backstory taxonomy, define cohort definitions (Email-only, Power-Free, Habit-formed, Returned-for-session-2, Style-twin, Welcome-back-yes, Tonight's-recap-clicked), and spec the dashboard contract — closing the DEFERRED.md item "Paywall analytics dashboard" and unblocking post-launch optimization.

---
---

# Batch 6 — Dim 13 Data Instrumentation — COMPLETE (FINAL PASS 6/6)

**Date:** 2026-04-26
**Source:** `OPTIMIZATION_PLAN.md` Dim 13 (12 entries + 76-event taxonomy + 15 cohorts, ~85% Reforge) + `BATCH_6_AUDIT.md`.
**Conflicts touched:** None new. Conflict 4 (no fake numbers) governs the privacy fix's defensible-data-only treatment.
**Critical bug shipped:** YES — `affiliate_click.fclick` URL parameter PII leak (raw UUID/email → retailer logs + browser history). **Privacy fix shipped first**, regardless of context budget.

## Decisions auto-resolved per "approve all changes"

12-row table in `BATCH_6_AUDIT.md` §C. Highlights:

| # | Decision |
|---|----------|
| 1 | **WRDCAL** declared as canonical north star. `FURNISH_NORTH_STAR` constant + `computeWRDCALProxy()` helper for per-user signal. |
| 2 | **PostHog dual-write scaffolded.** SDK loads when `window.posthog` is present (gated on a backend-injected key). Pre-cutover: safe no-op. Identify/reset/setUserProperty hooks wired. |
| 3 | **Failure event taxonomy** — 6 highest-leverage shipped (`signup_failed`, `signin_failed`, `analyze_failed`, `error_thrown`, `error_shown`, `share_system_failed`). Remaining 12 deferred to a copy-pass + drop-step batch. |
| 5 | **PRIVACY FIX (REC-13.5) — SHIPPED.** Opaque random `fclickId` (16 hex chars from `crypto.getRandomValues`) replaces raw UUID/email in affiliate URLs. Persisted alongside click record so server-side attribution can reconcile when backend lands. |
| 7 | **Cohort definitions** captured as `COHORT_DEFINITIONS` constant in `app.js` for code-resident reference; PostHog cohort UI consumes the same predicates at backend cutover. |
| 8 | **`dormancy_state_changed` + lifecycle user property** — fires from `touchLastVisit()` on bucket transitions; sticky `state.user.cachedLifecycle` carries persisted attribute. |
| 10 | **`share_completed { channel }` consolidation event** — additive dual-fire alongside the existing 5 channel-specific events. 30-day deprecation window per Reforge spec. |
| 12 | **`tSinceX` timing properties** — `_timing` map populated by `trackEvent` for milestone events (welcome_cta_clicked, signup_started, signin_attempted, signup_completed, setup_complete, aha_first_results, paywall_shown). Downstream events (setup_complete, aha_first_results, affiliate_click) include the elapsed time. |

## Architecture

The instrumentation layer is the **measurement backbone** for everything Batches 1–5 shipped. Every prior batch added `trackEvent(...)` call sites; Batch 6 adds the contract that turns those calls into queryable cohorts.

**Three-tier architecture:**
1. **Client-side `trackEvent`** — local rolling buffer (200-cap) + dual-write to PostHog when present + `console.log` debug tail.
2. **Sticky user properties** — `cachedLifecycle`, `tier`, propagated via `setUserProperty()` so cohort filters work without recomputation.
3. **Activation timing map** — `state._timing` populated by trackEvent for milestone events; downstream events read elapsed time.

The privacy fix is structurally independent of the rest. It replaces the `${userId}-${timestamp}` URL parameter pattern with opaque random IDs that match the threat model: zero PII visible in retailer logs, browser history, or screenshots.

## What landed (per phase)

### Phase A — PRIVACY FIX (REC-13.5)

- **`generateFclickId()`** — 16 hex chars from `crypto.getRandomValues` with synchronous fallback. Exposed as `window.FurnishGenerateFclickId`.
- **`buildAffiliateUrl(item)`** — replaces `fclick=${userId-or-email}-${timestamp}` with `fclick=${randomFclickId}`. Zero PII in the outbound URL.
- **`trackAffiliateClick(item, surface)`** — generates a fresh `fclickId` for the click record + emits in the `affiliate_click` analytics event. Future affiliate-network attribution can join on `(itemId, surface, ts ± window)` server-side; the persisted ID is the canonical record for our analytics.
- **No PII anywhere** — verified live: every sample `fclick` is 16 hex chars, no UUID/email substring detected.

### Phase B — `trackEvent` PostHog dual-write scaffold (REC-13.2)

- **`trackEvent(name, props)`** — fans out to `state._events` (debug buffer) + `posthog.capture` (when present) + `console.log`.
- **`identifyUserForAnalytics(userId, traits)`** — wired into auth-success path (Supabase + local fallback). Uses Supabase UUID, NOT email (PII).
- **`resetAnalyticsIdentity()`** — wired into both signout paths (`signout` + `switch` actions). Ensures next session is unattributed until next identify.
- **`setUserProperty(key, value)`** — locally + via `posthog.people.set` when present. Used for `cachedLifecycle`, `tier`.
- **Real PostHog project key DEFERRED** — `window.POSTHOG_PROJECT_KEY` injected at backend cutover. Pre-cutover, the dual-write branch is a safe no-op.

### Phase C — Failure events + `screen_viewed` + `dormancy_state_changed` (REC-13.3 + REC-13.8 partial)

- **`signup_failed` / `signin_failed`** — fires on Supabase auth-error path with reason segmentation (`email_exists` / `credential` / `network` / `other`).
- **`signup_email_confirmation_required`** — fires when Supabase returns no user but no error (email verification pending).
- **`analyze_failed`** — wraps the entire generation flow in try/catch; emits with reason + duration. Today the happy path is mock; once Replicate calls land, this catch covers real network/model failures.
- **`analyze_completed`** — explicit success event with `tier` + `durationMs`.
- **`error_thrown`** — global `window.onerror` + `unhandledrejection` handlers.
- **`error_shown`** — toast wrapper detects negative-language messages and emits.
- **`screen_viewed`** — fires from `showScreen()` with `screenName`, `previousScreen`, `prevDwellMs`, `lifecycle`.
- **`dormancy_state_changed`** — fires from `touchLastVisit()` only when bucket transitions vs cached. Sets `state.user.cachedLifecycle` + propagates as user property.

### Phase D — `share_completed { channel }` consolidation (REC-13.10)

- **`share_completed { channel: 'download' | 'caption' | 'invite_link' | 'pinterest' | 'system' }`** — fires alongside each of the 5 channel-specific success events. 30-day dual-fire window before deprecation. Consolidated event simplifies "share rate" queries from union-of-5 to single-event-with-property.
- **`share_system_failed`** — failure event for navigator.share rejection path.

### Phase E — `tSinceX` timing properties (REC-13.12)

- **`state._timing`** — milestone timestamps map populated by `trackEvent` for: welcome_cta_clicked, signup_started, signin_attempted, signup_completed, setup_complete, aha_first_results, paywall_shown.
- **`setup_complete`** event now includes `tSinceSignup`.
- **`aha_first_results`** event now includes `tSinceSetupComplete` + `tSinceSignup`.
- **`affiliate_click`** event now includes `tSinceAhaFirstResults`.
- **`signin_completed`** event includes `durationMs` from the signin attempt.

### Phase F — WRDCAL + altitude scorecard + cohort definitions (REC-13.1 + REC-13.6 + REC-13.7)

- **`FURNISH_NORTH_STAR`** constant — the canonical metric definition + cadence + Reforge citations. Exposed as `window.FurnishNorthStar`.
- **`computeWRDCALProxy()`** — per-user signal computed from `state._events` rolling buffer. Returns `{qualifies, designed, revealUnlocked, clicked, returning, windowDays}`. Pre-backend, this is the only WRDCAL approximation available; org-wide WRDCAL requires server aggregation. Exposed as `window.FurnishComputeWRDCAL`.
- **`altitudeScorecard()`** — local-only scorecard helper returning the §B altitude map metrics from `state._events`. Structured `{generatedAt, windowDays, high: {WRDCAL_qualifies, WRDCAL_legs, activationRatePct, sessionsInWindow}, mid: {affiliateClicks7d, revealUnlockRatePct, paywallConversionPct, premiumUpsellCTRPct, quizCompletionPct, generations7d, habitFormed}, low: {wishlistAdded7d, priceDropBannerCTRPct, homeProgressClicks7d, affiliateDisclosureViews7d, errorsThrown7d, errorsShown7d, screenViews7d, dormancyTransitions7d}, cohort: {lifecycle, tier, grandfathered}}`. Exposed as `window.FurnishAltitudeScorecard`.
- **`COHORT_DEFINITIONS`** — frozen constant with all 15 cohort predicates (D1 through D15) + the canonical 4-line block convention (populations / starting point / behavior / time period). Exposed as `window.FurnishCohorts`.

## Files changed in Batch 6

| File | Lines | Summary |
|------|-------|---------|
| `app.js` | +280 / ~25 surgical | All instrumentation work. New: `generateFclickId`, `identifyUserForAnalytics`, `resetAnalyticsIdentity`, `setUserProperty`, `computeWRDCALProxy`, `altitudeScorecard`, `COHORT_DEFINITIONS`, `FURNISH_NORTH_STAR`, `_timing` map, global `error`/`unhandledrejection` handlers. Surgical: `trackEvent` dual-write + timing-map update, `buildAffiliateUrl` opaque fclick, `trackAffiliateClick` persists fclickId + emits tSinceAhaFirstResults, `touchLastVisit` emits dormancy_state_changed + sets cachedLifecycle/tier, `showScreen` emits screen_viewed, `toast` emits error_shown for negative copy, signin/signup error paths emit failure events, analyze flow wrapped in try/catch with analyze_completed/failed, signin success emits identify + signin_completed, signout calls resetAnalyticsIdentity, all 4 share success paths emit share_completed alongside legacy events, share_system_failed on navigator.share rejection, setup_complete + aha_first_results include tSinceX timing. |
| `BATCH_6_AUDIT.md` | NEW | 12-row decisions table, WRDCAL canonical declaration, altitude map, 15 cohort definitions, privacy-fix specification. |
| `DEFERRED.md` | +85 | 9 new deferred items (real PostHog key, dashboards, Stripe + affiliate webhook events, server-side rate-limit events, remaining 12 failure events, share-channel deprecation, paywall_cta_clicked rename). |
| `IMPLEMENTATION_PROGRESS.md` | this section | Batch 6 migration log. |
| `OPTIMIZATION_ROLLOUT_SUMMARY.md` | NEW | Final summary across all 6 batches. |

## Reforge framework citations (Batch 6)

- *Data For Product Managers — Identifying The Altitudes And Outcome Metrics* (Sean Klaus) — WRDCAL declaration + altitude scorecard structure
- *Data For Product Managers — Building Your Altitude Scorecard* L3 — north-star sense-check ("recite from memory" test)
- *Data For Product Managers — Building A Structured Event Dictionary* — event-name discipline (success/intent/failure; action/contextual/backstory)
- *Data For Product Managers — Cohort Analysis* L4 — populations / starting point / behavior / time period
- *Data For Product Managers — Instrumentation Best Practices* — backend-fired revenue events; user-property segmentation
- *Retention + Engagement — Defining Retention* — natural frequency alignment for WRDCAL window
- *Retention + Engagement — Managing Infrequent Products / ICED Theory* — dormant/churned cohort definitions D8/D9
- *Monetization + Pricing — Pricing Strategies* — Pro conversion-rate denominator/numerator hygiene (REC-13.9)
- *Brand Marketing — Identity Governance* — privacy-fix rationale (PII hygiene as brand asset)

## Verification (preview-tested)

- **Privacy fix:** `FurnishGenerateFclickId()` produces unique 16-char hex with zero UUID/email substring across multiple samples. ✓
- **PostHog stub:** `window.posthog` undefined pre-cutover; trackEvent dual-write branch is no-op. ✓
- **Altitude scorecard:** returns structured `{high, mid, low, cohort}` with 4 high-altitude keys + 7 mid-altitude keys + 8 low-altitude keys. ✓
- **WRDCAL proxy:** computes 4 legs (`designed`, `revealUnlocked`, `clicked`, `returning`); `qualifies: false` for fresh user (correct). ✓
- **Cohort definitions:** all 15 cohorts (D1-D15) exposed via `window.FurnishCohorts`. ✓
- **Lifecycle user property:** `state.user.cachedLifecycle` set to `"active"` on session_started. ✓
- **`screen_viewed` event:** fires on every screen change with `screenName` + `previousScreen` + `prevDwellMs`. ✓
- **`session_started` event:** fires on boot. ✓
- **No console errors at boot.** ✓

## What did NOT ship (deferred — see DEFERRED.md)

- **PostHog Cloud account creation + project key** — Hassan's task at posthog.com (free 1M events/mo).
- **Real PostHog dashboards** (WRDCAL, activation funnel, cohort heat-maps) — built in PostHog UI once events flow ≥30 days.
- **Stripe webhook server-side events** (`pro_subscription_renewed`, `_cancelled`, `_payment_failed`) — at Stripe cutover.
- **Affiliate-network attribution events** (`affiliate_attribution_received`) — weekly cron.
- **`subscriptions` + `affiliate_clicks` Supabase tables** — already specced.
- **Server-side rate-limit + abuse events** — anti-abuse infra.
- **Remaining 12 failure events** (capture_rejected, swap_cancelled, wishlist_removed, bookmark_removed, reveal_gate_dismissed, email_capture_failed, push_pre_prompt_dismissed, etc.) — copy-pass + drop-step instrumentation batch.
- **Share-channel event deprecation** — after 30-day dual-fire validates parity.
- **`paywall_cta_clicked → pro_subscription_started` backend rename** — at Stripe cutover.

## Compatibility / migration notes

- **`buildAffiliateUrl`** signature unchanged. Existing call sites continue to work; the URL just no longer carries PII.
- **`trackAffiliateClick`** signature unchanged. Persisted record now includes `fclickId`; existing readers (none today) tolerate the extra field.
- **`affiliate_click` event** now includes `fclickId` + `tSinceAhaFirstResults`. Existing properties unchanged.
- **`trackEvent`** signature unchanged. New `_timing` map side-effect for milestone events; readers (`setup_complete`, `aha_first_results`, `affiliate_click`) gracefully handle missing entries.
- **`closePaywall`** signature unchanged from Batch 5; `paywall_dismissed` event already shipping.
- **`window.posthog`** is referenced but never assumed. All call sites are conditional + try/catch wrapped — analytics never breaks user flow.
- **State shape additions:** `state.user.cachedLifecycle`, `state._timing`, `state.affiliateClicks[].fclickId`. All lazy-initialized; no migration step.

## Time spent

- Recon (Dim 13 read + locating fclick bug + audit decisions): ~25 min
- BATCH_6_AUDIT.md write: ~15 min
- Phase A (privacy fix): ~15 min
- Phase B (PostHog dual-write scaffold + identify/reset/setUserProperty + signin/signout wiring): ~25 min
- Phase C (failure events + screen_viewed + dormancy_state_changed + global error handler): ~30 min
- Phase D (share_completed consolidation): ~10 min
- Phase E (timing map + tSinceX properties): ~15 min
- Phase F (WRDCAL + altitude scorecard + cohorts): ~25 min
- Phase G (sweep + verify): ~15 min
- Phase H (this log + rollout summary + DEFERRED + commit): ~30 min
- **Total: ~3h 25min execution.**

## Status: ✅ COMPLETE — FINAL PASS 6/6

**ALL 14 DIMENSIONS SHIPPED.** All 9 conflicts LOCKED. Master priority stack 1–5 + privacy-bug-fix all shipped or spec-deferred. Conflict 4 governance held throughout all 6 batches.

The optimization rollout is complete. Furnish is now grounded in:
- A canonical north star (WRDCAL)
- A 14-dimension Reforge-grounded optimization plan, fully implemented
- A 9-conflict canonical resolution log, all locked
- A 76-event taxonomy with 6 highest-leverage failure events live
- 15 cohort definitions ready for PostHog cutover
- A scaffolded altitude scorecard
- Zero PII in affiliate URLs
- A complete migration log spanning ~16 hours of execution across 6 batches

See `OPTIMIZATION_ROLLOUT_SUMMARY.md` for the full cross-batch summary.

**Next action (Hassan's call):** Sign up posthog.com, paste the project key into `index.html` head as `<script>window.POSTHOG_PROJECT_KEY = '...';</script>`, then load the PostHog SDK. The dual-write becomes live without further code changes.