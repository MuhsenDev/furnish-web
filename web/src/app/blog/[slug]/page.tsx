import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PagePlaceholder } from '@/components/shared/PagePlaceholder';
import { getBlogPostBySlug } from '@/lib/blog';

interface BlogPostPageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) {
    return {
      title: 'Post Not Found',
      robots: { index: false, follow: false },
    };
  }
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `https://furnish.live/blog/${post.slug}` },
    openGraph: {
      title: `${post.title} | Furnish`,
      description: post.description,
      url: `https://furnish.live/blog/${post.slug}`,
      type: 'article',
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPostBySlug(params.slug);

  /* Until Document 7 wires the markdown ingestion, every slug
     resolves to null. 404 here so search engines do not catalog
     missing posts. */
  if (!post) {
    notFound();
  }

  return (
    <PagePlaceholder
      eyebrow="Blog"
      title={post.title}
      description={post.description}
      arrivesIn="Document 7 (Blog Content Plan)"
    />
  );
}
