# Furnish marketing site (furnish.live)

This directory hosts the Next.js 14 marketing site for Furnish.
The site is an extension of the existing iOS app at `../`. The
app is the source of truth for brand, voice, color, and type.
The site inherits and extends, but does NOT introduce new brand.

## Status

Phase 1A through 1F complete. See `../web-context/` and the 11
brand documents for full project context.

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

## Phase 1 deliverables

- [x] Design tokens extracted from `../styles.css`
- [x] Tailwind config wired to CSS variables
- [x] `<Button>`, `<Card>`, `<SectionDivider>`, `<Container>`
- [x] `<FullBleedImage>`, `<EditorialImage>`, `<CompareImage>` (stub)
- [x] Motion library scaffold (`getGsap()`, `useReducedMotion()`)
- [x] Holding-page smoke test at `/`
- [ ] Lighthouse 95+ accessibility (run after `npm install`)
- [ ] Lighthouse 90+ performance (run after `npm install`)

Lighthouse runs are pending the dependency install.

## Next phase

Document 3 (Animation System) builds on the motion library scaffold
with the full timeline specifications: loader sequence, hero reveal,
scroll triggers, compare slider GSAP Flip implementation, full-screen
menu takeover, hover delight, and page transitions.
