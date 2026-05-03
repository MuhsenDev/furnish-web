/*
  How It Works page per Document 8 §2.
  Hero, 3 expanded steps, technology section, simplified comparison
  block, mini-FAQ (7 questions tagged for this page), final CTA.
*/

import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/Container';
import { SectionDivider } from '@/components/SectionDivider';
import { BlogCTABox } from '@/components/blog/BlogCTABox';
import {
  HowItWorksHero,
  HowItWorksSteps,
  HowItWorksTechnology,
  HowItWorksComparison,
} from '@/components/static/HowItWorksSections';
import { FAQAccordion } from '@/components/static/FAQAccordion';
import { getFAQByPage } from '@/lib/faq';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    'See how Furnish redesigns your room from a single photo. The full walkthrough: photo, quiz, AI redesign, shopping list. About a minute, end to end.',
  alternates: { canonical: 'https://furnish.live/how-it-works' },
  openGraph: {
    title: 'How It Works | Furnish',
    description:
      'See how Furnish redesigns your room from a single photo, step by step.',
    url: 'https://furnish.live/how-it-works',
  },
};

/* JSON-LD HowTo schema per Doc 8 build step 9. */
function HowItWorksStructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to redesign a room with Furnish',
    description:
      'Take a photo, answer a short visual quiz, get a photo-realistic AI redesign with shoppable products.',
    totalTime: 'PT1M',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Snap any room.',
        text: 'Empty, half-empty, or fully lived-in. Furnish handles all three. The capture flow shows a quick guide on first use.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Tell us your style.',
        text: 'Answer a short visual quiz that captures your vibe, materials preference, and how busy you want the room to feel.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Get your designed room.',
        text: 'Furnish redesigns the room with new pieces composited in. Every item is real and shoppable.',
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function HowItWorksPage() {
  const miniFAQ = getFAQByPage('/how-it-works').slice(0, 7);

  return (
    <>
      <HowItWorksStructuredData />
      <HowItWorksHero />
      <HowItWorksSteps />
      <HowItWorksTechnology />
      <HowItWorksComparison />

      <section
        className="py-section-y border-t border-[rgba(43,30,24,0.08)]"
        aria-labelledby="how-mini-faq-heading"
      >
        <Container width="narrow">
          <p className="eyebrow">{t('how-it-works', 'miniFaqEyebrow')}</p>
          <h2
            id="how-mini-faq-heading"
            className={cn(
              'mt-3 font-display text-deep',
              'tracking-display-tight leading-display',
              'text-display-m',
            )}
          >
            {t('how-it-works', 'miniFaqHeadline')}
          </h2>
          <div className="mt-section-y-tight">
            <FAQAccordion questions={miniFAQ} />
          </div>
          <SectionDivider align="center" className="mt-section-y-tight" />
          <div className="mt-6 text-center">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 text-body-l font-semibold text-[var(--color-accent)] hover:underline underline-offset-4"
            >
              {t('how-it-works', 'miniFaqAllLink')}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Container>
      </section>

      <BlogCTABox />
    </>
  );
}
