# Furnish marketing site (furnish.live)

This directory hosts the Next.js 14 marketing site for Furnish.
The site is an extension of the existing iOS app at `../`. The
app is the source of truth for brand, voice, color, and type.
The site inherits and extends, but does NOT introduce new brand.

## Status

Phase 1A through 1F complete (Document 2: Visual Design System).
Phase 3A through 3E complete (Document 3: Animation System).
See the 11 brand documents for full project context.

## Setup

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000`.

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

## Next phase

Document 4 (Site Architecture) defines the routing structure and
which pages get built. Documents 5+ build individual pages, each
consuming motion primitives from `@/lib/motion`.
