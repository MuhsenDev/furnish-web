# Furnish. Document 4 of 11: Site Architecture

**Purpose:** Define the structural skeleton of furnish.live, what pages exist, how they connect, how URLs are organized, and what ships in v1 vs. future versions. Every page on the site has a job; this doc defines the jobs.

**Audience:** Claude Code (executor), front-end engineers, content team (Hassan as editor), SEO contributors.

**Status:** Locked unless explicitly revised.

**Dependencies:** This document builds on Document 1 (Brand Foundation), Document 2 (Visual Design System), and Document 3 (Animation System). Page hierarchy, copy, visual treatments, and motion choreography all flow from those decisions.

---

## 1. Site philosophy

furnish.live exists to do four jobs, in priority order:

1. **Convert visitors to app users.** Either via App Store install (post-launch) or waitlist signup (pre-launch).
2. **Demonstrate the product visually.** Every page shows the AI-generated rooms, proof, not promise.
3. **Earn Skimlinks credibility.** Editorial content with outbound retailer links so Skimlinks (and similar networks) approve us as a publisher.
4. **Anchor the brand.** Apple requires a marketing URL. The site is the canonical place where Furnish lives publicly outside the App Store.

Every architectural decision below traces back to these four jobs. If a page doesn't serve at least one of them, it doesn't ship.

---

## 2. Domain strategy

### 2.1 Locked decisions

| Domain | Use | When |
|---|---|---|
| `furnish.live` | Marketing site (this project) | Now, v1 launch |
| `app.furnish.live` | Web app / PWA (future deferred-flow signed-in product) | Post-launch (Phase 2 feature) |
| `blog.furnish.live` | Blog | NOT this project, see §2.3 |

### 2.2 Why split `furnish.live` from `app.furnish.live`

- **Marketing speed.** Marketing site rebuilds and content updates don't ship app code; they're independent deploys.
- **Performance independence.** Marketing site can use heavy GSAP animations without bloating the app.
- **Branch isolation.** The actual product (the iOS app + future PWA) lives at `app.furnish.live`, on its own deploy pipeline.
- **SEO clarity.** Google indexes marketing content at `furnish.live`; the app is logged-in territory.

### 2.3 Blog: subdomain or subpath?

**Locked decision: Blog lives at `furnish.live/blog`, NOT at `blog.furnish.live`.**

Reasoning (this overrides what looked like the obvious "split everything" pattern):
- **SEO benefit accrues to the same domain.** Blog content with strong organic traffic boosts the marketing site's domain authority. Subdomains are treated as separate sites by Google.
- **Skimlinks evaluation.** Skimlinks wants to see editorial content on the publisher's main domain. `furnish.live/blog` reads as "Furnish has a content hub." `blog.furnish.live` reads as "separate property."
- **Build simplicity.** One Next.js project, one deploy, one styling system.

The marketing site at `furnish.live` is one Next.js project with `/blog` as a subroute.

### 2.4 Post-launch deferred-flow consideration

When the deferred-flow PWA launches (post-launch Priority 2), it goes to `app.furnish.live`. The marketing site's "Get the App" CTAs route to:
- iOS App Store (always primary)
- `app.furnish.live` (secondary, for desktop visitors who want to use the web version)

This keeps the marketing site's job focused on conversion without becoming the product.

---

## 3. Sitemap (v1: Launch)

```
furnish.live/
├── /                          (Home, landing/marketing page)
├── /how-it-works              (How It Works, process & demo)
├── /gallery                   (Sample Gallery, curated AI-generated rooms)
├── /about                     (About. Furnish's story & mission)
├── /blog                      (Blog index)
│   ├── /blog/[slug]           (Individual blog post)
│   └── /blog/category/[cat]   (Category index, optional v1)
├── /privacy                   (Privacy Policy, required by Apple)
├── /terms                     (Terms of Service, required by Apple)
└── /404                       (Not Found page, branded)
```

**Total v1 pages:** 7 unique page templates + dynamic blog posts + 404. That's a focused, shippable scope.

**Pages explicitly NOT in v1 (deferred to v2 or never):**

- ❌ `/login`, login lives at `app.furnish.live`, not on marketing site
- ❌ `/signup`, same as login
- ❌ `/account`, app-side concern
- ❌ `/pricing`. Furnish is free at launch (no IAP yet)
- ❌ `/help` or `/support`, handled in-app and via email; not a marketing page
- ❌ `/press`, no press kit yet, deferred to post-launch
- ❌ `/careers`, single founder, no team, irrelevant for v1
- ❌ `/contact`, replaced by an email link in the footer (`hello@furnish.live` or similar)
- ❌ `/changelog`. Furnish doesn't have a public changelog at launch; the App Store handles this

This restraint matters. A 30-page marketing site for a pre-launch app reads as bloat. 7 pages reads as confidence.

---

## 4. Page-by-page spec (purpose & primary action)

This section defines what each page is FOR and what the user is supposed to do on it. Detailed copy and section design live in Documents 5-8. This is the architectural skeleton.

### 4.1 `/` (Home)

**Purpose:** Convert. Demonstrate. Hook.

**Primary user action:**
- **Pre-launch:** Submit email to waitlist
- **Post-launch:** Tap "Get the App" → iOS App Store

**Page sections (high level. Document 5 details each):**
1. Hero (headline + waitlist/download CTA + cinematic generated room background)
2. Three-statement value prop (Photo in / AI designs / Shop the room)
3. Sample gallery preview (6 rooms, link to `/gallery` for more)
4. Before/after compare slider (the wow moment)
5. How It Works 3-step diagram (link to `/how-it-works` for deep dive)
6. "Why Furnish" comparison block (vs. designers / vs. retailers / vs. Pinterest)
7. Final CTA (waitlist or App Store)
8. Footer

**Length:** Long-scroll, intentional. ~6-8 viewport heights on desktop. Each section breathes per Document 2's pacing rules.

**SEO target:** Brand-name searches ("Furnish app," "AI room design app"), featured-snippet candidates ("how to design a room with AI").

### 4.2 `/how-it-works`

**Purpose:** Educate skeptics. Address "is this real?" and "is it good?" concerns. Convert mid-funnel users.

**Primary user action:** Tap "Try it now" → home page CTA or App Store.

**Page sections:**
1. Hero (more detailed, "From your photo to your dream room in 8 seconds")
2. Step-by-step walkthrough with screenshots/diagrams (4-5 steps: photo, quiz, AI generates, review, shop)
3. The technology behind it (brief, non-technical: "Trained on millions of design choices, generates photo-realistic rooms")
4. Comparison: traditional designer vs. Furnish (time, cost, output)
5. FAQ (5-8 common questions: image rights, photo storage, accuracy, retailer choice, etc.)
6. CTA to home / App Store

**Length:** Medium-long scroll. ~5-6 viewport heights.

**SEO target:** "How does AI room design work," "AI interior design app explained."

### 4.3 `/gallery`

**Purpose:** Proof through volume. Skeptics convert here when they see 30+ examples.

**Primary user action:** Browse, get hooked, click CTA.

**Page sections:**
1. Hero ("See What's Possible, 30+ Rooms Designed by Furnish")
2. Filter bar: by Room Type, by Style (Mid-century, Scandinavian, Industrial, etc.), by Vibe
3. Grid of curated AI-generated rooms (Treatment B from Doc 2)
4. Each card: image + small caption (style name, room type, "Designed in 8 seconds")
5. Click a card → modal with before/after compare slider
6. CTA at bottom: "Try It With Your Room"

**Initial gallery size:** 24 curated rooms across 6 styles × 4 room types (per Document 2 §3.2). Adds 4-8 per month.

**SEO target:** Style-specific queries ("scandinavian living room AI design," "industrial bedroom inspiration").

### 4.4 `/about`

**Purpose:** Build trust through story. The "I built this because…" moment.

**Primary user action:** Trust → CTA at bottom.

**Page sections:**
1. The vision (1-2 paragraphs, what Furnish is, why it matters)
2. The founder (Hassan, 18, building this, short authentic story)
3. The mission (democratizing interior design, making aspiration achievable)
4. The technology (brief, what powers Furnish. Gemini AI, etc.)
5. CTA

**Length:** Short. Single viewport on desktop, ~2 viewports on mobile.

**SEO target:** Brand searches, "who made Furnish app."

### 4.5 `/blog`

**Purpose:** Skimlinks credibility + SEO traffic + brand authority.

**Primary user action:** Read content, click outbound retailer links (Skimlinks tracks), browse to other posts.

**Page sections:**
1. Hero (small): "The Furnish Edit. Design ideas, room inspiration, and shopping guides"
2. Featured post (the most recent or highest-traffic)
3. Grid of all posts (chronological, most recent first)
4. Categories sidebar or top-of-page filter (Living Room, Bedroom, Kitchen, Style Guides, How-To)
5. Pagination at bottom (or infinite scroll on mobile)

**Initial content at launch:** 5-8 posts per Hassan's commitment in Document 7 (Blog Content Plan).

**SEO target:** Long-tail design queries ("best mid-century coffee tables 2026," "how to style a small bedroom," "scandinavian living room ideas").

### 4.6 `/blog/[slug]` (Individual blog post)

**Purpose:** SEO + Skimlinks revenue + brand voice extension.

**Primary user action:** Read, click product links (outbound retailer affiliate links via Skimlinks), browse to related posts at bottom.

**Page sections:**
1. Title + meta (date, reading time, category)
2. Hero image (relevant AI-generated room or product collage)
3. Body content (markdown-rendered, with embedded Furnish app callouts every 800-1200 words)
4. In-line product recommendations with outbound retailer links (affiliate-tracked)
5. "Try this look in your room" CTA box (links to home page)
6. Author bio (Hassan)
7. Related posts (3 cards)
8. Comments: NOT enabled v1 (moderation cost > value)

**Affiliate linking pattern:** Each post embeds 8-15 outbound retailer links to specific products. These are the heart of the Skimlinks integration, see Document 10 for the full pattern.

### 4.7 `/privacy`

**Purpose:** Apple App Store requires it. Legally protect Furnish.

**Primary user action:** Read or skim, then leave.

**Content:**
- Generated using a privacy policy generator (Termly, iubenda, Termsfeed) tailored to:
  - iOS app + web marketing site
  - Photo storage and AI processing
  - Skimlinks affiliate tracking
  - Google Sign-In and Apple Sign-In
  - Email collection (waitlist)
  - GDPR + CCPA compliance baseline
- Reviewed by Hassan; ideally lawyer-reviewed before launch ($200-500 one-time review).

**Length:** Long, plain-text, legally formatted. No marketing flourish.

### 4.8 `/terms`

**Purpose:** Apple requires it. Defines user obligations and Furnish's rights.

**Primary user action:** Same as Privacy.

**Content:** Generated alongside privacy policy. Covers acceptable use, account termination, disclaimers, governing law, etc.

### 4.9 `/404` (Not Found)

**Purpose:** Brand-correct dead-end. Don't lose users to a generic 404.

**Page content:**
- "Looks like this room is empty."
- A subtle illustration (or a single generated room image)
- CTA: "Take me home" (link to /) and "Browse the Gallery" (link to /gallery)

**Status:** Required, low effort, ships v1.

---

## 5. Navigation structure

### 5.1 Locked decision: Two-tier nav

Per Hassan's "why not all" question, having all items in nav is fine because we're keeping the total small (5 items) and using a full-screen takeover (per Document 2 §5.3 Moment 5) to display them dramatically. No cramping.

**Primary nav (visible by default, top-right):**
- Furnish wordmark on left → `/`
- "Menu" text trigger on right (opens full-screen takeover)
- Pre-launch: "Join Waitlist" pill button on far right (always visible, even on mobile)
- Post-launch: "Get the App" pill button on far right (always visible)

**Full-screen menu takeover items (clicking "Menu"):**
1. Home → `/`
2. How It Works → `/how-it-works`
3. Gallery → `/gallery`
4. Blog → `/blog`
5. About → `/about`

That's 5 items. Clean. Each gets large display type, sequential reveal animation, hover-state delight.

### 5.2 Footer nav

The footer carries the rest of the items that don't deserve primary nav real estate:

**Footer column 1. Brand:**
- Furnish wordmark + tagline ("Take a photo. Furnish does the rest.")
- iOS App Store badge (post-launch) OR "Coming soon, join the waitlist" (pre-launch)
- Brief blurb (1-2 lines) reinforcing the brand

**Footer column 2. Site:**
- Home
- How It Works
- Gallery
- Blog
- About

**Footer column 3. Legal & Contact:**
- Privacy Policy
- Terms of Service
- `hello@furnish.live` (email link)
- Social: X / Instagram / TikTok (if Hassan has any presence there yet)

**Footer bottom strip:**
- © 2026 Furnish. All rights reserved.
- Subtle separator
- Optional: language switcher (English | عربي | Français | Español), see §7.

### 5.3 Anchor links (within Home page)

The home page is long-scroll. Anchor links make navigation faster:

- `#how-it-works` → scrolls to "How It Works" section
- `#gallery-preview` → scrolls to gallery preview
- `#why-furnish` → scrolls to comparison block
- `#waitlist` (pre-launch) or `#download` (post-launch) → scrolls to bottom CTA

These anchors live in the URL bar when clicked but don't add to browser history (`replace: true`).

### 5.4 Breadcrumbs

**Pages that use breadcrumbs:**
- `/blog/[slug]`, breadcrumb shows: Home / Blog / Post Title

**Pages that don't use breadcrumbs:**
- All marketing pages (Home, How It Works, Gallery, About), they're top-level, breadcrumbs would clutter

---

## 6. URL strategy

### 6.1 Rules

1. **Lowercase only.** `/how-it-works` not `/How-It-Works`.
2. **Hyphens between words.** `/how-it-works` not `/howitworks` or `/how_it_works`.
3. **No trailing slashes.** `/about` not `/about/`. Configure Next.js to redirect with-slash → without-slash to avoid duplicate-content SEO penalty.
4. **No dates in blog URLs.** `/blog/scandinavian-living-room-guide` not `/blog/2026/05/scandinavian-living-room-guide`. Cleaner, more evergreen, easier to refresh content without changing URL.
5. **Slugs are SEO-optimized, not literal post titles.** "Top 10 Mid-Century Coffee Tables Under $500" might be filed as `/blog/mid-century-coffee-tables`. Slugs are short, keyword-focused.
6. **Categories live at `/blog/category/[cat]`** if Hassan wants topic clusters. Optional for v1.

### 6.2 Redirects

**On launch, configure these 301 redirects in Next.js:**

| From | To |
|---|---|
| `/about-us` | `/about` (alternate phrasing) |
| `/contact` | `/about#contact` (anchor) |
| `/help` | `mailto:hello@furnish.live` |
| `/app` | App Store URL (post-launch) |
| `/ios` | App Store URL (post-launch) |
| `/android` | `/?coming-soon=android` (placeholder; Android isn't built) |
| `/gallery/all` | `/gallery` |
| `/work` | `/gallery` (some users from fromanother-style sites use "work") |

Add more as analytics shows what URLs people guess but don't find.

### 6.3 Canonical URLs

Every page sets `<link rel="canonical">` to the non-localized, non-trailing-slash URL. This prevents duplicate-content issues.

For multilingual (see §7): each language version sets canonical to ITSELF (not the English version), and uses `<link rel="alternate" hreflang="..." />` to point to other languages.

---

## 7. Internationalization (i18n)

### 7.1 Locked decision

**i18n architecture is built v1. Content is English-only at launch. Translations come post-launch when there's user data justifying which languages.**

This is the right tradeoff because:
- Doing i18n architecture later is a painful refactor
- Doing i18n content now wastes Hassan's time (no users to serve in non-English)
- Skimlinks doesn't care about language; it cares about traffic

### 7.2 What "i18n architecture" means concretely

1. **Locale routing structure.** Next.js i18n config with `locales: ['en']` at v1, `defaultLocale: 'en'`. Adding 'es', 'fr', 'ar' is a config change later, not a rewrite.
2. **All copy via translation keys, not hardcoded strings.** Every visible piece of copy (headlines, button text, captions) lives in `messages/en.json` and is referenced by key in components. Even at v1.
3. **Dates, numbers, currency formatted via `Intl` APIs.** Not hardcoded `"$3,000"` but `formatCurrency(3000, locale)`.
4. **Right-to-left (RTL) support stubbed.** When Arabic launches, the layout flips. CSS uses logical properties (`margin-inline-start` not `margin-left`) from day one.
5. **Image alt text via translation keys.** Even AI-generated room descriptions are translatable.

### 7.3 Future locales (post-launch)

Targets, in priority order:
1. **Spanish (`es`)**, large US market + Latin America
2. **French (`fr`)**. France, Belgium, Quebec
3. **Arabic (`ar`)**. Hassan's heritage market + RTL implementation milestone
4. **German (`de`)**, strong design-conscious market
5. Others as data dictates

### 7.4 What to NOT do

- ❌ Don't auto-translate via Google Translate. Bad translations kill brand trust.
- ❌ Don't mix languages on a single page. If a user is on `/es/about`, every word is Spanish.
- ❌ Don't translate the brand wordmark. "Furnish" stays "Furnish" in every language.

---

## 8. Image inventory required

Per Hassan's request, this is the list of images Hassan must supply for the v1 site. **Total: ~45 images**. I worked to keep it as small as possible while still hitting the visual ambition.

### 8.1 Hero generations (4 images)

For the home hero. Different times of day, different rooms, different styles. Cycled or rotated as the hero background.

1. **Hero-1**: A bright morning living room, scandinavian style, warm woods, neutral palette
2. **Hero-2**: An evening bedroom, art-deco vibe, moody lighting, jewel tones
3. **Hero-3**: A kitchen mid-day, farmhouse style, herbs and natural light
4. **Hero-4**: A home office, mid-century, sunlight through windows

### 8.2 Sample gallery (24 images, same set used across `/gallery` page and `/`'s gallery preview)

Six styles × four room types. Each image is a "wow" generation, the best curated output Furnish has produced.

**Styles:**
- Scandinavian
- Mid-century modern
- Industrial
- Bohemian
- Farmhouse
- Contemporary

**Room types:**
- Living Room
- Bedroom
- Kitchen
- Home Office

**6 × 4 = 24 images.** Hassan curates these from the AI generations across all the test runs we've been doing.

### 8.3 Before/after pairs (6 image pairs = 12 images total)

For the comparison slider on the home page and `/how-it-works`. Each pair: the original photo + the Furnish redesign of the same room.

1. Empty living room → designed scandinavian
2. Half-empty bedroom → designed art-deco
3. Plain kitchen → designed farmhouse
4. Bare home office → designed mid-century
5. Empty bathroom → designed contemporary
6. Bare dining room → designed industrial

### 8.4 Blog post hero images (5 images at launch, see Doc 7 for post topics)

One per blog post at launch. Each is a relevant AI-generated room image OR a product collage.

### 8.5 About page (1 image)

A single hero image for the About page. Suggestion: a particularly beautiful generated room (any style) that captures the brand's emotional payoff.

### 8.6 OG / social share image (1 image, used everywhere as fallback)

A single image used as the default `<meta property="og:image">` for social sharing. 1200×630px. Suggestion: a curated room image with the Furnish wordmark + tagline overlay.

### 8.7 NOT needed images (do NOT supply)

- ❌ Photos of Hassan
- ❌ Stock photos of any kind
- ❌ Logos of retailers (Wayfair, etc., not used at v1)
- ❌ Customer testimonial photos (no testimonials yet)
- ❌ Team photos (single founder)

### 8.8 Image specs (when Hassan supplies)

- **Format:** Original PNG or JPEG (highest quality from the generation). Claude Code will convert to AVIF + WebP at build time.
- **Resolution:** 2048px minimum on the long edge. Larger is fine (3840px) for hero images, the build pipeline will downscale.
- **Aspect ratios needed:** 16:9 for hero, 4:3 or 3:2 for gallery cards, 16:9 for blog hero, 1.91:1 for OG image (1200×630).
- **Naming convention:** `[section]-[index]-[descriptor].png`, e.g., `gallery-12-scandi-bedroom.png`, `hero-2-artdeco-evening.png`. Helps Claude Code organize.

### 8.9 Total inventory

- Hero: 4
- Gallery: 24
- Before/after: 12
- Blog: 5
- About: 1
- OG: 1
- **Total: 47 images**

This is a real but manageable lift. Curated from the test generations Hassan has been doing, most of these probably already exist in his outputs. Curation is the work, not generation.

---

## 9. Build phases

### 9.1 Phase 1: Foundation (1-2 days of focused build)

- Repo setup (Next.js 14+, TypeScript, Tailwind)
- Design tokens extracted from app (per Document 2 §0)
- Routing scaffolding (all 7 page templates as empty shells)
- Foundational components (`<Button>`, `<Card>`, etc. per Document 2 §6)
- Navigation + footer components
- GSAP setup and motion library scaffold (per Document 3 §17)
- Loading sequence (per Document 3 §4)
- 404 page

### 9.2 Phase 2: Home page (2-3 days)

- All home sections built per Document 5 spec
- Hero with sequential headline reveal (per Document 3 §5)
- Before/after compare slider, the big one (per Document 3 §7)
- Scroll-triggered section reveals throughout (per Document 3 §6)
- Sample gallery preview (uses subset of the 24 gallery images)
- Comparison block ("Why Furnish")
- Final CTA + footer

### 9.3 Phase 3: Supporting pages (2-3 days)

- `/how-it-works` page
- `/gallery` page with filter bar
- `/about` page
- `/privacy` and `/terms` (legal copy generated and inserted)

### 9.4 Phase 4: Blog (1-2 days)

- Blog index `/blog`
- Blog post template `/blog/[slug]`
- 5 launch posts published (per Document 7)
- Skimlinks integration tested on outbound links
- RSS feed (optional but cheap)

### 9.5 Phase 5: Polish & launch (2-3 days)

- Lighthouse pass (Performance 90+, Accessibility 95+)
- Cross-browser testing
- Image optimization audit
- Analytics integration (Plausible or PostHog)
- Sitemap.xml + robots.txt
- Deploy to Vercel + DNS configured
- Final Hassan review pass

**Total realistic timeline: 8-13 days of focused work.** Less if Hassan is the only blocker (decisions land fast). More if blog content takes longer to write/edit.

---

## 10. SEO foundations

### 10.1 Per-page SEO

Every page (including blog posts) sets:

- `<title>`, under 60 characters, brand at end (e.g., "How AI Designs Your Room | Furnish")
- `<meta name="description">`, 140-160 characters, action-oriented, brand-voice
- `<link rel="canonical">`, non-localized, non-trailing-slash URL
- `<meta property="og:*">` for social sharing (title, description, image, url, type)
- `<meta name="twitter:card">` set to `summary_large_image`
- `<meta name="robots" content="index,follow">` (default; `noindex,nofollow` only on `/404`)

### 10.2 Sitemap & robots

- `sitemap.xml` auto-generated on build, includes all marketing pages + all published blog posts
- `robots.txt` allows all crawling, points to `sitemap.xml`
- Submitted to Google Search Console + Bing Webmaster Tools at launch

### 10.3 Structured data (JSON-LD)

- **WebSite schema** on home page (with sitelinks search box)
- **Organization schema** on home page (with logo, social profiles)
- **BlogPosting schema** on each blog post (author, date, headline)
- **BreadcrumbList schema** on blog posts

### 10.4 Performance & Core Web Vitals

Per Document 2 §11. Same targets carry forward to architecture decisions:
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Lighthouse 90+

---

## 11. Analytics

### 11.1 Locked decision: Plausible Analytics

**Why Plausible over Google Analytics:**
- Lightweight (~1KB script vs. Google's 50KB+)
- Privacy-respecting (no cookies, GDPR-compliant by default)
- No need for cookie banner on EU users (huge UX win)
- $9-19/month for a small site, affordable
- Beautiful dashboard, simple metrics

**Alternative considered:** PostHog, more powerful (event tracking, funnels, session replay) but heavier and overkill for a marketing landing site at v1. Reconsider for v2 when behavioral analytics matters more.

### 11.2 Events to track

- Page views (auto)
- Outbound link clicks (especially blog post Skimlinks links, for affiliate revenue attribution)
- App Store / waitlist CTA clicks (which page they convert from)
- Compare slider interactions (engagement signal)
- Menu open / link clicks
- Scroll depth (per page, see how far users get)

### 11.3 Privacy

Plausible is privacy-respecting. The Privacy Policy must mention:
- Plausible analytics is used
- No cookies are set
- No personal data is collected
- IP addresses are hashed, not stored

---

## 12. Versioning & content updates

### 12.1 Content cadence (per Hassan)

- **Blog:** ~1 post per month
- **Gallery:** Add 4-8 curated rooms per month
- **Static pages:** Updated only when product evolves (e.g., post-launch `/how-it-works` updates)

### 12.2 Update workflow

Hassan owns content. Workflow:
1. Hassan writes / drafts in markdown (Obsidian, Notion, anywhere)
2. Commits to Git or pastes into the repo
3. Vercel auto-deploys on commit
4. Post is live within 2 minutes of push

For blog posts specifically: Claude Code drafts (per Hassan's plan), Hassan edits, Hassan commits. No CMS needed at v1, markdown files in the repo are fine. (Reconsider Sanity / Contentful at v2 if multi-author or non-technical editing needs emerge.)

### 12.3 Version freeze

The site has no "version" number visible to users. Internal versioning lives in Git. Major redesigns (re-orgs of nav, new page templates) get tagged: `v1.0`, `v1.1`, etc.

---

## 13. The not-shipping list (deliberate omissions)

These are NOT being built. Each has been considered and rejected for v1:

- ❌ **Live chat / chatbot.** Single founder, no support team, would create false expectation of instant response.
- ❌ **Email newsletter beyond waitlist.** Once user is on waitlist or has the app, in-app comms suffice.
- ❌ **A/B testing framework.** Premature; need traffic first to test against.
- ❌ **Customer login on marketing site.** Login lives at `app.furnish.live`.
- ❌ **Account / dashboard pages.** Same, app-side concern.
- ❌ **Pricing page.** Free at launch.
- ❌ **Compare-with-competitors interactive tool.** "Why Furnish" section on home page is sufficient.
- ❌ **Multi-step onboarding wizard.** That's the app's job; marketing site converts to install/waitlist only.
- ❌ **Live demo / sandbox environment.** Not feasible without backend cost commitment; the gallery + before-after slider does this job.
- ❌ **Customer testimonials / case studies.** No customers yet at launch. Add post-launch when real ones exist (don't fabricate).

---

## 14. Locked decisions summary

| Decision | Locked value |
|---|---|
| Domain | `furnish.live` for marketing, `app.furnish.live` for product |
| Blog location | `furnish.live/blog` (subpath, not subdomain) |
| v1 page count | 7 unique templates + 404 + dynamic blog posts |
| Pages explicitly NOT v1 | Login, signup, account, pricing, help, careers, press, contact, changelog |
| Navigation | Wordmark + Menu trigger + persistent CTA pill |
| Menu items | Home, How It Works, Gallery, Blog, About |
| Footer columns | Brand / Site / Legal & Contact |
| URLs | lowercase, hyphens, no trailing slashes, no dates in blog |
| Redirects | `/about-us`, `/contact`, `/help`, `/app`, `/ios`, etc. |
| i18n | Architecture v1, content English-only at launch |
| Images | 47 total, 4 hero, 24 gallery, 12 before/after, 5 blog, 1 about, 1 OG |
| Analytics | Plausible (privacy-respecting, lightweight) |
| CMS | None, markdown files in repo for v1 |
| Build phases | 5 phases, 8-13 days realistic |

---

## 15. Open questions for next documents

These are the questions that surfaced during this document but are answered elsewhere:

- **Document 5 (Home page detailed spec):** Section-by-section copy and design.
- **Document 6 (Sample gallery spec):** Filter logic, curation criteria, modal interaction.
- **Document 7 (Blog content plan):** Specific post topics, drafting workflow, Skimlinks linking pattern.
- **Document 8 (Static pages spec):** About copy, How It Works copy, FAQ specifics.
- **Document 9 (Tech stack):** Next.js vs. Astro final call (this doc assumes Next.js, locked there), hosting config, build pipeline.
- **Document 10 (Skimlinks integration):** Exactly how outbound links are formatted, tracking pixel placement, compliance disclosures.
- **Document 11 (Launch roadmap):** Pre-launch checklist, post-launch iteration cadence.

---

## Appendix A: Sitemap as ASCII tree

```
furnish.live
│
├── / ............................. Home (landing page, primary conversion)
│   ├── #how-it-works ............. Anchor: how it works section
│   ├── #gallery-preview .......... Anchor: gallery preview
│   ├── #why-furnish .............. Anchor: comparison block
│   └── #waitlist / #download ..... Anchor: final CTA
│
├── /how-it-works ................. How It Works (educate skeptics)
│
├── /gallery ...................... Sample Gallery (proof through volume)
│   └── (modal: before/after compare slider)
│
├── /about ........................ About (story & trust)
│
├── /blog ......................... Blog index
│   ├── /blog/[slug] .............. Individual post
│   └── /blog/category/[cat] ...... Category index (optional v1)
│
├── /privacy ...................... Privacy Policy (Apple-required)
├── /terms ........................ Terms of Service (Apple-required)
│
└── /404 .......................... Branded not-found
```

---

## Appendix B: Page-job matrix (which page serves which goal)

| Page | Convert | Demonstrate | Skimlinks | Brand |
|---|---|---|---|---|
| `/` | ✓✓✓ | ✓✓ | - | ✓✓ |
| `/how-it-works` | ✓✓ | ✓✓ | - | ✓ |
| `/gallery` | ✓ | ✓✓✓ | - | ✓✓ |
| `/about` | ✓ | - | - | ✓✓✓ |
| `/blog` | ✓ | ✓ | ✓✓✓ | ✓✓ |
| `/blog/[slug]` | ✓ | ✓ | ✓✓✓ | ✓✓ |
| `/privacy` | - | - | - | ✓ |
| `/terms` | - | - | - | ✓ |
| `/404` | ✓ | - | - | ✓ |

Triple-check ✓✓✓ = primary job; ✓✓ = significant; ✓ = supporting; `-` = not a job.

This matrix proves every page has at least one significant job. No page is dead weight.

---

**End of Document 4 of 11.**

Next document: **Home Page Detailed Spec**. Section-by-section copy, design, interactions for the highest-traffic page.
