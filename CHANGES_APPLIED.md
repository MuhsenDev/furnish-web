# CHANGES_APPLIED.md — Model A migration log

**Status:** STEP 3 in progress. This file tracks every change file-by-file as the migration proceeds. If a session ends mid-implementation, this file is the resume point.

## Approved decisions (from STEP 2)

- **D1**: 2 lifetime free generations. "Generation" = any AI image creation (fresh photo redesign OR template-based generation).
- **D2**: Free reshuffle applies to redesigns user themselves uploaded + templates they ran (not a shared sample).
- **D3**: Multi-profile is **PRO**.
- **D4**: Templates browse is **FREE**, but starting a template-based redesign **counts against the 2-gen quota** (NOT pure FREE/PRO).
- **D5**: HD download — Free gets watermarked, Pro gets clean.
- **D6**: Existing Pro users grandfathered.
- **D7**: Account creation required AFTER AI generates BUT BEFORE redesign is revealed. New flow: photo+answers → AI generates → "Create account to unlock" → signin → results.
- **D8**: Quiz access is FREE.
- **D9**: Wishlist is FREE; price-alert delivery (push/email) is PRO.
- **D10**: Rearrange furniture button is **FREE** (override — Hassan's call). AI cost must stay minimal.

## Central architecture rules

- **`gateGeneration(actionId, fn)`** — three-state quota gate:
  1. `isPro()` → allow
  2. `!isPro() && generationsRemaining() > 0` → allow + decrement
  3. `!isPro() && generationsRemaining() === 0` → paywall
- **`gateProFeature(actionId, fn)`** — pure Pro gate for HD export, multi-room batch, advanced personalization.
- **`generationsUsed`** is the canonical counter (renamed from `redesignsUsed` with migration).
- **D7 auth gate** runs AFTER the AI generation completes, BEFORE results are revealed. Only fires for guests on their first generation.

---

## Layer-by-layer change log

### Pre-flight

- [x] Created `DEFERRED.md` at repo root.
- [x] Created `CHANGES_APPLIED.md` (this file) at repo root.

### Layer 1 — Infrastructure

**`app.js` (lines ~2509–2614)**
- Added: `FREE_GENERATION_LIMIT = 2`
- Added: `generationsUsed()` — reads `state.user.generationsUsed`, falls back to legacy `redesignsUsed` and migrates
- Added: `generationsRemaining()` — `Infinity` for Pro, else `max(0, LIMIT - used)`
- Added: `hasUsedAllFreeGenerations()` — true iff non-Pro and remaining is 0
- Added: **`gateGeneration(actionId, fn)`** — centralized 3-state quota gate (Pro / remaining>0 / paywall). Per Hassan's spec, single source of truth.
- Added: **`gateProFeature(actionId, fn)`** — pure Pro gate for HD export, multi-room batch, advanced personalization
- Added: `incrementGenerationCount()` — replaces `incrementRedesignCount()`. Both fields written for backward-compat during transition.
- Renamed body class: `has-used-demo` → `has-used-free-generations`
- Kept: `isPro()`, `isGuest()`, `isSignedInFree()`, `syncFreeModeClass()` semantics
- Legacy alias kept: `hasUsedDemo()` → forwards to new helper (referenced in `PAYWALL_COPY` context promotion, Layer 4 will rewrite)
- **Stubbed for Layer 3 cleanup:** `canReshuffle()` always returns true; `canSwap()` always returns true. The call sites get deleted in Layer 3 — these stubs prevent breakage during the multi-step migration.
- Removed: `FREE_REDESIGN_LIMIT`, `FREE_RESHUFFLE_PER_ROOM`, `FREE_SWAPS_PER_ROOM` constants

**Why these specific renames:** `redesignsUsed` was misleading because templates also count under Model A. `generationsUsed` matches the Model A vocabulary. Legacy `redesignsUsed` is still written so any code we miss in Layer 3 doesn't quietly break.

### Layer 2 — Backend gates

**`supabase-client.js`**
- `pullAll()` now hydrates `state.user.generationsUsed` from `user_settings.generations_used`. Server is canonical source of truth for tier and quota.
- `pushAll()` writes both `is_pro` and `generations_used` to `user_settings`.

**`SUPABASE_SETUP.md`**
- Added `generations_used integer default 0` column to the `user_settings` schema.
- Added migration ALTER for existing tables predating Model A.

**Stripe webhook + `subscriptions` table:** explicitly deferred to `DEFERRED.md`. Until backend lands, `is_pro` is set client-side via the paywall mock CTA, and pulled from Supabase if the user has it manually set there.

**Rationale for deferred-but-flagged:** the *data model* is in place to support real subscriptions. When Stripe is wired, the only changes needed are: (a) add `subscriptions` table per `DEFERRED.md` SQL, (b) wire webhook to update `user_settings.is_pro`. No client changes required.

### Layer 3 — Frontend gates

**`app.js` — gates removed (Model A makes them obsolete)**
- 🗑️ **Home click interceptor** (was `app.js:1602–1620`) — capture-phase listener that paywalled every home feature for non-Pro. Replaced with explanatory comment.
- 🗑️ **Item-sheet open guard** (was `app.js:3656–3661`) — `if (!isPro())` block that paywalled item taps. Items now FREE for all.
- 🗑️ **Reshuffle gate** (was inside `#reshuffleBtn` click handler) — `canReshuffle()` check + paywall. Reshuffle is FREE; no quota.
- 🗑️ **Swap gate** (was at top of `swapItem()`) — `canSwap()` check + paywall. Swap is FREE.
- 🗑️ **Aha feedback gate** — `if (isGuest()) requireSignin('feedback')` and `if (!isPro()) openPaywall('feedback')`. Voting is FREE.
- 🗑️ **Wishlist `requireSignin` for bookmark** — bookmarking rooms now FREE.
- 🗑️ **Wishlist `requireSignin` for price-alert toggle** — setting alerts is FREE; delivery is Pro (handled at send time, see DEFERRED.md).
- 🗑️ **Share `requireSignin`** — sharing is FREE; viral loops drive affiliate referrals.
- 🗑️ **Rearrange button paywall** (Hassan D10 override) — Rearrange is FREE; AI re-layout cost stays minimal per spec. Replaced with a UI toast — real AI re-layout is a future hook.
- 🗑️ **`shopAllBtn` delegation to reshuffle** — restored "Shop the Whole Room" semantics. Opens N affiliate tabs with attribution.
- 🗑️ **`explore_welcome` paywall trigger** — Explore card now CTAs to "Browse My Redesign" instead of "Unlock Furnish."

**`app.js` — gates rewired through new middleware**
- ✅ **`#analyzeBtn` click** — wrapped in `gateGeneration('new_redesign', fn)`. After AI completes, if `isGuest()` → store `_pendingIntent={intent:'reveal'}` + show signin (D7 reveal-gate flow).
- ✅ **`startFromTemplate(t)`** — Pro-template gate kept; quota gate moved to `gateGeneration('new_redesign_template', fn)`. Same D7 reveal-gate flow for guests.
- ✅ **`prepareSignin()`** — branches on `state._pendingIntent.intent === 'reveal'` to put screen in signup mode with reveal-gate copy ("Your redesign is ready / Reveal My Redesign").
- ✅ **`applySigninMode()`** — added isRevealGate branch with custom copy.
- ✅ **`afterSigninRouting()`** — handles `intent === 'reveal'` by routing straight to `openRoom(roomId)` instead of explore-welcome.

**`app.js` — affiliate attribution helpers added (Layer 3 needed for `shopAllBtn` rewire)**
- ✅ `AFFILIATE_IDS` constant with placeholder per-retailer codes (real codes ship with affiliate program approvals — DEFERRED.md).
- ✅ `buildAffiliateUrl(item)` — appends per-retailer code + universal UTM + per-click `fclick` ID.
- ✅ `trackAffiliateClick(item, surface)` — fires `affiliate_click` event + appends to `state.affiliateClicks` rolling log.
- ✅ `currentRoomIdSafe()` helper — safe accessor for `currentRoomId` from early call paths.
- ✅ Wired into: `#shopAllBtn`, item-card Shop links, `#bsShopBtn` in item sheet.

**`index.html`**
- 🗑️ Removed `.lpw-badge` PRO-padlock span from `.locked-pieces-wrap`. The wrapper stays as a passive layout container.
- ✏️ `#shopAllBtn` label changed: `Reshuffle All Picks` → `Shop The Whole Room`. SVG icon updated to a shopping-bag glyph.
- ✏️ Bottom Reshuffle Picks button: `hidden` attribute removed; `actions-row stacked` is visible again so users have both Shop (primary) and Reshuffle (secondary).

**`styles.css` — rules deleted (Model A makes obsolete)**
- 🗑️ `body.is-free [data-screen="results"] .locked-pieces-wrap` (border + glow + Pro-styled background)
- 🗑️ `body.is-free [data-screen="results"] .locked-pieces-wrap > .lpw-badge` (PRO badge)
- 🗑️ `body.is-free [data-screen="results"] #itemsList` (the blur + pointer-events:none)
- 🗑️ `body.is-pro [data-screen="results"] .locked-pieces-wrap` (override that's now redundant)
- 🗑️ `body.is-pro [data-screen="results"] #itemsList` (override redundant)
- 🗑️ `body.is-guest [data-screen="results"] #ahaFeedback .af-q::after` (sign-in suffix)
- 🗑️ `body.is-signedin-free [data-screen="results"] #ahaFeedback .af-q::after` (upgrade suffix)
- 🗑️ `body.is-free.is-signedin-free [data-screen="home"] .home-ctas .btn::after` (lock emoji)
- 🗑️ All other `body.is-free.is-signedin-free [data-screen="home"]` rules
- All deletions replaced with explanatory `[Model A removed:]` comments referencing audit + this changelog.

### Layer 4 — Paywall + upgrade UX

**`app.js` — `PAYWALL_COPY` rewritten for Model A**
- 🗑️ Removed contexts: `reshuffle`, `swap`, `shop_free`, `feedback`, `home_feature`, `home_feature_used`, `second_room` (all gates retired in Layer 3).
- ✅ Added: `quota_exhausted` — primary new context. Fires when `gateGeneration` blocks.
- ✅ Added: `multi_room_batch`, `advanced_personalization` — listed Pro features (real surfaces deferred).
- ✏️ Rewritten: `redesign`, `template_pro`, `hd_export`, `profile`, `generic`. All anchor on compute-cost-bearing features per Reforge Monetization + Pricing PNIP Pyramid.
- 🪶 `rearrange` context kept as a no-op fallback with neutral copy in case any stale call site fires it (D10 made rearrange free).

**`app.js` — context promotion logic simplified**
- 🗑️ Removed: `if (context === 'home_feature' && hasUsedDemo()) context = 'home_feature_used';` — both contexts retired.

**`app.js` — `paywallCta` upgrade flow**
- ✅ Added mid-flow resume: if `triggeringContext === 'quota_exhausted'` and the user is on capture with a draft, auto-fires `analyzeBtn.click()` after Pro upgrade so the redesign resumes seamlessly.
- ✅ Tracks `paywall_converted` with the `triggeringContext` so we can attribute conversions to the gate that drove them.

**`app.js` — quota banner on results**
- ✅ Added `renderQuotaBanner(room)` rendered below the totals card.
  - Hidden for Pro and on first-redesign view (avoid preempting the aha moment).
  - After 1st of 2 free: "1 free redesign left" + Get-unlimited link.
  - After 2nd of 2 free: "Out of free redesigns — reshuffle/swap/shop still free" + Unlock-more link.

**`index.html` — paywall feature list rewritten**
- 🗑️ Removed list items that mentioned reshuffles + price-drop alerts as Pro (reshuffle is free; price-alert *delivery* is Pro but *setting* is free).
- ✅ New list:
  - Unlimited new redesigns from any photo
  - Premium template library
  - HD exports — no watermark
  - Per-person style profiles
  - Multi-room batch design *(coming soon)*
  - Style learns over time *(coming soon)*
  - Real-time price-drop alerts on saved items
- ✅ Added `.paywall-free-note` block listing what stays free (Reforge: counter fear-based pricing with explicit free-tier reassurance).

**`styles.css` — appended at end (avoiding the duplicate `.paywall-list .bullet` reconstruction artifacts)**
- ✅ `.paywall-soon` — coming-soon pill style.
- ✅ `.paywall-free-note` — green-bordered free-tier reassurance block.
- ✅ `.quota-banner` — neutral amber banner styling.
- ✅ `.affiliate-disclosure` — placeholder for Layer 7 (FTC) disclosure.

### Layer 5 — Analytics

**Events that ceased firing (gates removed in Layer 3):**
- `paywall_trigger { from: 'swap' }`
- `paywall_trigger { from: 'reshuffle' }`
- `paywall_trigger { from: 'shop_free' }`
- `paywall_trigger { from: 'feedback' }`
- `paywall_trigger { from: 'home_feature' }`
- `paywall_trigger { from: 'rearrange' }` — replaced with `rearrange_clicked`
- `paywall_trigger { from: 'explore_welcome' }` — replaced with `explore_welcome_browse_clicked`

**New events introduced in earlier layers (now consolidated):**
- `pro_action_completed` — fires from `gateGeneration` and `gateProFeature` allow-paths. Props: `actionId`, `viaQuota`, `remainingBefore`.
- `pro_action_attempted` — fires when a gate blocks. Props: `actionId`, `wasGated`, `lifecycle`.
- `paywall_trigger { from: <actionId>, reason: 'quota_exhausted' | 'pro_feature' }` — new shape for the consolidated middleware.
- `paywall_trigger { from: 'quota_banner' }` — quota-banner upgrade link.
- `paywall_trigger { from: 'template_pro' }` — kept (Pro template gate).
- `affiliate_click` — props: `itemId`, `source`, `price`, `surface ∈ {item_sheet, item_card_button, shop_all}`, `roomId`.
- `affiliate_shop_all_clicked` — props: `roomId`, `itemCount`, `totalPrice`.
- `reveal_gate_shown` — D7 auth gate impressed. Props: `roomId`, `source ∈ {new_redesign, template}`.
- `reveal_gate_unlocked` — D7 unlock after signin. Props: `roomId`, `source`.
- `rearrange_clicked` — replaces `paywall_trigger from='rearrange'` (now FREE).
- `explore_welcome_browse_clicked` — replaces the old `paywall_trigger from='explore_welcome'`.

**`paywall_converted` extended (this layer)**
- Now includes `triggeringContext` (the paywall context that drove the upgrade). Critical for attributing conversions back to which gate is most efficient.

**Added in this layer:**
- `tier_changed` — fires alongside `paywall_converted`. Props: `from ∈ {free, pro}`, `to ∈ {free, pro}`, `source ∈ {paywall_cta, stripe_webhook (future), grandfather (future)}`, `triggeringContext`.
- `subscription_started` — placeholder event. Props: `plan` (currently `'mocked_trial'`), `source`. Real Stripe wiring will populate `plan` with actual price ID. See DEFERRED.md.

**Untouched (kept as-is from prior passes):**
- `signup_started`, `setup_*`, `aha_*`, `habit_*` (activation funnel)
- `session_started`, `lifecycle_*`, `style_pulse_*` (retention)
- `share_*`, `push_permission` (engagement)

### Layer 6 — Copy

**Reshuffle toast** (`app.js:#reshuffleBtn`) — was `Fresh picks · {N} free reshuffles left`. Now `Fresh picks curated`. (Reshuffle is unlimited.)

**Profile page Pro card** (`renderProfilePage`)
- Pro state sub: was `Unlimited redesigns, swaps, and exports` → now `Unlimited new redesigns · HD exports · per-person profiles`.
- Free state sub (remaining > 0): was `{N} free redesigns left — upgrade anytime` → now `{N} free redesigns left · reshuffles + shopping always free`.
- Free state sub (remaining === 0): was `Free redesigns used — upgrade for unlimited` → now `Free redesigns used · reshuffle, swap, and shop are still free`.

**Welcome screen recall copy** (`applyWelcomeRecallState`)
- Now branches on quota state in addition to lifecycle.
- Dormant + quota out: `Welcome back — browse your saved rooms →` / `Reshuffle, swap, and shop — always free`.
- At-risk + quota out: `Browse Your Rooms →` / `Reshuffle and shop are always free`.
- Other branches unchanged but reviewed.

**Lifecycle banner — churned state**
- If churned AND `generationsRemaining() === 0`: routes to `[data-go=saved]` with body emphasizing free reshuffle/swap/shop, instead of promising a new redesign they can't make.

**Reshuffle button toast on bottom button** — was hidden, now visible. Toast text matches the prominent Shop CTA's role split.

**Price-alert toast** (`togglePriceAlert`)
- Now: `Saved — Pro members get real-time price-drop alerts` for free users (honest about delivery being Pro per D9).
- Pro: `We'll notify you when the price drops`.

**Explore welcome card**
- Was: `You're in. Now explore what Furnish can do.` + `Unlock Furnish` CTA pointing to paywall.
- Now: `You're in. Start shopping your style.` + `Browse My Redesign` CTA opening their last room. Includes their remaining-quota count when applicable.

**Paywall feature list** (already covered in Layer 4 changelog above, but noted here for cross-reference).

**Touchpoints not changed but verified:**
- Quiz, capture, reviews ticker, share modal, support modal — all FREE-tier accurate already.
- Item-card / item-sheet / wishlist copy — unchanged because their semantics didn't shift (tier shift was only in the gating layer, not the labels).

### Layer 7 — Legal

**FTC affiliate disclosure (16 CFR Part 255 compliance)**

- ✅ Inline disclosure on results screen, just below "Shop The Whole Room": *"Furnish earns a commission on items you buy through these links — at no extra cost to you. [Learn how]"* — links to the modal.
- ✅ Full disclosure modal (`#affiliateModal`) with sections: short version, what we don't do, legal cite. Plain English first, attorney-grade boilerplate at the end.
- ✅ JS wiring: `affiliateLearnMore` opens, `affiliateClose` and backdrop tap close. Fires `affiliate_disclosure_viewed` event.
- ✅ Styling appended to end of `styles.css`.

**Stripe terms / pricing page** — explicitly deferred to `DEFERRED.md`. Mock paywall CTA stays in place until backend lands.

**Privacy policy / Terms of Service** — out of scope for this Model A migration. Listed as deferred items pending real-backend phase.

### STEP 4 — Consistency sweep

**Re-walked the audit (`MONETIZATION_AUDIT.md`) front-to-back against the implementation.** All [REMOVE] items in §14 confirmed deleted; all [NEW] items in §3, §6, §8, §10, §13 confirmed landed. The only sweep finding was a runtime defect in `isGuest()` that prevented the D7 reveal gate from firing for first-time guests.

**🐛 Critical bug — `isGuest()` returned false for empty user objects**

- **Symptom:** A brand-new visitor would complete the analyze flow and land directly on `results` instead of the D7 signin gate. The redesign was revealed without account creation, defeating the entire D7 contract.
- **Root cause chain:**
  1. `boot()` calls `touchLastVisit()`, which initializes `state.user = {}` if missing (line ~124) so it can write `lastVisitedAt`.
  2. The empty `state.user` is now truthy, so the `welcomeStartBtn` handler's `if (!state.user)` branch (which sets `provider: 'guest'`) does NOT execute.
  3. The pre-fix `isGuest()` was `state.user?.provider === 'guest'`, which returned `false` for `{}` because `provider` was undefined.
  4. The `analyzeBtn` post-generation `if (isGuest())` therefore failed → no reveal gate → user saw results immediately.
- **Fix** (`app.js:2632–2636`):
  ```js
  function isGuest() {
    if (!state.user) return true;
    const p = state.user.provider;
    return !p || p === 'guest';   // empty-object case now returns true
  }
  function isSignedInFree() {
    return !!state.user && state.user.provider && state.user.provider !== 'guest' && !state.user.isPro;
  }
  ```
- **Verified via in-app test:** after the fix, a guest who completes analyze sees `screen: signin` with title "Your redesign is ready" and CTA "Reveal My Redesign". `state._pendingIntent.intent === 'reveal'` is set; `reveal_gate_shown` event fires with `source: 'new_redesign'`. Quota counter incremented to 1, room saved. The room is reachable only after signin completes.

**Sweep — items confirmed clean:**
- All audit §14 [REMOVE] items deleted (paywall lockdown CSS, lock-emoji rules, `lpw-badge`, gate constants, dead helpers).
- All audit §3 [NEW] items landed (3-state quota gate, `gateProFeature`, `generations_used` migration).
- All audit §6 [NEW] items landed (`generationsUsed` field, legacy `redesignsUsed` mirror, `_pendingIntent.intent='reveal'`).
- All audit §8 [NEW] events firing (`pro_action_completed`, `pro_action_attempted`, `tier_changed`, `subscription_started`, `affiliate_click`, `reveal_gate_*`, `tier_reconciled`, `quota_tamper_suspected`).
- All audit §10 [NEW] copy landed (paywall, profile Pro card, welcome recall, lifecycle banner, quota banner, FTC disclosure).
- All audit §13 [NEW] FTC disclosure modal + inline link in results screen.

### STEP 5 — Edge cases

Each row from `MONETIZATION_AUDIT.md` §16 gets explicit code or a documented deferred plan. Five new helpers added to `app.js` immediately after `syncFreeModeClass()`:

| §16 row | Edge case | Disposition |
|---|---|---|
| 1 | Existing Pro users (D6=a grandfathering) | ✅ `grandfatherProUsers()` runs at boot + after backend pull |
| 2 | Mid-flow upgrade resume | ✅ `_pendingProAction` stash + `paywallCta` replay (capture + templates) |
| 3 | Downgrade Pro→Free | ✅ `handleDowngrade(reason)` — preserves content, re-engages gates, toast |
| 4 | Offline / cached state with stale tier | ✅ `reconcileTierWithBackend(cachedIsPro, cachedUsed)` on backend-ready |
| 5 | Free abuse via cookie clear | ✅ `detectQuotaTamper()` soft log + DEFERRED.md plan |
| 6 | Two devices, one account, Pro on one offline | ✅ Covered by row 4 reconciliation; documented |
| 7 | User signs in mid-session as guest with rooms | ✅ Already correct via `afterSigninRouting` + `pullAll` (no new code) |
| 8 | First-ever guest's free redesign | ✅ STEP 4 fix above (D7 reveal gate) |

**Helper details:**

#### `grandfatherProUsers()` — §16 row 1

Idempotent. If `state.user.isPro && !state.user.tierGrantedAt`, sets `state.user.grandfathered = true` and `state.user.tierGrantedAt = 'pre_model_a'`. Fires `tier_changed { from: 'pro_legacy', to: 'pro_grandfathered', source: 'grandfather' }` so analytics can split conversion attribution between paid Pro and grandfathered Pro. Called in two places:

1. `boot()` — for users whose `isPro` is in localStorage from before Model A.
2. The `furnish:backend-ready` handler after `pullAll()` — for users whose canonical Pro flag lives in Supabase.

The `DEFERRED.md` Stripe-cutover plan (§Stripe / billing item 7) now reads this flag and provisions a 100% coupon Stripe customer at signup time.

#### `handleDowngrade(reason)` — §16 row 3

Called by the future Stripe webhook on `customer.subscription.deleted`. Currently exposed as `window.furnishHandleDowngrade(reason)` for QA. Sets `isPro=false`, clears `grandfathered`/`tierGrantedAt`, fires `tier_changed { from:'pro', to:'free', source:reason }`. Per the audit's §10 downgrade copy plan, surfaces toast: *"You're on Free. Past designs stay yours — reshuffle and shop as much as you want."* Re-renders the active screen so the gates re-engage. **Does NOT delete content** — Pro-created rooms, HD-exported renders already on disk, and batch redesigns remain accessible (rooms are content, not features).

#### `reconcileTierWithBackend(cachedIsPro, cachedUsed)` — §16 row 4

Runs after `pullAll()` writes server values into local state. Receives the cached snapshot taken BEFORE the pull, compares against the now-server-canonical state, fires `tier_reconciled` event with both sides. If server says Pro→Free (cancellation on another device), routes to `handleDowngrade('server_reconcile')` for the toast + re-render. If server says Free→Pro (upgrade on another device), syncs body classes + re-renders silently (the user expects this). The pessimistic-allow rule for offline sessions is documented inline: while OFFLINE, trust the cache; the AI-call backend (DEFERRED.md) is the real enforcement boundary, not the client.

Wired into the `furnish:backend-ready` handler immediately after `pullAll()`.

#### `detectQuotaTamper()` — §16 row 5

Honest-system soft log. Fires `quota_tamper_suspected` event when `state.rooms.length` (filtered to rooms whose `profileId` belongs to the current user) exceeds `state.user.generationsUsed + 1`. The +1 grace covers in-flight optimistic rooms that haven't decremented the counter yet. Called once in `boot()`. Once Supabase becomes the canonical counter (per `DEFERRED.md` Anti-abuse), this hook becomes obsolete — server-side enforcement makes client tampering moot. Until then, it's a monitoring signal.

#### `_pendingProAction` mid-flow resume — §16 row 2

Stash + replay protocol:

| Site | When stashed | Stash payload |
|---|---|---|
| `#analyzeBtn` click | Always (before `gateGeneration`) | `{ actionId: 'new_redesign' }` |
| `startFromTemplate` (Pro-template gate) | When `t.pro && !isPro()` | `{ actionId: 'template_pro', templateId: t.id }` |
| `startFromTemplate` (quota gate) | Before `gateGeneration` | `{ actionId: 'new_redesign_template', templateId: t.id }` |

Cleared inside the gate's success callback (action proceeded, no replay needed). Consumed in `paywallCta` after the user upgrades:

- `template_pro` or `new_redesign_template` with a valid `templateId` → `setTimeout(startFromTemplate(t), 200)`
- Capture-screen with a draft photo → `setTimeout($('#analyzeBtn').click(), 200)`
- Stale stash with no actionable target → toast: *"Pick any template to redesign your room."*

This makes the upgrade-conversion path frictionless: pay → resume the exact action that triggered the paywall, no manual re-click.

---

## Migration complete

- All 5 STEPs of `MONETIZATION_AUDIT.md` §17 implementation plan executed.
- All 8 rows of §16 edge cases addressed in code or explicitly deferred.
- `DEFERRED.md` lists every backend-phase item with cross-references to the helper hooks each one will drive.
- `MONETIZATION_AUDIT.md` is now historical — preserve as the migration spec; do NOT mutate.

**Surface area for future Stripe wiring:** the only new client-side code Stripe needs is the success-redirect handler. It calls the same `paywallCta` body (mid-flow resume) and lets `furnish:backend-ready` → `pullAll` → `reconcileTierWithBackend` propagate the new tier. No additional refactor required.

---

## Post-migration — first-redesign tutorial + Free Plan card

Two coordinated changes layered on top of the Model A migration. Both touch post-first-redesign conversion machinery and ship together.

### CHANGE 1 — First-redesign tutorial overlay

**Goal:** After a user sees their first AI-generated redesign, walk them through preferences with the **Budget slider as the centerpiece**, so price discovery happens before sticker shock kills activation. Per Reforge Activation: the Aha Moment is incomplete until the user knows how to dial prices to their real budget.

**Architectural call I flagged before building:** Spec said 4 steps (style → mood → furniture priorities → budget) but the preferences screen only has 3 distinct preference controls. Built 3 steps matching the actual UI. If a "furniture priorities" control gets added later, append it to `TUTORIAL_STEPS`.

**Files touched:**

| File | Change |
|---|---|
| `index.html` | Added `#frtOverlay` (spotlight + tip) as a global overlay sibling to `#toast`. |
| `app.js` | Added `TUTORIAL_STEPS` constant (3 steps, Budget emphasized), `queueFirstRedesignTutorial()`, `maybeFireTutorialOnPreferencesEntry()`, `startFirstRedesignTutorial()`, `runFirstRedesignTutorialOnCurrentScreen()`, `showTutorialStep()`, `repositionTutorialSpotlight()`, `endTutorial()`. Wired into `openRoom()` (queues 6s after first results render) and `openPreferences()` (fallback trigger if user navigates manually first). |
| `app.js` (5 sites) | Extended every wholesale `state.user = {...}` rebuild to preserve `firstRedesignTutorialSeen` so sign-out/in cycles don't re-fire. |
| `styles.css` | Appended `.frt-*` block — spotlight (box-shadow technique), tip card, step pip, skip/next buttons, emphasized Budget step gets pulse halo + brighter primary CTA, dark mode + reduced-motion + small-viewport variants. |
| `DEFERRED.md` | Documented `first_redesign_tutorial_seen` server-sync gap (cross-device fresh login currently re-fires once — known low-priority gap). |

**Trigger contract (verified end-to-end):**

1. User completes first AI-generated redesign → reveal-gate signs them up → `openRoom()` renders the room.
2. `queueFirstRedesignTutorial()` checks `state.user.firstRedesignTutorialSeen !== true` AND `state.rooms.length > 0` → schedules `setTimeout(6000)`.
3. After 6s, if user is still on `results` screen, auto-routes via `openPreferences(activeProfileId)` and fires the tutorial.
4. If user navigated away from results before 6s, queue self-cancels. Next time they enter preferences, `maybeFireTutorialOnPreferencesEntry()` catches them.
5. After tutorial completes OR skips, `state.user.firstRedesignTutorialSeen = true`, persisted.
6. Tutorial **never fires again** for that user account on that device. Cross-device replay is a documented gap pending Supabase column.

**Skip beat:** `Skip tour` button is hidden for the first 2 seconds of step 0. Per spec — gives the spotlight time to land before the user can dismiss. From step 1 onward, Skip is always visible.

**Spotlight technique:** `position: fixed` div with `box-shadow: 0 0 0 9999px rgba(20,13,5,0.74)` casts darkness OUTSIDE a transparent rectangle positioned over the target element. Smooth `cubic-bezier` transitions glide between steps. The Budget step adds an outline pulse halo to mark it as the centerpiece.

**Analytics events** (all firing now — spec says "build them now even though we can't analyze them yet"):
- `tutorial_started` — props: `totalSteps`
- `tutorial_step_viewed` — props: `step`, `stepId`, `emphasized`
- `tutorial_completed` — props: `totalSteps`
- `tutorial_skipped` — props: `atStep`, `atStepId`

**Conflict resolution flagged before building:** Existing `coach-mark` system on results screen (`state._tourShown` + `showFirstAhaHint()`) is **distinct** — different screen, different trigger context, single-step. Both systems coexist using namespaced classes (`.frt-*` for the new tutorial, `.coach-mark` for the old hint).

### CHANGE 2 — Free Plan card on every paywall

**Goal:** Per Reforge Monetization + Pricing (anchoring) + User Psychology (loss-aversion symmetry), every paywall surface shows what the user **keeps** alongside what they'd add. Reduces "if I don't pay I lose everything" panic — the panic that closes modals without converting. Free card is intentionally de-emphasized vs Pro: it exists to remind, not to compete.

**Single source of truth:** `FREE_PLAN_CARD` constant in `app.js` (frozen object), exposed on `window.FurnishFreePlan = { definition, render }` for any future surfaces. **DO NOT duplicate the bullet list** — change Free benefits in this constant only, propagates everywhere.

**Constant content (the contract):**

```js
{
  title: 'Furnish Free',
  subtitle: 'What you already have',
  bullets: [
    'Unlimited reshuffles on your existing redesign',
    'Unlimited item swaps',
    'Full shopping access — every item is yours to buy',
    'Basic personalization (style, mood, budget)',
    '2 AI redesigns total (1 photo upload + 1 template, or 2 of either)',
  ],
  footer: "You're on this plan. Want more? →",
}
```

**Files touched:**

| File | Change |
|---|---|
| `index.html` | Restructured `#paywallModal` — added `.paywall-header` (shared title/sub), `.paywall-cards` row containing `<aside class="paywall-free-card" id="paywallFreeCard">` (empty placeholder, JS fills) + `<article class="paywall-pro-card">` (existing content wrapped). Removed obsolete `.paywall-free-note` paragraph (replaced by proper Free card). |
| `app.js` | Added `FREE_PLAN_CARD` constant + `renderFreeCard(targetEl)`. Wired into `openPaywall()` so every context renders the Free card. |
| `styles.css` | Appended two-card layout block — stacks mobile, side-by-side ≥640px (Free narrower at `flex: 0 0 38%`, Pro wider at `flex: 1`). Free card de-emphasized: muted bg, lighter borders, smaller bullets, "CURRENT PLAN" pill badge, italic dashed-border footer. Dark mode parity. Updated `#paywallModal .paywall-card` max-width from 380px → 640px. |

**Audit — every paywall surface verified:**

9 call sites of `openPaywall()` across the app. ALL flow through the central function which now calls `renderFreeCard()` before showing the modal:

| Line | Context | Trigger |
|---|---|---|
| 640 | `generic` | Profile-related action |
| 785, 820 | `profile` | Multi-profile creation |
| 2168 | `generic` | Profile-page Pro button |
| 2532 | `template_pro` | Pro-only template tap |
| 2832 | `quota_exhausted` | `gateGeneration` blocks (after 2 generations) |
| 2845 | dynamic actionId | `gateProFeature` blocks (HD export, batch, etc.) |
| 3603 | `redesign` / `quota_exhausted` | Redesign action gated |
| 4408 | `hd_export` | HD download attempt |

Free card surfaces on every context. ✅

**Bug fix discovered + repaired during the audit:** the 5 `state.user = {...}` wholesale-rebuild sites preserved `generationsUsed` and `isPro` but NOT `firstRedesignTutorialSeen`. A user who completed the tutorial then signed out + back in would see it re-fire. Extended the spread-preservation pattern to all 5 sites (email signup, email signin local fallback, Amazon mock, generic social mock, OAuth restore handler). Fire-once contract now holds across sign-out cycles on the same device.

---

## Post-migration — homepage card unification + "This Week" restructure

Two coordinated changes shipped as one pass: every inspiration card now carries a "Use Template" CTA (the universal redesign-flow entry point), and the "This Week in [Style]" section restructured from depth-in-one-direction (12 styles, all bedrooms) to breadth-across-rooms (one style, 9 room types).

### CHANGE 1 — "Use Template" on every inspiration card

**Goal:** Universal affordance — the user should never wonder "can I use this image?" Every inspiration card answers it the same way, with the same brown CTA at the bottom.

**Single source of truth:** `useTemplateFromCard(spec, source)` in `app.js`. Builds a template object from a card spec and routes through `startFromTemplate()` → `gateGeneration('new_redesign_template', ...)`. Counts as one of the 2 free AI redesigns per Model A D4. Exposed on `window.FurnishUseTemplate` for any future caller.

**Shared component:** `renderImageCard(spec, opts)` — the new unified card builder used by Style Pulse and any future galleries. Returns an `<article>` with photo, optional room-type label (top-left), optional NEW badge (top-right), body, and the universal `imgcard-cta` button. Exposed on `window.FurnishRenderImageCard`.

**Files touched:**

| File | Change |
|---|---|
| `app.js` | Added `THIS_WEEK_CONFIG`, `DEFAULT_ROOM_DIMS`, `useTemplateFromCard()`, `renderImageCard()`. Rebuilt `renderStylePulse()` to use the new component + config. Added CTA + room-type label to `buildCollectionCard()` (trending/seasons). Added CTA to `renderTemplates()` per-template card render. Updated `startFromTemplate()` to honor `t.photo` for image-anchored redesigns. |
| `styles.css` | Appended `.imgcard*` block — base card, marquee variant, photo + placeholder treatments, room-type label, NEW badge, body, universal `.imgcard-cta` (full-width, brown gradient, hover lift, arrow nudge). Bolt-on rules for `collection-card.has-imgcard-cta` and `template-card.has-imgcard-cta` so existing layouts host the CTA at their bottom edges. Dark-mode + reduced-motion + small-viewport variants. |

**Audit — every inspiration card surface verified:**

| Surface | Card class | CTA shipped | Card-tap behavior |
|---|---|---|---|
| Style Pulse (Home) | `imgcard imgcard--marquee` (new) | ✅ via renderImageCard | CTA only — body is non-interactive |
| Collections — Trending (Home) | `collection-card.has-imgcard-cta` | ✅ via direct addition | Body tap = applyCollection (existing); CTA = useTemplateFromCard |
| Collections — Seasons (Home) | `collection-card.has-imgcard-cta` | ✅ via direct addition | Body tap = applyCollection (existing); CTA = useTemplateFromCard |
| Templates screen | `template-card.has-imgcard-cta` (now `<div role="button">` for valid HTML — button-in-button isn't allowed) | ✅ via direct addition | Card OR CTA = startFromTemplate |

**Non-inspiration cards correctly excluded:** profile cards, quiz options, resume cards, saved-mini wishlist thumbnails, room cards (user's own redesigns), shopping item cards, room-type selector cards. These either show user-owned content or commerce surfaces — not "inspiration images" per the spec.

**Image-anchored redesigns:** `startFromTemplate()` updated to use `t.photo || placeholderImageFor(t.type)` as `state.draft.photo`. Same downstream pipeline; just gives the redesign engine a real image as the source when one exists. Code-defined templates without `photo` continue to use the synthetic SVG placeholder, unchanged.

**Analytics events:**
- `use_template_clicked` — props: `source ('style_pulse'|'collection_card'|...), roomType, styleId, hasImage, imageType`. Fires on every CTA click across every surface.

### CHANGE 2 — "This Week in Mid-Century" restructure

**Goal:** Same section name, same visual treatment. The CONTENT changes: instead of 12 different styles all shown as bedrooms (depth in one direction), the section now shows ONE style (Mid-Century Modern) traveling across NINE room types (breadth — "this style works for any room I have").

**Reforge framework backing:**
- **Engagement Loops (Casey Winters)**: stable container + variable content drives habitual return visits. The container — "This Week in [Style]" — is fixed. The content — which style, which room images — rotates weekly. Users learn "Tuesday means a new style sweep."
- **Retention — Habit Moment frequency**: predictable cadence expands the user's mental model of when to come back to Furnish.
- **User Psychology — pattern recognition**: 9 same-shape cards in a fixed format means users scan the variety in 2 seconds and learn "this product handles every room I have."

**Single config swap point:** `THIS_WEEK_CONFIG` in `app.js`. To rotate next week's style:

```js
const THIS_WEEK_CONFIG = {
  styleId: 'mid-century',          // ← change this
  styleLabel: 'Mid-Century Modern', // ← and this
  styleAnchorImage: '...',          // ← fallback image
  styleColors: ['warm', 'jewel'],   // ← color moods that pair
  rooms: [ /* 9 entries in spec order */ ],
};
```

That's it. ~30 seconds to swap the style next Monday.

**Card order shipped (in spec sequence):**

1. **Bedroom** (anchor — establishes style identity, uses existing `mid-century.jpg`)
2. Living Room — placeholder
3. Kitchen — placeholder
4. Dining Room — placeholder
5. Bathroom — placeholder
6. Home Office — placeholder
7. Nursery — placeholder
8. Closet — placeholder
9. Laundry Room — placeholder

**Per-card requirements (all met):**
- ✅ Each card carries the room-type label, top-left, in a backdrop-blurred chip
- ✅ Each card has the universal "Use Template →" CTA
- ✅ Order is fixed in the spec sequence (Bedroom → Laundry)
- ⚠️ Style consistency only holds for the bedroom anchor card; placeholder cards use a unified Mid-Century-palette gradient + room icon to maintain visual continuity (see image-gap report below)

**Image-gap report (must read):**

The Mid-Century image database currently contains **exactly one image** — `assets/styles/mid-century.jpg`, used as the bedroom anchor. **Eight room types lack curated Mid-Century images.** Hassan's hypothesized "7 strong + 2 placeholders" was optimistic; actual ratio is **1 strong + 8 placeholders**.

Placeholder cards render with:
- Mid-Century palette gradient (warm tan → brown) so they read as part of the same showcase, not random missing-content
- Centered room icon + "Curated image coming" pill
- Universal Use Template CTA still functional (the redesign uses the style anchor image as the source when no card-specific image exists)

**Room types needing curated Mid-Century images, in priority order (for asset sourcing):**

1. Living Room — highest priority (most-redesigned room type per typical usage)
2. Kitchen — high (heavy commerce surface; appliance affiliate)
3. Dining Room — medium (smaller addressable market but rounds out the "main social rooms" trio)
4. Home Office — medium-high (post-pandemic relevance)
5. Bathroom — medium (smaller piece counts but high-ticket items)
6. Nursery — lower (specialty room, smaller addressable market)
7. Closet — lower (Pro template territory)
8. Laundry Room — lowest (utility space, smallest design surface)

**Existing images preserved:** Per spec — DO NOT delete any images. The previous Style Pulse logic (12 different styles) is no longer rendered, but every image referenced by it still lives in `assets/styles/`. Same for `window.COLLECTIONS` trending + seasons — all images intact, all paths intact, all currently rendered through Trending Styles + Collections strips on the home screen. The only thing that "moved" is the *rendering logic* of the Style Pulse section; no image files touched.

**Sublabel format:** Each card's sublabel reads "Wk 18" (current week number), uppercase styled per the new `.imgcard-sub` rule. Auto-updates each Monday.

**Analytics:** `style_pulse_shown` event extended with `placeholderCount` so we can track curated-image coverage as the asset library grows. When placeholderCount drops to 0, the section's curation is "complete" for a given style.

---

## Retention Pass — Engagement Loops + Lifecycle Scaffolding

Per Reforge Retention + Engagement (Lessons 02 Natural Behavior, 03 Choosing a Retention Metric, 04 Visualizing Retention, Engagement Strategies 04 Frequency, 06 Engagement Machine), this pass layered three engagement loop surfaces onto the home screen and built the lifecycle campaign trigger scaffolding.

### Strategic deliverables (in chat, not files)

1. **Natural-frequency call**: Furnish has TWO frequencies. Core ("redesign a room") is **quarterly** at best, yearly+ at worst — Forgettable Zone. Supplemental loops (browse content, watch prices) are **weekly**. Strategy is the Zillow pattern: low-frequency core wrapped in higher-frequency supplemental layers.
2. **Retention metric handoff**: Activation = "first redesign reveal" (already shipped). Retention = TWO metrics: **QAD** (Quarterly Active Designer = redesign OR affiliate-click) + **WAB** (Weekly Active Browser = any non-redesign engagement). Anti-metric = DAU.
3. **Five ranked engagement loops**: Style Pulse Drop (#1), Price-Drop Watch (#2), Multi-Room Completion (#3), Style Evolution Recap (#4), Friend's Room (#5). Each spec'd with Trigger / Action / Reward / Investment / Frequency / Effort / Conflicts.
4. **Loud monetization contradictions** surfaced: 2-lifetime AI cap kills multi-room loop; price-alert delivery being Pro-gated kills affiliate revenue; affiliate-only is fragile P&L. Three remediation options ranked.
5. **Lifecycle campaign copy** written for 8 trigger points (welcome / mid-funnel / dormant / churned). Codified as `LIFECYCLE_CAMPAIGNS` constant — same keys/copy/predicates the future backend will use verbatim.
6. **Content / data model / research plan** written.

### CHANGE 1 — Visit-N home differentiation (Engagement Engine signal layer)

**Goal:** visit #1 is the activation moment. Visit #2-3 the early-discovery phase. Visit #4-9 the active phase. Visit #10+ the veteran phase. The home screen should reflect where the user is, not look identical to visit #1.

**Files touched:**

| File | Change |
|---|---|
| `app.js` | Added `getVisitBand()` (returns `first|early|active|veteran` based on `state.user.visitCount`) + `syncVisitBandClass()` writing `body[data-visit-band]`. Wired into `renderHome()`. |
| `styles.css` | Added `body[data-visit-band="first"]` rules to hide Home Progress + Price-Drop Banner on the very first visit (activation hero stays dominant). `[data-visit-band="early"]` adds Home Progress entrance animation. `[data-visit-band="veteran"]` hides first-aha helper tooltips that would otherwise be redundant. |

The visit-band attribute also surfaces on `body.dataset.visitCount` for finer-grained CSS rules in the future.

### CHANGE 2 — Loop 2 surface: in-app Price-Drop Banner

**Goal:** Price-drop watch loop. Reforge Manufactured Change trigger. Currently surfaced in-app; future backend wiring delivers the same intent via push.

**Files touched:**

| File | Change |
|---|---|
| `app.js` | Added `renderPriceDropBanner()`. Scans `state.wishlist` × `state.wishlistMeta`; finds items where `priceAtSave > current price`; sorts by largest % drop; surfaces top drop in a banner with deep-link to the item sheet. Dismissable per-session via `state._priceDropBannerDismissed`. |
| `styles.css` | `.price-drop-banner` warm-green styling (signals opportunity, not noise). Pulsing dot indicator. Dark-mode + small-viewport variants. |

**Analytics events:**
- `price_drop_banner_shown` — props: `itemId, delta, pctDrop, totalDropsAvailable`
- `price_drop_banner_clicked` — same props
- `price_drop_banner_dismissed` — props: `itemId`

**🚨 Contradiction surfaced:** Price-alert *delivery* is currently Pro-gated per Model A D9. For an affiliate-revenue business, gating the highest-conversion notification behind a paywall is revenue-self-sabotage. Recommend moving alert delivery to FREE for all users; Pro gets advanced filters (e.g., "only alert on >20% drops"). Documented in retention strategy doc above.

### CHANGE 3 — Loop 3 surface: Home Progress map

**Goal:** Multi-room completion loop. 9-cell grid showing which room types this profile has designed; designed cells get a tan glow + checkmark, the next-recommended undesigned cell gets a dashed-border breathing pulse.

**Files touched:**

| File | Change |
|---|---|
| `app.js` | Added `renderHomeProgress(profile)`. Reads `state.rooms` filtered to active profile; computes designed set across the canonical 9-room order (Bedroom → Living → Kitchen → Dining → Bathroom → Office → Nursery → Closet → Laundry); picks `nextRoomType` as the first undesigned room in that order. |
| `styles.css` | `.home-progress` block — header with eyebrow + progress bar, 3×3 grid of cells with hp-done / hp-next / default states. Pulse animation on next-up cell. Dark-mode + small-viewport variants. |

**Cell click behavior:**
- Designed cell → opens the most recent room of that type
- Undesigned cell → pre-seeds `state.draft.type` and routes to capture flow

**Analytics events:**
- `home_progress_shown` — props: `designedCount, uniqueTypesDesigned, nextRoomType`
- `home_progress_cell_clicked` — props: `roomType, action ('open_existing'|'start_new')`

**🚨 Contradiction surfaced:** Multi-room loop fundamentally collides with 2-lifetime generation cap. User who falls in love with their first redesign hits the paywall on room 3. The loop dies before it can form. Three remediation options proposed in strategy doc; recommended Option A (compute-quality cap, free unlimited generations on cheaper model).

### CHANGE 4 — Lifecycle campaign trigger scaffolding

**Goal:** build the trigger predicates + copy now even though SMTP / push delivery is deferred. The future backend reads the same constant verbatim.

**Files touched:**

| File | Change |
|---|---|
| `app.js` | Added `LIFECYCLE_CAMPAIGNS` constant with 8 campaigns covering welcome (D1, D3, D7), mid-funnel (D14, D30), dormant (D60, D90), churned (D180+). Each campaign has `key`, `channel ('push'\|'email'\|'inapp')`, `when(ctx)` predicate, and `copy` ({title, body}). Added `runLifecycleScheduler()` that runs on every home render, iterates campaigns, fires `lifecycle_would_fire` analytics for any whose predicate matches AND that haven't fired before for this user (tracked via `state._lifecycleSent`). Exposed as `window.FurnishLifecycle = { campaigns, run }` for QA + future backend. |
| `DEFERRED.md` | Updated Email Lifecycle section with the backend cutover contract: when SMTP lands, replace `lifecycle_would_fire` event with real send. Triggers, predicates, copy stay unchanged. |

**The 8 campaigns (locked):**

| Key | Day | Channel | Title | Body |
|---|---|---|---|---|
| `welcome_d1_check_prices` | 1 | push | Check your price tags | 3 of your picks are under $100 today. |
| `welcome_d3_next_room` | 3 | push | Your style works for 8 more rooms | Here's your kitchen. |
| `welcome_d7_first_drop` | 7 | email | Week 1 wrapped | Your style is dialled in. Here's this week's drop. |
| `mid_d14_price_watch` | 14 | push | 2 weeks in | 1 of your saved items dropped 22%. Tap to see. |
| `mid_d30_recap` | 30 | inapp | 30 days of your style | Here's what changed. |
| `dormant_d60_warm` | 60+ | email | New in your style | We haven't seen you. Here's what's new. |
| `dormant_d90_seasonal` | 90+ | push | Spring 2026 in your style | Tap to see. |
| `churned_d180_refresh` | 180+ | email | Your bedroom is from 6 months ago | See today's take on it. |

Each campaign's `when()` predicate reads from a context bag (`{ lifecycle, daysSincePrev, daysSinceFirstRoom, totalRooms, wishlistCount }`) computed once per scheduler run. One-shot via `state._lifecycleSent[key] = timestamp`.

### Reforge framework citations

- **Natural Frequency Spectrum** (Lesson 02) — drove the QAD-vs-WAB metric split + the Zillow-pattern recommendation
- **Engagement Engine** (Strategies Lesson 06) — drove the Signal → Strategy → Path → Success/Fail loop reflected in `runLifecycleScheduler` + the visit-band signal layer
- **Manufactured Triggers (Time / Change / Peer)** (Strategies Lesson 04) — drove the trigger types in the 5 engagement loops
- **Forgettable Zone supplemental loops** — drove the Style Pulse / Price-Drop / Home Progress as supplemental layers wrapping the low-frequency core
- **Goldilocks problem** (don't over-nurture) — drove visit-band differentiation so we don't show veterans the same education as first-timers

### Forward-looking — how to swap next week's style

1. Open `app.js`, find `THIS_WEEK_CONFIG`.
2. Update `styleId`, `styleLabel`, `styleAnchorImage`, `styleColors`.
3. For each of the 9 rooms, set `image` and `imageType: 'asset'` if you have a curated image; leave as `null` + `'placeholder'` if not.
4. Optionally toggle `isNew: true` on the freshest 2-3 cards.

The format never changes. Format-stability is the engagement-loop play. Content-rotation is the variable reward. Per Reforge — that's the whole engagement-loop pattern in 4 lines of config.

---

## Compute-Quality Routing Migration (2026-04-25)

Replaces the Model A 2-lifetime AI generation cap with a **compute-quality routing model**. Free users get unlimited generations on a cheap/fast model (Flux Schnell). Pro users get unlimited generations on the premium model (Flux Kontext Pro / Flux Depth Pro) at **$5.99/month**. The structural retention block (multi-room loop dying at gen #3) is removed. Pro repositioned from "generation count" to "generation quality + depth features."

**Spec:** `MONETIZATION_PROPAGATION_AUDIT.md` (auditor + propagation map across categories A–L).
**Predecessor:** `MONETIZATION_AUDIT.md` (now archived with a top-line note pointing here).

### Approved decisions (from STEP 2 of this migration)

- **#1 Compute-quality cap** (replaces 2-lifetime cap). Free uses Flux Schnell; Pro uses Flux Kontext Pro / Flux Depth Pro.
- **#2 Pro at $5.99/mo** (subscription-as-LTV-stabilizer). Annual $3.99/mo billed annually ($47.88/yr), "Save 33%."
- **#3 Price-alert delivery moves to Free** for all users; Pro adds advanced filters (thresholds, retailer prefs).
- **#4 Phase 0 content pipeline:** continue curating Style Pulse drops by hand for the first 4-8 weeks.
- **#5 User research:** plan written into `DEFERRED.md`; execute once a launch user base exists.

### Approved conflict resolutions (from STEP 2)

1. **Referral reward:** "1 month of Furnish Pro free" for both inviter and invitee (replaces "3 free redesigns").
2. **Annual pricing math:** $3.99/mo billed annually ($47.88/yr), 33% off.
3. **Lifecycle banner branches:** delete the orphan branches that keyed off "out of free redesigns."
4. **Function rename:** `gateGeneration` → `routeGenerationByModelTier` (with backward-compat shim).
5. **`MONETIZATION_AUDIT.md`:** kept as historical archive; top-line note added.

---

### Layer 1 — Tier infrastructure

**`app.js` — quota machinery removed, model-tier routing added**
- 🗑️ Deleted: `FREE_GENERATION_LIMIT = 2` constant.
- 🗑️ Deleted: `generationsRemaining()`, `hasUsedAllFreeGenerations()` helpers.
- 🗑️ Deleted: `detectQuotaTamper()` function + boot-time call (no quota → no tamper).
- 🗑️ Deleted: `body.has-used-free-generations` class toggle in `syncFreeModeClass()` (replaced with explicit removal so any stale CSS rules stop applying).
- ✅ Added: `currentModelTier()` — returns `'premium'` if Pro, else `'standard'`. Single source of truth for backend model routing + UI labels.
- ✅ Added: `routeGenerationByModelTier(actionId, fn)` — always-allow middleware. Calls `fn(tier)` with the resolved model tier so the future Replicate-backed backend knows which endpoint to hit. Emits `generation_completed { actionId, tier }` analytics on every call.
- ✅ Backward-compat shim: `const gateGeneration = routeGenerationByModelTier;` so any straggler callers keep working through the migration window.
- ✅ `incrementGenerationCount()` kept as analytics-only counter (no gate reads it).
- ✅ `gateProFeature(actionId, fn)` unchanged — Pro-only gate for HD export, multi-room batch, advanced personalization, and the new `advanced_price_filters` action.
- ✅ `analyzeBtn` click + `startFromTemplate(t)` rewired to `routeGenerationByModelTier`. Each writes `room.modelTier` so the results screen knows which tier produced the room (for the `renderPremiumUpsellHint()` "Pro would have rendered this in premium" cue).
- 🗑️ Deleted the `_pendingProAction` stash for `new_redesign` and `new_redesign_template` paths (no quota → no resume needed). Stash kept for the `template_pro` path (the only remaining mid-flow blocker).

### Layer 2 — Backend (`supabase-client.js` + `SUPABASE_SETUP.md`)

- ✅ `pullAll()` comment updated: `is_pro` is canonical for tier; `generations_used` becomes analytics-only.
- ✅ `pushAll()` still syncs both fields. Documented in inline comment that `generations_used` is no longer a quota input.
- ✅ `SUPABASE_SETUP.md` schema comments rewritten to reflect compute-quality routing. The column itself stays (analytics-friendly).

**Stripe webhook contract update (in `DEFERRED.md`):** webhook only updates `is_pro` now. `generations_used` doesn't need round-tripping.

### Layer 3 — `FREE_PLAN_CARD` source-of-truth update

**`app.js:864`** — single source-of-truth constant. Per audit Section B:
- 🗑️ Removed: "2 AI redesigns total (1 photo upload + 1 template, or 2 of either)"
- ✅ Added (top of list): "Unlimited AI redesigns at standard quality"
- ✅ Added: "Real-time price-drop alerts on saved items" (now Free per decision #3)
- ✅ Kept all other bullets verbatim (reshuffles, swaps, shopping, basic personalization)

All 9 paywall surfaces auto-propagate via the centralized `renderFreeCard()` call in `openPaywall()`.

### Layer 4 — Pro card + paywall HTML

**`index.html` — Pro feature list rewritten, header copy refreshed**
- ✏️ Paywall header: `"Design every room in your home"` → `"Sharper redesigns, every time"`. Sub: focus on premium AI quality, not unlimited count.
- 🗑️ Removed bullet: "Unlimited new redesigns from any photo" (now Free).
- ✅ Headline bullet: **"Premium AI quality — sharper, more accurate redesigns"** (with `<strong>` emphasis).
- ✅ Reordered Pro list to lead with quality, then depth features (multi-room batch, HD downloads, style learning, advanced price filters, per-person profiles, premium templates).
- ✏️ Annual toggle: "Save 49%" → "Save 33%."

**`app.js` — pricing logic**
- ✏️ `.pw-toggle-btn` handler: monthly `$5.99/month`, annual `$3.99/month, billed annually ($47.88/yr)`.

### Layer 5 — `PAYWALL_COPY` + new contexts

**`app.js:903`**
- 🗑️ Retired: `quota_exhausted`, `redesign` (no quota gate fires anymore).
- ✅ Added: `premium_quality` — primary new upsell context. Title: "Sharper redesigns, every time." Sub: cites the $5.99/month price + the premium-AI value prop.
- ✅ Added: `advanced_price_filters` — Pro-feature paywall for advanced alert filters (thresholds + retailer preferences).
- ✏️ Refined: `generic` — drops "unlimited new redesigns" line, leads with premium AI + multi-room batch + HD + per-person profiles.
- ✅ Kept: `template_pro`, `hd_export`, `profile`, `multi_room_batch`, `advanced_personalization`, `rearrange` (back-compat fallback).

### Layer 6 + Layer 7 — Premium-quality upsell + replace `renderQuotaBanner`

**`app.js`** — replaced `renderQuotaBanner(room)` with **`renderPremiumUpsellHint(room)`**:
- 🗑️ Old quota banner deleted (would have shown "1 free redesign left" or "Out of free redesigns").
- ✅ New hint surfaces on results screen with **Reforge User Psychology upsell pacing**:
  - **Activation rule**: never on first redesign (preserves the aha moment); first eligible from generation #3 onward.
  - **Frequency rule**: max 1 surface per session (`state._premiumUpsellShownThisSession`).
  - **Cooldown rule**: ≥7 days between two surfaces for the same user (`state.user._premiumUpsellShownAt`).
  - **Tier rule**: never shown to Pro users; never shown for rooms that were already rendered in premium.
- ✅ Copy: *"Want sharper redesigns next time? Pro routes you to our premium AI model — more accurate matches, richer lighting."* CTA: "See Pro" → opens `openPaywall('premium_quality')`.
- ✅ Dismissable per-session via X button. Logs `premium_quality_upsell_dismissed`.

**`styles.css`**
- 🗑️ Deleted `.quota-banner` rules.
- ✅ Added `.premium-upsell-hint` block — warm-tan gradient with sparkle accent + dark-mode + small-viewport variants.

### Layer 8 — Welcome / lifecycle banner branch simplification

**`app.js:applyWelcomeRecallState()`** — collapsed two of the four branches:
- 🗑️ Removed: `if (dormant && quotaOut)` → "Welcome back — browse your saved rooms" branch (the only reason it existed was to dodge a paywall the user can't actually hit anymore).
- 🗑️ Removed: `if (lifecycle === LIFECYCLE.AT_RISK && hasUsedAllFreeGenerations())` → "Browse Your Rooms" branch (same reason).
- ✅ Kept: clean `dormant` and `at_risk` branches with lifecycle-only copy.

**`app.js:renderLifecycleBanner()` churned branch** — collapsed from a quota-conditional 2-arm if/else to a single arm: always promise "Design A New Room" since there's no paywall to hit.

**`app.js:renderExploreWelcome()`** — removed the dynamic "You've got N free redesigns remaining" line that ran via template literal. The card now shows static shop + save guidance.

### Layer 9 — Analytics event renames

| Event | Status |
|---|---|
| `quota_exhausted` (paywall context arg) | RETIRED |
| `quota_tamper_suspected` | RETIRED (function deleted) |
| `paywall_trigger { reason: 'quota_exhausted' }` | RETIRED |
| `pro_action_completed { viaQuota: true/false }` | RETIRED for generation actions; superseded by `generation_completed { tier }`. KEPT for `gateProFeature` calls (no semantic change). |
| `generation_completed { actionId, tier }` | NEW — fires on every `routeGenerationByModelTier` call. Props: `actionId ∈ {new_redesign, new_redesign_template}`, `tier ∈ {standard, premium}`. |
| `subscription_started` | RENAMED → `pro_subscription_started`. Same shape; added `triggeringContext` prop. |
| `premium_quality_upsell_shown` | NEW. Props: `triggeringContext`, `generationsUsed`. |
| `premium_quality_upsell_clicked` | NEW. Same props. |
| `premium_quality_upsell_dismissed` | NEW. Same props. |
| All other events (paywall_shown, paywall_converted, tier_changed, affiliate_click, price_alert_on/off, etc.) | UNCHANGED. |

### Layer 10 — Copy sweep K1–K13

Walked every audit item:

- **K1, K5, H7** — addressed in Layer 8 (banner branch simplification).
- **K2** — Profile Pro card sub (Pro state): `'Premium AI · multi-room batch · HD downloads · per-person profiles'`
- **K3** — Profile Pro card sub (Free state): `'Standard-quality redesigns · reshuffle, swap, and shop always free · Pro for premium quality'` (single line, no quota count).
- **K4** — Referral toast: `'Invite link copied — you both get 1 month of Furnish Pro free'`
- **K6, K7** — `PAYWALL_COPY.redesign` and `.quota_exhausted` deleted in Layer 5.
- **K8** — `index.html` `#profileProSub` initial copy: `'Standard quality · upgrade for premium AI'`
- **K9** — `index.html` share-referral-note: `'Invite link gives the recipient 1 month of Furnish Pro free. You get a free month when they convert.'`
- **K10** — Paywall hero sub copy updated in Layer 4.
- **K11** — Inline comment for `renderQuotaBanner` deleted along with the function in Layer 7.
- **K12** — `useTemplateFromCard` inline comment rewritten to reference `routeGenerationByModelTier`.
- **K13** — `togglePriceAlert` inline comment rewritten to clarify alert delivery is now Free for all users; Pro adds advanced filters.

### Layer 11 — Documentation

- ✅ `CLAUDE.md` "What's NOT done yet" item #1 — updated to reflect dual-model routing (Flux Schnell for Free, Flux Kontext Pro / Depth Pro for Pro). Server reads `user_settings.is_pro` to route.
- ✅ `MONETIZATION_AUDIT.md` — top-line archive note added linking to the new audit + this migration log.
- ✅ `DEFERRED.md` Anti-abuse section — fully rewritten. Old "2-lifetime quota holds across devices" goal retired. New goal: server-side rate limits per account/IP on the AI-call endpoint to prevent compute-budget burn. Acceptance criteria rewritten.
- ✅ `DEFERRED.md` — new section: **Compute model routing** documents the future backend's tier-routing contract.
- ✅ `DEFERRED.md` Stripe section — webhook now updates `is_pro` only; `generations_used` doesn't round-trip. Pricing line updated to monthly $5.99 / annual $47.88.
- ✅ `DEFERRED.md` — new section: **User research plan** with 5 archetypes × 5-7 interviews, 5 interview questions verbatim, and the Customer Retention Canvas synthesis output. Locked, ready to execute when a launch user base exists.
- ✅ This `CHANGES_APPLIED.md` migration log appended.

---

## Migration complete

All 11 implementation Layers landed. The retention shape now matches the natural-frequency analysis from the prior pass (multi-room loop is unblocked, supplemental loops have unlimited fuel, Pro upsells via quality not quantity).

---

### Brand standardization pass (2026-04-26)

Single dedicated pass to consolidate the brand mark on **`Furnish Pro`** across every active surface. Replaces lingering `Furnish+`, `FURNISH+`, and `FURNISH PRO` references with the canonical `Furnish Pro` (Title Case).

**Files touched:**

| File:line | Before | After |
|---|---|---|
| `index.html:209` | `data-action="furnish-plus"` | `data-action="furnish-pro"` |
| `index.html:226` | `<span class="udi-text">Furnish+</span>` | `<span class="udi-text">Furnish Pro</span>` |
| `index.html:227` | `<span class="udi-badge">PRO</span>` | **REMOVED** — brand name self-identifies; the standalone PRO badge was redundant once the text said "Furnish Pro." |
| `index.html:493` | `<div class="pp-pro-badge">FURNISH+</div>` | `<div class="pp-pro-badge">Furnish Pro</div>` |
| `index.html:861` | `<div class="paywall-badge">FURNISH PRO</div>` | `<div class="paywall-badge">Furnish Pro</div>` |
| `app.js:649` | `case 'furnish-plus':` | `case 'furnish-pro':` |
| `styles.css:1620` | `/* Furnish+ mark: ... */` | `/* Furnish Pro mark: ... */` |
| `styles.css:1802` | `/* Furnish+ mark: ... */` | `/* Furnish Pro mark: ... */` |

**Verified safe:** No CSS rule applies `text-transform: uppercase` to `.paywall-badge`, `.pp-pro-badge`, or `.udi-text`, so the source-text change renders directly as "Furnish Pro" with the existing letter-spacing + bold pill polish.

**Paired rename verified:** `data-action="furnish-pro"` declared in HTML AND handled in `app.js`'s switch statement — both flipped together so the dropdown still routes to `openPaywall('generic')`.

**Preserved:** `MONETIZATION_AUDIT.md` references to `Furnish+` and `[data-action=furnish-plus]` left untouched per the historical-archive rule. The archive captures the brand evolution; rewriting it would erase that history.

**Sweep result:** zero remaining `Furnish+` / `FURNISH+` / `FURNISH PRO` strings in any active code or copy surface. Brand consolidation complete.

---

## Featured-Style Row Restructure (2026-04-26)

Homepage Style Pulse section restructured from a flat 9-card grid into a **tight scannable pair + Discover More tile**. The remaining 7 rooms move to a dedicated `/this-week` page that reads from the same single-source config. Establishes the canonical pattern for future weekly featured-style sections.

### Why (Reforge framework citation)

Per **Engagement Loops**: showing all 9 rooms on the homepage flattens hierarchy — every card competes equally and the user gets decision fatigue. **2 cards + an explicit "more" entry creates a curiosity gap** and a routing layer where future filters / sort orders / related styles land without bloating the homepage. The dedicated page is also where deeper engagement metrics (which rooms tap, which styles convert) get instrumented without polluting homepage analytics.

### Architecture (canonical pattern, locked)

A long comment block above `renderStylePulse()` in `app.js` documents the canonical pattern explicitly so the next dev (or future-Claude) replicates it for additional featured rows. Excerpted contract:

> Homepage shows a TIGHT SCANNABLE PAIR: the first 2 rooms from the weekly config as full image cards, plus a narrow brand-brown "Discover More" tile that routes to the dedicated /this-week page where the full 9-room grid lives.
>
> Replicating this pattern for FUTURE featured rows:
>   1. Define a config with the same shape as `THIS_WEEK_CONFIG`.
>   2. Render the first 2 entries via `renderImageCard` (variant: 'grid').
>   3. Append a Discover More tile (`renderDiscoverMoreTile`) with the count of remaining items + a route to a dedicated page.
>   4. The dedicated page calls `renderImageCard` on the full set + adds a hero band + bottom CTA.
> Both surfaces MUST read from the same config — any divergence means the homepage and detail page can drift and confuse users.

### Files touched

| File | Change |
|---|---|
| `app.js:renderStylePulse()` | Now renders **only the first 2 rooms** (Bedroom + Living Room by config order) plus a `renderDiscoverMoreTile()`. The remaining 7 stay in `THIS_WEEK_CONFIG.rooms` untouched. |
| `app.js:renderDiscoverMoreTile(remainingCount)` | NEW. Builds the brand-brown tile with arrow + stacked label ("Discover More" / "N more rooms"). Wired with `data-go="this-week"` for navigation; emits `discover_more_clicked` analytics. NOT a template action — pure routing, no quota impact. |
| `app.js:renderThisWeekPage()` | NEW. Reads from the same `THIS_WEEK_CONFIG`, populates `#thisWeekTitle`, `#thisWeekTagline`, `#thisWeekMeta`, `#thisWeekWeekStamp`, and the full `#thisWeekGrid` with 9 cards via `renderImageCard({...}, { variant: 'grid', source: 'this_week_page' })`. Emits `this_week_page_shown` analytics. |
| `app.js` navigation handler | Added `if (dest === 'this-week') renderThisWeekPage();` and `if (dest === 'styles-index') trackEvent('styles_index_visited', ...)`. |
| `app.js:THIS_WEEK_CONFIG` | Added `tagline:` field — single source of truth for the dedicated page's hero copy. **Rotates with the style each week.** |
| `index.html` | Added `<section data-screen="this-week">` (topbar + back button + hero band + grid container + bottom CTA) and `<section data-screen="styles-index">` (stub with art + title + body + back-to-this-week button). |
| `styles.css` | Updated `.sp-strip` to a 3-column grid (`1fr 1fr 0.6fr`) for the 2 cards + narrower tile layout. Added `.discover-more-tile` block (brand-brown gradient, arrow chip, hover lift, dark-mode + small-viewport variants). Added `.tw-hero`, `.tw-grid`, `.tw-bottom-cta`, `.tw-browse-all` rules for the dedicated page. Added `.styles-index-stub` block for the stubbed page. |

### Hero copy decision (Reforge User Psychology — concrete-sensory specificity)

Three options written; **chose**: *"Clean lines. Warm woods. Iconic forms across every room."*

- **Why this one wins**: three concrete sensory anchors process instantly (no MCM history required). Rule of threes scans in ~2 seconds. The closing "across every room" pre-frames the 9-card grid below as evidence — it answers the question the image grid is about to demonstrate.
- **Rejected — Option 2**: "The style that defined a generation, reimagined for yours" — too abstract; assumes prior knowledge.
- **Rejected — Option 3**: "Walnut, brass, leather. Across nine rooms. One coherent home." — the "one coherent home" framing reads as internal-team language, not user language.

The chosen tagline is stored on `THIS_WEEK_CONFIG.tagline` so each week's style swap also swaps the hero copy.

### Behavioral details (verified)

- ✅ Use Template button on the homepage's 2 cards: unchanged behavior. Routes through `useTemplateFromCard` → `startFromTemplate` → `routeGenerationByModelTier`. Free standard model, Pro premium model. No quota cap (post-compute-quality migration).
- ✅ Use Template on the dedicated page's 9 cards: identical behavior, same code path.
- ✅ Discover More tile: `data-go="this-week"` only. NOT a template action. No quota tick. Emits `discover_more_clicked` for funnel analytics.
- ✅ Back button on `/this-week` returns to home (`data-go="home"`).
- ✅ "Browse all styles" CTA at the bottom of `/this-week` routes to the stubbed `/styles-index`.
- ✅ Both surfaces read from `THIS_WEEK_CONFIG` — change the style in one place and both update. Verified by grep + by tracing both render functions.
- ✅ All 9 room records remain in `THIS_WEEK_CONFIG.rooms` untouched — image data intact for the dedicated page + future surfaces.

### Analytics events

- **NEW** `discover_more_clicked` — props: `source ('style_pulse_homepage')`, `styleId`, `remainingCount`. Fires on tile tap.
- **NEW** `this_week_page_shown` — props: `styleId`, `styleLabel`, `week`, `cardCount`, `placeholderCount`. Fires on page render.
- **NEW** `styles_index_visited` — props: `source ('this_week_browse_all')`. Fires when the bottom CTA routes the user to the stub.
- ✏️ `style_pulse_shown` extended — was `cardCount: 9`; now `featuredCount: 2, hiddenCount: 7, placeholderCount: ...`. Same event name; new shape distinguishes featured vs. hidden when modeling homepage scan-through rates.

### Verification checklist (per Hassan's spec)

- [x] Homepage shows exactly 2 image cards + 1 Discover More tile in this section.
- [x] Dedicated `/this-week` page renders all 9 rooms with full card treatment.
- [x] Both surfaces pull from `THIS_WEEK_CONFIG` — change style name in one place, both update.
- [x] All 9 rooms still have their image data intact in `THIS_WEEK_CONFIG.rooms`.
- [x] Use Template still works on every card across both surfaces (same code path).
- [x] Discover More tile routes correctly via `data-go="this-week"`.
- [x] Back button returns to homepage via `data-go="home"`.
- [x] Bottom CTA routes to `/styles-index` stub via `data-go="styles-index"`.

### Immediate next task (per "don't ship partial" rule)

🔜 **Fill in the dedicated `/styles-index` page content.** Currently a stub with a "coming soon" treatment + back-to-this-week button. The build-out should include:
- A filterable index of every style in `window.STYLES`
- Annotations for "this week's pick" + seasonal callouts
- Side-by-side style comparison surface
- Routing into `/this-week` style-deep-dive when a non-current style is selected

This is the immediate next task. Until it lands, the bottom CTA on `/this-week` lands users on a placeholder. The placeholder explicitly tells users "on its way" so it doesn't read as a broken link.

---

## BUDGET_RESET_PASS — Tutorial coachmark trio replacement (2026-04-27)

**Decision:** Tutorial coachmark trio is now `vibe + materials + scope` (was `vibe + materials + budget` before Q6 budget_tier removal).

**Rationale (per Reforge Activation Dim 04):**
- The tutorial trio gets exactly 3 coachmark slots — scarce attention budget. Allocate to the highest-leverage decisions a user can make on the answers editor.
- `scope` is a 4-way categorical (`just_furniture` / `furniture_decor` / `whole_room` / `surprise_me`) that **radically changes** what the AI generates. "Just furniture" preserves walls and floors; "Whole room" redesigns everything. High-leverage activation moment.
- `decor_density` is a fine-tune. "Clean look" vs "Maximalist" affects how many accent items render but doesn't change the structural definition of the room. Lower-leverage.
- A tutorial that points at a 4-way scope decision teaches the user a primary lever; a tutorial that points at density teaches a secondary lever. Pick the primary lever.

**Other option considered:** `vibe + materials + decor_density`. Rejected because density is decoration-amount fine-tune, not a structural choice.

**Where the choice lives:**
- `app.js:7129` — comment block above TUTORIAL_STEPS array
- `app.js:7152-7160` — TUTORIAL_STEPS[2] is now `id: 'scope'` with title "Your scope" and body explaining the lever

**Phase 2 NEW coachmark:**
A separate one-time tip fires on first arrival at the capture screen, pointing at the new budget slider: "Set your budget for this room. You can change it for every room." Tracked in `state.user.budgetSliderTutorialSeen` (separate flag from `state.user.firstRedesignTutorialSeen`).
