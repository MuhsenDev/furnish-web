'use client';

/*
  Product card per Document 7 §4.1 to §4.7. Wirecutter-style layout:
  product image left (1:1 ratio), text right (name + retailer + price
  + 60-100 word editorial paragraph + CTA button).

  Outbound link uses target="_blank" rel="noopener sponsored" per
  Document 10 §3.3. The Skimlinks SDK wraps the URL at runtime once
  enabled; markdown ships with plain retailer URLs.

  Price format: US dollars no cents ("$399"). Sale support via
  optional originalPrice prop renders strike-through.

  Fires blog_product_card_click on click for funnel attribution.
*/

import * as React from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { track } from '@/lib/analytics';

export interface ProductCardProps {
  name: string;
  retailer: string;
  price: number;
  /** Optional pre-sale price. Strikes through when present. */
  originalPrice?: number;
  productUrl: string;
  imageSrc: string;
  imageAlt: string;
  /** Editorial paragraph (60 to 100 words). */
  children: React.ReactNode;
  /** Optional post slug for analytics attribution. */
  postSlug?: string;
}

function formatPrice(amount: number): string {
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function ProductCard({
  name,
  retailer,
  price,
  originalPrice,
  productUrl,
  imageSrc,
  imageAlt,
  children,
  postSlug,
}: ProductCardProps) {
  const onClick = () => {
    track('blog_product_card_click', {
      product: name,
      retailer,
      ...(postSlug ? { post: postSlug } : {}),
    });
  };

  return (
    <div
      className={cn(
        'my-section-y-tight grid gap-5',
        'sm:grid-cols-[200px_1fr] sm:gap-6',
        'lg:grid-cols-[260px_1fr] lg:gap-8',
        'rounded-[var(--radius)] border border-[rgba(43,30,24,0.08)]',
        'bg-surface p-4 sm:p-5 lg:p-6',
        'shadow-1',
      )}
    >
      {/* Image, 1:1 aspect */}
      <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-sm)] bg-beige">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(min-width: 1024px) 260px, (min-width: 640px) 200px, 100vw"
          className="object-cover"
        />
      </div>

      {/* Text column */}
      <div className="flex flex-col">
        <p className="eyebrow">
          {retailer}
        </p>
        <h3
          className={cn(
            'mt-1 font-display tracking-display-tight leading-display',
            'text-body-xl text-deep',
            'sm:text-display-m sm:text-[1.5rem]',
          )}
        >
          {name}
        </h3>

        <div className="mt-2 flex items-baseline gap-2">
          {originalPrice != null && originalPrice > price && (
            <span
              className="text-body-m text-muted line-through"
              aria-label={`Original price ${formatPrice(originalPrice)}`}
            >
              {formatPrice(originalPrice)}
            </span>
          )}
          <span className="text-body-l font-semibold text-[var(--color-accent)]">
            {formatPrice(price)}
          </span>
        </div>

        <div className="mt-3 text-body-m leading-relaxed text-ink/85">
          {children}
        </div>

        <div className="mt-4">
          <a
            href={productUrl}
            target="_blank"
            rel="noopener sponsored"
            onClick={onClick}
            className={cn(
              'btn-primary-hover',
              'inline-flex items-center justify-center gap-2',
              'rounded-sm bg-[var(--color-accent)] text-cream',
              'px-5 py-2.5 text-body-s font-semibold',
              'shadow-1',
            )}
          >
            {t('blog', 'productCardCtaPrefix')} {retailer}
            <ArrowUpRight size={16} strokeWidth={1.75} />
          </a>
        </div>
      </div>
    </div>
  );
}
