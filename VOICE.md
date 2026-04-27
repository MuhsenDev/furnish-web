# VOICE.md — Furnish Brand Voice & Tone

**Status:** ✅ LOCKED 2026-04-26 (Batch 1 implementation pass).
**Source frameworks:** Reforge *Brand Marketing — Defining Your Brand Personality* (Word Game + Attitudinal Ranges + "Who We're Not"), *Brand Marketing — Bringing Your Brand To Life* (Brand Guidelines as the third building block of brand identity), *Product Marketing — Finding Your One Key Takeaway* + *Building Proof Point Pillars*.
**Why this file exists:** every copy decision references this. Without a single artifact, the brand drifts at every late-night edit. Per Reforge Bringing Your Brand To Life p.11: *"In the absence of brand guidelines, we see two major problems emerge. First, teams experience slower creative development… Second, off-brand materials will end up being shipped."*

The audit run during Batch 1 found 25% off-brand strings (5 violations + 7 drifts out of 20 sampled). This file is the fix.

---

## The OKT (One Key Takeaway)

> **Your household, your style, sharper.**

Locked 2026-04-26. Stored in `app.js` as `FURNISH_OKT.takeaway`. Every copy line filters through "does this ladder up to the OKT?" If no, rewrite it.

**Optional clarifier** (per Reforge OKT lesson p.13: helpful to add a sentence elaborating): *"Furnish redesigns any room in about a minute, in your style, with shoppable furniture — and a separate profile for everyone in your house."*

**Three proof-point pillars** (House Framework — OKT roof, pillars below):

| Pillar | Statement | Where it ships |
|--------|-----------|----------------|
| Functional | "Watch any room transform — about a minute, sit tight." | Welcome hero |
| Emotional  | "Sharper redesigns, every time." | Premium-quality paywall context |
| Accrued    | "A profile for everyone in your house." | Multi-profile paywall context |

---

## The four personality words

Locked 2026-04-26. Per the Reforge Word Game (which says four is the maximum: "If you move forward with more words than this, making decisions about your expressive fundamentals or brand assets may become complex or unwieldy" — *Defining Your Brand Personality*, p.13).

| # | Word | Definition | Attitudinal Range |
|---|------|-----------|-------------------|
| 1 | **Concrete** | We name pieces, prices, percentages, and timeframes. Never "transform" (as filler), "unleash", or "elevate". | Specific ←●———— Vague |
| 2 | **Confident** | We make claims and stand behind them. Trial isn't "risk-free" — it's "cancel before day 7, no charge." | Direct ——●———— Brash *(not "smug" or "hyped")* |
| 3 | **Warm** | A thoughtful contractor, not a cold SaaS product. We talk to you, not at the market. | Friendly ———●—— Saccharine *(not "Hey friend!", not exclamation marks)* |
| 4 | **Calm** | The room is the hero, not the app. No urgency theater, no countdown timers. (Founding-member line is the one earned exception.) | Steady ——●———— Hyped |

### Tonality dial (per Reforge Brex Word Game example, p.18)

| Dimension | 1 (low) | 10 (high) | Furnish lands at |
|-----------|---------|-----------|------------------|
| Warmth | Cold/clinical | Saccharine | **6** |
| Confidence | Hedged | Brash | **8** |
| Humor | Zero | Gag-a-minute | **2** *(deadpan only — never punchline)* |
| Specificity | Abstract | Numerically precise | **9** |

---

## "Who We're Not" — the anti-patterns

Per Reforge *Defining Your Brand Personality* p.11: being explicit about what the brand is NOT is the highest-leverage exercise.

Furnish is NOT:

1. **A hype shop.** Banned filler verbs: *unleash, transform-as-filler, elevate, revolutionize, supercharge, empower.* If a copy line works only because of one of these verbs, the line has nothing to say.
2. **A best-friend app.** Banned tone tropes: *"Hey there!"*, *"We're so excited"*, *"Yay!"*, **emoji in user-facing UI** (also enforced in CLAUDE.md — custom SVG icons everywhere).
3. **A salesperson with quota.** Banned urgency tropes: *"⏰ Only 24 hours left", "Don't miss out", "Last chance"*. Founding-member pricing is the one earned scarcity claim because it's structurally true.
4. **A buzzword aggregator.** Banned pattern: comma-separated feature lists in paywall subs. (Old generic paywall sub "Premium AI quality, multi-room batch, HD downloads, and every style profile your household needs" was the textbook violation — fixed in Batch 1.)

---

## Hard rules (locked permanent)

These cross every batch, every surface, every copy revision. If you find yourself writing around one of these, the rule wins.

### Rule 1 — No fake numbers, ever (Conflict 4 lock)
Real numbers from real activity, or qualitative claims. Never invented quantities. *"12,400+ rooms designed"*, *"2,400+ reviews"*, *"Most members redesign 4–7 rooms in their first month"* — all dead. When real traction exists, restore with honest small numbers.

### Rule 2 — No calendar-period language in user copy (Conflict 1 lock)
"Quarterly", "weekly", "monthly", "this month", "every day" — these belong in internal strategy docs, not user copy. Phrase experientially: *"when you're ready"*, *"since your last visit"*, *"come back when something inspires you"*. Style Pulse runs on a weekly cadence in execution but doesn't say "weekly" to the user.

### Rule 3 — Promise-Fit (Conflict 9 lock)
Every time-claim must survive the slowest realistic path. *"~30 seconds"* was false except for skip-quiz path. *"About a minute — sit tight"* is the locked replacement; survives 90–180s reality + post-AI-cutover Replicate latency.

### Rule 4 — Title Case on buttons + headers; sentence case on body
Already in CLAUDE.md. Restated here for completeness.

### Rule 5 — Custom SVG icons, no emoji in user-facing UI
Already in CLAUDE.md. If you find one in the app, replace it.

### Rule 6 — One CTA per surface
Empty states, error states, push notifications. The user has one decision; we don't pile choices.

---

## The Thoughtful Contractor Test

Before any copy ships, run it through this:

> *"Could a confident contractor — someone who has redone 200 rooms, has photos on her phone, and doesn't oversell — say this line out loud to a homeowner sitting on the couch?"*

Sample passes / fails:

| Copy | Test | Verdict |
|------|------|---------|
| "Watch any room transform — about a minute, sit tight." | Yes — concrete, calm | PASS |
| "Premium AI quality, multi-room batch, HD downloads, and every style profile your household needs." | No contractor talks like this | FAIL (rewritten in Batch 1) |
| "Most members redesign 4–7 rooms in their first month." | Only if true and provable | FAIL (cut in Batch 1) |
| "Sharper redesigns, every time." | Yes — value-prop, no fluff | PASS |
| "Cancel before day 7 — no charge. We don't auto-bill surprise." | Yes — honest, specific | PASS |

---

## Per-surface playbook

### Headlines / hero
- 5–8 words for hero, ≤5 for OKT
- Verb-led. Imperative or second-person where possible
- Concrete with numbers, time, or named items

### Buttons
- 2–4 words for primary CTAs
- Start with a verb. *"Redesign My Room"*, *"Reveal My Redesign"* — first-person possessive is a Furnish strength
- No generic *"Submit"*, *"Continue"*, *"OK"* for high-stakes moments

### Empty states
- Never blame the user. *"You haven't saved anything yet"* → forbidden
- Forgive + offer next action. *"Save items to track price drops."*
- One CTA, max
- No *"Oops!"*, no sad-trombone tone

### Error states
- State what happened in user-language
- Offer the recovery action
- Apologize once, briefly, only when system's fault
- Surface the constraint (file size, format) so the user can fix it
- No stack traces, no blame, no *"Oops!"*

### Lifecycle banners
- Reference the user's actual saved data (style, items, days dormant — analytics-only, not user-facing copy)
- Match copy weight to user state
- Real numbers from their data ("3 of your 7 saved pieces dropped this month") not fictional cohort claims

### Paywall
- Lead with the user's just-experienced moment
- One sharp value prop in the sub, NOT a feature list
- Bullets carry the features. Headline + sub carries the OKT
- Specific dollar comparisons only when they map to user-known costs
- Never lie about cohort behavior

### Notifications (push, email, in-app)
- Title ≤30 chars, body ≤90 chars
- Reference real user data: saved items, % drops, room types, style names
- Include action verb in body, not just title
- One notification = one decision

---

## Lifecycle copy templates

Tokens populate from `state.user`, `state.profiles`, `state.rooms`, `state.wishlist`, `state.priceAlerts` at send-time. **All templates use the same token vocabulary** for cross-surface consistency.

### Standard tokens

| Token | Source | Fallback |
|-------|--------|----------|
| `{{firstName}}` | `state.user.name` | "you" |
| `{{styleName}}` | top style label | "your style" |
| `{{styleNames}}` | top 2 styles joined "+" | "your style" |
| `{{roomCount}}` | designed rooms | "0" |
| `{{wishlistCount}}` | saved items | "0" |
| `{{nextRoomType}}` | next ROOM_TEMPLATES queued | "kitchen" |
| `{{daysDormant}}` | analytics only — never displayed in user copy (Rule 2) | — |
| `{{biggestDrop}}` | biggest % drop | "0" |
| `{{biggestDropName}}` | item name (truncate 22) | — |
| `{{firstRoomType}}` | first designed room | "room" |
| `{{nDropped}}` | items with price drops | "0" |
| `{{nNewInStyle}}` | new catalog adds in user's style | "0" |
| `{{nUnder100}}` | saved items under $100 | "0" |
| `{{wasPrice}}` / `{{nowPrice}}` | price-drop math | — |

### Templates (canonical)

The 7 templates spec'd in `OPTIMIZATION_PLAN.md` Dim 09 Section C remain canonical. Implementation is deferred to a future batch (the LIFECYCLE_CAMPAIGNS tokenization pass) per Batch 1's scope cap. When that batch runs, every template in Section C of `optimization/09_content_copy.md` ships verbatim. Voice rubric above is the gate.

---

## Audit cadence

**Every batch must include a copy audit pass.** The audit grades every visible string GOOD / DRIFT / VIOLATION against this file. Batch 1's audit is recorded in `BATCH_1_AUDIT.md` Section A.5 (20 strings sampled). Future batches:
- Run a grep for banned words against the codebase
- Spot-check 10 random strings from current state
- Review LIFECYCLE_CAMPAIGNS tokens against actual data

If any audit finds >10% off-brand rate, queue a copy-sweep batch immediately.

---

## Where this file is referenced

- `CLAUDE.md` (Conventions section) — links here for voice rules
- `app.js` (`FURNISH_OKT` constant) — single-source-of-truth for the takeaway
- `OPTIMIZATION_PLAN.md` Dim 09 — full audit + recommendations
- `CONFLICTS_RESOLVED.md` Conflicts 1, 4, 9 — locked rules referenced above
- `IMPLEMENTATION_PROGRESS.md` — Batch 1 entries that touch copy

When this file changes, update the cross-references (especially CLAUDE.md). One source of truth, one update path.
