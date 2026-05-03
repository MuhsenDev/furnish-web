/*
  Dynamic sitemap per Document 4 Section 10.2.

  Lists every static marketing page plus dynamic blog posts.
  Auto-builds at deploy time. Submitted to Google Search Console
  and Bing Webmaster Tools at launch.

  At v1, getAllBlogPosts() returns []. When Document 7 wires the
  markdown ingestion, blog posts append automatically.
*/

import type { MetadataRoute } from 'next';
import { getAllBlogPosts } from '@/lib/blog';

const SITE_URL = 'https://furnish.live';

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: 'weekly' | 'monthly' | 'yearly';
  priority: number;
}> = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/how-it-works', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/gallery', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const posts = await getAllBlogPosts();
  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticEntries, ...blogEntries];
}
