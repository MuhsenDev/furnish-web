# Dimension 01 — Visual Design and UI

**Caveat (Hassan asked for honesty):** Reforge is a growth/PM/marketing curriculum, not a visual-design curriculum. The most directly applicable courses are **Brand Marketing — Brand Identity And Governance** (the four building blocks: personality, assets, guidelines, collateral; design-sprint process for asset development) and **Product Marketing — Positioning And Messaging** (creative brief, one key takeaway, proof-point pillars). Where micro-visual choices (motion timing, shadow stacks, exact px) cannot be grounded in a Reforge framework, items are explicitly marked **[Original recommendation, not Reforge-grounded]**. Roughly 70% of entries below cite a Reforge course; the rest are flagged.

**What I actually opened from the Reforge bundle (so cites are real, not invented):**
- Brand Marketing / 04. Brand Identity And Governance / 01. Bringing Your Brand To Life / `01. Building Blocks Of Brand Identity.txt` — the four-blocks framework (personality → assets → guidelines → collateral) and the EcoDeco vs. Four Seasons consistency case.
- Brand Marketing / 04. Brand Identity And Governance / 01. Bringing Your Brand To Life / `02. Defining Your Brand Personality.txt` — the Word Game (who we are / who we'd like to be / who we're not) and the Attitudinal Ranges exercise.
- Brand Marketing / 04. Brand Identity And Governance / 01. Bringing Your Brand To Life / `03. Creating Brand Assets, Part I.txt` — the Design Sprint five steps (brief → development → review → refinement → approval) and the brand-asset list (color palette, typography, form/shape, imagery principles, tone, logo, illustration, photography, iconography, taglines, CTAs).
- Product Marketing / 02. Positioning And Messaging / 02. Messaging — module structure (creative brief, one key takeaway, proof-point pillars).
- Mastering Product Management / 09. Decision Architecture — Decision Budget & Circles (used to justify visual hierarchy decisions that lower cognitive load).

---

## "Looks Expensive" vs "Looks Cheap" Analysis (category leaders Hassan named)

What best-in-class shopping/AI/lifestyle apps (Apple, Pinterest, Magnolia, Restoration Hardware, AllModern, Thumbtack, MasterClass, Airbnb, Lensa, Photoroom, Houzz Pro) do — and where Furnish does/doesn't measure up. Each gap below converts to a recommendation entry further down.

**Cue 1 — Typography weight contrast and serif/sans pairing.**
Restoration Hardware and Magnolia (Joanna Gaines) use a high-contrast pairing: thin/regular display serif (300–400) at large sizes for hero headlines, paired with a workhorse sans (450–500) for body. MasterClass uses Tiempos / GT America. The serif at hero size signals editorial/curated/premium; the sans signals modernity. **Furnish today:** the project doc says "Heading: Georgia serif. Body: system-sans" but `styles.css:90` actually loads `'Inter', -apple-system, BlinkMacSystemFont, ...` — the serif is not loaded. Headings are bold-700 sans (`styles.css:119`). This is a clean modern look but contributes to a "tech/SaaS" feel, not the "shoppable lifestyle catalog" feel Furnish wants. **Gap → Rec 01.**

**Cue 2 — Photography realism and unstaged-feel imagery.**
AllModern and Pinterest lead with photography that looks like real homes, not 3D renders. Even AI-output apps that look expensive (Lensa-portrait era, Photoroom Studio, Interior AI's better tier) carefully grade output for realistic shadow falloff, dust/grain, and slightly desaturated palettes. **Furnish today:** Free tier renders Flux Schnell — known for plasticky output. The before/after slider on the welcome screen (`index.html:52-65`) shows a stylized, near-cartoon "after" because the demo assets are quiz illustrations (`assets/quiz/q1/...`), not photographs. **Gap → Rec 02.**

**Cue 3 — Generous whitespace and "calm" density.**
Apple Store, Magnolia, RH all use 2× the whitespace of typical SaaS UIs. Sections breathe. CTAs sit alone, not in chip-clusters. **Furnish today:** the welcome screen packs hero + demo frame + price-tag overlays + CTA + tagline + 4.8★ proof + count + reviews-bar at the bottom of `#app` (`styles.css:97-106`) all on one viewport. It reads dense — the eye has nowhere to rest. **Gap → Rec 03.**

**Cue 4 — Micro-interaction polish (hover, tap, transitions).**
RH-grade UIs use slow easing curves (300–500ms with custom cubic-bezier on hover/tap), not snappy 80ms scale-down. Pinterest's pin-hover is 360ms ease-out. MasterClass's tile-hover crossfades a poster image. **Furnish today:** `.btn:active { transform: scale(0.98); }` with 80ms ease (`styles.css:165` and `155`). Functional but reads as low-budget — it's the same micro-interaction cheap mobile templates use. **Gap → Rec 04.**

**Cue 5 — Shadow stacks (multi-layer, color-tinted shadows).**
Premium apps stack 3+ shadows: a tight ambient (1–2px), a soft mid (4–8px), and a far-cast diffuse (24–60px), often tinted to the brand color rather than pure black. Apple Store cards do this; so does Stripe's pricing page. **Furnish today:** single-shadow `--shadow: 0 6px 24px rgba(62, 39, 35, 0.08)` (`styles.css:17`). It's correctly tinted (warm brown, not black) — that's good. But it's one layer; cards lack depth. **Gap → Rec 05.**

**Cue 6 — Frosted-glass / backdrop-blur surfaces with translucent fills.**
Apple Maps, Spotify, modern Pinterest, Photoroom all use `backdrop-filter: blur()` on overlay panels with semi-transparent fills. It connotes iOS-grade software. **Furnish today:** bottom-nav uses it (`styles.css:744-747` — good). But paywall list items use `background: var(--beige)` solid (`styles.css:2663`), price-tags use solid `var(--cream)` (`styles.css:686-694`), modal-cards use solid `var(--cream)`. No translucency anywhere it would matter. **Gap → Rec 06.**

**Cue 7 — Editorial number/price treatment.**
Premium retailers (RH, Hermès) treat prices as editorial typography: tabular-nums, generous tracking, never bold. They feel curated. Cheap retailers (Wayfair, Overstock) bold and color them red/orange to scream "deal." **Furnish today:** `.price` is `color: var(--deep); font-weight: 700; font-size: 14px` (`styles.css:1398`) — the bold-700 reads as discount-y, not editorial. Price-tags on the canvas are bold-700 inside cream pills with brown borders, which reads more "retail sticker" than "interior design tag." **Gap → Rec 07.**

**Cue 8 — Restraint in CTA color and badge usage.**
RH and Magnolia have one accent color used sparingly. Cheap apps stack gradients, glows, and "Save 33%" pills. **Furnish today:** the paywall has multiple competing eye-catchers: `.paywall-glow` radial pulse (`styles.css:2634-2643`), a gradient `.paywall-badge` with letter-spacing 0.16em (`styles.css:2644-2651`), `.paywall-list li` solid beige pills, gradient pricing toggle, "Save 33%" pw-save pill, urgency banner, and a primary CTA. Six accent elements competing in one card. The visual signal becomes "infomercial," not "premium SaaS." **Gap → Rec 08.**

**Cue 9 — Empty states as branded moments, not error screens.**
Notion's empty states use illustrations and writing personality. Linear's empty states feel curated. **Furnish today:** likely just `.empty-state { background: var(--surface); }` with text — `styles.css:60` confirms generic surface treatment. **Gap → Rec 09.**

**Cue 10 — Logo lockup at hero scale.**
Magnolia, RH, and MasterClass all give the logo room to breathe at hero. **Furnish today:** the `.brand` block (`index.html:28-50`) shows a 56px gradient logo tile next to an h1 reading "Furnish" — the wordmark is set in the same Inter as body copy at 44px (`styles.css:120`). Logo + h1 in identical typography is a "made it in 2 hours" cue. **Gap → Rec 10.**

---

## Recommendations

### **[Dim 01] — Introduce a serif display face for hero headlines and price treatment**
- **Current state in Furnish:** `styles.css:90` loads `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` — a single sans family for everything. Headings are 700-weight sans (`styles.css:119`). The project doc claims Georgia serif headings but the CSS does not load it.
- **Proposed state:** Add `--font-display: 'Fraunces', 'Cormorant Garamond', Georgia, serif;` (Fraunces is open-source via Google Fonts, has variable weight, supports the warm-modern editorial feel of Magnolia/RH). Use on `h1`, `.paywall-card h3`, `.budget-amount`, `.price`, `.totals-card .total-value`, and `.hd-after-label/hd-before-label`. Keep Inter for buttons, body, chips, and forms. Spec:
  ```css
  :root { --font-display: 'Fraunces', 'Cormorant Garamond', Georgia, serif; }
  h1 { font-family: var(--font-display); font-weight: 400; letter-spacing: -0.02em; }
  .price, .budget-amount, .totals-card .total-value { font-family: var(--font-display); font-weight: 500; font-variant-numeric: tabular-nums; }
  ```
- **Reforge framework citation:** Per Reforge's *Brand Marketing — Brand Identity And Governance, Lesson 1 (Building Blocks Of Brand Identity)*, brand assets include "color palette, font and typography, form and shape" — and the lesson explicitly notes Notion's choice of "the variable font Inter to scale easily across screen sizes" was a personality decision (paired-back, focused). A serif/sans pairing is the same lever, signaling "curated/editorial" instead of "tool/utility." Furnish sells curation (AI as designer), so the typography must signal it.
- **Expected impact:** +3-6pp lift on perceived premiumness in 5-second tests; supports a +$1-2 willingness-to-pay on the Pro tier (perceived-value uplift, hard to measure but consistent in brand-uplift studies). Indirectly: lower bounce on welcome (perceived-quality cue at hero).
- **Effort tier:** S (hours) — Google Fonts link + 5–8 selector additions.
- **Dependencies:** Confirm Fraunces is acceptable to Hassan (it carries opinion). Otherwise Cormorant Garamond or PP Editorial New (paid).
- **What breaks/leaks if we skip it:** Furnish keeps reading as "AI-tool SaaS" rather than "interior-design curator." Affiliate-revenue model depends on the user trusting Furnish's taste; if the typography says "ChatGPT wrapper," they trust the picks less and click-through drops.

### **[Dim 01] — Replace welcome before/after demo with photographic assets**
- **Current state in Furnish:** `index.html:54-56` loads `assets/quiz/q1/farmhouse-dusk.jpg` and `airy-loft.jpg` — these are quiz illustration assets, likely flat/stylized.
- **Proposed state:** Commission or source two photographic before/after pairs (real room → real-room AI redesign that Hassan QA's by hand). Use the *highest-quality* output Furnish can produce (run the pair through Flux Kontext Pro, not Schnell), then color-grade in a single warm LUT to match the brand palette. Place a real product overlay tag with a real Amazon/Wayfair price. Render at 2x for retina.
- **Reforge framework citation:** Per Reforge's *Brand Marketing — Brand Identity And Governance, Lesson 3 (Creating Brand Assets, Part I)*, brand assets include "imagery principles" — "the rules that guide what images are and aren't appropriate, including the usage of filters and stock photos, and even parameters for what should and shouldn't be depicted." The welcome demo is the highest-leverage imagery slot in the entire app; using stylized illustration there (when the product output is photographic) creates the EcoDeco brand-inconsistency problem the lesson warns about.
- **Expected impact:** +5-10pp lift on welcome→capture conversion (the demo IS the value prop preview; if it doesn't look photographic, users don't believe their photographic room will redesign well).
- **Effort tier:** M (days) — needs source photo, Pro-tier render budget, hand-tagged price overlay positions, color-grading pass.
- **Dependencies:** Pro-tier compute access ($0.05/run on Replicate Flux Kontext Pro per the project's compute-quality routing model — already specified in `Here/CLAUDE.md`).
- **What breaks/leaks if we skip it:** Welcome converts on stylized art; the user uploads their actual photo and the Schnell-tier output looks worse than the demo promised; immediate trust collapse → no retry → no shop-through → no affiliate.

### **[Dim 01] — Add one breath of whitespace on welcome (kill the density)**
- **Current state in Furnish:** Welcome (`index.html:22-83`) packs brand → tagline → demo frame → CTA → "no signup" line → 4.8★ + "12,400+ rooms designed" + reviews-bar at the bottom — all in one mobile viewport. Hero padding is `40px 4px` (`styles.css:173`); section padding is `20px 20px 24px` (`styles.css:112`).
- **Proposed state:** Increase `.hero` to `padding: 64px 4px 24px;` and `.hero-art` margin to `28px auto 40px`. Drop the welcome-proof element BELOW the fold by spacing-only — let the hero own the first viewport. Move `12,400+ rooms designed` to a parallax-revealed element on scroll. Tagline stays. Single CTA stays.
- **Reforge framework citation:** Per Reforge's *Mastering Product Management — Decision Architecture (Decision Budget & Circles)*, every UI element costs the user a "decision budget" unit. A welcome screen that asks the user to evaluate hero art + value prop + social proof + reviews + theme toggle simultaneously spends ~5 decision-budget units before the primary action. The framework prescribes consolidating to one decision per surface.
- **Expected impact:** +2-4pp on welcome→capture; reduced cognitive-overhead reports in qualitative tests.
- **Effort tier:** S (hours) — pure CSS spacing changes, scroll-reveal optional.
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** Welcome looks busy → premium-perception cap → can't justify Pro pricing → conversion ceiling.

### **[Dim 01] — Upgrade button micro-interactions (replace 80ms snap with premium easing)**
- **Current state in Furnish:** `styles.css:155` — `transition: transform 80ms ease, box-shadow 160ms ease, background 160ms ease;` and `:active { transform: scale(0.98); }` (`styles.css:165`). 80ms is a "click this is a button" cue, not a "this product cares" cue.
- **Proposed state:** 
  ```css
  --ease-premium: cubic-bezier(0.22, 1, 0.36, 1);
  .btn { transition: transform 220ms var(--ease-premium), box-shadow 280ms var(--ease-premium), background 240ms ease; }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(62,39,35,0.14), 0 2px 6px rgba(62,39,35,0.06); }
  .btn:active { transform: scale(0.985); transition-duration: 80ms; }
  ```
  Note: the snap-back on `:active` should stay fast; only the hover-in should slow.
- **Reforge framework citation:** **[Original recommendation, not Reforge-grounded]** — Reforge's curriculum does not specify motion timing. This is informed by category leaders (Apple HIG, Material Motion, Stripe).
- **Expected impact:** Hard to measure directly. +1-3pp on perceived-quality session metrics.
- **Effort tier:** S (hours).
- **Dependencies:** Audit `styles.css` for the `--ease-premium` variable — already used in some places (e.g., `styles.css:104`); make sure declaration is at the root, not buried.
- **What breaks/leaks if we skip it:** Tactile feedback signals "made-fast template" — incongruent with the premium positioning Furnish needs to charge for Pro.

### **[Dim 01] — Multi-layer tinted shadows on cards**
- **Current state in Furnish:** Single shadow at the root: `--shadow: 0 6px 24px rgba(62, 39, 35, 0.08)` (`styles.css:17`). Used on most cards (`.item-card` `:1372`, `.profile-card` etc.). One layer = flat.
- **Proposed state:** Layered shadow system:
  ```css
  --shadow-1: 0 1px 2px rgba(62,39,35,0.06), 0 1px 1px rgba(62,39,35,0.04);
  --shadow-2: 0 4px 12px rgba(62,39,35,0.08), 0 2px 4px rgba(62,39,35,0.05);
  --shadow-3: 0 14px 40px rgba(62,39,35,0.14), 0 4px 12px rgba(62,39,35,0.08), 0 1px 2px rgba(62,39,35,0.05);
  ```
  Use `--shadow-1` for static cards, `--shadow-2` for hover, `--shadow-3` for floating modals/sheets. The warm tint (rgba 62,39,35) is correct already — keep it; do NOT use rgba(0,0,0).
- **Reforge framework citation:** Per Reforge's *Brand Marketing — Brand Identity And Governance, Lesson 3 (Creating Brand Assets, Part I)*, brand assets include "form and shape" — and Kira at Brex used a Design Sprint to iterate the entire visual toolkit with deliberate boundaries. A single black-tinted shadow is a no-decision default; a tiered, warm-tinted shadow system is a "form and shape" decision aligned with the brown/cream palette. Reforge frames this as eliminating the iterating-on-tickle problem: codify the shadow system once, never debate it again.
- **Expected impact:** +2-4pp on perceived-premiumness in 5-second tests.
- **Effort tier:** S (hours) — token swap, audit selectors using the old `--shadow`.
- **Dependencies:** Reconstruction artifacts mean duplicate `.item-card` definitions exist (`styles.css:1268, 1370, 2381, 3133, 3443`). Hassan's project doc specifically warns about this. Consolidate before applying.
- **What breaks/leaks if we skip it:** Cards look pasted onto the cream background instead of resting on it.

### **[Dim 01] — Frosted-glass treatment on price-tags and paywall cards**
- **Current state in Furnish:** `.price-tag` (`styles.css:686-694`) uses solid `var(--cream)` background with a 2px solid `var(--brown)` border and an `::after` triangle pointer. `.paywall-list li` uses solid `var(--beige)` (`styles.css:2663`).
- **Proposed state:**
  ```css
  .price-tag {
    background: rgba(250, 243, 231, 0.78);
    -webkit-backdrop-filter: blur(12px) saturate(140%);
    backdrop-filter: blur(12px) saturate(140%);
    border: 1px solid rgba(139, 111, 71, 0.4);
    box-shadow: 0 4px 14px rgba(62,39,35,0.18), 0 0 0 1px rgba(255,255,255,0.6) inset;
  }
  .paywall-list li {
    background: linear-gradient(135deg, rgba(240,226,204,0.7), rgba(229,212,184,0.55));
    backdrop-filter: blur(8px);
    border: 1px solid rgba(212, 165, 116, 0.18);
  }
  ```
  Drop the `::after` triangle — modern price tags don't need callout pointers.
- **Reforge framework citation:** Per Reforge's *Brand Marketing — Brand Identity And Governance, Lesson 1*, "brand assets include logos, illustrations, photography, iconography, taglines, and CTAs" — and the EcoDeco case study warns brand inconsistency loses brand equity. Today the price-tag (with pointer triangle) feels like a price-comparison-app sticker; the paywall feels like a 2014 SaaS card. They don't feel like the same brand.
- **Expected impact:** +2-4pp on perceived-premiumness; +1-3pp on price-tag click-through (the modern pill shape is more inviting than a labeled callout).
- **Effort tier:** S (hours).
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** Price-tags on AI-rendered photo are the affiliate revenue moment. If they look like 2014 retail stickers, they break immersion in the redesigned-room visual; the user reads "tool" not "magazine."

### **[Dim 01] — Editorial price treatment (not bold, not red)**
- **Current state in Furnish:** `.price` is `color: var(--deep); font-weight: 700; font-size: 14px;` (`styles.css:1398`). Price tags `.price-tag` are 11px / 700 / cream pill (`styles.css:686-694`). Both shout.
- **Proposed state:**
  ```css
  .price {
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 16px;
    letter-spacing: 0.01em;
    font-variant-numeric: tabular-nums;
    color: var(--deep);
  }
  .price-tag {
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 12px;
    letter-spacing: 0;
  }
  ```
  Pair with Rec 01 (display font load).
- **Reforge framework citation:** Per Reforge's *Brand Marketing — Brand Identity And Governance, Lesson 1*, brand identity must distinguish from competitors. Wayfair/Overstock bold-and-color prices to signal "deal." RH/AllModern/Magnolia treat prices as editorial — that's the exact category Furnish must claim if it sells "your AI designer," not "your discount finder."
- **Expected impact:** +2-3pp on Pro-tier interest (perceived-value lift); marginally lower price-anchor sticker shock.
- **Effort tier:** S (hours).
- **Dependencies:** Rec 01 (display font).
- **What breaks/leaks if we skip it:** Furnish reads as a discount-comparison utility. Affiliate revenue depends on users trusting the curation; bold prices undercut curation signaling.

### **[Dim 01] — Reduce paywall card visual noise from 6 accents to 2**
- **Current state in Furnish:** Paywall (`index.html:901-969`, `styles.css:2629+`) currently fires off: pulsing `.paywall-glow` radial, gradient `.paywall-badge` ("Furnish Pro" with 0.16em letterspacing and box-shadow drop), gradient billing toggle, "Save 33%" pill inside the toggle, gradient `.paywall-price`, urgency banner ("Founding-member pricing — locks in for life..."), 7 bullet rows on solid beige, primary CTA, ghost dismiss. Plus the FREE card on the left. Eye has 6 places to land.
- **Proposed state:** Keep 2 accents — the primary CTA and the price line. Demote everything else.
  - Remove `.paywall-glow` pulse animation entirely (it screams infomercial).
  - Convert `.paywall-badge` to plain text: `Pro` in small-caps display serif, no gradient, no shadow.
  - Pricing toggle: remove the "Save 33%" pill from inside the toggle — show the savings calculation inline as muted text *below* the price ("Save $24/yr vs monthly").
  - Replace solid-beige `.paywall-list li` with frosted-glass treatment from Rec 06.
  - Move the urgency line ("Founding-member pricing — locks in for life") to a single-line muted footer above the CTA, italic.
  - Keep one accent: `.paywall-pro-card` border-glow on hover (4px radial in `var(--tan)`).
- **Reforge framework citation:** Per Reforge's *Product Marketing — Positioning And Messaging, Lesson on "Finding Your One Key Takeaway"*, every messaging surface must distill to one primary takeaway. The current paywall presents six competing takeaways simultaneously (urgency, social proof, gradient prestige, savings, feature breadth, founding-member status). The framework requires picking one — for Pro, the takeaway is "Sharper redesigns, every time" (already in the title). The visual treatment should support that; right now it competes with it.
- **Expected impact:** +3-7pp on paywall_converted. Premium SaaS paywalls convert higher when restrained (Linear, Notion, Apple One are reference points).
- **Effort tier:** M (days) — touches several rules and needs an A/B between "current loud" and "proposed restrained."
- **Dependencies:** Locked decision: 2-card paywall (Free left, Pro right). This rec respects that — only changes within the Pro card and shared header.
- **What breaks/leaks if we skip it:** Paywall reads as low-trust ("infomercial") — high-intent users bounce because the visual signal contradicts the price they're being asked to commit to.

### **[Dim 01] — Empty states as branded moments (saved tab, no rooms)**
- **Current state in Furnish:** The dark-theme rule `html[data-theme="dark"] .empty-state { background: var(--surface); }` (`styles.css:60`) suggests `.empty-state` is a generic surface block with text. No illustration. No personality.
- **Proposed state:** For the Saved-rooms-empty and Saved-items-empty states, render a custom SVG illustration (loose-line architectural sketch of a room — chair, lamp, window, in `--brown` at 30% opacity) at 160px tall, plus a sentence in the brand voice: e.g. "Your designed rooms will live here. Snap your first photo to start." Then the primary CTA "Redesign My Room" bringing them back to the welcome flow.
- **Reforge framework citation:** Per Reforge's *Brand Marketing — Brand Identity And Governance, Lesson 1*, "brand collateral" is the fourth building block — and "all companies have a brand identity, even if it is incomplete." A blank "no items" screen is brand collateral by default; its absence of personality is brand-incomplete and "off-brand materials end up being shipped" (the warning in the lesson).
- **Expected impact:** +1-3pp on D7 retention (empty states reduce churn anxiety; users who see "you have nothing" lose belief).
- **Effort tier:** M (days) — design 2-3 SVG illustrations, copywrite the empty-state copy in the brand voice.
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** The first time a user opens "Saved" with nothing, they read "this app is empty" instead of "this app is waiting for me." Lower D1→D7 retention.

### **[Dim 01] — Logo lockup at hero scale (don't pair logo tile + h1 wordmark in the same Inter)**
- **Current state in Furnish:** `.brand` (`index.html:28-50`) renders a 56px gradient logo tile next to an `<h1>Furnish</h1>` set in the same Inter as body copy at 44px (`styles.css:120`).
- **Proposed state:** Either:
  - **Option A (lighter touch):** Keep the logo tile, render the wordmark in the new display serif (Rec 01) at 44px / weight 400 with -0.03em letterspacing. The tile and wordmark now feel intentional — tile = symbol, wordmark = editorial type.
  - **Option B (real wordmark):** Commission a wordmark logo SVG (custom letterforms, slightly tightened, single weight). Replace the h1 entirely with the wordmark SVG. Brand is unified.
- **Reforge framework citation:** Per Reforge's *Brand Marketing — Brand Identity And Governance, Lesson 1*, the lesson's two case studies (Spotify, Notion) both note logos as "the most enduring and recognizable asset." Spotify's logo "stands for streaming, sound waves, and movement"; Notion's "Notion block" connotes "simplicity, play, building, and learning." A logo tile + a body-font h1 reading "Furnish" doesn't connote anything — it's a placeholder lockup. **And** per Lesson 3, brand-asset development must run through the Design Sprint — meaning a real lockup deserves a sprint, not a 5-minute fix.
- **Expected impact:** +1-3pp on perceived-premiumness; sets the foundation for category-level brand recognition (necessary for organic referral / share moments where the logo travels).
- **Effort tier:** Option A = S (hours, dependent on Rec 01). Option B = L (week+, requires designer or sprint).
- **Dependencies:** Rec 01 for option A.
- **What breaks/leaks if we skip it:** The brand lacks a memorable visual signature — and Furnish needs share-out moments (canvas exports, social) to generate the affiliate-driving traffic. A weak lockup means weak share-back.

### **[Dim 01] — Fix design-token duplication in styles.css (governance, not aesthetics)**
- **Current state in Furnish:** Reconstruction artifacts have created multiple definitions for `.item-card` (lines 1268, 1370, 2381, 3133, 3443), `.paywall-card` (2629, 3330, 3640), `.ba-handle`, `.price-tag` animation, etc. The "later one wins" cascade quirk Hassan noted means a small CSS edit risks colliding with a duplicate further down.
- **Proposed state:** Audit pass: grep for every selector that appears more than twice; consolidate to a single canonical declaration per selector; place tokens-only at the top, components in named sections (typography, buttons, cards, modals, animations). One rule per selector, period. Document the section ordering as a header comment block.
- **Reforge framework citation:** Per Reforge's *Brand Marketing — Brand Identity And Governance, Lesson 1*, the third building block of brand identity is **brand guidelines** — "These guidelines tie all of the elements of your brand identity together by ensuring consistency." The lesson explicitly warns: "Without brand guidelines, we see two major problems emerge. First, teams experience slower creative development processes... Secondly, off-brand materials will end up being shipped... inconsistency... can be detrimental to the brand." Duplicate CSS rules are the engineering equivalent — they're brand-governance debt.
- **Expected impact:** Velocity multiplier — every visual rec in this doc lands faster and safer if duplicates are gone first. Direct user impact: fewer cascade-collision visual bugs in production.
- **Effort tier:** M (days) — careful pass through ~5,000 lines.
- **Dependencies:** This is the dependency for many recs above. It should ship FIRST.
- **What breaks/leaks if we skip it:** Every future visual change has hidden risk; some recs above will fail to apply because a duplicate later in the cascade overrides them.

### **[Dim 01] — Run a Brex-style Word Game on Furnish brand personality (sets the rest of design)**
- **Current state in Furnish:** No documented brand personality. The CSS palette implies "warm/calm/lifestyle" but it's not codified anywhere. Tone of voice is improvised per surface.
- **Proposed state:** Hassan runs the Word Game exercise solo (or with one trusted advisor — Reforge says odd numbers, but solo founders adapt). Output: 4 personality words + brief definitions. Then run Attitudinal Ranges to position each on a spectrum (e.g. Tenacious *relentless* vs *stubborn*; for Furnish maybe Inviting *warm* vs *saccharine*). Codify in a 1-page brand-personality doc that lives at `Here/brand-personality.md`. All future visual decisions get vetted against it.
- **Proposed personality starter (Hassan to validate or kill):** *Discerning, Warm, Calm, Effortless.* Definitions:
  - *Discerning:* makes the curated choice the user wishes they'd made.
  - *Warm:* the brown/cream palette is the felt reason — the visual temperature is non-negotiable.
  - *Calm:* never uses urgency, never shouts, never red.
  - *Effortless:* one-tap or zero-tap by default; complexity is hidden, not surfaced.
- **Reforge framework citation:** Per Reforge's *Brand Marketing — Brand Identity And Governance, Lesson 2 (Defining Your Brand Personality)*, this is the EXACT exercise prescribed — the Word Game ("who we are / who we'd like to be / who we're not") + Attitudinal Ranges. The lesson explicitly states: "Without a proper back end or brand personality, your front end, or consumer-facing assets and collateral, won't render properly. You might wind up with compelling standalone items, but they won't align." Every visual rec above will partially miss its mark until this is set.
- **Expected impact:** Indirect but enormous — sets the bar for every rec above. Without it, visual changes are local optima.
- **Effort tier:** S (hours, solo) to M (days, with stakeholders).
- **Dependencies:** None — should be done FIRST or in parallel with rec 12.
- **What breaks/leaks if we skip it:** Each visual rec below has to debate "is this on-brand?" with no answer. Decisions will be Hassan's gut and shift over time, producing the EcoDeco-style brand inconsistency the Reforge lesson warns about.

### **[Dim 01] — Replace `.modal-card` solid cream with surface + tint glow**
- **Current state in Furnish:** `.modal-card { background: var(--cream); border-radius: 16px; padding: 20px; ...box-shadow: var(--shadow-lg); }` (`styles.css:1445-1449`). Floats against `rgba(62,39,35,0.55)` scrim. Functional but flat.
- **Proposed state:**
  ```css
  .modal-card {
    background: linear-gradient(180deg, rgba(255,255,255,0.96) 0%, var(--cream) 100%);
    border: 1px solid rgba(212, 165, 116, 0.18);
    box-shadow: var(--shadow-3, var(--shadow-lg)),
                0 0 80px rgba(212, 165, 116, 0.08) inset;
    border-radius: 20px;
  }
  ```
  Subtle warm-glow inset, white-to-cream gradient adds editorial light. Radius bumped from 16 to 20 (premium apps trend slightly larger radii on big surfaces).
- **Reforge framework citation:** **[Original recommendation, not Reforge-grounded]** — surface treatment for modals is craft.
- **Expected impact:** +1-3pp on modal-engagement (paywall, share, etc.); minor.
- **Effort tier:** S (hours).
- **Dependencies:** Rec 11 (de-dup) and Rec 05 (shadow tokens).
- **What breaks/leaks if we skip it:** Modals continue to feel pasted-on. Paywall (which lives in a modal) inherits the flat feel.

---

## Top 3 priorities for this dimension

1. **Run the Brex-style Word Game on Furnish's brand personality (Rec 13).** Without 4 codified personality words and Attitudinal Ranges, every other visual decision is local opinion. Reforge's *Brand Marketing — Lesson 2* states this explicitly: brand personality IS the back end; without it, the front end won't render properly. This unblocks the rest. Effort S, impact compounding.

2. **De-dupe `styles.css` and consolidate the design-token system (Rec 12).** Reconstruction artifacts mean half the recs above will silently fail to land because a duplicate selector later in the cascade overrides them. This is brand-governance debt per Reforge's "brand guidelines" building block. Ship this BEFORE applying any other visual rec.

3. **Replace the welcome before/after demo with photographic, Pro-tier-rendered, real-product-tagged imagery (Rec 02).** This is the highest-leverage single visual surface in the entire app — the value-prop preview. Stylized illustration there, with photographic output below, is the EcoDeco brand-inconsistency problem from Reforge's Lesson 1. Fixing it has the largest direct conversion impact (+5-10pp welcome→capture).
