# Furnish. Document 5 of 11: Home Page Detailed Specification

**Purpose:** Section-by-section specification of the Furnish home page (`/`). Every section's copy, layout, interaction, and conversion job is defined. Claude Code uses this as the primary build reference for the highest-traffic page on the site.

**Audience:** Claude Code (executor), copy editors (Hassan), front-end engineers, designers iterating later.

**Status:** Locked unless explicitly revised.

**Dependencies:** Document 1 (Brand Foundation), Document 2 (Visual Design System), Document 3 (Animation System), Document 4 (Site Architecture).

**Critical context:** This page does 80% of the conversion work. Every word and pixel earns its place. This is also the page Apple reviewers and Skimlinks reviewers will visit first when evaluating Furnish.

---

## 0. Page-level invariants

Before any section: these rules apply to the entire home page.

### 0.1 Page type and routing

- Route: `/` (Next.js `app/page.tsx`)
- Default locale: English (i18n keys per Document 4 §7)
- Static generation: ISR (Incremental Static Regeneration), rebuild on content changes, serve from CDN otherwise
- File path expected: `src/app/page.tsx` (with section components in `src/components/home/`)

### 0.2 Pre-launch vs. post-launch differentiation

The home page has TWO distinct states. Per Hassan's Q6 = C, both are designed and the site flips based on a feature flag.

**Feature flag:** `process.env.NEXT_PUBLIC_APP_LAUNCHED === 'true'` (default `false` until iOS app is live)

**Pre-launch (default until App Store live):**
- All CTAs read "Join Waitlist"
- Hero shows "Coming soon to iOS App Store" badge instead of App Store badge
- Email capture inline in hero AND as final CTA
- "Founding member" framing throughout

**Post-launch:**
- All CTAs read "Get the App"
- Hero shows full App Store download badge
- App Store screenshots/mockups appear
- Waitlist email capture removed (replaced with App Store link)

When in doubt below, copy reads "Join Waitlist". Claude Code wraps each CTA in the conditional.

### 0.3 Page structure (top-to-bottom)

1. Navigation (sticky, structure defined in Document 4 §5, menu animation in Document 3 §8)
2. Hero
3. Three-statement value prop
4. Sample gallery preview (9 rooms, one per Furnish launch room)
5. Before/after compare slider (the "wow" moment)
6. How It Works 3-step diagram
7. "Why Furnish" comparison (the dramatic table)
8. Brief founder note
9. Final CTA
10. Footer (aesthetics defined in Document 2 §6.4, structure in Document 4 §5.2)

**Total target page length:** 6-8 viewport heights on desktop. Each section breathes per Document 2 §4.1 pacing rules.

### 0.4 Performance requirements (specific to home page)

- Hero image must paint in < 1.2s (LCP element)
- GSAP loads AFTER first paint (lazy)
- Total JS shipped to home page: < 250KB gzipped
- 9 gallery images use `next/image` with blur placeholders, lazy-loaded except first 3

### 0.5 SEO

- `<title>`: `Furnish. Take a photo. Design your room. Shop it all.`
- `<meta name="description">`: `AI redesigns any room from a single photo and lets you shop every piece. Save 95%+ versus traditional interior designers. Built for renters, homeowners, and everyone tired of empty rooms.` (158 chars)
- Canonical: `https://furnish.live/`
- OG image: per Document 4 §8.6
- JSON-LD: WebSite + Organization schemas

---

## 1. Section: Hero

### 1.1 Job

The first 3 seconds. The user's brain decides "do I scroll?" or "do I bounce?" The hero must answer two questions at first glance:

1. What is this product?
2. Why should I care?

If both answer in 3 seconds, hero succeeds. Everything else follows.

### 1.2 Layout

- Full viewport height on desktop (`min-height: 100vh`)
- 90vh on mobile (so the next section peeks slightly, signaling "scroll for more")
- Vertical centered content (text + CTAs in middle of viewport)
- Hero image as background OR offset-right floating element on desktop, full-width above text on mobile

### 1.3 Hero variants. A/B candidates

Per Document 2 §3.1, the hero uses one of 4 cinematic AI-generated room images, rotated. For initial build, use **Hero-1: Bright morning living room, scandinavian style, warm woods, neutral palette.**

### 1.4 Background composition (desktop)

- AI-generated room image fills 60% of viewport from right edge
- Left 40% holds text content with the page's background color (semi-transparent overlay if image bleeds left)
- A subtle gradient overlay on the right side of the image (from page-bg to transparent, left-to-right) ensures text readability where it might overlap

### 1.5 Background composition (mobile)

- Image fills top 50% of viewport
- Text content below image, with the page's background color
- Soft fade between image and text section (10-20px gradient)

### 1.6 Copy. Hero headline

```
Take a photo.
Furnish does
the rest.
```

- 3 lines, deliberate breaks
- Render in Fraunces (display font) per Document 2 §2.4
- Sequential reveal animation per Document 3 §5
- Tracking: `-0.03em`
- Line-height: `0.92`
- Color: ink (app's near-black)

### 1.7 Copy. Hero subheadline

```
The first AI that designs your actual room, and lets you shop every piece in it.
```

- Single line on desktop, wraps naturally on mobile
- App's sans, weight 400-500
- Size: `--text-body-xl`
- Color: ink at 80% opacity (slightly softer than headline)
- Reveal: 600ms after final headline line per Document 3 §5

### 1.8 Copy. Two CTAs side-by-side (Q1 = B)

**Primary CTA (left):**
- Pre-launch: `Join the Waitlist` → opens email modal OR scrolls to inline form
- Post-launch: `Get the App` → iOS App Store URL
- Style: Primary button per Document 2 §6.1
- Slight right arrow icon appears on hover (per Document 2 §8.3)

**Secondary CTA (right):**
- `See How It Works` → scrolls to How It Works section (`#how-it-works`)
- Style: Secondary button per Document 2 §6.1
- Smooth scroll behavior

**Mobile layout:** CTAs stack vertically, primary on top.

**Reveal:** 200ms after subheadline, both CTAs fade in together.

### 1.9 Sub-CTA (small, below buttons)

**Pre-launch:**
```
Coming soon to iOS. Be the first to try it.
```

**Post-launch:**
```
Free to try. iOS only at launch.
```

- Size: `--text-body-s`
- Color: ink at 60% opacity
- Position: 24px below CTA buttons

### 1.10 Hero image attribution (subtle)

Bottom-right corner of the image, very small text:

```
Generated by Furnish · Scandinavian living room
```

- Size: `--text-body-s` (12px)
- Color: white at 70% opacity
- Position: absolute, bottom-right with 16px padding
- Purpose: subtle reminder that the hero image is the product output, reinforcing the value prop

### 1.11 Hero motion sequence (full)

On page load (after loading sequence per Document 3 §4):

1. Hero image fades in from 0% → 100% opacity over 800ms
2. Headline line 1 ("Take a photo.") slides up 30px while fading in (600ms)
3. Headline line 2 ("Furnish does") slides up 30px while fading in (600ms, +200ms delay)
4. Headline line 3 ("the rest.") slides up 30px while fading in (600ms, +200ms delay)
5. Subheadline fades in (400ms, +600ms delay after line 3)
6. CTAs fade in together (400ms, +200ms delay after subheadline)
7. Sub-CTA fades in (200ms, +100ms delay)
8. Image attribution fades in (200ms, +100ms delay)

Total hero animation duration: ~3.4 seconds. Feels deliberate, not slow.

`prefers-reduced-motion`: All elements appear instantly without transforms.

### 1.12 Scroll indicator (optional)

Bottom-center of hero viewport, small animated mouse-scroll icon or a chevron that gently bounces every 2 seconds. Disappears once user scrolls > 50px.

This is optional polish. Claude Code can skip if time-constrained.

---

## 2. Section: Three-statement value prop

### 2.1 Job

Eliminate confusion. Three crystal-clear statements about what Furnish does. The user reads these in 5 seconds and KNOWS the product flow.

### 2.2 Layout

- Three columns on desktop, stacked single-column on mobile
- Generous internal padding (`--space-section-y`)
- Section background: subtle (page bg or 1-tier elevated)
- Each column: icon (or number) + headline + 1-line description

### 2.3 Copy. The three statements

**Column 1. Photo in:**
```
Headline: Take a photo
Body: Snap any room, empty, half-empty, lived-in. Doesn't matter.
```

**Column 2. AI designs:**
```
Headline: We design your room
Body: Photo-realistic redesigns in your style, in seconds. Not generic templates.
```

**Column 3. Shop the room:**
```
Headline: Shop every piece
Body: Real products from real retailers. Tap anything. Buy when you're ready.
```

### 2.4 Visual treatment per column

- A small numeral (1, 2, 3) at top in display font, large but not overwhelming
- Number color: app's accent color
- Headline below: app's sans, weight 600, size `--text-display-m`
- Body: app's sans, weight 400, size `--text-body-l`
- Spacing: 24px between number and headline, 16px between headline and body

### 2.5 Optional: Subtle illustration per column

If Hassan supplies illustrations, each column gets a small (~80×80px) line illustration above the number. Otherwise, just numbers. Default: just numbers, keeps the clean ambition of the design system.

### 2.6 Motion

- Section reveal pattern per Document 3 §6
- Three columns stagger in (100ms apart) as the section enters viewport at 75% threshold

### 2.7 Section transition

A thin accent-color line (Document 2 §8.1 brand marker) divides this section from the next. 1px tall, 80px wide, centered, with 40px vertical margin.

---

## 3. Section: Sample gallery preview

### 3.1 Job

Show the product. Visual proof, not a promise. Demonstrate that Furnish handles many room types and styles.

### 3.2 Layout

Per Hassan's Q2 = 9 images, one per launch room type. Display strategy: **3×3 grid on desktop, 2-column on tablet, 1-column on mobile.**

### 3.3 Section header

```
Eyebrow: A taste of what's possible
Headline: Every room. Every style. Designed for you.
```

- Eyebrow: small caps, wide tracking, accent color, `--text-body-s`
- Headline: `--text-display-l`, Fraunces, ink color
- Centered above the grid
- Bottom margin: 80px before the grid begins

### 3.4 The 9 rooms (per Hassan)

Each tile shows ONE curated AI-generated room. Each represents a Furnish launch room type.

| Tile | Room type | Suggested style for hero curation |
|---|---|---|
| 1 | Living Room | Scandinavian (warm woods, bright) |
| 2 | Bedroom | Mid-century modern (moody, layered) |
| 3 | Kitchen | Farmhouse (white, herb-laden) |
| 4 | Bathroom | Contemporary (spa-feel, clean) |
| 5 | Home Office | Industrial (leather, mid-century desk) |
| 6 | Dining Room | Art-deco (statement chandelier, jewel tones) |
| 7 | Nursery | Bohemian (soft, layered, calm) |
| 8 | Walk-in Closet | Premium contemporary (built-ins, brass) |
| 9 | Laundry Room | Modern farmhouse (organized, warm) |

These 9 represent a ~50% subset of the 24-image curated gallery on `/gallery` (Document 4 §8.2). Hassan curates which exact images.

### 3.5 Tile composition

Each tile (Treatment B per Document 2 §3.3):

- Image at top (4:3 aspect ratio)
- Caption below image, inside the card:
  - Room type in display font (e.g., "Living Room"), primary text
  - Style name in app's sans (e.g., "Scandinavian · Warm Woods"), secondary text
  - "Designed in 8 seconds" micro-copy, small, accent-color
- Card has subtle shadow + border per Document 2 §6.2
- Border-radius: from app tokens

### 3.6 Hover behavior (desktop)

- Card lifts slightly (`translateY(-4px)`) per Document 3 §9
- A small "View larger" hint appears (overlay text or icon), desktop only
- On click: opens lightbox/modal with the full image (mobile and desktop both)

### 3.7 Mobile behavior

- Tiles stack vertically
- Tap to open the same lightbox as desktop
- No hover effects (mobile)

### 3.8 CTA below grid

```
Button text: See the full gallery
Action: Link to /gallery
Style: Secondary button per Document 2 §6.1
Position: Centered, 60-80px below grid
```

### 3.9 Motion

- Grid items reveal in a staggered ripple, each tile 80ms after the previous
- Reveal direction: from bottom (translateY: 30px → 0) with fade-in
- Triggered when grid reaches 60% viewport entry

---

## 4. Section: Before/after compare slider

### 4.1 Job

The wow moment. The thing users screenshot. The moment that says "this is real, this is good, I want this."

### 4.2 Layout

- Full-width on desktop (image fills container, max-width: 1440px)
- Standard width on mobile
- Substantial vertical padding (`--space-section-y`)

### 4.3 Section header

```
Eyebrow: See the magic
Headline: Drag to see your room transformed.
```

- Same treatment as §3.3
- Centered, 60px above the slider

### 4.4 The slider component

This is THE technical centerpiece of the home page. Implementation:

**Default state:**
- Two images stacked: BEFORE (raw photo) on bottom, AFTER (Furnish redesign) on top
- A vertical slider handle at 50% (center)
- The AFTER image is clipped to the right of the handle
- The BEFORE image shows on the left of the handle
- A vertical line at the slider position (1-2px wide, white with subtle shadow)
- A circular handle (40-50px diameter) at the center of the line, with two arrows (◀ ▶) inside
- "BEFORE" label in top-left of the AFTER side, "AFTER" label in top-right of the BEFORE side

**Interaction:**
- User drags the handle left or right
- The clipping mask updates in real-time
- Smooth, no lag (use `transform` + `clip-path`, not changing image src)
- Touch and mouse both supported
- Keyboard: arrow keys move slider 5% per press

**On viewport entry (auto-demo):**
- Slider auto-animates from 50% → 80% over 1.2s (showing more "after")
- Pauses 600ms
- Animates back to 50% over 1.0s
- This is the demonstration, user sees the interaction is possible
- Auto-demo only runs once per page load

**Accessibility:**
- ARIA role: `slider`
- ARIA label: "Drag to compare before and after Furnish redesign"
- Min/max values: 0-100 (percentage)
- Keyboard: Arrow Left/Right (5% increments), Page Up/Down (25% increments)
- Full implementation in Document 3 §7

### 4.5 Suggested image pair for hero slider

Empty/sparse living room → designed scandinavian living room (matches Hero-1 image style for visual consistency).

Use one of the 6 before/after pairs from Document 4 §8.3.

### 4.6 Below the slider

```
Caption: Same room. Same camera angle. Designed by Furnish.
```

- Centered below slider
- App's sans, weight 400, size `--text-body-l`
- Color: ink at 70% opacity

### 4.7 Optional: Slider thumbnail nav (mobile-friendly)

Below the slider, three small thumbnail pairs let user select different before/after examples to compare. Each thumbnail: 60×60px, click swaps the slider's image set with smooth transition.

This is optional polish, ships v1 if time allows, otherwise single pair only.

### 4.8 Motion

- Section fades in normally per Document 3 §6
- Slider's auto-demo fires when slider component reaches 70% viewport entry

---

## 5. Section: How It Works 3-step diagram

### 5.1 Job

For users who want more detail than the three-statement value prop. Show the process. Reduce skepticism.

### 5.2 Layout

- 3 steps in a horizontal flow on desktop
- Stacked vertically on mobile
- Each step: large numbered marker + short illustration/icon + step name + brief description
- Connecting line/arrow between steps on desktop (subtle, accent-color)

### 5.3 Section header

```
Eyebrow: How it works
Headline: From your photo to your dream room. In seconds.
```

### 5.4 The three steps

**Step 1. Take a photo:**
```
Headline: 1. Snap any room
Body: Empty, half-empty, lived-in, doesn't matter. Just point your camera and tap.
Visual: A phone-icon outline OR a small camera viewfinder graphic
```

**Step 2. Tell us your style:**
```
Headline: 2. Tell us your vibe
Body: A short visual quiz captures your style, density, and budget. No design jargon.
Visual: A small set of style tiles or a quick mockup of the quiz
```

**Step 3. See your room redesigned:**
```
Headline: 3. Designed in seconds
Body: Photo-realistic redesign of your actual room. Every piece is shoppable.
Visual: A small AI-generated room thumbnail
```

### 5.5 Step visual treatment

- Number in display font, large, accent-color
- Headline below number
- Body text below headline
- Small visual element (illustration or generated room thumb) at the top of each step
- Generous padding (40-60px between steps)

### 5.6 Connecting line (desktop only)

Between Step 1 → Step 2 → Step 3, a thin horizontal line (accent-color, 1-2px) connects them visually. The line animates in (left-to-right grow) when section enters viewport.

### 5.7 CTA below steps

```
Button text: Read the full how-to
Action: Link to /how-it-works
Style: Tertiary link-style per Document 2 §6.1
```

### 5.8 Motion

- Each step reveals in sequence (200ms apart)
- Connecting line animates in last (after all steps are revealed)

### 5.9 Anchor

Section has `id="how-it-works"` for the hero CTA scroll-to anchor.

---

## 6. Section: "Why Furnish" comparison table (Q3 = A, the dramatic version)

### 6.1 Job

Make the value prop unmistakable. Furnish vs. the alternatives, in a clean, defensible comparison. The "save 95%+" claim lives here.

### 6.2 Layout

- Centered comparison table on desktop
- On mobile: scrollable horizontally OR collapsed to a "tap to compare" interaction with one competitor at a time

### 6.3 Section header

```
Eyebrow: How we compare
Headline: Designed for you. Not for designers.
Subheadline: Save 95%+ versus traditional interior designers. From $5,000+ to free.
```

- Headline in Fraunces, `--text-display-l`
- Subheadline in app's sans, `--text-body-xl`, ink at 80% opacity
- Centered, 80px above the table

### 6.4 The table

Five columns:

| Feature | **Furnish** | Interior Designer | Havenly | Pinterest |
|---|---|---|---|---|
| **Designs your actual room** | ✅ | ✅ | ✅ | ❌ |
| **Real, shoppable products** | ✅ | ✅ | ✅ | ❌ |
| **AI-powered, instant** | ✅ | ❌ | ❌ | ❌ |
| **Time to first design** | 8 seconds | 4-8 weeks | 1-2 weeks | Never |
| **Cost per room** | **Free** | $2,000-$10,000 | $79-$1,599 | Free (no design) |
| **Iterate as many times** | ✅ Unlimited | ❌ Hourly fees | Limited | N/A |
| **Choose your retailers** | ✅ Any | Designer's choice | Limited | N/A |
| **Works with what you have** | ✅ | Sometimes | Sometimes | ❌ |

### 6.5 Visual treatment

- Furnish column: subtle accent-color background tint (5-10% opacity), bold borders, slightly raised shadow
- Other columns: standard surface, no emphasis
- Checkmarks (✅): accent color, larger size
- Red X (❌): muted red (not bright), smaller
- Cost row: emphasized text, especially "Free" in Furnish column (display font, larger)
- Time row: same emphasis pattern

### 6.6 Below the table, bold callout

A 3-line callout below the table, large display text:

```
Stop pinning.
Stop paying designers thousands.
Start shopping the room you actually want.
```

- Each line in Fraunces, `--text-display-m`
- Stacked, left-aligned (not centered)
- Color: ink
- Subtle reveal animation (each line stagger 200ms)

### 6.7 CTA

A big primary CTA below the callout:

```
Button text: 
  Pre-launch: "Join the Waitlist"
  Post-launch: "Get the App"
Style: Primary button per Document 2 §6.1, but LARGER than default (size up by 1.2x)
```

### 6.8 Motion

- Table fades in row by row as section enters viewport (each row 80ms after previous)
- Callout 3 lines reveal sequentially (200ms apart) once table is in
- CTA fades in last

### 6.9 Anchor

Section has `id="why-furnish"`.

---

## 7. Section: Brief founder note

### 7.1 Job

Trust through humanity. Remind users a real person, not a faceless tech company, is building this for them.

Per Hassan's Q4, brief and personal but appropriate for a marketing page. NOT a deep biography.

### 7.2 Layout

- Centered single-column section
- Max-width: 720px
- Generous vertical padding
- Background: page bg (no card or container)

### 7.3 Copy (locked, per Hassan's bio direction)

```
Eyebrow: Why I built Furnish

Headline: Built by Hassan Muhsen.

Body paragraph 1:
I'm 18, based in Garden City, Michigan. I started building apps in high school 
because I kept noticing problems no one was solving, and I'd rather build than 
wait for someone else to do it. I got my mortgage loan officer license while 
still in school for the same reason: I wanted real skills, real ownership, real 
work, not a resume.

Body paragraph 2:
Furnish came from watching people I know struggle to make their homes feel 
finished. Empty rooms. Pinterest paralysis. Quotes from interior designers that 
cost more than a car payment. I wanted to make this accessible to everyone, not 
just people with $5,000 to spend on a designer they barely talk to.

Body paragraph 3 (optional, more aspirational):
Furnish is for the new homeowner staring at empty walls. The renter tired of 
mismatched IKEA furniture. The real estate agent trying to help clients see 
what's possible. Anyone who wants their home to feel like theirs, without the 
gatekeeping, the cost, or the wait.

Sign-off: Hassan
```

### 7.4 Visual treatment

- Eyebrow: small caps, wide tracking, accent color
- Headline: Fraunces, `--text-display-m`, ink, centered
- Body paragraphs: app's sans, `--text-body-l`, ink at 90%, line-height 1.6
- Sign-off: app's sans italic, `--text-body-l`, ink at 80%, right-aligned

### 7.5 Optional: Founder photo

Hassan can choose to include a photo. If yes:
- Small (160×160px), circular crop
- Above the headline, centered
- Subtle ring (1-2px solid border in accent-color at 30% opacity)

If no photo: just text. Equally fine. Can be added later.

### 7.6 Motion

- Section fades in normally
- Paragraphs stagger in slightly (100ms apart) as section reveals

### 7.7 Why this works

- Establishes founder is real, young, ambitious, building from a real-life observation
- Mentions Garden City (per Hassan's correction), local roots, authentic
- Mentions entrepreneurship arc (apps in high school, MLO license), credibility
- Mission statement is the user-facing reframe of the brand promise
- No private/personal details, appropriate boundaries for a public marketing page
- Sign-off creates intimacy without overstepping

---

## 8. Section: Final CTA

### 8.1 Job

The user has seen everything. Either they're convinced, or they're leaving. The final CTA captures the convinced.

### 8.2 Layout

- Full-width section, full viewport height (or close to it)
- Centered content, vertically and horizontally
- Background: full-bleed cinematic AI-generated room image (Treatment A per Document 2 §3.3)
- Heavy gradient overlay (40-60% black or accent-color tint) for text legibility

### 8.3 Hero image for final CTA

Use Hero-2 (evening bedroom, art-deco vibe, moody lighting) for visual contrast vs. the page's opening hero. Different mood, same brand.

### 8.4 Copy

```
Eyebrow: Stop imagining. Start designing.

Headline: Your dream room is one photo away.

Pre-launch CTA: Join the waitlist
Post-launch CTA: Get Furnish for iOS
```

- Eyebrow: small caps, accent color, white tint
- Headline: Fraunces, `--text-display-xl`, white, centered, tight tracking, line-height 1.0
- CTA: Primary button per Document 2, but with a white-on-accent variant (button stays accent color, but the section's dark overlay makes it more visually punchy)

### 8.5 Below the CTA

**Pre-launch:**
```
Sub-line: Free at launch. iOS first. Be among the first 1,000.
Email field: [your@email.com] [Join] (inline)
```

**Post-launch:**
```
Sub-line: Free to try. Available now on the App Store.
[App Store badge]
```

### 8.6 Motion

- On scroll-into-view, headline animates in line-by-line per the hero pattern
- CTA + sub-line fade in after
- Background image has a slow, subtle parallax effect (scroll causes image to move 10-20% slower than text)

### 8.7 Anchor

Section has `id="cta"` or `id="waitlist"` (pre) / `id="download"` (post).

---

## 9. Footer

Defined fully in Document 2 §6.4 and Document 4 §5.2. No additional home-page-specific content.

---

## 10. Mobile-specific adaptations

This document assumes desktop-first layout above. Mobile-specific changes for the home page:

### 10.1 Hero on mobile

- Image fills top 50%
- Text below image, with the page's background color
- CTAs stack vertically (primary on top)
- Hero motion sequence shortened (faster, less staggered)

### 10.2 Sample gallery on mobile

- Single column (1 image per row)
- Tap to open lightbox

### 10.3 Compare slider on mobile

- Touch-only interaction
- Slider handle larger (50-60px) for easier touch targeting
- Auto-demo plays once on viewport entry

### 10.4 Comparison table on mobile

- Horizontal scroll of the full table OR
- Collapsed view: pick one competitor at a time via tabs
- Recommendation: collapsed view (better UX, less awkward)

### 10.5 Section spacing on mobile

- Reduce section vertical padding by ~30% to keep page from feeling endless
- Use `clamp()` per Document 2 §4.3, already responsive

---

## 11. Accessibility requirements

Per Document 2 §10. Specific to home page:

- All interactive elements (CTAs, slider, gallery tiles) keyboard-accessible
- Slider has full keyboard support per §4.4
- All images have descriptive alt text (e.g., "Scandinavian living room with warm wood floors and white walls, designed by Furnish")
- Skip-to-content link in nav
- Heading hierarchy: One H1 (hero headline), H2 per major section, no skipped levels
- Color contrast on all text passes WCAG AA
- `prefers-reduced-motion` disables all GSAP animations and parallax effects

---

## 12. Analytics events (Plausible)

Per Document 4 §11.2. Specific events for home page:

| Event | Triggered when |
|---|---|
| `home_hero_cta_click` | User clicks "Join Waitlist" / "Get the App" in hero |
| `home_secondary_cta_click` | User clicks "See How It Works" in hero |
| `home_compare_slider_drag` | User drags the before/after slider (deduplicate to once per session) |
| `home_gallery_tile_click` | User clicks a sample gallery tile |
| `home_view_full_gallery_click` | User clicks "See the full gallery" CTA |
| `home_final_cta_click` | User clicks the final CTA at the bottom |
| `home_scroll_50_percent` | User scrolls past 50% of page |
| `home_scroll_100_percent` | User reaches the footer |
| `email_waitlist_submit` | User submits email to waitlist (pre-launch) |

---

## 13. Component breakdown for Claude Code

Each home page section is a distinct React component. Suggested file structure:

```
src/components/home/                    # NEW components built in Document 5
├── Hero.tsx
├── ValueProp.tsx (the 3-statement section)
├── GalleryPreview.tsx (the 9-room grid)
├── HomeCompareSlider.tsx (wrapper around the shared CompareSlider)
├── HowItWorks.tsx (3-step diagram)
├── ComparisonTable.tsx (the dramatic table)
├── FounderNote.tsx
└── FinalCTA.tsx

src/components/shared/                  # Already built in prior phases or reused
├── Button.tsx (from Document 2 Phase 1C)
├── SectionDivider.tsx (from Document 2 Phase 1C)
├── ImageCard.tsx (Treatment B from Doc 2, may need to build here if not done)
├── EmailWaitlist.tsx (the inline email form, may need to build here)
└── CompareSlider.tsx (from Document 3 Phase 3E, the shared component wrapping createCompareSlider)

src/lib/                                # Already built in prior phases
├── motion/ (directory with full motion library from Document 3)
├── analytics.ts (Plausible event helpers from Document 4 Phase 4H)
└── flags.ts (pre-launch / post-launch feature flag, build here if not from Document 4)
```

### 13.1 Claude Code build sequence (for the home page)

**Prerequisites already complete from prior phases:**
- Foundational components (`<Button>`, `<Card>`, `<SectionDivider>`, `<Container>`) exist from Document 2 Phase 1C
- Motion library at `src/lib/motion/` exists with all hooks and helpers from Document 3
- Page route shell at `src/app/page.tsx` exists from Document 4 Phase 4A
- Navigation, footer, and analytics already work site-wide from Document 4

**Home page build steps:**
1. ☐ Replace the placeholder content in `src/app/page.tsx` with the home page composition
2. ☐ Build `<Hero>` consuming `useHeroSequence()` from `@/lib/motion` per Document 3 §5
3. ☐ Build `<ValueProp>` (3-statement section)
4. ☐ Build `<GalleryPreview>` with the 9-room grid using `useScrollReveal()` per Document 3 §6
5. ☐ Build `<BeforeAfterSlider>` consuming `createCompareSlider()` from `@/lib/motion` per Document 3 §7 (most complex component, allocate budget time)
6. ☐ Build `<HowItWorks>` 3-step diagram
7. ☐ Build `<ComparisonTable>` with all the dramatic styling
8. ☐ Build `<FounderNote>`
9. ☐ Build `<FinalCTA>` with full-bleed cinematic background
10. ☐ Add analytics events via `track()` helper from `src/lib/analytics.ts`
11. ☐ Test pre-launch and post-launch states via `NEXT_PUBLIC_APP_LAUNCHED` flag
12. ☐ Lighthouse pass: Performance 90+, Accessibility 95+
13. ☐ Mobile QA pass on real devices (iOS Safari, Android Chrome)

---

## 14. Locked decisions summary

| Decision | Locked value |
|---|---|
| Hero CTA variant | B: Two CTAs side-by-side (Join Waitlist + See How It Works) |
| Sample gallery on home | 9 rooms covering all Furnish launch room types in 3×3 grid |
| Comparison block | Side-by-side dramatic table (Furnish vs. Interior Designer / Havenly / Pinterest), with "save 95%+" headline |
| Founder note | Brief 2-3 paragraph personal note. Garden City, MI. Entrepreneurship arc. No private details. |
| Social proof | None at v1. Add post-launch when real testimonials exist. |
| Pre-launch vs. post-launch | Full differentiation per `NEXT_PUBLIC_APP_LAUNCHED` flag. Two distinct CTA states throughout. |
| Page sections (top to bottom) | Hero → ValueProp → GalleryPreview → CompareSlider → HowItWorks → ComparisonTable → FounderNote → FinalCTA → Footer |
| Total target page length | 6-8 viewport heights |
| Hero image | Hero-1 (scandinavian living room, bright morning) |
| Final CTA image | Hero-2 (art-deco bedroom, moody) |
| Wow moment | Before/after compare slider with auto-demo |
| Slider implementation | GSAP Flip + clip-path, full keyboard accessible, auto-demos once per viewport entry |
| Comparison table breakdown | 5 columns × 8 rows, Furnish column emphasized |
| Founder note location | Section 7 (between comparison and final CTA) |
| Mobile pattern | All sections collapse to single-column with adapted spacing |
| Analytics events | 9 home-page-specific events to Plausible |
| Build sequence | 13-step checklist in §13.1 (foundation already complete from prior phases) |

---

## 15. Open questions for next documents

These are the questions that surfaced but are answered elsewhere:

- **Document 6 (Sample gallery spec):** Filter logic on `/gallery`, modal interaction, the full 24-image curation
- **Document 7 (Blog content plan):** The 5-8 launch posts with topics, outlines, retailer link strategy
- **Document 8 (Static pages spec):** About page full copy, How It Works full content, FAQ
- **Document 9 (Tech stack):** Specific Next.js setup, Vercel deployment config
- **Document 10 (Skimlinks integration):** Outbound link format, tracking, compliance disclosures
- **Document 11 (Launch roadmap):** Pre-launch / launch-day / post-launch sequence

---

## Appendix A: Copy at-a-glance reference

For quick scanning during build, every piece of copy on the home page:

**Hero:**
- Headline: "Take a photo. / Furnish does / the rest."
- Subheadline: "The first AI that designs your actual room, and lets you shop every piece in it."
- Primary CTA: "Join the Waitlist" (pre) / "Get the App" (post)
- Secondary CTA: "See How It Works"
- Sub-CTA: "Coming soon to iOS. Be the first to try it." (pre) / "Free to try. iOS only at launch." (post)
- Image attribution: "Generated by Furnish · Scandinavian living room"

**Value prop:**
- Eyebrow: "How it works"
- Column 1: "1 / Take a photo / Snap any room, empty, half-empty, lived-in. Doesn't matter."
- Column 2: "2 / We design your room / Photo-realistic redesigns in your style, in seconds. Not generic templates."
- Column 3: "3 / Shop every piece / Real products from real retailers. Tap anything. Buy when you're ready."

**Sample gallery:**
- Eyebrow: "A taste of what's possible"
- Headline: "Every room. Every style. Designed for you."
- CTA: "See the full gallery"

**Compare slider:**
- Eyebrow: "See the magic"
- Headline: "Drag to see your room transformed."
- Caption: "Same room. Same camera angle. Designed by Furnish."

**How It Works:**
- Eyebrow: "How it works"
- Headline: "From your photo to your dream room. In seconds."
- Step 1: "1. Snap any room / Empty, half-empty, lived-in, doesn't matter. Just point your camera and tap."
- Step 2: "2. Tell us your vibe / A short visual quiz captures your style, density, and budget. No design jargon."
- Step 3: "3. Designed in seconds / Photo-realistic redesign of your actual room. Every piece is shoppable."
- CTA: "Read the full how-to"

**Comparison table:**
- Eyebrow: "How we compare"
- Headline: "Designed for you. Not for designers."
- Subheadline: "Save 95%+ versus traditional interior designers. From $5,000+ to free."
- Callout: "Stop pinning. / Stop paying designers thousands. / Start shopping the room you actually want."
- CTA: "Join the Waitlist" / "Get the App"

**Founder note:**
- Eyebrow: "Why I built Furnish"
- Headline: "Built by Hassan Muhsen."
- Body: 2-3 paragraphs (per §7.3)
- Sign-off: "Hassan"

**Final CTA:**
- Eyebrow: "Stop imagining. Start designing."
- Headline: "Your dream room is one photo away."
- CTA: "Join the Waitlist" / "Get the App"
- Sub-line: "Free at launch. iOS first. Be among the first 1,000." (pre) / "Free to try. Available now on the App Store." (post)

---

**End of Document 5 of 11.**

Next document: **Sample Gallery Spec**, the dedicated `/gallery` page, filter logic, modal interactions, and the full 24-image curation strategy.
