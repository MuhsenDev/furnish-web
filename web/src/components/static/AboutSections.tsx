'use client';

/*
  About page sections per Document 8 §1.

  Single file holds all section components since they share i18n
  imports and motion hooks. Components: AboutHero, FounderSection,
  VisionMission, Values, HowWeMakeMoney, Roadmap, Contact.

  The HowWeMakeMoney section anchors with id="how-we-make-money" so
  the FTC disclosure on every blog post links directly to it.

  Founder image: an anonymous silhouette of a man-in-a-suit with a
  question-mark face. Hassan asked for his photo to come down and
  supplied this stock silhouette as the stand-in until he provides
  a different image. The portrait sits inside a small editorial
  frame (warm beige inset + thin ink border + soft shadow) so the
  silhouette reads as an intentional placeholder rather than an
  unstyled stock asset.
*/

import * as React from 'react';
import Image from 'next/image';
import { Container } from '@/components/Container';
import { SectionDivider } from '@/components/SectionDivider';
import { useScrollReveal } from '@/lib/motion';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* Toggle to true once Hassan supplies the founder photo. */
const PHOTO_AVAILABLE = true;
const FOUNDER_PHOTO_SRC = '/images/about/founder-silhouette.jpg';

/* ---- AboutHero ---- */

export function AboutHero() {
  const ref = useScrollReveal<HTMLElement>({ yOffset: 24, stagger: 0.18 });
  return (
    <section
      ref={ref}
      className="pt-section-y-tight pb-section-y-tight"
      aria-labelledby="about-hero-heading"
    >
      <Container width="default" className="text-center">
        <p data-reveal className="eyebrow">
          {t('about', 'heroEyebrow')}
        </p>
        <h1
          id="about-hero-heading"
          data-reveal
          className={cn(
            'mt-4 mx-auto max-w-3xl font-display text-deep',
            'tracking-display-tight leading-display',
            'text-display-l',
          )}
        >
          {t('about', 'heroHeadline')}
        </h1>
        <p
          data-reveal
          className="mt-6 mx-auto max-w-2xl text-body-l text-ink/80"
        >
          {t('about', 'heroSubheadline')}
        </p>
      </Container>
    </section>
  );
}

/* ---- FounderSection ---- */

/*
  Stretch Fix #1 from the 2026-05-13 design review: the 4-paragraph
  founder bio used to render as a 1047 px wall of identical-weight
  prose. This version splits the bio into three alternating cards
  (Origin / Motivation / Who it's for) with the portrait gutter
  becoming a sticky context column on desktop, plus the existing
  serif pull quote between cards 2 and 3.

  Decision per Hassan (2026-05-13): cut founderParagraph3 entirely
  (the line "Quotes from interior designers..." that was the strongest
  beat in P3 is already promoted to the pull quote, and the rest of
  the paragraph repeated the empty-rooms / Pinterest-paralysis frame).
  Cards therefore use P1 / P2 / P4. P3 remains in the i18n catalog
  for now in case the editorial choice gets reverted; rendering omits
  it.

  Portrait gutter stays exactly as previously shipped (silhouette,
  beige mat, 440 px on lg). Sticky positioning keeps the face visible
  while the reader scrolls through the cards on the right.
*/

export function FounderSection() {
  const ref = useScrollReveal<HTMLElement>({ yOffset: 30, stagger: 0.1 });
  return (
    <section
      ref={ref}
      className="py-section-y border-t border-[rgba(43,30,24,0.08)]"
      aria-labelledby="founder-heading"
    >
      <Container width="default">
        <div
          className={cn(
            'grid gap-10',
            PHOTO_AVAILABLE ? 'lg:grid-cols-[500px_1fr] lg:gap-16' : '',
          )}
        >
          {/* Left gutter: sticky portrait + eyebrow + h2 + signoff.
              Sticky on lg+ keeps the founder identity visible while
              the reader scrolls the 3 right-column cards. */}
          {PHOTO_AVAILABLE && (
            <div
              data-reveal
              className="mx-auto lg:mx-0 lg:sticky lg:top-24 lg:self-start"
            >
              <div
                className={cn(
                  'inline-block',
                  'rounded-sm bg-[var(--color-beige)]',
                  'border border-[rgba(43,30,24,0.18)]',
                  'shadow-2',
                  'p-3 sm:p-4',
                )}
              >
                <div
                  className={cn(
                    'relative overflow-hidden',
                    'bg-white',
                    'h-72 w-72 sm:h-80 sm:w-80 lg:h-[440px] lg:w-[440px]',
                    'border border-[rgba(43,30,24,0.10)]',
                  )}
                >
                  <Image
                    src={FOUNDER_PHOTO_SRC}
                    alt={t('about', 'founderPhotoAlt')}
                    fill
                    sizes="(min-width: 1024px) 440px, (min-width: 640px) 320px, 288px"
                    className="object-contain"
                  />
                </div>
              </div>

              <p className="eyebrow mt-6">
                {t('about', 'founderEyebrow')}
              </p>
              <h2
                id="founder-heading"
                className={cn(
                  'mt-3 font-display text-deep',
                  'tracking-display-tight leading-display',
                  'text-display-m',
                )}
              >
                {t('about', 'founderHeadline')}
              </h2>
              {/* Signoff renders inside the sticky gutter on lg+
                  only (where it pairs visually with the portrait
                  and reads as a signature). On mobile the gutter
                  stacks above the cards, so the signoff is moved
                  below the cards to remain a proper "closer." */}
              <p className="mt-6 text-body-l italic text-ink/80 hidden lg:block">
                {t('about', 'founderSignoff')}
              </p>
            </div>
          )}

          {/* Right column: 3 alternating cards + pull quote between
              cards 2 and 3. Cards alternate cream (with line border)
              and the editorial-accent-bg cream tint so the visual
              rhythm of the column reads as "three distinct beats" not
              "one continuous wall." Each card has a tiny capitalized
              eyebrow label (Origin / Motivation / Who it's for) per
              the design-review sketch. */}
          <div className={PHOTO_AVAILABLE ? '' : 'mx-auto max-w-2xl'}>
            {/* Mobile-only eyebrow + h2 above the cards (the sticky
                gutter version renders them on lg+ inside the gutter
                column). Keeps the heading hierarchy intact for the
                stacked mobile layout. */}
            {PHOTO_AVAILABLE ? null : (
              <>
                <p data-reveal className="eyebrow">
                  {t('about', 'founderEyebrow')}
                </p>
                <h2
                  id="founder-heading"
                  data-reveal
                  className={cn(
                    'mt-3 font-display text-deep',
                    'tracking-display-tight leading-display',
                    'text-display-m',
                  )}
                >
                  {t('about', 'founderHeadline')}
                </h2>
              </>
            )}

            <div className="flex flex-col gap-8">
              <article
                data-reveal
                className={cn(
                  'rounded-sm bg-[var(--color-editorial-accent-bg)]',
                  'p-7 sm:p-8',
                )}
              >
                <p className="eyebrow text-[10px]">
                  {t('about', 'founderCard1Eyebrow')}
                </p>
                <p className="mt-3 text-body-l text-ink/90 leading-relaxed">
                  {t('about', 'founderParagraph1')}
                </p>
              </article>

              <article
                data-reveal
                className={cn(
                  'rounded-sm bg-[var(--color-cream)]',
                  'border border-[var(--color-line)]',
                  'p-7 sm:p-8',
                )}
              >
                <p className="eyebrow text-[10px]">
                  {t('about', 'founderCard2Eyebrow')}
                </p>
                <p className="mt-3 text-body-l text-ink/90 leading-relaxed">
                  {t('about', 'founderParagraph2')}
                </p>
              </article>

              {/* Pull quote separator between cards 2 and 3.
                  Bronze left rule + 56 px Fraunces italic matches
                  the blog MDX blockquote treatment so the
                  typographic voice is consistent across About and
                  long-form editorial. */}
              <blockquote
                data-reveal
                className={cn(
                  'border-l-2 border-[var(--color-accent)]',
                  'pl-6 py-1 my-2',
                  'font-display text-display-m italic text-deep',
                  'leading-display tracking-display-tight',
                )}
              >
                {t('about', 'founderPullQuote')}
              </blockquote>

              <article
                data-reveal
                className={cn(
                  'rounded-sm bg-[var(--color-editorial-accent-bg)]',
                  'p-7 sm:p-8',
                )}
              >
                <p className="eyebrow text-[10px]">
                  {t('about', 'founderCard3Eyebrow')}
                </p>
                <p className="mt-3 text-body-l text-ink/90 leading-relaxed">
                  {t('about', 'founderParagraph4')}
                </p>
              </article>
            </div>

            {/* Signoff: rendered below the cards on mobile (the
                sticky gutter on lg+ shows its own copy, hidden on
                mobile via the lg:block utility above). The contact
                byline below stays in this column in both layouts so
                the mailto sits adjacent to the cards. */}
            <p
              data-reveal
              className="mt-8 text-body-l italic text-ink/80 lg:hidden"
            >
              {t('about', 'founderSignoff')}
            </p>
            <p
              data-reveal
              className="mt-3 text-body-m text-ink/75"
            >
              {t('about', 'founderContactPrefix')}
              <a
                href={t('about', 'founderContactHref')}
                className="font-semibold text-[var(--color-accent)] underline-offset-4 hover:underline"
              >
                {t('about', 'founderContactEmail')}
              </a>
              {t('about', 'founderContactSuffix')}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---- VisionMission ---- */

export function VisionMissionSection() {
  const ref = useScrollReveal<HTMLElement>({ yOffset: 30, stagger: 0.12 });
  return (
    <section
      ref={ref}
      className="py-section-y bg-[var(--color-beige)]"
      aria-label="Vision and Mission"
    >
      <Container width="default">
        <div className="grid gap-12 sm:grid-cols-2 sm:gap-16">
          <div data-reveal>
            <p className="eyebrow">{t('about', 'visionEyebrow')}</p>
            <h2
              className={cn(
                'mt-3 font-display text-deep',
                'tracking-display-tight leading-display',
                'text-display-m',
              )}
            >
              {t('about', 'visionStatement')}
            </h2>
            <p className="mt-5 text-body-l text-ink/85 leading-relaxed">
              {t('about', 'visionBody')}
            </p>
          </div>
          <div data-reveal>
            <p className="eyebrow">{t('about', 'missionEyebrow')}</p>
            <h2
              className={cn(
                'mt-3 font-display text-deep',
                'tracking-display-tight leading-display',
                'text-display-m',
              )}
            >
              {t('about', 'missionStatement')}
            </h2>
            <p className="mt-5 text-body-l text-ink/85 leading-relaxed">
              {t('about', 'missionBody')}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---- ValuesSection ---- */

const VALUES = [
  { titleKey: 'value1Title', bodyKey: 'value1Body' },
  { titleKey: 'value2Title', bodyKey: 'value2Body' },
  { titleKey: 'value3Title', bodyKey: 'value3Body' },
  { titleKey: 'value4Title', bodyKey: 'value4Body' },
];

export function ValuesSection() {
  const ref = useScrollReveal<HTMLElement>({ yOffset: 30, stagger: 0.08 });
  return (
    <section
      ref={ref}
      className="py-section-y"
      aria-labelledby="values-heading"
    >
      <Container width="default">
        <div className="text-center" data-reveal>
          <p className="eyebrow">{t('about', 'valuesEyebrow')}</p>
          <h2
            id="values-heading"
            className={cn(
              'mt-3 mx-auto max-w-3xl font-display text-deep',
              'tracking-display-tight leading-display',
              'text-display-m',
            )}
          >
            {t('about', 'valuesHeadline')}
          </h2>
        </div>
        <div className="mt-section-y-tight grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.titleKey} data-reveal>
              <h3 className="font-display text-display-m text-deep tracking-display-tight">
                {t('about', v.titleKey)}
              </h3>
              <p className="mt-3 text-body-m text-ink/85 leading-relaxed">
                {t('about', v.bodyKey)}
              </p>
            </div>
          ))}
        </div>
        <SectionDivider align="center" className="mt-section-y" />
      </Container>
    </section>
  );
}

/* ---- HowWeMakeMoneySection ---- */

/*
  Quick Fix #2 from the 2026-05-13 design review, applied as the
  "partial replace" variant Hassan picked: a 3-card comparison
  block summarizes the cost / commission / picks flow at the top
  of the section, and replaces the original P1 + P2 prose.
  Paragraphs 3 (integrity statement), 4 (FTC affiliate disclosure,
  Skimlinks-relevant), and 5 (closer) survive verbatim as prose
  below the cards.

  Skimlinks-safe: the FTC disclosure paragraph (howWeMakeMoneyBody4)
  renders unchanged. The integrity paragraph (Body3) also stays.
  Reviewers see the same disclosure text as before; the cards just
  give scrolling readers a scannable summary above the prose.
*/

const HWMM_CARDS = [
  {
    titleKey: 'howWeMakeMoneyCard1Title',
    valueKey: 'howWeMakeMoneyCard1Value',
    detailKey: 'howWeMakeMoneyCard1Detail',
  },
  {
    titleKey: 'howWeMakeMoneyCard2Title',
    valueKey: 'howWeMakeMoneyCard2Value',
    detailKey: 'howWeMakeMoneyCard2Detail',
  },
  {
    titleKey: 'howWeMakeMoneyCard3Title',
    valueKey: 'howWeMakeMoneyCard3Value',
    detailKey: 'howWeMakeMoneyCard3Detail',
  },
];

export function HowWeMakeMoneySection() {
  const ref = useScrollReveal<HTMLElement>({ yOffset: 30, stagger: 0.1 });
  return (
    <section
      ref={ref}
      id="how-we-make-money"
      className="scroll-mt-24 py-section-y bg-[var(--color-beige)]"
      aria-labelledby="how-we-make-money-heading"
    >
      <Container width="narrow">
        <p data-reveal className="eyebrow">
          {t('about', 'howWeMakeMoneyEyebrow')}
        </p>
        <h2
          id="how-we-make-money-heading"
          data-reveal
          className={cn(
            'mt-3 font-display text-deep',
            'tracking-display-tight leading-display',
            'text-display-m',
          )}
        >
          {t('about', 'howWeMakeMoneyHeadline')}
        </h2>

        {/* 3-card comparison block, summarizes the cost / commission
            / picks flow at a glance. Cards sit on cream against the
            beige section background, giving them visual lift. */}
        <div className="mt-section-y-tight grid gap-6 sm:grid-cols-3">
          {HWMM_CARDS.map((card) => (
            <div
              key={card.titleKey}
              data-reveal
              className={cn(
                'rounded-sm bg-[var(--color-cream)]',
                'border border-[rgba(43,30,24,0.10)]',
                'p-6 sm:p-7',
              )}
            >
              <p className="eyebrow">{t('about', card.titleKey)}</p>
              <p
                className={cn(
                  'mt-3 font-display text-deep',
                  'tracking-display-tight leading-display',
                  'text-display-s',
                )}
              >
                {t('about', card.valueKey)}
              </p>
              <p className="mt-3 text-body-m text-ink/85 leading-relaxed">
                {t('about', card.detailKey)}
              </p>
            </div>
          ))}
        </div>

        {/* Prose continues with paragraphs 3 (integrity), 4 (FTC
            affiliate disclosure, Skimlinks-relevant), and 5 (closer).
            Paragraphs 1 and 2 are replaced by the cards above. */}
        <div className="mt-section-y-tight space-y-5">
          <p data-reveal className="text-body-l text-ink/90 leading-relaxed">
            {t('about', 'howWeMakeMoneyBody3')}
          </p>
          <p data-reveal className="text-body-l text-ink/90 leading-relaxed">
            {t('about', 'howWeMakeMoneyBody4')}
          </p>
          <p data-reveal className="text-body-l text-ink/90 leading-relaxed">
            {t('about', 'howWeMakeMoneyBody5')}
          </p>
        </div>
      </Container>
    </section>
  );
}

/* ---- RoadmapSection ---- */

const ROADMAP_KEYS = [
  'roadmapItem1',
  'roadmapItem2',
  'roadmapItem3',
  'roadmapItem4',
  'roadmapItem5',
];

export function RoadmapSection() {
  const ref = useScrollReveal<HTMLElement>({ yOffset: 30, stagger: 0.08 });
  return (
    <section
      ref={ref}
      className="py-section-y"
      aria-labelledby="roadmap-heading"
    >
      <Container width="narrow">
        <p data-reveal className="eyebrow">
          {t('about', 'roadmapEyebrow')}
        </p>
        <h2
          id="roadmap-heading"
          data-reveal
          className={cn(
            'mt-3 font-display text-deep',
            'tracking-display-tight leading-display',
            'text-display-m',
          )}
        >
          {t('about', 'roadmapHeadline')}
        </h2>
        <ul className="mt-6 space-y-3 list-disc pl-6 text-body-l text-ink/90">
          {ROADMAP_KEYS.map((key) => (
            <li key={key} data-reveal className="leading-relaxed">
              {t('about', key)}
            </li>
          ))}
        </ul>
        <p
          data-reveal
          className="mt-6 text-body-s italic text-muted"
        >
          {t('about', 'roadmapNote')}
        </p>
      </Container>
    </section>
  );
}

/* ---- ContactSection ---- */

export function ContactSection() {
  const ref = useScrollReveal<HTMLElement>({ yOffset: 24, stagger: 0.1 });
  return (
    <section
      ref={ref}
      id="contact"
      className="scroll-mt-24 py-section-y border-t border-[rgba(43,30,24,0.08)]"
      aria-labelledby="contact-heading"
    >
      <Container width="narrow" className="text-center">
        <p data-reveal className="eyebrow">
          {t('about', 'contactEyebrow')}
        </p>
        <h2
          id="contact-heading"
          data-reveal
          className={cn(
            'mt-3 font-display text-deep',
            'tracking-display-tight leading-display',
            'text-display-m',
          )}
        >
          {t('about', 'contactHeadline')}
        </h2>
        <p
          data-reveal
          className="mt-6 mx-auto max-w-xl text-body-l text-ink/85 leading-relaxed"
        >
          {t('about', 'contactBody')}
        </p>
        <a
          data-reveal
          href={t('about', 'contactEmailHref')}
          className={cn(
            'mt-8 inline-flex items-center justify-center gap-2',
            'rounded-sm border border-[rgba(43,30,24,0.16)]',
            'bg-transparent px-7 py-3.5',
            'text-body-l font-semibold text-deep',
            'btn-secondary-hover',
          )}
        >
          {t('about', 'contactEmailLabel')}
        </a>
      </Container>
    </section>
  );
}
