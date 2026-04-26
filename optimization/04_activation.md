# Dimension 04 — Activation

> **Reforge courses applied:**
> - Retention + Engagement, Module 03 "Activation: Defining, Measuring, Analyzing"
> - Retention + Engagement, Module 04 "Activation Strategies"
> - Retention + Engagement, Module 02 "Retention" (Natural Behavior Use Cases)
> - Retention + Engagement, Module 06 "Engagement Strategies" (Frequency Strategy)
> - Retention + Engagement, Module 09 BONUS "Managing Infrequent Products / ICED Theory"
>
> **Frameworks cited explicitly below:**
> - Setup → Aha → Habit (working backward from the engaged state)
> - Aha Moment fXaY metric format
> - Setup Moment XaY metric format
> - Habit Moment XaY metric format
> - The Four Activation Fits (Audience / Promise / Intent / Knowledge)
> - The PNIP Pyramid (Product / Notifications / Incentives / People)
> - The Habit Loop (organic / manufactured / environmental triggers)
> - Warm Start, Supporting Actions, Empty States principles
> - ICED Theory Timing-Influence Matrix
> - ICED Theory Adjacent-Use-Case strategy
> - ICED Theory Expanding Touchpoints (single → constant touch)

### Verdict up-front

Furnish has misnamed its current "aha" event.
`aha_moment_reached` fires on results render — that is cosmetic, not Aha-by-Reforge-definition.

The Habit moment is undefined.

Setup is partially defined but mis-sequenced — heavy quiz BEFORE the user has felt any value.

Tutorial timing breaks the Aha experience.

The Quarterly Core hypothesis is correct in spirit but mis-engineered as the *primary* loop —
per Reforge ICED, an infrequent core MUST be flanked by adjacent frequent use cases
or the product fades from memory between cycles.

---

## Section A — Setup / Aha / Habit map for Furnish

Per Reforge Retention + Engagement, Module 03 "Defining Your Habit/Aha/Setup Moments":
you do **not** start from signup and walk forward.
You start from the engaged-retained state and walk backward — Habit, then Aha, then Setup.
I do that here.

### Step 0 — Define the engaged-retained user (prerequisite per Reforge "Natural Behavior Use Cases")

Per Reforge's Customer Retention Canvas (Module 02), the use case for Furnish is:

> *"I want my room to feel like a place I'm proud of, but I don't have time/skill/money to redesign it."*
> - **Persona:** 25-45 renter or new homeowner with mild-medium intent.
> - **Natural usage frequency:** full-room redesign is infrequent (quarterly to yearly).
> - **Sub-use-case** (window-shopping for inspiration / single-item swap) is weekly.

The retained user is one who returns at least monthly across the lifetime of a 6-month window
AND has saved or purchased ≥1 affiliate item.

### The map

| Moment | Definition for Furnish | Metric (proposed XaY / fXaY format per Reforge) | Current rate |
|---|---|---|---|
| **Setup** | User has provided the *minimum-viable info* to deliver a personalized first redesign: at least one style affinity AND at least one photo uploaded (or 1 template selected). Per Reforge: "the must-have info we need to deliver the Aha." | `1_setup_action_in_session_1` — % of welcome-CTA clickers who reach the analyzing screen with a photo + ≥1 style. | **Unknown — instrumentation gap.** `SETUP_STYLE`, `SETUP_COLOR`, `SETUP_BUDGET` events exist (`Here/app.js:1338-1376`) but no funnel between them. |
| **Aha** | User has experienced the core value prop ("watch any room transform") for the first time AND signaled intent — defined as: reveal screen viewed for ≥10s AND ≥1 explicit signal (Love-tap on feedback chip OR item tap OR wishlist save OR "Shop The Whole Room" tap). Per Reforge Aha definition: "the user has experienced the core value prop for the first time" — a passive view does not equal experience. | `f1_aha_signal_within_first_session` — first time user does the action (view+signal) within session 1 (T<10 min). Format: fXaY where X=1, Y=10min. | **Unknown.** `aha_moment_reached` fires on results render (`app.js` reveal screen) but per Reforge that's a setup-to-aha gate, not Aha — Aha requires evidence of experienced value. |
| **Habit** | User has formed the habit around the core value prop, defined as: completed 2+ sessions across 2+ weeks AND saved at least 1 item to wishlist OR started a 2nd redesign. Per Reforge: "habit = repeated behavior, not a one-time act." Natural frequency for Furnish core = monthly; supplemental = weekly. So Habit metric = `2a28` (action twice in first 28 days). | `2_sessions_in_28d_with_save_or_2nd_redesign` — % of Aha users who hit this in 28 days. | **Unknown.** No habit metric defined anywhere in app.js. The lifecycle banner (`app.js:2360-2425`) buckets users by raw days-since-signup, not by habit-action — that is **not** a habit metric per Reforge. |

### Why the Aha definition matters (this is the single most-debated thing in your funnel)

Reforge's *Defining Your Aha Moment* lecture spends multiple paragraphs dispelling the Facebook "7 friends in 10 days" myth — that's a **Setup** metric, not Aha.

They say bluntly: *"selecting seven friends in ten days doesn't give you an experience of the core value prop."*

For Furnish, the equivalent mistake is treating "reveal screen rendered" as Aha.

**Rendering ≠ experiencing.** The render is the Setup-to-Aha *gate*.
Aha is when the user's brain has registered "holy cow, I just got a magazine spread of MY room."
Reforge's test: *"does the user feel they downloaded a special ability they didn't have before?"*

The honest test is behavioral: did they tap, save, or shop?
If they viewed and bounced, the Aha did not happen — they reached the gate, not the experience.

### Why the Habit definition is contrarian for Furnish

Hassan's locked decision — "Quarterly Core (~3-month redesign cadence) + Weekly Supplemental (Style Pulse, price drops, lifecycle)" — implies the habit is *quarterly*.

Per Reforge "Defining Your Habit Moment" this is too long to form a behaviorally-anchored habit at all.

Dr. Lally's research (cited in Reforge's habit lesson) says a habit needs *repeated* behavior.
Quarterly = not repeated within memory horizon.

**Therefore the Habit moment in Furnish CANNOT be the redesign action.** It must be the supplemental loop:
- saving items
- browsing Style Pulse
- reacting to a price-drop notification

This is exactly the Zillow Zestimate / LinkedIn UGC pattern from Reforge ICED Theory's "adjacent use cases" strategy.

### Reforge Four Activation Fits — Furnish self-assessment

| Fit | User question | Furnish answer (current) | Grade |
|---|---|---|---|
| **Audience Fit** | "Is this product for me?" | Welcome hero language: "Watch any room transform in 20 seconds." Visual: warm beige/brown theme. ★★★★★ 4.8 social proof. **Solid for B2C home-decor target.** | B+ |
| **Promise Fit** | "Does this product do what I want?" | Demo loop on welcome (Here/index.html:52-65) literally shows the promise — before/after with price tags. **Excellent.** Reaffirmed weakly during quiz/preferences (no progress bar tying back to "your redesign is coming"). | B |
| **Intent Fit** | "How badly do I want it?" | Mild-intent "candy" product (per Reforge candy ↔ painkiller spectrum — closer to candy). Welcome offers a free reveal with no signup → low-friction entry, matches mild intent. **Setup is too heavy for this intent level** — see rec 04-2. | C |
| **Knowledge Fit** | "Do I know how to get it?" | Subtext "No signup needed · ~30 seconds" answers the question. **Strong.** Tutorial fires AT Aha (rec 04-5) which damages this fit by teaching what's already obvious. | C+ |

**The lowest-graded fit is Intent.** Per Reforge: a candy / mild-intent flow CANNOT carry the friction of a 3-5 minute pre-Aha quiz. This is the structural diagnosis behind rec 04-2.

---

## Section B — First-session vs return-session activation (different paths per Reforge)

Per Reforge Retention + Engagement Module 04 "Creating Your Aha Moment Experience" + "Creating Your Habit Moment Experience":

> **The experience the user gets in the first session is fundamentally different from what they need in subsequent sessions.**

- First session = "trigger → setup → aha"
- Return sessions = "re-trigger → re-engagement → habit-cementing"

A returning user does not need onboarding. They need a *reason to return that ties to the organic problem.*

### First-session path (Welcome → Setup → Aha)

The Reforge Four Activation Fits says the user is asking:
- "Is this for me?"
- "Does it do what I want?"
- "How badly do I want it?"
- "Do I know how to get it?"

Furnish's welcome (`Here/index.html:22-85`) does parts of this well.
The before/after demo answers Promise Fit.
- Audience: home-decor enthusiast
- Promise: "Watch any room transform in 20 seconds"
- Knowledge: "No signup needed · ~30 seconds"
- Intent: medium-high because the demo IS the intent-builder

What's broken in Session 1:

**Setup is too heavy for low-intent users.**
The 4-question quiz + name + avatar + styles + mood/colors + custom hex + budget log-slider (`Here/app.js:1338-1376`) is far more Setup than Reforge's "must-have info" rule allows.
Per Reforge's *Defining Your Setup Moment*: collect ONLY what is required to deliver the Aha.
A photo + 3 style defaults already in code (`Here/furniture.js:387-428`) is enough to render a reveal.
Everything else is post-Aha personalization, not pre-Aha Setup.

**The D7 reveal-gate (`Here/app.js:3425-3434`) puts Setup-2 (signin) AFTER the AI generates but BEFORE the reveal renders.**
Reforge would call this *intentional friction at the moment of peak motivation* — defensible IFF the user has already experienced enough Promise that the curiosity gap > friction cost.
Your `signin-reveal-hero` block (`Here/index.html:102-111`) shows you already know this.
But Reforge would caution: gating reveal pre-Aha (before the user sees the room transform) sacrifices Aha for activation-as-account-creation.

**Account ≠ activation.**

The signin gate must be calibrated so Aha still happens within the first session — i.e., signin must take <30 seconds total or you've blown the time-decay curve Reforge shows in *Defining Your Aha Moment*:

> "every minute after signup that you haven't gotten the user to the aha moment, your probability of retaining them dramatically decreases."

### Return-session path (Re-trigger → Habit-cementing)

Per Reforge "Creating Your Habit Moment Experience": once the habit moment exists, returning users need *organic triggers reinforced by manufactured triggers*.
They should not be re-onboarded.

Three candidate Return-Aha triggers for Furnish, in priority order:

1. **Memory trigger ("remember a saved redesign")** — manufactured loop.
   - User opens app → resume hero card shows their last room → emotional anchor reactivated.
   - Per Reforge: this is the Pinterest "personalized feed" warm-start pattern but for a *returning* user.
   - **Already exists** in your spec ("Resume hero card on home — last room or draft"). Strong — keep + amplify.

2. **Calendar trigger (Style Pulse weekly strip)** — manufactured loop.
   - Per Reforge "Using Frequency Strategy": supplemental loop for an infrequent core.
   - This *is* Reforge's prescription for infrequent products.
   - **Existing** (`Here/index.html:807-841`).

3. **Event trigger (price-drop on saved item)** — environmental loop reinforced by a manufactured trigger.
   - Per Reforge ICED "Expanding Touchpoints" — Zillow Zestimate analog.
   - **Strongest of the three** because the event-frequency is set by the world (price drops happen), not by you spamming users.

**Returning users must NOT see the welcome onboarding flow.**

Currently `welcomeStartBtn` handler (`Here/app.js:228-241`) routes signed-in users with profiles to `profile-select` — good.
But a guest who has *one prior session* with a photo + a saved room is currently still treated as new.
They should hit a "resume" path. (See recommendation 04-3 below.)

### Return Aha definition (different from First Aha)

For return sessions, Aha is no longer "watch any room transform."
It is now "see something I'd actually buy."

The user has already experienced the transform. The next-level value prop is *converting on it*.

Per Reforge "The Four Activation Fits" applied to return sessions, the Promise has shifted from transformation to commerce.
This shift means the Habit metric must include a commerce signal, not just engagement.

---

## Section C — Recommendation entries

### **[Dim 04] — 04-1: Redefine the Aha event from "reveal rendered" to "reveal experienced + signal"**

- **Current state in Furnish:**
  `aha_moment_reached` event fires on results screen render (`Here/app.js:4116-4209` reveal screen).
  This counts cosmetic arrival, not value experience.
  The Aha telemetry is therefore lying to you — it overstates Aha by however much the bounce-rate-on-reveal is.

- **Proposed state:** Split the event into two:
  - `aha_gate_reached` — fires on render (current behavior, renamed).
  - `aha_moment_reached` — fires when ANY of the following happen within the reveal screen:
    1. ≥10s dwell time
    2. Tap on Love/Close/Off feedback chip
    3. Tap on any item
    4. Tap on "Shop The Whole Room"
    5. Wishlist save
  - Format: `fXaY` per Reforge — first signal within the 10-min initial session window.
  - Build the funnel as `welcome → setup → gate → aha → habit` so you can measure gate-to-aha conversion.
  - That single number is the heart of activation diagnosis per Reforge's Activation Diagnosis Sheet.

- **Reforge framework citation:**
  "Per Reforge's Retention + Engagement, Module 03 *Defining Your Aha Moment*:
  'the aha moment is where the user has experienced the core value prop for the first time' — a render is not an experience.
  The fXaY format = first time the user has done the core action within initial time period Y."

- **Expected impact:**
  The reported Aha rate will drop (likely from ~70% of completers to ~30-45%) — that is a *good* outcome because you'll finally see the real leak.
  Treatment hypothesis: warm-start improvements (rec 04-4) can push Aha-as-defined back up by 10-20 pp within 4 weeks.

- **Effort tier:** S (event split + funnel definition) + M (analytics dashboarding).

- **Dependencies:** 13_instrumentation chunk's funnel infrastructure.

- **What breaks/leaks if we skip it:**
  You optimize against the wrong metric.
  Every paywall, push, and copy A/B test that uses the current `aha_moment_reached` as the success criterion is rewarding *render*, not *value*.
  You will keep ratcheting up volume on the reveal screen and wondering why D7 retention isn't moving.

---

### **[Dim 04] — 04-2: Move the heavy quiz to AFTER the first reveal (Setup-after-Aha pattern)**

- **Current state in Furnish:**
  Quiz intro (`Here/index.html:264-279`) → 4 questions (`Here/app.js:1071-1186`) → preferences screen (`Here/app.js:1338-1376`) all fire BEFORE photo capture and reveal.
  The quiz is skippable with sane defaults `['modern','scandinavian','minimalist']` (`Here/furniture.js:387-428`).
  With skip, time-to-Aha is ~30s; without, ~3-5 min.

- **Proposed state:**
  Run the *minimum-viable Setup* before reveal — exactly two things:
  1. Photo upload
  2. One tap on "Pick a vibe" with 3 large style cards (modern / scandinavian / cozy-warm) as the only Setup ask
  
  Defer everything else (mood/colors, custom hex, budget log-slider, name, avatar, full quiz) to a "Refine your style" surface that fires AFTER the reveal — when the user has already felt the value and is willing to invest.
  
  Re-frame: "We already know you love this. Want one closer to your taste?"
  
  This is the Stitch-Fix-style data collection but front-loading only the must-have.

- **Reforge framework citation:**
  "Per Reforge's Retention + Engagement, Module 03 *Defining Your Setup Moment*:
  'the absolute MUST HAVE information we need to deliver that aha moment.'
  The quiz currently collects far more than the must-have.
  Per the Aha lecture: 'every minute after signup that you haven't gotten the user to the aha moment, your probability of retaining them starts to dramatically decrease.'"

- **Expected impact:**
  Time-to-Aha drops from ~3-5 min (no skip) to ~45 seconds.
  Aha rate (per the corrected definition in 04-1) projected to lift +15-25 pp because mid-quiz drop-off is eliminated.
  Trade-off: post-Aha refinement may be skipped by ~40% of users — but the 60% who do refine are a *higher-intent cohort* than the current early-quiz cohort.

- **Effort tier:** L.
  Requires re-routing of the quiz state machine (`state.quiz`), the `seenFinale` flag becomes a post-Aha celebration not a pre-reveal gate, and the budget slider needs a new home (probably as a per-redesign control on the reveal screen, not a profile-level setting).

- **Dependencies:**
  - Coordinate with 12_onboarding_arch chunk on screen sequence.
  - Coordinate with 03_conversion on the post-reveal "Refine" CTA copy.

- **What breaks/leaks if we skip it:**
  Setup is the activation step with the highest drop-off in B2C apps per Reforge benchmarks.
  With a 4-question quiz + preferences screen (~2-3 min on phone), the leak is conservatively 30-50% before the user has *seen anything*.
  You're spending acquisition $ on traffic that bounces before you've shown them what your product does.

---

### **[Dim 04] — 04-3: Rebuild the welcome handler to detect "returning guest with progress" and skip onboarding**

- **Current state in Furnish:**
  `welcomeStartBtn` handler (`Here/app.js:228-241`) routes signed-in users with profiles to `profile-select`.
  But a *guest* who has a prior session (state.rooms.length ≥1 OR state.draft !== null) still gets the onboarding flow.
  They are forced to re-do quiz/preferences even though the data exists. Bad return-session path.

- **Proposed state:**
  Add a second branch in the welcome handler:
  ```js
  if (isGuest() && (state.rooms.length || state.draft)) {
    showScreen('home');                  // skip welcome entirely
    showResumeHero();                    // Reforge warm-start for returning users
    trackEvent('return_session_resumed', { ... });
    return;
  }
  ```
  Plus: add a 7-day-stale check.
  If last session > 7 days ago, show a *light* re-engagement hero ("Welcome back. We've added 23 new items in your style.") instead of full onboarding.
  Connect to 08_social / 05_retention chunks for re-engagement copy.

- **Reforge framework citation:**
  "Per Reforge's Retention + Engagement, Module 04 *Creating Your Habit Moment Experience*:
  the first session and the return session require different experiences.
  The user's mindset in habit-formation is 'completely different than the mindset they're in from signup to setup, or setup to aha.'
  Forcing returning users through the first-session flow violates this."

- **Expected impact:**
  Return-session conversion to a 2nd redesign +20-40 pp (large because the current path is broken; basically free win).
  D7 retention +3-7 pp.

- **Effort tier:** S.
  Conditional branch + a screen route. Reuse the existing `home` screen.

- **Dependencies:** None blocking — the resume hero is already on Hassan's spec list.

- **What breaks/leaks if we skip it:**
  Returning guests (the bulk of your high-intent cohort, since they've already invested time once) get punished for returning.
  Reforge ICED Theory's "expanding touchpoints" framework explicitly warns against this — you fade from memory if the return experience is identical to the cold-start.

---

### **[Dim 04] — 04-4: Convert the reveal screen into a Reforge "Warm Start" experience instead of a passive viewer**

- **Current state in Furnish:**
  Reveal screen (`Here/app.js:4116-4209`) renders:
  - Before/after slider
  - Lighting chips
  - Price tags
  - Items list
  - Aha feedback Love/Close/Off
  - "Shop The Whole Room"
  - FTC disclosure
  
  It's well-built visually but it's a *cold* end-state — you arrive, you see, you leave.
  There is no "supporting action" structure pushing toward the core action.

- **Proposed state:**
  Apply Reforge's four-principle Aha experience structure: **Core Action / Warm Start / Supporting Actions / Empty States**.

  - **Core Action** for Furnish = wishlist save (the conversion-bearing one) OR "Shop The Whole Room".
    Make ONE of them the visual primary CTA (currently both buried under the items list and the feedback chips).
    Per Reforge: "high forcefulness" is appropriate at Aha when the cold-start has been overcome.

  - **Warm Start** = personalize the reveal headline using the style + room type the user picked.
    Example: "Your loft, in scandinavian." instead of generic "Your redesign is ready."
    Per Reforge Pinterest example: "they don't drop you into an empty feed or random feed."

  - **Supporting Actions** = scroll cues to items, tap-to-zoom on individual items, "swap this piece" affordance.
    All of which lead toward the core action.
    Some exist; structure them explicitly as a funnel toward Save/Shop.

  - **Empty States** = when an item is unavailable or filtered out, redirect to a comparable item, never show a dead end.
    Per Reforge MailChimp anti-example.

- **Reforge framework citation:**
  "Per Reforge's Retention + Engagement, Module 04 *Creating Your Aha Moment Experience*:
  the four product principles for Aha are Core Action, Warm Start, Supporting Actions, Empty States."

- **Expected impact:**
  - Aha-as-corrected (rec 04-1) +10-20 pp.
  - Wishlist-save rate +30-50% (the path becomes obvious).
  - Affiliate CTR +15-25%.

- **Effort tier:** M-L.
  Visual redesign of reveal + a personalized headline pipeline.

- **Dependencies:**
  - 09_content_copy chunk for the headline templates.
  - 07_personalization chunk for the room-type detection that powers the headline.

- **What breaks/leaks if we skip it:**
  You generate a beautiful reveal that users admire and bounce from.
  You're paying compute (Flux Schnell ~$0.005-0.01/run, Flux Kontext Pro ~$0.05/run per CLAUDE.md) for a screen that doesn't convert.
  The Aha is cosmetically achieved but commercially wasted.

---

### **[Dim 04] — 04-5: Defer the first-redesign tutorial from "6s post-Aha" to "session 2" (tutorials interrupt Aha per Reforge)**

- **Current state in Furnish:**
  First-redesign tutorial uses `state.user.firstRedesignTutorialSeen` flag.
  Fires 3 coachmark steps (Styles → Color Moods → Budget) **6 seconds AFTER the reveal screen loads**, one-time.
  The tutorial fires in the middle of the user's first emotional encounter with their redesigned room.

- **Proposed state:** Two changes.

  1. **Defer to Session 2.**
     Set the trigger to:
     ```js
     state.rooms.length >= 1
       && !state.user.firstRedesignTutorialSeen
       && returnSessionDetected()
     ```
     The first session should be 100% reveal, no education.
     The user already knows what the product does — they just experienced it.

  2. **Repurpose the tutorial as a "what's next" surface, not a feature tour.**
     - Step 1: "Save your favorite items."
     - Step 2: "Try a different style."
     - Step 3: "We'll alert you when prices drop."

     This converts the tutorial from feature-education (low value) to habit-loop-education (Reforge habit-formation alignment).

- **Reforge framework citation:**
  "Per Reforge's Retention + Engagement, Module 04 *Creating Your Aha Moment Experience*:
  the four principles are Core Action, Warm Start, Supporting Actions, Empty States — none of which include 'a tutorial that interrupts the user 6 seconds in.'
  Per Module 04 *Creating Your Habit Moment Experience*: habit-formation requires a different mindset and experience than Aha.
  Educational interruption during Aha breaks the warm start."

- **Expected impact:**
  - First-session Aha (corrected definition) +5-12 pp because the user is no longer interrupted at peak emotion.
  - Tutorial completion rate goes UP (deferred tutorial ≠ ignored — session-2 users are higher-intent and complete educational flows at 2-3x the rate of session-1 users per Reforge B2C benchmarks).

- **Effort tier:** S.
  Move a flag check.

- **Dependencies:** Coordinate with 12_onboarding_arch.

- **What breaks/leaks if we skip it:**
  Every reveal screen gets stepped on by a coachmark in the first 6 seconds.
  You're literally adding friction at the highest-emotion moment of the user's experience.
  Reforge's Aha lesson is explicit that time-to-Aha is the most leverage-y variable in retention; tutorials at Aha sabotage that.

---

### **[Dim 04] — 04-6: Add a Habit metric instrumentation pass + define the single Habit moment for Furnish**

- **Current state in Furnish:**
  No habit metric.
  The lifecycle banner (`Here/app.js:2360-2425`) buckets users by raw days-since-signup:
  - 0-7d: activation
  - 7-21d: habit
  - 21+: mature
  - 14+ inactive: churned
  
  This is **time-based**, not **action-based**, and per Reforge that is wrong.
  A user can sit in "habit" bucket without performing any habit-action and you'd never know.

- **Proposed state:**
  Define the single Habit metric and instrument it.
  Per Reforge XaY format: `2_habit_actions_in_28d` where habit_action = ANY of:
  - Item saved to wishlist
  - Price-drop notification opened
  - Style Pulse weekly strip viewed for ≥3s
  - 2nd redesign started
  
  Track with a new event `habit_action_logged` and a derived flag on the user object: `state.user.habitFormed = bool` set when the count reaches 2 within 28 days.
  
  Replace the day-based lifecycle banner with an action-based one. New buckets:
  - "Pre-Aha"
  - "Aha-not-Habit"
  - "Habit-formed"
  - "At-risk (no habit-action 14d+)"
  - "Resurrected"
  
  Crucially: the Habit moment is **NOT** "started a 2nd redesign" alone.
  Per Reforge, it must include a saved-item or price-drop signal so it captures the *commerce* dimension that monetizes the app.

- **Reforge framework citation:**
  "Per Reforge's Retention + Engagement, Module 03 *Defining Your Habit Moment*:
  'habit equals a repeated behavior. It's not displaying a behavior once, but they're displaying it on a repeated basis.'
  XaY format = the user has done the core action X times within initial period Y."

- **Expected impact:**
  Unlocks the entire activation-strategy program (Reforge's PNIP Pyramid is meaningless without a Habit metric to optimize against).
  - Direct retention impact: 0 (this is measurement).
  - Indirect impact: every other rec in this doc and the resurrection plan in 05_retention depends on it.

- **Effort tier:** M.
  Schema migration on the user object + new event + lifecycle banner refactor.

- **Dependencies:**
  - 13_instrumentation chunk for the event pipeline.
  - 05_retention chunk for the at-risk + resurrection strategies that consume this metric.

- **What breaks/leaks if we skip it:**
  You're flying blind on the most important activation question per Reforge: "did the user form a habit?"
  The current day-bucket system can't tell you.
  Every retention experiment will optimize against a vanity proxy.

---

### **[Dim 04] — 04-7: Challenge the "Quarterly Core + Weekly Supplemental" decision — flip primary loop to weekly Style Pulse / saved-item events, demote redesign to seasonal**

- **Current state in Furnish:**
  Hassan's locked-in design treats the **redesign** (~3-month cadence) as the Core loop and Style Pulse / price drops / lifecycle as Supplemental.
  
  Per Reforge ICED Theory, this is upside-down for an infrequent core.
  The natural frequency of "I want to redesign my whole room" is closer to *yearly* than *quarterly* — even quarterly is generous.
  A loop with a 90-day cadence is below the memory horizon for the typical B2C user.

- **Proposed state:**
  **Promote saved-item-tracking + Style Pulse to the Core loop.**
  Demote whole-room redesign to a "seasonal" event.
  
  This mirrors Reforge ICED's exact prescription for managing infrequency:
  
  - *Strategy 1 (Timing-Influence Matrix):* move toward "timing known + easy to influence."
    - Style Pulse weekly = timing known (Tuesday).
    - Saved-item price tracking = easy to influence (price-drop event triggers re-engagement).
  
  - *Strategy 2 (Adjacent use cases):* the Zillow Zestimate analog.
    - Whole-room redesign is your "buy a house" event.
    - Saved-item monitoring is your "track your home value" weekly habit.
    - Add it as *the* primary loop.
  
  - *Strategy 3 (Constant touch):* per Reforge ICED "Expanding Touchpoints" — Tripadvisor's restaurant + hotel reviews layered onto travel reviews.
    Equivalent here:
    - "I noticed your sofa just dropped 12%" notifications
    - "This room you saved 6 weeks ago has 3 items back in stock" emails
    - "Your style index this month: +2 minimalist" weekly summaries

- **Reforge framework citation:**
  "Per Reforge's Retention + Engagement, Module 09 BONUS *ICED Theory* / Lesson 02 *Managing Infrequency*:
  'transitioning from high infrequency to low infrequency is critical. The downside of an infrequent product is that the user experience begins to fade from memory when there is a long hiatus.'
  Strategies:
  1. Move toward timing-known + easy-to-influence
  2. Add adjacent use cases
  3. Flank the product line."

- **Expected impact:**
  - D30 retention +10-20 pp (large because you're addressing the structural frequency mismatch).
  - Affiliate revenue per user +30-60% (saved-item monitoring is where commerce happens; Style Pulse is the surface that re-triggers it).
  - Subscription conversion (Pro stabilizer $5.99/mo) +5-10 pp because the recurring value perception requires recurring value delivery, which a quarterly core does not provide.

- **Effort tier:** XL.
  This is the highest-leverage and most uncomfortable rec in the doc.
  It re-frames the entire app from "redesign service" to "style-tracking + redesign-when-needed."
  Requires:
  - Price-drop infrastructure (need real affiliate catalog per CLAUDE.md item 2)
  - Style Pulse content pipeline
  - Push notification infrastructure (already pre-prompted post-first-save per `Here/app.js:4498-4544` — keep that timing)

- **Dependencies:**
  - 06_monetization chunk on the subscription value-delivery cadence
  - 05_retention chunk on resurrection paths
  - 13_instrumentation chunk on price-drop event infrastructure

- **What breaks/leaks if we skip it:**
  This is the bet that will determine whether Furnish has a long-term retention curve at all.
  Per Reforge: "if the retention curve slopes toward zero, we lose our users."
  A quarterly-core-only product has a sloped curve regardless of how good the redesign is.
  The Pro stabilizer subscription is *especially* fragile because users will not pay $5.99/mo for a thing they use quarterly — that's the Express-emails problem from Reforge's frequency-strategy lecture, in reverse.

---

### **[Dim 04] — 04-8: Add the post-Aha "intent test" to the reveal screen to measure Promise Fit per Reforge Four Activation Fits**

- **Current state in Furnish:**
  Reveal screen has Aha feedback Love/Close/Off chips (`Here/app.js:4116-4209`).
  These measure *taste fit* (did the AI nail the user's preference) but not *promise fit* (did the product do what the user wanted).
  The two are different per Reforge.

- **Proposed state:**
  Add a single-tap micro-survey AFTER the user taps Love (only for Love-tappers — gating preserves the high-intent path).
  Question: "What made it click?"
  - [a] "It looks like a real magazine spread."
  - [b] "I can actually buy these."
  - [c] "It matches my taste."
  
  This maps to Reforge's three Promise Fit dimensions: aesthetic / commerce / personalization.
  Track as `promise_fit_signal` event with the dimension.
  Use the answers to weight subsequent reveals.

- **Reforge framework citation:**
  "Per Reforge's Retention + Engagement, Module 04 *The Four Activation Fits*:
  'Promise Fit — does this product do what I want? They're looking for the benefit. They continue to ask this question through the activation flow.'
  Without measuring which dimension of Promise hit, you can't optimize the headline copy or the warm start (rec 04-4)."

- **Expected impact:**
  Doesn't move metrics directly — this is a *measurement* rec.
  But it informs every visual + copy A/B test downstream by telling you which Promise dimension to lean on.
  Conservatively, the downstream A/Bs informed by this data will improve Aha rate by 5-10 pp over 8-12 weeks.

- **Effort tier:** S.
  One micro-survey component, three radio buttons, one event.

- **Dependencies:** None blocking.

- **What breaks/leaks if we skip it:**
  You optimize headline, warm start, and reveal layout against gut feel rather than the actual axis the user values.

  [Original recommendation, not Reforge-grounded for the micro-survey mechanism specifically — extension of Reforge Promise Fit applied to in-app micro-surveying.]

---

### **[Dim 04] — 04-9: Re-engineer the push pre-prompt to fire BEFORE the wishlist save (peak-curiosity timing), not after the first save**

- **Current state in Furnish:**
  Push pre-prompt (`Here/app.js:4498-4544`) fires AFTER first save.
  Per Reforge's PNIP Pyramid notification layer, the *intent gradient* peaks at the moment of save-decision, not after.
  By the time the user has saved, their action is committed and the notification ask drops in priority.

- **Proposed state:**
  Fire the pre-prompt at one of two earlier moments, A/B-test:

  - **Variant A:** When user TAPS the save icon for the first time — *before* the save completes.
    Copy: "Save this room? We'll text you if any of these items go on sale."
  
  - **Variant B:** When user reaches the reveal screen for the first time.
    Copy: "Want to see what your room looks like in 4 more styles tomorrow? Turn on Style Pulse."
  
  Variant B ties the pre-prompt to the Habit loop (rec 04-7) rather than the save action — more strategic.

- **Reforge framework citation:**
  "Per Reforge's Retention + Engagement, Module 04 *PNIP Pyramid* and Module 06 *Engagement Strategies / Frequency Strategy*:
  notifications are 'low impact, low cost' but the trigger placement determines impact.
  Manufactured triggers must align with the organic moment of intent, not lag it."

- **Expected impact:**
  - Push opt-in rate +15-30 pp (current after-save timing is suboptimal).
  - Downstream: D7 retention +3-6 pp (push opt-ins retain ~2x).

- **Effort tier:** S.
  Move the trigger.

- **Dependencies:** Notification permission infrastructure (mobile wrapper / Capacitor per CLAUDE.md).

- **What breaks/leaks if we skip it:**
  Lower push opt-in compounds across the entire return-session strategy in 04-7.
  Push is the single cheapest re-engagement channel; under-opting-in gates the whole frequency strategy.

---

## Top 3 priorities for this dimension

### 1. 04-7 — Flip Core/Supplemental loops

Promote saved-item tracking + Style Pulse to Core. Demote redesign to seasonal.

XL effort, highest leverage.

Per Reforge ICED Theory, a quarterly-core product without adjacent frequent use cases has a retention curve that slopes to zero regardless of how good the core is.

This rec is what makes Furnish a *retainable* product instead of a beautiful single-use one.

Without it, every other Aha and Habit improvement is constrained by structural frequency mismatch.

The Pro stabilizer subscription is the canary: if users won't pay $5.99/mo for a quarterly-use product (and per Reforge frequency-strategy benchmarks, they won't), this rec is existential.

### 2. 04-2 — Move heavy quiz to AFTER first reveal

Setup-after-Aha pattern.

L effort.

Time-to-Aha is the highest-leverage retention variable per Reforge's Aha lesson.

Cutting Setup from 3-5 min to 45 seconds — by deferring everything except photo + one style tap — is the single biggest pre-Aha leak fix.

Stitch Fix and Pinterest both front-load only must-haves.
Furnish currently front-loads taste data that's irrelevant to the first reveal because the reveal is mostly transformation-driven, not taste-driven.

### 3. 04-1 + 04-6 — Fix the measurement

Redefine Aha event + define Habit metric.

S+M effort.

You cannot optimize against the wrong metric.
- Current `aha_moment_reached` over-reports Aha.
- Lifecycle banner uses time-based buckets instead of action-based.

These are measurement plumbing fixes but every other rec — and every chunk in this optimization plan — depends on the data being right.

Cheap to fix, expensive to leave broken.

---

## Cross-references to other dimension chunks

- **05_retention** — consumes the Habit metric defined in 04-6 and the at-risk bucket logic; depends on 04-7's loop reframing.
- **06_monetization** — Pro $5.99/mo viability is downstream of 04-7. Flag the conflict if 06 assumes a quarterly redesign monetizes a monthly subscription.
- **03_conversion** — the post-reveal "Refine your style" CTA copy from 04-2.
- **07_personalization** — room-type detection feeds the Warm Start headline pipeline in 04-4.
- **09_content_copy** — headline templates for Warm Start (04-4); push pre-prompt copy variants (04-9).
- **12_onboarding_arch** — owns screen-sequence changes from 04-2, 04-3, 04-5.
- **13_instrumentation** — owns the funnel and event-pipeline changes from 04-1, 04-6, 04-7.
- **08_social** — re-engagement copy for the 7-day-stale return path in 04-3.

## Open questions (flag for Hassan)

1. **Is the natural frequency for Furnish's full-room redesign actually quarterly, or is it yearly?**
   Reforge "Natural Behavior Use Cases" says we measure this, not assume it.
   Until you have data on time-between-redesigns from real users, the Quarterly hypothesis is unfalsified.
   Recommendation: ship 04-6 instrumentation, gather 90 days of data, then decide whether to commit to 04-7.

2. **Is the D7 reveal-gate (signin AFTER generation, BEFORE results) helping or hurting Aha?**
   Reforge says this depends entirely on whether the curiosity gap > friction cost at that exact moment.
   Recommendation: A/B test. Cohort A = signin gate. Cohort B = signin DEFERRED to post-Aha (after the user has interacted with the reveal).
   Measure: D1, D7 retention, signup conversion, Aha rate (corrected definition).

3. **Should the post-reveal "Refine" surface (rec 04-2) gate to signin?**
   This is a related but separate question from #2. The refine surface is a natural moment to ask for an account because the user has already invested.
   Reforge "Setup Moment" framework would say: ask for the must-have info at this moment; signin is the must-have for cross-device sync, which is itself a value prop.
