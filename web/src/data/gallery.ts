/*
  Gallery image inventory per Document 6 Section 7.

  Source of truth for /gallery content. Hassan owns this file
  post-launch and edits it directly when refreshing curation.

  Launch target: 36 entries (9 rooms x 4 styles per room) per
  Document 6 §3.6 and §7.1.

  Theoretical max: 90 entries (9 rooms x 10 styles). Empty styles
  per room are skipped by the cycler; counter shows "3 of 4" not
  "3 of 10" per §3.6.

  Naming convention: gallery-[room]-[style]-[index].png. Index lets
  the same room/style pair have multiple curated takes; the cycler
  treats them as separate entries.

  Filenames assume images live at public/images/gallery/. Files do
  not exist yet. Hassan curates from his existing AI generations and
  drops them into public/images/gallery/. Until images arrive, the
  data structure renders the cycler skeleton without throwing.
*/

export type RoomType =
  | 'living'
  | 'bedroom'
  | 'kitchen'
  | 'bathroom'
  | 'home-office'
  | 'dining'
  | 'nursery'
  | 'walk-in-closet'
  | 'laundry';

export type Style =
  | 'scandinavian'
  | 'mid-century'
  | 'industrial'
  | 'bohemian'
  | 'farmhouse'
  | 'contemporary'
  | 'art-deco'
  | 'minimalist'
  | 'traditional'
  | 'eclectic';

export type Vibe =
  | 'calm-grounded'
  | 'energized-creative'
  | 'cozy-protected'
  | 'elevated-hotel'
  | 'inspired-artist';

export interface GalleryImage {
  id: string;
  filename: string;
  roomType: RoomType;
  style: Style;
  /** Short caption used in the lightbox below the room/style title. */
  description: string;
  /** Full alt text, format: "[Style] [room] designed by Furnish AI. <scene>." */
  altText: string;
  /** Maps to the app's vibe vocabulary. Optional. */
  vibe?: Vibe;
  /** ISO date the image was added. Used for "newest first" sort. */
  addedAt: string;
}

/* Display labels per locked vocabulary in Document 6 Appendix A. */
export const ROOM_LABELS: Record<RoomType, string> = {
  living: 'Living Room',
  bedroom: 'Bedroom',
  kitchen: 'Kitchen',
  bathroom: 'Bathroom',
  'home-office': 'Home Office',
  dining: 'Dining Room',
  nursery: 'Nursery',
  'walk-in-closet': 'Walk-in Closet',
  laundry: 'Laundry Room',
};

export const STYLE_LABELS: Record<Style, string> = {
  scandinavian: 'Scandinavian',
  'mid-century': 'Mid-century Modern',
  industrial: 'Industrial',
  bohemian: 'Bohemian',
  farmhouse: 'Farmhouse',
  contemporary: 'Contemporary',
  'art-deco': 'Art Deco',
  minimalist: 'Minimalist',
  traditional: 'Traditional',
  eclectic: 'Eclectic',
};

export const ALL_ROOMS: RoomType[] = [
  'living',
  'bedroom',
  'kitchen',
  'bathroom',
  'home-office',
  'dining',
  'nursery',
  'walk-in-closet',
  'laundry',
];

export const ALL_STYLES: Style[] = [
  'scandinavian',
  'mid-century',
  'industrial',
  'bohemian',
  'farmhouse',
  'contemporary',
  'art-deco',
  'minimalist',
  'traditional',
  'eclectic',
];

/*
  36 launch entries. Per Document 6 §7.1, Hassan picks 4 styles per
  room aiming for visual diversity. Document 6 explicitly defines
  the 4 styles for living-room and bedroom; the other 7 rooms are
  filled here with reasonable defaults pending Hassan's review.

  Description and altText use placeholder text that Hassan refines
  per image once curation is complete.
*/

function entry(
  roomType: RoomType,
  style: Style,
  description: string,
  altText: string,
  vibe?: Vibe,
): GalleryImage {
  const id = `${roomType}-${style}-01`;
  return {
    id,
    filename: `/images/gallery/gallery-${roomType}-${style}-01.png`,
    roomType,
    style,
    description,
    altText,
    vibe,
    addedAt: '2026-05-03',
  };
}

export const galleryImages: GalleryImage[] = [
  /* Living Room (4 styles per Doc 6 §7.1) */
  entry(
    'living',
    'scandinavian',
    'Warm woods, white walls, a soft linen sofa, and a Persian rug.',
    'Scandinavian living room designed by Furnish AI. White walls, warm wood floors, soft linen sofa, and a Persian rug.',
    'calm-grounded',
  ),
  entry(
    'living',
    'mid-century',
    'Leather sofa, brass details, walnut credenza, geometric prints.',
    'Mid-century modern living room designed by Furnish AI. Leather sofa, brass accents, walnut credenza, and geometric wall art.',
    'elevated-hotel',
  ),
  entry(
    'living',
    'bohemian',
    'Layered textiles, cascading plants, vintage Persian rug.',
    'Bohemian living room designed by Furnish AI. Layered textiles, cascading plants, and a vintage Persian rug under a low sofa.',
    'inspired-artist',
  ),
  entry(
    'living',
    'contemporary',
    'Clean lines, neutral palette, sculptural lighting.',
    'Contemporary living room designed by Furnish AI. Clean lines, a neutral palette, and a sculptural pendant fixture overhead.',
    'elevated-hotel',
  ),

  /* Bedroom (4 styles per Doc 6 §7.1) */
  entry(
    'bedroom',
    'mid-century',
    'Low platform bed, walnut nightstands, framed prints.',
    'Mid-century modern bedroom designed by Furnish AI. Low platform bed in walnut, framed art over the headboard, and warm pendant lighting.',
    'elevated-hotel',
  ),
  entry(
    'bedroom',
    'art-deco',
    'Jewel tones, brass details, patterned headboard.',
    'Art deco bedroom designed by Furnish AI. Jewel-tone bedding, brass nightstand details, and a patterned upholstered headboard.',
    'elevated-hotel',
  ),
  entry(
    'bedroom',
    'farmhouse',
    'White linens, exposed beams, vintage decor.',
    'Farmhouse bedroom designed by Furnish AI. White linens, exposed wood ceiling beams, vintage nightstand, and dried botanical accents.',
    'cozy-protected',
  ),
  entry(
    'bedroom',
    'minimalist',
    'Clean palette, low decoration, soft natural light.',
    'Minimalist bedroom designed by Furnish AI. Clean palette, restrained decoration, low platform bed, and soft natural light through linen curtains.',
    'calm-grounded',
  ),

  /* Kitchen (4 styles, default selection pending Hassan review) */
  entry(
    'kitchen',
    'farmhouse',
    'White cabinetry, butcher block, herb plants on the counter.',
    'Farmhouse kitchen designed by Furnish AI. White cabinetry, butcher-block island, hanging copper pots, and herb plants along the windowsill.',
    'cozy-protected',
  ),
  entry(
    'kitchen',
    'scandinavian',
    'Warm wood floors, white walls, brushed brass fixtures.',
    'Scandinavian kitchen designed by Furnish AI. Warm wood floors, white walls, brushed brass fixtures, and matte ceramic ware on open shelves.',
    'calm-grounded',
  ),
  entry(
    'kitchen',
    'contemporary',
    'Sleek slab cabinets, integrated appliances, sculptural pendant.',
    'Contemporary kitchen designed by Furnish AI. Sleek slab cabinets, integrated appliances, and a single sculptural pendant over the island.',
    'elevated-hotel',
  ),
  entry(
    'kitchen',
    'industrial',
    'Cage pendant lights, blackened steel hardware, exposed brick.',
    'Industrial kitchen designed by Furnish AI. Cage pendant lights, blackened steel hardware, exposed brick wall, and a butcher-block island.',
    'energized-creative',
  ),

  /* Bathroom (4 styles, default selection) */
  entry(
    'bathroom',
    'contemporary',
    'Spa-feel stone surfaces, clean glass, integrated vanity lighting.',
    'Contemporary bathroom designed by Furnish AI. Spa-style stone surfaces, frameless glass shower, and integrated lighting around the vanity mirror.',
    'elevated-hotel',
  ),
  entry(
    'bathroom',
    'minimalist',
    'Pale palette, low ornament, single statement fixture.',
    'Minimalist bathroom designed by Furnish AI. Pale palette, low ornament, single statement faucet, and a slim freestanding tub.',
    'calm-grounded',
  ),
  entry(
    'bathroom',
    'scandinavian',
    'Warm wood vanity, white tile, soft linen towels.',
    'Scandinavian bathroom designed by Furnish AI. Warm wood vanity, white wall tile, soft linen towels, and a small potted plant on the windowsill.',
    'calm-grounded',
  ),
  entry(
    'bathroom',
    'art-deco',
    'Hollywood-bulb mirror, brass fixtures, geometric tile.',
    'Art deco bathroom designed by Furnish AI. Hollywood-bulb mirror, brass fixtures, and bold geometric floor tile.',
    'elevated-hotel',
  ),

  /* Home Office (4 styles, default selection) */
  entry(
    'home-office',
    'industrial',
    'Leather chair, mid-century desk, Edison bulb pendants.',
    'Industrial home office designed by Furnish AI. Leather task chair, mid-century walnut desk, and Edison-bulb pendant cluster overhead.',
    'energized-creative',
  ),
  entry(
    'home-office',
    'mid-century',
    'Walnut desk, brass task lamp, framed prints.',
    'Mid-century modern home office designed by Furnish AI. Walnut desk, brass articulating task lamp, and framed prints behind the chair.',
    'inspired-artist',
  ),
  entry(
    'home-office',
    'contemporary',
    'Floating shelves, neutral palette, single sculptural pendant.',
    'Contemporary home office designed by Furnish AI. Floating shelves, neutral palette, and a single sculptural pendant over the desk.',
    'calm-grounded',
  ),
  entry(
    'home-office',
    'scandinavian',
    'Pale wood desk, white walls, soft natural light.',
    'Scandinavian home office designed by Furnish AI. Pale wood desk, white walls, soft natural light, and a single potted plant on the desk.',
    'calm-grounded',
  ),

  /* Dining Room (4 styles, default selection) */
  entry(
    'dining',
    'art-deco',
    'Statement chandelier, jewel tones, polished brass.',
    'Art deco dining room designed by Furnish AI. Statement crystal chandelier, jewel-tone upholstered chairs, and polished brass details.',
    'elevated-hotel',
  ),
  entry(
    'dining',
    'traditional',
    'Polished wood table, upholstered chairs, gallery wall.',
    'Traditional dining room designed by Furnish AI. Polished wood table, upholstered chairs, and a gallery wall behind the credenza.',
    'cozy-protected',
  ),
  entry(
    'dining',
    'mid-century',
    'Round walnut table, sculptural pendant, modern dining chairs.',
    'Mid-century modern dining room designed by Furnish AI. Round walnut table, sculptural pendant overhead, and a sideboard with framed graphic prints.',
    'inspired-artist',
  ),
  entry(
    'dining',
    'farmhouse',
    'Reclaimed wood table, mismatched chairs, linen runner.',
    'Farmhouse dining room designed by Furnish AI. Reclaimed wood table, mismatched chairs, linen runner, and a wrought-iron pendant above.',
    'cozy-protected',
  ),

  /* Nursery (4 styles, default selection) */
  entry(
    'nursery',
    'bohemian',
    'Soft layered textiles, woven baskets, rattan accents.',
    'Bohemian nursery designed by Furnish AI. Soft layered textiles, woven storage baskets, rattan accents, and a low-profile crib.',
    'cozy-protected',
  ),
  entry(
    'nursery',
    'scandinavian',
    'White walls, warm wood crib, soft pastel decor.',
    'Scandinavian nursery designed by Furnish AI. White walls, warm wood crib, soft pastel decor, and a sheepskin draped over the rocker.',
    'calm-grounded',
  ),
  entry(
    'nursery',
    'minimalist',
    'Clean palette, low decoration, single mobile over crib.',
    'Minimalist nursery designed by Furnish AI. Clean palette, low decoration, soft natural light, and a single mobile over the crib.',
    'calm-grounded',
  ),
  entry(
    'nursery',
    'farmhouse',
    'Whitewashed wood, vintage rocking chair, soft prints.',
    'Farmhouse nursery designed by Furnish AI. Whitewashed wood crib, vintage rocking chair, and soft botanical prints on the wall.',
    'cozy-protected',
  ),

  /* Walk-in Closet (4 styles, default selection) */
  entry(
    'walk-in-closet',
    'contemporary',
    'Built-in shelving, brass hardware, full-length mirror.',
    'Walk-in closet designed by Furnish AI. Built-in shelving, brass hardware, full-length mirror, and a small upholstered bench in the center.',
    'elevated-hotel',
  ),
  entry(
    'walk-in-closet',
    'minimalist',
    'Pale palette, restrained ornament, integrated lighting.',
    'Minimalist walk-in closet designed by Furnish AI. Pale palette, restrained ornament, integrated shelf lighting, and a single bench.',
    'calm-grounded',
  ),
  entry(
    'walk-in-closet',
    'art-deco',
    'Patterned wallpaper, mirrored vanity, statement pendant.',
    'Art deco walk-in closet designed by Furnish AI. Patterned wallpaper, mirrored vanity, statement pendant, and a velvet-upholstered bench.',
    'elevated-hotel',
  ),
  entry(
    'walk-in-closet',
    'traditional',
    'Polished wood millwork, paneled doors, brass pulls.',
    'Traditional walk-in closet designed by Furnish AI. Polished wood millwork, paneled cabinet doors, brass pulls, and a tufted bench.',
    'cozy-protected',
  ),

  /* Laundry Room (4 styles, default selection) */
  entry(
    'laundry',
    'farmhouse',
    'White cabinetry, apron sink, woven hampers.',
    'Farmhouse laundry room designed by Furnish AI. White cabinetry, apron sink, woven hampers, and warm wood shelving above the appliances.',
    'cozy-protected',
  ),
  entry(
    'laundry',
    'scandinavian',
    'Pale palette, brushed brass fixtures, drying rack.',
    'Scandinavian laundry room designed by Furnish AI. Pale palette, brushed brass fixtures, ceiling-mounted drying rack, and matte ceramic storage.',
    'calm-grounded',
  ),
  entry(
    'laundry',
    'contemporary',
    'Slab cabinetry, integrated lighting, organized storage.',
    'Contemporary laundry room designed by Furnish AI. Slab cabinetry, integrated lighting, organized labeled storage, and a folding counter.',
    'calm-grounded',
  ),
  entry(
    'laundry',
    'industrial',
    'Blackened steel shelving, exposed pipes, concrete floor.',
    'Industrial laundry room designed by Furnish AI. Blackened steel shelving, exposed pipes, concrete floor, and Edison bulb sconces.',
    'energized-creative',
  ),
];
