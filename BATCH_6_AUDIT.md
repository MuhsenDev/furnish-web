# BATCH 6 AUDIT — Dim 13 Data Instrumentation

**Status:** ⚙️ PROCEEDING — streamlined-gate cleared per "approve all changes" policy.
**Created:** 2026-04-26
**Source:** `OPTIMIZATION_PLAN.md` Dim 13 (12 entries + 76-event taxonomy + 15 cohort definitions, ~85% Reforge).
**Conflicts touched:** None new. Conflict 4 (no fake numbers) governs the privacy fix's defensible-only-in-real-data treatment.
**Critical bug flag:** YES — `affiliate_click.fclick` URL parameter leaks PII (raw UUID or email) to retailers + browser history. **Ships first**, regardless of context budget.

---

## §A — North Star: WRDCAL (canonical declaration)

**Definition:** Weekly Returning Designer who Clicked an Affiliate Link.

> A unique authenticated user who, within the trailing 7 days, has (a) completed at least one redesign generation that was viewed past the reveal gate AND (b) clicked at least one affiliate link AND (c) had at least one prior session more than 24 hours before either action.

**Three-way conjunction encodes the three things Furnish must do simultaneously:**
1. **Designed something** (`generation_completed` + `reveal_gate_unlocked`) — proves AI redesign delivered core value
2. **Clicked an affiliate** (`affiliate_click`) — proves affiliate revenue model is exercised
3. **Returned** (prior session ≥24h before) — strips false-positive one-and-done curiosity users

**Update cadence:** Daily snapshot (trailing 7d on calendar boundary). Weekly KPI for review. Per Reforge *Building Your Altitude Scorecard* L4 — daily refresh keeps signal honest, weekly aggregation is review unit. Furnish is **forgettable-zone** product (per Reforge *Retention + Engagement*).

**Why not alternatives:** Total affiliate clicks → vanity. Affiliate revenue per MAU → right eventual NS but unmeasurable client-side until Stripe/affiliate webhooks. % new users at aha_moment → activation-only trap. Wishlist saves per AU → engagement, not value-creation. WAU → vanity (a user who opens & leaves counts).

**Reforge citation:** *Building Your Altitude Scorecard* L3 (Sean Klaus): "looking forward to a year from now, if I only had three or four metrics on my scorecard, and all those metrics have gone up, could I hang my hat on that and say that I've nailed it?" WRDCAL is that metric.

**Leading indicators (in order, by lead time):**
1. **D1 retention of new users** — leads WRDCAL by ~6 days
2. **First-session aha rate** — leads D1 by ~2 hours
3. **Affiliate CTR per redesign view** — leads click leg of WRDCAL real-time
4. **Reveal-gate unlock rate** — leads commerce intent (the funnel cliff)

---

## §B — Supporting metrics altitude map (scorecard)

| Altitude | Metric | Source | Target |
|---|---|---|---|
| **HIGH (NS)** | WRDCAL | `generation_completed` + `reveal_gate_unlocked` + `affiliate_click` + recurring `session_started` | Track week-over-week |
| HIGH | New-user activation rate | `aha_first_results` / `signup_started` (within 7d) | >40% |
| HIGH | D14 return rate | `session_started` 7-14d after / `signup_started` 14-28d ago | >25% |
| HIGH | 30-day Pro conversion | `pro_subscription_started` ≤30d / `signup_started` 30-60d ago | TBD post-launch |
| MID | Time-to-aha (median sec) | `aha_first_results.ts - signup_started.ts` | p50<120s, p90<300s |
| MID | Affiliate clicks/week-AU | `affiliate_click` count / WAU | >0.5 |
| MID | Reveal-gate unlock rate | `reveal_gate_unlocked` / `reveal_gate_shown` | >70% |
| MID | Pro paywall conversion | `paywall_converted` / `paywall_shown` | >5% |
| MID | Premium-quality upsell CTR | `premium_quality_upsell_clicked` / `_shown` | >10% |
| MID | Quiz completion rate | `quiz_completed` / `quiz_started` | >60% |
| MID | Redesigns/week-AU | `generation_completed` count / WAU | >1.5 |
| MID | Multi-room habit | `habit_second_room` / `aha_first_results` (within 14d) | >20% |
| MID | Wishlist save rate | `wishlist_added` / `aha_quality_signal` | >25% |
| MID | Lifecycle banner CTR | `lifecycle_banner_clicked` / `_shown` | >12% |
| MID | Push opt-in rate | `push_permission` granted / total | >30% |

LOW-altitude (debugging-only) metrics: photo-upload success, quiz drop-step, reshuffle/swap rate, FTC disclosure view, Style Pulse CTR, price-drop banner CTR, home-progress CTR, tier-reconcile mismatch, tutorial completion-vs-skip, share-channel mix, price-alert toggle, aha-quality signal mix.

---

## §C — Decisions auto-resolved per "approve all changes"

| # | Question | Resolution |
|---|----------|-----------|
| 1 | REC-13.1 Declare WRDCAL — ship now? | **SHIP.** Constant `FURNISH_NORTH_STAR` in `app.js`; `computeWRDCALProxy()` helper for per-user signal until backend lands. |
| 2 | REC-13.2 PostHog wiring — wait for backend? | **MODIFY: scaffold now, defer real key.** `trackEvent` dual-writes when `window.posthog` is present; PostHog SDK loaded behind a feature flag (`state.settings.analyticsConsent === true` AND a key present in `window.POSTHOG_PROJECT_KEY` injected at backend cutover). The plumbing ships; the project key remains TBD. |
| 3 | REC-13.3 Backfill 18 failure events — full? | **PARTIAL SHIP.** 6 highest-leverage: `signup_failed`, `analyze_failed`, `error_thrown` (window.onerror), `error_shown` (toast wrapper), `screen_viewed`, `dormancy_state_changed`. Remaining 12 deferred to a copy-pass + drop-step instrumentation batch (see DEFERRED.md). |
| 4 | REC-13.4 Stripe webhook events | **DEFER** to backend phase (already covered in DEFERRED.md). Client emits intent-only events. |
| 5 | REC-13.5 PRIVACY FIX (`fclick` PII) | **SHIP NOW.** Real bug. Generate opaque random fclickId via crypto.getRandomValues; persist in `state.affiliateClicks[].fclickId` + `affiliate_click` event. Raw UUID/email never enters URL. |
| 6 | REC-13.6 Altitude dashboard | **DEFER** real dashboard to PostHog wire-up. Ship per-user altitude scorecard helper (`window.FurnishAltitudeScorecard()`) that returns the metrics object computable from `state._events`. |
| 7 | REC-13.7 Cohort comparison conventions | **DOCUMENT.** Capture in this audit (§D below) + new constant `COHORT_DEFINITIONS` for in-code reference. |
| 8 | REC-13.8 `dormancy_state_changed` + lifecycle user property | **SHIP.** Emits in `touchLastVisit()` when bucket changes. `state.user.cachedLifecycle` carries the persisted attribute. |
| 9 | REC-13.9 Stop trusting client paywall_converted | **DOCUMENT** — rename plan deferred until Stripe lands (would break existing dashboards). Add `paywall_cta_clicked` as a parallel intent event; preserve `paywall_converted` (which is currently mocked) for existing call sites. |
| 10 | REC-13.10 `share_completed { channel }` consolidation | **SHIP additive.** Add new event firing alongside existing 5 (download/caption/invite/pinterest/system). 30-day dual-fire window per Reforge spec. |
| 11 | REC-13.11 Activation funnel materialized view | **DEFER** to PostHog wire-up. The events that compose the funnel (`signup_started`, `setup_complete`, `aha_first_results`, `habit_second_room`) all already fire. Funnel definition documented in §B above. |
| 12 | REC-13.12 `tSinceX` timing properties | **SHIP partial.** Add `tSinceSignup` to `setup_complete`; `tSinceSetupComplete` to `aha_first_results` / `AHA_RESULTS`; `tSinceAhaFirstResults` to `affiliate_click`. The state-machine to track these adds ~30 lines. |

---

## §D — Cohort definitions (canonical, in-code reference)

These cohorts live as comments + a `COHORT_DEFINITIONS` constant in `app.js`. PostHog cohort UI consumes the same definitions at backend cutover.

| ID | Name | Predicate (pseudo-SQL) | Use |
|---|---|---|---|
| D.1 | New users (this week) | `signup_started` in trailing 7d | Funnel denominator |
| D.2 | Activated users | `aha_first_results` within 7d of `signup_completed` | Retention denominator |
| D.3 | Habit-formed | activated + `session_started` 1-14d post-aha + ≥1 `wishlist_added` or `bookmark_added` within 14d | WRDCAL feeder cohort |
| D.4 | Free at-risk (low engagement) | `tier=free` + `daysSinceSignup ∈ [7,21]` + `generations_count<=1` + `wishlist_count=0` | Lifecycle email target |
| D.5 | Free with Pro intent | ≥3 `paywall_shown` + 0 `paywall_converted` | In-app discount target |
| D.6 | Pro (organic) | `tier=pro` + `grandfathered=false` | Paid retention curve |
| D.7 | Pro (grandfathered) | `tier=pro` + `grandfathered=true` | WTP-distortion baseline |
| D.8 | Dormant (30-90d no session) | last `session_started` ∈ [30,90]d ago | Resurrection campaign target |
| D.9 | Churned (90+d) | last `session_started` >90d ago | Seasonal resurrection |
| D.10 | Power affiliate clickers (top decile) | `affiliate_click` count NTILE 1 of 10 in trailing 30d | Concierge cohort |
| D.11 | Wishlist-heavy (≥10 saves) | ≥10 distinct `wishlist_added` | Price-watch frequency target |
| D.12 | Referrers | ≥1 `referral_link_copied` | PMF signal |
| D.13 | Referees | ≥1 `referral_signup_attributed` | Acquisition-quality cohort |
| D.14 | Multi-room habituals | ≥3 `generation_completed` distinct rooms | Habit-tail justifier |
| D.15 | Magic first session | `signup_started` + `aha_first_results` + `affiliate_click` all within 30 minutes | Test for activation-style hypothesis |

Per Reforge *Cohort Analysis* L4: every cohort comparison must lock **populations**, **starting point**, **behavior**, **time period**. The 4-line block from REC-13.7 is captured at the top of `COHORT_DEFINITIONS` for code-resident enforcement.

---

## §E — Auto-deferred items (DEFERRED.md additions)

1. **PostHog Cloud account + project key wiring** — UI/SDK plumbing ships; real key (`window.POSTHOG_PROJECT_KEY`) provisioned at Supabase auth backend cutover. Hassan signs up posthog.com (free 1M events/mo).
2. **Real PostHog dashboards (WRDCAL + activation funnel + cohort heat-maps)** — built in PostHog UI once events are flowing for ≥30 days.
3. **Stripe webhook server-side events** (`pro_subscription_renewed`, `_cancelled`, `_payment_failed`) — deferred to Stripe cutover.
4. **Affiliate-network attribution events** (`affiliate_attribution_received`) — deferred to weekly affiliate-network cron.
5. **`subscriptions` + `affiliate_clicks` Supabase tables** — already specced in DEFERRED.md.
6. **Server-side rate-limit + abuse events** (`rate_limit_hit`, `quota_tamper_suspected` retired) — deferred per existing anti-abuse item.
7. **Remaining 12 failure events** (capture_rejected, swap_cancelled, wishlist_removed, bookmark_removed, paywall_dismissed already done, reveal_gate_dismissed, share_system_failed, email_capture_failed, push_pre_prompt_dismissed, etc.) — copy-pass + drop-step instrumentation batch.
8. **REC-13.10 deprecation of 5 share-channel events** — after 30-day dual-fire confirms parity.
9. **Backend-fired `paywall_cta_clicked → pro_subscription_started` rename** — at Stripe cutover.

---

## §F — Privacy fix specification (REC-13.5 — SHIPS NOW)

**Bug:** `app.js:4873`:
```js
u.searchParams.set('fclick', `${state.user?.id || state.user?.email || 'guest'}-${Date.now().toString(36)}`);
```
This embeds the raw Supabase UUID OR raw email address as a query parameter on every outbound affiliate URL. The URL is sent to retailers (IKEA, Amazon, Wayfair, etc.) where it is logged. The URL also persists in the user's browser history, syncs across devices via Chrome/Safari sync, and may be captured in screenshots, screen recordings, and shared support transcripts.

**Threat surface:**
- Retailer-side analytics see Furnish's user identifiers by association with click events.
- Browser history sync replicates URLs across the user's logged-in devices.
- Affiliate-network reports may echo URL parameters back to ledger services.
- A leaked browser-history file or shared screenshot reveals the user's ID/email in plain text.

**Fix:** Generate an opaque random `fclickId` (16 hex chars from `crypto.getRandomValues`) per click. Persist `{fclickId, userId, itemId, source, timestamp}` in `state.affiliateClicks` so future affiliate-network reconciliation can join via the opaque ID without exposing identifying data. The URL never carries the UUID or email.

**Pre-backend behavior:** The fclickId persists in localStorage; matching against affiliate-network reports happens once backend lands and uploads the persisted records. No PII leaves the device for any user (Free, Pro, guest).

**Post-backend behavior:** Same scheme; the persisted records sync to Supabase; affiliate-network attribution joins on `fclickId` server-side.

**Reforge citation:** REC-13.5 explicitly. Also Reforge *Brand Marketing → Identity Governance*: "user-data hygiene as a brand asset." Per the Furnish OKT and VOICE.md (Concrete + Confident + Warm + Calm): a brand that promises calm cannot leak user data via URL parameters.

---

## §G — Implementation phase order

1. **Phase A — PRIVACY FIX** (REC-13.5). Highest urgency. Independent of other work.
2. **Phase B — `trackEvent` PostHog dual-write scaffold** (REC-13.2). Adds the plumbing for all subsequent measurement work.
3. **Phase C — Failure events + `screen_viewed` + `dormancy_state_changed`** (REC-13.3 + REC-13.8 partial). Highest-leverage funnel-debugging additions.
4. **Phase D — `share_completed` consolidation** (REC-13.10). Additive, dual-fire pattern.
5. **Phase E — `tSinceX` timing properties** (REC-13.12). State-machine + 5 events.
6. **Phase F — WRDCAL helper + cohort constants + altitude scorecard helper** (REC-13.1 + REC-13.7).
7. **Phase G — Sweep: fire key flows in preview, verify console output.**
8. **Phase H — IMPLEMENTATION_PROGRESS.md + DEFERRED.md + OPTIMIZATION_ROLLOUT_SUMMARY.md + commit.**

---

Now writing code. Privacy fix first.
