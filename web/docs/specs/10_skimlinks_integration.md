# Furnish. Document 10 of 11: Skimlinks Affiliate Integration Plan

**Purpose:** Lock the technical and operational plan for monetizing furnish.live via Skimlinks affiliate links. Defines integration approach, application strategy, FTC compliance, link wrapping, retailer mix, revenue tracking, and rejection handling. Claude Code uses this for the affiliate link wiring; Hassan uses it for application and ongoing operations.

**Audience:** Claude Code (executor of link wiring), Hassan (application owner, retailer relationships, FTC compliance, ongoing operations).

**Status:** Locked unless explicitly revised.

**Dependencies:** Documents 1, 4, 7, 8, 9.

**Critical brand rule:** No em dashes anywhere on the site. Applies to FTC disclosure copy, retailer language, every word.

---

## 0. Locked decisions summary

| Decision | Locked value |
|---|---|
| Integration approach | Skimlinks JavaScript SDK (drop-in script, auto-wraps every outbound retailer link on page load) |
| Application strategy | Build the full site first. Re-apply to Skimlinks once site has 6 published blog posts and 2 weeks of measurable traffic. Burn the boats. No backup network as primary path. |
| Backup network | Mentioned only as engineering insurance. Document includes Impact application as a contingency reference, not as a primary path. |
| FTC disclosure placement | Single disclosure block at top of every blog post. No footer-level repetition, no popups, no per-product footnotes. |
| Revenue tracking | Skimlinks dashboard for revenue. Plausible custom events for outbound clicks. Cross-reference weekly. |
| Link wrapping mechanism | Skimlinks SDK at runtime, not build-time wrapping. |
| Outbound link target | All affiliate links open in new tab with `rel="noopener sponsored"`. |
| Retailer count for credibility | Minimum 6 retailers across the launch blog posts. Target 8 to 10. |
| Approval timeline | Re-application 2 weeks after blog content is live. Realistic approval window: 5 to 14 days from re-application. |

---

## 1. Why Skimlinks

### 1.1 What Skimlinks does

Skimlinks is an affiliate network aggregator. Instead of applying to dozens of individual retailer affiliate programs (Wayfair, West Elm, Article, etc.), Skimlinks gives Furnish access to all of them through one integration.

### 1.2 The Skimlinks revenue model

Furnish embeds outbound links to retailers in blog posts. Skimlinks's JavaScript SDK detects these links at page load and rewrites them to include affiliate tracking. When a user clicks through and buys, the retailer pays Skimlinks a commission. Skimlinks keeps 25% (their fee) and pays Furnish the other 75%.

Typical commissions:
- Article: 5 to 8% per sale
- Wayfair: 4 to 7% per sale
- West Elm: 5 to 8% per sale
- CB2 / Crate & Barrel: 4 to 6% per sale
- AllModern: 5 to 7% per sale
- Burrow: 4 to 8% per sale

Average effective rate to Furnish (after Skimlinks fee): roughly 3 to 6% net.

### 1.3 Why this is the right model for Furnish

The alternative is direct affiliate programs at each retailer. That requires:
- Separate applications (each retailer has its own program)
- Separate dashboards to monitor
- Separate payment thresholds
- Separate W-9 tax forms
- Manual link generation per product

Skimlinks consolidates all of that. One application, one dashboard, one tax form. The 25% fee is worth the operational savings, especially for a single-founder company at launch scale.

### 1.4 The bet

The bet is that Skimlinks approves Furnish on re-application, given:
1. A live, polished marketing site (furnish.live, built per Documents 1-9)
2. 6 launch blog posts with 60+ outbound retailer links to legitimate retailers
3. Clear editorial content (style guides, product roundups, comparison posts)
4. Visible FTC affiliate disclosure on every post
5. Privacy Policy, Terms of Service, About page, Contact email
6. 2+ weeks of measurable traffic (even modest traffic demonstrates an audience)

This profile matches what Skimlinks looks for in publishers. The original rejection was based on an empty website. The re-application is based on a publishing operation.

---

## 1.5 Engineering insurance: contingency networks

This section exists for engineering completeness, not as a primary path. Hassan's directive is "burn the boats." Skimlinks is the path.

If Skimlinks denies on re-application, the contingencies in priority order:

1. **Impact** (impact.com): modern affiliate network with strong app and editorial publisher support. Direct partnerships with Wayfair, West Elm, Target, CB2, Crate & Barrel.
2. **CJ Affiliate** (cj.com): older, broader retailer coverage, slower onboarding.
3. **Direct retailer programs**: apply to Article, Wayfair, West Elm, CB2 individually. Most work, often best commission rates, but operationally heavy.

The technical wrapping pattern is identical across networks. If migration becomes necessary, swap the SDK and reconfigure. The blog post content itself does not change.

This contingency is documented but not actively pursued. Skimlinks is the path.

---

## 2. The Skimlinks SDK

### 2.1 What the SDK does

The Skimlinks SDK is a small JavaScript snippet that:
1. Loads on every page (or on blog post pages specifically)
2. Scans all `<a>` tags on the page
3. Identifies links pointing to retailers in Skimlinks's merchant network
4. Rewrites those links to include Skimlinks's tracking parameters
5. Tracks every click and reports it back to Skimlinks's servers
6. Awaits the retailer's purchase confirmation (handled retailer-side via cookie tracking)
7. Reports earned commissions in the Skimlinks dashboard

All of this happens transparently. The user sees normal-looking retailer links and gets normal browsing experience. Furnish gets revenue when purchases close.

### 2.2 The SDK script

Once Skimlinks approves Furnish, the dashboard provides a unique site ID and a script tag. Format:

```html
<script type="text/javascript" src="https://s.skimresources.com/js/[SITE_ID].skimlinks.js"></script>
```

The `[SITE_ID]` is a long alphanumeric value unique to Furnish's account.

### 2.3 SDK placement

Per Document 9 §9.2, root-layout-level scripts go in the head of `src/app/layout.tsx`. Skimlinks goes there too, but only on blog routes to avoid loading it everywhere.

Two options:

**Option A: Load globally.** Skimlinks SDK in root layout. Loads on every page. ~20KB JS overhead even on home page where it does nothing.

**Option B: Load only on blog routes.** Skimlinks SDK loaded conditionally inside blog page layout. Only loads where it matters.

**Locked: Option B.** No reason to load 20KB of JS on the home page or gallery where there are no outbound retailer links. The SDK is a blog-only concern.

### 2.4 Implementation

`src/app/blog/layout.tsx` (new file, only for blog routes):

```typescript
import Script from "next/script";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {process.env.NEXT_PUBLIC_SKIMLINKS_SITE_ID && (
        <Script
          src={`https://s.skimresources.com/js/${process.env.NEXT_PUBLIC_SKIMLINKS_SITE_ID}.skimlinks.js`}
          strategy="afterInteractive"
          type="text/javascript"
        />
      )}
      {children}
    </>
  );
}
```

Notes:
- `strategy="afterInteractive"` defers loading until after the page is interactive, so it does not block first paint.
- The script is gated on `NEXT_PUBLIC_SKIMLINKS_SITE_ID` env var. If the var is empty (pre-Skimlinks-approval state), the script does not load and outbound links remain plain. This means we can ship the site live without Skimlinks approval and add it later via env var without a code change.
- After approval, set `NEXT_PUBLIC_SKIMLINKS_SITE_ID` in Vercel environment variables. Redeploy. Done.

### 2.5 Environment variable addition

Add to `.env.example` (per Document 9 §12.3):

```
# Skimlinks (set after approval)
NEXT_PUBLIC_SKIMLINKS_SITE_ID=
```

Set in Vercel production environment after Skimlinks approves.

### 2.6 Verifying the SDK works

After setting the env var and redeploying, verify:

1. Open any blog post in a browser
2. Open DevTools Network tab
3. Look for `[SITE_ID].skimlinks.js` loading from `s.skimresources.com`
4. Click an outbound retailer link
5. Watch the URL bar briefly: it should show a `go.skimresources.com` redirect, then the retailer URL
6. Check the Skimlinks dashboard within 24 hours for click attribution

If clicks show up in the dashboard, the SDK is working.

---

## 3. Outbound link format in blog posts

### 3.1 The link format

In MDX blog post markdown, outbound links are written as plain links to the retailer's product page. No manual wrapping. The Skimlinks SDK handles wrapping at runtime.

Example markdown in a blog post:

```markdown
The [Article walnut coffee table](https://www.article.com/product/12345/seno-walnut-coffee-table) 
is the most versatile piece on this list.
```

When the page loads, Skimlinks rewrites this to:

```html
<a href="https://go.skimresources.com/?id=[SITE_ID]&xs=1&url=https%3A%2F%2Fwww.article.com%2Fproduct%2F12345...">
  Article walnut coffee table
</a>
```

The link still appears to the user as the same link (hover preview shows the original URL initially), but clicks pass through Skimlinks's tracking.

### 3.2 Link attributes

All outbound links in blog posts use these HTML attributes:

```html
<a 
  href="https://www.retailer.com/product/..."
  target="_blank"
  rel="noopener sponsored"
>
```

The attributes:
- `target="_blank"` opens in a new tab (user stays on Furnish's blog)
- `rel="noopener"` prevents the new tab from accessing Furnish's window (security)
- `rel="sponsored"` signals to search engines that the link is paid (SEO transparency, Google requires this)

### 3.3 MDX implementation

In MDX, configure the default Link component to apply these attributes automatically. `src/lib/mdx.ts`:

```typescript
import { ComponentProps } from "react";

const components = {
  a: (props: ComponentProps<"a">) => {
    const isExternal = props.href?.startsWith("http") && 
                       !props.href.includes("furnish.live");
    return (
      <a
        {...props}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener sponsored" : undefined}
      />
    );
  },
};

export const useMDXComponents = (existingComponents: any) => ({
  ...existingComponents,
  ...components,
});
```

Every external link in any MDX file automatically gets the right attributes. Internal links (to other Furnish pages) get standard treatment.

### 3.4 Product Card links

The Product Card component (Document 7 §4) embeds the same link pattern:

```typescript
<a
  href={product.retailerUrl}
  target="_blank"
  rel="noopener sponsored"
  onClick={() => track("product_card_click", { 
    product: product.name, 
    retailer: product.retailer,
    post: postSlug
  })}
  className="..."
>
  Shop at {product.retailer}
</a>
```

The Plausible event captures the click for cross-referencing with Skimlinks revenue data.

### 3.5 What NOT to do

**Do not manually wrap URLs in Skimlinks redirect format inside MDX files.** This is a temptation but it has problems:

1. The redirect URL becomes obsolete if Skimlinks changes their format.
2. It bakes the SITE_ID into the content, making migration to Impact or another network harder.
3. It hides the actual retailer URL from search engines (bad SEO).
4. It makes manual review harder.

Always write plain retailer URLs in MDX. Let the SDK do its job.

**Do not use URL shorteners** (bit.ly, etc.) inside blog posts. They obscure the destination and hurt user trust.

---

## 4. FTC compliance

### 4.1 The legal requirement

The Federal Trade Commission requires disclosure of any "material connection" between an endorser and a brand. Affiliate links are a material connection. Disclosure must be:

1. **Clear:** Plain language, not buried in legalese
2. **Conspicuous:** Visible without scrolling, before the reader encounters affiliate links
3. **Close to the claim:** On the same page, near the relevant content
4. **In the same medium:** Text disclosure for text content; not a hidden audio note in a video

Per Hassan Q4 = A. Single disclosure block at top of every blog post.

### 4.2 The disclosure block

Inserted as the very first content element on every blog post, immediately under the post header (title, date, byline) and above the hero image.

**Markup:**

```html
<div class="affiliate-disclosure">
  <p>
    This post contains affiliate links. When you buy through one, Furnish may earn a small 
    commission at no additional cost to you. This does not change our recommendations or 
    the price you pay. <a href="/about#how-we-make-money">Learn more.</a>
  </p>
</div>
```

**Visual treatment:**
- Background: subtle accent color tint (5% opacity)
- Padding: 16px vertical, 24px horizontal
- Border-radius: matches app token
- Text size: --text-body-s (smaller than body but still readable)
- Text color: ink at 80% opacity
- Font weight: regular (not bold)
- Inline link to /about#how-we-make-money is in accent color

**Placement:** Immediately after `<BlogPostHeader>` and before `<BlogPostHero>`. Hard-coded in the blog post template; not a per-post optional element.

### 4.3 The disclosure copy (locked)

```
This post contains affiliate links. When you buy through one, Furnish may earn a small 
commission at no additional cost to you. This does not change our recommendations or 
the price you pay. Learn more.
```

This copy:
- Is plain English
- States the commission relationship clearly
- Reassures the reader that price and recommendations are unaffected
- Links to a longer explanation on the About page

### 4.4 The "Learn more" target

The "Learn more" link points to `/about#how-we-make-money`. Add a section to the About page (per Document 8 §1) with the heading "How we make money" between the Mission and Roadmap sections.

**Copy for that section:**

```
Eyebrow: How we make money

Headline: Free for you. Paid by retailers.

Body:
Furnish is free to use. The app is free. The website is free. There are no subscription 
fees, no premium tiers at launch, no upsells.

When you buy a product from a retailer through a Furnish link, the retailer pays us a 
small commission. The price you pay does not change. The commission comes out of the 
retailer's marketing budget, not your pocket.

We pick products based on quality, style, and fit for the rooms we design. Commission 
rates do not influence what we recommend. If two coffee tables would both fit a room, 
we pick the one that looks better in the room. Not the one that pays us more.

When products in our blog posts contain affiliate links, we say so at the top of the 
post. Always. Every time. The Federal Trade Commission requires this disclosure for 
affiliate content, and we agree.

Furnish is built so anyone can have the room they imagine. The retailers pay us to send 
them customers. The customers pay nothing extra. Everyone wins.
```

This section serves two purposes:
1. Satisfies the "Learn more" link from the disclosure block
2. Provides FTC-compliant fuller disclosure of the business model

### 4.5 Disclosure on social shares

When a user shares a blog post on social media, the disclosure block does not travel with the share image. This is acceptable because:
- The disclosure exists on the destination page (the blog post)
- The user clicks through to the actual post to read the content
- The disclosure is encountered before any affiliate link

Do not add disclosure to OG image overlays. It clutters the share preview.

### 4.6 Email disclosure (post-launch)

If Furnish sends email newsletters that include affiliate links (post-launch via Beehiiv), the same disclosure must appear in the email body, prominently before any affiliate link.

This is out of scope for v1 but flagged for the post-launch newsletter setup.

---

## 5. Retailer mix and merchant verification

### 5.1 Why mix matters

For Skimlinks credibility, the launch blog posts should link to multiple retailers, not concentrate on one. A blog post with all 12 links going to Wayfair looks like a Wayfair affiliate site, not a publisher with editorial judgment.

### 5.2 Target retailer mix at launch

Per Document 7 Appendix B, the 60 to 75 outbound links across the 6 launch posts should span at least 6 retailers. Target distribution:

| Retailer | Approximate link count | Skimlinks status (expected) |
|---|---|---|
| Article | 15 to 20 | Active in Skimlinks network |
| Wayfair | 10 to 15 | Active in Skimlinks network |
| West Elm | 8 to 12 | Active in Skimlinks network |
| CB2 / Crate & Barrel | 8 to 12 | Active in Skimlinks network |
| AllModern | 6 to 10 | Active in Skimlinks network |
| Burrow | 4 to 6 | Active in Skimlinks network |
| Snowe | 3 to 5 | Active in Skimlinks network |
| Other (Schoolhouse, Heirloom, Rejuvenation, etc.) | 5 to 10 across multiple | Verify each |

### 5.3 Merchant verification workflow

Before linking to a retailer in a blog post, verify Skimlinks supports them:

1. Log into Skimlinks dashboard
2. Search the Merchant Directory for the retailer name
3. Confirm the retailer is "Active" in Skimlinks's network
4. Confirm the commission rate
5. Confirm any restrictions (some retailers exclude certain product categories)

If a retailer is NOT in Skimlinks: skip them in blog posts. Do not link to a retailer who will not pay commission, because:
- Furnish gets no revenue from the click
- The link hurts the page's "outbound retailer link density" credibility metric (it looks like a publisher, but it's not earning)
- Better to link to a similar product at a different retailer who IS in the network

### 5.4 If a featured retailer is not in Skimlinks

Some boutique retailers (e.g., a small Vietnamese ceramics studio Hassan loves) may not be in Skimlinks. Two options:

**Option A:** Skip them. Use only retailers in the network for blog posts.

**Option B:** Include them as plain links (no affiliate). Use sparingly, and only if:
- The product is uniquely worth featuring (genuinely best in class, no good alternative)
- The post's commercial intent is preserved by other links to in-network retailers

Document 7's content plan should be reviewed against this rule before publication. If a planned product pick is at a non-Skimlinks retailer, swap to an alternative at an in-network retailer.

### 5.5 Maintaining merchant relationships

Skimlinks status of each retailer can change. Annual review:

- Once per year, audit all blog posts for outbound links
- For each retailer, verify still active in Skimlinks
- For any deactivated retailer, replace links with active alternatives
- Update the post's `updatedAt` frontmatter

Calendar reminder: every January 15, run merchant audit.

---

## 6. The Skimlinks application

### 6.1 Pre-application checklist

Before re-applying, the following must be true:

- [ ] furnish.live is live and accessible
- [ ] All 8 page templates from Document 4 are deployed plus the 404 (home, how-it-works, gallery, about, blog index, faq, privacy, terms, 404)
- [ ] At least 6 blog posts are published with full content
- [ ] Each blog post has 8 to 12 outbound retailer links (60 to 75 total across the 6 posts)
- [ ] FTC disclosure block appears on every blog post
- [ ] About page exists with founder bio and contact email
- [ ] Privacy Policy is live
- [ ] Terms of Service is live
- [ ] Contact email (hello@furnish.live) is functional and monitored
- [ ] Plausible analytics is live and tracking
- [ ] Site has been live for at least 14 days (Skimlinks looks for "is this real or just stood up for the application")
- [ ] Some traffic is verifiable (even modest: 50+ unique visitors total)
- [ ] No Skimlinks SDK loaded yet (we are pre-approval)

The pre-application checklist is the single most important pre-flight. Missing any item likely means rejection.

### 6.2 Re-application process

1. Log into the existing Skimlinks account at skimlinks.com
2. Navigate to "Sites" -> "Add New Site"
3. Fill out the application form with the live furnish.live URL
4. In the description field, write:

```
Furnish is an editorial publication and product directory covering interior design, home 
décor, and shoppable room inspiration. Our blog at furnish.live/blog publishes original 
style guides, product roundups, and design comparisons that link to major furniture and 
home retailers including Article, Wayfair, West Elm, CB2, AllModern, Burrow, and others.

Each post features 8 to 12 outbound retailer product recommendations with editorial 
context and FTC-compliant affiliate disclosure. Our editorial calendar publishes new 
content monthly.

This is a re-application. The original application was reviewed when the site was in 
pre-launch state. The site is now live with 6+ published posts and growing traffic.

Site: https://furnish.live
Blog: https://furnish.live/blog
About: https://furnish.live/about
Contact: hello@furnish.live
```

5. Submit.
6. Wait. Skimlinks typically reviews within 5 to 14 business days. Some applications take longer.

### 6.3 What Skimlinks evaluates

Based on their published guidelines and known approval criteria:

- Site is live and functional ✓
- Original editorial content ✓ (the 6 launch posts)
- Outbound retailer links are present ✓ (60+ links)
- Content is unique and adds value beyond product listings ✓ (style guides, comparisons, founder story)
- FTC disclosure is visible ✓
- Privacy Policy is in place ✓
- Audience is in supported geos (US, UK, EU, APAC) ✓ (Furnish is US-first)
- Site has measurable traffic ✓ (Plausible verifies)
- Site does not violate Skimlinks's program policies (no copyright infringement, no adult content, no illegal products)

### 6.4 If approved

1. Skimlinks emails the approval with the SITE_ID
2. Add `NEXT_PUBLIC_SKIMLINKS_SITE_ID` to Vercel environment variables
3. Redeploy (Vercel auto-redeploys on env var change)
4. Verify the SDK loads on blog post pages (DevTools Network tab)
5. Click a test affiliate link, confirm redirect through `go.skimresources.com`
6. Wait 24 hours, check Skimlinks dashboard for first click attribution

### 6.5 If rejected (contingency only, not the primary path)

Per Hassan's "burn the boats" directive, this section is documented for engineering completeness but is not the primary plan.

If Skimlinks rejects the re-application:

1. Read the rejection email carefully. Skimlinks usually states the reason.
2. If the reason is fixable (low traffic, missing disclosure, etc.), fix it and re-apply in 30 days.
3. If the reason is "site does not fit Skimlinks's publisher profile," pivot to Impact (impact.com).

The Impact pivot:
- Apply to Impact at impact.com
- Same site, same content, same disclosure language
- Impact has stronger app-friendliness and is more flexible on publisher profile
- Wire Impact's SDK in place of Skimlinks's (same pattern, different env var)
- Most outbound retailer relationships work with Impact too

This contingency requires no content changes. The blog posts stay the same. Only the SDK env var changes.

---

## 7. Revenue tracking

### 7.1 Skimlinks dashboard

Skimlinks provides a dashboard at skimlinks.com showing:

- Clicks (total, by URL, by date)
- Conversions (sales attributed to Furnish)
- Earnings (gross, net of Skimlinks fee)
- Top retailers (which merchants drive most revenue)
- Top URLs (which blog posts drive most revenue)
- Top products (specific items that convert best)

Check weekly during launch month, monthly thereafter.

### 7.2 Plausible cross-reference

Plausible already tracks outbound link clicks via the `outbound-links` script (per Document 9 §9.4). Cross-reference with Skimlinks weekly:

| Metric | Source |
|---|---|
| Blog post traffic | Plausible (page views) |
| Outbound link clicks | Plausible (auto-tracked) + custom event for product cards |
| Click-through rate | Plausible (clicks / views) |
| Conversion rate | Skimlinks (sales / clicks) |
| Revenue per click | Skimlinks (revenue / clicks) |

Knowing where clicks come from in Plausible plus where revenue lands in Skimlinks gives a complete funnel:

```
Page view (Plausible)
  -> Outbound click (Plausible)
    -> Sale at retailer (Skimlinks)
      -> Commission paid (Skimlinks)
```

### 7.3 Reporting cadence

**Weekly during launch month:**
- Review top-performing posts
- Identify which posts drive clicks but no conversions (may need product card improvements)
- Check for broken links

**Monthly post-launch:**
- Total revenue
- Top-performing retailers
- Month-over-month trends
- Decisions on next month's blog topics based on what converts

### 7.4 Payment

Skimlinks pays Furnish via:
- PayPal (preferred for fastest payment)
- Bank transfer (US only, ACH)
- Wire transfer (international, fees apply)

Payment threshold: typically $10 to $25 minimum balance before payout.

Frequency: monthly (paid 30 to 60 days after the close of each month).

### 7.5 Tax reporting

Skimlinks issues a 1099 form annually if Furnish earns over $600 in a calendar year (US tax requirement).

Hassan handles tax filing. The 1099 from Skimlinks is income to Furnish, taxable as business revenue.

---

## 8. Link maintenance and broken-link handling

### 8.1 Why links break

Outbound retailer URLs change over time:
- Products go out of stock and the retailer 404s the URL
- Retailers redesign their site and change URL structures
- Products get discontinued
- Retailers change their domain

A 6-month-old blog post may have multiple broken links if not maintained.

### 8.2 Broken-link audit

Run a broken-link check quarterly:

1. Use a tool like `broken-link-checker` (npm) or an online service (Ahrefs, SEMrush)
2. Crawl the blog
3. Get a report of all 404 / 410 / 500 outbound URLs
4. For each broken link:
   - Find an equivalent product at the same retailer (if available)
   - Find an equivalent product at a different in-network retailer (if not)
   - Update the blog post markdown file
   - Re-deploy

Calendar reminder: every January, April, July, October. Quarterly maintenance.

### 8.3 Stale price detection

Product prices in blog post product cards drift over time. They may become inaccurate.

Hassan's options:

**Option A: Manual review.** Visit each linked retailer page during quarterly audit. Update prices in the blog post.

**Option B: Disclosure language.** State prominently that prices are point-in-time and may have changed. Document 7 §4.7 already includes this language. This is the v1 approach.

**Option C: Automated price scraping.** A scheduled script that scrapes retailer pages monthly and updates prices. Heavy engineering. Skip at v1.

**Locked: Option B at launch.** Add automation post-launch if it becomes a real problem.

### 8.4 Out-of-stock products

If a product goes out of stock:
- The retailer's page typically still loads (showing the product as unavailable)
- The Skimlinks link still passes through, just no commission earned
- The user sees "out of stock" on the retailer page

This is acceptable if rare. If a featured product is permanently out of stock, replace it during quarterly audit.

---

## 9. Compliance and risk

### 9.1 Skimlinks's program policies

Skimlinks publishes program policies at skimlinks.com/program-policies. Read them in full once. Key takeaways:

- No "click farms" or incentivized click schemes
- No misleading content that tricks users into clicking links
- No excessive click bots or fraud
- No promotion of competitors' content or banned categories
- FTC disclosure is required and enforced

Furnish complies with all of these by the design of the marketing site.

### 9.2 Retailer-specific restrictions

Some retailers exclude certain product categories from affiliate commissions:
- Wayfair excludes some flash-sale and clearance items
- West Elm excludes gift cards and shipping fees
- Some retailers exclude furniture sets if individual pieces are not available

These exclusions reduce Furnish's revenue but do not affect link functionality. The links still work; just no commission on excluded items.

### 9.3 Data privacy

Skimlinks's SDK sets a tracking cookie when an outbound link is clicked. This cookie tracks the user from Furnish to the retailer for attribution purposes.

Per Document 8 §4 (Privacy Policy requirements), this tracking must be disclosed to users:
- The Privacy Policy mentions Skimlinks as a service used
- The Cookie Policy (if separate) lists the Skimlinks cookie
- Users have the right to opt out via standard browser cookie controls

Plausible (per Document 9 §9.5) does NOT set cookies. Skimlinks DOES. Disclose this in the Privacy Policy.

### 9.4 GDPR considerations

If a user in the EU visits Furnish, GDPR applies. Skimlinks claims its tracking is GDPR-compliant under their own framework. Furnish's responsibility:

- Privacy Policy mentions Skimlinks tracking
- For users in EU: a cookie consent banner is recommended pre-Skimlinks-load (Skimlinks does set cookies)

For v1 launch (US-first), Furnish does not need a cookie banner because Plausible is cookie-free and Skimlinks SDK does not run until Skimlinks is approved. Once Skimlinks is live, evaluate adding a consent banner if EU traffic is meaningful.

The simpler v1 path: let Skimlinks run for all users. Most US visitors will not see a banner. EU visitors will see Skimlinks tracking happen (a few will object). This is a known tradeoff.

A compliant alternative: load Skimlinks only after explicit consent. This reduces EU revenue but eliminates GDPR risk. Defer this decision until Skimlinks-approved status; revisit if EU traffic becomes meaningful.

---

## 10. Skimlinks integration build sequence (for Claude Code)

This is the order of operations when wiring Skimlinks into the codebase.

### 10.1 Phase 1: Pre-approval (build site so it can be re-evaluated)

1. ☐ Build all blog post infrastructure per Document 7 (markdown rendering, ProductCard component, FTC disclosure block)
2. ☐ Author 6 launch blog posts with plain retailer URLs (no Skimlinks wrapping yet)
3. ☐ Verify all outbound links use `target="_blank" rel="noopener sponsored"` per §3.2
4. ☐ Verify FTC disclosure renders at top of every post
5. ☐ Verify About page has the "How we make money" section
6. ☐ Deploy to production
7. ☐ Run for 14+ days to accumulate traffic
8. ☐ Submit Skimlinks re-application

### 10.2 Phase 2: Post-approval (wire SDK)

9. ☐ Receive Skimlinks SITE_ID via email
10. ☐ Add `NEXT_PUBLIC_SKIMLINKS_SITE_ID` env var in Vercel production
11. ☐ Verify the conditional Script tag in `src/app/blog/layout.tsx` per §2.4
12. ☐ Vercel auto-redeploys on env var change (or trigger manual redeploy)
13. ☐ Verify SDK loads in DevTools (Network tab on a blog post)
14. ☐ Click a test affiliate link, verify redirect through `go.skimresources.com`
15. ☐ Wait 24 hours
16. ☐ Verify first click appears in Skimlinks dashboard
17. ☐ Confirm Plausible is also tracking outbound clicks (cross-reference)

### 10.3 Phase 3: Ongoing operations (recurring)

18. ☐ Weekly Skimlinks dashboard check during launch month
19. ☐ Monthly Skimlinks dashboard check thereafter
20. ☐ Quarterly broken-link audit (Jan, Apr, Jul, Oct)
21. ☐ Annual merchant verification audit (every January)
22. ☐ Year-end tax form (1099 from Skimlinks)

---

## 11. Component breakdown for Claude Code

```
src/app/blog/
├── layout.tsx                  // Loads Skimlinks SDK conditionally on blog routes only
└── ...

src/components/blog/
├── BlogDisclosure.tsx          // FTC affiliate disclosure block (Document 7 reference)
├── ProductCard.tsx             // Renders outbound link with target/rel attributes
└── ...

src/lib/
├── analytics.ts                // Tracks `product_card_click` events
├── mdx.ts                      // Auto-applies target/rel to external links
└── ...
```

No new components needed beyond what Document 7 already specifies. Skimlinks integration is a single `<Script>` tag plus the existing link infrastructure.

---

## 12. Open questions for next document

These surfaced but are answered elsewhere:

- **Document 11 (Launch roadmap):** Pre-launch timeline including the 14-day waiting period, Skimlinks application date, content drafting schedule.

---

## Appendix A: Skimlinks application talking points (for the application form)

For Hassan's reference when filling out the Skimlinks re-application:

**Site description:**
> Furnish is an editorial publication and product directory covering interior design and shoppable room inspiration. Our blog publishes original style guides, product roundups, and comparison content. Each post features 8 to 12 outbound retailer recommendations with editorial context and full FTC-compliant affiliate disclosure.

**Content categories:**
> Interior design, home décor, furniture, lifestyle.

**Audience demographics:**
> Primary: US-based homeowners, renters, and design enthusiasts ages 25 to 55. Secondary: real estate professionals.

**Traffic sources:**
> Organic search (long-tail design queries), direct visits, social media (Pinterest and Instagram).

**Monetization plan:**
> Affiliate revenue from retailer partnerships via Skimlinks. No display advertising. No paid sponsorships at launch.

**Content cadence:**
> Initial 6 launch posts, plus monthly new posts ongoing.

**Why Furnish is a good fit:**
> We exist at the intersection of interior design content and shoppable products. Our editorial mission is to help people design and shop their homes, which aligns perfectly with Skimlinks's furniture and lifestyle retailer network. Our app (separate product, launching on iOS) drives readers to our blog, creating a virtuous cycle of editorial content and commerce.

---

## Appendix B: Approval status tracker

Hassan tracks Skimlinks approval status here as it progresses:

| Stage | Status | Date | Notes |
|---|---|---|---|
| Initial application | Submitted | TBD (date of original application) | Initial application before site was built |
| Initial application | Rejected | TBD (date of rejection) | Reason: pre-launch site lacked content |
| Site build complete | Pending | Target date TBD | All 6 blog posts live, FTC disclosure in place |
| Site live with traffic | Pending | Target date TBD | 14+ days post-launch with measurable traffic |
| Re-application submitted | Pending | Target date TBD | Per §6.2 |
| Approval / rejection | Pending | Target date TBD | Skimlinks responds within 5 to 14 business days |
| SDK wired | Pending | Target date TBD | After approval, env var set and deployed |
| First click attribution | Pending | Target date TBD | Verified in Skimlinks dashboard |
| First commission | Pending | Target date TBD | First sale through a Furnish link |

---

**End of Document 10 of 11.**

Next document: Launch and Iteration Roadmap.
