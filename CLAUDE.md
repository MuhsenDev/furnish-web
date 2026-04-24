# Furnish — Project Context for Claude

Read this first. It's the handoff from the previous session.

## What this app is
A mobile-first, single-page AI interior design app. Brown/beige theme. No build step, no framework — pure HTML + CSS + vanilla JS + localStorage. Users pick a style profile, snap/import a room photo, and the app "redesigns" it by composing real shoppable furniture from an affiliate catalog. Everything in the `assets/` folder stays untouched at rest.

**Owner:** Hassan. Prefers blunt, framework-grounded feedback (Reforge courses live at `C:\Users\Hassan\Downloads\Claude` — the parent dir). Don't hedge. Propose code diffs, not principles.

## Files
| File | What it holds |
|---|---|
| `index.html` | All screens + modals in one HTML file |
| `styles.css` | Theme vars, dark mode, animations, components |
| `app.js` | Wrapped in an IIFE — state, routing, screens, quiz, finale |
| `furniture.js` | `window.STYLES` / `ROOM_TYPES` / `COLLECTIONS` / `ROOM_TEMPLATES` / `QUIZ` / `QUIZ_SVGS` / `FURNITURE_DB` |
| `supabase-config.js` | Placeholder URL + anon key. User fills these in to enable cloud sync. |
| `supabase-client.js` | Auth + pullAll/pushAll. Gracefully falls back to local mode. |
| `start-windows.bat` / `start-mac-linux.sh` | `npx serve` launchers |
| `manifest.json` + `icon.svg` | PWA metadata |
| `SUPABASE_SETUP.md` | 10-minute setup guide — includes the SQL schema |
| `README.md` | Runs-locally / phone-test guide |
| `_before-recovery/` + `_my-rebuild-backup/` | **Do not delete** — disaster-recovery snapshots from when the working folder was lost. Ignored by git. |

## Running it
- Double-click `start-windows.bat` (or `bash start-mac-linux.sh`)
- Opens at `http://localhost:3000`
- Claude Code's preview tool uses `.claude/launch.json` (currently pointed at this folder via the parent `../.claude/launch.json`)

## State shape (localStorage key: `furnish.state`)
```js
{
  user: { name, email, provider },
  settings: { theme: 'light' | 'dark' },
  profiles: [{
    id, name, avatar,
    styles: [...], colors: [...], customColors: [...],
    budget, keepExisting: bool,
    seenFinale: bool   // whether the quiz-finale celebration has played for this profile
  }],
  activeProfileId,
  rooms: [...],        // designed rooms + versions
  wishlist: [...],     // [itemId]
  priceAlerts: { [itemId]: true },
  bookmarkedRooms: [...],
  draft: null,         // in-progress capture
  quiz: null           // { profileId, step, scores }
}
```

## Important current quirks
- The code was reconstructed from JSONL transcripts after the working folder was lost. Occasional reconstruction artifacts still exist (duplicate declarations, orphan blocks). When something misbehaves, **first check for duplicates in styles.css** — several bugs have been "two competing definitions, later one wins."
- Reviews ticker: `.reviews-bar` had a duplicate block that created a huge clunky panel. Removed.
- Quiz finale: 240 furniture pieces rain **top-to-bottom** (delay is correlated with landY), hold ~500ms, then burst outward while the theme flickers (opposite → back → opposite → back, always settling on the user's saved theme). Congrats card reveals after. Triggered by both finishing the quiz **and** first-time saving preferences manually (`profile.seenFinale` flag gates it).
- Home has three CTAs: **New from Photo** (camera), **Import** (file picker on device), **Use Template** (templates screen). Import is a `<label>` wrapping a hidden `<input type=file>`.
- Sign-in is mocked unless Supabase is configured.

## Backups + recovery lifelines
1. **Git** — repo lives in this folder. `git log --oneline` shows checkpoints. Commits go out at the end of every coherent batch of changes (no "commit on every edit" hook — by design, keeps history clean).
2. **Desktop zip** — `Desktop\Furnish-checkpoint-YYYYMMDD-HHMM.zip`, created on demand.
3. **Claude transcripts** — every file write/edit is logged at `C:\Users\Hassan\.claude\projects\C--Users-Hassan-Downloads-Claude\*.jsonl`. If disaster strikes again, mine these (the recovery script that was used before is findable in this conversation — it replays Write/Edit ops per file in timestamp order).

## What's NOT done yet (the 7 backend items)
In priority order, flagged whether they cost money:
1. **Real AI redesign** — Flux Kontext Pro + Flux Depth Pro on Replicate. 💰 ~$0.05/run + server to hold keys.
2. **Real affiliate catalog** — replace mocked `FURNITURE_DB`. Sign up for IKEA / Amazon / Wayfair affiliate programs (free, 1–7 day approval).
3. **Photo storage at scale** — move base64 room photos to Supabase Storage. 💰 $0.021/GB/month above 1GB.
4. **Mobile wrapper** (Capacitor) — 💰 $99/yr Apple dev, $25 one-time Google Play.
5. **Store submission** — screenshots, privacy policy, TestFlight, etc. Free, 1–3 wk.
6. **Sign in with Apple** — scaffolded, needs Services ID + key. Included in Apple dev fee.
7. **Realism pipeline** — depth + normals → SAM 2 → Flux Kontext Pro inpainting with product refs → composite → grain/color-grade pass. 💰 extra Replicate runs.

## Conventions
- **Title Case** on buttons, section headers, screen titles; **sentence case** on body copy, helper text, toasts.
- **Custom SVG icons** everywhere — no emoji in user-facing UI. If you find one, replace it.
- Always commit at the end of a coherent change batch with a descriptive multi-line message. Conventional-style prefixes are NOT required but clarity is.
- When adding CSS, scan for an existing rule with the same selector **before** writing a new one — reconstruction artifacts mean duplicates are frequent.
- Heavy imports (images, base64, etc.) should go through the existing `FileReader → dataURL → state.draft.photo` pipeline.

## Quick orientation
```bash
git log --oneline           # recent history
git show HEAD               # last change
grep -n data-screen index.html   # all screens
grep -n 'function ' app.js | head  # all top-level functions in the IIFE
```

Start by reading the user's most recent message. Then act.
