/*
  FAQ page per Document 8 §3.
  Hero plus 7 categorized accordion sections plus contact block plus
  JSON-LD FAQPage schema (drives Google rich snippets).
*/

import type { Metadata } from 'next';
import { Container } from '@/components/Container';
import { SectionDivider } from '@/components/SectionDivider';
import { FAQAccordion } from '@/components/static/FAQAccordion';
import { getAllFAQ, getFlatFAQ } from '@/lib/faq';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Common questions about Furnish. How the AI works, what photos work best, how shopping the room works, privacy, and pricing.',
  alternates: { canonical: 'https://furnish.live/faq' },
  openGraph: {
    title: 'FAQ | Furnish',
    description: 'Common questions about Furnish, answered.',
    url: 'https://furnish.live/faq',
  },
};

/* JSON-LD FAQPage schema per Doc 8 build step 9. Drives rich
   snippets in Google search results. */
function FAQStructuredData() {
  const flat = getFlatFAQ();
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: flat.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function FaqPage() {
  const categories = getAllFAQ();

  return (
    <>
      <FAQStructuredData />

      <section
        className="pt-section-y-tight pb-section-y-tight"
        aria-labelledby="faq-hero-heading"
      >
        <Container width="default" className="text-center">
          <p className="eyebrow">{t('faq', 'heroEyebrow')}</p>
          <h1
            id="faq-hero-heading"
            className={cn(
              'mt-4 mx-auto max-w-3xl font-display text-deep',
              'tracking-display-tight leading-display',
              'text-display-l',
            )}
          >
            {t('faq', 'heroHeadline')}
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-body-l text-ink/80">
            {t('faq', 'heroSubheadline')}
          </p>
        </Container>
      </section>

      {/* Category jump-nav. Sticky on mobile so users can jump while
          scrolling long answers. */}
      <nav
        aria-label={t('faq', 'categoryNavLabel')}
        className={cn(
          'sticky top-16 z-20 sm:top-20',
          'border-y border-[rgba(43,30,24,0.06)]',
          'bg-cream/85 backdrop-blur-md',
          'py-3',
        )}
      >
        <Container width="default">
          <div
            className={cn(
              'flex gap-2 overflow-x-auto pb-1',
              'sm:flex-wrap sm:overflow-visible',
              '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            )}
          >
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className={cn(
                  'shrink-0 inline-flex items-center justify-center',
                  'rounded-full px-4 py-2',
                  'text-body-s font-semibold',
                  'border border-[rgba(43,30,24,0.16)] bg-surface text-ink',
                  'hover:border-[rgba(43,30,24,0.32)]',
                )}
              >
                {cat.name}
              </a>
            ))}
          </div>
        </Container>
      </nav>

      <Container width="narrow" className="py-section-y">
        <div className="space-y-section-y">
          {categories.map((cat) => (
            <section
              key={cat.id}
              id={cat.id}
              className="scroll-mt-32"
              aria-labelledby={`faq-cat-${cat.id}`}
            >
              <h2
                id={`faq-cat-${cat.id}`}
                className={cn(
                  'font-display text-deep',
                  'tracking-display-tight leading-display',
                  'text-display-m',
                )}
              >
                {cat.name}
              </h2>
              <div className="mt-6">
                <FAQAccordion questions={cat.questions} />
              </div>
            </section>
          ))}
        </div>

        <SectionDivider align="center" className="mt-section-y" />

        <section className="mt-section-y-tight text-center">
          <h2
            className={cn(
              'font-display text-deep',
              'tracking-display-tight leading-display',
              'text-display-m',
            )}
          >
            {t('faq', 'stillHaveQuestionsHeadline')}
          </h2>
          <p className="mt-4 mx-auto max-w-xl text-body-l text-ink/85">
            {t('faq', 'stillHaveQuestionsBody')}
          </p>
          <a
            href="mailto:hello@furnish.live"
            className={cn(
              'mt-6 inline-flex items-center justify-center',
              'rounded-sm bg-[var(--color-accent-peach)] px-7 py-3.5',
              'text-body-m font-semibold text-deep shadow-1',
              'btn-primary-hover',
            )}
          >
            {t('faq', 'stillHaveQuestionsCta')}
          </a>
        </section>
      </Container>
    </>
  );
}
