/*
  Plausible analytics helper per Document 4 Section 11.

  The Plausible script (added in src/app/layout.tsx) auto-tracks
  page views and outbound link clicks. This module wraps custom
  event tracking for funnel events that aren't link clicks
  (compare slider drag, scroll depth milestones, waitlist submit).

  Per Document 4 §11.3, no cookies are set. No personal data is
  collected. IP addresses are hashed. The Privacy Policy mentions
  Plausible per the same section.
*/

declare global {
  interface Window {
    /* The Plausible script attaches a callable plausible() function
       to window. We type it loosely so analytics calls do not
       break the build when running locally without the script. */
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

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
  /* Misc */
  | 'compare_slider_engaged'
  | 'gallery_card_click';

/*
  Fire a custom Plausible event. Safe to call before the script
  loads; the call no-ops if window.plausible is unavailable.

    track('cta_click', { location: 'hero', target: 'waitlist' });
*/
export function track(
  event: AnalyticsEvent,
  props: Record<string, string | number> = {},
): void {
  if (typeof window === 'undefined') return;
  if (typeof window.plausible !== 'function') {
    if (process.env.NODE_ENV === 'development') {
      /* eslint-disable-next-line no-console */
      console.debug(`[analytics] Plausible not loaded. Skipped ${event}`, props);
    }
    return;
  }
  window.plausible(event, Object.keys(props).length ? { props } : undefined);
}

/*
  Convenience wrapper for the most common CTA-click event. Pass
  the location of the click (hero, footer, sticky) and the target
  (waitlist, app_store, gallery).
*/
export function trackCtaClick(location: string, target: string): void {
  track('cta_click', { location, target });
}
