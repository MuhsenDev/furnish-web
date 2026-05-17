/*
  MegaNav data layer per the 2026-05-17 ApeChain-pattern mega-menu
  build. All section content lives here so component code never
  needs touching to update labels, cards, images, or destinations.

  Pattern reference: apechain.com / their CLAUDE.md spec. Furnish
  adaptations vs the source spec:
    - Cream + bronze + sage palette (CLAUDE.md hard rule #6), NOT
      dark + warm gold.
    - Fraunces serif + Inter sans (CLAUDE.md hard rule #7), NOT
      Bebas Neue + DM Sans.
    - Sections remapped to Furnish's 4 user intents (Browse /
      Learn / Compare / Get Started) instead of ApeChain's
      Explore / Learn / Build / Bridge.
    - Cards point at REAL destinations (gallery routes, blog
      posts, comparison anchor, info pages). No fake apps.
    - "Get Started" featured tile opens the existing
      WaitlistModal via a sentinel href the orchestrator
      intercepts, rather than navigating.

  Em-dash check: every user-facing string here is em-dash-free per
  CLAUDE.md hard rule #12.
*/

export type SectionId = 'browse' | 'learn' | 'compare' | 'get-started';

/* A single card in the mega-menu's right-pane grid. */
export interface NavCard {
  id: string;
  /** Short uppercase tag rendered above the card title. */
  tag?: string;
  /** Card title, usually 1-3 words. */
  name: string;
  /** Single-line subtitle. Sentence case. */
  description: string;
  /** Internal route OR external href. */
  href: string;
  /** Real image path. Must exist under /public/. */
  image: string;
  /** How to fit the image in the card tile. Default 'cover' fills
      the tile (with crop). Use 'contain' for portrait-oriented
      subjects like silhouettes or product shots where cropping
      the head or feet would look broken. */
  imageFit?: 'cover' | 'contain';
}

/* The big editorial tile at the top of each section's right pane. */
export interface NavFeatured {
  /** Small label above the title, uppercase via CSS. */
  eyebrow: string;
  /** Display-font headline. */
  title: string;
  /** Subtitle line. */
  description: string;
  /** Destination href OR the sentinel '__waitlist_modal__'. */
  href: string;
  /** Primary CTA text on the tile. */
  ctaLabel: string;
  /** Background image for the tile. Omit for a text-only tile
      (copy spans the full tile width). */
  image?: string;
  /** Image alt text for screen readers. Required when image is set. */
  imageAlt?: string;
}

export interface NavSection {
  id: SectionId;
  /** Short label rendered in the closed top bar and left rail. */
  label: string;
  /** Featured tile at the top of the section's right pane. */
  featured: NavFeatured | null;
  /** Card grid below the featured tile. */
  cards: NavCard[];
  /** Optional pill row of category filters under the grid. */
  categories?: Array<{ label: string; href: string }>;
}

/* Sentinel href the orchestrator intercepts to open the
   WaitlistModal instead of routing. */
export const WAITLIST_MODAL_HREF = '__waitlist_modal__';

export const navSections: NavSection[] = [
  {
    id: 'browse',
    label: 'Browse',
    featured: {
      eyebrow: 'Featured style',
      title: 'Scandinavian Living Room',
      description:
        'Warm woods, neutral palette, designed in seconds from a single photo.',
      href: '/gallery',
      ctaLabel: 'See the gallery',
      image: '/images/before-after/ba-1-living-room-scandinavian.jpg',
      imageAlt:
        'Scandinavian living room with warm woods and a neutral palette, designed by Furnish',
    },
    cards: [
      {
        id: 'living-room',
        tag: 'Living rooms',
        name: 'Living Room',
        description: 'Couches that hold a Friday and a Sunday.',
        href: '/gallery#room=living',
        image: '/images/gallery/gallery-living-scandinavian-01.png',
      },
      {
        id: 'bedroom',
        tag: 'Bedrooms',
        name: 'Bedroom',
        description: 'Quiet, layered, made for actual sleep.',
        href: '/gallery#room=bedroom',
        image: '/images/gallery/gallery-bedroom-mid-century-01.png',
      },
      {
        id: 'kitchen',
        tag: 'Kitchens',
        name: 'Kitchen',
        description: 'A room you cook in, not just photograph.',
        href: '/gallery#room=kitchen',
        image: '/images/gallery/gallery-kitchen-farmhouse-01.png',
      },
      {
        id: 'bathroom',
        tag: 'Bathrooms',
        name: 'Bathroom',
        description: 'Spa rituals on a non-spa budget.',
        href: '/gallery#room=bathroom',
        image: '/images/gallery/gallery-bathroom-contemporary-01.png',
      },
      {
        id: 'home-office',
        tag: 'Home offices',
        name: 'Home Office',
        description: 'A desk you actually want to sit at.',
        href: '/gallery#room=home-office',
        image: '/images/gallery/gallery-home-office-industrial-01.png',
      },
      {
        id: 'dining-room',
        tag: 'Dining rooms',
        name: 'Dining Room',
        description: 'Long dinners deserve long tables.',
        href: '/gallery#room=dining',
        image: '/images/gallery/gallery-dining-art-deco-01.png',
      },
    ],
    categories: [
      { label: 'Scandinavian', href: '/gallery#style=scandinavian' },
      { label: 'Mid-Century', href: '/gallery#style=mid-century' },
      { label: 'Industrial', href: '/gallery#style=industrial' },
      { label: 'Bohemian', href: '/gallery#style=bohemian' },
      { label: 'Farmhouse', href: '/gallery#style=farmhouse' },
      { label: 'Contemporary', href: '/gallery#style=contemporary' },
    ],
  },

  {
    id: 'learn',
    label: 'Learn',
    featured: {
      eyebrow: 'Founder story',
      title: 'Why I Built Furnish',
      description:
        "I'm 18, building solo from Michigan. Here's what I kept watching that pushed me to ship.",
      href: '/blog/why-i-built-furnish',
      ctaLabel: 'Read the story',
      /* No image. Text-only tile so the founder story reads as
         editorial rather than competing with a generic styled
         living room for attention. */
    },
    cards: [
      {
        id: 'trends-2026',
        tag: 'Trends',
        name: 'Interior Design Trends 2026',
        description: 'What\'s aging well and what\'s already tired.',
        href: '/blog/interior-design-trends-2026',
        image: '/images/blog/blog-5-2026-trends.jpg',
      },
      {
        id: 'scandi-living',
        tag: 'Living room',
        name: 'Scandinavian Living Room 2026',
        description: 'Warm woods, low light, no clutter.',
        href: '/blog/scandinavian-living-room-2026',
        image: '/images/blog/blog-1-scandinavian-living-room.jpg',
      },
      {
        id: 'velvet-vs-linen',
        tag: 'Sofa picks',
        name: 'Velvet vs Linen Sofas',
        description: 'When to pick each, and what to avoid.',
        href: '/blog/velvet-vs-linen-sofas',
        image: '/images/blog/blog-4-velvet-vs-linen-sofas.jpg',
      },
      {
        id: 'mid-century-tables',
        tag: 'Picks',
        name: 'Best Mid-Century Coffee Tables',
        description: 'A working shortlist, not a sponsored roundup.',
        href: '/blog/best-mid-century-coffee-tables',
        image: '/images/blog/blog-2-mid-century-coffee-tables.jpg',
      },
      {
        id: 'small-bedroom',
        tag: 'Bedroom',
        name: 'Small Bedroom Design Ideas',
        description: 'For rooms that fight you on every dimension.',
        href: '/blog/small-bedroom-design-ideas',
        image: '/images/blog/blog-3-small-bedroom.jpg',
      },
      {
        id: 'how-it-works',
        tag: 'How it works',
        name: 'How Furnish Works',
        description: 'Photo, style, shoppable room. In that order.',
        href: '/how-it-works',
        /* Empty/before shot signals "start of transformation".
           Browse's featured already shows the AFTER of this same
           pair, so the two read as a story across sections. */
        image: '/images/before-after/ba-1-living-room-empty-v2.jpg',
      },
    ],
    categories: [
      { label: 'All posts', href: '/blog' },
      { label: 'Trends', href: '/blog?category=trends' },
      { label: 'Picks', href: '/blog?category=picks' },
      { label: 'Founder story', href: '/blog/why-i-built-furnish' },
    ],
  },

  {
    id: 'compare',
    label: 'Compare',
    featured: {
      eyebrow: 'How we compare',
      title: 'Designed for you. Not for designers.',
      description:
        'Save 95% versus traditional interior designers. From $5,000+ to free.',
      href: '/#why-furnish',
      ctaLabel: 'See the comparison',
      /* No image. MegaNavSectionContent renders MegaNavCompareMini
         (a 2-row Furnish vs Designer mini value table) in the
         media slot instead, so the visitor sees the actual
         punchline numbers right in the nav. */
    },
    cards: [
      {
        id: 'vs-designer',
        tag: 'Versus',
        name: 'Interior Designer',
        description: '$2,000 to $10,000, weeks of back and forth.',
        href: '/#why-furnish',
        /* Traditional style reads as the classic/formal aesthetic
           an in-person designer would deliver. */
        image: '/images/gallery/gallery-dining-traditional-01.png',
      },
      {
        id: 'vs-havenly',
        tag: 'Versus',
        name: 'Havenly',
        description: '$79 to $1,599, limited iteration.',
        href: '/#why-furnish',
        /* Contemporary clean look reads as generic online-service
           output, the kind a templated tier-1 plan would ship. */
        image: '/images/gallery/gallery-home-office-contemporary-01.png',
      },
      {
        id: 'vs-pinterest',
        tag: 'Versus',
        name: 'Pinterest',
        description: 'Free, but never a real room.',
        href: '/#why-furnish',
        /* Bohemian is the quintessential Pinterest aesthetic:
           eclectic, layered, aspirational. The image you'd pin
           but never actually build. */
        image: '/images/gallery/gallery-living-bohemian-01.png',
      },
    ],
  },

  {
    id: 'get-started',
    label: 'Get Started',
    featured: {
      eyebrow: 'Coming soon',
      title: 'Join the Waitlist',
      description:
        'One email when Furnish launches on iOS. No drip campaigns, no spam.',
      href: WAITLIST_MODAL_HREF,
      ctaLabel: 'Get early access',
      image: '/images/hero/hero-2-art-deco-bedroom-evening.jpg',
      imageAlt: 'Mid-century modern bedroom in moody evening light, designed by Furnish',
    },
    cards: [
      {
        id: 'about',
        tag: 'About',
        name: 'About Furnish',
        description: 'Built by Hassan Muhsen. Garden City, Michigan.',
        href: '/about',
        image: '/images/about/founder-silhouette.jpg',
        /* Founder silhouette is a portrait figure; object-cover
           crops the head and feet in a 4:3 tile. Contain it so the
           full body shows. Letterbox falls on the bg-cream tile
           background, matching the page palette. */
        imageFit: 'contain',
      },
      {
        id: 'how',
        tag: 'How it works',
        name: 'How It Works',
        description: 'Three steps from a photo to a shoppable room.',
        href: '/how-it-works',
        /* Same empty-room shot as the Learn section's How Furnish
            Works card, intentional pairing: both surfaces lead to
            the same /how-it-works page and the empty room is the
            "before any of this happens" signal. */
        image: '/images/before-after/ba-1-living-room-empty-v2.jpg',
      },
      {
        id: 'faq',
        tag: 'FAQ',
        name: 'Frequently Asked',
        description: 'What we collect, what costs what, when we ship.',
        href: '/faq',
        /* Mid-century dining: a dining table is the universal "sit
           down and talk it through" image. Warm and approachable,
           matching the FAQ tone. */
        image: '/images/gallery/gallery-dining-mid-century-01.png',
      },
      {
        id: 'legal',
        tag: 'Legal',
        name: 'Privacy & Terms',
        description: 'How we handle your email and your data.',
        href: '/privacy',
        /* Minimalist walk-in closet: a private space where your
           things are organized and kept yours. Reads as "we don't
           hoard your data, we keep it tidy" without being literal
           about lock/key/document cliches. */
        image: '/images/gallery/gallery-walk-in-closet-minimalist-01.png',
      },
    ],
  },
];

/* Convenience lookup. Components use this rather than re-finding by
   id every render. */
export const navSectionById: Record<SectionId, NavSection> = navSections.reduce(
  (acc, section) => {
    acc[section.id] = section;
    return acc;
  },
  {} as Record<SectionId, NavSection>,
);

/* Section order is fixed: Browse / Learn / Compare / Get Started.
   Both the closed-bar triggers and the open-state left rail render
   in this order. Components iterate navSections directly. */
