# Furnish marketing site, locked specifications

The 11 documents in this directory are the source-of-truth
specification for furnish.live. Every brand, design, content,
engineering, monetization, and launch decision is locked across
these files.

Status: locked unless explicitly revised. Changes require Hassan's
written approval per the policy in 01_brand_foundation.md and
the locked-decisions tables in each document.

## The 11 documents

| # | Document | Phase shipped | Key locks |
|---|---|---|---|
| 1 | Brand Foundation | Reference (no code) | Tagline, voice rules, four personas, walk-away feeling, four brand adjectives |
| 2 | Visual Design System | Phase 1A through 1F | Tokens from app, Fraunces + Inter, fluid type scale, three image treatments, brand marker |
| 3 | Animation System | Phase 3A through 3E | GSAP plus ScrollTrigger plus Flip plus CustomEase, five custom eases, ten motion moments |
| 4 | Site Architecture | Phase 4A through 4I | 8 page templates plus 404, /blog at subpath, i18n architecture in code, Plausible analytics |
| 5 | Home Page Spec | Phase 5 | 8 sections, before/after slider, comparison table, founder note, dual-state CTAs |
| 6 | Sample Gallery Spec | Phase 6 | 3x3 grid with per-tile style cycler, 36-image launch, GSAP-driven lightbox, random shuffle |
| 7 | Blog Content Plan | Phase 7 | 6 launch posts, ~8,700 words target, 60 to 75 retailer links, FTC disclosure top of post |
| 8 | Static Pages Spec | Phase 8 | /about with founder note, expanded /how-it-works, /faq with 35 questions, /privacy plus /terms |
| 9 | Tech Stack and Deployment | Phase 9 | Next.js 14 plus pnpm plus Tailwind plus GSAP plus Plausible plus Vercel plus Supabase, security headers, CI |
| 10 | Skimlinks Integration | Phase 10 | SDK on /blog/* only, FTC disclosure top of post, re-apply 14 days post-launch, plain retailer URLs (no build-time wrapping) |
| 11 | Launch and Iteration Roadmap | Phase 11 | 21-day timeline, hard launch day 20, monthly content cadence, iOS resumes day 21+ |

## Document versions

For docs 1, 2, and 3, this directory holds the FINAL versions
that Hassan locked late in the build cycle. The earlier versions
were materially identical; the final versions added clarifying
language and updated section 10 cross-references but did not
change any locked decision. All shipped code aligns with the
final versions.

For docs 4 through 11, this directory holds the only version
shipped.

## Phase commit map

Each document's deliverables landed in one or more git commits
on the `feat-website-foundation` branch. The phase prefix in each
commit message ("Website Phase 1A through 1F", "Website Phase 7",
etc.) maps the commit to the document it implements.

## Where to look first

- Branding question? Document 1.
- Visual design question? Document 2.
- Motion question? Document 3.
- "Where does this page live?" Document 4.
- Home page detail? Document 5.
- Gallery filter behavior? Document 6.
- Blog post template or ProductCard? Document 7.
- /about, /how-it-works, /faq, /privacy, /terms? Document 8.
- Tech stack, deployment, env vars, CI, security headers? Document 9.
- Affiliate links, FTC disclosure, Skimlinks SDK? Document 10.
- Pre-launch checklist, launch-day choreography, post-launch ops? Document 11.
