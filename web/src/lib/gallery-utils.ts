/*
  Gallery filtering, randomization, and lookup helpers per
  Document 6 Sections 3 and 12.

  All functions are pure: they take input arguments and return
  derived values. No side effects, no React state. Components
  consume these from a useState/useMemo wrapper.
*/

import {
  galleryImages,
  type GalleryImage,
  type RoomType,
  type Style,
  ALL_ROOMS,
} from '@/data/gallery';

/*
  Returns all images for a given room. Order preserved from the
  data file so the cycler's "1 of 4" semantics are stable.
*/
export function imagesForRoom(room: RoomType): GalleryImage[] {
  return galleryImages.filter((img) => img.roomType === room);
}

/*
  Returns all images for a given style across rooms. Used by the
  cross-axis style filter to render one tile per room with the
  selected style.
*/
export function imagesForStyle(style: Style): GalleryImage[] {
  return galleryImages.filter((img) => img.style === style);
}

/*
  Returns the first image matching room and style, or undefined if
  the combination has no curated entry. Used when both filters are
  active to render the single matching image.
*/
export function imageForRoomAndStyle(
  room: RoomType,
  style: Style,
): GalleryImage | undefined {
  return galleryImages.find(
    (img) => img.roomType === room && img.style === style,
  );
}

/*
  Returns the unique set of styles populated for a given room. Used
  by the per-tile style cycler to skip empty styles per Document 6
  §3.6 ("counter shows 3 of 4 not 3 of 10").
*/
export function stylesAvailableForRoom(room: RoomType): Style[] {
  const seen = new Set<Style>();
  for (const img of galleryImages) {
    if (img.roomType === room) seen.add(img.style);
  }
  return Array.from(seen);
}

/*
  Returns the unique set of styles populated across all rooms. Used
  by the global style filter to render only options that have at
  least one curated entry.
*/
export function allCuratedStyles(): Style[] {
  const seen = new Set<Style>();
  for (const img of galleryImages) {
    seen.add(img.style);
  }
  return Array.from(seen);
}

/*
  For each of the 9 launch room types, returns one image per the
  caller-provided strategy. Used to render the default 3x3 grid
  with one tile per room.

  Strategies:
    'first'  Returns the first curated image for each room. Stable
             across renders. Useful for SSR.
    'random' Returns a random image for each room. Used post-mount
             to satisfy Document 6 §12 "always updating" feel.
*/
export function tilesPerRoom(
  strategy: 'first' | 'random' = 'first',
): GalleryImage[] {
  return ALL_ROOMS.map((room) => {
    const candidates = imagesForRoom(room);
    if (candidates.length === 0) {
      /* No curated image for this room. Synthesize a placeholder
         entry so the grid still renders 9 tiles. The placeholder
         file is not expected to exist; Next/Image renders alt
         text or a broken state, which is acceptable while
         curation fills in. */
      return {
        id: `${room}-placeholder`,
        filename: '',
        roomType: room,
        style: 'contemporary' as Style,
        description: 'Curated image coming soon.',
        altText: `${room} curated image coming soon.`,
        addedAt: '1970-01-01',
      };
    }
    if (strategy === 'random') {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    return candidates[0];
  });
}

/*
  For a given room, returns the index of the next or previous image
  in the cycle. Wraps around (clicking "next" on the last image
  loops back to the first).
*/
export function nextStyleIndex(
  current: number,
  total: number,
): number {
  if (total <= 0) return 0;
  return (current + 1) % total;
}

export function prevStyleIndex(
  current: number,
  total: number,
): number {
  if (total <= 0) return 0;
  return (current - 1 + total) % total;
}

/*
  Returns a random index different from the current one. Used by
  the per-tile shuffle button. Falls back to the same index if
  the room has only one curated image.
*/
export function shuffleStyleIndex(
  current: number,
  total: number,
): number {
  if (total <= 1) return current;
  let next = Math.floor(Math.random() * total);
  /* Bias against picking the same index. One re-roll is enough;
     for total >= 2 this puts us at a different index in 50%+ of
     cases, and avoids any chance of an infinite loop. */
  if (next === current) {
    next = (next + 1) % total;
  }
  return next;
}
