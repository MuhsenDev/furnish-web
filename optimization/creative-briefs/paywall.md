# Creative Brief: Paywall

**Source frameworks:** Reforge *Product Marketing — Defining Effective Creative Briefs* + *Monetization + Pricing — Packaging Strategies* + *Building Proof Point Pillars (House Framework)*.
**Surface owner:** `index.html` paywall modal (`#paywallModal`); `app.js` `PAYWALL_COPY` map and `openPaywall(context)`.
**Audience:** users who hit a Pro-gated feature OR triggered the post-3rd-gen premium-quality upsell. Mid-funnel intent.

---

## Background

The paywall is Furnish's primary subscription conversion surface. Two cards side-by-side:
- **Free** (left, current plan, source: `FREE_PLAN_CARD` in `app.js`).
- **Pro** (right, varies copy per context, structure stays).

Eight contexts trigger the paywall: `premium_quality`, `advanced_price_filters`, `template_pro`, `hd_export`, `profile`, `multi_room_batch` (retired Batch 1), `advanced_personalization` (retired Batch 1), `generic`. Per Conflict 3 lock, vaporware contexts are gone — replaced by a Roadmap link in the footer.

---

## Guardrails

- **Voice rubric** (locked): Concrete, Confident, Warm, Calm. The paywall is where Confidence-8 gets tested most.
- **No fake numbers** (Rule 1): no fictitious review counts, no fictitious cohort-behavior claims.
- **No calendar-period language** (Rule 2).
- **No vaporware bullets** (Conflict 3 lock): Pro card lists ONLY what currently ships. Roadmap is opt-in disclosure in the footer.
- **Founding-member language** is the one earned scarcity claim — keep it intact.
- **Title Case** on bullet headlines; **sentence case** on bullet bodies.

---

## Wording restrictions

**Must appear (locked Batch 1):**
- *"Sharper redesigns. Every household."* (generic context title)
- *"Pro upgrades the AI on every redesign and adds a separate style profile per person. The features below are why."* (generic context sub)
- *"Cancel before day 7 — no charge. We don't auto-bill surprise."* (replaces fictitious "2,400+ reviews" trust line)
- *"Founding-member pricing — locks in for life if you join this month."* (urgency line — earned, structurally true)
- Each Pro bullet is a present-tense feature statement (not promissory)
- *"What's on the roadmap →"* (footer link to roadmap modal)

**Must NOT appear:**
- *"Most members redesign N rooms in their first month"* (and any cohort-behavior claim that isn't backed by real data)
- Any review count, star count, or user count without a real source
- *"Coming soon"* labels on visible bullets (per Conflict 3 lock — they live in the roadmap modal)
- Comma-separated feature lists in the sub line (the textbook anti-pattern)
- Hype verbs (*unleash, transform, elevate, supercharge*)

---

## One Key Takeaway

> **Your household, your style, sharper.**

The paywall sub restates the OKT compressed (Per Reforge House Framework: roof OKT → pillars below it). The bullets carry the features.

---

## Proof point pillars (House Framework)

| Pillar | Where in paywall |
|--------|------------------|
| Functional | "Premium AI quality — sharper, more accurate redesigns" (bullet 1) |
| Emotional  | "Sharper redesigns. Every household." (title) |
| Accrued    | "A separate style profile for every person in your home" (bullet 4) |

Per-context paywall copy should pick the pillar that maps to the user's just-experienced moment:
- **premium_quality context** (post-3rd-gen): emotional pillar headline.
- **profile context** (creating 2nd+ profile): accrued pillar headline.
- **hd_export context**: functional pillar adapted ("Export in HD, no watermark").
- **template_pro context**: functional pillar adapted ("Premium templates").
- **advanced_price_filters**: functional pillar adapted.
- **generic**: OKT compressed (current Batch 1 copy).

---

## Pricing presentation

- Annual ($3.99/mo billed annually = $47.88/yr — "Save 33%") is the default-selected option.
- Monthly ($5.99/mo) is the contrast anchor.
- The **renovation-cost anchor** ($47.88/yr vs. ~$5,200 average US room renovation) is queued for a future paywall iteration per Master Priority Stack #5. Not in Batch 1 to keep paywall changes scoped.

---

## Measurement

- `paywall_shown { context }` (existing)
- `paywall_converted { triggeringContext, from, to, source }` (existing)
- `paywall_roadmap_viewed` (NEW — Batch 1, when user opens the roadmap modal)
- `paywall_dismissed { context }` (TBD — Dim 13 instrumentation pass)
- Per-context conversion rate: which paywall context converts best? Drives future copy iteration.

---

## Variants on deck

- Renovation-cost anchor (Master Priority Stack #5)
- Replace count-based premium_quality upsell with value-moment triggers (Master Priority Stack #24)
- Drop monthly tier entirely (testing whether annual-only converts at the same rate but ARPU rises)
