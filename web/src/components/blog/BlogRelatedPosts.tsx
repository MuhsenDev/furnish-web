'use client';

/*
  Related posts (3 cards) at the bottom of each post. Same-category
  preferred, falls back to most-recent siblings.

  Tracks blog_related_post_click on each card click.
*/

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/Container';
import { Card, CardCaption } from '@/components/Card';
import type { BlogPost } from '@/lib/blog';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { track } from '@/lib/analytics';

export interface BlogRelatedPostsProps {
  posts: BlogPost[];
  /** The current post slug, for analytics attribution. */
  currentSlug?: string;
}

export function BlogRelatedPosts({
  posts,
  currentSlug,
}: BlogRelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <Container width="default" className="my-section-y">
      <h2
        className={cn(
          'mb-section-y-tight font-display text-deep',
          'tracking-display-tight leading-display',
          'text-display-m',
        )}
      >
        {t('blog', 'relatedHeading')}
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            onClick={() =>
              track('blog_related_post_click', {
                from: currentSlug ?? 'unknown',
                to: post.slug,
              })
            }
            className="group"
          >
            <Card variant="image" interactive>
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
              <CardCaption
                title={post.title}
                meta={`${post.readingTimeMinutes} ${t('blog', 'readingTimeSuffix')}`}
              />
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
