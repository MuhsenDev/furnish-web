# Creative Brief: Errors & Empty States

**Source frameworks:** Reforge *Brand Marketing — Defining Your Brand Personality* (warmth principle, attitudinal ranges) + *PM Foundations — Feature Design* (edge cases as first-class deliverables).
**Surface owner:** every `toast()` call in `app.js`; every `<div class="empty-state">` in `index.html`; every error path in capture flow, signin flow, and AI generation.
**Audience:** users in friction. Highest-leverage warmth surface in the app.

---

## Background

Empty states and errors are where the brand voice either preserves trust or breaks it. Per Reforge brand identity (verbal cues, point 75 of *Building Blocks of Brand Identity*): "the order, rhythm, and pacing of diction" — honest tone IS a brand asset.

Furnish has historically improvised these. Batch 1 audit found 5 violations in 20 sampled strings; most were errors and empty states.

---

## Guardrails

- **Voice rubric** (locked): Concrete, Confident, Warm, Calm.
- **Never blame the user.** *"You uploaded a bad file"* → forbidden.
- **Apologize once, briefly, only when system's fault.** No groveling.
- **Surface the constraint** so the user can fix it (file size, format, network).
- **One CTA, max.**
- **No "Oops!", no sad-trombone tone, no exclamation marks.**
- **Title Case on action buttons; sentence case on body.**

---

## Wording restrictions

**Must appear (locked Batch 1 copy):**

Errors:
- Image too large: *"Image is over 12MB. Try a smaller photo or screenshot."*
- Wrong file type: *"That file isn't a photo. Try a JPG or PNG."*
- Sign-in failed (fallback): *"That email and password don't match. Try again or reset your password."* (real backend error.message preserved when available)
- Camera fallback: *"Camera not available — try Upload from gallery."*

Empty states:
- Wishlist empty: *"Save items to track price drops."*
- Rooms empty: *"Snap a photo to design your first room."*
- (Future) Versions empty: *"Reshuffle to save a version. Each one stays here."*

Toasts (state changes):
- Welcome (signup): *"Welcome, {name}."* (period, not exclamation)
- Welcome (signin): *"Signed in."*
- Sign-out: *"Signed out."*
- Reshuffle: *"Different items, same style."*
- Off-vote: *"Got it — pulling a different direction…"*

**Must NOT appear:**
- *"Oops!"*, *"Sorry!"* with exclamation
- *"Looks like…"* (sad-trombone framing)
- *"Something went wrong"* without recovery action
- Tech-speak (stack traces, error codes the user can't act on)
- Multiple CTAs in one error/empty surface
- Exclamation marks (Warmth-6 limit per VOICE.md)

---

## One Key Takeaway

> **Your household, your style, sharper.**

Empty states + errors don't restate the OKT. Their job is to keep the user in the funnel by **forgiving + offering the next action**. Voice rubric (Concrete, Confident, Warm, Calm) is the test — if the line passes, it ladders up to the OKT by inheritance.

---

## Proof point pillars

Errors + empty states reinforce the **functional pillar** by being action-oriented (here's what to do next), not the OKT directly.

The "may not fit" warning is its own structural proof point per Dim 10 Recommendation 4 — honest disclosure as a feature, not a warning. Locked Batch 1 copy: *"Wider than your room. Verify before buying."* / *"Deeper than your room. Verify before buying."* / *"Larger than your room's footprint. Verify before buying."* (custom SVG warning icon, no emoji).

---

## Patterns

### Errors

```
Error layout:
  [What happened in user-language] [Recovery action].

Examples:
  "Image is over 12MB. Try a smaller photo or screenshot."
  "That file isn't a photo. Try a JPG or PNG."
  "We couldn't reach the server. Tap to retry."
```

### Empty states

```
Empty layout:
  [Value the surface enables, named].
  [One CTA, optional].

Examples:
  "Save items to track price drops."
  "Snap a photo to design your first room."
  "Reshuffle to save a version. Each one stays here."
```

### Toasts

```
Toast layout:
  [Confirmation in 1-3 words]. [Optional 1-clause context].

Examples:
  "Profile renamed."
  "Different items, same style."
  "Got it — pulling a different direction…"
```

---

## Measurement

- `error_shown { type, surface }` (TBD — Dim 13 instrumentation pass)
- `empty_state_shown { surface }` (TBD)
- Toast rendering: not tracked individually (low signal-to-noise)
- Error → recovery rate: tracked downstream (e.g., did they upload again after an "Image is over 12MB" error?)

---

## Audit list (recurring)

These specific surfaces should be re-audited every batch:

- Capture screen errors (file type, file size, camera permission, HTTPS)
- Signin errors (email mismatch, OAuth failure, network)
- Wishlist + rooms empty states
- Toasts on profile changes (rename, switch, delete)
- Reshuffle, swap, save toasts
- Aha feedback toasts (Love, Close, Off)
- Premium upsell + paywall conversion toasts

If any audit finds a banned-pattern toast (exclamation, *"Oops"*, blame, multiple CTAs), fix in the same batch.
