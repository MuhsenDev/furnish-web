'use client';

/*
  Gallery hero strip per Document 6 Section 2.

  Compact compared to home hero. About 40-50vh desktop, 35vh
  mobile. Centered text, no background image. Eyebrow plus
  headline plus subheadline plus optional counter line.
*/

import * as React from 'react';
import { Container } from '@/components/Container';
import { useScrollReveal } from '@/lib/motion';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function GalleryHero() {
  const ref = useScrollReveal<HTMLElement>({
    yOffset: 24,
    stagger: 0.2,
  });

  return (
    <section
      ref={ref}
      className={cn(
        'flex min-h-[35vh] items-center justify-center',
        'sm:min-h-[40vh] lg:min-h-[50vh]',
        'pt-12 pb-section-y-tight',
      )}
      aria-labelledby="gallery-hero-heading"
    >
      <Container width="default" className="text-center">
        <p data-reveal className="eyebrow">
          {t('gallery', 'heroEyebrow')}
        </p>
        <h1
          id="gallery-hero-heading"
          data-reveal
          className={cn(
            'mt-4 font-display text-deep',
            'tracking-display-tight leading-display',
            'text-display-l',
          )}
        >
          {t('gallery', 'heroHeadline')}
        </h1>
        <p
          data-reveal
          className={cn(
            'mt-6 mx-auto max-w-2xl text-body-l text-ink/80',
          )}
        >
          {t('gallery', 'heroSubheadline')}
        </p>
        <p data-reveal className="mt-3 text-body-s text-[var(--color-accent)]">
          {t('gallery', 'heroCounter')}
        </p>
      </Container>
    </section>
  );
}
