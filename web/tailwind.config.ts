import type { Config } from 'tailwindcss';

// Per Document 2 §1.1, every color token comes from the app's
// CSS first. Tailwind reads from CSS custom properties (defined
// in src/styles/tokens.css) so the marketing site inherits the
// app palette automatically. No new brand colors introduced.
const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // App-inherited tokens (see src/styles/tokens.css for source).
        cream: 'var(--color-cream)',
        beige: 'var(--color-beige)',
        'beige-2': 'var(--color-beige-2)',
        tan: 'var(--color-tan)',
        brown: 'var(--color-brown)',
        'brown-2': 'var(--color-brown-2)',
        deep: 'var(--color-deep)',
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        line: 'var(--color-line)',
        surface: 'var(--color-surface)',
        danger: 'var(--color-danger)',
        warn: 'var(--color-warn)',
        ok: 'var(--color-ok)',
        // Secondary peach accent (2026-05). Sparingly used. NEVER
        // replaces bronze on CTAs/focus rings/links/.eyebrow.
        'accent-peach': 'var(--color-accent-peach)',
        // Surface-2 accents (2026-05-16). Sage for tinted hairlines
        // + subtle active-state backgrounds; terracotta for emphasis
        // numbers in the comparison table. Sage is BG/DIVIDER-only
        // (fails WCAG on cream for body type); terracotta passes AA
        // at display sizes.
        sage: 'var(--color-sage)',
        terracotta: 'var(--color-terracotta)',
      },
      fontFamily: {
        // Per Document 2 §2.2, app's sans for body and Fraunces for
        // marketing-only display headers.
        display: 'var(--font-display)',
        sans: 'var(--font-sans)',
      },
      fontSize: {
        // Fluid clamp-based scale per Document 2 §2.3.
        'display-xl': 'var(--text-display-xl)',
        'display-l': 'var(--text-display-l)',
        'display-m': 'var(--text-display-m)',
        'body-xl': 'var(--text-body-xl)',
        'body-l': 'var(--text-body-l)',
        'body-m': 'var(--text-body-m)',
        'body-s': 'var(--text-body-s)',
      },
      letterSpacing: {
        display: '-0.02em',
        'display-tight': '-0.03em',
        'display-tighter': '-0.04em',
        eyebrow: '0.1em',
      },
      lineHeight: {
        display: '0.95',
        'display-tight': '0.92',
        body: '1.5',
        'body-relaxed': '1.65',
        caption: '1.4',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius-sm)',
      },
      boxShadow: {
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
        3: 'var(--shadow-3)',
      },
      transitionTimingFunction: {
        /* Vercel curve. Maps to --ease-premium / --ease-furnish-out
           which both resolve to cubic-bezier(0.16, 1, 0.3, 1). */
        premium: 'var(--ease-premium)',
        vercel: 'var(--ease-premium)',
        'vercel-in': 'var(--ease-vercel-in)',
      },
      maxWidth: {
        narrow: 'var(--container-narrow)',
        default: 'var(--container-default)',
        wide: 'var(--container-wide)',
      },
      spacing: {
        'section-y': 'var(--space-section-y)',
        'section-y-tight': 'var(--space-section-y-tight)',
        'block-y': 'var(--space-block-y)',
      },
      backgroundImage: {
        'hero-gradient': 'var(--gradient-hero)',
      },
    },
  },
  plugins: [],
};

export default config;
