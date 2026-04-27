# BATCH 2 AUDIT — Dim 01 Visual Design + Dim 11 Performance & Feel

**Status:** ⚙️ PROCEEDING TO IMPLEMENTATION — streamlined-gate cleared.
**Created:** 2026-04-26 (same day as Batch 1)
**Source dimensions:** Dim 01 (13 entries, ~77% Reforge), Dim 11 (8 entries, ~75% Reforge — lowest grounding rate of all dimensions)

---

## Streamlined-gate result

| Gate check | Outcome |
|------------|---------|
| Conflicts with shipped decisions (Batch 1 + locked) | ✅ NONE |
| New contradictions like Batch 1's NC-1 → NC-5 | ✅ NONE |
| Ambiguities requiring user-only knowledge | ✅ NONE |

**Decision:** Proceed to implementation immediately. No stop required.

### Conflict cross-reference

- **Conflict 1** (retention shape): no visual/feel touch.
- **Conflict 2** (referral currency): no touch.
- **Conflict 3** (vaporware bullets): RESOLVED in Batch 1 — paywall now has 5 bullets. Rec 08 (paywall noise reduction) ships against the resolved 5-bullet layout cleanly.
- **Conflict 4** (fictitious anchors): RESOLVED in Batch 1.
- **Conflict 5–8**: don't touch this batch.
- **Conflict 9**: RESOLVED in Batch 1.
- **Tutorial timing** vs Conflict 7: D.6 coachmark is the *price-tag* "tap to shop" coachmark, NOT the first-redesign tutorial coachmark (Styles → Color Moods → Budget). Different element. No conflict.
- **D.2 reveal choreography note** about "tutorial fires at 6s — push to 12s if reveal is happening": this is timing coordination only; doesn't decide Conflict 7's session-1-vs-session-2 question. Defensible to ship.

### [ORIGINAL] items (Hassan flagged these — 20% of Dim 11 + 2 in Dim 01)

All 5 [ORIGINAL] items pass first-principles justification:

| Item | First-principles defense | Ship? |
|------|--------------------------|-------|
| Dim 01 Rec 04 (button motion timing) | Apple HIG, Material Motion, Stripe all use ~220ms hover-in / 80ms active-snap. Defensible | ✅ |
| Dim 01 Rec 13 (modal-card surface+glow) | Standard premium-UI craft (Apple, Stripe). Defensible | ✅ |
| Dim 11 D.4 (last-redesign cache) | Avoiding base64 re-parse on home → room transition is clear engineering value. Defensible | ✅ |
| Dim 11 D.7 (haptic table in DEFERRED.md) | Pure spec doc for future implementation. Defensible | ✅ |
| Dim 11 D.8 (overlay timed flash) | Reforge peak-end rule supports the WHY; CSS keyframe HOW is craft. Defensible | ✅ |

---

## Auto-defer / auto-resolve applied

Per Hassan's rules:

- **Rec 02 (photographic welcome demo):** missing photo assets. Per auto-resolve "Missing assets → placeholder slots config-driven." Shipping the structural slot + a config flag; image swap is a config edit.
- **Rec 09 (empty-state SVG illustrations):** missing custom SVG illustrations. Same pattern — slot + config; for now uses generic stroke icon.
- **Rec 13 (Brex Word Game):** ALREADY SHIPPED in Batch 1 as `VOICE.md`. Marked complete; no work to do.
- **Rec 11 (full styles.css de-dup):** L effort (5,000-line audit). Out of scope this batch. Shipping **targeted dedup** for selectors that get modified in Batch 2 (`.item-card`, `.paywall-card`, `.price-tag`, `.modal-card`) so my changes don't get overridden. Full audit deferred to a future cleanup batch.
- **Rec 10 (logo lockup):** Option A (use display serif on wordmark) ships. Option B (custom wordmark SVG) needs designer — deferred.
- **D.1 story-driven analyzing screen:** within context budget (~3-4 hours work). Shipping.
- **All emoji-violating items:** none in scope this batch.
- **Voice violations:** none — pure visual/feel work.
- **Tech-stack:** Fraunces via Google Fonts `<link>` — vanilla, no framework needed.

---

## Implementation order (per Hassan's spec)

**Phase A — Design tokens** (styles.css top, ~lines 1-50):
- `--font-display`, `--font-body` (Rec 01)
- Multi-layer shadows `--shadow-1`, `--shadow-2`, `--shadow-3` (Rec 05). Map old `--shadow` → new `--shadow-2`, `--shadow-lg` → `--shadow-3`.
- `--ease-premium` cubic-bezier(0.22, 1, 0.36, 1) (Rec 04 — already used in some places, codify at root)
- Add Fraunces Google Fonts `<link>` to `<head>` of index.html

**Phase B — Component changes**:
- `h1`/`h2`/`h3` use `--font-display` weight 400 (Rec 01)
- `.price`, `.price-tag`, `.totals-card .total-value` editorial treatment (Rec 07) + frosted glass on `.price-tag` (Rec 06)
- `.btn` micro-interactions: 220ms hover-in, 80ms active-snap (Rec 04)
- `.item-card` with `--shadow-1` default, `--shadow-2` on hover (Rec 05) + dedup
- `.modal-card` surface+glow (Rec 13)
- `.paywall-card` noise reduction: drop pulsing glow, simplify badge, frosted-glass bullets (Rec 08)
- `.hero` whitespace breath (Rec 03)
- `.brand h1` display serif treatment (Rec 10 Option A)
- `.welcome-demo` config-driven slot (Rec 02 placeholder)
- `.empty-state` placeholder slot for SVG (Rec 09 placeholder)

**Phase C — Motion/skeleton/loading**:
- `.skeleton` class + shimmer keyframe (D.3)
- Reveal choreography CSS keyframes (D.2 frames 0-7)
- Story-driven analyzing screen (D.1) — `.loader-steps li.active`/`.done` + JS `runAnalyzingStoryline`
- `.room-overlay.flashing` keyframe (D.8)
- Coachmark timing 600ms → 3500ms (D.6)
- Last-redesign image cache (D.4)
- Sound-effects Settings toggle (D.5) — toggle UI + stub `playSfx` function

**Phase D — Targeted CSS de-dup**:
- `.item-card` (5 defs → 1)
- `.paywall-card` (3 defs → 1)
- `.price-tag` (multiple defs → 1)
- `.modal-card` (audit duplicates)

**Phase E — DEFERRED.md update**: Append haptic feedback table from Dim 11 Section B to DEFERRED.md item #4 (Capacitor wrap) per D.7.

**Phase F — Sweep**: dark-mode visual check (every component touched), mobile-narrow viewport check, no broken component under new tokens.

**Phase G**: Migration log + commit.

---

## What ships in Batch 2

| # | Source | Title | Effort | Reforge? |
|---|--------|-------|--------|----------|
| B2-01 | Dim 01 R01 | Display serif font + typography pairing | S | ✅ |
| B2-02 | Dim 01 R02 | Welcome demo config-driven slot (placeholder for photo) | S | ✅ |
| B2-03 | Dim 01 R03 | Welcome whitespace breath | S | ✅ |
| B2-04 | Dim 01 R04 | Button micro-interactions | S | [ORIGINAL] |
| B2-05 | Dim 01 R05 | Multi-layer tinted shadows | S | ✅ |
| B2-06 | Dim 01 R06 | Frosted-glass on price tags + paywall bullets | S | ✅ |
| B2-07 | Dim 01 R07 | Editorial price treatment | S | ✅ |
| B2-08 | Dim 01 R08 | Paywall noise reduction (6 → 2 accents) | M | ✅ |
| B2-09 | Dim 01 R09 | Empty-state placeholder slot (SVG TBD) | S | ✅ |
| B2-10 | Dim 01 R10 | Logo lockup Option A (wordmark in display serif) | S | ✅ |
| B2-11 | Dim 01 R11 | Targeted CSS de-dup (selectors changed in Batch 2 only) | S | ✅ |
| B2-12 | Dim 01 R12 | Brex Word Game (VOICE.md) — ALREADY SHIPPED in Batch 1 | — | ✅ |
| B2-13 | Dim 01 R13 | Modal-card surface+glow | S | [ORIGINAL] |
| B2-14 | Dim 11 D1 | Story-driven analyzing screen | M | ✅ |
| B2-15 | Dim 11 D2 | Reveal choreography frames 0-8 | M | ✅ |
| B2-16 | Dim 11 D3 | Skeleton screens (items list, saved rooms, wishlist, price tags) | S | ✅ |
| B2-17 | Dim 11 D4 | Last-redesign image cache | S | [ORIGINAL] |
| B2-18 | Dim 11 D5 | Sound-effects Settings toggle (off by default, stub) | XS | ✅ |
| B2-19 | Dim 11 D6 | Coachmark timing 600ms → 3500ms | XS | ✅ |
| B2-20 | Dim 11 D7 | Haptic table in DEFERRED.md | XS | [ORIGINAL] |
| B2-21 | Dim 11 D8 | "Designed with Furnish" timed flash | XS | [ORIGINAL] |

**Total: 20 ship items** (plus Rec 12 already-done = 21 of 21 dimension items addressed).

**Effort total: ~14-18 dev hours.**

---

## What gets DEFERRED out of this batch

- **Rec 02 photo assets** — Hassan supplies real Pro-tier-rendered before/after pairs later; config-driven slot ready.
- **Rec 09 SVG illustrations** — designer asset; placeholder slot config-driven.
- **Rec 10 Option B (custom wordmark SVG)** — designer asset.
- **Full styles.css de-dup audit** (Rec 11 expanded) — L effort, future cleanup batch.
- **Audio assets for D.5** — toggle UI + stub `playSfx` ships; actual SFX files are a separate decision.
- **Haptic API implementation** (D.7 — only the spec doc lands here; native shipment is post-Capacitor per DEFERRED.md item 4).

Now writing code.
