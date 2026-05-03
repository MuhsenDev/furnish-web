# Furnish. Document 8 of 11: Static Pages Specification

**Purpose:** Detailed specification for the remaining static pages on furnish.live. Defines content, layout, copy, and interactions for /about, /how-it-works, /faq, /privacy, /terms, and /404. Documents 5 (Home), 6 (Gallery), and 7 (Blog) covered the dynamic and content-rich pages. This document covers the rest.

**Audience:** Claude Code (executor and content drafter), Hassan (editor and final voice on About content), front-end engineers.

**Status:** Locked unless explicitly revised.

**Dependencies:** Documents 1, 2, 3, 4, 5, 6, 7.

**Critical brand rule:** No em dashes anywhere on the site. This applies to every word of every static page in this document. Use periods, commas, colons, parentheses, or sentence rewrites instead.

---

## 0. Pages covered in this document

| Page | Purpose | Length target |
|---|---|---|
| /about | Founder story, mission, vision | 1,200 to 1,500 words |
| /how-it-works | Process walkthrough for skeptics | 800 to 1,000 words |
| /faq | Comprehensive FAQ in one place | 30 to 50 questions |
| /privacy | Privacy Policy (legally required) | Standard legal length |
| /terms | Terms of Service (legally required) | Standard legal length |
| /404 | Branded not-found page | Single screen |

---

## 1. Page: /about

### 1.1 Job

Build trust through story. Convert mid-funnel users who need to understand who is behind Furnish before downloading. Provide a destination for "About Us" link clicks from various surfaces.

### 1.2 Length and depth (Hassan Q1 = B, medium)

Target 1,200 to 1,500 words. Adds a values section and a roadmap teaser beyond the basic founder story. Stays personal and direct without becoming a manifesto.

### 1.3 Page structure (top to bottom)

1. Navigation (sticky)
2. Hero strip
3. Founder photo and intro
4. The vision section
5. The mission section
6. Values section (3 to 4 values)
7. What is coming next section
8. Contact section
9. Footer

### 1.4 Section: Hero strip

**Layout:**
- Compact hero, similar to /gallery hero (40 to 50 vh on desktop)
- Centered text content
- Background: page bg with a thin accent-color line as a brand marker centered above the eyebrow

**Copy:**
```
Eyebrow: About Furnish

Headline: Built so anyone can have the room they imagine.

Subheadline: A note from the founder about why Furnish exists, what we believe, and where we are headed.
```

**Visual treatment:**
- Eyebrow: small caps, wide tracking, accent color, --text-body-s
- Headline: Fraunces, --text-display-l, ink color, centered, max-width 880px
- Subheadline: app sans, --text-body-l, ink at 80%, centered, max-width 640px
- Section padding: --space-section-y top and bottom

**Motion:**
- Standard reveal pattern per Document 3 §6
- Eyebrow, headline, subheadline stagger in 200ms apart

### 1.5 Section: Founder photo and intro

**Hassan Q4 = A. He will supply a photo.**

**Layout (desktop):**
- Two-column. Photo on left, intro text on right.
- Photo: 480x480 max, displayed in a soft rounded square (border radius from app tokens)
- Text column: max-width 540px

**Layout (mobile):**
- Single column. Photo first, centered, smaller (320x320). Text below.

**Photo specs (for Hassan to send):**
- Format: high-quality JPEG or PNG
- Resolution: 1500x1500 minimum, square crop
- Composition: shoulders-up portrait or environmental shot (Hassan in a room with good lighting). Avoid selfies. Avoid studio backdrops that feel corporate.
- Lighting: natural daylight if possible
- Background: simple, uncluttered. A wall, a window, a curated room corner. Not a logo or branded wall.
- Expression: relaxed, approachable. Slight smile or neutral.
- Wardrobe: neutral and timeless. Avoid loud branding on clothing.

If Hassan does not have a photo at launch: the layout collapses to single-column text-only and the photo slot is hidden via a feature flag. No placeholder image. The page still works.

**Copy:**

```
Eyebrow: From the founder

Headline: I am Hassan Muhsen.

Body paragraph 1:
I am 18, based in Garden City, Michigan. I started building apps in high school 
because I kept noticing problems no one was solving, and I would rather build 
than wait for someone else. I got my mortgage loan officer license while still 
in school for the same reason. I wanted real skills, real ownership, and real 
work. Not a resume.

Body paragraph 2:
Furnish is the second app I have built. The first was a personal project that 
taught me how much I had to learn. Furnish is the one I built once I knew enough 
to make something that actually solves a problem people have.

Body paragraph 3:
The problem I kept seeing: people who care about how their home looks but cannot 
afford an interior designer, do not know where to start with Pinterest, and end 
up with rooms that never feel finished. Empty walls. Mismatched furniture. Quotes 
from designers that cost more than a car payment for a single room.

Body paragraph 4:
Furnish is the AI that closes the gap. Take a photo of any room, and we redesign 
it in your style. Every piece in the redesigned room is shoppable. No designer. 
No 8-week wait. No middleman.

Sign-off: Hassan
```

**Visual treatment:**
- Eyebrow: small caps, accent color
- Headline: Fraunces, --text-display-m, ink color
- Body: app sans, --text-body-l, line-height 1.65, ink at 90%
- Paragraph spacing: 24px between paragraphs
- Sign-off: app sans italic, --text-body-l, ink at 70%, right-aligned

**Motion:**
- Photo and text column reveal together as section enters viewport
- Photo fades in, text paragraphs stagger in 100ms apart

### 1.6 Section: The vision

**Layout:**
- Single-column, max-width 720px, centered
- Generous vertical padding
- Section background: subtle 1-tier elevation from page bg (or a soft accent color tint at 5%)

**Copy:**

```
Eyebrow: The vision

Headline: Beautiful homes should not be a privilege.

Body:
For decades, the easiest path to a designed home went through someone with a 
$5,000 retainer and an 8-week timeline. The internet promised to fix this. 
Instead it gave us Pinterest boards full of inspiration with no path to action, 
and retailers that want to sell you their inventory rather than design your room.

Furnish is the first product that solves both problems. AI redesigns your actual 
room from a single photo. Every piece in that redesigned room is real, shoppable, 
and from a retailer of your choice. No middleman. No upselling. No timeline.

The result: a real home, designed in seconds, shoppable on your schedule, in your 
budget. The interior designer experience without the gatekeeping.
```

**Visual treatment:**
- Same as §1.5 body treatment
- Headline gets the section-divider thin-line marker (Document 2 §8.1) above the eyebrow

### 1.7 Section: The mission

**Layout:**
- Same single-column structure as the vision section
- Different background tier (returns to page bg)

**Copy:**

```
Eyebrow: The mission

Headline: Make every home feel like the one you imagined.

Body:
Furnish is for the new homeowner staring at empty walls. The renter tired of 
mismatched furniture. The real estate agent helping clients see what is possible. 
Anyone who wants their home to feel like theirs without the cost, the wait, or 
the gatekeeping.

We start with iOS. We start with the United States. We start with the rooms 
people care about most. Living rooms, bedrooms, kitchens, bathrooms, and the rest 
of the rooms where life actually happens.

The goal: anyone with a phone and a vision should be able to design and shop 
their dream room before they go to bed tonight.
```

### 1.8 Section: Values (3 to 4 values)

**Layout:**
- 3-column grid on desktop, stacked on mobile
- Each value: small numeric marker, headline, 2 to 3 sentences

**Copy:**

**Value 1: Real, not generic.**
```
Headline: Designed for your room. Not a template.
Body: Furnish redesigns your actual photo. Not a stock living room. Not a 
template you have to adapt. The room that arrives matches what you photographed, 
in your style, with the geometry you already have.
```

**Value 2: Shoppable, not aspirational.**
```
Headline: Every piece is shoppable.
Body: Other AI tools show you pretty pictures. Furnish hands you the shopping 
list. Tap any piece in your designed room and see exactly where to buy it, how 
much it costs, and from which retailer.
```

**Value 3: Fast, not slow.**
```
Headline: Designed in 8 seconds.
Body: A traditional interior designer takes 4 to 8 weeks. Furnish takes 8 
seconds. Iterate as many times as you want. Try every style. The cost of 
exploration is zero.
```

**Value 4 (optional, if needed for visual balance): Independent, not pushed.**
```
Headline: We work for you, not the retailers.
Body: Furnish is retailer-agnostic. We design the room first. Then we show you 
the best piece from any retailer to fill it. We do not get pushed by inventory. 
We push for taste.
```

Use 3 or 4 based on visual rhythm. 4 makes a cleaner grid on desktop.

**Visual treatment:**
- Numeric marker: display font, accent color, large
- Headline: app sans weight 600, --text-body-xl
- Body: app sans, --text-body-m, ink at 80%

### 1.9 Section: What is coming next

**Job:** Tease post-launch features. Build anticipation. Signal that Furnish is just getting started.

**Layout:**
- Single-column, similar to vision and mission sections
- Background: subtle accent color tint

**Copy:**

```
Eyebrow: What is coming next

Headline: We are just getting started.

Body:
Furnish launches on iOS in the United States. The roadmap goes wider from there.

Multi-language. Furnish will speak Spanish, French, Arabic, and more. The same 
quality of design, in the language you live in.

Android. Coming after we get iOS right.

More retailers. We start with the major ones. As Furnish grows, so does the 
catalog of where you can shop your room.

Multi-room design. Right now you design one room at a time. Soon, design a whole 
house at once with consistent style across rooms.

Real designers as an option. For users who want a human in the loop, Furnish 
will pair you with a real interior designer at a fraction of traditional cost.

If you want any of these, the best thing you can do is be among the first to 
try Furnish when it launches.
```

**Visual treatment:**
- Standard section structure
- Numbered or bulleted list for the roadmap items

### 1.10 Section: Contact (Hassan Q5 = A, just email)

**Layout:**
- Centered, simple
- Single block
- Generous padding

**Copy:**

```
Eyebrow: Get in touch

Headline: Questions? Press? Just want to say hi?

Body line: Email us at hello@furnish.live. We read everything.
```

**Visual treatment:**
- Email is a `mailto:` link in accent color
- On hover, the email link gains underline and a small "click to copy" hint per Document 2 §8.3

**No social media links here.** Hassan can add when accounts are active. For now, just email.

### 1.11 Final CTA

A standard CTA box at the bottom of /about, similar to the blog post CTA box from Document 7 §6.6.

**Copy:**
```
Headline: Try Furnish with your room.

Body: Take a photo. Furnish does the rest.

Primary CTA: Join the Waitlist (pre-launch) / Get the App (post-launch)
Secondary CTA: See the gallery
```

### 1.12 SEO

- `<title>`: About Furnish | Built by Hassan Muhsen
- `<meta name="description">`: The story of Furnish, the AI interior design app built by Hassan Muhsen. Why beautiful homes should not be a privilege. The mission, the vision, and what is coming next.
- Canonical: https://furnish.live/about
- OG image: founder photo or a curated room image
- JSON-LD: Person schema for Hassan, Organization schema for Furnish

---

## 2. Page: /how-it-works

### 2.1 Job

Educate skeptics. Address every "how does this actually work" concern. Convert mid-funnel users who need to see the process before committing.

### 2.2 Length and depth (Hassan Q2 = A, expanded home page version)

Target 800 to 1,000 words. Match the home page How It Works section but with more detail per step.

### 2.3 Page structure (top to bottom)

1. Navigation (sticky)
2. Hero strip
3. The 3 steps (expanded)
4. The technology behind it (brief, non-technical)
5. Comparison: traditional designer vs. Furnish
6. Mini-FAQ (5 to 7 most common questions)
7. CTA to home or App Store
8. Link to full FAQ
9. Footer

### 2.4 Section: Hero strip

**Copy:**
```
Eyebrow: How it works

Headline: From your photo to your dream room. In seconds.

Subheadline: The full walkthrough of how Furnish takes a single photo of your room and turns it into a complete redesign with every piece shoppable.
```

**Visual treatment:** Same pattern as /about hero.

### 2.5 Section: The 3 steps (expanded)

Each step on this page goes deeper than the home page version. Same 3 steps, but ~250 to 350 words per step instead of one sentence.

#### Step 1: Take a photo

**Headline:** Snap any room. Empty, half-empty, or fully lived-in.

**Body:**
```
Open the app and tap the camera button. Point your phone at any room you want 
to redesign. Tap the shutter.

Furnish works with rooms in any state. Empty rooms with bare walls. Half-empty 
rooms with a few pieces in place. Fully furnished rooms you want refreshed. The 
AI handles all three differently. Empty rooms get full redesigns. Half-empty 
rooms get pieces added that match your existing items. Lived-in rooms get 
restyled around what you already own.

The photo does not need to be perfect. Good lighting helps. A clear view of the 
room helps. Beyond that, Furnish handles the rest.
```

**Visual:**
- A small illustrated icon or animated camera viewfinder
- Treatment B (editorial card) with a sample photo on one side and the corresponding redesign on the other

#### Step 2: Tell us your vibe

**Headline:** A short visual quiz captures your style.

**Body:**
```
After you take a photo, Furnish asks a short visual quiz. About 9 questions. No 
design jargon. No technical drawing required.

You pick your vibe from 5 options: calm and grounded, energized and creative, 
cozy and protected, elevated like a hotel, or inspired like an artist.

You pick your color appetite from 4 options: only neutrals, mostly neutral with 
some color, confident with color, or bold all the way.

You pick the materials you love. Warm woods. Soft fabrics. Metal and glass. 
Stone and ceramic. Vintage patina. Sleek modern. Pick as many as you want.

You set a budget. Or do not. Both work.

The whole quiz takes about 90 seconds.
```

**Visual:**
- Stylized mockup of the quiz screen
- Show 2 to 3 of the visual quiz questions side-by-side

#### Step 3: Designed in seconds

**Headline:** A photo-realistic redesign of your actual room.

**Body:**
```
Furnish processes your photo and your quiz answers. About 8 seconds later, you 
see your room redesigned.

The redesign is photo-realistic. Same room. Same camera angle. Same architectural 
features (windows, doors, ceiling, floor). Different everything else. Furniture, 
decor, lighting, and styling that matches the vibe and style you picked.

Every piece in the redesigned room is shoppable. Tap any item in the image. 
Furnish shows you the product, the price, and where to buy it. From real 
retailers like Article, Wayfair, West Elm, CB2, and many more.

If you do not like the result, generate again. Try a different vibe. Different 
budget. The cost of exploration is zero.
```

**Visual:**
- A side-by-side or before/after slider showing one of the launch room generations
- Multiple style variants (one room, three different style outputs) below

### 2.6 Section: The technology (brief, non-technical)

**Layout:**
- Single-column, max-width 720px
- Background: subtle elevation

**Copy:**
```
Eyebrow: The technology

Headline: AI trained on millions of design choices.

Body:
Furnish uses Google's most advanced image generation AI, refined for interior 
design. The model has seen millions of real rooms and design decisions. It knows 
that a sofa faces the focal point of a living room. It knows that a TV needs a 
wall. It knows that a kitchen island needs walking room around it. It knows the 
difference between scandinavian warmth and mid-century formality.

We do not generate generic stock rooms. We do not stitch together stock images. 
Every redesign starts with your photo and produces a unique result for your 
specific room.

The AI is fast. About 8 seconds per redesign. The shopping data comes from a 
catalog of curated retailer links so every piece in the redesigned room links 
to a real product on a real retailer site.
```

### 2.7 Section: Comparison block

**Job:** Re-emphasize the "save 95%+" value proposition for skeptics on this page.

**Layout:**
- A simplified version of the home page comparison table
- Or a single-column 3-column layout: Traditional Designer / Furnish / Pinterest

**Copy:**
Headline:
```
Eyebrow: How we compare

Headline: 95% less. 8 weeks faster. Free to start.
```

The comparison table from Document 5 §6 can be re-used here. Or a simplified text version:

```
Traditional designer: $2,000 to $10,000 per room. 4 to 8 weeks. Hourly fees to 
iterate.

Havenly: $79 to $1,599 per room. 1 to 2 weeks. Limited iterations.

Furnish: Free to start. 8 seconds per design. Unlimited iterations.

Pinterest: Free. Forever. No actual design ever produced.
```

### 2.8 Mini-FAQ (Q3 hybrid: inline FAQ on this page, link to full /faq)

**Layout:**
- Accordion-style on desktop and mobile
- 5 to 7 most-asked questions inline
- "See the full FAQ" link at the bottom

**Questions to include inline on /how-it-works:**

1. **Does Furnish redesign rooms I already have furniture in?**
   ```
   Yes. Furnish handles three modes. Replace mode redesigns your room from 
   scratch. Keep mode preserves your existing pieces and styles around them. 
   Refresh mode swaps a few items while keeping the overall layout. You pick 
   which mode fits your situation.
   ```

2. **Are the items in the redesign actually shoppable?**
   ```
   Yes. Every visible piece in the redesigned room links to a real retailer 
   product. Tap any item in the image to see the product, price, and where to 
   buy. Retailers include Article, Wayfair, West Elm, CB2, AllModern, and more.
   ```

3. **What if I do not like the result?**
   ```
   Generate again. The cost of exploration is zero. Try a different vibe. A 
   different budget. A different mode. Most users generate 3 to 5 versions 
   before they find one they love. There is no limit.
   ```

4. **How accurate is the redesign to my actual room?**
   ```
   Furnish preserves the architecture: walls, windows, doors, ceiling, and 
   floor. The room you photograph is the room you get back. Furniture, decor, 
   lighting, and styling change. The bones stay the same.
   ```

5. **What does it cost?**
   ```
   Furnish is free to use. There are no fees for designing or shopping. When 
   you click through to buy a product from a retailer, you pay the retailer's 
   normal price. Furnish earns a small commission from the retailer when you 
   buy. This does not change the price you pay.
   ```

6. **What about my photos? Are they private?**
   ```
   Your photos are stored securely and used only to design your room. We do 
   not sell your photos. We do not share them with retailers or designers. 
   Photos are auto-deleted 30 days after redesign completion. See our Privacy 
   Policy for full details.
   ```

7. **Is Furnish available now?**
   ```
   Furnish launches on iOS in the United States. Join the waitlist to be among 
   the first to try it when the iOS app goes live. Android and international 
   versions come after.
   ```

**Below the inline FAQ:**

```
Have more questions? See the full FAQ →
```

Link to /faq.

### 2.9 Final CTA

```
Headline: Ready to design your room?

Primary CTA: Join the Waitlist (pre-launch) / Get the App (post-launch)
Secondary CTA: See the gallery
```

### 2.10 SEO

- `<title>`: How Furnish Works | AI Interior Design in 8 Seconds
- `<meta name="description">`: Step by step walkthrough of how Furnish AI redesigns your room from a single photo. Photo flow, quiz, design, and shopping. The full process explained.
- Canonical: https://furnish.live/how-it-works
- OG image: a process diagram or before/after pair
- JSON-LD: HowTo schema with the 3 steps

---

## 3. Page: /faq

### 3.1 Job

Comprehensive single source of truth for every question users might ask. Discoverable in context (linked from other pages) and stand-alone for direct visits.

### 3.2 Length and depth (Hassan Q3 = ABD hybrid)

The FAQ page contains every FAQ question. Other pages embed contextually relevant subsets inline (per /how-it-works above). Both approaches link back to /faq for the full set.

Target: 30 to 50 questions. Organized into 5 to 7 categories.

### 3.3 Page structure (top to bottom)

1. Navigation
2. Hero strip
3. Category navigation
4. FAQ accordion sections
5. "Did not find your answer?" contact block
6. Footer

### 3.4 Section: Hero strip

```
Eyebrow: FAQ

Headline: Questions? Answers.

Subheadline: Everything we get asked about Furnish, organized.
```

### 3.5 Category navigation

A horizontal pill row of categories. Click a pill to scroll to that section.

**Categories:**
1. Getting started
2. Design and AI
3. Shopping and retailers
4. Privacy and photos
5. Pricing and refunds
6. App and devices
7. Company and legal

### 3.6 Full FAQ content

Each question is an accordion. Click to expand the answer.

#### Category 1: Getting started

**Q: How do I use Furnish?**
```
Take a photo of any room with the Furnish app. Answer a short visual quiz about 
your style. Furnish redesigns the room in your style with every piece shoppable. 
Tap items to shop them. The whole process takes about 90 seconds plus the 8 
seconds the AI takes to generate.
```

**Q: What rooms does Furnish work with?**
```
Furnish supports 9 room types at launch: living room, bedroom, kitchen, bathroom, 
home office, dining room, nursery, walk-in closet, and laundry room. Other rooms 
are coming post-launch.
```

**Q: Is Furnish available outside the US?**
```
Not at launch. Furnish launches in the United States first. International 
expansion is on the roadmap. Join the waitlist to be notified when Furnish is 
available in your region.
```

**Q: Do I need an account?**
```
You can use Furnish without an account for guest mode. To save your designs 
across devices and access shopping later, sign up with Apple or Google.
```

**Q: How long does each design take?**
```
About 8 seconds for the AI to generate. About 90 seconds for the quiz. Total 
under 2 minutes from photo to designed room.
```

#### Category 2: Design and AI

**Q: How does the AI know what I want?**
```
The AI uses your photo plus your quiz answers. The photo gives it the room. The 
quiz tells it your style preferences, color appetite, materials you love, and 
density (how minimal or layered you want the room).
```

**Q: Can I get multiple different designs of the same room?**
```
Yes. Generate as many times as you want. Each generation produces a different 
result. Try different styles, vibes, or budgets to see what works.
```

**Q: How accurate is the redesign to my actual room?**
```
Furnish preserves the architecture: walls, windows, doors, ceiling, and floor. 
The room you photograph is the room you get back, with the same camera angle 
and proportions. Only the furniture, decor, and styling change.
```

**Q: Can I keep my existing furniture?**
```
Yes. Use Keep mode to preserve your existing pieces and have Furnish design 
around them. Use Refresh mode to swap a few items while keeping the layout. 
Use Replace mode to redesign from scratch.
```

**Q: What styles does Furnish support?**
```
Furnish supports many design styles including scandinavian, mid-century modern, 
industrial, bohemian, farmhouse, contemporary, art deco, minimalist, traditional, 
and eclectic. The AI matches your vibe and material preferences to the style 
that fits.
```

**Q: Why does my redesign look different from the gallery examples?**
```
Each room is unique to your photo. The gallery shows examples but your room 
will look like your room, designed in your style. The result depends on your 
photo (lighting, angle, contents), your quiz answers, and the random variation 
inherent in AI generation.
```

**Q: Can the AI redesign rooms with people or pets in them?**
```
Furnish works best with photos that have no people in them. Pets are okay if 
they are partially out of frame. Photos with people in the foreground may 
produce unexpected results. We recommend taking the photo when the room is 
empty of people.
```

#### Category 3: Shopping and retailers

**Q: Are the items in the redesign actually shoppable?**
```
Yes. Every visible piece in the redesigned room links to a real retailer 
product. Tap any item to see the product, price, and where to buy.
```

**Q: Which retailers does Furnish work with?**
```
At launch, Furnish includes products from Article, Wayfair, West Elm, CB2, 
Crate & Barrel, AllModern, Burrow, Snowe, Heirloom, Schoolhouse, and others. 
We add more retailers over time.
```

**Q: Do I have to buy from the retailer Furnish suggests?**
```
No. Furnish suggests products. You decide where to buy. If you find a similar 
piece elsewhere, that is fine. The recommendation is a starting point, not a 
requirement.
```

**Q: How does Furnish make money if it is free?**
```
When you buy from a retailer through Furnish, the retailer pays Furnish a small 
commission. This does not change the price you pay. The retailer pays Furnish 
for sending the customer.
```

**Q: What if a product is out of stock?**
```
Furnish refreshes its catalog regularly to remove out-of-stock items. If you 
encounter an out-of-stock item, the retailer will show this on their site when 
you click through. We aim to keep our catalog current.
```

**Q: Can I save items to a wishlist?**
```
Yes. Tap the heart icon on any item in your designed room to save it. Your 
wishlist syncs across devices when you sign in.
```

#### Category 4: Privacy and photos

**Q: Are my photos private?**
```
Yes. Your photos are stored securely and used only to design your room. We do 
not sell or share your photos with retailers, designers, or anyone else. Photos 
are auto-deleted 30 days after redesign completion.
```

**Q: Where are my photos stored?**
```
On encrypted cloud storage operated by Furnish. We use the same level of 
security as banks and major SaaS companies.
```

**Q: How long are photos kept?**
```
Photos are auto-deleted 30 days after the redesign completes. You can also 
delete them manually anytime in the app's privacy settings.
```

**Q: Does Furnish share data with retailers?**
```
We share aggregate, anonymized data with retailers about which products users 
buy and which products are featured most. We do not share your personal 
information, your photos, or any data that could identify you.
```

**Q: Can I delete all my data?**
```
Yes. Open the app, go to Settings, then Privacy, then Delete Account. This 
permanently deletes your account, designs, photos, and all associated data 
within 30 days. We comply with all applicable privacy laws including CCPA and 
GDPR.
```

**Q: Is Furnish GDPR compliant?**
```
Yes. Furnish complies with GDPR and CCPA. Read our Privacy Policy for full 
details on how we handle your data.
```

#### Category 5: Pricing and refunds

**Q: Is Furnish free?**
```
Yes. Furnish is free to use. There are no fees for designing rooms, generating 
redesigns, or browsing your wishlist. We earn revenue from retailer commissions 
when you buy through Furnish.
```

**Q: Will Furnish always be free?**
```
The core experience will always be free. We may introduce premium features 
post-launch, like multi-room design, advanced styles, or pairing with real 
designers. The basic single-room redesign with shopping will remain free.
```

**Q: Are there in-app purchases?**
```
Not at launch. Post-launch we may introduce optional premium tiers. Any in-app 
purchases will be clearly disclosed before purchase.
```

**Q: What about refunds?**
```
Furnish itself is free, so there is nothing to refund. If you have an issue 
with a product you purchased from a retailer, contact that retailer directly. 
Their refund policy applies.
```

#### Category 6: App and devices

**Q: What devices does Furnish work on?**
```
Furnish launches on iOS (iPhone and iPad). Android version is on the roadmap. 
A web version is also planned for post-launch.
```

**Q: What iOS version do I need?**
```
iOS 16 or later. Older iOS versions are not supported.
```

**Q: Does Furnish work on iPad?**
```
Yes. Furnish is optimized for iPhone but also works on iPad.
```

**Q: When will Android be available?**
```
After we get iOS right. Likely several months after launch. Join the waitlist 
to be notified.
```

**Q: Can I use Furnish on the web?**
```
A web version is coming post-launch at app.furnish.live. The mobile experience 
is the priority for v1.
```

#### Category 7: Company and legal

**Q: Who built Furnish?**
```
Furnish was built by Hassan Muhsen, an 18-year-old founder based in Garden 
City, Michigan. Read more on the About page.
```

**Q: Is Furnish a startup?**
```
Yes. Furnish is an independently funded software company. We are bootstrapped 
and not seeking outside investment at this time.
```

**Q: Does Furnish have a press kit?**
```
Not yet. Email hello@furnish.live for press inquiries.
```

**Q: How can I contact Furnish?**
```
Email hello@furnish.live. We read every message.
```

**Q: Where is Furnish based?**
```
Garden City, Michigan, USA.
```

### 3.7 Below all FAQs: contact block

```
Did not find your answer? Email hello@furnish.live. We are happy to help.
```

### 3.8 Visual treatment

- Each accordion: question is app sans weight 600, --text-body-l, ink color
- Click chevron rotates 90 degrees on expand
- Answer slides down with 200ms ease
- Categories: large display headers, --text-display-m
- Section dividers: thin accent-color line between categories per Document 2 §8.1

### 3.9 Motion

- Each accordion expand/collapse: smooth 200ms ease
- Section reveals on scroll per Document 3 §6
- Reduced motion: instant expand/collapse

### 3.10 SEO

- `<title>`: FAQ | Frequently Asked Questions about Furnish
- `<meta name="description">`: All your questions about Furnish answered. How it works, privacy, shopping, pricing, devices, and more. The complete FAQ for the AI interior design app.
- Canonical: https://furnish.live/faq
- JSON-LD: FAQPage schema with all questions and answers (helps with Google rich snippets)

---

## 4. Page: /privacy

### 4.1 Job

Legal compliance. Apple App Store requires it. CCPA, GDPR, and other regulations require it. Protect Furnish.

### 4.2 Drafting approach

Use a professional Privacy Policy generator service. Recommended:
- Termly ($10 to $30 per month)
- iubenda ($27 per year)
- Termsfeed ($60 one-time)

Or have a lawyer draft it ($300 to $500 one-time). For Furnish at launch, Termly or iubenda is sufficient. A lawyer review pre-launch is recommended for additional safety.

### 4.3 Required content sections

The Privacy Policy must address:

1. What data Furnish collects (photos, account info, usage data, device info, etc.)
2. How that data is used (to generate designs, to recommend products, to improve the AI)
3. How long data is retained (photos auto-delete 30 days post-redesign)
4. Who Furnish shares data with (retailers see aggregated, anonymized commerce data only; analytics providers like Plausible)
5. User rights (access, deletion, portability, opt-out)
6. Cookies and tracking (Plausible analytics, Skimlinks affiliate tracking)
7. Children's privacy (Furnish is not for users under 13; COPPA compliance)
8. International transfers (data stored in US-based servers)
9. Changes to the policy (how users will be notified)
10. Contact information (privacy@furnish.live or hello@furnish.live)

### 4.4 Page layout

- Long-form text page
- Single column, max-width 720px
- App sans, --text-body-m, ink at 90%
- Section headers in app sans weight 600, --text-body-l
- Numbered or bulleted lists where appropriate
- Last updated date at the top
- Contact email at the bottom

### 4.5 SEO

- `<title>`: Privacy Policy | Furnish
- `<meta name="description">`: How Furnish protects your privacy. Photo storage, data sharing, retention, and your rights under CCPA, GDPR, and other privacy laws.
- Canonical: https://furnish.live/privacy
- `<meta name="robots">`: index, follow (yes, index. App Store reviewers need to access this page.)
- JSON-LD: PrivacyPolicy schema (optional)

### 4.6 Build note

Privacy Policy is generated externally and pasted into a markdown file at `src/content/legal/privacy.md`. Claude Code does not write the legal text. Hassan generates it via Termly/iubenda and reviews before publishing.

---

## 5. Page: /terms

### 5.1 Job

Legal compliance. Defines user obligations and Furnish's rights. Required by Apple App Store.

### 5.2 Drafting approach

Same generators as Privacy Policy. Termly and iubenda offer Terms of Service generators alongside Privacy Policy. Generate both at the same time.

### 5.3 Required content sections

The Terms of Service must address:

1. Acceptance of terms
2. User account responsibilities
3. Acceptable use (no illegal use, no impersonation, no harassment)
4. Photo upload terms (user owns photos, grants Furnish license to process them)
5. Intellectual property (Furnish owns the AI, the designs are ours, users own their photos)
6. Affiliate disclosure (Furnish earns commissions on retailer purchases)
7. Disclaimer of warranties (designs are AI-generated, no guarantee of accuracy or fitness for purpose)
8. Limitation of liability (Furnish not liable for purchasing decisions or design outcomes)
9. Indemnification (users indemnify Furnish for misuse)
10. Termination (Furnish can terminate accounts for misuse)
11. Governing law (Michigan law)
12. Changes to terms (how users will be notified)
13. Contact information

### 5.4 Page layout

Same as Privacy Policy. Long-form text, single column.

### 5.5 SEO

- `<title>`: Terms of Service | Furnish
- `<meta name="description">`: Terms of using Furnish. User responsibilities, photo licensing, disclaimers, and governing law.
- Canonical: https://furnish.live/terms
- `<meta name="robots">`: index, follow

---

## 6. Page: /404

### 6.1 Job

Brand-correct dead-end. Do not lose users to a generic 404.

### 6.2 Layout

- Centered, single screen
- Full viewport height on desktop
- Large display headline, brief copy, two CTAs

### 6.3 Copy

```
Eyebrow: 404

Headline: Looks like this room is empty.

Body: The page you were looking for does not exist or has moved.

Primary CTA: Go home
Secondary CTA: Browse the gallery
```

### 6.4 Visual treatment

- Background: page bg
- Optional: subtle illustration of an empty room outline (very minimal, line-art style, ~200x200px above the eyebrow)
- Or: a curated AI-generated room image as a background with a darker overlay

For v1: skip the background image. Keep it text-only and clean. Add image post-launch if desired.

### 6.5 Motion

- Standard reveal pattern when page loads
- Minimal, fast

### 6.6 SEO

- `<meta name="robots">`: noindex, nofollow (do not index 404 pages)
- HTTP status code: 404 (Next.js handles automatically)
- No canonical URL needed

---

## 7. Component breakdown for Claude Code

```
src/components/about/
├── AboutHero.tsx
├── FounderIntro.tsx           // Photo + intro section
├── VisionSection.tsx
├── MissionSection.tsx
├── ValuesGrid.tsx
├── RoadmapSection.tsx
├── ContactBlock.tsx
└── AboutCTA.tsx

src/components/howItWorks/
├── HowItWorksHero.tsx
├── ExpandedStep.tsx           // Reusable for all 3 steps
├── TechnologySection.tsx
├── ComparisonBlock.tsx        // Reuses Document 5 ComparisonTable component
├── MiniFAQ.tsx
└── HowItWorksCTA.tsx

src/components/faq/
├── FAQHero.tsx
├── FAQCategoryNav.tsx
├── FAQAccordion.tsx
├── FAQQuestion.tsx
└── FAQContactBlock.tsx

src/components/legal/
└── LegalPage.tsx              // Shared template for /privacy and /terms

src/components/shared/
└── NotFoundPage.tsx           // 404 page component

src/content/
├── legal/
│   ├── privacy.md             // Generated externally
│   └── terms.md               // Generated externally
└── faq/
    └── questions.json         // Structured FAQ data
```

### 7.1 Build sequence for static pages

1. ☐ Set up routes for /about, /how-it-works, /faq, /privacy, /terms, /404
2. ☐ Build /about page components and copy
3. ☐ Build /how-it-works page components and copy
4. ☐ Build /faq accordion system with category navigation
5. ☐ Source FAQ content from `questions.json` data file
6. ☐ Build /privacy and /terms with markdown rendering
7. ☐ Generate Privacy Policy and Terms of Service via Termly/iubenda
8. ☐ Paste generated content into markdown files
9. ☐ Build /404 page
10. ☐ Add JSON-LD structured data (HowTo on /how-it-works, FAQPage on /faq, Person on /about)
11. ☐ Lighthouse pass on all static pages

---

## 8. FAQ data structure (for Claude Code)

The FAQ content lives in a structured JSON file at `src/content/faq/questions.json` so it can be rendered both on /faq and inline on other pages.

```json
{
  "categories": [
    {
      "id": "getting-started",
      "name": "Getting started",
      "icon": "play-circle",
      "questions": [
        {
          "id": "how-do-i-use-furnish",
          "question": "How do I use Furnish?",
          "answer": "Take a photo of any room with the Furnish app...",
          "showOnPages": ["/faq", "/how-it-works"]
        },
        ...
      ]
    },
    ...
  ]
}
```

The `showOnPages` array drives where each question appears inline. Questions tagged with `/how-it-works` appear in the mini-FAQ on that page. All questions appear on `/faq`.

This structure lets Hassan add or edit questions in one place and have them appear consistently across the site.

---

## 9. Locked decisions summary

| Decision | Locked value |
|---|---|
| /about depth | 1,200 to 1,500 words. Founder intro, vision, mission, values, roadmap, contact. |
| /about founder photo | Yes. Hassan supplies. Square crop, 1500x1500 minimum, natural lighting, neutral background. |
| /how-it-works depth | 800 to 1,000 words. Expanded 3-step walkthrough, technology brief, comparison, mini-FAQ. |
| FAQ approach | Hybrid. Standalone /faq page (full set) + inline mini-FAQs on relevant pages + linkbacks to /faq. |
| Total FAQ questions | 30 to 50, organized in 7 categories. |
| Privacy and Terms | Generated via Termly or iubenda. Pasted into markdown files. Lawyer-reviewed before launch. |
| /404 | Branded text-only at v1. Add background image post-launch if desired. |
| Contact | hello@furnish.live everywhere. No social media at v1. No press email separately. |
| Em dashes | NEVER. Use periods, commas, colons, parentheses, or rewrites. |

---

## 10. Open questions for next documents

These surfaced but are answered elsewhere:

- **Document 9 (Tech stack):** Markdown vs. MDX, Privacy Policy storage strategy, FAQ JSON loading
- **Document 10 (Skimlinks):** Affiliate disclosure language, link wrapping technical implementation
- **Document 11 (Launch roadmap):** Pre-launch content drafting timeline, legal review timeline

---

## Appendix A: Quick copy reference

For build-time scanning, every page's hero copy in one place:

**/about:**
- Eyebrow: About Furnish
- Headline: Built so anyone can have the room they imagine.
- Subheadline: A note from the founder about why Furnish exists, what we believe, and where we are headed.

**/how-it-works:**
- Eyebrow: How it works
- Headline: From your photo to your dream room. In seconds.
- Subheadline: The full walkthrough of how Furnish takes a single photo of your room and turns it into a complete redesign with every piece shoppable.

**/faq:**
- Eyebrow: FAQ
- Headline: Questions? Answers.
- Subheadline: Everything we get asked about Furnish, organized.

**/404:**
- Eyebrow: 404
- Headline: Looks like this room is empty.
- Body: The page you were looking for does not exist or has moved.

---

**End of Document 8 of 11.**

Next document: Tech Stack and Deployment specification.
