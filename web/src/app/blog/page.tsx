/*
  Blog index page. Server component. Reads all posts at build time
  and passes them to BlogIndex.
*/

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
  return <BlogIndex posts={posts} />;
}
