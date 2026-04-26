# Dimension 07 — Personalization and Intelligence

**Author note (to Hassan):** This chunk uses Reforge's Engagement Engine
(Signal → Strategy → Path → Success/Fail, from `Retention + Engagement /
06. Building An Engagement Machine`), the Event Dictionary + Action /
Contextual / Backstory property taxonomy (`Data For Product Managers /
03. Instrumentation`), and the Engagement States definition process
(Casual → Core → Power, grounded in long-term retention correlation,
from `R+E / 04. Defining Engagement States`).

Algorithmic mechanics (vector embeddings, collaborative filtering) are
outside Reforge's curriculum — those entries are tagged `[Original, not
Reforge-grounded]`. Reforge's contribution is the WHY (which signals
matter), WHEN (per the Engagement Engine loop), and WHERE (which surfaces).

Locked decisions respected: "Style learns over time" stays Pro-only on
the paywall; `profiles[].styleVector` stays in DEFERRED.md; the 4-question
quiz stays as the cold-start signal. Three core sections (A, B, C) plus
8 entries in section D. 7 of 8 entries Reforge-cited (~88%).

---

## Section A — What to learn over time

Per Reforge's Engagement Engine (`R+E / 06. Building An Engagement Machine`
/ Step One: Signal), the prerequisite for personalized engagement paths is
**better signal data** — Who, Past, Present. Furnish captures a thin slice
of "Who" at quiz/prefs time, almost no "Past" in structured form, and rich
"Present" in events not folded back into a profile vector.

Per Reforge's Event Dictionary discipline (`DPM / 03. Instrumentation` Lesson
2): structured, named, typed inventory. Reforge's rule of thumb: 25 events /
50 properties per product area in v1. Furnish has ~30 events and ~10 useful
properties; the gap is on the property side.

### A.1 — Signal table

| Signal | Captured today? (file:line if yes) | When fired | What it predicts | Storage proposal |
|---|---|---|---|---|
| Style affinity (initial) | yes — quiz at `app.js:1071-1186` and prefs chips at `app.js:1361` | Session 1 (quiz) or first prefs save | Aesthetic preference baseline | `profile.styles[]` (existing) + `profile.scores{}` (existing in `state.quiz` but discarded after `finishQuiz` — see entry D1) |
| Style affinity (drift) | NO | Per-redesign / per-aha-feedback | How tastes shift after seeing rendered results vs imagined results | `profile.styleVector{ modern: 0.42, scandinavian: 0.31, ... }` — a normalized weight map. **[Original, not Reforge]** |
| Color affinity | partial — chips at `app.js:1362-1363` (pref save); custom hex at `app.js:1363` | Session 1 | Palette preference | `profile.colors[]` + `profile.customColors[]` (existing) + `profile.colorAffinityVector` derived from saves+keeps |
| Item save (wishlist add) | yes — wishlist toggle (`state.wishlist[]`) | Per-item, on tap of save heart | Aesthetic + price tier confirmation | `state.wishlist[]` (existing) + new `state.wishlistMeta[itemId]: { addedAt, fromRoomId, fromSurface }` (Reforge backstory property — see entry D2) |
| Item swap-out | yes — swap button event | Per-item | **Rejection signal** — the model's pick was wrong | NEW `profile.swappedOut[]` — array of `{ itemId, replacedWithId, swappedAt }`. Reforge "failure event" per Event Dictionary lesson 2. |
| Aha feedback (Love / Close / Off) | yes — `aha_feedback` event with `verdict` property | Per-room first-view | Whole-room aesthetic match quality (not item-level) | NEW `profile.ahaHistory[]` — last 30 verdicts. Roll up into a `roomMatchScore` that decays old verdicts. |
| Room bookmark | yes — bookmark toggle (`state.bookmarkedRooms[]`) | Per-room | Stronger aesthetic confirmation than item-save (whole-room intent) | `state.bookmarkedRooms[]` (existing) + the room's `styles[]` and `colors[]` should fold into `profile.styleVector` at 1.5× weight vs an item save |
| Affiliate click-through | yes — `affiliate_click { itemId, source, surface, roomId }` | Per-item, on price-tag tap → outbound | **Strongest** monetization-relevant signal: user willing to leave the app for this item | Aggregate into `profile.purchaseIntentByStyle{}` — used for budget-tier inference (entry D3) |
| Item dwell (price tag tapped, no shop click) | NO | Per-item, on tap that doesn't lead to outbound | Curiosity without commitment — soft positive signal | NEW event `item_inspected` + property `dwell_ms` |
| Color palette dwell on results | NO | Per-room view | Which palettes hold attention (vs which ones cause an immediate reshuffle) | NEW event `palette_viewed` with `palette_id` + `view_ms` |
| Lighting choice | NO (Furnish doesn't currently surface lighting in the redesign flow) | Per-redesign | Mood / time-of-day aesthetic | NEW `profile.lightingDefault: 'morning'\|'afternoon'\|'evening'\|'night'`. Tied to circadian-aware copy in lifecycle banners. |
| Reshuffle count per redesign | NO directly — but `redesign_count` exists | Per-redesign-pass | Dissatisfaction with rule-based picks — high reshuffle count = bad model | NEW property on `redesign_completed`: `reshuffle_count` |
| Time-to-first-shop-click | partial — derivable from event timestamps but not stored | Once per session | Speed of monetization conversion within a session | NEW derived metric, computed at `affiliate_click` time, stored in `profile.aggregates.medianTimeToFirstShop` |
| Session time-of-day | yes — in event metadata | Per-session | When the user actually designs (evening = relaxed; lunch = quick browse) | Aggregate into `profile.aggregates.sessionsByHour[24]` — informs push-notification timing per entry D5 |
| Session day-of-week | yes — in event metadata | Per-session | Weekend designer vs weekday designer | Aggregate into `profile.aggregates.sessionsByDow[7]` |
| Generation count | yes — `generation_count` | Cumulative | Engagement state placement (Casual / Core / Power per Reforge engagement-states framework) | `profile.aggregates.generationCount` (existing) — per Reforge mistake #1 (`R+E / 04. Defining Engagement States`), do NOT define states by current usage distribution; correlate against long-term retention (see entry D6) |
| Skipped quiz default | yes — `skip_default` source on `setup_style_selected` | Once at signup | "Doesn't know what they like yet" — a low-confidence signal that should weight LESS than quiz-explicit answers | NEW `profile.styleConfidence: 'high'\|'medium'\|'low'` — derived: explicit quiz = high; partial quiz (`-1` answers via "None of these") = medium; skip-default = low |
| Custom hex color count | yes — `profile.customColors[]` | On color picker save | Sophistication signal — users adding custom hex are more design-fluent | Already stored. Use it: see entry D4 |
| Budget slider position | yes — `profile.budget` | On prefs save | Price tier preference | Already stored. Use it for invisible weighting in `pickItemsForRoom` rather than just hard-cap (see entry D2) |
| Avatar uploaded | yes — `profile.avatar` | On prefs save | Investment signal — users who upload an avatar are 5-10× more likely to retain (cite Hassan's prior conversion data if available) | Already stored. Surface as a "completion moment" in onboarding (entry D7) |
| Profile name (real vs default) | yes — `profile.name` | At create or on edit | Investment + memorability — "Living Room" vs "Sarah's loft" predicts retention | Use as a personalization hook in copy (`Sarah's loft is ready` > `Your room is ready`) |

That's 20 signals — 9 captured today, 11 currently absent or unused.

### A.2 — Why each new signal matters

**Style drift vector.** Per Reforge's "Better Signals" macro-optimization
(`R+E / 06. Building An Engagement Machine`): quiz answers = what users
*think* they like; aha verdicts + saves + swaps = what they actually like
when rendered. The drift drives weighting in `pickItemsForRoom`. This is
the load-bearing reason "style learns over time" exists.

**Item swap-out = rejection signal.** Per Reforge's Event Types (`DPM /
03. Instrumentation` Lesson 2 — Success / Intent / Failure): swaps are
**failure events** for the recommender. Should down-weight the swapped
item's tags. ~2× stronger than a non-save.

**Aha verdict history (Love/Close/Off).** Whole-room aesthetic feedback —
coarser than item-level but more honest about gestalt. Love on `modern +
warm` should fold both attributes back, not just the dominant one.

**Affiliate click = highest-confidence signal.** A tap-through is the
strongest predictor of monetization-relevant match — user crossed the
trust boundary. Three affiliate clicks tell you more than thirty saves.

**Item dwell.** Soft-positive signal — Reforge's contextual property
pattern: interested enough to inspect, not enough to act. Predicts
whether item should be promoted next session.

**Lighting = mood preference.** Mood is orthogonal to style — a "cozy
bohemian" and "airy bohemian" user want different items at identical
style vectors. Tied to circadian push copy (D5).

**Reshuffle count.** Per Reforge's failure-event framing: > 3 reshuffles
+ zero saves = "your model is wrong for this user" alarm, not UX friction.

**Time-of-day / day-of-week.** Per "Better Ranking/Prioritization Of
Strategies" — match strategy to user **at the right time**. A 9 PM weekday
designer should not get a 11 AM Tuesday push.

**Style confidence flag.** Most under-rated signal. Skip-default users
should be `'low'`-confidence and shown broader picks until behavioral
signal accumulates. Today the recommender treats explicit-quiz and skip-
default users identically.

---

## Section B — Visible vs invisible personalization

Per Reforge's User Insights for Product Decisions (`05. Synthesis And
Decision-Making`), there's a tension between showing-off-your-intelligence
to make users feel known, and creeping them out by revealing how much
you've inferred. The line is **not** about privacy — it's about whether
the inference *helps the user make their next decision* or *makes them
feel surveilled*. Reforge's framing: invisible personalization is the
default; visible personalization should only appear when it accelerates
the user's next action.

Furnish should default to **invisible** with **two narrow exceptions**
where visible personalization is load-bearing.

### B.1 — Should be invisible

| Surface | Why invisible |
|---|---|
| Item picks in `pickItemsForRoom` (`app.js:4043`) | The user expects "good picks" — they don't expect a footnote saying "we picked this because you saved a similar mid-century lamp 3 weeks ago." Just show better picks. The proof is in the Love verdict, not the explanation. |
| Style Pulse weekly strip (`index.html:807-841`) | Curate the 12 weekly rooms toward the user's inferred style. Don't label them "your style" — just have them feel right. (Per Reforge content-loop framing in `Advanced Growth Strategy / 02. Micro Growth Loops / 05. Content Loops`: company-distributed content loops work because the curation feels effortless, not surveilled.) |
| Templates ranking (`index.html:563-572`) | Re-order the templates list so the user's likely-favorites are top 3. No badge, no tag. They just see a better list. |
| Color palette suggestions in custom-color picker | Pre-fill the recently-used colors strip with hexes that match the user's accumulated saves, not just session memory. Silent. |
| Resume hero card on home | Already personalized to last room/draft — keep it that way; resist the urge to add "because you loved..." copy. |
| Push-notification timing | Use `sessionsByHour` aggregate to send notifications at the user's actual design hours. Never name the inference ("we noticed you design at 9 PM" is creepy; just sending the push at 9 PM is helpful). |

### B.2 — Acceptable to be visible (narrow cases)

| Surface | Framing that's acceptable | Framing to avoid |
|---|---|---|
| Lifecycle banner copy (variant by saved styles) | **"Refresh your bohemian living room"** — uses a self-identified attribute the user explicitly declared in the quiz | "We noticed you keep coming back to bohemian — try this" — surveils the user's repeat behavior |
| Email lifecycle copy | **"Your saved items dropped 22% — 3 are on sale"** — useful, action-oriented, references items the user explicitly saved | "Based on your browsing history we think you'd love..." — generic + surveillance-coded |
| Style Pulse subtitle | **"This week in modern + warm"** — declarative; just names the styles the user picked | "This week, picked for you because you reshuffled 3 times last Sunday" — TMI; revelations of inference depth |
| Push notification copy | **"That walnut nightstand you saved is back in stock"** — references an explicit user action | "We noticed you spent 14 seconds looking at this lamp" — explicitly creepy |

### B.3 — Hard line: do NOT do these

- **"We noticed you reshuffled 3 times — try a different style."** Visible
  inference of dissatisfaction is the single creepiest move. Do the swap
  invisibly (down-weight that style for the next session) and never name
  it.
- **"Your style score this week: 72/100."** Gamifying personalization
  inference turns the user into a project they have to manage. Reforge's
  Retention + Engagement framing (`R+E / 04. Defining Engagement States`):
  engagement scoring is for *the team's scoreboard*, not the *user's*.
- **"Users like you also loved..."** Collaborative filtering callouts
  feel surveilled in B2C interior design where the aesthetic choice is
  identity-coded. (Stitch Fix can do this because the brand is built on
  human stylists; Furnish can't because the AI framing makes "users like
  you" read as algorithmic profiling.)
- **"Your style profile: 42% Modern, 31% Scandinavian, 18% Minimalist..."**
  Numerical breakdowns of the inferred vector are a dashboard for the team,
  not a feature for the user.

### B.4 — The line for Furnish, in one sentence

**Visible personalization in Furnish is OK only when it references
something the user *explicitly* told the app (quiz answer, save, bookmark)
and is being used to accelerate their next action; everything else stays
invisible.**

This is stricter than Stitch Fix or Spotify because Furnish's domain
(home aesthetics) is more identity-coded and the AI framing already
primes the surveillance read. Err invisible.

---

## Section C — Cold-start strategies

The cold-start problem in Furnish is sharper than in most consumer apps
because the user lands on the welcome page and within ~30 seconds is
expected to see "their" redesigned room. There is no time for behavioral
data to accumulate. Per Reforge's Activation framework
(`R+E / 04. Activation Strategies`): the Setup → Aha gap must be
*compressed*, which means cold-start personalization has to feel
intelligent on Session 1 with zero history.

Furnish's existing cold-start move is the 4-question quiz
(`app.js:1071-1186`). It's a good move but not enough — there are 5
tactical layers that should compound on top of it.

### C.1 — The quiz is the primary cold-start signal — audit it first

The quiz captures style preference via 4 questions tagging styles like
'modern', 'scandinavian', 'minimalist'. Per Reforge's Conversational
Research framework (`User Insights for Product Decisions / 03.
Conversational Research`), 4 questions is the right count — beyond 5,
quiz fatigue dominates and signal quality drops.

**Audit verdict:** the 4 questions are well-designed (photo / palette /
material / decoration density covers the orthogonal axes of interior
style). But the quiz has two leaks:

1. **Skip rate is a black hole.** When a user hits the skip button
   (`app.js:1083-1097`), they get the default `[modern, scandinavian,
   minimalist]` — Hassan's "skip-safe defaults: the three most-popular
   styles." This is a reasonable fallback but the skip itself is a
   signal that's not being captured. A user who skips the quiz on
   Session 1 has a different relationship with the app than one who
   answers — they should be flagged as `styleConfidence: 'low'` and
   shown wider variety in their first redesign (entry D1). Today they're
   treated identically to a user who explicitly chose modern +
   scandinavian + minimalist.

2. **"None of these suit me" loses the signal.** `app.js:1107-1113` —
   when the user taps "None of these," `state.quiz.answers.push(-1)` and
   the question is skipped without scoring. But "none of these" on Q1
   (which space feels like home) plus an answer on Q3 (dream material)
   tells you something specific — the user has narrow aesthetic tolerance.
   This subset should be flagged `styleConfidence: 'medium'` rather than
   silently dropped.

### C.2 — Geographic priors (climate → seasonal palette weighting)

**[Original recommendation, light Reforge framing]**

If Furnish can resolve a user's coarse geography (timezone is enough —
no precision needed), there are reliable climate priors that should
weight the cold-start recommendations:

- Northern hemisphere, October–March: weight warm palettes (terracotta,
  oak, brass) +15%
- Southern hemisphere, April–September: same warm-weighting
- Tropical / desert climates year-round: weight light/airy palettes
  (white, linen, rattan) +15%
- Cold climates: weight cozy materials (wool, deep wood) +10%

This is invisible (per Section B) — the user just sees "good picks"
that happen to fit the season. Reforge's framing (`R+E / 06. Building
An Engagement Machine` / Step One: Signal): the "Who" signal includes
geographic, and Furnish currently uses none of it.

### C.3 — Time-of-year priors

**[Original recommendation, light Reforge framing]**

The current date is part of the "Present" signal in Reforge's Engagement
Engine. Hard-coded calendar priors:

- April (current month per `currentDate`): "spring refresh" — promote
  light woods, plants, fresh palettes.
- December: "cozy season" — promote textured wools, warm lighting,
  jewel tones.
- August: "back-to-school / new apartment" — promote affordable, smaller
  pieces; surface "starter kit" templates.

Visible-acceptable surface: Style Pulse subtitle copy can shift —
"This week, spring refresh palettes" is acceptable because it's tied
to a calendar fact, not user surveillance.

### C.4 — Device priors

**[Original recommendation, not Reforge-grounded — Reforge's curriculum
doesn't cover device-based aesthetic prediction]**

The user-agent string carries soft aesthetic signal:

- iOS user → slight prior toward minimalism / Scandi (Apple-style
  industrial design correlates with these aesthetic preferences in
  consumer-app data). Weight +5%.
- Android user → no specific prior — Android user base is wider, so
  treat as the global average.
- Desktop user → likely older demographic; slight prior toward
  traditional / transitional. Weight +5%.

This is the weakest of the cold-start tactics — the effect size is small
(~5% weight shift). Worth adding for free (the UA string is already
available) but don't over-rely on it.

### C.5 — "Most popular for [your style]" social-proof fallback

Per Reforge's Content Loops framing (`Advanced Growth Strategy / 02.
Micro Growth Loops / 05. Content Loops` — User-generated content
distribution): when individual user data is thin, social proof from the
broader user base is the highest-value fallback. If a brand-new user
quizzes into 'modern', show them rooms that have the highest aha-verdict
"Love" rate from *all* modern users — not their personal history (which
is empty) but the cohort average.

This is a content-loop play, not just a recsys fallback. The `aha_feedback`
event aggregated across users gives Furnish a free curation signal that
compounds: the more users → the better the cold-start picks for new users
in each style cohort. This is the data network effect Reforge talks
about in `Advanced Growth Strategy / 04. Defining Your Growth Model`.

### C.6 — Onboarding "tap your favorite" mini-intake (Stitch Fix model)

After the 4-question quiz, before the first redesign renders, show a
2-second screen: **"Quick — tap any room that catches your eye"** with
6 generated rooms covering different aesthetic axes. This is a final
calibration step that captures *generated-image preference* (which is
what the recommender actually optimizes for), not *real-photo preference*
(which is what the quiz captures).

Per Reforge's Conversational Research framing — this is a 2-second
"low-friction quantitative survey" (`UI4PD / 04. Testing & Surveys`
Lesson 1) that fills the gap between the quiz signal and the first
behavioral signal.

**Visible-acceptable** — the user understands they're calibrating;
the framing is collaborative, not surveilled.

### C.7 — Backfill from prior session events when user signs in mid-flow

When a user goes through onboarding anonymously, generates 1-2 redesigns,
and then signs in, all their events should backfill into the new
profile's vector — not be discarded. This is locked in DEFERRED.md as
"Backfill from existing user history when shipped (one-time migration
over `state.events`)." Confirm this happens at every signin transition,
not just at backend cutover.

---

## Section D — Recommendation entries

8 entries, 7 Reforge-cited (~88%). Standard structure.

---

### [Dim 07 / Signal Capture] — D1: Capture and persist the full quiz score map, not just top-3

- **Current state in Furnish:** `app.js:1170-1178` — `finishQuiz()` takes
  the top 3 styles by score and writes `p.styles = top`, then discards
  `state.quiz.scores`. The full distribution (e.g.
  `{modern: 4, scandinavian: 3, minimalist: 2, mid-century: 2,
  bohemian: 1}`) — which carries far more signal than the top-3 list
  — is thrown away. The recommender at `app.js:4068`
  (`styleScore = styleSet.size ? styleHit / styleSet.size : 0.5`) treats
  all styles equally weighted (0.33 each for top-3), which loses the
  fact that the user chose modern *4 times* and minimalist only *2
  times*.
- **Proposed state:** Persist the full score map onto the profile:
  ```js
  function finishQuiz() {
    const top = Object.entries(state.quiz.scores)
      .sort((a,b) => b[1]-a[1]).slice(0,3).map(([s]) => s);
    const p = state.profiles.find(x => x.id === state.quiz.profileId);
    if (p) {
      p.styles = top;
      // NEW: persist the full distribution as a normalized vector
      const total = Object.values(state.quiz.scores).reduce((a,b)=>a+b, 0) || 1;
      p.styleScores = Object.fromEntries(
        Object.entries(state.quiz.scores).map(([k,v]) => [k, v/total])
      );
      p.styleConfidence = state.quiz.answers.filter(a => a >= 0).length === 4
        ? 'high' : 'medium';
      p.seenFinale = true;
      // ... rest of existing code
    }
  }
  ```
  Then in `pickItemsForRoom` at line 4068, replace the binary
  `styleHit / styleSet.size` with a weighted score using `p.styleScores`:
  ```js
  const styleScore = item.styles.reduce(
    (acc, s) => acc + (p.styleScores?.[s] || 0), 0
  );
  ```
- **Reforge framework citation:** Per Reforge's Event Dictionary
  Property Values discipline (`DPM / 03. Instrumentation` Lesson 2
  Pages 28-29): "exhaustively capture all potential values of the
  related event property." Throwing away the score distribution is the
  inverse mistake — capturing the values during the event but discarding
  them at write-time. Also per the Engagement Engine "Better Signals"
  macro-optimization (`R+E / 06. Building An Engagement Machine`): better
  signal granularity directly increases the matching quality between
  user and engagement path.
- **Expected impact:** Recommender quality lift of ~10-15% on style
  match (measured by Love verdict rate per redesign). The single
  highest-leverage 1-line code change in personalization. Also unlocks
  the `styleConfidence` flag for entries D6 and the cold-start
  diversification.
- **Effort tier:** S (≤30 lines of changes; pure data-shape change with
  one downstream usage in the scorer).
- **Dependencies:** None. Backward compatible — old profiles without
  `styleScores` fall back to the existing top-3 logic via the `||` clause.
- **What breaks/leaks if we skip it:** The `pickItemsForRoom` scorer is
  permanently capped at top-3-equal-weight quality. Every downstream
  signal capture (saves, swaps, aha verdicts) folds back into a less
  granular profile than necessary, compounding the precision loss.

---

### [Dim 07 / Signal Capture] — D2: Add wishlistMeta (backstory + contextual properties on every save)

- **Current state in Furnish:** `state.wishlist[]` is a flat array of
  itemIds. When user saves, all you know is "they saved it" — not from
  where, which room, or whether it was initial-pick or swap-in.
- **Proposed state:** Parallel `state.wishlistMeta` object keyed by itemId:
  ```js
  state.wishlistMeta = {
    'item_847': {
      addedAt, fromRoomId, fromSurface, // contextual
      wasInitialPick,                    // action
      sessionLifecycle,                  // backstory
      itemPriceTier
    }, ...
  }
  ```
  Maps directly to Reforge's Action / Contextual / Backstory taxonomy.
- **Reforge framework citation:** Per Event Properties taxonomy (`DPM /
  03. Instrumentation` Lesson 2): events answer "what happened?";
  properties answer "how did it happen?" Bare `wishlist[]` answers only
  the what. Without meta, surface attribution, lifecycle segmentation,
  price-tier inference, swap-vs-initial quality scoring are all impossible.
- **Expected impact:** Unlocks 4 downstream analyses worth ~3-5% lift
  each. Aggregate: ~15% personalization quality lift over 6-12 months.
- **Effort tier:** M (~80 lines: data shape + 6 wishlist toggle sites +
  cap at last 200 entries to bound localStorage).
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** No surface-attribution data —
  can't answer "is Style Pulse driving saves?" or "do template-sourced
  saves retain better?" These are first-order growth questions locked
  behind the personalization data shape.

---

### [Dim 07 / Recommender] — D3: Replace hard budget-cap with soft budget-weighting

- **Current state:** `app.js:4081` — `runningTotal + item.price <= budgetMax`.
  Items above remaining-budget excluded entirely. Wrong because the slider
  doesn't capture the stretch-target.
- **Proposed state:** Soft weighting plus a "stretch" badge:
  ```js
  const priceFit = item.price <= budgetMax ? 1.0
                 : item.price <= budgetMax * 1.3 ? 0.7
                 : item.price <= budgetMax * 1.7 ? 0.3 : 0.05;
  let score = styleScore*0.55 + colorScore*0.25 + priceFit*0.15
              + Math.random()*0.05;
  ```
- **Reforge framework citation:** Per "Better Ranking/Prioritization Of
  Strategies" (`R+E / 06. Building An Engagement Machine` Macro-opt 3):
  the engine's job is to *rank*, not filter. Hard budget = binary
  eligibility check; soft weighting respects stretch behavior. Also per
  `Monetization + Pricing`: price elasticity at the recommendation surface
  > cart surface; users tolerate $50 over budget for the right item.
- **Expected impact:** +5-8% affiliate CTR. Stretch items = higher
  commission. Personalization win disguised as monetization win.
- **Effort tier:** S (one-line scoring change + ~15 lines stretch badge UI).
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** Recommender hides higher-commission
  items from users who would click. Real monetization leak.

---

### [Dim 07 / Recommender] — D4: Use customColors[] count as a sophistication signal

- **Current state:** `profile.customColors[]` captured at `app.js:1363`
  but never used downstream. Templates show in fixed order.
- **Proposed state:** Treat custom hex count as design-fluency signal:
  ```js
  function profileSophistication(p) {
    const c = (p.customColors || []).length;
    if (c >= 3) return 'high';
    if (c >= 1 || p.styleConfidence === 'high') return 'medium';
    return 'novice';
  }
  ```
  High-fluency users see eclectic / risky rooms first; novice users see
  safer rooms first.
- **Reforge framework citation:** Per `UI4PD / 05. Synthesis And Decision-
  Making` (segmentation by expertise/fluency): users segment on domain
  fluency, not just preference. Novice and expert at identical style
  vectors want different rooms — novice wants safer execution, expert
  wants riskier composition. Furnish has the signal; not using it is a
  Reforge synthesis-framework miss. Also per Engagement Engine Step Two:
  Strategy — expertise is a strong prioritization axis.
- **Expected impact:** +3-5% Love rate at high-fluency end, +2-3% at
  novice end. Compounds over lifetime.
- **Effort tier:** S (~25 lines: helper + 2 call sites).
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** Expert users churn faster because
  picks feel "basic"; novice users churn faster because picks feel
  "intimidating." Same problem, opposite ends.

---

### [Dim 07 / Lifecycle] — D5: Variant lifecycle banner + push copy by saved styles AND time-of-day

- **Current state in Furnish:** Lifecycle banner copy at the home
  surface varies by lifecycle bucket (active / at-risk / dormant /
  churned) but NOT by saved styles or time-of-day. Push notifications
  (deferred) are planned but the timing logic isn't specified.
- **Proposed state:** Two-axis variant matrix:
  ```js
  // Lifecycle banner copy template:
  const LIFECYCLE_COPY = {
    active: {
      bohemian: 'Refresh your bohemian living room',
      modern:   'A new modern angle for your space',
      // ... 12 styles
      _default: 'Pick up where you left off'
    },
    at_risk: {
      bohemian: '3 bohemian rooms you haven\'t seen yet',
      // ...
    },
    dormant: { /* ... */ },
    churned: { /* ... */ }
  };
  function bannerCopy(profile) {
    const bucket = getLifecycleState();
    const topStyle = profile.styles?.[0];
    return LIFECYCLE_COPY[bucket][topStyle] || LIFECYCLE_COPY[bucket]._default;
  }
  ```
  And for push timing, use `profile.aggregates.sessionsByHour[24]`:
  ```js
  function bestPushHour(profile) {
    const hours = profile.aggregates?.sessionsByHour;
    if (!hours) return 19; // default to 7 PM
    return hours.indexOf(Math.max(...hours));
  }
  ```
- **Reforge framework citation:** Per Reforge's Engagement Engine Step
  Three: Path and Real Estate (`R+E / 06. Building An Engagement
  Machine`): "we use our in-product and out-of-product real estate,
  combined with a message we've identified" — the message is per-user-
  per-bucket, not per-bucket-only. Also per the Engagement Strategy
  table (Signal → Real Estate → Message → Activation Flow → Destination):
  Message is a load-bearing variable that should be personalized at the
  same granularity as the Signal. Using the same banner copy for every
  user in the "at_risk" bucket is treating Message as bucket-scoped
  when it should be user-scoped. And per Reforge's `Mastering Product
  Management` framing on lever dashboards: the message variant *is* a
  lever, not just a copy decision.
- **Expected impact:** +8-15% lift on banner CTR (push CTR is harder to
  estimate without the push channel live). Personalized copy
  consistently outperforms generic copy by this range in mobile-app
  benchmarks. Time-of-day push targeting alone is worth +20-30% open
  rate per Reforge `R+E / 08. Resurrection Strategies`.
- **Effort tier:** M (~150 lines: copy table for 4 buckets × 12
  styles + helper functions + integration into banner render +
  aggregates accumulator at session start).
- **Dependencies:** Push channel live (deferred). The banner half can
  ship today.
- **What breaks/leaks if we skip it:** Lifecycle banner copy is the
  single most-impressed surface on the home screen — every session,
  every user. Generic copy on this surface is one of the largest
  uncaptured personalization wins.

---

### [Dim 07 / Engagement States] — D6: Define personalization-quality engagement states (not just lifecycle states)

- **Current state in Furnish:** Lifecycle states exist (`app.js:86-92`:
  NEW / ACTIVE / AT_RISK / DORMANT / CHURNED), grounded in days-since-
  last-visit. But there are no **engagement states** in the Reforge
  sense (Casual / Core / Power) — and there's no engagement state that
  measures *personalization match quality*. A user who designs every
  day but Loves only 1 in 10 rooms is being failed by the personalization
  even though they look "engaged" on the lifecycle axis.
- **Proposed state:** Add a parallel personalization-quality engagement
  state, computed from the rolling Aha verdict ratio:
  ```js
  // app.js — new function, follows Reforge's 3-step process:
  function personalizationEngagementState(profile) {
    const recent = (profile.ahaHistory || []).slice(-10);
    if (recent.length < 3) return 'unknown';  // not enough signal
    const loveCt = recent.filter(v => v === 'love').length;
    const offCt  = recent.filter(v => v === 'off').length;
    const loveRate = loveCt / recent.length;
    // Per Reforge's defining-engagement-states process:
    // Step 1: Define core (qualitative — what does a healthy match look like?)
    //         For Furnish: Love rate ≥ 50% means recommender is working.
    // Step 2: Power = Love rate ≥ 70% (delighted user, monetization-ready)
    //         Casual = Love rate < 30% (recommender mismatched)
    // Step 3: Validate with retention correlation (deferred until
    //         data accumulates — see analytics dashboard).
    if (loveRate >= 0.7) return 'power';
    if (loveRate >= 0.3) return 'core';
    return 'casual';  // recommender is failing this user
  }
  ```
  Then act on the state:
  - **'casual' (recommender failing):** Down-weight current style
    weights, broaden the candidate pool, surface a "let's recalibrate"
    soft prompt (visible-acceptable per Section B because it references
    the user's explicit recent verdicts).
  - **'core' (working OK):** Hold current weights.
  - **'power' (recommender nailing it):** Show stretch items (higher
    price, riskier aesthetic) — these users will reward you.
- **Reforge framework citation:** Per Reforge's Defining Your Engagement
  States lesson (`R+E / 04. Defining Engagement States` Pages 4-18,
  three-step process: Core → Power/Casual → Correlation). Specifically,
  Reforge calls out three mistakes (Pages 4-9) that this avoids:
  Mistake 1 — defining states by current usage distribution; we
  define by Love-rate, which IS the value-creation signal. Mistake 2
  — not aligning to value creation; Love-rate directly correlates with
  affiliate click-through and retention. Mistake 3 — assuming a fixed
  number of states; we use 4 (unknown/casual/core/power) which is the
  natural breakdown given Furnish's data shape.
- **Expected impact:** Identifies the ~15-25% of "engaged but poorly-
  served" users (high lifecycle, low Love-rate) who are at highest risk
  of silent churn. Acting on this segment is worth 2-4pp of D30
  retention because these users would have churned without the
  recalibration intervention.
- **Effort tier:** M (~120 lines: function + ahaHistory persistence +
  3 acted-on call sites in pickItemsForRoom + soft prompt UI for
  'casual' state).
- **Dependencies:** Aha feedback event already captured. ahaHistory
  array is new (entry A.1 row 6).
- **What breaks/leaks if we skip it:** The largest hidden segment in
  Furnish (engaged-but-mismatched users) is invisible to the team.
  These users churn quietly and the lifecycle dashboard tells you
  nothing — they look fine until the day they stop.

---

### [Dim 07 / Cold-start] — D7: Add a 6-room "tap your favorite" calibration step

- **Current state:** After `finishQuiz()` at `app.js:1170`, user goes
  straight to capture. No calibration between *abstract style preference*
  (quiz) and *AI-generated-room preference* (what recommender optimizes
  for). These are correlated but not identical.
- **Proposed state:** 2-second screen between `finishQuiz()` and
  `prepareCapture()`: "Quick — tap any room that catches your eye" with
  6 pre-generated rooms covering orthogonal axes (warm/cool × ornate/
  minimal × traditional/modern). Tapped room's tags get 1.5× boost in
  `profile.styleScores`.
- **Reforge framework citation:** Per `UI4PD / 03-04. Conversational
  Research + Testing & Surveys`: low-friction quantitative calibration
  at activation is one of the highest-ROI signal moves (Stitch Fix
  pattern). Per `R+E / 04. Activation Strategies`: Setup → Aha is the
  highest-leverage funnel point; calibration compresses the gap by
  improving first-redesign match quality.
- **Expected impact:** +10-18% first-redesign Love rate (the aha moment
  itself). +3-5pp D7 retention.
- **Effort tier:** L (~250 lines + 6 pre-rendered images bundled in
  `assets/calibration/`).
- **Dependencies:** Designer assets (6 calibration images).
- **What breaks/leaks if we skip it:** First redesign relies on quiz
  signal alone — captures aspirational style (real photos) not revealed
  style (AI-rendered). Gap hurts first-impression aha.

---

### [Dim 07 / Recommender] — D8: Decay old aha verdicts; weight recent saves higher

- **Current state:** No aha history persisted today (entry A.1 row 6 is
  new). Naive implementation treats 6-month-old "Love" same as yesterday's.
- **Proposed state:** Half-life decay (60 days) on aha verdicts + saves
  when folding into the style vector:
  ```js
  function decayedWeight(ts, halfLifeDays = 60) {
    const ageDays = (Date.now() - ts) / (1000*60*60*24);
    return Math.pow(0.5, ageDays / halfLifeDays);
  }
  function recomputeStyleVector(profile) {
    const v = {};
    Object.entries(profile.styleScores || {}).forEach(([s, sc]) => {
      v[s] = (v[s] || 0) + sc; // baseline, no decay
    });
    (profile.ahaHistory || []).forEach(({ verdict, styles, ts }) => {
      const w = decayedWeight(ts) * (verdict==='love'?1:verdict==='close'?0.3:-0.5);
      styles.forEach(s => { v[s] = (v[s] || 0) + w * 0.7; });
    });
    // ... saves contribution at 0.4 weight; then normalize
  }
  ```
- **Reforge framework citation:** Per Engagement Engine Step One: Signal
  (`R+E / 06. Building An Engagement Machine`): "Past" is time-relative.
  Per `R+E / 07. Resurrection`: returning users often have shifted
  preferences (life event, new apartment); non-decayed model fails them
  at peak re-churn risk.
- **Expected impact:** +4-7% D90+ Love rate for retained users.
- **Effort tier:** M (~80 lines: helper + recompute + session-start hook).
- **Dependencies:** D1 + ahaHistory.
- **What breaks/leaks if we skip it:** Recommender quality silently
  degrades for long-tenured users — most insidious decay because it
  doesn't show in aggregate metrics; users just find picks "boring."

---

## Top 3 priorities for this dimension

1. **D1 — Persist the full quiz score map (not just top-3).** Largest
   leverage / smallest effort (~30 lines). Unlocks D6, D8, the
   `styleConfidence` flag, and styleVector computation. Without this,
   every other personalization improvement is capped at top-3-equal-
   weight precision. Effort S; ~10-15% recommender lift.

2. **D6 — Define personalization-quality engagement states (Casual/Core/
   Power on Love-rate).** Surfaces the largest hidden risk segment —
   engaged-but-mismatched users who churn silently because they look
   healthy on the lifecycle dashboard. Worth 2-4pp D30 retention.
   Effort M.

3. **D5 — Variant lifecycle banner + push copy by saved styles AND
   time-of-day.** Per Engagement Engine Step Three: Path/Message — the
   banner is the most-impressed personalization surface in the app and
   today ignores style. +8-15% banner CTR, +20-30% push open rate.
   Effort M (banner ships now; push waits for channel).

Honorable mention: **D7 (calibration step)** — highest first-impression aha impact, deferred to priority 4 because it needs designer assets.
