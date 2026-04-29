# MONETIZATION_PROPAGATION_AUDIT.md

**Status:** STEP 1 of 4 complete. **Awaiting your approval before STEP 3 implementation.**

This audit walks every surface in the codebase that references the old "2-lifetime AI generation cap" or "Pro = compute-cost defrayment" mental model, and lists what each becomes under the new model.

---

## The new model (the contract this audit enforces)

| Tier | Compute | Other entitlements | Price |
|---|---|---|---|
| **Free** | **Unlimited generations** on the cheap/fast model (Flux Schnell or equivalent) | Unlimited reshuffles · unlimited swaps · full shopping/affiliate · basic personalization · wishlist · price-drop alert delivery · save rooms · multi-room exploration | $0 |
| **Pro** | **Unlimited generations** on the premium model (Flux Kontext Pro / Flux Depth Pro) | Multi-room batch · HD/clean download (no watermark) · advanced personalization (style learns over time) · advanced filters on price-drop watch (e.g. ≥20% drop only) · per-person profiles · premium template library · any future "depth" features | **$5.99/month** |

**Cost-of-goods principle (revised):** AI compute cost is gated by *model tier*, not by *generation count*. Free users still cost us money per use, but at the cheap-model rate (~$0.005-0.01/run). Pro pays for premium-model use (~$0.04-0.08/run) plus the depth-feature surfaces.

**Why this works:**
- Affiliate revenue per Free user can grow as their generation count grows (the loop that was previously dead at gen 3 is now alive forever).
- Pro is a *quality + depth* upsell, not a *quantity* upsell. People convert because they want sharper results + multi-room batch + clean HD share image, not because they hit a wall.
- Pro subscription stabilizes LTV against affiliate volatility.

---

## Section A — Gating and quota logic

| # | Surface | Current state | Target state |
|---|---|---|---|
| A1 | `FREE_GENERATION_LIMIT = 2` constant — `app.js:3352` | `2` | **REMOVE.** No lifetime cap. |
| A2 | `gateGeneration(actionId, fn)` middleware — `app.js:3390` | 3-state gate: Pro / remaining>0 / paywall | **REPLACE** with `routeGenerationByModelTier(actionId, fn)`. New signature: always allows execution; selects model tier based on `isPro()`. Returns the model identifier so the future backend can route to the right Replicate endpoint. |
| A3 | `generationsRemaining()` helper — `app.js:3378` | `Infinity` for Pro, else `max(0, LIMIT - used)` | **DELETE.** No longer meaningful. Kept-as-shim returning `Infinity` for one transitional release if any external caller exists; we'll grep to confirm none does. |
| A4 | `hasUsedAllFreeGenerations()` helper — `app.js:3382` | `!isPro && remaining === 0` | **DELETE.** Replaced everywhere with new helpers (see A5). |
| A5 | `incrementGenerationCount()` — `app.js:3419` | Increments `state.user.generationsUsed` | **KEEP** for analytics (we still want to know how many generations a user has done — informs activation funnel + LTV modeling). Stops being a gate input; becomes an analytic counter only. |
| A6 | `state.user.generationsUsed` field | Lifetime counter; quota input | **KEEP** as analytics-only counter. No gate reads it. |
| A7 | `state.user.redesignsUsed` (legacy mirror) | Mirror of `generationsUsed` | **DELETE** the mirror writes. Migration window has lapsed; nothing should still read it. (We confirmed via grep — only legacy migration paths read it.) |
| A8 | Body class `has-used-free-generations` — toggled in `syncFreeModeClass()` `app.js:3435` | True for non-Pro at quota=0 | **DELETE** — class no longer meaningful. |
| A9 | `detectQuotaTamper()` — `app.js:~3535` | Logs `quota_tamper_suspected` when rooms > generationsUsed+1 | **DELETE.** No quota → no tamper. Remove the function + the boot-time call + DEFERRED.md note. |
| A10 | Pro-template gate inside `startFromTemplate(t)` — `app.js:~3094` | If `t.pro && !isPro()` → openPaywall('template_pro') | **KEEP.** Pro templates are a depth feature, unaffected by the compute-cap removal. |
| A11 | `gateProFeature(actionId, fn)` middleware — `app.js:~3408` | Pro-only gate for HD export, multi-room batch, advanced personalization | **KEEP.** All these gates are unchanged. Add new `advanced_price_filters` actionId. |
| A12 | New gate target: `advanced_price_filters` | Doesn't exist | **ADD.** When user attempts to set a price-drop filter (e.g. "≥20% only"), route through `gateProFeature('advanced_price_filters', fn)`. |
| A13 | New helper: `currentModelTier()` | Doesn't exist | **ADD.** Returns `'premium'` if `isPro()`, else `'standard'`. Used by `routeGenerationByModelTier()` and analytics events. |

## Section B — `FREE_PLAN_CARD` constant (single source of truth)

Surface: `app.js:864` (`FREE_PLAN_CARD = Object.freeze({...})`).

| Current bullet | Action |
|---|---|
| "Unlimited reshuffles on your existing redesign" | **KEEP** |
| "Unlimited item swaps" | **KEEP** |
| "Full shopping access — every item is yours to buy" | **KEEP** |
| "Basic personalization (style, mood, budget)" | **KEEP** |
| "2 AI redesigns total (1 photo upload + 1 template, or 2 of either)" | **REPLACE** with: "Unlimited AI redesigns at standard quality" |
| (none) | **ADD** new bullet: "Real-time price-drop alerts on saved items" (now Free per decision #3) |

**Footer line:** "You're on this plan. Want more? →" — **KEEP.**

The 9-paywall-surface verification: every `openPaywall(context)` call site already routes through the central `openPaywall()` which calls `renderFreeCard()`. Auto-propagates. Will re-verify in step 4.

## Section C — Pro card (paywall + pricing)

| # | Surface | Current state | Target state |
|---|---|---|---|
| C1 | Pro feature list — `index.html:~883` (`<ul class="paywall-list">`) | Lists "Unlimited new redesigns from any photo" as headline + "Premium template library" + "HD exports" + "A separate style profile for every person" + "Multi-room batch design (coming soon)" + "Style learns over time (coming soon)" + "Real-time price-drop alerts on saved items" | **REWRITE.** New list: 1) **Premium AI quality — sharper, more accurate redesigns** *(headline)*; 2) Multi-room batch design *(coming soon)*; 3) HD downloads — no watermark, social-ready; 4) Style learns over time *(coming soon)*; 5) Advanced price-drop filters *(set thresholds, retailer preferences)*; 6) Per-person style profiles; 7) Premium template library. **REMOVE** the "Unlimited new redesigns" line — that's now Free. **REMOVE** "Real-time price-drop alerts" headline bullet — moved to Free; what's left is the Pro-only filtering layer. |
| C2 | Price display — `index.html:~876` `#paywallPrice` + `#paywallUnit` | `$4.08 /month, billed annually ($49/yr)` (annual) and `$7.99 /month` (monthly) — set by `app.js:~978` toggle handler | **UPDATE.** Annual: `$5.99 /month, billed monthly` becomes the default-shown price. The annual savings copy should match: if we offer annual, target ~30-40% discount → `$3.99/mo billed annually ($47.88/yr)`. **DECISION needed**: do we keep Monthly+Annual toggle or simplify to one price? Recommend **keep toggle**, with `$5.99/mo` (monthly) and `$3.99/mo` annual at $47.88/yr (~33% off). |
| C3 | Founding-member urgency line — `index.html` `.paywall-urgency` "Founding-member pricing — locks in for life if you join this month." | Static line | **KEEP** (still good). |
| C4 | "Start 7-day free trial" CTA — `index.html:~896` `#paywallCta` | Trial-language | **KEEP** (still applicable). |
| C5 | "Cancel anytime before day 7 — no charge." footnote | Static | **KEEP**. |
| C6 | Standalone `/pricing` page or scaffold | Doesn't exist in repo (verified via grep) | **NO ACTION** — out of scope. |
| C7 | Investor-facing pricing in README/about docs | README §3 says "shoppable furniture/decor from partner stores" — no pricing language | **NO ACTION on README**. CLAUDE.md says "Real AI redesign — Flux Kontext Pro + Flux Depth Pro on Replicate. ~$0.05/run" — **UPDATE** that line to reflect compute-quality routing: "Free uses Flux Schnell (~$0.005/run); Pro uses Flux Kontext Pro / Flux Depth Pro (~$0.05/run)." |

## Section D — Paywall trigger logic + PAYWALL_COPY

Surface: `PAYWALL_COPY` constant in `app.js:903`.

| Context key | Current state | Target state |
|---|---|---|
| `quota_exhausted` | "You're out of free redesigns. You've used both of your free AI redesigns. Pro gives you unlimited redesigns…" | **REMOVE.** Trigger no longer fires (no quota). |
| `redesign` | "You've used your free redesigns. Pro unlocks unlimited new redesigns from any photo, anytime." | **REMOVE.** Same reason. |
| `template_pro` | "Premium templates — Pro templates include curated rooms across every style and space" | **KEEP.** |
| `hd_export` | "Export in HD, no watermark…" | **KEEP.** |
| `profile` | "A profile for everyone in your house — Pro adds a separate style profile per person…" | **KEEP.** |
| `multi_room_batch` | "Design your whole house at once — Pro lets you batch-process multiple rooms…" | **KEEP.** |
| `advanced_personalization` | "Style that learns over time…" | **KEEP.** |
| `rearrange` | Backward-compat fallback (D10 made rearrange free) | **KEEP** as no-op fallback. |
| `generic` | "Unlock Furnish Pro — Unlimited new redesigns, HD exports, and every style profile your household needs." | **REWRITE.** New: "Unlock Furnish Pro — Premium AI quality, multi-room batch, HD downloads, and every style profile your household needs." Remove "unlimited new redesigns" (now Free). |
| **NEW** `premium_quality` | Doesn't exist | **ADD.** Title: "Sharper redesigns, every time." Sub: "Pro upgrades you to the premium AI model — more accurate furniture matches, better lighting, no compromises. Unlock for $5.99/month." |
| **NEW** `advanced_price_filters` | Doesn't exist | **ADD.** Title: "Filter your price-drop alerts." Sub: "Pro lets you set thresholds (only alert me on drops ≥20%) and retailer preferences. Free alerts already cover everything saved — Pro is for power users." |

**Trigger sites — call sites of `openPaywall()`:**

| Line | Context arg | Current trigger | Target |
|---|---|---|---|
| `app.js:650` | `'generic'` | Profile-related action | **KEEP** |
| `app.js:795`, `app.js:830` | `'profile'` | Multi-profile creation | **KEEP** |
| `app.js:2682` | `'generic'` | Profile-page Pro button | **KEEP** |
| `app.js:3097` | `'template_pro'` | Pro-only template tap | **KEEP** |
| `app.js:3402` | `'quota_exhausted'` (inside old gateGeneration) | Quota block | **DELETE** — call site is inside `gateGeneration` which is being replaced. |
| `app.js:3415` | dynamic `actionId` (inside gateProFeature) | HD export, multi-room batch, advanced personalization | **KEEP** — same gate, more targets (now also `advanced_price_filters`). |
| `app.js:4173` | `'redesign'` / `'quota_exhausted'` (quota banner upgrade link) | Banner CTA | **DELETE** — banner itself is being removed (Section H). |
| `app.js:4978` | `'hd_export'` | HD download tap | **KEEP**. |
| **NEW** | `'premium_quality'` | New trigger | **ADD.** Surfaces in two places: (1) results screen, after the user has done their 3rd Free generation (tasteful one-shot per session); (2) optional in-room "see this in premium quality" CTA on results that opens this paywall. |

**Pacing rule for `premium_quality` trigger** (Reforge User Psychology — upsell pacing): never on first redesign (activation); first eligible at 3rd generation; max 1 surface per session; respects `state._premiumUpsellShownAt` timestamp; minimum 7-day cooldown between surfaces. Track: `premium_quality_upsell_shown`, `premium_quality_upsell_clicked`, `premium_quality_upsell_dismissed`.

## Section E — First-redesign tutorial

Surface: `TUTORIAL_STEPS` constant in `app.js:3653`.

Current step copy (verified via grep):
- Step 1 (Styles): *"These chips shape every redesign. Pick one or many — switching the picks reruns the AI when you redesign next."*
- Step 2 (Mood): *"The vibe of the room. Layer multiple — calm + warm = different from calm + cool."*
- Step 3 (Budget): *"This is the most important one. The prices on your redesign respect this slider — drag it down for affordable picks, up for premium. Try it now."*

**Action:** **NO COPY CHANGE NEEDED.** None of the three steps reference quota, "free", or "limit". Verified clean.

`state.user.firstRedesignTutorialSeen` flag stays as-is.

## Section F — Reveal screen ("Your room, reimagined")

Surfaces:
- `index.html:~108` `.srh-trust-text`: "**4.8** · 2,400+ designs unlocked this week"
- `app.js:~376` signin subtitle (D7 reveal-gate path): "Unlock it in 10 seconds — free, no card needed."
- The blurred backdrop, headline, "Reveal My Redesign →" button — verified clean of quota copy.

**Action:** **NO CHANGE.** "Designs unlocked this week" is a social-proof line, not a quota reference. The "Unlock it in 10 seconds" subtitle is about account creation, not generation quota.

## Section G — Templates flow / Style Pulse / Use Template clicks

| # | Surface | Current state | Target state |
|---|---|---|---|
| G1 | `startFromTemplate(t)` quota gate inside the function — `app.js:~3106` | Calls `gateGeneration('new_redesign_template', ...)` | **REWRITE** to call `routeGenerationByModelTier('new_redesign_template', ...)`. Pro-template gate (the `if t.pro && !isPro()`) STAYS. |
| G2 | Stash for mid-flow upgrade resume — `state._pendingProAction = { actionId: 'new_redesign_template', templateId: t.id }` | Set BEFORE gateGeneration | **DELETE** the new_redesign_template stash (no quota, no resume needed for that path). The `template_pro` stash STAYS for the Pro-template paywall path. |
| G3 | `useTemplateFromCard(spec, source)` — Style Pulse / Trending / Seasonal card click | Routes through startFromTemplate | **NO CHANGE** to the function itself. It inherits the new behavior automatically once startFromTemplate is updated. |
| G4 | Style Pulse card copy "Use Template" | Static label | **NO CHANGE.** |
| G5 | `paywall_trigger { from: 'template_pro' }` event | Fires when Pro template is tapped by Free user | **KEEP** — Pro templates remain Pro-gated. |

## Section H — Engagement loop scaffolding (this pass) + UI surfaces

| # | Surface | Current state | Target state |
|---|---|---|---|
| H1 | `renderQuotaBanner(room)` — `app.js:4145` results screen | After 1st of 2 free: "1 free redesign left" + Get-unlimited link. After 2nd: "Out of free redesigns — reshuffle/swap/shop still free" | **DELETE** the function + its call sites. Replace with `renderPremiumUpsellHint(room)` (NEW) which surfaces once-per-session at 3rd+ generation: "Want sharper redesigns next time? Pro uses our premium model. [See sample]" — uses Section D pacing rules. |
| H2 | `.quota-banner` CSS — `styles.css:4948` | Amber banner styling | **DELETE** rules. **ADD** `.premium-upsell-hint` rules for the new section. |
| H3 | Lifecycle campaigns — `LIFECYCLE_CAMPAIGNS` constant in `app.js:2148` | 8 campaigns. **`mid_d14_price_watch`** body says "1 of your saved items dropped 22%. Tap to see." — references price-drop alert delivery, which is now Free for everyone. | **NO CHANGE** to the copy itself (it already worked under either model). The campaign now applies to ALL users, not Pro. |
| H4 | Price-Drop banner (`renderPriceDropBanner`) — built last pass | Surfaces drops in-app for ALL users (already correct under new model since the previous pass already partially anticipated the move-to-free) | **NO CHANGE.** Already correct. |
| H5 | Home Progress map (`renderHomeProgress`) — built last pass | 9-cell room journey | **NO CHANGE** to the structural code. Verify no hidden quota copy in cell labels — checked, none. |
| H6 | Visit-N body class differentiation | `[data-visit-band="first|early|active|veteran"]` | **NO CHANGE.** |
| H7 | Welcome screen recall copy — `applyWelcomeRecallState()` `app.js:5387` | Branches on lifecycle AND quota state. Lines like "Reshuffle, swap, and shop — always free" exist when quota was out. | **REWRITE** branches that referenced "out of free redesigns." Replace with quality-tier framing where appropriate, or just simplify. |

## Section I — Analytics events

| Event | Current state | Target |
|---|---|---|
| `quota_exhausted` (as paywall context arg) | Fires from gateGeneration | **RETIRE.** No longer fires. |
| `quota_tamper_suspected` | Fires from `detectQuotaTamper()` | **RETIRE.** Function deleted. |
| `paywall_trigger { reason: 'quota_exhausted' }` | Fires from gateGeneration block | **RETIRE.** |
| `pro_action_completed { viaQuota: true/false }` | Fired from gateGeneration allow paths | **REPLACE** with `generation_completed { tier: 'standard' \| 'premium', actionId }`. The new shape removes the binary "viaQuota" flag (no quota anymore) and surfaces the model tier instead. Keeps actionId. |
| `pro_action_attempted { wasGated: bool }` | Fires when gate blocks | **RETIRE** for generation gates (no block). **KEEP** for `gateProFeature` (HD, batch, advanced filters, etc.) where blocks still exist. |
| `paywall_trigger { from: actionId, reason: 'pro_feature' }` | Fires from gateProFeature | **KEEP.** |
| `paywall_shown { context }` | Fires on every openPaywall | **KEEP.** New contexts ('premium_quality', 'advanced_price_filters') automatically flow through. |
| `paywall_converted` | Fires when user upgrades via mock CTA | **KEEP.** |
| `tier_changed` | Fires alongside paywall_converted | **KEEP.** |
| **NEW** `premium_quality_upsell_shown` | — | **ADD.** Props: `triggeringContext, generationsUsed`. |
| **NEW** `premium_quality_upsell_clicked` | — | **ADD.** Same props. |
| **NEW** `premium_quality_upsell_dismissed` | — | **ADD.** Same props. |
| **NEW** `pro_subscription_started` | — | **ADD.** Props: `plan ('mocked_trial'\|<future stripe price id>), triggeringContext, source`. Differs from existing `subscription_started` only in name — recommend **renaming** existing `subscription_started` → `pro_subscription_started` for clarity. |
| `price_alert_on / price_alert_off` | Fires when user toggles alert | **KEEP** as-is (alert SETTING was already Free; only delivery moves to Free this pass). |
| `affiliate_click` | Fires on affiliate link tap | **KEEP.** |

## Section J — Deferred-phase items (DEFERRED.md + CHANGES_APPLIED.md)

| # | Surface | Current state | Target |
|---|---|---|---|
| J1 | `DEFERRED.md` Anti-abuse section | "Server-side `generations_used_lifetime` counter" + "2-lifetime limit holds across devices" | **REWRITE.** No more lifetime limit. Anti-abuse becomes: "rate-limit per IP/account on the AI-call backend so a single user can't trigger 1000 generations/hour and burn compute budget." Different motivation, different solution. |
| J2 | `DEFERRED.md` `detectQuotaTamper()` reference | Notes the soft tamper-detection hook | **REMOVE** — function deleted. |
| J3 | `DEFERRED.md` Stripe webhook section | Says webhook updates `is_pro` + `generations_used` | **UPDATE** — webhook only updates `is_pro` now (and Stripe customer/subscription metadata). `generations_used` becomes analytics-only and doesn't need to round-trip. |
| J4 | `DEFERRED.md` First-redesign tutorial sync | Notes `first_redesign_tutorial_seen` server sync | **NO CHANGE.** |
| J5 | `DEFERRED.md` (NEW section) — Compute model routing | Doesn't exist | **ADD.** Documents the future backend's responsibility: read tier from `user_settings.is_pro`, route AI generation requests to the correct Replicate endpoint (Flux Schnell for Free, Flux Kontext Pro / Flux Depth Pro for Pro). |
| J6 | `DEFERRED.md` (NEW section) — User research plan | Doesn't exist | **ADD.** Per decision #5, write the full 5-archetype × 5-7 interviews plan with specific interview guide. Marked deferred until launch user base exists. |
| J7 | `DEFERRED.md` Email lifecycle section | Mentions price-drop alert delivery | **UPDATE** — alert delivery is now Free-tier-applicable; phrasing should reflect that. |
| J8 | `MONETIZATION_AUDIT.md` (the original Model A audit) | References old Model A throughout | **ARCHIVE** as historical. Add a note at the top: "Superseded by MONETIZATION_PROPAGATION_AUDIT.md and the compute-quality routing model." Do not edit body — preserve as migration history. |
| J9 | `CHANGES_APPLIED.md` | Documents Model A migration + recent passes | **APPEND** new section "Compute-Quality Routing Migration" rather than editing prior sections. Same pattern as before — preserve migration history. |
| J10 | `CLAUDE.md` "What's NOT done yet" backend item #1 | "Real AI redesign — Flux Kontext Pro + Flux Depth Pro on Replicate. ~$0.05/run" | **UPDATE** to: "Real AI redesign — Flux Schnell (Free tier, ~$0.005-0.01/run) + Flux Kontext Pro / Flux Depth Pro (Pro tier, ~$0.05/run). Server routes by `user_settings.is_pro`." |

## Section K — Copy sweep (the silent killer)

Walked every surface where "free", "limit", "redesign", "Pro", "unlock", "quota", "generation" appears. Findings:

| # | Location | Current copy | Target copy |
|---|---|---|---|
| K1 | `app.js:2322-2323` (welcome lifecycle banner branch) | `'You\'ve got 1 free redesign remaining.'` / `'You've got ${remaining} free redesigns remaining.'` | **REWRITE.** Either delete the branch entirely (lifecycle banner falls back to other copy) OR replace with "Unlimited redesigns at standard quality. Pro for premium." Recommend just deleting the branch. |
| K2 | `app.js:2671` profile Pro card sub (Pro state) | `'Unlimited new redesigns · HD exports · per-person profiles'` | **REWRITE.** "Premium AI · multi-room batch · HD downloads · per-person profiles" |
| K3 | `app.js:2677-2679` profile Pro card sub (Free state) | `'${remaining} free redesigns left · reshuffles + shopping always free'` / `'Free redesigns used · reshuffle, swap, and shop are still free'` | **REWRITE.** Single new line: "Standard-quality redesigns · reshuffle, swap, and shop always free · Pro for premium quality" |
| K4 | `app.js:5008` invite link toast | `'Invite link copied — you both get 3 free redesigns'` | **REWRITE.** Referral mechanic was tied to "extra redesigns" which made sense under the old cap. Under the new model, what's the referral reward? **DECISION needed**: (a) "Invite link copied — you both get 1 month of Furnish Pro free" (subscription incentive), (b) "Invite link copied — both of you get a Pro-quality redesign credit" (one-shot premium taste), (c) drop the referral reward, just track invites. **My recommendation: (a)** — referral becomes a Pro-trial-driver. Aligns the network-effect with subscription LTV. |
| K5 | `app.js:5397` lifecycle banner churned-state branch | "Dormant + out of free redesigns — direct them to revisit saved rooms" | **REWRITE.** Whole branch logic obsolete. The "out of free" check should be removed. Body becomes whatever the current dormant copy is, minus the quota qualifier. |
| K6 | `app.js:912` PAYWALL_COPY.redesign sub | `"You've used your free redesigns. Pro unlocks unlimited new redesigns from any photo, anytime."` | **DELETE** entire entry per Section D. |
| K7 | `app.js:905-907` PAYWALL_COPY.quota_exhausted | `"You're out of free redesigns. You've used both of your free AI redesigns. Pro gives you unlimited redesigns…"` | **DELETE** entire entry per Section D. |
| K8 | `index.html:496` profile Pro card initial sub `#profileProSub` | `'1 free redesign — upgrade for unlimited'` | **REWRITE.** "Standard quality · upgrade for premium AI" |
| K9 | `index.html:827` referral note `.share-referral-note` | `'Invite link gives the recipient 3 free redesigns and credits you when they sign up.'` | **REWRITE** to match K4 decision. If (a): "Invite link gives the recipient 1 month of Furnish Pro free. You get a free month when they convert." |
| K10 | `index.html:846` paywall hero sub | `"Most members redesign 4–7 rooms in their first month. You've used your free three — keep going for less than a coffee a month."` | **REWRITE.** "Most members redesign 4–7 rooms in their first month. Pro upgrades the AI quality that powers each one — for less than a coffee a month." |
| K11 | `app.js:4143` (renderQuotaBanner inline comment) | `"After the 1st of 2 free, the banner says..."` | **DELETE** along with the function. |
| K12 | `app.js:1771` (template-card useTemplateFromCard inline comment) | `"counts as one of the 2 free AI redesigns (per Model A D4)"` | **REWRITE.** "Routes through routeGenerationByModelTier — Free uses standard model, Pro uses premium." |
| K13 | `app.js:4448` (togglePriceAlert inline comment) | `"[Model A — D9] Setting a price alert is FREE; delivery (push/email) is PRO."` | **REWRITE.** "Setting a price alert is Free. Delivery is Free for ALL users (per compute-quality migration). Pro adds advanced filters (thresholds, retailer prefs) — see gateProFeature('advanced_price_filters')." |

## Section L — Pitch / investor-facing surfaces

| # | Surface | Current state | Target state |
|---|---|---|---|
| L1 | `README.md` | "AI-powered interior design app prototype. Snap a photo of your room, pick your style profile, and Furnish recommends real, shoppable furniture and decor from partner stores" | **NO CHANGE NEEDED** — README doesn't mention monetization. |
| L2 | `Session Context.txt` (Hassan's desktop file) | "Affiliate revenue is the primary monetization. We earn a commission when users purchase…" | **NOT IN REPO** — Hassan owns this. Recommend updating it to: "Affiliate revenue is the primary monetization, with a $5.99/mo Pro subscription as a stabilizer covering premium AI quality + power-user features." Out of scope for this implementation (you'll edit yours). |
| L3 | `CLAUDE.md` | Project context for Claude. Says "Affiliate revenue is the primary monetization" | **NO CHANGE NEEDED** — top-level positioning unchanged. The "What's NOT done yet" section item #1 about Replicate models is updated in J10. |
| L4 | "About Furnish" doc / pitch deck | Doesn't exist in repo | **NO ACTION** — out of scope. |

---

## Conflicts found during audit (for your call)

### CONFLICT 1 — Referral reward (K4, K9)
The referral mechanic ("3 free redesigns") was tied to the old quota. The codebase has the toast + the share-modal note both referring to it. **DECISION needed** before implementation. Recommend: each referral gives both inviter and invitee 1 month of Pro free. Drives subscription trials. Aligns network effect with Pro conversion funnel.

### CONFLICT 2 — Welcome lifecycle banner branches (K1, K5, H7)
Multiple branches in `applyWelcomeRecallState()` and `renderLifecycleBanner()` keyed off the user's quota state. Removing the quota state means simplifying the branching logic — fewer states. Some lifecycle copy may need new sub-text since "you have N free left" was doing real work in some banners. Recommend: where a branch becomes empty, default to the lifecycle-only copy (no quota qualifier).

### CONFLICT 3 — Annual pricing math (C2)
At $5.99/mo monthly, the typical annual discount range (~30-40%) lands around $3.99-4.19/mo billed annually. **DECISION needed**: do we offer annual at all, and at what discount? My recommendation: $3.99/mo annual ($47.88/yr), 33% off, advertised as "Save 33%."

### CONFLICT 4 — Paywall `7-day free trial` framing (C4)
The current paywall offers a 7-day trial. Under the new model, the Pro value-prop is "premium quality + depth features," and a 7-day trial of premium AI quality gives the user time to feel the difference. **NO CHANGE NEEDED** — trial framing remains correct. Just noting that we should NOT mistakenly remove it.

### CONFLICT 5 — `gateGeneration` rename
Renaming `gateGeneration` to `routeGenerationByModelTier` is more accurate semantically but breaks any external reference (CHANGES_APPLIED.md, MONETIZATION_AUDIT.md, code comments). Alternative: keep the name `gateGeneration` and just make it always-allow with model-tier routing. **Recommend the rename** — names that lie ("gate" suggesting block) are technical debt. Update docs in pass.

---

## Implementation order plan (locked when you approve)

1. **Layer 1 — Tier infrastructure:** rewrite `gateGeneration` → `routeGenerationByModelTier`; delete `FREE_GENERATION_LIMIT`, `generationsRemaining`, `hasUsedAllFreeGenerations`, `detectQuotaTamper`; add `currentModelTier()`. (Section A)
2. **Layer 2 — Backend gates:** update `supabase-client.js` to stop syncing `generations_used` as a quota field (keep as analytics counter only). Update `SUPABASE_SETUP.md` to clarify the column's role. (Section A continued)
3. **Layer 3 — `FREE_PLAN_CARD` source-of-truth update.** (Section B)
4. **Layer 4 — Pro card + paywall HTML.** (Section C)
5. **Layer 5 — `PAYWALL_COPY` + new contexts (`premium_quality`, `advanced_price_filters`).** (Section D)
6. **Layer 6 — Trigger sites.** Add `premium_quality` upsell logic with pacing rules. Delete obsolete `quota_exhausted` paywall calls. (Section D continued)
7. **Layer 7 — Replace `renderQuotaBanner` with `renderPremiumUpsellHint`.** (Section H)
8. **Layer 8 — Welcome / lifecycle banner copy + branch simplification.** (Sections H, K)
9. **Layer 9 — Analytics event renames + new events.** (Section I)
10. **Layer 10 — Copy sweep** every surface in K. (Section K)
11. **Layer 11 — Docs:** update DEFERRED.md, CLAUDE.md item #1, archive note in MONETIZATION_AUDIT.md, append migration log to CHANGES_APPLIED.md. (Section J)
12. **Step 4 — Final consistency sweep.**

## Stop point

This file = STEP 1 deliverable. **Awaiting your review.**

Specifically I need:
- Confirmation or override of any item in Sections A–L
- Resolution of the 4 conflicts above (referral reward K4/K9; banner simplification; annual pricing; gateGeneration rename)
- Any item I missed

Once approved, I'll execute Layers 1–11 in the locked order, then run Step 4 sweep, and document everything in `CHANGES_APPLIED.md`.
