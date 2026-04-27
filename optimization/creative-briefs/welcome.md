# Creative Brief: Welcome Screen

**Source frameworks:** Reforge *Product Marketing — Defining Effective Creative Briefs* + *Building Proof Point Pillars*. Per Hassan: Batch 1 ships this brief as the canonical reference for any future welcome refresh.
**Surface owner:** `index.html:22-83` (`.screen[data-screen="welcome"]`).
**Audience:** First-time visitors, no prior session. Mostly mobile. Mostly skeptical of AI design tools.

---

## Background

The welcome screen is Furnish's only top-of-funnel surface today. It must:
1. Establish the value prop in <2 seconds.
2. Address the "is this AI slop?" skepticism without arguing.
3. Drive a single click: *Redesign My Room*.
4. Honor the no-signup-required claim before asking for anything.

Pre-launch, no real activity numbers exist (Conflict 4 lock). The welcome's job is to establish trust through positioning, not volume.

---

## Guardrails

- **Voice rubric** (locked, see VOICE.md): Concrete, Confident, Warm, Calm.
- **Banned filler verbs** (per VOICE.md): unleash, transform-as-filler, elevate, supercharge, empower.
- **No fake numbers** (Rule 1): qualitative claims only until real traction lands.
- **No calendar-period language** in user copy (Rule 2).
- **Promise-Fit** (Rule 3): every time-claim survives the slowest realistic path.
- **Title Case** on the CTA button; **sentence case** on the subtext.
- **Custom SVG icons** only — no emoji.

---

## Wording restrictions

**Must appear (or evolve from):**
- *"Watch any room transform — about a minute, sit tight."* (hero tagline, locked Batch 1)
- *"Redesign My Room →"* (primary CTA, locked)
- *"No signup needed · About a minute — sit tight."* (subtext)
- *"Real catalog · Real prices · Built by Hassan"* (qualitative trust strip — until real numbers exist)

**Must NOT appear:**
- Any specific user count, room count, or review count (`12,400+`, `2,400+`, etc.)
- *"~30 seconds"*, *"in 20 seconds"* as standalone time claims (they fail Promise-Fit when quiz isn't skipped)
- Best-friend tone (*"Hey there!"*, exclamation marks, emoji)
- Hype verbs from the banned list

---

## One Key Takeaway

> **Your household, your style, sharper.**

The welcome doesn't repeat the OKT verbatim — that's the paywall's job. The welcome lays the *functional pillar*: speed-to-value with shoppable output. The OKT shows up later (paywall, lifecycle).

---

## Proof point pillars (House Framework)

This surface ships the **functional pillar** above all:

- **Functional (this surface):** *"Watch any room transform — about a minute, sit tight."* + the BEFORE/AFTER demo.
- **Emotional (paywall surface):** *"Sharper redesigns, every time."*
- **Accrued (paywall + profile surface):** *"A profile for everyone in your house."*

The trust strip carries the **differentiator-based archetype** (per Reforge Identifying Strategic Emphasis lesson 04, page 8) — Furnish's moat is real catalog + small team, not user volume. Lead with the moat.

---

## Variants on deck (future test queue)

- A/B test affiliate disclosure on welcome (Dim 10 Recommendation 10) — variant B adds the "How Furnish makes money" trust badge above the CTA. Hypothesis: lifts CTR 3–8% per Affiliate-Maximalist literature.
- Live room counter (Dim 10 Recommendation 6) — replaces "Real catalog · Real prices · Built by Hassan" with a real Supabase-backed count once backend lands. See DEFERRED.md.
- Comparison gallery (Dim 10 Recommendation 7) — 4–5 hand-picked before/after pairs. Highest-impact change in Dim 10 but needs photo work.

---

## Measurement

- `welcome_cta_clicked` (event TBD post-instrumentation pass — Dim 13)
- Funnel: welcome view → CTA click → quiz_started → photo_uploaded
- Comparison gallery card clicks (when shipped): `comparison_gallery_card_clicked`
