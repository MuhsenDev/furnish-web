# Furnish. Document 11 of 11: Launch and Iteration Roadmap

**Purpose:** Tie Documents 1 through 10 into a sequenced execution plan. Defines the day-by-day timeline, parallel workstreams, pre-launch checklist, launch day operations, post-launch iteration cadence, and the decision tree for transitioning back to iOS app development. Claude Code uses this for build sequencing. Hassan uses it for daily decision-making.

**Audience:** Hassan (primary user of this document), Claude Code (executor on the build sequence), future contributors (reference for how the launch was sequenced).

**Status:** Locked unless explicitly revised.

**Dependencies:** Documents 1 through 10, plus the Furnish iOS launch plan from earlier sessions.

**Critical brand rule:** No em dashes anywhere on the site. This rule applies to every word of every blog post, every CTA, every page that ships.

---

## 0. Locked decisions summary

| Decision | Locked value |
|---|---|
| Target launch date | 21 days from project kickoff. Realistic, includes buffer. |
| Blog post drafting | Claude (in conversation thread) drafts each post one at a time after Documents are complete. Hassan edits with full context. |
| Marketing site vs. iOS sequencing | Marketing site fully shipped first. iOS app phases resume after marketing site is live. |
| Launch type | Hard launch. Social media announcement, family and friends traffic. Generate measurable activity for the Skimlinks 14-day clock. |
| Iteration cadence | Monthly content updates (1 new blog post per month). Minimal site changes between content drops. |
| Skimlinks application | Re-apply 14 days after launch. Approval window: 5 to 14 business days. Total realistic delay: 5 to 6 weeks from today to live affiliate revenue. |
| Apple Developer enrollment | Start TODAY. 1 to 3 day approval. Runs in parallel with marketing site build. |

---

## 1. The 21-day timeline at a glance

```
Day 0   ────────────────────────────────── Project kickoff (today)
Day 1-3 ──────────  Foundation phase (Doc 9 §16 Phase 1)
Day 4-7 ──────────  Home page build (Doc 9 §16 Phase 2)
Day 7-9 ──────────  Supporting pages build (Doc 9 §16 Phase 3)
Day 9-11 ─────────  Blog system + first 3 posts (Doc 9 §16 Phase 4)
Day 11-14 ────────  Last 3 posts + image curation (Doc 9 §16 Phase 4)
Day 14-17 ────────  Polish, Lighthouse, accessibility, cross-browser (Doc 9 §16 Phase 5)
Day 17-19 ────────  Final review, content edits, soft preview to Hassan
Day 20    ────────  Hard launch
Day 21+   ────────  Post-launch ops, Skimlinks re-application clock
```

This timeline assumes:
- 4 to 6 hours per day of focused work from Hassan on review and content editing
- Claude Code executing build tasks during the same period (parallel)
- Claude (this thread) drafting blog posts in parallel with the build
- No major scope creep or rework

---

## 2. Day-by-day breakdown

### 2.1 Day 0 (today): Project kickoff

**Hassan's tasks:**
1. ☐ Save all 11 documents to a permanent location (e.g., `/Users/Hassan/Furnish/website-spec/`)
2. ☐ Create the `furnish-web` GitHub repo (private) per Document 9 §1
3. ☐ Sign up for Vercel and connect GitHub
4. ☐ Sign up for Apple Developer Program ($99). 1 to 3 day approval clock starts.
5. ☐ Reserve the email `hello@furnish.live` if not already done. Forward to Hassan's primary email.
6. ☐ Verify furnish.live domain ownership in DNS settings.
7. ☐ Send Claude (this thread) the founder photo for /about page if available, OR confirm photo will follow later.

**Claude tasks (this thread):**
1. ☐ Confirm the 11 documents are complete and clean of em dashes
2. ☐ Begin drafting Blog Post #1 (Scandinavian Living Room) once Hassan signals to start

**Claude Code tasks:** None. Cannot start until repo exists.

**Deliverable end of day 0:** GitHub repo created, Vercel account ready, Apple Developer enrollment in progress.

### 2.2 Days 1 through 3: Foundation phase

This is Document 9 §16 Phase 1 (15 steps). Claude Code executes in the new repo.

**Day 1 morning (Hassan + Claude Code):**
- Run `pnpm create next-app` to scaffold the Next.js project per Document 9 §3.2
- Install all dependencies per Document 9 §3.2 (gsap, mdx, supabase, lucide-react, etc.)
- Set up Tailwind config and CSS variables per Document 9 §4
- Extract design tokens from `app.css` per Document 2 §0
- Configure TypeScript strict mode per Document 9 §2.3

**Day 1 afternoon (Claude Code):**
- Build root layout with sticky nav per Document 3 (Animation System)
- Build shared `<Button>`, `<Footer>`, `<Nav>` components per Document 2 §6
- Set up GSAP wrapper per Document 9 §6.2

**Day 2 morning (Claude Code):**
- Build the loading sequence per Document 3 (Animation System loading sequence)
- Build full-screen menu takeover per Document 3 (Animation System full-screen menu takeover)
- Build 404 page per Document 8 §6

**Day 2 afternoon (Hassan):**
- Set up GitHub Actions CI per Document 9 §12.5
- Connect repo to Vercel
- Configure environment variables per Document 9 §12.3 (start with NEXT_PUBLIC_APP_LAUNCHED=false, leave Skimlinks ID blank, Supabase keys filled)
- Trigger first deploy. Verify nav, footer, 404 work at the auto-generated Vercel URL.

**Day 3 morning (Claude Code):**
- Wire production domain (furnish.live) to Vercel per Document 9 §12.2
- Update DNS records at registrar
- Wait for SSL provisioning

**Day 3 afternoon (Hassan):**
- Verify https://furnish.live loads with SSL
- Verify nav, footer, 404 work on the production domain
- Tag the day-3 deploy as `v0.1-foundation`

**Deliverable end of day 3:** Site is live at furnish.live with navigation, footer, loading sequence, and 404. No content yet. SSL working.

**Apple Developer status check:** Should be approved by now. If yes, Hassan logs in and verifies. If still pending, no blocker for marketing site.

### 2.3 Days 4 through 7: Home page build

This is Document 9 §16 Phase 2 (7 steps). The home page is the most complex page on the site.

**Day 4 (Claude Code):**
- Build hero section with sequential headline reveal per Document 5 §1
- Build three-statement value prop section per Document 5 §2
- Build sample gallery preview (9-room grid) per Document 5 §3 (placeholder images for now)

**Day 5 (Claude Code):**
- Build before/after compare slider per Document 5 §4 (the most complex component)
- Implement GSAP Flip transitions
- Test keyboard accessibility per Document 5 §4.4

**Day 6 (Claude Code):**
- Build How It Works 3-step section per Document 5 §5
- Build "Why Furnish" comparison table per Document 5 §6
- Build founder note section per Document 5 §7

**Day 7 (Claude Code):**
- Build final CTA section per Document 5 §8
- Build waitlist API route per Document 9 §8.2
- Wire pre-launch / post-launch flag throughout
- Test waitlist email submission end-to-end (verify rows appear in Supabase)

**Day 7 afternoon (Hassan):**
- Review home page on staging URL
- Edit copy where needed (founder note paragraphs especially)
- Note any visual issues for later polish phase
- Tag deploy as `v0.2-home`

**Image dependency note:** Sample gallery preview and final CTA reference the 4 hero images and 24 gallery images from Document 4 §8. If Hassan has not yet curated these, Claude Code uses placeholder images and notes the gap. Hassan curates images during days 4-7 in parallel.

**Deliverable end of day 7:** Home page fully functional on furnish.live. Waitlist signups work. Pre-launch state visible. Hero animation complete.

### 2.4 Days 7 through 9: Supporting pages

This is Document 9 §16 Phase 3 (6 steps).

**Day 7 evening (Hassan):**
- Generate Privacy Policy and Terms of Service via Termly or iubenda per Document 8 §4 and §5
- Save the generated text to `src/content/legal/privacy.md` and `src/content/legal/terms.md`

**Day 8 (Claude Code):**
- Build /how-it-works page per Document 8 §2
- Build /about page per Document 8 §1
- Build /privacy and /terms pages with markdown rendering per Document 9 §5.4

**Day 9 (Claude Code):**
- Build /faq page with accordion system per Document 8 §3
- Wire FAQ JSON data file
- Connect "Learn more" link in FTC disclosure to /about#how-we-make-money per Document 10 §4.4
- Build /gallery page per Document 6

**Day 9 afternoon (Hassan):**
- Review all 5 supporting pages
- Edit /about copy, especially founder bio paragraphs
- Verify FAQ answers are accurate
- Tag deploy as `v0.3-supporting-pages`

**Deliverable end of day 9:** All non-blog pages live and functional. Marketing site is complete except for blog.

### 2.5 Days 9 through 14: Blog system and content

This is Document 9 §16 Phase 4 (8 steps) plus the actual blog post drafting.

**Days 9 through 11 (Claude Code, parallel with days 7-9 if engineer bandwidth allows):**
- Set up MDX pipeline per Document 9 §5.1
- Build /blog index page per Document 7 §6
- Build /blog/[slug] post template per Document 7 §6
- Build `<ProductCard>` component per Document 7 §4
- Build `<BlogDisclosure>` component per Document 7 §5.4
- Build `<BlogCTABox>`, `<BlogAuthorBio>`, `<BlogRelatedPosts>` per Document 7
- Set up frontmatter parsing per Document 9 §5.2

**Days 9 through 14 (Claude in this thread, parallel):**
- Day 9: Draft Blog Post 1 (Scandinavian Living Room). Hassan edits day 10 morning.
- Day 10: Draft Blog Post 2 (Mid-Century Coffee Tables). Hassan edits day 11 morning.
- Day 11: Draft Blog Post 3 (Small Bedroom Design). Hassan edits day 12 morning.
- Day 12: Draft Blog Post 4 (Velvet vs Linen Sofas). Hassan edits day 13 morning.
- Day 13: Draft Blog Post 5 (2026 Design Trends). Hassan edits day 14 morning.
- Day 14: Draft Blog Post 6 (Why I Built Furnish). Hassan edits day 14 evening.

**Daily blog post workflow (per post):**
1. Claude drafts the markdown file with full frontmatter, body, product card placeholders
2. Hassan reviews the draft (30 to 60 minutes)
3. Hassan finds product images for each product card and saves to `public/images/products/[retailer]/`
4. Hassan replaces placeholder retailer URLs with real product page URLs (still plain URLs, Skimlinks SDK handles wrapping)
5. Hassan commits the markdown file to git
6. Vercel auto-deploys; post is live within 2 minutes

**Day 14 afternoon (Hassan):**
- All 6 posts live on furnish.live/blog
- Verify each post has FTC disclosure rendered
- Verify each post has 8 to 12 outbound links
- Verify each post has product images (no broken image links)
- Tag deploy as `v0.4-blog-launch`

**Deliverable end of day 14:** All 8 page templates plus 6 blog posts live. Site is functionally complete. Polish phase begins.

### 2.6 Days 14 through 17: Polish, Lighthouse, accessibility

This is Document 9 §16 Phase 5 (steps 37 through 50).

**Day 15 (Claude Code):**
- Run Lighthouse on every page
- Address performance issues (lazy loading, bundle size, image optimization)
- Verify all images use Next.js Image component with proper sizing
- Check Core Web Vitals targets per Document 2 §11

**Day 16 (Claude Code):**
- Run accessibility audit (Lighthouse + manual screen reader test)
- Fix focus rings, ARIA labels, keyboard navigation issues
- Verify `prefers-reduced-motion` respected throughout
- Cross-browser test on Safari, Chrome, Firefox, mobile Safari, mobile Chrome

**Day 16 afternoon (Hassan):**
- Use the live site as a real user would
- Click every CTA, navigate every page, test the compare slider
- Note bugs, copy edits, visual issues

**Day 17 (Claude Code + Hassan):**
- Address bugs from day 16 review
- Final copy polish (especially the founder note, the home headline, the CTA buttons)
- Verify sitemap.xml and robots.txt
- Submit sitemap to Google Search Console
- Verify Plausible analytics tracking
- Tag deploy as `v0.5-polish-complete`

**Deliverable end of day 17:** Site passes Lighthouse 90+ Performance, 95+ Accessibility, 100 SEO across all pages. Cross-browser confirmed. Hassan-approved.

### 2.7 Days 17 through 19: Final review and pre-launch

**Day 18 (Hassan):**
- Final read-through of every word on every page
- Final review of every image (curation quality, alt text accuracy)
- Verify all redirects work per Document 4 §6.2
- Verify waitlist email submissions land in Supabase correctly
- Verify GitHub Actions CI passes on every PR

**Day 19 (Hassan + Claude):**
- Buffer day. Address any last issues.
- Prepare launch announcement (X/Twitter, Instagram, family/friends email)
- Schedule launch posts for Day 20 morning

**Deliverable end of day 19:** Site is launch-ready. Hard launch announcement prepared.

### 2.8 Day 20: Hard launch

**Morning:**
1. ☐ Final smoke test: load every page, click every major CTA, submit a test waitlist email
2. ☐ Verify SSL, redirects, sitemap all working
3. ☐ Tag deploy as `v1.0-launch`

**Late morning / early afternoon:**
1. ☐ Post launch announcement to Hassan's social media (X, Instagram)
2. ☐ Send announcement email to family, friends, design-interested contacts (target: 50 to 100 people)
3. ☐ Post in 2 to 3 relevant communities (subreddits, Discord servers about interior design or AI tools, but NOT Skimlinks-specific or affiliate-focused groups, which can hurt Skimlinks credibility)
4. ☐ Update LinkedIn, Twitter, Instagram bios to include furnish.live link

**Afternoon and evening:**
- Monitor Plausible for traffic
- Monitor Supabase for waitlist signups
- Respond to any inbound messages

**Launch day target metrics:**
- 100+ unique visitors
- 10+ waitlist signups
- 5+ blog post reads (full scroll)
- Zero broken links or critical bugs

**Deliverable end of day 20:** Site live and publicly announced. Initial traffic in Plausible. Waitlist accumulating signups.

### 2.9 Days 21 through 34: Skimlinks 14-day waiting period

The 14-day waiting period before Skimlinks re-application starts.

**Each day:**
- Check Plausible for traffic patterns
- Check Supabase for waitlist signups
- Respond to any blog post comments or social engagement

**Day 28 (mid-period check):**
- Verify all blog posts still load, no broken images
- Light content edit pass if any obvious issues stand out
- If traffic is below 30 unique visitors over the 14-day window, do additional outreach (more friends, more communities, a follow-up social post)

**Day 34 (end of waiting period):**
- Re-apply to Skimlinks per Document 10 §6.2
- Use the application copy from Document 10 Appendix A
- Submit and wait

**Deliverable end of day 34:** Skimlinks re-application submitted.

### 2.10 Days 35 through 48: Skimlinks review

5 to 14 business days. Hassan does NOTHING active on Skimlinks during this period. Just wait.

In parallel, Hassan resumes work on the iOS app phases (Phase A finishing, Phase B catalog curation, etc.).

**Day 48 target:** Skimlinks decision received.

If approved:
- Day 48: Add NEXT_PUBLIC_SKIMLINKS_SITE_ID to Vercel env vars
- Day 48: Verify SDK loads on blog post pages
- Day 49: First click attribution in Skimlinks dashboard
- Day 50+: Begin earning affiliate revenue

If rejected:
- Day 48: Read rejection email carefully
- Day 49: Diagnose the failure mode
- Day 49+: Per Document 10 §6.5, evaluate Impact pivot

---

## 3. Parallel workstreams

The 21-day timeline assumes parallel execution of multiple workstreams. Here is what runs simultaneously:

### 3.1 Workstream 1: Engineering (Claude Code, days 1 through 17)

Build the site per Documents 2 through 10. Estimated 8 to 13 days of focused work, spread across 17 calendar days.

### 3.2 Workstream 2: Content drafting (Claude in conversation thread, days 9 through 14)

Draft 6 blog posts. Roughly 30 to 45 minutes per post for the draft itself.

### 3.3 Workstream 3: Content editing (Hassan, days 9 through 14)

Edit each blog post. Roughly 30 to 60 minutes per post.

### 3.4 Workstream 4: Image curation (Hassan, days 1 through 14)

Curate 59 total images per Document 4 §8.9:
- 4 hero images
- 24 gallery images (6 styles × 4 rooms minimum, expand toward 36)
- 12 before/after pairs
- 5 blog hero images
- 1 about page image
- 1 OG default image

Hassan can pull these from existing test generations rather than generating new ones. The work is selection, not creation.

### 3.5 Workstream 5: Product image sourcing (Hassan, days 11 through 14)

Source product images from retailer pages for the 60 to 75 product cards across all 6 blog posts. Roughly 1 to 2 hours per post.

### 3.6 Workstream 6: Legal documents (Hassan, day 7)

Generate Privacy Policy and Terms of Service via Termly or iubenda. 30 to 60 minutes total.

### 3.7 Workstream 7: Apple Developer enrollment (Hassan, day 0)

Submit Apple Developer Program enrollment ($99). 5 minutes to submit. 1 to 3 days for approval. Runs in background.

### 3.8 Hassan's daily time commitment

| Days | Estimated time per day | Activities |
|---|---|---|
| Day 0 | 1 hour | Setup tasks |
| Days 1-7 | 1 to 2 hours | Image curation, occasional review |
| Days 8-14 | 3 to 5 hours | Heavy content editing, image sourcing, daily reviews |
| Days 15-19 | 2 to 3 hours | Polish review, final QA |
| Day 20 | 4 to 6 hours | Launch operations, social posting, monitoring |
| Days 21+ | 30 minutes per day | Light monitoring during waiting period |

Total Hassan time across the 21-day project: roughly 40 to 60 hours.

---

## 4. Pre-launch checklist (the day-of go-live)

This is the day-20 morning checklist Hassan walks before going public.

### 4.1 Functional checks

- [ ] Home page loads in under 2.5 seconds on mobile (Plausible or PageSpeed Insights)
- [ ] All 8 page routes return HTTP 200 (home, how-it-works, gallery, about, blog, faq, privacy, terms)
- [ ] All redirects (per Document 4 §6.2) return HTTP 308
- [ ] /404 returns HTTP 404 (Next.js does this automatically)
- [ ] Sitemap.xml is accessible at https://furnish.live/sitemap.xml
- [ ] robots.txt is accessible at https://furnish.live/robots.txt
- [ ] Waitlist email submission works (test from a real device, verify row in Supabase)
- [ ] Compare slider works on mobile and desktop
- [ ] Lightbox modal works on mobile (swipe gestures) and desktop (click)
- [ ] All 6 blog posts load and render correctly
- [ ] FTC disclosure visible on every blog post
- [ ] Product card images all load (no broken images)
- [ ] Internal links work (no 404s when clicking around)
- [ ] External links open in new tabs

### 4.2 Visual checks

**Brand and typography:**
- [ ] Brand colors match the iOS app (per Document 2 §0)
- [ ] No pure black or pure white anywhere (per Doc 2 §1.3)
- [ ] Fraunces editorial display font loaded and rendering on hero, section headers, founder note
- [ ] App sans-serif loaded for all body and UI text
- [ ] Type scale matches Doc 2 §2.3 (no random font sizes)
- [ ] Hero headline uses display treatment with proper tracking and leading per Doc 2 §2.4

**Motion library and easing:**
- [ ] All 5 furnish custom ease curves registered on first GSAP load (`furnishOut`, `furnishInOut`, `furnishBack`, `furnishAnticipate`, `furnishQuick`) per Doc 3 §2.3
- [ ] GSAP, ScrollTrigger, Flip, and CustomEase all lazy-loaded after first paint (verify in Network tab)
- [ ] No motion plays before first paint (LCP not blocked by GSAP)

**Hero and home page motion:**
- [ ] Loading sequence plays on first visit per Doc 3 (Animation System loading sequence)
- [ ] Hero headline reveals sequentially per Doc 5 §1.11 (line by line, not all at once)
- [ ] Hero CTAs animate in after headline lands
- [ ] Sample gallery tiles stagger in as they enter viewport
- [ ] Compare slider drag is buttery smooth on mobile (touch) and desktop (mouse and keyboard)
- [ ] Comparison table rows animate in with subtle stagger as user scrolls past
- [ ] Founder photo and copy fade in cleanly with no layout shift

**Gallery interactions:**
- [ ] Style cycler on each tile transitions smoothly between style images (per Doc 6 §3.3)
- [ ] Lightbox opens with GSAP Flip (the clicked tile scales into fullscreen; per Doc 6 §5)
- [ ] Lightbox closes by reversing the Flip animation (zooms back into the tile)
- [ ] Style options inside lightbox cycle without layout jump
- [ ] Random shuffle on page load actually shuffles (refresh and verify order changes; per Doc 6 §12)

**Navigation:**
- [ ] Sticky nav remains pinned and renders consistently across all pages
- [ ] "Menu" trigger opens full-screen takeover smoothly (per Doc 3 Animation System full-screen menu takeover)
- [ ] Menu links have subtle hover states (per Doc 2 §6.1)
- [ ] CTA pill in nav is always visible, animates on hover

**Scroll-triggered reveals:**
- [ ] Section reveals fire when element is roughly 20-30% in viewport (not too early, not too late)
- [ ] No element appears popped-in (everything has at least a fade or transform)
- [ ] Multiple scroll-triggers on the same page do not jank or double-fire
- [ ] ScrollTrigger.refresh() handles window resize correctly

**Hover and tactile feedback:**
- [ ] All buttons have a tactile hover state (subtle transform, color shift, or shadow per Doc 2 §6.1)
- [ ] Internal links underline-animate on hover (not a jarring instant underline)
- [ ] Gallery tiles lift subtly on hover (desktop only)
- [ ] Product cards in blog posts have a hover state that does not break layout

**Brand markers and rhythm:**
- [ ] Thin accent-color section dividers render cleanly (the Linear-pattern marker per Doc 2 §8.1)
- [ ] Layout density rhythm holds: sections vary between dense, breathing, and spacious per Doc 2 §4.1
- [ ] Empty space treated as a design element, not "missing content"
- [ ] Footer is consistent across all pages

**Cleanliness:**
- [ ] No element overflows on any viewport size
- [ ] No flash of unstyled content (FOUC) on page load
- [ ] No cumulative layout shift (CLS < 0.1 in Lighthouse)
- [ ] Zero console errors in DevTools across every page
- [ ] Zero console warnings (or all known and acknowledged)

**Reduced motion compliance:**
- [ ] Reduced motion respected (enable reduce motion in OS settings; animations skip cleanly to final state)
- [ ] Reduced motion does not break layout (elements visible, not stuck mid-transition)

### 4.3 SEO and meta checks

- [ ] Every page has unique `<title>` and `<meta description>`
- [ ] Every page has correct canonical URL
- [ ] OG image displays correctly when sharing the URL on Twitter/iMessage
- [ ] JSON-LD structured data present on home, about, blog posts, FAQ (verify with Google Rich Results Test)
- [ ] Sitemap submitted to Google Search Console
- [ ] No console errors in browser DevTools

### 4.4 Analytics checks

- [ ] Plausible script loads on every page
- [ ] Page views tracked correctly
- [ ] Custom events fire on CTA clicks
- [ ] Outbound link tracking works (test by clicking a blog product link)

### 4.5 Cross-browser checks

- [ ] Chrome (desktop): full pass
- [ ] Safari (desktop macOS): full pass
- [ ] Firefox (desktop): full pass
- [ ] Mobile Safari (iOS): full pass
- [ ] Mobile Chrome (Android): full pass
- [ ] Edge (desktop): smoke test only

### 4.6 Pre-launch state checks

- [ ] NEXT_PUBLIC_APP_LAUNCHED is false
- [ ] All CTAs say "Join the Waitlist" (not "Get the App")
- [ ] App Store badge replaced with "Coming soon to iOS" copy
- [ ] No App Store screenshots visible
- [ ] Skimlinks SDK does NOT load (Skimlinks not yet approved)

### 4.7 Documentation

- [ ] README.md in repo explains the project, locked decisions reference Documents 1-11, deployment steps documented
- [ ] All 11 documents archived in repo at `docs/specs/` or in a separate documentation folder

---

## 5. Hard launch announcement plan (day 20)

### 5.1 Social media posts

**X/Twitter post (Hassan's account):**

```
After months of building, Furnish is live.

Take a photo of any room. AI redesigns it in your style. Every piece in the
designed room is shoppable, with real retailer links.

iOS app coming soon. Site live now: furnish.live

Built solo at 18.
```

**Instagram post (with image):**

Image: a curated room from the gallery
Caption: Same as X post, slightly expanded.

**LinkedIn post (Hassan's profile):**

Slightly more formal version of the X post, with a brief note about the entrepreneurship journey (high school MLO license, second app, etc.).

### 5.2 Email to friends and family

```
Subject: Furnish is live

Hey,

After months of work, my second app project is live in marketing site form.
Furnish takes a photo of any room and AI redesigns it in your style with every
piece shoppable. iOS app launching in a few weeks.

Site: https://furnish.live
Blog: https://furnish.live/blog
About: https://furnish.live/about

If you have a minute, scroll through. Let me know what you think.

Hassan
```

Send to 50 to 100 people in Hassan's network.

### 5.3 Community posts

Pick 2 to 3 communities Hassan is active in:
- Reddit (r/InteriorDesign, r/HomeImprovement, r/SideProject)
- Discord servers about AI tools or design
- Indie Hacker community
- Designer/founder forums Hassan is part of

Post format: a brief, authentic launch update. Not a sales pitch. Reference the site, the iOS app coming soon, ask for feedback.

**Important:** Do NOT post in any subreddit or community that explicitly rewards or organizes affiliate revenue. Skimlinks reviewers may check for this and reject as a "click farm" indicator.

### 5.4 Outreach (light)

Hassan emails 5 to 10 design or tech blogs / newsletters with a brief introduction. No pitch deck, no PR firm. Just a personal email saying "I built this, would love feedback if you have a minute."

Targets:
- Indie Hackers founders newsletter
- TLDR newsletter
- Smaller design newsletters or blogs

This is low-effort outreach. Most will not reply. The few that do may write about Furnish, generating valuable traffic and SEO links.

---

## 6. Post-launch operations (Days 21+)

### 6.1 Daily check-ins (first 14 days)

- 5 to 10 minutes per day reviewing Plausible dashboard
- Note traffic patterns, top pages, top blog posts
- Respond to any inbound emails or social messages

### 6.2 Weekly check-ins (after first 14 days)

- Review Plausible weekly summary
- Review waitlist signup count
- Respond to inbound communications
- Check for broken links if any major retailer rebrand happened

### 6.3 Monthly content updates

Per Hassan's Q5 = A. Monthly content cadence only.

Each month:
1. Hassan picks the next blog post topic from the post-launch ideas list (see §7)
2. Claude (in this thread) drafts the post
3. Hassan edits, sources images, commits
4. Post goes live within a week of drafting

Topics for months 1 through 6 post-launch (preliminary):

| Month | Topic | Type |
|---|---|---|
| Month 1 | "How to Style a Studio Apartment: 8 Layouts" | Style guide |
| Month 2 | "10 Best Floor Lamps Under $300" | Product roundup |
| Month 3 | "Modern vs. Traditional: Which Style Suits Your Home?" | Comparison |
| Month 4 | "How to Decorate an Empty Living Room From Scratch" | Style guide |
| Month 5 | "12 Best Coffee Tables Under $1,000 (Premium Picks)" | Product roundup |
| Month 6 | "What I Learned After 6 Months of Furnish" | Founder/brand |

These topics build SEO depth, broaden the retailer link surface, and keep the blog fresh.

### 6.4 Quarterly site updates (optional, light cadence)

- Check Plausible for top-converting pages and underperforming pages
- Review CTAs on top pages, test minor variations
- Update About page if business state has changed
- Verify Privacy Policy and Terms still accurate
- Run broken-link audit (per Document 10 §8.2)

This is genuinely light cadence. Hassan does not need to do major site overhauls quarterly. Just touch the site briefly to keep it fresh.

### 6.5 Annual operations

- January: Annual merchant audit (per Document 10 §5.5)
- January: Tax form 1099 from Skimlinks (or Impact)
- January: Review the year's blog posts, freshen old content if needed
- January: Update copyright year in footer

---

## 7. Returning to the iOS app

Per Hassan's Q3 = A. Marketing site fully shipped first. iOS phases resume after.

### 7.1 Day 21: iOS app phases resume

After the marketing site is live (day 20), Hassan resumes the iOS app launch plan from earlier sessions. The phases (from the iOS launch plan):

- **Phase A (Real AI generation wiring):** Partially done. Resume with A.3 (client wiring), A.5 (Realtime subscription), A.6 (cost guards). Estimated 1 to 2 weeks.
- **Phase B (Real catalog):** Curated 200 products with real URLs and prices. Estimated 1 to 2 weeks. Hassan curates while Claude Code wires.
- **Phase C (Skimlinks):** Already in progress via the marketing site re-application. Once approved, the iOS app can use the same Skimlinks site ID for in-app affiliate links (different code path, same approval).
- **Phase D (Apple Sign-In):** 3 to 5 days. Required by App Store.
- **Phase E (App Store mandatory):** App icon, screenshots, metadata, privacy nutrition label, etc. 1 to 2 weeks.
- **Phase F (Capacitor wrap):** 3 to 5 days.
- **Phase G (TestFlight):** 1 to 2 weeks.
- **Phase H (Submission):** 1 to 7 days, expect rejection round.
- **Phase I (Launch):** Day 0 of the iOS app's launch.

### 7.2 Estimated iOS launch timeline

Days 21 through 70+ from the start of this project:
- Days 21 to 35: Finish Phase A + Phase B
- Days 35 to 49: Skimlinks waiting period (in parallel with iOS work)
- Days 49 to 65: Phase D + Phase E + Phase F
- Days 65 to 80: Phase G TestFlight
- Days 80 to 90: Phase H submission
- Day 90+: iOS app launches (assuming Apple approves on first or second submission)

So the realistic iOS launch is roughly 12 weeks from today. Marketing site launches at week 3. iOS app launches at week 12 to 13. Window between marketing site launch and iOS launch: 9 to 10 weeks.

This is a reasonable lag. The marketing site needs that time to:
- Pass Skimlinks re-application
- Build organic search traffic
- Establish a content cadence
- Generate the launch email list (waitlist)

When the iOS app launches, the marketing site is established and ready to convert traffic to App Store installs.

### 7.3 The hard launch on day 20 vs. iOS launch announcement

**Day 20 hard launch:** Marketing site goes live, social posts, family/friends email, community outreach. Tone: "I built this, here's where I'm at, the iOS app is coming."

**Day 90+ iOS launch announcement:** A second, larger announcement when the iOS app is on the App Store. Tone: "Furnish is live on iOS, here's the link to download."

These are two separate launch moments with two separate announcement campaigns. Day 20 generates Skimlinks credibility traffic. Day 90+ generates App Store installs.

---

## 8. Risk register and mitigation

### 8.1 Risk: Skimlinks rejects the re-application again

**Probability:** Low to medium. The pre-application checklist in Document 10 §6.1 should satisfy them.

**Impact:** Significant. No affiliate revenue without Skimlinks (or backup network).

**Mitigation:**
- Follow the pre-application checklist meticulously
- Ensure 14+ days of measurable traffic before re-applying
- If rejected, evaluate Impact pivot per Document 10 §6.5

### 8.2 Risk: Apple rejects the iOS app on first submission

**Probability:** High. First-time iOS submissions almost always get rejected.

**Impact:** Adds 1 to 4 weeks to iOS launch timeline.

**Mitigation:**
- Read App Store guidelines carefully before submission
- Verify Apple Sign-In works (Phase D)
- Verify privacy nutrition label is accurate (Phase E)
- Pre-submission TestFlight beta should catch most issues (Phase G)

### 8.3 Risk: Marketing site has low organic traffic

**Probability:** Medium. New sites take time to build SEO authority.

**Impact:** Slow ramp on Skimlinks revenue.

**Mitigation:**
- Hard launch on day 20 generates initial traffic
- Monthly content cadence builds SEO over time
- Iterate based on Plausible data: which posts drive traffic, which CTAs convert
- 12+ months is the realistic SEO ramp horizon, not 12 weeks

### 8.4 Risk: Hassan burnout during the 21-day sprint

**Probability:** Medium. 40 to 60 hours of focused work over 21 days is sustainable but not infinitely so.

**Impact:** Quality drops, deadlines slip.

**Mitigation:**
- Take 1 to 2 full rest days during the 21-day window (e.g., a weekend mid-sprint)
- The timeline includes buffer days (days 17-19) for catching up if anything slipped
- If scope creeps, cut ruthlessly. Skip non-critical polish to ship.

### 8.5 Risk: Image curation takes longer than expected

**Probability:** Medium. 59 images is real work to curate.

**Impact:** Site launches with placeholder images, unprofessional appearance.

**Mitigation:**
- Curate in parallel from day 1
- Lower the bar if needed: 30 images is acceptable for v1, expand to 59 over time
- Reuse images if absolutely necessary (e.g., the same hero image as the home page final CTA)

### 8.6 Risk: Vercel hosting bills

**Probability:** Very low at v1 traffic levels. Free Hobby tier should be sufficient.

**Impact:** Minor cost. Upgrade to Pro tier ($20/month) if needed.

**Mitigation:**
- Monitor Vercel bandwidth usage post-launch
- Optimize images aggressively
- Move heavy assets to a CDN if bandwidth becomes an issue

---

## 9. Decision tree: when to revisit major decisions

Some decisions made in Documents 1 through 10 should be revisited periodically. This section codifies when.

### 9.1 Pricing model

**Decision in Doc 1 §1:** Furnish is free at launch.

**Revisit when:**
- 6 months post-iOS-launch
- Or when active users exceed 10,000

**Possible changes:**
- Introduce premium tier (multi-room design, advanced styles, priority generation)
- Keep free tier with limited generations per month
- Revenue model shifts from pure affiliate to mixed affiliate + subscription

### 9.2 Affiliate network

**Decision in Doc 10 §0:** Skimlinks as primary, no backup.

**Revisit when:**
- If Skimlinks rejects re-application
- Or if Skimlinks revenue is materially below expectations after 6 months

**Possible changes:**
- Pivot to Impact
- Add direct retailer programs for top retailers (Article, Wayfair) for better rates
- Hybrid: Skimlinks for breadth + direct programs for depth

### 9.3 Content cadence

**Decision in Doc 7 §1 and Doc 11 §0:** Monthly content updates only.

**Revisit when:**
- 6 months post-launch
- Or if blog traffic plateaus or declines

**Possible changes:**
- Increase to bi-weekly cadence if SEO data justifies it
- Decrease cadence if revenue per post is low
- Pivot content types if certain post types dramatically outperform

### 9.4 Internationalization

**Decision in Doc 4 §7 and Doc 9 §11:** English only at launch, i18n architecture in place.

**Revisit when:**
- 50+ users from non-US/non-English regions sign up to waitlist
- Or 6 months post-launch with measurable international traffic

**Possible changes:**
- Add Spanish first (largest non-English market for design content)
- Add French and Arabic per Doc 4 §7.3 priority order

### 9.5 Dark mode

**Decision in Doc 2 §9:** No dark mode at launch.

**Revisit when:**
- 6 months post-launch
- Or if user feedback strongly requests it

**Possible changes:**
- Add dark mode if 20%+ of users explicitly request it
- Keep light-only if no significant demand

### 9.6 Social media presence

**Decision in Doc 8 §1.10:** No social links at launch. Email only.

**Revisit when:**
- 1 month post-launch
- Hassan creates active accounts and is committed to maintaining them

**Possible changes:**
- Add X, Instagram, TikTok links to footer
- Active social presence becomes a marketing channel
- Pinterest specifically may drive design-conscious traffic

---

## 10. Final checklist (the project itself, not the launch)

To declare the project "complete" at day 20:

- [ ] All 11 documents are archived in the project repo
- [ ] All decisions in those documents are honored in the live site
- [ ] All 8 page templates plus the 404 are live and functional
- [ ] All 6 launch blog posts are live with FTC disclosure
- [ ] All 59 images are curated and deployed
- [ ] Lighthouse scores meet targets across all pages
- [ ] Privacy Policy and Terms of Service are live and lawyer-reviewed (or at least Termly-generated)
- [ ] Waitlist email collection works end-to-end
- [ ] Plausible analytics is tracking
- [ ] Vercel deploys auto-trigger on push to main
- [ ] DNS for furnish.live points to Vercel with SSL active
- [ ] Apple Developer Program enrollment is approved
- [ ] Hard launch announcement is complete (social, email, community)
- [ ] Hassan can take a deep breath and feel proud

The 13th item is non-negotiable. This is meaningful work. Acknowledge that.

---

## 11. The eleven documents recap

For reference, the complete list of locked documents:

| # | Document | Key decisions |
|---|---|---|
| 1 | Brand Foundation | Tagline, voice, personas, walk-away feeling, competitive position |
| 2 | Visual Design System | Color from app tokens, Fraunces + app sans, layout density rhythm, brand markers |
| 3 | Animation System | GSAP + ScrollTrigger + Flip + CustomEase, motion moments, easing curves, reduced motion compliance |
| 4 | Site Architecture | 8 pages + 404, /blog as subpath, i18n architecture, 59 images, Plausible analytics |
| 5 | Home Page Spec | 8 sections, before/after slider, comparison table, founder note, dual-state CTAs |
| 6 | Sample Gallery Spec | 3x3 grid with style cycler per tile, 36-image launch, GSAP Flip lightbox, random shuffle |
| 7 | Blog Content Plan | 6 launch posts, ~8,700 words, 60 to 75 retailer links, Wirecutter-style product cards |
| 8 | Static Pages Spec | /about with founder photo, /how-it-works expanded, /faq with 30+ questions, /privacy and /terms |
| 9 | Tech Stack and Deployment | Next.js 14 + pnpm + Tailwind + GSAP + Plausible + Vercel + Supabase |
| 10 | Skimlinks Integration | SDK on blog routes only, FTC disclosure top-of-post, re-apply 14 days post-launch |
| 11 | Launch and Iteration Roadmap | 21-day timeline, hard launch day 20, monthly content cadence, iOS resumes day 21 |

These eleven documents represent roughly 12,000 lines of locked specification covering brand, design, animation, architecture, content, engineering, monetization, and launch. They are the foundation Claude Code will use to build furnish.live.

---

## Appendix A: Pre-flight summary for Hassan

Before signaling "go" to Claude Code, Hassan does the following:

1. ☐ Read all 11 documents end to end. Note any disagreements or questions for follow-up.
2. ☐ Sign up for Apple Developer Program ($99). Start the 1 to 3 day approval clock.
3. ☐ Reserve hello@furnish.live email if not already done.
4. ☐ Verify ownership of furnish.live domain.
5. ☐ Create the GitHub repo `furnish-web` (private).
6. ☐ Sign up for Vercel and connect GitHub.
7. ☐ Sign up for Plausible Analytics ($9/month).
8. ☐ Decide whether to use Termly ($10-30/month) or iubenda ($27/year) for legal docs. Sign up for one.
9. ☐ Block out 4-6 hours per day for the next 21 days.
10. ☐ Take a moment to register that this is real and exciting.

---

## Appendix B: Day-by-day Hassan dashboard

A simplified view of what Hassan does each day:

| Day | Hassan's primary tasks |
|---|---|
| 0 | Setup tasks. Apple Developer enrollment. Repo creation. |
| 1-3 | Foundation phase. Light review. Image curation begins. |
| 4-7 | Home page review. Founder note copy edits. Image curation continues. |
| 7-9 | Privacy/Terms generation. Supporting page copy edits. |
| 9 | Day 1 of blog drafting. Edit Post 1 (Scandinavian). |
| 10 | Edit Post 2 (Coffee Tables). Source product images for Posts 1 and 2. |
| 11 | Edit Post 3 (Small Bedroom). Source product images for Post 3. |
| 12 | Edit Post 4 (Velvet vs Linen). Source product images for Post 4. |
| 13 | Edit Post 5 (2026 Trends). Source product images for Post 5. |
| 14 | Edit Post 6 (Why I Built Furnish). Final product images. All 6 posts live. |
| 15-17 | Polish review. Bug fixes. Lighthouse audits. |
| 18-19 | Final review. Launch announcement prep. |
| 20 | HARD LAUNCH. Social posts. Family/friends email. Monitor traffic. |
| 21-34 | Light monitoring. iOS app phases resume. |
| 35 | Skimlinks re-application submitted. |
| 36-48 | Wait for Skimlinks decision. Continue iOS app work. |
| 49+ | Skimlinks live (if approved). Affiliate revenue begins. |

---

**End of Document 11 of 11.**

This is the final document in the marketing site specification series.

The 11 documents are now locked. Together they define every brand, design, content, engineering, monetization, and launch decision for furnish.live. Claude Code can build the site from these documents without needing additional design or content decisions.

Hassan's next step: read the documents, complete the pre-flight checklist in Appendix A, and signal readiness to begin the 21-day build.
