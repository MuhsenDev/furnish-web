# Furnish, Project Context for Claude

This is the website + landing page for Furnish, an AI interior design iOS app. Read this before doing anything in this repo.

## Project at a glance

- **Site:** furnish.live (Vercel Pro, custom domain via Porkbun)
- **Repo:** github.com/MuhsenDev/furnish-web
- **Working branch:** feat-website-foundation (everything ships here for now)
- **Status:** Pre-launch waitlist site. Production deployed but not "officially" launched. Phase 2 content work in progress.

The companion iOS app is a separate codebase NOT in this repo. The website's job is waitlist signups + blog content for affiliate revenue (Skimlinks, post-launch).

## Tech stack

- **Framework:** Next.js 14 App Router, React 18, TypeScript (strict)
- **Styling:** Tailwind CSS with custom brand tokens; CSS variables for theme
- **Animation:** GSAP (scroll, reveals, lightbox, custom Vercel-curve easing) + Framer Motion (state-machine animations like the room showcase loop)
- **Content:** MDX for blog posts, JSON for i18n strings
- **Database:** Supabase (waitlist email storage only)
- **Hosting:** Vercel Pro
- **Analytics:** Vercel Web Analytics + Speed Insights (cookieless)
- **Affiliate:** Skimlinks (blog routes only, post-launch activation)
- **Package manager:** pnpm (NOT npm; commands are `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm typecheck`)
- **Node:** 20 LTS (engines pinned)
- **Author email for git commits:** furtherfetchedllc@gmail.com (Vercel rejects deploys from other emails)

## Folder map (top-level)

| Path | Holds |
|---|---|
| `web/` | The Next.js project. Vercel root is set to this. |
| `web/src/app/` | Routes (App Router): /, /about, /blog, /faq, /gallery, /how-it-works, /privacy, /terms, /api/waitlist |
| `web/src/components/` | Reusable React components (home, shared, static, gallery, blog) |
| `web/src/content/` | i18n JSON, blog MDX, FAQ data, generated legal docs |
| `web/src/data/` | Typed data sources (gallery.ts inventory, etc.) |
| `web/src/lib/` | Utilities (motion, i18n, utils, faq) |
| `web/public/images/` | All raster assets: hero, gallery, before-after, blog heroes, OG card, about |
| `web/public/Animations/` | Lottie files + 3 SVG isometric rooms |
| `web/docs/specs/` | All 11 original spec documents (read-only reference) |
| `card/` | Original brand asset source (CARD.png) |
| `icon.svg` | Brand mark used as favicon and header logo |
| `CLAUDE.md` | This file |

## Hard rules

These are locked decisions. Don't second-guess them in suggestions:

1. **Email-only commits from `furtherfetchedllc@gmail.com`**. Vercel blocks other emails.
2. **No emoji in user-facing UI**. Custom SVG icons only.
3. **No fake numbers**. Qualitative claims only until real traction exists.
4. **No calendar-period language** in user copy ("when you're ready," not "weekly/quarterly").
5. **Vercel curve easing site-wide.** `cubic-bezier(0.16, 1, 0.3, 1)` for ease-out, `cubic-bezier(0.7, 0, 0.84, 0)` for ease-in. Centralized in tokens.css and eases.ts.
6. **Brand colors:** cream (#FAF3E7), bronze (#8B6F47), espresso (#3D2723), peach (#FEBCAE). Three primaries: bronze and peach have equal weight, espresso anchors headings, cream is the body surface. **Bronze** stays on CTAs, focus rings, link underlines, the muted-eyebrow color, and any foreground text that needs to pass WCAG AA against cream. **Peach** owns dividers (SectionDivider), the reading progress bar, the cookie banner top stripe, the editorial-accent background, the founder-note section card, the post-signup celebration card, the hero radial gradient mid-stop, and text selection. **Accessibility constraint:** peach fails WCAG AA for body-text contrast on cream, so peach is restricted to backgrounds, borders, dividers, 1-2px lines, and large decorative surfaces. Foreground text on peach-tint bg must be ink or deep for contrast. Plus secondary tokens in tokens.css.
7. **Font stack:** Fraunces serif for display headings, system sans for body.
8. **Title Case** on buttons/headers; **sentence case** on body copy.
9. **OKT (One Key Takeaway):** *"Your household, your style, sharper."*
10. **Image generation:** Google's Nano Banana Pro (refer to it externally as "Google's image generation AI").
11. **Furniture detection:** GPT-5.4 (technical reference; user-facing copy says "AI").
12. **No em dashes anywhere.** The character is U+2014 (the long horizontal dash, wider than a hyphen). Banned everywhere: user-facing copy, MDX/blog posts, i18n strings, code comments, even this CLAUDE.md. Use commas, colons, periods, or hyphens instead. Hassan locked this rule 2026-05-08 after a full sweep of generated content. Before committing, run a literal-char search across `web/src` for the dash character (the grep needs the actual U+2014 byte) to confirm zero matches.

## Conventions

- **Strict TypeScript.** No `any` unless justified in a comment.
- **Named exports** for components.
- **i18n-first copy:** all user-facing strings live in `web/src/content/i18n/en/*.json`, never hardcoded in components.
- **Component co-location:** if a component has data, place it in `web/src/data/` typed and imported, don't inline.
- **Read before editing.** Don't infer file contents; actually read them.
- **Match existing patterns** before introducing new ones.
- **>50 lines of new code:** pause and confirm approach before writing.
- **CSS:** scan for existing rules with the same selector before adding new ones (project history has duplicate-rule bugs).
- **Always commit at the end of a coherent change batch** with a descriptive message. Multi-line OK. Conventional Commits prefix optional but clarity required.

## What lives where (specific files)

- **Brand color tokens:** `web/src/app/globals.css` and `web/tailwind.config.ts`
- **GSAP custom eases:** `web/src/lib/motion/eases.ts`
- **Brand voice / FAQ data:** `web/src/content/faq/questions.json`
- **Gallery inventory:** `web/src/data/gallery.ts`
- **Home page composition:** `web/src/app/page.tsx`
- **Pre-launch flag:** `NEXT_PUBLIC_APP_LAUNCHED` env var (false at launch)
- **Founder photo flag:** `PHOTO_AVAILABLE` const in `web/src/components/static/AboutSections.tsx`

## Critical reference docs

In `web/docs/specs/`. These are the original 11 spec documents that defined the build. Read for canonical decisions, ignore for implementation status (much has shipped beyond what specs describe).

## Decision policy

Hassan approves all changes by default. When ambiguity arises in an audit:
- Pick the best call and ship.
- Surface the decision in the commit message and report.
- Don't block on user input for non-critical forks.
- DO escalate hard contradictions with locked decisions or anything that changes brand voice / monetization model.

## What's NOT done yet (Phase 2 remaining)

In rough priority order:
1. 6 blog post bodies (currently 3-line skeletons) + 52 ProductCards with real Skimlinks-eligible URLs
2. Phase 3 verification: Lighthouse, Rich Results, securityheaders.com, OG previews, GSC submission
3. Phase 4 launch (target: a Tuesday-Thursday)
4. Phase 5 Skimlinks re-application + activation (14-day waiting period after launch)
5. Phase 6 ongoing ops (CSP enforcement transition from report-only, monthly content cadence)

## Working with Hassan

- He's 18, building solo, no team. Lean on him for product/brand calls; don't lean on him for infrastructure decisions you can make autonomously.
- He prefers blunt over hedged. Push back when his premise is wrong.
- Visual design quality matters more than feature count.
- Mobile-first. ~90% of traffic will be mobile.
- He uses Adobe Illustrator for SVG asset prep. Don't suggest Figma/Sketch workflows.

## Quick orientation commands

```bash
cd web && pnpm dev          # local dev server at localhost:3000
cd web && pnpm typecheck    # type errors only, no build
cd web && pnpm build        # full production build
git log --oneline -10       # last 10 commits
git status                  # what's uncommitted
git grep "PATTERN" web/src  # search source code
```

Read the user's most recent message. Then act.