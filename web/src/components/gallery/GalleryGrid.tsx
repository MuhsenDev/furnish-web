'use client';

/*
  Gallery grid container per Document 6 Sections 3 and 4.

  Three filter modes:
    1. No filters (default):     3x3 grid, one tile per launch room
                                  type, each cycler shows that
                                  room's available styles.
    2. Single room filter:        Collapses to a single expanded tile
                                  with cycler walking that room's
                                  styles.
    3. Single style filter:       3x3 grid stays. Each tile shows the
                                  selected style for its room (skips
                                  rooms that don't have it curated).
                                  Cyclers hidden because the style
                                  is locked.
    4. Both filters:              Single image, no cycler.

  Random shuffle on initial mount per §3.4. Avoids hydration mismatch
  by initializing useState with index 0 and randomizing in useEffect
  after the first paint.
*/

import * as React from 'react';
import { Container } from '@/components/Container';
import { GalleryTile } from './GalleryTile';
import {
  ALL_ROOMS,
  type GalleryImage,
  type RoomType,
  type Style,
} from '@/data/gallery';
import {
  imagesForRoom,
  imageForRoomAndStyle,
  nextStyleIndex,
  prevStyleIndex,
  shuffleStyleIndex,
} from '@/lib/gallery-utils';
import { useScrollReveal } from '@/lib/motion';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

export interface GalleryGridProps {
  selectedRoom: RoomType | null;
  selectedStyle: Style | null;
  onTileOpen: (image: GalleryImage, sourceRect: DOMRect) => void;
}

/*
  Lookup table: per room, the list of curated images. Computed once
  at module level so the per-tile data is stable across renders.
*/
const PER_ROOM_IMAGES: Record<RoomType, GalleryImage[]> = ALL_ROOMS.reduce(
  (acc, room) => {
    acc[room] = imagesForRoom(room);
    return acc;
  },
  {} as Record<RoomType, GalleryImage[]>,
);

export function GalleryGrid({
  selectedRoom,
  selectedStyle,
  onTileOpen,
}: GalleryGridProps) {
  const sectionRef = useScrollReveal<HTMLElement>({
    yOffset: 30,
    stagger: 0.08,
    showImmediatelyIfInView: true,
  });

  /* Per-tile cycler index. Keyed by room type. Initialized to 0 to
     avoid SSR/hydration mismatch; the useEffect below randomizes
     each index after mount per §3.4 "always updating" feel. */
  const [indices, setIndices] = React.useState<Record<RoomType, number>>(
    () =>
      ALL_ROOMS.reduce(
        (acc, room) => {
          acc[room] = 0;
          return acc;
        },
        {} as Record<RoomType, number>,
      ),
  );

  /* Random shuffle per page load. Runs once after mount. */
  React.useEffect(() => {
    setIndices((prev) => {
      const next = { ...prev };
      for (const room of ALL_ROOMS) {
        const total = PER_ROOM_IMAGES[room].length;
        if (total > 0) {
          next[room] = Math.floor(Math.random() * total);
        }
      }
      return next;
    });
  }, []);

  /* Per-room cycle handlers. */
  const cycleNext = (room: RoomType) => {
    setIndices((prev) => ({
      ...prev,
      [room]: nextStyleIndex(prev[room], PER_ROOM_IMAGES[room].length),
    }));
    track('gallery_tile_cycle_next', { room });
  };

  const cyclePrev = (room: RoomType) => {
    setIndices((prev) => ({
      ...prev,
      [room]: prevStyleIndex(prev[room], PER_ROOM_IMAGES[room].length),
    }));
    track('gallery_tile_cycle_prev', { room });
  };

  const cycleShuffle = (room: RoomType) => {
    setIndices((prev) => ({
      ...prev,
      [room]: shuffleStyleIndex(prev[room], PER_ROOM_IMAGES[room].length),
    }));
    track('gallery_tile_shuffle', { room });
  };

  /* Filter mode 4: both filters yield a single image. */
  if (selectedRoom && selectedStyle) {
    const single = imageForRoomAndStyle(selectedRoom, selectedStyle);
    return (
      <section ref={sectionRef} className="py-section-y-tight">
        <Container width="default">
          <div className="mx-auto max-w-2xl" data-reveal>
            {single ? (
              <GalleryTile
                images={[single]}
                currentIndex={0}
                onPrev={() => {}}
                onNext={() => {}}
                onShuffle={() => {}}
                onOpen={onTileOpen}
                showCycler={false}
              />
            ) : (
              <p className="rounded-[var(--radius)] border border-[rgba(43,30,24,0.12)] bg-surface p-8 text-center text-body-l text-muted">
                No image curated for this combination yet.
              </p>
            )}
          </div>
        </Container>
      </section>
    );
  }

  /* Filter mode 2: single room filter. Collapse to one expanded
     tile that walks all curated styles for that room. */
  if (selectedRoom) {
    const roomImages = PER_ROOM_IMAGES[selectedRoom];
    return (
      <section ref={sectionRef} className="py-section-y-tight">
        <Container width="default">
          <div className="mx-auto max-w-2xl" data-reveal>
            <GalleryTile
              images={roomImages}
              currentIndex={indices[selectedRoom] % Math.max(roomImages.length, 1)}
              onPrev={() => cyclePrev(selectedRoom)}
              onNext={() => cycleNext(selectedRoom)}
              onShuffle={() => cycleShuffle(selectedRoom)}
              onOpen={onTileOpen}
              showCycler
            />
          </div>
        </Container>
      </section>
    );
  }

  /* Filter modes 1 and 3: 3x3 grid. Style filter swaps the per-tile
     image source but keeps the layout. */
  return (
    <section ref={sectionRef} className="py-section-y-tight">
      <Container width="default">
        <div
          className={cn(
            'grid gap-4 sm:gap-6',
            'sm:grid-cols-2 lg:grid-cols-3',
          )}
        >
          {ALL_ROOMS.map((room) => {
            const roomImages = PER_ROOM_IMAGES[room];
            let displayImages = roomImages;
            let displayIndex = indices[room];
            let showCycler = true;

            if (selectedStyle) {
              /* Cross-axis filter: only show this style for this room.
                 If the style isn't curated for this room, skip the
                 tile. */
              const filtered = roomImages.filter(
                (img) => img.style === selectedStyle,
              );
              if (filtered.length === 0) return null;
              displayImages = filtered;
              displayIndex = 0;
              showCycler = false;
            }

            return (
              <div key={room} data-reveal>
                <GalleryTile
                  images={displayImages}
                  currentIndex={displayIndex % Math.max(displayImages.length, 1)}
                  onPrev={() => cyclePrev(room)}
                  onNext={() => cycleNext(room)}
                  onShuffle={() => cycleShuffle(room)}
                  onOpen={onTileOpen}
                  showCycler={showCycler}
                />
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
