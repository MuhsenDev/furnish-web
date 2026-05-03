# Furnish. Document 7 of 11: Blog Content Plan

**Purpose:** Define the launch blog content for furnish.live/blog. This includes 6 launch posts with topics, outlines, retailer link strategy, post templates, and ongoing content cadence. The blog is the central piece of Skimlinks credibility and SEO traffic strategy.

**Audience:** Claude Code (drafts posts), Hassan (edits and publishes), front-end engineers (builds blog templates).

**Status:** Locked unless explicitly revised.

**Dependencies:** Documents 1, 2, 3, 4, 5.

**Critical brand rule:** No em dashes anywhere on the site. This applies to all blog post copy. Use periods, commas, colons, parentheses, or sentence rewrites instead.

---

## 0. The blog's job

The blog at furnish.live/blog exists to serve four jobs in priority order:

1. **Earn Skimlinks credibility.** Editorial content with outbound retailer affiliate links is the precondition for Skimlinks publisher approval.
2. **Drive organic SEO traffic.** Long-tail design queries that lead to Furnish through Google.
3. **Convert blog readers to app users.** Every post has a CTA to try Furnish.
4. **Anchor brand authority.** Demonstrate that Furnish has design taste, not just AI capability.

Every blog post earns its place by serving at least two of these jobs. Posts that serve only one get cut from the editorial calendar.

---

## 1. Locked decisions summary

| Decision | Locked value |
|---|---|
| Launch post count | 6 posts (Hassan Q1 = B) |
| Post types at launch | Style guides, product roundups, room-specific guides, comparison posts, trend posts, founder stories. NO behind-the-scenes AI explainers. |
| Skimlinks density | Moderate. 8 to 12 outbound retailer links per post. |
| Voice | Furnish team voice. Editorial "we", neutral, magazine-like. Bylined as "The Furnish Edit". |
| Comments | None at launch. Zero moderation overhead. Re-evaluate post-launch. |
| Featured products in posts | Full product cards. Image, name, price, retailer, outbound link. Wirecutter-style. |
| Cadence post-launch | One post per month per Hassan's earlier confirmation. |
| Drafting workflow | Claude drafts, Hassan edits, Hassan commits to repo, Vercel auto-deploys. |
| Storage format | Markdown files in `src/content/blog/[slug].md`. No CMS at v1. |

---

## 2. The 6 launch posts (locked editorial calendar)

These 6 posts cover every major Furnish launch room type at least once, span four post types, and collectively contain 60 to 75 outbound retailer links. That is enough volume to satisfy Skimlinks's "active publisher" review.

| # | Post type | Slug | Title | Primary room | Word target |
|---|---|---|---|---|---|
| 1 | Style guide | scandinavian-living-room-2026 | How to Design a Scandinavian Living Room in 2026 | Living Room | 1,400 |
| 2 | Product roundup | best-mid-century-coffee-tables | 12 Best Mid-Century Coffee Tables Under $500 | Living Room | 1,800 |
| 3 | Room-specific | small-bedroom-design-ideas | Small Bedroom Design: 7 Layouts That Actually Work | Bedroom | 1,500 |
| 4 | Comparison | velvet-vs-linen-sofas | Velvet vs. Linen Sofas: Which Should You Pick? | Living Room | 1,200 |
| 5 | Trend | interior-design-trends-2026 | The 8 Interior Design Trends Defining 2026 | Multi-room | 1,800 |
| 6 | Founder story | why-i-built-furnish | Why I Built Furnish | Brand | 1,000 |

Total launch content: ~8,700 words. Roughly 60 to 75 outbound retailer affiliate links across the 6 posts.

---

## 3. Post-by-post specs

### 3.1 Post 1: How to Design a Scandinavian Living Room in 2026

**Slug:** `/blog/scandinavian-living-room-2026`

**Type:** Style guide

**Job:** SEO + Skimlinks. Targets "scandinavian living room" search volume which is high and evergreen.

**Word target:** 1,400 words

**Hero image:** A scandinavian living room from the gallery curation (warm woods, white walls, soft fabrics). Hassan supplies.

**Outline:**

1. Intro (150 words). Hook with the feeling of scandinavian design: warmth, light, calm. Brief overview that this guide gives the reader the pieces and principles to do it themselves.

2. The five principles of scandinavian living rooms (400 words, 5 subheads). Each principle gets a short paragraph.
   - Light over dark
   - Warm wood as the foundation
   - Soft, layered textiles
   - Negative space as a design element
   - Functional minimalism

3. The pieces that make it work (700 words, 8 to 10 product callouts using the product card template from §5). Each callout is one item with full product card details and an outbound retailer link. Pieces to feature:
   - A linen or boucle sofa in a neutral color
   - A walnut or oak coffee table
   - A jute or wool area rug in cream or oatmeal
   - A floor lamp in brushed brass or matte black
   - A pair of throw pillows in soft textured fabric
   - A wool throw blanket
   - One sculptural piece (vase, ceramic object)
   - A wood side table
   - A floor plant (fiddle leaf fig or olive tree)
   - A piece of wall art (botanical print or abstract minimalist)

4. Putting it together (150 words). How to layer these pieces into a real room. Reference the spatial logic from the brand: focal points, walking paths, balance.

5. CTA section (closing). Try Furnish with your living room. Get the AI to do the design and shopping for you. Inline waitlist email field or App Store link.

**Skimlinks links:** ~10 outbound retailer links (one per product callout in section 3).

**Internal links:** Links to /gallery (specifically the scandinavian living room tile), /how-it-works, the home page CTA.

**SEO target keywords:** "scandinavian living room", "scandinavian living room 2026", "how to design scandinavian living room", "nordic living room ideas".

---

### 3.2 Post 2: 12 Best Mid-Century Coffee Tables Under $500

**Slug:** `/blog/best-mid-century-coffee-tables`

**Type:** Product roundup (HEAVY Skimlinks content)

**Job:** Maximum Skimlinks revenue per visit. Targets high-intent shopping searches.

**Word target:** 1,800 words

**Hero image:** A mid-century living room from the gallery, with the coffee table as the visual anchor.

**Outline:**

1. Intro (150 words). Why mid-century coffee tables remain the most versatile choice for modern living rooms. The criteria we used to select these 12 (price, build quality, style accuracy, material).

2. The 12 picks (1,400 words). Each pick uses the full product card template plus a 100-word editorial paragraph explaining why it made the list. Mix of price points within the under-$500 ceiling. Mix of materials (walnut, teak, oak, marble-and-walnut combos). Mix of shapes (oval, round, rectangular).

   Product picks should span retailers (do not concentrate on one retailer). Suggested retailer mix:
   - 3 to 4 from Article
   - 2 to 3 from Wayfair
   - 1 to 2 from West Elm
   - 1 to 2 from CB2 / Crate & Barrel
   - 1 to 2 from AllModern
   - 1 from Burrow or Snowe (for premium variety)

   Each entry has a heading like "1. The Mid-century Foundation: [product name]" and the product card.

3. How to choose the right one for your room (200 words). Three short paragraphs: matching the table to your sofa, scaling to room size, considering material for daily use.

4. CTA section. Take a photo of your living room and let Furnish design around your favorite piece.

**Skimlinks links:** 12 outbound retailer links, one per product.

**Internal links:** Link to scandinavian living room post (cross-link), gallery, home page.

**SEO target keywords:** "best mid-century coffee tables", "mid-century modern coffee table under $500", "affordable mid-century coffee table", "walnut coffee table".

---

### 3.3 Post 3: Small Bedroom Design: 7 Layouts That Actually Work

**Slug:** `/blog/small-bedroom-design-ideas`

**Type:** Room-specific guide

**Job:** SEO traffic + Skimlinks. Small bedroom is one of the highest-volume design search queries.

**Word target:** 1,500 words

**Hero image:** A small bedroom from gallery curation. Suggest a bohemian or scandinavian style.

**Outline:**

1. Intro (150 words). Most bedroom design content assumes you have square footage you do not have. This guide is for the rest of us.

2. The seven layouts (1,000 words, 7 subheads with short illustration ideas). Each layout gets:
   - A 100-word description of the layout
   - 1 or 2 product recommendations using the product card template
   - When this layout works best (room shape, ceiling height, etc.)

   The seven layouts:
   - The corner-bed layout (bed pushed into a corner)
   - The minimalist platform (low bed, minimal accessories)
   - The window-bed (bed centered under a window)
   - The murphy bed setup (for studios or guest rooms)
   - The loft/raised bed (with desk underneath)
   - The split-room (bed plus reading nook)
   - The narrow-room solution (bed against the long wall)

3. The pieces small bedrooms always need (250 words, 4 to 5 product cards). Things like:
   - A nightstand that does not eat floor space
   - Wall-mounted lighting instead of floor lamps
   - A storage bench at the foot of the bed
   - A slim dresser or wardrobe
   - A small floor mirror to expand the space visually

4. Closing (100 words). The principle: design for the room you have, not the room you want. CTA to try Furnish with their actual bedroom photo.

**Skimlinks links:** ~10 outbound retailer links.

**Internal links:** Bedroom-related gallery tiles, /how-it-works.

**SEO target keywords:** "small bedroom design", "small bedroom layout", "small bedroom ideas", "bedroom layouts for small rooms".

---

### 3.4 Post 4: Velvet vs. Linen Sofas: Which Should You Pick?

**Slug:** `/blog/velvet-vs-linen-sofas`

**Type:** Comparison post

**Job:** SEO traffic on a high-intent decision query. Skimlinks revenue from product callouts.

**Word target:** 1,200 words

**Hero image:** A side-by-side or contrast composition. Could be one velvet living room and one linen living room from the gallery.

**Outline:**

1. Intro (150 words). The two fabrics dominate modern living rooms for different reasons. This post helps the reader pick.

2. Velvet sofas: pros and cons (300 words, 1 product card example). Heading and three subheads. Focus on look (formal, jewel-toned, glamorous), feel (soft, dense), durability (wears in nicely but shows pet hair), cleaning (specific, not impossible).

3. Linen sofas: pros and cons (300 words, 1 product card example). Heading and three subheads. Focus on look (casual, beachy, scandinavian), feel (breathable, lightweight), durability (wrinkles, fades), cleaning (slipcovers help).

4. The decision matrix (300 words). When to choose velvet (formal living room, no pets, jewel-tone palette). When to choose linen (everyday family room, kids, lighter palette). When to choose neither (suggest leather or boucle as alternatives, with 2 product cards for each).

5. Our recommendations: 4 picks total (200 words, 4 product cards). Two velvet sofas, two linen sofas, at different price points.

6. CTA section. Try Furnish to see how either fabric looks in your actual living room.

**Skimlinks links:** ~8 outbound retailer links.

**Internal links:** Scandinavian living room post (linen connection), mid-century coffee tables post (sofa pairing), gallery.

**SEO target keywords:** "velvet vs linen sofa", "linen vs velvet couch", "best sofa fabric for living room".

---

### 3.5 Post 5: The 8 Interior Design Trends Defining 2026

**Slug:** `/blog/interior-design-trends-2026`

**Type:** Trend post

**Job:** Authority-building. Trends posts get widely shared on Pinterest and design forums. Drives traffic.

**Word target:** 1,800 words

**Hero image:** A grid composition of 4 to 6 different style rooms from the gallery, showing trend variety.

**Outline:**

1. Intro (200 words). The design world tells you 50 trends each year. We picked the 8 that actually matter. Each one has product evidence: sales data, Pinterest growth, designer adoption.

2. The 8 trends (1,400 words, 8 subheads of ~175 words each).
   - Quiet luxury (the post-bling-ring shift)
   - Boucle softens further (now in everything, not just chairs)
   - Earthy color palettes (terracotta, sage, mushroom)
   - Curved everything (sofas, mirrors, headboards)
   - Cottagecore goes premium (farmhouse without the kitsch)
   - Smart home becomes invisible (devices that hide)
   - Vintage and reclaimed pieces dominate
   - Wellness rooms (meditation corners, light therapy)

   Each trend gets 1 to 2 product cards showing items that exemplify the trend.

3. How to apply trends without redoing your whole room (150 words). The principle: pick one trend, integrate one new piece, do not chase multiple trends at once.

4. CTA section. Try Furnish with one trend in mind and see how it integrates with your existing room.

**Skimlinks links:** ~12 outbound retailer links across the 8 trends.

**Internal links:** Style guide post, gallery (multiple style references), product roundup.

**SEO target keywords:** "interior design trends 2026", "home decor trends 2026", "design trends 2026", "what's trending in home design 2026".

---

### 3.6 Post 6: Why I Built Furnish

**Slug:** `/blog/why-i-built-furnish`

**Type:** Founder story

**Job:** Brand authority and trust. Differentiated content that other AI design tools cannot match. SEO bonus on brand searches.

**Word target:** 1,000 words

**Hero image:** A standout AI-generated room from the gallery. No founder photo at v1.

**Outline:**

1. Hook (150 words). Open with the moment: someone Hassan knew got a $7,000 quote from an interior designer for a single room redesign. The same room could have looked just as good with $2,500 of furniture and the right design. The gap between "having taste" and "executing taste" was the problem.

2. The problem (250 words). Three pain points:
   - Interior designers cost more than most people can justify.
   - Pinterest is endless inspiration without a path to action.
   - Retailers want to sell their inventory, not design your room.
   None of these solve the core problem: helping a real person design and shop a real room they actually live in.

3. The vision (250 words). What Furnish is. AI redesigns the user's actual room from a single photo, in any style they want, and every piece is shoppable. No middleman. No quote. No 8-week wait.

4. The mission (200 words). Democratizing interior design. Making aspiration achievable. Three sentences:
   - Beautiful homes should not be a privilege of those with $5,000 to spend on a designer.
   - The taste is in the user. The execution is what they need help with.
   - Furnish closes the gap.

5. What is next (150 words). Brief roadmap: launching on iOS first, US first, free to try. Multi-room, more styles, more retailers post-launch. Invite to join the waitlist.

**Skimlinks links:** None on this post. It is a brand piece, not a product piece.

**Internal links:** /about, /how-it-works, /gallery, home page CTA.

**SEO target keywords:** "Furnish app", "Hassan Muhsen Furnish", "why Furnish", "AI interior design app".

**Voice note:** This post is bylined as "The Furnish Edit" but written from a slightly more first-person perspective than other posts. The "I" can be used. It is the one place the brand voice gets personal.

---

## 4. Product card template

Every product callout across all posts uses the same visual structure. Consistency builds trust and makes the page feel editorial rather than spammy.

### 4.1 Visual layout

Each product card is a horizontal block on desktop, stacked on mobile.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌────────────┐    Brass-Footed Walnut Coffee Table          │
│  │            │    Article  ·  $399                          │
│  │   Product  │                                              │
│  │   Image    │    A solid walnut top sits on slim brass     │
│  │   ratio    │    legs that read more sculptural than       │
│  │   1:1      │    industrial. Holds up to daily use and     │
│  │            │    works with most living room palettes.     │
│  └────────────┘                                              │
│                                                              │
│                    [ Shop at Article →  ]                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Required fields per product card

- **Product image** (1:1 aspect ratio, 300x300px minimum, AVIF/WebP/JPEG)
- **Product name** (display font, weight 600, larger size)
- **Retailer name + price** (app's sans, smaller, accent color for retailer name)
- **Editorial paragraph** (60 to 100 words, app's sans, regular weight)
- **CTA button** (primary button style with retailer name and arrow)

### 4.3 The CTA button

Each product card has one CTA button labeled `Shop at [Retailer Name]` with a right-arrow icon. Clicking it opens the retailer's product page in a new tab.

The link is a Skimlinks-tracked outbound URL. Document 10 covers the exact format. For now, all product cards use a placeholder URL that gets replaced at build time with Skimlinks-wrapped versions.

### 4.4 Image sourcing

**Important:** Product images come from the retailer, not from Furnish. This is the standard editorial pattern. Most retailers' Terms of Service permit using their product images for editorial purposes that drive traffic back to them. Skimlinks-affiliated retailers explicitly permit this.

For each product:
- Visit the retailer's product page
- Save the primary product image
- Resize to 600x600px max
- Convert to AVIF/WebP at build time
- Store at `public/images/products/[retailer]/[product-slug].avif`

**Edge case:** If a product image cannot be sourced or used legally, swap the product. Do not block on it.

### 4.5 Retailer logos

Below each product card, optionally show a small retailer logo (16-20px height). If the retailer has a recognizable wordmark, display it. If logo licensing is unclear, just use the retailer's name in text. Hassan can decide per launch.

For v1: skip retailer logos. Just text. Clean and unambiguous.

### 4.6 Price display

- US dollars
- No cents (round to nearest dollar)
- "$399" not "$399.00"
- For sale prices: show original struck through and current price (`~~$499~~ $399`)

### 4.7 Pricing data accuracy

Prices in product cards are point-in-time snapshots. They may go out of date.

Disclosure language at the bottom of every blog post:

```
Prices and availability shown were accurate at time of publishing.
Click through to verify current pricing on the retailer's site.
```

---

## 5. Outbound link strategy and Skimlinks integration

### 5.1 Link density

Per Hassan's Q3 = B (moderate). Each blog post embeds 8 to 12 outbound retailer affiliate links. They are concentrated in the product card sections, with occasional inline links in the editorial paragraphs.

### 5.2 Inline link guidelines

Within editorial paragraphs (not product cards), use inline outbound links sparingly:

- 1 to 3 inline links per post outside of product cards
- Inline links go to category or collection pages, not specific products (e.g., "shop [scandinavian sofas](https://...) at Article")
- Inline links use accent-color text with underline on hover only
- Inline links are also Skimlinks-tracked

### 5.3 Internal vs. outbound links

- Internal links (within Furnish's own site): standard text styling, blue or accent color
- Outbound links (to retailers): same text styling, but flagged via the Skimlinks JavaScript SDK at runtime
- All outbound links open in a new tab (`target="_blank" rel="noopener"`)

### 5.4 Disclosure

FTC requires disclosure of affiliate relationships. Every blog post includes a small disclosure block near the top, below the title:

```
This post contains affiliate links. When you buy through one, Furnish may earn a small commission.
This does not change the price you pay or our recommendations.
```

Style: small caps, accent color, low-key. Inline before the first paragraph.

### 5.5 Document 10 dependency

Document 10 (Skimlinks Integration Plan) covers the full technical implementation. This document just establishes the editorial requirements: 8 to 12 retailer links per post, product card pattern, FTC disclosure block.

---

## 6. Post template (technical layout)

The blog post page template is shared across all 6 launch posts and any future posts. Defined here for Claude Code to build once.

### 6.1 Page structure (top to bottom)

1. Navigation (sticky, defined in Document 2)
2. Post header (title, date, reading time, byline)
3. Hero image
4. FTC disclosure
5. Body content (markdown rendered)
6. Inline product cards (rendered from MDX components)
7. CTA box (Try Furnish)
8. Author bio (Furnish team)
9. Related posts (3 cards)
10. Footer

### 6.2 Post header

```
Eyebrow: [Category]   ·   [Reading time]
Headline: [Post title in display font]
Meta: Published on [Date] by The Furnish Edit
```

- Eyebrow: small caps, accent color, wide tracking
- Headline: Fraunces, --text-display-l, ink color, tight tracking
- Meta: app's sans, --text-body-s, ink at 60% opacity

### 6.3 Hero image

- Full-width within content container (max-width: 1200px)
- 16:9 aspect ratio
- Treatment B (editorial card) per Document 2 §3.3
- Caption below (optional, mostly skip for v1)

### 6.4 Body content typography

- Body: app's sans, --text-body-l, line-height 1.6, ink at 90%
- Paragraph spacing: 24px between paragraphs
- Subheads (h2): Fraunces, --text-display-m, 40px top margin, 16px bottom margin
- Sub-subheads (h3): app's sans weight 600, --text-body-xl, 32px top, 12px bottom
- Lists: 16px between items, accent-color bullet markers
- Pull quotes (rare, for emphasis): Fraunces, --text-body-xl, ink at 80%, italic, indented 32px left, 24px vertical margin

### 6.5 Container widths

- Body text: max-width 720px (--container-narrow per Document 2 §4.2)
- Product cards: max-width 880px (slightly wider for visual variety)
- Hero image: max-width 1200px
- Centered within page

### 6.6 CTA box

A dedicated callout block, 60% through the post and again at the end.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│        Try this look in your room                            │
│                                                              │
│        Take a photo of any living room.                      │
│        Furnish redesigns it in your style. Free to try.      │
│                                                              │
│        [ Join the Waitlist ]    [ See How It Works ]         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- Background: subtle accent color tint (10% opacity)
- Border radius: from app tokens
- Padding: 40px desktop, 24px mobile
- CTAs: side-by-side per Document 5 hero pattern

### 6.7 Author bio (bottom of post)

```
─────────────────────────────────────────

The Furnish Edit
Furnish is the AI interior design app. Take a photo of any room and we
redesign it in your style with every piece shoppable. Built for renters,
homeowners, real estate agents, and everyone tired of empty rooms.

[ Try Furnish ]
```

- Background: page bg
- Top border: 1px accent color at 20% opacity
- Padding: 40px vertical
- App's sans, --text-body-l, ink at 80%

### 6.8 Related posts (3 cards at bottom)

3 cards horizontally on desktop, stacked on mobile. Cards link to other blog posts. Auto-selected by category match or manually curated in frontmatter.

### 6.9 Mobile adaptations

- Single column throughout
- Product cards stack (image on top, content below)
- Reduce vertical spacing by ~30%
- Touch targets minimum 44x44px

---

## 7. Frontmatter schema (for Claude Code)

Every markdown blog post starts with frontmatter that drives the post template:

```yaml
---
title: "How to Design a Scandinavian Living Room in 2026"
slug: "scandinavian-living-room-2026"
category: "Style Guide"
publishedAt: "2026-06-15"
readingTime: "7 min"
heroImage: "/blog/scandinavian-living-room-hero.avif"
heroImageAlt: "A bright scandinavian living room with white walls, oak floors, and soft linen sofa"
excerpt: "The five principles, ten essential pieces, and the layout logic that makes this style work in modern homes."
author: "The Furnish Edit"
relatedPosts:
  - "best-mid-century-coffee-tables"
  - "velvet-vs-linen-sofas"
seoTitle: "Scandinavian Living Room Design Guide 2026 | Furnish"
seoDescription: "Step-by-step guide to designing a scandinavian living room in 2026. Five principles, ten pieces, and our top product picks under $500."
---
```

This frontmatter is parsed at build time and powers the page header, SEO meta, related posts, and listing pages.

---

## 8. Drafting workflow

### 8.1 The standard workflow

1. **Hassan tells Claude (or Claude Code) which post to draft.** One at a time, not all six at once.
2. **Claude drafts the full markdown file.** Including frontmatter, body, product cards (with placeholder URLs), CTA boxes, related post links.
3. **Hassan reviews and edits.** Key edits: voice, accuracy of product picks, retailer links, brand consistency.
4. **Hassan or Claude finds product images.** Saved to `public/images/products/[retailer]/[product-slug].avif`.
5. **Hassan replaces placeholder Skimlinks URLs with real ones.** Each retailer URL goes through the Skimlinks wrapper.
6. **Hassan commits the markdown file to git.** Vercel auto-deploys.
7. **Post is live within 2 minutes of commit.**

### 8.2 Estimated time per post

For a 1,500-word post with 10 product cards:
- Drafting: 30 to 45 minutes (Claude)
- Hassan editing: 30 to 60 minutes
- Image sourcing and saving: 30 to 45 minutes
- Skimlinks URL substitution: 15 minutes
- Commit and verify: 5 minutes

**Total per post: 2 to 3 hours.**

For six launch posts: roughly 12 to 18 hours of total work spread across drafting and editing.

### 8.3 Post-launch cadence

One new post per month. The same workflow applies. Post-launch posts can be:
- Trend updates ("design trends Q3 2026")
- New product roundups
- Style guides for additional rooms
- Comparison posts on different fabric, color, or material decisions

The editorial calendar can be maintained in a simple spreadsheet or in a markdown file in the repo (`src/content/blog/_calendar.md`).

---

## 9. SEO strategy for the blog

### 9.1 Per-post SEO

Each post sets:
- `<title>`: post-specific, under 60 chars, brand at end
- `<meta name="description">`: post-specific, 140 to 160 chars, action-oriented
- Canonical URL: `https://furnish.live/blog/[slug]`
- OG image: post hero image, 1200x630px or close
- JSON-LD: BlogPosting schema with author, datePublished, dateModified, image, headline, description

### 9.2 Internal linking

Every post links to:
- 2 to 3 other Furnish blog posts (related content)
- The home page or /how-it-works at least once
- The /gallery page at least once

This creates internal link equity that helps SEO.

### 9.3 Content freshness

Once a post is published, it does not need to be rewritten quickly. But:
- Update prices in product cards every 3 to 6 months (or remove out-of-stock products)
- Update the post's `updatedAt` frontmatter when meaningful changes happen
- Trends posts should be updated annually (e.g., 2026 trends post becomes 2027 trends post)

### 9.4 Sitemap and submission

- Each published post auto-includes in `sitemap.xml` via Next.js
- Submit sitemap to Google Search Console at launch
- Re-submit when 6+ posts are live to ensure indexing

---

## 10. Voice and editorial guidelines

### 10.1 The Furnish Edit voice

The blog uses the brand voice from Document 1, with specific calibration for editorial content:

**Voice characteristics:**
- We, not I (editorial plural)
- Confident and direct
- Specific over vague (give exact numbers, names, dimensions)
- No design jargon
- Active voice always
- Short sentences and short paragraphs (3 to 5 sentences max per paragraph)

**Examples of the right voice:**

✓ "The five principles of scandinavian design start with light. Every choice flows from there."
✓ "Article's solid walnut coffee table costs $399. It is the most versatile piece on this list."
✓ "Pick velvet for a formal living room. Pick linen for everyday use. Pick boucle if you cannot decide."

**Examples of the wrong voice:**

✗ "In today's rapidly evolving design landscape, scandinavian principles continue to dominate."
✗ "Furnish believes that every individual deserves access to professional design tools."
✗ "Discover the timeless allure of mid-century furniture in our comprehensive guide."

### 10.2 Editorial style rules

1. Sentence case for headlines, not title case. "How to design a scandinavian living room in 2026" not "How To Design A Scandinavian Living Room In 2026". Exception: post titles can use title case for readability if it looks better.

2. Numbered lists are common. Bulleted lists are rare.

3. No "as we mentioned earlier" or "in this article we will discuss". Just say what you mean.

4. Em dashes are banned (per the brand rule). Use periods, commas, colons, parentheses, or sentence rewrites.

5. Ellipses (...) are banned in published copy. They feel uncertain and dated.

6. Exclamation marks are banned in body copy. Allowed only in CTA buttons or moments of genuine emotional emphasis.

7. Single space after periods, not double.

8. Always use the Oxford comma.

### 10.3 Product description voice

For product card descriptions specifically:

- Lead with the most important attribute
- Use sensory language sparingly
- Mention what it pairs with
- Avoid superlatives ("the best", "perfect", "stunning")
- 60 to 100 words exactly

Example of good product description:
> "A solid walnut top sits on slim brass legs that read more sculptural than industrial. Holds up to daily use and works with most living room palettes."

Example of bad product description:
> "Discover the absolute pinnacle of mid-century elegance. This stunning coffee table will transform your living room into a designer haven of timeless sophistication."

---

## 11. Skimlinks credibility checklist

For Skimlinks publisher review, the launch blog must demonstrate:

- [x] Live, working blog with 5+ posts
- [x] Original editorial content (not scraped or AI-only)
- [x] Outbound retailer links across 3+ retailers
- [x] Clear FTC disclosure on every post
- [x] Author byline (The Furnish Edit)
- [x] About page with brand information
- [x] Privacy Policy and Terms of Service
- [x] Functional Contact method (email link in footer)
- [x] No copyright violations (all images sourced legally)
- [x] Mobile responsive
- [x] SSL certificate (Vercel provides automatically)

When all items are checked and the blog has been live for 2+ weeks with measurable traffic, re-apply to Skimlinks. The application should reference furnish.live/blog as the editorial home.

---

## 12. Component breakdown for Claude Code

The blog uses these new components on top of Document 5's home page components:

```
src/components/blog/
├── BlogIndex.tsx              // The /blog page listing all posts
├── BlogPost.tsx               // The /blog/[slug] page template
├── BlogPostCard.tsx           // Card used in index and related posts
├── BlogPostHeader.tsx         // Title, date, reading time, byline
├── BlogPostHero.tsx           // Hero image at top of post
├── ProductCard.tsx            // The Wirecutter-style product callout
├── BlogCTABox.tsx             // The "Try this look in your room" callout
├── BlogAuthorBio.tsx          // Bottom-of-post author block
├── BlogRelatedPosts.tsx       // 3 related posts grid
├── BlogDisclosure.tsx         // FTC disclosure block
├── BlogCategoryFilter.tsx     // Category pills on /blog index
└── BlogPagination.tsx         // Pagination for /blog index

src/content/blog/
├── _calendar.md               // Editorial calendar (private, not deployed)
├── scandinavian-living-room-2026.md
├── best-mid-century-coffee-tables.md
├── small-bedroom-design-ideas.md
├── velvet-vs-linen-sofas.md
├── interior-design-trends-2026.md
└── why-i-built-furnish.md

public/images/products/
├── article/
├── wayfair/
├── west-elm/
├── cb2/
├── allmodern/
└── burrow/
```

### 12.1 Build sequence for the blog

1. ☐ Set up `/blog` route at `src/app/blog/page.tsx`
2. ☐ Set up `/blog/[slug]` route at `src/app/blog/[slug]/page.tsx`
3. ☐ Build markdown parsing pipeline (gray-matter + remark/rehype or MDX)
4. ☐ Build `<ProductCard>` component (most important, used everywhere)
5. ☐ Build `<BlogPostHeader>`, `<BlogPostHero>`, `<BlogPost>` template
6. ☐ Build `<BlogIndex>` listing page with category filters and pagination
7. ☐ Build `<BlogCTABox>` with pre/post-launch CTA states
8. ☐ Build `<BlogAuthorBio>` and `<BlogRelatedPosts>`
9. ☐ Build `<BlogDisclosure>` for FTC affiliate disclosure
10. ☐ Author 6 launch posts in markdown (Claude drafts, Hassan edits)
11. ☐ Source product images for all 60 to 75 product cards
12. ☐ Wire Skimlinks URL wrapping at build time (Document 10 spec)
13. ☐ Add JSON-LD structured data (BlogPosting schema)
14. ☐ Submit sitemap to Google Search Console
15. ☐ Lighthouse pass: 90+ Performance, 95+ Accessibility on blog pages
16. ☐ Verify FTC disclosure renders on every post

---

## 13. Open questions for next documents

These surfaced but are answered elsewhere:

- **Document 8 (Static pages spec):** /about, /how-it-works full content
- **Document 9 (Tech stack):** Markdown vs. MDX decision, image storage strategy
- **Document 10 (Skimlinks):** Exact technical implementation of outbound link wrapping
- **Document 11 (Launch roadmap):** Pre-launch content drafting timeline

---

## Appendix A: Initial post slug list (for reference)

For Claude Code to scaffold the markdown files in advance:

```
src/content/blog/
├── scandinavian-living-room-2026.md
├── best-mid-century-coffee-tables.md
├── small-bedroom-design-ideas.md
├── velvet-vs-linen-sofas.md
├── interior-design-trends-2026.md
└── why-i-built-furnish.md
```

Each file starts as an empty markdown file with the frontmatter schema from §7 filled in. Body content gets drafted by Claude in subsequent steps.

---

## Appendix B: Retailer mix at launch

For Skimlinks credibility, the 60 to 75 outbound links across the 6 launch posts should span at least 6 different retailers. Rough target distribution:

- Article: 15 to 20 links
- Wayfair: 10 to 15 links
- West Elm: 8 to 12 links
- CB2 / Crate & Barrel: 8 to 12 links
- AllModern: 6 to 10 links
- Burrow: 4 to 6 links
- Snowe: 3 to 5 links
- Other (Heirloom, Schoolhouse, Rejuvenation, etc.): 5 to 10 links across multiple

All retailers must be Skimlinks-affiliated (verifiable in Skimlinks's merchant directory). If a retailer is not in Skimlinks's network, the link does not earn commission, so swap to an alternative.

---

**End of Document 7 of 11.**

Next document: Static Pages Spec (about, how-it-works, FAQ content).
