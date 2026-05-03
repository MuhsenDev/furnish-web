/*
  Blog data layer per Document 7.

  Reads .mdx files from src/content/blog/, parses frontmatter via
  gray-matter, computes reading time, and exposes typed BlogPost
  objects plus lookup helpers used by:
    - sitemap.ts (URL list)
    - blog index page
    - blog/[slug] page (static params plus per-post render)
    - related-posts component

  All functions run server-side at build time. No client-side data
  fetching. Posts are static.

  At launch, src/content/blog/ contains 6 .mdx files (skeletons
  with frontmatter; conversation-Claude + Hassan fill in real
  content per Document 7 §2 editorial calendar).
*/

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const BLOG_DIR = path.join(process.cwd(), 'src', 'content', 'blog');

export type BlogCategory =
  | 'style-guide'
  | 'product-roundup'
  | 'room-specific'
  | 'comparison'
  | 'trend'
  | 'founder-story';

export interface BlogPostFrontmatter {
  title: string;
  slug: string;
  date: string;
  updatedAt?: string;
  excerpt: string;
  heroImage: string;
  heroImageAlt: string;
  category: BlogCategory;
  author: string;
  tags?: string[];
}

export interface BlogPost extends BlogPostFrontmatter {
  /** Raw MDX body source (post-frontmatter). Rendered by next-mdx-remote. */
  content: string;
  /** Computed reading time string, e.g. "6 min read". */
  readingTime: string;
  /** Computed minutes (rounded). */
  readingTimeMinutes: number;
  /** Word count (rough). */
  wordCount: number;
}

/*
  Read all .mdx files in BLOG_DIR. Returns posts sorted by date
  descending. Used by the blog index and the sitemap.
*/
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const filenames = fs
    .readdirSync(BLOG_DIR)
    .filter((name) => name.endsWith('.mdx') || name.endsWith('.md'));

  const posts = filenames
    .map((filename) => readPostFile(filename))
    .filter((p): p is BlogPost => p != null);

  posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  return posts;
}

/*
  Read a single .mdx file by slug. Returns null if not found.
  Used by the dynamic [slug] route at build time.
*/
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!slug) return null;
  /* Try .mdx first, then .md as fallback. */
  const mdxPath = path.join(BLOG_DIR, `${slug}.mdx`);
  const mdPath = path.join(BLOG_DIR, `${slug}.md`);
  const filename = fs.existsSync(mdxPath)
    ? `${slug}.mdx`
    : fs.existsSync(mdPath)
      ? `${slug}.md`
      : null;
  if (!filename) return null;
  return readPostFile(filename);
}

/*
  Returns the unique set of categories across posts. Empty array
  if categories are not used at v1 per Document 7 URL slug rules.
*/
export async function getAllBlogCategories(): Promise<BlogCategory[]> {
  const posts = await getAllBlogPosts();
  const seen = new Set<BlogCategory>();
  for (const p of posts) seen.add(p.category);
  return Array.from(seen);
}

/*
  Returns the next-N related posts for a given slug. Same category
  preferred; falls through to most-recent siblings if none match.
*/
export async function getRelatedPosts(
  slug: string,
  count = 3,
): Promise<BlogPost[]> {
  const posts = await getAllBlogPosts();
  const current = posts.find((p) => p.slug === slug);
  if (!current) return [];

  const sameCategory = posts.filter(
    (p) => p.slug !== slug && p.category === current.category,
  );
  const others = posts.filter(
    (p) => p.slug !== slug && p.category !== current.category,
  );
  return [...sameCategory, ...others].slice(0, count);
}

function readPostFile(filename: string): BlogPost | null {
  try {
    const fullPath = path.join(BLOG_DIR, filename);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const { data, content } = matter(raw);

    const frontmatter = data as BlogPostFrontmatter;
    if (!frontmatter.slug || !frontmatter.title || !frontmatter.date) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[blog] Post ${filename} missing required frontmatter (slug, title, date). Skipping.`,
        );
      }
      return null;
    }

    const stats = readingTime(content);
    return {
      ...frontmatter,
      content,
      readingTime: stats.text,
      readingTimeMinutes: Math.max(1, Math.round(stats.minutes)),
      wordCount: stats.words,
    };
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[blog] Failed to read ${filename}:`, err);
    }
    return null;
  }
}
