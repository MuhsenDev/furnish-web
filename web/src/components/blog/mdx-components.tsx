/*
  MDX component map per Document 7 §11. Passed to <MDXRemote /> so
  the post body can use these components inline.

  Default mappings:
    Headings get the Fraunces display treatment plus auto-anchor
    via rehype-slug at the rendering layer.
    Paragraphs get body-l type plus relaxed leading.
    Inline links: external links auto-add rel="noopener sponsored"
    and target="_blank" (Document 10 §3.3); internal links stay
    plain.
    Lists, blockquotes, headings: brand typography.
    Custom components: <ProductCard>, <BlogCTABox>, <BlogDisclosure>
    available for inline embedding.
*/

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { MDXComponents } from 'mdx/types';
import { ProductCard } from './ProductCard';
import { BlogCTABox } from './BlogCTABox';
import { BlogDisclosure } from './BlogDisclosure';
import { cn } from '@/lib/utils';

function isExternal(href: string | undefined): boolean {
  if (!href) return false;
  return /^https?:\/\//i.test(href);
}

export const blogMdxComponents: MDXComponents = {
  /* Display headings */
  h2: (props) => (
    <h2
      className={cn(
        'mt-section-y-tight font-display text-deep',
        'tracking-display-tight leading-display',
        'text-display-m',
      )}
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className={cn(
        'mt-block-y font-display text-deep',
        'tracking-display-tight leading-display',
        'text-body-xl',
      )}
      {...props}
    />
  ),
  h4: (props) => (
    <h4
      className="mt-6 font-sans text-body-l font-semibold text-deep"
      {...props}
    />
  ),

  /* Body text */
  p: (props) => (
    <p
      className="mt-5 text-body-l leading-relaxed text-ink/90"
      {...props}
    />
  ),

  /* Lists */
  ul: (props) => (
    <ul className="mt-5 space-y-2 list-disc pl-6 text-body-l text-ink/90" {...props} />
  ),
  ol: (props) => (
    <ol className="mt-5 space-y-2 list-decimal pl-6 text-body-l text-ink/90" {...props} />
  ),
  li: (props) => <li className="leading-relaxed" {...props} />,

  /* Blockquote, used for editorial pull-quotes */
  blockquote: (props) => (
    <blockquote
      className={cn(
        'my-block-y border-l-2 border-[var(--color-accent)]',
        'pl-5 italic text-body-xl text-deep',
      )}
      {...props}
    />
  ),

  /* Inline links: external auto-target plus rel-sponsored per
     Document 10 §3.3. Internal stays plain. */
  a: ({ href, children, ...props }) => {
    if (isExternal(href)) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener sponsored"
          className="font-semibold text-[var(--color-accent)] underline-offset-4 hover:underline"
          {...props}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href ?? '#'}
        className="font-semibold text-[var(--color-accent)] underline-offset-4 hover:underline"
      >
        {children}
      </Link>
    );
  },

  /* Inline images via plain markdown ![alt](src). Routes through
     Next/Image for optimization. */
  img: ({ src, alt }) => {
    if (!src || typeof src !== 'string') return null;
    return (
      <span className="my-block-y block">
        <Image
          src={src}
          alt={alt || ''}
          width={1200}
          height={750}
          className="rounded-[var(--radius)] w-full h-auto"
        />
      </span>
    );
  },

  /* Custom blog components */
  ProductCard,
  BlogCTABox,
  BlogDisclosure,
};
