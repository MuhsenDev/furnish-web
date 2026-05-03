# Furnish. Document 2 of 11: Visual Design System

**Purpose:** Define every visual decision for furnish.live so Claude Code can build a cohesive, crafted site without inventing taste. This document is the source of truth for color, typography, imagery, layout, motion, and component aesthetics.

**Audience:** Claude Code (primary executor), front-end engineers, designers iterating later.

**Status:** Locked unless explicitly revised.

**Reference standards:** This site should feel as crafted as **fromanother.love** (motion, editorial pacing, cinematic imagery), as polished as **Linear** (precision, clean type, tasteful gradients), and as warm as **Snowe / Article / Heirloom** (real product imagery, livable rooms, premium-but-accessible). Nothing on this list is decorative, each reference is invoked at specific moments below.

---

## 0. PREREQUISITE: Extract values from the existing app

**Before writing any CSS, Claude Code must extract the canonical design tokens from the existing Furnish app codebase.** The website is an extension of the app, not a separate brand. The app is the source of truth.

Steps:

1. Open `C:\Users\Hassan\Downloads\Claude\Here\app.css` (and any other CSS file referenced from `app.html`).
2. Find the `:root` CSS custom properties block. Extract all `--color-*`, `--font-*`, `--radius-*`, `--shadow-*`, `--space-*` values verbatim.
3. Look at `app.html` for any inline style references and the loaded font URLs (likely Google Fonts or Adobe Fonts links in `<link>` tags).
4. Take 4-6 screenshots of the live app at key moments (home, quiz screens, results screen, share canvas), note dominant colors, type weights, button shapes, spacing rhythms.
5. Document the extracted tokens in a file `src/styles/tokens.css` for the new site.

These extracted tokens become the **base layer** of the marketing site's design system. The marketing site adds:
- Larger type scale (the app is mobile-first; the site is responsive across desktop)
- Editorial layout primitives (full-bleed sections, multi-column rhythms, not in the app)
- Motion system (GSAP-based scroll choreography, not in the app)
- A few new utility colors specifically for marketing (e.g., a subtle "magic" gradient used only in hero moments)

**If Claude Code cannot find a token in the app, default to the closest equivalent in this document and flag it for Hassan's review.** Do not invent colors silently.

---

## 1. Color System

### 1.1 Inheritance from the app

The app's color palette IS the website's color palette. Whatever the app calls its primary surface, primary text, primary accent, secondary accent, etc., those are the canonical names. The website does not introduce a new brand color.

What Claude Code is looking for in the app's CSS (typical naming patterns to grep for):

```
--color-bg, --color-background, --background
--color-surface, --color-card
--color-text, --color-foreground, --color-ink
--color-text-secondary, --color-muted
--color-primary, --color-accent, --color-brand
--color-success, --color-warning, --color-error
--border-color, --color-border
```

Extract verbatim. Use as the website's base palette.

### 1.2 Marketing-specific additions

The marketing site adds the following layer on top of the app's palette. These are NEW utilities for marketing surfaces only, they do not retroactively apply to the app.

**Hero gradient**, used ONCE per page maximum, only in the hero section:
- A soft, atmospheric gradient that conveys "magic happening." Direction: 135deg or radial.
- Built from the app's accent color at 12-18% opacity over the app's bg color at 100%.
- Example syntax (Claude Code adapts to actual extracted values):
  ```css
  --gradient-hero: radial-gradient(
    ellipse 80% 60% at 50% 30%,
    hsl(from var(--color-accent) h s l / 0.15) 0%,
    transparent 70%
  );
  ```
- This is the ONLY decorative gradient on the site. Everywhere else, surfaces are solid.

**Editorial accent (rare)**, for marketing-only callouts (testimonial pull-quotes, statistic highlights):
- Same hue as the app's accent but desaturated 20-30% and lightened. Used as a tinted background block, never as text.

**Pure black (#000000) and pure white (#FFFFFF)** are explicitly NOT used. Always use the app's near-black ink and near-white surface. Pure values feel cheap; near-values feel intentional. (This is a Linear/fromanother trick, they never use pure black even though the eye reads it as black.)

### 1.3 Color usage rules

1. **One accent color per page.** If the app has a primary accent (e.g., a coral, a forest green, whatever), it's THE accent. Don't introduce a second accent for variety. Variety comes from imagery and layout, not from a second color.
2. **Borders are always low-contrast.** Border tokens should be ~8-12% opacity of the ink color. Hard borders are visually loud and don't fit the aesthetic.
3. **Backgrounds layer in three tiers max:** page bg (lightest), section bg (a touch darker or same), card bg (subtly elevated). No more than three tiers in any viewport.
4. **Text on imagery uses overlays, not text shadows.** When white text sits on a generated room photo, add a 20-40% black gradient overlay behind it. Never use text-shadow CSS.
5. **No "AI gradients."** Reject the rainbow-meta-purple cliché that every AI startup uses. Furnish is a design product, not a tech demo.

---

## 2. Typography

### 2.1 Inheritance from the app

Same rule as color: extract the app's font stack first. The website type system extends, doesn't replace.

What Claude Code is looking for:

```
--font-display, --font-heading, --font-sans, --font-body
font-family: declarations in :root or in body
<link href="https://fonts.googleapis.com/...">
@font-face declarations
```

Extract verbatim. The website uses the same font families the app uses.

### 2.2 If the app uses a single sans-serif

If the app is sans-serif throughout (likely, modern apps usually are), the website pairs the app's sans with one editorial-display companion for marketing-only headers. The companion is a SECOND font, not a replacement.

**Recommended pairings (in priority order if Claude Code needs to add a display font):**

1. **Inter (or app's sans) + Fraunces**. Fraunces is a modern variable serif with optical sizing and grade. Used for marketing-only display headers. Linear-quality.
2. **App's sans + GT Sectra Display**, premium editorial serif if the budget allows (Sectra is paid).
3. **App's sans + IBM Plex Serif**, free, editorial, technically refined.
4. **App's sans only, no second font**, if Hassan wants to keep it minimal. Use a much larger size + tighter tracking on the app's sans for display moments.

**Default decision (locked unless Hassan overrides):** App's sans for body and UI. Fraunces (variable, free from Google Fonts) for marketing-only display headers (h1 at hero, big section titles).

### 2.3 Type scale

The marketing site uses a fluid type scale (clamp-based) so it scales gracefully from mobile to ultra-wide.

**Display tier (Fraunces or app's sans at extreme size):**
- `--text-display-xl: clamp(3rem, 8vw, 7.5rem);`, hero headline only, used 1x per page
- `--text-display-l: clamp(2.5rem, 5vw, 5rem);`, major section titles (3-5 per page max)
- `--text-display-m: clamp(2rem, 4vw, 3.5rem);`, sub-section titles

**Body tier (app's sans):**
- `--text-body-xl: clamp(1.25rem, 1.5vw, 1.5rem);`, hero subheadline / lead paragraphs
- `--text-body-l: 1.125rem;`, emphasized body / blockquotes
- `--text-body-m: 1rem;`, default body
- `--text-body-s: 0.875rem;`, captions, metadata, footer

**Letter spacing rules:**
- Display headers: tight tracking (`letter-spacing: -0.02em` to `-0.04em`).
- Body text: default tracking.
- All-caps eyebrow labels (rare, used for section markers): wide tracking (`letter-spacing: 0.08em to 0.12em`).

**Line-height rules:**
- Display: 0.95 to 1.05 (tight, dramatic).
- Body: 1.5 to 1.65 (readable, breathy).
- Captions: 1.4.

### 2.4 Hero headline treatment

The hero h1 deserves special treatment. It IS the brand moment. Specifically:

```
"Take a photo. Furnish does the rest."
```

Render as a stack with deliberate line breaks:

```
Take a photo.
Furnish does
the rest.
```

- Each line is its own word-set.
- Line 1 ("Take a photo.") slides in from below on load.
- Line 2 ("Furnish does") slides in 200ms after.
- Line 3 ("the rest.") slides in 200ms after that.
- Use Fraunces (or display font) at `--text-display-xl`.
- Tracking: `-0.03em`.
- Line-height: 0.92.
- Color: ink (app's near-black).

This is the "first 2 seconds" that imprints the brand. Worth the choreography.

### 2.5 Type DON'Ts

- Never center-align body paragraphs. Center-align is for hero h1 and small marketing eyebrows only.
- Never justify text. (Creates rivers of whitespace.)
- Never use italic for emphasis in body. Use weight (font-weight 600+) or a colored accent.
- Never mix more than 2 type families on the site total.

---

## 3. Imagery System

### 3.1 The hero of imagery: AI-generated rooms

Per Hassan's direction, **AI-generated rooms are the only image content on the site.** No stock photography. No people. No abstract illustrations. The product IS the imagery.

This is a high-confidence call because:
- Every room is unique → infinite imagery supply
- Every room is on-brand by construction (Furnish made it)
- It demonstrates the product on every page
- It avoids the "stock-photo-of-happy-couple" cliché

### 3.2 Image curation rules

Not every generated room is worthy of the marketing site. Establish a curation gate:

**A room qualifies for the marketing site if:**
1. The geometry is photo-realistic (no warping, no impossible angles)
2. The lighting reads as "real interior photography" (bright, naturalistic, dramatic shadows when warranted)
3. Items in the room are coherent (no two TVs, no floating furniture, no AI-cluttered nonsense)
4. The vibe is recognizable (you can tell at a glance: "scandinavian," "industrial," "art-deco")
5. The composition has a clear focal point

**A curated set for launch:** 24 generated rooms across 6 styles × 4 room types. Used as:
- 6 in the hero gallery (one per style)
- 12 in the dedicated "See It Yourself" section (case-study format, before/after pair)
- 6 reserved for blog post header images and social sharing

**Maintenance cadence:** Add 4-8 new curated images per month post-launch as more user generations come in. Keep it fresh.

### 3.3 Image treatment rules

**On the marketing site, images are presented in three distinct treatments. Each has a strict use case:**

**Treatment A. Full-bleed cinematic.**
- Image fills the viewport edge-to-edge (no padding, no border, no card)
- Used for: hero, major section transitions, "See It Yourself" reveals
- Often paired with text overlay (uses the gradient overlay rule from §1.3.4)
- Maximum 3 per page

**Treatment B. Editorial card.**
- Image inside a rounded container (border-radius from app tokens)
- Padding around the image inside the card (16-32px depending on size)
- Caption below the image with metadata (style name, room type, "Designed in 8 seconds")
- Used for: gallery grids, blog post lists
- Most images on the site use this treatment

**Treatment C. Comparison split.**
- Before (original photo) and after (Furnish redesign) shown side-by-side or with a draggable slider
- Used for: the "How It Works" section, dedicated "Sample Gallery" page
- Slider interaction is one of the site's hero motion moments

### 3.4 What the site DOESN'T show as imagery

- No people. (Hassan locked this. Rooms-only.)
- No close-ups of individual products. (That's the app's job; the site shows whole rooms.)
- No screenshots of the app UI itself. The site demonstrates the OUTPUT of the app, not the app interface. (Exception: one "How It Works" diagram showing the photo→prompt→redesign flow can use stylized UI mocks, but kept minimal.)
- No before-Furnish "ugly room" shots that mock the user. The "before" in comparison shots is neutral, not ugly. We're not making fun of anyone's home.

---

## 4. Layout System

### 4.1 Multi-density rhythm

Hassan's instruction: "A, C, D, and a little B", so all layout densities are in play. The discipline is **using each density in the right section**, not mixing them arbitrarily within a section.

**Page rhythm pattern (locked):**

| Section | Layout density | Why |
|---|---|---|
| Hero | A (spacious) | Establish brand, breathe, headline owns the moment |
| Value prop | A (spacious) | Three cards, lots of whitespace, slow scroll |
| Sample gallery | C (card-based) | Grid of generations, predictable, browseable |
| How It Works | D (asymmetric) | Editorial diagram with off-center elements |
| Testimonial / proof | B (multi-column) | Magazine-style if testimonials land; otherwise skip |
| Featured rooms | A or D | Cinematic, full-bleed images with text floats |
| Footer / CTA | A (spacious) | Final breath before exit, no clutter |

This rhythm, spacious → grid → editorial → spacious, is the fromanother.love trick. Density variation creates pacing. The site never feels monotonous because each section is paced differently.

### 4.2 Grid system

**Container max-widths:**
- `--container-narrow: 640px;`, body copy in editorial sections
- `--container-default: 1200px;`, most marketing sections
- `--container-wide: 1440px;`, gallery grids
- `--container-bleed: 100%;`, full-bleed cinematic sections

**Grid column count by viewport:**
- Mobile (< 640px): 1 column with 16-24px gutters
- Tablet (640-1024px): 6-column grid with 16px gutters
- Desktop (1024-1440px): 12-column grid with 24px gutters
- Ultra-wide (> 1440px): 12-column grid centered in `--container-wide` with `--container-bleed` for full-bleed sections

**Card grid for sample gallery (Treatment B images):**
- Mobile: 1 card per row
- Tablet: 2 cards per row
- Desktop: 3 cards per row (default) or 2 cards per row for emphasis
- Cards: 3:2 or 4:3 aspect ratio (depending on the source image's natural ratio)

### 4.3 Spacing scale

Use the app's spacing tokens. Add a marketing-specific scale on top:

- `--space-section-y: clamp(4rem, 10vh, 8rem);`, vertical padding on full sections
- `--space-section-y-tight: clamp(2rem, 6vh, 4rem);`, denser sections (e.g., back-to-back proof points)
- `--space-block-y: clamp(2rem, 5vh, 4rem);`, between blocks within a section

Marketing sites need more breathing room than apps. The app's section padding is probably too tight for desktop marketing surfaces.

---

## 5. Motion System

This is where the fromanother.love + Linear ambition shows up. Motion is not decoration, it's the brand.

**IMPORTANT:** This section establishes motion **principles, library choice, and the named motion moments** at a high level. The full technical specification for every animation, including GSAP timeline architecture, easing curves per interaction, scroll-trigger orchestration, mobile adaptations, performance budgets per animation, and reusable motion library code, lives in **Document 3: Animation System**. Document 2 names the moments. Document 3 specifies how to build them.

### 5.1 Motion principles

1. **Motion serves clarity, not novelty.** Every animation has a job: directing attention, signaling state change, revealing content at the right moment. Never animate "because we can."
2. **Easing matters more than duration.** Use natural easing curves (`cubic-bezier(0.22, 1, 0.36, 1)` is the default. Linear's signature). Avoid linear easing.
3. **Reduce motion respect.** All non-essential animations check `prefers-reduced-motion` and degrade to instant. (Accessibility is non-negotiable.)
4. **Mobile-first restraint.** Big hero animations get scaled down on mobile (smaller transforms, shorter durations). Don't make a phone struggle.

### 5.2 The motion library

**For furnish.live, Claude Code uses GSAP (GreenSock).** Specifically:

- `gsap` (core)
- `gsap/ScrollTrigger` (scroll-driven animations)
- `gsap/Flip` (layout-shift animations, used for the before/after compare slider)

GSAP is the same library fromanother.love uses. License: free for personal/non-commercial use; Furnish marketing site qualifies. (When Furnish becomes a commercial app generating revenue, GSAP requires a Business Green license, ~$99/year, factor in.)

Alternative if GSAP licensing is a concern: **Framer Motion** (React-only). Free, MIT-licensed. Slightly less powerful for scroll choreography but covers 80% of the use cases.

**Locked decision:** GSAP for the marketing site. Get the license when Furnish launches commercially.

### 5.3 Motion moments (specified)

Below are the choreographed moments that define the site's feel. Each is a hero motion moment. Claude Code implements these specifically.

**Moment 1: Loading sequence (1.5-2.5 seconds)**
- On first page load, a custom loader appears (NOT the browser default).
- Background: page bg color.
- Center: word "Furnish" in display font, slowly fading in.
- Below: thin horizontal line that grows from 0% to 100% width over 1.5 seconds (the "loading bar" but elegant).
- When site is ready, "Furnish" splits and animates to its position in the navbar; the loading line fades; the hero content reveals.
- This is fromanother.love's "loading page as design element" pattern.

**Moment 2: Hero reveal (on load complete)**
- Hero image fades in from 0% opacity to 100% over 800ms.
- Hero headline lines (3 lines) animate up sequentially, each line slides up 30px while fading in. Stagger: 200ms between lines.
- Subheadline fades in 600ms after the last headline line.
- CTA button fades in 200ms after subheadline.

**Moment 3: Scroll-triggered section reveals**
- Each major section's content animates in as it enters the viewport.
- Pattern: content starts 40px below its natural position, opacity 0. As section reaches 75% of viewport, content slides up to natural position and fades in over 600ms.
- Stagger items within a section by 100ms (e.g., 3 cards slide in, each 100ms after the previous).

**Moment 4: Before/after compare slider (the "wow" moment)**
- A draggable vertical slider over a paired before/after image.
- User drags left/right to reveal more of the before or the after.
- On viewport entry, the slider auto-animates from 50% to 80% (showing more of the "after") to demonstrate the interaction, then settles back to 50%.
- This is THE moment, used 1-3 times per page, never overused.

**Moment 5: Navigation menu**
- Default nav is minimal, just "Furnish" wordmark on the left, and a hamburger / "Menu" text on the right.
- Click "Menu": the nav expands to a full-screen takeover with large links (Home, How It Works, Gallery, Blog, Get the App).
- The takeover slides in from top with each link staggered (50ms apart).
- Click outside or on an X: takeover slides back up.
- This is fromanother.love's nav pattern, minimal default, dramatic full takeover.

**Moment 6: Hover states (desktop only)**
- Cards: subtle lift (`transform: translateY(-4px)`) + slight shadow increase. 200ms ease.
- Buttons: background color shift + slight scale (1.02). 150ms ease.
- Links: underline reveals from left to right. 250ms ease.

**Moment 7: Page transitions (when navigating between pages)**
- Optional but high-craft: a brief overlay slides in from top (using app's accent color), reveals briefly, slides out as the new page loads.
- 600-800ms total.
- Without this: standard page-load-into-loading-sequence is fine. Page transitions can be a Phase 2 enhancement.

### 5.4 What NOT to animate

- Body paragraph reveals (overdone, slows reading).
- Footer content (no animation needed, user has decided to leave anyway).
- Form inputs (Apple Sign-In, etc., keep crisp, no playful bounces).
- Image lazy-load (use blur-up technique, see §5.5 below, but no scale/rotate).

### 5.5 Image lazy-load

For images below the fold:
- Use a 20px blurred LQIP (low-quality image placeholder) as the initial paint.
- As the full image loads, fade the LQIP out and the full image in over 400ms.
- This is Next.js's `<Image>` component default behavior with `placeholder="blur"`. Just use it correctly.---

## 6. Component aesthetics

### 6.1 Buttons

**Primary button** (the one CTA per section, "Get the App" / "Try Furnish"):
- Background: app's accent color
- Text: contrasting ink (usually white if accent is dark, near-black if accent is light)
- Padding: `0.875rem 1.75rem` (14px / 28px)
- Border-radius: from app tokens (likely 8-12px based on app's design language)
- Font-weight: 600 (medium-bold, not heavy)
- No border
- Subtle shadow on default state, lifted shadow on hover

**Secondary button** ("Learn More" / "See Examples"):
- Background: transparent
- Border: 1px solid ink at 12% opacity
- Text: ink color
- Same padding and radius as primary
- On hover: background fills with ink at 6% opacity

**Tertiary / link-style** (in body copy):
- Text: app's accent color
- Underline on hover only
- No padding, no background

### 6.2 Cards

**Image card (Treatment B):**
- Background: app's surface color (slightly elevated from page bg)
- Border-radius: from app tokens
- Image inset: 12-16px around image inside card
- Caption below image: 12-16px padding
- Subtle border: 1px solid border-color at 8% opacity
- Subtle shadow: small, low-blur shadow giving lift without drama

**Content card (testimonial, statistic):**
- Same surface treatment as image card
- More generous internal padding (24-32px)
- Often centered text, larger type for emphasized stats

### 6.3 Forms (mostly absent, but waitlist might exist)

Per Hassan: "for now the website will be a landing/marketing page", so forms are minimal. If a waitlist email capture exists:

- Single field, large, no label (placeholder only: "your@email.com")
- Inline submit button to the right (or stacked on mobile)
- Border: 1px solid ink at 16% opacity, becomes accent color on focus
- No drop shadow, no card around it, just the field and button

### 6.4 Footer

The footer is the final breath. Don't over-design it.

- Three columns on desktop (collapses to 1 on mobile):
  1. Furnish wordmark + brief tagline + "Available on iOS [App Store badge]"
  2. Site links (How It Works, Gallery, Blog, Privacy, Terms)
  3. Contact: email + social (X / Instagram / TikTok if applicable)
- Background: subtly different from page bg (slightly darker or lighter, depending on whether we're on a light or dark theme)
- Padding: generous, 80-120px top padding, 40-60px bottom
- Copyright + small print at the very bottom: light, low-contrast, small type

---

## 7. Iconography

**Locked: Use Lucide icons only.** They're MIT-licensed, modern, consistent stroke width, render well at multiple sizes. Same family used in many premium products (including parts of Linear).

- Default size: 20px (in body text), 24px (in buttons), 16px (in metadata).
- Stroke width: 1.5 (the default, feels balanced).
- Color: inherits from text color.

**Custom icons NOT to make:**
- Don't make a custom Furnish app icon for use on the website. The actual iOS app icon (designed in Phase E) is the only Furnish symbol used on the site.

**Icons absent from the site:**
- No emoji as icons (looks unprofessional in this aesthetic context).
- No iconography for AI / sparkle / magic / robot tropes. Reject the cliché.

---

## 8. Tone-specific style elements

### 8.1 The "marker" detail

Many premium sites use a small visual marker that recurs throughout, a single design moment that becomes the brand's signature. Examples:
- Linear uses a thin gradient line that appears at section breaks
- Stripe uses subtle moving gradients in their hero
- Aesop uses a deliberate sage-green underline at points of emphasis

**Furnish's marker:** A single-pixel horizontal line in the app's accent color, used as a section divider in 1-2 places per page maximum. Subtle, premium, appears in transitions between major sections. NOT used as a button underline or any other tactical role.

### 8.2 Empty space as a design element

Premium sites use whitespace deliberately. Furnish does this in two specific ways:

1. **Hero subhead followed by 80vh of breathing room before the next section.** The user has to scroll to see anything else. This is a confidence move, we don't need to cram features above the fold.
2. **Section endings get 120px of bottom padding.** The eye gets a beat to absorb before the next content arrives.

### 8.3 Hover-only delight

Some interactions exist ONLY on desktop hover. They are not critical to comprehension but reward exploration:

- Sample gallery cards: on hover, a subtle "Style: Mid-century Modern" label fades in over the image
- Hero CTA button: on hover, a small arrow icon slides in from the right
- Footer email link: on hover, the email text changes to "click to copy" with a checkmark indicating success

Mobile users don't get these (no hover state), so they're not load-bearing for the experience. They're delight.

---

## 9. Dark mode

**Locked decision: No dark mode at launch.**

Reasons:
- Marketing sites don't need it (most users land, scroll, leave, short session)
- Doubles design work
- The app's identity is defined in the bright/light direction; introducing dark for marketing creates split brand mood
- Re-evaluate post-launch when we have analytics on session length and time-of-day usage

If Hassan changes his mind later, the design system should be built with CSS custom properties so swapping in a dark palette is feasible. (Most of the system already uses tokens, dark mode would be a token override, not a rewrite.)

---

## 10. Accessibility

This site targets premium craft. Premium craft includes accessibility. Non-negotiable items:

1. **WCAG AA contrast minimum** for all text. Test every text-on-bg combination.
2. **Focus rings** on every interactive element. Not just the default browser blue, a designed focus ring using the accent color, with a 2-3px offset.
3. **Keyboard navigation** works for all interactions (drag-slider has arrow-key fallback, full-screen menu has Escape close).
4. **`prefers-reduced-motion`** respected on all non-essential animations.
5. **Alt text** on every image. AI-generated rooms get descriptive alt text (e.g., "Mid-century modern living room with leather sofa and brass pendant lighting").
6. **Skip-to-content link** in the navigation.
7. **Lighthouse accessibility score 95+**.

---

## 11. Performance budget

Premium aesthetic doesn't excuse slow loads. Targets:

- **Largest Contentful Paint:** < 2.5s on 3G
- **First Input Delay:** < 100ms
- **Cumulative Layout Shift:** < 0.1
- **Total page weight:** < 1.5MB on first visit (with optimized images)
- **Lighthouse performance score:** 90+

To hit these:
- All images served as AVIF or WebP with JPEG fallback
- Critical CSS inlined; non-critical CSS deferred
- Fonts: `font-display: swap` and preload only the hero display font
- GSAP is heavy (~70kb gzipped); lazy-load it after first paint
- Use Next.js Image component for automatic format and size optimization

---

## 12. The "feel" test

Before any major design decision ships, run it through the **feel test**:

1. **Does it feel as crafted as fromanother.love?** If a designer who looks at sites for a living wouldn't be impressed by the motion, the answer is no.
2. **Does it feel as polished as Linear?** If anything looks loose, jagged, or unaligned, the answer is no.
3. **Does it feel as warm as Snowe / Article / Heirloom?** If the site feels cold, sterile, or inaccessible, the answer is no.
4. **Does it match the app's identity?** If a user toggling between the app and the site notices a visual disconnect, the answer is no.
5. **Does it serve the persona?** If a New Homeowner couldn't navigate to "How It Works" and understand the product in 30 seconds, the answer is no.

Five yeses. Or revise.

---

## 13. Summary of locked decisions

| Decision | Locked value |
|---|---|
| Color base | Inherited from app's CSS tokens |
| Color additions for marketing | Hero gradient (accent + radial), editorial accent (rare) |
| Pure black/white | NOT used, always near-values |
| Type families | App's sans for body/UI; Fraunces (or app's display) for marketing display |
| Type scale | Fluid clamp-based, defined in §2.3 |
| Hero h1 treatment | 3-line stack, sequential reveal, Fraunces, tight tracking |
| Imagery source | AI-generated rooms only, no people, no stock |
| Image treatments | Three: full-bleed cinematic / editorial card / before-after split |
| Layout density | Variable per section: A spacious + C grid + D asymmetric + a little B |
| Grid | 12-col desktop, 6-col tablet, 1-col mobile |
| Motion library | GSAP + ScrollTrigger + Flip |
| Hero motion | Custom loader → sequential headline reveal → scroll-trigger sections |
| Navigation | Minimal default → full-screen takeover on Menu click |
| Wow moment | Before/after compare slider, 1-3x per page |
| Iconography | Lucide only, 1.5 stroke, 20-24px |
| Brand marker | Thin accent-color line as section divider, 1-2x per page |
| Dark mode | NOT at launch |
| Accessibility | WCAG AA, focus rings, `prefers-reduced-motion`, Lighthouse 95+ |
| Performance | LCP < 2.5s, total page < 1.5MB, Lighthouse 90+ |

**Note on motion entries above:** This document names the motion moments (loading sequence, hero reveal, scroll triggers, etc.) and locks GSAP as the library. Full technical implementation specs (timelines, easing curves, mobile adaptations, performance budgets per animation) live in Document 3: Animation System.

---

## Appendix A: Reference site lessons (what to steal)

**From fromanother.love:**
- Custom loading sequence as a brand moment
- Editorial pacing, sections breathe, no cramming
- Cinematic full-bleed imagery
- Full-screen menu takeover
- Hover delight on portfolio cards

**From Linear:**
- Tight type tracking on display headers
- Subtle gradient accents (used sparingly)
- Section-divider thin lines
- Crisp button design with measured hover states
- Performance-first approach despite the polish

**From Snowe / Article / Heirloom:**
- Real product imagery treated as art
- Editorial captions under images (style, room type, brief description)
- Generous whitespace, single column body sections
- Premium-but-warm tone, never sterile

**From Burrow:**
- "Designed in 8 seconds" type of micro-copy that quantifies the magic
- Comparison-style content (vs. traditional designers)
- Process diagrams that simplify complex backend

**What we explicitly DO NOT steal:**
- ❌ The "rainbow AI gradient" from every AI product launch site
- ❌ Stock photos of happy diverse people (Furnish has its own imagery)
- ❌ Floating UI mockups in 3D space (cliché, dated)
- ❌ Long testimonial walls (we don't have testimonials yet; don't fake them)
- ❌ "Trusted by" logo bars (we have no enterprise customers)

---

## Appendix B: Implementation checklist for Claude Code

When Claude Code begins building, it walks this list:

1. ☐ Open `app.css`, extract all `:root` design tokens, copy to `src/styles/tokens.css`
2. ☐ Identify the app's font stack (Google Fonts URL, family names, weights)
3. ☐ Set up the marketing site's font load: app's sans + Fraunces variable from Google Fonts
4. ☐ Configure Next.js `<Image>` with AVIF + WebP support and blur placeholders
5. ☐ Install GSAP, ScrollTrigger, Flip, CustomEase
6. ☐ Build the motion utility module at `src/lib/motion/` with reusable scroll-trigger helpers (full spec: Document 3 §17)
7. ☐ Build the loading sequence component (full spec: Document 3 §4)
8. ☐ Build the navigation with the full-screen takeover (full spec: Document 3 §8)
9. ☐ Build the hero with the 3-line headline reveal (full spec: Document 3 §5)
10. ☐ Build the before/after compare slider using GSAP Flip (full spec: Document 3 §7)
11. ☐ Build the section-reveal pattern, used 6-12x across the site (full spec: Document 3 §6)
12. ☐ Verify Lighthouse scores: 90+ performance, 95+ accessibility
13. ☐ Verify `prefers-reduced-motion` works for all animations (full spec: Document 3 §14)
14. ☐ Cross-browser test: Safari (iOS + macOS), Chrome, Firefox, Edge
15. ☐ Document tokens in code comments for future contributors

This is the design system foundation. The next document (Document 3: Animation System) takes the motion moments named in Section 5 and specifies them in full technical detail. Document 4 (Site Architecture) defines the actual sitemap and page hierarchy.

---

**End of Document 2 of 11.**

Next document: **Animation System**. Full technical specification of every animation on furnish.live including GSAP timelines, easing curves, scroll triggers, mobile adaptations, and performance budgets per animation.
