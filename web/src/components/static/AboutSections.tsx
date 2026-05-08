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
            /* Photo column widened from 320px to 500px so the
               lg:w-[440px] silhouette frame (≈472px outer with the
               p-4 mat) fits inside the grid track. The previous
               320px column meant the frame was bleeding ~150px to
               the right, overlapping the body copy on desktop -
               Hassan flagged it. The 1fr text column still holds
               plenty of width on a 1200px container (≈700px). */
            PHOTO_AVAILABLE ? 'lg:grid-cols-[500px_1fr] lg:gap-16' : '',
          )}
        >
          {PHOTO_AVAILABLE && (
            <div data-reveal className="mx-auto lg:mx-0">
              {/* Mini portrait frame: outer warm-beige mat with a
                  thin ink border + soft shadow, inner cream window
                  holding the silhouette. Keeps the placeholder
                  feeling intentional without being precious about
                  it (Hassan: "don't do too much"). p-3 mat width
                  reads as a real frame at 320px and 480px. */}
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
                    /* White window matches the silhouette JPG's white
                       background so the figure feels integrated with
                       the frame rather than sitting on a contrasting
                       cream square. */
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
            </div>
          )}

          <div className={PHOTO_AVAILABLE ? '' : 'mx-auto max-w-2xl'}>
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
            <div className="mt-6 space-y-5">
              <p data-reveal className="text-body-l text-ink/90 leading-relaxed">
                {t('about', 'founderParagraph1')}
              </p>
              <p data-reveal className="text-body-l text-ink/90 leading-relaxed">
                {t('about', 'founderParagraph2')}
              </p>
              <p data-reveal className="text-body-l text-ink/90 leading-relaxed">
                {t('about', 'founderParagraph3')}
              </p>
              <p data-reveal className="text-body-l text-ink/90 leading-relaxed">
                {t('about', 'founderParagraph4')}
              </p>
            </div>
            <p
              data-reveal
              className="mt-6 text-body-l italic text-ink/80"
            >
              {t('about', 'founderSignoff')}
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
        <div className="mt-6 space-y-5">
          <p data-reveal className="text-body-l text-ink/90 leading-relaxed">
            {t('about', 'howWeMakeMoneyBody1')}
          </p>
          <p data-reveal className="text-body-l text-ink/90 leading-relaxed">
            {t('about', 'howWeMakeMoneyBody2')}
          </p>
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
