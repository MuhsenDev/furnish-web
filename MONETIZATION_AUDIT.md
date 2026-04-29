# MONETIZATION_AUDIT.md — Model A (Affiliate-Maximalist) Migration

> **⚠️ HISTORICAL ARCHIVE — Superseded by `MONETIZATION_PROPAGATION_AUDIT.md` on 2026-04-25.** Preserved for context on Model A evolution. Do not edit. The 2-lifetime AI generation cap described here was retired in favor of compute-quality routing (Free → standard model unlimited, Pro → premium model unlimited at $5.99/month). See the new audit + the "Compute-Quality Routing Migration" section in `CHANGES_APPLIED.md` for the migration spec.

**Status:** STEP 1 of 5 complete. **Awaiting your review and approval before STEP 3 implementation.**

---

## 1. Model A Definition (the contract this audit enforces)

| Tier | What's included |
|---|---|
| **Free** | Unlimited reshuffles on existing redesigns · unlimited item swaps · full shopping/affiliate surfaces (item taps, shop links, wishlist, price views) · basic personalization (style profile, color moods, single-style quiz, save items, save rooms) · view all templates the free tier is allowed |
| **Pro** | New redesigns from new photo uploads (compute-expensive) · HD export (no watermark) · multi-room batch processing · advanced personalization (style learns over time) · premium template library |

**Cost-of-goods principle:** anything that costs us infrastructure money per use (AI compute, image generation, cloud storage of high-res outputs) gates to Pro. Anything that runs on already-cached data or drives affiliate clicks stays free.

**Tagging key:**
- **[FREE]** — fully available to free users under Model A
- **[PRO]** — gated behind Pro under Model A
- **[SHARED]** — both tiers, but limits or behavior differ
- **[NEW]** — doesn't exist yet, Model A requires it
- **[REMOVE]** — exists today but Model A obsoletes it

**Files audited:**
- `app.js` (4036 lines)
- `index.html` (950 lines)
- `styles.css` (4964 lines)
- `furniture.js` (592 lines)
- `supabase-client.js` (211 lines)
- `supabase-config.js` (21 lines)
- `manifest.json` (15 lines)
- `assets/` (quiz/, seasons/, styles/, trending/)
- `_before-recovery/`, `_my-rebuild-backup/` — **not audited per CLAUDE.md "Do not delete" instruction; ignored by git**
- `README.md`, `SUPABASE_SETUP.md`, `CLAUDE.md` — docs only, audited separately at end

---

## 2. Decisions you must resolve before STEP 3

These are model-defining choices the spec leaves ambiguous. I will **not** start coding until you answer.

| # | Decision | Options |
|---|---|---|
| **D1** | First-ever redesign for a brand-new free user | (a) Free user gets ZERO redesigns, must upgrade to even try. (b) Free user gets 1 demo redesign on signup, then Pro for any new ones. (c) Free user gets N free redesigns/month then Pro. |
| **D2** | "Existing redesigns" — what does free can-reshuffle apply to? | (a) Only redesigns the user themselves uploaded. (b) Including templates they ran. (c) Including a shared/sample demo room we provide. |
| **D3** | Multi-profile system (currently allows 1 free profile, additional require Pro) | (a) Stay Pro-gated (multi-profile = household = Pro feature). (b) Move to Free (basic personalization includes household profiles). |
| **D4** | Templates — currently 5 free + 3 Pro | (a) Keep 5/3 split. (b) Move all templates to Free (catalog is for affiliate). (c) Pro-gate templates that *generate a new redesign on tap* (because they call the compute path). |
| **D5** | HD export — currently watermark for free, clean for Pro | (a) Keep current. (b) Free gets no export at all (Pro-only). (c) Free gets HD too because it powers viral/share loops that drive affiliate. |
| **D6** | Grandfathering existing Pro users | (a) Anyone already `isPro=true` keeps all features (transparent). (b) Re-prompt at next session to confirm new tier mapping. |
| **D7** | Free abuse prevention — how does a logged-out user get gated on new redesigns? | (a) Allow unlimited (anonymous = funnel top, never gate). (b) Localstorage counter (clearable by user). (c) Require account creation (with email) for any new redesign. |
| **D8** | Quiz access | (a) Free can take the quiz (basic personalization). (b) Quiz is Pro (advanced personalization). I read the spec as (a) but flagging. |
| **D9** | Wishlist + price-drop alerts | (a) Wishlist is Free, price-drop alerts (notification delivery) is Pro. (b) Both Free. (c) Both Pro. |
| **D10** | Rearrange furniture (AI re-layout) — currently triggers paywall | (a) Stays Pro (compute cost — same class as new redesign). (b) Free (it's manipulating an existing redesign). |

**My recommendation for each (for your override):** D1=b, D2=b, D3=b, D4=c, D5=a, D6=a, D7=b, D8=a, D9=a, D10=a.

---

## 3. Tier infrastructure (Layer 1 — touch first per STEP 3 order)

| Item | File:line | Today | Model A | Tag |
|---|---|---|---|---|
| `state.user.isPro` flag | `app.js` (state shape, `supabase-client.js:156,181`) | Boolean, mocked on paywall CTA click | Same flag, **canonical source = Supabase `user_settings.is_pro`** when configured, else local | [SHARED] |
| `isPro()` helper | `app.js:2515` | `!!state.user?.isPro` | Same | [SHARED] |
| `isGuest()` helper | `app.js:2516` | `provider === 'guest'` or no user | Same | [SHARED] |
| `isSignedInFree()` helper | `app.js:2517` | Signed in but not Pro | Same | [SHARED] |
| `hasUsedDemo()` helper | `app.js:2518` | Returns true if `redesignsUsed >= 1` OR `rooms.length >= 1` | **Rename to `hasUsedFreeRedesign()`** — semantic now means "has consumed the free demo allotment" | [SHARED] |
| `canRedesign()` helper | `app.js:2535` | `redesignsUsed < FREE_REDESIGN_LIMIT (1)` | **Keep gate**, but the gated action is now narrower: only "new redesign from new photo upload" | [SHARED] |
| `canReshuffle(room)` helper | `app.js:2540` | `room.reshuffleCount < FREE_RESHUFFLE_PER_ROOM (0)` | **Always returns true. FREE_RESHUFFLE_PER_ROOM removed.** | [SHARED] (logic flips) |
| `canSwap(room)` helper | `app.js:2544` | `room.swapCount < FREE_SWAPS_PER_ROOM (0)` | **Always returns true. FREE_SWAPS_PER_ROOM removed.** | [SHARED] (logic flips) |
| `FREE_REDESIGN_LIMIT` constant | `app.js` (vicinity 2535) | `1` | **Configurable**: depends on D1. Recommend `1` per lifetime (b) or `1`/month (c) | [SHARED] |
| `FREE_RESHUFFLE_PER_ROOM` constant | `app.js` | `0` | **REMOVE** — reshuffles are unlimited free | [REMOVE] |
| `FREE_SWAPS_PER_ROOM` constant | `app.js` | `0` | **REMOVE** — swaps are unlimited free | [REMOVE] |
| `room.reshuffleCount` field | room object | Tracked on room | **Keep tracking** (analytics value) but never used to gate | [FREE] |
| `room.swapCount` field | room object | Tracked on room | **Keep tracking** (analytics value) but never used to gate | [FREE] |
| `syncFreeModeClass()` body classes | `app.js:2528` | Toggles `is-free`, `is-pro`, `is-guest`, `is-signedin-free`, `has-used-demo` | Same — but **the CSS rules that hang off `is-free` need a major sweep** (see Layer 8). Add `has-used-free-redesign` as renamed alias | [SHARED] |
| `requireSignin(intent)` helper | `app.js:261` | Routes through signin then resumes pending action | Keep, but signin is no longer the gating mechanism for affiliate actions; only for "new redesign" | [SHARED] |
| **Subscription source of truth** | — | Mocked locally; Supabase `user_settings.is_pro` if configured | **[NEW] Add Stripe subscription record check** (eventually). For now, document `is_pro` as the canonical flag | [NEW] |
| **Tier-check middleware on all upgrade actions** | — | Inline `if (!isPro())` checks scattered in 16 sites | **[NEW] Centralize via `gateProAction(actionId, fn)` helper** that opens paywall + tracks + executes if Pro | [NEW] |
| **Redesign quota logic** | `incrementRedesignCount()` `app.js:2548` | Increments `state.user.redesignsUsed` | Keep, but pair with **[NEW] monthly reset** if D1=c | [SHARED] |

---

## 4. State shape (LocalStorage `furnish.state`)

| Field | Today | Model A | Tag |
|---|---|---|---|
| `user.name` | string | string | [SHARED] |
| `user.email` | string | string | [SHARED] |
| `user.provider` | 'guest' / 'email' / 'google' / 'amazon' | same | [SHARED] |
| `user.isPro` | bool | bool, **canonical Stripe-backed eventually** | [SHARED] |
| `user.redesignsUsed` | int (lifetime) | int (lifetime). **[NEW] Add `redesignsUsedMonth` + `redesignsResetAt`** if D1=c | [SHARED] |
| `user.signedInAt` | ts | same | [SHARED] |
| `user.lastVisitedAt` | ts (per retention pass) | same | [FREE] |
| `user.previousVisitAt` | ts | same | [FREE] |
| `user.visitCount` | int | same | [FREE] |
| `user.lastLifecycleState` | enum | same | [FREE] |
| `user._pushAsked` | bool | same | [FREE] |
| `settings.theme` | 'light' \| 'dark' | same | [FREE] |
| `profiles[].id` | string | same | [SHARED] |
| `profiles[].name` | string | same | [SHARED] |
| `profiles[].avatar` | dataURL | same | [SHARED] |
| `profiles[].styles` | string[] (style ids) | same | [FREE] |
| `profiles[].colors` | string[] (color mood ids) | same | [FREE] |
| `profiles[].customColors` | hex[] | same | [FREE] |
| `profiles[].budget` | number | same | [FREE] |
| `profiles[].keepExisting` | bool | same | [FREE] |
| `profiles[].seenFinale` | bool | same | [FREE] |
| `profiles[2..].*` (additional profiles) | exists, paywalled today | DECISION D3 | [SHARED or PRO] |
| **`profiles[].styleVector`** (learned weights) | not yet | **[NEW] Add for advanced personalization** | [PRO][NEW] |
| `activeProfileId` | string | same | [SHARED] |
| `rooms[].id` | string | same | [SHARED] |
| `rooms[].profileId` | string | same | [SHARED] |
| `rooms[].type` | string | same | [SHARED] |
| `rooms[].photo` | dataURL | same | [SHARED] |
| `rooms[].dims` | {w,l,h} | same | [SHARED] |
| `rooms[].items` | item[] | same | [SHARED] |
| `rooms[].keepMode` | bool | same | [SHARED] |
| `rooms[].versions` | version[] | same | [SHARED] |
| `rooms[].activeVersion` | string | same | [SHARED] |
| `rooms[].createdAt` | ts | same | [SHARED] |
| `rooms[].layout` | {itemId: {x,y}} | same | [SHARED] |
| `rooms[].reshuffleCount` | int (gating today) | int (analytics only) | [FREE] |
| `rooms[].swapCount` | int (gating today) | int (analytics only) | [FREE] |
| `rooms[].qualityVote` | 'love'/'close'/'off' | same | [FREE] |
| `wishlist[]` | itemId[] | same | [FREE] |
| `wishlistMeta[itemId]` | {savedAt, priceAtSave, roomIdAtSave} | same | [FREE] |
| `priceAlerts[itemId]` | bool | same — **but delivery of alerts requires Pro per D9 recommendation** | [SHARED] |
| `bookmarkedRooms[]` | roomId[] | same | [FREE] |
| `draft` | partial draft of in-progress redesign | same — **gating moves here**: starting analyze on a fresh draft is the Pro gate | [SHARED] |
| `quiz` | {profileId, step, scores, answers} | same | [FREE] (per D8 recommendation) |
| `_events[]` (analytics) | rolling 200 | same | [SHARED] |
| `_setupCompleteAt` | ts | same | [FREE] |
| `_ahaResultsFired` | bool | same | [FREE] |
| `_habitFired` | bool | same | [FREE] |
| `_habit2r60Fired` | bool (proposed in retention pass) | same | [FREE] |
| `_tourShown` | bool | same | [FREE] |
| `_showExploreWelcome` | bool | same | [FREE] |
| `_templateTipShown` | bool | same | [FREE] |
| `_pendingIntent` | {intent, roomId, fromScreen} | same | [SHARED] |
| `_ahaQualitySignalFired` | bool | same | [FREE] |
| `emailIntent` | {email, capturedAt, roomId} (proposed C9 in feature gap pass) | same | [FREE] |
| `locale` | {region, currency, lang} (proposed C8) | same | [FREE] |
| **`cart[]`** (room-scoped checkout intent for affiliate flow) | not yet | **[NEW] Track which items user actually clicked through to retailer for** | [FREE][NEW] |
| **`affiliateClicks[]`** (rolling click log) | not yet | **[NEW]** | [FREE][NEW] |
| **`subscription`** | not yet | **[NEW] {status, plan, currentPeriodEnd, stripeCustomerId}** | [PRO][NEW] |

---

## 5. Screens — full inventory

### 5.1 `data-screen="welcome"` (`index.html:22-85`)
| Element | ID / line | Action | Tag |
|---|---|---|---|
| Theme toggle | `welcomeThemeBtn:23` | Toggle dark/light | [FREE] |
| Hero before/after demo | `.hero-demo:53` | Visual only, animated sweep | [FREE] |
| 4 price tags overlaid on after image | `.hd-price-tag` | Visual only | [FREE] |
| "Redesign My Room →" CTA | `welcomeStartBtn:74` | Routes guest → quiz, signed-in returning → home | [SHARED] (copy varies by recall state — `applyWelcomeRecallState` `app.js:3989`) |
| Social proof (★ 4.8 · 12,400+ rooms designed) | `.welcome-proof:76` | Display only | [FREE] |
| Reviews ticker | `reviewsBar:890` | Rotates through reviews + live counters | [FREE] |

### 5.2 `data-screen="signin"` (`index.html:86-140`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Back button | `[data-go=welcome]` | Return | [FREE] |
| Continue with Google | `[data-provider=google]` | OAuth | [FREE] |
| Continue with Apple | `[data-provider=apple]` | Stubbed | [FREE] |
| Continue with Amazon | `[data-provider=amazon]` | Mock or Supabase | [FREE] |
| Email/password form | `signinForm` | Sign in or sign up | [FREE] |
| Toggle signup ↔ signin | `signinToggleBtn` | Mode swap | [FREE] |
| Pending intent recovery | (`afterSigninRouting` `app.js:285`) | Resumes save/share/feedback after auth | [SHARED] (intents are FREE actions; signin still requires for cross-device sync) |

### 5.3 `data-screen="profile-select"` (`index.html:141-220`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Profile cards grid | `profileGrid:214` | Pick existing profile | [FREE] |
| User pill / dropdown | `userPillBtn:147` | Account menu | [FREE] |
| User dropdown items: Switch Account | `[data-action=switch]:153` | Sign out + back to welcome | [FREE] |
| User dropdown items: Furnish+ | `[data-action=furnish-plus]:163` | Open paywall | [SHARED] |
| User dropdown items: Support | `[data-action=support]:184` | Open support modal | [FREE] |
| User dropdown items: Sign Out | `[data-action=signout]:197` | Sign out | [FREE] |
| Add Profile button | `addProfileBtn:215` | Add new profile (gated today) | **DECISION D3** |
| Profile rename inline | (`renderProfiles` `app.js:614`) | Edit name | [SHARED] |
| Profile delete | (in `renderProfiles`) | Remove profile | [SHARED] |

### 5.4 `data-screen="quiz-intro"` (`index.html:222-237`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Start Quiz button | `startQuizBtn:232` | Begin quiz | [FREE] (per D8) |
| Skip button | `skipQuizBtn:233` | Use defaults | [FREE] |

### 5.5 `data-screen="quiz"` (`index.html:239-256`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Back button | `quizBackBtn:241` | Previous question | [FREE] |
| Progress text | `quizProgress` | Display | [FREE] |
| Progress bar fill | `qpbFill` | Display | [FREE] |
| Question rendering | (`renderQuizStep` `app.js:904`) | Photo/palette/icon questions | [FREE] |
| "None of these — skip" | `quizNoneBtn:252` | Skip question | [FREE] |
| Quiz finale animation | `quizFinale:923` | Furniture rain + congrats | [FREE] |

### 5.6 `data-screen="preferences"` (`index.html:257-336`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Profile photo upload | `ppAvatar:261` (camera/gallery hidden inputs) | Upload avatar | [FREE] |
| Profile name input | `ppNameInput:281` | Edit name | [FREE] |
| Take photo / Import / Remove | `ppCameraInput:288`, `ppGalleryInput:293`, `ppRemoveBtn:291` | Avatar source | [FREE] |
| Style chips | `stylesGrid:300` | Pick styles | [FREE] |
| Color mood chips | `colorsGrid:303` | Pick colors | [FREE] |
| Custom color details | `.custom-color-details:305` | Add hex | [FREE] (per D8 — basic personalization) |
| Custom color picker | `customColor:309` | Native color picker | [FREE] |
| Add to Palette | `addCustomColorBtn:311` | Save hex | [FREE] |
| Custom color list | `customColorList:312` | Manage custom hexes | [FREE] |
| Budget slider | `budgetSlider:325` | Set budget | [FREE] |
| Budget amount display | `budgetAmount:323` | Display | [FREE] |
| Save & Continue | `savePrefsBtn:333` | Save profile, route home | [FREE] |

### 5.7 `data-screen="home"` (`index.html:338-407`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Active profile pill / switch | `activeProfilePill:340`, `switchProfileBtn:343` | Display + switch | [FREE] |
| Theme toggle | `themeToggleBtn:346` | Dark/light | [FREE] |
| Wishlist link | `wishlistBtn:350` | Go to wishlist screen | [FREE] |
| **Lifecycle banner** (welcome-back / dormant) | `.lifecycle-banner` (rendered) | Per-state CTA | [FREE] |
| **Resume hero card** (your last room / draft) | `.resume-card` (rendered) | Reopen room or resume draft | [FREE] |
| **Style Pulse weekly drop** | `stylePulse:373`, `stylePulseStrip:380` | Browse weekly inspiration | [FREE] |
| **"New from Photo" CTA** | `[data-go=capture]:357` | Start a new redesign | **[PRO]** under Model A — this triggers the compute path |
| **"Use Template" CTA** | `[data-go=templates]:361` | Browse templates | [FREE] (browsing) but starting a template-based redesign → see D4 |
| Trending styles strip | `trendingStrip:384` | Browse | [FREE] |
| Seasonal collections strip | `collectionsStrip:387` | Browse | [FREE] |
| Saved Rooms grid | `roomsGrid:392` | View bookmarked rooms | [FREE] |
| Saved Items strip | `homeSavedItems:402` | View wishlist | [FREE] |
| **Template tip popover** (first-time) | `.template-tip` | Onboarding hint | [FREE] |
| **Explore Welcome card** | `.explore-welcome` | First-time signed-in welcome | [FREE] |
| **Home click interceptor (CURRENT)** | `app.js:1602` | Intercepts ALL home clicks for non-Pro → paywall | **[REMOVE] CRITICAL** — directly contradicts Model A |

### 5.8 `data-screen="saved"` (`index.html:408-430`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Sub-tab: Saved Rooms | `[data-st=rooms]` | Filter | [FREE] |
| Sub-tab: Saved Items | `[data-st=items]` | Filter | [FREE] |
| Saved rooms grid | `savedRoomsGrid:423` | Browse bookmarked rooms | [FREE] |
| Saved items grid | `savedItemsGrid:426` | Browse wishlist | [FREE] |

### 5.9 `data-screen="profile"` (`index.html:431-512`)
| Element | ID | Action | Tag |
|---|---|---|---|
| User avatar editor | `profilePageAvatar:436` | Change photo | [FREE] |
| User name display | `profilePageName:441` | Display | [FREE] |
| User email display | `profilePageEmail:442` | Display | [FREE] |
| Pro card | `profileProCard:447` | Status / upgrade CTA | [SHARED] |
| Pro upgrade button | `profileProBtn:454` | Open paywall | [SHARED] |
| Active design profile row | `profileActiveRow:459` | Switch profile | [FREE] |
| Settings: Appearance toggle | `[data-action=theme]` | Dark/light | [FREE] |
| Settings: Support | `[data-action=support]` | Support modal | [FREE] |
| Settings: Switch Account | `[data-action=switch]` | Sign out + welcome | [FREE] |
| Settings: Reset Profile | `[data-action=reset]:490` | Wipe profile (currently Pro-gated) | **DECISION** — re-evaluate. Recommend keeping Pro because abuse vector |
| Settings: Sign Out | `[data-action=signout]` | Sign out | [FREE] |
| **Style Timeline** | `styleTimeline` (per retention pass) | View room history | [FREE] |

### 5.10 `data-screen="templates"` (`index.html:520-528`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Templates grid | `templatesGrid:526` | Browse templates | [FREE] (browsing) |
| Template card click → starts redesign | `startFromTemplate` `app.js:2309` | Renders new room from template | **DECISION D4** — recommend [PRO] because it calls compute path |
| Pro template lock badge | `.t-pro-badge` (per Batch C earlier) | Visual lock | [SHARED] |
| Pro template gate | `app.js:2313` | Triggers paywall | **[KEEP, EXPAND under D4=c]** |

### 5.11 `data-screen="capture"` (`index.html:530-582`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Photo frame | `photoFrame:536` | Display photo | [FREE] |
| Photo tips list | `.photo-tips` (proposed C7) | Coaching | [FREE] |
| Take Photo button | (`cameraInput:550`) | Camera capture | [FREE] (uploading is free, *analyzing* is Pro) |
| Upload button | (`uploadInput:554`) | File select | [FREE] |
| Room type grid | `roomTypeGrid:566` | Pick room type | [FREE] |
| Hidden dimension inputs | `dimW`, `dimL`, `dimH:570` | Set dims (auto) | [FREE] |
| **"Design My Room →" analyze button** | `analyzeBtn:578` | **CRITICAL Pro gate point** — this is the compute trigger | **[PRO]** under Model A — but per D1, may allow N free per period |

### 5.12 `data-screen="analyzing"` (`index.html:583-596`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Loader animation | `.loader-wrap` | Visual | [SHARED] |
| Loader steps | `loaderSteps` | Display "measuring/matching/curating/arranging" | [SHARED] |

### 5.13 `data-screen="results"` (`index.html:597-704`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Back to home | `[data-go=home]:600` | Navigation | [FREE] |
| Title "Your Furnish Plan" | `h2:601` | Display | [SHARED] |
| Bookmark room button | `bookmarkRoomBtn:602` | Save room to bookmarks | [FREE] (was [SHARED] today via signin gate; affiliate-first stays [FREE], signin still required for cross-device) |
| Share room button | `shareRoomBtn:603` | Open share modal | [FREE] |
| Results summary | `resultsSummary:608` | Display dimensions + styles | [FREE] |
| Before/after slider | `baSlider:611` | Drag to compare | [FREE] |
| Price tags overlaid on after image | `priceTags:619` | Tap to open item sheet | [FREE] |
| **Rearrange furniture button** | `rearrangeBtn:630` | Trigger AI re-layout (currently → paywall) | **DECISION D10** — recommend [PRO] (AI compute) |
| Keep-existing switch | `keepExistingSwitch:642` | Toggle keep mode | [FREE] |
| Aha quality feedback | `ahaFeedback:647` | Vote on result | [FREE] |
| Totals card | `totalsCard:665` | Display | [FREE] |
| **"Reshuffle All Picks" prominent button** | `shopAllBtn:666` | Currently delegates to reshuffle. **Under Model A, restore "Shop the Whole Room" semantics** | **[FREE] (RENAMED back to "Shop the Whole Room")** |
| Palette bar | `paletteBar:672` | Filter swaps by color | [FREE] |
| Clear palette filter | `clearPaletteBtn:675` | Reset | [FREE] |
| **Recommended pieces locked-pieces-wrap** | `.locked-pieces-wrap:680` | Currently has PRO border + blur for non-Pro | **[REMOVE — delete the wrap's gating CSS]**. Items list = [FREE] |
| Items list | `itemsList:685` | Per-item cards | [FREE] |
| Versions card | `versionsCard:689` | View past versions | [FREE] |
| Versions list | `versionsList:694` | Switch versions | [FREE] |
| **Hidden bottom Reshuffle All Picks button** | `reshuffleBtn:700` (`hidden` attribute) | Already hidden; logic still hooked | [FREE] (logic stays, gating removed) |

### 5.14 `data-screen="wishlist"` (`index.html:705-718`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Back to home | `[data-go=home]` | Navigation | [FREE] |
| Wishlist list | `wishlistList:711` | Browse saved items | [FREE] |
| Per-item price-alert toggle | (in `renderWishlist` `app.js:3403`) | **Setting** is [FREE]. **Email/push delivery** is [PRO] per D9 | [SHARED] |

---

## 6. Modals — full inventory

### 6.1 `shareModal` (`index.html:719-746`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Share canvas | `shareCanvas:723` | Render share image | [FREE] |
| Download image | `shareDownloadBtn:725` | **Standard quality FREE, HD PRO** per D5 | [SHARED] |
| Share via system | `shareSystemBtn:726` | Native share sheet | [FREE] |
| Pin it | `sharePinBtn:729` | Pinterest builder | [FREE] |
| Copy caption | `shareCopyBtn:733` | Clipboard | [FREE] |
| Invite link | `shareLinkBtn:737` | Referral URL | [FREE] |
| Referral note | `.share-referral-note` | Display | [FREE] |

### 6.2 `paywallModal` (`index.html:747-790`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Close button | `paywallClose:752` | Dismiss | [SHARED] |
| Title | `paywallTitle:755` | Context-aware | **[REWRITE all copy under Model A]** |
| Subtitle | `paywallSub:756` | Context-aware | **[REWRITE]** |
| Stars + reviews | `.paywall-social:758` | Social proof | [SHARED] |
| Monthly toggle | `[data-plan=monthly]:765` | Plan switcher | [SHARED] |
| Annual toggle (default) | `[data-plan=annual]:766` | Plan switcher | [SHARED] |
| Price display | `paywallPrice:771` | Dynamic | [SHARED] |
| Unit display | `paywallUnit:772` | "/mo billed annually" | [SHARED] |
| Feature list | `.paywall-list:775` | **[REWRITE]** to match Model A — currently lists "unlimited reshuffles" which is now FREE | **[REWRITE — CRITICAL]** |
| Urgency banner | `.paywall-urgency:783` | "Founding member" | [SHARED] |
| Primary CTA | `paywallCta:786` | Mock Pro flag | [SHARED] |
| Dismiss | `paywallDismiss:787` | Close | [SHARED] |
| Footnote | `.paywall-footnote:788` | Trial copy | [SHARED] |
| **PAYWALL_COPY contexts** | `app.js:766-797` | 12 contexts (`redesign`, `rearrange`, `reshuffle`, `swap`, `hd_export`, `template_pro`, `shop_free`, `home_feature`, `home_feature_used`, `feedback`, `second_room`, `profile`, `generic`) | **[REMOVE 6: reshuffle, swap, shop_free, home_feature, home_feature_used, feedback]. KEEP+REWRITE 6: redesign, rearrange, hd_export, template_pro, second_room, profile, generic.** |

### 6.3 `itemSheet` (`index.html:791-840`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Backdrop | `itemSheetBackdrop:793` | Close on tap | [FREE] |
| Close button | `itemSheetClose:795` | Close | [FREE] |
| Item image | `bsImage:798` | Display | [FREE] |
| Source pill | `bsSource:801` | Retailer name | [FREE] |
| Type pill | `bsType:802` | Item type | [FREE] |
| Item name | `bsName:804` | Display | [FREE] |
| Description | `bsDesc:805` | Display | [FREE] |
| Price | `bsPrice:807` | Display | [FREE] |
| Fit warning | `bsFit:808` | Display | [FREE] |
| Specs grid | `bsSpecs:810` | Display | [FREE] |
| Alternatives | `bsAlts:812` | Browse alternatives | [FREE] |
| Save to wishlist | `bsSaveBtn:816` | Wishlist toggle | [FREE] |
| Swap for alternative | `bsSwapBtn:821` | Swap item in room | **[FREE]** under Model A (today is gated by `canSwap`) |
| Shop now | `bsShopBtn:829` | **AFFILIATE LINK** | **[FREE — CRITICAL]** under Model A. Currently gated `app.js:3657` |
| **(NEW) Ask my partner button** (proposed C5) | — | Share item to partner | [FREE][NEW] |
| **(NEW) "Why this piece?" expander** (proposed C6) | — | Justification | [FREE][NEW] |

### 6.4 `supportModal` (`index.html:841-865`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Close | `supportClose:843` | Dismiss | [FREE] |
| Email Us link | `mailto:hello@furnish.app:850` | Email | [FREE] |
| Browse FAQ | `supportFaq:854` | Stub | [FREE] |
| Suggest a Feature | `supportFeedback:861` | Stub | [FREE] |

### 6.5 `photoSourceModal` (`index.html:866-888`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Close | `psClose:868` | Dismiss | [FREE] |
| Take a photo | `psTakePhoto:872` | Camera | [FREE] |
| Import | `psFromGallery:876` | File select | [FREE] |
| Remove | `psRemove:880` | Clear avatar | [FREE] |
| Cancel | `psCancel:885` | Dismiss | [FREE] |

### 6.6 `quizFinale` overlay (`index.html:923-944`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Rain container | `qfRain:924` | Animation | [FREE] |
| Card | `qfCard:925` | Congrats display | [FREE] |
| Heart/star + glow | `.qf-heart:926` | Visual | [FREE] |
| Title | `h3:937` | Display | [FREE] |
| Sub | `qfSub:938` | Style summary | [FREE] |
| Continue | `qfContinue:939` | Dismiss + route | [FREE] |

### 6.7 `bottomNav` (`index.html:899-921`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Home tab | `[data-go=home][data-tab=home]:900` | Navigate | [FREE] |
| Saved tab | `[data-go=saved][data-tab=saved]:907` | Navigate | [FREE] |
| Profile tab | `[data-go=profile][data-tab=profile]:914` | Navigate | [FREE] |

### 6.8 Toast (`index.html:922`)
| Element | ID | Action | Tag |
|---|---|---|---|
| Toast container | `toast:922` | Notification surface | [FREE] |

### 6.9 (Implicit) Push pre-prompt (`app.js:2983` `maybeAskForPushPermission`)
| Element | Action | Tag |
|---|---|---|
| `.push-pre-prompt` (dynamically appended) | First-save soft-ask for notifications | [FREE] (asking is FREE; **delivery of price-drop notifications** is [PRO] per D9) |

### 6.10 (Implicit) Coach mark (`app.js:2772` `showFirstAhaHint`)
| Element | Action | Tag |
|---|---|---|
| `.coach-mark` (dynamically appended) | First-aha tooltip on price tags | [FREE] |

---

## 7. Helper functions / handlers — gating logic

| Function | File:line | Gate today | Model A | Tag |
|---|---|---|---|---|
| `welcomeStartBtn` click | `app.js:226` | Routes guest to quiz, returning to home | Same | [FREE] |
| `signinForm` submit | `app.js:355` | Email signup/signin | Same | [FREE] |
| Social signin buttons | `app.js:419` | OAuth | Same | [FREE] |
| `addProfileBtn` click | `app.js:730` | Triggers `openPaywall('profile')` if `state.profiles.length >= 1` and `!isPro()` | **DECISION D3** — keep gate or remove | [SHARED] |
| `signinToggleBtn` | `app.js:351` | Toggle signup ↔ signin | Same | [FREE] |
| `userPillBtn` click | `app.js:518-519` | Opens dropdown | Same | [FREE] |
| User dropdown `[data-action=furnish-plus]` | `app.js:550` | `openPaywall('generic')` | Same | [SHARED] |
| User dropdown `[data-action=switch]` | `app.js` (within dropdown listener) | Sign out flow | Same | [FREE] |
| User dropdown `[data-action=signout]` | `app.js` | Sign out | Same | [FREE] |
| `themeToggleBtn` / `welcomeThemeBtn` | `app.js` | Toggle theme | Same | [FREE] |
| `wishlistBtn` | `app.js:1715` | Render wishlist + show screen | Same | [FREE] |
| `switchProfileBtn` | `app.js` | Go to profile-select | Same | [FREE] |
| `startQuizBtn` | `app.js:874` | Begin quiz | Same | [FREE] |
| `skipQuizBtn` | `app.js:877` | Skip with smart defaults | Same | [FREE] |
| `quizBackBtn` | `app.js:885` | Step back | Same | [FREE] |
| `quizNoneBtn` | `app.js:894` | Skip question | Same | [FREE] |
| Quiz option cards | `app.js:935` (in `renderQuizStep`) | Score answer + advance | Same | [FREE] |
| `qfContinue` click | `app.js:1106` (in `playQuizFinale`) | Dismiss finale | Same | [FREE] |
| `savePrefsBtn` | `app.js:1361` | Save profile + route | Same | [FREE] |
| `addCustomColorBtn` | `app.js:1356` | Append hex | Same | [FREE] |
| `customColor` change | `app.js:1325` | Visual update | Same | [FREE] |
| `budgetSlider` input | `app.js:1287` | Update budget | Same | [FREE] |
| `ppCameraInput` change | (in `setupProfilePicture`) | Avatar capture | Same | [FREE] |
| `ppGalleryInput` change | (in `setupProfilePicture`) | Avatar select | Same | [FREE] |
| `ppRemoveBtn` | (in `setupProfilePicture`) | Clear avatar | Same | [FREE] |
| `ppNameInput` change | (in `openPreferences`) | Save name | Same | [FREE] |
| Style chip selection | (`renderChipGrid`) | Toggle style | Same | [FREE] |
| Color chip selection | (`renderColorChips`) | Toggle color | Same | [FREE] |
| Profile card click | (`renderProfiles`) | Activate + route | Same | [FREE] |
| Profile rename | (`renderProfiles:675`) | Save name | Same | [FREE] |
| Profile delete | (in `renderProfiles`) | Remove profile | Same | [SHARED] |
| Home `[data-go=capture]` | `app.js:160` | Routes to capture screen + `prepareCapture` | **Gate moves to `analyzeBtn`** — capture screen entry stays free | [FREE] (entry) |
| Home `[data-go=templates]` | `app.js:161` | Routes to templates | Same | [FREE] |
| Home click interceptor | `app.js:1602` | **Intercepts ALL home clicks for non-Pro and opens paywall** | **[REMOVE — CRITICAL]** | [REMOVE] |
| Lifecycle banner CTA click | `app.js:1564` | Routes per state | Same | [FREE] |
| Style Pulse card click | `app.js:1494` | Routes to templates | Same | [FREE] |
| Resume card click | (in `renderResumeHero`) | Reopen room or capture | Same | [FREE] (reopen). Capture-from-draft → Pro per D7 |
| Template tip dismiss | (in `showTemplateTip`) | Close | Same | [FREE] |
| Explore welcome CTA | `app.js:1593` | Open paywall | **[REWRITE]** under Model A — soft sell, not a paywall | [SHARED] |
| Explore welcome dismiss | (in `renderExploreWelcome`) | Hide | Same | [FREE] |
| Bottom-nav home/saved/profile tabs | `app.js:155-164` | Navigate | Same | [FREE] |
| Saved sub-tab clicks | (`showSavedPane`) | Filter | Same | [FREE] |
| Saved Room card click | (`renderSavedRooms`) | Reopen room | Same | [FREE] |
| Saved Item card click | (`renderSavedItems`) | Open item sheet | Same | [FREE] |
| Profile settings: theme | `app.js` (profile listener) | Toggle | Same | [FREE] |
| Profile settings: support | (profile listener) | Open support modal | Same | [FREE] |
| Profile settings: switch | (profile listener) | Sign out + back | Same | [FREE] |
| Profile settings: reset | (profile listener) | Wipe profile | Same | [SHARED] (gating preserved per recommendation) |
| Profile settings: signout | (profile listener) | Sign out | Same | [FREE] |
| `profileProBtn` | `app.js:1954` | `openPaywall('generic')` | Same | [SHARED] |
| Style Timeline item click | (in `renderStyleTimeline`) | Reopen room | Same | [FREE] |
| Templates grid card click | `startFromTemplate` `app.js:2309` | Compute new redesign from template | **[PRO]** under Model A (D4=c) — gates on `canRedesign()` | [SHARED → PRO] |
| Pro template badge click | (in `renderTemplates`) | Triggers paywall | **Same** (still gates premium templates) | [PRO] |
| Capture: `cameraInput` change | `app.js:2452` | Read photo, set draft | **[FREE]** (uploading is free) | [FREE] |
| Capture: `uploadInput` change | `app.js:2453` | Read photo, set draft | [FREE] | [FREE] |
| Capture: room-type card click | `app.js:2418` | Set draft type | [FREE] | [FREE] |
| Capture: dim inputs | hidden | Auto-set | [FREE] | [FREE] |
| Capture: `analyzeBtn` click | `app.js:2491` | **CRITICAL — runs the AI analyzer** | **[PRO]** — gates here on `canRedesign()` (already does today) | [PRO] |
| Capture: `rescanBtn` | hidden today | — | — | [FREE] |
| Results: `bookmarkRoomBtn` | `app.js:3260` | Toggle bookmark; today gates `requireSignin('save')` | **[FREE]** but signin still required for cross-device sync | [FREE] |
| Results: `shareRoomBtn` | `app.js:3441` | Open share modal; today gates `requireSignin('share')` | [FREE] | [FREE] |
| Results: `rearrangeBtn` | `app.js:2898` | `openPaywall('rearrange')` | **DECISION D10** — recommend [PRO] (compute) | [PRO] |
| Results: `keepExistingSwitch` | `app.js` (within openRoom or wired separately) | Toggle keep mode + recompute picks (no AI) | **[FREE]** (just re-runs `pickItemsForRoom` locally — no compute) | [FREE] |
| Results: aha feedback `.af-btn` clicks | `app.js:3294` | Vote; today gates non-Pro | **[FREE]** | [FREE] |
| Results: `shopAllBtn` | `app.js` (currently `delegates → reshuffleBtn`) | **CRITICAL — should open all affiliate URLs** | **[REWRITE — restore Shop the Whole Room semantics]** | [FREE] |
| Results: `clearPaletteBtn` | (in `renderPalette`) | Reset filter | Same | [FREE] |
| Results: palette swatch clicks | (in `renderPalette`) | Filter swaps | Same | [FREE] |
| Results: `reshuffleBtn` | `app.js:3325` | **Today gates on `canReshuffle()`** | **[FREE]** — remove gate | [FREE] |
| Results: `versionsCard` | `app.js:3129` | Browse versions | Same | [FREE] |
| Results: version pill click | (in `renderVersions`) | Load version | Same | [FREE] |
| Results: version compare toggle | `app.js:3185` | Compare 2 versions | Same | [FREE] |
| Item sheet: `bsSaveBtn` | (`toggleWishlist` `app.js:3029`) | Toggle wishlist | Same | [FREE] |
| Item sheet: `bsSwapBtn` | (`swapItem` `app.js:3067`) | **Today gates on `canSwap()`** | **[FREE]** — remove gate | [FREE] |
| Item sheet: `bsShopBtn` | rendered as `<a target=_blank>` | **AFFILIATE CLICK** | **[FREE — CRITICAL]** | [FREE] |
| Item sheet: alternatives click | (`renderSheetAlternatives`) | Open alt item sheet | Same | [FREE] |
| Wishlist: per-item save toggle | (`toggleWishlist`) | Toggle | Same | [FREE] |
| Wishlist: per-item price-alert toggle | (`togglePriceAlert` `app.js:3055`) | Toggle alert | Same — **delivery is [PRO] per D9** | [SHARED] |
| Wishlist: per-item shop now link | rendered as anchor | Affiliate click | Same | [FREE] |
| Share: `shareDownloadBtn` | `app.js:3551` | Free=watermarked, Pro=clean | Same per D5=a | [SHARED] |
| Share: `shareSystemBtn` | `app.js:3633` | Native share | Same | [FREE] |
| Share: `sharePinBtn` | `app.js:3625` | Pinterest builder | Same | [FREE] |
| Share: `shareCopyBtn` | `app.js:3589` | Clipboard caption | Same | [FREE] |
| Share: `shareLinkBtn` | `app.js:3608` | Referral URL | Same | [FREE] |
| Push pre-prompt yes/no/close | `app.js:3017` | Gate Notification API | [FREE] (asking) — **delivery [PRO]** | [SHARED] |
| Coach mark dismiss | `app.js:2788` | Close | [FREE] | [FREE] |
| `paywallCta` click | `app.js:836` | Mock `state.user.isPro = true` + sync | **[NEW] Wire to Stripe Checkout** when backend is in | [SHARED → NEW] |
| `paywallClose` / `paywallDismiss` | `app.js:813,815` | Close modal | Same | [SHARED] |
| Paywall plan toggle (monthly/annual) | `app.js:822` | Update price display | Same | [SHARED] |
| `affiliateLearnMore` (proposed C3) | (NEW) | Open disclosure modal | [NEW] | [NEW] |
| Email-list-capture form (proposed C9) | (NEW) | Capture email intent | [NEW] | [NEW] |
| `bsAskBtn` (proposed C5) | (NEW) | Share item to partner | [NEW] | [NEW] |
| Affiliate URL builder `buildAffiliateUrl(item)` (proposed C2) | (NEW) | Append affiliate IDs + UTM | [NEW] | [NEW] |
| `trackAffiliateClick(item, surface)` (proposed C2) | (NEW) | Analytics | [NEW] | [NEW] |
| **Pro upgrade success handler** | (NEW) | After Stripe webhook → unlock features → resume pending action | [NEW] | [NEW] |
| **Pro downgrade handler** | (NEW) | After cancellation → step down on next period boundary | [NEW] | [NEW] |
| **Mid-flow paywall resume** | (NEW) | If user upgrades during analyze flow, draft completes automatically | [NEW] | [NEW] |
| **Tier check middleware `gateProAction(actionId, fn)`** | (NEW) | Centralized gate | [NEW] | [NEW] |

---

## 8. Analytics events — full inventory

Located via `trackEvent(...)` calls. **Event renaming/removing must be done atomically with the gate changes.**

### Events to KEEP as-is (free-tier engagement signals)
- `signup_started`
- `setup_photo_uploaded`
- `setup_style_selected`
- `setup_room_type_selected`
- `setup_complete`
- `aha_first_results`
- `aha_quality_signal` (signals: `bookmarked_room`, `share_clicked`, `item_tapped`, `explicit_vote`, `shop_all_clicked` ← good — keep)
- `habit_second_room`
- `session_started`
- `style_pulse_card_clicked`
- `style_pulse_shown`
- `lifecycle_banner_clicked`
- `lifecycle_banner_shown`
- `push_permission`
- `share_caption_copied`
- `share_invite_link_copied`
- `share_pinterest_clicked`
- `share_system_success`
- `share_download`
- `price_alert_on` / `price_alert_off`

### Events to KEEP but **with revised contexts** (paywall_trigger contexts shrink dramatically)
- `paywall_trigger` — currently `from`: `explore_welcome`, `home_feature`, `template_pro`, `rearrange`, `swap`, `reshuffle` — **REMOVE `home_feature`, `swap`, `reshuffle`. KEEP `explore_welcome`, `template_pro`, `rearrange`.**
- `paywall_shown` — context list shrinks per Section 6.2
- `paywall_converted` — keep, but should also include `triggeringContext` so we attribute conversions

### Events to REMOVE (gates being removed)
- Any `paywall_trigger` with `from='swap'` (`app.js:3071`)
- Any `paywall_trigger` with `from='reshuffle'` (`app.js:3333`)
- Any `paywall_trigger` with `from='home_feature'` (`app.js:1617,1594`)

### Events to ADD (Model A requires them)
- `affiliate_click` — props: `itemId, source, price, surface (item_sheet | item_card_button | shop_all | price_tag | wishlist), roomId`
- `affiliate_shop_all_clicked` — props: `roomId, itemCount, totalPrice`
- `affiliate_disclosure_viewed`
- `email_intent_captured` (already proposed in C9 of feature-gap pass)
- `pro_action_attempted` — props: `actionId (analyze | rearrange | hd_export | template_pro | batch | etc.), wasGated, lifecycle`
- `pro_action_completed` — props: `actionId, msFromGate`
- `subscription_started` — props: `plan, price, source`
- `subscription_canceled` — props: `daysActive, lastRoomDesignedDays`
- `tier_changed` — props: `from, to, source (stripe_webhook | manual | grandfather)`
- `redesign_quota_remaining_shown`

---

## 9. Backend (Supabase) — endpoints + tables

Source: `supabase-client.js`, `SUPABASE_SETUP.md`.

| Table / Endpoint | File:line | Today | Model A | Tag |
|---|---|---|---|---|
| `auth.signUp` | `supabase-client.js:46` | Email + name + password | Same | [FREE] |
| `auth.signIn` | `:53` | Email + password | Same | [FREE] |
| `auth.signInWithGoogle` | `:57` | OAuth | Same | [FREE] |
| `auth.signOut` | `:64` | Sign out | Same | [FREE] |
| `auth.getUser` | `:68` | Get session | Same | [FREE] |
| `auth.onChange` | `:72` | Subscription | Same | [SHARED] |
| `profiles` table | `:140` | One row per profile | Same | [SHARED] |
| `rooms` table | `:141` | Stores designed rooms incl. items, versions, layout | Same | [SHARED] |
| `wishlist_items` table | `:142` | itemId + price_alert | Same — **price_alert delivery requires [PRO] sender service** | [SHARED] |
| `user_settings` table | `:143` | theme, bookmarked_rooms, is_pro | Same — **`is_pro` becomes the canonical Pro flag** | [SHARED] |
| `pullAll(state)` | `:135` | Sync down profiles, rooms, wishlist, settings | Same | [SHARED] |
| `pushAll(state)` | `:160` | Sync up | Same | [SHARED] |
| `clearRemote()` | `:197` | Wipe all user data | Same | [SHARED] |
| **`subscriptions` table (NEW)** | — | — | **{ user_id, stripe_customer_id, stripe_subscription_id, status, plan, current_period_end, canceled_at }** | [NEW] |
| **`affiliate_clicks` table (NEW)** | — | — | **{ id, user_id, item_id, source, room_id, clicked_at, fclick_id }** for attribution reconciliation | [NEW] |
| **`redesign_quota` table (NEW)** | — | — | If D1=c (monthly reset): **{ user_id, period_start, period_end, count }** | [NEW conditional] |
| **`affiliate_conversions` table (NEW)** | — | — | Reconciled commissions from affiliate networks | [NEW] |
| **Stripe webhook endpoint (NEW)** | — | — | Listen for `customer.subscription.{created,updated,deleted}` and `invoice.payment_succeeded`. Update `subscriptions` + `user_settings.is_pro` | [NEW] |
| **Email lifecycle backend (NEW — proposed in retention pass H3)** | — | — | Welcome / dormant / resurrection sequences | [NEW] |
| **Push notification delivery (NEW)** | — | — | For price-drop alerts (D9) | [NEW] |

---

## 10. Copy surfaces — every label that touches monetization

### Currently CORRECT under Model A (no change needed)
- Welcome `tagline`: "Watch any room transform in 20 seconds." ✓
- Welcome sub: "No signup needed · ~30 seconds" ✓
- Activation event names ✓

### Currently WRONG — must rewrite under Model A

| Where | Today | Model A says |
|---|---|---|
| Paywall feature list (`index.html:776-781`) | "Every room in your home — unlimited redesigns & reshuffles" / "HD exports" / "Style profiles for everyone" / "Price-drop alerts" / "Seasonal collections refreshed monthly" | **NEW** list anchored on compute + multi-room + HD: e.g. "Unlimited new redesigns · Multi-room batch processing · HD export, no watermark · Style learns over time · Priority compute" |
| Paywall title `redesign` | "Design every room in your home" | "Need another redesign?" — frame as compute purchase, not unlimited use |
| Paywall sub `redesign` | "You've used your free redesign…" | Same direction, rewrite per chosen D1 |
| Paywall `reshuffle` ENTIRE entry | "Keep reshuffling — You've used your free reshuffles." | **REMOVE entirely** — reshuffle is free |
| Paywall `swap` ENTIRE entry | "Swap any piece — You've used your free swaps." | **REMOVE entirely** |
| Paywall `shop_free` ENTIRE entry | "Shop your redesign — Unlock Pro to see every piece." | **REMOVE entirely** |
| Paywall `feedback` ENTIRE entry | "Unlock Furnish — You already saw the magic." | **REMOVE entirely** |
| Paywall `home_feature` / `home_feature_used` | "Unlock Furnish — You've seen what Furnish can do." | **REMOVE entirely** |
| Reshuffle button toast `app.js:3347` | "Fresh picks · {N} free reshuffle{s} left" | "Fresh picks curated" (no quota) |
| Profile page Pro card sub `app.js:1942` | "{N} free redesign{s} left — upgrade anytime" | Same idea, but tied to D1 logic; if D1=b (lifetime 1), copy is "1 free redesign on us — upgrade for unlimited" |
| Items list "Unlock to shop" pill (`styles.css` — `body.is-free [data-screen="results"] #itemsList::before`) | "Unlock to shop every piece" | **REMOVE** — pseudo-element with that content must be deleted |
| Locked-pieces-wrap PRO badge content | "🔒 PRO" | **REMOVE** — wrap stays as DOM container but its `is-free` styling is deleted |
| Aha feedback subtitle for guest (`styles.css`) | ".af-q::after { content: ' · Sign in to continue'; }" | **REMOVE** — vote is free |
| Aha feedback subtitle for signed-in-free | ".af-q::after { content: ' · Upgrade to vote'; }" | **REMOVE** |
| Welcome recall copy for dormant | "Welcome back — design another room →" | **DECISION**: if new redesigns are Pro-gated, this CTA should route to home/wishlist instead (or to paywall, but that's hostile to dormant users — recommend send to home and let them browse/shop) |
| Explore welcome card title | "You're in. Now explore what Furnish can do." | Keep, but rewrite body to position Pro as "more redesigns when you're ready" — not "unlock the whole experience" |
| Explore welcome CTA | "Unlock Furnish" | "Browse Your Style" or "Start Shopping" — orient to free affiliate value first |

### NEW copy required
- **Affiliate disclosure inline + modal** (FTC compliance — was C3 in feature-gap pass)
- **"Out of redesigns this month — upgrade or wait until {date}"** if D1=c
- **Pro tier feature comparison table** (in pricing modal/page)
- **Mid-flow paywall message** (e.g. "Almost done — finish this redesign with Furnish+")
- **Downgrade copy** ("You're on Free as of {date}. Your past redesigns stay shoppable.")
- **Grandfathered-Pro welcome message** if applicable per D6
- **Quota-remaining toast** on each completed redesign ("2 redesigns left this month")

---

## 11. CSS surfaces affected

`styles.css` rules keyed on `body.is-free` or `body.is-signedin-free`. Located via `body.is-free` and `body.is-signedin-free` selectors.

| Selector | Today | Model A | Tag |
|---|---|---|---|
| `body.is-free [data-screen="results"] #itemsList { filter: blur(3px) saturate(0.92); pointer-events: none; }` | Blurs items list for free users | **DELETE** | [REMOVE] |
| `body.is-free [data-screen="results"] .locked-pieces-wrap { border: 2px solid #A47C4D; … }` | Golden-brown border + Pro padlock | **DELETE the whole rule block** | [REMOVE] |
| `body.is-free [data-screen="results"] .locked-pieces-wrap > .lpw-badge { display: inline-flex; … }` | Shows PRO badge | **DELETE** (rule + DOM badge stays as inert span until removed in HTML) | [REMOVE] |
| `body.is-pro [data-screen="results"] .locked-pieces-wrap { border: 0; … }` | Pro override | **DELETE** (no longer needed since base style is unstyled) | [REMOVE] |
| `body.is-pro [data-screen="results"] #itemsList { filter: none; … }` | Pro override | **DELETE** | [REMOVE] |
| `body.is-guest [data-screen="results"] #ahaFeedback .af-q::after` | "· Sign in to continue" | **DELETE** | [REMOVE] |
| `body.is-signedin-free [data-screen="results"] #ahaFeedback .af-q::after` | "· Upgrade to vote" | **DELETE** | [REMOVE] |
| `body.is-free.is-signedin-free [data-screen="home"] .home-ctas .btn::after { content: '\1F512'; … }` | Lock emoji on home CTAs | **DELETE** | [REMOVE] |
| `body.is-free.is-signedin-free [data-screen="home"] *` (positional rules around home gating) | Various | **DELETE** | [REMOVE] |
| `body.is-free [data-screen="results"] #shopAllBtn { background: linear-gradient(...); }` (the gradient applied to the relabeled button) | Override | **DELETE** — restore base button styling | [REMOVE] |
| `body.is-free [data-screen="results"] #shopAllBtn::after { content: ' — Pro'; }` | Suffix | **DELETE** | [REMOVE] |
| `.locked-pieces-wrap` HTML container in `index.html:680-687` | Wraps heading + items list | **Keep DOM** but it becomes a no-op wrapper. Optional: remove and inline. | [SHARED] |
| `.lpw-badge` span in `index.html:681-684` | PRO badge | **DELETE the span** entirely | [REMOVE] |
| `.aha-feedback` element + handler | Vote UI | Keep DOM + behavior | [FREE] |
| Body classes used by JS: `is-pro`, `is-free`, `is-guest`, `is-signedin-free`, `has-used-demo` | Toggled by `syncFreeModeClass` | **Keep** — but selectors hanging off them need a sweep | [SHARED] |
| **NEW class** `has-used-free-redesign` | — | **[NEW]** alias for the renamed `hasUsedFreeRedesign()` to support new copy/UI variants | [NEW] |

---

## 12. furniture.js — data shapes

| Export | Today | Model A | Tag |
|---|---|---|---|
| `window.STYLES` | 16 styles | Same — all available to free users (basic personalization) | [FREE] |
| `window.COLOR_MOODS` | 8 moods | Same | [FREE] |
| `window.BUDGETS_LEGACY` | Migration helper | Same | [FREE] |
| `window.BUDGET_MIN` / `BUDGET_MAX` | 50, 10000 | Same | [FREE] |
| `window.ROOM_TYPES` | 9 rooms | Same | [FREE] |
| `window.ROOM_SLOTS` | Per-type slot defs | Same | [FREE] |
| `window.ITEM_FOOTPRINTS` | Per-type footprint | Same | [FREE] |
| `window.COLLECTIONS` | Trending + seasonal | Same — all visible to free | [FREE] |
| `window.ROOM_TEMPLATES` | 5 free + 3 pro | Same per D4 | [SHARED] |
| `window.QUIZ` | 4 questions | Same | [FREE] (per D8) |
| `window.QUIZ_SVGS` | Question icons | Same | [FREE] |
| `window.ROOM_TYPE_SVGS` | Type icons | Same | [FREE] |
| `window.FURNITURE_DB` | ~80 placeholder items with placeholder URLs | **[NEW] Replace placeholder URLs with affiliate URLs (one of 7 backend items per CLAUDE.md). Also add `priceWas` field for price-drop UI.** | [SHARED → NEW for catalog overhaul] |

---

## 13. NEW items (Model A requires)

| Item | Where it lives | Tag |
|---|---|---|
| Centralized `gateProAction(actionId, fn)` middleware | `app.js` | [NEW] |
| `buildAffiliateUrl(item)` helper | `app.js` (proposed C2 — also a Model-A requirement now) | [NEW] |
| `trackAffiliateClick(item, surface)` helper | `app.js` | [NEW] |
| `affiliate_click` analytics event | analytics layer | [NEW] |
| Pro tier comparison table (in/below paywall modal) | `index.html` paywall | [NEW] |
| Affiliate disclosure footer + modal | `index.html` results screen + new modal | [NEW] |
| Email-list capture form on results | `index.html:results` (proposed C9) | [NEW] |
| `Ask my partner` button in item sheet | `index.html:itemSheet` (proposed C5) | [NEW] |
| `Why this piece` expander on item cards | `app.js:renderItemsList` (proposed C6) | [NEW] |
| Photo upload tips list | `index.html:capture` (proposed C7) | [NEW] |
| Currency-aware price formatting | `app.js:detectLocale` (proposed C8) | [NEW] |
| Bundle / "complete the look" recommendations | `app.js:renderItemsList`, new logic | [NEW][PRO scope decision] |
| Multi-retailer comparison per item | item sheet | [NEW] |
| Multi-room batch design UI | new screens / new flow | [PRO][NEW] |
| Style vector / advanced personalization storage | `state.profiles[].styleVector` | [PRO][NEW] |
| Stripe Checkout session creation endpoint | backend | [NEW] |
| Stripe webhook handler | backend | [NEW] |
| `subscription` state field | `app.js` state shape | [NEW] |
| `subscriptions` Supabase table | `supabase-client.js` + SQL | [NEW] |
| `affiliate_clicks` Supabase table | `supabase-client.js` + SQL | [NEW] |
| `redesign_quota` Supabase table (if D1=c) | `supabase-client.js` + SQL | [NEW] |
| Push notification delivery (price drops) | backend | [PRO][NEW] |
| Email lifecycle program | backend (deferred per "design first" guidance, but flagging) | [NEW][DEFERRED] |
| Mid-flow paywall resume logic | `app.js:openPaywall` + Stripe success callback | [NEW] |
| Grandfathered-Pro detection | `app.js:boot` + Supabase migration | [NEW] |
| Downgrade flow + retention surface for canceling Pro users | `app.js` + Supabase webhook | [NEW] |
| Quota-remaining toast on each redesign | `app.js:after openRoom` | [NEW] |
| Tier-change-while-offline reconciliation | `app.js:boot` (compare cached `is_pro` against fresh on reconnect) | [NEW] |
| **CRITICAL gate flag: capture screen entry vs. analyze** — gate moves from "everywhere" to "the analyze button only" | `app.js:analyzeBtn click` (`:2491`) | [SHARED] (logic already exists; copy needs refresh) |

---

## 14. REMOVE items (Model A makes obsolete)

| Item | File:line | Why |
|---|---|---|
| `FREE_RESHUFFLE_PER_ROOM` constant | `app.js` | Reshuffle is unlimited free |
| `FREE_SWAPS_PER_ROOM` constant | `app.js` | Swap is unlimited free |
| `canReshuffle(room)` body's gate logic | `app.js:2540` | Always returns true; function can be deleted or inlined |
| `canSwap(room)` body's gate logic | `app.js:2544` | Always returns true |
| `openPaywall('reshuffle')` call site | `app.js:3334` | Gate removed |
| `openPaywall('swap')` call site | `app.js:3072` | Gate removed |
| `openPaywall('shop_free')` call site | `app.js:3659` | Gate removed (CRITICAL) |
| `openPaywall('feedback')` call site | `app.js:3307` | Gate removed |
| `openPaywall('home_feature')` call site (welcome card) | `app.js:1594` | Gate removed |
| `openPaywall('home_feature')` call site (home interceptor) | `app.js:1617` | Gate + interceptor removed |
| Home click interceptor (capture phase, blanket gate) | `app.js:1602-1622` | **CRITICAL DELETE — explicitly blocks all affiliate behavior on home** |
| `PAYWALL_COPY.reshuffle` entry | `app.js:769` | Context retired |
| `PAYWALL_COPY.swap` entry | `app.js:773` | Context retired |
| `PAYWALL_COPY.shop_free` entry | `app.js:781` | Context retired |
| `PAYWALL_COPY.feedback` entry | `app.js:793` | Context retired |
| `PAYWALL_COPY.home_feature` entry | `app.js:785` | Context retired |
| `PAYWALL_COPY.home_feature_used` entry | `app.js:789` | Context retired |
| Item sheet open guard (`if (!isPro())` block) | `app.js:3656-3661` | Items free to view + shop |
| Aha feedback gate (`if (!isPro())` for vote) | `app.js:3306-3309` | Voting is free |
| Reshuffle gate body | `app.js:3331-3335` | Always allowed |
| Swap gate body | `app.js:3070-3074` | Always allowed |
| `body.is-free [data-screen="results"] #itemsList { filter: blur ... }` | `styles.css` | Blur removed |
| `body.is-free [data-screen="results"] .locked-pieces-wrap { border ... }` | `styles.css` | PRO border removed |
| `body.is-free [data-screen="results"] .locked-pieces-wrap > .lpw-badge` | `styles.css` | PRO badge removed |
| `.lpw-badge` HTML element | `index.html:681-684` | Element deleted |
| `body.is-pro [data-screen="results"] .locked-pieces-wrap` (override that "undoes" the now-deleted style) | `styles.css` | Redundant after base removed |
| `body.is-pro [data-screen="results"] #itemsList` (override) | `styles.css` | Redundant |
| `body.is-guest [data-screen="results"] #ahaFeedback .af-q::after` | `styles.css` | Sign-in suffix removed |
| `body.is-signedin-free [data-screen="results"] #ahaFeedback .af-q::after` | `styles.css` | Upgrade suffix removed |
| `body.is-free.is-signedin-free [data-screen="home"] .home-ctas .btn::after` (lock emoji) | `styles.css` | Lock emoji removed |
| Any `body.is-free.is-signedin-free` rules on home | `styles.css` | Free home is unrestricted |
| `body.is-free [data-screen="results"] #shopAllBtn::after { content: ' — Pro'; }` | `styles.css` | "Pro" suffix removed |
| `body.is-free [data-screen="results"] #shopAllBtn { background: gradient }` | `styles.css` | Use base button styling |
| `paywall_trigger` events with `from='swap','reshuffle','shop_free','feedback','home_feature'` | various | No longer fired |
| Reshuffle counter "{N} free reshuffles left" toast text | `app.js:3347` | Plain "Fresh picks curated" |
| Profile page Pro card "{N} free redesigns left" sub copy | `app.js:1942` | Replaced per D1 decision |
| Welcome explore-card "Unlock Furnish" CTA semantics | `app.js:1593` | Re-positioned as soft browse-and-shop CTA |
| `state.user._pushAsked` is fine; **but** push permission ask is no longer triggered after just any save action — restrict to wishlist saves intent ("alert me when this drops") to align with [PRO] price-alert delivery | `app.js:2997` (`maybeAskForPushPermission`) | Re-scope, not full removal |

---

## 15. Documentation to update post-implementation

- `README.md` — describe new tier model
- `CLAUDE.md` — update "What's NOT done yet (the 7 backend items)" to reflect Stripe addition; update conventions if any change
- `SUPABASE_SETUP.md` — add SQL for `subscriptions`, `affiliate_clicks`, optional `redesign_quota` tables
- **NEW** `MONETIZATION.md` (post-implementation) — public-ish doc describing tier mapping + decision history
- **NEW** Terms of Service / Pricing Page (legal, deferred per "design first")
- **NEW** FTC affiliate disclosure page (was C3 — required regardless of tier model)

---

## 16. Edge cases — to be addressed in STEP 5 after implementation

I'm calling these out now per the spec, but answering them is part of STEP 5.

| Edge case | Current state | Plan |
|---|---|---|
| Existing Pro users (grandfathering) | `state.user.isPro` mocked locally; Supabase `user_settings.is_pro` stored | **Plan: D6=a** — anyone with `is_pro=true` at migration time keeps Pro until cancellation. Add `grandfathered: true` flag for analytics. |
| Mid-flow upgrade resume | Currently: `state._pendingIntent` for signin only; paywall has no resume mechanism | **Plan:** extend `_pendingIntent` to also stash `pendingProAction = { actionId, params }`; after Stripe success → execute |
| Downgrade — Pro-created content (HD exports, batch redesigns) | No downgrade flow exists | **Plan:** all past content (rooms, exports already on disk) stays accessible; just no NEW Pro features |
| Offline / cached state with stale tier | `is_pro` read from `state.user.isPro` (cached) | **Plan:** on every visibility change + boot, if `furnishBackend.mode === 'supabase'`, refresh `user_settings.is_pro`. Pessimistically allow Pro features if cache says yes (server reconciles). |
| Free abuse: clear cookies to bypass | `redesignsUsed` lives in localStorage = trivially clearable | **Plan:** for guests, this is acceptable (funnel top). For signed-in, use Supabase `user_settings.redesigns_used_lifetime` as canonical (server-side-counted) so cookie clear doesn't help |
| Two devices, one account, Pro on one offline | Could double-spend if not Pro? | **Plan:** with Supabase canonical `is_pro`, both devices read the same flag. For redesign quota (if D1=c), Supabase row is the canonical counter |
| User signs in mid-session as guest with rooms | `afterSigninRouting` already preserves guest data | **Plan:** for Pro upgrade specifically — if guest converts and pays, the guest's existing rooms migrate to that user's account |
| First-ever guest's free redesign | Currently allowed (1 free) | **Plan: D1=b** — guest gets exactly 1 free demo. Upgrade prompt after that with conversion attribution `pro_action_attempted{wasGated=true, lifecycle='new'}` |

---

## 17. Implementation order plan (locked when you approve)

Per STEP 3 of the spec:

1. **Layer 1 — Tier infrastructure** (`app.js` helpers, state shape, body-class sync, `gateProAction` middleware)
2. **Layer 2 — Backend gates** (Supabase `user_settings.is_pro` as source of truth, `subscriptions` table scaffold even if Stripe wiring is deferred, ensure all sync ops respect `is_pro`)
3. **Layer 3 — Frontend gates** (call-site updates: every gate site listed in Section 7 either kept, removed, or rewritten)
4. **Layer 4 — Paywall + upgrade UX** (paywall modal copy rewrite, comparison table, mid-flow resume, success state)
5. **Layer 5 — Analytics** (event renames + new event additions per Section 8)
6. **Layer 6 — Copy** (every label per Section 10)
7. **Layer 7 — Legal/billing** (FTC disclosure modal, T&Cs link, pricing page; Stripe wiring deferred but with placeholders)
8. **STEP 4 — Consistency sweep** (re-walk against this audit, output `CHANGES_APPLIED.md`)
9. **STEP 5 — Edge cases** (per Section 16)

---

## 18. Stop point

This file = STEP 1 deliverable. **Awaiting your review.**

Specifically I need:
- D1–D10 decisions in Section 2
- Confirmation or correction of any [FREE]/[PRO]/[SHARED]/[NEW]/[REMOVE] tag you disagree with
- Any feature I missed (this audit covered every file in the repo except `_before-recovery/` and `_my-rebuild-backup/` per CLAUDE.md instructions)

Once approved, I'll execute STEP 3 in the locked order above, and produce `CHANGES_APPLIED.md` at the end.
