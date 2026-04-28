# Budget Teardown — Phase 1 Audit (2026-04-27)

## Summary
- **272 raw `budget|Budget|BUDGET` matches** across 4 code files (app.js, index.html, styles.css, furniture.js) + ~12 markdown docs.
- **Code teardown scope:** 193 hits in `app.js`, 22 in `index.html`, 9 in `furniture.js`, 83 in `styles.css` (across 3 reconstruction-artifact duplicate blocks).
- The visible bug — "$3k" chip on every room tile — comes from `renderRoomTypeCards` (app.js:6757-6759) injecting `.rt-budget-chip` from `profile.roomBudgets[type]`. Migration at boot seeds every room with `profile.budget=3000`, so chips show "$3k" everywhere even for users who never set a budget.

## Categories of references to remove

### CAT A — State fields + storage

| Location | Field / Code | Action |
|---|---|---|
| `app.js:33-43` | `profile.budget` migration + `profile.roomBudgets = {}` per-room seeding | DELETE entire migration block |
| `app.js:193` | `DEFAULT_STATE.profiles[]` initial object had `budget: 1500` | DELETE the budget field |
| `app.js:1991` | `p.budget = 3000` in profile creation | DELETE |
| `app.js:3725` | `profile.budget = amount` write inside legacy slider | DELETE (whole `setupBudgetSlider` removed) |
| `app.js:3879` | `profile.budget = amount` legacy compat write in modal Confirm | DELETE (whole modal removed) |
| `app.js:3875-3876` | `profile.roomBudgets = {...}; profile.roomBudgets[X] = amount` | DELETE (whole modal removed) |
| `furniture.js:35-39` | `window.BUDGETS_LEGACY` enum mapping | DELETE |
| `furniture.js:41-42` | `window.BUDGET_MIN = 50; BUDGET_MAX = 10000;` | DELETE (new slider has its own constants inline) |

### CAT B — UI surfaces displaying budget

| Location | Element | Action |
|---|---|---|
| `app.js:6753-6759` | Budget chip injection in `renderRoomTypeCards` (the `$3k` leak) | DELETE chip-injection logic; revert tile rendering to clean |
| `index.html:1665-1689` | `<div id="roomBudgetModal">` markup (room-budget-modal) | DELETE entire modal |
| `index.html:586-588` | Old Budget per Room migration comment | DELETE comment |
| `index.html:1706` | Reset-dialog list text mentions "...budget..." in "10 onboarding answers" | UPDATE to 9 onboarding answers, drop "budget" word |
| `app.js:2249` | "Basic personalization (style, mood, budget)" in Free Plan card | UPDATE — drop ", budget" from the enumeration |
| `styles.css` | All `.budget-card`, `.budget-display`, `.budget-label`, `.budget-amount`, `.budget-range`, `.budget-ticks`, `.budget-ticks span` rules (3 duplicate blocks at lines 2929-3040, 3067-3175, 3217-3320 approx) | KEEP for reuse — new slider can carry these classes (they're general-purpose log-slider styling). Strip the dark-mode-thumb fix from EOF since it'll continue to apply. |
| `styles.css` | `.room-budget-modal`, `.room-budget-card`, `.room-budget-title`, `.room-budget-sub`, `.room-budget-display`, `.room-budget-label`, `.room-budget-amount`, `.room-budget-range`, `.room-budget-ticks`, `.room-budget-actions` (~80 lines at end) | DELETE entire block |
| `styles.css` | `.rt-card .rt-budget-chip` rule (~10 lines at end) | DELETE entire block |

### CAT C — Onboarding quiz Q6

| Location | Item | Action |
|---|---|---|
| `furniture.js:478-498` (approx) | `{ id: 'budget_tier', ...options: tight/smart/quality/investment/dream_first }` in `ONBOARDING_QUESTIONS` array | DELETE entire question object |
| `app.js:1487-1505` | Q6 plain-language label override block | DELETE entire block |
| `app.js:2861` | `TEXT_ONLY_QUESTIONS = ['budget_tier', 'avoid', 'dealbreaker']` | UPDATE — drop `'budget_tier'` |
| `app.js:3972-3977` | Validation `if (!a.vibe || !a.materials || ... || !a.budget_tier)` | UPDATE — drop `!a.budget_tier` and update toast copy |
| `app.js:5510` | `populatedCount` array includes `'budget_tier'` | UPDATE — drop `'budget_tier'` from the array |
| `app.js:5539-5544` | `budgetLabels` map + `if (answers.budget_tier)` branch in synthesizer | DELETE — these synthesize prompt anchors from the removed question |
| `app.js:5614` | `answers.budget_tier` in answers payload | DELETE the line |
| Quiz progress UI (state.quiz.step / `${step+1} / ${questions.length}`) | Auto-recalculates from `ONBOARDING_QUESTIONS.length` | NO CHANGE — `9 / 9` derives automatically |
| `furniture.js:401` | Comment referencing Q6 anchoring | DELETE comment line |

### CAT D — AI prompt builder

| Location | Item | Action |
|---|---|---|
| `app.js:7682-7687` | `BUDGET_TXT` constant (tier label map) | DELETE |
| `app.js:7709` | `const budgetPart = BUDGET_TXT[a.budget_tier] || BUDGET_TXT.smart;` | DELETE — replace with new `budgetSliderValue` parameter |
| `app.js:7727` | Prompt string includes `\`Optimize for ${budgetPart}.\`` | UPDATE — replace with the new slider-driven budget-band copy (Phase 2) |
| `app.js:7763` | `budgetTier: a.budget_tier` in returned prompt metadata | DELETE — replace with `budget: sliderValue` |
| `buildAIPrompt` signature | Currently takes `(answers, draft)` only | UPDATE — Phase 2 adds optional `budgetValue` parameter |

### CAT E — Picker / catalog filtering

| Location | Item | Action |
|---|---|---|
| `app.js:7805-7809` | `const roomBudget = getRoomBudget(profile, draft.type)` + `pickItemsForRoom(... roomBudget ...)` | UPDATE — read from transient `state.draft.budget` instead |
| `app.js:9100, 9188, 10160` | Same `getRoomBudget(profile, room.type)` pattern in reshuffle/keep/different-style/template flows | UPDATE — read from `state.draft.budget` |
| `app.js:3749-3753` | `getRoomBudget` helper | DELETE |
| `app.js:3738-3747` | `ROOM_BUDGET_DEFAULTS` constant | DELETE |
| `app.js:3755-3762` | `formatBudgetShort` helper | KEEP — reuse for the new slider's amount display, OR rename to `formatBudgetCompact` if a different format is needed |
| `app.js:3478-3504` | Slider helpers `sliderToBudget` / `budgetToSlider` / `formatBudget` | KEEP — reuse for the new slider but update `BUDGET_MIN`/`BUDGET_MAX` to `500` / `20000` |
| `app.js:7858-8026` | `pickItemsForRoom` accepts `budgetVal` param + does soft-budget weighting + 20% retry | KEEP — picker still uses budget; the source is just transient now |
| `app.js:11341-11351` | `priceFitWeight(itemPrice, budgetMax)` | KEEP — same |

### CAT F — Modal + handlers (the per-generation gate that's being removed)

| Location | Item | Action |
|---|---|---|
| `app.js:3789-3835` | `openRoomBudgetModal` function | DELETE |
| `app.js:3836-3845` | `closeRoomBudgetModal` function | DELETE |
| `app.js:3846-3915` | Modal IIFE wiring (slider input, Cancel, Confirm) | DELETE |
| `app.js:3914` | `window.FurnishOpenRoomBudgetModal` exposure | DELETE |
| `app.js:6850-6855` | analyzeBtn click → `openRoomBudgetModal(...)` gate | UPDATE — direct call to `_runAnalyze()` (no modal indirection); _runAnalyze reads slider value from DOM |
| `app.js:6607-6610` | `startFromTemplate` budget gate | UPDATE — same; direct call |
| `app.js:9090-9091` | `keepSwitch` click budget gate | UPDATE — same; direct call |
| `app.js:9182-9183` | `reshuffleBtn` click budget gate | UPDATE — same; direct call |
| `app.js:10125-10130` | Different-style chip click budget gate | UPDATE — same; direct call |

### CAT G — Tutorial coachmarks

| Location | Item | Action |
|---|---|---|
| `app.js:7301-7348` | TUTORIAL_STEPS array, currently has `vibe + materials + budget` trio | UPDATE — replace `budget` slot with `scope` (chosen over `decor_density` per Activation framework: scope is a 4-way binary that radically changes AI output; density is a fine-tune. Document choice in CHANGES_APPLIED.md.) |
| `app.js:7345-7348` | The `budget` step entry: `{ id: 'budget', selector: '.budget-card', headerSelector: '.budget-card', title: 'Drag this to match your real budget' }` | DELETE this step entry |
| Phase 2: NEW | Add a one-time coachmark on the capture screen pointing at the slider | NEW — added in Phase 2 |
| `app.js:3513` | Comment "(vibe, materials, budget)" | UPDATE to "(vibe, materials, scope)" |
| `app.js:7322-7325` | Tutorial section comment about color_appetite removal | KEEP — historical comment |

### CAT H — Analytics events

| Event | Action |
|---|---|
| `room_budget_modal_opened` (app.js:3834) | DELETE — event no longer exists |
| `room_budget_set` (app.js:3881) | DELETE — replaced by Phase 2 `generation_budget_set` |
| `onboarding_question_*` for `budget_tier` (auto-fired by quiz renderer) | NO CODE CHANGE — events naturally stop firing once Q6 is removed from ONBOARDING_QUESTIONS |
| `picker_underpopulated { budget: budgetMax }` (app.js:8021) | KEEP — still relevant, shows transient slider value at generation time |

### CAT I — Copy & microcopy

| Location | Copy | Action |
|---|---|---|
| `app.js:2249` | "Basic personalization (style, mood, budget)" Free Plan bullet | UPDATE — drop "budget" |
| `app.js:3977` | Toast `'Pick a vibe, at least one material, and a budget tier'` | UPDATE — drop "and a budget tier" |
| `app.js:9915` | Fake testimonial "Loved the budget slider — set $400, got an actual livable room." | UPDATE — Conflict 4 lock says no fake numbers/copy. Rewrite without specific dollar OR remove |
| `index.html:1706` | Reset-dialog "Your 10 onboarding answers (vibe, color, decor density, scope, lighting, budget, materials, room use, what to avoid, dealbreaker piece)" | UPDATE to 9 answers, drop "budget" |
| Various comments in app.js (e.g., 6290, 7301-7325) | Mentions of preferences-budget concept | UPDATE comments to reflect new model |

### CAT J — KEEP (legitimate, NOT user-budget-related)

These matches are NOT stale budget references — they're either real concepts (item prices, compute budget, animation timing) or deliberate Reforge framework references:

| Location | Why kept |
|---|---|
| `app.js:7134` | `(per IP/account, prevents compute-budget burn)` — comment about anti-abuse infra (compute, not user $) |
| `app.js:7573-7574` | `budgeting attention against latency` — animation timing rationale |
| `app.js:9801-9805, 9870` | `bs-tier 'budget'/'mid'/'premium'` classification of catalog ITEMS by price — keep (items still have prices, that's a separate concept) |
| `app.js:10512` | `Asset budget per spec: 4 SFX max` — sound design budget |
| `app.js:11341-11351` | `priceFitWeight(itemPrice, budgetMax)` — picker logic (still uses budget, just transient now) |
| `BATCH_*_AUDIT.md` + `OPTIMIZATION_PLAN.md` + similar | Internal docs reference Q6 budget_tier historically — leave as historical record |
| `MONETIZATION_AUDIT.md` | References to monetization budget concepts unrelated to user budget UI |
| `pickItemsForRoom(draft, answers, budgetVal, opts)` signature | Function still takes budget; just sourced differently |

## Reset Profile compatibility
- `profile.roomBudgets` lives on profile, not `state.user`. Profile-reset path nukes profiles entirely → roomBudgets clears automatically.
- `profile.budget` (legacy) — same.
- No `RESET_PRESERVED_USER_FIELDS` change needed.
- Need to ensure migration at boot doesn't re-create `profile.roomBudgets` for users who load fresh state (after teardown, the migration block at lines 33-43 is gone, so no new roomBudgets are created).

## Tutorial coachmark trio replacement
**Choice: `scope`** (vibe + materials + scope), not `decor_density`.

Rationale (per Reforge Activation Dim 04):
- `scope` is a 4-way categorical that radically changes the AI output: "Just furniture" vs "Whole room" produces visibly different redesigns. High-leverage activation moment.
- `decor_density` is a fine-tune: "Clean look" vs "Maximalist" affects how many accent items render but doesn't change the room's structural definition. Lower-leverage.
- Tutorial coachmarks are scarce attention budget; allocate to highest-leverage decisions.

Document choice in CHANGES_APPLIED.md per spec.

## NEW: Phase 2 coachmark
- Single coachmark on first arrival at capture screen post-quiz: "Set your budget for this room. You can change it for every room." Points at the slider.
- Tracked in `state.user.budgetSliderTutorialSeen` (separate from the existing 3-question quiz tutorial flag).

## Process

Phase 1 implementation order:
1. `furniture.js` — remove BUDGETS_LEGACY, BUDGET_MIN/MAX, Q6 budget_tier
2. `app.js` — remove all listed sections in CAT A-I
3. `index.html` — remove modal markup + update reset dialog copy
4. `styles.css` — remove `.room-budget-*` family + `.rt-budget-chip`. Keep `.budget-*` baseline rules (will be reused by Phase 2 slider).
5. Re-grep verification

Phase 2 build:
- New slider HTML in capture-screen (under `#roomTypeGrid`)
- New slider JS: range $500-$20000, variable step, $3000 default, transient (lives only in `state.draft.budget` until generation, then consumed)
- AI prompt builder reads `state.draft.budget`
- Items list above-budget marker
- Tutorial coachmark on first capture-screen visit
- Analytics: `generation_budget_set`, `generation_started.budget`, `items_filtered_above_budget`

## Stop point — Phase 1 audit complete

Phase 1 implementation begins after this audit lands. Verification gate before Phase 2: re-grep must show only legitimate matches (CAT J).
