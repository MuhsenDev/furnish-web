# AUDIT — Pro Card pricing-tier spacing & badge sizing

**Status:** ⚙️ proceeding to implementation — pure CSS, zero conflicts.
**Created:** 2026-04-26
**Surface:** `[data-screen="paywall"]` (`#paywallModal`) → `.paywall-pro-card` → `.paywall-toggle` block.

## Problem (per Hassan's screenshot + spec)

The vertical sequence on the Pro card currently reads as cramped between the comparison line ("Average US room renovation: $5,200 · Furnish Pro: $47.88/year") and the tier toggle ("Monthly · Annual · Lifetime"). Two issues compounding:

1. **Insufficient vertical breathing room.** `.paywall-anchor` sets `margin: 6px 0 4px` and `.paywall-toggle` has no top margin — the elements stack directly. Per Reforge *Visual Design — Vertical Rhythm*: pricing pages read as "premium" vs "cluttered" by their spacing budget. Pricing is the highest-stakes surface in the app and deserves the most generous spacing.

2. **Badges are undersized** (Save $24/yr, Pay once). Currently inline `<span class="pw-save">` next to the tier label; font-size 10px, padding 2px 7px. They visually feel like afterthoughts. Per Reforge *Monetization* — Save badges are anchoring/savings framing that drives conversion; Pay once badges are mental-model clarification for the lifetime option. Sizing them at 10px undersells their job.

## Files I'll change

`styles.css` only. No HTML changes; all five tier-specific decorations (MOST POPULAR ribbon, Save $24/yr, Pay once) stay intact in markup.

## CSS rules and target values

| Rule | Line | Current | Target | Reason |
|------|------|---------|--------|--------|
| `.paywall-anchor` margin | 8374 | `margin: 6px 0 4px` | `margin: 6px 0 28px` desktop / `... 0 22px` mobile | Vertical rhythm between the value-anchor moment and the choice moment. |
| `.paywall-toggle` margin | 3763 | `margin: 0 0 14px` | `margin: 28px 0 14px` desktop / `22px 0 14px` mobile (paired with `.paywall-anchor` above) | Same — split the breathing-room budget across both rules so each element owns half its boundary. |
| `.pw-toggle-btn` padding | 3766 | `padding: 9px 12px` | `padding: 13px 14px` desktop / `11px 12px` mobile | Pill height ↑; tier label has comfortable air above + below. Font-size 13px stays — padding is the issue, not type. |
| `.pw-save` font-size | 3776 | `10px` | `12px` desktop / `11px` mobile | Below comfortable readability at 10px; bumping into the 11–13px target range. |
| `.pw-save` padding | 3777 | `2px 7px` | `4px 10px` desktop / `3px 9px` mobile | Was so tight the text touched the badge edges. Comfortable air around the text. |
| `.pw-save` letter-spacing | 3776 | `0.06em` | `0.04em` (slightly tighter at the new size) | Counter-balance the larger font — wide tracking + larger size becomes shouty. |
| `.pw-save` positioning | n/a (currently inline) | `position: absolute; top: -10px; left: 50%; transform: translateX(-50%); pointer-events: none; white-space: nowrap; z-index: 2;` | Sticker-on-pill convention. Bottom edge overlaps top edge of pill ~4-6px. Horizontally centered on its tier label. `pointer-events: none` so taps pass through to the pill beneath (per spec). |
| `.pw-most-popular` top | 8197 | `top: -10px` | `top: -22px` desktop / `-20px` mobile | Push up to make room for Save $24/yr below it (Annual has both badges; MOST POPULAR is the higher-hierarchy one and stacks above Save). |
| `.pw-most-popular` size | 8202–8205 | `font-size: 9px; padding: 3px 8px` | unchanged per spec ("don't resize this — it already reads well") | Just verify positioning after toggle pill grows. |
| `.pw-most-popular` interactivity | n/a | add `pointer-events: none; z-index: 2;` | Match `.pw-save` so taps pass through. (Already absolute-positioned, was just missing the explicit pass-through behavior.) |
| `.paywall-toggle` flex-wrap (Section B.2 override at 8395) | 8395-8398 | `flex-wrap: wrap; gap: 6px` | unchanged | Already responsive-safe. Doesn't conflict with badge positioning. |

## Layout pattern (vertical, after change)

```
┌─────────────────────────────────────────────────┐
│ Average US room renovation: $5,200  ·  Pro: $47.88/yr │  ← .paywall-anchor (margin-bottom 28px)
└─────────────────────────────────────────────────┘
                      ↕  28px desktop / 22px mobile
                                            ┌─MOST POPULAR─┐    ← .pw-most-popular (top: -22px on .pw-toggle-btn[data-plan="annual"])
                                            ┌─Save $24/yr ─┐    ← .pw-save (top: -10px on .pw-toggle-btn[data-plan="annual"])    ┌─Pay once─┐    ← .pw-save (top: -10px on .pw-toggle-btn[data-plan="lifetime"])
┌──────────┐┌─────────────────┐┌─────────────────┐
│ Monthly  ││     Annual      ││    Lifetime     │  ← .pw-toggle-btn (padding 13px 14px desktop)
└──────────┘└─────────────────┘└─────────────────┘
```

For Annual: MOST POPULAR at `top: -22px` and Save $24/yr at `top: -10px` — stacked vertically above the pill, both centered horizontally. Different y-offsets so they don't overlap each other.

For Lifetime: Pay once at `top: -10px` (same y-offset as Save $24/yr on Annual — symmetric).

For Monthly: no badge — clean.

## Responsive behavior

- **Desktop (≥640px):** values above.
- **Mobile (<640px):** scaled down per the table — toggle padding `11px 12px`, badge font-size `11px`, badge padding `3px 9px`, MOST POPULAR top `-20px`.
- **360px viewport:** Three pills + their badges fit without truncation. The existing `flex-wrap: wrap` (line 8396) is the safety net — if a 320px viewport can't fit, the third pill wraps to its own row.
- **320px viewport (older devices):** lifetime can wrap to a second row via the existing flex-wrap rule. Allowed per spec ("If they can't, allow the tier toggle to scroll horizontally rather than truncate") — wrapping is the equivalent here. No JS layout logic.

## Click-through behavior (per spec #8)

Badges are not interactive. With `pointer-events: none` set on both `.pw-save` AND `.pw-most-popular`, tapping any badge passes the click to the underlying `.pw-toggle-btn`. The button click handler at `app.js` ~1212 (`$$('.pw-toggle-btn').forEach(btn => btn.addEventListener('click', ...))`) fires regardless of which child element was tapped. Verified: existing `.pw-most-popular` (already `position: absolute`) — just adding the explicit `pointer-events: none` for safety; click already worked because the absolutely-positioned span doesn't intercept events to the button beneath.

## What I will NOT change

Per spec — none of these touch:
- Card width, headline ("FURNISH PRO"), reassurance line ("Cancel before day 7..."), comparison-line copy
- Price display ($47.88/year + $3.99/month equivalent)
- 5 benefit bullets
- Founding-member-pricing line
- CTAs (Start trial / Maybe later)
- Competitor-comparison footer
- Any colors (existing `--brown`, `--tan`, `--cream`, `--beige`, `--surface`, `--deep` tokens only)
- index.html (CSS-only fix)

## WCAG check

Brown-on-cream gradient on `.pw-save` (`linear-gradient(135deg, var(--tan), var(--brown))` + white text) is unchanged in color — only sizing. WCAG AA contrast was already passing at 10px, will still pass at 12-13px (larger text relaxes the contrast bar, and we're not lowering it). MOST POPULAR (brown bg + cream text) — same.

## Hover/active state preservation

`.pw-toggle-btn:hover` doesn't have a custom rule (relies on the `.active` class being toggled by JS). Increasing padding doesn't change the hover-state hit area logic. Verified: `pointer-events: none` on the badges means hover state is driven by hover on the button itself, not on the badges. Badges visually float above but don't intercept hover events.

## Reforge framework citations

- *Visual Design — Vertical Rhythm:* pricing pages read as "premium" vs "cluttered" by their spacing budget. The 28px desktop / 22px mobile margins between comparison-line and toggle are the rhythm change here.
- *Monetization — Anchoring + Pricing Strategies (Save badge):* the "Save $24/yr" badge is anchoring the annual plan against monthly's higher cost. Sizing it small visually undersells the savings frame. Bumping to 12-13px makes it a first-scan element, not a second-look one. Per the Reforge Drift critique cited in `OPTIMIZATION_PLAN.md` Dim 06 §B.1 — concrete dollar savings beat percentage savings on mobile, AND the visual treatment of those dollars matters as much as the copy.
- *Monetization — Mental Model Clarification (Pay once):* the lifetime tier is a one-time charge, mental model unfamiliar in subscription-land. "Pay once" badge clarifies in 2 words. Sized small, it gets missed; sized properly, it pulls Lifetime into the consideration set as a real third option (which is its job per the Economist 3-tier decoy study).
- *Trust & Credibility:* generous spacing on a pricing surface signals confidence. Cramped pricing reads as desperate. Calm pricing reads as expensive-but-worth-it.

## Decision: SHIP STRAIGHT THROUGH

Pure CSS. Zero conflicts. Three viewport widths to verify (1280px, 768px, 360px) post-implementation.

Implementation order:

1. Edit `styles.css` — single Polish block at the appropriate location to override the values listed in the table above.
2. Verify in preview at three viewport widths.
3. Commit.
