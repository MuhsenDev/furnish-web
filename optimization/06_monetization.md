# Dimension 06 — Monetization

**Scope:** Affiliate-Maximalist + Pro stabilizer call. Pricing psychology (anchoring, decoy, reference price). Pro entitlement bundling audit. Upsell pacing audit.

**Frameworks invoked (Reforge):**
- *Monetization + Pricing* — Use Case Model (Problem / Persona / Alternatives / Why / **Frequency**), Monetization Model (Scale / What / Amount / **When**), Monetization Triad (Consumer View × Growth Loops × Cost of Revenue), Packaging Strategy Matrix (Relative Preference × Willingness-to-Pay 2×2 → Add-ons / Expansion Triggers / Table Stakes / Not Valued), Pricing Strategies (Van Westendorp + Conjoint), Optimization Equation (`Perceived Value > Perceived Price + Friction`), Strategies for Existing Healthy Customers (Depth expansion via conversion-stage focus).
- *Retention + Engagement* — Natural Frequency, retention curve shape as a precondition for subscription pricing.
- *Product Marketing* — packaging copy, "don't sell features that don't exist."

---

## Section A — Affiliate-Maximalist + Pro stabilizer: CHALLENGE WITH MODIFICATION

**The call:** **Modify, don't replace.** Affiliate-Maximalist stays as the primary revenue narrative. Pro stays. But the Pro tier as currently bundled is structurally weak under Reforge's natural-frequency lens, and the Pro card is leaning on two "coming soon" features that don't exist. Three concrete modifications below; full evaluation follows.

### A.1 Use-Case Model audit (Reforge: Use Cases lesson, Monetization + Pricing)

Per Reforge's Use Case Model, every monetization decision must thread back through Problem → Persona → Alternatives → Why → **Frequency**. Run Furnish through it:

| Element | Furnish answer |
|---|---|
| Problem | "I want to redesign my room without paying a designer or guessing on Pinterest." |
| Persona | Renter / homeowner with a room they're not happy with — recent mover, mid-renovation, dormant Pinterest power user. |
| Alternatives | Pinterest (free, low conversion-to-purchase), Houzz (browse-only), an interior designer ($500-5000), Instagram screenshots, "just live with it." |
| Why | Furnish closes the gap between *visualization* and *purchase* — the redesign comes pre-shopped. |
| **Frequency** | Per Reforge's frequency spectrum (Slack=daily → Zola=once-in-lifetime), Furnish's natural frequency for the **redesign action** is roughly Airbnb-class (~"a couple times a year"), per the user-research plan in `DEFERRED.md`. The **return-to-app frequency** could be higher if wishlist + price-drop alerts work, but redesign itself is low-frequency. |

### A.2 Why this matters for Pro

Per Reforge's *Monetization Model* lesson (When dimension): products with **low natural frequency** of the core problem map to the right-hand side of the spectrum — yearly, transactional, or never. Examples cited: TurboTax (yearly), Zillow (years+), Eventbrite (per-transaction), Allbirds (per-transaction). Examples that map to monthly recurring on the chart: Calm (daily-meditation cadence), Netflix (daily-watch cadence), ClassPass (weekly-class cadence) — all **high-frequency** consumer products.

**The challenge to Pro:** Furnish redesign is closer to TurboTax/Zillow on the frequency spectrum than to Calm/Netflix, but Hassan has priced it like Calm ($5.99/mo recurring). Per Reforge: when frequency and pricing-cadence are misaligned, you get the disconnect Reforge's *Monetization Strategy* lesson warns about — "the biggest disconnect when it comes to monetization."

**Counter-evidence (why Pro still works):** the Pro entitlements that are **NOT** redesign-frequency-bound do work on a monthly cadence:
- Real-time price-drop alerts (background-running, fires whenever drops happen — passive value)
- Multi-profile (per-household, accrues whenever any household member uses the app)
- HD downloads (transactional, tied to *sharing* moments which are higher-freq than redesign)
- Premium AI quality (per-redesign, but the *option* is always available — option value, not usage value)

So: the Pro tier survives the frequency challenge **only if the entitlement bundle is loaded with non-redesign-frequency features**. If Pro = "premium AI quality" alone (one-shot value tied to redesign frequency), it's a TurboTax-priced-as-Calm mistake.

### A.3 Monetization Triad evaluation

Per Reforge's *Pricing Strategies* lesson, every pricing call gets evaluated through the triad:

**Business view (revenue mix at scale):**
- Affiliate revenue scales with `# of users × redesigns/user × shop-rate × commission`. Reforge *Revenue Equation* lesson: this is a transaction model, breadth (users) × depth (orders/user × $/order × commission %).
- Subscription revenue scales with `# of Pro users × ARPU × retention months`. Reforge: classic recurring breadth × depth.
- **Defensibility:** affiliate revenue is volatile (Amazon famously cut tag rates from 8% to 3% across home goods in 2020 with no warning; per Reforge's *Cost of Revenue* lesson, when your supplier dictates your margin you have a structural risk). Subscription revenue is more defensible because you control the customer relationship, not Amazon.
- **Verdict:** Affiliate-Maximalist correctly recognizes affiliate is the breadth driver pre-launch. Pro stabilizer is correct for defensibility. **Confirmed.**

**Consumer view (does Pro feel like an upgrade or a paywall?):**
- Per Reforge *Packaging Strategies* lesson, the test is: do the Pro features cluster in the **High-Value × High-WTP** quadrant of the Packaging Strategy Matrix (the "expansion trigger" quadrant)? Without a Max-Diff/Van Westendorp survey we can't plot the actual matrix, but the *qualitative* read on the 7 Pro bullets is mixed (full audit Section C). 
- "Premium AI quality" — most users can't tell Flux Schnell from Flux Kontext Pro at first glance on a phone screen. Per Reforge: the perceived value diff is **not legible** until they see a side-by-side. Right now they don't. This is a packaging communication failure.
- **Verdict:** Pro feels more like a paywall than an upgrade because the headline value-prop ("premium AI quality") is invisible until the user already has both versions to compare — which they never will. Modify needed.

**Growth loops:**
- Affiliate-Maximalist feeds the **content loop**: each redesigned room = a shareable visual = potential new-user acquisition via Pinterest/Instagram. HD downloads in Pro = better shares = better loop = more affiliate revenue. There's a **synergy** here that the current paywall doesn't exploit.
- Subscription revenue could fund the give-get referral loop (cf. Reforge's Gusto + Uber examples in *Pricing Strategies*: increased prices → more capital to reinvest in incentives → faster loops). Furnish has no give-get loop today.
- **Verdict:** Pro currently does NOT feed growth loops the way it could. Modify needed (entry below).

**Cost of revenue:**
- Per the locked `routeGenerationByModelTier` contract: Free = Flux Schnell ~$0.005-0.01/run, Pro = Flux Kontext Pro ~$0.05/run. Both unlimited.
- Per Reforge *Cost of Revenue* lesson: when variable cost scales with usage but revenue doesn't (Free unlimited gens), you've baked a margin trap. A power-Free user costing $1+/month in compute is a loss-making customer.
- The DEFERRED.md server-side rate limits (200/day Free, 500/day Pro) cap the worst case but don't fix the structure: the median Free user is fine, the long-tail abusive Free user is unprofitable.
- **Verdict:** Affiliate revenue per power-Free user MUST cover their compute cost, or Pro conversion rate must justify subsidizing them. Math needs validation post-launch (spawn task at end if material gaps).

### A.4 Revenue Equation breakout for Furnish

Per Reforge's *Revenue Equation* lesson (`Revenue = Breadth × Depth`), Furnish's revenue equation is hybrid (one breadth driver, two depth dimensions, two revenue streams):

```
Revenue =
  (# of users) ×
  (
    [affiliate path]
      avg redesigns/user
      × avg items shopped per redesign
      × avg item price
      × commission rate
      × shop-conversion rate
    +
    [subscription path]
      pro_conversion_rate
      × ARPU_pro
      × avg_retention_months
  )
```

The variable that dominates affiliate revenue is **shop-conversion rate** — the fraction of users who actually click through and purchase. The variable that dominates subscription revenue is **pro_conversion_rate × retention_months**. These are different optimization targets. Affiliate-Maximalist correctly prioritizes shop-conversion-rate (which is where the bulk of optimization leverage lives pre-scale). Pro stabilizer correctly hedges against affiliate volatility.

Per Reforge: when revenue depends on multiple dimensions, the team needs to know which dimension is moving and to instrument them separately. Currently Furnish has good affiliate instrumentation (`affiliate_click`, `affiliate_shop_all_clicked` events at `app.js:3706`) but Pro funnel instrumentation is shallow (`paywall_shown`, `paywall_converted` only — no event for `paywall_dismissed`, no segmentation by surface that opened the paywall). Recommendation entry below addresses this.

### A.5 The call: confirm with three modifications

1. **Reframe Pro from "premium AI quality" to "passive-value bundle"** — lead with price-drop alerts + multi-profile + HD downloads (the high-frequency entitlements) NOT premium AI (the low-frequency one). See Section C ranking.
2. **Cut "coming soon" features from the visible Pro bullet list** until shipped. Per Reforge *Product Marketing* + *Packaging Strategies* (cost of serving features you don't deliver = trust debt). They show up as roadmap teasers in a smaller block, not as Pro entitlements you're pricing.
3. **Add a give-get referral loop funded by subscription margin** to align Pro with growth loops per Reforge *Pricing Strategies* (the Gusto example).

---

## Section B — Pricing psychology entries

### B.1 Anchoring — current state is monthly-vs-annual; the bigger anchor is unused

**Per Reforge's *Convert and Activate Potential Customers* lesson** (Optimization Strategies): anchoring is one of three levers (Perceived Value ↑, Perceived Price ↓, Friction ↓) at the conversion stage. The current paywall anchors annual ($3.99/mo) against monthly ($5.99/mo) with a "Save 33%" badge — this is a *small* anchor. The Drift example in the Reforge convert lesson uses "Save $24/year" as a *line-item* anchor, but the more effective anchor is against **the alternative**, not against your own other plan.

**The unused anchor:** the average US room renovation runs $5,200–$7,500 (per HomeAdvisor; well-known in the home-improvement vertical). $47.88/yr against $5,200 reads as 0.9% of one renovation. That's the Drift "limited time only" + perceived-value lift in the Reforge example, but rotated to compare against the **real-world alternative** (Reforge Use Case Model: Alternatives are part of the "why over X" decision).

```
**[Dim 06] — Add real-world cost anchor above the Pro price**
- **Current state in Furnish:** `app.js:986-991` price toggle shows monthly/annual; no anchor against renovation cost or against an interior designer's hourly rate.
- **Proposed state:** Above the price line in the Pro card (`index.html:937-941`), insert a small grey line: "Average US room renovation: $5,200. Furnish Pro: $47.88/year." The annual price now anchors against the *problem cost*, not against your own monthly plan.
- **Reforge framework citation:** "Per Reforge's *Convert and Activate Potential Customers* lesson, anchoring decreases perceived price by reframing the cost against a higher-salience reference. The Drift pricing-page critique cites 'Anchor the annual plan pricing against the monthly plan' but the broader principle is: anchor against the consumer's existing alternative cost (Use Case Model: Alternatives)."
- **Expected impact:** paywall_shown→paywall_converted lift of 5-15% (anchoring effects in pricing literature commonly produce 3-20% lifts; renovation-cost anchors are particularly potent because the alternative is salient to the persona). Track via the `triggeringContext` dimension on `paywall_converted`.
- **Effort tier:** S (one HTML line + CSS for the small grey treatment)
- **Dependencies:** none
- **What breaks/leaks if we skip it:** the paywall continues to anchor only against itself, which is the smaller of the two available anchors. Conversion stays at the current rate.
```

### B.2 Decoy — annual is not yet a strong decoy; consider lifetime

**Per Reforge's *Pricing Strategies* lesson:** decoys work when a *third* option makes your *intended* choice look favorable by comparison. Currently Furnish has 2 prices (monthly $5.99, annual $3.99/mo) — that's a 2-option choice, not a decoy structure. The annual plan is the intended choice (locked: "Save 33%" badge already favors it), so the question is whether to add a decoy that further pushes users toward annual.

**Two decoy options:**

**Option A — Lifetime $99 decoy.** Per the Economist subscription example (canonical decoy literature, also used in Reforge's psych-pricing references): a $99 lifetime tier that almost nobody buys but makes annual ($47.88) look obviously cheap. Risk: per Reforge, fragmentation. A 3-tier paywall has more cognitive friction than 2-tier. The Figma critique in *Convert and Activate Potential Customers* explicitly calls out reducing "cognitive friction" as a goal.

**Option B — Drop monthly, keep annual only.** Per Reforge *Pricing Strategies* (the consumer-view-wins principle): if monthly is the dominated option (almost nobody picks it once they see annual saves 33%), remove it. Reduces choice friction and forces commitment. Risk: monthly is a useful option for skeptical users; cutting it raises the conversion bar.

**Recommendation: Option A with caveats.** Lifetime $99 creates an anchor that doubles as price-stress relief (annual looks like 50% off lifetime, monthly looks bad). Test it. The "Founding-member pricing — locks in for life if you join this month" copy at `app.js paywall lines 959` already implies a one-time-window framing that pairs well with a lifetime offer. Do NOT make Lifetime the default-selected — keep Annual as default to avoid revenue cap (lifetime caps LTV at $99).

```
**[Dim 06] — Add Lifetime $99 decoy tier**
- **Current state in Furnish:** `index.html:931-936` toggle has 2 buttons: Monthly / Annual. Current pricing is locked (per CLAUDE.md context).
- **Proposed state:** Add a third toggle button "Lifetime" → $99 one-time. Annual stays default-selected. Lifetime button's role: anchor, not primary conversion. Add muted text below: "Pay once, never billed again." The 2-card layout is unchanged; only the toggle adds a third option.
- **Reforge framework citation:** "Per Reforge's *Pricing Strategies* lesson, pricing decisions are tested against the Monetization Triad — consumer view (does the decoy make annual feel cheaper?), growth loops (does it feed or starve them?), cost of revenue (does $99 lifetime cover lifetime compute cost?). The Economist 3-tier study is the canonical psych literature cited. Reforge cautions against fragmentation but the 3rd tier here is intentional decoy, not a real expansion path."
- **Expected impact:** Annual conversion lift 8-15% based on canonical decoy research. Track `paywall_plan_selected` granularity (currently `pro_subscription_started.plan` only takes 'mocked_trial'; needs expansion to 'monthly'/'annual'/'lifetime').
- **Effort tier:** M (toggle UI + new price-ID at Stripe-cutover time + LTV-cap analysis to confirm $99 lifetime covers expected compute cost over user lifetime)
- **Dependencies:** Stripe price ID config (already in DEFERRED.md). Compute-cost analysis: at Pro $0.05/run × 200 lifetime runs = $10 cost vs $99 revenue, comfortable margin.
- **What breaks/leaks if we skip it:** Annual is the *terminal* choice in the current 2-option layout, which means paywall users compare $5.99 vs $3.99 — a 33% delta that anchors small. With lifetime, they're comparing $3.99/mo vs $99 lifetime — a much larger and more favorable framing.
```

### B.3 Reference price — the missing competitive anchor

**Per Reforge's *Convert and Activate Potential Customers* lesson** (Drift example at p.3): "social proof by showing companies similar to us that are also using the product" + perceived-value uplift. The same logic applies to *category competitors*: where do you sit on the price ladder?

Furnish's competitive landscape:
- Pinterest: free (no purchase loop).
- Houzz Pro: $50-100/mo (designer-focused, not consumer).
- Modsy/Havenly (defunct/pivoted): historically $100-500/project.
- An interior designer: $50-200/hour, $500-5,000/room.

Furnish at $47.88/year sits 50-100x cheaper than the nearest paid alternatives. **The current paywall doesn't reference any of them.** Per Reforge's Use Case Model (Alternatives): if you don't tell the consumer where you sit relative to their existing alternatives, you forfeit the favorable comparison.

```
**[Dim 06] — Add a competitive reference-price footer to the Pro card**
- **Current state in Furnish:** `index.html:965` ends with "Cancel anytime before day 7 — no charge." No reference to Pinterest/Houzz/designer alternatives.
- **Proposed state:** Add a third footnote line: "Houzz Pro: $50/mo · Designer consult: $200+/hour · Furnish Pro: $4/mo." Three reference points, ascending then favorable.
- **Reforge framework citation:** "Per Reforge's *Use Case Model* (Alternatives), users decide based on alternatives, not in absolute terms. Per *Convert and Activate Potential Customers* lesson, perceived price is reduced by reference-pricing against more expensive alternatives — the Drift pricing-page critique highlights this gap as a primary optimization opportunity."
- **Expected impact:** paywall_shown→paywall_converted +5-10%. The reference price especially helps the "I could just use Pinterest" objection — by listing Pinterest as $0 you concede the floor, but anchoring vs Houzz at $50/mo positions Pro as 92% cheaper than the nearest *paid* alternative.
- **Effort tier:** S (one HTML line + verify Houzz Pro pricing is current)
- **Dependencies:** verify current Houzz Pro pricing on their site (it changes); legal: "Houzz Pro" is a competitor name — fine to mention in price comparison, common practice.
- **What breaks/leaks if we skip it:** Furnish Pro reads as $5/mo absolute cost with no anchor. The user's reference is Spotify ($10/mo) or Netflix ($15/mo) — making Furnish look fairly priced *for an entertainment subscription* rather than absurdly cheap *for a design tool*.
```

---

## Section C — Pro entitlement bundling audit

Reforge's *Packaging Strategies* lesson (Defining Your Packaging Strategy.pdf) asks: for each feature, plot Relative Preference Score × Willingness-to-Pay deviation from median. Without surveys we infer from pricing-research literature, segmented persona logic, and the locked decisions in CLAUDE.md / DEFERRED.md.

### C.1 The 7 Pro bullets, ranked

| # | Bullet (verbatim from `index.html:949-957`) | Inferred RPS | Inferred WTP | Production cost | Status | Recommendation |
|---|---|---|---|---|---|---|
| 1 | Premium AI quality — sharper, more accurate redesigns | **Medium** (most users can't tell at first; A/B-side-by-side reveals the diff) | Medium-High once seen | S — already routed via `routeGenerationByModelTier` | Live | **KEEP but demote** from headline. Top-bullet position oversells the legibility. |
| 2 | Multi-room batch design (coming soon) | High (saves big effort for users designing multiple rooms — "whole house" framing) | High | XL — backend pipeline doesn't exist; per `DEFERRED.md` "Multi-room batch processing" section, requires AI batch endpoint, coordination logic, batch progress UI | **Coming soon** | **CUT until shipped.** Per Reforge: don't sell features that don't exist. Move to a separate "On the roadmap" block below the bullet list, smaller text. |
| 3 | HD downloads — no watermark, social-ready | **High** | High | S — already implemented for shareable rooms (per CLAUDE.md D5 watermark decision) | Live | **KEEP and PROMOTE to top.** Per Reforge growth-loops principle: HD downloads feed the content/share loop = better growth = more affiliate clicks. The most loop-aligned Pro feature. |
| 4 | Style learns over time (coming soon) | High *if it works*; Medium until proven | Medium | XL — per `DEFERRED.md` "Style learning over time" section, requires user-vector backend, scoring weight injection, backfill | **Coming soon** | **CUT until shipped.** Same reasoning as #2. |
| 5 | Advanced price-drop filters — set thresholds + retailer prefs | Medium (only matters to users actively wishlisting) | Medium-High for that segment | M — UI work + filter logic; price data already needed for the alerts | Live | **KEEP.** Aligns with the passive-value-Pro pivot recommended in Section A. |
| 6 | A separate style profile for every person in your home | High for households/couples | Medium-High for that segment | S — multi-profile already in the codebase, just gated | Live | **KEEP and reposition.** Per Reforge Packaging matrix: this is the "Add-on" quadrant (low overall RPS but high WTP for the segment that values it). |
| 7 | Premium template library | Medium | Medium | M — content production cost; Per CLAUDE.md D4: templates are browse-free, only specific Pro templates gated | Live | **KEEP but consider cutting.** Templates are a weak differentiator if browse-free is already the rule (D4). Templates that look "premium" need real curation effort to feel premium — currently Pro templates aren't visually distinct enough. |

### C.1.1 Per-bullet detailed evaluation

**Bullet #1 — "Premium AI quality — sharper, more accurate redesigns"**

Per Reforge's *Packaging Strategy Matrix*: a feature with high-WTP but invisible-RPS (most users can't tell at first) belongs in the **Add-on quadrant** (low overall RPS × high WTP for the segment that values it), NOT the Expansion Trigger quadrant (high RPS × high WTP). Currently it's positioned as the headline trigger. Per Reforge: this is *under-fit* segmentation.

The fix isn't to cut premium AI; it's to make it *legible*. Possible mechanisms (out of scope for this dimension but flagging): a side-by-side toggle on the results screen ("see Pro version") that shows the user *exactly* what they'd get. Without that legibility mechanic, Premium AI quality stays an Add-on, not the headline.

**Bullet #2 — "Multi-room batch design (coming soon)"**

The bullet violates Reforge's *Product Marketing* principle: don't price features that don't exist. The "coming soon" label is the trust-debt accelerator — users who upgrade for it find at month 1 that they bought a promise. Per `DEFERRED.md` line 175-184, this requires (a) AI batch endpoint, (b) selection UI, (c) coordination logic to keep styles consistent across rooms, (d) async progress UI. That's an XL effort. Until it ships, cut from the entitlement list. Move to a small "On the roadmap" line.

**Bullet #3 — "HD downloads — no watermark, social-ready"**

Per the *Packaging Strategies* lesson, this is the rare bullet that crosses both packaging quadrants AND the growth-loops criterion: a feature that drives the share/content acquisition loop. Per the Slack-integrations example in *Packaging Strategies*: a feature that drives a retention/acquisition loop *should* be more accessible, not less — Slack put 10 free integrations in their Free tier *despite* high-WTP for that feature, because gating it would slow the acquisition loop.

So: should HD downloads be Free? **No.** The free version with watermark already drives shares (the watermark itself is acquisition; users post the watermarked image and other users see "Furnish" branding). Pro removes the friction *for users who care about brand-clean shares* — which is the cohort most likely to be Pro candidates anyway. The current placement in Pro is correct; the issue is that it's bullet #3 instead of bullet #1.

**Bullet #4 — "Style learns over time (coming soon)"**

Same as #2: trust debt + violation of Reforge's "don't sell what you can't deliver" principle. Per `DEFERRED.md` line 186-197, this requires user-style-vector backend, scoring weight injection in `pickItemsForRoom`, behavioral-signal capture, and a backfill migration. XL effort. **Cut.**

**Bullet #5 — "Advanced price-drop filters — set thresholds + retailer prefs"**

Per *Packaging Strategies* — Add-on quadrant: low overall RPS (most users don't actively wishlist), high WTP for the segment that does. This is fine bundled in Pro because the complexity-to-deliver is low (filter logic, threshold UI). Reforge would also note: this is the *power-user* hook for users who've passed activation and are deep in the wishlist loop. Surface contextually (Section D entry).

**Bullet #6 — "A separate style profile for every person in your home"**

Per *Use Case Model* — the Persona dimension says "same product, different who" justifies different monetization. Multi-profile addresses this directly: a household has multiple "whos" with different styles. Per CLAUDE.md decision D3 — multi-profile = Pro is locked. This is the cleanest Pro entitlement in the bundle: clearly differentiated, segment-targeted (households), small production cost (already in code, just gated at `app.js:829-840`).

**Bullet #7 — "Premium template library"**

Per `CLAUDE.md` D4 — templates are browse-free, only specific Pro templates gated. This is a weak differentiator because the Free tier already gets full template browsing. The Pro distinction is invisible until the user clicks a Pro-locked template. Two options: (a) cut this bullet entirely (the differentiation is too thin), or (b) invest in 10-20 *visibly* premium templates (designer-named, photography-quality preview images) so the perceived premium is real. Currently neither — leave or cut.

### C.2 Critical issues with the current bundle

**Issue 1: 2 of 7 bullets (29%) are vaporware.** Per Reforge *Product Marketing* + *Packaging Strategies* (cost of serving features): users who upgrade for "Style learns over time" and never get it churn at month 2, raising CAC payback. Cut both until shipped.

**Issue 2: ordering is wrong.** Premium AI quality is bullet #1 but it's the least *legibly* differentiated. HD downloads + multi-profile have stronger immediate-perceived-value + are loop-aligned. Reorder: HD → multi-profile → advanced price filters → premium AI quality → premium templates.

**Issue 3: missing bullet that justifies the price.** The current 7 bullets answer "what do I get?" but none answer "why does this cost $48/year?" Per Reforge *Convert* lesson: a bullet like "Save 30+ hours of Pinterest browsing per renovation" justifies the price by anchoring against time saved. Add one.

```
**[Dim 06] — Reorder Pro bullet list and cut "coming soon" features**
- **Current state in Furnish:** `index.html:949-957` lists 7 bullets in current order: Premium AI quality (#1), Multi-room batch [coming soon] (#2), HD downloads (#3), Style learns [coming soon] (#4), Advanced price filters (#5), Multi-profile (#6), Premium templates (#7).
- **Proposed state:**
  ```html
  <ul class="paywall-list">
    <li><span class="bullet">✓</span> <strong>HD downloads</strong> — no watermark, share-ready for Instagram & Pinterest</li>
    <li><span class="bullet">✓</span> <strong>A separate style profile per person in your home</strong></li>
    <li><span class="bullet">✓</span> Advanced price-drop filters — set thresholds + retailer preferences</li>
    <li><span class="bullet">✓</span> Premium AI quality — sharper, more accurate redesigns</li>
    <li><span class="bullet">✓</span> Premium template library</li>
  </ul>
  <p class="paywall-roadmap muted small">On the way: multi-room batch design · style learning that adapts to your taste</p>
  ```
- **Reforge framework citation:** "Per Reforge's *Packaging Strategies* lesson (Defining Your Packaging Strategy), the high-RPS × high-WTP quadrant is the 'expansion trigger' and should drive the upgrade path. HD downloads + multi-profile are the legible-now expansion triggers; multi-room batch + style-learning are roadmap items, not entitlements. Per *Product Marketing*: don't sell features that don't exist."
- **Expected impact:** paywall_converted +10-20%. HD-first framing is loop-aligned (better shares = more acquisition = bigger affiliate base). Cutting 2 vaporware bullets reduces churn at trial-end (users won't feel cheated) — protects MRR retention by ~5-10%.
- **Effort tier:** S (HTML edit, copy refinement)
- **Dependencies:** none
- **What breaks/leaks if we skip it:** users upgrade for "Style learns" or "Multi-room batch", discover at month 1 that they're locked behind "coming soon," churn. Trust debt accumulates. Trial-to-paid conversion appears strong but month-2 retention craters.
```

---

## Section D — Upsell pacing audit

### D.1 Current state

Per `app.js:4245-4300` — `renderPremiumUpsellHint(room)`:
- Activation rule: skip first 2 redesigns (preserves aha moment), eligible from generation #3.
- Frequency rule: max 1 per session.
- Cooldown rule: 7 days between surfaces.
- Surface: in-results banner with copy "Want sharper redesigns next time? Pro routes you to our premium AI model."
- Triggering context only: `results_post_generation`.

Per Reforge *Convert and Activate Potential Customers* lesson: upsells should fire at the **value moment** — the moment of highest perceived value, not at an arbitrary count. The Postmates "Join the Party" example (p.10) fires when the user is in cart-flow (i.e., their perceived value is near-peak: they've assembled a meal). Current Furnish pacing is *count-based*, not *value-moment-based*.

### D.2 Per-context audit of the 8 paywall contexts

Reviewing each `PAYWALL_COPY` context at `app.js:911-951`:

**1. `premium_quality` — fires post-3rd-gen.** 
- Trigger: count-based (gen #3+). 
- Better trigger: post-attempt-to-share-low-quality-image, OR post-affiliate-click-on-multiple-items (purchase-intent signal). Per Reforge: the user clicking shop buttons signals their perceived value is high, which is the moment to upsell HD/share-ready output.
- Pacing: once-per-session + 7-day cooldown is reasonable, but tighten on `premium_quality_upsell_dismissed` → 14-day cooldown (dismissal is a signal to back off).

**2. `advanced_price_filters` — has no specified trigger.**
- Should fire: post-3rd-wishlist-save (the user is a wishlist power user, threshold filters become useful). Currently presumably fires on a UI control click — too late, low-intent.
- Better: when a user has 5+ alerts and 0 customizations, surface "Want to filter these to only ≥20% drops?"

**3. `template_pro` — fires when the user clicks a Pro-locked template.**
- Trigger: action-based, this is correct per Reforge value-moment principle.
- Issue: the resume mechanic at `app.js:1041-1050` only works for templates. **Don't change the trigger; works as designed.**

**4. `hd_export` — fires on attempted-share without HD.**
- This trigger is the Reforge gold standard: user is *trying* to do the thing Pro enables, perceived value is at peak. Confirmed correct.
- Refinement: copy should reference the user's target platform — "Sharing to Instagram? HD removes the watermark." Detected via the share-sheet-target.

**5. `profile` — fires on multi-profile creation attempt.**
- Trigger: action-based. Correct per Reforge.
- Refinement: if user already has 1 profile, surface the upsell with the partner's-perspective framing: "Your partner's style won't match yours — give them their own profile."

**6. `multi_room_batch` — coming soon.** 
- Per Section C audit: cut from paywall surfaces until shipped. Don't fire this context anywhere user-visible. Keep the constant for back-compat, comment that it's currently inert.

**7. `advanced_personalization` (style learns) — coming soon.**
- Same as #6.

**8. `generic` — fallback.**
- Per Reforge: a generic paywall fires when no other context matches, which is a *failure mode* — the user got to a paywall without a specific value-moment. Should be exceedingly rare. Audit usages and replace each with a contextual trigger.

```
**[Dim 06] — Replace count-based premium_quality upsell with value-moment triggers**
- **Current state in Furnish:** `app.js:4252-4253` checks `if (used < 3) return;` — purely count-based.
- **Proposed state:** Add three value-moment triggers in addition to (or replacing) the count gate:
  1. Post-1st-affiliate-click-with-2+-items: "You're picking out pieces — want sharper renders to share with your partner?" → fires `openPaywall('hd_export')` (better-targeted Pro)
  2. Post-attempt-to-share: detected at the share-button click handler; fires `openPaywall('hd_export')`.
  3. Post-3rd-redesign on the *same* room (revisit signal): "Refining this room? Pro's premium AI handles edges + lighting better." → fires `openPaywall('premium_quality')`.
  Keep the current 3rd-gen trigger as a fallback but lower-priority — only fires if no value-moment trigger has fired in 14 days.
- **Reforge framework citation:** "Per Reforge's *Convert and Activate Potential Customers* lesson, upsells fire at the *value moment* — the Postmates 'Join the Party' example demonstrates: trigger on cart-engagement, not on session-count. Count-based pacing is the correct *frequency cap* but not the correct *trigger*."
- **Expected impact:** premium_quality_upsell_clicked / premium_quality_upsell_shown ratio improves from ~5-10% (count-based industry baseline) to 15-25% (value-moment baseline). Fewer dismissals = less wear-out.
- **Effort tier:** M (3 new event hooks + trigger logic + analytics naming)
- **Dependencies:** existing `trackAffiliateClick`, share-button event already exists.
- **What breaks/leaks if we skip it:** the upsell fires on "you've used 3 generations" with no value-moment context, gets dismissed at high rate, burns the 7-day cooldown for low-intent surfaces, missing the high-intent moments (affiliate click, share-attempt) where Pro would land.
```

```
**[Dim 06] — Tighten cooldown on dismissal vs. on-shown**
- **Current state in Furnish:** `app.js:4256-4260` 7-day cooldown applies regardless of outcome (shown vs dismissed vs converted).
- **Proposed state:** Differentiate:
  - Shown but no action (auto-removed, didn't dismiss): 7 days (current)
  - Explicitly dismissed (`puh-close` clicked): **21 days** + suppress that specific context (don't re-fire `premium_quality` again, but `hd_export` is still allowed)
  - Converted: never fire any paywall again (already implicit via `isPro()` check)
- **Reforge framework citation:** "Per Reforge's *Optimization Strategies* (incentives module): explicit dismissal is a stronger negative signal than passive ignore. Treating them the same wastes the cooldown budget on users who actively said 'no' to this specific Pro sell."
- **Expected impact:** Reduces upsell wear-out and increases conversion on 2nd surface (when it does fire, it's against a fresher cohort). Estimated 10-15% reduction in `premium_quality_upsell_dismissed` rate.
- **Effort tier:** S (state field `_premiumUpsellDismissedAt` + branch in cooldown check)
- **Dependencies:** none
- **What breaks/leaks if we skip it:** users who dismissed the upsell see it again 7 days later and dismiss again, wearing out the surface and growing irritated.
```

---

### D.3 Pacing meta-principle: never block, always nudge

Per Reforge's *Convert and Activate Potential Customers* lesson: the optimization equation is `Perceived Value > Perceived Price + Friction`. Hard blocks (paywall-or-nothing) maximize friction. Soft nudges (toast + "want more?" affordance) preserve flow. Per the Reforge Airbnb example: ID upload happens *after* you've found a property — perceived-value high, friction tolerable. The Furnish equivalent: never interrupt a redesign-in-progress with a paywall. Always wait until the user has *experienced* the value, then surface the upsell at the natural completion moment.

Current Furnish behavior is good on this — the premium upsell is a banner, not a modal blocker (`renderPremiumUpsellHint` adds a `<div>` after `#totalsCard`, doesn't gate progress). Confirm in any future paywall surface decisions: hint, don't block.

### D.4 Pacing wear-out — analytics to add

Per the Reforge *Existing Healthy Customers* lesson (Strategies for Existing Healthy Customers — Increase Depth): the team needs to know which upsells are *converting healthy customers* vs. *annoying healthy customers*. Required event additions:
- `paywall_dismissed { context, source }` — currently the close button fires `closePaywall()` but no analytics. Add the dismiss event, mirroring the `premium_quality_upsell_dismissed` pattern.
- `paywall_converted_path { context, gens_at_paywall, days_since_signup, affiliate_clicks_pre_convert }` — segment converters by their pre-convert behavior. The team needs to know whether the high-converting cohort is "saw paywall on day 1" or "saw paywall after 5 redesigns + 3 wishlist saves."

These additions slot into the analytics surface listed in Section E entry 7.

---

## Section E — Recommendation entries (≥6)

```
**[Dim 06] — Reframe Pro headline from "Premium AI" to "Your design partner's full toolkit"**
- **Current state in Furnish:** `index.html:908` paywall H3 default = "Sharper redesigns, every time" (premium_quality context). Anchors the entire paywall on a feature most users can't visually distinguish.
- **Proposed state:** Default H3 (generic context): "Your full design partner — sharper renders, household profiles, share-ready downloads, smarter price tracking." Lead with the *bundle*, not a single feature.
- **Reforge framework citation:** "Per Reforge's *Use Case Model* (Why dimension), differentiation must be legible vs alternatives. 'Premium AI' is invisible; 'household profiles + share-ready downloads + price tracking' is concrete and answers the natural-frequency challenge from Section A — these are the entitlements that accrue value between redesigns."
- **Expected impact:** paywall_shown→paywall_converted +5-12%, reduces churn at trial-end by 10-15% (users upgraded for *the bundle* not for a single feature).
- **Effort tier:** S
- **Dependencies:** none
- **What breaks/leaks if we skip it:** Pro continues to rest on the weakest legibility leg of its value-prop (premium AI quality), and the strong bundle elements (multi-profile, HD, alerts) stay buried at #5/#6/#7.
```

```
**[Dim 06] — Add a give-get referral loop to align Pro with growth loops**
- **Current state in Furnish:** No referral mechanism. Affiliate clicks fire (`app.js:3695-3713`) but no user-to-user incentive.
- **Proposed state:** "Give a friend Pro for 3 months free. You get a month free for each one who converts." Surface in: post-conversion welcome modal, profile screen, and as a "Maybe later" alternative on the paywall (instead of dismissing → "Not now, but I'd share Furnish with a friend"). Track `referral_invite_sent`, `referral_invite_redeemed`, `referral_self_credit_applied`.
- **Reforge framework citation:** "Per Reforge's *Pricing Strategies* lesson, the Gusto example demonstrates: subscription margin can fund give-get incentives that accelerate the acquisition loop. Per the Reforge Monetization Triad, this aligns Pro pricing with growth loops — currently the loop alignment is missing."
- **Expected impact:** Acquisition lift +15-30% (referral programs in B2C subscription apps typically deliver 20-40% of new users at scale). Pro-to-Pro CAC drops to near-zero for the referred segment.
- **Effort tier:** L (referral code generation, tracking, redemption flow, Stripe coupon integration at cutover)
- **Dependencies:** Stripe billing (DEFERRED.md), referral-code table in Supabase, deep-link handling.
- **What breaks/leaks if we skip it:** Pro is a flat subscription with no growth-loop coupling. Affiliate-Maximalist drives acquisition but Pro doesn't compound it. Per Reforge: "Pricing decisions can affect the model in compounding ways" — currently zero compounding.
```

```
**[Dim 06] — Audit FTC affiliate disclosure for trust without conversion bleed**
- **Current state in Furnish:** Per CLAUDE.md context, FTC disclosure is inline + modal (`app.js:993-1013`). Click-through to disclosure modal fires `affiliate_disclosure_viewed`.
- **Proposed state:** Wording test. Current implied wording (per `affiliateLearnMore` modal) likely reads as legalistic. Replace with: "We earn a small commission when you buy through Furnish — no extra cost to you, and it lets us keep AI redesigns free." Clarity + reciprocity framing.
- **Reforge framework citation:** "Per Reforge's *Brand Marketing* and *Convert* lessons, trust signals beat optimization tricks. The Drift critique notes: motivational boosts (urgency, social proof) work *because* the underlying trust is intact. A disclosure that reads as obligation kills trust; one that reads as reciprocity reinforces it."
- **Expected impact:** Affiliate click-through rate +5-10% on the *disclosed* paths (counterintuitive: better disclosure boosts conversion because users trust the recommendation more, not less). Track via `affiliate_click` segmented by `affiliate_disclosure_viewed=true`.
- **Effort tier:** S (copy edit + A/B if you want rigor)
- **Dependencies:** none
- **What breaks/leaks if we skip it:** users perceive Furnish as a recommendation engine that's hiding incentives, click less, affiliate revenue caps below potential.
```

```
**[Dim 06] — Add a cost-of-revenue guardrail for Free power users**
- **Current state in Furnish:** Free is unlimited generations on Flux Schnell ($0.005-0.01/run). Per `DEFERRED.md` rate limits will cap at 200/day post-launch. A user generating 200/day for 30 days = $30-60 compute cost — guaranteed loss.
- **Proposed state:** Add a soft signal at gen #50 (Free user, single month) that fires `openPaywall('premium_quality')` with copy: "You've redesigned 50 rooms this month — your taste is sharper than most designers. Pro's premium AI matches it." Reframes power-Free → high-likelihood-Pro candidate via flattery instead of guilt-trip. Post-launch only; pre-launch this is moot.
- **Reforge framework citation:** "Per Reforge's *Cost of Revenue* lesson (Monetization + Pricing module 02.05): when variable cost scales with usage but Free revenue doesn't, you have a structural margin trap. Power-Free users are simultaneously the highest-cost cohort AND the highest-LTV-if-converted cohort — segment them explicitly."
- **Expected impact:** ~5-10% of power-Free users convert at gen-50 prompt (the segment is small but high-LTV). Net compute-cost reduction ~$10-20/month per converted user.
- **Effort tier:** M (gen-counting in `state.events`, threshold check, post-launch only)
- **Dependencies:** real Replicate compute cost data; backend rate limits (DEFERRED.md).
- **What breaks/leaks if we skip it:** the long-tail of Free users costs more in compute than the affiliate revenue per user generates. Without intervention, scale = loss multiplier.
```

```
**[Dim 06] — Stripe price-ID cutover with grandfather coupon (lock-in promise honored)**
- **Current state in Furnish:** Per `app.js:1024-1027` paywall CTA mocks `state.user.isPro = true`. Per `DEFERRED.md` lines 64-93, real Stripe integration is deferred. The "Founding-member pricing — locks in for life if you join this month" copy at `index.html:959` creates a contract.
- **Proposed state:** When Stripe goes live, every existing `state.user.isPro === true` user gets `grandfathered: true` and a Stripe customer with a 100%-off coupon for the *original* price they "paid" at — i.e., they really do lock in at their pre-Stripe rate forever. Per `DEFERRED.md` line 77 this contract is locked already, just confirming it survives the price changes recommended in this doc.
- **Reforge framework citation:** "Per Reforge's *Strategies for Existing Healthy Customers* lesson (Optimization Strategies module 06.04): the difference between a healthy paying customer and a churned one is often the *story* you told them at conversion. Breaking the founding-member promise = breaking trust = mass churn at the cutover. The promise must be honored or the founding-member framing must be removed."
- **Expected impact:** Protects 100% of pre-Stripe Pro conversions from cutover churn. Without this, expect 30-60% churn at cutover from broken-promise perception.
- **Effort tier:** M (Stripe coupon creation per founding-member user; webhook to provision; one-time migration script)
- **Dependencies:** Stripe live (already on the deferred list); current `grandfatherProUsers()` boot hook (per CLAUDE.md context).
- **What breaks/leaks if we skip it:** the locked promise at `index.html:959` is broken at Stripe-cutover, and the founding-member cohort (the most engaged, highest-LTV segment) churns en masse and posts angry App Store reviews.
```

```
**[Dim 06] — Annual-default tactic: pre-select annual + show Total Annual visibly**
- **Current state in Furnish:** `index.html:933` — annual toggle has `class="active"` and is default-selected. Price displays as "$3.99 /month, billed annually ($47.88/yr)". Annual total is in the unit label — small, parenthetical.
- **Proposed state:** Make annual total prominent. Two options:
  - A: change main price to "$47.88 / year" with sub-line "$3.99/month equivalent · save 33% vs monthly." (single salient number to anchor)
  - B: keep "$3.99/month" but add a separate prominent line below: "**Total: $47.88/year**" (avoids the cognitive friction of dividing $5.99 × 12).
- **Reforge framework citation:** "Per Reforge's *Convert and Activate Potential Customers* lesson, reduce *cognitive friction* at decision moments — the Figma critique explicitly says 'Anchor the annual price against the monthly price' and 'add clarity'. Burying $47.88 in a parenthetical creates a moment where the user mentally calculates and gets distracted from the conversion."
- **Expected impact:** annual-plan selection rate +5-10% (incremental over current default). Annual MRR commitment is more retention-stable than monthly (per Reforge: WHEN dimension on the monetization model — annual lock-in reduces churn rate vs monthly).
- **Effort tier:** S (CSS + display logic in the annual toggle handler at `app.js:976-991`)
- **Dependencies:** none
- **What breaks/leaks if we skip it:** users see "$3.99/month" as the headline, mentally compare to $5.99/month "saving $2/month," underweight the annual commitment vs. its actual value. Some convert to monthly when they would have converted to annual with clearer framing.
```

```
**[Dim 06] — Surface paywall_shown→paywall_converted ratio in analytics dashboard**
- **Current state in Furnish:** `app.js:967` fires `paywall_shown { context }`. Line 1028 fires `paywall_converted { triggeringContext }`. Line 4281-4299 the upsell-hint analytics fire shown/clicked/dismissed. No aggregated dashboard yet (pre-launch).
- **Proposed state:** When the analytics dashboard ships (post-launch), the *primary* monetization metric should be **paywall_converted_rate per context** (`paywall_converted` count / `paywall_shown` count, segmented by `triggeringContext`). The 8 contexts have different intrinsic conversion rates and tracking the wrong aggregate hides the insight.
- **Reforge framework citation:** "Per Reforge's *Monetization Outputs* lesson (Revenue Equation), revenue = breadth × depth, and segment-level metrics are required to know which expansion path is moving. Per *Optimization Strategies* — the why-of-non-conversion is the highest-leverage diagnostic. Tracking per-context conversion rates is the only way to know which paywall context is awareness-failing vs value-failing vs friction-failing."
- **Expected impact:** Required pre-condition for any future paywall optimization. Without this, all subsequent A/B tests are blind.
- **Effort tier:** S (dashboard config, no code change — events are already firing correctly)
- **Dependencies:** Real analytics destination (currently `trackEvent` fires to local + `state.events`).
- **What breaks/leaks if we skip it:** team optimizes against aggregate paywall conversion rate, which masks the 80/20 — likely 1-2 contexts (probably `hd_export` and `template_pro`) drive most conversions while others (probably `generic`, `multi_room_batch`) drag the average down.
```

---

```
**[Dim 06] — Add `paywall_dismissed` event with reason segmentation**
- **Current state in Furnish:** `app.js:1015-1016` `paywallClose` and `paywallDismiss` both call `closePaywall()` with no analytics. We know users see the paywall (`paywall_shown`) and convert (`paywall_converted`) but the dismiss path is invisible.
- **Proposed state:** Fire `paywall_dismissed { context, dismissReason: 'close' | 'maybe_later' | 'backdrop' | 'escape', shown_for_ms }` from each dismiss path. The 4 reasons map to: × button, "Maybe later" button, backdrop click, Escape key. Time-on-paywall (shown_for_ms) is a strong signal — <2s = bounce, 2-15s = read-and-rejected, >15s = considered-and-rejected.
- **Reforge framework citation:** "Per Reforge's *Strategies for At-Risk Customers* lesson and the *Optimization Strategies* preview module: the why-of-non-conversion is the diagnostic. Aggregating dismisses without segmentation hides the cause — was the paywall closed because (a) wrong context, (b) wrong price, (c) wrong moment, or (d) bounced before reading?"
- **Expected impact:** Required pre-condition for all paywall optimization. With dismissReason + shown_for_ms, the team can A/B test interventions targeted at the actual failure mode.
- **Effort tier:** S (3 lines of code per dismiss path)
- **Dependencies:** none
- **What breaks/leaks if we skip it:** all post-launch paywall optimization is blind. Conversion is measured but rejection isn't, so the team can't tell whether a 5% conversion lift came from converting more users or from showing fewer paywalls.
```

```
**[Dim 06] — Defer the "Founding-member" promise to month 6 if user-base is too small**
- **Current state in Furnish:** `index.html:959` "Founding-member pricing — locks in for life if you join this month." This creates a price-lock contract for everyone who converts in the launch month.
- **Proposed state:** Two options:
  - A: Keep the promise (Honor lifetime grandfather, see Section E entry 5). The cost = Stripe coupon for forever. Bound the cohort by being intentional: cap at "first 1,000 founding members" if you want to manage the lifetime cost.
  - B: Soften the copy to "Locked-in pricing for your first 12 months — your rate won't go up." Less compelling but caps the lifetime liability at 12 months.
  Recommendation: **A with a cap** ("first 1,000 founding members" badge in the paywall sub-text). Creates real scarcity per Reforge's urgency principle (Drift example, Convert lesson) AND bounds the cost.
- **Reforge framework citation:** "Per Reforge's *Convert and Activate Potential Customers* lesson, urgency works by tightening the perceived window of opportunity. The Drift 'Limited time only' example demonstrates: scarcity + social proof = perceived-value lift. Per *Cost of Revenue* (Monetization Strategy lesson): every promise has a long-tail cost; bounded promises are sustainable, unbounded ones erode margin forever."
- **Expected impact:** First-month conversion lift +20-40% from urgency + scarcity. Capped at 1,000, the lifetime cost is manageable: at $48/yr × 1,000 founders = $48k/yr in revenue locked-in (not lost — locked at the launch price), vs. the same 1,000 users at unknown future price could be $60-80/yr × 1,000 = $60-80k/yr. So the *opportunity cost* of grandfather is ~$12-32k/yr at scale of 1,000 founders.
- **Effort tier:** S (copy edit + counter UI to show "X spots left")
- **Dependencies:** real user-count tracking (post-launch).
- **What breaks/leaks if we skip it:** Either (a) the promise is unbounded and erodes margin forever, or (b) the urgency framing is removed and first-month conversion drops by the urgency-loss factor.
```

## Section F — Cross-check against Reforge's worked examples

To pressure-test the Section A call, run Furnish through the same lens Reforge applies to Figma and Thumbtack in the *Monetization Model* lesson.

### F.1 Furnish on the Reforge Monetization Model template

| | **Furnish Free (use case 1)** | **Furnish Pro (use case 2)** |
|---|---|---|
| **Scale** | None — feature-differentiated only (no value metric) | Feature-differentiated (Pro features unlocked) |
| **What** | Unlimited AI redesigns at standard quality, unlimited reshuffles, item swaps, full shopping access, basic personalization, real-time price-drop alerts | Premium AI quality, multi-room batch [coming soon — CUT per Section C], HD downloads, style-learns [coming soon — CUT per Section C], advanced price-drop filters, multi-profile, premium templates |
| **Amount** | $0 | $5.99/mo or $3.99/mo annual ($47.88/yr) — within Reforge's "~$100/yr per consumer" band (Calm/Netflix/Dropbox-consumer cluster) |
| **When** | Never (free) | Monthly recurring or annual recurring |

Per Reforge's *Use Cases* lesson — comparing this structure to:
- **Figma starter / pro / org** — three feature-differentiated tiers, scale = per-editor (continuous value metric). Furnish has no value metric (no "per X" pricing). This is fine for B2C consumer apps, but it means breadth is the only revenue lever — no expansion path within a customer.
- **Thumbtack pro / consumer** — Thumbtack's pro side is per-lead (outcome value metric). The consumer side is free. Per Reforge: Thumbtack's growth-strategy advantage came specifically from charging the supply side and not the demand side, against Angie's List which charged consumers. **This applies to Furnish:** the affiliate-maximalist call IS the Thumbtack pattern — charge the supply side (affiliate commissions from retailers) and keep the consumer demand side free or near-free. Pro is a *secondary* revenue stream like Thumbtack's pro features. **Confirms the call.**

### F.2 Where Furnish diverges from Reforge orthodoxy

Three places where the current model diverges from Reforge best-practice:

**Divergence 1: no value metric.** Per Reforge *Defining Your Value Metric Strategy* lesson, feature-differentiated pricing is the most common B2C pattern (Dollar Shave Club, Calm, Netflix) but it's also the *least expansion-friendly*. Once a customer is on Pro, there's no way to extract more revenue from them without either raising price or moving them to a higher tier (which doesn't exist). Furnish has no expansion path within Pro. Acceptable for v1; flag for future.

**Divergence 2: bundle includes vaporware.** Per *Defining Your Packaging Strategy* lesson, the analysis considerations explicitly call out: "Don't over-fit this analysis to use cases. Jamming features into the 'perfect' tier can add friction." But the corollary is also: don't *under-deliver* on features you've put in a tier. Two of seven Pro bullets (29%) are unshipped. Critical fix per Section C.

**Divergence 3: no multi-tier expansion path.** Per *Strategies for Existing Healthy Customers* (lesson 06.04) — Increase Depth of Existing Use Cases: Reforge's three expansion paths are (a) deepen current use case, (b) move to higher-ARPC use case, (c) add on use cases. Furnish currently only has path (a) — and only weakly, since pricing doesn't scale with usage. No higher-ARPC tier exists. No add-on use cases exist (e.g., a "Designer marketplace" tier that connects users to actual interior designers — would be a new use case per Reforge's Use Case Model).

```
**[Dim 06] — Plan a future "Designer Connect" higher-ARPC use case**
- **Current state in Furnish:** Single Pro tier at $47.88/yr. No higher-ARPC option for users who get more value from the app and would pay more.
- **Proposed state (planning, not immediate):** Future tier "Furnish Concierge" at $19/mo — connects user to a real interior designer (15-30 min consult per quarter) on top of full Pro. Average designer-consult market rate is $50-150/hour; bundled at "1 consult per quarter" = ~$50/quarter wholesale, charged at $19/mo retail = $228/yr. Healthy margin. Per Reforge's *Strategies for Healthy Customers* (Move to higher-ARPC use case): this is the canonical pattern — same persona, higher willingness to pay, additional service layer.
- **Reforge framework citation:** "Per Reforge's *Strategies for Existing Healthy Customers* lesson (Increase Depth Of Existing Use Cases / Moving Or Adding On Use Cases): the three expansion paths require a higher-ARPC tier to exist before users can be moved into it. Furnish currently has none — Pro is the ceiling. Planning a Concierge tier creates the path."
- **Expected impact:** Future option, not immediate. ~3-7% of Pro users would upgrade to Concierge at scale (high-LTV cohort), tripling their ARPU. Not a launch-day priority but should be roadmapped.
- **Effort tier:** XL (designer marketplace, scheduling, payments-to-designer, quality-control) — defer until 1,000+ Pro users.
- **Dependencies:** designer recruitment, scheduling tools (Calendly-class), payments split.
- **What breaks/leaks if we skip it:** Pro is the revenue ceiling. Power-Pro users with high LTV have nowhere to go, capping ARPU at $48/yr/user.
```

---

## Top 3 priorities for this dimension

1. **Cut "coming soon" features from the visible Pro bullet list** (Section C entry "Reorder Pro bullet list"). Effort S, reduces trust debt at trial-end, defends month-2 retention. The single highest-leverage edit because it's both legally cleaner (you stop selling vaporware) and Reforge-orthodox (the *Packaging Strategies* lesson is unambiguous: don't price features that don't exist).

2. **Replace count-based premium_quality upsell with value-moment triggers** (Section D first entry). Effort M, lifts upsell click-through 2-3x by firing at moments of peak perceived value (post-affiliate-click, post-share-attempt) instead of at gen-count thresholds. Per Reforge *Convert* lesson — the Postmates "Party" example is the canonical pattern.

3. **Add the renovation-cost anchor to the Pro card** (Section B.1 — "Average US room renovation: $5,200. Furnish Pro: $47.88/year"). Effort S, single HTML line, reframes the entire price comparison from "vs my own monthly plan" to "vs the alternative cost the user is actually trying to avoid." Per Reforge *Convert* lesson + *Use Case Model* (Alternatives): anchoring against the consumer's existing alternative is the highest-leverage pricing-psych move available.

---
