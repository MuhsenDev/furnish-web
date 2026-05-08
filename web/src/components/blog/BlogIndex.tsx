'use client';

/*
  Blog index listing per Document 7 §3.5 and §4.

  Server-fetched posts arrive via props; this client component owns
  the active-category state derived from the ?category= URL param
  and the layout-animated post grid.

  Category buckets are defined in BlogCategoryNav.tsx so the bucket
  taxonomy lives next to its renderer; postMatchesBucket maps an
  MDX frontmatter `category` value to the active bucket slug.
*/

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/Container';
import { Card } from '@/components/Card';
import { SectionDivider } from '@/components/SectionDivider';
import {
  BlogCategoryNav,
  CATEGORY_BUCKETS,
  postMatchesBucket,
  type CategoryBucketSlug,
} from './BlogCategoryNav';
import type { BlogPost } from '@/lib/blog';
import { cn } from '@/lib/utils';
import { t, formatDate } from '@/lib/i18n';

export interface BlogIndexProps {
  posts: BlogPost[];
}

const VALID_BUCKETS: CategoryBucketSlug[] = CATEGORY_BUCKETS.map((b) => b.slug);

function isValidBucket(value: string | null | undefined): value is CategoryBucketSlug {
  return value != null && (VALID_BUCKETS as string[]).includes(value);
}

export function BlogIndex({ posts }: BlogIndexProps) {
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  const activeBucket: CategoryBucketSlug = React.useMemo(() => {
    const raw = searchParams?.get('category');
    return isValidBucket(raw) ? raw : 'all';
  }, [searchParams]);

  /* Counts per bucket so the pills can show "(3)" badges. Computed
     once per posts change; doesn't depend on the active filter. */
  const counts = React.useMemo(() => {
    const result: Record<CategoryBucketSlug, number> = {
      all: posts.length,
      'style-guides': 0,
      'buying-guides': 0,
      'style-stories': 0,
      trends: 0,
    };
    for (const p of posts) {
      for (const b of CATEGORY_BUCKETS) {
        if (b.slug === 'all') continue;
        if (postMatchesBucket(p.category, b.slug)) {
          result[b.slug] += 1;
        }
      }
    }
    return result;
  }, [posts]);

  const filteredPosts = React.useMemo(() => {
    if (activeBucket === 'all') return posts;
    return posts.filter((p) => postMatchesBucket(p.category, activeBucket));
  }, [posts, activeBucket]);

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

      {/* Category pill nav. Sticky so users keep access while
          scrolling the post grid. */}
      <div
        className={cn(
          'sticky top-16 z-20 sm:top-20',
          'border-b border-[rgba(43,30,24,0.08)]',
          'bg-cream/85 backdrop-blur-md',
          'py-3 sm:py-4',
        )}
      >
        <Container width="default">
          <BlogCategoryNav active={activeBucket} counts={counts} />
        </Container>
      </div>

      {posts.length === 0 ? (
        <Container width="default" className="pb-section-y">
          <p className="text-center text-body-l text-muted">
            {t('blog', 'indexEmpty')}
          </p>
        </Container>
      ) : filteredPosts.length === 0 ? (
        <Container width="default" className="py-section-y">
          <p className="text-center text-body-l text-muted">
            {t('blog', 'indexEmptyForCategory')}
          </p>
        </Container>
      ) : (
        <Container width="default" className="pt-section-y-tight pb-section-y">
          <motion.div
            layout={prefersReducedMotion ? false : true}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredPosts.map((post) => (
                <motion.div
                  key={post.slug}
                  layout={prefersReducedMotion ? false : true}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: 8 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -8 }
                  }
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
                  }
                >
                  <Link href={`/blog/${post.slug}`} className="group block h-full">
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
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </Container>
      )}
    </>
  );
}
