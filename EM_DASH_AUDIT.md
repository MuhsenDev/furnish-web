# Em Dash Removal — Audit (2026-04-27)

## Headline numbers

- **6,199 em dashes** across **60 files** (excluding `node_modules` and `.git`).
- **0** Rule-10 cases (zero em dashes inside regex patterns or `.match()/.replace()/.test()` calls — verified).
- **0** `&mdash;` HTML entities (verified). All 6,199 are literal `—` characters.
- **0** stray `–` en dashes touched (different character; will not change).

## File breakdown

### Tier 1 — Code files (em dashes ship to user surfaces, ~975 instances)

| File | Count | Risk profile |
|---|---|---|
| `app.js` | 572 | UI strings + comments. UI strings are user-facing brand copy. Comments are internal. |
| `styles.css` | 232 | Comments only — no user-visible em dashes (CSS doesn't render em dashes to UI). |
| `index.html` | 104 | UI text + attribute values + comments. **High brand-impact subset.** |
| `furniture.js` | 54 | Quiz option labels, product descriptions, room template names. **All user-facing.** |
| `supabase-client.js`, `supabase-config.js`, `list-models.js`, `spike.js`, `start-windows.bat`, `package.json`, `.gitignore` | ~13 combined | Most are comments or BAT/config files. Trivial. |

**Subtotal: ~975 em dashes.** Brand-meaningful subset is the user-visible strings inside `app.js` + `furniture.js` + `index.html` (estimated ~250–350 of the 975 are actually user-facing; rest are code comments).

### Tier 2 — Brand-adjacent documentation (~77 instances)

| File | Count | Notes |
|---|---|---|
| `README.md` | 12 | Public-facing setup guide. Real users may read this. |
| `VOICE.md` | 37 | The voice rubric itself. **Some em dashes are structural, not stylistic** (Reforge course titles like *"Brand Marketing — Defining Your Brand Personality"* and visual gauge ASCII like `Specific ←●———— Vague`). Needs per-instance review, not bulk replace. |
| `CLAUDE.md` | 28 | Project handoff doc. Read by me each session; not by end users. |

### Tier 3 — Internal documentation (~5,150 instances)

| File | Count |
|---|---|
| `OPTIMIZATION_PLAN.md` | 1596 |
| `IMPLEMENTATION_PROGRESS.md` | 461 |
| `CHANGES_APPLIED.md` | 237 |
| `CONFLICTS_RESOLVED.md` | 169 |
| `BATCH_1_AUDIT.md` | 149 |
| `MONETIZATION_AUDIT.md` | 127 |
| `DEFERRED.md` | 120 |
| `MONETIZATION_PROPAGATION_AUDIT.md` | 99 |
| `BATCH_3_AUDIT.md` | 84 |
| `ONBOARDING_AUDIT.md` | 64 |
| `BATCH_4_AUDIT.md` | 62 |
| `FOUR_FIX_AUDIT.md` | 52 |
| `DARK_MODE_AUDIT.md` | 49 |
| `USE_TEMPLATE_AUDIT.md` | 49 |
| `BATCH_6_AUDIT.md` | 39 |
| `BATCH_5_AUDIT.md` | 34 |
| `BATCH_2_AUDIT.md` | 26 |
| `OPTIMIZATION_ROLLOUT_SUMMARY.md` | 26 |
| `AUDIT_TOS_CONSENT.md` | 24 |
| `PRO_CARD_SPACING_AUDIT.md` | 21 |
| `STYLE_ROOM_PICKER_AUDIT.md` | 19 |
| `SUPABASE_SETUP.md` | 19 |
| `RESET_DIALOG_AUDIT.md` | 18 |
| `SAVE_HOME_AUDIT.md` | 16 |
| `optimization/01_visual_design.md` … `optimization/14_edge_cases.md` (14 files) | ~1,330 combined |
| `optimization/creative-briefs/` (4 files) | 46 |

### Auto-excluded

- `node_modules/` — node deps; ~5 in Google/protobuf/debug READMEs. Always excluded.

---

## Sample patterns by category (per the spec's Rules 1–10)

### Rule 1 — Parenthetical aside (most common in code comments)
`// [Batch 6 — Dim 13 REC-13.3] signup_failed / signin_failed`
→ `// [Batch 6, Dim 13 REC-13.3] signup_failed / signin_failed`
or `// [Batch 6: Dim 13 REC-13.3] ...`

### Rule 2/3 — Label : description (quiz options, product descriptions)
`{ id:'neutrals_only', label:'Neutrals only — warm whites, beiges, woods' }`
→ `{ id:'neutrals_only', label:'Neutrals only: warm whites, beiges, woods' }`

### Rule 4 — Mid-sentence emphasis (UI copy)
`<p class="tagline">Watch your room transform — about a minute, sit tight.</p>`
→ `<p class="tagline">Watch your room transform. About a minute, sit tight.</p>`
or `Watch your room transform, about a minute, sit tight.`

### Rule 5 — Quote attribution
Sample (from `index.html` reviews bar): `— Sam L.`
→ Either drop and use `<cite class="reviewer">Sam L.</cite>` markup, or `, Sam L.` plain text.

### Rule 7 — Code comments
`// Furnish — data layer.`
→ `// Furnish: data layer.`
or `// Furnish data layer.`

### "Section divider" decorative em dashes (numerous in styles.css comments and VOICE.md gauges)
`Specific ←●———— Vague` (VOICE.md voice-rubric gauges — visual ASCII)
→ Cannot be auto-replaced; the dashes ARE the gauge bar. Needs preservation or hand-redesign.

`/* ============================================================ ... */` separator comments use `=` not em dashes — those stay.

### Course/title em dashes (VOICE.md, multiple internal docs)
`*Brand Marketing — Defining Your Brand Personality*`
→ This is the **literal Reforge course title**. Replacing it changes the citation. Should stay as-is.

---

## Ambiguities flagged for your call

### Ambiguity 1 — Scope. Tier 1 vs Tier 2 vs Tier 3?

The spec says "every file in the repo, no exceptions" but the brand rationale ("em dashes read as AI-written to readers") only applies to copy that **users actually read**.

Tier 3 (internal markdown — audits, optimization plan, conflict logs) is read only by you and me. Replacing 5,150 em dashes in those files:
- Risks meaning errors when sentences need rewriting (Rule 4) in spec/audit documents that govern future decisions
- Creates a massive diff that's impossible to spot-check
- Doesn't serve the brand goal you stated

**My recommendation:** Tier 1 + Tier 2 only (~1,050 instances). Skip Tier 3. If you disagree, just say "all 6,199" and I'll do it all.

### Ambiguity 2 — VOICE.md structural em dashes

Of the 37 em dashes in `VOICE.md`:
- ~10 are inside Reforge course titles (literal references, must preserve)
- ~5 are inside visual ASCII gauges like `Specific ←●———— Vague` (the dashes ARE the gauge)
- ~22 are stylistic, can be replaced

**My recommendation:** Process VOICE.md hand-by-hand, preserving the structural dashes; do not bulk-replace.

### Ambiguity 3 — "Section header dashes" in code comments

Hundreds of comments use the pattern:
```
// [Batch 6 — Dim 13 REC-13.3] ...
// [B3 / Dim 03 R-Bottom2] ...
// [Conflict 9 lock — Promise-Fit] ...
```

These are **structural metadata tags** — they signal commit batches, dimension references, and conflict locks. Replacing the em dash with a comma reads cleanly:
- `// [Batch 6, Dim 13 REC-13.3]`
- `// [Conflict 9 lock, Promise-Fit]`

**Auto-resolve recommendation:** Apply Rule 1 (comma) to all of these comment-tag patterns. They're not user-facing.

### Ambiguity 4 — Quote attribution format (Rule 5)

The spec recommends restructuring `— Sam L.` testimonial markup to use `<cite>` tags. There are several testimonial author lines in `index.html` (the reviews bar / homepage trust strip).

**My recommendation:** For markup-level changes (cite tags), I'd want to verify the existing CSS treatment renders them correctly — adding `<cite>` is a structural change, not just a punctuation swap. Mark as **process per-file with care, not bulk-replace**.

---

## Effort estimates

| Tier | Replacements | Estimated time | Risk |
|---|---|---|---|
| Tier 1 (code files) | ~975 | ~90 min | Low — most are comment-tags + UI strings |
| Tier 2 (VOICE.md, README.md, CLAUDE.md) | ~77 | ~30 min | Medium — VOICE.md needs hand-review |
| Tier 3 (internal docs) | ~5,150 | ~6 hours | High — sentence rewrites in spec docs may distort meaning |
| **All** | **6,199** | **~7.5 hours** | High |

---

## Process plan if you approve Tier 1 + Tier 2

1. **Code comment-tags** (Rule 1): bulk replace ` — ` → `, ` inside `[Batch X — Dim Y]` style brackets. Most volume of fixes, near-zero risk.
2. **Quiz/product labels** (Rule 2/3): bulk replace `Label — description` → `Label: description` in `furniture.js` data and similar JS strings.
3. **UI tagline copy** (Rule 4): hand-rewrite the ~30 user-visible em-dash sentences in `index.html` and `app.js` UI strings.
4. **Testimonial attributions** (Rule 5): verify markup, replace with `, Author` plain text OR add `<cite>` tags if CSS supports.
5. **VOICE.md**: hand-review, preserve course titles + ASCII gauges, replace stylistic ones.
6. **README.md, CLAUDE.md**: bulk pass with comma/colon, low risk.
7. **Verification**: re-grep `grep -rn "—" .` (excluding node_modules + .git + Tier 3 if approved); confirm only Tier 3 remains.

---

## Reforge framework citations

- *Content & Copy (Dim 09)* — Voice rubric consistency. Em dashes are not banned by the rubric; the spec says they currently read as AI-tic. Aligning copy to be deliberately human-feeling supports the "Concrete, Confident, Warm, Calm" rubric.
- *Trust & Credibility (Dim 10)* — Copy that reads as machine-generated erodes trust. The fix targets the user-facing copy where this trust signal matters most.

---

## Stop point — awaiting your call

Per the spec's gate language ("If any flags or ambiguities, surface them once consolidated, get my decisions, then proceed"), I'm stopping here at audit completion.

**Three options:**

- **(A) Tier 1 + Tier 2 only (~1,050 instances, ~2 hours)** — recommended. Touches every user-visible em dash and code-comment tag. Skips internal audit/spec docs where the brand rationale doesn't apply and rewrite risk is highest.
- **(B) All 6,199 across all 60 files (~7.5 hours)** — what the spec literally says. I'll proceed with care if you confirm.
- **(C) Tier 1 only (~975 instances, ~90 min)** — strictest scope. Only code files. Skips VOICE.md, README.md, CLAUDE.md, and all internal docs.

After your call, I'll proceed with the agreed scope, follow the per-rule replacement logic, verify with re-grep, and commit as `EM_DASH_REMOVAL_PASS` with a migration log entry.
