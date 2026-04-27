# AUDIT — ToS + Marketing Consent Block

**Status:** ⚙️ proceeding to implementation — zero blocking conflicts, one ambiguity surfaced + auto-resolved per "approve all changes" policy.
**Created:** 2026-04-26

## Auth surfaces found

Walked the entire codebase. **Exactly one** screen handles signup/signin:

### `data-screen="signin"` (`index.html:134-265`)

Five auth entry paths within this single screen, all of which collect identifying data and therefore all gated by the same `.auth-consent-block`:

| Path | Element | Data collected | Why ToS applies |
|------|---------|----------------|-----------------|
| Google OAuth | `.signin-social-btn[data-provider="google"]` | full account | full signup |
| Apple OAuth | `.signin-social-btn[data-provider="apple"]` | full account | full signup |
| Amazon OAuth | `.signin-social-btn[data-provider="amazon"]` | full account | full signup |
| Email/password form | `#signinForm` → `#signinSubmit` | email + password + name | full signup |
| **Soft email-capture lane** | `#signinSoftForm` (Conflict 5) | email only (transactional save-design) | We're capturing + processing an email address — ToS applies even though no account is created. Marketing checkbox honored independently. |

**Consent block placement:** ONE `.auth-consent-block` element directly below the `<p class="subtle" id="signinSubtitle">` and ABOVE the `.signin-social` group. Same instance gates all 5 paths.

### Other surfaces checked (no auth gate needed)

- **`data-screen="profile"`** — has Switch Account + Sign Out + Reset Profile but no signup. Switch Account routes back to `data-screen="signin"` (where the consent block lives). Sign Out is the inverse — no consent applies.
- **Profile-screen settings** — needs a NEW "Email Preferences" `.pp-setting` row that toggles `state.user.marketingOptIn` post-signup, per the spec's "revocable" requirement.
- **Profile-select / capture / quiz / results / paywall** — no auth entry points; no block needed.

### Ambiguity surfaced + auto-resolved

**Q:** Does the soft email-capture lane (Conflict 5) need ToS gating? It's not a "signup" — it stashes `state.user.recoveryEmail` for transactional save-the-design purposes only.

**A (auto-resolved):** YES. We're storing an email and processing it (eventually emailing the user their saved redesign). Per GDPR/CCPA, even transactional email collection requires terms agreement. Per the spec: "Both checkboxes appear once, above the auth options ... so they apply to every signup path uniformly." Soft-capture sits within the signin screen ⇒ gated by the same block.

**Marketing opt-in for soft-capture:** the marketing checkbox is honored regardless of which path the user takes. If a soft-capturer checks the marketing box, `state.user.marketingOptIn = true` is set even though no account exists yet. When/if they later complete a full signup, the marketing-opt-in carries forward.

## Component design

### `<div class="auth-consent-block" data-auth-consent>`

Sits above `.signin-social` on the signin screen. Real `<input type="checkbox">` elements wrapped in `<label>` for accessibility (screen readers + keyboard nav supported natively).

```html
<div class="auth-consent-block" data-auth-consent>
  <label class="consent-row consent-row-required">
    <input type="checkbox" id="tosConsent" data-consent="tos" />
    <span class="consent-text">
      I agree to the
      <a href="#" class="consent-link" data-go="terms">Terms of Service</a>
      and
      <a href="#" class="consent-link" data-go="privacy">Privacy Policy</a>
    </span>
  </label>
  <label class="consent-row consent-row-optional">
    <input type="checkbox" id="marketingConsent" data-consent="marketing" />
    <span class="consent-text">
      Send me product updates, redesign tips, and occasional offers
    </span>
  </label>
</div>
<p class="auth-consent-helper" id="authConsentHelper" hidden>
  Agree to terms above to continue
</p>
```

**Default state:** both checkboxes unchecked. Per the spec: "Pre-checking the required one is a darker pattern (implies consent the user didn't give) — leave it unchecked." And per User Psychology + GDPR/CCPA: the marketing one MUST be unchecked.

### Disabled-state behavior

- All 5 auth buttons get `disabled` attribute + `.auth-blocked` class.
- `.auth-blocked` CSS: opacity 0.55, cursor not-allowed, suppressed hover state — visibly disabled, not just functionally.
- Soft email-capture submit button gets the same treatment.
- `#authConsentHelper` paragraph is shown (`[hidden]` removed) below the form when ToS is unchecked, with copy "Agree to terms above to continue" — concrete + warm + calm per VOICE.md.
- When ToS check fires `change` event → re-evaluate gate state.

### State persistence (locked schema)

| Field | Type | Set when | Synced |
|-------|------|----------|--------|
| `state.user.tosAcceptedAt` | number (ms) | full signup OR soft-capture submit, after ToS box checked | yes (next backend pull/push round-trip) |
| `state.user.tosVersion` | string | same moment; reads from `FURNISH_TOS_VERSION` constant | yes |
| `state.user.marketingOptIn` | boolean | same moment; reflects checkbox state at submit time | yes |
| `state.user.marketingOptInAt` | number | when marketing was last toggled to `true` | yes |
| `FURNISH_TOS_VERSION` | constant in `app.js` | hardcoded `'2026.04.26'` initially; bump when terms change | source of truth |

### Re-consent flow (scaffold only — not triggered)

- On every boot: compare `state.user.tosVersion` vs `FURNISH_TOS_VERSION`.
- If mismatch AND user is signed in: set `state._tosReconsentRequired = true`.
- A future paywall-style modal can read this flag and prompt re-consent.
- Pre-launch we never bump the version, so this is dead code — but the contract is in place so future-Hassan doesn't have to refactor when terms change.

## Surfaces to add

1. **`<div class="auth-consent-block">`** in `data-screen="signin"`, above `.signin-social`.
2. **`<p class="auth-consent-helper">`** below the email/password form.
3. **`data-screen="terms"`** stub screen with placeholder copy.
4. **`data-screen="privacy"`** stub screen with placeholder copy.
5. **"Email Preferences" `.pp-setting`** in profile screen with embedded toggle (matches the existing Sound Effects pattern).
6. **`mountAuthConsentGate(scopeEl)`** function in app.js — wires checkboxes to button state + helper visibility + analytics.

## Analytics events

Per the spec:

- `tos_consent_checked` — fires on ToS checkbox `change` → checked
- `tos_consent_unchecked` — fires on ToS checkbox `change` → unchecked
- `marketing_consent_checked` — fires on marketing checkbox `change` → checked
- `marketing_consent_unchecked` — fires on marketing checkbox `change` → unchecked
- `signup_blocked_no_consent` — fires when user clicks any auth button while ToS unchecked

All flow through existing `trackEvent()` + auto-fanout to PostHog at backend cutover.

## Reforge framework citations

- **Trust & Credibility (Brand Marketing — Identity Governance, Dim 10):** consent UX is a brand-trust surface. A pre-checked marketing box at the conversion moment kills the trust the OKT is built on. Honest defaults preserve the brand asset.
- **User Psychology (Apply User Psych — How To Tap Into Emotion, Dim 02):** the helper microcopy "Agree to terms above to continue" is concrete + selfish ("you") via implied direct address + simple. Avoids the "we require you to..." legalistic register.
- **Conversion Optimization (Convert and Activate, Dim 03):** consent friction lands BEFORE the auth options visually so the user reads + agrees before encountering the conversion CTA. Reduces decision overhead + ambiguity at the click moment. Per the Reforge Decision Hill: any cognitive obstacle stacked between intent and action drains psych — but a single concrete required step (vs. a scattered post-click surprise) actually clarifies the path forward.
- **Conflict 4 (no fake numbers):** consent copy uses zero quantitative claims. "Occasional" is qualitative and defensible.

## Deferred items (DEFERRED.md)

1. **Real ToS + Privacy Policy legal copy** — lawyer task. Stub pages ship with "Terms of Service draft pending legal review" placeholder. Replace before launch.
2. **Marketing email send infrastructure** — backend phase (already in DEFERRED.md item 6 "Email lifecycle"). The `marketingOptIn` flag is captured client-side now; SMTP wiring at cutover reads it.
3. **Re-consent flow trigger when ToS version bumps** — scaffold the version-check on boot now; the actual modal prompt UX defers until we have a real backend pushing version changes.

## Decision: SHIP STRAIGHT THROUGH

No conflicts with existing locked decisions. No half-built ToS surfaces in the codebase. The single ambiguity (does soft-capture need gating?) is auto-resolved YES per the explicit spec wording + GDPR alignment.

Implementation order:

1. Constants + state schema (`FURNISH_TOS_VERSION`, helpers) in `app.js`
2. `.auth-consent-block` + `.auth-consent-helper` HTML in `data-screen="signin"`
3. CSS for consent block + `.auth-blocked` disabled state
4. `mountAuthConsentGate()` in `app.js` + signin screen wire-up
5. Stash on submit (full + soft-capture paths)
6. `data-screen="terms"` + `data-screen="privacy"` stub HTML
7. Routing wire-up so `data-go="terms"` / `data-go="privacy"` activate them
8. "Email Preferences" `.pp-setting` row in profile screen + handler
9. Analytics events on every checkbox change + blocked submit attempt
10. DEFERRED.md additions
11. Preview verify
12. Commit
