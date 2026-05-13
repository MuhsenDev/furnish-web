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
import { Accordion, type AccordionItem } from '@/components/shared/Accordion';
import { cn } from '@/lib/utils';

/* <FAQ> shortcode: lets MDX authors write
     <FAQ items={[
       { id: 'q-pets', question: 'Will velvet hold up with a cat?',
         answer: 'Performance velvet, yes. ...' },
       ...
     ]} />
   in a blog post and get the same SSR-safe accordion the rest of
   the site uses. Items array is typed to AccordionItem so authors
   get autocomplete + type checking through MDX type inference. */
function FAQ({ items }: { items: AccordionItem[] }) {
  return (
    <div className="my-block-y">
      <Accordion items={items} />
    </div>
  );
}

/* <PullQuote> richer named component for editorial pull quotes
   that need optional attribution and larger typographic weight
   than plain markdown blockquote.

   Usage in MDX:
     <PullQuote>
       Quotes from interior designers that cost more than a car
       payment.
     </PullQuote>

     <PullQuote attribution="Hassan Muhsen, founder">
       I'd rather build than wait for someone else to do it.
     </PullQuote>

   Plain markdown `> ...` blockquotes still render as the smaller
   left-bordered pull quote via the `blockquote` mapping below.
   <PullQuote> is the larger "magazine pull quote" treatment with
   generous vertical padding and the option of an attribution line. */
function PullQuote({
  children,
  attribution,
}: {
  children: React.ReactNode;
  attribution?: string;
}) {
  return (
    <figure
      className={cn(
        'my-block-y border-l-2 border-[var(--color-accent)]',
        'pl-6 py-2',
      )}
    >
      <blockquote
        className={cn(
          'font-display text-display-m italic text-deep',
          'leading-display tracking-display-tight',
        )}
      >
        {children}
      </blockquote>
      {attribution ? (
        <figcaption className="mt-3 text-body-s uppercase tracking-[0.1em] text-muted">
          {attribution}
        </figcaption>
      ) : null}
    </figure>
  );
}

/* <InlineImage> richer named component for editorial inline
   imagery with an italic caption underneath, per the PIN-UP
   Magazine pattern referenced in the 2026-05-13 design review.

   Usage in MDX:
     <InlineImage
       src="/images/blog/sven-walnut-detail.jpg"
       alt="Detail of Sven 88 inch tufted sofa in walnut"
       caption="Sven 88 inch Tufted Leather Sofa in Charme Tan, from Article."
     />

   Plain markdown ![alt](src) still renders via the `img` mapping
   below (no caption, no extra weight). <InlineImage> is the
   "this image deserves to be called out" treatment. */
function InlineImage({
  src,
  alt,
  caption,
  width = 1200,
  height = 750,
}: {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}) {
  return (
    <figure className="my-block-y">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="rounded-[var(--radius)] w-full h-auto"
      />
      {caption ? (
        <figcaption className="mt-3 text-body-s italic text-muted leading-relaxed">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

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
  FAQ,
  PullQuote,
  InlineImage,
};
