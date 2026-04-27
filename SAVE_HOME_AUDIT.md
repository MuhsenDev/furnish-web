# AUDIT — Save Home feature (3-tier room artifact model)

**Status:** ⚙️ proceeding to implementation per the streamlined-gate "approve all changes" policy.
**Created:** 2026-04-26
**Scope:** state schema + 5 sub-features (exclusions UI + save surface + Save Home button + Saved tab refactor + nav badge) + migration from prior addendum's `homeProgress.designedRooms` array.

## 1. Current state model (just shipped in `cabd9df`)

```js
state.user.homeProgress = {
  designedRooms: ['bedroom', 'living', 'kitchen', ...], // array of room types
  celebrated: boolean,
  flyoutLastRoom: string | null
}
```

Reads: `getHomeProgress()`, `recordHomeProgressRoom()`, `nextHomeRoomSuggestion()`, `renderHomeProgress()`, `renderHomeGallery()`.

## 2. Proposed state model (per Hassan's spec)

```js
state.user.activeHome = {
  id: string,                        // uuid, generated on home start
  startedAt: number,                 // timestamp ms
  excludedRooms: [],                 // array of room_type strings
  designedRooms: {                   // object map, NOT array
    bedroom:  { roomGenerationId, roomId, roomType, generatedAt, source } | null,
    living:   { ... } | null,
    kitchen:  { ... } | null,
    dining:   { ... } | null,
    bathroom: { ... } | null,
    office:   { ... } | null,
    nursery:  { ... } | null,
    closet:   { ... } | null,
    laundry:  { ... } | null
  },
  celebrated: boolean                // one-shot flag, preserved from prior addendum
};

state.user.savedHomes = [
  {
    id: string,
    savedAt: number,
    rooms: { bedroom: {...}, ... },  // snapshot of activeHome.designedRooms at save time
    excludedRooms: [...]              // snapshot at save time
  }
];

state.user.savedRooms = [             // individual room redesigns saved standalone
  { roomGenerationId, roomId, roomType, savedAt, source, reason } // 'reason' ∈ overwrite|exclude|standalone
];
```

**Note on room-type keys:** I'm using the existing 9-room-order keys (`'bedroom', 'living', 'kitchen', 'dining', 'bathroom', 'office', 'nursery', 'closet', 'laundry'`) NOT the spec's `'living_room' / 'home_office' / 'dining_room' / 'laundry_room'` aliases. Reason: `HOME_ROOM_ORDER` (shipped in `cabd9df`) + `window.ROOM_TYPES` (in `furniture.js`) both use the short keys. Renaming would ripple through 30+ call sites + furniture.js + every existing room created by users. Spec says "all 9 included" — same semantic intent, short keys.

## 3. Migration plan (idempotent)

`migrateActiveHomeFromHomeProgress()` runs on boot. If `state.user.activeHome` is undefined AND `state.user.homeProgress` is defined:

1. Create `activeHome = { id: uuid, startedAt: state.user.homeProgress.startedAt || Date.now(), excludedRooms: [], designedRooms: { all9null }, celebrated: state.user.homeProgress.celebrated || false }`
2. For each `roomType` in `state.user.homeProgress.designedRooms[]`, find the most recent matching room in `state.rooms` (filtered by activeProfileId, `r.type === roomType`) and populate `activeHome.designedRooms[roomType] = { roomId: r.id, roomType, generatedAt: r.createdAt || r.timestamp || 0, source: 'migration' }`. If no matching room found, populate with a stub `{ roomId: null, roomType, generatedAt: 0, source: 'migration_stub' }`.
3. Initialize `state.user.savedHomes = []` (if undefined).
4. Initialize `state.user.savedRooms = []` (if undefined).
5. **Do NOT delete `state.user.homeProgress`** — keep it as a backward-compat read for any third-party reader. New code reads activeHome only. Old field becomes vestigial. (Rationale: deletion creates risk if Hassan rolls back this batch; vestigial field is zero-cost.)

Idempotent: if `activeHome` already exists, the migration is a no-op.

## 4. UI surfaces

| # | Surface | Existing? | Action | New JS | New HTML | New CSS |
|---|---------|-----------|--------|--------|----------|---------|
| 1 | **`renderHomeProgress`** (homepage Your Home grid) | ✓ shipped `cabd9df` | Refactor: read `activeHome.designedRooms` object; hide excluded rooms; recompute counter as `designedCount of (9 - excludedCount)` | reused fn | none | minor |
| 2 | **Save Home button** (homepage, below grid) | ❌ new | Add button + 2 dialogs (incomplete-state + confirm-state) | `renderSaveHomeButton`, `openSaveHomeIncompleteDialog`, `openSaveHomeConfirmDialog`, `commitSaveHome` | new container in home section | new |
| 3 | **Profile settings — "Rooms in your home"** | ❌ new | Add new `.pp-card` section after the existing settings list with 9 toggles | `renderRoomExclusionsList`, `toggleRoomExclusion`, `confirmExcludeDesignedRoom` | new section in profile screen | new |
| 4 | **Post-generation save surface** | ❌ new (current results-flow has no explicit save action) | Modal that fires on results screen when room first opens; offers Save to Home (primary) + Save to Saved Rooms (secondary). Auto-dismiss if user already has a save state for this room. | `openSaveSurfaceModal`, `commitSaveToHome`, `commitSaveToSavedRooms` | new modal markup | new |
| 5 | **Saved tab** | ✓ exists with `#savedRoomsGrid` + `#savedItemsGrid` | Refactor: rename existing room-grid section "Saved Rooms"; add new "Saved Homes" section above; add detail-view route | new section + detail view; updated `renderSaved` | restructure existing screen | new |
| 6 | **Bottom nav Saved tab badge** | bn-tab exists | Add `.bn-tab-badge` element + class toggling driven by derived selector `hasSavedItems` | `updateSavedTabBadge` | new span in nav | new |

## 5. Conflicts with shipped decisions

### A. Conflict with `cabd9df` (Your Home progress addendum)
- `state.user.homeProgress.designedRooms` array is REPLACED by `state.user.activeHome.designedRooms` object.
- `recordHomeProgressRoom(roomType, source)` semantics change: instead of pushing to an array, it now SETS `activeHome.designedRooms[roomType]` with metadata. Overwrite path (slot already occupied) → move existing entry to `savedRooms` with `reason: 'overwrite'`.
- `nextHomeRoomSuggestion()` semantics change: skip excluded rooms.
- `renderHomeProgress()` refactored.
- `renderHomeGallery()` (the home-gallery stub) refactored to read `activeHome.designedRooms`.
- `home_progress_room_completed` analytics still fires (keep for funnel continuity); add new `save_to_home_selected` per Hassan's analytics list.
- The addendum's "9/9 celebration" still fires when `designedCount === requiredCount` (where `requiredCount = 9 - excludedCount`). Now correctly handles the "user excluded 7 rooms, designed 2, hits completion" case per spec edge-case #2.

### B. Reset feature (commit `be64b19`) — fully compatible
- `RESET_PRESERVED_USER_FIELDS` allow-list does NOT include `activeHome`, `savedHomes`, or `savedRooms`. All three auto-wipe on reset. Per spec edge-case #6: "savedHomes wiped along with everything else." ✓
- After reset, `activeHome` is undefined → migration won't run (no homeProgress either, since both were wiped) → on next render, `getActiveHome()` lazy-inits a fresh activeHome with all-null designedRooms. ✓

### C. Use Template flow (commit `cabd9df` hook)
- `startFromTemplate` → `routeGenerationByModelTier` success → `recordHomeProgressRoom(room.type, 'template')` (current behavior).
- New: this hook ALSO fires the post-generation save surface UI when openRoom runs. The save surface offers Save to Home / Save to Saved Rooms. Default: "Save to Home" auto-fires for templates with overwrite-protection (templates are by definition "fill your home" generations). Pure own-photo path also fires the surface.

### D. The "save surface" architecture decision
Per spec: "single shared component used regardless of generation entry point." I'll build it as a modal that fires from `openRoom` immediately after the room renders, but only if:
- The room was JUST generated (`state._justGeneratedRoomId === room.id`)
- AND the room hasn't been "claimed" by either `activeHome.designedRooms` or `savedRooms` yet (`!isRoomClaimed(roomId)`)

This way: revisiting an old room never re-shows the surface.

### E. ROOM_TYPES.id key naming
The spec uses `living_room`, `home_office`, `dining_room`, `laundry_room`. The codebase uses `living`, `office`, `dining`, `laundry`. Keeping codebase keys to avoid 30+ call-site refactor. UI-displayed labels are unchanged (window.ROOM_TYPES carries the human-readable label).

## 6. Components: new vs reuse vs refactor

| Component | Decision |
|-----------|----------|
| `.modal.reset-dialog` (consent block dialog) | Reuse the visual pattern (modal-card, .reset-dialog-actions). Build new modals (Save Home incomplete dialog, Save Home confirm, Save surface, room-exclusion-confirm) using the same chrome. |
| `.pp-setting` (profile rows) | Reuse for the 9 room-exclusion toggles. Match existing Sound Effects toggle pattern (real `<button class="toggle-switch">` + aria-checked). |
| `.hp-cell` (home progress grid cells) | Reuse. Refactor render to skip excluded rooms. |
| `.hp-flyout` (undesigned-cell flyout) | Reuse — already shipped in `cabd9df`. |
| `.imgcard` (generic image card) | Reuse for saved home cards in the Saved tab. Each saved home gets a card with stacked-thumbnail hero. |
| Bottom nav structure | Reuse. Add `.bn-tab-badge` span inside the Saved tab button. |

## 7. Edge cases — implementation plan per spec

| # | Edge case | Plan |
|---|-----------|------|
| 1 | Save → empty Your Home → tap Save again | Save Home button shows incomplete state; dialog says "you need to design rooms" — works because `activeHome.designedRooms` is all null after reset. ✓ |
| 2 | 7 excluded → 2 designed → save | `requiredCount = 9 - 7 = 2`. `designedCount === requiredCount` → complete state → save fires with 2-room snapshot. ✓ |
| 3 | Generation fails | Save surface only fires from `openRoom` after a successful render; failure paths route through `analyze_failed` and never reach save surface. ✓ |
| 4 | Multiple overwrites of same room type | Each overwrite moves the previous active entry to `savedRooms` with `reason: 'overwrite'`. All preserved, no dedup. ✓ |
| 5 | Excluded room is "Next up" suggestion | `nextHomeRoomSuggestion` skips excluded. If all non-excluded done → null → completion state. ✓ |
| 6 | Reset wipes savedHomes + savedRooms | Allow-list pattern auto-wipes (neither is in `RESET_PRESERVED_USER_FIELDS`). ✓ |
| 7 | Data export | Defer to DEFERRED.md (no current export feature). |
| 8 | 320px viewport | All dialogs use existing `.modal` chrome which already has mobile responsiveness. Verify post-impl. |
| 9 | Identical-metadata regeneration | Save flow doesn't dedupe — overwrite + move-to-savedRooms always fires. ✓ |
| 10 | Concurrent updates | Last-write-wins — log to DEFERRED.md as a real-backend follow-up. |

## 8. Voice & copy (per VOICE.md + OKT)

- Exclusions UI helper: "Turn off any rooms you don't have. We'll only ask you to design the ones you do." (concrete, warm)
- Footer counter: "Keep at least 2 rooms on. Currently: X of 9 included" (concrete, calm)
- Save Home button incomplete state: "Save this home" + "Complete your remaining rooms first" (calm)
- Save Home button complete state: "Save this home" + "All [N] rooms designed — ready to save" (warm, no exclamation per VOICE.md)
- Incomplete dialog headline: "Almost there" (warm)
- Incomplete dialog body: "You have [N] rooms left to design before you can save this home." (concrete)
- Save surface primary: "Save as your [Room Type] in Your Home" (concrete)
- Save surface secondary: "Save to Saved Rooms" (concrete)
- Save Home confirm headline: "Save this home?"
- Save Home confirm body: "Your designed rooms will be saved to your Saved tab. Your Home will reset so you can start a new home." (concrete, transparent)
- Excluded-room save microcopy: "[Room Type] is excluded from Your Home. Save it to your Saved Rooms instead, or include the room in Settings." (concrete, calm)
- Toast on overwrite: "[Room Type] updated. Previous design saved to your Saved Rooms." (warm, transparent)
- All dialogs avoid "warning / danger / permanent" language per VOICE.md

## 9. Reforge framework citations (per the spec)

- **User Psychology — Overwrite Protection (undo-by-default)**: never destroy a previous design; relocate to Saved Rooms. Per Reforge Apply User Psych — destructive actions should be reversible by default. Trust-builder.
- **User Psychology — Dialog as productive friction**: the incomplete-state Save Home dialog turns "you can't save yet" into a list of next-step actions. Per Reforge Apply User Psych: friction proportional to user's current goal — they want to save, the dialog gives them the path forward.
- **Engagement Loops — Multi-Room Completion**: the loop's signal/action/reward triad. Save Home is the loop's invest+reward closure — the user has invested across multiple rooms, the save is the formal "you finished a thing" reward state.
- **Trust & Credibility (Brand Marketing — Identity Governance)**: clarity about what saves where. The save surface explicitly shows "Save as your Bedroom in Your Home" so the user knows the slot. The 3-tier model (active vs saved home vs saved room) is transparent in copy.
- **Activation — Setup Moment artifact (ICED Plant-Loyalty Hook)**: a saved home is a Setup Moment artifact for repeat engagement. Users return to see / share / re-open their saved home.

## 10. Decision: SHIP STRAIGHT THROUGH

No conflicts requiring user input. Migration plan is idempotent + backward-compatible. UI components reuse existing chrome where possible.

Implementation order (per spec):
1. State schema + migration
2. Refactor renderHomeProgress + renderHomeGallery
3. Profile settings exclusions UI
4. Homepage Save Home button + dialogs
5. Post-generation save surface
6. Saved tab two-section refactor + saved home detail view
7. Bottom nav badge
8. Analytics events
9. DEFERRED.md additions
10. IMPLEMENTATION_PROGRESS.md migration log
11. Sweep + verify
12. Commit
