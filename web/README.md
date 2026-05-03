# Furnish marketing site (furnish.live)

This directory hosts the Next.js 14 marketing site for Furnish.
The site is an extension of the existing iOS app at `../`. The
app is the source of truth for brand, voice, color, and type.
The site inherits and extends, but does NOT introduce new brand.

## Status

All 11 phases complete. Site is feature-complete, engineered,
deployed-ready, monetization-ready, and pre-launch-verified.
Awaiting Hassan's GO signal for hard launch (Document 11 §5).

The 11 locked specifications live in [`docs/specs/`](docs/specs/).
Start there for the full project context.

## Setup

Requires Node 20 LTS (pinned in `.nvmrc`) and pnpm (locked in
`packageManager`).

```bash
cd web
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Scripts

- `pnpm dev` Local development server
- `pnpm build` Production build
- `pnpm start` Run the production build
- `pnpm lint` Next ESLint
- `pnpm typecheck` TypeScript strict-mode check

## Stack

- Next.js 14 (App Router, React Server Components)
- TypeScript strict mode
- Tailwind CSS 3 reading from CSS custom properties
- GSAP 3 with ScrollTrigger and Flip plugins (lazy-loaded)
- Lucide React icons (1.5 stroke width)
- Inter (body) and Fraunces (display) via next/font

## Directory layout

```
web/
├── src/
│   ├── app/              Next.js App Router pages and layout
│   ├── components/       Foundational components (Button, Card, etc.)
│   ├── lib/
│   │   ├── motion/       GSAP loader and reduced-motion hook
│   │   └── utils.ts      cn() class composition helper
│   └── styles/
│       ├── tokens.css    Design tokens extracted from the app
│       └── globals.css   Tailwind base + accessibility primitives
├── next.config.mjs       Image optimization config
├── tailwind.config.ts    Tailwind binding to CSS variables
└── tsconfig.json         TypeScript strict mode
```

## Brand reference

Every copy decision passes through the Brand Decision Framework
in Document 1. Voice rules, forbidden phrases, locked tagline,
and persona targeting are all enforced.

Hard rules:

1. No em dashes anywhere (in code, comments, copy, commit messages).
2. No "leverage", "optimize", "revolutionary", "paradigm",
   "synergize", "robust", "scalable", "comprehensive", "holistic".
3. No pure black (#000000) or pure white (#FFFFFF). Always use the
   app's near-values.
4. No "AI gradient" rainbow. Hero gradient (warm radial) is the
   only decorative gradient.
5. No emoji icons. Lucide only.
6. Accessibility floors are non-negotiable: WCAG AA contrast,
   designed focus rings, prefers-reduced-motion respect.

## Phase 1 deliverables (Document 2)

- [x] Design tokens extracted from `../styles.css`
- [x] Tailwind config wired to CSS variables
- [x] `<Button>`, `<Card>`, `<SectionDivider>`, `<Container>`
- [x] `<FullBleedImage>`, `<EditorialImage>`, `<CompareImage>` (stub)
- [x] Motion library scaffold (`getGsap()`, `useReducedMotion()`)
- [x] Holding-page smoke test at `/`

## Phase 3 deliverables (Document 3, Animation System)

- [x] Five custom GSAP eases (`furnishOut`, `furnishInOut`,
      `furnishBack`, `furnishAnticipate`, `furnishQuick`)
- [x] Seven duration tokens with mobile multiplier (0.75x)
- [x] Updated `getGsap()` with ScrollTrigger, Flip, CustomEase
- [x] Hooks: `useScrollReveal`, `useStaggeredReveal`,
      `useHeroSequence`, `useCompareSlider`, `useReducedMotion`
- [x] Motion 1: loader sequence (`playLoaderSequence`)
- [x] Motion 2: hero reveal (`playHeroReveal`)
- [x] Motion 3: scroll-triggered reveals (`setupScrollReveal`)
- [x] Motion 4: compare slider (`createCompareSlider`)
- [x] Motion 5: menu takeover (`openMenu`, `closeMenu`)
- [x] Motion 6: hover states (CSS-only, in `hover.css`)
- [x] Motion 7: page transitions (Phase 2 stub)
- [x] Motion 8: lightbox (`openLightbox`, `closeLightbox`)
- [x] Motion 9: number counter (`animateNumber`)
- [x] Motion 10: form interactions (`createSubmitButton`)
- [x] Production `<CompareSlider>` React component
- [ ] Lighthouse 95+ accessibility (run after `npm install`)
- [ ] Lighthouse 90+ performance (run after `npm install`)
- [ ] 60fps verification (Chrome DevTools, run after `npm install`)

## Public motion API

Components import only from `@/lib/motion`. Never from internal
files. Example:

```tsx
import { useScrollReveal, useReducedMotion } from '@/lib/motion';
```

Internal files are documented in `src/lib/motion/index.ts`.

## Phase 4 deliverables (Document 4, Site Architecture)

- [x] All 8 page templates plus dynamic blog route plus 404
- [x] Nav with full-screen MenuTakeover, persistent CTA pill
- [x] Footer (Brand, Site, Legal columns)
- [x] Redirects in next.config.mjs (/about-us, /contact, /help,
      /work, /gallery/all, /android, plus /app and /ios when
      app launched)
- [x] Security headers (X-Frame-Options, X-Content-Type-Options,
      Referrer-Policy, Permissions-Policy)
- [x] Sitemap (/sitemap.xml) and robots (/robots.txt) auto-generated
- [x] Plausible analytics script in root layout
- [x] i18n architecture (English-only at v1, ready for future
      locales)
- [x] All visible nav, footer, common, 404 strings keyed in JSON
- [x] 404 page fully built with brand-correct copy
- [x] Image directories under public/images/{hero, gallery,
      before-after, blog, about, og, products}/

Note on i18n: App Router does NOT support the legacy i18n config
field. The architecture lives in src/lib/i18n.ts and
src/content/i18n/<locale>/. See the i18n module header for the
migration path when more locales launch.

## Required environment variables

See `.env.example`. At minimum:

- `NEXT_PUBLIC_APP_LAUNCHED` (default false). Toggles waitlist vs
  App Store CTA, plus enables /app and /ios redirects.
- `NEXT_PUBLIC_APP_STORE_URL`. Required when APP_LAUNCHED=true.
- `NEXT_PUBLIC_SITE_URL`. Canonical site origin. Default
  `https://furnish.live`.
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`. Defaults to `furnish.live`.
- `NEXT_PUBLIC_SKIMLINKS_SITE_ID`. Empty pre-approval; set after
  Skimlinks approves Furnish (see "Skimlinks switch" below).
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (server-only).
  Required for waitlist persistence. Without them, the API logs
  signups to Vercel function logs only.

## Skimlinks switch (post-approval)

Furnish ships pre-Skimlinks-approval with affiliate links as plain
retailer URLs. The Skimlinks SDK is gated on
`NEXT_PUBLIC_SKIMLINKS_SITE_ID` and only loads on `/blog/*` routes.

When Hassan receives the Skimlinks approval email with a `siteId`:

1. Vercel project → Settings → Environment Variables
2. Add `NEXT_PUBLIC_SKIMLINKS_SITE_ID` = `<siteId from approval email>`
3. Apply to Production
4. Redeploy (Vercel auto-redeploys on env var change, or trigger
   manually from the Deployments tab)
5. Visit any blog post in a private window
6. DevTools → Network: confirm a request to
   `s.skimresources.com/js/<siteId>.skimlinks.js` returns 200
7. Click any retailer link in the post
8. Verify the URL passes through `go.skimresources.com` before
   landing at the retailer
9. Wait 24-48 hours; click a real link and (optionally) make a
   small test purchase
10. Verify the click appears in the Skimlinks dashboard

To turn Skimlinks off: clear the env var and redeploy.

## Next phase

Document 5 builds the home page in full (hero with sequential
reveal, before/after compare slider, comparison block, founder
note, dual-state CTAs). Documents 6 through 8 build gallery,
blog, and static pages. Document 9 finalizes deployment.
Document 10 wires Skimlinks. Document 11 sequences the launch.
