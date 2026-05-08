/*
  Individual blog post page. Server component. Reads the post
  markdown at build time, renders via next-mdx-remote, wraps in
  the post template (header + hero + disclosure + body + CTA +
  author bio + related posts).

  JSON-LD BlogPosting schema renders inline per Document 7 §16
  build-step requirement.
*/

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypeSlug from 'rehype-slug';
import { Container } from '@/components/Container';
import { BlogDisclosure } from '@/components/blog/BlogDisclosure';
import { BlogPostHeader } from '@/components/blog/BlogPostHeader';
import { BlogPostHero } from '@/components/blog/BlogPostHero';
import { BlogCTABox } from '@/components/blog/BlogCTABox';
import { BlogAuthorBio } from '@/components/blog/BlogAuthorBio';
import { BlogRelatedPosts } from '@/components/blog/BlogRelatedPosts';
import { PostTOC } from '@/components/blog/PostTOC';
import { ReadingProgressBar } from '@/components/blog/ReadingProgressBar';
import { blogMdxComponents } from '@/components/blog/mdx-components';
import {
  getAllBlogPosts,
  getBlogPostBySlug,
  getRelatedPosts,
} from '@/lib/blog';
import { extractH2Headings } from '@/lib/headings';
import { cn } from '@/lib/utils';

interface BlogPostPageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) {
    return { title: 'Post Not Found', robots: { index: false, follow: false } };
  }
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `https://furnish.live/blog/${post.slug}` },
    openGraph: {
      title: `${post.title} | Furnish`,
      description: post.excerpt,
      url: `https://furnish.live/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updatedAt ?? post.date,
      images: [
        {
          url: post.heroImage,
          width: 1200,
          height: 630,
          alt: post.heroImageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  };
}

function BlogPostStructuredData({
  post,
}: {
  post: NonNullable<Awaited<ReturnType<typeof getBlogPostBySlug>>>;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: `https://furnish.live${post.heroImage}`,
    datePublished: post.date,
    dateModified: post.updatedAt ?? post.date,
    author: {
      '@type': 'Person',
      name: post.author === 'hassan-muhsen' ? 'Hassan Muhsen' : 'The Furnish Edit',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Furnish',
      url: 'https://furnish.live',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://furnish.live/blog/${post.slug}`,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.slug, 3);

  /* Extract H2s from the MDX source at build time. The same headings
     get rendered as <h2 id="..."> by rehype-slug below, so the TOC
     links resolve. PostTOC auto-hides if there are fewer than 4. */
  const headings = extractH2Headings(post.content);

  return (
    <>
      {/* Reading progress strip pinned to the viewport top. Scoped
          to the <article> below via the targetSelector default. */}
      <ReadingProgressBar />

      <article>
        <BlogPostStructuredData post={post} />

        <BlogPostHeader
          date={post.date}
          updatedAt={post.updatedAt}
          readingTimeMinutes={post.readingTimeMinutes}
          category={post.category}
        />

        <BlogPostHero
          title={post.title}
          excerpt={post.excerpt}
          heroImage={post.heroImage}
          heroImageAlt={post.heroImageAlt}
        />

        {/* Mobile TOC chip rail. Sticky below the nav. Auto-hides
            via the component's own minHeadings threshold. Hidden on
            lg+ via lg:hidden so the desktop sidebar takes over. */}
        <div className="lg:hidden">
          <PostTOC headings={headings} variant="mobile" />
        </div>

        {/* FTC disclosure renders at the top of the body, before any
            content. Locked, non-optional per Document 7 §5.4. */}
        <Container width="narrow" className="pt-section-y-tight">
          <BlogDisclosure />
        </Container>

        {/* Body grid: on lg+ we lay out the prose centered with the
            TOC on the left as a sticky sidebar. The grid uses
            `[280px_minmax(0,1fr)]` so the prose column gets a
            min-content cap and never overflows. */}
        <Container width="default" className="pb-section-y-tight">
          <div
            className={cn(
              'lg:grid lg:gap-10',
              'lg:grid-cols-[240px_minmax(0,720px)]',
              'lg:justify-center',
            )}
          >
            {/* Desktop TOC sidebar. Auto-hidden when post has fewer
                than 4 H2s (PostTOC's internal threshold). */}
            <aside className="hidden lg:block">
              <PostTOC headings={headings} variant="desktop" />
            </aside>
            <div className="blog-prose min-w-0">
              <MDXRemote
                source={post.content}
                components={blogMdxComponents}
                options={{
                  mdxOptions: {
                    rehypePlugins: [rehypeSlug],
                  },
                }}
              />
            </div>
          </div>
        </Container>

        <BlogCTABox postSlug={post.slug} />

        <BlogAuthorBio author={post.author} />

        <BlogRelatedPosts posts={related} currentSlug={post.slug} />
      </article>
    </>
  );
}
