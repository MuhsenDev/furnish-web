/*
  Vercel Analytics helper.

  The Vercel Analytics components (added in src/app/layout.tsx)
  auto-track page views and (via Speed Insights) Core Web Vitals.
  This module wraps the package's track() function for funnel
  events that are not page views (CTA clicks, slider drags,
  waitlist submits, etc.).

  Per Vercel Analytics' privacy model, no cookies are set, no
  cross-site tracking, IP addresses are not stored. The Privacy
  Policy at src/content/legal/privacy.md mentions this.

  Activation: Vercel Analytics is enabled at the project level in
  the Vercel dashboard (Project Settings > Analytics > Enable).
  No env var. Speed Insights is enabled the same way.
*/

import { track as vercelTrack } from '@vercel/analytics';

export type AnalyticsEvent =
  /* Site-wide */
  | 'cta_click'
  | 'menu_open'
  | 'menu_link_click'
  | 'scroll_depth'
  /* Home-page-specific (Document 5 Section 12) */
  | 'home_hero_cta_click'
  | 'home_secondary_cta_click'
  | 'home_gallery_preview_click'
  | 'home_compare_slider_interaction'
  | 'home_how_it_works_section_view'
  | 'home_comparison_table_view'
  | 'home_founder_note_view'
  | 'home_final_cta_click'
  | 'home_email_waitlist_submit'
  /* Waitlist outcomes */
  | 'waitlist_success'
  | 'waitlist_error'
  /* Gallery (Document 6 Section 3.9) */
  | 'gallery_filter_room_apply'
  | 'gallery_filter_style_apply'
  | 'gallery_filter_clear'
  | 'gallery_tile_cycle_next'
  | 'gallery_tile_cycle_prev'
  | 'gallery_tile_shuffle'
  | 'gallery_tile_open'
  /* Blog (Document 7) */
  | 'blog_post_view'
  | 'blog_product_card_click'
  | 'blog_cta_click'
  | 'blog_related_post_click'
  /* Misc */
  | 'compare_slider_engaged'
  | 'gallery_card_click';

/*
  Fire a custom Vercel Analytics event. Safe to call before the
  Analytics component mounts; the SDK's track() is a no-op until
  hydration completes.

    track('cta_click', { location: 'hero', target: 'waitlist' });
*/
export function track(
  event: AnalyticsEvent,
  props: Record<string, string | number> = {},
): void {
  if (typeof window === 'undefined') return;
  try {
    if (Object.keys(props).length === 0) {
      vercelTrack(event);
    } else {
      vercelTrack(event, props);
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      /* eslint-disable-next-line no-console */
      console.debug(`[analytics] track failed for ${event}`, err);
    }
  }
}

/*
  Convenience wrapper for the most common CTA-click event. Pass
  the location of the click (hero, footer, sticky) and the target
  (waitlist, app_store, gallery).
*/
export function trackCtaClick(location: string, target: string): void {
  track('cta_click', { location, target });
}
