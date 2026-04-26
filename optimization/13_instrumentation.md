# 13 — Data Instrumentation: The Measurement Backbone

**Status:** Critical — without this dimension landing, the other 13 optimization tracks are unfalsifiable.
**Owner:** Hassan
**Reforge anchor:** *Data For Product Managers* (Altitude Maps, Event Dictionary, Cohort Analysis), *Finding Product/Market Fit* (Measuring PMF), *Monetization + Pricing* (Revenue measurement)

---

## Why this file exists

Every other dimension (visual design, psychology, conversion, retention loops, paywall, pricing, onboarding, capture quality, affiliate surfaces, lifecycle email, referrals, push, brand) proposes a change. This file is the contract that says: **here is how we'll know if the change worked**.

Per Reforge's *Data For Product Managers* (Module 1, "Identifying The Altitudes And Outcome Metrics"), Sean Klaus — the SVP of Product who co-authored the program — calls picking the wrong metrics "the number one problem" he sees in PMs effectively using data. Two failure modes:

> "Choosing low level metrics that don't connect to anything the business cares about, or choosing high level metrics that are so broadly defined that the PM can't prove their work is making an impact."

Hassan, you currently have neither a declared north star nor an event dictionary. You have ~62 `trackEvent()` call sites in `app.js`, and a localStorage rolling buffer capped at 200 events. That is sufficient to debug a single user session. It is **not** sufficient to evaluate any of the changes proposed in dimensions 1–12.

This dimension exists to fix that.

---

## Section A — North Star metric proposal

### Recommendation: **Weekly Returning Designer who Clicked an Affiliate Link** (WRDCAL)

**Definition (precise, ungameable):**

> A unique authenticated user who, within the trailing 7 days, has (a) completed at least one redesign generation that was viewed past the reveal gate AND (b) clicked at least one affiliate link AND (c) had at least one prior session more than 24 hours before either action.

The three clauses encode the three things Furnish must do simultaneously to be a real business:

1. **Designed something** (`generation_completed` + `reveal_gate_unlocked` for that room) — proves the AI redesign delivered the core value prop.
2. **Clicked an affiliate** (`affiliate_click`) — proves the affiliate revenue model is being exercised. This is the *only* monetization signal Hassan can see client-side until Stripe webhooks land.
3. **Returned** (prior session ≥24h before) — strips out the false positives of one-and-done curiosity users who designed and clicked in a single session and were never seen again. This is the retention filter that makes the metric a *durable-value* metric, not a top-of-funnel activation metric.

**Measurement formula:**

```
WRDCAL_t = COUNT(DISTINCT user_id) WHERE
    EXISTS (generation_completed within [t-7d, t] AND reveal_gate_unlocked for same roomId)
    AND EXISTS (affiliate_click within [t-7d, t])
    AND EXISTS (session_started within [t-7d, t])
    AND EXISTS (any prior session_started <= t-1d before earliest of (generation_completed | affiliate_click) in window)
```

**Update frequency:** Daily snapshot (computes the trailing 7d on a calendar-day boundary). Weekly KPI for review. Daily cadence is what Reforge's *Building Your Altitude Scorecard* (lesson 4) calls "the natural cadence for an engagement-oriented metric without a daily natural frequency" — Furnish is a **forgettable-zone** product (per Reforge's *Retention + Engagement* program), so daily refresh keeps the signal honest while weekly aggregation is the unit you track.

**Why this and not alternatives:**

| Candidate | Why rejected |
|---|---|
| Total affiliate clicks per active user | Vanity-prone. Optimizes click-bait surfaces over commerce intent. Per Reforge: "vanity metrics include run-of-the-mill dashboard metrics that may feel like they tell a good story but won't guide us on how to solve our users' problems" (*Building Your Altitude Scorecard*). |
| Affiliate revenue per MAU | The right *eventual* north star, but Hassan cannot see revenue client-side. Affiliate networks attribute on a 24h–30d cookie window through their portals, not your product. **Adopt this once a backend reconciliation pipeline lands.** |
| % new users reaching aha_moment | Activation-only. Per Reforge's warning about "history is full of companies that ruthlessly optimized for acquisition above all else, but failed to recognize that users were churning at ever-increasing rates" — this is exactly that trap. |
| Wishlist saves per active user | Engagement signal, not a value-creation signal. A user who saves 50 items but never clicks a buy link is generating zero value. Demote to **driver metric**, not north star. |
| WAU (weekly active users) | Vanity. Sean Klaus, *Identifying The Altitudes*: "diluting the supervisor's scorecard makes it easier for us to lose focus." A user who opens the app, sees nothing, and leaves is counted. |

**Reforge framework citation:**

Per Reforge's *Building Your Altitude Scorecard* (Data For Product Managers, Module 2 Lesson 3), an altitude scorecard should consist of *3–5* metrics, but the **business-impact metric** must connect this altitude to the supervisor's altitude. Hassan, your "supervisor altitude" is the business itself — affiliate revenue + Pro subscription. WRDCAL is your business-impact metric because every WRDCAL user is, by construction, exercising both monetization paths and retaining.

Per Reforge's *Identifying The Altitudes* warning that the north star must reflect a *constellation* not a single factor, WRDCAL is built as a conjunction (designed AND clicked AND returned) precisely so optimizing it requires moving all three sub-metrics — you cannot game it by spamming clicks without designs, by gating designs without commerce, or by acquiring users who don't return.

**The Hassan test:** can you recite the WRDCAL number for last week from memory? If yes, it's your north star. If you have to look up "this week we have 47 generations and 312 clicks and 8 paywall hits and…" — you don't have a north star, you have a dashboard. Reforge's *Building Your Altitude Scorecard* is explicit: "looking forward to a year from now, if I only had three or four metrics on my scorecard, and all those metrics have gone up, could I hang my hat on that and say that I've nailed it?" WRDCAL is that one number.

**Leading indicators (what moves before WRDCAL moves):**

1. **D1 retention of new users** (session_started day 1 / signup_started day 0) — leads WRDCAL by 6 days. If D1 collapses today, WRDCAL drops next week.
2. **First-session aha rate** (% of signup_started → aha_first_results within first session) — leads D1 by 2 hours. If activation breaks, retention breaks.
3. **Affiliate CTR per redesign view** (affiliate_click / generation_completed in same session) — leads the click leg of WRDCAL by zero days; movement here is real-time.
4. **Reveal-gate unlock rate** (reveal_gate_unlocked / reveal_gate_shown) — leads commerce intent. If gates aren't unlocking, the funnel is choked.

---

## Section B — Supporting metrics layer (altitude map)

Per Reforge's *Identifying The Altitudes And Outcome Metrics*, the altitude map is "a quantitative map of the product area we own, what we call our altitude, that describes how our work drives impact for the organization." For a solo founder, the altitudes collapse:

- **Supervisor altitude** = "Furnish as a business" (acquisition + retention + monetization at company level)
- **Your altitude** = "Furnish app product area" (the app itself; you own the whole surface)
- **Solution altitudes** = the 13 other dimensions of this optimization plan

The altitude scorecard below maps high → mid → low. Per Reforge's *Building Your Altitude Map* lesson on solution scorecards, low-altitude metrics should never be reported in isolation; they exist *only* to debug movement at higher altitudes.

| Altitude | Metric | Source events | Why it matters |
|---|---|---|---|
| **HIGH (north star)** | WRDCAL | conjunction: `generation_completed` + `reveal_gate_unlocked` + `affiliate_click` + recurring `session_started` | Single durable-value signal |
| HIGH | New-user activation rate | `aha_first_results` / `signup_started` (within 7d of signup) | Activation health — Reforge's "first riskiest assumption" |
| HIGH | D14 return rate | `session_started` 7-14d after signup / `signup_started` 14-28d ago | Habit formation — leading indicator of WRDCAL |
| HIGH | 30-day Pro conversion | `pro_subscription_started` ≤30d after signup / `signup_started` 30-60d ago | Monetization stabilizer |
| MID | Time-to-aha (median seconds) | `aha_first_results.ts - signup_started.ts` | Onboarding speed; targets <120s p50, <300s p90 |
| MID | Affiliate clicks per active user (week) | `affiliate_click` count / WAU | Commerce velocity |
| MID | Reveal-gate unlock rate | `reveal_gate_unlocked` / `reveal_gate_shown` | Reveal-gate health (dim 03 + 04 measure here) |
| MID | Pro paywall conversion rate | `paywall_converted` / `paywall_shown` | Paywall health (dim 06 + 07 measure here) |
| MID | Premium-quality upsell CTR | `premium_quality_upsell_clicked` / `_shown` | Pro upsell pacing (dim 06) |
| MID | Quiz completion rate | `quiz_completed` / `quiz_started` | Onboarding flow integrity (dim 02) |
| MID | Redesigns per active user (week) | `generation_completed` count / WAU | Engagement intensity (dim 09) |
| MID | Multi-room habit formation | `habit_second_room` / `aha_first_results` (within 14d) | Habit-loop health (dim 09 — closes the natural-frequency gap) |
| MID | Wishlist save rate | `wishlist_added` / `aha_quality_signal` | Commerce intent (proposed event) |
| MID | Lifecycle banner CTR | `lifecycle_banner_clicked` / `_shown` | Re-engagement health (dim 11) |
| MID | Push opt-in rate | `push_permission` result=granted / `push_permission` total | Notification surface health (dim 11) |
| LOW | Photo-upload success rate | `capture_validated` / (`capture_validated` + `capture_rejected`) | Technical onboarding health (proposed) |
| LOW | Style-quiz drop-step | `quiz_skipped` by step / `quiz_started` | Onboarding friction localization (proposed) |
| LOW | Reshuffle rate per redesign | `reshuffle_clicked` / `generation_completed` | Result-quality satisfaction signal (proposed) |
| LOW | Item-swap rate | `swap_clicked` / `generation_completed` | Catalog adequacy signal (proposed) |
| LOW | Affiliate disclosure view rate | `affiliate_disclosure_viewed` / `affiliate_click` | FTC compliance + trust health |
| LOW | Style-pulse impression CTR | `style_pulse_shown` → next event ≠ session_ended | Engagement filler health |
| LOW | Price-drop banner CTR | `price_drop_banner_clicked` / `_shown` | Commerce re-trigger health |
| LOW | Home-progress cell CTR | `home_progress_cell_clicked` / `home_progress_shown` | Multi-room nudge health |
| LOW | Tier-reconcile mismatch rate | `tier_reconciled` where cachedTier ≠ serverTier / total reconciles | Pro state-machine integrity |
| LOW | Tutorial completion vs. skip | `tutorial_completed` / (`tutorial_completed` + `tutorial_skipped`) | Tutorial value; if skip>complete, kill or rebuild |
| LOW | Aha-quality signal mix | `aha_quality_signal` grouped by `signal` property (`item_tapped`, `bookmarked_room`, `share_clicked`, `explicit_vote`) | Which quality signal predicts return — input to a future "best aha proxy" upgrade |
| LOW | Price-alert toggle rate | `price_alert_on` / `wishlist_added` | Pro feature appetite signal |
| LOW | Share-channel mix | `share_*` events grouped by surface | Viral surface health (input to dim 12) |

**Reading the table:** every HIGH-altitude metric has 2-4 MID metrics that move it, and every MID metric has 1-3 LOW metrics that explain its movement. If WRDCAL drops, you walk down the altitude. If "redesigns per active user" drops, look at "reshuffle rate" and "premium-quality upsell CTR" — are users dissatisfied with the result, or are they hitting a generation-quality ceiling? The altitude map is your debug tree.

Per Reforge's *Identifying The Altitudes* lesson, "without an understanding of the metrics we should focus on … we may end up making any of a number of errors. We might ship features based on the wrong metrics … goals that are not meaningfully connected to the metrics that drive the impact leaders want to see." This altitude map is the explicit defense against that.

---

## Section C — Event taxonomy

Per Reforge's *Building A Structured Event Dictionary* (Data For Product Managers, Module 3 Lesson 2), the event dictionary is "the single source of truth for tracking, organizing, and documenting instrumentation." Reforge gives explicit syntax rules:

- **Event name:** noun + verb, snake_case in your case (you've already adopted snake_case so we keep that — Reforge prefers TitleCase but consistency matters more than case).
- **Event property:** snake_case, segmentation of the event ("how did it happen").
- **Three event types:** success, intent, failure. Track all three.
- **Three property types:** action, contextual, backstory.

Furnish currently has ~62 `trackEvent` call sites firing ~30 distinct event names. That hits Reforge's "no more than approximately 25 unique events and 50 unique event properties per product area" guideline at the upper bound — fine for a single-PM solo product. The gaps below add ~30 more events to fill in **failure events** (today there are almost none — you track success, not failure) and **intent events** (you track the thing happening, not the thing the user *meant* to do that didn't happen).

**Destination recommendation:** keep `trackEvent` as the contract. Add a **dual-write** to PostHog (open-source, self-hostable, EU-friendly, free up to 1M events/mo on cloud, free forever self-hosted). Rationale below in §C-Recommendation block. The local rolling buffer becomes a debug tail; PostHog becomes the source of truth.

### Legend

- **Status:** E = existing (firing today), P = proposed (gap to fill), R = retired/deprecated.
- **Type:** S = success, I = intent, F = failure.
- **Layer:** C = client (frontend), B = backend (server-side, where applicable post-backend).

### C.1 — Session & lifecycle (existing — keep)

| Event | Status | Type | Layer | Properties | Fires when (file:line / handler) |
|---|---|---|---|---|---|
| `session_started` | E | S | C | `lifecycle`, `daysSincePrevVisit`, `visitCount` | `app.js:130` `touchLastVisit()` once per app boot |
| `session_ended` | **P** | S | C | `durationMs`, `screensViewed`, `eventsCount` | Add: on `pagehide` / `beforeunload` |
| `screen_viewed` | **P** | S | C | `screenName`, `previousScreen`, `tEnter`, `lifecycle` | Add: in `showScreen()` after current line ~157 |
| `app_resumed` | **P** | S | C | `bgDurationMs`, `lifecycle` | Add: on `visibilitychange` → visible after >30s hidden |
| `app_backgrounded` | **P** | S | C | `screen` | Add: on `visibilitychange` → hidden |
| `error_shown` | **P** | F | C | `type`, `surface`, `message`, `recoverable` | Add: every `alert()` / toast surfacing failure |
| `error_thrown` | **P** | F | C | `message`, `stack`, `surface` | Add: `window.onerror` global handler |
| `dormancy_state_changed` | **P** | S | C | `from`, `to`, `daysSincePrevVisit`, `daysSinceLastDesign` | Add: in `getLifecycleState()` when state transitions vs. last cached |

### C.2 — Acquisition & onboarding (mix existing + gaps)

| Event | Status | Type | Layer | Properties | Fires when |
|---|---|---|---|---|---|
| `welcome_cta_clicked` | **P** | I | C | `cta`, `variant` | Add: welcome screen primary button (currently ambiguous with `signup_started`) |
| `signup_started` | E | I | C | — | `app.js:229` |
| `signup_completed` | **P** | S | C | `provider` (email/google/apple/anonymous), `durationMs` | Add: on auth success |
| `signup_failed` | **P** | F | C | `provider`, `reason` (network/cancelled/credential/email_exists) | Add: on auth error |
| `signin_attempted` | **P** | I | C | `provider` | Add: signin button click |
| `signin_completed` | **P** | S | C | `provider`, `durationMs`, `daysSinceSignup` | Add: returning-user auth success |
| `quiz_started` | **P** | I | C | `triggerSource` (post_signup/profile_settings/manual) | Add: at quiz entry |
| `quiz_question_answered` | **P** | S | C | `step`, `questionId`, `optionId`, `optionLabel`, `tSinceStepShown` | Add: per quiz answer |
| `quiz_completed` | **P** | S | C | `durationMs`, `topStyles`, `topColors`, `confidenceScore` | Add: at quiz finale |
| `quiz_skipped` | **P** | F | C | `atStep`, `questionId`, `tSinceStarted` | Add: skip button |
| `quiz_back_clicked` | **P** | I | C | `fromStep`, `toStep` | Add: back nav inside quiz |
| `setup_photo_uploaded` | E (`SETUP_PHOTO`) | S | C | — | `app.js:3367` (rename property to include `method`: `camera`/`upload`/`template`) |
| `capture_method_chosen` | **P** | I | C | `method` (camera/upload), `entryPoint` (home/results/empty_state) | Add: capture screen entry |
| `capture_validated` | **P** | S | C | `method`, `bytes`, `width`, `height`, `aspect`, `tSinceMethodChosen` | Add: after FileReader → state.draft.photo |
| `capture_rejected` | **P** | F | C | `method`, `reason` (too_large/wrong_type/decode_error/no_room_detected), `bytes` | Add: validation failure path |
| `setup_style_selected` | E (`SETUP_STYLE`) | S | C | `styles`, `source` (skip_default/quiz/manual) | `app.js:1092, 1177` |
| `setup_color_selected` | **P** | S | C | `colors`, `source` | Add: color step (currently no event — gap) |
| `setup_room_type_selected` | E (`SETUP_ROOM_TYPE`) | S | C | `roomType` | `app.js:3340` |
| `setup_budget_selected` | **P** | S | C | `value` | Add (mentioned in research but no current call site for the property `value`) |
| `setup_complete` | E (`SETUP_COMPLETE`) | S | C | (whatever payload exists) | `app.js:3317` |
| `tutorial_started` | E | I | C | `totalSteps` | `app.js:3847` |
| `tutorial_step_viewed` | E | S | C | `step`, `stepId`, `emphasized` | `app.js:3898` |
| `tutorial_completed` | E | S | C | `totalSteps` | `app.js:3956` |
| `tutorial_skipped` | E | F | C | `atStep`, `atStepId` | `app.js:3958` |

### C.3 — Activation & aha moments (existing — augment)

| Event | Status | Type | Layer | Properties | Fires when |
|---|---|---|---|---|---|
| `analyze_started` | **P** | I | C | `tier`, `actionId`, `roomId`, `method` (fresh/template) | Add: on analyze button click |
| `analyze_progress` | **P** | I | C | `roomId`, `progressPct` | Add: every ~25% (4 fires per generation) |
| `analyze_completed` | **P** | S | C | `roomId`, `tier`, `durationMs`, `actionId` | Add: replaces ambiguous part of `generation_completed` |
| `analyze_failed` | **P** | F | C | `roomId`, `tier`, `reason`, `durationMs` | Add: failure path (network/model/timeout) |
| `generation_completed` | E | S | C | `actionId`, `tier` | `app.js:3508` |
| `aha_first_results` | E (`AHA_RESULTS`) | S | C | (first roomId etc.) | `app.js:4129` |
| `aha_quality_signal` | E (`AHA_QUALITY`) | S | C | `signal` (item_tapped/bookmarked_room/share_clicked/explicit_vote), `roomId`, `itemId?`, `vote?` | `app.js:4785, 4826, 4966, 5187` |
| `habit_second_room` | E (`HABIT_2ND_ROOM`) | S | C | `profileId` | `app.js:4142` |
| `habit_third_session` | **P** | S | C | `profileId`, `daysSinceSecondRoom` | Add: third distinct session with a designed room |
| `slider_dragged` | **P** | I | C | `roomId`, `direction` (before/after), `pctReached` | Add: before/after slider engagement signal |
| `lighting_chosen` | **P** | I | C | `roomId`, `value` | Add: lighting toggle (currently untracked) |

### C.4 — Generation, swap, reshuffle (mix existing + gaps)

| Event | Status | Type | Layer | Properties | Fires when |
|---|---|---|---|---|---|
| `pro_action_attempted` | E | I | C | `actionId`, `wasGated`, `lifecycle` | `app.js:3526` |
| `pro_action_completed` | E | S | C | `actionId` | `app.js:3522` |
| `reshuffle_clicked` | **P** | I | C | `roomId`, `reshuffleNum` (1st/2nd/Nth in this room), `tier` | Add: reshuffle button |
| `reshuffle_completed` | **P** | S | C | `roomId`, `reshuffleNum`, `durationMs` | Add: |
| `rearrange_clicked` | E | I | C | `roomId` | `app.js:4412` |
| `swap_clicked` | **P** | I | C | `roomId`, `itemId`, `slotType` | Add: per-item swap action |
| `swap_completed` | **P** | S | C | `roomId`, `itemId`, `replacementItemId`, `slotType` | Add: after swap resolves |
| `swap_cancelled` | **P** | F | C | `roomId`, `itemId`, `reason` | Add: user backs out of swap |
| `room_deleted` | **P** | I | C | `roomId`, `roomAge`, `versionsCount` | Add: when user deletes a room |
| `room_renamed` | **P** | I | C | `roomId` | Add: rename action |

### C.5 — Reveal gate & monetization (existing — keep)

| Event | Status | Type | Layer | Properties | Fires when |
|---|---|---|---|---|---|
| `reveal_gate_shown` | E | I | C | `roomId`, `source` (new_redesign/template) | `app.js:3250, 3433` |
| `reveal_gate_unlocked` | E | S | C | `roomId`, `source`, `tToUnlock` | `app.js:297` (add `tToUnlock`) |
| `reveal_gate_dismissed` | **P** | F | C | `roomId`, `source` | Add: user closes gate without unlocking |
| `paywall_shown` | E | I | C | `context` | `app.js:967` |
| `paywall_trigger` | E | I | C | `from` (actionId), `reason` (pro_feature/quota_exhausted/template_pro) | `app.js:3211, 3525` |
| `paywall_plan_toggled` | **P** | I | C | `from` (monthly/annual), `to` | Add: pw-toggle-btn |
| `paywall_dismissed` | **P** | F | C | `triggeringContext`, `dwellMs` | Add: paywall close |
| `paywall_converted` | E | S | C | `triggeringContext`, `from`, `to`, `source` | `app.js:1028` |
| `pro_subscription_started` | E | S | C | `plan`, `source`, `triggeringContext` | `app.js:1032` |
| `pro_subscription_cancelled` | **P** | F | B | `plan`, `tenureD`, `reason` | **Backend** Stripe webhook |
| `pro_subscription_renewed` | **P** | S | B | `plan`, `tenureD` | **Backend** Stripe webhook |
| `pro_subscription_payment_failed` | **P** | F | B | `plan`, `tenureD`, `attempt` | **Backend** Stripe webhook |
| `tier_changed` | E | S | C | `from`, `to`, `source`, `triggeringContext` | `app.js:1031, 3574, 3594` |
| `tier_reconciled` | E | S | C | `cachedTier`, `serverTier`, `source` | `app.js:3623` |
| `premium_quality_upsell_shown` | E | I | C | `triggeringContext` | `app.js:4281` |
| `premium_quality_upsell_clicked` | E | S | C | (same) | `app.js:4287` |
| `premium_quality_upsell_dismissed` | E | F | C | (same) | `app.js:4294` |

### C.6 — Affiliate & commerce

| Event | Status | Type | Layer | Properties | Fires when |
|---|---|---|---|---|---|
| `item_tapped` | **P** | I | C | `itemId`, `surface` (item_card/wishlist/sheet), `roomId` | Add: tap-to-open before sheet |
| `item_sheet_opened` | **P** | S | C | `itemId`, `surface`, `roomId` | Add: when sheet opens |
| `item_sheet_dismissed` | **P** | F | C | `itemId`, `dwellMs`, `actions` (clicked/saved/none) | Add: sheet close |
| `affiliate_click` | E | S | C | `itemId`, `source`, `price`, `surface` (item_sheet/item_card_button/shop_all/price_tag/wishlist/cart), `roomId`, `fclick` (hashed) | `app.js:3706` (note: rename `fclick` to `fclickHash` and SHA-256 the userId portion — see privacy note below) |
| `affiliate_disclosure_viewed` | E | S | C | — | `app.js:1000` |
| `affiliate_shop_all_clicked` | E | S | C | `roomId`, `itemCount`, `totalPrice` | `app.js:4864` |
| `wishlist_added` | **P** | S | C | `itemId`, `roomId`, `source` (item_sheet/item_card/cart_after_click) | Add: heart toggle on |
| `wishlist_removed` | **P** | F | C | `itemId`, `tenureD` | Add: heart toggle off |
| `wishlist_viewed` | **P** | I | C | `itemCount`, `entryPoint` | Add: wishlist screen entry |
| `wishlist_emptied` | **P** | F | C | `count` | Add: clear-all |
| `bookmark_added` | **P** | S | C | `roomId` | Add: bookmark room button |
| `bookmark_removed` | **P** | F | C | `roomId`, `tenureD` | Add: |
| `price_alert_on` | E | I | C | `itemId` | `app.js:4582` |
| `price_alert_off` | E | F | C | `itemId` | `app.js:4582` |
| `price_drop_detected` | **P** | S | B | `itemId`, `userId`, `oldPrice`, `newPrice`, `dropPct` | **Backend** cron job (see DEFERRED.md push notification delivery) |
| `price_drop_banner_shown` | E | I | C | `itemId`, `discount`, `newPrice` | `app.js:2168` |
| `price_drop_banner_clicked` | E | S | C | (same) | `app.js:2149` |
| `price_drop_banner_dismissed` | E | F | C | `itemId` | `app.js:2165` |
| `cart_view` | **P** | I | C | `roomId`, `itemCount`, `totalPrice` | Add: shop-all surface entry |
| `affiliate_attribution_received` | **P** | S | B | `userId`, `itemId`, `commission`, `network` | **Backend** weekly affiliate-network reconciliation |

### C.7 — Engagement loops (mix existing + gaps)

| Event | Status | Type | Layer | Properties | Fires when |
|---|---|---|---|---|---|
| `home_progress_shown` | E | I | C | (whatever payload exists) | `app.js:2261` |
| `home_progress_cell_clicked` | E | S | C | `roomType`, `action` (open_existing/start_new) | `app.js:2247, 2252` |
| `style_pulse_shown` | E | I | C | `source` | `app.js:1986` |
| `style_pulse_clicked` | **P** | S | C | `source`, `target` | Add: tap on pulse |
| `this_week_page_shown` | E | I | C | (existing) | `app.js:2042` |
| `discover_more_clicked` | E | S | C | (existing) | `app.js:2077` |
| `styles_index_visited` | E | I | C | `source` | `app.js:222` |
| `use_template_clicked` | E | S | C | `templateId`, `source`, `tier` | `app.js:1797` |
| `lifecycle_banner_shown` | E | I | C | `lifecycle`, `days`, `designDays` | `app.js:2425` |
| `lifecycle_banner_clicked` | E | S | C | `lifecycle`, `days` | `app.js:2422` |
| `lifecycle_would_fire` | E | I | C | `campaignId` | `app.js:2348` (deferred until backend email) |
| `explore_welcome_browse_clicked` | E | S | C | — | `app.js:2451` |

### C.8 — Sharing & virality

| Event | Status | Type | Layer | Properties | Fires when |
|---|---|---|---|---|---|
| `share_clicked` | **P** | I | C | `surface`, `roomId` | Add: share button click before fan-out |
| `share_download` | E | S | C | `pro`, `roomId` | `app.js:5101` |
| `share_caption_copied` | E | S | C | `roomId` | `app.js:5117` |
| `share_invite_link_copied` | E | S | C | `roomId` | `app.js:5135` |
| `share_pinterest_clicked` | E | S | C | `roomId` | `app.js:5151` |
| `share_system_success` | E | S | C | `roomId` | `app.js:5165` |
| `share_system_failed` | **P** | F | C | `roomId`, `reason` | Add: navigator.share rejection path |
| `referral_link_copied` | **P** | S | C | `userId` (hashed) | Add: when referral page lands |
| `referral_link_visited` | **P** | I | C | `inviterIdHash`, `entryPath` | Add: deep-link landing detection |
| `referral_signup_attributed` | **P** | S | C | `inviterIdHash`, `tFromVisit` | Add: at signup_completed if referral cookie present |
| `email_capture_attempted` | **P** | I | C | `source` (paywall/lifecycle/share) | Add: email field touch |
| `email_capture_completed` | **P** | S | C | `source` | Add: state.emailIntent push |
| `email_capture_failed` | **P** | F | C | `source`, `reason` | Add: invalid email |

### C.9 — Operational & system

| Event | Status | Type | Layer | Properties | Fires when |
|---|---|---|---|---|---|
| `push_permission` | E | S | C | `result` (granted/denied/dismissed) | `app.js:4532` |
| `push_pre_prompt_shown` | **P** | I | C | `triggeringContext` | Add: before native prompt |
| `push_pre_prompt_accepted` | **P** | S | C | `triggeringContext` | Add: |
| `push_pre_prompt_dismissed` | **P** | F | C | `triggeringContext` | Add: |
| `push_received` | **P** | S | B | `userId`, `campaignId` | **Backend** delivery confirm (deferred) |
| `push_opened` | **P** | S | C | `campaignId` | Add: notification click handler in service worker |
| `theme_toggled` | **P** | I | C | `from`, `to` | Add: dark/light toggle |
| `feedback_left` | **P** | S | C | `value` (love/close/off), `roomId`, `surface` | Add: post-redesign feedback (mentioned in research as missing) |
| `nps_shown` | **P** | I | C | `triggeringContext` | Future NPS micro-survey |
| `nps_responded` | **P** | S | C | `score`, `comment?` | Future |
| `rate_limit_hit` | **P** | F | B | `userId`, `tier`, `endpoint`, `cap` (hourly/daily) | **Backend** per DEFERRED.md anti-abuse |
| `rate_limit_warning_shown` | **P** | I | C | `tier`, `cap`, `usedPct` | Add: client-side approaching-limit toast |
| `quota_tamper_suspected` | R | F | C | — | **RETIRED** per DEFERRED.md compute-quality migration |

### Total: ~76 events (62 existing + ~30 proposed gaps + ~10 backend-only). Well within Reforge's 25-event/area best practice when divided across the ~6 product surfaces (onboarding, capture, generation, monetization, commerce, engagement).

### C-Recommendation: vendor wiring

**Today's reality (per Hassan-locked decision):** `trackEvent` writes to `state._events` (max 200) and `console.log`. No external vendor. This is intentional pre-backend, but it has hard limits:

1. The buffer is **lossy**. After 200 events, oldest events are dropped. A typical activated user session burns through 50+ events. After 4 sessions you've lost the signup_started event you need for cohort analysis.
2. There is **no aggregation**. You cannot answer "what is the D14 return rate of users who signed up last month" without exporting every device's localStorage and union-ing them.
3. There is **no cohort UI**. Reforge's *Cohort Analysis* lesson is built around heat-maps and conditional formatting; you need a tool that produces them.

**Recommendation: dual-write to PostHog Cloud (free tier) the moment a backend lands.**

| Vendor | Pro | Con | Verdict |
|---|---|---|---|
| **PostHog** | Open-source, self-hostable, free 1M events/mo cloud, EU data residency, native cohort UI, native funnel UI, native session replay (when you want it later), anti-tracking-friendly | Cohort UX less polished than Amplitude | **Pick this.** Best fit for Hassan's privacy brand + cost ceiling. |
| Amplitude | Best-in-class cohort UI, mature funnel analysis | Free tier capped at 50k MTUs, expensive at scale ($50k+/yr Growth plan), US-only data | Pick if you outgrow PostHog cohort UI. Not yet. |
| Mixpanel | Strong funnel UX | Pricing model has bitten many founders; aggressive sales | Skip. |
| Segment | Routing layer, multi-vendor fan-out | Only useful once you have ≥2 destinations | Premature. Add if you ever fan out to a marketing tool. |
| GA4 | Free | Useless for product analytics; sampled, delayed, cohorts terrible | Use only as a top-of-funnel marketing tool, not for product. |

**Wiring plan** (single change to `trackEvent` body):

```js
function trackEvent(name, props = {}) {
  const evt = { name, ts: Date.now(), ...props };
  state._events = (state._events || []).slice(-200);
  state._events.push(evt);
  save();
  if (window.posthog && typeof window.posthog.capture === 'function') {
    window.posthog.capture(name, props);
  }
  if (console && console.log) console.log('[track]', name, props);
}
```

PostHog identifies users via `posthog.identify(userId)` — call once on signup. From then on, every `capture` is automatically attributed.

Per Reforge's *Instrumentation Best Practices* (Module 3 Lesson 5): "We should engineer events on the back end" for revenue, scorecard metrics, third-party integrations, and indirect actions. **Stripe webhook events** (subscription created/cancelled/renewed/payment_failed) and **affiliate-network attribution events** must be backend-only. Do not mirror them client-side; the client cannot be trusted with revenue truth.

---

## Section D — Cohort definitions

Per Reforge's *Cohort Analysis* (Module 4 Lesson 4 of *Data For Product Managers*): "a cohort is a group of users who share a common characteristic over time." A cohort is a *type* of segment where the segmentation variable is "stage in the user journey."

For each cohort below: **definition** (precise, queryable), **what question this cohort answers** (Reforge's "use case" framing), and **size assumption** (rough scale-out check).

### D.1 — New users (this week)

```sql
SELECT user_id FROM events
WHERE name = 'signup_started'
  AND ts >= date_trunc('week', now()) - interval '7 days'
  AND ts < date_trunc('week', now())
GROUP BY user_id;
```

**Use case:** baseline cohort for every funnel analysis. Cohort the week of signup, then track activation, return, conversion at fixed t+offsets.
**Sample size assumption:** 100-1000/wk depending on acquisition spend. <50/wk = funnel charts are noise; aggregate to monthly cohorts.

### D.2 — Activated users

```sql
SELECT user_id FROM events
WHERE name = 'aha_first_results'
  AND user_id IN (SELECT user_id FROM events WHERE name = 'signup_completed')
  AND ts <= signup_ts + interval '7 days'
GROUP BY user_id;
```

**Use case:** denominator for "what % of activated users come back / convert / click." Per Reforge: activation is the *prerequisite* for retention analysis. An unactivated user who never returns isn't churn — they never started.

### D.3 — Habit-formed users (returned within 14d AND ≥1 save)

```sql
SELECT user_id FROM (
  SELECT user_id FROM events WHERE name = 'aha_first_results'
) a
JOIN (
  SELECT user_id, MIN(ts) AS first_session FROM events WHERE name = 'session_started' GROUP BY user_id
) s USING (user_id)
WHERE EXISTS (
  SELECT 1 FROM events
  WHERE events.user_id = a.user_id
    AND events.name = 'session_started'
    AND events.ts BETWEEN a.ts + interval '1 day' AND a.ts + interval '14 days'
)
AND EXISTS (
  SELECT 1 FROM events
  WHERE events.user_id = a.user_id
    AND events.name IN ('wishlist_added','bookmark_added')
    AND events.ts <= a.ts + interval '14 days'
);
```

**Use case:** the cohort that proves the retention loop works. Per Reforge's *Measuring And Evaluating Retention*, two-action retention is a stronger habit signal than "session within Nd." This cohort is **the WRDCAL feeder** — they have done two of the three required actions; you need them to click.

### D.4 — Free users at risk (active 7-21d, low engagement)

```sql
SELECT user_id FROM users
WHERE tier = 'free'
  AND days_since_signup BETWEEN 7 AND 21
  AND generations_count <= 1
  AND wishlist_count = 0;
```

**Use case:** lifecycle email cohort. These are the users who tried it, didn't bounce, but didn't form the habit. Email prompt: "design your second room" or "save your first piece." Highest-leverage retention cohort.

### D.5 — Free users with Pro intent

```sql
SELECT user_id, COUNT(*) AS paywall_views FROM events
WHERE name = 'paywall_shown'
GROUP BY user_id
HAVING COUNT(*) >= 3
   AND user_id NOT IN (SELECT user_id FROM events WHERE name = 'paywall_converted');
```

**Use case:** the unconverted-but-warm cohort. Per Reforge's *Monetization + Pricing*, willingness to pay is a function of repeated value-perception moments. 3 paywall views = 3 unmet purchase intents. Trigger: in-app discount email, "we noticed you've considered Pro 3 times" message, or annual-discount-only treatment.

### D.6 — Pro users (organic conversion)

```sql
SELECT user_id FROM users
WHERE tier = 'pro' AND grandfathered = false;
```

**Use case:** denominator for retention/churn analysis on the paid cohort. Per Reforge's *Measuring And Evaluating Retention*: do NOT mix grandfathered Pro with paid Pro in retention curves — grandfathered users have zero-cost, infinite-incentive to retain; their behavior masks real Pro economics.

### D.7 — Pro users (grandfathered)

```sql
SELECT user_id FROM users
WHERE tier = 'pro' AND grandfathered = true;
```

**Use case:** baseline for "what does usage look like with no monetization friction." Compare to D.6 to estimate willingness-to-pay distortion.

### D.8 — Dormant users (no session 30-90d)

```sql
SELECT user_id FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM events
  WHERE events.user_id = u.user_id
    AND events.name = 'session_started'
    AND events.ts > now() - interval '30 days'
)
AND EXISTS (
  SELECT 1 FROM events
  WHERE events.user_id = u.user_id
    AND events.name = 'session_started'
    AND events.ts > now() - interval '90 days'
);
```

**Use case:** resurrection email/push target. Per Reforge's *Retention + Engagement*, this is the highest-leverage cohort for resurrection campaigns; they were habit-formed once and have measurable signal of what they care about.

### D.9 — Churned users (no session 90+d)

```sql
SELECT user_id FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM events
  WHERE events.user_id = u.user_id
    AND events.name = 'session_started'
    AND events.ts > now() - interval '90 days'
);
```

**Use case:** seasonal resurrection, learning cohort for "what made them leave." Lower expected return rate than D.8.

### D.10 — Power affiliate clickers (top decile)

```sql
SELECT user_id FROM (
  SELECT user_id, COUNT(*) AS click_count,
         NTILE(10) OVER (ORDER BY COUNT(*) DESC) AS decile
  FROM events
  WHERE name = 'affiliate_click'
    AND ts > now() - interval '30 days'
  GROUP BY user_id
) t WHERE decile = 1;
```

**Use case:** the user archetype that monetizes Furnish. Reforge's *Segmentation Analysis Deep Dive* names this "the power-user segment": disproportionate value, often <10% of users, often >50% of revenue. Interview these. Send them concierge support. Test premium SKUs against this cohort first.

### D.11 — Wishlist-heavy users (≥10 items saved)

```sql
SELECT user_id FROM (
  SELECT user_id, COUNT(*) AS saves FROM events
  WHERE name = 'wishlist_added' GROUP BY user_id
) WHERE saves >= 10;
```

**Use case:** highest commerce-intent cohort that hasn't converted to a click. The wishlist is a saved-for-later catalog; if they aren't clicking, the gap is in price-watch / decision-confidence, not in interest. Test price-drop email frequency on this cohort.

### D.12 — Referrers

```sql
SELECT user_id FROM events WHERE name = 'referral_link_copied';
```

**Use case:** users who like Furnish enough to broadcast it. Smaller than D.10 typically. Per Reforge's *Growing Users* / *Finding PMF* program: a >10% referral rate on activated users is a strong PMF signal. Track whether activated → referrer rate climbs over time as a "is the experience getting more shareable" health check.

### D.13 — Referees (came in via referral link — once instrumented)

```sql
SELECT user_id FROM events WHERE name = 'referral_signup_attributed';
```

**Use case:** organic-acquisition cohort. Reforge's *Growth Series* expects referees to retain better than paid-acquired users; if they don't, your referral incentive is misaligned (e.g., bribed referrals).

### D.14 — Multi-room habituals (designed ≥3 rooms)

```sql
SELECT user_id FROM (
  SELECT user_id, COUNT(*) AS room_count FROM events
  WHERE name = 'generation_completed' GROUP BY user_id
) WHERE room_count >= 3;
```

**Use case:** the cohort that has internalized the use case beyond "design my apartment." This is the tail that justifies retention features (templates, multi-profile). Per Reforge's *Define Retention Metric* project: 3+ uses crosses the "novelty → habit" threshold for most product categories.

### D.15 — High-quality first-session cohort (signup + aha + click in same session)

```sql
SELECT user_id FROM events e1
WHERE name = 'signup_started'
  AND EXISTS (SELECT 1 FROM events e2 WHERE e2.user_id = e1.user_id AND e2.name = 'aha_first_results' AND e2.ts BETWEEN e1.ts AND e1.ts + interval '30 minutes')
  AND EXISTS (SELECT 1 FROM events e3 WHERE e3.user_id = e1.user_id AND e3.name = 'affiliate_click' AND e3.ts BETWEEN e1.ts AND e1.ts + interval '30 minutes');
```

**Use case:** the magic-first-session cohort. Hypothesis: this cohort retains at multiples of the typical first-session cohort. Validating that hypothesis tells you whether your activation is "optimize for time-to-aha" or "optimize for first-session breadth."

---

## Section E — Recommendations

Each entry: **REC-13.N — Title** | What | Why (Reforge framework + citation) | Action | Effort | Measure.

### REC-13.1 — Declare WRDCAL as the company north star, post it weekly, gate every roadmap decision against it

**What:** Pick WRDCAL as defined in §A. Publish the number on a single dashboard slide every Monday. Every other dimension's recommendation gets a single-line pre-mortem: "if we ship this, what's the WRDCAL move and how soon?"

**Why (Reforge):** Per Reforge's *Building Your Altitude Scorecard* (Data For Product Managers, Module 2 Lesson 3), the "single metric to rule them all" trap exists, but the *opposite* trap — "no metric, vibes-driven roadmap" — is worse for solo founders. The altitude scorecard is the answer: 3-5 metrics with a clear hierarchy, and ONE at the top that you optimize globally. Sean Klaus's sense-check: "looking forward to a year from now, if I only had three or four metrics on my scorecard, and all those metrics have gone up, could I hang my hat on that and say that I've nailed it?" WRDCAL is that one.

**Action:** Add `dashboards/wrdcal.md` weekly journal. Compute it from `state._events` exports manually until PostHog lands; then PostHog query.

**Effort:** S (writing). Compute is M until PostHog (manual export aggregation).

**Measure:** Cadence consistency. If you skip a week, your WRDCAL isn't really your WRDCAL.

---

### REC-13.2 — Wire PostHog Cloud (free tier) the moment Supabase auth is a hard dependency anyway

**What:** Add PostHog JS SDK behind a feature flag. Modify `trackEvent` to dual-write (localStorage + posthog.capture). Identify users with `posthog.identify(supabaseUserId)` at signup_completed. Do NOT capture PII; only event names and properties as defined in §C.

**Why (Reforge):** Per Reforge's *Instrumentation Best Practices*: "I'm very confident that effective instrumentation can be taught. I've seen people dramatically improve after a few reps." Reps require a real tool. The 200-event localStorage buffer is fine for debug, useless for cohort analysis. Reforge's *Cohort Analysis* lesson is built around heat-maps; you cannot generate heat-maps from your current setup.

**Action:**
1. Sign up posthog.com (free 1M events/mo).
2. Add `<script>` snippet in `index.html` head with project key.
3. Modify `trackEvent` to fan out (3-line addition).
4. Call `posthog.identify(supabaseUser.id)` in signin_completed handler.
5. Call `posthog.reset()` in signout handler.
6. Dual-write for 30 days; validate parity with localStorage; deprecate `state._events` to a "session debug tail" only.

**Effort:** M (1 day end-to-end including parity verification).

**Measure:** Server-side event count in PostHog ≥ 95% of localStorage count for sampled users. Cohort heat-map renders for D.1 (new users this week).

---

### REC-13.3 — Backfill the failure-event taxonomy gaps (Reforge: success + intent + failure are all required)

**What:** Add the 18 failure-event entries listed in §C. Especially: `signup_failed`, `capture_rejected`, `analyze_failed`, `paywall_dismissed`, `reveal_gate_dismissed`, `share_system_failed`, `error_thrown`, `error_shown`, `swap_cancelled`, `wishlist_removed`, `bookmark_removed`, `email_capture_failed`.

**Why (Reforge):** Per *Building A Structured Event Dictionary*: "Failure events are what happens when something prevents the user from completing the success event. We think of failure events as anti-events." Today Furnish tracks success and intent. Without failures, you can compute conversion rate at any step but you cannot diagnose **why** users drop. Example: you know 60% of capture-method-chosen users reach analyze_started, but you have no idea whether the missing 40% saw a `capture_rejected` (engineering fix) or simply backed out (UX fix). These are completely different problems with completely different solutions.

**Action:** For each failure-event entry in §C:
1. Find the call-site of the success/intent partner.
2. Find the rejection/dismissal/error path.
3. Add `trackEvent('<failure_name>', { reason, … })`.

**Effort:** L (~1 day to wire all 18).

**Measure:** For every existing success event, the matching failure event fires at ≥ 1 instance in a week of traffic. Funnel charts show non-zero failure leakage at each step.

---

### REC-13.4 — Add server-side events for monetization (Stripe webhooks) and affiliate attribution (when backends land)

**What:** Per DEFERRED.md Stripe / billing section, add `pro_subscription_renewed`, `pro_subscription_cancelled`, `pro_subscription_payment_failed` as backend-only events fired from the Edge Function. Per DEFERRED.md affiliate_clicks SQL, add `affiliate_attribution_received` from a weekly affiliate-network reconciliation cron (when networks supply CSVs/APIs).

**Why (Reforge):** Per *Instrumentation Best Practices*: "We should engineer events on the back end" for revenue, scorecard metrics, and third-party integrations. Reasons: (1) ad blockers eat 10-30% of frontend events and Stripe is too important for that loss; (2) the client cannot be trusted with monetization truth (a malicious client could fake `paywall_converted`); (3) affiliate attribution is by definition a third-party integration — clicks happen on your domain but conversions happen on theirs; only their network can tell you what converted, and only your backend can ingest that.

**Action:**
1. Add `subscriptions` table per DEFERRED.md SQL.
2. Stripe webhook → on `customer.subscription.created/updated/deleted`, write a row in `events` table with event_name, user_id, props.
3. Add `affiliate_clicks` table per DEFERRED.md SQL.
4. Weekly cron pulls Amazon/Awin/CJ/Rakuten/ShareASale/Etsy reports → joins on `fclick` → writes `affiliate_attribution_received` event with item, commission, network.
5. Push these events into PostHog via server-side capture (not client) so they appear in the same event stream.

**Effort:** XL (weeks; gated on DEFERRED.md backend phase).

**Measure:** WRDCAL upgrades from "click-based proxy" to "revenue-grounded." MRR computable from `pro_subscription_*` events alone, no Stripe dashboard needed.

---

### REC-13.5 — Hash userId in `affiliate_click.fclick` and document the PII boundary

**What:** The current `affiliate_click` event captures `fclick=<userid-timestamp>` where userid is the Supabase auth UUID. Replace with `fclickHash = sha256(userid + clientSecret + timestamp).slice(0,16)`. The hashed value is sufficient for affiliate-attribution joins (you control the salt server-side) but useless to a leaked client log.

**Why (Reforge + general):** Reforge does not directly cover privacy in *Data For Product Managers*, but its *Brand Marketing* program (Trust Layer) treats user-data hygiene as a brand asset. More importantly: Hassan, your brand is "AI for design without the creepiness of recommendation engines." A leaked log file with raw user UUIDs is a PR liability. Hashed user IDs are best practice; SHA-256 with a server-held salt is the floor.

**Action:**
1. Add `AFFILIATE_FCLICK_SALT` to backend env (when backend lands).
2. Until backend: use a per-install salt persisted in localStorage on first run. Imperfect but better than raw UUID.
3. Document in `README.md` privacy section: "We capture interactions; we do not capture chat content or photo content; all user identifiers in click logs are hashed."

**Effort:** S (1 hour client; XS docs).

**Measure:** Grep `state._events` exports — zero raw UUIDs visible.

---

### REC-13.6 — Build the altitude-map dashboard as one HTML file, not a SaaS subscription

**What:** Create `optimization/dashboard.html` (or a server route post-backend) that renders WRDCAL + the 4 HIGH-altitude metrics + the 14 MID-altitude metrics + the 12 LOW-altitude metrics in one scrollable page. Each metric: number, last-7-day spark, target, color (green/yellow/red vs. target).

**Why (Reforge):** Per *Building Your Altitude Scorecard*, the scorecard is "the quantitative description of our product area" — it must exist as a *visible artifact* that Hassan looks at weekly, not a query you re-run. Reforge: "the altitude scorecard allows us to directly link our product area to the outcomes our supervisor cares about, allowing us to stay on track and measure our impact against those outcomes."

A founder who has to compose a SQL query every Monday won't compose it every Monday. A static dashboard that auto-refreshes on every page load gets looked at.

**Action:**
1. PostHog supports embeddable dashboards via API.
2. Or: a single HTML page that calls PostHog's Insights API with cached results.
3. Bookmark in browser. Open every Monday morning before any other action.

**Effort:** M (half-day post-PostHog).

**Measure:** Open the page weekly. Count weeks-in-a-row with a check-in. Streak >8 weeks = north-star culture has landed.

---

### REC-13.7 — Define cohort comparison conventions before running any A/B test

**What:** Before any optimization-plan dimension runs an experiment, lock the **starting point**, **population**, **behavior**, and **time period** in writing. Per Reforge's *Cohort Analysis*: "the four input variables are populations, starting point, behavior, and time period."

**Why (Reforge):** Reforge's *Cohort Analysis* lesson explicitly warns about three traps: simple-vs-weighted averages, normalizing for time, and unbounded-vs-end-day retention. A dimension-3 (conversion) experiment that says "conversion went up 12%" without specifying which cohort, what time window, weighted vs. unweighted, is statistically meaningless. Most founder A/B tests fail not because the test was wrong but because the read-out was wrong.

**Action:** Add a 4-line comment block to any experiment proposal:
```
COHORT: <description>
STARTING POINT: <event + window>
BEHAVIOR: <metric being measured>
TIME PERIOD: <days from starting point>
```

If any dimension's recommendation can't be filled out as the 4 lines, the recommendation isn't ready to test.

**Effort:** XS (process change).

**Measure:** Zero experiments shipped without the 4-line block. Every experiment readout cites its cohort-comparison conventions.

---

### REC-13.8 — Replace the implicit lifecycle-bucket cohort with explicit `lifecycle` user property + `dormancy_state_changed` event

**What:** Today `getLifecycleState()` (`app.js:97-111`) returns the lifecycle bucket on demand. Add a sticky user property `lifecycle` updated on each `session_started`, plus a `dormancy_state_changed` event when the bucket changes between sessions.

**Why (Reforge):** Per Reforge's *Instrumentation Best Practices*, "user properties enable actionable segmentation analysis." The lifecycle bucket today is a **derived value**: it exists at the moment of computation, not as a persisted attribute. That means you can filter by it in real-time but you can't ask "who was DORMANT 30 days ago and ACTIVE today" — the historical state is lost. With a property + transition event, you get both filter capability *and* the resurrection cohort that the lifecycle email system needs as its trigger.

**Action:**
1. In `touchLastVisit()`, after computing `getLifecycleState()`, set `state.user.cachedLifecycle` and emit `dormancy_state_changed { from: cached, to: current }` if changed.
2. Add `posthog.people.set({ lifecycle: current })` if PostHog is wired.
3. Use this property as the filter for D.4, D.8, D.9.

**Effort:** XS (~30 lines).

**Measure:** Cohort D.8 (dormant) populates correctly when filtered on `lifecycle = dormant`. The transition event fires on first session of a new bucket only (not every session).

---

### REC-13.9 — Stop trusting client-side `paywall_converted` for revenue claims; start trusting Stripe webhook `pro_subscription_started` only

**What:** Today, `paywall_converted` fires from `app.js:1028` as part of the mocked Stripe flow. Once real Stripe lands, the source of truth for *all* monetization metrics must be the Stripe webhook event, not the client. The client event becomes an *intent* event ("user clicked the button"), the backend event becomes the *success* event ("subscription created").

**Why (Reforge):** *Instrumentation Best Practices*: "track 100% of our revenue data from the back end." Mixing client-side conversion signal with backend revenue truth produces irreconcilable numbers. You will lose >5% of conversions to ad-blockers, and you will gain noise from users who clicked the button, then declined Stripe, then clicked again, fired duplicate events. Deduplicating on the client is brittle.

**Action:** When Stripe lands:
1. Rename `paywall_converted` → `paywall_cta_clicked` (it was always intent, not success).
2. Add `pro_subscription_started` from the Stripe webhook (already in DEFERRED.md backend cutover contract).
3. All Pro conversion-rate dashboards: numerator = backend event, denominator = client `paywall_shown`.

**Effort:** S (rename + Edge Function).

**Measure:** Pro conversion rate computed from backend lines up with Stripe Dashboard subscriber count to within 1%. Today the discrepancy is unbounded.

---

### REC-13.10 — Track action properties, not separate event names, for variant flows (per Reforge)

**What:** Audit existing event names for the Reforge anti-pattern of "Uber Black Ordered / Uber Pool Ordered / Uber X Ordered" instead of "Ride Ordered with car_type property." A few candidates in Furnish:
- `share_download` / `share_caption_copied` / `share_invite_link_copied` / `share_pinterest_clicked` / `share_system_success` → consolidate into `share_completed { channel: download/caption/invite_link/pinterest/system }`.
- `tier_changed` from many sources → already correct (good); preserve.
- `setup_*` events as separate event names → defensible since each is a discrete journey step, but consider unifying into `setup_step_completed { step: photo/style/room_type/color/budget }`.

**Why (Reforge):** *Building A Structured Event Dictionary*: "The wrong way to track the user's actions would be to track three separate events, Uber black ordered or Uber pool ordered or Uber x ordered. This type of tracking is overly specific and not useful for PMs." Today, computing "share rate" requires unioning 5 events. With consolidation, it's one event filtered by property.

**Action:**
1. Add new `share_completed { channel }` event firing alongside existing 5.
2. After 30 days of dual-fire, deprecate the 5 old events.
3. Migrate dashboards to filter on the new event.

**Effort:** S (additive event + 30-day dual fire).

**Measure:** "Share rate" query simplified from union-of-5-events to single-event-with-property. Dashboard SQL halves in size.

---

### REC-13.11 — Add a `funnel.activation` materialized view: signup_started → setup_complete → aha_first_results → habit_second_room

**What:** Define and persist the activation funnel as the canonical funnel chart, with explicit cohorts and time windows. Persist as a PostHog Funnel insight saved to the dashboard.

**Why (Reforge):** Per Reforge's *Defining Conjectures Correctly*: "consistent insight generation is a loop." That loop requires a baseline funnel that doesn't change definition month to month. If the funnel is rebuilt every analysis, comparisons across time become meaningless. The activation funnel is the most-asked-about chart in Furnish; it must be canonical.

**Action:**
1. PostHog Funnels → new funnel: signup_started → setup_complete → aha_first_results → (within 14d) habit_second_room.
2. Save as named insight "Activation Funnel — Canonical."
3. Add to dashboard.
4. Lock the time-window definitions in writing inside the dashboard description field.

**Effort:** S.

**Measure:** Every "is the funnel improving" question gets answered by linking to this insight, not by ad-hoc query.

---

### REC-13.12 — Backfill `tSinceX` properties on key events for time-to-action analysis

**What:** Add elapsed-time properties to events that participate in the activation funnel:
- `signup_completed { tSinceWelcomeViewed }` — first impression to commit
- `setup_complete { tSinceSignup }` — onboarding velocity
- `aha_first_results { tSinceSetupComplete }` — capture-to-aha velocity
- `affiliate_click { tSinceAhaFirstResults }` — aha-to-commerce velocity
- `paywall_converted { tSincePaywallShown }` — paywall dwell-to-convert

**Why (Reforge):** Per Reforge's *Engagement* concept (referenced in *Building Your Altitude Scorecard*): "intensity metrics like time on app and time on drive measure whether or not the PM is delivering user value." Speed-to-value is the strongest predictor of retention; it can only be measured if the elapsed time is captured at event-fire, not derived later (because deriving requires every prior event to still be in the buffer, which is unreliable).

**Action:** Each above call-site stores a timestamp at the precursor event in `state._timing`, references it on the successor.

**Effort:** S (10-line state-machine + 5 events to instrument).

**Measure:** p50/p90 time-to-aha visible in any insight tool. Hypothesis-testable: does p50 time-to-aha < 2min predict D14 return?

---

## Top 3 priorities for this dimension

1. **REC-13.1 — Declare WRDCAL.** Without a north star, every other dimension's "did it work" question is unanswerable. If Hassan can't recite WRDCAL from memory by next Monday, every optimization above is a lottery ticket. Cost: writing exercise. Payoff: every other dimension becomes accountable.

2. **REC-13.2 — Wire PostHog.** localStorage is a debug log, not analytics. Cohort analysis (Reforge's most leveraged tool) is impossible without a real warehouse. Cost: 1 day of engineering once Supabase auth is firm. Payoff: every cohort definition in §D becomes queryable.

3. **REC-13.3 — Backfill failure events.** You cannot debug a funnel you only see successes for. Today Furnish has the success scaffold and intent scaffold but the failure layer is missing — meaning every "why did the funnel break" investigation is currently a guess. Cost: 1 day to wire 18 failure events. Payoff: every drop-step in every funnel becomes diagnosable.

Everything else (cohort definitions, dashboards, server-side events, hashing, action properties) builds on these three. Land them in this order.

---

## Notes for cross-dimension reviewers

- **Dim 02 (psychology) / 03 (conversion) / 06 (paywall) / 07 (pricing):** all rely on `paywall_*` events being clean. Any new variant they propose must add `variant` properties to existing events, not new event names (per REC-13.10).
- **Dim 04 (capture) / 05 (onboarding):** the `quiz_*` and `capture_*` event gaps in §C.2 are blocking any onboarding optimization. Land those before measuring any onboarding change.
- **Dim 08 (affiliate surfaces) / 09 (engagement loops):** `wishlist_*`, `bookmark_*`, `swap_*` event gaps in §C.4 + §C.6 must land before any commerce-surface change is measurable.
- **Dim 10 (lifecycle email) / 11 (push):** trigger events depend on `dormancy_state_changed` (REC-13.8). Without that, lifecycle campaigns fire on a polling rule rather than a state-machine.
- **Dim 12 (referrals/virality):** `referral_*` events are entirely new (§C.8); cannot be measured today.
- **All dimensions:** every recommendation in every other file should be checkable against this file's altitude map. If the proposed change doesn't move a metric in this file, the change doesn't matter — or this file is missing a metric.

— end —
