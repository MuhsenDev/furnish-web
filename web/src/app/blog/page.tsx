/*
  Blog index page. Server component. Reads all posts at build time
  and passes them to BlogIndex.

  BlogIndex was promoted to a client component in 2026-05 to
  support category filtering via the ?category= URL param. Next.js
  requires useSearchParams calls to live inside a Suspense boundary,
  so this page wraps the listing in <Suspense>. The fallback
  matches the loading shape (centered eyebrow + headline) so
  there's no jarring layout flash before hydration.
*/

import * as React from 'react';
import type { Metadata } from 'next';
import { BlogIndex } from '@/components/blog/BlogIndex';
import { getAllBlogPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'The Furnish Edit',
  description:
    'Design ideas, room inspiration, and shopping guides for real homes at real budgets.',
  alternates: { canonical: 'https://furnish.live/blog' },
  openGraph: {
    title: 'The Furnish Edit | Furnish',
    description:
      'Design ideas, room inspiration, and shopping guides for real homes at real budgets.',
    url: 'https://furnish.live/blog',
  },
};

export default async function BlogIndexPage() {
  const posts = await getAllBlogPosts();
  return (
    <React.Suspense fallback={null}>
      <BlogIndex posts={posts} />
    </React.Suspense>
  );
}
