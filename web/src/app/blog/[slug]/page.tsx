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
import { blogMdxComponents } from '@/components/blog/mdx-components';
import {
  getAllBlogPosts,
  getBlogPostBySlug,
  getRelatedPosts,
} from '@/lib/blog';

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

  return (
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

      {/* FTC disclosure renders at the top of the body, before any
          content. Locked, non-optional per Document 7 §5.4. */}
      <Container width="narrow" className="pt-section-y-tight">
        <BlogDisclosure />
      </Container>

      {/* MDX body rendered with custom component map. */}
      <Container width="narrow" className="pb-section-y-tight">
        <div className="blog-prose">
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
      </Container>

      <BlogCTABox postSlug={post.slug} />

      <BlogAuthorBio author={post.author} />

      <BlogRelatedPosts posts={related} currentSlug={post.slug} />
    </article>
  );
}
