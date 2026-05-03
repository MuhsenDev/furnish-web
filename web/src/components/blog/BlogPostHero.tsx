/*
  Post hero: title, excerpt, hero image. Sits beneath the meta
  header. Headline uses Fraunces per Document 2 typography.
*/

import * as React from 'react';
import Image from 'next/image';
import { Container } from '@/components/Container';
import { cn } from '@/lib/utils';

export interface BlogPostHeroProps {
  title: string;
  excerpt: string;
  heroImage: string;
  heroImageAlt: string;
}

export function BlogPostHero({
  title,
  excerpt,
  heroImage,
  heroImageAlt,
}: BlogPostHeroProps) {
  return (
    <header className="pt-6 pb-section-y-tight">
      <Container width="narrow">
        <h1
          className={cn(
            'font-display text-deep',
            'tracking-display-tight leading-display',
            'text-display-l',
          )}
        >
          {title}
        </h1>
        <p className="mt-5 text-body-xl text-ink/80">{excerpt}</p>
      </Container>

      <Container width="default" className="mt-section-y-tight">
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-[var(--radius)]',
            'aspect-[16/9]',
            'shadow-2',
          )}
        >
          <Image
            src={heroImage}
            alt={heroImageAlt}
            fill
            priority
            sizes="(min-width: 1024px) 1200px, 100vw"
            className="object-cover"
          />
        </div>
      </Container>
    </header>
  );
}
