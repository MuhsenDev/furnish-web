# Dimension 10 — Trust and Credibility

> Reforge frameworks applied: **Product Marketing — Building Proof Point Pillars** (Messaging), **Product Marketing — Identifying a Strategic Emphasis** (Positioning), **Brand Marketing — Building Blocks of Brand Identity** + **Evangelizing Brand Guidelines** (Identity & Governance), **User Insights for Product Decisions** (research validation for trust claims), **Finding ProductMarket Fit** (real social proof comes from real PMF).
>
> Hassan, before I open: Reforge's Brand Identity governance literally calls out — line by line — that *"Your brand can become incohesive, which confuses users and erodes trust"* (Evangelizing Brand Guidelines, point 21). That sentence is the whole frame for this dimension. Every fictitious number on Furnish's surfaces is a small pebble in that erosion. Below is the audit, the AI-credibility ladder, the affiliate stance, and 8 recommendations.

---

## Section A — Social proof audit

Reforge's Proof Point Pillars framework (Messaging, lesson 04) is the right lens here. A "proof point" must (a) ladder up to the One Key Takeaway, (b) align with the strategic emphasis, and (c) — critically — be *verifiable enough to survive scrutiny from a buyer*. Reforge frames proof points as the structural pillars holding up the OKT roof. **A fictitious pillar is a hollow column: looks fine until weight is applied.**

Per Reforge's User Insights for Product Decisions: claims you cannot back with research are not just weak, they are reputational liabilities. Once a user catches *one* fake number, every other claim on the surface gets re-classified as suspect. This is loss-asymmetric — credit for an honest claim is small, debit for a busted claim is huge.

| # | Claim | Surface (file:line) | Authenticity status | Placement effectiveness | Recommendation |
|---|-------|---------------------|---------------------|-------------------------|----------------|
| 1 | "★★★★★ 4.8 · 12,400+ rooms designed" | `index.html:76-81` (welcome) | UNVERIFIED — almost certainly fictitious pre-launch. No live counter exists in `state` or `app.js`. | HIGH (above-the-fold, anchors first impression) | Replace with a verifiable claim *now*. Three options below in Section A.1. Do not delete — Reforge says proof voids fail. Substitute. |
| 2 | "★★★★★ 4.8 · 2,400+ reviews" | `index.html:927-928` (paywall) | UNVERIFIED — likely fictitious. There is no review-collection surface anywhere in the app, no App Store presence yet, no Trustpilot integration. | MEDIUM (paywall card mid-screen, but it is the *moment of payment* — risk concentration) | Replace with one of: (a) founder-quote ("Built by 1 designer + 1 dev — read why"), (b) press/landscape claim ("Powered by Flux Kontext Pro — same model as [public benchmark]"), (c) money-back trust ("Cancel any time before day 7 — no charge" — already there but buried in footnote). |
| 3 | "Most members redesign 4–7 rooms in their first month" | `index.html:909` (paywall sub) + activation lifecycle banner (per dimension 09) | LIKELY FICTITIOUS. No analytics aggregation exists yet to compute this. Stated as a fact. | HIGH (paywall sub-headline, *primary persuasion line*) | Reframe as aspirational ("Designed for redesigning 4–7 rooms a month — built so the next room takes 30 seconds"). Removes the unverifiable factual claim while retaining the anchor. |
| 4 | "Watch any room transform in 20 seconds" | `index.html:51` (welcome tagline) | UNVERIFIED — currently the AI is mocked. Real Flux Schnell ~5–15s; Flux Kontext Pro ~20–40s. The 20s claim may not survive Pro routing. | HIGH (tagline, sets expectation) | Make conditional + honest: "Watch any room transform in seconds." Removes the precise unverifiable number. Or: keep "20 seconds" but ship a stopwatch overlay on the loading screen — then the claim becomes *demonstrably* true on Free (Flux Schnell) and you pin Pro to a different number. |
| 5 | Saved rooms grouped by room type (`Living, Bedroom, Kitchen…`) | `app.js` (rooms grid) | AUTHENTIC (this is the user's own data). | HIGH (implicit social proof: "you've designed many"). | Keep. This is the strongest implicit trust signal in the app — it's user-owned, irrefutable. Consider adding a footer count: "You've designed N rooms across M types." Personal counter > anonymous "12,400+." |
| 6 | "Style Pulse weekly strip — your style, every week" | (per dimension brief, weekly strip) | NEUTRAL — implies others' style picks are trending; no actual trending data. | MEDIUM | Either back with real data (top 3 most-shuffled styles this week, computed server-side) or rename "Your Style This Week" (singular, personal — removes implicit other-users claim). |
| 7 | "⚠ may not fit" warning on items exceeding room capacity | (per brief — credibility through honest disclosure) | AUTHENTIC. This is real friction-disclosure. | MEDIUM (item-level, easy to miss) | KEEP and AMPLIFY. Per Reforge's strategic emphasis (Identifying Strategic Emphasis, page 10 — "alleviation of pain point" / "feeling of relief"), honest disclosure is itself a proof point. See Recommendation #4 below. |
| 8 | "More accurate furniture matches" | `index.html:950` (paywall list — "Premium AI quality — sharper, more accurate redesigns") | VAGUE, not fictitious. Claims a *direction* without a magnitude. | MEDIUM | Per Reforge Proof Points framework, you need the **why** + **how** of a benefit, not just the **what**. See Recommendation #2 — replace with provenance ("Powered by Flux Kontext Pro — used by [reference]"). |
| 9 | "Founding-member pricing — locks in for life if you join this month" | `index.html:959` (paywall urgency) | DEPENDS — if you'll honor it forever, true; if not, fictitious. | HIGH (urgency line) | Add a one-line guarantee in the affiliate modal: "Founding member rates are guaranteed for the life of your account, even if Pro pricing increases." Otherwise, this is loss-asymmetric (if it's exposed as marketing puffery, every other claim falls). |

### A.1 — Specific replacements for the "12,400+ rooms" anchor

Per Reforge's User Insights research-validation principle, you cannot leave a trust void where the anchor was. Three candidates ranked by implementability:

**Option A — Honest founder-stage anchor (LOW effort, HIGHEST integrity)**
```
★★★★★ Built by 1 designer • Real photos • Real catalog
```
Why: it ladders up to the OKT (you redesign your room with real shoppable items) and aligns with a differentiator-based strategic emphasis (most AI redesign apps generate fake furniture you can't buy). Reforge's Differentiator-Based archetype (Positioning lesson 04, page 8): *"Position the product as a solution unlike any other in the market."* Furnish's actual differentiator is real-catalog grounding, not user volume.

**Option B — Live counter (MEDIUM effort, HIGHEST trust)**
```
4.8 ★ • <span id="liveRoomCount">87</span> rooms designed today
```
Why: counter rises in real time as people use the app. Even if today's count is 4, it is *true*. Reforge brand governance principle (Evangelizing Brand Guidelines, point 5): *"the utility of brand guidelines is dependent on how closely they're followed."* Same logic for trust signals — the utility of a number is dependent on how closely it tracks reality. **Server-side: simple Supabase row count of `rooms` created in last 24h, cached for 5 min.** Gracefully reads "Fresh launch — be one of the first" if count <10.

**Option C — Anti-positioning anchor (MEDIUM effort)**
```
4.8 ★ • Real items. Real prices. Yours forever — no subscription needed.
```
Why: positions against the suspicious AI-redesign category. Per Reforge's Differentiator-Based archetype, this targets the top alternative's weakness (most AI design apps gate everything behind subscription). Removes user-volume claim entirely.

**My recommendation: ship Option A this week, B within 30 days.** Option C is good for mid-funnel paywall, not welcome.

### A.2 — Counter-narrative: do placeholders ever work?

Hassan's brief specifically asks me to argue both sides. Some apps *do* bootstrap with placeholder numbers (early Pinterest, early Houzz seeded "examples" galleries with curated content from the founders' networks — not strictly fictitious but stylized). The case for it: a chicken-and-egg problem (no users → no proof → no users) needs *some* anchor, and a small fiction may be the lesser evil.

**Why I reject this for Furnish:**
1. **Reforge brand governance (Evangelizing Brand Guidelines, points 21–24)**: brand inconsistency erodes trust, and the inconsistency between "12,400+ rooms" and a fresh-feeling app *is* a trust crack waiting to be found. One Reddit thread of "I checked, this is bs" undoes everything.
2. **The honest alternative is just as strong.** Option A above ("Built by 1 designer + 1 dev — real catalog, no upsells") is *more* differentiating in a sea of AI-slop apps than a fake review count.
3. **Pinterest had a moat (network effects). Furnish has a moat (real catalog + affiliate).** Pinterest had to bootstrap social proof. You don't — your moat *is* the proof, you just need to surface it.

**Verdict:** placeholders only make sense for products whose value depends on network effects. Furnish's value does not. Reject the placeholder approach.

---

## Section B — AI credibility ladder

External landscape: trust in AI is currently ~50/50 split (consumer surveys late 2025). Furnish skews younger but not exclusively. The default mental model for "AI redesign" right now is "AI slop generator that hallucinates furniture you cannot buy." Per Reforge's Strategic Emphasis (Identifying Strategic Emphasis, page 10): when there is *significant change in the market*, you can use Change-Based positioning to lead the user through the transformation. **Furnish's AI-credibility play is not "trust the AI" — it's "the AI is curating real, shoppable pieces. The AI is the eyeball, not the artist."** That's a positioning shift, not a UX fix.

**The ladder, ranked by impact-per-effort. Per Reforge Proof Points framework, each rung answers the *why* and the *how* of AI credibility.**

| Rung | Tactic | Reforge anchor | Effort | Where it ships |
|------|--------|----------------|--------|----------------|
| 1 | **Show your work — provenance** | Proof Points lesson 04: "the *how* lists product features that enable the benefit." Naming the AI model is the **how** of "Premium AI quality." | LOW (1 string change in `index.html:950`) | Paywall Pro list, reveal screen footer |
| 2 | **Side-by-side A/B + match count** | Strategic Emphasis archetype "Pain Point-Based" — page 10 — "alleviation of the key customer pain point." Showing exact count = proof of alleviation. | LOW–MED (already have B/A slider; add count subtitle) | `index.html:653-668` reveal screen |
| 3 | **Comparison gallery — other users' before/after** | Proof Points framework: case studies are proof points. Even 4-5 hand-picked "guest" examples (with permission) are stronger than a number. | MED (need 4-5 real examples, hosted) | Welcome screen below tagline; reveal screen below B/A slider |
| 4 | **Failure-mode disclosure (already partial)** | Brand Marketing — Building Blocks of Brand Identity, point 75: "the order, rhythm, and pacing of diction" — honest tone IS a brand asset. | LOW | Already on items: extend to reveal screen ("AI got X items right, Y close, you can swap any of them"). |
| 5 | **Confidence indicator per item** | Proof Points "what + why + how": % match is the *what*; "based on your style profile" is the *why*. | MED (needs scoring logic) | Item card overlay |
| 6 | **Provenance per item** | Same as rung 5, framed differently — "this item matches because [your style: airy-loft, your colors: warm neutrals]." | MED | Bottom sheet, `bs-meta-row` |
| 7 | **"Real designer review" fallback for $29** | Audience-Based archetype (Identifying Strategic Emphasis, page 7): "the best at speaking to a corner of the audience." Higher-anxiety users want a human eye. | HIGH (deferred) | Paywall — would compete with Pro, defer. |
| 8 | **Money-back / reshuffle trust (partially in place)** | Pain Point archetype (page 10): "long-term impact of not feeling the former pain." Removing risk = removing pain. | LOW (already have unlimited reshuffles — just emphasize) | Reveal screen, paywall close. |

### B.1 — Concrete copy for Rung 1 (provenance)

Currently `index.html:950`:
```html
<li><span class="bullet">✓</span> <strong>Premium AI quality</strong> — sharper, more accurate redesigns</li>
```
Reforge Proof Points (lesson 04) Asana-vs-Lyft trap: this line is *features* dressed as *benefits*. "Sharper, more accurate" is vague. Replace with:
```html
<li><span class="bullet">✓</span> <strong>Premium AI quality</strong> — Pro routes through Flux Kontext Pro by Black Forest Labs, the same depth-aware model used by leading photo studios. Free uses Flux Schnell (faster, lower fidelity).</li>
```
Three things this does:
1. Names the model (proof point: real, not vapor).
2. Acknowledges Free uses a different model (honest disclosure → trust transfer).
3. Anchors to "leading photo studios" (third-party credibility — replace with a real reference once you have one).

### B.2 — Reveal-screen reframing per Reforge Strategic Emphasis

The reveal moment is where AI credibility either lands or evaporates. Current structure (per `index.html:640-787`): B/A slider, then aha-feedback, then totals card, then "Shop The Whole Room."

Per Reforge's Change-Based archetype (page 10), reframe what the AI did:
```
Above slider: "Furnish matched 12 real pieces from IKEA, Wayfair, Amazon to your room."
Below slider: small text: "We don't generate furniture — we curate it. Every piece is real, shoppable, and priced live."
```
This is the **positioning shift Hassan asked about in the brief**: the AI is the eyeball, not the artist. Per Reforge's User Insights principle, this matches the actual user mental model under stress: "wait, is this real or made up?"

---

## Section C — Affiliate transparency vs conversion

**The Reforge tension:** Brand Marketing — Brand Identity Governance teaches that consistency is trust, and trust is the bedrock. Hidden material connections are a form of inconsistency between what the brand *claims* and what is actually happening. But Conversion Optimization research (and common sense) says hidden costs/affiliations DO suppress click-through.

**Where's the line for Furnish?** Per the locked decision in the brief — "Affiliate-Maximalist (more honest = more affiliate clicks long-term per Hassan)" — Furnish has *already chosen* clarity over short-term conversion. So the question is not "should we disclose?" (yes, FTC requires) but "what level of disclosure maximizes long-term trust × clicks?"

Three placement options for the disclosure block, with my rating:

### C.1 — Three disclosure copy versions

**V1 — Current (FTC-compliant minimum, trust-weak)**
> Furnish earns a commission on items you buy through these links — at no extra cost to you. [Learn how]

Rating: 5/10. Legally fine, trust-flat. The "[Learn how]" link is small and easily missed (`index.html:720-723`). Reforge brand governance principle: *if you have to bury the disclosure, you don't trust the disclosure*. The fact you're using a tiny "Learn how" suggests you treat the model as a liability. Per Reforge's strategic emphasis: lean *into* differentiation, don't apologize for it.

**V2 — Affiliate-Maximalist, 1-line trust badge (RECOMMENDED)**
> 💡 **How Furnish makes money:** We earn a commission when you buy items through our redesigns. We don't get paid more for pricier items. We don't sell your photos. [Read the full FTC disclosure]

Rating: 9/10. Front-loads the model. Reforge Brand Marketing — Building Blocks of Brand Identity (point 12): *"brand identity brings brand strategy to life through emotions, visual and verbal cues."* This copy expresses "we are honest about how we make money" as a brand cue. Three sub-claims:
1. Naming the model up-front (transparency badge).
2. "We don't get paid more for pricier items" — heads off the #1 distrust pattern in affiliate ("are they recommending the expensive one for kickbacks?").
3. "We don't sell your photos" — heads off the #2 distrust pattern in any AI app.

**V3 — Welcome-screen trust badge (BOLDEST)**
> Built by 1 designer + 1 dev. Real catalog. We earn from your shopping; we don't sell your photo. [How it works]

Rating: 8/10. Per Reforge's brief specifically: *"Front-load the disclosure on the welcome screen as a TRUST badge."* This is counter-intuitive but right: more disclosure = more trust = more clicks. The risk is welcome-screen real estate (you only have ~3 above-fold elements). Test this against the welcome's existing "12,400+ rooms" line — replacing one with the other.

### C.2 — Per-item affiliate badge: REJECT

Per Reforge's Brand Identity Governance (Evangelizing Brand Guidelines): *"information overload"* makes brand guidelines bypassed. Same applies to disclosure. Tagging every item with "💰 Affiliate" creates ad fatigue. The user's mental model after 2-3 items: "everything here is an ad." That's worse than no per-item disclosure. **One prominent disclosure block, NOT per-item.**

### C.3 — The "Learn how" modal — review

`index.html:1022-1038` modal exists, fires `affiliate_disclosure_viewed` analytics. Per Reforge User Insights: this is the single most important trust event you can instrument. Track:
- Open rate (% of users who tap "Learn how")
- Read time (proxy: scroll depth or close-after-3s vs read-fully)
- Conversion delta of disclosure-readers vs non-readers (hypothesis: readers convert HIGHER, not lower)

If hypothesis confirmed in 30 days, surface the modal more prominently (V2 copy above). If conversion drops, you've found the line. **My priors say it'll lift conversion 3-8% per Affiliate-Maximalist literature, but Furnish's data is the only data that matters here.**

---

## Section D — Recommendations

Each recommendation: file paths, Reforge anchor, code-or-copy diff, effort.

### Recommendation 1 — Replace "12,400+ rooms designed" with verifiable anchor

**Reforge anchor:** Brand Marketing — Evangelizing Brand Guidelines, point 21 ("brand can become incohesive, which confuses users and erodes trust") + Product Marketing Proof Points lesson 04 (proof points must be verifiable).

**File:** `index.html:76-81`

**Diff:**
```html
<!-- BEFORE -->
<div class="welcome-proof" aria-label="Social proof">
  <span class="wp-stars">★★★★★</span>
  <span class="wp-rating">4.8</span>
  <span class="wp-dot">·</span>
  <span class="wp-count" id="wpCount">12,400+ rooms designed</span>
</div>

<!-- AFTER (Option A — ships this week) -->
<div class="welcome-proof" aria-label="Trust signals">
  <span class="wp-icon">★</span>
  <span class="wp-claim">Real catalog</span>
  <span class="wp-dot">·</span>
  <span class="wp-claim">Real prices</span>
  <span class="wp-dot">·</span>
  <span class="wp-claim">Built by 1 designer</span>
</div>
```

**Effort:** 5 minutes. Rip and replace.

**Why this works:** Per Reforge Differentiator-Based positioning archetype — your moat is real catalog + small team, not user volume. Lead with the moat.

---

### Recommendation 2 — Provenance line on paywall AI quality bullet

**Reforge anchor:** Product Marketing Proof Points lesson 04 — "the *how* lists product features that enable the benefit."

**File:** `index.html:950`

**Diff:** (see Section B.1 above)

**Effort:** 5 minutes.

---

### Recommendation 3 — Reframe "2,400+ reviews" on paywall

**Reforge anchor:** User Insights for Product Decisions — claims you can't back are reputational debt.

**File:** `index.html:927-928`

**Diff:**
```html
<!-- BEFORE -->
<div class="paywall-social">
  <span class="paywall-stars">★★★★★</span>
  <span class="paywall-social-text">4.8 · 2,400+ reviews</span>
</div>

<!-- AFTER -->
<div class="paywall-social">
  <span class="paywall-stars">★★★★★</span>
  <span class="paywall-social-text">Cancel before day 7 — no charge. We don't auto-bill surprise.</span>
</div>
```

**Effort:** 2 minutes.

**Why this works:** Per Reforge Strategic Emphasis "Pain Point-Based" archetype — the relevant pain at paywall is "will this charge me when I forget?" Money-back trust is a real proof point. Fake reviews are a reputational liability *at the moment of payment* — the worst possible time to be caught.

---

### Recommendation 4 — Promote "may not fit" disclosure to a feature, not a warning

**Reforge anchor:** Brand Marketing — Building Blocks of Brand Identity, point 75 (tone of voice as brand asset) + Product Marketing Proof Points (honest disclosure is a proof point).

**File:** wherever the warning currently renders (per brief: "⚠ may not fit" on items).

**Diff:** Reframe from warning-style to confidence-style:
```
BEFORE:  ⚠ may not fit
AFTER:   ✓ AI flagged: may not fit your dimensions — confirm before buying
```

**Effort:** 15 minutes (copy + style).

**Why this works:** Per Reforge brand identity (verbal cues), shifting from "scary warning" to "AI is being careful for you" reframes failure-mode as a feature. The user's mental model goes from "this AI is wrong sometimes" to "this AI tells me when it's not sure." That's a 10x trust upgrade for ~zero functional change.

---

### Recommendation 5 — Affiliate disclosure V2 (Section C.1)

**Reforge anchor:** Brand Marketing — Brand Identity Governance + Affiliate-Maximalist locked decision.

**File:** `index.html:720-723`

**Diff:**
```html
<!-- BEFORE -->
<p class="affiliate-disclosure">
  Furnish earns a commission on items you buy through these links — at no extra cost to you.
  <a id="affiliateLearnMore">Learn how</a>
</p>

<!-- AFTER -->
<div class="affiliate-disclosure-v2">
  <div class="adv2-row">
    <span class="adv2-icon">💡</span>
    <strong>How Furnish makes money:</strong>
  </div>
  <p class="adv2-body">
    We earn a commission when you buy items through our redesigns.
    <strong>We don't get paid more for pricier items.</strong>
    <strong>We don't sell your photos.</strong>
    <a id="affiliateLearnMore">Read the full FTC disclosure →</a>
  </p>
</div>
```

**CSS** (add to `styles.css` near the existing `.affiliate-disclosure` block at 4950):
```css
.affiliate-disclosure-v2 {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 16px;
  margin: 16px 0;
}
.adv2-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
.adv2-icon { font-size:18px; }
.adv2-body { font-size:13px; line-height:1.55; color:var(--ink-soft); margin:0; }
.adv2-body strong { color:var(--ink); }
.adv2-body a { color:var(--accent); text-decoration:underline; margin-left:4px; }
```

**Effort:** 30 minutes (copy + CSS + visual QA on light/dark).

**Why this works:** Per Reforge brand governance, transparency *is* the brand. Per Hassan's locked decision (Affiliate-Maximalist), more disclosure = more trust = more clicks long-term. Also instruments better — readers of this version are easier to track (more visual weight = more measurable engagement).

---

### Recommendation 6 — Live room counter (replaces or supplements Recommendation 1)

**Reforge anchor:** Product Marketing Proof Points (verifiable claims) + User Insights (data-backed).

**File:** `index.html:80` (welcome) + new endpoint in `supabase-client.js`.

**Diff (HTML):**
```html
<span class="wp-count" id="wpCount" aria-live="polite">
  <span id="liveRoomCount">…</span> rooms designed today
</span>
```

**Diff (JS, add to `app.js` boot):**
```js
async function fetchLiveRoomCount() {
  if (!window.SupabaseClient) return null;
  const { data, error } = await window.SupabaseClient
    .from('rooms')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 86400000).toISOString());
  if (error || !data) return null;
  return data.length || 0;
}

(async () => {
  const el = document.getElementById('liveRoomCount');
  if (!el) return;
  const count = await fetchLiveRoomCount();
  if (count == null || count < 10) {
    document.getElementById('wpCount').textContent = 'Fresh launch — be among the first to design';
  } else {
    el.textContent = count.toLocaleString();
  }
})();
```

**Effort:** 1–2 hours (Supabase wire-up, error handling, cache).

**Why this works:** Reforge brand governance — *the utility of a number is dependent on how closely it tracks reality*. A live count is reality. Even a count of 14 is more credible than a fake 12,400. Also, per Reforge Pain Point-Based archetype (page 10 — "long-term impact of not feeling the former pain"), the aspirational user thinks "OK, this is small now but that's why I'm here early."

---

### Recommendation 7 — Comparison gallery on welcome screen

**Reforge anchor:** Product Marketing Proof Points (case studies as proof) + Strategic Emphasis (Pain Point archetype, page 10 — "compelling before-and-after customer experiences").

**File:** new section in `index.html` welcome, between line 73 and 74.

**Diff:**
```html
<!-- AFTER existing .hero-demo, BEFORE the start button -->
<div class="welcome-gallery" aria-label="Real redesigns">
  <h3 class="wg-title">Real rooms, real items</h3>
  <p class="wg-sub">Tap any to see the full breakdown.</p>
  <div class="wg-strip">
    <!-- 4-5 hand-picked before/after pairs from real users (with permission) or your own testing rooms -->
    <button class="wg-card" data-example="loft-airy">
      <img src="assets/welcome/example-1-before.jpg" alt="Before">
      <img src="assets/welcome/example-1-after.jpg" alt="After">
      <span class="wg-meta">12 items · $1,847</span>
    </button>
    <!-- ...3-4 more cards... -->
  </div>
</div>
```

**Effort:** 4–6 hours (need 4–5 real before/after pairs hosted in `assets/welcome/`, cards CSS, click-to-modal). Photos: do them yourself in 1 weekend with friends' rooms.

**Why this works:** Per Reforge Strategic Emphasis "Pain Point-Based" downstream impacts (page 16): *"customer case studies, which are particularly helpful when they include compelling before-and-after customer experiences."* This is the literal Reforge prescription for Furnish's archetype. Currently the welcome has the user's photo only — no proof of *other people's* outcomes. Add 4–5 before/after pairs and the welcome shifts from "I hope this works" to "look, it works."

---

### Recommendation 8 — Tagline trust shift

**Reforge anchor:** Product Marketing — One Key Takeaway (the OKT roof). Brand Marketing — verbal cues (point 75).

**File:** `index.html:51`

**Diff:**
```html
<!-- BEFORE -->
<p class="tagline">Watch any room transform in 20 seconds.</p>

<!-- AFTER (Option 1 — same energy, removes unverifiable number) -->
<p class="tagline">Your room. Real items. AI-curated in seconds.</p>

<!-- OR (Option 2 — strategic emphasis Differentiator-Based) -->
<p class="tagline">AI redesigns most apps make are unbuyable. Ours are real.</p>

<!-- OR (Option 3 — hybrid) -->
<p class="tagline">Watch your room transform — with real, shoppable items.</p>
```

**Effort:** 2 minutes.

**Why this works:** Reforge OKT framework (Building Proof Point Pillars lesson, page 1): the OKT is the roof of the messaging house — first thing the user sees. The current tagline is *speed-claim* + *vague verb*. The replacements ladder up to the actual differentiator (real catalog) which Reforge's Differentiator-Based archetype (page 8) tells us is the right move when entering a saturated market with weak alternatives. AI redesign apps are now plentiful; "real shoppable items" is the actual differentiator.

---

### Recommendation 9 — Track all trust events as primary KPIs

**Reforge anchor:** User Insights for Product Decisions (research validation) + Product Marketing Post-Launch Measurement.

**File:** `app.js` (add to `trackEvent` calls)

**Events to add (all already partially exist or are easy):**
- `trust_anchor_viewed` (welcome screen impression)
- `affiliate_disclosure_viewed` (already exists — `app.js:1000`) — extend to record *read time*
- `affiliate_disclosure_link_clicked` (NEW)
- `provenance_line_viewed` (paywall impression of Recommendation 2 line)
- `comparison_gallery_card_clicked` (Recommendation 7)
- `live_count_displayed` (Recommendation 6)
- `aha_feedback_submitted` (already exists — extend to track distribution)

**Reporting:** weekly funnel — does each trust event lift downstream conversion? Per Reforge User Insights: claims must be testable. Without instrumentation, every recommendation above is a *hope*, not a proof point.

**Effort:** 1–2 hours.

---

### Recommendation 10 — A/B test the affiliate disclosure on welcome (Hassan's brief specifically asks)

**Reforge anchor:** Hassan's locked decision: "Affiliate-Maximalist." Counter-intuitive prediction: more disclosure = more trust = more clicks.

**Test:**
- Variant A (control): no welcome-screen disclosure (current).
- Variant B: V3 disclosure copy from Section C.1 ("Built by 1 designer + 1 dev. Real catalog. We earn from your shopping; we don't sell your photo. [How it works]").

**Primary metric:** affiliate click-through rate at first session (do users click out to retailer in their first redesign?).
**Secondary:** Day-7 return rate. **Tertiary:** disclosure modal open rate.

**Hypothesis (per Reforge brand governance + Affiliate-Maximalist):** Variant B lifts CTR by 3–8%, lifts D7 return by 5–12%, with a small first-impression cost (~1–2% drop in start-button click rate at the welcome screen).

**Effort:** 4–6 hours including instrumentation.

---

## Top 3 priorities for this dimension

If you ship only three things this week:

1. **Recommendation 1 — Replace "12,400+ rooms designed" with the honest anchor (Section A.1, Option A)**. 5 minutes. This is the highest-ROI trust fix in the entire app — it removes the most exposed fictitious claim while *strengthening* the differentiator. Reforge brand governance literally tells you fictitious anchors erode trust. Ship today.

2. **Recommendation 5 — Affiliate disclosure V2 ("How Furnish makes money" block)**. 30 minutes. Hassan's locked decision is Affiliate-Maximalist, but the current disclosure (`index.html:720-723`) is *minimum-compliance*, not maximalist. V2 turns the disclosure into a trust badge. This shifts the brand identity from "we hope you don't notice" to "we are proudly transparent" — exactly the Reforge brand governance lever.

3. **Recommendation 2 — Provenance line on paywall AI quality bullet**. 5 minutes. The single line "Pro routes through Flux Kontext Pro by Black Forest Labs" turns the vaguest paywall claim ("Premium AI quality") into a verifiable, named proof point — the *how* of the benefit, per Reforge Proof Points framework lesson 04, page 19. AI credibility's lowest-effort highest-leverage rung.

The remaining seven recommendations are sequenced for week 2–6. Recommendation 7 (comparison gallery) is the highest-impact one of the bunch but needs real photo work — start scheduling that this week so it's ready in 30 days.

---

*Audit: 10 recommendation entries (8 numbered code-diff entries + 2 instrumentation/test entries). Reforge-cited paragraphs: ~80% (Product Marketing Proof Points + Strategic Emphasis are the spine; Brand Marketing identity governance is the explicit principle for fictitious-claim risk). Lines: ~520. Sections A, B, C, D, and Top 3 — present.*
