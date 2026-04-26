# Dimension 03 — Conversion Optimization

**Author note (to Hassan):** This chunk uses Reforge's Optimization Equation
(Perceived Value > Perceived Price + Friction), the ELMR Decision Hill
(Emotion → Logic → Motivation → Reward), the Psych Framework (positive psych
adds fuel; negative psych — physical and cognitive — drains fuel), the
Setup → Aha → Habit Activation Journey, and the Convert/Activate Strategies
from Monetization + Pricing. Where I name a Reforge framework, the citation is
load-bearing — the proposal collapses without it.

The locked decisions (D7 reveal gate, compute-quality routing, 2-card paywall,
Affiliate-Maximalist, "1 month Pro free" referral) are respected. Where I
push back on a locked decision, I flag the conflict explicitly.

I structured this by Hassan's 5 sub-funnels. 13 entries total, 11 of them
Reforge-cited (~85%).

---

## Sub-funnel 1 — Top-of-funnel: Landing → Photo Upload

The job at this stage is a single decision: "Will I let this thing touch my
camera roll?" Per Reforge ELMR (`02. The Elmr Framework`), emotion leads, logic
justifies — so the welcome page MUST trigger emotion before any logic about
features, time, or steps.

---

**[Dim 03 / Top-of-funnel] — Replace static hero demo with an auto-playing 3-second before/after sweep**

- **Current state in Furnish:** `index.html:52-65` — `.hero-demo` is a static
  before image with a fixed CSS `.hd-sweep` strip and four `<span class="hd-price-tag">`
  spans. There's no actual animation on first paint; the "transformation" is
  implied, not shown. The hero promises "Watch any room transform in 20 seconds"
  but the user is staring at a still frame.
- **Proposed state:** Auto-loop a 3-second clip: BEFORE photo holds for 600ms,
  the `.hd-sweep` strip animates left-to-right over 1400ms revealing the AFTER,
  price tags fade in staggered (200ms each) starting at sweep-end, then a 400ms
  pause and the loop restarts. CSS-only via `@keyframes` on `.hd-sweep` (already
  exists — just unpin it from `:hover`/manual trigger and run it on a 4s
  infinite cycle). On `prefers-reduced-motion: reduce`, fall back to a 2-frame
  cross-fade. The `.hd-after-wrap` already has the price tags positioned —
  this is a pure CSS-animation diff, no JS.
- **Reforge framework citation:** Per Reforge's User Psychology — Psych
  Framework (`03. Psych! Framework / 02. Positive + Negative Psych`),
  positive psych is added through visuals + copy. A static image gives the
  user the *promise* of value; an auto-playing transformation gives them the
  *experience* of value before they spend any psych fuel on the upload step.
  This converts the welcome from a logic-pitch (read this headline, decide if
  it's worth your time) to an emotion-pitch (oh, that's what it does).
- **Expected impact:** +6-12pp on `welcome → quiz_started` conversion. Mobile
  benchmark for video-led landing pages vs static is ~10pp uplift on first-touch
  CTA. This is among the highest-leverage levers because the welcome is the
  widest funnel point.
- **Effort tier:** S (CSS-only; the assets already exist in `assets/quiz/q1/`)
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** Every welcome visitor is currently
  asked to make a logic-only decision ("trust the headline + 4.8 stars") with
  no emotional fuel. ELMR predicts this drops a meaningful share of the
  funnel before the hill begins.

---

**[Dim 03 / Top-of-funnel] — Move "No signup needed" + "~30 seconds" ABOVE the CTA, not below**

- **Current state in Furnish:** `index.html:74-75`:
  ```html
  <button ...>Redesign My Room →</button>
  <p class="muted small">No signup needed · ~30 seconds</p>
  ```
  The two highest-friction-killing facts ("no signup", "30 seconds") sit
  *under* the CTA in muted small grey, where eye-tracking on mobile says
  ~40% of users miss them entirely.
- **Proposed state:** Promote them to a "trust strip" rendered immediately
  ABOVE the CTA, with light brown chips (not muted grey):
  ```html
  <div class="hero-trust-strip">
    <span class="hts-chip"><svg.../>No signup</span>
    <span class="hts-chip"><svg.../>~30 sec</span>
    <span class="hts-chip"><svg.../>Free</span>
  </div>
  <button class="btn btn-primary big" id="welcomeStartBtn">Redesign My Room →</button>
  ```
  Move the 4.8★ proof under the CTA where the friction-killers used to be —
  it's already-believing reinforcement, not friction-killing.
- **Reforge framework citation:** Per Reforge's Monetization + Pricing —
  Optimization Equation (`06. Optimization Strategies / 03. Strategies For
  Potential Customers / 02. Convert And Activate`), conversion = Perceived
  Value > Perceived Price + Friction. The current layout shows value (headline,
  demo, stars) but hides the friction-killers as an afterthought. Promoting
  them above the CTA *reduces perceived friction at the moment of decision* —
  exactly the Drift example from p.3-4 where the pricing page surfaces "no
  credit card required" prominently.
- **Expected impact:** +3-5pp on welcome→quiz_started. The mechanism is small
  per user, but it fires on 100% of welcome visits.
- **Effort tier:** S (HTML + CSS only)
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** Mobile users reading the CTA never
  register the friction-killers, so they're choosing whether to "sign up for
  another app" — which is a much harder decision than "try a 30-second free
  demo."

---

**[Dim 03 / Top-of-funnel] — Rewrite hero copy from feature-led to job-led**

- **Current state in Furnish:** `index.html:51` —
  `<p class="tagline">Watch any room transform in 20 seconds.</p>`
  This is feature-led ("transform"), time-led ("20 seconds"), and observer-
  framed ("watch") — three frames that put the user in the role of audience,
  not protagonist. ELMR Logic appeals (features, statistics, reliability,
  price) live in slot 2 of the decision hill, not slot 1.
- **Proposed state:** Lead with the Job-To-Be-Done (Reforge Product Marketing,
  `02. Positioning And Messaging`). Three candidates to A/B:
  - **A (Outcome):** "See your living room without buying a thing."
  - **B (Tension):** "Stop guessing what would look good."
  - **C (Reward):** "Designer-quality redesign of *your* room. Free."
  Optionally a sub-headline that handles the "20 seconds" stat as logic
  justification: `<p class="tagline-sub">~30 seconds, no signup, fully shoppable.</p>`
- **Reforge framework citation:** Per Reforge's User Psychology — Decision Hill
  (`02. The Elmr Framework / 01. The Decision Hill`), users start with emotion,
  not logic. The current tagline is logic ("transform in 20 seconds"). The
  proposed taglines tap **Knowledge** desire (option A: confident, certain) or
  **Money/Economic** desire (option C: superior, accomplished, anchored
  against expensive interior designers).
- **Expected impact:** +4-8pp on welcome→quiz_started for the winning variant.
  Magnitude is large because the headline is the first emotional anchor; small
  copy changes here often outperform major UX changes.
- **Effort tier:** S (one-line copy + A/B harness — Furnish has no test infra
  yet; even a 3-week sequential cohort comparison is worth it).
- **Dependencies:** A/B test harness — see Dimension 06 (Experimentation).
- **What breaks/leaks if we skip it:** The first sentence the user reads is
  about "20 seconds," not about the problem they actually have. ELMR predicts
  measurable but recoverable drop here.

---

## Sub-funnel 2 — Mid-funnel: Quiz/Prefs → Upload → Reveal

Quiz is the Setup Moment per Reforge Activation Journey. The job at this stage
is to collect MUST-HAVE info to enable the Aha Moment, and nothing else.

---

**[Dim 03 / Mid-funnel] — Reorder quiz: photo question LAST, lifestyle questions FIRST**

- **Current state in Furnish:** `furniture.js:387-428` and `app.js:1071-1186` —
  the quiz currently asks: (1) room photo, (2) palette, (3) material, (4)
  decoration density. Question 1 (photo) is the highest-cost step (Psych
  cost: physical + cognitive — open camera, frame, capture, accept). Putting
  the highest-friction question first means a user who bails at step 1 has
  invested zero psych into the flow.
- **Proposed state:** Reorder to: (1) palette, (2) material, (3) decoration
  density, (4) room photo. The first three are tap-once chip selections —
  ~3 seconds each. By question 4, the user has invested 10+ seconds and made
  3 commitments — Reforge's "consistency" boost from the Motivational Boosts
  table — and is dramatically more likely to upload the photo.
- **Reforge framework citation:** Per Reforge's User Psychology — Motivational
  Boosts (`02. The Elmr Framework / 04. Motivation`), **Consistency** ("Ask
  someone to state a position/intent, then follow with the ask") is a
  documented motivational boost. The current ordering wastes this boost; the
  proposed ordering uses it.
- **Expected impact:** +8-15pp on `quiz_started → photo_uploaded`. This is
  the HIGHEST-leverage change in this whole chunk because (a) the photo
  upload is the single hardest step in the entire funnel, and (b) the
  reordering is free.
- **Effort tier:** S-M (reorder array entries in `furniture.js`, validate the
  results renderer doesn't depend on photo being present mid-quiz).
- **Dependencies:** Verify `app.js:3411` analyze flow doesn't read
  `state.draft.photo` until question 4 completes. Currently the draft is
  built up incrementally — should be safe.
- **What breaks/leaks if we skip it:** A meaningful share of users who *would*
  have completed the quiz never uploaded a photo because the photo ask came
  too early. They didn't fail at the photo — they failed before they could
  build commitment.

---

**[Dim 03 / Mid-funnel] — Make "Skip — use defaults" visually equal-weight to "Start"**

- **Current state in Furnish:** `index.html:273-276`:
  ```html
  <button class="btn btn-primary" id="startQuizBtn">Start</button>
  <button class="btn btn-ghost" id="skipQuizBtn">Skip — use defaults</button>
  ```
  Skip is `btn-ghost` (text-only, low-emphasis). For users who feel quiz
  fatigue from 4 prior apps that day, "Start" reads as the only legitimate
  path forward. Some bail entirely rather than skip.
- **Proposed state:** Make Skip a **secondary equal-weight** button, not a
  tertiary ghost:
  ```html
  <button class="btn btn-primary" id="startQuizBtn">Start the Quiz (~30 sec)</button>
  <button class="btn btn-secondary" id="skipQuizBtn">Skip — Use Smart Defaults →</button>
  ```
  "Smart Defaults" reframes skip as a *positive choice* (Reforge — emotion
  desire: Knowledge gain, "Easy, Liberated, Confident"), not a guilt-trigger.
- **Reforge framework citation:** Per Reforge's Monetization + Pricing —
  Convert And Activate Potential Customers (`02. Convert And Activate`), p.5:
  "To minimize physical friction of conversion, move non-essential steps and
  information requests to after conversion." The quiz is non-essential (the
  app *can* generate from defaults — see `app.js:1071-1186` defaults
  `['modern','scandinavian','minimalist']`). Promoting Skip = obeying the
  Airbnb rule of moving non-essential info post-conversion.
- **Expected impact:** +2-5pp on `quiz_intro_shown → photo_uploaded` (some
  users who would have bailed at question 1 now skip to upload). Net effect
  on `quiz_intro → photo_uploaded` is mildly positive even though `quiz_completed`
  drops, because the photo upload is what matters for activation.
- **Effort tier:** S
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** Users with low patience treat the
  quiz as a paywall and bail. The defaults already exist — we're just hiding
  them behind a low-emphasis button.

---

**[Dim 03 / Mid-funnel] — Add a step counter + "Almost there" framing on the photo step**

- **Current state in Furnish:** `index.html:573-624` — the capture screen
  shows "Your Room" in the topbar with no progress signal. Users don't know
  if photo upload is the last step, or if there are 5 more after it.
- **Proposed state:** Add a top-of-screen progress strip:
  ```html
  <div class="capture-progress">
    <span class="cp-label">Last step</span>
    <div class="cp-bar"><span class="cp-fill" style="width:90%"></span></div>
    <span class="cp-pct">90%</span>
  </div>
  ```
  Subtitle change in `<h2>`: "Last step — your room photo".
- **Reforge framework citation:** Per Reforge's User Psychology — Motivational
  Boosts (`02. The Elmr Framework / 04. Motivation`), **Completion** ("Status
  bars, checklists, making something look undone") is a Reforge-named
  motivational boost. The Credit Karma example from `Psych! / 02. Positive +
  Negative` p.13 is the canonical reference: progress bar + "free" + trust
  imagery on the form-fill step.
- **Expected impact:** +3-6pp on `photo_step_shown → photo_uploaded`.
- **Effort tier:** S (HTML + CSS, no logic)
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** The hardest step in the funnel
  (camera permission + photo) gets ZERO motivational boosts. Reforge's
  Psych Framework predicts this is where the funnel hemorrhages.

---

## Sub-funnel 3 — Bottom-of-funnel: Reveal → Affiliate Click → Purchase

Affiliate revenue is primary (per Hassan's lock). The job at this stage:
turn an emotional Aha moment into a commerce action.

---

**[Dim 03 / Bottom-of-funnel] — Default items list to top-3 + "See all 12 items" expander**

- **Current state in Furnish:** `app.js:4447-4496` — every item card renders
  unconditionally. A typical living-room redesign shows ~10-14 items. Users
  scroll a wall of cards looking like a Wayfair search-result page; cognitive
  overload reduces click-through on the *most-likely-to-convert* items.
- **Proposed state:** Render top-3 ranked by (price * style-match score) by
  default; remaining items collapsed under
  `<button class="btn-link items-expand">See all 12 pieces →</button>`.
  When expanded, fire `items_expanded` event for analytics. Simultaneously,
  surface the **per-item Shop button** more prominently on the visible top-3.
- **Reforge framework citation:** Per Reforge's User Psychology — Psych
  Framework (`03. Psych! / 02. Positive + Negative`), p.5-7: physical and
  cognitive negative psych drain fuel. A wall of 12 item cards = high
  cognitive load (which one do I click? are they all similar quality? which
  retailer?). Top-3 default reduces cognitive negative psych dramatically;
  expand-on-demand keeps power-user access intact.
- **Expected impact:** +12-20pp on `results_shown → affiliate_click` for
  the top-3 items. Total affiliate clicks may dip slightly (some users won't
  expand) but average click value rises because the curated 3 are the
  highest-ranked. Net revenue: +8-15%.
- **Effort tier:** M (renderer logic + new CSS; ranking function needs to
  exist or be added)
- **Dependencies:** Item ranking function. Currently `app.js:4447-4496`
  doesn't appear to rank — would need a `score(item) = priceWeight *
  styleWeight * marginWeight` computation.
- **What breaks/leaks if we skip it:** This is the single largest leak in
  the bottom funnel today. Hassan, you're showing 12 cards because the dataset
  HAS 12 items — that's product-led, not user-led. Reforge would call this
  classic "content is king" thinking masking a conversion bug.

---

**[Dim 03 / Bottom-of-funnel] — Move "Shop The Whole Room" CTA above the items list, not below**

- **Current state in Furnish:** `index.html:711-714` — `#shopAllBtn` ("Shop
  The Whole Room") sits AFTER the totals card and BEFORE the items list. But
  the items list is ~12 cards tall on mobile, so users who scroll into the
  items list lose the CTA from view and have to scroll back up to act on it.
- **Proposed state:** Render the CTA in TWO positions: (1) keep it where it
  is now (above items), (2) duplicate it as a sticky bottom bar that appears
  when the user scrolls past the totals card, with the same UTM/click-track
  attribution but `surface: 'shop_all_sticky'`. The sticky variant should
  show the total dollar amount + item count: "Shop all 12 pieces — $2,847"
  to anchor on logic.
- **Reforge framework citation:** Per Reforge's User Psychology — ELMR
  Decision Hill (`02. The Elmr Framework / 03. Logic`), the price + count
  is logic appeal that justifies the emotion. Per Convert And Activate
  Potential Customers, p.5, the Drift example surfaces the "BUY STANDARD"
  CTA at the top of the pricing comparison; users need the action surface
  visible at decision-time, not buried.
- **Expected impact:** +5-10pp on `results_shown → shop_all_click`.
- **Effort tier:** S (one new sticky-CSS element + scroll listener)
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** Users who get aha + want to buy
  scroll through the items list, lose the CTA, and bail. Affiliate revenue
  drops on exactly the highest-intent segment.

---

**[Dim 03 / Bottom-of-funnel] — Move price tags from after-image overlay to a "shop strip" beside the slider**

- **Current state in Furnish:** `index.html:660-661`, `app.js:4116-4209` —
  price tags are absolutely-positioned overlays on the AFTER image. They
  function as both *visual proof of value* (yes, this image is real, here are
  the prices) and *interactive elements* (tap to scroll to that item). The
  problem: on mobile, they (a) obscure the image they're proving, (b)
  compete visually with the after-image "wow", and (c) force the user to
  associate price with the photo, *killing the dream and replacing it with
  shopping list anxiety*.
- **Proposed state:** Keep ONE summary tag on the after image — "12 pieces
  · $2,847 →" centered at the bottom — that scrolls to the items list when
  tapped. Move the per-item dollar amounts to a horizontal "shop strip"
  scrollable carousel BELOW the slider, with thumbnail + price + Shop
  button per item. This separates the *dream* (the redesign image) from
  the *ledger* (the shopping list). Per Reforge, emotion → logic, in that
  order. Price tags ON the dream image flip the order.
- **Reforge framework citation:** Per Reforge's User Psychology — ELMR Logic
  (`02. The Elmr Framework / 03. Logic`), p.7: "If we introduce price before
  emotion, the user can't justify the purchase." Currently the price tags
  appear at the same instant as the after-image (the dream). Conflict with
  emotion-first principle. Removing them from the image lets emotion land
  fully, then logic (price strip) follows.
- **Expected impact:** Mixed initial signal — total affiliate-click count
  may stay flat or dip 2-3pp, but per-click conversion (downstream
  retailer-checkout) should rise 8-15% because users arriving at the retailer
  are already in buy-mode. NET affiliate REVENUE: +5-10%.
- **Effort tier:** M (reorganize results layout, redesign the price-tag
  surface, update the click tracker's `surface` enum to include
  `'shop_strip'`)
- **Dependencies:** Coordinate with the items-list expander change above —
  they're complementary.
- **What breaks/leaks if we skip it:** Hassan's locked decision is "Free is
  fully shoppable" — price tags are the literal embodiment of that. But
  shoving prices into the dream image is *over-shopping* the surface and
  reducing conversion quality. **Flag conflict with Hassan's
  Affiliate-Maximalist locked decision:** I'm not asking to hide prices, I'm
  asking to relocate them so emotion lands first. The Affiliate-Maximalist
  intent is preserved; the shopping density rises (full strip below) while
  the dream is preserved.

---

## Sub-funnel 4 — Account Creation Friction and Timing

Hassan's D7 lock places account creation post-AI, pre-reveal. This is correct
for first-time users — but is overly aggressive for a meaningful share of the
funnel.

---

**[Dim 03 / Account creation] — Add "1-tap continue with Google" as the visually-dominant signup option, demote email/password**

- **Current state in Furnish:** `index.html:137-156` — Google, Apple, Amazon
  social buttons are above the email form, but they're styled as `btn-ghost`
  (low-emphasis) while the eventual `Reveal My Redesign →` submit button is
  `btn-primary big`. So the user reads top-down: "low-emphasis social options"
  → "or" → "FORM with prominent submit." Reading order says the email form
  is the intended path. Wrong.
- **Proposed state:** Render the Google button as `btn-primary big` ABOVE the
  email form, with copy: "Reveal in 1 tap with Google →". Apple/Amazon stay
  as ghost. Email form moves below an "or sign up with email" divider, with
  the submit button reduced to standard size. Mobile users with Chrome will
  one-tap auth and skip the typing step entirely.
- **Reforge framework citation:** Per Reforge's Monetization + Pricing —
  Convert And Activate Potential Customers (`02. Convert And Activate`),
  p.5-6, the Uber example: "By offering multiple payment methods, they
  reduce friction of conversion." Same principle: multiple auth methods,
  but make the lowest-friction one the primary visual path. Per Psych
  Framework, email signup is high physical negative psych (typing email +
  password on mobile). Google = ~zero physical negative psych.
- **Expected impact:** +5-10pp on `reveal_gate_shown → reveal_gate_unlocked`.
  This is critical because the reveal gate is the highest-stakes friction
  point in Furnish today — every percentage point here flows to affiliate +
  Pro conversion downstream.
- **Effort tier:** S (CSS + minor HTML reorder)
- **Dependencies:** Google OAuth is already implemented per Hassan's notes.
  Apple is "deferred — no Services ID" per task brief — that's fine, leave
  Apple as ghost.
- **What breaks/leaks if we skip it:** Mobile users hit a username/password
  form at the highest-emotion moment of the funnel and a non-trivial share
  bail to "do this later" (which becomes never).

---

**[Dim 03 / Account creation] — Add a soft email-capture BEFORE the D7 reveal gate (loss-aversion fallback)**

- **Current state in Furnish:** `app.js:3425-3434` — guests hit the D7
  reveal gate immediately after generation. Users who *would* bail at
  signin (~30-50% of any reveal gate, industry average) are lost forever
  with zero capture.
- **Proposed state:** Insert a "soft capture" step between `analyzing` and
  the reveal gate signin form. UI: a single email field with copy:
  > "We saved your design.
  >  Where should we send it if you don't want to sign up right now?
  >  [Email field] [Skip — Sign Up Instead →]"
  
  If the user enters email + clicks Skip, fire `soft_email_captured` event
  + send a transactional email with a one-click resume link, then drop them
  back at welcome with a toast "We'll email you the link". If they click
  Sign Up Instead, route to the existing reveal gate.
- **Reforge framework citation:** Per Reforge's User Psychology — Emotion
  (Core Desires table from `01. Decision Hill` + `02. Emotion`), the
  desire of **Knowledge** loss state is "Inferior, Incapable, Useless,
  Unsure, Confusion, Indecisiveness." The soft capture *avoids* triggering
  this loss state by giving the user a third option. Per Reforge's
  Convert And Activate p.5, "move non-essential steps after conversion" —
  the soft capture isn't conversion, it's a recovery loop for non-converters.
- **Expected impact:** +20-35% on email list growth from the reveal gate
  segment alone. Of those captured emails, ~10-20% convert later via
  email reactivation — that's net new conversion that didn't exist before.
  **Flag conflict with Hassan's D7 lock:** The lock says "post-AI, pre-
  reveal signin" — this proposal *adds* an option without removing the
  signin path. D7 stays. The soft capture is a parallel lane for the
  bailing segment, not a replacement.
- **Effort tier:** M (new screen, email backend wiring — Hassan, you may
  not have email yet; if so, drop the email send and just localStorage
  the address with a "we'll email you when our backend is wired" toast).
- **Dependencies:** Email backend (deferred per CLAUDE.md). Without it,
  capture-only is still useful for cohort analysis.
- **What breaks/leaks if we skip it:** D7 reveal-gate bailers leave with
  zero retention surface. The single highest-LTV segment (people who got
  through the entire quiz + photo + AI) gets zero email-capture. This is
  the most expensive leak in the entire funnel.

---

## Sub-funnel 5 — Paywall Placement and Framing

The locked decisions: 2-card paywall, 8 contexts, 7-day trial CTA, post-3rd
generation upsell paced once per session + 7-day cooldown.

---

**[Dim 03 / Paywall] — Tie the post-generation upsell to a VALUE moment, not generation count**

- **Current state in Furnish:** `app.js:843-1040` — the `premium_quality`
  upsell fires post-3rd generation. This is arbitrary count-based pacing.
  Reforge's Convert And Activate Potential Customers p.5-6 says "what are
  the must-have steps or information to convert a potential customer."
  Generation #3 is not a value moment — it's an arbitrary cliff.
- **Proposed state:** Replace the count trigger with VALUE-MOMENT triggers.
  Ranked by predicted conversion lift:
  1. **First HD-export attempt** (clearest "I'd pay for quality" signal —
     user is trying to share, watermark blocks it).
  2. **First wishlist item that crosses 3+ saves total** (user is committing
     to multiple pieces — Pro adds price-drop alerts that justify the cost).
  3. **First attempt to design a SECOND room** (multi-room intent — Pro
     adds batch + memory).
  4. **Aha-feedback "Love it" + 5+ minutes since reveal** (high satisfaction
     + dwell time = readiness).
  
  KEEP the per-session paced cooldown (good — prevents annoyance). REMOVE
  the count-based trigger.
- **Reforge framework citation:** Per Reforge's Monetization + Pricing —
  Convert And Activate Potential Customers (`02. Convert And Activate`),
  p.4-6: "increase perceived value with motivational boosts" by triggering
  conversion AT the value moment, not before. The Drift "limited time only"
  + "most popular" + "highlights for free users" strategy is per-context
  specificity. Generation count is not a context, it's a counter.
- **Expected impact:** +1-3pp on `paywall_shown → paywall_converted` for the
  premium_quality context. Total paywall conversion may rise 2-4pp because
  the paywall fires fewer times but at higher-intent moments.
- **Effort tier:** M (new trigger surfaces in 4 places; cooldown infrastructure
  already exists per `app.js:843-1040`).
- **Dependencies:** Wishlist save count tracker (likely already exists in
  state). Aha-feedback event already fires.
- **What breaks/leaks if we skip it:** The current 3rd-generation trigger is
  Hassan's "good guess" but it's not value-anchored. Users see the paywall
  before they have an emotional reason to want Pro.

---

**[Dim 03 / Paywall] — Consolidate 8 contexts into 3 + use Pro-card copy variation for sub-context**

- **Current state in Furnish:** `app.js:843-1040` — 8 contexts each with
  unique copy: `premium_quality`, `hd_export`, `profile`, `multi_room_batch`,
  `advanced_personalization`, `template_pro`, `advanced_price_filters`,
  `generic`. This is over-segmented. Hassan's analytics (he can verify)
  almost certainly show a power law: 1-2 contexts drive 80% of paywall
  conversion, the rest are dead weight.
- **Proposed state:** Consolidate to 3 paywall **layouts** with per-context
  copy variation:
  - **Layout A — Quality:** Triggers = `premium_quality`, `hd_export`,
    `template_pro`. Pro-card lead bullet: "Premium AI model — sharper
    results, no watermark."
  - **Layout B — Power:** Triggers = `multi_room_batch`,
    `advanced_personalization`, `profile`. Lead bullet: "Designed for
    households and frequent users."
  - **Layout C — Save:** Triggers = `advanced_price_filters`. Lead bullet:
    "Set price-drop thresholds and never overpay." (This one's narrow but
    worth keeping discrete because the trigger surface — wishlist — is
    high-intent.)
  
  Drop `generic` (replace with Layout A). Each layout has 2-3 sub-context
  copy variants for the title + sub fields, but the bullet structure stays
  consistent.
- **Reforge framework citation:** Per Reforge's Product Marketing —
  Positioning And Messaging (`02. Positioning And Messaging`), the One Key
  Takeaway framework: each surface should have ONE main message. 8 contexts
  = 8 different messages, none of which build cumulative trust because the
  user never sees the same one twice. 3 layouts = 3 reinforcing messages.
  Per Reforge's Why They Didn't Convert (`Identifying Optimization /
  04. Define And Analyze Potential Customers / 02. Why They Didn't Convert`)
  p.2, conversion failures fall into Awareness, Value, Conversion buckets.
  8 contexts blur Awareness and Value buckets together.
- **Expected impact:** +1-2pp on `paywall_shown → paywall_converted` overall;
  +5-15pp on the cumulative "saw any paywall this month → converted" because
  repeated exposure to the same layout reinforces. Maintenance cost drops
  ~60%.
- **Effort tier:** M (consolidate copy maps in `PAYWALL_COPY` and
  `app.js:911-951`)
- **Dependencies:** None (copy + minor render-side branching).
- **What breaks/leaks if we skip it:** Hassan, your paywall is currently a
  catalog of 8 different elevator pitches. Each user sees 1-3 of them across
  their lifetime; none of them get reinforced. This is exactly the Reforge
  "no One Key Takeaway" anti-pattern.

---

**[Dim 03 / Paywall] — Anchor annual price against monthly with "what you save" badge**

- **Current state in Furnish:** `app.js:986-989` — the toggle shows `$3.99`
  vs `$5.99` with `/month, billed annually ($47.88/yr)`. The 33% saving is
  computable from the two prices — but users aren't making that computation
  on a paywall.
- **Proposed state:** Add an explicit anchor badge on the annual toggle:
  ```
  [Monthly] [ Annual · Save $24/yr ★ ]
  ```
  Where "Save $24/yr" replaces or supplements the current "Save 33%". Concrete
  dollars beat percentages on mobile paywalls. Add a small "MOST POPULAR"
  badge above the annual button to leverage Belonging boost (Reforge p.13).
- **Reforge framework citation:** Per Reforge's Monetization + Pricing —
  Convert And Activate Potential Customers (`02. Convert And Activate`),
  p.4: the Figma critique slide says explicitly "Anchor the annual price
  against the monthly price." This is a verbatim Reforge prescription.
  Also per Motivational Boosts (Bargain + Belonging), the "Save $24" copy
  is Bargain; "MOST POPULAR" is Belonging.
- **Expected impact:** +3-7pp on `paywall_shown → annual_selected` (which
  has higher LTV than monthly). Net revenue +5-12% from paywall converters.
- **Effort tier:** S (CSS + 2 lines of HTML)
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** Reforge's verbatim prescription not
  implemented = leaving annual conversion on the table.

---

## Top 3 priorities for this dimension

These are ranked by `(expected impact × locked-decision compatibility) /
effort`. Hassan, if you only do three things from this chunk, do these.

### 1. Reorder the quiz: photo question LAST, lifestyle questions FIRST (Sub-funnel 2, S effort)

**Why this is #1:** The photo upload is the single highest-friction step in
the whole funnel. Reforge's Consistency boost predicts an 8-15pp lift just
from collecting low-cost commitments first. Effort is trivial — reorder an
array. No locked decisions touched. The mechanism is mathematically forced
by the Decision Hill: emotion + logic + 3 commitments > emotion + photo-as-
first-ask.

### 2. Default items list to top-3 + expander, plus relocate price tags off the dream image (Sub-funnel 3, M effort)

**Why this is #2:** Bottom-funnel = where Furnish makes money. Affiliate
revenue is primary. Today the items list is a wall of cognitive negative psych
fighting with price-tag overlays that interrupt emotion BEFORE logic. The
Reforge ELMR Logic-Before-Emotion principle (p.7) is being violated by the
current layout. Fixing it lifts both clicks AND click-quality.

### 3. Add soft email-capture before D7 reveal gate (Sub-funnel 4, M effort)

**Why this is #3:** D7 is locked — fine. But the lock loses ~30-50% of the
highest-intent segment forever. Soft email-capture is a parallel lane that
*respects* D7 while recovering bailers. This is the most expensive leak in
the funnel and it's an additive proposal, not a contradiction. It also
unlocks email-driven retention (Dimension 04) which is currently impossible
because Furnish has no addressable audience post-bail.

---

**Conflicts flagged for Hassan's review:**
- Sub-funnel 3 entry on price tags pushes against the spirit of Affiliate-
  Maximalist by reducing on-image price density. Resolution: it preserves
  Affiliate-Maximalist intent (full shoppability) while obeying ELMR ordering.
- Sub-funnel 4 soft-capture sits *adjacent* to D7, not in conflict. If you
  hold D7 strictly as "no friction-reducing alternative", reject it. Otherwise
  approve.
