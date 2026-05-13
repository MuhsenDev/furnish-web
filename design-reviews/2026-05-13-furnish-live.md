# Design Review: furnish.live

**Date:** 2026-05-13
**Reviewer:** senior product designer + conversion specialist (orchestrating Copy, Hierarchy, Reference Scout subagents in parallel)
**Stage:** pre-launch waitlist site, first app the client has shipped
**Symptom in scope:** walls of unbroken body copy killing dwell time + scroll depth

---

## Executive Summary

- **The site doesn't have a sentence-length problem. It has a density problem.** Flesch reading ease across all flagged blocks sits between 72.2 and 79.3 (clear-to-fairly-easy range per Nielsen Norman Group's [readability scale](https://www.nngroup.com/articles/legibility-readability-comprehension/)). Sentence cadence is fine. **What's broken is the lack of entry points inside long sections**, no pull quotes, no inline imagery, no bolded keyphrases, no callouts. Five-paragraph prose stacks read as gray slabs because the eye has no place to land.
- **The single worst block is the About-page founder bio at 216 words across 5 identically-weighted paragraphs, occupying 1047px of vertical space (more than one viewport at 1440×900).** That same content is duplicated almost verbatim on the home page (158 words, 1083px). A reader who scrolls home → clicks About sees the wall twice.
- **"How We Make Money" on About (171 words, 5 prose paragraphs) is policy content that should be a 3-row table or a 3-column diagram, not a five-paragraph essay.** The information design is wrong for the content type, not just the typography.

The Top 3 below ship in **~75 minutes combined** by a solo dev who's already familiar with the codebase (Hassan). All three are i18n + component edits, no new design system pieces required.

---

## Top 3 Retention Killers

### 1. About → Founder bio is a 216-word wall on a 1047px-tall section

**Section:** `#founder-heading` on `/about` (renders `FounderSection` from `web/src/components/static/AboutSections.tsx`)
**Severity:** High
**Live DOM measurements at 1440×900:**

| metric | value |
|---|---|
| Heading: "Built by Hassan Muhsen." | Fraunces 56px / weight 400 / espresso rgb(62, 39, 35) ✓ |
| Eyebrow: "The person behind Furnish" | rendered ✓ |
| Body paragraphs | 5 identical paragraphs at 18px / line-height 29.25px / ink rgb(43, 30, 24) |
| Paragraph word counts | 61, 59, 51, 45, plus a 1-word signoff and a 5-word contact byline |
| Section total height | **1047.13 px** (≥ 1 full viewport at 900px) |
| Section background | transparent (sits on page cream) |

**Principle violated:** Refactoring UI, ["Establish a Hierarchy"](https://www.refactoringui.com/), five elements at identical weight/size/color collapse into one undifferentiated chunk regardless of how good each individual sentence is. Compounded by Gestalt Proximity (Nielsen Norman Group, [Proximity Principle](https://www.nngroup.com/articles/proximity/)), uniform vertical rhythm between paragraphs tells the eye "this is all one thing."

**Visual evidence (text-based; preview screenshot tool timed out, see "Tools blocked" below):**

```
┌─────────────────────────────────────────────────────────────┐
│  THE PERSON BEHIND FURNISH                                  │ ← eyebrow
│                                                             │
│  Built by Hassan Muhsen.                                    │ ← H2
│                                                             │
│  I'm 18, based in Garden City, Michigan. I started build... │ ← P1 (61w)
│                                                             │
│  Furnish is my second app. The first was a smaller thin...  │ ← P2 (59w)
│                                                             │
│  Furnish came from watching people I know struggle to ma... │ ← P3 (51w)
│                                                             │
│  Furnish is for the new homeowner staring at empty walls... │ ← P4 (45w)
│                                                             │
│  Hassan                                                     │ ← signoff
│  Reach Hassan directly at hello@furnish.live.               │ ← contact
└─────────────────────────────────────────────────────────────┘
   1047 px tall. All 5 paragraphs render identical 18px/29.25 ink. No internal breaks.
```

**Quick fix (≤30 min):** Insert one pull-quote between paragraphs 2 and 3 using a verbatim line that's already in the copy. Same i18n string, just rendered as a serif blockquote.

Concrete: add `founderPullQuote` to `web/src/content/i18n/en/about.json` set to `"Quotes from interior designers that cost more than a car payment."`, then render after `founderParagraph2`:

```tsx
<blockquote
  data-reveal
  className="my-8 border-l-2 border-[var(--color-accent)] pl-6 font-display text-display-m italic text-deep"
>
  {t('about', 'founderPullQuote')}
</blockquote>
```

**Stretch fix (1 hr):** Restructure the founder section into 3 alternating-tone cards (origin / motivation / who it's for) on a 2-column grid, with a single 4-line founder portrait in the gutter, plus a 32px serif pull quote between blocks 2 and 3. Tailwind sketch:

```tsx
<section className="py-section-y">
  <Container width="default">
    <div className="grid gap-12 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16">
      {/* Portrait gutter on desktop */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-sm bg-[var(--color-beige)] border border-[rgba(43,30,24,0.18)] shadow-2 p-4">
          <Image
            src="/images/about/founder-silhouette.jpg"
            alt={t('about', 'founderPhotoAlt')}
            width={280}
            height={340}
            className="object-contain"
          />
        </div>
        <p className="eyebrow mt-6">The person behind Furnish</p>
        <h2 className="mt-3 font-display text-display-m text-deep">
          Built by Hassan Muhsen.
        </h2>
      </div>

      {/* 3 cards in the main column */}
      <div className="flex flex-col gap-10">
        <article className="rounded-sm bg-[var(--color-editorial-accent-bg)] p-8">
          <p className="eyebrow text-[10px]">Origin</p>
          <p className="mt-3 text-body-l leading-relaxed text-ink/90">
            {t('about', 'founderParagraph1')}
          </p>
        </article>

        <article className="rounded-sm bg-[var(--color-cream)] p-8 border border-[var(--color-line)]">
          <p className="eyebrow text-[10px]">Motivation</p>
          <p className="mt-3 text-body-l leading-relaxed text-ink/90">
            {t('about', 'founderParagraph2')}
          </p>
        </article>

        <blockquote className="my-2 border-l-2 border-[var(--color-accent)] pl-6 font-display text-display-m italic text-deep">
          Quotes from interior designers that cost more than a car payment.
        </blockquote>

        <article className="rounded-sm bg-[var(--color-editorial-accent-bg)] p-8">
          <p className="eyebrow text-[10px]">Who it's for</p>
          <p className="mt-3 text-body-l leading-relaxed text-ink/90">
            {t('about', 'founderParagraph4')}
          </p>
        </article>

        <p className="mt-2 text-body-l italic text-ink/80">Hassan</p>
        <p className="text-body-m text-ink/75">
          Reach Hassan directly at{' '}
          <a
            href="mailto:hello@furnish.live"
            className="font-semibold text-[var(--color-accent)] underline-offset-4 hover:underline"
          >
            hello@furnish.live
          </a>
          .
        </p>
      </div>
    </div>
  </Container>
</section>
```

Note: this cuts `founderParagraph3` (the redundant "empty rooms, Pinterest paralysis, quotes from interior designers" line) and promotes the strongest line from it into the pull quote.

**Reference:** [PIN-UP Magazine, FLOS Lighting feature](https://www.pinupmagazine.org/articles/flos-lighting-21st-century-pin-up-magazine-40) shows the exact pattern: bold name lead-in → 2-paragraph block → image or italic credit → next block. Tonally a closer match to Furnish than anything Stripe or Linear does.

---

### 2. About → "Free for you. Paid by retailers." is a 171-word policy essay where a table belongs

**Section:** `#how-we-make-money-heading` on `/about` (renders `HowWeMakeMoneySection`)
**Severity:** High
**Live DOM measurements at 1440×900:**

| metric | value |
|---|---|
| Heading | "Free for you. Paid by retailers." (Fraunces 56px) ✓ |
| Eyebrow | "How we make money" ✓ |
| Body paragraphs | 5 prose paragraphs: 25w / 38w / 48w / 34w / 26w (171 total) |
| Section background | rgb(240, 226, 204) = `--color-beige` ✓ (visual reset present) |
| Section total height | **891.38 px** |

**Principle violated:** Information-design mismatch. The content is structured as five Q&A-style facts ("what does it cost", "who pays us", "do commissions influence picks", "do you disclose", "summary"), these are list-shaped data being delivered as prose. Per Refactoring UI's chapter on creating depth (and reinforced by Stripe's documentation style guide: short answers over long paragraphs), policy content benefits from comparison tables, definition lists, or 3-step diagrams.

**Quick fix (≤30 min):** Convert paragraphs 1-3 into a 3-column "What you pay / What retailers pay / What changes" comparison block. Keep paragraphs 4 and 5 as the disclosure context below.

```tsx
<div className="my-10 grid gap-6 sm:grid-cols-3">
  <div className="rounded-sm border border-[rgba(43,30,24,0.12)] bg-[var(--color-cream)] p-6">
    <p className="eyebrow">What you pay</p>
    <p className="mt-2 font-display text-display-l text-deep">$0</p>
    <p className="mt-2 text-body-m text-ink/85">App free, website free, no subscription tiers.</p>
  </div>
  <div className="rounded-sm border border-[rgba(43,30,24,0.12)] bg-[var(--color-cream)] p-6">
    <p className="eyebrow">What retailers pay</p>
    <p className="mt-2 font-display text-display-l text-deep">A small commission</p>
    <p className="mt-2 text-body-m text-ink/85">Out of their marketing budget when you buy.</p>
  </div>
  <div className="rounded-sm border border-[rgba(43,30,24,0.12)] bg-[var(--color-cream)] p-6">
    <p className="eyebrow">What changes about our picks</p>
    <p className="mt-2 font-display text-display-l text-deep">Nothing</p>
    <p className="mt-2 text-body-m text-ink/85">Commission rates don't influence which piece fits your room.</p>
  </div>
</div>
```

**Stretch fix (45 min):** Replace the entire 5-paragraph section with a 3-step diagram + a separated FTC-disclosure note below. The diagram reads in one viewport, the disclosure is its own thing.

```tsx
<Container width="narrow">
  <p data-reveal className="eyebrow">How we make money</p>
  <h2 className="mt-3 font-display text-display-m text-deep tracking-display-tight leading-display">
    Free for you. Paid by retailers.
  </h2>

  {/* Three-step flow */}
  <ol className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
    <li className="text-center">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-accent)] font-display text-display-s text-[var(--color-accent)]">1</span>
      <p className="mt-4 font-display text-display-s text-deep">You design your room</p>
      <p className="mt-2 text-body-m text-ink/85">Furnish picks pieces based on style and fit. No paid placements.</p>
    </li>
    <li className="text-center">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-accent)] font-display text-display-s text-[var(--color-accent)]">2</span>
      <p className="mt-4 font-display text-display-s text-deep">You buy from the retailer</p>
      <p className="mt-2 text-body-m text-ink/85">Same product, same price, same retailer site you'd buy from anyway.</p>
    </li>
    <li className="text-center">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-accent)] font-display text-display-s text-[var(--color-accent)]">3</span>
      <p className="mt-4 font-display text-display-s text-deep">The retailer pays us</p>
      <p className="mt-2 text-body-m text-ink/85">A small commission from their marketing budget. Your price doesn't change.</p>
    </li>
  </ol>

  {/* FTC disclosure callout */}
  <aside className="mt-12 rounded-sm border-l-2 border-[var(--color-accent)] bg-[var(--color-cream)] p-6">
    <p className="eyebrow">A note on disclosure</p>
    <p className="mt-2 text-body-m text-ink/85 leading-relaxed">
      When a blog post contains affiliate links, we say so at the top of the post. Every time. The FTC requires this, and we agree.
    </p>
  </aside>
</Container>
```

**Reference:** [Linear changelog](https://linear.app/changelog), three-step product flows with numbered indicators, generous whitespace, and one short sentence per step. Mercury's [transparency page](https://mercury.com) uses the same pattern with iconography swapped for numerals.

---

### 3. Home → "Why I built Furnish" is a 158-word duplicate of the About founder bio, below the fold on the main marketing page

**Section:** `FounderNote` component in `web/src/app/page.tsx`
**Severity:** High
**Live DOM measurements at 1440×900:**

| metric | value |
|---|---|
| Eyebrow | "Why I built Furnish" ✓ |
| Heading | "Built by Hassan Muhsen." ✓ |
| Body paragraphs | 4 paragraphs / 158 words total |
| Section total height | **1083.63 px** |

**Principle violated:** Content déjà vu (Nielsen Norman Group's articles on [information scent](https://www.nngroup.com/articles/information-scent/), paraphrased, exact NN/g term unverified). A reader who scrolls past this on the home page, then clicks "About" in the nav, hits the SAME founder bio at 1.4× the length. The repeated wall doubles the bounce risk on the second exposure.

**Quick fix (≤15 min):** Cut to 60 words + "Read the full story →" link to `/about#founder-heading`. The home page doesn't need the whole essay, it needs the hook + a path deeper.

i18n change in `web/src/content/i18n/en/home.json` (assuming founder copy lives there or is component-local, verify when implementing):

```json
"founderBody": "I'm 18, building Furnish solo from Michigan. I kept watching people I know hit the same wall: a beautiful new house, an empty room, no idea where to start, no budget for a designer. So I built the app that fills that gap.",
"founderReadMore": "Read the full story"
```

Component:

```tsx
<p data-reveal className="text-body-l text-ink/90 leading-relaxed">
  {t('home', 'founderBody')}
</p>
<Link
  href="/about#founder-heading"
  data-reveal
  className="mt-6 inline-flex items-center gap-1 text-body-m font-semibold text-[var(--color-accent)] underline-offset-4 hover:underline"
>
  {t('home', 'founderReadMore')} <span aria-hidden="true">→</span>
</Link>
```

**Stretch fix (45 min):** Convert to a 2-column "founder callout" with a serif pull-quote, 60-word excerpt, and the founder photo + signature. Tailwind sketch:

```tsx
<Container width="narrow">
  <div className="grid gap-10 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-12 items-start">
    <div className="rounded-sm bg-[var(--color-beige)] border border-[rgba(43,30,24,0.18)] shadow-2 p-3 sm:p-4">
      <Image src="/images/about/founder-silhouette.jpg" alt="Hassan Muhsen" width={160} height={200} />
    </div>
    <div>
      <p className="eyebrow">Why I built Furnish</p>
      <blockquote className="mt-4 font-display text-display-m italic text-deep leading-tight">
        "I kept watching people I know hit the same wall: a beautiful house, an empty room, no budget for a designer."
      </blockquote>
      <p className="mt-6 text-body-m text-ink/85 leading-relaxed">
        I'm 18, building Furnish solo from Michigan. So I built the app that fills the gap.
      </p>
      <p className="mt-3 font-display italic text-body-l text-deep">Hassan</p>
      <Link href="/about#founder-heading" className="mt-6 inline-flex items-center gap-1 text-body-m font-semibold text-[var(--color-accent)] underline-offset-4 hover:underline">
        Read the full story <span aria-hidden="true">→</span>
      </Link>
    </div>
  </div>
</Container>
```

**Reference:** [Cup of Jo](https://cupofjo.com/2026/05/12/a-summer-capsule-wardrobe/), short personal paragraph + clear continuation link is their default lead-in pattern. Closest tonal match in the editorial blog world.

---

## Full Findings Table

| Section | Issue | Severity | Quick Fix | Stretch Fix | Reference |
|---|---|---|---|---|---|
| About → Founder bio | 5 prose paragraphs / 216 w / 1047 px wall, no internal entry points | **High** | Insert one serif pull-quote between P2 and P3 | 3-card restructure + portrait gutter + pull quote (sketched above) | [PIN-UP Magazine](https://www.pinupmagazine.org/articles/flos-lighting-21st-century-pin-up-magazine-40) |
| About → "How We Make Money" | 5-paragraph policy essay where structured data belongs | **High** | 3-column comparison block (sketched above) | 3-step numbered diagram + separated FTC disclosure aside | [Linear changelog](https://linear.app/changelog) |
| Home → Founder note | 158 w / 1083 px wall + duplicate of About founder bio | **High** | Cut to 60-word excerpt + "Read full story" link | Portrait + pull-quote callout (sketched above) | [Cup of Jo](https://cupofjo.com/) |
| About → Values | 4 sub-blocks (107 w total) read at flat hierarchy | Medium | Add a 2px bronze accent bar to the left of each value title | Convert to a 2×2 grid with alternating cream/beige tile backgrounds | [Refactoring UI: Establish Hierarchy](https://www.refactoringui.com/) |
| About → Mission | 11-word H2 reads more like body copy than heading | Medium | Trim to "Make every home feel imagined." (5 words) | Pair with a 2-line lede in serif italic underneath | (unverified, Apple HIG writing section) |
| About → Contact | Heading "Questions, partnerships, press, anything." is a noun list, not a statement | Medium | Rewrite as "We answer email." (matches the body content) | Add a 3-row "What we respond to" mini-list (partnerships / press / questions) | [Mercury contact](https://mercury.com) (unverified) |
| Blog (scandi) → "What the style is, in 2026" opener | 112 w / 16-word avg sentence, the densest blog opener | Medium | Split opening paragraph after sentence 3; insert a sub-H3 before continuation | Lead with a 1-sentence callout box ("Warm Scandi has split into two camps") then prose | [NN/g How Users Read](https://www.nngroup.com/articles/how-users-read-on-the-web/) |
| Home → Hero | H1 split across 3 lines on desktop ("Take a photo. / Furnish does / the rest.") may dilute impact (unverified, need screenshot) | Polish | Verify line breaks render as designed at 1440 px | Single-line treatment at xl breakpoints; or a stronger underline accent on "Furnish" | (unverified) |
| About → Roadmap | 54-word closing paragraph after the bulleted list re-introduces a body block | Polish | Set the closing line in italic muted body-s as a footer note | Replace prose with a quiet 2-line italic colophon | (unverified) |
| All blog posts | No pull-quotes / no inline imagery / no bolded keyphrases inside long sections | **High** (cross-cutting) | Define an MDX `<PullQuote>` component, encourage one per ~400 words editorially | Define `<InlineImage>` + `<PullQuote>` MDX primitives, mandate one of each per 600-word section | [PIN-UP](https://www.pinupmagazine.org) + [Cup of Jo](https://cupofjo.com) |
| Cookie banner (just shipped) | None, branded correctly per commit `5eb9398` | n/a | n/a | n/a | (self-reference: prior turn) |

---

## Recommended Implementation Order

If Hassan has 2 hours, ship these in this order:

1. **About founder bio quick fix (≤30 min)**, add the one pull-quote between P2 and P3. Biggest visual improvement per minute on the worst block. Test on mobile first since the wall is even taller at 375px.
2. **About "How We Make Money" quick fix (≤30 min)**, 3-column comparison block. Replaces the densest policy text on the site with scannable data structure.
3. **Home founder note quick fix (≤15 min)**, trim to 60-word excerpt + "Read full story" link. Eliminates the duplicate-content wall and creates a path to the About page.

**Total: ~75 minutes.** Three biggest text walls neutralized.

If Hassan has a Saturday (4-6 hours):

4. Implement the stretch fix on the About founder section (the 3-card restructure with portrait gutter + pull quote), this is the single most visible page on the site for "is this a serious project."
5. Implement the 3-step diagram on "How We Make Money." Skip the FTC-disclosure-aside split until v2.
6. Define a `<PullQuote>` and `<InlineImage>` MDX primitive set, then audit the 4 product-fill blog posts (scandinavian, small-bedroom, velvet-vs-linen, interior-trends, coffee-tables) and add one pull-quote per major H2 section.

After all that:
- The site goes from "well-written but visually dense" to "scannable like Cup of Jo / PIN-UP."
- Skimlinks reviewers (now in the queue) read the same content faster and dwell longer.
- Compounds with the existing strong copy.

---

## Open Questions

These I couldn't verify without you:

1. **Founder photo silhouette vs. a real headshot.** Code has `PHOTO_AVAILABLE = true` and points at `/images/about/founder-silhouette.jpg`. If you have a real headshot now, the 2-column portrait gutter in the stretch fix becomes meaningfully more effective. The silhouette is a placeholder per the component comments, confirm if a real photo's ready.
2. **i18n location of the home founder copy.** I assumed it lives in `home.json` but didn't verify; could be component-local strings. Five-minute check before implementing the home founder quick fix.
3. **Blog MDX `<PullQuote>` component existence.** The component-level pattern would be a 30-min build of a single MDX-registered component. Confirm there isn't already something in `web/src/components/blog/mdx-components.tsx` I missed.
4. **Mobile screenshot evidence.** I couldn't reliably grab screenshots from the preview iframe (timeouts; see "Tools blocked" below). All findings are based on rendered HTML + computed style from live DOM probes at 1440×900. The findings are unaffected, text density doesn't change between desktop and mobile, but if you want visual proof to hand to anyone else, ask me to re-run with a different tool path.
5. **The "we will tell you when something ships" roadmap closer.** Worth keeping but the prose-after-list pattern is weak; could become an italic colophon. Low-priority polish, listed for completeness.

---

## Tools blocked

For full transparency on what I had vs. didn't:

- **`mcp__Claude_in_Chrome__*`**, the saved skill `~/.claude/skills/design-review.md` specifies this MCP for screenshots. The extension was offline at audit time (returned "Claude in Chrome is not connected" on both retries). Falling back to Claude_Preview (local dev server) for browser inspection. Localhost code is identical to production after the most recent push (`5eb9398`), so style + content findings are unaffected.
- **`mcp__Claude_Preview__preview_screenshot`**, repeatedly timed out (30s) when capturing the About page founder section. Documented in prior session turns too; consistent with this preview iframe's handling of pages with active CSS animations. Substituted with live DOM probes that captured computed styles, paragraph word counts, section heights, and color values, the actual data the audit needs. ASCII diagrams in the Top 3 substitute for visual fidelity.
- **PIN-UP Magazine reference URL**, fetched and verified by the reference scout subagent. Direct screenshot of their layout not embedded in this report; readers should open the URL to see the pattern.

If you want me to re-run with real screenshots, the path is: (a) reconnect Claude_in_Chrome and re-run, or (b) install Playwright MCP (`claude mcp add playwright npx @playwright/mcp@latest`) and re-invoke the skill with the original `mcp__playwright__*` glob.

---

## Follow-up prompts you can hand back

If you want me to **implement** any of the three quick fixes, paste:

> Execute Quick Fix #1 from `Here/design-reviews/2026-05-13-furnish-live.md`. Add the pull quote to the About founder section. Then build + verify in preview.

For the stretch fixes:

> Execute Stretch Fix #2 from the design review, the 3-step "How We Make Money" diagram. Replace the existing `HowWeMakeMoneySection` JSX. Run typecheck + browser smoke test after.

For the MDX primitives:

> Add `<PullQuote>` and `<InlineImage>` MDX components to `web/src/components/blog/mdx-components.tsx`. Then audit the 4 product-fill blog posts and insert one pull quote per H2 where it improves scannability. Pick the quote from existing copy, don't write new copy.
