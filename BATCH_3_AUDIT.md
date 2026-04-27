# BATCH 3 AUDIT — Dim 04 Activation + Dim 12 Onboarding + Dim 03 Conversion

**Status:** ⏸ STOPPED — consolidated decision request below.
**Created:** 2026-04-26
**Source dimensions:** Dim 04 (9 entries, 100% Reforge), Dim 12 (11 entries, ~85%), Dim 03 (13 entries, ~85%).
**Why stopped:** This batch hit MULTIPLE cross-dimensional disagreements where the three dimensions prescribe different things for the same code surface. Per Hassan's batch-3 directive: "stop ONCE with a consolidated decision request." Decisions follow.

---

## Section A — CROSS-DIMENSIONAL DISAGREEMENTS (the consolidated decision request)

These are the strategic forks where the three dimensions disagree. Hassan, please decide each — together they shape ~30 of the 33 ship items in this batch.

### A1 — Quiz architecture (3 dimensions, 3 different prescriptions)

**The disagreement:**
- **Dim 04 R2 — "Setup-after-Aha":** Move the WHOLE quiz post-reveal. Pre-Aha = just photo + 1 style-card tap. Defer mood/colors/budget to a "Refine your style" surface fired AFTER reveal. **L effort, biggest activation lever (~+15-25pp Aha).** Reforge Setup Moment cut rule: collect ONLY must-have for Aha.
- **Dim 03 R-Mid1 — "Reorder photo LAST":** Keep all 4 quiz questions pre-reveal but reorder so photo is question #4. By Q4 the user has 3 commitments — Consistency boost. **S effort (reorder array).** Reforge ELMR Decision Hill + Consistency motivational boost.
- **Dim 12 E1 — "Swap Q3 material → room type":** Keep current order, keep all 4 questions pre-reveal, just replace the redundant material question with room-type. **S effort. CONFLICT 8 (PENDING) covers this.** Reforge Setup Moment "setup action MUST be different from core action."

**These are not all compatible:**
- Path A (Dim 04) eliminates the quiz pre-Aha entirely → no question to reorder, no Q3 to swap.
- Path B (Dim 03) reorders within the 4 questions → Q3 content swap (Path C) can layer on top.
- Path C (Dim 12) is surgical → can layer on top of B.

**My recommendation:** **B+C combo for this batch, A as a future structural batch.**
Rationale: Path A is XL-effort and structurally rebuilds the entire onboarding state machine. Path B (reorder) + Path C (Q3 → room type) ships in 1-2 hours, captures most of the consistency-boost lift, and delivers Dim 12's room-type win. Path A becomes a clean separate batch later when Hassan can spec the post-Aha "Refine" surface in detail. Doing B+C now does NOT block A later — A would just collapse the quiz to 1 question + photo, which is a strict subset.

**Decide:** `A` (full move post-Aha) / `B+C` (reorder + Q3 swap, recommended) / `C only` (just Q3 swap, no reorder) / `current` (no quiz changes) / `OVERRIDE: <your call>`

---

### A2 — Price tags placement (Dim 03 vs Affiliate-Maximalist lock)

**The disagreement:**
- **Dim 03 R-Bottom3:** Move per-item price tags OFF the after-image. Replace with one summary tag ("12 pieces · $2,847 →") + a horizontal "shop strip" carousel below the slider. Per Reforge ELMR Logic-Before-Emotion (p.7): "if we introduce price before emotion, the user can't justify the purchase." Currently the tags appear at the same instant as the dream image, flipping the order.
- **Hassan's locked Affiliate-Maximalist decision:** Free is fully shoppable. Price tags on the image are the literal embodiment of "shoppable everywhere."
- **Dim 03 acknowledges the soft conflict:** says relocating preserves Affiliate-Maximalist intent (full shoppability) while obeying ELMR ordering.

**My recommendation:** **MODIFY — keep price tags on image but make them stagger-fade-in at +1500ms (after the reveal moment lands), not co-render with the image.** This honors both: emotion lands first (1.5s of pure dream), then logic (price tags ripple in over the next 600ms). Batch 2 already has the reveal-choreography infrastructure — Frame 5 at T=2000ms is the price-tag ripple-in. **The framework already works; we just need to NOT pre-render the tags before the choreography.** This is way less invasive than relocating them entirely.

The Dim 03 "shop strip below" can be a future test — but the in-image tags are emotionally-loaded brand artifacts (the "see prices ON your room" magazine-spread feel) that you may not want to lose.

**Decide:** `MODIFY` (delay tag rendering — recommended) / `MOVE to shop strip below` (Dim 03's full proposal) / `KEEP as-is` (no change) / `OVERRIDE: <your call>`

---

### A3 — Skip button styling (Dim 03 vs Dim 12 — directly opposed)

**The disagreement:**
- **Dim 03 R-Mid2 — "Make Skip equal-weight":** Skip is currently `btn-ghost` (low-emphasis). Reframe as `btn-secondary` with copy "Skip — Use Smart Defaults →". Per Reforge Convert And Activate p.5: "move non-essential steps after conversion" — quiz is non-essential since defaults exist.
- **Dim 12 E3 — "Demote Skip to text link":** Skip is currently button-prominent at zero-psych moment. Replace with single primary CTA + small text link below ("Skip and use popular styles · saves 30 seconds"). Per Reforge Setup Moment Experience: setup phase should be slightly more forceful since collecting must-have info.

**The deciding factor:** Whether the quiz is must-have or nice-to-have.
- If we ship **A1 Path B+C** (quiz remains pre-Aha collecting room-type + style + palette + density, all must-have for Aha) → Dim 12 wins. Demote skip.
- If we ship **A1 Path A** (quiz moves post-Aha, only photo+1-style is pre-Aha) → Dim 03 wins; quiz IS non-essential.

**My recommendation:** **DEMOTE to text link (Dim 12 E3)**, contingent on A1 = B+C. The quiz becomes must-have under Path B+C (room-type is required for AI to know what room to redesign). Skip should be the "I'll trust your defaults" option, not the equal-weight option.

**Decide:** `DEMOTE` (Dim 12 — recommended if A1=B+C) / `PROMOTE` (Dim 03) / `OVERRIDE: <your call>`

---

### A4 — Soft email capture before D7 (Conflict 5 status: PENDING since Batch 1)

**The disagreement:**
- **Dim 03 R-Account2:** Add soft email-capture step BEFORE the D7 reveal gate. Recovers ~30-50% of bailers as email leads.
- **Conflict 5 in CONFLICTS_RESOLVED.md:** Same proposal, status PENDING. Hassan deferred this to a "D7-reveal-gate batch."
- **Dim 04 R-9:** Mentions email recovery indirectly, no explicit conflict.

**Reminder of my Conflict 5 recommendation:** APPROVE adjacent lane. Email-only "Save & Skip Signin" path stores `state.user.recoveryEmail`, gives user a "limited-preview" reveal mode (just the redesign + items list, no wishlist save). D7 hard gate stays for full access.

**This is THE batch where Conflict 5 makes sense to ship** — Dim 03's exact recommendation. Backend email send is deferred (DEFERRED.md item 6) but the capture itself is purely client-side + state.

**Decide:** `CONFIRM` (approve Conflict 5 + ship Dim 03 R-Account2 — recommended) / `DEFER to dedicated batch` / `OVERRIDE: <your call>`

---

### A5 — Quarterly Core flip (Dim 04 R7, conflicts with Conflict 1 lock-deferral)

**The disagreement:**
- **Dim 04 R7 — "Flip Core/Supplemental loops":** Promote saved-item tracking + Style Pulse to Core (weekly cadence). Demote whole-room redesign to seasonal. **XL effort.** Reforge ICED Theory: a quarterly-core product without adjacent frequent use cases has a retention curve that slopes to zero.
- **Conflict 1 (RESOLVED in Batch 1):** Quarterly Core stays as INTERNAL strategic frame. NO calendar-period language in user copy. Style Pulse strip retains current home placement. **The flip implementation was explicitly deferred** to a future batch ("structural change for a later batch").

**This batch is not "the flip batch."** Doing the full flip in Batch 3 is XL effort, touches monetization (Pro must monetize the frequent loop), and would require restructuring the home screen + paywall messaging. Per Conflict 1's lock, this is queued for a structural batch later.

**My recommendation:** **DEFER R7 to a dedicated structural batch.** Honor Conflict 1's lock. Ship the activation/onboarding/conversion improvements that build INTO the flip-when-ready.

**Decide:** `DEFER` (recommended) / `IMPLEMENT in this batch` (XL effort, blows scope) / `OVERRIDE: <your call>`

---

### A6 — Hero tagline rewrite (Dim 03 R-Top3 — new proposal, not in Conflict 9)

**The disagreement:**
- **Current state (locked Batch 1):** "Watch any room transform — about a minute, sit tight."
- **Dim 03 R-Top3:** Rewrite tagline to job-led copy. Three candidates:
  - **A (Outcome):** "See your living room without buying a thing."
  - **B (Tension):** "Stop guessing what would look good."
  - **C (Reward):** "Designer-quality redesign of your room. Free."
- **VOICE.md (locked):** OKT is "Your household, your style, sharper." Tagline should ladder to it. Voice rubric: Concrete, Confident, Warm, Calm.

**Voice-rubric audit of the candidates:**
- A — Concrete (specific room), Confident (declarative). PASS rubric. Slight risk: "without buying a thing" might read as "Furnish prevents you from shopping" — opposite of affiliate revenue intent.
- B — Tension framing is on-brand for productivity tools but maybe too negative for a lifestyle app. FAILS Calm.
- C — "Designer-quality" is a buzzword; "Free" leads with price not value. Mediocre rubric fit.
- **Current** ("Watch any room transform — about a minute, sit tight.") — passes rubric, but is action-led ("watch") not user-led.

**My recommendation:** **KEEP CURRENT** for Batch 3. None of A/B/C clearly beat the current line on the voice rubric, and the current line was carefully calibrated for Conflict 9's Promise-Fit fix. Tagline rewrite is a separate experiment-batch when there's an A/B harness.

**Decide:** `KEEP CURRENT` (recommended) / `A` / `B` / `C` / `OVERRIDE: <your call>`

---

### A7 — Aha event redefinition (Dim 04 R1 — measurement only)

**The proposal:**
- Split `aha_moment_reached` into two events:
  - `aha_gate_reached` — fires on results render (current behavior, renamed)
  - `aha_moment_reached` — fires when the user signals: 10s dwell OR Love-tap OR item tap OR Shop-all OR wishlist save
- Build the funnel as `welcome → setup → gate → aha → habit`.

**This is purely a measurement fix.** No copy change, no UX change — just split one event into two and add signal detection. Reported Aha rate will drop ~25-40pp because we'll finally see the real leak.

**Concern:** The current `aha_moment_reached` is referenced in Batch 1's `ACTIVATION.AHA_RESULTS` (`app.js`). Splitting requires updating callers + dashboards. The dashboards don't exist yet (no PostHog), so the only side effect is renaming the event.

**My recommendation:** **APPROVE.** Pure measurement upgrade, low risk. Aligns with Dim 13's instrumentation rigor.

**Decide:** `APPROVE` (recommended) / `DEFER to a measurement-focused batch` / `OVERRIDE: <your call>`

---

### A8 — Tutorial timing (Conflict 7 status: PENDING since Batch 1; 3 dimensions agree to defer)

**The proposal — all three dimensions agree:**
- **Dim 04 R5:** Defer tutorial to session 2. Repurpose as "what's next" surface (saved items, different style, price drops).
- **Dim 12 E7:** Defer tutorial to session 2 home arrival.
- **Conflict 7 in CONFLICTS_RESOLVED.md:** Same proposal, status PENDING.

**No disagreement here** — three independent Reforge-grounded analyses converge on the same answer. The current 6s post-reveal coachmark interrupts Aha at peak emotion (Reforge psych +25 spike).

**My recommendation:** **APPROVE.** Lock Conflict 7 with this batch. Trigger condition becomes:
```js
state.rooms.length >= 1
  && !state.user.firstRedesignTutorialSeen
  && session2Detected()
  && currentScreen === 'home'
```
Plus repurpose tutorial copy as "what's next" (saved items, different style, price drops) per Dim 04 R5.

**Decide:** `APPROVE` (recommended — locks Conflict 7) / `OVERRIDE: <your call>`

---

## Section B — DECISIONS THAT DON'T NEED YOUR INPUT (will ship without stopping)

Per the streamlined-gate rule, these are compatible across dimensions, no conflict, no NCs, no ambiguity. **Auto-shipping** after A1-A8 are decided.

### From Dim 04
- **R3 — Returning-guest skip onboarding:** Detect `isGuest() && (state.rooms.length || state.draft)` → skip welcome onboarding, route to home with resume hero. **S, ships.**
- **R4 — Warm-start reveal headline:** Personalize reveal headline using style + room type ("Your loft, in scandinavian."). **M, depends on A1 outcome (room-type field). Ships if A1=B+C or A.**
- **R6 — Habit metric instrumentation:** Add `habit_action_logged` event + `state.user.habitFormed` flag set when user does ≥2 habit actions in 28d. Replace day-based lifecycle banner buckets with action-based. **M, ships.**
- **R8 — Promise-Fit micro-survey:** After Love-tap on Aha feedback, show 3-radio "What made it click?" (real-magazine / I-can-buy / matches-taste). **S, ships.**

### From Dim 12
- **E2 — Q2 palette as room thumbs:** Asset task — auto-defer per Hassan rule (missing assets, config-driven slot ready). **Defer.**
- **E4 — Skip-default 5-second taste filter:** Skip click → modal with 3 pre-selected style chips ("uncheck any that aren't you") + "Show more options" → continue. **M, ships.**
- **E5 — Per-question quiz events:** Add `quiz_question_seen`, `quiz_question_answered { qIdx, optionIdx, dwellMs }`, `quiz_question_skipped`, `quiz_question_back`. **XS, ships.**
- **E6 — Progressive disclosure on prefs:** Wrap Color Moods + Custom Colors + Profile Photo in `<details>`; keep Name + Styles + Save visible. Budget stays visible (must-have for Aha). **S, ships.**
- **E9 — Capture screen "What works" tip strip:** Asset task — auto-defer (config-driven slot, placeholder text-only for now). **Slot ships, asset deferred.**
- **E10 — Per-question "?" tooltip:** Tap reveals what each Q does for the redesign. **S, ships.**
- **E11 — "Save your progress" reassurance at Q3:** Single-line below the question. **XS, ships.**

### From Dim 03
- **R-Top1 — Auto-playing 3s before/after sweep:** CSS-only, assets exist. **S, ships.**
- **R-Top2 — Trust strip ABOVE CTA:** Move "No signup" + "~30 sec" + "Free" chips above the welcome CTA. **S, ships.** Note: "~30 sec" should be "~1 min" per Conflict 9 lock — adjusting copy.
- **R-Mid3 — Capture progress bar + "Almost there" framing:** Show "Last step / 90%" on capture screen header. **S, ships.**
- **R-Bottom1 — Items list top-3 + expander:** Render top-3 by `(price × style-match)` score by default; "See all 12 →" expands. **M, ships.**
- **R-Bottom2 — Sticky "Shop The Whole Room" CTA on scroll:** Fires when user scrolls past totals card. Surface = `'shop_all_sticky'` for analytics. **S, ships.**
- **R-Account1 — Google OAuth visually dominant:** Promote Google to `btn-primary big` above the email form. Apple/Amazon stay ghost. **S, ships.**
- **R-Paywall1 — Value-moment upsell triggers:** Replace post-3rd-gen with: first HD-export attempt / first wishlist save crossing 3+ items / first 2nd-room-design intent / Love + 5min dwell. Cooldown stays. **M, ships.**
- **R-Paywall2 — Consolidate 8 paywall contexts → 3 layouts** (Quality/Power/Save). Drops `generic` (now Layout A — Quality). **M, ships.** (Compatible with Conflict 3 lock — bullet content + roadmap link unchanged.)
- **R-Paywall3 — Annual price anchor "Save $24/yr" badge:** Add concrete dollar saving badge on annual toggle, plus "MOST POPULAR" Belonging boost. **S, ships.**

### From the streamlined PNIP-pyramid recommendation
- **R9 push pre-prompt timing change:** Move from post-first-save to pre-first-save (Variant A) OR reveal screen (Variant B). **Defer the actual timing change** — current post-save timing isn't broken (it just isn't optimal). Push delivery is deferred to Capacitor anyway. Will re-address in the push-infrastructure batch.

---

## Section C — CONFLICTS CROSS-REFERENCE

| Conflict | Status pre-Batch-3 | Touched by Batch 3? | Resolution proposal |
|---|---|---|---|
| 1 (Quarterly Core flip) | RESOLVED Batch 1 (internal frame only) | Yes — A5 above | Stay deferred; honor Batch 1 lock |
| 2 (Pro-trial-for-both currency) | RESOLVED Batch 1 | No | n/a |
| 3 (Coming-soon Pro bullets) | RESOLVED Batch 1 | No | n/a |
| 4 (Fictitious anchors) | RESOLVED Batch 1 | No | n/a |
| 5 (D7 soft email lane) | PENDING | Yes — A4 above | Recommend APPROVE this batch |
| 6 (gen-50/30d soft signal) | PENDING | No (monetization batch) | Stays pending |
| 7 (Tutorial timing) | PENDING | Yes — A8 above | Recommend APPROVE this batch |
| 8 (Q3 swap) | PENDING | Yes — A1 path B+C above | Recommend APPROVE this batch |
| 9 (~30 sec microcopy) | RESOLVED Batch 1 | No | n/a |

**If Hassan approves my recommendations:** Conflicts 5, 7, 8 all lock in this batch. Only Conflict 6 remains pending (rightfully so — it's monetization-batch territory).

---

## Section D — IMPLEMENTATION ORDER (post-approval)

Per Hassan's batch-3 spec ("state/data first → question flow → UI/UX → conversion surfaces"):

**Phase A — State/data model**
1. New fields: `state.draft.roomType` (A1=B+C), `profile.preferredRoomType`, `state.user._styleAvoid` (Batch 1, already exists), `state.user.habitFormed` (R6), `state.user.recoveryEmail` (A4), `state.user.firstRedesignTutorialSeen` semantics (A8)
2. Event taxonomy: `quiz_question_*` (E5), `aha_gate_reached` + redefined `aha_moment_reached` (A7), `habit_action_logged` (R6), `promise_fit_signal` (R8), `soft_email_captured` (A4), `paywall_value_moment_*` (R-Paywall1)

**Phase B — Question-flow logic**
3. Quiz reorder + Q3 swap (A1=B+C): `furniture.js QUIZ` array
4. Skip-default 5-second taste filter (E4): new modal
5. Per-question instrumentation (E5)
6. Per-question "?" tooltip (E10)
7. Q3 "save your progress" reassurance (E11)
8. Skip button demote (A3=DEMOTE)

**Phase C — UI/UX layer**
9. Returning-guest skip onboarding (R3)
10. Warm-start reveal headline (R4)
11. Tutorial deferral to session 2 + repurpose (A8 + R5)
12. Progressive disclosure on prefs (E6)
13. Capture screen progress bar (R-Mid3)
14. Capture "What works" tip placeholder slot (E9)
15. Auto-playing welcome demo (R-Top1)
16. Welcome trust strip above CTA (R-Top2)

**Phase D — Conversion surfaces**
17. Items list top-3 + expander (R-Bottom1)
18. Sticky shop CTA (R-Bottom2)
19. Price-tag delayed-render (A2=MODIFY)
20. Google OAuth visually dominant (R-Account1)
21. Soft email capture before D7 (A4)
22. Aha event split (A7)
23. Promise-Fit micro-survey (R8)
24. Habit metric instrumentation (R6)
25. Value-moment paywall triggers (R-Paywall1)
26. Paywall consolidation 8→3 layouts (R-Paywall2)
27. Annual price anchor badge (R-Paywall3)

**Phase E — DEFERRED.md updates**
- Email backend (existing item 6) — gets new sub-item: `state.user.recoveryEmail` flush at backend cutover
- Push timing change (R9) — added to push-infrastructure deferred work
- Real backend session-2 detection (firstRedesignTutorialSeen sync — already in DEFERRED.md item 3)

**Phase F — Sweep**: walk full flow as new user → returning user → confirm no dead ends.

**Phase G — Migration log + commit.**

---

## What's auto-deferred per Hassan's rules

- **Real email send** (A4 backend half) — DEFERRED.md item 6 already covers
- **Push pre-prompt timing change** (R9) — DEFERRED.md item 7 push infrastructure
- **A1 Path A "full Setup-after-Aha"** — flagged as future structural batch (XL effort)
- **A5 "Quarterly Core flip"** — flagged as future structural batch (Conflict 1 lock honored)
- **Q2 palette room thumbs assets** (E2) — config-driven slot ready, asset deferred
- **Capture "What works" example assets** (E9) — config-driven slot ready, asset deferred
- **Hero tagline rewrite** (A6) — KEEP CURRENT recommended
- **A/B test harness** (Dim 03 R-Top3 mentions, also implied by R-Paywall1) — separate infrastructure batch

---

## Section E — CONSOLIDATED DECISION REQUEST (please reply)

Hassan, fill in your call for each. My recommendations are marked.

| # | Decision | My recommendation | Your call |
|---|----------|-------------------|-----------|
| A1 | Quiz architecture | **B+C** (reorder photo last + Q3 → room type) | ___ |
| A2 | Price tags placement | **MODIFY** (delay render to Frame 5 of choreography, keep on image) | ___ |
| A3 | Skip button styling | **DEMOTE** to text link (per Dim 12) | ___ |
| A4 | Soft email capture before D7 (Conflict 5) | **CONFIRM** (approve & ship) | ___ |
| A5 | Quarterly Core flip in Batch 3 | **DEFER** to structural batch | ___ |
| A6 | Hero tagline rewrite | **KEEP CURRENT** | ___ |
| A7 | Aha event redefinition | **APPROVE** (split into gate + moment) | ___ |
| A8 | Tutorial timing (Conflict 7) | **APPROVE** (defer to session 2) | ___ |

Reply format: `A1: B+C, A2: MODIFY, A3: DEMOTE, A4: CONFIRM, A5: DEFER, A6: KEEP CURRENT, A7: APPROVE, A8: APPROVE` (or override any with `Ax: <your specific call>`).

After your reply, I implement Phases A through G without further stops, sweep, append to IMPLEMENTATION_PROGRESS.md, and commit.
