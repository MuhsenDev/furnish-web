# DEFERRED.md — Real-backend-phase items

Single source of truth for "what still needs real backend infrastructure before it can ship."

These items are explicitly out of scope for the current Model A migration. They were identified during STEP 1 of the Model A audit and called out by Hassan during STEP 2 approval. Implement when Stripe, real auth, and backend services are wired.

## Anti-abuse (real backend phase) — UPDATED for compute-quality routing

**Context (revised 2026-04-25):** the prior 2-lifetime quota was retired. Free users now get unlimited generations on the standard model (Flux Schnell). Pro users get the premium model (Flux Kontext Pro / Flux Depth Pro) at $5.99/mo.

**New problem:** without rate limiting, a single user could trigger thousands of standard-model generations in an hour and burn the compute budget — even though each call is cheap, the aggregate is not.

**Acceptable for now:** no client-side gate of any kind. Pre-launch with no real backend means no compute spend yet.

**Required at backend phase:**

1. **Server-side rate limiting per account + per IP** on the AI-call endpoint. Soft cap: ~30 generations/hour, ~200/day per account. Same-IP across multiple accounts compounds toward the IP cap. Returns 429 with a tasteful "We need a moment — try again in N minutes" message.

2. **Premium model rate limiting (Pro)** is more lenient but still capped to prevent runaway abuse: ~100/hour, ~500/day. Pro is paying, so the bar is higher.

3. **Account-creation rate limit per IP + per device.** Supabase Edge Function checks IP and device fingerprint at signup. Soft-block (CAPTCHA) on suspicious patterns: same IP creating >3 accounts in 24h, headless-browser signature, datacenter IP ranges.

4. **Manual fraud review queue.** Accounts flagged by patterns above get human review. Backend dashboard.

**Note:** The prior `detectQuotaTamper()` client-side log was removed during the compute-quality migration (no quota = no tamper). The `quota_tamper_suspected` analytics event is retired.

**Acceptance criteria for declaring this done:**
- A single account cannot trigger >200 standard-model generations/day (Pro: >500).
- A single IP cannot create >3 accounts/24h without CAPTCHA.
- Suspicious-pattern signups are queued for review, not auto-blocked.

---

## Compute model routing (real backend phase)

The future Replicate-backed AI generation backend reads `user_settings.is_pro` for every generation request and routes accordingly:

| Tier | Model | ~Cost/run | Use |
|---|---|---|---|
| Free (`is_pro=false`) | Flux Schnell | $0.005-0.01 | All Free generations (fresh photo + template) |
| Pro (`is_pro=true`) | Flux Kontext Pro / Flux Depth Pro | $0.05 | All Pro generations |

The client emits `generation_completed { actionId, tier }` analytics events that the backend can correlate with the actual model invocation for cost accounting.

**Backend cutover contract (locked):** the client's `routeGenerationByModelTier()` middleware passes the resolved tier into the action callback. When the real backend lands, the callback wraps the call in a fetch to the AI-generation endpoint with the tier as a parameter. No further client refactor required.

---

## First-redesign tutorial — server sync

The `state.user.firstRedesignTutorialSeen` flag controls the fire-once contract for the post-first-redesign coachmark tour (Styles → Color Moods → Budget). Currently localStorage-only. Survives in-session sign-in transitions because every `state.user = {...}` rebuild in `app.js` carries the flag forward via spread-preservation.

**Gap:** if a user completes the tutorial on Device A, then opens the app on Device B for the first time, the tutorial WILL re-fire on Device B because the flag isn't pulled from the server.

**Required at backend phase:**
1. Add `first_redesign_tutorial_seen boolean default false` column to `user_settings`.
2. In `supabase-client.pullAll()`, add: `if (typeof settings.first_redesign_tutorial_seen === 'boolean') state.user.firstRedesignTutorialSeen = settings.first_redesign_tutorial_seen;`
3. In `supabase-client.pushAll()`, add `first_redesign_tutorial_seen: !!state.user?.firstRedesignTutorialSeen` to the `user_settings` upsert.

This is a low-priority gap — the worst case is one redundant tutorial showing on a fresh device, not a security issue. Bundle with the next user_settings schema change.

---

## Stripe / billing

Currently the paywall CTA mocks `state.user.isPro = true` on click. Production requires:

1. **Stripe Checkout session creation** — backend endpoint creates session, returns URL. Frontend redirects.
2. **Stripe webhook handler** — Edge Function listens for `customer.subscription.{created,updated,deleted}` and `invoice.payment_succeeded`. Updates Supabase `subscriptions` table + `user_settings.is_pro` ONLY (no quota field — `generations_used` is now analytics-only and doesn't need to round-trip via webhook). On `subscription.deleted` (cancellation), the next time the affected user opens the app, `furnish:backend-ready` → `pullAll()` → `reconcileTierWithBackend()` will detect the diff and call the already-wired `handleDowngrade('server_reconcile')` — no extra client work needed.
3. **Customer portal** — for managing/canceling subscriptions. Stripe-hosted.
4. **Price ID configuration** — two SKUs in Stripe dashboard:
   - **Monthly**: `$5.99/month` recurring
   - **Annual**: `$47.88/year` ($3.99/mo billed annually, "Save 33%")
   The client UI already advertises these prices (see `app.js` `.pw-toggle-btn` handler + `index.html` `#paywallPrice`/`#paywallUnit`). Stripe price IDs replace the mock at cutover.
5. **Trial logic** — current paywall says "7-day free trial." Backend must respect trial state and not bill until day 7.
6. **Mid-flow upgrade resume** — after Stripe success redirect, look for `state._pendingProAction` and execute it. The stash is already populated by `analyzeBtn`, `startFromTemplate`, and the Pro-template gate (STEP 5 §16 row 2). The mock paywall CTA in `paywallCta` already replays it; the Stripe success handler can use the same code path.
7. **Grandfather migration** — at Stripe-cutover time, anyone with `state.user.isPro === true` already has `grandfathered: true` set by `grandfatherProUsers()` at boot (STEP 5 §16 row 1). Backend just needs to read that flag at signup-time and provision a 100% coupon Stripe customer (no charge, full Pro features).

**SQL needed (add to `SUPABASE_SETUP.md` when wiring):**

```sql
CREATE TABLE subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('trialing','active','canceled','past_due','incomplete')),
  plan TEXT NOT NULL CHECK (plan IN ('monthly','annual')),
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Real affiliate catalog

`window.FURNITURE_DB` in `furniture.js` currently has ~80 placeholder items with placeholder URLs (e.g. `https://www.ikea.com/`). Production requires:

1. **Affiliate program approvals** (1–7 day each):
   - Amazon Associates (tag = `furnish-20` placeholder)
   - IKEA via Awin or CJ
   - Wayfair via CJ
   - West Elm via Rakuten
   - Etsy direct
   - Rugs USA via ShareASale

2. **Catalog ingestion** — at minimum a CSV/JSON import script. Better: live API where allowed (Amazon Product Advertising API, Etsy API).

3. **Per-item affiliate URLs** with our tracking IDs baked in. The `buildAffiliateUrl()` helper added in Layer 5 of the Model A migration is ready — it just needs real `AFFILIATE_IDS` values.

4. **Stock / availability sync** — items go OOS frequently; needs daily refresh.

5. **Price refresh** — for the `wishlistMeta.priceAtSave` price-drop feature to work, current price needs to be reliable.

6. **Product images** — currently rendering emoji icons. Need real product photos.

---

## Email lifecycle

Per retention pass H3 + the second retention pass (Reforge Retention + Engagement frameworks). Welcome / mid-funnel / dormant / churned sequences. Requires:

1. **SMTP provider** — Resend, SendGrid, or Postmark.
2. **Supabase Edge Functions for triggers** — cron-style (`pg_cron`) for dormant detection.
3. **Email templates** — already specified as `LIFECYCLE_CAMPAIGNS` in `app.js`. The 8 campaigns (welcome_d1_check_prices, welcome_d3_next_room, welcome_d7_first_drop, mid_d14_price_watch, mid_d30_recap, dormant_d60_warm, dormant_d90_seasonal, churned_d180_refresh) are the backend contract — same keys, same copy, same predicates.
4. **Unsubscribe + preference center** — CAN-SPAM/GDPR compliance.
5. **Transactional emails** — Stripe receipts, password reset, email verification (currently uses Supabase default).
6. **Email-list-capture form** — already built in feature-gap pass C9; intent stored in `state.emailIntent`. Backend just needs to drain it into the email service on user signup or on a periodic flush.

**Backend cutover contract (locked):** The client-side `runLifecycleScheduler()` currently fires `lifecycle_would_fire` analytics events. When the backend lands, replace that event with a real send dispatch (or a queue insert). Triggers, predicates, and copy in `LIFECYCLE_CAMPAIGNS` stay unchanged — they are the source of truth. Backend reads the same constant via a shared config endpoint or a build-time bundle.

---

## Push notification delivery

Per retention pass H8 + Model A's price-drop alerts being a Pro feature. The pre-prompt UI is already built (`maybeAskForPushPermission`). Real delivery requires:

1. **Web Push setup** — VAPID keys, service worker registration (currently no `service-worker.js` file).
2. **Per-user push subscription storage** — Supabase table `push_subscriptions`.
3. **Native push for iOS/Android** — requires Capacitor wrap (already on the 7-item list in `CLAUDE.md`).
4. **Trigger pipeline** — price-drop detection + nightly cron + push send.
5. **Pro-only enforcement** — the soft-ask + permission grant is free, but the *delivery service* should only trigger pushes for Pro users (free users with the permission granted but Pro=false: ignored at send time, no fallback noise).

---

## SQL for `affiliate_clicks` table

Foundation for attribution reconciliation. Add to `SUPABASE_SETUP.md` when wiring:

```sql
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  item_id TEXT NOT NULL,
  item_name TEXT,
  source TEXT NOT NULL,
  price NUMERIC,
  surface TEXT NOT NULL CHECK (surface IN ('item_sheet','item_card_button','shop_all','price_tag','wishlist','cart')),
  room_id TEXT,
  fclick_id TEXT,
  user_agent TEXT,
  ip_country TEXT,
  clicked_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_affiliate_clicks_user ON affiliate_clicks(user_id, clicked_at);
CREATE INDEX idx_affiliate_clicks_item ON affiliate_clicks(item_id, clicked_at);
```

---

## Multi-room batch processing (Pro feature)

Listed as a Pro tier feature in Model A. Pre-backend, surfaced as "coming soon" in the paywall feature comparison.

Required for real implementation:

1. **AI generation pipeline that accepts batches** — Replicate API can accept multiple inputs but our cost model needs to confirm per-room billing.
2. **UI for selecting/uploading multiple rooms at once** — design pass needed.
3. **Coordination logic** — keeping styles consistent across rooms in a batch.
4. **Progress UI for long-running batches** — async job status.

---

## Style learning over time (Pro feature — advanced personalization)

Listed as a Pro tier feature. Pre-backend, surfaced as "coming soon."

Required:

1. **Behavioral signal capture** — already partially in place (swap, save, bookmark events). Need a vector representation per user.
2. **`profiles[].styleVector`** field — flagged in Model A audit as [PRO][NEW].
3. **Scoring weight injection in `pickItemsForRoom`** — items survive multiple redesigns get a boost; rejected items get suppressed.
4. **Backfill from existing user history** — when this ships, run a one-time migration over `state.events` to seed each user's vector.

---

## Pro feature backlog — items deferred until Pro entitlement ships

Items that exist in the data layer + DOM but are intentionally not surfaced to users yet. When Pro tier monetization wires up (Stripe webhook + `is_pro` flag-driven UI surfacing), these graduate from "hidden but preserved" to "Pro entitlement."

### Custom palette / hex color picker

**Status:** preserved in DOM (`index.html` `<details class="custom-color-details" hidden>`), inert JS handlers null-guarded so they don't error on click. `profile.customColors` field preserved on profile shape.

**Why deferred:** The 10-Q onboarding (approved 2026-04-26) replaced the multi-select color-mood chip grid with a single-select `color_appetite` question. The hex picker doesn't map to any of the 10 questions, but it's a real "I want exact accent control" power-user feature.

**To surface as Pro:** unhide the `<details>` block when `isPro()` is true, gate the "Add to Palette" handler through `gateProFeature('advanced_palette', fn)`, add a Pro feature paywall context if it isn't already covered by `advanced_personalization`. Wire to `pickItemsForRoom` color-anchor logic so the user's hex accents bias item selection.

### Q10 spatial-marking — tap-to-mark on uploaded photo

**Status:** Q10 followup ships text-only (`window.ONBOARDING_QUESTIONS[9].followup.mode === 'text'`). The config carries `mode: 'text'` with a comment that points to `'tap_to_mark'` as the future value.

**Why deferred:** quiz runs BEFORE capture in the current flow, so `state.draft.photo` doesn't exist at Q10 time. Reordering capture-before-quiz is a bigger change than the onboarding migration covers — it ripples into the D7 reveal-gate timing, the tutorial trigger logic, and the lifecycle-banner-on-home reflow.

**To enable spatial-marking:** either (a) reorder the flow to capture-first-quiz-second (large change, separate audit), or (b) add a quiz-result-then-capture-then-marker interstitial screen between `finishQuiz` and `prepareCapture`. Option (b) is lower-risk. The marker UI itself is a canvas/SVG overlay over `state.draft.photo` with click-to-place coordinates persisted as `{x, y, label}` on `profile.answers.dealbreaker.marker`.

### Supabase migration — `answers jsonb` column

**Status:** `profile.answers` lives in localStorage only. The `profileToRow`/`rowToProfile` mappers in `supabase-client.js` still write the legacy `styles, colors, custom_colors, budget` columns.

**To migrate:** add `answers jsonb default '{}'::jsonb` column to `profiles` table; update `profileToRow` to write `answers: p.answers || {}`; update `rowToProfile` to read `answers: r.answers || {}` and run `migrateLegacyProfileToAnswers(profile)` after deserializing. Legacy columns can stay during the transition window.

---

## User research plan (defer until launch user base exists)

Per Hassan's decision #5 in the retention pass: research the actual loops *after* there are real users to interview. Pre-launch interviews are speculative. The plan below is locked and ready to execute the moment we have ~50+ users with at least one Aha moment behind them.

### Sample design — 5 archetypes × 5–7 interviews

| Archetype | Recruit from | Why they matter |
|---|---|---|
| **Recent renovator** (finished a room project in last 6 months) | Reddit r/DesignMyRoom, r/HomeImprovement; Instagram tag #beforeandafter | Reveals real triggers and momentum-killers across the redesign journey |
| **Pinterest power user** (50+ saved boards, monthly+ active) | Pinterest creator community; Substack design newsletters | Validates wishlist-as-return-loop hypothesis |
| **Mid-project abandoner** (started a room, lost steam) | Furnish users with `state.draft` set + dormant >30 days | Reveals retention killers in the active phase |
| **Recent mover** (relocated <6 months ago) | Apartment List / Trulia retargeting lists; r/AskNYC moving threads | Captures the "forced redesign moment" use case |
| **60–90-day Furnish dormant** (signed up, did 1 redesign, didn't return) | `lifecycle_state = DORMANT` cohort filter on internal data | Highest leverage — these are the users who almost worked but didn't |

5 × 5 = **25 interviews minimum**, 5 × 7 = 35 maximum. Run as 45-minute remote sessions over 2-3 weeks. Pay $50-75 incentive per interview (Recent Mover and 60-90-day Dormant get $100 — harder to recruit).

### Interview guide — 5 questions, all about *why they'd come back*

1. **"Walk me through the last time you got home design inspiration. Where did you go? What did you do next?"** *(Reveals real triggers + the path between trigger and action — Reforge's natural-behavior interview pattern.)*
2. **"Tell me about a room project that lost momentum halfway. What killed it?"** *(Reveals retention killers without leading the witness.)*
3. **"If you used Furnish 6 months ago, what would make you open it again today?"** *(Direct natural-frequency probe. Listen for triggers, not features.)*
4. **"When you save something on Pinterest or Instagram, do you ever go back to it? When?"** *(Validates wishlist-as-return-loop. If they don't go back, the loop is fictional.)*
5. **"Have you ever bought furniture you regretted? What would have prevented it?"** *(Reveals trust gaps + opens the door to price-watch + alert opportunities.)*

### Don't ask

- **"Would you use Furnish weekly?"** — hypothetical questions produce useless data per Reforge's qualitative-research bonus material. Anything starting with "Would you…" gets dropped.
- **"What features would you like?"** — users name solutions, not problems. Stay on problem-discovery.

### Synthesis output

Per Reforge: produce a **Customer Retention Canvas per archetype** — Use Case, Problem, Persona, Why, Alternative, Frequency. Then compare across archetypes to validate (or revise) the natural-frequency call from the Retention pass.

Decision-gate: rebuild any of the five engagement loops whose archetype-grounded Trigger ≠ what we have today.

---

---

## Live room counter (Welcome screen Recommendation 6 — backend phase)

**Source:** Optimization Plan Dim 10 Recommendation 6, Batch 1 audit NC-4. Deferred per Hassan's lock 2026-04-26.

**Why deferred:** Requires Supabase aggregation that doesn't exist. Anonymous-readable count of `rooms` rows created in last 24h, cached for 5 min. Currently the Furnish state is localStorage-only with optional Supabase sync; placeholder credentials in `supabase-config.js`.

**Required at backend phase:**
1. `rooms` table aggregates across all users (already implied in CHANGES_APPLIED.md sync wiring).
2. Anonymous-readable count aggregation (security policy: `SELECT COUNT(*) FROM rooms WHERE created_at > now() - interval '24 hours'` permitted for `anon` role; no row data exposed, only the count).
3. Edge Function or a cached view that returns the count without exposing rows.
4. Client fetches at boot, falls back to "Real catalog · Real prices · Indie-built" (the static qualitative anchor) if count <10 OR if fetch fails.
5. 5-minute client-side cache (sessionStorage) so each session refreshes once.

**Cutover work when this lands:**
- Wire `fetchLiveRoomCount()` per Dim 10 Recommendation 6 code sketch.
- Replace welcome-proof line with conditional: `count >= 10 ? "{N} rooms designed today" : "Real catalog · Real prices · Indie-built"`.
- Add `live_count_displayed` analytics event.

---

## Referral redemption ledger (Conflict 2 lock — backend phase)

**Source:** CONFLICTS_RESOLVED.md Conflict 2. Locked 2026-04-26.

**Why deferred:** Locked referral mechanic is "5 HD redesigns + 2 style packs over 90 days" for both inviter and invitee. Currently the share modal copy advertises this currency, but redemption tracking requires server-side balance state.

**Required at backend phase:**
1. Supabase table `referral_credits`:
   ```sql
   CREATE TABLE referral_credits (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     credit_type TEXT NOT NULL CHECK (credit_type IN ('hd_redesign','style_pack')),
     remaining INTEGER NOT NULL DEFAULT 0,
     earned_at TIMESTAMPTZ DEFAULT now(),
     expires_at TIMESTAMPTZ NOT NULL,  -- earned_at + 90 days
     source_referral_id UUID,  -- pointer to the referral that issued this credit
     consumed_at TIMESTAMPTZ
   );
   ```
2. On signup-with-referral: issue 5 hd_redesign + 2 style_pack credits to BOTH users (inviter and invitee). expires_at = now() + 90 days.
3. On HD-export attempt: decrement an `hd_redesign` credit (if user has one) before falling back to "subscribe to Pro" paywall.
4. On style-pack download: same decrement pattern with `style_pack`.
5. Daily cron expires credits past expires_at.
6. Frontend reads remaining-credits at boot via supabase pull; surfaces in profile card ("3 HD redesigns left, 2 style packs left, expires {date}").

**Anti-abuse:** referral credits cannot exceed 50 per inviter per 90-day window (caps farming). Per `DEFERRED.md` anti-abuse rate-limiting (~3 accounts/24h per IP) covers most fraud paths.

**Cutover work when this lands:**
- Wire `redeemReferralCredit(creditType)` helper in `app.js`.
- Update share modal copy: when user has issued referrals, show "{N} of your friends signed up" (real count only, no fake numbers).
- New analytics events: `referral_credit_issued`, `referral_credit_redeemed`, `referral_credit_expired`.

---

## Email-only cohort (Conflict 5 — pending decision, backend phase)

**Source:** CONFLICTS_RESOLVED.md Conflict 5 (PENDING). Soft email-capture lane on D7 reveal-gate is proposed but undecided.

**Why deferred:** If approved in the D7-reveal-gate batch, email-only users (no full signup) become a separate cohort with limited-preview access and email-driven re-engagement. Backend dependency: magic-link auth flow OR email-as-identifier without password.

**Required at backend phase (only if Conflict 5 approved):**
- Magic-link auth via Supabase email-OTP (no password).
- New `state.user.recoveryEmail` field; resolves to existing `state.emailIntent` plumbing.
- Lifecycle email template variant: "guest-email-only" sequence (different from full-signup welcome).
- Cohort definition: `lifecycle_email_only` = email saved, no full provider signin.

**Status:** Spec'd, not implemented. Reconcile with main email-lifecycle item (item 6 above).

---

---

## Haptic feedback table (ship day-1 with Capacitor wrap)

**Source:** Optimization Plan Dim 11 Section B + Recommendation D.7. Locked Batch 2 2026-04-26.

**Why deferred:** Web `navigator.vibrate()` is silently ignored on iOS Safari; cross-platform haptics require the Capacitor wrap (item 4 above). Until then, all haptic moments below are "designed but not shipped."

**Cross-platform consistency rule:** ship the native haptic via Capacitor or do not ship it at all. Do NOT ship a half-broken Android-only `navigator.vibrate()` implementation that creates unequal experiences across iOS and Android. Per Reforge Decision Architecture p.20: high-impact, irreversible UX-consistency decision — wait for Capacitor and ship the whole table at once.

**Required at Capacitor cutover (item 4):**

| Moment | Native haptic | Notes |
|---|---|---|
| Quiz answer tap | light tap (10ms) | Per-step confirmation |
| Quiz step transition | none | Visual only |
| Quiz finale: rain peak (~2.8s in) | medium impact | Co-occurs with peak frame |
| Quiz finale: theme flicker | tiny ticks per flicker (3x) | Layered with sparkle audio if enabled |
| Quiz finale: congrats reveal | success (notification.success) | End beat |
| Photo capture | light tap on shutter | Camera UI hint |
| Photo upload complete | light tap | Confirms receipt |
| Analyzing → step transition | tiny tick on each step complete | Reinforces story-driven progress (D.1) |
| **Reveal screen open** | success haptic | THE peak moment |
| Reveal: price tags ripple-in | none | Would fight the staggered visual cadence |
| Slider drag | none | Continuous = no haptic |
| Slider snap to 0/50/100 | tiny tick at the snap | Confirms snap |
| Lighting chip switch | light tap | Confirms state change |
| Wishlist save (heart fill) | light tap | Optional ding audio if enabled |
| Bookmark room | light tap | Confirms save |
| Affiliate shop tap | light tap | Confirms intent before OS handoff |
| Affiliate URL opens (new tab) | none | OS handles |
| Paywall open | none | Don't pre-bias the decision |
| Paywall conversion success | success haptic | Revenue moment — let the user feel it |
| Paywall dismiss | none | |
| Push pre-prompt slide-in | none | |
| Push pre-prompt accept | success haptic | |
| Push pre-prompt dismiss | none | |
| Toast (success) | light tap | |
| Toast (error) | light error haptic | |
| Modal open (item sheet, etc.) | none | |
| Modal close | none | |
| Pull-to-refresh trigger | medium impact at trigger threshold | |
| Reach Pro page | none | |
| First-aha coachmark appears | light tap | Per D.6, lands at 3500ms post-reveal |
| Different Style? pivot complete | light tap | Confirms re-pick (Batch 1 IDX-13) |

**Design principle (Reforge-grounded):** Per *Constrained Divergence* p.13, only invest in delight when it materially differentiates. Every haptic above earns its place by either (a) confirming a state change the user can't easily see (slider snap, paywall conversion), or (b) marking a peak moment (reveal, finale, conversion success). Random taps on every interaction = annoyance, not delight.

**Implementation approach when item 4 lands:**
1. Wrap Capacitor's `Haptics` plugin in a `FurnishHaptics` adapter so call sites are platform-agnostic.
2. Gate all haptic calls behind a Settings toggle `state.settings.hapticsEnabled` (default `true` on capable devices, `false` on web).
3. Test on iOS + Android side-by-side at Capacitor wrap time — feel must match.
4. Add analytics: `haptic_fired { moment, intensity }` so post-launch we can see which moments correlate with retention.

---

## Stripe Lifetime price-ID + Lifetime decoy activation (Batch 5 — backend phase)

**Source:** OPTIMIZATION_PLAN.md Dim 06 Section B.2 + Section E.5. Locked Batch 5 2026-04-26.

**Why deferred:** The Lifetime $99 toggle ships in Batch 5 as a 3rd toggle button (decoy per Economist 3-tier study). Pre-Stripe, selecting Lifetime mocks the same Pro flag (`grandfatherProUsers()` covers cutover) — but a real Stripe Lifetime price-ID is required to actually charge users at cutover.

**Required at backend phase:**
1. Add `Lifetime` SKU in Stripe dashboard: `$99` one-time charge (no recurring billing).
2. Update `subscriptions` table CHECK constraint: `plan TEXT NOT NULL CHECK (plan IN ('monthly','annual','lifetime'))`.
3. Lifetime users get `current_period_end = NULL` (no expiry); webhook on `payment_intent.succeeded` provisions Pro forever.
4. Refunds: Stripe customer portal; backend cancels `is_pro` on refund.
5. Anti-abuse: rate-limit Lifetime to 1 per `stripe_customer_id` per IP per 30d (cards-shared scenario).
6. Compute-cost analysis: at Pro $0.05/run × 200 lifetime runs = $10 cost vs $99 revenue, comfortable margin. Confirm post-launch with real run-rate data.

**Cutover work when this lands:**
- Replace mock Pro flag in `paywallCta` handler with a Stripe Checkout session create + redirect.
- Read `state._paywallSelectedPlan` (already set by toggle handler — `'monthly' | 'annual' | 'lifetime'`) to pick the Stripe price ID.
- Founding-member cap counter (`#paywallFoundingSpots`) wires to a real Supabase query on convertible users.

---

## Paywall analytics dashboard (Batch 5 — backend phase)

**Source:** OPTIMIZATION_PLAN.md Dim 06 Section E.7 + Section E.8. Locked Batch 5 2026-04-26.

**Why deferred:** `paywall_shown { context, layout }`, `paywall_dismissed { context, dismissReason, shown_for_ms }`, `paywall_converted { triggeringContext }`, `paywall_value_moment_shown { triggerKind }`, `paywall_plan_selected { plan }`, `power_free_signal_shown / clicked / dismissed` all fire client-side in Batch 5. Aggregate dashboard awaits real analytics destination.

**Required at backend phase:**
1. **Per-context conversion funnel:** `paywall_converted_rate = paywall_converted / paywall_shown` segmented by `context` (post 8→3 layout consolidation: A_quality / B_power / C_save). The 3 layouts have different intrinsic conversion rates and tracking the wrong aggregate hides the insight.
2. **Dismiss-reason segmentation:** by `dismissReason ∈ {close, maybe_later, backdrop, escape}` and by `shown_for_ms` bucket (<2s = bounce, 2–15s = read-and-rejected, >15s = considered-and-rejected).
3. **Plan selection mix:** `paywall_plan_selected` distribution → reveals whether Lifetime decoy is doing its job (anchor effect on Annual selection rate).
4. **Pre-convert behavior:** `paywall_converted_path { context, gens_at_paywall, days_since_signup, affiliate_clicks_pre_convert }` — segment converters. Tells whether high-converting cohort = "saw paywall on day 1" or "saw paywall after 5 redesigns + 3 saves."
5. **Power-Free signal CTR:** `power_free_signal_clicked / power_free_signal_shown` ratio. Target ~5–10% click-through per Conflict 6 spec.

**Cutover work when this lands:**
- Pipe events to PostHog or equivalent.
- Build dashboard queries with the segmentations above.
- A/B test infrastructure for per-context paywall variants.

---

## Designer Connect — higher-ARPC future tier (Batch 5 — defer until 1,000+ Pro users)

**Source:** OPTIMIZATION_PLAN.md Dim 06 Section F.2 + Section F.3 entry. Locked Batch 5 2026-04-26.

**Why deferred:** Per Reforge *Strategies for Existing Healthy Customers* (Module 06.04 — Move to higher-ARPC use case), Furnish currently has Pro as the revenue ceiling. Designer Connect ($19/mo) would connect Pro users to a real interior designer (15–30 min consult per quarter) — the canonical "same persona, higher willingness to pay, additional service layer" expansion path.

**Why we wait:** Requires designer recruitment, scheduling tools, payments-to-designer flow, quality control. XL effort. Per Reforge: defer until 1,000+ Pro users so the marketplace has real demand to satisfy real supply.

**Required when this lands:**
1. Designer onboarding (recruit, vet, contract).
2. Scheduling (Calendly-class).
3. Payments split (Stripe Connect or equivalent).
4. Quality control (review system, rebooking flow, dispute process).
5. New Pro tier in the paywall toggle: `Pro / Pro+Concierge`.

**Expected impact when shipped:** ~3–7% of Pro users would upgrade (high-LTV cohort). Triples ARPU for that segment. ~$228/yr × 50 users = +$11.4k MRR upside at first thousand Pro users.

---

## Quantitative price-drop loss banner on wishlist (Batch 5 Part 2 — backend phase)

**Source:** OPTIMIZATION_PLAN.md Dim 02 D02-1. Modified per Conflict 4 lock.

**Why deferred:** Original Reforge proposal copy used fake numbers ("Pro members got 3 price-drop pings on your saved items in the last 30 days. You missed them. Walnut bookshelf dropped 22% on Apr 8 — saved by 142 Pro users that day"). VIOLATES the Conflict 4 permanent rule (no fake numbers, ever).

**What ships in Batch 5 Part 2:** nothing on wishlist for this entry. Today's wishlist UI keeps its current copy. Pre-launch we cannot honestly cite price-drop history.

**Required at backend phase:**
1. Real price-history data on top 50–100 catalog items (aggregate from retailer affiliate APIs).
2. Per-user "missed pings" counter — count of price drops on that user's saved items while they were dormant or on Free tier.
3. Sticky banner above wishlist when `state.user._missedPings >= 3` AND `daysSinceFirstSave >= 7`.
4. Copy template: "You've saved {N} pieces. Pro alerts pushed {M} drops on your saved items in the last 30 days." All numbers MUST be real or this defers further.

**Cutover work when this lands:**
- Wire `renderWishlistMissedPingsBanner()` into the wishlist render flow.
- New analytics: `wishlist_missed_pings_shown { N, M, daysSinceFirstSave }`, `_clicked`, `_dismissed`.

---

## Style-profile DNA SVG fingerprint generator (Batch 5 Part 2 — polish phase)

**Source:** OPTIMIZATION_PLAN.md Dim 02 D02-5. Modified per L-effort + conservative-bias.

**Why deferred:** Original proposal called for a deterministic generative SVG fingerprint that visually represents the user's style profile (style hash → unique pattern). L-effort animation + UI polish; the % gauge alone delivers the bulk of the endowment psychology lift.

**What ships in Batch 5 Part 2:** the % gauge + identity summary text. The deterministic SVG fingerprint is deferred.

**Required when this lands:**
1. Deterministic SVG generator: takes `profile.answers` as input (or a hash thereof), outputs a unique SVG visual asset (e.g., circular pattern of color blobs + line accents tied to vibe + materials).
2. Animation: smooth transition when the user updates a preference and the SVG re-generates.
3. Sharing: enable "share my style fingerprint" alongside redesigns (UGC content-loop angle).

---

## Weekly template release cadence + drop badge (Batch 5 Part 2 — content-ops decision)

**Source:** OPTIMIZATION_PLAN.md Dim 02 D02-9. Conservative-bias call.

**Why deferred:** "12 new templates this week. The Modern Coastal pack drops Friday at 9am ET" requires Hassan to actually publish weekly templates. Without real cadence, the badge becomes a credibility leak the first time a user notices the same templates two Fridays in a row. This is an operational decision, not a code decision.

**Required when this lands:**
1. Hassan's commit to a weekly template release cadence (or biweekly / monthly — whatever is sustainable).
2. Editorial pipeline for new template authoring + promotion.
3. Push pre-prompt copy variant for "🔔 Notify me when {NextDropName} drops Friday."
4. Real `templates_release_calendar` config (manifest of upcoming drops).

**Cutover work when this lands:**
- Render scarcity badge at top of Templates browse with real next-drop date.
- Wire the push pre-prompt to the calendar.
- New analytics: `template_drop_notify_subscribed`, `template_drop_pushed`, `template_drop_clicked`.

---

## Style-twin matching (Batch 5 Part 2 — backend + content phase)

**Source:** OPTIMIZATION_PLAN.md Dim 02 D02-B1 (bonus entry). Conservative-bias call.

**Why deferred:** Requires Supabase aggregation (cohort clustering on real user style scores) AND content curation (curated wishlist preview per cohort). Hardcoding 4-6 archetypal cohorts works as a placeholder but the curation effort is non-trivial.

**Required when this lands:**
1. Backend cohort assignment based on `profile.styleScores` (Batch 4 data structure).
2. Per-cohort curated wishlist preview content (hand-curated, ~10–15 items per cohort × 4–6 cohorts).
3. UI: "Your style twins also saved →" strip on wishlist + reveal screen.
4. Cohort-size analytics aggregated server-side (real numbers only — no fake counts per Conflict 4).

---

## "Premium-quality redesigns persist after downgrade" promise (Batch 5 Part 2 — server contract)

**Source:** OPTIMIZATION_PLAN.md Dim 02 D02-3. Modified per conservative-bias.

**Why deferred:** Original proposal promised "every redesign you generated as Pro (locked at premium quality), your full wishlist, all price-drop alerts you've already received" persist after downgrade. The wishlist + saved rooms claim is currently true (localStorage). The premium-quality-render persistence is a future server contract — not shippable today.

**What ships in Batch 5 Part 2:** the truthful subset only — "If you ever cancel Pro, your saved rooms and wishlist stay yours." Located on the Free card via `FREE_PLAN_CARD.cancelSafety`.

**Required when this lands:**
1. Server contract: when a user downgrades from Pro → Free, all rooms generated under Pro tier remain accessible via their stored URL (don't delete the asset).
2. Storage cost: keep premium-tier renders forever (small cost, large psychological return).
3. Update `FREE_PLAN_CARD.cancelSafety` to the full version: "If you ever cancel Pro, you keep: every saved room, every redesign you generated as Pro (locked at premium quality), your full wishlist, all price-drop alerts you've already received."

---

## Full 4S copy audit (~30 edits) (Batch 5 Part 2 — copy-pass batch)

**Source:** OPTIMIZATION_PLAN.md Dim 02 cross-cutting Section B. Partial ship in Batch 5 Part 2.

**Why deferred:** The Reforge 4S audit (Selfish / Sensory / Specific / Simple) flagged ~30 specific copy edits across the app. Highest-impact 3 shipped in Batch 5 Part 2 (welcome hero possessive; paywall premium_quality 4/4 rewrite; items section "Your Picks"). Remaining ~27 deferred to a copy-pass batch to avoid scope creep + ensure coherent voice review.

**Required when this lands:**
1. Pass through every user-facing string in `index.html`, `app.js` template literals, and toast messages.
2. Score each against the 4S rubric.
3. Edit any string scoring ≤2/4 to 4/4.
4. Run a VOICE.md compliance check post-edit.
5. Estimated combined impact: +3-7% across the funnel (additive across surfaces).

---

## Quantitative social-proof at decision moments (Batch 5 Part 2 — backend phase)

**Source:** OPTIMIZATION_PLAN.md Dim 02 D02-6 + D02-7. Modified per Conflict 4 lock.

**Why deferred:** Reforge proposed quantitative social proof at reveal moment, items list cards, wishlist, and paywall ("1,847 people designed a Modern bedroom this week", "Saved by 142", "Sarah K canceled Modsy"). All require real numbers OR real testimonials. VIOLATES Conflict 4 (no fake numbers).

**What ships in Batch 5 Part 2:** the qualitative cohort line on the lifecycle banner ("Fellow {styleNames} fans are designing too.") — no numbers.

**Required when this lands:**
1. Backend save-counts per item via Supabase aggregation.
2. Real cohort sizing (members in each style cluster).
3. Real beta-user testimonials with verifiable identity (with permission to publish).
4. Per-surface insertion logic with the qualifier "minimum N=10 for the count to display" (avoids ridiculous numbers like "1 person designed this room this week").

---

## PostHog Cloud project + dashboards (Batch 6 — backend phase)

**Source:** OPTIMIZATION_PLAN.md Dim 13 REC-13.2. Locked Batch 6 2026-04-26.

**Why deferred:** Batch 6 ships the dual-write SDK plumbing (`trackEvent` fans out to `window.posthog.capture` when present; identify/reset/setUserProperty hooks wired). Real PostHog project key + SDK script tag + dashboards are a one-time setup that requires a PostHog account.

**Required at backend phase:**
1. Sign up posthog.com (EU data residency option; free 1M events/mo).
2. Inject project key into `index.html`:
   ```html
   <script>
     !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){...});
     posthog.init('phc_REAL_PROJECT_KEY', { api_host: 'https://eu.posthog.com' });
   </script>
   ```
3. Verify ≥30 days of dual-write parity vs `state._events` buffer.
4. Build dashboards:
   - **WRDCAL weekly trend** (single number + sparkline)
   - **Activation funnel:** `signup_started → setup_complete → aha_first_results → habit_second_room`
   - **Paywall conversion by context** (post 8→3 layout consolidation)
   - **Cohort heat-maps** for D1-D15 (per `COHORT_DEFINITIONS` in `app.js`)
   - **Power-Free signal funnel** (`power_free_signal_shown / clicked / dismissed`)
   - **Share funnel by channel** (`share_completed { channel }` distribution)
5. Add `funnel.activation` saved insight per REC-13.11.
6. Add per-context paywall conversion saved insights per REC-13.7.

**Cutover work when this lands:**
- Open `OPTIMIZATION_ROLLOUT_SUMMARY.md` § "Cumulative event taxonomy" — every listed event is the contract PostHog will receive.
- Bookmark `optimization/dashboard.html` (or PostHog dashboard URL) — open every Monday before any other action.

---

## Server-side fired events (Batch 6 — backend phase)

**Source:** OPTIMIZATION_PLAN.md Dim 13 REC-13.4 + REC-13.9. Locked Batch 6 2026-04-26.

**Why deferred:** Per Reforge *Instrumentation Best Practices*: "track 100% of revenue data from the back end." Client cannot be trusted with monetization truth (ad-blockers eat 10-30%; malicious clients can fake events).

**Required at backend phase:**
1. Stripe webhooks fire server-side events:
   - `pro_subscription_started { plan, source, triggeringContext }` (replaces client mock)
   - `pro_subscription_renewed { plan, tenureD }`
   - `pro_subscription_cancelled { plan, tenureD, reason }`
   - `pro_subscription_payment_failed { plan, tenureD, attempt }`
2. Affiliate-network reconciliation cron fires:
   - `affiliate_attribution_received { userId, itemId, commission, network, fclickId }`
   - Joins on `state.affiliateClicks[].fclickId` synced to Supabase `affiliate_clicks` table.
3. Server-side rate-limit triggers fire:
   - `rate_limit_hit { userId, tier, endpoint, cap }`
4. Server-side push delivery fires:
   - `push_received { userId, campaignId }`
   - `price_drop_detected { itemId, userId, oldPrice, newPrice, dropPct }`
5. Rename: client `paywall_converted` → `paywall_cta_clicked` (intent only); backend webhook becomes the success event.

**Anti-fraud:** All revenue dashboards numerator from backend; denominator from client `paywall_shown` is fine.

---

## Remaining 12 failure events (Batch 6 — copy-pass + drop-step instrumentation batch)

**Source:** OPTIMIZATION_PLAN.md Dim 13 REC-13.3. Partial-shipped Batch 6 (6 of 18); rest deferred.

**Already shipped Batch 6:** `signup_failed`, `signin_failed`, `analyze_failed`, `error_thrown`, `error_shown`, `share_system_failed`. Batch 5 already shipped `paywall_dismissed`. The `quiz_skipped` event from the 10-Q migration covers part of the gap.

**Required when this lands** (per Reforge Building A Structured Event Dictionary):
1. `capture_rejected { method, reason }` — wire into capture validation failure paths (file too large, wrong type, decode error).
2. `swap_cancelled { roomId, itemId, reason }` — wire into swap-flow back-out path.
3. `wishlist_removed { itemId, tenureD }` — heart-toggle off.
4. `bookmark_removed { roomId, tenureD }` — bookmark-toggle off.
5. `reveal_gate_dismissed { roomId, source }` — user closes gate without unlocking (currently no signal).
6. `email_capture_failed { source, reason }` — invalid email entered into soft-capture lane.
7. `push_pre_prompt_dismissed { triggeringContext }` — pre-prompt rejected.
8. `tier_reconcile_mismatch_detected { cachedTier, serverTier }` — already-existing event, but rename to flag the failure semantics.
9. `quiz_back_clicked { fromStep, toStep }` — back navigation in quiz (intent, but flags drop intent).
10. `analyze_started { tier, actionId, roomId, method }` — paired with analyze_completed/failed for per-step funnel.
11. `analyze_progress { roomId, progressPct }` — ~25% increments for diagnostic depth.
12. `screen_dwell { screenName, durationMs }` — derived from `screen_viewed.prevDwellMs` if needed as discrete event.

**Effort:** L (~1 day to wire all 12). Bundle with the §3 "drop-step instrumentation" batch.

---

## Share-channel event deprecation (Batch 6 — after 30-day dual-fire)

**Source:** OPTIMIZATION_PLAN.md Dim 13 REC-13.10. Dual-fire shipped Batch 6.

**Why deferred:** Batch 6 added `share_completed { channel }` alongside the 5 existing channel-specific events (`share_download`, `share_caption_copied`, `share_invite_link_copied`, `share_pinterest_clicked`, `share_system_success`). The 30-day dual-fire window per Reforge spec validates parity before deprecation.

**Required at deprecation:**
1. Confirm PostHog dashboards using the legacy 5 events match dashboards using `share_completed`.
2. Rewrite all dashboards to use `share_completed` filtered by `channel` property.
3. Remove the 5 legacy `trackEvent('share_*', ...)` call sites in app.js.
4. Update analytics docs.

---

## Last review

Updated: 2026-04-26 during Batch 6 implementation (Dim 13 Data Instrumentation — FINAL PASS 6/6).
- Added: PostHog Cloud project + dashboards (REC-13.2).
- Added: Server-side fired events (REC-13.4 + REC-13.9 — Stripe webhooks + affiliate reconciliation).
- Added: Remaining 12 failure events (REC-13.3 — copy-pass + drop-step batch).
- Added: Share-channel event deprecation (REC-13.10 — post 30-day dual-fire).
- **PRIVACY FIX shipped Batch 6** (REC-13.5) — `affiliate_click.fclick` now uses opaque random 16-char hex IDs instead of raw UUID/email. No PII in affiliate URLs.
- **Optimization rollout COMPLETE** — see `OPTIMIZATION_ROLLOUT_SUMMARY.md`.

Updated: 2026-04-26 during Batch 5 Part 2 implementation (Dim 02 User Psychology).
- Added: Quantitative price-drop loss banner (D02-1, fake-numbers blocker).
- Added: Style-DNA SVG fingerprint generator (D02-5, L-effort polish).
- Added: Weekly template release cadence + drop badge (D02-9, ops decision).
- Added: Style-twin matching (D02-B1, backend + content).
- Added: "Premium-quality renders persist after downgrade" server contract (D02-3, conservative-bias deferral of part of the promise).
- Added: Full 4S copy audit (~27 remaining edits, copy-pass batch).
- Added: Quantitative social-proof at decision moments (D02-6/-7, fake-numbers blocker until backend supplies real counts).
- All decisions in this Part 2 honor Conflict 4 (no fake numbers, ever).

Updated: 2026-04-26 during Batch 5 implementation (Dim 06 Monetization).
- Added: Stripe Lifetime price-ID + activation (Section B.2 / E.5).
- Added: Paywall analytics dashboard (Section E.7 / E.8 + Conflict 6 instrumentation).
- Added: Designer Connect higher-ARPC tier (Section F.2 / F.3).
- Conflict 6 (gen-50 power-Free signal) LOCKED. The signal ships client-side in Batch 5; backend cutover replaces the localStorage ring buffer with a server-side counter so the signal survives device wipes / multi-device gaming.

Updated: 2026-04-26 during Batch 4 implementation (Dim 05 Retention + Dim 07 Personalization + Dim 08 Social).
- **Public room pages + OG metadata** (new — was proposed in Batch 1 NC-5 list, promoted to canonical Batch 4): server-rendered `/r/<roomId>` pages with full Open Graph metadata so iMessage/WhatsApp/Slack link previews show the room photo. Required for group-chat share virality (Reforge UGC Lesson 4 third execution factor — "transition the habit of content discovery to your own product"). Also unblocks the embed widget. Architecture: Edge Function or Next.js-equivalent SSR; OG image at `/og/<roomId>.jpg` 1200×630 generated from the same canvas pipeline used for in-app shares.
- **Embed widget** (new): `<iframe src="https://furnish.app/embed/<roomId>">` for blogs. Depends on public room URLs. Per Reforge UGC Loop Variations Lesson 5 embed-loop subtype: cumulative returns over years (Drift, Wistia, SoundCloud pattern). Renderer is small once public-room infra exists.
- **Social-graph backend** (new — NEW DEFERRED ITEM): `state.user._followingUserIds[]` is captured client-side as a stub in Batch 4. Real social graph requires: a `follows` table in Supabase, public profile pages at `/u/<userId>`, follow/unfollow API endpoints, a "Friends' rooms this week" feed query. Per Reforge Personal Viral Loops Lesson 2: highest-max-scope viral mechanic. Joint utility = both follower and followed user gain when they share design inspiration.
- **Push delivery thin-cadence rule**: `pushDeliveryTierForUser()` returns `'free_thin'` or `'pro_full'`. Backend filter at send time should honor this flag — Free users receive top 1-2 highest-impact price drops per month max; Pro users receive all real-time. Per Reforge Frequency Strategy Step 4 (Moderate): promised cadence must match delivered cadence, otherwise users perceive broken/spammy push.
- **Wishlist age recall** (new lifecycle campaign `wishlist_age_d90_recall`): predicate ships in `LIFECYCLE_CAMPAIGNS` with `oldestWishlistAgeDays() >= 90`. Backend email service drains the campaign at cutover (DEFERRED.md item 6).
- **Cross-device personalization sync**: `profile.styleScores`, `profile.ahaHistory`, `state.user._sessionsByHour`, `state.user._sessionsByDow` all need to be added to the Supabase `user_settings` / `profiles` row schema and pull/push wiring in `supabase-client.js`. Bundle with the next user_settings schema change.
- **K-factor server-side referral attribution**: `referral_link_clicked`, `referral_signup_completed`, `referral_aha_completed`, `referral_paid_conversion` events must fire server-side at signup and tier-change time. Client-side share funnel (`share_funnel_modal_opened`, `share_funnel_format_selected`) ships in Batch 4.

Updated: 2026-04-26 during Batch 3 implementation (Dim 04 Activation + Dim 12 Onboarding + Dim 03 Conversion).
- Email lifecycle (item 6) gets new sub-item: drain `state.user.recoveryEmail` (set by soft-capture lane on signin) into the email service on backend cutover. Send a magic-link email to the recovered email so the user can resume their saved redesign without full signup. Dovetails with the email-only cohort spec already documented.
- Push pre-prompt timing change deferred to push infrastructure (item 7): the audit spec'd moving the prompt from post-first-save to pre-first-save (Variant A) or reveal-screen (Variant B). Variant B preferred per Reforge PNIP Pyramid manufactured-trigger alignment with the organic intent moment. Implement when Capacitor wrap lands.
- Tutorial server sync (item 3): semantics expanded — `firstRedesignTutorialSeen` flag is now set by the **session-2 home arrival** trigger (Conflict 7 lock). Cross-device sync requirements unchanged.

Updated: 2026-04-26 during Batch 2 implementation (Dim 01 Visual Design + Dim 11 Performance & Feel).
- Added: Haptic feedback table for day-1 Capacitor cutover (D.7).

Updated: 2026-04-26 during Batch 1 implementation (Dim 09 + Dim 10 + Dim 14).
- Added: Live room counter (Dim 10 #6 deferred per NC-4)
- Added: Referral redemption ledger (Conflict 2 lock)
- Added: Email-only cohort spec (Conflict 5 placeholder, pending decision)

Updated: 2026-04-25 during Compute-Quality Routing migration (STEP 3 Layer 11).

When any of these items moves to "in progress," delete its section from this file and update `CHANGES_APPLIED.md` accordingly.
