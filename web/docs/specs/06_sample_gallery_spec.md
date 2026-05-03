# Furnish. Document 6 of 11: Sample Gallery Specification

**Purpose:** Detailed specification for the `/gallery` page. Defines layout, filter system, modal interaction, image curation strategy, and content update cadence. The gallery is the proof page. Skeptics convert here when they see room after room of beautifully designed spaces.

**Audience:** Claude Code (executor), front-end engineers, content team (Hassan as curator).

**Status:** Locked unless explicitly revised.

**Dependencies:** Documents 1, 2, 3, 4.

**Critical brand rule:** No em dashes anywhere on the site. This rule applies to all website copy throughout this document. Use periods, commas, colons, parentheses, or full sentence rewrites instead. This rule is non-negotiable.

---

## 0. Page-level invariants

### 0.1 Page type and routing

- Route: `/gallery` (Next.js `app/gallery/page.tsx`)
- Default locale: English
- Static generation with ISR (rebuild when image inventory changes)
- File path expected: `src/app/gallery/page.tsx` with image data in `src/data/gallery.ts` or similar

### 0.2 The gallery's job

The page exists to do two things:

1. Convert skeptics. Visitors who weren't sold by the home page see room after room of beautiful results and convert here.
2. Demonstrate breadth. Show every Furnish launch room type at least once, in multiple styles. Eliminate "does this work for my kind of room?" doubt.

Every interaction on this page either keeps the user browsing (good) or pushes them toward a CTA (better).

### 0.3 SEO

- `<title>`: `Sample Gallery. Real rooms designed by Furnish AI.`
- `<meta name="description">`: `Browse 36+ rooms designed by Furnish. Living rooms, bedrooms, kitchens, home offices, and more. Every style. Every room. Designed in seconds, shoppable instantly.`
- Canonical: `https://furnish.live/gallery`
- OG image: a curated grid composite (3x3) or the single most-impressive gallery image
- JSON-LD: ImageGallery schema (each image as a gallery item)

### 0.4 Performance

- First 6 images load eagerly (above the fold on most viewports)
- Remaining images lazy-load with blur placeholder per Document 2 §5.5
- All images served as AVIF or WebP with JPEG fallback
- Filter UI loads instantly. Image swap on filter change is animated but non-blocking (existing images fade out as new ones fade in, < 400ms)
- Lighthouse target: 90+ Performance, 95+ Accessibility (per Document 2 §11)

---

## 1. Page structure (top to bottom)

1. Navigation (sticky, structure defined in Document 4 §5, menu animation in Document 3 §8)
2. Hero strip
3. Filter system
4. Image grid
5. Below-grid CTA
6. Footer

Total target page length on desktop: 4 to 6 viewport heights depending on filter state.

---

## 2. Section: Hero strip

### 2.1 Job

Set context. Tell the visitor what they are looking at. Make it visually distinct from the home page hero so the user understands they have moved to a new context.

### 2.2 Layout

- Compact compared to the home hero. About 40 to 50 vh on desktop, 35 vh on mobile.
- Centered text, no background image (unlike the home hero).
- Section background: page bg or a subtle 1-tier elevation.
- Generous top padding (pushes hero text below the nav comfortably).

### 2.3 Copy

```
Eyebrow: Sample gallery

Headline: Real rooms. Designed by Furnish.

Subheadline: 36 rooms across 9 room types and 4 styles. Every one of these started 
with a single photo and finished as something the customer could shop, piece by piece.
```

(Note: dashes within numbered facts above are en dashes used inside HTML/CSS, not em dashes in body copy. Body text uses no em dashes.)

### 2.4 Optional: live counter

A small element below the subheadline that displays a counter:

```
"36 rooms, growing weekly."
```

This is a small text block, not a giant counter widget. It stays small and subtle. Update the number whenever new rooms are added.

### 2.5 Visual treatment

- Eyebrow: small caps, wide tracking, accent color, `--text-body-s`
- Headline: Fraunces, `--text-display-l`, ink color, centered
- Subheadline: app's sans, `--text-body-l`, ink at 80%, centered, max-width 720px
- Counter line: app's sans, `--text-body-s`, accent color or ink at 60%

### 2.6 Motion

- Standard section reveal pattern per Document 3 §6
- Eyebrow, headline, subheadline stagger in (200ms apart)

---

## 3. Section: Filter system

Per Hassan's Q1 specification, the filter system has two levels:

1. The default view shows all 9 rooms in a 3x3 grid (one tile per Furnish launch room type).
2. Each tile has a style selector that lets the user cycle through approximately 10 different style versions of that room.

This is a unique design pattern. Each tile is essentially its own mini-gallery for that room type.

### 3.1 Layout overview

```
┌──────────────────────────────────────────────────┐
│                                                  │
│    LIVING ROOM         BEDROOM         KITCHEN   │
│    ┌─────────┐         ┌─────────┐    ┌──────┐  │
│    │  IMAGE  │         │  IMAGE  │    │ IMAGE│  │
│    │         │         │         │    │      │  │
│    └─────────┘         └─────────┘    └──────┘  │
│   [< 3 of 10 >]       [< 7 of 10 >]  [< 1/10 >] │
│                                                  │
│    BATHROOM         HOME OFFICE      DINING ROOM │
│    ┌─────────┐      ┌─────────┐      ┌────────┐ │
│    │  IMAGE  │      │  IMAGE  │      │ IMAGE  │ │
│    │         │      │         │      │        │ │
│    └─────────┘      └─────────┘      └────────┘ │
│   [< 5/10 >]       [< 2/10 >]       [< 9/10 >] │
│                                                  │
│    NURSERY        WALK-IN CLOSET    LAUNDRY ROOM│
│    ┌─────────┐    ┌─────────┐       ┌────────┐ │
│    │  IMAGE  │    │  IMAGE  │       │ IMAGE  │ │
│    │         │    │         │       │        │ │
│    └─────────┘    └─────────┘       └────────┘ │
│   [< 4/10 >]     [< 6/10 >]        [< 1/10 >] │
│                                                  │
└──────────────────────────────────────────────────┘
```

Each tile is a card. Each card holds:
- Room type label at top
- The active AI-generated image
- A small style selector control at the bottom that cycles through styles
- A current style indicator (e.g., "Scandinavian", "Mid-century")
- A small caption: "Designed in 8 seconds"

### 3.2 The style selector control

Inside each tile, below the image, the user sees a small set of controls:

```
┌─ Tile interior ──────────────────────┐
│                                      │
│  [    Room image fills here    ]     │
│                                      │
│  Living Room                         │
│  Scandinavian                        │
│                                      │
│  ◀  3 of 10  ▶     [randomize]       │
│                                      │
└──────────────────────────────────────┘
```

**The four controls:**
1. **Left arrow:** Previous style. Cycles back through the 10 style options.
2. **Counter:** "3 of 10". Tells the user where they are in the style rotation.
3. **Right arrow:** Next style. Cycles forward.
4. **Optional shuffle/randomize button:** A small icon (dice or shuffle) that picks a random style from the 10. Useful for users who want variety without manually cycling.

### 3.3 Image transition behavior

When the user clicks left or right arrow:
- The current image fades out (200 ms)
- The new image fades in (300 ms)
- Total transition: 500 ms
- The room type label stays static (it does not change for a given tile)
- The style label updates as the new image arrives

When the user clicks shuffle:
- All 9 tiles cycle to a randomized style for each
- Tiles transition staggered (50 ms apart) for a wave effect

### 3.4 Initial image per tile

When the page first loads, each tile shows a randomly selected style from its 10. Per Hassan's Q4, random shuffle on each visit. So a returning visitor sees a fresh combination, reinforcing the impression that the site is always updating.

The randomization should be visible. If you load the page and 5 minutes later reload, the tiles look different. This is the intended brand effect.

### 3.5 The 10 style options per room type (locked)

The 10 styles available across all rooms (matching the Furnish app's controlled vocabulary, plus a couple of cinematic combinations):

1. Scandinavian
2. Mid-century modern
3. Industrial
4. Bohemian
5. Farmhouse
6. Contemporary
7. Art deco
8. Minimalist
9. Traditional
10. Eclectic

Note: Document 2 referred to 6 styles as "marketing-ready". For the gallery, all 10 are usable because the gallery is the place to demonstrate breadth. Hassan curates which images represent each style for each room.

### 3.6 Total gallery image count

9 rooms x 10 styles = 90 images theoretical maximum.

For launch, target: 9 rooms x 4 styles = 36 curated images. This means each room has at least 4 styles populated, with the remaining 6 styles either filling in over time or remaining empty until content arrives.

When a style has no curated image for a given room, the style selector either:
- Skips it (cycles through only populated styles)
- Or shows a "Coming soon" placeholder card

Recommended behavior: skip empty styles entirely and adjust the counter to reflect the actual count for that tile (e.g., "3 of 4" not "3 of 10" if only 4 styles are curated). This avoids confusion.

### 3.7 Filter system above the grid

A horizontal filter bar above the 3x3 grid. The bar offers two ways to narrow the view:

**Filter pill row 1: Room type**
- "All rooms" (default, shows the 3x3 grid)
- "Living Room", "Bedroom", "Kitchen", etc. (clicking one filters to just that room)

When a user clicks a single room type, the grid collapses from 3x3 to a single-room view. That single tile expands and lets the user cycle through ALL 10 styles for that room. The view becomes a focused style explorer for that room.

**Filter pill row 2: Style**
- "All styles" (default)
- "Scandinavian", "Mid-century", etc.

When a user picks a style, the 3x3 grid stays as 9 tiles, but each tile shows that specific style. So clicking "Scandinavian" shows: scandinavian living room, scandinavian bedroom, scandinavian kitchen, etc. all at once.

**Combining filters:**
- If both filters are active (e.g., "Living Room" + "Scandinavian"), the grid collapses to a single image with no cycling controls (that's the one image).

**Reset filter button:**
- Always visible when any filter is active. Tap to clear all filters and return to the default 3x3 random-style view.

### 3.8 Filter visual treatment

- Filter pills are horizontal scrollable on mobile, wrap on desktop
- Active filter has accent color background + white text
- Inactive filters have white/page-bg background + ink text + 1px subtle border
- Pills are small, not loud
- Filter rows are stacked vertically on mobile, side-by-side on desktop

### 3.9 Filter analytics

Track these events on Plausible:

| Event | When |
|---|---|
| `gallery_filter_room_apply` | User selects a room filter |
| `gallery_filter_style_apply` | User selects a style filter |
| `gallery_filter_clear` | User clears filters |
| `gallery_tile_cycle_next` | User clicks right arrow on a tile |
| `gallery_tile_cycle_prev` | User clicks left arrow on a tile |
| `gallery_tile_shuffle` | User clicks shuffle on a tile |
| `gallery_tile_open` | User opens a tile to lightbox view |

---

## 4. Section: Image grid

### 4.1 Tile composition

Each tile in the 3x3 default view:

- Card container with rounded corners (per Document 2 §6.2)
- Image at top in 4:3 aspect ratio, edge-to-edge within card padding
- Below image: room type (display font, larger), style label (app's sans, smaller, 80% opacity)
- At bottom: style cycle controls per §3.2
- Small "Designed in 8 seconds" micro-copy in accent color

### 4.2 Spacing in the grid

- 24px gap between tiles on desktop
- 16px gap on tablet
- 12px gap on mobile
- Outer container max-width: 1200px (per Document 2 §4.2)

### 4.3 Hover behavior (desktop only)

When hovering a tile:
- Card lifts subtly (`translateY(-4px)`) per Document 3 §9
- Image scales slightly inside its container (`scale(1.02)`) for a "live" feel
- A subtle "View larger" hint icon appears in top-right corner
- Cursor changes to indicate clickability

### 4.4 Click behavior (Q2 = D)

Clicking the image area (not the cycle controls) opens a full-screen lightbox modal per the dramatic close transition Hassan specified.

---

## 5. Section: Lightbox modal

### 5.1 Job

Provide an immersive view of the AI-generated room. Make this feel like a moment, not a popup.

### 5.2 Open animation

When the user clicks a gallery tile:
- The page dims (40-50% black overlay) over 200ms
- The clicked image scales up from its tile position to fill the viewport (using GSAP Flip per Document 3 §11)
- The image lands at 80% of viewport, centered
- Caption fades in below the image (200ms delay after image lands)
- Close button fades in top-right (300ms delay)

Total open animation: ~700ms.

### 5.3 Lightbox layout

```
┌──────────────────────────────────────────────┐
│  [×]                                          │  ← Close button top-right
│                                              │
│        ┌────────────────────────┐            │
│        │                        │            │
│        │    Room image          │            │
│        │    (80% viewport)      │            │
│        │                        │            │
│        └────────────────────────┘            │
│                                              │
│        Living Room · Scandinavian            │ ← Caption
│        Designed in 8 seconds                  │
│                                              │
│       [< prev]                  [next >]     │ ← Style nav (within room)
│                                              │
└──────────────────────────────────────────────┘
```

### 5.4 Caption

Below the image, centered:

- Room type and style: app's sans, weight 600, larger size, ink at 100%
- Brief style description: app's sans, weight 400, smaller size, ink at 70%
- "Designed in 8 seconds" micro-copy in accent color

### 5.5 Style navigation within lightbox

Below the caption, two buttons let the user navigate within the room's style options:

- "Previous style" (cycles backwards through the room's available styles)
- "Next style" (cycles forwards)

The lightbox stays open. The image swaps with a smooth crossfade (300ms). This creates an exploration loop that keeps users engaged longer.

### 5.6 Close behavior

User can close the lightbox by:
- Clicking the close button (×) in top-right
- Pressing Escape
- Clicking outside the image area (the dimmed background)
- Pressing back arrow on mobile

Close animation:
- Image scales back down toward its original tile position (300ms)
- Page dim fades out (200ms)
- Total close animation: 500ms

### 5.7 Lightbox accessibility

- ARIA role: `dialog` with `aria-modal="true"`
- ARIA labelled-by: caption text
- Focus trap: when open, focus stays inside the lightbox
- Tab and Shift-Tab move between the close button, prev style, next style
- Initial focus: on the close button when opened

### 5.8 Mobile lightbox

On mobile, the lightbox fills the viewport entirely. No frame, no close button on top corner. Instead:
- A subtle "Tap to close" hint at the top of the screen
- Swipe down to close
- Swipe left/right to cycle through styles

Use the same visual styling as desktop, just adapted to fill mobile viewport.

### 5.9 Lightbox motion specs

- Open: GSAP Flip from tile to fullscreen, 600ms with `power3.out` easing
- Close: Reverse Flip, 400ms with `power2.in` easing
- Style swap: Crossfade 300ms with `power1.out`
- All respect `prefers-reduced-motion`

---

## 6. Section: Below-grid CTA

### 6.1 Job

Capture users who have browsed the gallery and want to take action.

### 6.2 Layout

- Centered, single block below the grid
- Generous vertical padding (`--space-section-y`)
- Section background: page bg or a subtle accent color tint at 5% opacity

### 6.3 Copy

```
Eyebrow: Ready to design yours?

Headline: Your room. Your style. Designed in seconds.

Subheadline: Take a photo of any room. Furnish handles the rest.

Primary CTA: Join the Waitlist (pre-launch) / Get the App (post-launch)
Secondary CTA: See how it works
```

### 6.4 Visual treatment

- Eyebrow: small caps, wide tracking, accent color
- Headline: Fraunces, `--text-display-m`, ink, centered
- Subheadline: app's sans, `--text-body-l`, ink at 80%, centered
- CTAs: side-by-side per Document 5 §1.8 hero pattern

### 6.5 Motion

- Standard section reveal
- Headline reveals line by line if multi-line

---

## 7. Image curation strategy

### 7.1 The 36-image launch inventory (per Hassan's confirmation)

Per Hassan's Q3 = D direction. 4 styles per room x 9 rooms = 36 images.

For each room, Hassan curates 4 images representing 4 different styles. Style selection per room should aim for visual diversity, not duplication. For example:

**Living Room (4 styles):**
1. Scandinavian (warm woods, white walls, light fabric)
2. Mid-century modern (leather sofa, brass details, geometric prints)
3. Bohemian (layered textiles, plants, Persian rug)
4. Contemporary (clean lines, neutral palette, sculptural lighting)

**Bedroom (4 styles):**
1. Mid-century modern (low platform bed, walnut nightstands)
2. Art deco (jewel tones, brass details, patterned headboard)
3. Farmhouse (white linens, exposed beams, vintage decor)
4. Minimalist (clean palette, low decoration)

And so on for the other 7 rooms. Hassan selects which 4 styles best demonstrate variety for each room.

### 7.2 Curation criteria (the 5 rules)

A room qualifies for the gallery only if it meets all 5 criteria from Document 2 §3.2:

1. Geometry is photo-realistic (no warping, no impossible angles)
2. Lighting reads as real interior photography
3. Items in the room are coherent (no duplicates, no floating furniture, no AI clutter)
4. The vibe is recognizable at a glance
5. The composition has a clear focal point

Add a 6th criterion specifically for the gallery:

6. The room represents the style well. A "scandinavian" living room must look unmistakably scandinavian. Style ambiguity disqualifies an image even if it is technically beautiful.

### 7.3 Update cadence (Q5 confirmed)

Hassan refreshes gallery images monthly.

Workflow:
1. Hassan generates new test rooms throughout the month
2. At month's end, picks the best 4 to 8 to add (or replace existing images)
3. Updates the data file (`src/data/gallery.ts`) with new image references
4. Commits to git
5. Vercel auto-deploys; new images live within 2 minutes

Naming convention: `gallery-[room]-[style]-[index].png`. Example: `gallery-living-scandinavian-01.png`. Replacement images get incremented index (`02`, `03`).

### 7.4 Image source

All gallery images come from Hassan's curated test generations. No user-generated content goes into the public gallery without explicit user permission (post-launch consideration).

If Furnish later wants to include user-generated rooms in the gallery, that requires:
- Explicit opt-in from the user during their app session
- Privacy review
- A "submitted by user" attribution (or anonymized framing)

That is a post-launch feature, not v1.

### 7.5 Image specs

- Format on disk: PNG or JPEG (highest quality from generation)
- Resolution: 2048px on the long edge minimum
- Aspect ratio: prefer 4:3 for tile display (16:9 also acceptable for some rooms)
- Build pipeline converts to AVIF + WebP at multiple sizes via Next.js Image
- No file size limits on disk; Next.js handles optimization

### 7.6 Naming and metadata

Each gallery image has metadata stored in `src/data/gallery.ts`:

```typescript
{
  id: string,                    // unique slug for the image
  filename: string,              // file path
  roomType: 'living-room' | 'bedroom' | ...,
  style: 'scandinavian' | 'mid-century-modern' | ...,
  description: string,           // short caption used in alt text and lightbox
  altText: string,               // longer alt text for accessibility
  vibe: 'calm-grounded' | ...,   // optional, maps to app's vibe vocabulary
  addedAt: string,               // ISO date for sorting and "newest first"
}
```

This data file is the source of truth for gallery content. Hassan edits it directly when refreshing.

---

## 8. Mobile-specific adaptations

### 8.1 Hero strip on mobile

- Reduce vertical padding by ~30%
- Headline scales down per fluid type rules
- Counter line stays small

### 8.2 Filter system on mobile

- Filter pills horizontal-scroll
- Touch-friendly hit areas (minimum 44x44px per Apple HIG)
- Filter sticky to top when scrolling (so user can re-filter without scrolling back up)

### 8.3 Grid on mobile

- Single column (1 tile per row)
- Each tile spans full width of viewport
- Style cycle controls remain usable at touch size

### 8.4 Lightbox on mobile

- Per §5.8: full-screen takeover, swipe gestures
- Better for one-handed use

---

## 9. Accessibility requirements (specific to gallery)

Per Document 2 §10. Specific items for gallery:

- All images have descriptive alt text using the format: "[Style] [room type] designed by Furnish AI. [brief scene description]." Example: "Scandinavian living room designed by Furnish AI. White walls, warm wood floors, soft linen sofa, and a Persian rug."
- Filter buttons are keyboard-accessible (Tab, Enter to activate)
- Style cycle controls within tiles use `aria-label`s ("Previous style", "Next style", "Shuffle styles")
- Counter text uses `aria-live="polite"` to announce style changes to screen readers
- Lightbox traps focus and announces state changes to screen readers
- Visible focus rings on all interactive elements per Document 2 §10
- `prefers-reduced-motion` disables tile cycle animations and lightbox transitions

---

## 10. SEO considerations specific to gallery

### 10.1 Per-image SEO

- Each image has descriptive alt text (per §9)
- Each lightbox view has a URL fragment that updates the URL bar (e.g., `/gallery#living-scandinavian-01`)
- This allows direct linking to specific lightbox views (sharing on social, etc.)

### 10.2 Sitemap

- Gallery images do not need individual URLs in sitemap.xml
- The `/gallery` page itself is in sitemap with priority 0.8

### 10.3 Image-specific meta

- Use Next.js `<Image>` with proper width/height to prevent CLS
- Use `loading="lazy"` for below-fold images (default in Next.js)
- Use `loading="eager"` and `priority` on first 6 images

---

## 11. Component breakdown for Claude Code

```
src/components/gallery/
├── GalleryHero.tsx           // The hero strip
├── GalleryFilters.tsx        // Filter pills (room + style)
├── GalleryGrid.tsx           // The 3x3 grid container
├── GalleryTile.tsx           // Individual tile with style cycle
├── GalleryLightbox.tsx       // The fullscreen modal
├── StyleCycler.tsx           // Reusable cycle controls (used in tile and lightbox)
└── GalleryCTA.tsx            // Below-grid CTA section

src/data/
└── gallery.ts                // Image metadata source of truth

src/lib/
├── motion/                   // GSAP utilities (full library established in Doc 3)
└── gallery-utils.ts          // Filtering, randomization, sort utilities
```

### 11.1 Build sequence for the gallery page

1. ☐ Set up route at `src/app/gallery/page.tsx`
2. ☐ Define `gallery.ts` data structure with placeholder for 36 images
3. ☐ Build `<StyleCycler>` reusable component
4. ☐ Build `<GalleryTile>` (combines image + StyleCycler)
5. ☐ Build `<GalleryGrid>` with 3x3 layout and responsive collapse
6. ☐ Build `<GalleryFilters>` with room and style filter pills
7. ☐ Wire filter state to grid view (handle "All rooms" vs single-room collapse)
8. ☐ Build `<GalleryLightbox>` with GSAP Flip transitions
9. ☐ Wire tile click → lightbox open
10. ☐ Build `<GalleryCTA>` below-grid block
11. ☐ Add analytics events
12. ☐ Test mobile gestures (tap to open, swipe to close, swipe to cycle)
13. ☐ Lighthouse pass: 90+ Performance, 95+ Accessibility
14. ☐ Test with reduced motion preferences enabled

---

## 12. Random shuffle behavior (the "always updating" feel)

Per Hassan's Q4 instruction. Random shuffle on each visit. Make the site feel always updating.

### 12.1 Implementation

When the gallery page mounts:
1. For each of the 9 tiles, randomly pick one of the available styles for that room
2. Set that as the initial visible image for that tile
3. The user sees a fresh combination they didn't see last visit

### 12.2 Persistence considerations

The randomization is per-page-load. We do NOT persist it across page loads. Every time the user visits, fresh shuffle.

### 12.3 Why this works as a brand signal

A returning visitor consciously or unconsciously notices:
- "Wait, this looks different than last time"
- "They must be adding new content"
- "This site is always evolving"

That is a positive brand signal. It makes Furnish feel alive, not frozen. The reality is that the underlying images may not have changed at all in a given week. But the user perceives constant freshness.

### 12.4 Edge case

If a room type has only one image (e.g., during early launch when curation is incomplete), the shuffle has no effect for that tile. That is acceptable. The other tiles still shuffle.

---

## 13. Locked decisions summary

| Decision | Locked value |
|---|---|
| Filter strategy | Two filter rows: room and style. Plus per-tile style cycler. |
| Initial layout | 3x3 grid showing all 9 launch room types |
| Per-tile style options | Up to 10 styles per room (4 curated at launch) |
| Total launch image count | 36 (9 rooms x 4 styles) |
| Sort order | Random shuffle on each page load |
| Modal behavior | GSAP Flip fullscreen takeover with style cycling |
| Curation criteria | 6 rules (Doc 2 §3.2 plus "represents style well") |
| Update cadence | Monthly. 4 to 8 new images per month. Hassan curates. |
| Image source | Curated test generations only. User-generated content post-launch with opt-in. |
| Component structure | 7 components in `src/components/gallery/` |
| Em dashes | NEVER. Use periods, commas, colons, parentheses, or rewrites. |

---

## 14. Open questions for next documents

These surfaced but are answered elsewhere:

- **Document 7 (Blog content plan):** How blog posts link back to specific gallery images
- **Document 8 (Static pages spec):** How `/how-it-works` page references the gallery
- **Document 9 (Tech stack):** Image storage strategy (CDN, hosted in repo, Cloudinary, etc.)
- **Document 10 (Skimlinks integration):** Whether gallery images can have any product callouts (probably not in v1)
- **Document 11 (Launch roadmap):** Pre-launch image curation timeline

---

## Appendix A: Copy at-a-glance reference

For quick scanning during build, every piece of copy on the gallery page:

**Hero strip:**
- Eyebrow: "Sample gallery"
- Headline: "Real rooms. Designed by Furnish."
- Subheadline: "36 rooms across 9 room types and 4 styles. Every one of these started with a single photo and finished as something the customer could shop, piece by piece."
- Counter: "36 rooms, growing weekly."

**Tile (per room):**
- Room name (e.g., "Living Room")
- Current style (e.g., "Scandinavian")
- Style cycler: "◀ 3 of 10 ▶ [shuffle]"
- Micro-copy: "Designed in 8 seconds"

**Filter pills:**
- "All rooms"
- "Living Room", "Bedroom", "Kitchen", "Bathroom", "Home Office", "Dining Room", "Nursery", "Walk-in Closet", "Laundry Room"
- "All styles"
- "Scandinavian", "Mid-century Modern", "Industrial", "Bohemian", "Farmhouse", "Contemporary", "Art Deco", "Minimalist", "Traditional", "Eclectic"

**Lightbox caption:**
- Title: "[Room] · [Style]"
- "Designed in 8 seconds"
- Description varies per image (Hassan supplies)

**Below-grid CTA:**
- Eyebrow: "Ready to design yours?"
- Headline: "Your room. Your style. Designed in seconds."
- Subheadline: "Take a photo of any room. Furnish handles the rest."
- Primary CTA: "Join the Waitlist" (pre) / "Get the App" (post)
- Secondary CTA: "See how it works"

---

**End of Document 6 of 11.**

Next document: **Blog Content Plan**. The 5 to 8 launch posts with topics, outlines, and retailer link strategy for Skimlinks credibility.
