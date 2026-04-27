# AUDIT — Reset Profile Confirmation Dialog

**Status:** ⚙️ proceeding to implementation — zero blocking conflicts, no existing dialog/component to extend (only `window.confirm()` in use).
**Created:** 2026-04-26

## Reset entry points found

Walked the codebase. **Two** entry points trigger Reset Profile, both currently using `window.confirm()` with `RESET_CONFIRM_COPY`:

| # | File:Line | Surface | Trigger | Current behavior |
|---|-----------|---------|---------|------------------|
| 1 | `app.js:4558` | Profile screen `[data-screen="profile"]` | `[data-action="reset"]` `.pp-setting` row | `if (!confirm(RESET_CONFIRM_COPY)) return;` → `resetUserDesignProfile()` → toast → `showScreen('welcome')` |
| 2 | `app.js:4582` | Preferences screen `[data-screen="preferences"]` | `#prefsResetBtn` `.pp-setting` row | Same — `confirm` → `resetUserDesignProfile()` → toast → `showScreen('welcome')` |

Both paths terminate in the SAME `resetUserDesignProfile()` helper (locked in commit `be64b19`). The wipe contract is identical; the only difference is the analytics event fired BEFORE reset (`profile_reset_from_preferences` from entry point 2; nothing custom from entry point 1).

## How both will route through the new dialog

Both call sites swap their `if (!confirm(RESET_CONFIRM_COPY)) return;` line for `openResetDialog({ source })` — passing a `source` discriminator (`'profile_screen'` vs `'preferences_screen'`) into the dialog so analytics events keep their existing per-source segmentation. The dialog is the SINGLE source of truth for the warning copy + the hold-to-confirm friction step.

## Other `window.confirm()` call sites (NOT reset, surfaced for context)

Out-of-scope for this work. Listed so Hassan sees the full destructive-action picture:

| Action | Sites | Currently uses |
|--------|-------|----------------|
| Switch account | `app.js:1137`, `app.js:4534` | `window.confirm()` |
| Sign out | `app.js:1156`, `app.js:4547` | `window.confirm()` |
| Restore previous session | `app.js:8491` | `window.confirm()` (positive action, not destructive — different shape) |

The new `openResetDialog()` is purpose-built for the reset case (lists + hold-to-confirm). If Hassan later wants the same dialog pattern for sign-out / switch-account, the dialog could be generalized — but per the spec ("If you find an existing dialog or warning component that should be extended rather than rebuilt"), there is NO existing pattern to extend, so we build for reset and don't pre-generalize.

## Existing destructive-confirm patterns

**None.** Searched for hold-to-confirm, countdown-confirm, typed-confirmation patterns — zero matches in source files (only matches were inside `node_modules`). Per the spec: "If there's no existing pattern, default to the 1-second hold-to-confirm." Defaulting.

## Existing modal patterns being matched

The codebase has a `.modal` + `.modal-card` system (paywall, support, share, photo-source, affiliate-disclosure, roadmap, style-pivot). The new dialog reuses:
- `.modal` shell (fixed inset, dark backdrop, fade-in animation)
- `.modal-card` chrome (cream background, rounded corners, shadow)
- `.modal-close` X button pattern (top-right corner)

This keeps the visual language consistent with every other modal in the app.

## Hold-to-confirm spec

- 1000ms hold on the destructive button.
- Visual: progress fill grows left-to-right inside the button over the hold duration. Common pattern; no existing matching CSS so we author it.
- Mouse + touch + keyboard support: `mousedown` / `touchstart` start the hold; `mouseup` / `mouseleave` / `touchend` cancel; **also** start on keyboard `keydown` (Space or Enter) and cancel on `keyup` so keyboard-only users can complete the action.
- Released early → no event fired (the user is just probing the button, not confirming or cancelling). The dialog stays open.
- Held full second → fire `reset_dialog_confirmed` + close dialog + run `resetUserDesignProfile()` + route to welcome.

## Component design

```html
<div class="modal reset-dialog" id="resetDialog" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="resetDialogTitle">
  <div class="modal-card reset-dialog-card">
    <button class="modal-close" id="resetDialogClose" aria-label="Cancel">×</button>
    <h3 id="resetDialogTitle">Reset your design profile?</h3>
    <p class="reset-dialog-intro">Here's exactly what happens if you continue.</p>
    <div class="reset-dialog-lists">
      <section class="reset-dialog-list reset-dialog-list-reset" aria-labelledby="resetListLabel">
        <h4 id="resetListLabel">What gets reset</h4>
        <ul>
          <li><span class="reset-mark" aria-hidden="true">…</span>Your 10 onboarding answers (vibe, color, decor density, scope, lighting, budget, materials, room use, what to avoid, dealbreaker piece)</li>
          <li><span class="reset-mark" aria-hidden="true">…</span>All saved rooms and redesigns</li>
          <li><span class="reset-mark" aria-hidden="true">…</span>Any in-progress design you haven't finished</li>
          <li><span class="reset-mark" aria-hidden="true">…</span>The first-redesign tutorial (it'll show again next time)</li>
          <li><span class="reset-mark" aria-hidden="true">…</span>Your AI generation history</li>
        </ul>
      </section>
      <section class="reset-dialog-list reset-dialog-list-stays" aria-labelledby="staysListLabel">
        <h4 id="staysListLabel">What stays</h4>
        <ul>
          <li><span class="stay-check" aria-hidden="true">…</span>Your account and sign-in (you'll stay logged in)</li>
          <li><span class="stay-check" aria-hidden="true">…</span>Your email preferences</li>
          <li><span class="stay-check" aria-hidden="true">…</span>Your Pro subscription, if you have one</li>
          <li><span class="stay-check" aria-hidden="true">…</span>Your agreement to Terms of Service</li>
        </ul>
      </section>
    </div>
    <p class="reset-dialog-footer">This can't be undone. Your design history won't come back.</p>
    <div class="reset-dialog-actions">
      <button class="btn btn-ghost" id="resetDialogCancel" type="button" autofocus>Cancel</button>
      <button class="btn reset-dialog-confirm" id="resetDialogConfirm" type="button" aria-describedby="resetHoldHint">
        <span class="reset-dialog-confirm-fill" aria-hidden="true"></span>
        <span class="reset-dialog-confirm-label">Hold to Reset Everything</span>
      </button>
    </div>
    <p id="resetHoldHint" class="reset-dialog-hold-hint muted small">Press and hold for 1 second to confirm.</p>
  </div>
</div>
```

**Marks:** the `.reset-mark` and `.stay-check` are inline SVG (no emoji per CLAUDE.md). Reset list uses a horizontal-line "minus" SVG at muted color; stays list uses the existing checkmark SVG (`<polyline points="5 12 10 17 19 7"/>`) used by `.hp-check` at a calm green.

## Friction pattern locked: 1-second hold-to-confirm

Per Reforge User Psychology — *Apply User Psych: How To Tap Into Emotion* — friction should be proportional to regret cost. Design history loss is high-regret but recoverable in spirit (the user can rebuild preferences in minutes), so 1s hold is appropriate. NOT a typed confirmation (over-charged for a recoverable action — that's reserved for account deletion). NOT just a click (under-charged given the wipe scope).

The button label updates at confirm: "Hold to Reset Everything" → as the fill grows left-to-right, label stays put. On release-before-1s → fill snaps back, no event fired. On full hold → fire confirmed event + close dialog + run reset.

## State + edge cases

- **Default focus:** Cancel button (per spec). Enter without thinking = nothing destructive happens.
- **Escape key:** closes dialog → fires `reset_dialog_cancelled { dismissReason: 'escape' }`.
- **Backdrop click:** closes dialog → `reset_dialog_cancelled { dismissReason: 'backdrop' }`.
- **X close button:** closes dialog → `reset_dialog_cancelled { dismissReason: 'close' }`.
- **Cancel button:** closes dialog → `reset_dialog_cancelled { dismissReason: 'cancel' }`.
- **Hold-released-early:** stays open, no analytics event, fill resets to 0%.
- **Hold-completed:** closes dialog, fires `reset_dialog_confirmed { source }`, runs reset.
- **Mid-dialog navigation (back/deep-link):** dialog closes via the `showScreen()` hook (added: closes any open dialog before navigating). No reset fires.
- **AI generation in flight:** pre-backend, generation is synchronous mock — nothing to cancel. At backend cutover when real Replicate calls land + return promises, add an AbortController hook here (TODO comment in code).
- **Unsaved draft:** wiped along with everything else; no separate "save first?" prompt (per spec — would dilute the dialog's clarity).
- **Small viewport (<540px):** lists stack vertically with "What gets reset" on top. Media query handles this; no JS layout logic.

## Focus trap

Standard Tab cycling between Cancel + Reset (the only focusable elements after the X). On open: store `document.activeElement`, focus Cancel. On close: return focus to the stored element (the original "Reset Profile" button on whichever screen).

## Analytics events

- `reset_dialog_opened { source }` — `source` ∈ `'profile_screen'` | `'preferences_screen'`
- `reset_dialog_cancelled { source, dismissReason }` — `dismissReason` ∈ `'cancel'` | `'escape'` | `'backdrop'` | `'close'`
- `reset_dialog_confirmed { source }` — fires AFTER the hold completes, BEFORE the wipe runs

The pre-existing `profile_reset_design_only` (in `resetUserDesignProfile()`) and `profile_reset_from_preferences` (still fired from the prefs entry point) events are preserved — funnel can compare cancel rates across the dialog AND compare whether prefs-screen vs profile-screen resets convert at different rates.

## Reforge framework citations

- *User Psychology — Apply User Psych — How To Tap Into Emotion (4S):* dialog body is **Specific** (lists exact items wiped + preserved), **Selfish** (uses "your"), **Sensory** (visible progress fill on the hold button), **Simple** (each line is one item, no nested clauses).
- *User Psychology — destructive-action friction:* 1s hold is proportional to regret cost. Reforge ethics — *over*-charged language on reversible-feeling actions trains users to ignore future warnings. Headline avoids "warning / danger / permanent."
- *Trust & Credibility (Brand Marketing — Identity Governance):* the side-by-side WHAT GETS RESET / WHAT STAYS layout is the most important content; users see auth survives at a glance. Honest transparency over panic.
- *Content & Copy (VOICE.md voice rubric — concrete, confident, warm, calm):* no exclamation marks; "What stays" frames the auth-safe message reassuringly; "This can't be undone" is calm-stated, not alarmed.
- *Conflict 4 (no fake numbers):* zero quantitative claims in the dialog.

## Decision: SHIP STRAIGHT THROUGH

No conflicts. No existing component to extend (only `confirm()`). Single dialog, two entry points routed through it.

Implementation order:

1. `<div class="modal reset-dialog">` HTML in `index.html` (placed near the existing modals).
2. CSS for `.reset-dialog`, `.reset-dialog-card`, `.reset-dialog-lists` (with stack-on-mobile media query), `.reset-dialog-confirm` + `.reset-dialog-confirm-fill` hold animation, the reset/stay marks.
3. JS: `openResetDialog({source})`, `closeResetDialog({reason})`, hold-to-confirm wiring, focus trap, navigation-close hook.
4. Replace both `if (!confirm(RESET_CONFIRM_COPY)) return;` call sites with `openResetDialog({source: ...})`.
5. Verify in preview: every entry point opens the dialog; Cancel / Escape / backdrop / X all dismiss; hold completes only after 1s; lists render correctly on desktop + mobile; focus returns post-close; analytics events fire correctly.
