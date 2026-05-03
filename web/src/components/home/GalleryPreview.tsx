'use client';

/*
  Sample gallery preview per Document 5 Section 3.

  9 tiles in a 3x3 grid (desktop), 2-col tablet, 1-col mobile. Each
  tile shows one curated AI-generated room with caption (room type
  in display font, style in sans, "Designed in 8 seconds" micro).

  Click any tile fires home_gallery_preview_click. Lightbox
  interaction is deferred to Document 6 (which builds the dedicated
  /gallery page with the full lightbox); v1 home page links to the
  gallery page on click.

  Image paths follow Document 4 §8.8 naming: gallery-{idx}-{room}-
  {style}.jpg. Hassan curates the 9 from his existing AI generations.
*/

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/Container';
import { Card, CardCaption } from '@/components/Card';
import { useScrollReveal } from '@/lib/motion';
import { t } from '@/lib/i18n';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface GalleryTile {
  index: number;
  src: string;
  alt: string;
  room: string;
  style: string;
}

const TILES: GalleryTile[] = [
  {
    index: 1,
    src: '/images/gallery/gallery-1-living-room-scandinavian.jpg',
    alt: 'Scandinavian living room with warm woods and a neutral palette, designed by Furnish',
    room: 'Living Room',
    style: 'Scandinavian · Warm Woods',
  },
  {
    index: 2,
    src: '/images/gallery/gallery-2-bedroom-mid-century.jpg',
    alt: 'Mid-century modern bedroom with layered textiles and moody lighting, designed by Furnish',
    room: 'Bedroom',
    style: 'Mid-century Modern',
  },
  {
    index: 3,
    src: '/images/gallery/gallery-3-kitchen-farmhouse.jpg',
    alt: 'Farmhouse kitchen with white cabinetry and herb plants on the counter, designed by Furnish',
    room: 'Kitchen',
    style: 'Farmhouse',
  },
  {
    index: 4,
    src: '/images/gallery/gallery-4-bathroom-contemporary.jpg',
    alt: 'Contemporary spa-style bathroom with stone surfaces, designed by Furnish',
    room: 'Bathroom',
    style: 'Contemporary',
  },
  {
    index: 5,
    src: '/images/gallery/gallery-5-home-office-industrial.jpg',
    alt: 'Industrial home office with leather chair and a mid-century desk, designed by Furnish',
    room: 'Home Office',
    style: 'Industrial',
  },
  {
    index: 6,
    src: '/images/gallery/gallery-6-dining-room-art-deco.jpg',
    alt: 'Art-deco dining room with a statement chandelier in jewel tones, designed by Furnish',
    room: 'Dining Room',
    style: 'Art Deco',
  },
  {
    index: 7,
    src: '/images/gallery/gallery-7-nursery-bohemian.jpg',
    alt: 'Bohemian nursery with soft layered textiles, designed by Furnish',
    room: 'Nursery',
    style: 'Bohemian',
  },
  {
    index: 8,
    src: '/images/gallery/gallery-8-walk-in-closet-contemporary.jpg',
    alt: 'Walk-in closet with brass hardware and built-in shelving, designed by Furnish',
    room: 'Walk-in Closet',
    style: 'Premium Contemporary',
  },
  {
    index: 9,
    src: '/images/gallery/gallery-9-laundry-room-modern-farmhouse.jpg',
    alt: 'Modern farmhouse laundry room with organized storage and warm wood accents, designed by Furnish',
    room: 'Laundry Room',
    style: 'Modern Farmhouse',
  },
];

const galleryCtaClasses = cn(
  'btn-secondary-hover',
  'inline-flex items-center justify-center gap-2',
  'rounded-sm border border-[rgba(43,30,24,0.16)] bg-transparent',
  'px-7 py-3.5 text-body-m font-semibold text-ink',
);

export function GalleryPreview() {
  const sectionRef = useScrollReveal<HTMLElement>({
    yOffset: 30,
    stagger: 0.08,
  });

  const onTileClick = (index: number, room: string) => {
    track('home_gallery_preview_click', { room_index: index, room });
  };

  return (
    <section ref={sectionRef} className="py-section-y" aria-labelledby="gallery-preview-heading">
      <Container width="default">
        <div className="text-center" data-reveal>
          <p className="eyebrow">{t('home', 'galleryEyebrow')}</p>
          <h2
            id="gallery-preview-heading"
            className={cn(
              'mt-3 font-display text-deep',
              'tracking-display-tight leading-display',
              'text-display-l',
            )}
          >
            {t('home', 'galleryHeadline')}
          </h2>
        </div>

        <div className="mt-section-y-tight grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TILES.map((tile) => (
            <Link
              key={tile.index}
              href="/gallery"
              data-reveal
              onClick={() => onTileClick(tile.index, tile.room)}
              className="group gallery-card"
              aria-label={`${tile.room}, ${tile.style}`}
            >
              <Card variant="image" interactive>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm">
                  <Image
                    src={tile.src}
                    alt={tile.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <CardCaption
                  title={tile.room}
                  meta={`${tile.style} · ${t('home', 'galleryDesignedIn')}`}
                />
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-section-y-tight flex justify-center" data-reveal>
          <Link
            href="/gallery"
            onClick={() => track('home_gallery_preview_click', { room_index: 0, target: 'see_full_gallery' })}
            className={galleryCtaClasses}
          >
            {t('home', 'galleryCta')}
          </Link>
        </div>
      </Container>
    </section>
  );
}
