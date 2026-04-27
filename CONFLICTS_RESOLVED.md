# CONFLICTS_RESOLVED.md

**Status:** ✅ LOCKED — Hassan decided 2026-04-26. Conflicts 1–4 + 9 are RESOLVED for Batch 1 implementation. Conflicts 5, 6, 7, 8 remain pending for later batches.
**Created:** 2026-04-26 · **Locked:** 2026-04-26 (Batch 1 conflicts only)
**Source:** `OPTIMIZATION_PLAN.md` → CONFLICTS WITH EXISTING DECISIONS section
**Why this file exists:** Canonical source of truth. Every implementation batch references this file when touching a conflict zone.

---

## Quick decision summary (Batch 1 scope)

| # | Conflict | Decision | Form |
|---|----------|----------|------|
| 1 | Quarterly Core retention shape | LOCKED | MODIFY — internal frame stays, no calendar-period language in user copy |
| 2 | Pro-trial-for-both currency | LOCKED | MODIFY — switch to "5 HD redesigns + 2 style packs over 90 days" |
| 3 | "Coming soon" Pro bullets | LOCKED | CONFIRM removal + add Roadmap link in pricing footer |
| 4 | Fictitious social proof | LOCKED | CONFIRM — qualitative only, no fake numbers, ever |
| 5 | D7 reveal-gate soft email | PENDING | (Batch covering D7 reveal gate) |
| 6 | Gen-50/30d soft signal | PENDING | (Batch covering Free→Pro power-user conversion) |
| 7 | Tutorial timing (session 2 deferral) | PENDING | (Batch covering onboarding architecture) |
| 8 | Q3 (material) → Q3 (room type) swap | PENDING | (Batch covering quiz architecture) |
| 9 | "~30 seconds" Promise-Fit | LOCKED | MODIFY — replace with "About a minute — sit tight." |

---

# Conflict 1 — Quarterly Core + Weekly Supplemental retention shape  ✅ LOCKED

## Conflict
- **Prior decision:** Furnish's natural retention shape is **Quarterly Core** (real redesign sessions every ~3 months) **+ Weekly Supplemental** (Style Pulse, price drops, lifecycle banners). The redesign is the central recurring activity; everything else fills the gap.
- **Optimization plan recommends:** **FLIP**. Saved-item tracking + price-drop watch + Style Pulse become the **Core** (weekly–monthly cadence). Real redesign sessions become **Seasonal** (annual / bi-annual).
- **Why they contradict:** The prior call assumes Furnish is *core-redesign-driven* with auxiliary engagement. The new analysis (per [Dim 04 — Activation](optimization/04_activation.md), [Dim 05 — Retention](optimization/05_retention.md), [Dim 06 — Monetization](optimization/06_monetization.md)) argues that consumer room redesign is naturally a 1–2× annual behavior (Reforge *Natural Behavior Use Cases* p.23–25 places it in the **Forgettable Zone**, not the quarterly habit zone). A Quarterly Core retention curve slopes to zero on a real population because the core action doesn't fire often enough to anchor habit. The wishlist + price-drop + Style Pulse loops have higher natural frequency and should carry the retention weight.

## My recommendation
**FLIP, with calibration on the seasonal call.**

The new "Core" = wishlist activity + price-drop alerts + lightweight Style Pulse browse (target weekly–monthly cadence). Real redesign sessions = "Major Event" (target bi-annual to seasonal — when user moves, redecorates, or has an explicit project trigger). Pro subscription must monetize the WEEKLY cadence, not the quarterly one — otherwise $5.99/mo for a quarterly-use product is structurally upside-down (per Reforge *Monetization Triad — Consumer View*).

Specifically:
- The "Core" loop is: see/get notified about a price drop → open Furnish → check the saved item → maybe save another, set another alert. **Trigger-action-reward-investment**, ~1 minute per session, weekly cadence.
- The "Major Event" loop is: a triggering event (move, season change, frustration with a room) → user opens Furnish → uploads new photo → full redesign. ~10 minutes per session, 2–4× per year.
- The Pro pricing logic must reflect this. Pro upgrades the *frequent* loop (HD downloads of weekly inspiration, custom price-drop thresholds, multi-profile for households who all save items) — NOT the rare loop. The "Premium AI quality" upsell stays valid as a Major-Event lever, but secondary.

**Reforge citation:** *Retention + Engagement → 02. Retention → Natural Behavior Use Cases* (Forgettable Zone framework, p.23–25); *09. BONUS Managing Infrequent Products → Iced Theory → 4 Dimensions* (Infrequent products require layered touchpoints — single → intermittent → constant); *Monetization + Pricing → Monetization Triad → Consumer View* (price must match perceived value frequency).

**Why I'd ship this:** The Pro tier is the canary. If users won't pay $5.99/mo for a quarterly-use product (Reforge frequency-strategy benchmarks predict they won't), the prior call is existentially wrong, not stylistically wrong. The flip isn't aesthetic — it's necessary for monetization survival.

## Downstream impact
- **All Dim 05 (Retention) recommendations** rebase on this — engagement loop ranking, lifecycle map, content cadence build-list change interpretation.
- **Dim 04 (Activation) Habit definition** changes from "returns and starts a 2nd redesign" to "returns and engages saved items / price-drop UI" (lower bar, higher frequency).
- **Lifecycle email cadence** (DEFERRED.md item 6) — emphasis shifts from "redesign reminder" copy (welcome_d3_next_room) to "your saved items + your style" copy. The 8-campaign LIFECYCLE_CAMPAIGNS array stays, but copy in welcome_d3, mid_d14, mid_d30, dormant_d60, dormant_d90 changes orientation.
- **Pro card bullet ordering** (paywall) — HD downloads / advanced price-drop filters / multi-profile move ABOVE "Premium AI quality" in display order. Reflects the new Core.
- **Push notification copy templates** (Dim 09 Section C) — orientation shifts from "your room is ready" to "an item you saved dropped 22%."
- **Activation banner copy** (`app.js:2360-2425`) — current "Most members redesign 4-7 rooms in their first month" is BOTH a fictitious-claim violation (Conflict 4) AND irrelevant under the flip. Replaced with weekly-engagement copy: "Welcome back — your saved items have new picks" / "Style Pulse this week: Warm Minimalist."
- **Dim 13 cohort definitions** — "Habit-formed user" definition changes from "returned within 14d AND ≥1 save" to "≥3 sessions in 30d with ≥1 save and ≥1 alert set OR ≥1 affiliate click."
- **WRDCAL north star** unchanged (it already weights weekly returning + affiliate click).

## Files affected
- `app.js` — LIFECYCLE_CAMPAIGNS copy, lifecycle banner copy, push pre-prompt copy, paywall context copy
- `index.html` — paywall card bullet order, activation banner copy
- `styles.css` — Style Pulse strip prominence on home (currently below resume-hero card; consider above for the flip to land visibly)
- All copy in Dim 09 Lifecycle Copy Library reorients

## Hassan's decision (LOCKED 2026-04-26)
**MODIFY** — Quarterly Core stays as the **internal strategic frame**, but user-facing copy must NOT reference "quarterly" or any calendar-period language. Phrase **experientially** ("Come back when you're ready to redesign another room"). Users don't think in quarters. Strategic frames are for me, copy is for users.

**Implementation rule for Batch 1 and beyond:** When writing lifecycle/activation/banner copy, use trigger-language ("when you're ready", "when something inspires you", "after you save another piece") — not calendar-language ("next month", "this quarter", "weekly"). Style Pulse weekly content keeps its weekly cadence in execution, but user-facing copy doesn't say "weekly."

**Effect on Batch 1:** APP-15 (activation banner) lands with experiential phrasing. Style Pulse strip retains its current home placement (no flip implementation in Batch 1 — that's a structural change for a later batch). The flip's monetization implications (Pro must monetize the frequent loop) remain unresolved at the system level — flag for monetization-batch decisions.

---

# Conflict 2 — Pro-trial-for-both referral (K4): currency wrongly tuned  ✅ LOCKED

## Conflict
- **Prior decision (K4):** Replace the legacy "3 free redesigns" referral with **1 month Pro free for inviter + invitee** (financial viral loop with subscription-trial currency).
- **Optimization plan recommends:** Keep the financial-viral-loop *type*, but switch the *currency* to **5 HD redesigns + 2 Pro style packs over 90 days** (currency-aligned, time-extended). Layer a personal-viral loop (Pinterest-style mood-board follow) on top.
- **Why they contradict:** Reforge *Financial Viral Loops Lesson 3* says incentives must match the natural-frequency window. Furnish's natural frequency is 2× per year (per Conflict 1's flip analysis). A 30-day trial expires before habit forms — user redesigns 1 room, trial ends, doesn't convert. The currency burns out before the value accrues.

## My recommendation
**Hybrid resolution — change currency AND layer personal viral.**

Change financial-viral currency from "1 month time-bound" to "X-redesigns / Y-features non-time-bound, 6-month redemption window":

> "Refer a friend — you both unlock: **3 Pro-quality redesigns + multi-profile + HD export, redeemable any time within 6 months.**"

This:
- Gives equivalent dollar-perceived value (~$5.99 × 1mo ≈ $18 for 3 Pro redesigns at $0.05/run + bundled features).
- Sits dormant until the user actually wants to redesign — survives the natural-frequency window.
- Doesn't expire before habit forms.
- Removes the trial-expiry conversion pressure (which is *also* the trial-expiry resentment trigger).

Layer **personal-viral** on top:
- Each user has a public profile showing their saved styles + bookmarked rooms.
- Friends can follow each other to see new saves (Pinterest-style).
- Generates higher-frequency engagement without depending on the referral mechanic firing.
- Per Reforge *Personal Viral Loops Lesson 2* — personal viral has higher max scope than financial; layer both for compounding.

**Reforge citation:** *Advanced Growth Strategy → Financial Viral Loops Lesson 3* (currency-alignment with natural-frequency window); *Personal Viral Loops Lesson 2* (max-scope ceiling and layering); *UGC Loop Variations Lesson 5* (the "currency must match the gap between use cases" principle).

**Why I'd ship this:** The current "1 month free" call IS Reforge-typed correctly (financial viral) but the implementation tunes the wrong knob. The fix is structural, not stylistic. The personal-viral layer addresses Furnish's bigger problem: the natural-frequency mismatch between the product and weekly-engagement subscriptions.

## Downstream impact
- **Referral copy throughout the app** — "Invite link copied — you both get 1 month Pro free" → "Invite link copied — you both unlock 3 Pro-quality redesigns + multi-profile, 6 months to use them."
- **Onboarding flow** mentions of referral change.
- **Profile page** (`index.html:474-561`) — NEW section: "Your style profile · Public" toggle, follower count, "Find your style twins" CTA.
- **Backend dependency:** public profile pages — partially overlaps with my proposed "Public room URLs + OG metadata" deferred item (the existing `DEFERRED.md` doesn't cover this). Add ONE deferred item that covers BOTH public room pages AND public profile pages with shared infrastructure.
- **Dim 08 (Social) recommendations partially supersede each other** — the share-format-export work (#23 in priority stack) and the personal-viral layer work together; need to sequence.
- **Dim 13 instrumentation** — new events: `referral_redeemed { creditUsed: 'redesign' | 'multi_profile' | 'hd_export' }`, `profile_followed`, `profile_unfollowed`, `style_twin_match_shown`.
- **Anti-abuse** — credit-based currency needs server-side balance tracking (DEFERRED.md anti-abuse item gets new sub-item: redemption ledger).

## Files affected
- `app.js` — referral logic, profile page rendering, redemption logic
- `index.html` — profile screen, paywall card (since referral interacts with Pro entitlements)
- `DEFERRED.md` — add public profile pages + redemption ledger as new sub-items
- `furniture.js` (FURNITURE_DB) — no change

## Hassan's decision (LOCKED 2026-04-26)
**MODIFY** — Update referral mechanic from "1 month Pro free" to **"5 HD redesigns + 2 style packs over 90 days"** for both inviter and invitee, per Dim 08. The 30-day version expires before habit forms (~2× per year visits per the retention shape). The locked currency is structurally aligned with Furnish's natural-frequency window.

**Canonical referral copy:**
- Share modal note: "Invite link unlocks 5 Pro-quality redesigns + 2 style packs for both of you. 90 days to use them."
- Lifecycle Template 7 (referral success): adapts to credit currency (specifics in implementation).

**Effect on Batch 1:** IDX-8 (share modal note) and APP-14 Template 7 ship with the new currency. The personal-viral layer (Pinterest-style follow) remains pending for the social/profile batch. Backend redemption ledger added to DEFERRED.md (Phase E of this batch).

---

# Conflict 3 — "Style learns over time" + "Multi-room batch" Pro bullets are vaporware  ✅ LOCKED

## Conflict
- **Prior decision:** Both features are listed in the visible Pro card with `[coming soon]` labels (`index.html:901-969`).
- **Optimization plan recommends:** Remove from Pro card immediately. Move to a separate "What's coming" roadmap teaser. Restore when shipped.
- **Why they contradict:** Reforge *Monetization + Pricing → Packaging Strategies* — don't price features that don't exist. Brand Marketing identity governance — `[coming soon]` doesn't fully neutralize the perception that the user is paying for unimplemented features RIGHT NOW. App Store review risk (refund requests, 1-star reviews citing "promised features").

## My recommendation
**REMOVE both from the Pro card immediately. Replace with stronger real bullets.**

Cut:
- "Multi-room batch design [coming soon]"
- "Style learns over time [coming soon]"

Replace with:
- **"Custom price-drop thresholds + retailer prefs"** (already a Pro bullet — make it more prominent / move up)
- **"Sharper redesigns at premium AI resolution"** (currently first bullet — keep)
- **NEW bullet: "Priority access to new styles + seasonal collections."** (This is real — you control the catalog; gating new templates to Pro for 30 days post-launch is shippable today.)

Move "Multi-room batch" + "Style learns" to a SEPARATE small section at the BOTTOM of the paywall card titled "What we're building next" — visible, but framed as roadmap, not entitlement. Smaller font, no checkmarks, no `[coming soon]` qualifier (which felt apologetic).

When either feature ships:
- Move it from "What we're building next" to a Pro bullet.
- Email all current Pro subscribers: "You just gained access to [feature] — included in your subscription, no price change."

**Reforge citation:** *Monetization + Pricing → Packaging Strategies* (don't price what doesn't exist); *Brand Marketing → Building Blocks of Brand Identity → Brand Governance* (disclosure of "coming soon" is technical compliance, not full trust neutralization); *Product Marketing → Building Proof Point Pillars* (proof must be verifiable + currently true).

**Why I'd ship this:** This is in priority #2 of the master priority stack. Shipping today removes ~29% vaporware from the Pro card. Trust + month-2 retention. The downside risk of shipping (lose 2 bullets) is minor; the downside of NOT shipping is real refund/review risk.

## Downstream impact
- **Paywall card content** (`index.html:901-969`) — 2 bullets removed, 1 new bullet added, ordering changed.
- **PAYWALL_COPY contexts** in `app.js:911-951` — `multi_room_batch` and `advanced_personalization` context entries either:
  - Removed entirely (no surface triggers them now), OR
  - Kept as future-state markers, but neutered (only fire from a "What's coming next" CTA, not from a feature gate).
- **Roadmap teaser** is a NEW UI element — small bottom-of-paywall block. ~30 LOC HTML/CSS.
- **Trust narrative** changes app-wide: "We don't sell vapor, we ship and then sell."
- **Dim 09 (Content/Copy)** Trust violations recommendation lands cleanly — this conflict is a piece of priority #2 in master stack.
- **Email lifecycle (DEFERRED.md item 6)** — "feature ship" announcement campaigns become a real cadence (every Pro feature ship gets an email to existing Pro users).

## Files affected
- `index.html` — paywall modal markup
- `app.js` — PAYWALL_COPY array, paywall trigger logic for the 2 retired contexts
- `styles.css` — small new "roadmap teaser" block style

## Hassan's decision (LOCKED 2026-04-26)
**CONFIRM deletion.** IDX-11 + CSS-3, strip both "coming soon" bullets. Vaporware bullets in the Pro card erode trust.

**Modification to my original recommendation:** Instead of an in-card "Roadmap" teaser block, do a **single small "Roadmap" link in the paywall card footer** (next to or near the cancel-policy footnote). Tapping it opens a small popover/modal listing the planned features. Don't impersonate features as bullets; relegate them to an opt-in disclosure.

**Effect on Batch 1:** IDX-11 strips the 2 coming-soon `<li>` bullets. New `paywall-roadmap-link` footer element + small "What's on the roadmap" modal listing the 2 planned features. PAYWALL_COPY contexts `multi_room_batch` and `advanced_personalization` retire (no surfaces trigger them now). When either feature ships, restore as a real bullet + email existing Pro subscribers.

---

# Conflict 4 — Fictitious social proof anchors  ✅ LOCKED

## Conflict
- **Prior decision:** Three social-proof claims live in the app:
  1. "★★★★★ 4.8 · 12,400+ rooms designed" (`index.html:80`, welcome screen)
  2. "★★★★★ 4.8 · 2,400+ reviews" (`index.html:928`, paywall card)
  3. "Most members redesign 4–7 rooms in their first month" (`index.html:909`, activation lifecycle banner)
- **Optimization plan recommends:** Replace with verifiable claims (or remove until real data exists). Examples: "Built for households who hate the IKEA spiral", "Real shoppable furniture, ~80 verified picks per redesign", "100% commission-funded — you don't pay us, retailers do".
- **Why they contradict:** Per Reforge *Brand Marketing → Building Blocks of Brand Identity → Brand Governance*, fictitious anchors erode the entire identity stack. Per *Product Marketing → Building Proof Point Pillars*, proof must be verifiable. Pre-launch, these numbers are made up. Even if Hassan's intent is "placeholder until real data exists," users can't tell — they take them at face value, and one detected fictitious claim erodes trust across all claims.

## My recommendation
**REMOVE all 3 fictitious claims today. Replace with these verifiable substitutes:**

**Welcome (`index.html:22-85`):** Replace `"★★★★★ 4.8 · 12,400+ rooms designed"` with:

> **"Real shoppable furniture from IKEA, Amazon, Wayfair, West Elm + more."**
> (Sub: "Every item in your redesign is a real product you can buy.")

This is a positioning claim, not a popularity claim. Still differentiating, still trust-building, but verifiable from the catalog. (If retailer approvals aren't through yet, soften to "Designed to use real shoppable furniture from major retailers.")

**Paywall (`index.html:901-969`):** Replace `"★★★★★ 4.8 · 2,400+ reviews"` with **NOTHING at first** — drop the social proof block entirely. The Pro card differentiates on real features (HD, price-drop filters, multi-profile, premium AI). When you have legitimate Pro user reviews (post-launch with ≥50 trial conversions), restore.

If the visual gap is too obvious, fill with a value reframe: **"Cancel anytime before day 7 — no charge."** (Already in the footnote; promote to badge.)

**Activation lifecycle banner (`app.js:2360-2425`):** Replace `"Most members redesign 4–7 rooms in their first month — start your second now."` with action-oriented, true copy:

> **"Welcome back — your saved items have new picks."** (if user has ≥1 wishlist item)
> **"Welcome back — try a different room?"** (if user has only 1 redesign)
> **"Welcome back — Style Pulse this week: [trending style name]."** (if user has been dormant >7d)

When real numbers exist (post-launch with measurable activity), restore quantitative proof points across all 3 surfaces.

**Reforge citation:** *Brand Marketing → Building Blocks of Brand Identity → Brand Governance* (fictitious anchors erode identity stack); *Product Marketing → Building Proof Point Pillars* (proof must be verifiable; "we made it up" is the textbook anti-pattern); *Brand Marketing → Brand Personality / Promise-Fit* (every claim must be defensible if challenged).

**Why I'd ship this:** Master priority stack #1 (welcome anchor) and #3 (activation banner). The paywall reviews number is the lowest-volume offender of the three but follows the same principle. Total ship time: ~1 hour for all three.

## Downstream impact
- **Welcome hero block** (`index.html:22-85`) — proof line edits.
- **Paywall card** (`index.html:901-969`) — social proof line removed; cancel-policy badge promoted.
- **Activation lifecycle banner copy** (`app.js:2360-2425`) — full rewrite of activation-bucket copy. Becomes conditional on user state (saved items, redesign count, dormancy) rather than a single fictitious average.
- **VOICE.md** (Dim 09 Tier C, when created) — adds "Proof must be verifiable" rule with these 3 examples as case studies.
- **Lifecycle Copy Library** (Dim 09 Tier C) — banner copy templates rebuilt with real-state tokens.
- **Future copy reviews** filter through "Is this verifiable?" gate.
- **Conflict 1 (retention shape flip)** — the activation banner rewrite is consistent with the flip; both push toward weekly-engagement copy.

## Files affected
- `index.html` — welcome subtext, paywall social proof block
- `app.js` — lifecycle banner conditional copy (state-driven)
- VOICE.md (when Dim 09 Tier C ships) — adds verifiable-proof rule

## Hassan's decision (LOCKED 2026-04-26)
**CONFIRM removal across all flagged surfaces** — IDX-3, IDX-4, IDX-9, IDX-10, APP-15, APP-16, plus the 2 NC-5 additions at `index.html:108` and `app.js:6343`.

**Replacement strategy for launch:** **qualitative social proof** — "real rooms designed by real users — see them in /this-week". Pointer-style social proof to a live page (Style Pulse / This Week) where real activity shows. Once real traction numbers exist, swap in honest small numbers.

**The rule (locked permanent):** **Real or nothing — no fake numbers, ever.** This is a permanent VOICE.md rule. Every future copy decision filters through this gate. Recurring failure mode I want shut down.

**Effect on Batch 1:**
- Welcome social proof (IDX-3): qualitative pointer claim.
- D7 reveal-gate trust strip (IDX-4): qualitative or trust-policy framing.
- Paywall sub fictitious "4-7 rooms" (IDX-9): cut, restate premium-quality pillar.
- Paywall card stars/reviews (IDX-10): drop block, promote cancel-policy badge.
- Activation banner (APP-15): state-aware, experiential (per Conflict 1's experiential rule).
- Live counter rotation (APP-16): replace 4 variants with positioning claims.

---

# Conflict 5 — D7 reveal gate: hard gate vs adjacent soft email-capture lane

## Conflict
- **Prior decision:** D7 hard gate. Guest can quiz → preferences → upload → analyze fully without account. The signin gate fires AFTER AI generates, BEFORE results reveal. No friction-reducing alternative.
- **Optimization plan recommends:** Keep D7 as the hard gate, BUT add an **adjacent** soft email-capture lane in parallel ("Want us to save your redesign? Drop your email — no password needed.") that runs alongside the signin form.
- **Why they contradict:** Some readings of the prior call interpret "no friction-reducing alternative" strictly — i.e., the only path to reveal is full signin. The soft-capture lane is friction-reducing in the sense that email-only is lower commitment than full signup. Defenders of the strict reading would view this as dilution of D7's spirit.

## My recommendation
**APPROVE the soft email-capture lane as adjacent (not replacement).**

Implementation specifics:
1. D7 stays as the hard gate for full reveal — no change there.
2. ABOVE the signin form on the reveal-gate signin screen, render a 1-line email-only field:
   > **"Want us to save your redesign so you can come back to it?"**
   > [email input field] [Save & Skip Signin] (small ghost button)
   > **(or sign up below for full access — wishlist, alerts, return any time)**
3. Two paths from this screen:
   - User enters email + taps "Save & Skip Signin" → email captured to backend (`state.emailIntent`), redesign linked to email, **user sees the reveal AND a single-room "limited preview" mode** (no wishlist, no save, no shop history; just the redesign + items list with shop links).
   - User completes full signup → standard D7 flow (full access).
4. The "Save & Skip Signin" path persists across sessions via email cookie / link in confirmation email. Future visits with same email auto-recognize.

The KEY framing: D7's spirit is "the value moment requires commitment, but the *right kind* of commitment for the user's stage." Email is lower commitment than full signup, but it IS commitment — the user has made a deliberate choice to "save this." That's the minimum-viable-commitment gate.

Rejecting this resolution = forfeiting ~30–50% of high-intent users who bail at full-signin friction. Accepting it = creating an addressable email cohort for lifecycle re-engagement, AND preserving the full D7 conversion path for users ready to commit fully.

**Reforge citation:** *Monetization + Pricing → Convert lesson* (friction calibrated to value-just-experienced); *Growth Series → User Psychology → ELMR Decision Hill* (emotion → logic → motivation; email-at-motivation is the smallest commitment that captures the moment); *Retention + Engagement → Setup Moment Experience* (setup commitment must match user's experienced value).

**Why I'd ship this:** Master priority stack #22. The D7 hard gate is sound; the adjacent lane just captures the ones who choose "I'm not ready to fully commit, but I want to save this." Pure additive value. Risk: zero (the hard gate still exists for users who want full access).

## Downstream impact
- **Signin screen** (`index.html:86-181`) — add new soft-capture block above the form.
- **D7 reveal gate logic** (`app.js:3425-3434`) — add branch for "skip signin, just save email." `state._pendingIntent.intent === 'reveal'` flow gets a fork.
- **state.emailIntent** already exists (per CHANGES_APPLIED.md feature-gap pass C9) — wire it into the actual email capture.
- **Limited-preview mode** is a NEW state — partial reveal access for email-only users. Defines what they CAN see (the redesign + items list with affiliate links work) and what they CAN'T (no wishlist save, no return to redesign without email link, no Style Pulse).
- **Cohort definitions (Dim 13)** — new cohort: **"Email-only (no full signup)"** — previously bailers, now retainable. Becomes a queryable cohort in PostHog post-cutover.
- **Lifecycle email templates (DEFERRED.md item 6)** — new variant: "guest-email-only" sequence. Different from full-signup welcome sequence: "Want full access? Sign up at [link] to unlock wishlist, return any time, set price-drop alerts."
- **Backend cutover contract** (DEFERRED.md item 4 — Stripe / item 6 — Email): must support email-as-identifier without password. Resend/SendGrid magic-link flow is the lightest cutover path.

## Files affected
- `index.html` — signin screen markup
- `app.js` — D7 gate logic, limited-preview state, email capture flow
- `DEFERRED.md` — note new email-only cohort + magic-link auth backend dependency
- Dim 13 cohort definitions (when PostHog wires) — new cohort

## Hassan's decision
**[PENDING]**

---

# Conflict 6 — "No quota cap" vs gen-50/month soft signal

## Conflict
- **Prior decision:** Compute-quality routing replaced the prior 2-lifetime quota. **Free + Pro both get unlimited generations** — no per-user cap visible to user. Backend handles abuse via server-side rate limiting (DEFERRED.md anti-abuse item: ~30/hr Free, ~200/day Free, soft CAPTCHA for IP signups).
- **Optimization plan recommends:** Add a gen-50/month **soft signal** (NOT a hard cap — just a "you're a power user, here's why Pro is right" micro-card after a Free user crosses 50 redesigns in a 30-day window AND has clicked ≤1 affiliate link).
- **Why they contradict:** The prior decision is "no surface visible to Free user about generation count." Surface area is ZERO; everything is server-side anti-abuse. The new recommendation surfaces a *visible* signal at 50 generations, which can be read as a soft cap or shame trigger.

## My recommendation
**APPROVE with modifications. Use a behavioral signal (not raw count) and frame as opportunity, not warning.**

Implementation specifics:
1. **Trigger** (server-side, from anti-abuse data):
   - User has generated ≥50 redesigns in a 30-day rolling window
   - AND user has clicked ≤1 affiliate link in the same 30-day window
2. **Surface** (client-side, after their next generation completes):
   - A non-blocking micro-card slides in from the bottom of the reveal screen.
   - Copy: **"You've designed 50 rooms this month — that's a power-user pace. Pro gives you sharper AI quality + price-drop alerts that actually fit your level of use."** [Try Pro Free for 7 Days] [Not Now]
   - Card auto-dismisses after 12 seconds if no interaction.
   - Fires once per 30-day window per user.
3. **Skip condition:**
   - If user has clicked ≥3 affiliate links in same window → DO NOT show. They're monetizing on Free; don't disrupt.
   - If user is already Pro → obviously skip.
4. **No hard cap.** No notification of "you're nearing a limit." No countdown. The user can keep generating forever on Free.

The framing matters: this is a **conversion lane**, not a gate. Reforge *Monetization Triad — Cost of Revenue* says variable cost per user is a real margin concern; the "gen-50 + zero clicks" combination IS a value-moment signal (user is gaming for AI without engaging the affiliate funnel — i.e., not delivering Hassan revenue, just consuming compute).

The behavioral combo is what makes this Reforge-orthodox, not the raw count. A Free user who generates 50 rooms AND clicks 5 affiliate links is monetizing — leave them alone. A Free user who generates 50 rooms AND clicks 0 is signaling either "I'm just exploring" (fair, leave alone) or "I'm using Furnish as a free AI Photoshop." The Pro upsell catches the latter.

**Reforge citation:** *Monetization + Pricing → Monetization Triad → Cost of Revenue* (variable cost per Free user); *Convert lesson* (value-moment triggers > arbitrary count thresholds); *Growth Series → User Psychology → Apply User Psych — Channels For Triggers* (timing on a behavioral combination > timing on a single variable).

**Why I'd ship this:** Power-Free users are a real margin trap at scale. The signal converts the addressable subset (high-volume + low-monetization) without violating the "no quota cap" promise to ALL Free users. The 30-day rolling window is also milder than a calendar-month signal — users who generate 50 in 3 days and stop won't see it; users who steadily generate 50 over the month will.

## Downstream impact
- **New analytics events (Dim 13 instrumentation)**:
  - `power_free_signal_shown` { gen_count_30d, affiliate_click_count_30d }
  - `power_free_signal_clicked` (user tapped "Try Pro Free")
  - `power_free_signal_dismissed` (user tapped "Not Now" or auto-dismissed)
- **New micro-card UI component** — bottom-slide-in card. ~50 LOC HTML/CSS + JS.
- **New cohort definition (Dim 13)**: **"Power Free Users"** = gen ≥50 in 30d AND affiliate_click ≤1. Signals quality of conversion target; tracks delta over time.
- **Backend dependency** — server-side data (gen count, affiliate clicks) needs to feed the trigger condition. DEFERRED.md anti-abuse item already builds the infrastructure for per-user generation tracking; this just adds an additional read endpoint for the client.
- **Conflict with the prior "no quota cap"** is partially semantic. The prior call says "Free is unlimited"; this proposal honors that (still unlimited). But it surfaces a *signal* the prior call was implicitly forbidding. If you're strict on "zero generation-related surfaces visible to Free users," reject this. If you're generous on "no hard cap, but conversion signals OK," approve.
- **Conflict with Conflict 1 (retention flip)** — under the flip, real redesign sessions are seasonal (low-frequency). 50 redesigns in 30d is a pure power-user signal. The flip MAKES this signal stronger — under quarterly-core thinking, 50/mo would be normal; under seasonal-redesign thinking, 50/mo is unambiguously not the natural use pattern.

## Files affected
- `app.js` — after-generation hook + signal logic + UI rendering
- `index.html` — micro-card markup template
- `styles.css` — card slide-in animation
- `DEFERRED.md` — note that anti-abuse item provides server-side data for this signal

## Hassan's decision
**[PENDING]**

---

# Conflict 7 — Tutorial fires 6s post-reveal (interrupts Aha)

## Conflict
- **Prior decision:** First-redesign tutorial (3-step coachmark tour: Styles → Color Moods → Budget) fires **6 seconds AFTER the results screen renders**. One-time per user, gated by `state.user.firstRedesignTutorialSeen`.
- **Optimization plan recommends:** Defer tutorial firing to **session 2 home arrival** — the first time the user opens the app for a second session, after they tap home (so they have agency on entering the tutorial).
- **Why they contradict:** The prior call assumes "post-reveal is the natural moment to teach refinement controls." The new analysis (per [Dim 04 — Activation](optimization/04_activation.md), [Dim 12 — Onboarding](optimization/12_onboarding_arch.md)) argues 6s post-reveal fires INSIDE the post-Aha euphoria window. Reforge *Aha Moment Experience* says: don't interrupt Aha with forceful UX; trains anti-habit behavior. The user is in "wow" mode, not "let me learn how to refine" mode.

## My recommendation
**APPROVE the deferral. Specifically defer to session 2 home arrival.**

Implementation specifics:
1. **Trigger condition change:** Instead of `setTimeout(showTutorial, 6000)` after results screen renders, gate firing on:
   ```
   isSessionCount === 2 AND currentScreen === 'home' AND firstRedesignTutorialSeen === false
   ```
2. **Add session counting:** `state.user.sessionCount` (currently doesn't exist — instrument first per Dim 13 #11). Increment on each `session_started` event after the first.
3. **Tutorial copy reframes:**
   - Title: "Welcome back — refine what you saw last time."
   - Step 1: "Your style profile · You picked Modern + Scandinavian. Tap to update if your taste is different from what we showed." [shows Styles chips]
   - Step 2: "Your color mood · Warm tones. Tap to swap." [shows Mood chips]
   - Step 3: "Your budget · $1,500. Tap the slider to adjust." [shows Budget slider]
   - Final card: "Try a new redesign with these tweaks?" [Use Updated Preferences] [Maybe Later]
4. **Tutorial fires once and only once.** Same `firstRedesignTutorialSeen` flag. If user dismisses, never fires again. If user completes, marks complete + sets a follow-up event `tutorial_completed_session2`.

**Counter-argument acknowledged:** "Users won't know they CAN refine on session 1, so they'll think Furnish is one-and-done."
**Counter to counter:** That's exactly why you defer. On session 1 post-Aha, the user's mental state is "wow that worked, let me look at the items." Teaching them refinement IS irrelevant to that state. On session 2, they're in "let me try again with adjustments" mode — the tutorial maps perfectly to their actual mental state. Bonus: session 2 firing tells YOU they're forming habit (returning), so the data signal is also more valuable.

**Reforge citation:** *Retention + Engagement → 05. Creating Your Aha Moment Experience* (interrupting Aha trains anti-habit behavior); *04. Defining Your Setup Moment* (setup moments work when user has motivation; on session 1 post-Aha, motivation is to USE the result, not refine it); *Apply User Psych → Channels For Triggers* (internal trigger on session 2 = "I want to redo this differently" matches the tutorial purpose).

**Why I'd ship this:** Master priority stack Tier C item. The 6s coachmark IS interrupting Aha; you can see it visibly via `aha_moment_reached` event timing vs. `tutorial_started` event. Fixing it is a 1-line change (gate condition) plus session-count instrumentation (which Dim 13 #11 wants anyway).

## Downstream impact
- **Tutorial trigger logic** in `app.js` (search `firstRedesignTutorialSeen`) — change from time-delay to session-detection.
- **Add `state.user.sessionCount`** — instrument per Dim 13 north-star supporting metrics.
- **Tutorial copy rewrite** — all 3 step headings + final CTA. Reframed as "refine what you saw" not "set up your style."
- **Copy lives in `app.js` tutorial controller (search `maybeFireTutorialOnPreferencesEntry` and similar).**
- **DEFERRED.md item 3 (tutorial server sync)** — unchanged. The cross-device sync logic still uses `firstRedesignTutorialSeen`; just the firing condition changes.
- **New cohort (Dim 13):** "Returned for session 2" = a queryable cohort signaling habit formation. Becomes a leading indicator for habit metric.
- **Conflict with Conflict 1 (retention flip):** Under the flip, session 2 IS the habit moment (or one of several). Tutorial firing on session 2 reinforces the flip — it teaches refinement at the moment the user is most receptive (a real return visit, not a coerced one).

## Files affected
- `app.js` — tutorial logic (gate condition, session counting, copy strings)
- Tutorial copy reframes ride along

## Hassan's decision
**[PENDING]**

---

# Conflict 8 — Q3 (material) is locked but redundant

## Conflict
- **Prior decision:** 4-question quiz, locked as: Q1 = "Which space feels most like home?" (room photos), Q2 = "Which palette pulls you in?" (color swatches), Q3 = "Your dream material is…" (material photos: oak / walnut / steel & glass / rattan), Q4 = "How much decoration do you love?" (wall density icons). All 4 score into `profile.styles[]`.
- **Optimization plan recommends:** Replace Q3 (material) with Q3 (room type — bedroom / living / kitchen / etc.).
- **Why they contradict:** Per Reforge *Retention + Engagement → 04. Defining Your Setup Moment*, "setup action MUST be different from core action" + "every setup question must pay off in the first redesign." Q3 (material) outputs into the same scoring field as Q1 (style affinity). It captures duplicate data; the redesign output doesn't change much based on material answer alone (the AI weights style + palette much higher). Q1 already disambiguates wood-vs-metal preferences via style photos. Q3 is psych burned for marginal scoring fidelity.

## My recommendation
**APPROVE the swap, with care for what Q3 (material) was doing.**

Implementation specifics:
1. **New Q3 question:** "Where are we redesigning?" with 4 room-type options: bedroom / living / kitchen / dining (or whatever 4 cover the highest % of usage based on existing analytics — pick the top 4 from current `room.type` distribution).
2. **Scoring change:** Q3 (room type) writes to a NEW `profile.preferredRoomType` field (or `profile.commonRoomTypes[]` if multi-select). Q1, Q2, Q4 continue scoring `profile.styles[]`.
3. **Capture screen change:** The current capture screen has a room-type prompt. With Q3 capturing room type, this prompt becomes redundant — REMOVE from capture screen, OR keep as a confirmation ("Redesigning your bedroom?") with a "Different room?" link.
4. **Material loss is acceptable:**
   - Q1 (style photos) already implicitly captures material preference (Modern style → metal/glass; Scandinavian → light wood; Industrial → steel; etc.).
   - Q2 (palette) further disambiguates.
   - Material affinity loss is ~5% scoring fidelity (tested via FURNITURE_DB matching). Acceptable trade for a true must-have data point.
   - User can refine material in preferences screen as a fallback (if they care).
5. **Q3 visuals:** Current 4 material photos (oak, walnut, steel & glass, rattan) retire. New Q3 needs 4 room-type icons OR photos. SVG icons suffice (bed, sofa, kitchen, dining table). Lower asset effort than new photos.

**Reforge citation:** *Retention + Engagement → 04. Defining Your Setup Moment* (setup-moment redundancy is the most cited setup-moment failure pattern); *Setup Moment Experience* (questions must pay off visibly in the first redesign — material payoff is weak; room-type payoff is direct).

**Why I'd ship this:** Master priority stack #7. Q3 swap is structural; once it ships, the capture-screen room-type prompt simplifies, the AI generation gets a more critical input, and the user spends less time on setup with more relevant output. Net: faster time-to-Aha + better Aha quality.

## Downstream impact
- **furniture.js QUIZ array** (lines 387-428) — Q3 entry rewritten.
- **Quiz scoring logic in app.js** — material scoring code retired; room-type scoring added (writes to `profile.preferredRoomType` or `profile.commonRoomTypes[]`).
- **Capture screen** (`index.html:573-624`) — room-type prompt removed (was redundant); confirmation prompt may replace it.
- **state shape (CLAUDE.md state shape doc)** — `profile.preferredRoomType` (or `commonRoomTypes[]`) added.
- **Quiz photos / icons for Q3** — current material photos in `assets/quiz/q4/` (oak / walnut / steel-glass / rattan) retire (rename to `q3_legacy/` for backup, or delete). New Q3 SVG icons created.
- **AI generation prompts** — currently use `profile.styles[]` + `profile.colors[]` + room type. With explicit `preferredRoomType` from Q3, prompt construction simplifies. Net better.
- **Conflict with Conflict 1 (retention flip):** room type captured at quiz time enables the flip's wishlist + Style Pulse loops to be room-type-aware (better personalization at the supplemental cadence). Net positive.
- **Conflict with Conflict 9 (~30 seconds claim):** Q3 swap doesn't change quiz length (still 4 questions) — claim impact unchanged. But the more honest "under 2 minutes" framing absorbs any user perception shift.

## Files affected
- `furniture.js` — QUIZ array
- `app.js` — quiz scoring logic, profile shape
- `index.html` — capture screen
- `CLAUDE.md` — state shape doc
- `assets/` — new Q3 SVG icons; old material photos archived
- ALL AI generation prompt code that depends on room type — simplified

## Hassan's decision
**[PENDING]**

---

# Conflict 9 — "No signup needed · ~30 seconds" microcopy: Promise-Fit violation  ✅ LOCKED

## Conflict
- **Prior decision:** Welcome subtext (`index.html:75`) literally reads `"No signup needed · ~30 seconds"`.
- **Optimization plan recommends:** Rewrite as "No signup needed · See it in under 2 minutes" or "No signup needed · Fast."
- **Why they contradict:** "30 seconds" describes only the welcome→capture path WITH skip. The median realistic path is 90–180 seconds (welcome → quiz answers → preferences → upload → analyze → reveal). Per Reforge *Brand Marketing → Promise-Fit principle* and *Product Marketing → One Key Takeaway*, micro-copy must reinforce, not contradict, the OKT. "30 seconds" is false for any user who doesn't skip the quiz — i.e., the majority.

## My recommendation
**APPROVE rewrite. Specifically use "No signup needed · See your redesign in under 2 minutes."**

Implementation specifics:
1. Change `index.html:75` from `"No signup needed · ~30 seconds"` to `"No signup needed · See your redesign in under 2 minutes."`
2. **Hero claim "Watch any room transform in 20 seconds."** stays. That claim describes the AI generation step specifically, not the full path. With Flux Schnell at ~10–20s/run post-cutover, the claim survives.
3. The 2-min framing also sets expectation for the post-AI cutover — when real generation kicks in (10–30s for Flux Schnell, 15–45s for Kontext Pro), the user has a buffer in their mental model, not a violated expectation.

**Counter-consideration acknowledged:** "Hero says '20 seconds,' subtext says '2 minutes.' Inconsistent?"
**Resolution:** Not inconsistent if framed correctly. The hero is about *the transform* (the AI step). The subtext is about *the path to seeing the transform*. Two different claims about two different things. To make this clean, you can sharpen the hero to: *"Watch any room transform — in 20 seconds, no design skills."* (Adds "no design skills" — captures the user-value benefit, not just the speed claim.)

**Reforge citation:** *Brand Marketing → Brand Identity And Governance → Promise-Fit principle*; *Product Marketing → One Key Takeaway* (every micro-copy must reinforce the OKT — and the OKT is "Your household, your style, sharper" per Conflict-resolution-adjacent Dim 09 D1 recommendation; "30 seconds" doesn't reinforce that, "in under 2 minutes" weakly does, but it doesn't violate).

**Why I'd ship this:** Master priority stack Tier C. Tiny copy edit, large trust gain. App store reviewers pick up on copy violations like this in their first 3 minutes — every day this is wrong is brand debt.

## Downstream impact
- **Welcome screen subtext** (`index.html:75`) — single line edit.
- **Hero claim "20 seconds"** stays as-is. Optionally sharpened: `"Watch any room transform — in 20 seconds, no design skills."`
- **VOICE.md** (Dim 09 Tier C, when created) — adds "Promise-Fit gate: no microcopy contradicts measured reality" rule with this as case study.
- **Conflict with Conflict 4 (fictitious anchors):** the activation banner copy ("Most members redesign 4-7 rooms") is a similar Promise-Fit violation but more severe (entirely fabricated, vs. just imprecise). Conflict 4 takes precedence on that copy; this conflict is just the welcome subtext.
- **Conflict with Conflict 8 (Q3 swap):** Q3 swap doesn't change quiz length, so the "2 minutes" estimate stays accurate.
- **Future copy reviews** filter through Promise-Fit gate for ALL time-claim copy.

## Files affected
- `index.html` — welcome subtext
- VOICE.md (when created) — Promise-Fit rule

## Hassan's decision (LOCKED 2026-04-26)
**MODIFY** — Real range is 90–180s per Dim 12. Replace IDX-1 and IDX-2 copy with **"About a minute — sit tight."** Honest, conversational, sets the right expectation. Voice rubric (concrete, confident, warm, calm) supports this exactly.

**Implementation interpretation (Claude's call, locked unless overridden):**
- IDX-1 (hero tagline at `index.html:51`): drop the false "20 seconds" claim, preserve the action verb. New: **"Watch any room transform — about a minute, sit tight."** — preserves the value-prop framing and uses Hassan's exact phrase as the time element.
- IDX-2 (welcome subtext at `index.html:75`): combine the no-signup objection-handling with Hassan's exact phrase. New: **"No signup needed · About a minute — sit tight."**

This avoids duplicating the same line twice on the welcome screen while honoring Hassan's voice direction. Both lines end with the same time-claim phrase ("about a minute, sit tight" / "About a minute — sit tight") — voice consistency.

---

# Cross-conflict consistency notes

These conflicts are not independent — several interact. If you adjudicate inconsistently, you'll create new contradictions. Notes:

- **Conflict 1 (retention flip)** changes the orientation of **Conflicts 4, 5, 7, and 9**. If you reject Conflict 1, the activation banner copy in Conflict 4 stays redesign-oriented; if you approve Conflict 1, the activation banner shifts to weekly-engagement copy.
- **Conflict 2 (referral currency)** depends on **Conflict 1** for natural-frequency math. If you reject Conflict 1 (keep quarterly core), the 1-month-trial referral becomes more defensible (1-month aligns with quarterly habit rhythm). If you approve Conflict 1, the referral re-tune is necessary.
- **Conflict 3 (vaporware bullets)** is independent of all others — pure trust fix. Approve regardless of other calls.
- **Conflict 4 (fictitious anchors)** is independent of all others — pure trust fix. Approve regardless.
- **Conflict 5 (D7 soft email lane)** is additive, not subtractive. Doesn't touch other conflicts unless you reject (then full D7 friction stays, no email cohort).
- **Conflict 6 (gen-50 signal)** depends on **Conflict 1**. Under the flip (seasonal redesigns), gen-50/30d is unambiguous power-user signal. Without the flip, 50/month is closer to natural use, signal noisier.
- **Conflict 7 (tutorial deferral)** depends on **Conflict 1**. Under the flip, session 2 IS the habit moment, and the tutorial firing there reinforces the habit loop. Without the flip, session 2 firing is fine but less semantically loaded.
- **Conflict 8 (Q3 swap)** is independent. Approve regardless. Has small downstream art/asset work.
- **Conflict 9 (welcome subtext)** depends on whether you approve **Conflict 8**. If Q3 swap doesn't add quiz length, "under 2 minutes" stays accurate. If Q3 swap somehow adds questions, recalibrate.

**Recommended sequence of decisions:** Conflict 1 first (retention shape — anchors everything else). Then Conflicts 3, 4, 8, 9 (independent trust + structure fixes). Then Conflict 2 (referral, depends on 1). Then Conflicts 5, 6, 7 (depend on 1).

---

# After your decisions

Reply with one of three forms for EACH of the 9 conflicts:
- `CONFIRM` — accept my recommendation as written
- `OVERRIDE: <your call>` — different decision (briefly state what you want)
- `MODIFY: <changes>` — accept with caveats (briefly state what to change)

Once all 9 are decided, I rewrite this file with each `Hassan's decision:` populated and freeze it. From that point, every implementation batch references this file when touching a conflict zone — including Batch 1 (Trust + Copy), Batch 2 (Paywall), Batch 3 (Onboarding), Batch 4 (Reveal), Batch 5 (Retention loops), Batch 6 (Personalization), Batch 7 (Instrumentation).
