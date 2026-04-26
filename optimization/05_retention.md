# 05 — Retention

**Dimension owner:** Hassan
**Frameworks invoked:** Reforge Retention + Engagement (Engagement States, Engagement Loops, Customer Retention Canvas, Natural Behavior Use Cases, Frequency Strategy, ICED Theory for Infrequent Products), Advanced Growth Strategy (Content Loops), Data For Product Managers (cohort analysis).

---

## Executive verdict (read this first)

**Furnish is an infrequent product** — it sits in Reforge's "Forgettable Zone" (natural redesign frequency: yearly to bi-annually, not quarterly). The locked decision "Quarterly Core + Weekly Supplemental" is **half right and half wrong**:

- **Quarterly Core is too aggressive.** Per Reforge's *Natural Behavior Use Cases* (Growth Series → Retention + Engagement), most consumers redesign 1-2 rooms per year, not 4. Stating the natural frequency as quarterly will make Hassan calibrate nurture (push, email, in-app) for an audience that doesn't exist. Recalibrate Core to **annual / bi-annual room redesign per active room-type**, with 9 room-types per home creating an aggregate quarterly-feeling cadence in aggregate.
- **Weekly Supplemental is correct, but undersized.** Per ICED Theory's "Expanding Touchpoints" (Retention + Engagement → Bonus: Managing Infrequent Products), the *only* lever Furnish has against the Forgettable Zone is constant-touch supplemental loops. Weekly Style Pulse + price-drop banner is the right structure, but it must do MORE work than Hassan currently has it scoped to do. Without a stronger supplemental loop, the entire retention model collapses — users will redesign one bedroom, leave, forget Furnish exists, and Hassan re-acquires them at full CAC.

**Pro-trial-for-both referral**: confirmed valid in shape (Reforge reciprocity), but **wrong in mechanic** for an infrequent product. Recommend swapping or layering with a room-share/Pinterest-style follow loop (Section A, Loop 4-5).

The rest of this document operationalizes that verdict.

---

## Section A — 5 ranked engagement loops

Per Reforge's *Frequency Strategy* (Retention + Engagement → Engagement Strategies → Using Frequency Strategy), every loop has a **trigger → action → reward → investment** structure. Reforge distinguishes three loop archetypes: **Organic** (internal cue, no nudge), **Manufactured** (we provide the cue), and **Environment** (cue placed where the user already lives).

For Furnish, the natural Organic loops are weak (because the use case is infrequent and the user rarely *internally* cues "I want to redesign"). Therefore Furnish must lean disproportionately on Manufactured + Environment loops — this is the core ICED Theory move for infrequent products (ICED p.6, "Expanding Touchpoints").

Loops are ranked by expected impact on retention metrics, not by appeal.

---

### Loop 1: Saved Item → Price Drop → Return (Manufactured, primary)

This is Furnish's **only currently-functional retention loop**. Per Reforge's *Engagement Strategies → Using Frequency Strategy* lecture, this is a textbook "Optimize Core Loop" before adding supplemental — and the price-drop banner (`app.js:2098-2174`) and the lifecycle banner (`app.js:2360-2425`) implement exactly this pattern.

- **Trigger:** Manufactured — push notification "1 of your saved pieces dropped 22%"; or the in-app price-drop banner at home top fires when user opens the app and an unread drop exists.
- **Action:** Tap notification or banner → land in-app on item sheet → "Shop" affiliate click OR add another item to wishlist.
- **Reward:** Price savings (concrete dollars), validation that saving was worth it ("good thing I saved this"), social-proof variant ("3 of your picks are under $100 today" — `welcome_d1_check_prices`).
- **Investment:** Each item saved + each price-alert toggle + each newly-saved item adds to the wishlist surface area, which compounds the rate at which a future drop will fire. Reforge calls this "investment that increases switching cost" (Engagement Strategies → Using Intensity Strategy).
- **Loop type per Reforge:** **Manufactured** (we generate the trigger via cron + push). Per ICED Theory, this is also a *Hotelling Model* play (Expanding Touchpoints p.5) — we put a trigger in the channel where the user already is (their notification tray), not where Furnish lives.
- **Furnish-specific implementation:**
  - Trigger source: `state.wishlistMeta[id].priceAtSave > current` check, fired by the future cron (DEFERRED.md: Email lifecycle / Push notification delivery).
  - Surface in-app: `renderPriceDropBanner()` `app.js:2103-2174` — banner currently sorts biggest-percent first and shows top drop + "+N more". Ship as-is.
  - Surface push: `welcome_d1_check_prices` (`app.js:2279-2283`), `mid_d14_price_watch` (`app.js:2297-2301`).
  - Pre-prompt for permission gated on first save (`maybeAskForPushPermission` `app.js:4498-4544`) — this is correct sequencing per Reforge's User Psychology course (post-investment grant rates >> pre-investment).
- **Why ranked #1:** Per *ICED Theory* (Retention + Engagement → Bonus → 4 Dimensions), infrequent products survive ONLY by manufacturing constant-touch supplemental loops around an event the user actually cares about. Price drops ARE that event for Furnish — they tie a low-frequency redesign use case to a higher-frequency shopping concern. This loop is doing 3 jobs at once: (a) reactivation, (b) affiliate revenue, (c) reinforcing the wishlist-investment behavior. No other loop pulls that weight.

---

### Loop 2: Style Pulse → New Template → Save/Start (Manufactured, secondary)

This is Furnish's **content loop** — directly modeled on Pinterest's Core Loop (Reforge *Natural Behavior Use Cases* p.5: "I'm bored → visit Pinterest and pin something interesting → found something around my interests → rinse and repeat"). Furnish's Style Pulse strip (`index.html:807-841`) is the right implementation; it just needs the content to actually exist (Section D).

- **Trigger:** Weekly content drop. Manufactured via "Your style, every week" framing. Can also fire on environment cue (Pinterest browsing → Furnish push: "We saw you save Japandi pins — here are 3 rooms in that style") at a future ad-pixel-or-bookmarklet phase.
- **Action:** Browse Style Pulse strip → tap a template → either "Use this template" (start a new redesign with no photo capture, free, D4 activation event) OR "Save for later" (bookmark, low-effort).
- **Reward:** Discovery (new style they hadn't considered), social proof ("trending this week"), zero-cost browsing (no photo upload required).
- **Investment:** Saved templates → bookmarked rooms → starts to feel like the user has "their library" inside Furnish. Profile.styles get tuned by what they engage with.
- **Loop type per Reforge:** **Manufactured** (content-loop variant). This is a textbook Reforge *Advanced Growth Strategy → Content Loops* play.
- **Furnish-specific implementation:**
  - Surface: `index.html:807-841` Style Pulse strip — already wired with `style_pulse_shown { source }` event.
  - Trigger event: `use_template_clicked { templateId, source, tier }` — confirms the conversion from Pulse view → template start.
  - Templates browse-free (D4 — start counts as activation event).
  - Cadence: NEEDS 1 new template + 1 new style story + 1 trending mood per week minimum (Section D content build-list).
- **Why ranked #2:** Reforge's *Frequency Strategy* lecture explicitly recommends supporting one strong Core Loop with multiple Supplemental Loops. Style Pulse IS Furnish's primary content loop, and unlike price drops it works for users with EMPTY wishlists (the failure-mode for Loop 1). It also addresses the "at-risk" lifecycle state directly — when a user hasn't redesigned in 14 days, the lifecycle banner promotes Style Pulse (`app.js:2382-2390`). This is correct Reforge-grounded design.

---

### Loop 3: Home Progress → Next Room → Designed Room (Organic-aspirational)

This is Furnish's **completion loop** — a "9 rooms designed" map (`app.js:2180-2266`) that visually tracks how many room-types the user has covered. Per Reforge's *Engagement Strategies → Using Frequency Strategy*, this is a **manufactured organic loop** — we're trying to install an internal cue ("my home isn't done yet") that will recur naturally.

- **Trigger:** Organic-aspirational ("I haven't done my kitchen yet" — internal nag), reinforced by environment trigger (the home progress map glows showing 1 of 9 done, 8 to go).
- **Action:** Tap an undesigned room cell on the home progress map → pre-seeds capture flow with that room type → photo upload → redesign.
- **Reward:** Visible progress (the cell turns "done" with a check), plus the actual designed room as artifact.
- **Investment:** Each designed room is a meaningful artifact tied to that user's home. Switching to a competitor would mean abandoning a designed-room library — Reforge's "investment increases switching cost" framing.
- **Loop type per Reforge:** **Manufactured Organic** — we install the home progress map as the visual cue, which over time becomes an internal "my home isn't done yet" mindset. This is the same mechanic as LinkedIn's "complete your profile" bar.
- **Furnish-specific implementation:**
  - Surface: `renderHomeProgress()` `app.js:2180-2266` — wired with `home_progress_shown` and `home_progress_cell_clicked { roomType, action }` events.
  - 9 room types, ROOM_ORDER defines the canonical home tour: bedroom → living → kitchen → dining → bathroom → office → nursery → closet → laundry.
  - Auto-suggests the "next room" via the canonical order.
- **Why ranked #3:** Per Reforge's *Natural Behavior Use Cases* p.25: "What smart companies do is layer on multiple use cases that have a higher natural frequency." The Home Progress map is Furnish's attempt to convert "redesign 1 room" (yearly natural frequency) into "redesign all 9 rooms in your home" (creates a quarterly aggregate frequency). This is the Zillow strategy applied to Furnish — overlay multiple use cases on the same primary product. **However, this loop is weaker than #1 and #2 because it depends on the user being motivated to do MORE redesigns** — and the empirical baseline (per ICED p.6) is that infrequent-product users have decaying recall. So #3 supports #1 and #2 but cannot stand alone.

---

### Loop 4: Wishlist Ages → "You Saved This 90 Days Ago" → Re-engage (Manufactured, recall-triggered)

This is the loop Hassan hasn't fully built yet but the codebase already stamps the data for: `state.wishlistMeta[id].savedAt` (referenced at `app.js:4554-4557`). Per ICED Theory's product-recall-decay curve (ICED p.18, "the customer's ability to recall this product may decrease over time"), Furnish needs an explicit recall-recovery mechanic.

- **Trigger:** Manufactured time-based — "It's been 90 days since you saved this. Still want it? It dropped 8%." or "Still on your list — going out of stock soon."
- **Action:** Tap notification/email → see saved-but-aging items → either purchase (Shop affiliate click) or remove from wishlist (still a positive — clean signal).
- **Reward:** Closure on a deferred decision, possibly savings, sometimes inventory urgency.
- **Investment:** Even removal-from-wishlist is investment (signal refinement → future personalization).
- **Loop type per Reforge:** **Manufactured Time-Trigger** (Reforge *Engagement Strategies → Using Frequency Strategy* p.20: "5 Types of Manufactured Triggers — Time").
- **Furnish-specific implementation:**
  - Already-stamped data: `wishlistMeta[id].priceAtSave` and `savedAt` at `app.js:4554-4557`.
  - Add trigger predicates to `LIFECYCLE_CAMPAIGNS` (`app.js:2277-2326`):
    ```js
    {
      key: 'wishlist_age_d90_recall',
      channel: 'email',
      when: (ctx) => ctx.oldestWishlistAgeDays >= 90 && ctx.wishlistCount > 0,
      copy: { title: 'Still on your list', body: '3 pieces you saved 3 months ago — 1 dropped 8%, 1 is going OOS.' }
    }
    ```
  - Run as part of `runLifecycleScheduler()`.
- **Why ranked #4:** This loop catches users that Loops 1-3 miss: people who saved items but no price drop has fired and who haven't returned organically. ICED Theory specifically calls out this mechanic — "products with a single touch may not provide reinforcement of product experience or a strong brand recall" (ICED → Engagement Attributes → Degree of Touch p.23). Wishlist age is a free secondary touchpoint.

---

### Loop 5: Friend Saw Your Room → Style Inspired Friend → Both Re-engage (Environment, social)

This is Furnish's **viral-supplemental loop** — and it's the one that **challenges the Pro-trial-for-both referral**. Per ICED Theory (p.36, "Penetrability"), referral loops for highly infrequent products often fail because "even if a customer has a satisfying experience, the referral loop may not be as effective in most cases." A Pro-trial referral assumes the friend wants Furnish enough to try Pro — but if Furnish is yearly-frequency for them, they don't.

A better-fitting referral mechanic for Furnish's frequency profile:

- **Trigger:** Environment — user shares their designed room as an image/link to Pinterest/IG/iMessage. When recipient taps the link, Furnish learns "this was friend X's design" and friend Y now sees it.
- **Action:** Recipient lands on Furnish (no signup needed), can save individual items from friend's room to their own wishlist, or "Use this style as a starting point for my room" (which clones friend's profile.styles + colors as a draft).
- **Reward:** Both sides — original sharer gets validation (someone saved my style), recipient gets a tested style template AND a way into Furnish without committing to a redesign yet.
- **Investment:** Recipient now has a profile + saved items, which seeds Loops 1-4 for them. Original sharer has effectively trained the algorithm.
- **Loop type per Reforge:** **Environment** (Reforge *Frequency Strategy* lecture: triggers placed where users already are — Pinterest, iMessage, IG). Per ICED Theory's "Expanding Touchpoints across Channels" strategy (Expanding Touchpoints p.5-7).
- **Furnish-specific implementation:**
  - New share artifact: room-as-link with OG image preview (recipient sees a beautiful designed room).
  - Recipient's first session offers "Use as starting point" CTA — clones styles + colors from sharer's profile, NOT items (items are still wishlist-by-tap).
  - Original sharer gets analytics: `room_share_viewed { byRecipient: true, roomId }` — and a soft notification "Someone in [city] just saved 3 items from your bedroom design."
- **Why ranked #5:** Lowest in confidence because it depends on social-share volume that doesn't exist yet, but **HIGHEST in long-term defensibility** per ICED Theory's "Distinctiveness" pillar (ICED p.28-29: Airbnb's 67% direct-traffic stems from distinctive, share-worthy product moments). Furnish's redesigned-room is genuinely Pinterest-grade content; the loop is wasted if not captured.

**Challenge to the Pro-trial-for-both referral:** I do not recommend killing it — but I recommend **layering Loop 5 on top of it**. Pro-trial works for the infrequent power-user persona who's already converted, but Loop 5 does the heavier lifting for the casual/at-risk segment. Run both, measure conversion separately.

---

## Section B — Natural frequency analysis (CHALLENGE)

Per Reforge's *Natural Behavior Use Cases* (Growth Series → Retention + Engagement → Defining Retention → Natural Behavior Use Cases), every product category has a natural frequency that must be discovered before nurture is calibrated. The framework requires answering: **The Who, The Why, The Alternative, and The Frequency.**

### The diagnosis (Customer Retention Canvas applied to Furnish)

| Canvas Field | Use Case A: Single-Room Refresh | Use Case B: Whole-Home Tour | Use Case C: Style Curiosity / Browse-Shop |
|---|---|---|---|
| **Problem** | "My [bedroom] feels stale — what would it look like in a different style?" | "I just moved / I'm renovating — what does my whole home become?" | "I want furniture that matches a vibe I have but can't articulate." |
| **Persona** | Female, 28-45, owns or rents, ~$60K+ income, mid-design-confidence | Female/couple, 30-50, recent move or major life event, $80K+ income | Female, 22-40, design-curious, moderate income, Pinterest user |
| **Why** | "It's faster than hiring a designer; cheaper than a redo" | "Design across rooms in 1 platform" | "Better than scrolling Pinterest because the items are shoppable" |
| **Alternative** | Pinterest + IKEA / Wayfair browsing; magazines (Architectural Digest); Instagram | Designer ($$$ + slow); Modsy/Havenly (paid renderings); HGTV-watch; Pinterest | Pinterest, IG saves, Houzz, mood-board apps |
| **Frequency (Natural)** | **Yearly to bi-annually** per room-type | **Once every 5-10 years** (life event-driven) | **Weekly to monthly** (browse-only behavior) |

### The killer chart (Reforge framing)

Per Reforge's *Natural Behavior Use Cases* p.23-25 (Use Case Frequency Spectrum):

```
HABIT ZONE          FORGETTABLE ZONE
DAILY  WEEKLY  MONTHLY    QUARTERLY  YEARLY  YEARS+
        │         │            │       │
        │    ▲    │            │   ▲   │
        │ Use C   │            │  A&B  │
        │ (browse)│            │  (redesign)
```

**Use Case A (Single-Room Refresh)** is in the Forgettable Zone, between yearly and years+. **Use Case B (Whole-Home Tour)** is even further to the right — once every 5-10 years. **Use Case C (Style Curiosity / Browse-Shop)** is in the Habit Zone — weekly to monthly.

### Challenge: "Quarterly Core" is wrong

Hassan's prior call: "Quarterly Core (real redesign sessions every ~3 months) + Weekly Supplemental (Style Pulse, price drops, lifecycle)."

**This overstates Core frequency by 4x.** Per Reforge's *Natural Behavior Use Cases* lecture, calling it "quarterly" forces nurture (push, email, in-app) to be calibrated for an audience that doesn't exist in those quantities. The Goldilocks problem (Reforge p.3) bites: **too much nurture → user feels spammed → delete; too little → user forgets product exists.**

### Confirm: "Weekly Supplemental" is correct (and actually undersized)

Hassan's prior call on weekly supplemental is exactly the Reforge-recommended move per ICED Theory: **layer high-frequency use cases on top of the infrequent core to stay top-of-mind.** This is precisely the Zillow play (Reforge *Natural Behavior Use Cases* p.25). The Zillow-Zestimate-Score and Zillow-Content cadence (weekly) sits alongside the yearly buying-a-home cadence — and it's why Zillow stays top-of-mind despite a years-long primary use-case frequency.

For Furnish, "Weekly Supplemental" should NOT just be Style Pulse + price drops. It needs to be:
- **Daily** opportunity-to-engage (price-drop banner can fire any day, push can deliver any day) — but actual daily engagement IS NOT expected.
- **Weekly** content drop (Style Pulse, 1 new template, 1 new mood, 1 new story).
- **Monthly** "30 days of your style" recap (`mid_d30_recap` `app.js:2302-2307`).

### The recommended frequency model (REPLACEMENT for Quarterly Core + Weekly Supplemental)

**Core: Annual / Bi-Annual Redesign Per Room-Type (Use Case A)**
Recognize the natural frequency. A user with 9 rooms might do 2-4 redesigns per year aggregate. Don't measure them as "quarterly redesign user" — measure them as "designed N rooms in past 365 days." Per Reforge's *Defining Retention*, the metric must align with natural frequency, not arbitrary calendar.

**Bridge: Whole-Home Spread Phase (Use Case B)**
Triggered by `home_progress_shown` — when a user has 1-3 rooms designed, the next-room nudge is a soft funnel toward Whole-Home Spread. This converts a Use Case A user into a Use Case B-shaped engagement pattern, which is Reforge's exact "layer on a higher-frequency use case" move.

**Supplemental: Daily-Possible / Weekly-Expected Browse-Shop (Use Case C)**
The browsing behavior — Style Pulse, price drops, Saved-rooms-grid revisit — can fire daily (when a price drops, push fires). But typical engaged-user behavior should be **weekly** (open Furnish, browse Style Pulse, maybe save an item). Use Case C is what keeps Furnish in the user's mind during the year between redesigns.

### Retention metric implications

Per Reforge's *Defining Retention*, the retention metric must align with natural frequency. For Furnish:
- **Wrong metric:** "Quarterly Active Users" (assumes a frequency the natural use case doesn't have).
- **Right metrics (split by use case):**
  - **D365 Designed Room Count** (Use Case A retention) — % of users who designed at least 1 room in 365 days.
  - **WAR / Weekly Active Returners** (Use Case C retention) — % of users who opened the app in a 7-day window. This captures the supplemental-loop work.
  - **D60 / D90 / D180 dormancy buckets** (per ICED Theory) — how recall decays without intervention.

Hassan has the lifecycle states (`LIFECYCLE.NEW / ACTIVE / AT_RISK / DORMANT / CHURNED`) wired correctly per `getLifecycleState()`. That IS the Reforge-aligned cohort structure. Just don't call it "Quarterly Active" — call it by what it is: tiered dormancy buckets.

---

## Section C — Lifecycle map (moment-by-moment)

Per Reforge's *Customer Retention Canvas*, every infrequent product needs explicit Setup Moment / Aha Moment / Habit Moment definitions. ICED Theory adds Resurrection as a separate moment for infrequent products. The contract below extends Hassan's `LIFECYCLE_CAMPAIGNS` (`app.js:2277-2326`) into a full lifecycle map.

### Welcome (D0)

- **Trigger:** Account creation OR first photo upload (whichever comes first; D0 = first session).
- **Audience:** All new users.
- **Message:** "Designing your first room" — minimal in-product copy. NOT a multi-step tour.
- **CTA:** Photo upload (or "Use a Template" if user is browsing-shy).
- **Reforge moment per Customer Retention Canvas:** **Setup Moment** — the act of getting to a state where Aha can occur. For Furnish, the setup moment is **photo-uploaded + style-selected**. Setup Metric: % of D0 users who reach photo-uploaded + style-selected within their first session.
- **Furnish-specific implementation:**
  - Already exists: capture flow + style quiz (`app.js` quiz logic + `furniture.js` QUIZ).
  - Watch the Setup metric: `analyzeBtn` → photo + style chosen.
  - **Action:** Add explicit `setup_moment_reached` analytics event on first photo+style combination.

### First Redesign (D0 → D1)

- **Trigger:** First successful AI redesign render (the finale moment). Already gated by `state.user.firstRedesignTutorialSeen` (`CLAUDE.md` references). The Reforge-classic Aha Moment.
- **Audience:** Users who reached Setup Moment and triggered a redesign.
- **Message:** "Your first redesign is here" + the post-finale tutorial walking them through Styles, Color Moods, Budget.
- **CTA:** "Save this room" (single-tap bookmark — generates the first investment).
- **Reforge moment per Customer Retention Canvas:** **Aha Moment** — the moment the user *gets* what Furnish does. For Furnish, the Aha is **first-rendered-redesign-they-actually-like**.
  - Aha Moment Metric: % of D0 users who triggered ≥1 redesign AND took ≥1 post-render action (save, swap, shop) within first session.
- **Furnish-specific implementation:**
  - Already exists: post-render swap/save UI.
  - Wire `aha_moment_reached` event tied to first render + first post-render interaction.
  - Per Reforge's Engagement Strategies → Identifying Engagement Opportunities, this is the "minimum confidence" point. Track and segment retention from here forward.

### First Save (D0 → D7)

- **Trigger:** User saves first wishlist item OR first bookmarked room.
- **Audience:** Users who passed Aha; they've consumed the value, this is the investment moment.
- **Message:** Soft push pre-prompt fires post-first-save (already wired `app.js:4498-4544`): "Want a heads-up when prices drop?" — exactly correct per Reforge User Psychology (post-investment grant rates >> pre-investment).
- **CTA:** Grant push permission (Free) → opens the door to Loops 1, 4.
- **Reforge moment per Customer Retention Canvas:** **Habit Moment** (early-stage). The first save is the first investment; investment is the prerequisite for the manufactured loops to fire. Per Reforge's *Engagement Spectrum*, this is the casual → core transition.
  - Habit Moment Metric: % of users who saved ≥1 item OR ≥1 room within first 7 days.
- **Furnish-specific implementation:**
  - `toggleWishlist()` `app.js:4546-4570` and `bookmarkedRooms` (already wired).
  - `maybeAskForPushPermission()` is the right gate.
  - Wire `habit_moment_reached` event on first save.
  - **Note on push delivery:** Push *delivery* is Pro-only per Hassan's locked decision (D9 / DEFERRED.md push notification). The permission ask is free — but a free user who grants permission won't actually get the price-drop pushes. **This is a leak.** Free users will think push is broken. Recommend either: (a) gate the pre-prompt on Pro state too, or (b) deliver a thinner "we'll alert you to the biggest drops in your wishlist" cadence to Free (1-2x/month max, not the full Loop 1 cadence). See Section E recommendations.

### First Purchase / First Affiliate Click (D0 → D14)

- **Trigger:** Affiliate click (`affiliate_click { itemId, source, price, surface, roomId }` event).
- **Audience:** Users who saved + then engaged with shopping.
- **Message:** No explicit message — the moment is the click itself. But this is the moment Furnish recognizes its primary monetization signal.
- **CTA:** Already happened (the click).
- **Reforge moment per Customer Retention Canvas:** Variant of Habit Moment for Furnish's specific monetization model.

**The asymmetry problem (Hassan's question):** Yes — "first purchase" for Furnish is unverifiable. Furnish sees the affiliate click but not the actual purchase confirmation. This is exactly the ICED Theory "Control Over Experience" problem (ICED p.8-10): the most crucial business event happens OUTSIDE the product. Per ICED, products with this characteristic (Indeed.com is the canonical example) face a permanent monetization-and-retention disadvantage.

**Reforge-grounded mitigation:** ICED Theory recommends moving along the Control spectrum to "Partial Control" (ICED p.20). Furnish can do this by:
- Treating affiliate-click + sustained-session-after as a proxy for likely-purchase (probabilistic).
- Capturing the confirmation moment via an "I bought this" bookmark on the wishlist item (free for the user; massively valuable signal for Furnish).
- Long-term: integrating with affiliate-network postback APIs that DO confirm conversion (Amazon Associates does this; Wayfair via CJ does this).

**Recommended:** Treat **First Affiliate Click** as the "Habit Moment confirmation" event for now. Wire a follow-up "did you end up getting it?" survey/prompt (gentle, dismissible) one week later — this also feeds Loop 4 (wishlist-aging recall).

### First Dormancy (D14 → D30)

- **Trigger:** No app open in 14+ days. `getLifecycleState()` returns `LIFECYCLE.AT_RISK` at this point.
- **Audience:** Users who passed Aha but didn't form the habit.
- **Message:** Lifecycle banner (`app.js:2382-2390`): "It's been [N] days. New pieces dropped in styles you might love."
- **CTA:** "See What's New" → templates/Style Pulse.
- **Reforge moment per Customer Retention Canvas:** Pre-dormant warning. Per Reforge's *Engagement Defining → Engagement States*, this is the casual → at-risk transition.
- **Furnish-specific implementation:**
  - Already wired in `renderLifecycleBanner()` `app.js:2382-2400`.
  - Lifecycle campaigns: `mid_d14_price_watch` and `mid_d30_recap` fire here (`app.js:2297-2307`).

### Dormancy (D30 → D90)

- **Trigger:** No open in 30-90 days. `LIFECYCLE.DORMANT` per `getLifecycleState()`.
- **Audience:** Users who haven't returned despite at-risk nudges.
- **Message:** `dormant_d60_warm`: "We haven't seen you. Here's what's new." `dormant_d90_seasonal`: "Spring 2026 in your style."
- **CTA:** Email-driven re-engagement.
- **Reforge moment per Customer Retention Canvas:** Dormancy state. Per Reforge's *Engagement Defining*, the user has now slipped from casual to dormant.
- **Furnish-specific implementation:**
  - Lifecycle campaigns: `dormant_d60_warm`, `dormant_d90_seasonal` (`app.js:2308-2319`).
  - Backend cutover (DEFERRED.md Email lifecycle): replace `lifecycle_would_fire` with real email send.

### Resurrection (D90+ / D180+)

- **Trigger:** No open in 90+ days (deep dormancy) or 180+ days (churned).
- **Audience:** Churned users — recall has decayed (per ICED p.18 product-recall-decay curve).
- **Message:** `churned_d180_refresh`: "Your bedroom is from 6 months ago. See today's take on it." Lifecycle banner CHURNED branch (`app.js:2401-2410`): "Your style is still saved. Pick up where you left off."
- **CTA:** "Design A New Room" — the lowest-friction re-entry.
- **Reforge moment per Customer Retention Canvas:** Resurrection. Per Reforge's *Resurrection Strategies*, the move is to give the user a meaningful re-entry point (NOT just a "we miss you" — that's noise).
- **Furnish-specific implementation:**
  - Lifecycle banner CHURNED branch already correct (`app.js:2401-2410`).
  - `churned_d180_refresh` already wired.
  - **Add:** Resurrection should also surface the user's BEST artifact — their best-rated/most-engaged-with designed room — as a recall trigger, not just style.
  - Per ICED: "Engineer peak moments to enhance brand recall" (Engagement → Plant Loyalty Hook). The user's first redesign was a peak moment; resurface it.

### Lifecycle map summary table

| Moment | Day | Trigger | Audience | Message | CTA | Reforge Concept | Metric |
|---|---|---|---|---|---|---|---|
| Welcome | D0 | First session | All new users | "Design your first room" | Photo upload / Use Template | Setup Moment | Setup % |
| First Redesign | D0-1 | First render | Setup-completed users | Render + tutorial | Save the room | Aha Moment | Aha % |
| First Save | D0-7 | First wishlist save | Aha-passed users | Push pre-prompt | Grant push permission | Habit Moment | Habit % @ D7 |
| First Purchase | D0-14 | Affiliate click | Saved-and-shopping users | (none — silent moment) | (already happened) | Monetization signal | Click-rate |
| First Dormancy | D14 | No open in 14d | At-risk | "New pieces in your style" | See what's new | At-risk transition | At-risk % |
| Dormancy | D30-90 | No open in 30-90d | Dormant | "We haven't seen you" | Re-engage | Dormancy state | Dormancy % |
| Resurrection | D90-180+ | No open in 90+d | Churned | "Your style is still saved" | Design new room | Resurrection | Resurrection % |

---

## Section D — Content cadence requirements (build-list)

Per Reforge's *Frequency Strategy* lecture (Step 4: Moderate), the loops above require continuous content. Without it, the supplemental loops degrade and users churn off the product (Reforge p.20-23: Slack/Twitter degradation curve).

This is what MUST exist for the Section A loops to function:

### Weekly content (every Monday — calibrated to Reforge's "weekly cadence is just-right for browse use case")

| Asset | Why required | Loop served | Source |
|---|---|---|---|
| **1 new template** (room-type + style + items) | Style Pulse strip (`index.html:807-841`) needs fresh inventory weekly. Without it, Pulse becomes stale. | Loop 2 | New template added to `ROOM_TEMPLATES` in `furniture.js`; ideally tagged "this week" so Pulse picks it up |
| **1 new style story / mood** ("Japandi takes over") | Editorial framing — what makes the template emotionally relevant. Reforge Brand Marketing: this is the "story" that makes the product distinct. | Loop 2, supports Loop 5 distinctiveness | New copy block in Style Pulse data; lightweight CMS entry |
| **1 new trending style highlight** (algorithmic — "what other Furnish users are designing this week") | Social-proof loop. Reforge *Engagement Strategies → Using Use Case + Feature Strategy*: "users want to know what other users like them are doing." | Loop 2, Loop 5 | Aggregated from `style_pulse_shown` and `use_template_clicked` events |
| **Price-drop scan** (cron-driven, runs nightly) | Loop 1 is the highest-impact loop. It can ONLY fire if the price-drop pipeline runs. | Loop 1, Loop 4 | DEFERRED.md → Real affiliate catalog + Push notification delivery |

### Monthly content (every 1st of month)

| Asset | Why required | Loop served | Source |
|---|---|---|---|
| **Monthly mood pack** (5-7 templates around a single theme) | The "30 days of your style" recap (`mid_d30_recap`) needs a thematic narrative, not just a count. | Lifecycle moment recap | Curated grouping of weekly drops |
| **1 seasonal collection** (1 per season, so 4 per year) | `dormant_d90_seasonal` campaign explicitly names "Spring 2026 in your style." Without seasonal narratives, this campaign fires with no inventory. | Loop 2, Resurrection | Larger curated drop (10-15 templates) |
| **30-day recap content** (per-user — algorithmically generated) | Personalization signal: "your most-saved style was Japandi, you saved 4 sofas..." | Loop 4, lifecycle recap | Generated from user analytics, no editorial work |

### Per-user content (algorithmically generated, on demand)

| Asset | Why required | Loop served |
|---|---|---|
| **Wishlist-age summaries** ("3 items saved 90 days ago, 1 dropped, 1 OOS") | Loop 4 trigger payload | Loop 4 |
| **Resurrection peak-moment surface** (user's highest-engaged room from history) | Resurrection campaigns need a recall hook | Lifecycle moment Resurrection |
| **"Style still saved" personalization** (lifecycle banner CHURNED variant) | Already wired (`app.js:2406-2410`) — needs profile.styles to actually populate, which ALREADY happens via the quiz. | Resurrection |

### Content not required (calibration check)

To avoid the Goldilocks problem (Reforge p.3 "Too Much"):
- **Daily content drops are NOT required.** Daily-fire only happens via Loop 1 (price drops, which are organic events not curated content).
- **Email blasts more frequent than weekly are NOT recommended** for Furnish. The natural frequency doesn't support it. Doing so will increase unsubscribe + decrease retention.

### Content build-list summary

For Furnish to ship the retention model in this document, the content team (or Hassan, until there's a team) must commit to producing:

- **52 templates / year** (1/week)
- **12 monthly mood packs / year** (collections of weekly templates)
- **4 seasonal collections / year** (~15 templates each, expanded narrative)
- **52 style stories / year** (1/week, editorial copy)
- **Continuous price-drop pipeline** (cron-based, automated)

Per ICED Theory (Expanding Touchpoints p.5), this content cadence IS the "expanding touchpoints across channels" lever — without it, Furnish has no defense against product-recall decay.

---

## Section E — Recommendations (≥6 entries)

### **[Dim 05 — Rec 1] Recalibrate retention metrics from "Quarterly Active" to use-case-specific (D365 Designed + WAR + dormancy buckets)**

- **Current state in Furnish:** No explicit retention metric; lifecycle states (`LIFECYCLE.NEW / ACTIVE / AT_RISK / DORMANT / CHURNED`) defined in `app.js` via `getLifecycleState()`.
- **Proposed state:** Wire 3 distinct retention metrics tracked separately:
  - `D365_designed_room_count` — % of D0 users who designed ≥1 room in 365 days (Use Case A).
  - `WAR` (Weekly Active Returners) — % of users who opened in past 7 days (Use Case C).
  - `dormancy_rate` — % of users in DORMANT or CHURNED state (per `getLifecycleState()`).
  - Additionally: `resurrection_rate` — % of CHURNED users who returned within a 30-day window after a resurrection campaign.
- **Reforge framework citation:** Per Reforge's *Defining Retention* (Growth Series → Retention + Engagement → Defining Retention For Your Product), retention metrics MUST align with natural frequency — not arbitrary calendar buckets. Per *Customer Retention Canvas* (Reforge → Retention + Engagement → Templates → Customer Canvas), each Use Case has its own Retention Metric (the AirBnB example: YAG for guests is yearly, WAH for hosts is weekly).
- **Expected impact:** Diagnostic clarity. Without the right metric, every other rec in this section is unmeasurable.
- **Effort tier:** S (analytics wiring + dashboard).
- **Dependencies:** Backend analytics (DEFERRED.md backend phase).
- **What breaks/leaks if we skip it:** Hassan calibrates nurture cadences against the wrong metric, ships a too-aggressive push schedule, and watches D90 retention crater while not understanding why.

---

### **[Dim 05 — Rec 2] Fix the Free-user push-permission leak (Loop 1 monetization gap)**

- **Current state in Furnish:** `maybeAskForPushPermission()` `app.js:4498-4544` fires on first save for ALL users (Free + Pro). Push *delivery* is Pro-only per Hassan's locked decision. So a Free user grants permission, then never receives a push, then assumes "Furnish is broken / spammy / lying."
- **Proposed state:** Two options, pick one:
  - **Option A — Permission-ask gated to Pro intent:** Don't fire the pre-prompt for Free users; instead surface "Get price drop alerts" as a Pro-upgrade CTA in the wishlist tab. The grant happens after Pro upgrade. Cleaner; no leak; but loses some Free-user permission grants for later.
  - **Option B — Free-user thinner cadence:** Free users CAN grant permission; deliver only the top 1-2 highest-impact price drops per month (vs Pro's full real-time). Soft "upgrade to get all alerts" tag at bottom of each delivered push. Riskier but better Free-experience.
- **Reforge framework citation:** Per Reforge's *Frequency Strategy* (Step 4: Moderate), promised cadence must match delivered cadence — "you have to be careful of the different habits that you build and what their long-term effects might be on the product" (Reforge p.24-26). Promising "we'll ping you when prices drop" then never pinging is a worse retention experience than not asking.
- **Expected impact:** Push permission grant *meaning* alignment. Higher D14 retention for Free users (because they don't lose trust). Higher Pro conversion if Option A.
- **Effort tier:** S.
- **Dependencies:** None — both options purely client-side until backend.
- **What breaks/leaks if we skip it:** Free users have a "broken push" perception → 1-star reviews → CAC inflation.

---

### **[Dim 05 — Rec 3] Add wishlist-aging recall loop (Loop 4) to LIFECYCLE_CAMPAIGNS**

- **Current state in Furnish:** `wishlistMeta[id].savedAt` and `priceAtSave` are stamped (`app.js:4554-4557`). 8 lifecycle campaigns defined (`app.js:2277-2326`). NO campaign fires on wishlist-age trigger.
- **Proposed state:** Add 9th campaign to `LIFECYCLE_CAMPAIGNS`:
  ```js
  {
    key: 'wishlist_age_d90_recall',
    channel: 'email',
    when: (ctx) => ctx.oldestWishlistAgeDays >= 90 && ctx.wishlistCount > 0 && ctx.daysSincePrev < 60,
    copy: { title: 'Still on your list?', body: '3 pieces you saved 3 months ago — 1 dropped 8%.' }
  }
  ```
  Compute `oldestWishlistAgeDays` in `runLifecycleScheduler()` ctx (`app.js:2328-2340`).
- **Reforge framework citation:** Per ICED Theory (Reforge → Retention + Engagement → Bonus → Iced Theory → 06. Expanding Touchpoints, p.23), "products with a single touch may not provide reinforcement of product experience or a strong brand recall — moving toward constant touch increases reinforcement and improves recall." Wishlist age IS a manufactured time-trigger (Reforge *Frequency Strategy* p.20: "5 Types of Manufactured Triggers — Time").
- **Expected impact:** Captures users that Loops 1-3 miss (saved items but no price drops). Estimated +5-8% D90 dormancy_rate reduction based on Reforge's "expanding touchpoints" examples (Tripadvisor going from single-touch to multi-touch).
- **Effort tier:** S (one entry in LIFECYCLE_CAMPAIGNS, one ctx field).
- **Dependencies:** Email lifecycle backend (DEFERRED.md).
- **What breaks/leaks if we skip it:** Users who saved items but had no price drop fire never get a meaningful re-engagement signal. They drift to dormancy.

---

### **[Dim 05 — Rec 4] Replace the Pro-trial-for-both referral with (or layer on top of) a room-share viral loop (Loop 5)**

- **Current state in Furnish:** Pro-trial-for-both referral is locked (1 month free both sides). No room-share / Pinterest-style social loop exists.
- **Proposed state:** Build room-share artifact with Pinterest/iMessage/IG sharing. When recipient lands, "Use this style as a starting point" CTA clones sharer's profile.styles + colors as a draft (NOT items — items remain wishlist-by-tap). Original sharer gets soft notification "Someone in [city] just saved 3 items from your bedroom."
  - Pro-trial referral: KEEP (it works for the converted-power-user persona).
  - Room-share: ADD as parallel acquisition + retention loop.
  - Measure conversion separately.
- **Reforge framework citation:** Per ICED Theory (p.36 "Penetrability"), referral loops for highly infrequent products often fail because "even if a customer has a satisfying experience, the referral loop may not be as effective in most cases." Per ICED → "Distinctiveness" (p.28-29), Airbnb's 67% direct traffic comes from distinctive, share-worthy product moments. Per Reforge *Advanced Growth Strategy → Content Loops*, room-share is a content-loop variant that compounds organically.
- **Expected impact:** Higher D14-D30 retention via social validation (sharer engages back when recipient interacts), higher CAC efficiency (organic acquisition channel), defensibility (per ICED Distinctiveness pillar).
- **Effort tier:** L (share artifact, OG image generation, recipient-onboarding UX, sharer-notification pipeline).
- **Dependencies:** Backend for OG image hosting; affiliate-link routing for shared rooms.
- **What breaks/leaks if we skip it:** Pro-trial-for-both alone won't reach the casual/at-risk user segment because casual users don't refer products they use yearly. Room-share is the only mechanic that fits the natural frequency.

---

### **[Dim 05 — Rec 5] Wire setup_moment_reached, aha_moment_reached, habit_moment_reached as discrete analytics events**

- **Current state in Furnish:** Events exist for individual actions (`affiliate_click`, `style_pulse_shown`, etc.) but no semantic Setup/Aha/Habit moment events. No way to compute the Reforge-canonical conversion funnel.
- **Proposed state:** Add 3 events at the right call-sites:
  - `setup_moment_reached` — fires once per user when photo + style first set (capture-flow completion).
  - `aha_moment_reached` — fires once per user on first redesign render + first post-render interaction (save/swap/shop).
  - `habit_moment_reached` — fires once per user on first wishlist save OR first bookmarked room.
  - All three should set a flag on `state.user` to prevent re-fire.
- **Reforge framework citation:** Per Reforge's *Customer Retention Canvas*, every product needs explicit Setup Moment, Aha Moment, Habit Moment definitions + corresponding metrics ("Setup Moment Metric", "Aha Moment Metric", "Habit Moment Metric"). Without these, the funnel can't be analyzed and engagement opportunities can't be identified (per Reforge *Engagement Strategies → Identifying Engagement Opportunities* p.3-19, the 4-step process: Mindsets, Pathways, Data Signals, Value).
- **Expected impact:** Diagnostic — unlocks Reforge's full "where do users drop off, and why" analysis.
- **Effort tier:** S (3 events, ~30 min of wiring).
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** Hassan can't run the qualitative-pathway-comparison-matrix analysis (Reforge *Engagement Strategies → Identifying Engagement Opportunities* p.12-13) when he runs the 5-archetype interviews.

---

### **[Dim 05 — Rec 6] Layer the Whole-Home Tour use case on top of Single-Room (Zillow strategy)**

- **Current state in Furnish:** Home Progress map (`app.js:2180-2266`) implements the structural surface but the framing is passive ("9 of 9 rooms designed"). No explicit Whole-Home Tour journey or campaign.
- **Proposed state:** Add a "Design Your Whole Home" campaign that triggers when a user has 1-3 designed rooms:
  - Lifecycle banner variant: "You've designed [bedroom]. The same style works for 8 more rooms — see your dining room first."
  - In-product: when user opens a designed room, surface a soft "Apply this style to next room?" CTA.
  - Email campaign: new entry in `LIFECYCLE_CAMPAIGNS` triggered on `totalRooms >= 1 && totalRooms <= 3 && daysSincePrev < 30` — cadence: monthly, with one room-type suggestion + 1 template per email.
- **Reforge framework citation:** Per Reforge's *Natural Behavior Use Cases* p.25 ("Adding Use Cases"): "What smart companies do is layer on multiple use cases that have a higher natural frequency. Zillow is a perfect example. Their primary use case, and main revenue driver, is buying or selling a home. Since people only buy homes maybe one every five to seven years, Zillow has layered on higher frequency use cases [Zestimate, Zillow Content]." For Furnish, **Whole-Home Tour** converts the natural-yearly Single-Room frequency into a year-long-but-spread-out engagement pattern — same Zillow play.
- **Expected impact:** Increase D365_designed_room_count by 30-50% (the typical lift Reforge cites for layered-use-case strategies). Reduce D60+ dormancy materially.
- **Effort tier:** M (new lifecycle campaign + 1 banner variant + analytics).
- **Dependencies:** None client-side; email cutover for full effect.
- **What breaks/leaks if we skip it:** Furnish stays a 1-bedroom-and-done product; lifetime value flatlines after the first redesign.

---

### **[Dim 05 — Rec 7] Resurrection campaigns must surface the user's PEAK MOMENT (best-engaged room), not just style**

- **Current state in Furnish:** Lifecycle banner CHURNED branch (`app.js:2401-2410`): "Your style is still saved. Pick up where you left off." `churned_d180_refresh` campaign: "Your bedroom is from 6 months ago. See today's take on it." Both reference style/timestamp but not the user's actual best artifact.
- **Proposed state:** Compute "user's peak moment" as the room with most post-design interactions (saves + swaps + shops + revisits). Resurrect campaigns surface that specific room with copy like: "Your [bedroom] from [date] — we made it shoppable again. 2 of those pieces are now on sale."
- **Reforge framework citation:** Per ICED Theory (Engagement → Plant Loyalty Hook → "Engineer peak moments to enhance brand recall") — the user's first/best designed room IS their peak moment. Resurrecting it is more effective than generic style references because per ICED p.18 the product-recall-decay curve is steep, and a specific high-engagement artifact is a stronger recall trigger than abstract style label.
- **Expected impact:** Higher resurrection_rate from D90+ users (estimated 2-3x lift vs generic copy based on Reforge's peak-moment framing examples).
- **Effort tier:** S (compute peak room + thread through 1-2 lifecycle campaigns).
- **Dependencies:** Per-user analytics (already tracked via existing events).
- **What breaks/leaks if we skip it:** Resurrection campaigns hit users with generic "we miss you" framing, which Reforge's *Resurrection Strategies* explicitly warns against ("noise, not signal").

---

### **[Dim 05 — Rec 8] Make the Style Pulse strip a "you'd-share-this-to-Pinterest" surface, not a passive carousel**

- **Current state in Furnish:** Style Pulse strip (`index.html:807-841`) renders weekly inspiration with `style_pulse_shown { source }` event and `use_template_clicked` for taps. No share affordance.
- **Proposed state:** Each Pulse card has a tap-to-share menu (Pinterest, IG, iMessage). Sharing pre-fills the OG image with Furnish branding + a deep link to that template. Per the Loop 5 design — recipient lands and can "Use this style" without signup.
- **Reforge framework citation:** Per Reforge's *Advanced Growth Strategy → Content Loops*, content loops are double-duty — they retain existing users AND acquire new ones via outbound shares. Per ICED Theory's "Distinctiveness" pillar (ICED p.28), share-worthy moments compound into direct traffic. Per *Frequency Strategy → Add Supplemental* (p.16-19), supplemental loops should reinforce the core loop's reward — and outbound share is exactly that.
- **Expected impact:** New acquisition channel (organic / social) + reinforced retention via "I shared this" investment.
- **Effort tier:** M (share targets + OG image generator + receiver flow).
- **Dependencies:** OG image hosting backend.
- **What breaks/leaks if we skip it:** Style Pulse stays an inbound-only surface; Furnish misses Pinterest/IG distribution which is the natural channel for the "design-curious" persona (Use Case C).

---

## Top 3 priorities for this dimension

These are the 3 recommendations Hassan should ship FIRST, in priority order:

### Priority 1: Recommendation 5 — Wire setup_moment_reached, aha_moment_reached, habit_moment_reached events

**Why first:** Diagnostic foundation. Without these events, Hassan cannot run the Reforge *Customer Retention Canvas* analysis on his own users when he hits 50+ users with 1+ Aha (the planned interview cohort per `DEFERRED.md`). Effort tier S (one afternoon). Unblocks every other retention measurement.

### Priority 2: Recommendation 2 — Fix the Free-user push-permission leak

**Why second:** Loop 1 (the highest-ranked engagement loop) is currently silently broken for Free users. Hassan asked them to grant push permission in exchange for a benefit they will never receive. This is worse than not asking. Effort tier S; high leverage. Gates the entire Loop 1 retention story.

### Priority 3: Recommendation 6 — Layer the Whole-Home Tour use case on top of Single-Room (Zillow strategy)

**Why third:** This is the Reforge-grounded answer to Furnish's biggest structural retention threat — the natural frequency is too low to sustain on its own. Without layered use cases (Whole-Home Tour, Style Pulse browse, price-drop watch all working together), Furnish degrades to a one-redesign-and-done product. Effort tier M; massive long-term impact on D365_designed_room_count and overall retention curve.

---

---

## Appendix: Reforge framework provenance (citation map)

For audit / cross-reference, here is where each Reforge concept invoked above lives in the bundle:

| Concept | Course / module | File path |
|---|---|---|
| Customer Retention Canvas (Use Case / Problem / Persona / Why / Alternative / Frequency / Setup Moment / Aha Moment / Habit Moment / Engagement Metric) | Retention + Engagement → Templates → 02. Reforge Customer Canvas | `Reforge Customer Canvas.pdf` |
| Engagement Spectrum (Casual / Core / Power) + Mindset Comparison Matrix + Pathway Comparison Matrix | Retention + Engagement → 06. Engagement Strategies → Identifying Engagement Opportunities | `02. Identifying Engagement Opportunities.pdf` |
| Natural Behavior Use Cases (Nature vs Nurture / Goldilocks problem / Habit Zone vs Forgettable Zone / Use Case Frequency Spectrum / Layering use cases — Zillow example) | Retention + Engagement → 02. Retention → Natural Behavior Use Cases | `02. Natural Behavior Use Cases.pdf` |
| Frequency Strategy (Optimize Core Loop → Add Supplemental → Optimize Supplemental → Moderate; Manufactured / Environment / Organic loops; 5 types of Manufactured Triggers — Time / Location / Change / Peer / Programmatic) | Retention + Engagement → 06. Engagement Strategies → Using Frequency Strategy | `04. Using Frequency Strategy.pdf` |
| ICED Theory: 4 Dimensions (Infrequency / Control over Experience / Engagement / Distinctiveness); product-recall-decay curve; Penetrability / Macro-resilient / Deliberate-vs-Impulsive PMD parameters | Retention + Engagement → 09. BONUS Managing Infrequent Products → Iced Theory → 4 Dimensions | `01. The 4 Dimensions Of Infrequent Products.pdf` |
| ICED Expanding Touchpoints (Hotelling Model / Touch Point Expansion / Single-Intermittent-Constant Touch spectrum) | Retention + Engagement → 09. Bonus → Iced Theory → 06. Expanding Touchpoints | `06. Expanding Touchpoints.pdf` |
| Engagement States definition (Total / Per-Active / Power-Core-Casual buckets) | Retention + Engagement → 05. Engagement Defining, Measuring, And Analyzing | course series |
| Resurrection Strategies (Reforge resurrection diagnosis sheet) | Retention + Engagement → 08. Resurrection Strategies | course series |
| Content Loops (UGC + content-loop variants of frequency strategy) | Advanced Growth Strategy → Content Loops | course series |

All citations above were used in the recommendations and engagement-loop ranking sections. No frameworks were invented; any item not grounded in a specific Reforge module is marked inline.

---

*End of dimension 05. Section A: 5 ranked engagement loops. Section B: Natural frequency analysis (CHALLENGE — Quarterly Core wrong, Weekly Supplemental correct but undersized). Section C: Lifecycle map (7 moments). Section D: Content cadence build-list (52 templates/year, 4 seasonal collections, weekly story). Section E: 8 recommendations. Top 3 priorities specified.*
