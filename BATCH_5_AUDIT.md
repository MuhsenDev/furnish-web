# BATCH 5 AUDIT — Dim 06 Monetization + Dim 02 User Psychology

**Status:** ⚙️ PROCEEDING — streamlined-gate cleared per "approve all changes" policy.
**Created:** 2026-04-26
**Source dimensions:** Dim 06 Monetization (~16 entries, ~85% Reforge) + Dim 02 User Psychology (12 entries + 2 bonus + 4 cross-cutting, 100% Reforge).
**Conflicts touched:** **6 (LOCKED in this batch)**, plus Conflicts 1, 3, 4 referenced/honored throughout.
**Conservative-bias note (Hassan):** "Monetization mistakes hurt more than they help pre-launch. When in doubt between a bold change and a conservative one, pick conservative and flag the bold version as a post-launch experiment in DEFERRED.md."

This is a two-part batch:
- **Part 1 — Dim 06 Monetization** — already shipped as commit `45dd109` (pricing psychology surface, value-moment trigger replacement, Lifetime $99 decoy, $5,200 renovation-cost anchor, paywall_dismissed analytics, **Conflict 6 locked** with the gen-50 power-Free signal). Audit is captured retrospectively in §A below.
- **Part 2 — Dim 02 Psychology** — this audit's forward plan (§B onward). Decisions auto-resolved per the streamlined gate.

---

## §A — Part 1 Retrospective: Dim 06 Monetization (commit `45dd109`)

### Auto-resolved decisions (Dim 06)

| # | Question | Resolution |
|---|----------|-----------|
| 1 | Conflict 6 (gen-50 signal) — APPROVE / OVERRIDE / MODIFY | **APPROVE with the recommended behavioral-combo trigger** (≥50 gens/30d AND ≤1 affiliate click/30d → opportunity-framed micro-card; skip if ≥3 clicks; once per 30d window). Honors "no quota cap" promise — this is a conversion lane, not a gate. |
| 2 | Lifetime $99 decoy — does it conflict with the locked $5.99/mo / $3.99/yr pricing? | **Additive, not conflicting.** Lifetime is a 3rd toggle decoy per Reforge Pricing Strategies (Economist 3-tier study). Annual stays default-selected. Pre-Stripe, selecting Lifetime mocks the same Pro flag (`grandfatherProUsers()` covers cutover). Real Stripe price-ID = DEFERRED. |
| 3 | Pro headline reframe — "Sharper redesigns. Every household." → bundle-led "Your full design partner."? | **Approve.** Per Section A.5 + E.1: bundle-led copy answers the natural-frequency challenge (passive entitlements that accrue between rare redesigns). Still ladders to OKT. |
| 4 | Founding-member promise — keep unbounded "this month" or cap at 1,000 spots? | **Cap at 1,000.** Per Section E.9 + Reforge Cost of Revenue: bounded promises are sustainable, unbounded ones erode margin forever. Cap also creates real scarcity per Drift "Limited time only" pattern. |
| 5 | Section E.2 give-get referral ("Pro for 3 months free") | **OBSOLETED by Conflict 2 lock.** Locked currency = "5 HD redesigns + 2 style packs over 90 days" — already shipped Batches 1 + 4. No new Batch 5 work needed. |
| 6 | Section E.5 Stripe grandfather coupon | **DEFERRED** to Stripe cutover. Promise locked in `index.html` paywall copy + `grandfatherProUsers()` boot hook already in place. |
| 7 | Section F.3 Designer Connect higher-ARPC tier | **DEFERRED** until 1,000+ Pro users. XL effort. |
| 8 | Top Priority #1 (cut "coming soon" features) | **Already done in Batch 1.** Skip. |

### What shipped in Part 1 (commit `45dd109`)

- Renovation-cost anchor + competitive reference footer + Lifetime $99 decoy + Annual prominence + bullet reorder + bundle-led headline + founding-member cap
- Value-moment triggers extended (`affiliate_click_2plus_items`, `share_attempt`, `same_room_3rd_redesign`)
- `paywall_dismissed` + `paywall_plan_selected` analytics; differentiated dismiss-cooldown (explicit dismisses suppress that context permanently; backdrop/escape are passive)
- Power-Free signal (Conflict 6) — 30d ring buffer + slide-in micro-card + 3 events
- FTC affiliate disclosure reciprocity-framed copy

**Reforge citations (Part 1):** *Use Case Model · Monetization Triad · Packaging Strategy Matrix · Pricing Strategies (Economist 3-tier · Drift "Limited time only" · Gusto give-get) · Convert and Activate (Postmates Party · Figma cognitive friction) · Cost of Revenue · Strategies for Existing Healthy Customers · Promise-Fit · Building Proof Point Pillars · Natural Behavior Use Cases (Forgettable Zone · ICED) · Personal Viral Loops + Content Loops · Data For Product Managers (Instrumentation).*

---

## §B — Part 2 Forward Plan: Dim 02 User Psychology

### Cross-check against shipped state + Conflicts

Three of Dim 02's 12 entries propose **fictitious quantitative claims** that violate **Conflict 4 (LOCKED)** — *"Real or nothing — no fake numbers, ever. Every future copy decision filters through this gate."* Auto-resolved by modifying to qualitative variants (no fabricated numbers).

| Entry | Reforge principle | Status | Reason |
|-------|-------------------|--------|--------|
| D02-1 | Loss aversion (wishlist) | **MODIFY** | Original copy: "Pro members got 3 price-drop pings on your saved items in the last 30 days. You missed them. Walnut bookshelf dropped 22% on Apr 8 — saved by 142 Pro users." → VIOLATES Conflict 4. Ship qualitative version: "Pro members get push alerts when prices drop on your saved pieces — you'll see them here when they happen." Defer quantitative copy until real price-drop history exists. |
| D02-2 | Loss aversion (guest expiry) | **SHIP** | Real friction (regenerating costs server compute). Ethics-clean per Reforge Section D. |
| D02-3 | Loss aversion (Free card cancellation safety) | **MODIFY** | Original copy claims "you keep every redesign you generated as Pro (locked at premium quality) after downgrade." Conservative-bias call: don't promise server contract that doesn't exist yet. Ship a softer version using already-true claims (saved rooms persist, wishlist persists, locally-saved redesigns persist). |
| D02-4 | Endowment (possessive language) | **SHIP** | Pure copy edits, ~12 strings. |
| D02-5 | Endowment (style-completeness gauge) | **MODIFY** | L-effort SVG fingerprint generator → defer. Ship the basic % gauge + "Your Style DNA" card without the deterministic SVG. |
| D02-6 | Social proof multiplied across surfaces | **MODIFY** | Original copy uses fake numbers throughout ("1,847 people designed a Modern bedroom this week", "Saved by 142", "I canceled Modsy" testimonial). VIOLATES Conflict 4. Ship qualitative variants only: "Other Modern + Warm fans also saved these →" without counts; remove fake testimonials entirely. |
| D02-7 | Social proof (lifecycle cohort sizing) | **MODIFY** | Original "142 other Modern + Scandinavian fans designed new rooms this week" uses fake numbers. VIOLATES Conflict 4. Ship qualitative cohort framing: "Style twins are designing this week — fresh pieces in your aesthetic just dropped." |
| D02-8 | Scarcity (selective per paywall context) | **SHIP** | Premium_quality OFF, others ON. The founding-member cap (1,000 spots) shipped in Part 1 carries the bounded scarcity. Per Reforge Apply User Psych: painkiller (premium_quality) doesn't need amping; vitamin (abstract upsells) does. |
| D02-9 | Scarcity (weekly template drop badge) | **DEFER** | Requires real weekly template release cadence. Hassan's operational decision — don't ship until content pipeline is real. Conservative-bias call. |
| D02-10 | Anchoring (external retail anchor) | **MODIFY** | Mostly already shipped in Part 1 (renovation anchor + Houzz/Designer reference footer). Additive: add Modsy (RIP) + Havenly to the existing reference footer for fuller comparison set. |
| D02-11 | Commitment / consistency (welcome-back card) | **SHIP** | Quotes user's past quiz answers — straightforward state read. |
| D02-12 | Peak-end (engineered "Tonight's recap" overlay) | **MODIFY** | Original copy includes "sneak peek at the Modern Coastal collection dropping Friday" — depends on D02-9 which is deferred. Ship the recap overlay with summary + price-watch hook (already real); drop the template-drop tease. |
| D02-B1 | Endowment + commitment ("style twin" matching) | **DEFER** | Requires backend cohort data + content curation. Conservative-bias call. |
| D02-B2 | Peak-end + loss aversion ("evolution" comparison on 2nd+ redesign) | **SHIP** | Data already in `state.rooms`. M-effort, high leverage (multi-redesign rate +25–40%). |
| 4S audit | Cross-cutting | **PARTIAL SHIP** | 4-6 highest-impact fixes: welcome hero (add "you/your"), paywall premium_quality copy (1/4 → 4/4 fix), lifecycle DORMANT (qualitative specificity per Conflict 4), reveal flow item-list "yours" framing. Full ~30-edit pass deferred to a future copy-pass batch. |

### Auto-deferred items (DEFERRED.md additions)

1. **Quantitative wishlist price-drop loss copy** — depends on real price-history data on top 50–100 catalog items. Aggregate from retailer affiliate APIs at backend cutover. Today's qualitative copy slot stays in place.
2. **Style-DNA deterministic SVG fingerprint generator** — L-effort UI/animation polish; defer to a future polish batch.
3. **Weekly template drop badge** — depends on Hassan's content cadence decision (do we actually publish weekly templates?). Defer until that decision is made.
4. **"Style twin" cohort matching** — needs Supabase aggregation + curated cohort content. Defer.
5. **"You keep your premium-quality redesigns after downgrade" promise** — needs server contract on permanent storage of past Pro-tier renders. Defer until backend confirms.
6. **Full 4S copy audit (~30 edits)** — most impactful 4-6 ship now; rest defer to a copy-pass batch.

### Conflicts surfaced (none new)

No new conflicts. Conflict 4 (no fake numbers) was the recurring filter — applied 3 times (D02-1, D02-6, D02-7) to modify the original Reforge proposals into qualitative-only variants.

### User-only knowledge gaps (none)

No. All decisions auto-resolve under the streamlined gate.

### Reforge framework citations (Part 2)

- *Growth Series → User Psychology → ELMR Framework* (Decision Hill, Emotion / Logic / Motivation / Reward)
- *Growth Series → User Psychology → Psych! Framework* (positive vs. negative psych — Darius Contractor)
- *Growth Series → User Psychology → Applying User Psych To Improve Growth* (Candy / Vitamin / Painkiller spectrum, 4S of Tapping into Emotion: Selfish / Sensory / Specific / Simple)
- *Growth Series → User Psychology → Applying User Psych — Channels For Triggers* (internal vs external triggers; manufactured time-trigger discipline)
- *Retention + Engagement → Engagement Strategies → Using Frequency Strategy* (manufactured time-trigger archetype for infrequent products)
- *Retention + Engagement → BONUS → Managing Infrequent Products / ICED Theory* (expanding touchpoints; Plant-Loyalty-Hook session-memory)
- *Retention + Engagement → Resurrection Defining, Measuring, And Analyzing* (Belonging is the highest-conversion lever for dormant users)
- *Monetization + Pricing → Optimization Strategies* (anchoring, reference price)
- *Brand Marketing → Identity Governance* (Conflict 4 honored throughout)

### Implementation phase order

Per the user's spec: "pricing surfaces first, then upsell trigger replacement, then anchor/decoy infrastructure, then psychology tuning across components, then referral mechanic adjustments." Parts 1 (Dim 06) and Part 2 (Dim 02) interleave; the order below sequences only the Part-2 (Dim 02) work that ships in this batch:

- **Phase A** — Paywall psychology refinements: Modsy/Havenly anchor; selective scarcity per context.
- **Phase B** — 4S + possessive copy fixes (welcome hero, paywall, lifecycle DORMANT, reveal item-list framing).
- **Phase C** — Welcome-back commitment card; style-completeness gauge.
- **Phase D** — Guest reveal-gate 24h countdown; Free-card cancellation-safety sharpening.
- **Phase E** — Style evolution comparison on 2nd+ redesign; Tonight's recap session-end overlay.
- **Phase F** — Qualitative cohort framing on lifecycle banner (Conflict 4-respecting variant).
- **Phase G** — Docs (DEFERRED.md, IMPLEMENTATION_PROGRESS.md) + commit.

Now writing code.
