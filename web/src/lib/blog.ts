/*
  Blog data layer stub per Document 4 Section 4F.

  Placeholder. Full implementation arrives in Document 7 (Blog
  Content Plan) and Document 9 (Tech Stack). At Phase 4 the stub
  exists so sitemap.ts can import getAllBlogPosts() without
  breaking the build.

  When Document 7 lands, this module reads markdown files from
  /content/blog/, parses front matter, and returns typed BlogPost
  objects. For now it returns an empty array.
*/

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category?: string;
  heroImage?: string;
  readingTimeMinutes?: number;
}

/*
  Returns all published blog posts. Empty array at v1 until
  Document 7 wires the markdown ingestion.
*/
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  return [];
}

/*
  Looks up a single post by slug. Returns null at v1.
*/
export async function getBlogPostBySlug(_slug: string): Promise<BlogPost | null> {
  return null;
}

/*
  Returns the unique set of categories across all posts. Empty
  at v1.
*/
export async function getAllBlogCategories(): Promise<string[]> {
  return [];
}
