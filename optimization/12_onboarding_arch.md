# Dimension 12 — Onboarding Flow Architecture

**Author note (to Hassan):** This chunk is grounded almost entirely in Reforge's
*Retention + Engagement* course — specifically the **Setup Moment** lessons
(`03. Activation Defining, Measuring, And Analyzing / 04. Defining Your Setup
Moment` and `04. Activation Strategies / 06. Creating Your Setup Moment
Experience`), the **Aha Moment** lesson (`04. Activation Strategies / 05.
Creating Your Aha Moment Experience`), and the **Psych Framework** end-to-end
evaluation (`07. Evaluating Your Activation Experience End To End`). Where I
push past Reforge into general knowledge I flag it. Where I diverge from
Hassan's locked decisions I flag the conflict and recommend.

**The single most load-bearing principle in this dimension:** Per Reforge's
`04. Defining Your Setup Moment`, "the setup action MUST be different from the
core action" — and every piece of setup data must "give the user a high
probability at experiencing the value prop for the first time." Translation
for Furnish: every quiz/preferences input must visibly pay off in the redesign.
That principle is the cut-rule for question additions and the audit-rule for
existing ones.

**Furnish's setup chain in Reforge terms:**

| Reforge stage | Furnish moment | XaY metric (proposed) |
|---|---|---|
| Signup | Welcome + "Redesign My Room →" tap | n/a (guest) |
| Setup Moment | Quiz answered + photo uploaded + room type known | `1 redesign-input-set within 1 session` |
| Aha Moment | First reveal of personalized AI redesign with shoppable items visible | `1 reveal within 1 session` (after D7 signin) |
| Habit Moment | User returns and reshuffles or designs a 2nd room | `2r28d` (2 rooms or reshuffles in 28 days) |

The setup moment is the WHOLE pre-reveal flow: welcome → quiz intro → quiz Q1-Q4
→ preferences → capture → analyzing. That's seven gates with multiple inputs.
Per Reforge's `06. Creating Your Setup Moment Experience` ("Four Inputs Into
Setup Experience"), the question to interrogate every input on is: *"Is this
a MUST HAVE to deliver the aha moment?"*

11 entries in Section E, ~85% Reforge-cited.

---

## Section A — Question count + ordering audit

Hassan's locked decision is **4 questions, current order**. I'll honor that
default but force it through the Reforge audit anyway, because "locked" doesn't
mean "vindicated." If the audit produces a strong contrary case, I'll surface
it; if it produces a confirming case, I'll cite the framework that confirms.

### Q1 — "Which space feels most like home?" (4 photo options)

- **Job it does:** Captures broad style-cluster signal. Each option maps to
  3-4 styles (`furniture.js:392-395`). User picks "Airy Loft" → scores
  modern/minimalist/contemporary/scandinavian.
- **What redesign output it influences:** This is the BIG vote. Q1's scores
  flow into `state.quiz.scores` and the top-3 styles become `profile.styles`,
  which is the primary input to redesign generation.
- **Cognitive load:** LOW. Photo-pick is instant — no reading required, vibes
  carry the decision. Per Reforge `Psych Framework` (`07. Evaluating Your
  Activation Experience End To End`, "Types of Negative Psych"), photo picks
  are minimum-viable cognitive friction — they don't even rise to a real
  decision because the user is matching feeling, not reasoning.
- **Skip rate:** UNKNOWN — Furnish does not currently track per-question skip
  events distinctly from "skip whole quiz" via `skipQuizBtn`. **Instrumentation
  gap, log it.** (See E5.)
- **Verdict:** **KEEP, KEEP FIRST.** This is the perfect Q1 per Reforge's
  rule that "easier questions first build commitment-momentum" — vibes-first,
  low-cognitive, high-data-yield. Q1 doing the heaviest lifting is correct
  because Q1 has the highest psych and lowest abandon risk.

### Q2 — "Which palette pulls you in?" (4 color-pair swatches)

- **Job it does:** Refines style cluster (palettes overlap with styles) AND
  seeds `profile.colors` indirectly (no direct write today, but the data is
  in `state.quiz.scores` and the swatches' hex values are present in
  `furniture.js:402-405`).
- **What redesign output it influences:** Style refinement. Mostly redundant
  with Q1, but disambiguates close cases (e.g. "Airy Loft" splits across
  modern vs scandinavian — Q2 tiebreaker via Oak & Linen vs White + Black).
- **Cognitive load:** MEDIUM. Color is more abstract than a room photo —
  some users will not be able to translate a swatch to a feeling. Reforge's
  `Psych Framework` distinguishes "physical" friction (tap something) from
  "cognitive" friction (figure out what it means). Q2's cognitive friction
  is moderate because pairs of colors are abstract; an actual room with
  those colors would be lower-friction.
- **Skip rate:** UNKNOWN.
- **Verdict:** **KEEP, but consider re-shooting.** The job is right; the
  visual is too abstract. **See Recommendation E2 — show palette IN a room
  context** (4 small room thumbs each tinted to that palette) so it lands
  as "rooms in this color" not "two squares of paint." This is a CONFIRM
  on Hassan's structure, with a refinement on the asset.

### Q3 — "Your dream material is…" (4 material photos)

- **Job it does:** Material affinity. Solid Oak → scandinavian/farmhouse,
  Steel & Glass → industrial/modern, etc. Influences the materials of
  furniture pieces in the redesign, in theory.
- **What redesign output it influences:** Per `furniture.js:412-415`, this
  also feeds `profile.styles` — there's no separate `profile.materials`
  field. So **Q3 is doing the same job as Q1 with different visual cues.**
  This is the smoking gun.
- **Cognitive load:** LOW-MEDIUM. Materials are visual but more abstract
  than rooms.
- **Skip rate:** UNKNOWN.
- **Verdict:** **CUT or REPURPOSE.** Per Reforge's setup-moment cut rule
  ("must-have to deliver aha"), Q3 is currently NOT must-have because it
  outputs into the same field Q1 outputs into. The user does NOT see "your
  material was Solid Oak" reflected in the redesign as a distinct dimension
  — they see styles. **This is the question that fails the Reforge audit
  most clearly.** Either repurpose Q3 to capture room TYPE (which IS
  must-have and is currently captured later on capture screen as a chip
  grid), or drop it. Recommend repurpose. Hassan locked "4 questions" —
  honoring that by re-skinning Q3 as room type, not by deleting Q3. (See
  Recommendation E1.)

### Q4 — "How much decoration do you love?" (4 wall-density icons)

- **Job it does:** Density / decoration tolerance.
- **What redesign output it influences:** Maps to styles
  (`furniture.js:421-426`) — Plain → minimalist/japanese-zen/scandinavian/
  contemporary, Fill The Wall Up → eclectic/bohemian/art-deco/traditional.
  AGAIN this is feeding the same `profile.styles` field.
- **Cognitive load:** MEDIUM-HIGH. Of the four, Q4 is the most cognitively
  loaded because the icons (`wall-plain` etc) are abstract SVGs. Per Scott
  Belsky's "Crafting the First Mile" cited in Reforge's `Psych Framework`
  (the Behance "realms"/"circles" example), unfamiliar visuals consume
  cognitive fuel. Q4's icons risk the same trap.
- **Verdict:** **KEEP, last position is correct.** Per Reforge "ask easier
  questions first to build commitment-momentum" — Q4 being the hardest
  question last is intentional foot-in-the-door. By question 4 the user has
  invested 30+ seconds, sunk-cost is real, drop-off resistance is highest.
  Order is right.

### Candidate question additions — ranked by value-per-friction

I rate each on **"must-have to deliver aha?"** (Reforge cut rule), Friction
(1-10 cognitive cost), Output Visibility (does the user see this reflected
in the redesign? Reforge's "earn the right to ask" principle), and Verdict.

| Candidate | Must-have? | Friction | Output visibility | Verdict |
|---|---|---|---|---|
| Room type (currently on capture screen) | YES — redesign cannot run without it | 2 (chip grid, photo-supported) | HIGH (user sees "living room" furniture vs "bedroom") | **PROMOTE — replace Q3** |
| Room dimensions (currently `12'×14'` placeholder) | NO for v1 redesign quality; YES for budget realism | 6 (numeric, requires real-world reference) | LOW (user doesn't perceive scale in 2D image) | **CUT — defer to results-screen** |
| Existing pieces to keep | NO at quiz stage; YES later | 5 (requires looking at room) | HIGH (visible in redesign) | **CUT from quiz — keep as toggle on results, current state is correct** |
| Current pain ("what bothers you?") | NO — informational, not directive | 7 (open-text or limited-options-that-rarely-fit) | LOW (hard to translate "feels cluttered" to redesign) | **CUT — solve via existing wall-density Q4** |
| Aspiration / goal sentence | NO | 8 (open text on mobile) | LOW (cannot translate freeform text to specific style scores) | **CUT** |
| Time to redesign (today/weekend/months) | NO for redesign output; YES for product strategy | 3 | NONE in redesign | **CUT — capture post-aha if at all** |
| Budget (currently slider on prefs) | YES at some point; NO at quiz step | 5 (numeric anchoring is hard) | HIGH (user sees prices match) | **KEEP on preferences screen, do NOT promote to quiz** |

### Definitive Recommendation: 4 questions, one re-skin

Honoring Hassan's "4 questions locked" and citing Reforge's setup-moment
cut rule, the recommended set is:

1. **Q1 — Style cluster (vibes photo).** Keep.
2. **Q2 — Palette (re-shot in room context, see E2).** Keep + refine.
3. **Q3 — Room type ("What room are we redesigning?")** — **REPLACE the
   current "dream material" question.** Room type is must-have for redesign,
   currently captured at capture screen which means the quiz has been
   delivering data Furnish doesn't strictly need while postponing data it
   does. Per Reforge's `06. Creating Your Setup Moment Experience` — every
   setup ask must enable aha. Material doesn't enable aha; room type does.
4. **Q4 — Wall density (decoration appetite).** Keep, position last.

This is the tight 4-question quiz the Reforge audit produces. It is a
redirect on the existing Q3, not a count change. Hassan's lock is honored.

---

## Section B — Skip logic + defaults strategy

### Audit of the current skip system

Three skip mechanisms exist in `app.js:1071-1186`:

1. **Quiz intro `Skip — use defaults` button** (`#skipQuizBtn`, line 1083)
   — skips the entire quiz, fills `profile.styles =
   ['modern','scandinavian','minimalist']`, jumps straight to capture.
2. **Per-question `None of these — skip` button** (`#quizNoneBtn`, line 1107)
   — pushes `-1` to `state.quiz.answers`, advances step without scoring.
3. **Back button** (`#quizBackBtn`, line 1098) — back to previous step or
   intro.

### Audit point 1: "skip — use defaults" button on quiz intro

Per Reforge's `Psych Framework` order-of-operations principle (`07.
Evaluating Your Activation Experience End To End`, Mistake #3) — "is there
a different order that gets them to a bigger win quicker?" — offering Skip
prominently right at the quiz intro is **front-loading the exit option
before any commitment has been built**. Reforge's `04. Activation Strategies
/ 06. Creating Your Setup Moment Experience` is explicit: "Typically when
we're thinking about the setup experience, we are focused on strategies in
our product layers that lie on the **forceful end** of the spectrum… we want
to lean toward customized product experiences to collect a very specific
piece of information." Furnish is on the forceless end here.

The current quiz-intro Skip button (`index.html:275`, "Skip — use defaults",
`btn-ghost`) is below the primary "Start" button visually but is still
present at the moment of zero psych investment. That violates Reforge's
order-of-operations rule.

**Verdict:** Skip should still be POSSIBLE (Hassan's audience-fit-unknown
guests need an exit), but it should be **less prominent than Continue**.
Specifically: replace the dual-button intro with a single "Start →" primary
CTA, and demote Skip to a small text link below ("Skip and use popular
styles · 30 seconds saved"). This is consistent with Reforge's general
guidance that Skip should not be louder than Continue. (Recommendation E3.)

### Audit point 2: per-question Skip ("None of these")

This is **good Reforge practice**. Per the Setup Moment lesson, forcing a
selection on a question where none of the options fit creates a
fit-misalignment psych penalty. Per Reforge `07. Evaluating Your Activation
Experience End To End`, "Fit Mis-Alignment" is a category of negative psych
("Elements that mis-align with Audience Fit, Promise Fit, or Intent Fit").
Forcing a user to pick "Brick & Brass" when they hate every option is a
fit-misalignment they will register and resent.

Current implementation pushes `-1` to answers and skips scoring (line
1109-1112). **Confirmed correct.** Verify in instrumentation that "None"
selections are tracked separately from valid answers (E5).

### Audit point 3: skip-default chain

`['modern','scandinavian','minimalist']` — Hassan's choice, "the three
most-popular styles."

**Audit:** All three are minimalist-aligned. There is NO maximalist style
in the default. A user who skipped the quiz and is actually a
bohemian/eclectic will receive a redesign that is the LEAST aligned to
their actual taste. Per Reforge's `04. Activation Strategies / 05.
Creating Your Aha Moment Experience` ("Principle Two: Warm Start") — "a
warm start is a personalized experience that helps to answer those four
fit questions." A minimalist default for a maximalist user is a COLD
start dressed as a warm one — the user gets a confidently-wrong redesign
and concludes the product doesn't get them.

**Recommendation:** Default to the **mode** of all answered users so far
(track on the server) OR widen the default to span the spectrum:
`['modern', 'scandinavian', 'transitional']` (transitional is the
"middle-of-the-road" style that lands closer to median taste than
minimalist). Better yet — **show the user the 3 default styles up front
on the skip-confirmation moment and let them deselect any that are a
hard "no."** This converts skip from a blind-default to a 5-second taste
filter. (Recommendation E4.)

### Skip policy synthesis (recommended)

| Granularity | Allowed? | Visibility |
|---|---|---|
| Skip whole quiz from intro | YES | LOW (text link, not button) |
| Per-question "None of these" | YES | MEDIUM (visible but secondary) |
| Per-question Back | YES | HIGH (always visible) |
| Mid-quiz "exit to capture" | NO | n/a — must finish or skip-all |

The "no per-section skip" decision is deliberate: there are no sections.
Adding sectioned skip would imply quiz structure the user has not been
shown, increasing cognitive friction.

---

## Section C — Progressive disclosure plan

Reforge's `04. Activation Strategies / 05. Creating Your Aha Moment
Experience` (Principle Two: Warm Start) frames progressive disclosure as
"a personalized experience that helps to answer those four fit questions"
— so what shows when is determined by **what fit-answer the user needs at
that moment**, not by what info the product wants to collect.

**Welcome screen** — minimal copy, 1 CTA.
- Currently: hero image + tagline + Redesign My Room CTA + "No signup
  needed · ~30 seconds" + 4.8 stars + "12,400+ rooms designed."
- Per Reforge `06. Creating Your Setup Moment Experience` (PNIP product
  layer at "Show + Tell" range with low forcefulness) and the four fits
  (Audience/Promise), this welcome density is in-spec — it's answering
  "is this for me?" + "does it deliver?" + "is it worth my time?" all
  visible simultaneously. **Confirmed correct.** No change.

**Quiz intro** — single screen with badge + headline + sub + 1 CTA.
- Currently: "4 questions · ~30 seconds" + "Let's Match You to a Look" +
  sub + Start + Skip. Two CTAs.
- Per Section B audit, demote Skip. **Single primary CTA with skip-as-link.**

**Quiz questions** — 1 question per screen, no skip-by-default visible.
- Currently: 1 question per screen ✓, progress bar ✓, "None of these —
  skip" visible at all times.
- Per Reforge guidance on Setup phase forcefulness, "None of these" SHOULD
  be visible (fit-misalignment escape valve) but it should be visually
  smaller than the question options and the implicit Continue (which is
  the option-tap). Audit `quiz-none-btn` styling for visual weight; if it
  competes with the option cards, demote it. (Mostly stays.)

**Preferences screen** — currently: name + photo + styles + colors +
custom-color + budget + Save. **All visible at once.**
- Per Reforge's `Psych Framework` Mistake #1 ("Constant Balance Of Ask →
  Reward → Ask"), preferences-as-flat-form is a wall of asks with no
  reward in between. The user has just spent psych on the quiz; opening
  prefs to a 6-section form is a psych cliff.
- **Argue for collapsing.** Show by default: name (already filled by
  quiz routing) + styles (already populated by quiz) + Save & Continue.
  Collapse colors, custom colors, budget behind "More options · advanced"
  details element. The user's psych is at "I just answered 4 questions,
  let's see the redesign," not "let me also configure 5 more things."
  Per Reforge — front-load the value (the redesign), defer the optional
  knobs.
- **Counter-argument:** The user might WANT the budget control because
  budget is a primary buying-intent variable. Reforge's response (`06.
  Creating Your Setup Moment Experience` checklist): if budget is must-
  have for aha, it stays visible; if it's must-have for shopping (post-
  aha), defer.
- For Furnish, **budget is must-have for AHA** because the redesign
  filters items by price-point and the user judges "do these look
  affordable" at reveal time. So budget stays visible. Custom hex color
  stays collapsed (advanced). (Recommendation E6.)

**Capture screen** — simple. Currently: photo frame + take-photo + upload
+ inline room-type chip grid + Design My Room CTA.
- Already minimized. Inline room type was added in a recent batch
  (`index.html:607-609`). **Confirmed correct.** If Section A's
  recommendation lands (Q3 → room type in quiz), then the room-type
  chip grid here BECOMES redundant and should be removed from capture.
  This is a follow-on diff per E1.

**Reveal** — covered in Dimension 11.

**Tutorial** — 3 coachmark steps post first reveal, fires 6s after results
load.
- Per Reforge's `04. Activation Strategies / 05. Creating Your Aha Moment
  Experience` — "We have to be careful about using highly forceful
  experiences in the aha moments because we're trying to train them on
  a behavior we want them to take." A coachmark interrupting the user
  6s after their AI redesign reveal is the LITERAL definition of
  interrupting aha. The user is in maximum positive-psych — Reforge's
  +25 spike on the activation-flow chart (`07. Evaluating Your
  Activation Experience End To End`, "Evaluating The Psych Of Our
  Activation Flow"). 6s is JUST when the user is starting to explore
  pieces and feel ownership.
- **Recommendation:** Defer the tutorial to **session 2** OR fire it on
  RETURN to home, NOT on the reveal screen. (Recommendation E7.) This
  also applies to Hassan's locked decision "Tutorial fires 6s post-reveal
  (not pre-reveal)" — the lock is about pre-vs-post-reveal, but Reforge
  is more specific: post-aha during euphoria is also wrong; defer to
  next session entirely.

---

## Section D — Commitment vs exit map

Reforge teaches in `07. Evaluating Your Activation Experience End To End`:
"friction calibrated to value-just-experienced." Here is the full audit
moment-by-moment with friction levels (Hassan's table) and a Reforge-
grounded verdict on each.

| Moment | Push commitment? | Allow exit? | Friction (1-10) | Reforge verdict |
|---|---|---|---|---|
| **Welcome** | NO (CTA invites in) | YES | 1 | CORRECT. Welcome should be net-positive psych — Reforge `Psych Framework` says signup-stage psych is partly fueled by Audience Fit alignment in copy. 1 is right. |
| **Quiz intro** | NO (Skip is offered) | YES | 1 | TOO LOW. Currently friction is 1 because Skip is button-prominent. Should be 2 — Skip demoted to link. |
| **Quiz Q1-Q4** | LIGHT (back/next/skip) | YES | 2 | CORRECT for Q1-Q3, slightly under for Q4 (which is the hardest cognitively and should resist exit slightly more — keep "None of these" but consider Continue-only on Q4 since the user has already invested 75% of the quiz). |
| **Preferences** | LIGHT (Save & Continue) | YES (back to quiz) | 3 | CORRECT IF PROGRESSIVELY DISCLOSED. Currently 5+ because of full form wall — too much friction for the zero value just delivered (no aha yet). |
| **Capture** | MEDIUM (Analyze CTA) | YES (back to prefs) | 4 | CORRECT. Capture is the highest-friction setup ask (real photo from real room is a non-trivial physical-world task) — Reforge says high friction here is justified ONLY because the next step (analyzing → reveal) is the highest-value moment. The energy-effort balance works. |
| **Analyzing** | HIGH (no exit visible during loading) | NO | 7 | CORRECT. Reforge's `Psych Framework` chart shows the steepest psych climb during the wait between setup-complete and aha — anticipation is positive psych. Hiding exit here is correct. **However**, no progress bar or estimate during analyzing is a missed psych boost — see Dimension 06's "loading-as-positive-psych" recommendations. |
| **D7 signin gate** | HIGH (this is the commitment moment) | YES (X close, sign-in-as-guest) | 8 | CORRECT. This is the sunk-cost moment — Reforge's `Psych Framework` "+25" spike at aha-adjacent. The user has spent ~120 seconds and has a redesign WAITING. Per the framework's order-of-operations principle: "Reorder operations to deliver more quick wins and higher psych moments faster, before asking for additional things." Hassan's D7 is the textbook execution. |
| **Reveal** | HIGHEST (sunk cost + value seen) | LIGHT (close = lose redesign) | 9 | CORRECT. This is aha. The user can leave but loses the redesign — psych penalty for exiting is high. |

### Where the friction calibration is OFF

- **Quiz intro friction = 1** when it should be **2**. Skip is too easy.
- **Preferences friction = 5+** when it should be **3**. Wall-of-form
  pre-aha. Progressive disclosure fixes this.
- **Q4 friction = 2** when it could be **3**. By Q4, sunk cost is real;
  consider removing "None of these" on Q4 only (or making it require a
  confirm tap).

### Where the friction calibration is RIGHT

- **Capture, Analyzing, D7, Reveal.** All correctly calibrated. The
  friction monotonically increases as value-just-delivered increases —
  exactly Reforge's prescription.

---

## Section E — Recommendations (≥6)

---

### E1 — Replace Q3 ("dream material") with Q3 ("which room are we redesigning?")

- **Current state in Furnish:** `furniture.js:408-417` — Q3 is "Your dream
  material is…" with options Solid Oak / Polished Walnut / Steel & Glass /
  Woven Rattan, all of which feed `profile.styles` redundantly with Q1.
  Room type is collected later on capture screen (`index.html:607-609`,
  inline `roomTypeGrid`).
- **Proposed state:** Replace Q3 with photo-pick "Which room are we
  redesigning?" — 4 photo options: Living room / Bedroom / Kitchen /
  Office (or matching whatever's in `ROOM_TYPES`). Selection writes to
  `state.draft.roomType` AND `profile.preferredRoomType` so redesign
  generation can pick room-appropriate furniture. Remove the inline
  `rt-grid` from capture (`index.html:608-609`) since it's now collected
  earlier. `furniture.js` Q3 entry is rewritten; `app.js:1154-1167`
  selection handler stays (it's generic).
- **Reforge framework citation:** Per Reforge's `04. Activation Strategies
  / 06. Creating Your Setup Moment Experience` ("Four Inputs Into Setup
  Experience" + "Three Types Of Must Haves"), every setup ask must enable
  the aha moment. Room type IS must-have for the AI redesign (the model
  needs to know whether to suggest sofas vs beds vs desks); material is
  NOT must-have (it just refines style scoring already covered by Q1).
  Per Reforge's `04. Defining Your Setup Moment` ("the setup action must
  be different from the core action"), every setup question should output
  a distinct field — Q3-as-material outputs into the same field as Q1, so
  it's not actually doing different work.
- **Expected impact:** +3-7pp on `quiz_complete → analyze_complete` because
  room type is collected earlier with vibes-pick UX (lower friction than
  chip grid). Also reduces the perceived complexity of the capture screen.
- **Effort tier:** S — `furniture.js` Q3 rewrite (4 lines), `app.js`
  routing tweak to capture step (skip the room-type chip grid if already
  set), HTML cleanup of `rt-grid` on capture.
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** Quiz keeps spending one of its 4
  precious questions on a redundant style refinement while the actual
  must-have (room type) lives on a later screen — wasted setup-budget per
  Reforge's "earn the right to ask" principle.

---

### E2 — Re-shoot Q2 palette options as room thumbs, not paint swatches

- **Current state in Furnish:** `furniture.js:401-406` — Q2 renders 4
  color-pair swatches (e.g. `colors:['#C8985A','#EFE3CD']` — Oak &
  Linen). The render in `app.js:1132-1133` just paints two colored
  rectangles per option.
- **Proposed state:** Replace each swatch pair with a **small room
  thumbnail** that exemplifies that palette in context. Same metadata
  (the palette hex pair stays as fallback for the result-screen palette
  swatches), but the visual is a real room photo tinted to that palette.
  Same 4 options (Oak & Linen / Jewel & Brass / White + Black /
  Terracotta), same scoring.
- **Reforge framework citation:** Per Reforge's `Psych Framework` (`07.
  Evaluating Your Activation Experience End To End`, "Types of Negative
  Psych — Cognitive"), abstract visuals (paint swatches) require the
  user to mentally translate to "what does that look like in my space."
  That's cognitive fuel consumed for no value-add. Showing the palette
  IN context (a small room) eliminates the translation step. Belsky's
  Behance "realms / circles" example in the same Reforge lesson is the
  precise antecedent — abstract labels lost users; concrete labels won.
- **Expected impact:** +2-5pp on Q2 confident-selection rate (lower
  cognitive friction). Also: more accurate scoring because users can
  actually evaluate the option, vs guessing.
- **Effort tier:** M — requires 4 new assets at `assets/quiz/q2/`. JS
  changes are minimal (swap `qoc-palette` render path to `qoc-photo`
  per option in `app.js:1131-1140`).
- **Dependencies:** Asset production (4 photos, ~1 hour each).
- **What breaks/leaks if we skip it:** Q2 continues to underperform
  Q1's signal quality — the user's "palette" answer is noisier than
  their "vibes" answer because the visual is abstract.

---

### E3 — Demote quiz-intro "Skip" from button to text link, single primary CTA

- **Current state in Furnish:** `index.html:273-276` — the quiz intro has
  TWO buttons: Start (`btn btn-primary`) and Skip (`btn btn-ghost`). They
  appear side-by-side as visually balanced choices.
- **Proposed state:** Single primary CTA "Start →" centered. Below it, a
  small text link: "Skip and use popular styles · saves 30 seconds." Same
  routing behavior, just demoted in visual weight.
- **Reforge framework citation:** Per Reforge's `04. Activation Strategies
  / 06. Creating Your Setup Moment Experience` — "Typically when we're
  thinking about the setup experience, we are focused on strategies in
  our product layers that lie on the **forceful end** of the spectrum…
  we want to lean toward customized product experiences." The current
  dual-button intro is on the LOW-forcefulness end (offering Skip with
  equal visual weight to Continue). Reforge's prescription is that the
  setup phase should be slightly more forceful than the aha phase —
  because we're trying to collect specific information that is must-
  have for aha. Demoting Skip is the textbook diff.
- **Expected impact:** +5-10pp on `quiz_intro → quiz_q1_seen` conversion.
  Standard onboarding research benchmark for "demoting alternative CTA"
  is 4-12pp.
- **Effort tier:** XS — HTML + CSS only.
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** Quiz skip rate stays artificially
  high because the off-ramp is button-prominent at the moment of zero
  psych investment.

---

### E4 — Convert the skip-default from blind to a 5-second taste filter

- **Current state in Furnish:** `app.js:1085-1097` — clicking Skip writes
  `profile.styles = ['modern','scandinavian','minimalist']` and routes
  straight to capture. The user never sees what the app assumed about
  them; they see the assumption only at reveal time, possibly mismatched.
- **Proposed state:** Skip click opens a small confirmation overlay:
  "We'll use these styles by default — uncheck any that aren't you."
  Shows 3 chip cards (Modern / Scandinavian / Minimalist) all
  pre-selected, with a 4th option "Show me more options" that expands
  to all 14 styles in `window.STYLES`. User can deselect any of the 3,
  add others, then "Continue." This is a 5-second skip-quiz flow that
  preserves user control without the 4-question commitment.
- **Reforge framework citation:** Per Reforge's `04. Activation Strategies
  / 05. Creating Your Aha Moment Experience` (Principle Two: Warm Start)
  — "a warm start is a personalized experience that helps to answer
  those four fit questions." The current blind default is a COLD start
  dressed as a warm one for any user whose actual taste isn't in the
  minimalist family. Per `06. Creating Your Setup Moment Experience` —
  "must-have information that gives us a highly probable chance of the
  user experiencing the value prop." For a maximalist user, the all-
  minimalist default actively prevents aha. The 5-second filter recovers
  fit alignment without the 30-second cost.
- **Expected impact:** +8-15pp on `skip_quiz → reveal_satisfaction`
  (proxy: revealed-then-not-immediate-bounce). Bigger leverage on
  maximalist-leaning user segments.
- **Effort tier:** M — new modal + small render of the styles grid +
  state write. ~2 hours.
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** ~25-40% of skippers (estimate:
  the proportion who lean non-minimalist) get a confidently-wrong first
  redesign and conclude "this app doesn't get my style."

---

### E5 — Instrument per-question quiz events (massive measurement gap)

- **Current state in Furnish:** `app.js:1092` fires
  `trackEvent(ACTIVATION.SETUP_STYLE, ...)` only on full completion or
  on skip. Per-question events do NOT fire — the system has zero
  visibility into:
  - Which question is the worst dropoff
  - How long users spend on each question
  - "None of these" rate per question
  - Back-button rate per question
  - Skip-after-Q1 vs skip-after-Q3 (the closer to the end, the bigger
    the signal)
- **Proposed state:** Add `trackEvent('quiz_question_seen', { qIdx,
  profileId })` on `renderQuizStep()`, `trackEvent('quiz_question_answered',
  { qIdx, optionIdx, dwellMs })` on `selectQuizOption()`,
  `trackEvent('quiz_question_skipped', { qIdx, dwellMs })` on
  `quizNoneBtn`, `trackEvent('quiz_question_back', { fromIdx, dwellMs })`
  on `quizBackBtn`. Wrap all dwell-ms with a step-entry timestamp.
- **Reforge framework citation:** Per Reforge's `03. Activation Defining,
  Measuring, And Analyzing / 05. Analyzing Your Activation Flow` — every
  step in the activation flow must have its own funnel event. Without
  per-question events, you cannot run the Reforge Activation Diagnosis
  sheet (`08. BONUS Reforge Activation Diagnosis Sheet.pdf`) for the
  setup moment. The whole Reforge methodology of "look for BIG
  differentiations" requires per-step data.
- **Expected impact:** Indirect — enables every other recommendation in
  this dimension to be measured. Without this, all the other E# entries
  are guesses.
- **Effort tier:** XS — 4 trackEvent calls + a `quizStepEnteredAt`
  timestamp.
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** You cannot evaluate the impact of
  any other onboarding change. You're optimizing blind.

---

### E6 — Progressive disclosure on preferences screen — collapse advanced behind details element

- **Current state in Furnish:** `index.html:299-376` — the entire
  preferences form is flat. Profile photo + name + styles + colors +
  custom-color details (already collapsed) + budget + Save. Five
  sections all visible.
- **Proposed state:** Default-visible: Name (auto-filled from earlier),
  Styles (auto-populated from quiz), Save & Continue button. Wrapped
  in a `<details><summary>` element labeled "More options" — Profile
  Photo, Color Moods, Custom Colors, Budget. The user CAN open it; by
  default they see only the must-touch fields and the proceed CTA.
  Crucially, the styles chips render expanded (because the user just
  generated them and wants to see/confirm).
- **Reforge framework citation:** Per Reforge's `Psych Framework` Mistake
  #1 (`07. Evaluating Your Activation Experience End To End`, "Three
  Common Psych Mistakes") — "Constant Balance Of Ask → Reward → Ask. We
  need to carefully balance the asks with the rewards." A flat 5-section
  form between the quiz (ask, ask, ask, ask) and capture (ask) is a wall
  of asks with no reward delivered yet. Per Reforge's Mistake #3 ("Order
  of Operations Matters") — "is there a way for us to reorder our
  activation flow to front-load that positive psych moment?" — collapsing
  optional fields IS the reorder. The user gets to the next step (capture
  → analyzing → aha) faster.
- **Expected impact:** +4-8pp on `quiz_complete → capture_seen` because
  fewer users abandon at the preferences wall. Existing instrumentation
  on `prefs_seen → capture_seen` will measure this cleanly.
- **Effort tier:** S — wrap 4 sections in a `<details>`, restyle.
- **Dependencies:** Verify saved state still loads correctly when the
  details element is collapsed (it's a CSS-only collapse so JS reads
  still work).
- **What breaks/leaks if we skip it:** Preferences continues to be the
  silent dropoff before capture — Reforge's "psych required > psych
  level" failure point.

---

### E7 — Defer the first-redesign tutorial from "6s post-reveal session 1" to "session 2 home arrival"

- **Current state in Furnish:** Per `app.js:1372-1374`, the
  `firstRedesignTutorialSeen` flag is checked on preferences entry. The
  primary tutorial trigger fires 6s after results screen loads on first
  reveal (per Hassan's locked-decision summary).
- **Proposed state:** Tutorial does NOT fire on the first reveal screen.
  Instead, fires on the user's RETURN to the home screen in session 2
  (or on second redesign attempt, whichever comes first). On session 1
  reveal, the user is left alone to explore the redesign — shop items,
  reshuffle, swap pieces — uninterrupted.
- **Reforge framework citation:** Per Reforge's `04. Activation Strategies
  / 05. Creating Your Aha Moment Experience` — "We have to be careful
  about using highly forceful experiences in the aha moments because
  we're trying to train them on a behavior we want them to take. If we
  use a customized product experience, which has a high level of
  forcefulness, we're training them on a behavior within the product
  experience instead of moving them toward naturally establishing that
  habit and behavior." Coachmarks at 6s post-reveal are by definition
  customized + high-forcefulness in the aha moment. They train the user
  to wait for instructions, not to explore. That's anti-habit behavior.
  Per Reforge's `Psych Framework` chart in `07. Evaluating Your
  Activation Experience End To End`, the post-aha psych is at +25 → +30
  → +30 (climbing). Interrupting this with a tutorial flattens the curve.
- **Expected impact:** +3-6pp on `reveal → first_shoppable_tap` (because
  the user explores instead of being lectured). Indirect: better
  D2 retention because the user's own first action under high psych is
  the action that becomes the habit.
- **Effort tier:** S — change tutorial trigger condition. Move from
  reveal-screen 6s timer to home-screen entry-with-completed-redesign
  check.
- **Dependencies:** Per `DEFERRED.md` — server sync of the seen-tutorial
  flag is deferred. As long as the flag is correctly local-persisted,
  this re-trigger logic works locally.
- **What breaks/leaks if we skip it:** Hassan's coachmark interrupts the
  exact psych spike that drives habit formation. Reforge is unambiguous:
  do not interrupt aha.

---

### E8 — Reframe "No signup needed · ~30 seconds" — honest estimate is 90-180s

- **Current state in Furnish:** `index.html:75` — under the welcome CTA,
  microcopy reads "No signup needed · ~30 seconds." But "~30 seconds"
  refers to the QUIZ alone (per quiz-intro badge "4 questions · ~30
  seconds"). The full path quiz → prefs → capture → analyzing → reveal
  is realistically 90-180 seconds. The 30-second claim is therefore
  expectation-misaligned with the actual setup-to-aha time.
- **Proposed state:** Change the welcome microcopy to one of:
  - "No signup until your redesign is ready · about a minute"
  - "Free to try — no signup until reveal · ~90 seconds"
  - "Your redesign in under 2 minutes · no signup required"
  All three are honest about the time AND about the D7 reveal-gate (no
  signup until reveal). The current "~30 seconds" sets up a broken
  promise the moment the user finishes the quiz and hits preferences.
- **Reforge framework citation:** Per Reforge's `04. Activation Strategies
  / 02. The Four Activation Fits` — Promise Fit ("Does this do what I
  want?") — a misaligned time promise is a Promise-Fit violation that
  fires repeatedly throughout the funnel ("they said 30s, I'm at 60s
  and not done"). Per Reforge's `Psych Framework` ("Types of Negative
  Psych — Fit Mis-Alignment"), Fit Mis-Alignment is one of three psych
  drains, alongside Physical and Cognitive. A broken time promise is a
  recurring Mis-Alignment hit at every step.
- **Expected impact:** Slightly DECREASES welcome CTR (people are more
  honest about the cost) but INCREASES quiz-completion rate (people
  who started knew what they were getting into). Net: likely positive
  on activation, especially for the "I have 90 seconds" segment that
  was previously misled into thinking they had only 30.
- **Effort tier:** XS — one line of copy.
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** Promise-Fit erosion at every
  setup-step beyond Q4. The user keeps thinking "almost done" when
  they're not, and burns psych at preferences and capture under a
  false expectation of imminent completion.

---

### E9 — Add a "your room" preview thumbnail on capture screen as warm-start motivational boost

- **Current state in Furnish:** `index.html:584-593` — capture screen
  starts as a placeholder photo frame with a camera icon and "Tap below
  to take a photo or upload one." No reference image, no example, no
  in-context preview. It's a cold start for the photo step.
- **Proposed state:** Above the photo frame, add a small "What works"
  band: 3 thumbs labeled "Good lighting," "Whole room visible," "From
  the doorway." Each is a 60×60 example photo with a one-word label.
  This is the photo-equivalent of Reforge's "templates" pattern in
  Survey Monkey / Pinterest (`05. Creating Your Aha Moment Experience`,
  Principle Two: Warm Start).
- **Reforge framework citation:** Per Reforge's `04. Activation Strategies
  / 05. Creating Your Aha Moment Experience` (Principle Two: Warm Start)
  — "a warm start is a personalized experience that helps to answer
  those four fit questions." The current capture screen is a literal
  cold start for the photo step (per Reforge's "cold start" image of a
  frozen building — nothing to suggest what to do). Examples answer
  Knowledge Fit ("Do I know how to do this?") at the highest-friction
  setup step.
- **Expected impact:** +5-8pp on `capture_seen → photo_uploaded`
  (Knowledge-Fit lift on the highest-friction step). Plus secondary:
  better photo quality → better redesign → higher aha satisfaction.
- **Effort tier:** S — 3 example assets + a small CSS band.
- **Dependencies:** Asset production.
- **What breaks/leaks if we skip it:** Capture continues to be the
  knowledge-fit-cold step in the funnel — the user has to figure out
  what makes a "good" photo with no help.

---

### E10 — Add a per-question "how this affects your redesign" hint, visible on tap

- **Current state in Furnish:** Q1-Q4 currently provide ZERO information
  to the user about why they're being asked. The quiz feels like a
  personality test — fun, but cognitively detached from the goal. Per
  Reforge's "earn the right to ask" principle, the user should
  understand why each question matters.
- **Proposed state:** A small "?" icon next to each question heading.
  Tap reveals a short tooltip: "Q1 sets your overall style direction
  — you'll see this in 80% of the suggested furniture." "Q4 controls
  how busy your walls look — fewer pieces if you pick Plain, lots of
  art if you pick Fill The Wall Up." Optional, never blocks. Available
  but not forced.
- **Reforge framework citation:** Per Reforge's `06. Creating Your Setup
  Moment Experience` — "Each piece of data you collect should map to
  value visible to user." This is the "earn the right to ask" principle.
  Currently the user is asked 4 questions on faith. The "?" hint
  converts each question from a faith-ask to an explicit value-trade.
  Per Reforge's `Psych Framework`, this is "Adding Positive Psych" via
  Fit Alignment ("this product knows what it's doing").
- **Expected impact:** +1-3pp on quiz completion (small but
  cumulative). More importantly: positive psych at each step means
  subsequent steps benefit too.
- **Effort tier:** S — 4 short copy strings + a tooltip component (or
  reuse existing one).
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** Quiz feels arbitrary; some users
  who wanted to understand the system bounce out at Q2 or Q3.

---

### E11 — Add a "save your progress" prompt at quiz Q3 (not at start, not at end)

- **Current state in Furnish:** No save-progress prompt anywhere in the
  setup flow. Guest can quiz → prefs → upload without an account, but
  if they reload the browser between Q2 and Q3, their answers persist
  in localStorage but they may not realize that. There is no in-flow
  reassurance.
- **Proposed state:** At Q3, a small reassurance line below the
  question: "Don't worry — your answers are saved if you come back."
  Appears once, at the question with the highest sunk-cost-to-go ratio
  (75% complete, 25% to finish).
- **Reforge framework citation:** Per Reforge's `Psych Framework`
  ("Adding Positive Psych — Motivational Boosts" in `07. Evaluating
  Your Activation Experience End To End`), reassurance and trust
  signals at the highest-investment point provide a positive psych
  bump exactly when needed. Q3 is also the question with the highest
  cognitive friction per Section A — pairing a reassurance line
  with the hardest question is the textbook anti-friction move.
- **Expected impact:** +1-2pp on `q3_seen → q4_seen`. Small lever but
  cheap.
- **Effort tier:** XS — one line of copy + a small `<p>`.
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** Marginal dropoff at Q3 from
  users who feel "I've gone too far to back out but I might need to."

---

## Top 3 priorities for this dimension

If Hassan can do only three things from this chunk, in order:

1. **E5 — Instrument per-question quiz events (XS effort, foundational).**
   Without this, every other change in this dimension is unmeasurable.
   Per Reforge's `03. Activation Defining, Measuring, And Analyzing`, the
   activation diagnosis sheet REQUIRES per-step events. Do this first.
   Cost: 4 trackEvent calls + a timestamp.

2. **E7 — Defer the first-redesign tutorial from "6s post-reveal" to
   "session 2 home arrival" (S effort, biggest activation lever).** Per
   Reforge `05. Creating Your Aha Moment Experience`, interrupting aha
   with forceful UX trains anti-habit behavior. The current 6s coachmark
   is in direct violation. Reframing this is the single largest
   improvement to D2 retention available in onboarding.

3. **E1 — Replace Q3 (material) with Q3 (room type) (S effort, sets up
   E2 and E9).** Per Reforge `04. Defining Your Setup Moment` ("setup
   action MUST be different from core action"), the current Q3 is
   redundant with Q1. Replacing it with room type — a genuine must-have
   for aha — is the cleanest application of Reforge's setup-moment cut
   rule. Also collapses the capture screen because room-type chip grid
   becomes redundant there.

E3 (demote skip), E6 (progressive disclosure on prefs), and E8 (honest
time microcopy) are each XS-S with low risk and obvious wins; do them
in any free maintenance batch. E2, E4, E9, E10, E11 are all valuable but
secondary to the top 3.

The recurring Reforge thread across every recommendation: **the setup
moment is not a form to fill — it is the warm start that determines
whether aha happens.** Every question that doesn't pay off in the
redesign is psych burned for nothing. Every question that does pay off
should be visibly earned and visibly returned.
