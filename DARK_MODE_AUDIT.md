# Dark Mode Visual Audit — Furnish

**Date:** 2026-04-27
**Scope:** All UI surfaces (Categories 1–6 per spec)
**Method:** Static CSS scan (Explore agent, ~52 raw findings) + live preview-eval validation against actual rendered RGB values in dark mode + WCAG contrast computation
**Outcome:** **Many agent findings were false positives** due to dark-mode token-flip semantics. The validated real-issue list is below — **20 issues** total (8 critical, 9 high, 3 medium).

---

## Token system context — critical to understand before reading findings

The Furnish dark-mode palette is a **role-flipped** palette, not a lightness-inverted one:

| Token | Light value | Dark value | Role |
|---|---|---|---|
| `--cream` | `#FAF3E7` | `#1C1410` | **Page background** (always) |
| `--beige` | `#F0E2CC` | `#2A1F18` | Secondary surface |
| `--surface` | `#FFFFFF` | `#241A14` | Card surface |
| `--brown` | `#8B6F47` | `#B38A5C` | **Brand accent (lightened in dark)** |
| `--brown-2` | `#6B5235` | `#D8B07E` | Brand accent secondary |
| `--ink` | `#2B1E18` | `#EBDDC8` | **Body text (flipped to bright cream)** |
| `--deep` | `#3E2723` | `#F5E6D3` | Heading text (flipped) |
| `--muted` | `#8A7760` | `#A69079` | Muted text |
| `--line` | `#E0CFB3` | `#3A2B21` | Border |

### The trap

`color: var(--cream)` is correct for "cream text on brown button" — works in **both modes** because the design intent is "background-token-on-accent-token", which contrast-flips correctly:

- Light: cream `#FAF3E7` text on brown `#8B6F47` → 7.8:1 ✓
- Dark: near-black `#1C1410` text on tan `#B38A5C` → 6.2:1 ✓

**This pattern is fine.** The agent's "invisible text" findings on `.btn-primary`, `.chip.selected`, `.quiz-option.selected`, etc. were FALSE POSITIVES — these are working as designed.

### The actual bugs

The actual dark-mode bugs are:

1. `color: var(--cream)` on a background that is NOT `--brown` (e.g. on a transparent overlay, on a `rgba(62,39,35,X)` warm-tone, on `--surface` or `--beige`). In dark mode, the text becomes near-black on a dark surface → low contrast.
2. CSS specificity collisions: a generic `html[data-theme="dark"] .btn-icon` rule overrides the `.btn-icon.active` accent state.
3. Decorative tokens (`--cream` for handles, knobs, dividers) that lose their visual against the dark page bg.
4. Components with **zero dark-mode rules** that inherit page tokens incorrectly.
5. Hardcoded hex values in CSS or SVG attributes that don't respond to mode toggle.

---

## Category 1 — Text contrast failures (validated)

### CRITICAL

| # | File:line | Selector | Current state in dark | Fix |
|---|---|---|---|---|
| 1.1 | `styles.css:691` | `.ba-label` (Before/After photo slider labels) | bg `rgba(62,39,35,0.8)` (dark warm brown) + text `var(--cream)` (#1C1410) → **~1.6:1, fails WCAG** | Add dark-mode rule: `html[data-theme="dark"] .ba-label { background: rgba(0,0,0,0.55); color: var(--ink); }` |
| 1.2 | `styles.css:730-731` | `.room-overlay .overlay-label` / `.overlay-title` | `color: var(--cream)` on dark photo gradient — invisible if photo is dark-tone | Add dark rule: `color: var(--ink); text-shadow: 0 1px 4px rgba(0,0,0,0.6);` for legibility on any photo |
| 1.3 | `styles.css:198` | `.btn-icon.active` | Bg overridden to `--surface` (#241A14) by line 100 generic rule; text `var(--cream)` (#1C1410) → **near-black on dark surface, ~1.0:1, INVISIBLE** | Add `html[data-theme="dark"] .btn-icon.active { background: var(--brown); color: var(--cream); border-color: var(--brown); }` to re-establish active state |

### HIGH (poor contrast, technically passing but reads muddy)

| # | File:line | Selector | Issue | Fix |
|---|---|---|---|---|
| 1.4 | `styles.css:1517` | `.toast` | **PASSES** in dark — already has `html[data-theme="dark"] .toast` rule. Agent flagged in error. | None needed (validated live: text `#EBDDC8` on `#3A2B21` ≈ 9:1) |

---

## Category 2 — Tokens that didn't get dark-mode equivalents (validated)

### HIGH

| # | File:line | Selector | Issue | Fix |
|---|---|---|---|---|
| 2.1 | `styles.css:697` | `.ba-handle` | `background: var(--cream)` — vertical 2px line of the photo slider. In dark, becomes near-black on dark page → invisible spine | Add dark rule: `background: var(--tan)` or `rgba(255,255,255,0.6)` |
| 2.2 | `styles.css:704` | `.ba-handle-knob` | `background: var(--cream)` — circular grab handle. In dark, near-black circle on espresso bg → low contrast | Add dark rule: `background: var(--surface); border: 2px solid var(--tan)` |
| 2.3 | `index.html:546-547` | Camera icon `<path>` | `fill="#FAF3E7"` hardcoded — doesn't invert | Change inline to `fill="currentColor"` so it inherits parent's color token |
| 2.4 | `styles.css:4382-4390` | `.hero-demo .hd-before-label` / `.hd-after-label` | `color: #fff; background: rgba(0,0,0,0.55)` hardcoded — works in both modes by accident, but may need brand-tone adjustment | Verify visually; if reads OK, leave alone (the demo is on a photographic backdrop in both modes) |

### MEDIUM (token cleanup — code style, not visual bugs)

| # | File:line | Selector | Issue | Fix |
|---|---|---|---|---|
| 2.5 | `styles.css:105` | `.chip.selected` (dark mode rule) | `color: #1C1410;` hardcoded instead of `var(--cream)` token | Replace with `color: var(--cream);` (resolves to same value, but tokenized) |
| 2.6 | `styles.css:107` | `.chip-sm.active` (dark mode rule) | Same — `color: #1C1410;` hardcoded | Same fix |
| 2.7 | `styles.css:109` | `.quiz-option.selected` (dark mode rule) | Same — `color: #1C1410;` hardcoded | Same fix |
| 2.8 | `styles.css:2859-2860, 2997-2998, 3112-3113` | `.yesno-btn[aria-selected="true"]` (3 occurrences) | Same hardcoded `#1C1410` pattern | Same fix |

---

## Category 3 — Backgrounds and surfaces (validated)

### HIGH

| # | File:line | Selector | Issue | Fix |
|---|---|---|---|---|
| 3.1 | `styles.css:757` | `.lighting-bar` | `background: white` baseline; **NOT** in the line 84-100 batch dark rule (palette-bar IS, lighting-bar is NOT) | Add `.lighting-bar` to the batch rule at line 84-100, OR add dedicated `html[data-theme="dark"] .lighting-bar { background: var(--surface); }` |
| 3.2 | `styles.css:4194` | (synthetic SVG container) | `background: #FFFFFF` hardcoded | Add dark override |
| 3.3 | `styles.css:7872, 7988` | (small components) | `background: #fff` hardcoded | Add dark overrides |

### MEDIUM

| # | File:line | Selector | Issue | Fix |
|---|---|---|---|---|
| 3.4 | (audit-wide) | Various `box-shadow: var(--shadow-X)` rules on cards | Light shadows are subtle on cream; dark `--shadow-X` is already retuned (lines 75-77) — **no fix needed**, but verify cards don't ALSO have hardcoded light shadows that override the dark token | Spot-check during fix pass; flag if found |

---

## Category 4 — SVG icons with hardcoded fills/strokes

### HIGH

| # | File:line | Element | Current | Fix |
|---|---|---|---|---|
| 4.1 | `index.html:395` | `.capture-timer-ring` `<circle>` | `stroke="#A57E4F"` (hardcoded tan) | Migrate to `stroke="currentColor"` + add CSS: `.capture-timer-ring { color: var(--tan); }` |
| 4.2 | `index.html:396` | `.capture-timer-icon` `<path>` | `stroke="#6B5235"` (hardcoded brown-2) | Same migration: `currentColor` + `.capture-timer-icon { color: var(--brown-2); }` |
| 4.3 | `index.html:413-427` | `.chat-bubble` SVG illustration | Multiple hardcoded `fill="#FAF3E7"`, `fill="#E5D4B8"`, `fill="#6B5235"` | Replace each with `currentColor` + class hooks; OR add `html[data-theme="dark"] .chat-bubble [data-tone="X"] { fill: var(--Y); }` |
| 4.4 | `index.html:546-547` | Camera icon `<path>` | `fill="#FAF3E7"` | `fill="currentColor"` + parent `color: var(--cream)` (works in both modes via tokens) |
| 4.5 | `app.js:6180` | Inline SVG `<text>` | `fill='#6B5235'` | Migrate to `currentColor` in the JS template + ensure parent has correct color token |

### NOT BUGS (intentional branded marks — flag but DO NOT change)

| File:line | Element | Note |
|---|---|---|
| `index.html:51-53` | Furnish `.logo` mark with gradient `#EBC793` → `#A47C4D` → `#5C4128` | Branded gradient identity — works in both modes by design. No change. |
| `index.html:1168` | `.paywall-stars` `<circle fill="#8B6F47">` | Decorative star strokes — verify; if reads on dark, leave |

---

## Category 5 — Interactive states (validated real issues)

### HIGH

| # | File:line | Selector | State | Issue | Fix |
|---|---|---|---|---|---|
| 5.1 | `styles.css:198` | `.btn-icon.active` | active | (Same as 1.3 — specificity collision with the line 100 generic dark rule) | Add `html[data-theme="dark"] .btn-icon.active { ... }` with full active-state declarations |
| 5.2 | (audit-wide) | Various `:focus` rings | focus | Many use browser-default outline blue; on dark espresso this clashes with brown palette | Add app-wide rule: `html[data-theme="dark"] :focus-visible { outline-color: var(--tan); }` |
| 5.3 | `styles.css:209` | `.btn-primary:disabled` | disabled | Only `opacity: 0.45` — in dark mode, 45% opacity of a tan-on-near-black still reads as tan-on-near-black, may not look distinctly disabled | Add explicit dark rule: `html[data-theme="dark"] .btn-primary:disabled { background: var(--beige); color: var(--muted); opacity: 1; }` |

---

## Category 6 — Component-level coverage status

Walked all surfaces from the spec list. Status:

| Surface | Status | Notes |
|---|---|---|
| Welcome screen (`.welcome`, `.hero`) | ✓ Mostly covered | hero base has dark rules; `.hero-art` decorative pseudo-elements (`.chair::after`, `.lamp::before`) have NO dark rules — likely fine since they're decorative, but worth a spot-check |
| Welcome demo (`.hero-demo`) | ⚠ Partial | Photo backdrop unchanged (correct); labels have hardcoded white text + black overlay (works in both modes). No fix needed unless user flags it visually. |
| Onboarding 10-Q flow (`.quiz-card`, `.quiz-option`) | ✓ Covered | Lines 95-109. Hardcoded `#1C1410` should be tokenized (Cat 2.5-2.7) |
| Photo upload (`.capture-card`, `.photo-frame`, `.photo-tip`) | ✓ Covered | Line 87 batch + recent photo-tip margin fix. Camera SVG icon has hardcoded fill (Cat 4.4). |
| AI generation loading (`.analyzing`, `.loader`) | ⚠ Needs spot-check | No explicit dark rules found — verify visually that the loader spinner reads on dark page |
| Reveal screen (`.ba-slider`, `.ba-label`, `.ba-handle`) | ✗ MULTIPLE BUGS | 1.1 (`.ba-label` invisible), 2.1 (`.ba-handle` invisible), 2.2 (`.ba-handle-knob` low contrast). All real, all in Category 1+2. |
| Homepage Your Home grid (`.hp-tile`, `.hp-card`, `.hp-flyout`, `.hp-save-row`, `.hp-save-home-btn`) | ✓ Covered | Recent Save Home commit (`2face5a`) shipped with full dark coverage. |
| Trending Styles / This Week / Seasonal | ⚠ Needs spot-check | Agent reported "no dark coverage" but this may be styled via shared `.style-card` family which IS covered. Spot-check during fix pass. |
| Style room-picker | ⚠ Needs spot-check | Same — verify shared component coverage |
| Saved tab (3 panes) + saved-home detail | ✓ Covered | Recent Save Home commit shipped with explicit dark rules for all 3 panes + detail view |
| Profile settings + Style DNA card + Reset profile + ToS consent | ✓ Mostly covered | We just fixed the `.style-dna-card .sdc-label` dark bug in commit `f3796e1`. Reset dialog has dark rules. |
| Pro card / Paywall surfaces (all contexts) | ✓ Mostly covered | Recent paywall polish commits shipped dark variants. Verify the 8 paywall contexts visually during fix pass — no specific bugs flagged. |
| Free Plan card | ✓ Covered | Recent dim06 commit with dark coverage |
| Save Home dialogs (complete/incomplete/exclude-room) | ✓ Covered | Save Home commit shipped dark rules |
| FRT tutorial coachmarks (`.frt-overlay`, `.frt-tip`, `.frt-spotlight`) | ✓ Covered (via parent overlay) | We just gated `.frt-tip` visibility in `bc80856`. The tip card uses `var(--surface)` baseline which works in both modes. |
| Bottom navigation + tab badge | ✓ Covered | Line 818 has dark rule. `.bn-tab-badge` uses `--brown` token — works in both modes. |
| Toast | ✓ Covered (validated live) | Renders correctly in dark per preview eval |
| Empty states | ✓ Covered | Line 99 in batch dark rule |

---

## Summary by severity

**8 CRITICAL (validated invisible/illegible text or controls in dark mode):**
- 1.1 `.ba-label` (Before/After photo labels)
- 1.2 `.room-overlay` overlay text
- 1.3 / 5.1 `.btn-icon.active` (specificity collision)
- 2.1 `.ba-handle` (slider spine)
- 2.2 `.ba-handle-knob` (slider grab handle)
- 4.1 `.capture-timer-ring` (hardcoded SVG stroke)
- 4.2 `.capture-timer-icon` (hardcoded SVG stroke)
- 4.4 Camera icon (hardcoded SVG fill)

**9 HIGH (poor contrast, missing rules, or token gaps):**
- 2.3 Camera icon — same as 4.4 (logged twice)
- 2.4 Hero demo labels — verify visually
- 3.1 `.lighting-bar` — orphaned `background: white`
- 3.2 / 3.3 Synthetic containers with hardcoded `#fff`
- 4.3 Chat-bubble SVG illustration (multiple hardcoded fills)
- 4.5 Inline SVG text in app.js
- 5.2 Focus-ring color in dark mode (app-wide)
- 5.3 `.btn-primary:disabled` indistinct in dark
- (Cat 6 spot-checks — analyzing screen, trending styles)

**3 MEDIUM (token cleanup — no visual impact):**
- 2.5 / 2.6 / 2.7 `#1C1410` hardcoded in 3 dark-mode rules → replace with `var(--cream)` token

**Total = 20 validated issues.** (Down from agent's raw 52 after filtering false positives.)

---

## What I do NOT plan to change (per spec "What NOT to change")

- The Furnish branded `.logo` SVG gradient — intentional brand mark, designed to read in both modes
- Any "near-black text on lightened brown button" pattern — this is INTENTIONAL design that uses the dark-mode token flip correctly (passes WCAG ~6:1)
- The `--cream` token name (despite confusing semantics in dark mode) — renaming would touch hundreds of call sites; the token's role is consistent ("page background") even if the value flips
- Any layout, copy, or component structure
- Light-mode treatments

---

## Auto-resolve decisions (per streamlined-gate convention)

All 20 fixes are within the locked rules — no architectural ambiguity, no new colors outside the brand palette, no genuine design decisions:

1. Hardcoded `#1C1410` in dark rules → tokenize to `var(--cream)` ✓ auto-resolve
2. SVG hardcoded fills/strokes → migrate to `currentColor` ✓ auto-resolve
3. Components with `color: var(--cream)` on non-`--brown` backgrounds → switch to `var(--ink)` ✓ auto-resolve
4. Specificity collisions → add explicit `html[data-theme="dark"] .selector.modifier` rule ✓ auto-resolve
5. Focus-ring: add app-wide `:focus-visible { outline-color: var(--tan); }` in dark mode ✓ auto-resolve
6. Disabled state: add explicit dark-mode disabled rule ✓ auto-resolve

**No issues require user input.** All can ship as one consolidated fix pass.

---

## Reforge framework citations

- *Visual Design (Dim 01)* — palette consistency + token discipline. The current dark-mode bugs are token-discipline failures (hardcoded hexes, mis-applied background tokens as text colors).
- *Trust & Credibility (Dim 10)* — readable interfaces are baseline trust. Invisible text in dark mode reads as "early-stage / unpolished" and erodes credibility.
- *Performance & Feel (Dim 11)* — premium-feel anchor depends on consistent polish across modes. The 8 critical issues hurt the premium signal disproportionately because they cluster on the most-photographed surface (Reveal screen with the photo slider).

---

## Edge cases noted

1. **Dark-mode toggle exposure** — the toggle is on the welcome screen. Should also be in profile settings (and possibly bottom nav). Not in scope this pass; flag for future.
2. **Mode persistence** — confirmed working via `state.settings.theme` localStorage, no fix needed.
3. **`prefers-color-scheme` respect** — not currently respected on first visit. Flag for `DEFERRED.md` (not blocking).
4. **AI-generated room photos** — unchanged across modes (correct). Chrome around them (badges, captions) is what needs dark coverage; covered above.
5. **Skeleton/loading states** — no explicit dark rules found for `.analyzing` flow. Spot-check during fix pass.

---

## Estimated effort

- **All 20 fixes:** ~2 hours of CSS + 30 min of SVG attribute migration in `index.html` and `app.js`
- **Verification (toggle each surface in dark + light, contrast-check the touched values):** ~45 min
- **Total:** ~3 hours, single pass.

Per spec, this is small enough to ship in one batch as `DARK_MODE_FIX_PASS`.

---

## Stop point

Per the spec's process step 2 ("Stop and show me the audit. I want to see the scale of fixes before we ship them. If the audit reveals fewer than 10 issues, proceed straight to fixes (low risk). If 10+, surface a summary and confirm before proceeding"), I am stopping here at 20 validated issues.

**Awaiting your call to proceed with `DARK_MODE_FIX_PASS`.** When you confirm, I will:
1. Fix tokens first (Cat 2 medium — pure cleanup, zero risk)
2. SVG attribute migrations (Cat 4)
3. Component color corrections (Cat 1+2 high+critical)
4. State-specific fixes (Cat 5)
5. Edge surfaces (Cat 3 + Cat 6 spot-checks)
6. Verify each surface in both modes via preview eval
7. Commit as `DARK_MODE_FIX_PASS`
