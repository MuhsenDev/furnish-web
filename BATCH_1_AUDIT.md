# BATCH 1 AUDIT — Dim 09 (Content & Copy) + Dim 10 (Trust & Credibility) + Dim 14 (Edge Cases)

**Status:** ⏸ AWAITING APPROVAL — Hassan, review before I implement.
**Created:** 2026-04-26
**Source dimensions:** Dim 09 (12 entries, 95% Reforge), Dim 10 (10 entries, 80% Reforge — 20% [ORIGINAL]), Dim 14 (11 entries, 82% Reforge)
**Total proposed changes:** 47 across 5 files + 2 new files
**Implementation order (per Hassan):** Copy → Trust → Edge Cases

---

## 0. CONFLICTS TOUCHING THIS BATCH

⚠ **All 9 conflicts in CONFLICTS_RESOLVED.md are still PENDING.** Five of them touch this batch. Hassan, you need to decide these 5 before I can ship the affected items below.

| # | Conflict | Status | Items in this batch it blocks |
|---|----------|--------|-------------------------------|
| 1 | Quarterly Core + Weekly Supplemental retention shape | PENDING | Dim 09 D4 (activation banner copy direction) — copy is state-aware either way, but the *orientation* (redesign-driven vs weekly-engagement-driven) depends on the flip call |
| 2 | Pro-trial-for-both referral currency | PENDING | Dim 09 Section C Template 7 (referral success copy); `index.html:936` share modal referral note ("1 month of Furnish Pro free") |
| 3 | "Coming soon" Pro bullets vaporware | PENDING | Dim 09 D6; `index.html:997, 999` (the two `<span class="paywall-soon">coming soon</span>` bullets — Multi-room batch, Style learns over time) |
| 4 | Fictitious social proof anchors | PENDING | Dim 09 D3, D4, D5; Dim 10 #1, #3, #6, #8; touches `index.html:80, 108, 955, 974` and `app.js:6343` |
| 9 | "~30 seconds" microcopy Promise-Fit violation | PENDING | Dim 09 audit string #3 (currently graded GOOD but Conflict 9 wants rewrite); Dim 10 #8 (tagline trust shift, replaces "20 seconds" claim too) |

Conflicts 5, 6, 7, 8 do not touch this batch.

**Recommended action:** Decide Conflicts 1, 2, 3, 4, 9 in CONFLICTS_RESOLVED.md before approving this batch — otherwise the BLOCKED items below ship in a stale state and we have to revisit them next batch. **Conflicts 3 and 4 are high-confidence approves** in my CONFLICTS_RESOLVED.md proposals; Conflicts 1 and 2 need real strategic calls.

---

## 1. NEW CONTRADICTIONS DISCOVERED DURING AUDIT (not in OPTIMIZATION_PLAN.md)

These were not in the original 9-conflicts list but surfaced as I walked the code. Per Hassan's rules: "Anything contradicting already-shipped work goes in CONFLICTS section of the audit, do not silently resolve."

### NC-1 — Dim 10 Recommendation 5 ("V2 affiliate disclosure") proposes a 💡 emoji

The proposed copy block:
```
💡 How Furnish makes money: ...
```

This **directly contradicts** `CLAUDE.md` convention: *"Custom SVG icons everywhere — no emoji in user-facing UI. If you find one, replace it."* Marked [ORIGINAL] in Dim 10 (the icon choice was Claude's, not Reforge-prescribed).

**Resolution proposal:** Replace the 💡 emoji with a custom SVG lightbulb icon (style consistent with the other custom SVG icons throughout the app — 14×14 stroke-based). Keeps the visual anchor, honors the no-emoji rule.

### NC-2 — Dim 10 Recommendation 4 ("✓ AI flagged: may not fit") proposes a ✓ checkmark prefix

Same emoji-rule concern. ✓ is a Unicode check mark (U+2713), classified as "Dingbat" — borderline emoji. Currently the app uses custom SVG checkmarks elsewhere (e.g., paywall bullets at `index.html:996-1002` use `<span class="bullet">✓</span>` — the "✓" is wrapped in a styled span, not raw emoji).

**Resolution proposal:** Match the existing `.bullet` pattern — wrap in a styled span or use a custom SVG. The existing paywall pattern is already approved precedent.

### NC-3 — "1 designer + 1 dev" claim from Dim 10 may be inaccurate

Dim 10 Section A.1 Option A proposes: `Built by 1 designer · Real photos · Real catalog`
Dim 10 Section C.1 V3 proposes: `Built by 1 designer + 1 dev. Real catalog.`
Dim 10 Recommendation 1 diff uses: `Built by 1 designer`

But ABOUT_FURNISH.md says "Founded by me Hassan" with no mention of a co-founder, and CLAUDE.md says "Owner: Hassan" (singular). If Hassan is solo, the V3 "1 designer + 1 dev" copy is fictitious and creates the same Reforge brand-governance violation that Conflict 4 is about (per *Brand Marketing → Evangelizing Brand Guidelines* p.21).

**Resolution proposal:** Need Hassan to confirm the team count. Three options to ship:
- (a) "Built by 1 person" — most accurate if solo
- (b) "Built by Hassan" — founder-credibility frame, even more on-trend
- (c) "1 designer + 1 dev" — only if a 2nd person is real

I recommend (b) — "Built by Hassan" is differentiating and avoids any future "but didn't you say 1 designer?" if a hire happens.

### NC-4 — Dim 10 Recommendation 6 ("Live room counter") depends on backend

The recommendation needs a Supabase query: `.from('rooms').select('id', { count: 'exact', head: true }).gte('created_at', ...)`. Currently the Furnish state is localStorage-only with optional Supabase sync. The live counter requires:
- Supabase be configured (not the default — placeholder credentials in `supabase-config.js`)
- A `rooms` table that aggregates across all users (not just user-private rows)
- Anonymous-readable count aggregation (security policy work)

**Resolution proposal:** Defer Recommendation 6 to backend phase. Document in DEFERRED.md as a new sub-item under the "Real backend phase" section. Ship Recommendation 1 Option A (the static honest anchor) now; Option B (live counter) becomes available post-backend.

### NC-5 — Two MORE fictitious "12,400+" / "2,400+" claims found beyond Dim 10's audit

Dim 10's Section A audit table lists 2 instances of fictitious anchors. I found **5 total** in current code:

1. `index.html:80` — "12,400+ rooms designed" (welcome hero — already in Dim 10 audit)
2. `index.html:108` — "**4.8** · 2,400+ designs unlocked this week" (D7 reveal-gate hero — NOT in Dim 10 audit)
3. `index.html:955` — "Most members redesign 4–7 rooms in their first month..." (paywall sub — already in Dim 10 audit)
4. `index.html:974` — "4.8 · 2,400+ reviews" (paywall card stars — already in Dim 10 audit)
5. `app.js:6343` — "12,400+ homes designed this month" (live-counter rotation in review ticker — NOT in Dim 10 audit)

If Conflict 4 is approved as-written, all 5 need to be addressed. Dim 10's audit only covers 3. **Adding the 2 missed instances to this batch's scope.**

---

## 2. CHANGES BY FILE

### 2.1 `index.html` — 14 changes

#### IDX-1 — Welcome hero tagline (line 51)
**Source:** Dim 10 #8, Dim 09 audit row #1. Conflict 9 (PENDING) — affects this.
**Current:**
```html
<p class="tagline">Watch any room transform in 20 seconds.</p>
```
**Proposed (if Conflict 9 approved as written):** Keep "20 seconds" but verify the post-AI-cutover Flux timing supports it (Flux Schnell ~10–20s; Flux Kontext Pro ~15–45s). Dim 10 #8 offers 3 alternative tagline options. Dim 09 audit grades current GOOD. Hassan's call.
**If Conflict 9 unresolved:** SKIP this line; revisit after.
**Reforge cite:** Per Reforge *Product Marketing → Finding Your One Key Takeaway* (OKT lesson p.12) and *Brand Marketing → Promise-Fit principle*.
**Effort:** S (5 min — copy edit only).
**[BLOCKED BY CONFLICT 9]**

#### IDX-2 — Welcome subtext (line 75)
**Source:** Conflict 9 (PENDING) — direct.
**Current:**
```html
<p class="muted small">No signup needed · ~30 seconds</p>
```
**Proposed (if Conflict 9 approved):** `No signup needed · See your redesign in under 2 minutes.`
**Reforge cite:** Per Reforge *Brand Marketing → Promise-Fit principle*.
**Effort:** S (1 min).
**[BLOCKED BY CONFLICT 9]**

#### IDX-3 — Welcome social proof (lines 76-81)
**Source:** Dim 10 Recommendation 1, Dim 09 audit row #4. Conflict 4 (PENDING) — direct.
**Current:**
```html
<div class="welcome-proof" aria-label="Social proof">
  <span class="wp-stars">★★★★★</span>
  <span class="wp-rating">4.8</span>
  <span class="wp-dot">·</span>
  <span class="wp-count" id="wpCount">12,400+ rooms designed</span>
</div>
```
**Proposed (if Conflict 4 approved):** Remove fictitious anchor. Per Conflict 4 my recommendation, replace with positioning claim:
```html
<div class="welcome-proof" aria-label="Trust signals">
  <span class="wp-icon">★</span>
  <span class="wp-claim">Real catalog</span>
  <span class="wp-dot">·</span>
  <span class="wp-claim">Real prices</span>
  <span class="wp-dot">·</span>
  <span class="wp-claim">Built by Hassan</span>
</div>
```
(Pending NC-3 resolution on team count — using "Hassan" placeholder.)
**Reforge cite:** Per Reforge *Brand Marketing → Evangelizing Brand Guidelines* point 21 + *Product Marketing → Building Proof Point Pillars* lesson 04.
**Effort:** S (5 min HTML + small CSS class swap).
**[BLOCKED BY CONFLICT 4 + NC-3]**

#### IDX-4 — D7 reveal-gate trust strip (line 108)
**Source:** NC-5 (newly discovered). Conflict 4 (PENDING) — affects.
**Current:**
```html
<span class="srh-trust-text"><strong>4.8</strong> · 2,400+ designs unlocked this week</span>
```
**Proposed (if Conflict 4 approved):** Replace with verifiable claim. Options:
- `<strong>Cancel before day 7</strong> · No charge if it's not for you` (loss-aversion + truth)
- `<strong>Real catalog</strong> · Every piece is shoppable` (positioning)
**Reforge cite:** Per *Brand Marketing → Evangelizing Brand Guidelines* p.21.
**Effort:** S (2 min).
**[BLOCKED BY CONFLICT 4]**

#### IDX-5 — "No rooms yet." empty state (line 484)
**Source:** Dim 09 Section B.3.
**Current:**
```html
<p>No rooms yet.</p>
```
**Proposed:**
```html
<p>Snap a photo to design your first room.</p>
```
**Reforge cite:** Per Reforge *Brand Marketing → Defining Your Brand Personality* (warmth principle, never blame the user).
**Effort:** S (1 min).
**SHIPPABLE.**

#### IDX-6 — Affiliate disclosure V2 (lines 766-769) [+ CSS in styles.css]
**Source:** Dim 10 Recommendation 5. NC-1 (emoji contradiction).
**Current:**
```html
<p class="affiliate-disclosure">
  Furnish earns a commission on items you buy through these links — at no extra cost to you.
  <a id="affiliateLearnMore">Learn how</a>
</p>
```
**Proposed (with NC-1 resolution applied):**
```html
<div class="affiliate-disclosure-v2">
  <div class="adv2-row">
    <span class="adv2-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M2 9a8 8 0 1 1 14.4 4.8L15 16H9l-1.4-2.2A8 8 0 0 1 2 9z"/></svg>
    </span>
    <strong>How Furnish makes money:</strong>
  </div>
  <p class="adv2-body">
    We earn a commission when you buy items through our redesigns.
    <strong>We don't get paid more for pricier items.</strong>
    <strong>We don't sell your photos.</strong>
    <a id="affiliateLearnMore">Read the full FTC disclosure →</a>
  </p>
</div>
```
**Reforge cite:** Per Reforge *Brand Marketing → Brand Identity Governance* + Hassan's locked Affiliate-Maximalist decision.
**Effort:** M (30 min HTML + 15 min CSS in styles.css + 5 min light/dark QA).
**SHIPPABLE.**

#### IDX-7 — "No saved items yet." wishlist empty state (line 842 fallback)
**Source:** Dim 09 Section B.3 (proposed table row).
**Current:**
```html
<p>No saved items yet.</p>
```
**Proposed:**
```html
<p>Save items to track price drops.</p>
```
**Reforge cite:** Per Reforge *Brand Marketing → Defining Your Brand Personality* (warmth, never blame).
**Effort:** S (1 min).
**SHIPPABLE.** Note: this exact string is duplicated in `app.js:5820` — both must change together. See APP-12.

#### IDX-8 — Share modal referral note (line 936)
**Source:** Conflict 2 (PENDING) — direct.
**Current:**
```html
<p class="share-referral-note muted small">Invite link gives the recipient 1 month of Furnish Pro free. You get a free month when they convert.</p>
```
**Proposed (if Conflict 2 approved):** Per my Conflict 2 recommendation (currency switch to credit-pack):
```html
<p class="share-referral-note muted small">Invite link unlocks 3 Pro-quality redesigns + multi-profile + HD export for both of you. Redeemable any time within 6 months.</p>
```
**Reforge cite:** Per *Advanced Growth Strategy → Financial Viral Loops Lesson 3* (currency-alignment).
**Effort:** S (2 min).
**[BLOCKED BY CONFLICT 2]**

#### IDX-9 — Paywall sub fictitious "4-7 rooms" claim (line 955)
**Source:** Dim 09 D3, Dim 10 #3 partial. Conflict 4 (PENDING) — direct.
**Current:**
```html
<p class="subtle paywall-sub" id="paywallSub">Most members redesign 4–7 rooms in their first month. Pro upgrades the AI quality that powers each one — for less than a coffee a month.</p>
```
**Proposed (if Conflict 4 approved):** Per Dim 09 D3:
```html
<p class="subtle paywall-sub" id="paywallSub">Pro upgrades the AI on every redesign — sharper matches, better lighting, no compromises. $5.99/month, founding-member rate.</p>
```
**Reforge cite:** Per *Brand Marketing → Defining Your Brand Personality* p.7 (consistency = trust) + *Product Marketing → Building Proof Point Pillars* p.4 (proof must be backed by research).
**Effort:** S (1 min).
**[BLOCKED BY CONFLICT 4]**

#### IDX-10 — Paywall card stars/reviews fictitious (line 974)
**Source:** Dim 10 Recommendation 3. Conflict 4 (PENDING) — direct.
**Current:**
```html
<span class="paywall-social-text">4.8 · 2,400+ reviews</span>
```
**Proposed (if Conflict 4 approved):** Per my Conflict 4 recommendation, drop the social proof block at first. If visual gap, replace with promote-to-badge of cancel policy:
```html
<span class="paywall-social-text">Cancel before day 7 — no charge. We don't auto-bill surprise.</span>
```
**Reforge cite:** Per *User Insights for Product Decisions* — claims you can't back are reputational debt.
**Effort:** S (2 min).
**[BLOCKED BY CONFLICT 4]**

#### IDX-11 — "Coming soon" Pro bullets (lines 997, 999)
**Source:** Dim 09 D6. Conflict 3 (PENDING) — direct.
**Current:**
```html
<li><span class="bullet">✓</span> Multi-room batch design <span class="paywall-soon">coming soon</span></li>
...
<li><span class="bullet">✓</span> Style learns over time <span class="paywall-soon">coming soon</span></li>
```
**Proposed (if Conflict 3 approved):** Remove both lines from the bullet list. Replace with stronger real bullets per my Conflict 3 recommendation. Add a roadmap teaser block after `index.html:1005`:
```html
<!-- After paywall-urgency div, before paywall-actions -->
<div class="paywall-roadmap">
  <p class="paywall-roadmap-label">On the roadmap (Q3 2026):</p>
  <p class="paywall-roadmap-items">Multi-room batch design · Style that learns over time</p>
</div>
```
Add new bullet to replace the 2 removed: `<li><span class="bullet">✓</span> Priority access to new styles + seasonal collections</li>`
**Reforge cite:** Per *Monetization + Pricing → Packaging Strategies* (don't price what doesn't exist) + *Brand Marketing → Brand Governance*.
**Effort:** M (30 min HTML + small CSS for `.paywall-roadmap`).
**[BLOCKED BY CONFLICT 3]**

#### IDX-12 — Photo tip card (insert after `#photoFrame`, before `.capture-actions`)
**Source:** Dim 14 Section A Phase 1 + Top 3 #2.
**Current:** No tip card exists on capture screen.
**Proposed:** Add tip card with 1 example image:
```html
<!-- Insert after #photoFrame, before .capture-actions -->
<div class="photo-tip" id="photoTip" data-dismissible="true">
  <img class="photo-tip-example" src="assets/tip-example.jpg" alt="Example: brightly lit living room from doorway angle">
  <p class="photo-tip-copy">Brightly lit, full-room view works best.</p>
  <button class="photo-tip-dismiss" aria-label="Dismiss" type="button">×</button>
</div>
```
**Asset needed:** `assets/tip-example.jpg` (Hassan to provide — 1 hand-curated example of a good room photo).
**Reforge cite:** Per *Retention + Engagement → Setup Moment Experience* p.5 ("MUST-HAVE info to enable Aha"); 1-example principle from *User Insights*.
**Effort:** S (HTML+CSS ~30 min, asset is Hassan's task).
**SHIPPABLE.** (After Hassan provides the example image OR I ship without and we fill in later.)

#### IDX-13 — "Different Style?" CTA on Reveal screen
**Source:** Dim 14 Section C Top 3 #1 (HIGHEST-LEVERAGE EDGE FIX).
**Current:** Only `Shop The Whole Room` + `Reshuffle` are available on Reveal — no style pivot.
**Proposed:** Add `Different Style?` button next to `Shop The Whole Room`:
```html
<!-- index.html, after #shopAllBtn (line 757-760) -->
<button class="btn btn-ghost shop-all-btn" id="differentStyleBtn">
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-right:6px"><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"/><path d="M9 12h6"/><path d="M12 9v6"/></svg>
  Different Style?
</button>
```
Plus JS handler that opens a 6-style-chip modal allowing 1-tap pivot (re-runs `pickItemsForRoom` with new style override, no AI compute call). See APP-21.
**Reforge cite:** Per *Retention + Engagement → Strategies For At-Risk Users → Strategy Two: Use Case Transition* (Trello wedding-planning → personal todo example).
**Effort:** L (1-2 days — modal + handler + state plumbing).
**SHIPPABLE.** This is the single biggest revenue-leak fix in this batch.

#### IDX-14 — Email-stash card on capture screen [PHASE 2 / requires backend]
**Source:** Dim 14 Section E Fix 1.
**Current:** No email capture before photo upload.
**Proposed:** Soft email-only stash card above photo frame. **Note: this overlaps with Conflict 5 (D7 soft email lane) which is also PENDING.** If Conflict 5 is approved, this should ship there instead — same lane, same `state.user.recoveryEmail` mechanism. Avoid double-implementing.
**Reforge cite:** Per *Retention + Engagement → Setup Moment Experience* p.5-6 + *Resurrecting Voluntary Dormant Users → Step #4: Channel*.
**Effort:** M (depends on Conflict 5 resolution).
**[BLOCKED BY CONFLICT 5 — coordinate with batch covering D7 reveal gate]**

---

### 2.2 `app.js` — 28 changes

#### APP-1 — `FURNISH_OKT` constant (insert near top, ~line 50)
**Source:** Dim 09 D1. **[ORIGINAL]** for the specific 5-word OKT phrase (Reforge framework is the OKT lesson; the specific words "Your household, your style, sharper" are Claude's pick).
**Current:** No OKT defined.
**Proposed:**
```js
// Top of app.js, before LIFECYCLE constants.
// Single source of truth — every paywall sub, every welcome refresh,
// every email subject pulls from this.
const FURNISH_OKT = Object.freeze({
  takeaway: 'Your household, your style, sharper.',
  clarifier: 'Furnish redesigns any room in 20 seconds, in your style, with shoppable furniture — and a separate profile for everyone in your house.',
  pillars: {
    functional: 'Watch any room transform in 20 seconds.',
    emotional:  'Sharper redesigns, every time.',
    accrued:    'A profile for everyone in your house.',
  },
});
window.FurnishOKT = FURNISH_OKT;
```
**Reforge cite:** Per *Product Marketing → Finding Your One Key Takeaway* (Strategic Emphasis Archetypes, p.4) — Audience-Based archetype.
**Effort:** S (10 min).
**SHIPPABLE.** Hassan, please confirm the 5 words "Your household, your style, sharper." OR provide an alternative — this is YOUR positioning, not mine.

#### APP-2 — Welcome toast `!` removal (lines 612, 631)
**Source:** Dim 09 D10.
**Current (both lines):**
```js
toast(signinMode === 'signup' ? `Welcome, ${state.user.name}!` : 'Signed in');
```
**Proposed (both lines):**
```js
toast(signinMode === 'signup' ? `Welcome, ${state.user.name}.` : 'Signed in.');
```
**Reforge cite:** Per *Brand Marketing → Defining Your Brand Personality* p.17 (Attitudinal Ranges — warmth between "friendly" and "saccharine"; ! pulls toward saccharine).
**Effort:** S (1 min).
**SHIPPABLE.**

#### APP-3 — FAQ toast `!` removal (line 813)
**Source:** Dim 09 D10.
**Current:** `toast('FAQ coming soon — you\'re early!');`
**Proposed:** `toast('FAQ coming soon. You\'re early.');`
**Reforge cite:** Per *Brand Marketing → Attitudinal Ranges*.
**Effort:** S (1 min).
**SHIPPABLE.**

#### APP-4 — Free card footer copy (line 1005)
**Source:** Dim 09 D11.
**Current:** `footer: "You're on this plan. Want more? →",`
**Proposed:** `footer: "You're on Free. Pro is below.",`
**Reforge cite:** Per *Product Marketing → Building Proof Point Pillars* (benefits over salesmanship); *Brand Marketing → Confidence-8 doesn't beg*.
**Effort:** S (1 min).
**SHIPPABLE.**

#### APP-5 — `PAYWALL_COPY.generic` rewrite (line 1075)
**Source:** Dim 09 D2.
**Current:**
```js
generic: {
  title: 'Unlock Furnish Pro',
  sub: 'Premium AI quality, multi-room batch, HD downloads, and every style profile your household needs.',
},
```
**Proposed:**
```js
generic: {
  title: 'Sharper redesigns. Every household.',
  sub: 'Pro upgrades the AI on every redesign and adds a separate style profile per person. The features below are why.',
},
```
**Reforge cite:** Per *Product Marketing → Building Proof Point Pillars* (House Framework — OKT roof above, pillars below; sub restates OKT, NOT feature list); per *Building Proof Point Pillars* p.5.
**Effort:** S (2 min).
**SHIPPABLE.** Note: depends on APP-1 (OKT) being approved. If APP-1 has different words, this copy adjusts to match.

#### APP-6 — Sign-in failed toast (line 587)
**Source:** Dim 09 Section B.4.
**Current:** `toast(result.error.message || 'Sign in failed');`
**Proposed:**
```js
toast(result.error.message || 'That email and password don\'t match. Try again or reset your password.');
```
Note: when there's a real `result.error.message` from Supabase, it stays — only the fallback message changes.
**Reforge cite:** Per *Brand Marketing → Defining Your Brand Personality* (errors must explain + recover).
**Effort:** S (1 min).
**SHIPPABLE.**

#### APP-7 — "Welcome to Furnish Pro" toast (line 1161)
**Source:** Dim 09 D10 review.
**Current:** `toast("Welcome to Furnish Pro — 7-day trial started");`
**Proposed:** No change. Already no `!`. Verify after audit pass — leave as-is.
**SHIPPABLE — no change required.**

#### APP-8 — "Pick an image file" error (line 1842)
**Source:** Dim 09 Section B.4.
**Current:** `toast('Pick an image file');`
**Proposed:** `toast('That file isn\'t a photo. Try a JPG or PNG.');`
**Reforge cite:** Per *Brand Marketing → Defining Your Brand Personality* (errors specify constraint + recovery).
**Effort:** S (1 min).
**SHIPPABLE.**

#### APP-9 — "Image too large" error (line 1843)
**Source:** Dim 09 Section B.4 + Section A.5 row #19.
**Current:** `toast('Image too large (12MB max)');`
**Proposed:** `toast('Image is over 12MB. Try a smaller photo or screenshot.');`
**Reforge cite:** Per *Brand Marketing → Defining Your Brand Personality* (errors offer recovery).
**Effort:** S (1 min).
**SHIPPABLE.**

#### APP-10 — Aha "off" vote learning (lines 5722-5725)
**Source:** Dim 14 Section B Fix 1.
**Current:**
```js
if (vote === 'off')   {
  toast('Reshuffling with a different mix…');
  setTimeout(() => $('#reshuffleBtn')?.click(), 500);
}
```
**Proposed:** Add 24h soft-avoid for current style on Off-vote, plus toast that explains the change:
```js
if (vote === 'off') {
  // Negative-weight the current style for this profile's next 24h of generations.
  state.user._styleAvoid = state.user._styleAvoid || {};
  const profile = state.profiles.find(p => p.id === room.profileId);
  (profile?.styles || []).forEach(s => {
    state.user._styleAvoid[s] = Date.now() + 24 * 60 * 60 * 1000;
  });
  save();
  toast('Got it — pulling a different direction…');
  setTimeout(() => $('#reshuffleBtn')?.click(), 500);
}
```
Plus a soft-avoid pass in `pickItemsForRoom()`: items tagged with an avoided style get -0.5 score weight. **[ORIGINAL]** for the 24h window threshold and -0.5 weight (Reforge framework is "feedback must change behavior"; specific window/weight are Claude's).
**Reforge cite:** Per *Retention + Engagement → Engagement Strategies → Strategy One: Habit Reinforcement* (At-Risk Strategies p.5-8) + *User Insights for Product Decisions* ("feedback that doesn't change behavior is fake feedback").
**Effort:** M (1 hour — Off-vote handler + picker score-weight modification + state migration).
**SHIPPABLE.**

#### APP-11 — Reshuffle toast honesty (line 5746)
**Source:** Dim 14 Section C Fix 2.
**Current:** `toast('Fresh picks curated');`
**Proposed:** `toast('Different items, same style');`
**Reforge cite:** Per *User Insights for Product Decisions* — copy must match the actual mechanic to maintain accurate user mental models.
**Effort:** S (1 min).
**SHIPPABLE.**

#### APP-12 — "No saved items yet." in wishlist render (line 5820)
**Source:** Dim 09 Section B.3 + duplicate of IDX-7.
**Current:**
```js
list.innerHTML = `<div class="empty-state">...<p>No saved items yet.</p></div>`;
```
**Proposed:**
```js
list.innerHTML = `<div class="empty-state">...<p>Save items to track price drops.</p></div>`;
```
**Reforge cite:** Per *Brand Marketing → Defining Your Brand Personality* (warmth, no blame).
**Effort:** S (1 min).
**SHIPPABLE.** Coordinate with IDX-7 — both must change together.

#### APP-13 — "may not fit" warning rewrite (line 5356)
**Source:** Dim 09 D9 + Dim 10 #4. NC-2 (✓ checkmark concern).
**Current:**
```js
${!fits ? '<span class="tag warn">⚠ may not fit</span>' : ''}
```
**Proposed (Dim 09 D9 + NC-2 resolved with custom SVG):**
```js
function fitWarningCopy(item, room) {
  if (!item || !room) return '';
  const itemW = item.dimensions?.width || 0;
  const roomW = room.dimensions?.width || 0;
  if (itemW > roomW) return 'Wider than your room. Verify before buying.';
  const itemD = item.dimensions?.depth || 0;
  const roomD = room.dimensions?.depth || 0;
  if (itemD > roomD) return 'Deeper than your room. Verify before buying.';
  return 'Larger than your room\'s footprint. Verify before buying.';
}
const warnSvg = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>';
// In template:
${!fits ? `<span class="tag warn">${warnSvg} ${fitWarningCopy(item, room)}</span>` : ''}
```
**Reforge cite:** Per *Brand Marketing* (no emoji rule from CLAUDE.md is consistency = trust) + *Product Marketing → Building Proof Point Pillars* (honest disclosure as proof point).
**Effort:** M (45 min — `fitWarningCopy` function + SVG injection + dimensions mapping).
**SHIPPABLE.** Note: Dim 10 #4 proposes additional "AI flagged:" prefix reframe — that's a small follow-up edit once Hassan approves the dimensions data is reliable.

#### APP-14 — `LIFECYCLE_CAMPAIGNS` template tokenization (existing array region)
**Source:** Dim 09 D7.
**Current:** Hardcoded copy strings per campaign.
**Proposed:** Convert to token-based templates with `{{firstName}}`, `{{styleName}}`, `{{nUnder100}}`, `{{firstRoomType}}`, `{{wishlistCount}}`, `{{nDropped}}`, `{{biggestDropName}}`, `{{biggestDrop}}`, `{{nNewInStyle}}`, `{{daysDormant}}`, `{{nextRoomType}}`, `{{monthsAgo}}`, `{{wasPrice}}`, `{{nowPrice}}` plus `resolveCopyTokens(template, ctx)` helper. See Dim 09 D7 + Section C templates 1-7. **[ORIGINAL]** for the specific copy in templates 1-7 (Reforge framework is templates-with-tokens; the actual copy I propose is Claude's).
**Reforge cite:** Per *Retention + Engagement → Engagement Strategies* (templated artifacts at scale) + *Brand Marketing → Bringing Your Brand To Life* (governance).
**Effort:** L (4 hours — token resolver + 8 campaign migrations + state-to-context mapper).
**SHIPPABLE — but note Template 7 (Referral Success) blocks on Conflict 2.**

#### APP-15 — Activation lifecycle banner state-aware copy
**Source:** Dim 09 D4. Conflict 1 (PENDING) + Conflict 4 (PENDING) — direct.
**Current:** Hardcoded "Most members redesign 4–7 rooms..." copy in lifecycle banner controller.
**Proposed:** Replace with state-aware copy. **The orientation depends on Conflict 1.** If flip approved (saved-items + Style Pulse → Core), copy becomes weekly-engagement-focused. If flip rejected, copy stays redesign-driven. See Dim 09 D4 + my Conflict 1 recommendation.
**Reforge cite:** Per *Retention + Engagement → Activation Strategies* (state-aware messaging).
**Effort:** M (90 min — banner + state plumbing).
**[BLOCKED BY CONFLICT 1 + CONFLICT 4]**

#### APP-16 — `liveCounterRow` "12,400+" rotation (line 6343)
**Source:** NC-5. Conflict 4 (PENDING).
**Current:**
```js
{ icon: '✶', text: `<strong>12,400+</strong> homes designed this month` },
```
**Proposed (if Conflict 4 approved):** Remove this variant entirely. Other variants in `liveCounterRow` (line 6341, 6342, 6344) use procedural numbers (`${rng()}`, `${200 + Math.floor(...)}`, `$2.3M`) which are also fictitious — but they update per session, which gives them slight plausibility. Audit notes:
- Line 6341 `12 + Math.floor(Math.random()*24)` → "12-35 rooms designed in the last hour" (fictitious random number)
- Line 6342 `200 + Math.floor(Math.random()*80)` → "200-279 people designing right now" (fictitious random number)
- Line 6343 "12,400+ homes designed this month" (FIXED fictitious number — biggest violation)
- Line 6344 "$2.3M in furniture saved vs. retail this quarter" (fictitious savings claim)

Per Conflict 4, **all 4 are violations**. Strongest fix: replace the entire `variants` array with positioning claims:
```js
const variants = [
  { icon: '✦', text: `<strong>Real catalog</strong> · IKEA, Wayfair, West Elm, Amazon` },
  { icon: '◯', text: `<strong>Built by Hassan</strong> · 1-person team` },
  { icon: '✶', text: `<strong>No subscription</strong> required to see your redesign` },
  { icon: '◈', text: `<strong>$0 to try</strong> · No credit card, no signup` }
];
```
**Reforge cite:** Per *Brand Marketing → Evangelizing Brand Guidelines* p.21.
**Effort:** S (5 min).
**[BLOCKED BY CONFLICT 4]**

#### APP-17 — `buildAffiliateUrl` retailer-search fallback (line 4346)
**Source:** Dim 14 Section D Fix 1 + Top 3 #3.
**Current:** Blindly trusts `item.url`. No fallback for placeholder URLs or OOS items.
**Proposed:**
```js
const RETAILER_SEARCH = {
  ikea:    name => `https://www.ikea.com/us/en/search/?q=${encodeURIComponent(name)}`,
  amazon:  name => `https://www.amazon.com/s?k=${encodeURIComponent(name)}&tag=furnish-20`,
  wayfair: name => `https://www.wayfair.com/keyword.php?keyword=${encodeURIComponent(name)}`,
  'west-elm': name => `https://www.westelm.com/search/results.html?words=${encodeURIComponent(name)}`,
  etsy:    name => `https://www.etsy.com/search?q=${encodeURIComponent(name)}`,
  'rugs-usa': name => `https://www.rugsusa.com/search?q=${encodeURIComponent(name)}`,
};

function isHomepageStub(url) {
  try {
    const u = new URL(url);
    return !u.pathname || u.pathname === '/' || u.pathname.length < 4;
  } catch { return true; }
}

function buildAffiliateUrl(item) {
  if (!item) return '#';
  if (item.url && !isHomepageStub(item.url)) {
    try {
      const u = new URL(item.url);
      const partner = AFFILIATE_IDS[item.source] || {};
      Object.entries(partner).forEach(([k, v]) => u.searchParams.set(k, v));
      u.searchParams.set('utm_source', 'furnish');
      u.searchParams.set('utm_medium', 'redesign');
      u.searchParams.set('utm_campaign', item.id);
      u.searchParams.set('fclick', `${state.user?.id || state.user?.email || 'guest'}-${Date.now().toString(36)}`);
      return u.toString();
    } catch {}
  }
  const builder = RETAILER_SEARCH[item.source];
  if (builder && item.name) return builder(item.name);
  trackEvent('affiliate_url_fallback_homepage', { itemId: item.id, source: item.source });
  return item.url || '#';
}
```
**Reforge cite:** Per *Retention + Engagement → Resurrecting Voluntary Dormant Users → Reason #3 Over-Promised, Under-Delivered* (p.4).
**Effort:** S (3-4 hours total — function + per-retailer URL pattern verification + new analytics event wiring).
**SHIPPABLE.**

#### APP-18 — `localStorage` quota exceeded handling
**Source:** Dim 14 Section F (localStorage quota).
**Current:** `save()` does not catch `QuotaExceededError`.
**Proposed:** Wrap `save()` in try/catch + add `pruneState()`:
```js
function pruneState() {
  if (state.affiliateClicks) state.affiliateClicks = state.affiliateClicks.slice(-50);
  // Drop _dismissed flags older than 30d, evict bookmarkedRooms thumbnails older than 90d.
  // (Specific cuts depend on what bloats most — instrument first.)
}

function save() {
  try {
    localStorage.setItem('furnish.state', JSON.stringify(state));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      pruneState();
      try {
        localStorage.setItem('furnish.state', JSON.stringify(state));
        toast('Your room library is getting full — sign in to back up to the cloud.');
      } catch { console.warn('localStorage save failed even after prune', e); }
    } else {
      console.warn('localStorage save failed', e);
    }
  }
  // ... existing Supabase sync below ...
}
```
**[ORIGINAL]** for specific prune ratios (50, 30d, 90d) — Reforge framework is "degraded modes are part of design", thresholds are Claude's pick.
**Reforge cite:** Per *Retention + Engagement → Setup Moment Experience* p.5 (degraded modes for inputs are part of design).
**Effort:** M (~30 LOC).
**SHIPPABLE.**

#### APP-19 — Multi-device tier conflict softening (existing `reconcileTierWithBackend`)
**Source:** Dim 14 Section F (multi-device tier conflict).
**Current:** `handleDowngrade('server_reconcile')` toast is harsh for sync conflicts.
**Proposed:** Add `reason='sync_conflict'` branch with softer copy + 3-second defensive re-pull. **[ORIGINAL]** for 3s timeout choice.
**Reforge cite:** Per *Retention + Engagement → Resurrecting Involuntary Dormant Users → Category One: Product Issue* (p.3-7).
**Effort:** S (~20 LOC).
**SHIPPABLE.**

#### APP-20 — Quiz answer under-populated picker handling (Section F)
**Source:** Dim 14 Section F.
**Current:** `pickItemsForRoom()` may return <5 items for rare style+budget+room combos.
**Proposed:** After picker, check `items.length < 5`. If under-populated, expand constraints in order: loosen budget +20%, include adjacent styles, include neutral fallback. Track `picker_underpopulated` event. **[ORIGINAL]** for the 5-item threshold and the +20% budget loosening — Reforge framework is "edge cases of input-space coverage are first-class"; thresholds are Claude's.
**Reforge cite:** Per *PM Foundations → Feature Design* + *Voluntary Dormant Reasons #2*.
**Effort:** M (requires `style.adjacent` mapping which may need to be authored in `furniture.js`).
**SHIPPABLE — partial. The adjacent-styles mapping needs author work.**

#### APP-21 — `Different Style?` modal handler (companion to IDX-13)
**Source:** Dim 14 Section C Fix 1.
**Current:** No style-pivot UI exists.
**Proposed:**
```js
function openStylePivotModal(room) {
  const profile = state.profiles.find(p => p.id === room.profileId);
  const current = new Set(profile?.styles || []);
  const candidates = window.STYLES.filter(s => !current.has(s.id)).slice(0, 6);
  // Modal with 6 chips. On tap:
  //   1. Save current room (don't lose user's work)
  //   2. Override profile.styles temporarily, run pickItemsForRoom() with same photo
  //   3. Show analyzing screen briefly (no AI compute call — local re-pick)
  //   4. Push as a new version on the same room (existing pushVersion)
  //   5. Open the room with new picks
  // 2 seconds total.
}

$('#differentStyleBtn').addEventListener('click', () => {
  const room = state.rooms.find(r => r.id === currentRoomId);
  if (!room) return;
  trackEvent('reveal_different_style_clicked', {
    roomId: room.id,
    currentStyles: state.profiles.find(p => p.id === room.profileId)?.styles
  });
  openStylePivotModal(room);
});
```
Modal HTML to be added in `index.html` (small modal — 6 chips + close button).
**Reforge cite:** Per *Retention + Engagement → Strategies For At-Risk Users → Strategy Two: Use Case Transition*.
**Effort:** L (~1-2 days — modal markup + handler + render integration).
**SHIPPABLE.** Highest-leverage item in this batch.

#### APP-22 — Wishlist orphan reference handling (Section F)
**Source:** Dim 14 Section F.
**Current:** No `gcOrphanedWishlist()` — orphan IDs in wishlist render blanks or throw.
**Proposed:** Add `gcOrphanedWishlist()` on boot after catalog load; surface "1 item from your wishlist is no longer available" notification when prunes happen.
**Reforge cite:** Per *Retention + Engagement → Voluntary Dormant Reasons #3* (Over-Promised, Under-Delivered).
**Effort:** S (~30 LOC).
**SHIPPABLE.**

#### APP-23 — Camera permission denied fallback (Section F)
**Source:** Dim 14 Section F.
**Current:** No fallback when `<input capture="environment">` silently fails.
**Proposed:** 3-second timer post-camera-input click; if no `change` event, soft toast "Camera not available — try Upload from gallery." **[ORIGINAL]** for 3s timeout.
**Reforge cite:** Per *Retention + Engagement → Setup Moment Experience* p.5-9 (blocked must-have inputs require fallback paths).
**Effort:** S.
**SHIPPABLE.**

#### APP-24 — HTTPS-required-for-camera detection (Section F)
**Source:** Dim 14 Section F.
**Current:** No detection of insecure context for non-localhost HTTP.
**Proposed:** Boot check: `window.isSecureContext === false && location.hostname !== 'localhost'` → soft banner "Open via HTTPS for camera support."
**Reforge cite:** Per *PM Foundations → Feature Design* (environmental constraints).
**Effort:** S (~10 LOC).
**SHIPPABLE.**

#### APP-25 — Analyze double-tap race condition (Section F)
**Source:** Dim 14 Section F.
**Current:** `analyzeBtn` click handler has no single-flight guard.
**Proposed:** `state._analyzeInFlight` boolean set on click, cleared on success/failure. Disable button while in-flight.
**Reforge cite:** Per *PM Foundations → Feature Development* (idempotency baseline).
**Effort:** S (~5 LOC).
**SHIPPABLE.**

#### APP-26 — Sign-out wishlist data-loss prevention (Section F)
**Source:** Dim 14 Section F.
**Current:** Sign-out clears `state.user`; wishlist behavior on next sign-in is unclear.
**Proposed:** Snapshot state into `furnish.state.backup.{userId}` before clearing on sign-out. Offer "Restore your previous library" prompt on sign-in if backup exists.
**Reforge cite:** Per *Retention + Engagement → Resurrecting Involuntary Dormant Users → Category One: Product Issue*.
**Effort:** M.
**SHIPPABLE.**

#### APP-27 — Native share fallback (Section F)
**Source:** Dim 14 Section F.
**Current:** No feature-detect on `navigator.share()`.
**Proposed:** Feature-detect `navigator.share`; fall back to copy-to-clipboard with toast "Link copied — paste anywhere."
**Reforge cite:** Per *Advanced Growth Strategy → Content Loops* + *PM Foundations → Feature Design*.
**Effort:** S.
**SHIPPABLE.**

#### APP-28 — Network offline during analyze (Section F) [DEFERRED to backend cutover]
**Source:** Dim 14 Section F.
**Current:** Analyze flow is mocked; offline handling not wired.
**Proposed:** At backend cutover, wrap fetch in `navigator.onLine` check + 15s timeout + retry logic.
**Reforge cite:** Per *Retention + Engagement → Resurrecting Involuntary Dormant Users → Product Issue*.
**Effort:** M (post-backend).
**[DEFERRED — implement at AI cutover, not this batch.]** Add to DEFERRED.md.

---

### 2.3 `styles.css` — 4 changes

#### CSS-1 — `.affiliate-disclosure-v2` styles (companion to IDX-6)
**Proposed:** Add to styles.css near existing `.affiliate-disclosure` (~line 4950):
```css
.affiliate-disclosure-v2 {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 14px 16px;
  margin: 16px 0;
}
.adv2-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.adv2-icon { color: var(--brown); }
.adv2-body { font-size: 13px; line-height: 1.55; color: var(--brown-2); margin: 0; }
.adv2-body strong { color: var(--ink); }
.adv2-body a { color: var(--tan); text-decoration: underline; margin-left: 4px; }
```
Note: Dim 10 used `--bg-elev`, `--border`, `--ink-soft`, `--accent` token names that don't exist in Furnish's design tokens (which are `--cream`, `--beige`, `--tan`, `--brown`, `--brown-2`, `--deep`, `--ink`, `--muted`, `--line`, `--surface`). Mapped to actual tokens above.
**Effort:** S (15 min + light/dark QA).

#### CSS-2 — `.photo-tip` styles (companion to IDX-12)
**Proposed:** New small styled card with example image. Match existing `.lifecycle-banner` aesthetic.
**Effort:** S (15 min).

#### CSS-3 — `.paywall-roadmap` styles (companion to IDX-11) [BLOCKED BY CONFLICT 3]
**Proposed:** Subdued styled block at the bottom of paywall card.
**Effort:** S (10 min).

#### CSS-4 — Fix duplicate `.item-card`, `.paywall-card`, `.ba-handle` rules
**Source:** Cross-reference with Dim 01 priority #2 (de-dupe styles.css). Outside this batch's scope but flagged here because some Dim 09 / Dim 10 changes may visually fail if the duplicate selectors override them.
**Effort:** Out of scope this batch — should land in Batch covering Dim 01.
**Note in audit:** Watch for visual regression on `.affiliate-disclosure-v2` (CSS-1) and `.photo-tip` (CSS-2) due to existing dup rules.

---

### 2.4 `assets/` — 1 new file

#### AST-1 — `assets/tip-example.jpg` (companion to IDX-12)
**Required:** 1 hand-curated example image of a good room photo (brightly lit, full-room view from doorway angle). Hassan's task — I can't generate or capture this.
**Effort:** Hassan picks from existing room photos OR shoots one. ~30 min if from scratch.

---

### 2.5 New file: `VOICE.md`

#### VOICE-1 — Brand voice & guidelines doc at repo root
**Source:** Dim 09 D8.
**Content:** 4 brand personality words + definitions, 4 anti-patterns + banned word list, Thoughtful Contractor Test, per-surface dos/don'ts (Section B condensed from Dim 09), token table for lifecycle copy. **[ORIGINAL]** for the specific 4 personality words ("Concrete, Confident, Warm, Calm") and banned-words list — Hassan should review and lock these.
**Reforge cite:** Per *Brand Marketing → Bringing Your Brand To Life* (Brand Guidelines, third building block).
**Effort:** M (2 hours).
**SHIPPABLE — but Hassan must approve the 4 personality words first.**

---

### 2.6 New folder + 4 files: `optimization/creative-briefs/`

#### BRIEF-1 to BRIEF-4 — One creative brief per major user-facing surface
**Source:** Dim 09 D12.
**Files:** `welcome.md`, `paywall.md`, `lifecycle.md`, `errors-empty-states.md` — each follows Reforge creative-brief template (Background, Guardrails, Wording restrictions, OKT, Proof point pillars).
**Reforge cite:** Per *Product Marketing → Defining Effective Creative Briefs*.
**Effort:** L (6 hours total — 4 briefs × ~90 min).
**SHIPPABLE — but P2 priority, can be deferred.**

---

## 3. WHAT SHIPS WITHOUT CONFLICT RESOLUTION

If you want to ship NOW without waiting for Conflict decisions, these 30 items are clear:

**Dim 09 (Copy):**
- APP-1 (FURNISH_OKT constant — needs Hassan's approval on 5-word phrase)
- APP-2 (Welcome toast `!` removal)
- APP-3 (FAQ toast `!` removal)
- APP-4 (Free card footer)
- APP-5 (Generic paywall sub rewrite)
- APP-6 (Sign-in failed error)
- APP-8 (Pick image file error)
- APP-9 (Image too large error)
- APP-11 (Reshuffle toast honesty)
- APP-12 + IDX-7 (Wishlist empty state)
- IDX-5 (No rooms yet → "Snap a photo")
- VOICE-1 (VOICE.md)

**Dim 10 (Trust):**
- IDX-6 + CSS-1 (Affiliate disclosure V2 — with NC-1 resolution: SVG icon)
- APP-13 (may not fit warning rewrite — with NC-2 resolution: SVG icon)

**Dim 14 (Edge cases):**
- APP-10 (Aha "off" vote learning)
- APP-17 (buildAffiliateUrl retailer-search fallback)
- APP-18 (localStorage quota handling)
- APP-19 (Multi-device tier conflict softening)
- APP-20 (Picker under-populated handling)
- APP-22 (Wishlist orphan handling)
- APP-23 (Camera permission denied fallback)
- APP-24 (HTTPS detection)
- APP-25 (Analyze double-tap guard)
- APP-26 (Sign-out backup)
- APP-27 (Native share fallback)
- IDX-12 + CSS-2 (Photo tip card — needs Hassan's tip-example.jpg)
- IDX-13 + APP-21 (Different Style? CTA + modal — biggest revenue lift)

**Net: 30 of 47 items ship without conflict decisions.**

## 4. WHAT BLOCKS ON CONFLICTS

| Conflict | Items blocked |
|----------|---------------|
| 1 (retention shape) | APP-15 (activation banner) |
| 2 (referral currency) | IDX-8 (share modal note); APP-14 Template 7 only |
| 3 (coming soon bullets) | IDX-11 + CSS-3 |
| 4 (fictitious anchors) | IDX-3, IDX-4, IDX-9, IDX-10, APP-15, APP-16 |
| 9 (~30 sec microcopy) | IDX-1, IDX-2 |
| 5 (D7 soft email) | IDX-14 (defer to next batch) |

Total blocked: 12 items waiting on conflict decisions.

## 5. NEW CONTRADICTIONS REQUIRING HASSAN DECISION (NC-1 to NC-5)

- **NC-1:** Replace 💡 emoji in V2 disclosure with custom SVG (proposal in IDX-6).
- **NC-2:** Replace ✓ checkmark in may-not-fit with custom SVG (proposal in APP-13).
- **NC-3:** Confirm team count for "Built by ___" copy. My recommendation: "Built by Hassan."
- **NC-4:** Defer Dim 10 Recommendation 6 (live counter) to backend phase.
- **NC-5:** Add 2 missed instances of fictitious "12,400+" / "2,400+" claims (D7 reveal-gate at index.html:108, live counter at app.js:6343) to Conflict 4 scope.

---

## 6. EFFORT TOTAL

| Tier | Count | Hours estimate |
|------|-------|----------------|
| S (≤30min each) | 22 | 5–8 |
| M (30min–2h) | 13 | 13–20 |
| L (½ day–2 days) | 5 | 12–24 |
| Deferred (post-backend) | 3 | — |
| Hassan-task (asset, decisions) | 4 | varies |

**Total Batch 1 effort: 30–52 hours of dev work.** Realistic ship target: 1 working week if conflicts resolve within 1 day.

---

## 7. APPROVAL REQUEST

Hassan, before I implement, I need:

1. **Decisions on Conflicts 1, 2, 3, 4, 9** (in CONFLICTS_RESOLVED.md). Without these, 12 items in this batch can't ship correctly.
2. **Decisions on NC-1 through NC-5** (this file, Section 1).
3. **Approval of APP-1 OKT phrase** ("Your household, your style, sharper.") OR an alternative.
4. **Approval of VOICE-1's 4 personality words** ("Concrete, Confident, Warm, Calm") OR alternatives.
5. **Confirmation that asset AST-1 (tip-example.jpg) will come from you** OR I ship IDX-12 with a placeholder text card.
6. **Confirmation of the implementation order:** Copy (Dim 09 items) → Trust (Dim 10 items) → Edge cases (Dim 14 items) within each file, OR strict file-by-file.

Once you reply, I implement the unblocked items, add the resume note for blocked items, run a copy-sweep at the end, and append the migration log to IMPLEMENTATION_PROGRESS.md (which I'll create — currently doesn't exist).

I'll stop here until you approve.
