/*
  Blog index listing per Document 7 §3.5 and §4.

  Renders all posts as cards. No category filter at v1 per the URL
  slug rules ("Skip categories for now"). With 6 launch posts no
  pagination is needed; the BlogPagination component sits in the
  shared toolkit for future use when posts > 9.

  Server component. No client interactivity needed; the listing is
  static at build time.
*/

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/Container';
import { Card, CardCaption } from '@/components/Card';
import { SectionDivider } from '@/components/SectionDivider';
import type { BlogPost } from '@/lib/blog';
import { cn } from '@/lib/utils';
import { t, formatDate } from '@/lib/i18n';

export interface BlogIndexProps {
  posts: BlogPost[];
}

export function BlogIndex({ posts }: BlogIndexProps) {
  return (
    <>
      <section className="pt-section-y-tight pb-section-y-tight">
        <Container width="default" className="text-center">
          <p className="eyebrow">{t('blog', 'indexEyebrow')}</p>
          <h1
            className={cn(
              'mt-4 font-display text-deep',
              'tracking-display-tight leading-display',
              'text-display-l',
            )}
          >
            {t('blog', 'indexHeadline')}
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-body-l text-ink/80">
            {t('blog', 'indexSubheadline')}
          </p>
          <SectionDivider align="center" className="mt-section-y-tight" />
        </Container>
      </section>

      {posts.length === 0 ? (
        <Container width="default" className="pb-section-y">
          <p className="text-center text-body-l text-muted">
            {t('blog', 'indexEmpty')}
          </p>
        </Container>
      ) : (
        <Container width="default" className="pb-section-y">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group"
              >
                <Card variant="image" interactive className="h-full flex flex-col">
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-sm">
                    {post.heroImage && (
                      <Image
                        src={post.heroImage}
                        alt={post.heroImageAlt || post.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 ease-premium group-hover:scale-[1.02]"
                      />
                    )}
                  </div>
                  <div className="mt-3 px-1 flex-1 flex flex-col">
                    <p className="text-body-s text-muted">
                      <time dateTime={post.date}>{formatDate(post.date)}</time>
                      <span className="mx-2" aria-hidden="true">·</span>
                      <span>
                        {post.readingTimeMinutes} {t('blog', 'readingTimeSuffix')}
                      </span>
                    </p>
                    <h2 className="mt-2 font-display text-display-m text-deep tracking-display-tight leading-display">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-body-m text-ink/80 flex-1">
                      {post.excerpt}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      )}
    </>
  );
}
