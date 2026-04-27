# Creative Brief: Lifecycle (banners, push, email)

**Source frameworks:** Reforge *Retention + Engagement → Engagement Strategies* + *Resurrection Strategies* (Voluntary + Involuntary Dormant Users 5-step framework).
**Surface owner:** `app.js` lifecycle banner (`renderLifecycleBanner`), `LIFECYCLE_CAMPAIGNS` array, push pre-prompt (`maybeAskForPushPermission`), price-drop banner (`renderPriceDropBanner`).
**Audience:** users at every lifecycle stage — NEW, ACTIVE, AT_RISK, DORMANT, CHURNED.

---

## Background

Lifecycle copy is where the brand voice gets stress-tested. It must be:
1. Personalized to the user's actual data (style, saved items, designed rooms — never fictitious cohort claims).
2. State-aware (one banner per lifecycle stage).
3. Honest about the calendar (Rule 2: experiential language, never "X days" or "every month").
4. Templated, not bespoke (per Reforge Bringing Your Brand To Life — governance + scale).

Today the banners are partially state-aware (`renderLifecycleBanner`) but the LIFECYCLE_CAMPAIGNS push/email copy is hardcoded. Tokenization is queued for a future batch.

---

## Guardrails

- **Voice rubric** (locked): Concrete, Confident, Warm, Calm.
- **No calendar-period language in user copy** (Rule 2 — Conflict 1 lock). Internal `daysDormant` analytics value is fine; *displaying* "It's been 14 days" to the user is not.
- **No fake numbers** (Rule 1). Cohort claims like "Most members redesign 4–7 rooms" are forbidden.
- **One CTA per surface.**
- **Push: title ≤30 chars, body ≤90 chars.** Email: subject ≤50 chars.
- **Title Case** on banner badges + CTAs; **sentence case** elsewhere.

---

## Wording restrictions

**Must appear (locked Batch 1 banner copy):**
- AT_RISK title: *"New arrivals in your style"*; body: *"We added pieces in {styleNames} since your last visit."*
- DORMANT (with wishlist) title: *"{wishlistCount} saved pieces — and what's new"*; body: *"Some of your saved pieces dropped in price. New picks added in {styleNames}."*
- DORMANT (no wishlist) title: *"Your style is still saved"*; body: *"Come back when you're ready to redesign another room."*
- CHURNED title: *"Your style is still saved"*; body: *"Your style profile is intact. New pieces have been added in {styleNames} since your last design."*

**Must NOT appear:**
- *"It's been {days} days"* — calendar-period violation.
- *"every day"*, *"this week"*, *"this month"* — calendar-period violation.
- *"Most members…"* + any cohort-behavior claim without real data.
- Generic *"Welcome back!"* with exclamation (saccharine — Warmth-6 limit).
- *"Don't miss out"* + any urgency theater.

---

## One Key Takeaway

> **Your household, your style, sharper.**

Lifecycle copy emphasizes the **accrued pillar** ("your style is still saved") because the user already has investment in the system; the message reinforces that investment.

---

## Proof point pillars (per stage)

| Stage | Pillar | Why |
|-------|--------|-----|
| AT_RISK (7–14d) | Functional | New catalog adds drop the friction-cost of returning. |
| DORMANT (30–60d) | Accrued | "Your saved items + style are still here" is the recall trigger. |
| CHURNED (90d+) | Accrued + Emotional | Style intact + AI picks improved → both intrinsic and extrinsic incentives to return. |

---

## Channel matrix

| Channel | When | Tone | Token usage |
|---------|------|------|-------------|
| In-app banner (home top) | Every session, per lifecycle state | Direct, action-oriented | Heavy — banner reflects user's actual data |
| Push notification | Event-driven (price drop, milestone) | Just-the-facts, calm urgency | Heavy — names specific item / drop / room |
| Email | Calendar-driven (D7, D14, D30, D60, D90, D180) | Patient, recap-style | Heavy — recaps user's data over time window |
| Pre-prompt (push permission) | Post-first-save | Soft, opt-in framing | Light — just naming the value ("price-drop alerts") |

---

## Tokens

Per VOICE.md token table. All lifecycle copy uses the same vocabulary.

---

## Measurement

- `lifecycle_banner_shown { lifecycle, days, designDays }` (existing — `days` stays in analytics, never displayed in user copy per Rule 2)
- `lifecycle_banner_clicked { lifecycle, days }` (existing)
- `price_drop_banner_shown / clicked` (existing)
- `push_permission { result }` (existing)
- `lifecycle_would_fire` (existing — placeholder until backend email lands)
- New: per-template open rate + CTR (when LIFECYCLE_CAMPAIGNS tokenization ships)

---

## Future iteration

- LIFECYCLE_CAMPAIGNS tokenization (deferred from Batch 1 — L effort).
- Per-style-profile copy variants (e.g., "Mid-Century" users see "New Mid-Century pieces" specifically).
- Time-of-day variants (push @ 9am vs 7pm — different copy per Reforge Engagement Engine Step Three: Path/Message).
