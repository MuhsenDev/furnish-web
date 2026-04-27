# BATCH 4 AUDIT — Dim 05 Retention + Dim 07 Personalization + Dim 08 Social

**Status:** ⚙️ PROCEEDING — streamlined-gate cleared per "approve all changes" policy.
**Created:** 2026-04-26
**Source dimensions:** Dim 05 (8 entries + Customer Retention Canvas, ~95% Reforge), Dim 07 (8 entries, ~88%), Dim 08 (12 entries, ~85%).
**Architecture note:** This is the data-model-first batch. Dim 05 supplies the Customer Retention Canvas as a strategic artifact; Dim 07 + 08 plug into it. Conflict 1 (Quarterly Core) is HONORED via the Batch-1 lock — internal frame stays, no calendar-period language in user copy. Conflict 2 (referral currency) was already locked to "5 HD redesigns + 2 style packs over 90 days" in Batch 1 — verifying propagation in Phase F.

---

## Section A — CUSTOMER RETENTION CANVAS (canonical strategic artifact)

This is the Customer Retention Canvas for Furnish, per Reforge *Retention + Engagement → Templates → 02. Reforge Customer Canvas*. **Treat as the strategic foundation** for Dim 05 + 07 + 08 work. Personalization and Social mechanics plug into the use cases defined here.

### Three use cases (per Reforge Natural Behavior Use Cases)

| Canvas Field | A: Single-Room Refresh | B: Whole-Home Tour | C: Style Curiosity / Browse-Shop |
|---|---|---|---|
| **Use Case** | "Redesign one room" | "Design across rooms" | "Browse, save, get inspired" |
| **Problem** | "My [room] feels stale — what would it look like in a different style?" | "I just moved / I'm renovating — what does my whole home become?" | "I want furniture that matches a vibe I have but can't articulate." |
| **Persona** | 28–45, owns or rents, ~$60K+ income, mid-design-confidence | 30–50, recent move or major life event, $80K+ income | 22–40, design-curious, moderate income, Pinterest user |
| **Why** | "Faster than hiring a designer; cheaper than a redo" | "Design across rooms in 1 platform" | "Better than scrolling Pinterest because the items are shoppable" |
| **Alternative** | Pinterest + IKEA/Wayfair browsing; magazines; Instagram | Designer ($$$); Modsy/Havenly; HGTV; Pinterest | Pinterest, IG saves, Houzz, mood-board apps |
| **Frequency (Natural)** | **Yearly to bi-annually** per room-type | **Once every 5–10 years** (life event-driven) | **Weekly to monthly** |
| **Engagement zone (Reforge)** | Forgettable Zone | Forgettable Zone (deep) | Habit Zone |

### Setup / Aha / Habit moments per use case

| Moment | Use Case A | Use Case B | Use Case C |
|---|---|---|---|
| **Setup** | Photo + style answered | Same as A + room-type chosen | Visit Style Pulse for first time |
| **Aha** | First reveal + signal (10s dwell OR Love OR item-tap OR shop-all OR wishlist-save) | Same trigger across multiple rooms | Save first item from a Pulse template |
| **Habit** | 2nd redesign within natural-frequency window OR ≥2 habit-actions in 28d | 3rd designed room within 6mo | Weekly Pulse browse + ≥1 save per session |
| **Setup metric** | `setup_moment_reached` (per-user fire-once) | Inferred from room count | Inferred from `style_pulse_shown` event |
| **Aha metric** | `aha_moment_reached` (per-room fire-once, signal-gated) | Same | Same |
| **Habit metric** | `habit_moment_reached` (per-user, fires when habit-action count ≥2 within 28d) | `D365_designed_rooms ≥ 3` | `WAR ∧ ≥1 save` weekly |

### Engagement metrics aligned to natural frequency (NOT calendar-arbitrary)

Per Reforge *Defining Retention*, retention metrics MUST align with natural frequency. Per the Conflict 1 Batch-1 lock: these are INTERNAL metrics — never display calendar-period language to users.

- **D365 Designed-Room Count** (Use Case A retention) — % of D0 users who designed ≥1 room in 365 days.
- **WAR** (Weekly Active Returners — Use Case C retention) — % of users who opened in past 7 days.
- **Dormancy rate** — % of users in DORMANT or CHURNED state per `getLifecycleState()`.
- **Resurrection rate** — % of CHURNED users who returned within 30 days after a resurrection campaign.
- **Habit-formation rate** — % of users with `state.user.habitFormed === true` (≥2 habit actions in 28d).
- **K-factor** (per share funnel) — invites_sent × % converted to new users (Reforge Personal Viral Loops Lesson 2 decomposition).

### Five engagement loops (ranked)

Per Dim 05 Section A. Mapping to Reforge Frequency Strategy archetypes (Organic / Manufactured / Environment):

1. **Loop 1 — Saved Item → Price Drop → Return** (Manufactured, primary). Already-functional. Highest impact.
2. **Loop 2 — Style Pulse → New Template → Save/Start** (Manufactured, content-loop variant). Already wired.
3. **Loop 3 — Home Progress → Next Room → Designed Room** (Manufactured Organic). Already wired (`renderHomeProgress`).
4. **Loop 4 — Wishlist Ages → "You Saved This 90d Ago" → Re-engage** (Manufactured Time-Trigger). **NEW — adding in this batch via `LIFECYCLE_CAMPAIGNS` 9th entry.**
5. **Loop 5 — Friend Saw Your Room → Style Inspired Friend → Both Re-engage** (Environment / social). **PARTIAL in this batch — UI scaffold for personal-viral follow loop; full social graph defers to backend.**

### Lifecycle map (canonical, batch-3-and-batch-4 aligned)

| Moment | Day | Trigger | Audience | Reforge concept | Metric |
|---|---|---|---|---|---|
| Welcome | D0 | First session | All new users | Setup Moment | Setup % |
| First Redesign | D0–1 | First render | Setup-completed | Aha Moment (gate) | Gate rate |
| Aha Experienced | D0–1 | Render + signal | Setup-completed | Aha Moment (true) | Aha % |
| First Save | D0–7 | First wishlist save | Aha users | Habit Moment (early) | Habit % @ D7 |
| First Affiliate Click | D0–14 | `affiliate_click` | Saved-and-shopping | Monetization signal | Click rate |
| First Dormancy | D14 | No open ≥14d | At-risk | At-risk transition | At-risk % |
| Dormancy | D30–90 | No open 30–90d | Dormant | Dormancy state | Dormancy % |
| Wishlist-Age Recall | When `oldestWishlistAgeDays ≥ 90` AND user not yet dormant-resurrected | Manufactured Time | Saved-but-quiet | **NEW Loop 4** | Recall conv. % |
| Resurrection | D90+ / D180+ | No open 90+ | Churned | Resurrection (peak-moment surface) | Resurrection % |

### Content cadence required (build-list)

- 52 templates / year (1/week)
- 12 monthly mood packs
- 4 seasonal collections
- 52 style stories / year (editorial copy)
- Continuous price-drop pipeline (cron-driven, automated; deferred to backend per `DEFERRED.md` item 5)

---

## Section B — DECISIONS APPLIED (auto-resolved per "approve all changes")

Cross-dim disagreements found, all auto-resolved per the policy:

| # | Disagreement | Resolution applied |
|---|--------------|-------------------|
| D1 | Dim 05 challenges Quarterly Core; Conflict 1 already locked Batch 1 (internal frame, no calendar copy) | **Honor Conflict 1 lock.** Apply use-case-specific metrics as INTERNAL instrumentation. No user-facing "quarterly" copy. |
| D2 | Dim 05 lifecycle map says tutorial fires on first redesign; Conflict 7 lock says session 2 home arrival | **Honor Conflict 7 lock.** Tutorial defers to session 2 (already shipped Batch 3). |
| D3 | Dim 05 Rec 2 — Free push leak. Two options proposed (gate to Pro, OR thinner Free cadence) | **Pick Option B — thinner Free cadence.** Free users get permission ask + receive top 1–2 highest-impact drops per month, with subtle "upgrade for full alerts" tag. Aligns with Affiliate-Maximalist intent. |
| D4 | Dim 05 Rec 4 + Dim 08 Rec — both want personal-viral follow loop layered on top of K4 financial referral | **Compatible — ship both.** K4 currency-aligned (Conflict 2 locked Batch 1). Personal-viral scaffold added in this batch (UI ready; social graph defers to backend). |
| D5 | Dim 07 D5 + D6 use `state.quiz.scores` (the old 4-Q model). The 10-Q onboarding migration (Hassan's prior batch) replaced this with `profile.answers{}` | **Adapt: derive `profile.styleScores{}` from `profile.answers{}` + saves + verdicts.** Don't break the 10-Q model. |
| D6 | Dim 08 Section C — referral currency. Already locked Batch 1 to "5 HD redesigns + 2 style packs over 90 days" | **Already done in Batch 1; verify propagation (Phase F).** Found leftover at `app.js:6425` toast — fixing. |

No user-only knowledge gaps. No new contradictions like Batch 1's NC-1→NC-5. **Proceeding without stop.**

---

## Section C — IMPLEMENTATION ORDER

Per Hassan's batch-4 spec ("data model first, then triggers, then lifecycle copy, then personalization, then social, then verify referral consistency"):

**Phase A — Data model** (state schema is foundational)
1. `profile.styleScores{}` — derived from `profile.answers{}` (10-Q model: vibe + materials + color_appetite map to canonical styles); folds in saves + verdicts over time.
2. `profile.styleConfidence` — `'high' | 'medium' | 'low' | 'unknown'` derived from completion + skip pattern.
3. `profile.ahaHistory[]` — last 30 verdicts, decay-weighted.
4. `profile.swappedOut[]` — rejection signal array (already partially wired via `_styleAvoid` in Batch 1; expanding).
5. `profile.styleVector{}` — normalized weight map (computed, not raw stored).
6. `state.user._sessionsByHour[24]`, `_sessionsByDow[7]` — push-timing aggregates.
7. `state.user.peakRoomId` — most-engaged room for resurrection.
8. `state.user._followingUserIds[]` — social graph stub (UI only this batch).
9. `state.wishlistMeta[id].fromSurface` — already partial (Batch 1); extending to capture surface attribution.

**Phase B — Triggers + events**
10. `LIFECYCLE_CAMPAIGNS` 9th entry — `wishlist_age_d90_recall`.
11. K-factor share funnel events: `share_modal_opened`, `share_format_selected`, `share_export_completed`, `share_destination_confirmed` + the existing referral-link copied path.
12. Free-user push thin-cadence rule (Option B): mark Free pushes with `tier: 'free_thin'` flag for backend filter.
13. Style-decay function for verdicts (60-day half-life).

**Phase C — Lifecycle/copy**
14. Variant lifecycle banner copy by saved styles (Dim 07 D5 — banner half ships now; push half waits for channel per DEFERRED.md item 7).
15. Resurrection peak-moment surfacing.
16. Wishlist-age recall copy template.

**Phase D — Personalization mechanics**
17. `pickItemsForRoom` rewrite: weighted styleScore (was binary), soft-budget weighting (was hard cap), customColors sophistication factor.
18. `personalizationEngagementState(profile)` — Casual / Core / Power on Love rate.
19. Cold-start tactics: skip-default → low confidence flag, geographic + time-of-year priors (invisible, weight tweaks only).

**Phase E — Social/share**
20. Format dispatcher in `drawShareCard(room, format)`: `pin | story | feed | square | reddit`.
21. Clean canvas toggle (default OFF prices for share, ON in-app).
22. Reveal-moment "Share This Room" CTA next to Shop The Whole Room (lifecycle-aware default format).
23. Lifecycle-aware share modal (NEW vs ACTIVE vs Pro defaults).
24. Pre-filled "What do you think?" caption for group-chat / NEW state.
25. Personal-viral follow loop UI scaffold: stub `state.user._followingUserIds`, expose follow CTA on share success (no real social graph yet — defers to backend).

**Phase F — Verify referral propagation**
26. Fix `app.js:6425` leftover ("1 month Pro free" toast → new currency copy).
27. Grep sweep for any remaining "1 month Pro" / "month free" leftovers in user-facing strings.

**Phase G — DEFERRED.md + IMPLEMENTATION_PROGRESS.md + commit**
28. New deferred items: public room URLs + OG metadata, embed widget, live-counter API, social-graph backend.

---

## Section D — Auto-deferred (per Hassan's rules)

- **Public room pages + OG metadata** — Dim 08 critical recommendation. Backend dependency. → DEFERRED.md (was already proposed; promoting to canonical).
- **Embed widget** — needs public room URLs. → DEFERRED.md.
- **Live counter on welcome** — backend-aggregation dependency. Already in DEFERRED.md (NC-4 from Batch 1).
- **Real email send for `wishlist_age_d90_recall`** — DEFERRED.md item 6 covers; we ship the campaign predicate + copy template so backend can drain it.
- **Real push delivery (including thin-cadence rule)** — DEFERRED.md item 7. Predicate logic ships; delivery defers.
- **Real social graph (follower lists, follow notifications)** — new DEFERRED.md item.
- **6-room "tap your favorite" calibration screen (Dim 07 D7)** — needs designer assets. Slot ready; assets deferred.
- **Cross-device personalization sync** — backend item 3 (server sync of `profile.styleScores`, `ahaHistory`, etc.). Already covered by existing Supabase pull/push contract, just gets new fields.

---

## Section E — Reforge framework citations (Batch 4)

- *Retention + Engagement → Templates → Reforge Customer Canvas* — strategic foundation for the Canvas in Section A.
- *R+E → Module 02 → Natural Behavior Use Cases* — Use Case Frequency Spectrum (Habit Zone vs Forgettable Zone), layered use cases (Zillow strategy).
- *R+E → Module 06 → Engagement Strategies → Using Frequency Strategy* — engagement loop archetypes (Organic / Manufactured / Environment), 5 types of Manufactured Triggers (Time / Location / Change / Peer / Programmatic).
- *R+E → Module 09 BONUS → ICED Theory* — 4 dimensions of infrequent products, Expanding Touchpoints (Hotelling Model), product-recall-decay curve, Plant-Loyalty-Hook peak-moment engineering.
- *R+E → Module 04 → Defining Engagement States* — Casual / Core / Power process; the 3 mistakes to avoid.
- *R+E → Module 06 → Building An Engagement Machine* — Engagement Engine (Signal → Strategy → Path → Success/Fail); macro-optimizations for better signals + better ranking.
- *Advanced Growth Strategy → 02. Micro Growth Loops → 04. Viral Loops* — three subtypes (personal / financial / social), K-factor decomposition, currency-alignment trick.
- *Advanced Growth Strategy → 02 → 05. Content Loops + UGC Loop Variations* — embed loops, UGC company-distributed vs user-distributed, branching factor × influence-per-exposure.
- *Data For Product Managers → 03. Instrumentation* — Event Dictionary discipline, Action / Contextual / Backstory property taxonomy.
- *User Insights for Product Decisions → 05. Synthesis And Decision-Making* — visible vs invisible personalization (the "creepy" line).

Now writing code.
