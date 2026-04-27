# OPTIMIZATION_ROLLOUT_SUMMARY.md

**Status:** ✅ COMPLETE — All 14 dimensions of the Reforge-grounded optimization plan shipped across 6 batches (April 26, 2026).
**Repo:** `C:\Users\Hassan\Downloads\Claude\Here`
**Total execution time:** ~16h across 6 batches.
**Total commits:** 6 (one per batch + one Part-2 mid-Batch-5 split).
**All 9 conflicts:** LOCKED. The decision ledger is closed.
**Critical bugs fixed:** 1 (PII leak in affiliate URL — Batch 6).

---

## The 6 batches

| # | Batch | Dimensions | Commit | Lines | Highlights |
|---|-------|-----------|--------|-------|-----------|
| 1 | Trust + Copy + Edge Cases | Dim 09 + Dim 10 + Dim 14 | `28d4b5b` | +~700 / -~30 | Locked OKT ("Your household, your style, sharper"); 4 personality words (Concrete/Confident/Warm/Calm); Conflicts 1-5, 9 LOCKED; VOICE.md authored; affiliate disclosure rewrite; ~30 user-facing copy edits; APP-1 through APP-22 + IDX-1 through IDX-14 + CSS-1 through CSS-3 |
| 2 | Visual Design + Performance & Feel | Dim 01 + Dim 11 | `4fd4196` | +~600 | Fraunces serif typography + Inter body; multi-layer shadows; reveal choreography (8 frames over 3300ms); analyzing storyline animation; sound-effects toggle; reveal-screen overlay flash; haptic-feedback table for Capacitor day-1 cutover (DEFERRED); reduced-motion variants |
| 3 | Activation + Onboarding + Conversion | Dim 04 + Dim 12 + Dim 03 | `8ad2165` | +~610 | Aha event split (`aha_gate_reached` + `aha_moment_reached`); session-2 tutorial defer (Conflict 7 LOCKED); Conflict 5 soft email-capture lane LOCKED; Promise-Fit microsurvey on Love-tap; value-moment paywall triggers (4 kinds); 8→3 paywall layout consolidation (A_quality / B_power / C_save); items list top-3 + sticky shop CTA; "Decision-policy update" — `APPROVE ALL CHANGES` locked in CLAUDE.md |
| 4 | Retention + Personalization + Social | Dim 05 + Dim 07 + Dim 08 | `9c83bff` | +~876 | Customer Retention Canvas (3 use cases × Setup/Aha/Habit moments); 5 engagement loops; LIFECYCLE_CAMPAIGNS 9th entry (`wishlist_age_d90_recall`); resurrection peak-moment surfacing; weighted-styleScore + soft-budget personalization in `pickItemsForRoom`; reveal-moment Share CTA + 5 share-format chips (pin/story/feed/group/reddit); lifecycle-aware default format + caption; K-factor share-funnel events; Conflict 2 propagation fix |
| 5 (Part 1) | Monetization | Dim 06 | `45dd109` | +839 / -46 | Renovation-cost anchor ($5,200 vs $47.88/yr); Lifetime $99 decoy as 3rd toggle; Annual prominence; Pro bullet reorder (HD #1 → templates #5); bundle-led "Your full design partner" headline; founding-member cap (1,000 spots); 3 new value-moment triggers; differentiated dismiss-cooldown; `paywall_dismissed` + `paywall_plan_selected` analytics; **Conflict 6 LOCKED** (gen-50 power-Free signal with behavioral-combo trigger); FTC affiliate disclosure reciprocity copy |
| 5 (Part 2) | User Psychology | Dim 02 | `8775442` | +1,125 / -14 | Welcome-back commitment card; style-DNA gauge (8-axis %); selective scarcity per paywall context; reveal-gate 24h soft countdown; Free-card cancellation safety; style evolution card on 2nd+ redesign; Tonight's recap session-end overlay; qualitative cohort framing on lifecycle banner; Modsy + Havenly added to competitive reference footer; paywall premium_quality 4S rewrite (1/4 → 4/4); Conflict 4 governance applied 3× to honor "no fake numbers, ever" |
| 6 | Data Instrumentation | Dim 13 | (this batch) | +~280 | **PRIVACY FIX** for `affiliate_click.fclick` PII leak; WRDCAL declared; PostHog dual-write scaffolded; 6 highest-leverage failure events; `screen_viewed` + `dormancy_state_changed` + lifecycle user property; `share_completed { channel }` consolidation; `tSinceX` activation timing; altitude scorecard helper; 15 cohort definitions in code; identify/reset/setUserProperty hooks |

**Cumulative diff:** ~+5,400 / -~150 lines across `app.js`, `index.html`, `styles.css`, plus 14 new strategy/audit docs.

---

## All 9 conflicts — LOCKED

| # | Conflict | Resolution | Batch |
|---|----------|------------|-------|
| 1 | Quarterly Core retention shape | MODIFY — internal frame stays; no calendar-period language in user copy | 1 |
| 2 | Pro-trial currency | MODIFY — "5 HD redesigns + 2 style packs over 90 days" replaces "1 month Pro free" | 1 |
| 3 | "Coming soon" Pro bullets | CONFIRM removal + Roadmap link in pricing footer | 1 |
| 4 | Fictitious social proof | CONFIRM — qualitative only; no fake numbers, ever (permanent rule) | 1 |
| 5 | D7 reveal-gate soft email | CONFIRM — soft email-capture lane added before D7 | 3 |
| 6 | Gen-50/30d soft signal | APPROVE — behavioral-combo trigger (≥50 gens AND ≤1 affiliate click → opportunity-framed micro-card) | 5 (Part 1) |
| 7 | Tutorial timing (session 2) | APPROVE — fires on session-2 home arrival, repurposed as "what's next" | 3 |
| 8 | Q3 (material) → room-type swap | OBSOLETE — old 4-Q quiz no longer exists post 10-Q migration | 3 |
| 9 | "~30 seconds" Promise-Fit | MODIFY — "About a minute, sit tight." | 1 |

---

## North Star: WRDCAL

**Weekly Returning Designer who Clicked an Affiliate Link.**

> A unique authenticated user who, within the trailing 7 days, has (a) completed at least one redesign generation that was viewed past the reveal gate AND (b) clicked at least one affiliate link AND (c) had at least one prior session more than 24 hours before either action.

Stored in `app.js` as `FURNISH_NORTH_STAR` constant + computed via `computeWRDCALProxy()` (per-user signal pre-backend; org-wide WRDCAL needs PostHog at backend cutover).

---

## Reforge frameworks invoked across the rollout

Every batch cited the specific Reforge program + lesson + author. Cumulative coverage:

- **Brand Marketing:** Defining Your Brand Personality, Bringing Your Brand To Life, Evangelizing Brand Guidelines, Building Blocks of Brand Identity, Brand Governance, Promise-Fit
- **Product Marketing:** Finding Your One Key Takeaway (OKT), Building Proof Point Pillars, Defining Effective Creative Briefs, House Framework, Strategic Emphasis Archetypes
- **Monetization + Pricing:** Use Case Model (Problem/Persona/Alternatives/Why/Frequency), Monetization Triad (Consumer × Growth Loops × Cost of Revenue), Packaging Strategy Matrix (RPS × WTP), Pricing Strategies (Van Westendorp + Conjoint + Economist 3-tier + Drift "Limited time"), Optimization Equation (Perceived Value > Perceived Price + Friction), Strategies for Existing Healthy Customers, Convert and Activate (Postmates Party value-moment), Cost of Revenue
- **Retention + Engagement:** Defining Retention, Natural Behavior Use Cases (Forgettable Zone), Defining Engagement States (Casual/Core/Power), Defining Aha/Setup/Habit Moments, Activation Strategies, Engagement Strategies + Frequency Strategy, Engagement Engine (Signal/Strategy/Path), Reforge Customer Canvas, Resurrection Defining/Measuring/Analyzing, BONUS Managing Infrequent Products + ICED Theory + Plant-Loyalty Hook
- **Growth Series — User Psychology:** ELMR Framework (Decision Hill, Emotion/Logic/Motivation/Reward), Psych! Framework (Darius Contractor positive vs negative psych), Apply User Psych (Candy/Vitamin/Painkiller spectrum, 4S of Tapping into Emotion, Channels For Triggers)
- **Advanced Growth Strategy:** Personal Viral Loops, Financial Viral Loops, UGC Loop Variations, Content Loops, Micro Growth Loops, Viral Loops K-factor decomposition
- **Data For Product Managers:** Identifying The Altitudes And Outcome Metrics (Sean Klaus), Building Your Altitude Scorecard, Building A Structured Event Dictionary, Cohort Analysis, Instrumentation Best Practices
- **PM Foundations / Mastering Product Management:** Decision Architecture (Decision Budget & Circles), Constrained Divergence, Feature Development + Feature Design
- **User Insights for Product Decisions:** Synthesis And Decision-Making (visible vs invisible personalization)
- **Experimentation + Testing:** Negative-Path Validation
- **Finding Product/Market Fit:** Measuring PMF

---

## Strategic decision documents (canonical set)

| File | Role |
|---|---|
| `CLAUDE.md` | Project context + decision policy + state-shape doc + locked rules |
| `OPTIMIZATION_PLAN.md` | The 14-dimension Reforge-grounded plan (8,465 lines, 140+ recommendations) |
| `CONFLICTS_RESOLVED.md` | Canonical 9-conflict resolution log — ALL LOCKED |
| `VOICE.md` | OKT + 4 personality words + 6 hard rules + per-surface playbook + token table |
| `IMPLEMENTATION_PROGRESS.md` | Batch-by-batch migration log (this rollout's truth) |
| `DEFERRED.md` | Backend-phase items + scaffolded-deferred items + content-ops dependencies |
| `BATCH_1_AUDIT.md` through `BATCH_6_AUDIT.md` | Per-batch audit + decision tables |
| `OPTIMIZATION_ROLLOUT_SUMMARY.md` | This file — the cross-batch wrap-up |
| `optimization/01_visual_design.md` through `optimization/14_edge_cases.md` | The 14 dimension files (source of every recommendation) |
| `optimization/creative-briefs/welcome.md` etc. | Per-surface creative briefs (Reforge-grounded) |

---

## Major scaffolded-but-deferred items (DEFERRED.md, ready at backend cutover)

These ship the client-side plumbing now; they activate when the named backend dependency lands.

1. **Stripe billing** (Lifetime + Monthly + Annual price IDs, webhook event handlers, grandfather coupon migration)
2. **Stripe webhook server-side events** (subscription created/updated/deleted/payment_failed) — fired backend-only
3. **Real affiliate catalog** (~80 placeholder items in `FURNITURE_DB` → real per-retailer URLs once partner programs approve)
4. **Affiliate-network attribution events** (weekly cron joining `fclickId` from `state.affiliateClicks` to network conversion reports)
5. **Photo storage at scale** (move base64 photos to Supabase Storage)
6. **Capacitor mobile wrap** (haptic feedback table activates day-1; iOS/Android stores)
7. **Sign in with Apple** (Services ID + key)
8. **Realism pipeline** (depth + normals → SAM 2 → Flux Kontext Pro inpainting)
9. **Email lifecycle delivery** (Resend/SendGrid + cron triggers; 9 LIFECYCLE_CAMPAIGNS templates ready)
10. **Push notification delivery** (Web Push VAPID + service worker; pre-prompts already wired)
11. **Live room counter** on welcome (Supabase aggregation + 5-min cache)
12. **Referral redemption ledger** (`referral_credits` table; 5 HD + 2 style-pack tracking)
13. **Email-only cohort** (magic-link auth via Supabase OTP — Conflict 5 backend half)
14. **PostHog Cloud project** (free 1M events/mo; SDK already dual-write-scaffolded)
15. **Real PostHog dashboards** (WRDCAL, activation funnel, cohort heat-maps)
16. **Server-side rate-limit + abuse events**
17. **Cross-device personalization sync** (`profile.styleScores`, `ahaHistory`, `_sessionsByHour/Dow` to Supabase)
18. **Public room URLs + OG metadata** (group-chat share virality)
19. **Embed widget** (`<iframe src="furnish.app/embed/<roomId>">`)
20. **Social-graph backend** (`follows` table; UI scaffold already in `state.user._followingUserIds[]`)
21. **Push delivery thin-cadence rule** (`pushDeliveryTierForUser()` returns `'free_thin'` / `'pro_full'`)
22. **K-factor server-side referral attribution** (server-side fire of `referral_*` events at signup)
23. **Stripe Lifetime price-ID activation** (Lifetime $99 toggle UI ships pre-Stripe; mocks Pro flag)
24. **Paywall analytics dashboard** (per-context conversion funnel + dismiss-reason segmentation)
25. **Designer Connect higher-ARPC tier** (XL effort; defer until 1,000+ Pro users)
26. **Quantitative wishlist price-drop loss banner** (real price-history data dependency)
27. **Style-DNA SVG fingerprint generator** (L-effort polish)
28. **Weekly template release cadence + drop badge** (Hassan's content-ops decision)
29. **Style-twin cohort matching** (backend cohort data + content curation)
30. **Premium-render persistence after downgrade** (server contract)
31. **Full 4S copy audit** (~27 remaining string edits — copy-pass batch)
32. **Quantitative social-proof at decision moments** (real cohort sizing + verified testimonials)
33. **Remaining 12 failure events** (capture_rejected, swap_cancelled, wishlist_removed, etc.)
34. **`paywall_cta_clicked → pro_subscription_started` rename** (at Stripe cutover)

---

## Hard rules locked permanent (cross-cutting governance)

These rules apply to every future change, not just batches in this rollout:

1. **OKT:** "Your household, your style, sharper." (`FURNISH_OKT` in `app.js`)
2. **Voice:** Concrete + Confident + Warm + Calm (`VOICE.md`)
3. **No fake numbers, ever** (Conflict 4 — applied 3× in Batch 5 Part 2 to modify Reforge proposals)
4. **No calendar-period language in user copy** (Conflict 1 — quarterly/weekly/monthly are internal frames; user copy uses experiential trigger language)
5. **Promise-Fit gate:** no microcopy contradicts measured reality (Conflict 9)
6. **Decision policy:** "From here on out I APPROVE ALL CHANGES" (CLAUDE.md — Hassan-locked Batch 3)
7. **No emoji in user-facing UI** (custom SVG icons everywhere; ~80 catalog rows still use emoji icons — flagged for catalog-asset batch)
8. **Vanilla stack** (HTML + CSS + vanilla JS + localStorage; no build step, no framework)
9. **Privacy:** Zero PII in affiliate URLs (Batch 6 fix); SHA-256 + server-held salt is the floor for any future hashed user identifiers
10. **No backwards-compat hacks for unused code** (delete cleanly when removing; don't leave `// removed` markers)

---

## Cumulative event taxonomy

After 6 batches, the live event dictionary is ~50 distinct events. Highlights:

**Session/lifecycle:** `session_started`, `screen_viewed`, `dormancy_state_changed`
**Acquisition:** `signup_started`, `signin_attempted`, `signin_completed`, `signup_failed`, `signin_failed`, `signup_email_confirmation_required`
**Onboarding:** `onboarding_question_viewed`, `onboarding_question_answered`, `onboarding_question_skipped`, `onboarding_completed`, `onboarding_skipped_full`, `preferences_edited_post_redesign`
**Activation:** `setup_complete` (with `tSinceSignup`), `aha_first_results` / `aha_gate_reached` / `aha_moment_reached` (with `tSinceSetupComplete`), `aha_quality_signal`, `habit_second_room`, `tutorial_started/step_viewed/completed/skipped`
**Generation:** `generation_completed`, `analyze_completed`, `analyze_failed`, `pro_action_attempted/completed`, `picker_underpopulated`
**Reveal/paywall:** `reveal_gate_shown / unlocked`, `paywall_shown`, `paywall_value_moment_shown`, `paywall_converted`, `paywall_dismissed { dismissReason, shown_for_ms }`, `paywall_plan_selected`, `paywall_roadmap_viewed`, `tier_changed/reconciled`, `premium_quality_upsell_shown/clicked/dismissed`
**Affiliate:** `affiliate_click { fclickId, tSinceAhaFirstResults }`, `affiliate_disclosure_viewed`, `affiliate_shop_all_clicked`, `affiliate_url_fallback_search/homepage`
**Engagement loops:** `home_progress_shown/cell_clicked`, `style_pulse_shown`, `this_week_page_shown`, `discover_more_clicked`, `styles_index_visited`, `use_template_clicked`, `lifecycle_banner_shown/clicked`, `lifecycle_would_fire`, `explore_welcome_browse_clicked`, `welcome_back_commitment_shown/yes/update`, `style_evolution_card_shown/dismissed`, `tonights_recap_shown/clicked/dismissed`
**Sharing/virality:** `share_completed { channel }` + 5 legacy channel events (download/caption/invite_link/pinterest/system), `share_system_failed`, `share_funnel_modal_opened/format_selected/format_chips_shown`
**Power-Free signal (Conflict 6):** `power_free_signal_shown { gen_count_30d, affiliate_click_count_30d } / clicked / dismissed`
**Operational:** `push_permission`, `error_thrown`, `error_shown`, `promise_fit_signal`, `signout_state_snapshotted`

All 50 events are emitted by `trackEvent()` which:
1. Pushes to `state._events` (200-event rolling debug buffer)
2. Updates `state._timing` for milestone events (REC-13.12)
3. Dual-writes to `window.posthog.capture` when present (REC-13.2; safe no-op pre-cutover)
4. Logs `[track] <name> <props>` to `console.log` (debug tail)

---

## What this rollout cost

- **Audit + planning:** ~3.5h across 6 audits (BATCH_1_AUDIT.md through BATCH_6_AUDIT.md)
- **Code execution:** ~12h across 6 commits (~2h per batch on average; Batch 5 Part 2 was the heaviest at 3h25min)
- **Documentation:** ~1h cumulative for IMPLEMENTATION_PROGRESS.md + DEFERRED.md + this summary
- **Reforge framework citations:** every change cites a specific lesson, ensuring future Hassan or future-claude can defend any decision against the source material
- **Total: ~16.5h end-to-end.**

---

## Next moves (Hassan's call)

The rollout is complete. The natural follow-ups, ranked by ROI:

1. **PostHog cutover** (REC-13.2). Sign up, paste project key, dual-write goes live. ~30 min.
2. **Real affiliate catalog ingestion** — sign up Amazon Associates, IKEA via Awin, Wayfair via CJ. Approval cycles run 1–7 days. Then update `FURNITURE_DB`.
3. **Stripe live billing** + webhook event wiring. Activates the Lifetime $99 decoy, the founding-member counter, the grandfather coupon migration, and 4 new backend-fired events.
4. **Email lifecycle delivery** — Resend/SendGrid + cron triggers. Drains the 9 LIFECYCLE_CAMPAIGNS templates already authored.
5. **Capacitor wrap** — activates the haptic-feedback table on day-1 mobile.
6. **Real photo assets for slot-driven UI:** welcome before/after demo (Rec 02), empty-state illustrations (Rec 09), photo-tip example (AST-1), Q2 palette room thumbs (E2), capture "What works" tip strip (E9).

The optimization rollout is the foundation. Everything above is now grounded in the foundation rather than guessing without one.

— end of summary —
