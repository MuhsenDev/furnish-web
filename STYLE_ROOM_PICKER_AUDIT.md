# AUDIT — Style Room-Picker / Your Home Integration

**Status:** ⚙️ proceeding to implementation per the streamlined-gate "approve all changes" policy.
**Created:** 2026-04-26
**Note on missing parent prompt:** Hassan's addendum references a prior "style room-picker prompt" + a `STYLE_ROOM_PICKER_AUDIT.md`. Neither was sent earlier in this conversation. I'm creating the audit doc fresh, scoped to the Your Home integration spec from the addendum. The "style room-picker page" referenced in the spec maps to the existing Trending Styles + Seasonal sections + Use Template flow on the home screen (same surfaces visible in Hassan's screenshot).

## Existing surfaces audited

| Surface | File:Line | Currently does | Integration plan |
|---------|-----------|----------------|------------------|
| Your Home grid | `app.js:3246` `renderHomeProgress(profile)` | Renders 9-cell grid. Reads `state.rooms` filtered by `profile.id`, computes `designed = new Set(rooms.map(r => r.type))`. "X of 9 rooms designed" counter + progress bar based on this Set. Tap on cell: designed → `openRoom(recent.id)`; undesigned → `prepareCapture()` then `showScreen('capture')`. | Refactor to read from new `state.user.homeProgress.designedRooms` field. Keep the existing tap behavior on designed cells. Replace the undesigned tap with a flyout (Upload / Pick from style). |
| Generation entry: own photo | `app.js:5009` `analyzeBtn` click handler | Calls `routeGenerationByModelTier('new_redesign', fn)` → builds room → pushes to `state.rooms` → routes to reveal/results | Hook into the success branch so `room.type` appends to `designedRooms`. |
| Generation entry: Use Template | `app.js` `useTemplateBtn` / `startFromTemplate` | Same flow — builds room, pushes to `state.rooms`, opens room | Same hook — single source of truth at the central `routeGenerationByModelTier` callback. |
| Reset profile | `app.js:1330` `resetUserDesignProfile()` | Wipes design state via allow-list pattern; preserves auth + consent + tier | `state.user.homeProgress` is NOT in the allow-list → automatically wiped on reset (no extra work needed). |
| First Redesign Tutorial overlay | `app.js:5800` `.frt-overlay` | When `.open`, intercepts all clicks via `pointer-events: auto` covering full viewport. Block the underlying page's back button (Hassan's reported bug). | **Fixed in this batch:** backdrop click on the dark surround now dismisses the tutorial (calls `endTutorial(false)`). |

## State schema (new)

```js
state.user.homeProgress = {
  designedRooms: [],        // array of room types, e.g. ['bedroom', 'living', 'kitchen']
  celebrated: false,         // one-time flag — set true after 9/9 celebration fires
  flyoutLastRoom: null      // last room type the user opened the flyout for (for analytics dedup)
};
```

**Migration on boot:** if `state.user.homeProgress` is undefined, populate `designedRooms` from `state.rooms` filtered by `state.activeProfileId`, deduped on `room.type`, capped at 9.

## Canonical room order (locked)

`['bedroom', 'living', 'kitchen', 'dining', 'bathroom', 'office', 'nursery', 'closet', 'laundry']`

**"Next up" logic:** pick the first un-designed room from this canonical order. If user designs out-of-order, "Next up" still points to the next un-designed room in canonical order, not the user's likely-next room based on their choices. (Per spec — preserve canonical progression.)

## Tap behavior (per cell)

- **Designed cell:** `openRoom(mostRecentRoomOfType)` — unchanged from current behavior
- **Undesigned cell:** open a flyout pinned to the cell with two CTAs:
  - **Upload a photo →** routes to `prepareCapture()` + `showScreen('capture')` with `state.draft.suggestedType = roomType` so the room-type confirmation step (existing) pre-selects
  - **Pick from a style →** routes to the templates screen (`data-go="templates"`) with `state._templateRoomFilter = roomType` so the templates render filtered to that room type
- Flyout dismisses on: outside-click, Escape key, picking either CTA, or scrolling

## 9/9 Completion celebration

- When `designedRooms.length === 9` for the first time AND `state.user.homeProgress.celebrated` is `false`:
  - Set `celebrated = true` (one-shot)
  - Fire `home_completion_celebrated` analytics
  - Apply CSS class `hp-celebrating` to `.home-progress` for a brief pulse animation across all 9 cards (~1500ms total)
  - Replace "Next up: ..." copy with "All 9 rooms designed."
  - Show a "See your full home →" CTA below the counter that routes to `data-screen="home-gallery"` (new stub screen — full content deferred to DEFERRED.md)

## Analytics events

- `home_progress_room_completed { room_type, source, total_completed_after }` — fires on each new room added to `designedRooms`. `source ∈ {'own_photo', 'template', 'this_week', 'unknown'}` derived from generation actionId.
- `home_progress_card_tapped { room_type, was_already_designed }` — fires on every cell tap.
- `home_completion_celebrated` — one-time per user when 9/9 hits.
- `home_progress_flyout_opened { room_type, source: 'card_tap' }` — flyout opens.
- `home_progress_flyout_action { room_type, action: 'upload_photo' | 'pick_style' | 'dismiss' }` — flyout choice.

## Edge cases (per spec)

- **Duplicate room type:** user re-designs Living Room → already in `designedRooms` → don't add again. Most recent room represents the "review" target on tap.
- **Reset profile:** `state.user.homeProgress` wiped via the allow-list pattern (already covered).
- **Failed generation:** the hook fires inside the SUCCESS branch of `routeGenerationByModelTier` (after `room` is built and pushed). Failures (caught in `analyze_failed` path) never reach the hook.
- **Pro multi-room batch:** deferred per Conflict 3 — when shipped, each successful generation in the batch fires the hook independently, so progress UI updates per-room. No special handling here.

## Reforge framework citations

- **Engagement Loops — Multi-Room Completion** (`OPTIMIZATION_PLAN.md` Dim 05): the Your Home grid IS the Multi-Room Completion loop's signal/action/reward triad. Signal = "X of 9". Action = tap an undesigned cell, redesign. Reward = checkmark + counter advance + "Next up" pointing to the next room.
- **Personalization** (Dim 07): home-progress as a learnable signal — over time the AI weights items toward the rooms user has prioritized.
- **Activation — Setup Moment artifact** (Dim 04): Your Home becomes a Setup Moment artifact that reinforces "I have a relationship with this app." Per the Reforge ICED Theory Plant-Loyalty Hook: visible accumulated investment = recall trigger between sessions.
- **User Psychology — Completion motivational boost** (Dim 02 ELMR Motivation): the progress bar + "X of 9" counter taps the canonical Reforge completion lever.

## What I'll defer (DEFERRED.md additions)

1. **`data-screen="home-gallery"` full content** — the stub screen lands at the Home → 9 saved rooms grid view. Full curated layout (timeline / recent vs old / cross-room mood-board) defers to a future content batch.
2. **Templates filter prefill** (`state._templateRoomFilter`) — the templates screen needs to read this on render and filter visible templates by `t.room === roomType`. Existing templates may not all have a `room` field — flag for content audit. Until then, the prefill plumbs but render doesn't filter. Documented for follow-up.
3. **Capture room-type prefill** (`state.draft.suggestedType`) — the existing room-type confirmation step in capture flow needs to honor this. Currently it shows a free-pick chooser. Plumbing ships now; the chooser-prefill is a 1-line change in the existing capture handler.

## Decision: SHIP STRAIGHT THROUGH

No conflicts with shipped decisions. The new state field is purely additive on top of the existing `state.rooms`. Implementation order:

1. Schema + boot migration
2. Hook generation success
3. Update `renderHomeProgress` to use the new field + add flyout + celebration animation
4. Stub `home-gallery` screen
5. Wire 5 analytics events
6. Verify in preview
7. Commit
