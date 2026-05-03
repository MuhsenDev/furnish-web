'use client';

/*
  Gallery client wrapper. Owns filter state, lightbox state, and the
  URL-fragment sync that lets users deep-link to a specific image.

  Server-side metadata and JSON-LD live in page.tsx; this component
  is the interactive shell.
*/

import * as React from 'react';
import { GalleryHero } from '@/components/gallery/GalleryHero';
import { GalleryFilters } from '@/components/gallery/GalleryFilters';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { GalleryLightbox } from '@/components/gallery/GalleryLightbox';
import { GalleryCTA } from '@/components/gallery/GalleryCTA';
import {
  galleryImages,
  type GalleryImage,
  type RoomType,
  type Style,
} from '@/data/gallery';
import { imagesForRoom } from '@/lib/gallery-utils';
import { track } from '@/lib/analytics';

export function GalleryClient() {
  const [selectedRoom, setSelectedRoom] = React.useState<RoomType | null>(null);
  const [selectedStyle, setSelectedStyle] = React.useState<Style | null>(null);
  const [lightboxImage, setLightboxImage] = React.useState<GalleryImage | null>(
    null,
  );
  const [lightboxSourceRect, setLightboxSourceRect] =
    React.useState<DOMRect | null>(null);

  /* Open the lightbox in response to a tile click. The tile
     captures its image's bounding rect at click time so the
     animation can interpolate from that source position. */
  const handleTileOpen = React.useCallback(
    (image: GalleryImage, sourceRect: DOMRect) => {
      setLightboxImage(image);
      setLightboxSourceRect(sourceRect);
      track('gallery_tile_open', { room: image.roomType, style: image.style });
    },
    [],
  );

  const handleLightboxClose = React.useCallback(() => {
    setLightboxImage(null);
    setLightboxSourceRect(null);
  }, []);

  const handleLightboxNavigate = React.useCallback((nextImage: GalleryImage) => {
    setLightboxImage(nextImage);
    /* Source rect stays as the original tile; the navigation
       crossfade re-uses the lightbox container at the same size. */
  }, []);

  const handleClearFilters = React.useCallback(() => {
    setSelectedRoom(null);
    setSelectedStyle(null);
  }, []);

  /* Honor URL fragment on initial mount: /gallery#<image-id>
     opens the lightbox to that image. */
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    const match = galleryImages.find((img) => img.id === hash);
    if (match) {
      setLightboxImage(match);
      setLightboxSourceRect(null);
    }
  }, []);

  /* Compute the room's curated images for in-lightbox cycling. */
  const lightboxRoomImages = React.useMemo(() => {
    if (!lightboxImage) return [];
    return imagesForRoom(lightboxImage.roomType);
  }, [lightboxImage]);

  return (
    <>
      <GalleryHero />
      <GalleryFilters
        selectedRoom={selectedRoom}
        selectedStyle={selectedStyle}
        onRoomChange={setSelectedRoom}
        onStyleChange={setSelectedStyle}
        onClear={handleClearFilters}
      />
      <GalleryGrid
        selectedRoom={selectedRoom}
        selectedStyle={selectedStyle}
        onTileOpen={handleTileOpen}
      />
      <GalleryCTA />
      <GalleryLightbox
        open={lightboxImage != null}
        image={lightboxImage}
        roomImages={lightboxRoomImages}
        sourceRect={lightboxSourceRect}
        onClose={handleLightboxClose}
        onNavigate={handleLightboxNavigate}
      />
    </>
  );
}
