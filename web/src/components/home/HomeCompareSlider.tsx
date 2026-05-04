'use client';

/*
  Home page Compare Slider section per Document 5 Section 4.

  Wraps the shared <CompareSlider> from Document 3. Uses one
  before/after pair (locked: empty living room → designed
  scandinavian living room). Auto-demo runs on viewport entry.

  The optional thumbnail nav (§4.7) is a stretch goal; not built
  at v1 per the prompt's "Single before/after pair at v1" rule.

  Fires home_compare_slider_interaction once when the user first
  drags or clicks the slider.
*/

import * as React from 'react';
import { Container } from '@/components/Container';
import { CompareSlider } from '@/components/shared/CompareSlider';
import { useScrollReveal } from '@/lib/motion';
import { t } from '@/lib/i18n';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const BEFORE_SRC = '/images/before-after/ba-1-living-room-empty-v2.jpg';
const AFTER_SRC = '/images/before-after/ba-1-living-room-scandinavian.jpg';

export function HomeCompareSlider() {
  const sectionRef = useScrollReveal<HTMLElement>({ yOffset: 40 });
  const interactedRef = React.useRef(false);

  /* Capture user interaction once. The CompareSlider component
     does not surface a native onInteract callback, so we attach
     a listener at the section level for pointerdown and keydown
     and dedupe via the ref. */
  React.useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    const fire = () => {
      if (interactedRef.current) return;
      interactedRef.current = true;
      track('home_compare_slider_interaction');
    };

    sectionEl.addEventListener('pointerdown', fire, { passive: true });
    sectionEl.addEventListener('keydown', fire);

    return () => {
      sectionEl.removeEventListener('pointerdown', fire);
      sectionEl.removeEventListener('keydown', fire);
    };
  }, [sectionRef]);

  return (
    <section
      ref={sectionRef}
      className="py-section-y"
      aria-labelledby="compare-heading"
    >
      <Container width="default">
        <div className="text-center" data-reveal>
          <p className="eyebrow">{t('home', 'compareEyebrow')}</p>
          <h2
            id="compare-heading"
            className={cn(
              'mt-3 font-display text-deep',
              'tracking-display-tight leading-display',
              'text-display-l',
            )}
          >
            {t('home', 'compareHeadline')}
          </h2>
        </div>

        <div className="mt-section-y-tight" data-reveal>
          <CompareSlider
            before={{ src: BEFORE_SRC, alt: t('home', 'compareBeforeAlt') }}
            after={{ src: AFTER_SRC, alt: t('home', 'compareAfterAlt') }}
            initialPosition={50}
            autoDemo={true}
            aspectClassName="aspect-[3/2] sm:aspect-video"
          />
        </div>

        <p
          data-reveal
          className={cn(
            'mt-8 text-center text-body-l',
            'text-ink/70',
          )}
        >
          {t('home', 'compareCaption')}
        </p>
      </Container>
    </section>
  );
}
