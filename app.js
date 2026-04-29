// Furnish — client app logic.
// Single-file state + all screens. Persistence via localStorage.
(() => {
  'use strict';

  // ---------- State ----------
  const DEFAULT_STATE = {
    user: null,            // { name, email, provider }
    settings: { theme: 'light' }, // 'light' | 'dark'
    profiles: [],
    activeProfileId: null,
    rooms: [],
    wishlist: [],          // [itemId]
    priceAlerts: {},       // { itemId: true }
    bookmarkedRooms: [],   // [roomId]
    draft: null,           // in-progress capture
    quiz: null             // { profileId, step, scores:{} }
  };

  const state = load();

  function load() {
    try {
      const raw = localStorage.getItem('furnish.state');
      if (!raw) return structuredClone(DEFAULT_STATE);
      const st = { ...structuredClone(DEFAULT_STATE), ...JSON.parse(raw) };
      // [BUDGET_RESET_PASS] Removed budget migration. Budget is now a
      // transient per-generation slider value, not stored on the profile.
      // Drop any stale fields so the new model doesn't read corrupted state.
      (st.profiles || []).forEach(p => {
        delete p.budget;
        delete p.roomBudgets;
      });
      return st;
    } catch (e) {
      return structuredClone(DEFAULT_STATE);
    }
  }
  let _cloudSyncTimer = null;
  function save() {
    try {
      localStorage.setItem('furnish.state', JSON.stringify(state));
    } catch (e) {
      console.warn('localStorage save failed', e);
    }
    // Debounced background sync to Supabase when configured + signed in.
    if (window.furnishBackend?.mode === 'supabase' && state.user?.id) {
      clearTimeout(_cloudSyncTimer);
      _cloudSyncTimer = setTimeout(() => {
        window.furnishBackend.pushAll(state).catch(err => console.warn('[Furnish] cloud sync failed', err));
      }, 1500);
    }
  }

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ---------- Activation telemetry (Reforge Retention + Engagement) ----------
  // Events flow: signup_started → setup_* → setup_complete → aha_first_results
  //   → aha_quality_signal → habit_second_room
  // Replace console log + state stash with real analytics SDK later.
  const ACTIVATION = {
    SIGNUP_STARTED:  'signup_started',
    SETUP_PHOTO:     'setup_photo_uploaded',
    // [10-Q migration] SETUP_STYLE retired. Style is no longer a single
    // setup moment — the granular onboarding_question_answered events
    // (per question) replaced it.
    SETUP_ROOM_TYPE: 'setup_room_type_selected',
    SETUP_COMPLETE:  'setup_complete',      // Setup moment (3 inputs captured)
    AHA_RESULTS:     'aha_first_results',   // Aha moment (first redesign viewed)
    AHA_QUALITY:     'aha_quality_signal',  // First item tap / save / share
    HABIT_2ND_ROOM:  'habit_second_room'    // Habit moment (2nd room designed)
  };
  // [Batch 6 — Dim 13 REC-13.12] Activation-funnel timing map. Populated
  // by trackEvent for milestone events; read by downstream events that
  // include `tSinceX` properties. Per Reforge *Building Your Altitude
  // Scorecard*: speed-to-value is the strongest predictor of retention,
  // measurable only if elapsed time is captured at fire-time (deriving
  // later requires every prior event in the buffer, which is unreliable
  // given the 200-cap rolling window).
  const TIMING_KEYS = {
    welcome_cta_clicked:  'welcomeCtaClickedAt',
    signup_started:       'signupStartedAt',
    signin_attempted:     'signinAttemptedAt',
    signup_completed:     'signupCompletedAt',
    setup_complete:       'setupCompleteAt',
    aha_first_results:    'ahaFirstResultsAt',
    paywall_shown:        'paywallShownAt'
  };
  function trackEvent(name, props = {}) {
    const evt = { name, ts: Date.now(), ...props };
    state._events = (state._events || []).slice(-200);
    state._events.push(evt);
    // [Batch 6 — Dim 13 REC-13.12] Update activation-funnel timing map.
    if (TIMING_KEYS[name]) {
      state._timing = state._timing || {};
      state._timing[TIMING_KEYS[name]] = evt.ts;
    }
    save();
    // [Batch 6 — Dim 13 REC-13.2] Dual-write to PostHog when present.
    // PostHog SDK is loaded conditionally in index.html guarded by a key
    // injected at backend cutover. Pre-cutover, `window.posthog` is
    // undefined and this branch is a no-op. Per Reforge *Instrumentation
    // Best Practices*: localStorage is debug; PostHog is source-of-truth
    // for cohort + funnel analysis. The contract is one call site
    // (trackEvent), one fan-out — do not scatter posthog.capture.
    try {
      if (typeof window !== 'undefined' && window.posthog && typeof window.posthog.capture === 'function') {
        window.posthog.capture(name, props);
      }
    } catch (_) { /* analytics never breaks user flow */ }
    if (console && console.log) console.log('[track]', name, props);
  }
  // [Batch 6 — Dim 13 REC-13.2] PostHog identity hooks. Call when the
  // user authenticates (signin_completed equivalent). At backend cutover,
  // wire from the auth success handler. Safe no-op pre-cutover.
  function identifyUserForAnalytics(userId, traits = {}) {
    try {
      if (typeof window !== 'undefined' && window.posthog && typeof window.posthog.identify === 'function') {
        window.posthog.identify(userId, traits);
      }
    } catch (_) {}
  }
  function resetAnalyticsIdentity() {
    try {
      if (typeof window !== 'undefined' && window.posthog && typeof window.posthog.reset === 'function') {
        window.posthog.reset();
      }
    } catch (_) {}
  }
  // [Batch 6 — Dim 13 REC-13.8] PostHog people-property setter for sticky
  // user attributes (lifecycle, tier, archetype). Sets locally regardless;
  // mirrors to PostHog when present.
  function setUserProperty(key, value) {
    if (!state.user) state.user = {};
    state.user[key] = value;
    save();
    try {
      if (typeof window !== 'undefined' && window.posthog && window.posthog.people && typeof window.posthog.people.set === 'function') {
        window.posthog.people.set({ [key]: value });
      }
    } catch (_) {}
  }
  window.FurnishIdentify = identifyUserForAnalytics;
  window.FurnishResetIdentity = resetAnalyticsIdentity;
  window.FurnishSetUserProperty = setUserProperty;

  // ============================================================
  // Profile factory + onboarding-answers helpers
  // ============================================================
  // Single source of truth for profile shape under the new 10-Q model.
  // `profile.answers` is the canonical input for the AI prompt builder
  // (deriveScoringWeights + buildAIPrompt). Legacy fields (styles, colors,
  // customColors) are KEPT during the transition window so reads in
  // pickItemsForRoom / room versions don't NPE; they're populated lazily
  // from `answers` via deriveLegacyFromAnswers().
  //
  // Per Hassan's CONFLICT 1: customColors stays as a future Pro feature
  // (see DEFERRED.md). Field preserved on profiles; no UI surfaces it
  // until Pro entitlement ships.
  // ============================================================
  function ONBOARDING_DEFAULTS() {
    // Read defaults from the data-layer config — single source of truth.
    const out = {};
    (window.ONBOARDING_QUESTIONS || []).forEach(q => {
      out[q.id] = q.default;
    });
    return out;
  }
  function createProfile(name, opts = {}) {
    const id = opts.id || ('p_' + Date.now());
    return {
      id,
      name: name || 'My Style',
      avatar: null,
      // [9-Q model — BUDGET_RESET_PASS] Canonical onboarding state. Empty
      // = "no answers yet"; the renderer falls back to ONBOARDING_DEFAULTS()
      // at AI-prompt time. Budget is now transient (set per generation on
      // the capture-screen slider), no longer a profile field.
      answers: {},
      // Legacy fields — populated lazily for catalog-picker compat.
      // customColors preserved for future Pro feature per CONFLICT 1.
      styles: [],
      colors: [],
      customColors: [],
      keepExisting: false,
      seenFinale: false
    };
  }
  // Public surface for any future caller (settings page, debug, tests).
  window.FurnishCreateProfile = createProfile;

  // Read with fallback to defaults — never returns undefined for any of
  // the 10 question IDs. Used everywhere downstream of onboarding.
  function getEffectiveAnswers(profile) {
    const stored = (profile && profile.answers) || {};
    const defaults = ONBOARDING_DEFAULTS();
    const out = {};
    Object.keys(defaults).forEach(qid => {
      out[qid] = (qid in stored && stored[qid] !== undefined && stored[qid] !== null)
        ? stored[qid]
        : defaults[qid];
    });
    return out;
  }

  // Catalog-side mapping: derives the legacy `styles[]` and `colors[]`
  // arrays from the new answers, so pickItemsForRoom keeps working
  // against FURNITURE_DB tags without a full picker rewrite. The mapping
  // is intentionally pluralistic — e.g. vibe='cozy_protected' + materials
  // including 'warm_woods' implies multiple style tags worth scoring.
  // This is NOT used in the AI prompt — the AI prompt reads answers
  // directly. This is ONLY the catalog-picker bridge.
  function deriveStylesFromAnswers(answers) {
    const a = answers || {};
    const styles = new Set();
    // Vibe → loose style affinities
    const vibeMap = {
      calm_grounded:      ['minimalist','japanese-zen','scandinavian'],
      energized_creative: ['eclectic','bohemian','art-deco'],
      cozy_protected:     ['farmhouse','rustic','traditional'],
      elevated_hotel:     ['contemporary','modern','art-deco'],
      inspired_artist:    ['eclectic','bohemian','industrial']
    };
    (vibeMap[a.vibe] || []).forEach(s => styles.add(s));
    // Materials → style affinities
    const matMap = {
      warm_woods:    ['scandinavian','japanese-zen','farmhouse','rustic'],
      soft_fabrics:  ['traditional','transitional','contemporary'],
      metal_glass:   ['industrial','modern','contemporary'],
      stone_ceramic: ['minimalist','rustic','japanese-zen'],
      vintage_patina:['traditional','eclectic','bohemian','mid-century'],
      sleek_modern:  ['modern','contemporary','minimalist']
    };
    (a.materials || []).forEach(m => (matMap[m] || []).forEach(s => styles.add(s)));
    return Array.from(styles);
  }
  function deriveColorsFromAnswers(answers) {
    const a = answers || {};
    // color_appetite → color-mood IDs (window.COLOR_MOODS) for catalog scoring.
    const map = {
      neutrals_only:   ['warm','neutral','whites'],
      mostly_neutral:  ['warm','neutral','sage'],
      confident_color: ['terracotta','jewel','sage'],
      bold:            ['jewel','dark','terracotta']
    };
    return map[a.color_appetite] || ['warm','neutral'];
  }

  // [Legacy migration shim] If a profile predates the 10-Q model and has
  // styles/colors but no answers, backfill the answers field with the
  // closest-matching defaults so the AI prompt + tutorial don't see an
  // empty answers object. Idempotent.
  function migrateLegacyProfileToAnswers(profile) {
    if (!profile) return;
    if (profile.answers && Object.keys(profile.answers).length > 0) return;
    profile.answers = ONBOARDING_DEFAULTS();
    // Light heuristic: if legacy styles include 'minimalist'/'japanese-zen',
    // bias vibe to calm_grounded; if 'bohemian'/'eclectic', bias to inspired_artist.
    const legacyStyles = new Set(profile.styles || []);
    if (legacyStyles.has('minimalist') || legacyStyles.has('japanese-zen')) {
      profile.answers.vibe = 'calm_grounded';
    } else if (legacyStyles.has('bohemian') || legacyStyles.has('eclectic')) {
      profile.answers.vibe = 'inspired_artist';
    } else if (legacyStyles.has('industrial')) {
      profile.answers.vibe = 'energized_creative';
    } else if (legacyStyles.has('mid-century') || legacyStyles.has('art-deco')) {
      profile.answers.vibe = 'elevated_hotel';
    } else if (legacyStyles.has('farmhouse') || legacyStyles.has('rustic')) {
      profile.answers.vibe = 'cozy_protected';
    }
  }
  // Run migration on every profile at boot. One-time-per-boot; idempotent.
  function migrateAllProfiles() {
    (state.profiles || []).forEach(migrateLegacyProfileToAnswers);
  }

  // ---------- Lifecycle state machine (Reforge Retention + Engagement) ----------
  // Per Reforge "Defining Engagement States" + ICED Theory (BONUS Module 9):
  // every visit refreshes lastVisitedAt; engagement state is computed from
  // days-since-last-visit + days-since-last-design. Furnish is in the
  // "Forgettable Zone" so dormancy thresholds are tighter than a daily product.
  const LIFECYCLE = {
    NEW:       'new',         // never opened before
    ACTIVE:    'active',      // visited within 14 days
    AT_RISK:   'at_risk',     // 14–30 days since last visit
    DORMANT:   'dormant',     // 30–90 days since last visit
    CHURNED:   'churned'      // 90+ days since last visit (Reforge: defined per natural frequency)
  };
  function daysSince(ts) {
    if (!ts) return Infinity;
    return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
  }
  function getLifecycleState() {
    if (!state.user) return LIFECYCLE.NEW;
    // Lifecycle measures the GAP between the last session and THIS one.
    // touchLastVisit() preserves prior lastVisitedAt as previousVisitAt.
    // First-ever session has no previousVisitAt → NEW.
    const prev = state.user.previousVisitAt;
    if (!prev) {
      return state.user.signedInAt ? LIFECYCLE.ACTIVE : LIFECYCLE.NEW;
    }
    const d = daysSince(prev);
    if (d < 14)  return LIFECYCLE.ACTIVE;
    if (d < 30)  return LIFECYCLE.AT_RISK;
    if (d < 90)  return LIFECYCLE.DORMANT;
    return LIFECYCLE.CHURNED;
  }
  function daysSinceLastDesign() {
    const rooms = (state.rooms || []).filter(r => r.profileId === state.activeProfileId);
    if (!rooms.length) return Infinity;
    const last = Math.max(...rooms.map(r => r.createdAt || 0));
    return daysSince(last);
  }
  // Touch lastVisitedAt on every boot. Fires only once per session to avoid
  // resetting the dormancy clock on every showScreen call.
  let _visitTouched = false;
  function touchLastVisit() {
    if (_visitTouched) return;
    _visitTouched = true;
    if (!state.user) state.user = {};
    const prev = state.user.lastVisitedAt;
    state.user.previousVisitAt = prev || null;  // for "welcome back, it's been X days"
    state.user.lastVisitedAt = Date.now();
    state.user.visitCount = (state.user.visitCount || 0) + 1;
    // [Batch 6 — Dim 13 REC-13.8] Sticky lifecycle user property +
    // dormancy_state_changed transition event. Per Reforge *Instrumentation
    // Best Practices*: user properties enable actionable cohort analysis,
    // and lifecycle bucket as a derived value loses historical state. Set
    // on every session; emit transition only when bucket flips.
    const currentLifecycle = getLifecycleState();
    const cachedLifecycle = state.user.cachedLifecycle || null;
    save();
    trackEvent('session_started', {
      lifecycle: currentLifecycle,
      daysSincePrevVisit: prev ? daysSince(prev) : null,
      visitCount: state.user.visitCount
    });
    if (cachedLifecycle && cachedLifecycle !== currentLifecycle) {
      trackEvent('dormancy_state_changed', {
        from: cachedLifecycle,
        to: currentLifecycle,
        daysSincePrevVisit: prev ? daysSince(prev) : null,
        daysSinceLastDesign: daysSinceLastDesign()
      });
    }
    setUserProperty('cachedLifecycle', currentLifecycle);
    setUserProperty('tier', state.user.isPro ? 'pro' : 'free');
  }

  // Three states for the reviews ticker:
  //   - LARGE  on onboarding screens (eye-catching social proof)
  //   - COMPACT on home/wishlist (subtle background)
  //   - HIDDEN  on capture/analyzing/results/templates (out of the way for design work)
  const ONBOARDING_SCREENS = new Set([
    'welcome', 'signin', 'profile-select', 'quiz-intro', 'quiz'
  ]);
  const DESIGN_SCREENS = new Set([
    'preferences', 'capture', 'analyzing', 'results', 'templates'
  ]);
  // Bottom-nav surfaces (Home / Saved / Preferences / Profile).
  // [Hassan's call] Preferences promoted to a bottom-nav surface so users
  // can refine their style any time without going through the quiz flow.
  const MAIN_SCREENS = new Set(['home', 'saved', 'preferences', 'profile']);

  // [Batch 6 — Dim 13 REC-13.3] Track previous screen for the screen_viewed
  // analytics event so navigation paths can be cohort-analyzed.
  let _previousScreen = null;
  let _screenEnteredAt = null;
  function showScreen(name) {
    // [Reset Dialog] Edge-case per spec: if user navigates away mid-dialog
    // (browser back, deep link, etc.), close the dialog cleanly so no
    // stale reset state lingers. closeResetDialog is a no-op when the
    // dialog isn't open.
    if (typeof _resetDialogState !== 'undefined' && _resetDialogState) {
      closeResetDialog('navigation');
    }
    const prev = _previousScreen;
    $$('.screen').forEach(el => el.classList.toggle('active', el.dataset.screen === name));
    window.scrollTo({ top: 0 });
    let mode;
    if (DESIGN_SCREENS.has(name))         mode = 'hidden';
    else if (ONBOARDING_SCREENS.has(name)) mode = 'large';
    else                                   mode = 'compact';
    document.documentElement.setAttribute('data-reviews', mode);
    const bar = document.getElementById('reviewsBar');
    if (bar) {
      bar.classList.toggle('compact', mode === 'compact');
      bar.classList.toggle('hidden',  mode === 'hidden');
    }
    // Bottom nav visibility + active tab
    const showNav = MAIN_SCREENS.has(name);
    document.documentElement.setAttribute('data-nav', showNav ? 'show' : 'hide');
    document.querySelectorAll('.bn-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === name);
    });
    // [Batch 6 — Dim 13 REC-13.3] screen_viewed event (intent for the
    // navigation step). Per Reforge *Building A Structured Event
    // Dictionary*: screen views are the lowest-cost cohort filter — every
    // funnel step's denominator can be expressed as "users who viewed
    // screen X." prevDwellMs measures engagement on the leaving screen.
    const now = Date.now();
    const prevDwellMs = (_previousScreen && _screenEnteredAt) ? (now - _screenEnteredAt) : null;
    trackEvent('screen_viewed', {
      screenName: name,
      previousScreen: prev,
      prevDwellMs,
      lifecycle: typeof getLifecycleState === 'function' ? getLifecycleState() : null
    });
    _previousScreen = name;
    _screenEnteredAt = now;
  }

  // [Batch 6 — Dim 13 REC-13.3] Failure-event-aware toast wrapper.
  // Pure copy that's negative + actionable triggers `error_shown` (anti-
  // event for analytics drop-step diagnosis). Heuristic: messages
  // containing "fail", "couldn't", "try again", "didn't" → failure.
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => t.classList.remove('show'), 2200);
    try {
      const negative = /(fail|couldn't|can't|try again|didn't|over (\d+)mb|isn't|too large|invalid|error|wrong|wasn't able)/i.test(String(msg));
      if (negative) {
        trackEvent('error_shown', {
          message: String(msg).slice(0, 120),
          surface: typeof _previousScreen === 'string' ? _previousScreen : null
        });
      }
    } catch (_) {}
  }

  function titleRoom(id) { return window.ROOM_TYPES.find(t => t.id === id)?.label || id; }
  function styleLabel(id) { return window.STYLES.find(s => s.id === id)?.label || id; }
  function sourceLabel(id) {
    const map = { ikea:'IKEA', amazon:'Amazon', 'west-elm':'West Elm', wayfair:'Wayfair', etsy:'Etsy', 'rugs-usa':'Rugs USA' };
    return map[id] || id;
  }

  // Per-profile brown shade — same hue family, four steps from light to deep.
  const AVATAR_SHADES = [
    ['#E8C193', '#A57E4F'],
    ['#C49A60', '#8B6F47'],
    ['#A07B4F', '#6B5235'],
    ['#785838', '#4A3320']
  ];
  function avatarGradient(idx) {
    const [a, b] = AVATAR_SHADES[((idx % AVATAR_SHADES.length) + AVATAR_SHADES.length) % AVATAR_SHADES.length];
    return `linear-gradient(135deg, ${a}, ${b})`;
  }

  function getActiveProfile() { return state.profiles.find(p => p.id === state.activeProfileId) || null; }
  function getProfileIdx(id) { return state.profiles.findIndex(p => p.id === id); }
  function ensureActiveProfile() {
    if (!getActiveProfile() && state.profiles.length) {
      state.activeProfileId = state.profiles[0].id;
      save();
    }
  }

  // ---------- Navigation ----------
  document.addEventListener('click', e => {
    const target = e.target.closest('[data-go]');
    if (!target) return;
    const dest = target.dataset.go;
    if (dest === 'home') ensureActiveProfile();
    // [Hassan's call] Preferences is now a bottom-nav tab. Reroute through
    // openPreferences() so the answers editor + name field + profile gauge
    // load against the active profile instead of showing a stale screen.
    // ensureGuestProfile guarantees a profile exists for users who deep-link
    // here without going through welcome → continue first.
    if (dest === 'preferences') {
      if (!state.user) {
        state.user = { name: 'Guest', email: '', provider: 'guest', signedInAt: Date.now() };
      }
      ensureGuestProfile();
      const pid = state.activeProfileId;
      if (pid && typeof openPreferences === 'function') {
        openPreferences(pid);  // calls showScreen('preferences') internally
        return;
      }
    }
    showScreen(dest);
    if (dest === 'profile-select') renderProfiles();
    if (dest === 'home') renderHome();
    if (dest === 'capture') prepareCapture();
    if (dest === 'templates') renderTemplates();
    if (dest === 'signin') prepareSignin();
    if (dest === 'saved')   renderSaved();
    if (dest === 'profile') renderProfilePage();
    if (dest === 'this-week') renderThisWeekPage();
    if (dest === 'styles-index') trackEvent('styles_index_visited', { source: 'this_week_browse_all' });
    if (dest === 'home-gallery') renderHomeGallery();
  });

  // [Your Home progress] Stub gallery render — lists every designed room
  // with a thumb + label. Tap → openRoom. Full gallery layout deferred.
  function renderHomeGallery() {
    const list = document.getElementById('homeGalleryList');
    if (!list) return;
    list.innerHTML = '';
    const ROOM_LABELS = (window.ROOM_TYPES || []).reduce((acc, r) => { acc[r.id] = r.label; return acc; }, {});
    const profile = getActiveProfile();
    const myRooms = (state.rooms || []).filter(r => !profile?.id || r.profileId === profile.id);
    if (!myRooms.length) {
      list.innerHTML = '<p class="muted small" style="padding:14px;text-align:center">No rooms yet — start designing.</p>';
      return;
    }
    // Group by type, take most recent of each
    const byType = {};
    myRooms.forEach(r => {
      if (!byType[r.type] || (r.createdAt || 0) > (byType[r.type].createdAt || 0)) {
        byType[r.type] = r;
      }
    });
    HOME_ROOM_ORDER.forEach(type => {
      const r = byType[type];
      if (!r) return;
      const card = document.createElement('button');
      card.className = 'home-gallery-card';
      card.type = 'button';
      const total = (r.items || []).reduce((s, i) => s + (i.price || 0), 0);
      card.innerHTML = `
        <div class="hgc-photo" ${r.photo ? `style="background-image:url('${r.photo}')"` : ''}></div>
        <div class="hgc-body">
          <div class="hgc-label">${ROOM_LABELS[type] || type}</div>
          <div class="hgc-meta muted small">${(r.items || []).length} pieces · $${total.toLocaleString()}</div>
        </div>
      `;
      card.addEventListener('click', () => openRoom(r.id));
      list.appendChild(card);
    });
  }

  // Welcome "Get Started" → skip signin on first run (Reforge: setup friction
  // before aha kills retention). Guest profile auto-created, quiz comes first.
  // Signin is requested later, gated at value moments (save/share/more rooms).
  document.getElementById('welcomeStartBtn').addEventListener('click', () => {
    trackEvent(ACTIVATION.SIGNUP_STARTED);
    if (state.user && state.user.provider !== 'guest' && state.profiles.length) {
      // Returning signed-in user with profiles — send to picker.
      showScreen('profile-select');
      renderProfiles();
      return;
    }
    // [Batch 3 — Dim 04 R3] Returning guest with progress — skip the
    // welcome onboarding flow, route to home with resume hero. Per
    // Reforge ICED Theory "Expanding Touchpoints": returning users must
    // get a different experience from cold-start, or product fades from
    // memory. A guest with a saved room or in-progress draft has already
    // invested — don't punish them by re-onboarding.
    if (typeof isReturningGuestWithProgress === 'function' && isReturningGuestWithProgress()) {
      trackEvent('return_session_resumed', {
        rooms: state.rooms?.length || 0,
        hasDraft: !!(state.draft && state.draft.photo)
      });
      showScreen('home');
      return;
    }
    if (!state.user) {
      state.user = { name: 'Guest', email: '', provider: 'guest', signedInAt: Date.now() };
    }
    ensureGuestProfile();
    // [Hassan's call] New users must go through the quiz — they can't skip
    // onboarding. Existing returning guests with progress are caught above
    // by isReturningGuestWithProgress() and routed straight to home.
    openQuizIntro(state.activeProfileId);
  });

  // First-run guest profile — no signin required to reach aha.
  function ensureGuestProfile() {
    if (!state.profiles.length) {
      const p = createProfile('My Style');
      state.profiles.push(p);
      state.activeProfileId = p.id;
      save();
    } else if (!state.activeProfileId) {
      state.activeProfileId = state.profiles[0].id;
      save();
    }
  }

  // Gate premium/persistence actions behind signin — but ONLY after aha.
  // Saves pending-intent context so we can come back to the exact action
  // they tried to take, not dump them on profile-select. (Fixes the
  // "sign in → pick profile → re-do quiz → re-take photo" dead-end.)
  function requireSignin(intent) {
    if (state.user && state.user.provider !== 'guest') return true;
    state._pendingIntent = {
      intent,
      roomId: currentRoomId,
      fromScreen: document.querySelector('.screen.active')?.dataset?.screen
    };
    save();
    prepareSignin();
    const copyMap = {
      save:   'Sign in to save this room and come back to it.',
      share:  'Sign in to share your redesign.',
      second: 'Sign in to design more rooms across devices.',
      pro:    'Sign in to upgrade to Furnish Pro.'
    };
    $('#signinSubtitle').textContent = copyMap[intent] || 'Sign in to continue.';
    showScreen('signin');
    return false;
  }

  // Single post-signin router. Replaces every previous
  // `showScreen('profile-select'); renderProfiles();` tail in signin handlers.
  // Respects pending intent + existing guest-profile history so users aren't
  // yanked back to a profile picker they don't need.
  function afterSigninRouting() {
    // [Auth flow Fix 2] Read pending intent but DO NOT clear yet. The clear
    // moves to inside each successful branch — if openRoom (Fix 3) fails to
    // find the room and surfaces the recovery toast, we want the intent to
    // survive so a retry can reference it. Falling-through to the home/
    // capture/profile-select branches at the bottom counts as a non-reveal
    // path; the clear there is moved to right before each branch fires.
    const pending = state._pendingIntent;
    syncFreeModeClass();

    // [Model A — D7] Reveal gate: AI generation already completed for a guest.
    // Account just created → unlock the room and route straight to results.
    if (pending && pending.intent === 'reveal' && pending.roomId) {
      ensureActiveProfile();
      trackEvent('reveal_gate_unlocked', { roomId: pending.roomId, source: pending.fromScreen });
      const room = state.rooms.find(r => r.id === pending.roomId);
      if (room) {
        // Reveal succeeded — clear intent only AFTER the room is found.
        // openRoom itself will showScreen('results') and complete the route.
        state._pendingIntent = null;
        save();
        openRoom(pending.roomId);
      } else {
        // Reveal-target room is missing (e.g. pullAll wiped it before Fix 1
        // landed, or the user manually mutated state). Hand off to openRoom
        // anyway — Fix 3's reveal-miss handler in openRoom toasts + holds
        // the user on signin and intentionally leaves _pendingIntent set so
        // a retry has the breadcrumb. Do NOT save() here — that would
        // persist the open intent unnecessarily; openRoom's miss handler
        // does its own logging.
        openRoom(pending.roomId);
      }
      return;
    }

    // Feedback intent (legacy from prior pass) — kept for any in-flight states
    // but not produced by Model A flows. Routes to home.
    if (pending && pending.intent === 'feedback') {
      state._pendingIntent = null;
      state._showExploreWelcome = true;
      save();
      ensureActiveProfile();
      showScreen('home');
      renderHome();
      return;
    }

    // Save/share/second-room → back to that room and auto-execute the action.
    if (pending && pending.roomId) {
      const room = state.rooms.find(r => r.id === pending.roomId);
      if (room) {
        state._pendingIntent = null;
        save();
        openRoom(room.id);
        setTimeout(() => {
          if (pending.intent === 'save')   $('#bookmarkRoomBtn')?.click();
          if (pending.intent === 'share')  $('#shareRoomBtn')?.click();
          if (pending.intent === 'second') $('[data-go="capture"]')?.click();
          // 'pro' — room is already open; paywall state handled elsewhere.
        }, 250);
        return;
      }
    }
    // No matching branch consumed the pending intent. Drop it so the
    // fallthrough below runs cleanly. (If pending was null to begin with,
    // this is a no-op.)
    if (state._pendingIntent) {
      state._pendingIntent = null;
    }
    save();

    // No pending intent. If the user already has a profile + room history
    // (typical guest → signed-in upgrade), send them home with Explore.
    const hasHistory = state.profiles?.length > 0 && state.rooms?.length > 0;
    if (hasHistory) {
      state._showExploreWelcome = true;
      save();
      ensureActiveProfile();
      showScreen('home');
      renderHome();
    } else if (state.profiles?.length > 0) {
      ensureActiveProfile();
      showScreen('capture');
      prepareCapture();
    } else {
      showScreen('profile-select');
      renderProfiles();
    }
  }

  // ---------- Sign in ----------
  let signinMode = 'signin'; // or 'signup'

  function prepareSignin() {
    // [Model A — D7] If a reveal-gate intent is pending, force the screen
    // into signup mode and rewrite copy to "Your redesign is ready / create
    // an account to view it". Otherwise standard signin.
    const pending = state._pendingIntent;
    if (pending && pending.intent === 'reveal') {
      signinMode = 'signup';
    } else {
      signinMode = 'signin';
    }
    applySigninMode();
    $('#signinEmail').value = '';
    $('#signinPassword').value = '';
    $('#signinName').value = '';
  }

  function applySigninMode() {
    const isSignup = signinMode === 'signup';
    const isRevealGate = state._pendingIntent?.intent === 'reveal';
    const hero = $('#signinRevealHero');

    if (isRevealGate) {
      // [D7 reveal-gate copy — Reforge curiosity gap + endowment + loss aversion]
      // Topbar becomes a step marker ("Almost there.") so the screen feels like
      // a guided continuation, not a new admin destination.
      $('#signinTitle').textContent = 'Almost there.';
      // Subhead leads with REWARD ("unlock"), trails with reassurance.
      $('#signinSubtitle').textContent = 'Unlock it in 10 seconds — free, no card needed.';
      // Submit button gets a directional arrow — eye expects forward motion.
      $('#signinSubmit').textContent = 'Reveal My Redesign →';
      $('#signinToggleText').textContent = 'Already have an account?';
      $('#signinToggleBtn').textContent = 'Sign in instead';
      $('#nameField').style.display = '';
      $('#signinName').required = true;
      $('#signinPassword').setAttribute('autocomplete', 'new-password');

      // Populate the reveal hero with live data from the just-built room.
      // Falls back gracefully if the room can't be found (shouldn't happen
      // — _pendingIntent.roomId is set right before showing this screen).
      if (hero) {
        hero.hidden = false;
        const room = (state.rooms || []).find(r => r.id === state._pendingIntent.roomId);
        if (room) {
          const items = room.items || [];
          const itemCount = items.length;
          // [Reframe] Item count stays dynamic — it's a curiosity anchor.
          // Dollar total intentionally NOT rendered pre-signup; see HTML
          // comment in #signinRevealHero for the framework rationale.
          $('#revealPieceCount').textContent = itemCount || '—';
          const bg = $('#srhBg');
          if (bg && room.photo) {
            // Heavy blur + darken applied via CSS — the bg div just receives
            // the source photo URL. This is the "frosted curtain" effect.
            bg.style.backgroundImage = `url("${room.photo}")`;
          } else if (bg) {
            bg.style.backgroundImage = '';
          }
          // [Batch 5 Part 2 — Dim 02 D02-2] Guest 24h soft countdown.
          // Real friction: regenerating costs compute and the result
          // differs slightly. Ethics-clean — signed-in users never see
          // this; their redesigns persist forever.
          startGuestRevealCountdown(room);
        }
      }
      return;
    }

    // Non-reveal-gate: restore the standard signin/signup screen and hide the hero.
    if (hero) {
      hero.hidden = true;
      const bg = $('#srhBg');
      if (bg) bg.style.backgroundImage = '';
    }
    // [Batch 5 Part 2 — Dim 02 D02-2] Stop the countdown when not on
    // reveal-gate. The interval is restarted on next reveal-gate entry.
    stopGuestRevealCountdown();
    $('#signinTitle').textContent = isSignup ? 'Create account' : 'Sign in';
    $('#signinSubtitle').textContent = isSignup
      ? 'Join Furnish to save your profiles and redesigns across devices.'
      : 'Welcome back. Sign in to sync your profiles and saved rooms.';
    $('#signinSubmit').textContent = isSignup ? 'Create account' : 'Sign in';
    $('#signinToggleText').textContent = isSignup ? 'Already have an account?' : 'New to Furnish?';
    $('#signinToggleBtn').textContent = isSignup ? 'Sign in instead' : 'Create an account';
    $('#nameField').style.display = isSignup ? '' : 'none';
    $('#signinName').required = isSignup;
    $('#signinPassword').setAttribute('autocomplete', isSignup ? 'new-password' : 'current-password');
  }

  $('#signinToggleBtn').addEventListener('click', () => {
    signinMode = signinMode === 'signin' ? 'signup' : 'signin';
    applySigninMode();
  });

  // [Batch 5 Part 2 — Dim 02 D02-2] Guest 24h reveal-expiry countdown.
  // Computes from `room.timestamp + 24h`. Updates every minute. Hides the
  // pill once expired (the existing reveal CTA already drives signup; no
  // need for a separate "Reanalyze" CTA — keeps surface area small).
  // Ethics-clean per Reforge "What we did NOT recommend": signed-in users
  // never see the pill (only fires inside the reveal-gate branch which is
  // by definition guest-only).
  let _guestCountdownTimer = null;
  function startGuestRevealCountdown(room) {
    stopGuestRevealCountdown();
    const pill = document.getElementById('revealExpiryPill');
    const text = document.getElementById('revealExpiryText');
    if (!pill || !text || !room) return;
    const start = (typeof room.timestamp === 'number') ? room.timestamp : Date.now();
    const expiresAt = start + 24 * 60 * 60 * 1000;
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      const msLeft = expiresAt - Date.now();
      if (msLeft <= 0) {
        text.textContent = 'Sign in now to save this redesign';
        pill.classList.add('expired');
        if (_guestCountdownTimer) { clearInterval(_guestCountdownTimer); _guestCountdownTimer = null; }
        return;
      }
      const hours = Math.floor(msLeft / (60 * 60 * 1000));
      const minutes = Math.floor((msLeft % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((msLeft % (60 * 1000)) / 1000);
      // [Polish] Tick every SECOND with seconds shown so the countdown
      // visibly moves. The previous 60s tick made the timer look frozen
      // because hours+minutes only changes every 60s. Seconds give the
      // user immediate visual feedback that this is a real countdown.
      text.textContent = hours >= 1
        ? `${hours}h ${pad(minutes)}m ${pad(seconds)}s to save this forever`
        : minutes >= 1
          ? `${minutes}m ${pad(seconds)}s to save this forever`
          : `${seconds}s to save this forever`;
    };
    pill.hidden = false;
    pill.classList.remove('expired');
    tick();
    _guestCountdownTimer = setInterval(tick, 1000);
  }
  function stopGuestRevealCountdown() {
    if (_guestCountdownTimer) {
      clearInterval(_guestCountdownTimer);
      _guestCountdownTimer = null;
    }
    const pill = document.getElementById('revealExpiryPill');
    if (pill) { pill.hidden = true; pill.classList.remove('expired'); }
  }

  // ==========================================================
  // [ToS consent block] mountAuthConsentGate()
  // ==========================================================
  // Wires the .auth-consent-block on the signin screen so:
  //   - All 5 auth buttons get disabled + .auth-blocked while ToS is
  //     unchecked (visibly disabled, not just functionally).
  //   - #authConsentHelper microcopy appears below the form when blocked.
  //   - Real <input type="checkbox"> elements remain accessible to screen
  //     readers and keyboard nav.
  //   - Consent-link clicks (Terms / Privacy) route to their stub screens
  //     without toggling the wrapping label's checkbox.
  //   - Analytics events fire on every state change and on any blocked-
  //     submit attempt (signup_blocked_no_consent).
  // Per AUDIT_TOS_CONSENT.md decision policy.
  function mountAuthConsentGate() {
    const tosBox = document.getElementById('tosConsent');
    const mktBox = document.getElementById('marketingConsent');
    const helper = document.getElementById('authConsentHelper');
    if (!tosBox || !mktBox) return;

    // Selector for every gated auth control on the signin screen.
    const gatedSelector = [
      '[data-screen="signin"] .signin-social-btn',
      '[data-screen="signin"] #signinSubmit',
      '[data-screen="signin"] #signinSoftForm button[type="submit"]'
    ].join(', ');

    function refreshGate() {
      const ok = !!tosBox.checked;
      document.querySelectorAll(gatedSelector).forEach(btn => {
        btn.classList.toggle('auth-blocked', !ok);
        if (ok) {
          btn.removeAttribute('aria-disabled');
        } else {
          btn.setAttribute('aria-disabled', 'true');
        }
        // Note: we deliberately don't set `disabled` on the form-submit
        // buttons — that would prevent the click handler from firing
        // and we'd lose the signup_blocked_no_consent analytics. The
        // .auth-blocked CSS class handles the visible disabled look,
        // and each handler short-circuits when !tosBox.checked.
      });
      if (helper) helper.hidden = ok;
    }

    tosBox.addEventListener('change', () => {
      trackEvent(tosBox.checked ? 'tos_consent_checked' : 'tos_consent_unchecked');
      refreshGate();
    });
    mktBox.addEventListener('change', () => {
      trackEvent(mktBox.checked ? 'marketing_consent_checked' : 'marketing_consent_unchecked');
    });

    // Consent-link clicks (Terms / Privacy) — route to stub screens
    // WITHOUT toggling the wrapping label's checkbox.
    document.querySelectorAll('.auth-consent-block .consent-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dest = link.dataset.go;
        if (!dest) return;
        // Remember which screen we came from so the back button works.
        state._tosBackTo = 'signin';
        save();
        showScreen(dest);
      });
    });

    refreshGate();
  }

  // Auth-gate guard called from each auth submit handler.
  // Returns true if blocked (handler should short-circuit). Logs the
  // signup_blocked_no_consent analytics event with the source path.
  function authConsentBlocked(source) {
    const tosBox = document.getElementById('tosConsent');
    if (!tosBox || tosBox.checked) return false;
    trackEvent('signup_blocked_no_consent', { source });
    // Visual nudge — flash the helper if visible, else briefly highlight
    // the consent block so the user sees what's blocking them.
    const helper = document.getElementById('authConsentHelper');
    const block = document.querySelector('.auth-consent-block');
    if (helper) {
      helper.hidden = false;
      helper.style.color = 'var(--danger, #b54b3a)';
      setTimeout(() => { helper.style.color = ''; }, 1400);
    }
    if (block) {
      block.style.transition = 'box-shadow 200ms ease, transform 200ms ease';
      block.style.boxShadow = '0 0 0 2px rgba(181, 75, 58, 0.45)';
      setTimeout(() => { block.style.boxShadow = ''; }, 1400);
    }
    toast('Agree to terms above to continue');
    return true;
  }

  // Capture current consent state for persistence on submit.
  function readConsentInputs() {
    const tosBox = document.getElementById('tosConsent');
    const mktBox = document.getElementById('marketingConsent');
    return {
      tosAccepted: !!(tosBox && tosBox.checked),
      marketingOptIn: !!(mktBox && mktBox.checked)
    };
  }

  // Mount the gate after DOM is ready (the IIFE runs after DOMContentLoaded
  // because `<script>` is at end of body, so the element is present).
  mountAuthConsentGate();

  $('#signinForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#signinEmail').value.trim();
    const password = $('#signinPassword').value;
    const name = $('#signinName').value.trim();
    // [ToS consent block] Gate before any auth network call.
    if (authConsentBlocked('email_password_form')) return;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { toast('Enter a valid email'); return; }
    if (!password || password.length < 6) { toast('Password must be 6+ characters'); return; }
    if (signinMode === 'signup' && !name) { toast('Enter your name'); return; }
    const _consent = readConsentInputs();

    const submitBtn = $('#signinSubmit');
    submitBtn.disabled = true;
    submitBtn.textContent = signinMode === 'signup' ? 'Creating account…' : 'Signing in…';

    if (window.furnishBackend?.mode === 'supabase') {
      const { auth } = window.furnishBackend;
      const result = signinMode === 'signup'
        ? await auth.signUp(email, password, name)
        : await auth.signIn(email, password);

      submitBtn.disabled = false;
      submitBtn.textContent = signinMode === 'signup' ? 'Create account' : 'Sign in';

      if (result.error) {
        // [Dim 09 Section B.4 — error states specify constraint + recovery.
        //  Server's error.message preserved if available; fallback rewritten
        //  per VOICE.md (errors must explain + offer recovery).]
        // [Batch 6 — Dim 13 REC-13.3] signup_failed / signin_failed
        // failure events. Per Reforge: failure events answer "what
        // prevented success." Provider + reason segmentation is critical
        // for diagnosing auth-method drop rates.
        const reasonText = String(result.error.message || '').toLowerCase();
        const reason = reasonText.includes('exists') ? 'email_exists'
                     : reasonText.includes('password') ? 'credential'
                     : reasonText.includes('network') ? 'network'
                     : 'other';
        trackEvent(signinMode === 'signup' ? 'signup_failed' : 'signin_failed', {
          provider: 'email', reason, message: String(result.error.message || '').slice(0, 200)
        });
        toast(result.error.message || "That email and password don't match. Try again or reset your password.");
        return;
      }
      if (!result.user) {
        trackEvent('signup_email_confirmation_required', { provider: 'email' });
        toast('Check your email to confirm your account');
        return;
      }

      state.user = {
        // preserve guest-era counters so gating stays correct post-signin
        generationsUsed: state.user?.generationsUsed || state.user?.redesignsUsed || 0,
        redesignsUsed:   state.user?.redesignsUsed || state.user?.generationsUsed || 0,  // legacy mirror
        isPro: !!state.user?.isPro,
        // [Tutorial fire-once contract] Preserve so guest→signed-in conversion
        // doesn't re-fire the tutorial. localStorage-only until we sync to
        // user_settings.first_redesign_tutorial_seen on the backend.
        firstRedesignTutorialSeen: !!state.user?.firstRedesignTutorialSeen,
        id: result.user.id,
        email: result.user.email,
        name: result.user.user_metadata?.name || name || email.split('@')[0],
        provider: 'email',
        signedInAt: Date.now()
      };
      // [ToS consent block] Persist tos + marketing consent on success.
      recordConsent(_consent);
      save();
      try { await window.furnishBackend.pullAll(state); save(); } catch (err) { console.warn('[Furnish] pull failed', err); }
      // [Batch 6 — Dim 13 REC-13.2] PostHog identify on auth success.
      // Safe no-op pre-PostHog-cutover. Per Reforge *Instrumentation Best
      // Practices*: every authenticated session must identify so cohorts
      // are queryable. ID is the Supabase auth UUID (NOT email — PII).
      identifyUserForAnalytics(state.user.id || state.user.email, {
        provider: state.user.provider,
        tier: state.user.isPro ? 'pro' : 'free'
      });
      trackEvent('signin_completed', {
        provider: state.user.provider,
        durationMs: Date.now() - (state._timing?.signinAttemptedAt || Date.now())
      });
      // [Dim 09 D10 — exclamation removed per Warmth-6 attitudinal range.]
      toast(signinMode === 'signup' ? `Welcome, ${state.user.name}.` : 'Signed in.');
      afterSigninRouting();
      return;
    }

    // Local-only fallback (no Supabase configured)
    state.user = {
      generationsUsed: state.user?.generationsUsed || state.user?.redesignsUsed || 0,
      redesignsUsed:   state.user?.redesignsUsed || state.user?.generationsUsed || 0,
      isPro: !!state.user?.isPro,
      firstRedesignTutorialSeen: !!state.user?.firstRedesignTutorialSeen,
      name: name || email.split('@')[0],
      email,
      provider: 'email',
      signedInAt: Date.now()
    };
    // [ToS consent block] Persist tos + marketing consent on local-fallback success.
    recordConsent(_consent);
    save();
    submitBtn.disabled = false;
    submitBtn.textContent = signinMode === 'signup' ? 'Create account' : 'Sign in';
    // [Batch 6 — Dim 13 REC-13.2] PostHog identify on local-fallback signin.
    identifyUserForAnalytics(state.user.email, {
      provider: 'email',
      tier: state.user.isPro ? 'pro' : 'free'
    });
    trackEvent('signin_completed', {
      provider: 'email',
      durationMs: Date.now() - (state._timing?.signinAttemptedAt || Date.now())
    });
    // [Dim 09 D10 — exclamation removed per Warmth-6 attitudinal range.]
    toast(signinMode === 'signup' ? `Welcome, ${state.user.name}.` : 'Signed in.');
    afterSigninRouting();
  });

  $$('.signin-social-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const provider = btn.dataset.provider;
      const label = provider === 'google' ? 'Google' : 'Apple';

      // [ToS consent block] Gate every OAuth/social path. Fires
      // signup_blocked_no_consent + flashes the consent block + toasts
      // the helper microcopy.
      if (authConsentBlocked('social_' + (provider || 'unknown'))) return;
      const _socialConsent = readConsentInputs();

      if (provider === 'apple') {
        toast('Apple sign-in coming soon');
        return;
      }
      if (provider === 'amazon') {
        // Login with Amazon would integrate via Supabase OAuth (Amazon provider)
        // once enabled in the dashboard. For now, fall through to mock.
        if (window.furnishBackend?.mode === 'supabase') {
          toast('Enable Amazon provider in Supabase dashboard to wire this up');
          return;
        }
        state.user = {
          generationsUsed: state.user?.generationsUsed || state.user?.redesignsUsed || 0,
          redesignsUsed:   state.user?.redesignsUsed || state.user?.generationsUsed || 0,
          isPro: !!state.user?.isPro,
          firstRedesignTutorialSeen: !!state.user?.firstRedesignTutorialSeen,
          name: 'Amazon User',
          email: 'amazon.user@furnish.app',
          provider: 'amazon',
          signedInAt: Date.now()
        };
        // [ToS consent block] Persist on mock-Amazon success.
        recordConsent(_socialConsent);
        save();
        toast('Signed in with Amazon');
        afterSigninRouting();
        return;
      }

      if (window.furnishBackend?.mode === 'supabase' && provider === 'google') {
        // [ToS consent block] Stash consent state before the OAuth
        // redirect so the post-redirect session-restoration handler can
        // call recordConsent() once the Supabase session lands.
        state._pendingConsent = _socialConsent;
        save();
        const { error } = await window.furnishBackend.auth.signInWithGoogle();
        if (error) toast(error.message || 'Google sign-in failed');
        // Successful OAuth → page redirects to Google → back to here.
        // Session restoration is handled by the auth.onChange listener below.
        return;
      }

      // Local fallback (mock identity)
      state.user = {
        generationsUsed: state.user?.generationsUsed || state.user?.redesignsUsed || 0,
        redesignsUsed:   state.user?.redesignsUsed || state.user?.generationsUsed || 0,
        isPro: !!state.user?.isPro,
        firstRedesignTutorialSeen: !!state.user?.firstRedesignTutorialSeen,
        name: `${label} user`,
        email: `${provider}.user@furnish.app`,
        provider,
        signedInAt: Date.now()
      };
      // [ToS consent block] Persist on mock-social signin success.
      recordConsent(_socialConsent);
      save();
      toast(`Signed in with ${label}`);
      afterSigninRouting();
    });
  });

  // ---------- Backend ready: auto-restore Supabase session ----------
  window.addEventListener('furnish:backend-ready', async () => {
    if (window.furnishBackend?.mode !== 'supabase') return;
    try {
      const user = await window.furnishBackend.auth.getUser();
      if (!user) return;
      // Already signed in (e.g. returning from OAuth or cached session)
      const wasSignedIn = !!state.user?.id;
      // [Model A — STEP 5 §16 row 4] Snapshot the cached tier+quota BEFORE we
      // pullAll(), so we can detect drift between offline-cached and server-
      // canonical. If the user paid (or canceled) on another device while this
      // one was offline, the reconcile fires the correct upgrade/downgrade
      // path instead of silently overwriting local state.
      const cachedTier = {
        isPro: !!state.user?.isPro,
        used: state.user?.generationsUsed || state.user?.redesignsUsed || 0,
        // [Tutorial fire-once] Preserve across OAuth/session restoration.
        firstRedesignTutorialSeen: !!state.user?.firstRedesignTutorialSeen
      };
      state.user = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || (user.email || '').split('@')[0],
        provider: user.app_metadata?.provider || 'email',
        signedInAt: Date.now(),
        // Carry the cached tier into the new user object so reconcile sees it.
        isPro: cachedTier.isPro,
        generationsUsed: cachedTier.used,
        firstRedesignTutorialSeen: cachedTier.firstRedesignTutorialSeen
      };
      try { await window.furnishBackend.pullAll(state); } catch (err) { console.warn('[Furnish] pull failed', err); }
      // [ToS consent block] If consent was stashed pre-OAuth-redirect,
      // persist it now that the session is back.
      if (state._pendingConsent) {
        recordConsent(state._pendingConsent);
        delete state._pendingConsent;
      }
      // pullAll has just written the server values into state.user. Pass the
      // pre-pull cached snapshot so reconcile can detect cross-device drift.
      reconcileTierWithBackend(cachedTier.isPro, cachedTier.used);
      // §16 row 1 — Re-tag any newly-discovered Pro user from server side as
      // grandfathered if they didn't have a tierGrantedAt before.
      grandfatherProUsers();
      save();
      // [Auth flow Fix 4] OAuth callback routing.
      // Pre-fix this only routed via afterSigninRouting() when the active
      // screen was the HTML default 'welcome' AND the user wasn't already
      // signed in. That misses the case where a guest with a pending
      // reveal intent OAuth-signs-in and the post-reload active screen is
      // anything else — the intent then sat in localStorage with nothing
      // to consume it. Loosen: any pending reveal MUST fire afterSigninRouting
      // regardless of which screen is active. The screen-name check stays
      // as the fallback for pre-reveal first-time signups.
      const active = document.querySelector('.screen.active')?.dataset?.screen;
      const hasPendingReveal = state._pendingIntent?.intent === 'reveal';
      if (hasPendingReveal || (!wasSignedIn && active === 'welcome')) {
        afterSigninRouting();
      } else if (active === 'profile-select') {
        renderProfiles();
      }
    } catch (err) {
      console.warn('[Furnish] auto-restore failed', err);
    }
  });

  // ---------- Account menu (dropdown on profile-select) ----------
  (() => {
    const menu = document.getElementById('userMenu');
    const trigger = document.getElementById('userPillBtn');
    const dropdown = document.getElementById('userDropdown');
    if (!menu || !trigger || !dropdown) return;

    const close = () => { menu.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); };
    const open  = () => { menu.classList.add('open');    trigger.setAttribute('aria-expanded', 'true'); };

    trigger.addEventListener('click', e => {
      e.stopPropagation();
      menu.classList.contains('open') ? close() : open();
    });
    document.addEventListener('click', e => {
      if (!menu.contains(e.target)) close();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menu.classList.contains('open')) close();
    });

    dropdown.addEventListener('click', async e => {
      const item = e.target.closest('[data-action]');
      if (!item) return;
      const action = item.dataset.action;
      close();
      switch (action) {
        case 'switch':
          if (!confirm('Switch account? Your profiles stay on this device.')) return;
          // [Dim 14 Section F] Snapshot state to per-user backup before clearing.
          if (typeof window.FurnishSignoutSnapshot === 'function') window.FurnishSignoutSnapshot();
          if (window.furnishBackend?.mode === 'supabase') {
            await window.furnishBackend.auth.signOut().catch(()=>{});
          }
          state.user = null;
          save();
          prepareSignin();
          showScreen('signin');
          toast('Sign in to switch.');
          break;
        case 'furnish-pro':
          openPaywall('generic');
          break;
        case 'support':
          openSupportModal();
          break;
        case 'signout':
          // [Bug E fix] Single-path signout via performSignout() — clears
          // ALL local state, not just state.user. Confirm + Supabase
          // signOut + analytics reset + state wipe + nav are all
          // consolidated in the helper so the topbar dropdown + the
          // Profile-page settings list never drift.
          await performSignout();
          break;
      }
    });
  })();

  // ---------- Support modal ----------
  function openSupportModal() {
    const m = document.getElementById('supportModal');
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
  }
  (() => {
    const m = document.getElementById('supportModal');
    if (!m) return;
    const close = () => { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); };
    document.getElementById('supportClose').addEventListener('click', close);
    m.addEventListener('click', e => { if (e.target.id === 'supportModal') close(); });
    document.getElementById('supportFaq').addEventListener('click', () => {
      close();
      // [Dim 09 D10 — exclamation removed per Warmth-6.]
      toast("FAQ coming soon. You're early.");
    });
    document.getElementById('supportFeedback').addEventListener('click', () => {
      close();
      toast('Send your idea to hello@furnish.app');
    });
  })();

  // ---------- Theme ----------
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    // Icon visibility is now driven by CSS targeting [data-theme] — no need to
    // overwrite button content (preserves the inline moon/sun SVGs).
  }
  // Always initialize with a persisted theme so future loads are explicit; default is light.
  if (!state.settings || (state.settings.theme !== 'dark' && state.settings.theme !== 'light')) {
    state.settings = { ...(state.settings || {}), theme: 'light' };
    save();
  }
  applyTheme(state.settings.theme);

  document.addEventListener('click', e => {
    if (!e.target.closest || !e.target.closest('.theme-toggle-btn')) return;
    const next = (state.settings?.theme === 'dark') ? 'light' : 'dark';
    state.settings = { ...(state.settings || {}), theme: next };
    save();
    applyTheme(next);
    toast(next === 'dark' ? 'Dark mode on' : 'Light mode on');
  });

  // ---------- Profiles ----------
  function renderProfiles() {
    const grid = $('#profileGrid');
    grid.innerHTML = '';

    // Free tier = 1 profile only. Extra profiles are a Pro feature.
    if (state.profiles.length === 0) {
      state.profiles.push(createProfile('Profile 1', { id: 'p1' }));
      save();
    }

    // Profiles beyond the first are locked unless user is Pro.
    // (Existing users who had 4 profiles from the previous seed keep their
    // data, but profile #2+ shows a lock and opens the paywall on tap.)
    const isPro = !!state.user?.isPro;
    state.profiles.forEach((p, idx) => {
      const locked = idx > 0 && !isPro;
      const card = document.createElement('div');
      card.className = 'profile-card'
        + (state.activeProfileId === p.id ? ' selected' : '')
        + (locked ? ' pro-locked' : '');
      card.style.setProperty('--stagger-i', idx);
      const initials = p.name.match(/\d+|\S/)?.[0] || p.name[0];
      const stylesLine = p.styles.length
        ? p.styles.map(styleLabel).join(' · ')
        : 'Tap to take style quiz';
      const avatarStyle = p.avatar
        ? `style="background-image:url('${p.avatar}')"`
        : `style="background:${avatarGradient(idx)}"`;
      const avatarClass = p.avatar ? 'profile-avatar has-photo' : 'profile-avatar';
      const avatarBody = p.avatar ? '' : initials;
      const lockHTML = locked
        ? `<div class="profile-lock" aria-label="Pro only">
             <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
               <rect x="5" y="11" width="14" height="9" rx="2"/>
               <path d="M8 11V8a4 4 0 018 0v3"/>
             </svg>
             PRO
           </div>`
        : '';
      card.innerHTML = `
        <button class="profile-edit-btn" aria-label="Rename" title="Rename">✎</button>
        ${lockHTML}
        <div class="${avatarClass}" ${avatarStyle}>${avatarBody}</div>
        <div class="title">${p.name}</div>
        <div class="styles-line">${stylesLine}</div>
      `;
      card.querySelector('.profile-edit-btn').addEventListener('click', e => {
        e.stopPropagation();
        const titleEl = card.querySelector('.title');
        if (!titleEl || titleEl.tagName === 'INPUT') return;
        const old = p.name;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'profile-name-input';
        input.value = old;
        input.maxLength = 40;
        titleEl.replaceWith(input);
        input.focus();
        input.select();
        input.addEventListener('click', ev => ev.stopPropagation());
        let committed = false;
        const commit = () => {
          if (committed) return;
          committed = true;
          const next = (input.value || '').trim();
          if (next && next !== old) {
            p.name = next.slice(0, 40);
            save();
            toast('Profile renamed');
          }
          renderProfiles();
        };
        input.addEventListener('keydown', ev => {
          ev.stopPropagation();
          if (ev.key === 'Enter') { ev.preventDefault(); commit(); }
          if (ev.key === 'Escape') { input.value = old; commit(); }
        });
        input.addEventListener('blur', commit);
      });
      card.addEventListener('click', () => {
        if (locked) {
          openPaywall('profile');
          return;
        }
        state.activeProfileId = p.id;
        save();
        // [Hassan's call] If the profile has NEVER done the quiz
        // (no styles derived yet) → run them through the quiz. New users
        // can't skip the onboarding step. Existing users with a built
        // profile go straight to home, bypassing the legacy openPreferences
        // detour. Preferences are now reachable any time via the bottom-
        // nav Preferences tab.
        if (p.styles.length === 0) {
          openQuizIntro(p.id);
        } else {
          showScreen('home');
          renderHome();
        }
      });
      grid.appendChild(card);
    });

    renderUserPill();
  }

  function renderUserPill() {
    const menu = $('#userMenu');
    if (!menu) return;
    if (!state.user) { menu.style.display = 'none'; return; }
    menu.style.display = '';
    const name = state.user.name || (state.user.email || '').split('@')[0];
    const initial = (name[0] || '?').toUpperCase();
    $('#userPillName').textContent = name;
    $('#userDropdownName').textContent = name;
    $('#userDropdownEmail').textContent = state.user.email || '';
    const av = $('#userPillAvatar');
    av.textContent = initial;
    av.style.background = avatarGradient(0); // use the lightest brown shade
  }

  $('#addProfileBtn').addEventListener('click', () => {
    // Adding extra profiles is gated behind Pro.
    if (!state.user?.isPro) {
      openPaywall('profile');
      return;
    }
    const n = state.profiles.length + 1;
    const p = createProfile('Profile ' + n);
    state.profiles.push(p);
    save();
    renderProfiles();
  });

  // ---------- Paywall ----------
  // [Model A] Paywall contexts shrink to only the actions Model A actually
  // gates: AI generation quota, premium templates, HD export, multi-profile,
  // multi-room batch, advanced personalization, and a generic fallback.
  // Per Reforge Monetization + Pricing: anchor on the value the user is
  // about to access, not on fear ("you can't have this") — the user already
  // got the free demo, so we know they understand the value.

  // ============================================================
  // FREE PLAN CARD — single source of truth
  // ============================================================
  // Every paywall surface renders this card alongside the Pro card. Per
  // Reforge Monetization + Pricing (anchoring) + User Psychology (loss-
  // aversion symmetry), showing what the user keeps reduces "if I don't pay
  // I lose everything" panic — the panic that closes modals without
  // converting. The Free card is intentionally de-emphasized vs Pro: it
  // exists to remind, not to compete.
  //
  // To change Free-tier benefits, edit ONLY this constant. Do NOT duplicate
  // the bullets into HTML or other files.
  //
  // Exposed on window.FurnishFreePlan for any future surfaces that want to
  // import the same source (e.g., settings page tier comparison).
  // ============================================================
  // ============================================================
  // FURNISH_OKT — One Key Takeaway (locked 2026-04-26 by Hassan)
  // ============================================================
  // Per Reforge Product Marketing — Finding Your One Key Takeaway
  // (Strategic Emphasis Archetypes p.4) — Audience-Based archetype.
  // The OKT is "the glue that binds together your customer's journey
  // across different touchpoints." Single source of truth for every
  // paywall sub, welcome refresh, lifecycle email subject, voice
  // decision. If a copy line doesn't ladder up to this OKT, rewrite it.
  // Also referenced in CLAUDE.md (Conventions) and VOICE.md (manifesto).
  // ============================================================
  const FURNISH_OKT = Object.freeze({
    takeaway: 'Your household, your style, sharper.',
    clarifier: 'Furnish redesigns any room in about a minute, in your style, with shoppable furniture — and a separate profile for everyone in your house.',
    pillars: Object.freeze({
      functional: 'Watch any room transform — about a minute, sit tight.',  // welcome hero
      emotional:  'Sharper redesigns, every time.',                          // premium AI
      accrued:    'A profile for everyone in your house.',                   // household
    }),
  });
  // Public surface for future callers (settings, voice debug, etc.)
  window.FurnishOKT = FURNISH_OKT;

  // [Hassan's call] Single source of truth for room-type icons. Used by:
  // - "YOUR HOME" home-progress grid (renderHomeProgress) — primary surface
  // - "What room is this?" capture-screen picker (renderRoomTypeCards via
  //   window.ROOM_TYPE_SVGS) — overridden at boot so both surfaces match.
  // Source-of-truth `window.ROOM_TYPES[].icon` (emoji) retained for any
  // non-grid surface (capture topbar, room-type confirmation toast).
  const HOME_ROOM_SVGS = {
    bedroom:  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18v-3a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v3"/><path d="M2 18h20v2H2z"/><path d="M5 12V8h7v4"/><path d="M2 20v1M22 20v1"/></svg>`,
    living:   `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13v-3a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3"/><path d="M3 13h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4z"/><path d="M6 19v2M18 19v2"/></svg>`,
    kitchen:  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h12v5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-5z"/><path d="M4 12h16"/><path d="M3 12l1 0M20 12l1 0"/><path d="M9 6c0 1.5 1 1.5 1 3M14 5c0 1.5 1 1.5 1 3"/></svg>`,
    dining:   `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="13" rx="8" ry="2"/><path d="M4 13v2a8 2 0 0 0 16 0v-2"/><path d="M8 11V7"/><path d="M16 11V7"/><path d="M6 17v3M18 17v3"/></svg>`,
    bathroom: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3z"/><path d="M5 12V8a2 2 0 0 1 2-2h2"/><circle cx="9" cy="6" r="1"/><path d="M6 19v2M18 19v2"/></svg>`,
    office:   `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6M12 16v4"/></svg>`,
    nursery:  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19v-9h16v9"/><path d="M3 19h18v1H3z"/><path d="M7 10v9M11 10v9M15 10v9M19 10v9"/><path d="M10 7c0-1 1-2 2-2s2 1 2 2c0 1.5-2 2.5-2 2.5s-2-1-2-2.5z"/></svg>`,
    closet:   `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7a2 2 0 1 1 2-2"/><path d="M12 8v2"/><path d="M3 19l9-7 9 7H3z"/></svg>`,
    laundry:  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="14" r="4"/><circle cx="8" cy="6.5" r="0.5" fill="currentColor"/><circle cx="12" cy="6.5" r="0.5" fill="currentColor"/></svg>`
  };
  // Override the furniture.js ROOM_TYPE_SVGS map at boot so the capture-
  // screen room picker ("What room is this?") inherits the same icons as
  // the home-progress grid. Idempotent — Object.assign overwrites by key.
  if (window.ROOM_TYPE_SVGS) {
    Object.assign(window.ROOM_TYPE_SVGS, HOME_ROOM_SVGS);
  } else {
    window.ROOM_TYPE_SVGS = { ...HOME_ROOM_SVGS };
  }

  // [Onboarding Q4 icons] Custom inline SVGs for the "What are we redesigning?"
  // question. furniture.js references svg keys (scope-furniture, scope-
  // furniture-decor, scope-whole-room, scope-surprise) that weren't yet
  // defined in window.QUIZ_SVGS, so the placeholder ImageIcon fell through.
  // Hand-crafted to match the existing QUIZ_SVGS aesthetic (viewBox 0 0
  // 100 100, fill="none" stroke="currentColor", stroke-width 3, round
  // linecap/linejoin). currentColor → auto-responds to dark/light mode
  // via the parent .qoc-icon's color token. Reforge Visual Design (Dim 01):
  // iconography as brand-consistency signal. Reforge Trust & Credibility
  // (Dim 10): visible craftsmanship — placeholders read as "incomplete."
  // Reforge Conversion Optimization (Dim 03): polish in onboarding flow
  // reduces drop-off.
  // [Hassan's call — plain-language overrides] Strip jargon + tighten copy
  // on Q6 (budget), Q9 (avoid), Q10 (dealbreaker). Voice rubric: concrete,
  // confident, warm, calm. Mutates the shared ONBOARDING_QUESTIONS in place
  // at boot — idempotent guards so hot-reload doesn't clobber further edits.
  if (window.ONBOARDING_QUESTIONS) {
    // [BUDGET_RESET_PASS] Q6 budget_tier override block removed — Q6 itself
    // no longer exists in ONBOARDING_QUESTIONS.

    const _q9 = window.ONBOARDING_QUESTIONS.find(q => q.id === 'avoid');
    if (_q9 && _q9.headline.includes('NOT want')) {
      _q9.headline = 'What do you want to avoid?';
      const _q9Labels = {
        too_modern:  'Too modern or sterile',
        too_rustic:  'Too rustic or "farmhouse"',
        busy_prints: 'Bold patterns or busy prints',
        dark_heavy:  'Dark or heavy furniture',
        trendy:      'Trendy stuff that gets dated fast',
        nothing:     'Nothing — show me anything'
      };
      _q9.options.forEach(o => { if (_q9Labels[o.id]) o.label = _q9Labels[o.id]; });
    }

    // [Hassan's call] Q7 materials — drop the metal_glass option (no asset),
    // simplify labels, tighten headline. Card layout (qo-photo-text) is
    // handled in the renderer + CSS.
    const _q7 = window.ONBOARDING_QUESTIONS.find(q => q.id === 'materials');
    if (_q7 && _q7.options.some(o => o.id === 'metal_glass')) {
      _q7.headline = 'Which speaks to you?';
      _q7.options = _q7.options.filter(o => o.id !== 'metal_glass');
      const _q7Labels = {
        warm_woods:    'Warm woods and rattan',
        soft_fabrics:  'Soft fabrics',
        stone_ceramic: 'Stone & ceramic',
        vintage_patina:'Vintage patina',
        sleek_modern:  'Sleek modern'
      };
      _q7.options.forEach(o => { if (_q7Labels[o.id]) o.label = _q7Labels[o.id]; });
      // 'default' was ['warm_woods', 'soft_fabrics'] — both still present, no edit needed.
    }

    const _q10 = window.ONBOARDING_QUESTIONS.find(q => q.id === 'dealbreaker');
    if (_q10 && _q10.headline.includes('one thing in your room')) {
      _q10.headline = 'Anything you want to keep?';
      const _q10Labels = {
        furniture: 'A piece of furniture',
        color:     'A color or paint job',
        artwork:   'Art or something special',
        nothing:   'Nothing — full freedom'
      };
      _q10.options.forEach(o => { if (_q10Labels[o.id]) o.label = _q10Labels[o.id]; });
      // [Hassan's call] Q10: switch to multi-select with per-option text
      // followup. User can keep multiple things; each non-"nothing" pick
      // gets its own text box on the followup screen. "Nothing" stays
      // exclusive — picking it deselects others, picking another deselects
      // it. Default empty array means "no preserve hints."
      _q10.type = 'multi_select_with_followup';
      _q10.subhead = 'Pick any that apply';
      _q10.exclusive_option_id = 'nothing';
      _q10.default = [];
    }

    // [Hassan dropped image assets] Wire up the "Find Your Style Images"
    // folder to the matching quiz option ids. Filenames preserved as-is
    // (no rename); encodeURI + apostrophe-escape handles spaces/commas/
    // the single apostrophe in "Artist's Space" without breaking the
    // renderer's `url('...')` wrapper.
    const _imgEnc = (filename) =>
      'Find Your Style Images/' + encodeURI(filename).replace(/'/g, '%27');
    const _imgMap = {
      // Q1 vibe (mood)
      calm_grounded:        'Calm and Grounded - Copy.jpg',
      energized_creative:   'Energized and Creative.jpg',
      cozy_protected:       'Cozy and Protected.jpg',
      elevated_hotel:       'Elevated, Like a Hotel.jpg',
      inspired_artist:      "Inspired, Like an Artist's Space.jpg",
      // Q2 color_appetite (palette)
      neutrals_only:        'Neutrals only.png',
      mostly_neutral:       'Mostly neutral.png',
      confident_color:      'Confident color.png',
      bold:                 'Go Bold.png',
      // Q3 decor_density (reference_room)
      clean:                'A clean look.jpg',
      a_little_personality: 'A little personality.jpg',
      lived_in_rich:        'Lived-in and rich.jpg',
      maximalist:           'Maximalist.jpg',
      // Q5 natural_light (icon → photo when image present)
      tons:                 'Tons of natural light.jpg',
      bright_morning:       'Bright in the morning.jpg',
      dim:                  'Dim.jpg',
      // unsure: no image — keeps the question-mark icon fallback
      // Q7 materials (texture)
      warm_woods:           'Warm woods and rattan.png',
      soft_fabrics:         'Soft fabrics.png',
      // metal_glass: no image yet — placeholder shows
      stone_ceramic:        'Stone ceramic.png',
      vintage_patina:       'Vintage and Patina.png',
      sleek_modern:         'Sleek and Modern.png',
      // Q8 room_use (icon → photo when image present)
      slept_relaxed:        'Mostly slept.jpg',
      lived_in_all_day:     'Lived in all day.jpg',
      hosting:              'Hosting and entertaining.jpg',
      aspirational:         'Aspirational.jpg'
    };
    window.ONBOARDING_QUESTIONS.forEach(q => {
      q.options.forEach(opt => {
        if (_imgMap[opt.id] && !opt.image) {
          opt.image = _imgEnc(_imgMap[opt.id]);
        }
      });
    });
  }

  if (window.QUIZ_SVGS && !window.QUIZ_SVGS['scope-furniture']) {
    Object.assign(window.QUIZ_SVGS, {
      // Just furniture — single sofa in profile, line-art only. Communicates
      // "one piece of furniture" — no walls, no decor, no lamp.
      'scope-furniture': `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 36 V30 Q14 26 18 26 H82 Q86 26 86 30 V36"/><line x1="14" y1="36" x2="86" y2="36"/><rect x="12" y="44" width="76" height="22" rx="3"/><line x1="50" y1="46" x2="50" y2="64"/><line x1="12" y1="36" x2="12" y2="66"/><line x1="88" y1="36" x2="88" y2="66"/><line x1="22" y1="66" x2="22" y2="74"/><line x1="78" y1="66" x2="78" y2="74"/></svg>`,
      // Furniture + decor — large armchair filling most of the canvas
      // + tall floor lamp on the left. Bigger composition than the prior
      // version per Hassan's "make top right bigger" call.
      'scope-furniture-decor': `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="20" y1="92" x2="20" y2="22"/><path d="M8 18 L32 18 L28 6 L12 6 Z"/><path d="M42 88 V44 Q42 38 48 38 H86 Q92 38 92 44 V88"/><line x1="40" y1="88" x2="94" y2="88"/><line x1="44" y1="56" x2="90" y2="56"/><line x1="50" y1="88" x2="50" y2="96"/><line x1="84" y1="88" x2="84" y2="96"/></svg>`,
      // Whole room — interior scene that actually reads as a furnished
      // room. Ceiling + floor lines define the space; pendant light
      // hangs from center; framed art on the left wall; window on the
      // right wall; large sofa anchors the floor. Per Hassan: "try
      // harder to make a whole room."
      'scope-whole-room': `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="12" x2="92" y2="12"/><line x1="50" y1="12" x2="50" y2="24"/><path d="M40 24 L60 24 L56 36 L44 36 Z"/><rect x="14" y="22" width="20" height="16" rx="1.5"/><rect x="68" y="22" width="20" height="16" rx="1.5"/><line x1="78" y1="22" x2="78" y2="38"/><line x1="68" y1="30" x2="88" y2="30"/><path d="M16 84 V58 Q16 54 20 54 H80 Q84 54 84 58 V84"/><line x1="16" y1="64" x2="84" y2="64"/><line x1="6" y1="90" x2="94" y2="90"/></svg>`,
      // Surprise me — bold, confident question mark. Heavier stroke
      // matches the visual prominence of the other three icons.
      'scope-surprise': `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M32 36 Q32 14 50 14 Q68 14 68 32 Q68 44 52 50 Q50 52 50 62"/><circle cx="50" cy="80" r="4" fill="currentColor"/></svg>`
    });
  }

  // [ToS consent block] Source-of-truth version string. Bump this date
  // when terms or privacy policy materially changes; on next boot, the
  // re-consent flag fires for all signed-in users whose stored
  // tosVersion < this value. Per AUDIT_TOS_CONSENT.md decision policy.
  const FURNISH_TOS_VERSION = '2026.04.26';
  window.FurnishTosVersion = FURNISH_TOS_VERSION;

  // [ToS consent block] Read current consent state. Returns shape:
  //   { tosAccepted: bool, tosVersion: string|null, marketingOptIn: bool,
  //     reconsentRequired: bool }
  function getConsentState() {
    const u = state.user || {};
    const tosAccepted = !!u.tosAcceptedAt && !!u.tosVersion;
    return {
      tosAccepted,
      tosVersion: u.tosVersion || null,
      tosAcceptedAt: u.tosAcceptedAt || null,
      marketingOptIn: !!u.marketingOptIn,
      marketingOptInAt: u.marketingOptInAt || null,
      reconsentRequired: tosAccepted && u.tosVersion !== FURNISH_TOS_VERSION
    };
  }

  // [ToS consent block] Set consent at signup/signin/soft-capture submit.
  // Idempotent. tosAccepted=true is required (we don't allow submit
  // through the consent gate when ToS is unchecked); marketingOptIn is
  // independent.
  function recordConsent({ tosAccepted, marketingOptIn }) {
    if (!state.user) state.user = {};
    if (tosAccepted) {
      state.user.tosAcceptedAt = Date.now();
      state.user.tosVersion = FURNISH_TOS_VERSION;
    }
    // Marketing is revocable; always overwrite to current checkbox state.
    state.user.marketingOptIn = !!marketingOptIn;
    if (marketingOptIn) state.user.marketingOptInAt = Date.now();
    save();
  }
  window.FurnishGetConsent = getConsentState;
  window.FurnishRecordConsent = recordConsent;

  // ==========================================================
  // [Your Home progress] state.user.homeProgress
  // ==========================================================
  // Single source of truth for the 9-room progress grid. Decouples
  // the visible progress display from `state.rooms` so:
  // 1. Generation failures don't pollute progress (only successful
  //    redesigns add to designedRooms — the hook fires inside the
  //    success branch of routeGenerationByModelTier)
  // 2. Pro multi-room batch can append per-room as each completes
  // 3. The 9/9 celebration has a clear one-shot flag (`celebrated`)
  // 4. Reset wipes via the allow-list pattern (homeProgress is NOT
  //    in RESET_PRESERVED_USER_FIELDS so it auto-wipes)
  // Per STYLE_ROOM_PICKER_AUDIT.md.
  const HOME_ROOM_ORDER = Object.freeze([
    'bedroom', 'living', 'kitchen', 'dining', 'bathroom',
    'office', 'nursery', 'closet', 'laundry'
  ]);
  window.FurnishHomeRoomOrder = HOME_ROOM_ORDER;

  function getHomeProgress() {
    if (!state.user) state.user = {};
    if (!state.user.homeProgress) {
      state.user.homeProgress = { designedRooms: [], celebrated: false, flyoutLastRoom: null };
    }
    return state.user.homeProgress;
  }

  // ==========================================================
  // [Save Home] activeHome / savedHomes / savedRooms — 3-tier model
  // ==========================================================
  // Per SAVE_HOME_AUDIT.md. Three tiers of room artifact:
  //   1. activeHome = the in-progress home (one per user). Designed
  //      rooms live in activeHome.designedRooms[room_type] as objects.
  //      Excluded rooms live in activeHome.excludedRooms[].
  //   2. savedHomes = completed-and-archived bundles. Each saved home
  //      snapshots designedRooms + excludedRooms at save-time.
  //   3. savedRooms = individual standalone room saves. Populated by:
  //      (a) overwrite-protection (existing room in slot moves here
  //          when a new generation overwrites), (b) exclude-after-design
  //          (excluding a room you'd already designed), (c) explicit
  //          "Save to Saved Rooms" choice on the post-generation save surface.
  function uuid() {
    // Lightweight UUID-ish — sufficient for client-side activeHome ids.
    // Real backend cutover replaces with crypto.randomUUID() when available.
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  function emptyDesignedRoomsMap() {
    const map = {};
    HOME_ROOM_ORDER.forEach(t => { map[t] = null; });
    return map;
  }

  // [Hassan's call] Three rooms are excluded from "Your Home" by default —
  // office, nursery, laundry. Users who actually have these rooms can
  // re-enable them in Profile → Rooms in your home. Reforge Activation
  // (Dim 04): default to the rooms most users have, surface the others
  // as opt-in to reduce decision burden during the first-redesign loop.
  const DEFAULT_EXCLUDED_ROOMS = Object.freeze(['office', 'nursery', 'laundry']);

  function getActiveHome() {
    if (!state.user) state.user = {};
    if (!state.user.activeHome) {
      // [Hassan's call] New user — pre-exclude the 3 rooms. defaultExclusions
      // ApplyApplied marker prevents the one-time migration below from
      // re-applying on reload.
      state.user.activeHome = {
        id: uuid(),
        startedAt: Date.now(),
        excludedRooms: DEFAULT_EXCLUDED_ROOMS.slice(),
        designedRooms: emptyDesignedRoomsMap(),
        celebrated: false,
        defaultExclusionsApplied: true
      };
    }
    // [Hassan's call] One-time migration for existing users who already had
    // an activeHome BEFORE this default existed. Only add a default-excluded
    // room if (a) it's not already excluded and (b) the user hasn't already
    // designed it. Set the marker so the migration doesn't repeat.
    if (!state.user.activeHome.defaultExclusionsApplied) {
      DEFAULT_EXCLUDED_ROOMS.forEach(rt => {
        const alreadyExcluded = state.user.activeHome.excludedRooms.includes(rt);
        const alreadyDesigned = state.user.activeHome.designedRooms && state.user.activeHome.designedRooms[rt] !== null;
        if (!alreadyExcluded && !alreadyDesigned) {
          state.user.activeHome.excludedRooms.push(rt);
        }
      });
      state.user.activeHome.defaultExclusionsApplied = true;
    }
    // Defensive: ensure all 9 keys exist (older state may be missing some)
    HOME_ROOM_ORDER.forEach(t => {
      if (!(t in state.user.activeHome.designedRooms)) {
        state.user.activeHome.designedRooms[t] = null;
      }
    });
    return state.user.activeHome;
  }

  function getSavedHomes() {
    if (!state.user) state.user = {};
    if (!Array.isArray(state.user.savedHomes)) state.user.savedHomes = [];
    return state.user.savedHomes;
  }

  function getSavedRoomsList() {
    // Note: this is state.user.savedRooms — distinct from state.savedRooms
    // (legacy bookmarks) and state.wishlist (saved items).
    if (!state.user) state.user = {};
    if (!Array.isArray(state.user.savedRooms)) state.user.savedRooms = [];
    return state.user.savedRooms;
  }

  // Required rooms = 9 minus excluded count. Minimum 2 enforced at toggle time.
  function homeRequiredCount() {
    const ah = getActiveHome();
    return 9 - (ah.excludedRooms || []).length;
  }
  function homeDesignedCount() {
    const ah = getActiveHome();
    return HOME_ROOM_ORDER.filter(t => !ah.excludedRooms.includes(t) && ah.designedRooms[t] !== null).length;
  }
  function homeIsComplete() {
    return homeDesignedCount() >= homeRequiredCount() && homeRequiredCount() >= 2;
  }
  function nextHomeRoomSuggestionV2() {
    // Skip excluded rooms.
    const ah = getActiveHome();
    return HOME_ROOM_ORDER.find(t => !ah.excludedRooms.includes(t) && ah.designedRooms[t] === null) || null;
  }

  // Migration from old homeProgress.designedRooms[] array → activeHome.
  // Idempotent. Runs on boot.
  function migrateHomeProgressToActiveHome() {
    if (!state.user) state.user = {};
    if (state.user.activeHome) return; // already migrated or fresh init

    // No prior progress and no rooms → no-op (lazy init at next getActiveHome)
    const oldHp = state.user.homeProgress;
    const haveOldHp = oldHp && Array.isArray(oldHp.designedRooms) && oldHp.designedRooms.length > 0;
    if (!haveOldHp) return;

    const ah = {
      id: uuid(),
      startedAt: oldHp.startedAt || Date.now(),
      excludedRooms: [],
      designedRooms: emptyDesignedRoomsMap(),
      celebrated: !!oldHp.celebrated
    };
    const activeId = state.activeProfileId;
    oldHp.designedRooms.forEach(roomType => {
      if (!HOME_ROOM_ORDER.includes(roomType)) return;
      // Find the most recent state.rooms entry of this type for the active profile
      const matches = (state.rooms || [])
        .filter(r => r.type === roomType && (!activeId || r.profileId === activeId))
        .sort((a, b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));
      const r = matches[0];
      ah.designedRooms[roomType] = r
        ? { roomId: r.id, roomType, generatedAt: r.createdAt || r.timestamp || 0, source: 'migration' }
        : { roomId: null, roomType, generatedAt: 0, source: 'migration_stub' };
    });
    state.user.activeHome = ah;
    if (!Array.isArray(state.user.savedHomes)) state.user.savedHomes = [];
    if (!Array.isArray(state.user.savedRooms)) state.user.savedRooms = [];
    save();
    trackEvent('save_home_migration_completed', { migratedRooms: oldHp.designedRooms.length });
  }

  // Set a designed room in activeHome. If the slot is already occupied,
  // move the existing entry to savedRooms with reason='overwrite'. Returns
  // { added: bool, overwroteRoomId: string|null }.
  function setActiveHomeRoom(roomType, payload) {
    if (!HOME_ROOM_ORDER.includes(roomType)) return { added: false, overwroteRoomId: null };
    const ah = getActiveHome();
    const existing = ah.designedRooms[roomType];
    let overwroteRoomId = null;
    if (existing) {
      // Move existing to savedRooms (overwrite-protection)
      const sr = getSavedRoomsList();
      sr.push({
        roomGenerationId: existing.roomGenerationId || existing.roomId || null,
        roomId: existing.roomId || null,
        roomType,
        savedAt: Date.now(),
        source: existing.source || 'unknown',
        reason: 'overwrite'
      });
      overwroteRoomId = existing.roomId || null;
    }
    ah.designedRooms[roomType] = {
      roomGenerationId: payload?.roomGenerationId || payload?.roomId || null,
      roomId: payload?.roomId || null,
      roomType,
      generatedAt: payload?.generatedAt || Date.now(),
      source: payload?.source || 'unknown'
    };
    save();
    return { added: true, overwroteRoomId };
  }

  // Remove a designed room from activeHome and move it to savedRooms with
  // reason='exclude'. Used by the exclusion-of-already-designed-room flow.
  function moveActiveHomeRoomToSaved(roomType, reason) {
    if (!HOME_ROOM_ORDER.includes(roomType)) return null;
    const ah = getActiveHome();
    const existing = ah.designedRooms[roomType];
    if (!existing) return null;
    const sr = getSavedRoomsList();
    sr.push({
      roomGenerationId: existing.roomGenerationId || existing.roomId || null,
      roomId: existing.roomId || null,
      roomType,
      savedAt: Date.now(),
      source: existing.source || 'unknown',
      reason: reason || 'standalone'
    });
    ah.designedRooms[roomType] = null;
    save();
    return existing;
  }

  // Check whether a room id is "claimed" by either activeHome or savedRooms
  // (used by the post-generation save surface gate — don't re-show surface
  // for an already-claimed room).
  function isRoomClaimed(roomId) {
    if (!roomId) return false;
    const ah = getActiveHome();
    for (const t of HOME_ROOM_ORDER) {
      if (ah.designedRooms[t] && ah.designedRooms[t].roomId === roomId) return true;
    }
    return getSavedRoomsList().some(s => s.roomId === roomId);
  }

  window.FurnishActiveHome = {
    getActiveHome, getSavedHomes, getSavedRoomsList,
    homeRequiredCount, homeDesignedCount, homeIsComplete, nextHomeRoomSuggestionV2,
    setActiveHomeRoom, moveActiveHomeRoomToSaved, isRoomClaimed
  };

  // Migration: backfill designedRooms from the existing state.rooms
  // array on first read after upgrade. Idempotent — only runs if
  // designedRooms is empty AND there are existing rooms.
  function migrateHomeProgressFromRooms() {
    const hp = getHomeProgress();
    if (hp.designedRooms.length > 0) return; // already populated
    if (!Array.isArray(state.rooms) || !state.rooms.length) return;
    const activeId = state.activeProfileId;
    const types = new Set(
      state.rooms
        .filter(r => !activeId || r.profileId === activeId)
        .map(r => r.type)
        .filter(t => HOME_ROOM_ORDER.includes(t))
    );
    hp.designedRooms = HOME_ROOM_ORDER.filter(t => types.has(t)); // canonical order
    save();
  }

  // Append a room type to designedRooms (deduped, capped at 9).
  // Fires home_progress_room_completed on first add. Returns true
  // if newly added, false if already present.
  // [Save Home] DUAL-WRITE: maintains the legacy homeProgress.designedRooms[]
  // array (for backward-compat readers) AND populates activeHome.designedRooms
  // {object} with metadata. activeHome is the new source of truth; the array
  // is kept in sync for migration safety.
  function recordHomeProgressRoom(roomType, source, payload) {
    if (!roomType || !HOME_ROOM_ORDER.includes(roomType)) return false;
    const hp = getHomeProgress();
    const ah = getActiveHome();
    // Don't add to activeHome if room is excluded — caller should have
    // checked, but defensive.
    if ((ah.excludedRooms || []).includes(roomType)) return false;
    const wasNew = !hp.designedRooms.includes(roomType);
    if (wasNew) hp.designedRooms.push(roomType);
    // setActiveHomeRoom handles overwrite-protection (moves existing to savedRooms)
    const result = setActiveHomeRoom(roomType, {
      roomId: payload?.roomId || null,
      roomGenerationId: payload?.roomGenerationId || payload?.roomId || null,
      generatedAt: payload?.generatedAt || Date.now(),
      source: source || 'unknown'
    });
    save();
    if (wasNew) {
      trackEvent('home_progress_room_completed', {
        room_type: roomType,
        source: source || 'unknown',
        total_completed_after: hp.designedRooms.length
      });
    }
    if (result.overwroteRoomId) {
      trackEvent('save_to_home_overwrote_previous', {
        room_type: roomType,
        previous_room_id: result.overwroteRoomId
      });
    }
    return wasNew;
  }

  // "Next up" canonical-order suggestion — first un-designed room
  // type in HOME_ROOM_ORDER. Returns null when 9/9 done.
  function nextHomeRoomSuggestion() {
    const hp = getHomeProgress();
    return HOME_ROOM_ORDER.find(t => !hp.designedRooms.includes(t)) || null;
  }

  window.FurnishHomeProgress = { getHomeProgress, recordHomeProgressRoom, nextHomeRoomSuggestion };

  // ==========================================================
  // [Reset Profile] resetUserDesignProfile()
  // ==========================================================
  // Clears the user's design profile + history. PRESERVES auth +
  // consent + tier + session metadata. Per Hassan's spec: "A reset
  // should clear what the user is asking to reset (their design
  // profile and history), not punish them for it. Forcing re-login
  // adds friction proportional to 'I deleted your account' when the
  // user only intended 'start my preferences over.'"
  //
  // Uses an explicit allow-list of user fields that survive — safer
  // than a deny-list because future design-state fields automatically
  // get wiped without us remembering to add them.
  const RESET_PRESERVED_USER_FIELDS = new Set([
    // Identity (auth survives)
    'id', 'email', 'name', 'provider', 'signedInAt',
    // Tier / subscription state (Pro doesn't disappear on reset)
    'isPro', 'grandfathered', 'tier', 'tierGrantedAt',
    // Consent (already agreed; no need to re-consent)
    'tosAcceptedAt', 'tosVersion', 'marketingOptIn', 'marketingOptInAt',
    // Email-recovery-lane stash (independent of design state)
    'recoveryEmail',
    // Session metadata that's not tied to design content
    'lastVisitedAt', 'visitCount', 'sessionCount',
    '_sessionsByHour', '_sessionsByDow', '_lastSessionStart'
  ]);

  function resetUserDesignProfile() {
    if (!state.user) state.user = {};

    // 1. Clear the active profile's design fields. Other profiles
    //    (multi-profile Pro users) keep their data — the reset is
    //    scoped to the active profile, not the household.
    const p = getActiveProfile();
    const activeId = state.activeProfileId || p?.id;
    if (p) {
      p.answers = {};
      p.styles = [];
      p.colors = [];
      p.customColors = [];
      p.avatar = null;
      p.seenFinale = false;
      delete p._maxCompleteness;
      delete p.styleScores;
      delete p.ahaHistory;
      delete p.keepExisting;
    }

    // 2. Wipe rooms tied to the active profile (preserve other
    //    profiles' rooms).
    if (Array.isArray(state.rooms)) {
      state.rooms = state.rooms.filter(r => r.profileId !== activeId);
    }

    // 3. Wipe shared design state. Wishlist + bookmarks + price-alerts
    //    are top-level but the user explicitly asked for "saved rooms"
    //    to be wiped, and these are part of the saved-design context.
    state.draft = null;
    state.quiz = null;
    state.wishlist = [];
    state.bookmarkedRooms = [];
    state.priceAlerts = {};
    state.wishlistMeta = {};
    state.affiliateClicks = [];

    // 4. Reset state-level activation flags + event buffer.
    state._events = [];
    state._timing = {};
    state._setupCompleteAt = null;
    state._tourShown = false;
    state._habitFired = false;
    state._ahaResultsFired = false;
    state._templateTipShown = false;
    state._evolutionDismissedRooms = {};
    state._lastAIPrompt = null;
    state._showExploreWelcome = false;
    state._premiumUpsellShownThisSession = false;
    state._pendingIntent = null;
    state._pendingProAction = null;
    state._pendingConsent = null;
    state._tosBackTo = null;

    // 5. Reset state.user via allow-list. Anything not in the
    //    PRESERVED set gets dropped. Counter fields then re-seeded
    //    to sensible defaults so downstream code that reads them
    //    doesn't NPE.
    const u = state.user;
    Object.keys(u).forEach(k => {
      if (!RESET_PRESERVED_USER_FIELDS.has(k)) delete u[k];
    });
    u.generationsUsed = 0;
    u.redesignsUsed = 0;
    u.firstRedesignTutorialSeen = false;
    u.habitFormed = false;
    u._habitActions = [];
    u._gen30dWindow = [];
    u._clicks30dWindow = [];
    u._valueMomentSeen = {};
    u._valueMomentDismissed = {};

    save();

    // 6. Analytics.
    trackEvent('profile_reset_design_only', {
      profileId: activeId,
      preserved: {
        auth: !!u.id || !!u.email,
        tier: !!u.isPro,
        consent: !!u.tosAcceptedAt,
        marketingOptIn: !!u.marketingOptIn
      }
    });
  }
  window.FurnishResetUserDesignProfile = resetUserDesignProfile;

  // Confirm-dialog copy is identical from both reset entry points
  // (profile screen + preferences screen). Defined once so the wording
  // can't drift between surfaces. Per Hassan's spec: explicit about
  // what's wiped + explicit that auth survives.
  const RESET_CONFIRM_COPY =
    'Reset your design profile?\n\n' +
    "This clears your saved rooms, preferences, and design history. " +
    "You'll start fresh from the welcome page. " +
    "You'll stay signed in — your account is safe. This can't be undone.";

  // ==========================================================
  // [Reset Dialog] openResetDialog / closeResetDialog
  // ==========================================================
  // Single source of truth for the reset confirmation modal. Both
  // entry points (profile screen + preferences screen) route through
  // openResetDialog({source}). Hold-to-confirm friction (1s) on the
  // destructive button. Focus-trapped, ARIA-modal, keyboard-navigable.
  // Per RESET_DIALOG_AUDIT.md.
  const RESET_HOLD_MS = 1000;
  let _resetDialogState = null; // { source, holdTimer, holdStartedAt, confirmed, openerEl, lastActiveEl }

  function openResetDialog(options = {}) {
    const m = document.getElementById('resetDialog');
    if (!m) return;
    if (_resetDialogState) return; // guard against double-open
    const source = options.source || 'unknown';
    const opener = options.opener || document.activeElement;
    _resetDialogState = {
      source,
      holdTimer: null,
      holdStartedAt: 0,
      confirmed: false,
      openerEl: opener,
      lastActiveEl: document.activeElement
    };
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    trackEvent('reset_dialog_opened', { source });
    // Default focus: Cancel button (per spec — Enter without thinking
    // does nothing destructive).
    setTimeout(() => {
      document.getElementById('resetDialogCancel')?.focus();
    }, 50);
  }

  function closeResetDialog(reason) {
    const m = document.getElementById('resetDialog');
    if (!m || !_resetDialogState) return;
    const { source, holdTimer, confirmed, lastActiveEl } = _resetDialogState;
    if (holdTimer) clearTimeout(holdTimer);
    cancelHoldVisual();
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
    if (!confirmed) {
      trackEvent('reset_dialog_cancelled', { source, dismissReason: reason || 'cancel' });
    }
    // Return focus to the original opener (the Reset Profile button).
    try {
      if (lastActiveEl && typeof lastActiveEl.focus === 'function') {
        lastActiveEl.focus();
      }
    } catch (_) {}
    _resetDialogState = null;
  }
  window.FurnishOpenResetDialog = openResetDialog;

  // Hold-to-confirm visual control.
  function startHoldVisual() {
    const fill = document.querySelector('.reset-dialog-confirm-fill');
    const btn = document.getElementById('resetDialogConfirm');
    if (!fill || !btn) return;
    btn.classList.add('holding');
    // Override the snap-back transition with a linear 1s fill grow.
    fill.style.transition = `width ${RESET_HOLD_MS}ms linear`;
    fill.style.width = '100%';
  }
  function cancelHoldVisual() {
    const fill = document.querySelector('.reset-dialog-confirm-fill');
    const btn = document.getElementById('resetDialogConfirm');
    if (!fill || !btn) return;
    btn.classList.remove('holding');
    fill.style.transition = '';
    fill.style.width = '0';
  }

  function onResetHoldStart(e) {
    if (!_resetDialogState || _resetDialogState.confirmed) return;
    if (_resetDialogState.holdTimer) return; // already holding
    // Keyboard: only Space and Enter trigger the hold-start.
    if (e && e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return;
    if (e && e.type === 'keydown') {
      // Suppress repeat-fire from holding the key down.
      if (e.repeat) return;
      e.preventDefault();
    }
    _resetDialogState.holdStartedAt = Date.now();
    startHoldVisual();
    _resetDialogState.holdTimer = setTimeout(() => {
      // Hold completed — fire confirmed analytics, close dialog, run reset.
      const source = _resetDialogState.source;
      _resetDialogState.confirmed = true;
      _resetDialogState.holdTimer = null;
      trackEvent('reset_dialog_confirmed', { source });
      // Preserve the per-source legacy event for backwards-compatible
      // funnels. Pre-dialog this event fired from the prefs handler
      // directly; now it fires only on actual reset (post-friction).
      if (source === 'preferences_screen') {
        trackEvent('profile_reset_from_preferences', { profileId: getActiveProfile()?.id });
      }
      closeResetDialog('confirmed');
      resetUserDesignProfile();
      toast('Profile reset — your account is still signed in');
      showScreen('welcome');
    }, RESET_HOLD_MS);
  }
  function onResetHoldEnd() {
    if (!_resetDialogState || _resetDialogState.confirmed) return;
    if (_resetDialogState.holdTimer) {
      clearTimeout(_resetDialogState.holdTimer);
      _resetDialogState.holdTimer = null;
    }
    cancelHoldVisual();
  }

  // Wire dialog event handlers ONCE at module load.
  (function wireResetDialog() {
    const m = document.getElementById('resetDialog');
    if (!m) return;
    document.getElementById('resetDialogCancel')?.addEventListener('click', () => closeResetDialog('cancel'));
    document.getElementById('resetDialogClose')?.addEventListener('click', () => closeResetDialog('close'));
    m.addEventListener('click', (e) => {
      // Backdrop click — only close if the click target is the modal
      // overlay itself (not the card or its descendants).
      if (e.target === m) closeResetDialog('backdrop');
    });
    // Hold-to-confirm wiring.
    const confirmBtn = document.getElementById('resetDialogConfirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('mousedown', onResetHoldStart);
      confirmBtn.addEventListener('touchstart', onResetHoldStart, { passive: true });
      confirmBtn.addEventListener('keydown', onResetHoldStart);
      // Cancel on release / leave.
      confirmBtn.addEventListener('mouseup', onResetHoldEnd);
      confirmBtn.addEventListener('mouseleave', onResetHoldEnd);
      confirmBtn.addEventListener('touchend', onResetHoldEnd);
      confirmBtn.addEventListener('touchcancel', onResetHoldEnd);
      confirmBtn.addEventListener('keyup', onResetHoldEnd);
      confirmBtn.addEventListener('blur', onResetHoldEnd);
    }
    // Global keyboard handlers — Escape to close, Tab focus-trap.
    document.addEventListener('keydown', (e) => {
      if (!_resetDialogState) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeResetDialog('escape');
        return;
      }
      if (e.key === 'Tab') {
        // Trap focus inside the dialog.
        const focusables = m.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    });
  })();

  const FREE_PLAN_CARD = Object.freeze({
    title: 'Furnish Free',
    subtitle: 'What you already have',
    bullets: Object.freeze([
      'Unlimited AI redesigns at standard quality',
      'Unlimited reshuffles on your existing redesign',
      'Unlimited item swaps',
      'Full shopping access — every item is yours to buy',
      'Basic personalization (style, mood)',
      'Real-time price-drop alerts on saved items',
    ]),
    // [Batch 5 Part 2 — Dim 02 D02-3 modified] Cancellation-safety line.
    // Per Reforge User Psychology Psych Framework (Darius Contractor): the
    // second-order panic at the conversion moment is "what if I subscribe
    // and then need to cancel?" Naming the cancellation-safe state defuses
    // it. Conservative-bias call: only ship currently-true claims (saved
    // rooms + wishlist persist in localStorage today). The "Pro renders
    // locked at premium quality after downgrade" promise from the original
    // Reforge proposal is a future server contract — DEFERRED.
    cancelSafety: 'If you ever cancel Pro, your saved rooms and wishlist stay yours.',
    // [Dim 09 D11 — leading-question footer replaced with neutral statement.
    //  Per VOICE.md (Confidence-8 doesn't beg). Side-by-side comparison sells
    //  itself.]
    footer: "You're on Free. Pro is below.",
  });

  // Renders the Free card into a target element. Safe to call repeatedly —
  // re-renders idempotently. The current paywall calls this on every
  // openPaywall() so any future runtime change to FREE_PLAN_CARD propagates
  // without the modal needing a hard reload.
  function renderFreeCard(targetEl) {
    if (!targetEl) return;
    const def = FREE_PLAN_CARD;
    const bulletsHtml = def.bullets.map(b =>
      `<li><span class="bullet" aria-hidden="true">·</span>${b}</li>`
    ).join('');
    const safetyHtml = def.cancelSafety ? `<p class="pfree-cancel-safety muted small">${def.cancelSafety}</p>` : '';
    targetEl.innerHTML = `
      <div class="pfree-header">
        <div class="pfree-badge">CURRENT PLAN</div>
        <h4 class="pfree-title">${def.title}</h4>
        <p class="pfree-subtitle">${def.subtitle}</p>
      </div>
      <ul class="pfree-list">${bulletsHtml}</ul>
      ${safetyHtml}
      <p class="pfree-footer">${def.footer}</p>
    `;
  }
  // Public surface for future callers (settings page tier comparison, etc.)
  window.FurnishFreePlan = {
    definition: FREE_PLAN_CARD,
    render: renderFreeCard,
  };

  // [Batch 3 — Dim 03 R-Paywall2] 8 contexts → 3 layouts.
  // Per Reforge Product Marketing — Positioning And Messaging (One Key
  // Takeaway): each surface should have ONE main message. 8 contexts =
  // 8 different messages, none reinforced. Consolidating to 3 layouts:
  //   Layout A — Quality (premium_quality, hd_export, template_pro)
  //   Layout B — Power   (profile)  -- multi_room_batch + advanced_personalization
  //                                    were retired in Batch 1 Conflict 3 lock
  //   Layout C — Save    (advanced_price_filters)
  // generic stays as a Layout-A fallback. Existing call sites unchanged —
  // each context still maps to copy, but the underlying layout is shared.
  const PAYWALL_LAYOUTS = Object.freeze({
    A_quality: { layout: 'A', leadBullet: 'Premium AI model — sharper results, no watermark.' },
    B_power:   { layout: 'B', leadBullet: 'Designed for households and frequent users.' },
    C_save:    { layout: 'C', leadBullet: 'Set price-drop thresholds and never overpay.' }
  });
  const PAYWALL_CONTEXT_LAYOUT = Object.freeze({
    premium_quality:        'A_quality',
    hd_export:              'A_quality',
    template_pro:           'A_quality',
    profile:                'B_power',
    advanced_price_filters: 'C_save',
    rearrange:              'A_quality',
    generic:                'A_quality',
  });
  window.FurnishPaywallLayouts = PAYWALL_LAYOUTS;
  window.FurnishPaywallContextLayout = PAYWALL_CONTEXT_LAYOUT;

  const PAYWALL_COPY = {
    premium_quality: {
      // [Batch 5 Part 2 — Dim 02 4S audit fix] Was 1/4 on the 4S rubric:
      // Simple ✓ but Selfish ✗ Specific ✗ Sensory ✗. Rewrite to 4/4 per
      // Reforge Apply User Psych "How To Tap Into Emotion": Selfish
      // ("Your redesigns"); Sensory ("photo-real", "sharper light",
      // "fabrics", "blocky textures"); Specific (concrete features named);
      // Simple (each sentence short).
      title: 'Your redesigns, photo-real.',
      sub: 'Same room, sharper light, accurate fabrics — no more blocky textures or fake reflections. Pro routes you to the premium AI model.',
    },
    advanced_price_filters: {
      title: 'Filter your price-drop alerts',
      sub: 'Pro lets you set thresholds (only alert me on drops ≥20%) and retailer preferences. Free alerts already cover everything saved — Pro is for power users.',
    },
    template_pro: {
      title: 'Premium templates',
      sub: 'Pro templates include curated rooms across every style and space — designer-quality starts with the right shape.',
    },
    hd_export: {
      title: 'Export in HD, no watermark',
      sub: 'Pro removes the watermark and exports your redesign at full resolution — Instagram, Pinterest, TikTok ready.',
    },
    profile: {
      title: 'A profile for everyone in your house',
      sub: 'Pro adds a separate style profile per person — partners, roommates, kids — each with their own quiz answers and saved rooms.',
    },
    // [Conflict 3 lock — multi_room_batch + advanced_personalization
    //  contexts retired. Both are "coming soon" features that should not
    //  trigger a paywall (per Reforge Packaging Strategies: don't price
    //  features that don't exist). Both surfaces previously triggering
    //  these contexts now route to `generic` until the features ship.
    //  Roadmap modal (#paywallRoadmapModal) discloses planned features
    //  without impersonating shipped ones.]
    rearrange: {
      // [Model A — D10] Rearrange is FREE. Kept here for backward-compat in
      // case any stale call site tries to open this context — it'll fall
      // through with neutral copy instead of crashing.
      title: 'Rearrange your room',
      sub: 'Drag price tags to reposition pieces. Free for everyone.',
    },
    generic: {
      // [Batch 5 — Dim 06 Section A.5 + Section E entry 1] Reframe Pro
      //  headline from "Premium AI" to bundle-led "full design partner."
      //  Per Reforge Use Case Model (Why dimension): differentiation must
      //  be legible vs alternatives. "Premium AI" alone is invisible; the
      //  bundle (household profiles + share-ready downloads + price tracking)
      //  is concrete and answers the natural-frequency challenge — these
      //  are the entitlements that accrue value between rare redesigns.
      //  Replaces Dim 09 D2 OKT-laddered version (still ladders to OKT).
      title: 'Your full design partner.',
      sub: 'Sharper renders, household profiles, share-ready downloads, smarter price tracking — the toolkit that pays off between redesigns.',
    },
  };

  function openPaywall(context = 'generic') {
    const copy = PAYWALL_COPY[context] || PAYWALL_COPY.generic;
    const titleEl = $('#paywallTitle');
    const subEl = $('#paywallSub');
    if (titleEl) titleEl.textContent = copy.title;
    if (subEl) subEl.textContent = copy.sub;
    renderFreeCard($('#paywallFreeCard'));
    const m = $('#paywallModal');
    m.dataset.context = context;
    // [Batch 3 — Dim 03 R-Paywall2] Apply layout class for the 8→3
    // consolidation. Per Reforge One Key Takeaway: layout = unified
    // visual treatment; copy varies per context but layout reinforces.
    const layoutKey = (window.FurnishPaywallContextLayout || {})[context] || 'A_quality';
    m.dataset.layout = layoutKey;
    m.classList.remove('layout-A_quality', 'layout-B_power', 'layout-C_save');
    m.classList.add(`layout-${layoutKey}`);
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    // [Batch 5 — Dim 06 Section D + E.8] Track shown timestamp so dismiss
    // events can compute shown_for_ms (Reforge: <2s=bounce, 2-15s=read-and-
    // rejected, >15s=considered-and-rejected). Stored on the modal element
    // so concurrent contexts don't trample each other.
    m.dataset.shownAt = String(Date.now());
    // [Batch 5 Part 2 — Dim 02 D02-8] Selective scarcity per context.
    // Per Reforge Apply User Psych Painkiller-vs-Vitamin distinction:
    // premium_quality is closer to painkiller (user just felt standard-
    // quality limits) — adding scarcity reads as overselling. Abstract
    // upsells (HD export, multi-profile, price filters, generic) are
    // pure vitamin → need motivational boosts (urgency / scarcity) to
    // clear the decision hill. `data-scarcity` toggles the visibility
    // of `.paywall-urgency` (founding-member 1,000-spot copy).
    const scarcityOnContexts = ['hd_export','profile','advanced_price_filters','template_pro','generic'];
    m.dataset.scarcity = scarcityOnContexts.includes(context) ? 'on' : 'off';
    trackEvent('paywall_shown', { context, layout: layoutKey });
  }
  // [Batch 5 — Dim 06 Section D + E.8] Differentiated dismiss paths.
  // dismissReason ∈ 'close' | 'maybe_later' | 'backdrop' | 'escape'.
  // Explicit dismisses (close button, "Maybe later") suppress the
  // current value-moment context per Section D (21d cooldown bumped to
  // permanent suppression for that exact context).
  function closePaywall(dismissReason = 'close') {
    const m = $('#paywallModal');
    if (!m) return;
    const context = m.dataset.context || 'generic';
    const shownAt = parseInt(m.dataset.shownAt || '0', 10) || 0;
    const shown_for_ms = shownAt ? Date.now() - shownAt : 0;
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
    delete m.dataset.shownAt;
    trackEvent('paywall_dismissed', { context, dismissReason, shown_for_ms });
    // Explicit dismissals = stronger negative signal; suppress this context.
    if (dismissReason === 'close' || dismissReason === 'maybe_later') {
      // The triggerKind that mapped TO this context — find the inverse.
      // For simplicity: suppress all triggerKinds that route to the
      // dismissed context (per the contextMap in maybeFireValueMomentPaywall).
      const trigForContext = {
        hd_export:              ['hd_export_attempt', 'affiliate_click_2plus_items', 'share_attempt'],
        advanced_price_filters: ['wishlist_3rd_save'],
        profile:                ['second_room_intent'],
        premium_quality:        ['love_dwell_5min', 'same_room_3rd_redesign'],
      };
      (trigForContext[context] || []).forEach(t => suppressValueMomentTrigger(t));
    }
  }

  // [Batch 5 — Dim 06 Section B.2 + E.6] Monthly/Annual/Lifetime toggle.
  // Lifetime = decoy tier per Reforge Pricing Strategies (Economist
  // 3-tier study). Annual stays default-selected; Lifetime $99 anchors
  // annual ($47.88/yr) as obviously cheap by comparison. Pre-Stripe,
  // selecting Lifetime mocks the same Pro flag (existing
  // grandfatherProUsers covers cutover). Section E.6 also raises Annual
  // total ($47.88/yr) to the headline price line.
  $$('.pw-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.pw-toggle-btn').forEach(b => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      const plan = btn.dataset.plan;
      const priceEl = $('#paywallPrice');
      const unitEl = $('#paywallUnit');
      let amount = '$5.99', unit = '/month';
      if (plan === 'annual') {
        // Annual prominence: lead with the year total, sub-line shows /mo equiv.
        amount = '$47.88'; unit = '/year  ·  $3.99/month equivalent';
      } else if (plan === 'lifetime') {
        amount = '$99';    unit = 'one-time  ·  Pay once, never billed again';
      }
      if (priceEl) priceEl.textContent = amount;
      if (unitEl) unitEl.textContent = unit;
      if (state) state._paywallSelectedPlan = plan;
      trackEvent('paywall_plan_selected', { plan });
    });
  });

  // [Layer 7] FTC affiliate disclosure modal wiring
  document.getElementById('affiliateLearnMore')?.addEventListener('click', e => {
    e.preventDefault();
    const m = document.getElementById('affiliateModal');
    if (!m) return;
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    trackEvent('affiliate_disclosure_viewed');
  });
  document.getElementById('affiliateClose')?.addEventListener('click', () => {
    const m = document.getElementById('affiliateModal');
    if (!m) return;
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
  });
  document.getElementById('affiliateModal')?.addEventListener('click', e => {
    if (e.target.id === 'affiliateModal') {
      e.target.classList.remove('open');
      e.target.setAttribute('aria-hidden', 'true');
    }
  });

  // [Conflict 3 lock — Roadmap modal wiring] Replaces "[coming soon]"
  // Pro bullets. Per Reforge Monetization + Pricing — Packaging
  // Strategies: roadmap is opt-in disclosure, not impersonating shipped
  // features. Opens from #paywallRoadmapLink (paywall footer).
  document.getElementById('paywallRoadmapLink')?.addEventListener('click', e => {
    e.preventDefault();
    const m = document.getElementById('paywallRoadmapModal');
    if (!m) return;
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    trackEvent('paywall_roadmap_viewed');
  });

  // [More Pro perks dropdown] Native <details> toggle event. Fires
  // analytics on each expand/collapse so dashboards can measure
  // dropdown engagement (high open-rate = users want more disclosure;
  // low rate = the headline 5 bullets cover the decision).
  document.getElementById('paywallMorePerks')?.addEventListener('toggle', (e) => {
    const opened = e.target.open;
    trackEvent(opened ? 'paywall_more_perks_opened' : 'paywall_more_perks_closed');
  });
  document.getElementById('paywallRoadmapClose')?.addEventListener('click', () => {
    const m = document.getElementById('paywallRoadmapModal');
    if (!m) return;
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
  });
  document.getElementById('paywallRoadmapModal')?.addEventListener('click', e => {
    if (e.target.id === 'paywallRoadmapModal') {
      e.target.classList.remove('open');
      e.target.setAttribute('aria-hidden', 'true');
    }
  });

  // [Batch 5 — Dim 06 Section D + E.8] Differentiated dismiss reasons.
  // Each path passes its specific reason to closePaywall for analytics +
  // for the suppress-explicit-dismiss rule.
  $('#paywallClose').addEventListener('click', () => closePaywall('close'));
  $('#paywallDismiss').addEventListener('click', () => closePaywall('maybe_later'));
  // Backdrop click (clicking outside the modal-card)
  $('#paywallModal').addEventListener('click', e => {
    if (e.target.id === 'paywallModal') closePaywall('backdrop');
  });
  // Escape key when paywall is open
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('#paywallModal')?.classList.contains('open')) {
      closePaywall('escape');
    }
  });
  $('#paywallCta').addEventListener('click', () => {
    // Mock Stripe success. Real Stripe wiring is in DEFERRED.md.
    // [Compute-quality routing] No quota_exhausted resume anymore — there is
    // no quota gate. Mid-flow resume now only fires for the Pro-only-template
    // path (see triggeringContext === 'template_pro' branch below).
    const triggeringContext = $('#paywallModal').dataset.context || 'generic';
    const previousTier = isPro() ? 'pro' : 'free';
    if (!state.user) state.user = {};
    state.user.isPro = true;
    save();
    syncFreeModeClass();
    trackEvent('paywall_converted', { triggeringContext });
    // Lifecycle event for analytics — separate from activation funnel so
    // dashboards can split conversion attribution from upgrade reporting.
    trackEvent('tier_changed', { from: previousTier, to: 'pro', source: 'paywall_cta', triggeringContext });
    trackEvent('pro_subscription_started', { plan: 'mocked_trial', source: 'paywall_cta', triggeringContext });
    toast("Welcome to Furnish Pro — 7-day trial started");
    closePaywall();

    // [Compute-quality routing] Mid-flow resume now only applies to the
    // Pro-only-template gate. The old quota_exhausted resume is gone — there
    // is no more quota gate to interrupt a generation. The capture path no
    // longer needs a stash because no analyze click is ever blocked.
    const pending = state._pendingProAction;
    if (triggeringContext === 'template_pro' &&
        pending && pending.actionId === 'template_pro' && pending.templateId) {
      const t = (window.ROOM_TEMPLATES || []).find(x => x.id === pending.templateId);
      state._pendingProAction = null;
      save();
      if (t) {
        setTimeout(() => startFromTemplate(t), 200);
        return;
      }
    }
    // Clear any stale stash — defensive.
    if (pending) {
      state._pendingProAction = null;
      save();
    }

    // Re-render the current screen so gates lift immediately.
    const cur = document.querySelector('.screen.active')?.dataset?.screen;
    if (cur === 'home') renderHome();
    else if (cur === 'results' && currentRoomId) openRoom(currentRoomId);
    else if (cur === 'profile' && typeof renderProfilePage === 'function') renderProfilePage();
  });
  $('#paywallModal').addEventListener('click', e => {
    if (e.target.id === 'paywallModal') closePaywall();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('#paywallModal').classList.contains('open')) closePaywall();
  });

  // ---------- Style quiz ----------
  // ============================================================
  // 10-Q onboarding flow (replaces the 4-Q style quiz)
  // ============================================================
  // state.quiz = {
  //   profileId,                    // active profile we're answering for
  //   step,                         // 0..9 — index into window.ONBOARDING_QUESTIONS
  //   answers: { qid: value },      // canonical answers, persisted on each select
  //   viewedAt: { qid: ts },        // first-paint timestamp per question (for time_to_answer)
  //   skippedAt: { qid: bool },     // tracks per-question skips for analytics
  //   pendingMulti: { qid: [ids] }, // in-progress multi-select before Continue tap
  //   startedAt                     // for total_time_ms in onboarding_completed
  // }
  // ============================================================
  let _quizSkipRevealTimer = null;

  function openQuizIntro(profileId) {
    const p = state.profiles.find(x => x.id === profileId);
    if (!p) { showScreen('profile-select'); return; }
    $('#quizIntroTitle').textContent = `${p.name} — let's find your style`;
    state.quiz = {
      profileId,
      step: 0,
      answers: {},
      viewedAt: {},
      skippedAt: {},
      pendingMulti: {},
      startedAt: Date.now()
    };
    save();
    showScreen('quiz-intro');
  }

  $('#startQuizBtn').addEventListener('click', () => {
    renderQuizStep();
    showScreen('quiz');
  });

  // Global skip — apply ALL defaults at once, route to capture.
  $('#skipQuizBtn').addEventListener('click', () => {
    const p = getActiveProfile();
    if (p) {
      p.answers = ONBOARDING_DEFAULTS();
      p.seenFinale = true; // skip-the-quiz path also gets the celebration
      // Keep legacy fields synced via deriveStylesFromAnswers for the
      // catalog picker — see Layer 2 helpers.
      p.styles = deriveStylesFromAnswers(p.answers);
      p.colors = deriveColorsFromAnswers(p.answers);
      save();
    }
    trackEvent('onboarding_skipped_full', { from_question_index: -1 });
    state.quiz = null;
    save();
    showScreen('capture');
    prepareCapture();
  });

  // [FOUR_FIX_PASS — Fix 4] Esc keyboard handler triggers quiz back, same
  // as the back button. Spec: "Esc key triggers Back, same as the button."
  // Active only when the quiz screen is visible AND not on Q1 AND not
  // generating (analyzing screen blocks back per spec).
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const active = document.querySelector('.screen.active')?.dataset.screen;
    if (active !== 'quiz') return;
    if (!state.quiz || state.quiz.step === 0) return;
    // Don't fight other modals — only consume Escape if no other modal is open.
    const otherModalOpen = document.querySelector('.modal.open, .bottom-sheet.open');
    if (otherModalOpen) return;
    e.preventDefault();
    $('#quizBackBtn').click();
  });

  // [FOUR_FIX_PASS — Fix 4] Quiz back-navigation preserves prior answers
  // so users can see + change them. Reforge User Psychology: undo-by-default
  // + agency over commitment. Reforge Activation: reduces pre-completion
  // abandonment when a user realizes mid-quiz they answered something wrong.
  // Q1 hides the back button per spec (no previous question to go to).
  // The pre-select wiring at renderQuizStep:2620-2622 already handles
  // showing the user's prior answer when they re-enter a question.
  $('#quizBackBtn').addEventListener('click', () => {
    if (!state.quiz) { showScreen('profile-select'); return; }
    if (state.quiz.step === 0) { showScreen('quiz-intro'); return; }
    const fromIdx = state.quiz.step;
    state.quiz.step--;
    const toIdx = state.quiz.step;
    // [Fix 4] Mark the next answer-set as via-back-nav so we can attribute
    // any change event to the back-navigation flow.
    state.quiz.lastBackNav = true;
    save();
    trackEvent('onboarding_question_back_tapped', {
      from_question_index: fromIdx,
      to_question_index: toIdx
    });
    renderQuizStep();
  });

  // Per-question skip — applies that question's default, advances.
  $('#quizNoneBtn').addEventListener('click', () => {
    if (!state.quiz) return;
    const q = window.ONBOARDING_QUESTIONS[state.quiz.step];
    if (!q) return;
    state.quiz.answers[q.id] = q.default;
    state.quiz.skippedAt[q.id] = true;
    save();
    trackEvent('onboarding_question_skipped', { question_id: q.id });
    advanceQuiz();
  });

  // Multi-select Continue button.
  $('#quizContinueBtn').addEventListener('click', () => {
    if (!state.quiz) return;
    const q = window.ONBOARDING_QUESTIONS[state.quiz.step];
    if (!q) return;
    const picks = state.quiz.pendingMulti[q.id] || [];
    // [FOUR_FIX_PASS — Fix 4] Detect change vs prior answer for analytics.
    const prevValue = state.quiz.answers[q.id];
    const wasViaBackNav = state.quiz.lastBackNav === true;
    state.quiz.lastBackNav = false;
    state.quiz.answers[q.id] = picks.slice();
    save();
    const arrEq = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
    if (prevValue !== undefined && !arrEq(prevValue, picks)) {
      trackEvent('onboarding_question_changed', {
        question_id: q.id,
        old_value: prevValue,
        new_value: picks,
        was_via_back_navigation: wasViaBackNav
      });
      if (state.user && state.user.quizFirstCompletedAt) {
        trackEvent('onboarding_question_changed_post_first_completion', {
          question_id: q.id,
          old_value: prevValue,
          new_value: picks
        });
      }
    }
    const t0 = state.quiz.viewedAt[q.id];
    trackEvent('onboarding_question_answered', {
      question_id: q.id,
      answer_value: picks,
      time_to_answer_ms: t0 ? Date.now() - t0 : null
    });
    // [Hassan's call] Q10 dealbreaker: route to per-option text followup
    // when the user selected anything other than (or in addition to)
    // "nothing." Otherwise finishQuiz directly.
    // Note: state.quiz.answers.dealbreaker was just overwritten with picks
    // (array of ids) above. Use prevValue to recover any prior text-bearing
    // entries from before that overwrite — that's the correct source for
    // back-nav pre-fill.
    if (q.id === 'dealbreaker') {
      const nonNothing = picks.filter(p => p !== 'nothing');
      if (nonNothing.length === 0) {
        state.quiz.answers.dealbreaker = [];
        save();
        finishQuiz();
      } else {
        const priorEntries = Array.isArray(prevValue) && prevValue.some(v => v && typeof v === 'object')
          ? prevValue
          : [];
        state.quiz.answers.dealbreaker = nonNothing.map(kind => {
          const prior = priorEntries.find(d => d && d.kind === kind);
          return { kind, text: prior?.text || '' };
        });
        save();
        openDealbreakerFollowup(nonNothing);
      }
      return;
    }
    advanceQuiz();
  });

  // Q10 followup wiring.
  $('#dealbreakerBackBtn').addEventListener('click', () => {
    // Back from followup → back to Q10 itself (the kind picker).
    showScreen('quiz');
    renderQuizStep();
  });
  // [Hassan's call] Q10 multi-select followup. The Continue button collects
  // text from EACH per-kind input block. The Skip button bypasses with no
  // preserve hints (full creative freedom).
  $('#dealbreakerContinueBtn').addEventListener('click', () => {
    if (!state.quiz) return;
    const inputs = document.querySelectorAll('#dealbreakerInputs .dealbreaker-input');
    const entries = Array.from(inputs).map(inp => ({
      kind: inp.dataset.kind,
      text: (inp.value || '').trim().slice(0, 120)
    }));
    state.quiz.answers.dealbreaker = entries;
    save();
    const t0 = state.quiz.viewedAt.dealbreaker;
    trackEvent('onboarding_question_answered', {
      question_id: 'dealbreaker',
      answer_value: entries.map(e => ({ kind: e.kind, text_len: e.text.length })),
      time_to_answer_ms: t0 ? Date.now() - t0 : null
    });
    finishQuiz();
  });
  $('#dealbreakerSkipBtn').addEventListener('click', () => {
    if (!state.quiz) return;
    state.quiz.answers.dealbreaker = [];
    state.quiz.skippedAt.dealbreaker = true;
    save();
    trackEvent('onboarding_question_skipped', { question_id: 'dealbreaker' });
    finishQuiz();
  });

  function renderQuizStep() {
    if (!state.quiz) return;
    const questions = window.ONBOARDING_QUESTIONS || [];
    const q = questions[state.quiz.step];
    if (!q) return;

    // First-paint timestamp + analytic event — only if not already fired
    // for this question this session.
    if (!state.quiz.viewedAt[q.id]) {
      state.quiz.viewedAt[q.id] = Date.now();
      save();
      trackEvent('onboarding_question_viewed', {
        question_id: q.id,
        question_index: state.quiz.step
      });
    }

    // [FOUR_FIX_PASS — Fix 4] Hide back button on Q1 (no previous question).
    // visibility:hidden keeps the layout slot so the topbar doesn't jitter.
    const backBtn = $('#quizBackBtn');
    if (backBtn) backBtn.style.visibility = state.quiz.step === 0 ? 'hidden' : 'visible';

    // Progress: text + bar + dots
    $('#quizProgress').textContent = `${state.quiz.step + 1} / ${questions.length}`;
    const pct = ((state.quiz.step + 1) / questions.length) * 100;
    const fill = $('#qpbFill');
    if (fill) fill.style.width = pct + '%';
    renderQuizDots(state.quiz.step, questions.length);

    // Headline + subhead (multi-select questions show "Pick up to N").
    $('#quizQuestion').textContent = q.headline || q.q || '';
    const subEl = $('#quizSubhead');
    if (q.subhead) {
      subEl.textContent = q.subhead;
      subEl.hidden = false;
    } else {
      subEl.hidden = true;
    }

    // Options grid — variant by image_kind. Per Hassan's spec, image slots
    // stay clean placeholders until images land in the config.
    const opts = $('#quizOptions');
    opts.innerHTML = '';
    const kind = q.image_kind || 'icon';
    opts.dataset.kind = kind;
    opts.dataset.qType = q.type;

    const isMulti = q.type === 'multi_select_max_2' || q.type === 'multi_select_max_3' || q.type === 'multi_select_with_followup';
    const currentPicks = isMulti
      ? (state.quiz.pendingMulti[q.id] || state.quiz.answers[q.id] || []).slice()
      : null;

    // [Hassan's call] Text-only stacked-pillar layout for budget_tier (Q6)
    // + avoid (Q9) + dealbreaker (Q10). Same shape as Q6, same rationale:
    // descriptive copy, not visual categories — image/icon slots add noise
    // without value. Layout: stacked full-width pillars (qo-stack) instead
    // of the 2-col grid.
    const TEXT_ONLY_QUESTIONS = ['avoid', 'dealbreaker'];
    const isTextOnly = TEXT_ONLY_QUESTIONS.includes(q.id);
    opts.classList.toggle('qo-stack', isTextOnly);

    // [Hassan's call] Q2 color_appetite: the palette PNGs are 2:1 horizontal
    // swatches. qo-palette switches to single-column wide cards (aspect 2:1).
    // Caption sits BELOW the photo (not overlay) per the global mandate to
    // keep all captions off the images.
    const isPalette = q.id === 'color_appetite';
    opts.classList.toggle('qo-palette', isPalette);

    // [Hassan's call] All photo questions get caption-below treatment so
    // text never overlays the image. qo-photo-text applies to any question
    // whose options carry images (Q1 vibe, Q3 decor, Q5 light, Q7 textures,
    // Q8 room_use). Q7 specifically gets the --square modifier — its
    // bottom-left "Sleek modern" sample is square (1:1) and Hassan called
    // it ideal; matching all Q7 cards to 1:1 with cover-fill makes every
    // box fill edge-to-edge like that one.
    const isPhotoText = !isPalette && !isTextOnly && q.options.some(o => o.image);
    opts.classList.toggle('qo-photo-text', isPhotoText);
    opts.classList.toggle('qo-photo-text--square', q.id === 'materials');

    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-option-card q-' + kind + (isTextOnly ? ' q-text' : '');
      btn.style.setProperty('--stagger-i', idx);
      btn.dataset.optId = opt.id;

      // Visual area — skip entirely for text-only questions; otherwise
      // prefer real photo (opt.image) over icon SVG over placeholder.
      // Priority inverted from earlier behavior so a Q5/Q8 option with
      // image_kind: 'icon' STILL renders its photo when one is set —
      // image is the strongest signal.
      if (!isTextOnly) {
        const visual = document.createElement('div');
        if (opt.image) {
          visual.className = 'qoc-photo';
          visual.style.backgroundImage = `url('${opt.image}')`;
        } else if (kind === 'icon' || opt.svg) {
          visual.className = 'qoc-icon';
          visual.innerHTML = window.QUIZ_SVGS[opt.svg] || defaultPlaceholderSvg();
        } else {
          // Image placeholder slot — Hassan to drop in real images via the
          // ONBOARDING_QUESTIONS config when ready. Per spec: "subtle brand-
          // brown rectangle with a small icon and the option label inside."
          visual.className = 'qoc-photo qoc-photo--placeholder';
          visual.innerHTML = `
            <span class="qoc-placeholder-icon" aria-hidden="true">${defaultPlaceholderSvg()}</span>
          `;
          visual.dataset.imagePending = 'true';
        }
        btn.appendChild(visual);
      }

      const label = document.createElement('div');
      label.className = 'qoc-label';
      label.innerHTML = `<span class="qoc-label-text">${opt.label}</span>`;
      btn.appendChild(label);

      // Pre-select state for back-navigation.
      if (isMulti && currentPicks.includes(opt.id)) btn.classList.add('selected');
      if (!isMulti && state.quiz.answers[q.id] === opt.id) btn.classList.add('selected');

      btn.addEventListener('click', () => {
        if (isMulti) handleMultiSelectTap(q, opt, btn);
        else handleSingleSelectTap(q, opt, btn);
      });

      opts.appendChild(btn);
    });

    // Multi-select Continue actions visibility.
    const multiActions = $('#quizMultiActions');
    if (isMulti) {
      multiActions.hidden = false;
      updateMultiCounter(q);
    } else {
      multiActions.hidden = true;
    }

    // Skip button reveal-after-1.5s per spec. Reforge User Psychology:
    // delaying the skip button prevents reflexive skipping before the user
    // reads the question.
    const skipBtn = $('#quizNoneBtn');
    skipBtn.dataset.revealed = 'false';
    clearTimeout(_quizSkipRevealTimer);
    _quizSkipRevealTimer = setTimeout(() => {
      skipBtn.dataset.revealed = 'true';
    }, 1500);
  }

  function renderQuizDots(currentStep, total) {
    const wrap = document.getElementById('quizProgressDots');
    if (!wrap) return;
    wrap.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('span');
      dot.className = 'qpd-dot' + (i < currentStep ? ' qpd-done' : i === currentStep ? ' qpd-current' : '');
      wrap.appendChild(dot);
    }
  }

  function defaultPlaceholderSvg() {
    // Question-mark fallback. Mirrors the scope-surprise icon shape used
    // on Q4 ("Surprise me") so every undefined-SVG / undefined-image
    // quiz option reads as "we'll use a default" rather than "broken
    // image." Per Hassan's call to make all placeholder cards match the
    // Q4 question mark. Reforge Visual Design (Dim 01): consistent
    // visual signal for "default / I don't know / let the AI decide."
    return `<svg viewBox="0 0 100 100" width="22" height="22" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M32 36 Q32 14 50 14 Q68 14 68 32 Q68 44 52 50 Q50 52 50 62"/><circle cx="50" cy="80" r="4" fill="currentColor"/></svg>`;
  }

  function handleSingleSelectTap(q, opt, btn) {
    const opts = btn.parentElement;
    opts.querySelectorAll('.quiz-option-card').forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
    // [FOUR_FIX_PASS — Fix 4] Detect change vs prior answer for analytics.
    const prevValue = state.quiz.answers[q.id];
    const wasViaBackNav = state.quiz.lastBackNav === true;
    state.quiz.lastBackNav = false; // consume the flag once
    state.quiz.answers[q.id] = opt.id;
    save();
    if (prevValue !== undefined && prevValue !== opt.id) {
      trackEvent('onboarding_question_changed', {
        question_id: q.id,
        old_value: prevValue,
        new_value: opt.id,
        was_via_back_navigation: wasViaBackNav
      });
      // [Fix 4] Self-correction tracking — fires only after first completion.
      if (state.user && state.user.quizFirstCompletedAt) {
        trackEvent('onboarding_question_changed_post_first_completion', {
          question_id: q.id,
          old_value: prevValue,
          new_value: opt.id
        });
      }
    }
    const t0 = state.quiz.viewedAt[q.id];
    trackEvent('onboarding_question_answered', {
      question_id: q.id,
      answer_value: opt.id,
      time_to_answer_ms: t0 ? Date.now() - t0 : null
    });
    // Q10 dealbreaker is now multi_select_with_followup; routed through
    // the multi-select Continue handler instead of single-select tap.
    // No special-case needed here.
    setTimeout(() => advanceQuiz(), 240);
  }

  function handleMultiSelectTap(q, opt, btn) {
    const cap = q.max_selections || 999;
    const exclusiveId = q.exclusive_option_id;
    const picks = (state.quiz.pendingMulti[q.id] || state.quiz.answers[q.id] || []).slice();
    const wasSelected = picks.includes(opt.id);

    if (exclusiveId) {
      // Q9 "Nothing — show me anything" deselects others when picked; any
      // other pick deselects 'nothing'. Reforge Loss Aversion: explicit
      // exclusive option lets users articulate "I'm fine with anything."
      if (opt.id === exclusiveId) {
        // Toggle exclusive: either select-only-this or deselect.
        if (wasSelected) {
          state.quiz.pendingMulti[q.id] = [];
        } else {
          state.quiz.pendingMulti[q.id] = [opt.id];
        }
      } else {
        // Picking a non-exclusive option clears the exclusive.
        let next = picks.filter(p => p !== exclusiveId);
        if (wasSelected) next = next.filter(p => p !== opt.id);
        else next.push(opt.id);
        // Cap enforcement — drop the oldest if over.
        while (next.length > cap) next.shift();
        state.quiz.pendingMulti[q.id] = next;
      }
    } else {
      // Plain multi-select with cap.
      let next = wasSelected ? picks.filter(p => p !== opt.id) : picks.concat([opt.id]);
      while (next.length > cap) next.shift();
      state.quiz.pendingMulti[q.id] = next;
    }
    save();

    // Repaint selected states.
    const opts = btn.parentElement;
    const set = new Set(state.quiz.pendingMulti[q.id]);
    opts.querySelectorAll('.quiz-option-card').forEach(c => {
      c.classList.toggle('selected', set.has(c.dataset.optId));
    });
    updateMultiCounter(q);
  }

  function updateMultiCounter(q) {
    // Counter element ("X of N selected") was removed per Hassan's call —
    // function name kept since it's called from multiple sites and still
    // gates the Continue button's enabled state.
    const picks = (state.quiz.pendingMulti[q.id] || state.quiz.answers[q.id] || []);
    const cont = document.getElementById('quizContinueBtn');
    if (cont) cont.disabled = picks.length === 0;
  }

  function advanceQuiz() {
    if (!state.quiz) return;
    const total = (window.ONBOARDING_QUESTIONS || []).length;
    state.quiz.step++;
    save();
    if (state.quiz.step >= total) {
      finishQuiz();
    } else {
      renderQuizStep();
    }
  }

  // [Hassan's call] Q10 followup — render one text input block per kind
  // the user picked on Q10. Each block has its own headline + textarea +
  // char counter. The user can fill any subset; blank blocks save as
  // empty text (still preserved in the array, just no preserve hint).
  function openDealbreakerFollowup(kinds) {
    const q = window.ONBOARDING_QUESTIONS.find(x => x.id === 'dealbreaker');
    if (!q) return;
    const list = Array.isArray(kinds) ? kinds : [kinds];
    const headlineByKind = {
      furniture: 'Which piece of furniture?',
      color:     'Which color or paint?',
      artwork:   'Which artwork or item?'
    };
    const placeholderByKind = q.followup?.placeholder_by_kind || {};
    const host = $('#dealbreakerInputs');
    if (host) {
      host.innerHTML = '';
      // Pre-fill from any prior answer entries (back-nav restoration).
      const priorEntries = Array.isArray(state.quiz.answers.dealbreaker)
        ? state.quiz.answers.dealbreaker
        : [];
      list.forEach(kind => {
        const priorText = priorEntries.find(e => e && e.kind === kind)?.text || '';
        const block = document.createElement('div');
        block.className = 'dealbreaker-block';
        block.dataset.kind = kind;
        block.innerHTML = `
          <h4 class="dealbreaker-block-headline">${headlineByKind[kind] || 'Tell us more'}</h4>
          <textarea class="dealbreaker-input" data-kind="${kind}" maxlength="120" rows="2" placeholder="${placeholderByKind[kind] || 'Describe what to keep…'}"></textarea>
          <div class="dealbreaker-meta muted small">
            <span class="dealbreaker-char-count">${priorText.length} / 120</span>
          </div>
        `;
        const ta = block.querySelector('textarea');
        ta.value = priorText;
        const cc = block.querySelector('.dealbreaker-char-count');
        ta.addEventListener('input', () => {
          cc.textContent = `${ta.value.length} / 120`;
        });
        host.appendChild(block);
      });
      // Focus the first input so the user can type immediately.
      const first = host.querySelector('textarea');
      if (first) setTimeout(() => first.focus(), 80);
    }
    showScreen('quiz-dealbreaker');
  }

  function finishQuiz() {
    const p = state.profiles.find(x => x.id === state.quiz.profileId);
    const total = (window.ONBOARDING_QUESTIONS || []).length;
    const totalAnswered = Object.keys(state.quiz.answers || {}).length;
    const totalSkipped = Object.values(state.quiz.skippedAt || {}).filter(Boolean).length;
    const totalTimeMs = state.quiz.startedAt ? Date.now() - state.quiz.startedAt : null;

    if (p) {
      // Merge user answers with defaults for any unanswered fields.
      p.answers = { ...ONBOARDING_DEFAULTS(), ...state.quiz.answers };
      // Keep legacy fields synced for the catalog picker — see Layer 2.
      p.styles = deriveStylesFromAnswers(p.answers);
      p.colors = deriveColorsFromAnswers(p.answers);
      // CONFLICT 2 mapping: scope === 'just_furniture' → keepMode default.
      p.keepExisting = p.answers.scope === 'just_furniture';
      p.seenFinale = true; // quiz completion is the celebration moment
      save();
    }

    // [FOUR_FIX_PASS — Fix 4] Mark first-completion timestamp once. Used to
    // gate the `onboarding_question_changed_post_first_completion` event so
    // we measure self-correction (Reforge User Psychology — undo/agency).
    if (state.user && !state.user.quizFirstCompletedAt) {
      state.user.quizFirstCompletedAt = Date.now();
      save();
    }

    trackEvent('onboarding_completed', {
      total_questions_answered: totalAnswered,
      total_skipped: totalSkipped,
      total_time_ms: totalTimeMs,
      total_questions: total
    });

    // Build the AI prompt now (scaffolding) — logs to state._lastAIPrompt
    // so the future Replicate-backed backend can wire to it without a
    // refactor. See buildAIPrompt() in Layer 4.
    if (p && typeof buildAIPrompt === 'function') {
      try {
        state._lastAIPrompt = buildAIPrompt(p.answers, state.draft || null);
        save();
      } catch (err) { /* prompt-builder is scaffolding; ignore */ }
    }

    state.quiz = null;
    save();
    // Full furniture-rain finale at quiz completion, then route to capture.
    const topStyles = (p?.styles || []).slice(0, 3);
    playQuizFinale(topStyles, () => {
      showScreen('capture');
      prepareCapture();
    });
  }

  // ---------- Quiz finale animation ----------
  function playQuizFinale(topStyles, onDone) {
    const scrim = document.getElementById('quizFinale');
    const rain  = document.getElementById('qfRain');
    const sub   = document.getElementById('qfSub');
    const cont  = document.getElementById('qfContinue');
    if (!scrim || !rain || !cont) { onDone && onDone(); return; }

    // Update subhead with the top styles
    const styleLabels = (topStyles || [])
      .map(id => (window.STYLES || []).find(s => s.id === id)?.label || id)
      .slice(0, 3);
    if (sub) sub.textContent = styleLabels.length
      ? `You lean ${styleLabels.join(' · ')}. Your palette is ready.`
      : "We mixed your answers into a personal palette.";

    // Tiny themed furniture glyphs (simple outlined silhouettes).
    const GLYPHS = [
      // chair
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M6 12V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7"/><path d="M4 12h16"/><path d="M7 12v9M17 12v9"/></svg>`,
      // lamp
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M8 3h8l2 6H6z"/><path d="M12 9v9"/><path d="M7 21h10"/></svg>`,
      // sofa
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M3 14a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5H3z"/><path d="M6 12V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/><path d="M6 19v2M18 19v2"/></svg>`,
      // table
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M3 9h18"/><path d="M5 9v12M19 9v12"/><path d="M8 13h8"/></svg>`,
      // plant / leaf
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M12 21v-8"/><path d="M12 13C7 12 5 8 5 4c4 0 8 2 9 7"/><path d="M12 13c5-1 7-5 7-9-4 0-8 2-9 7"/></svg>`,
      // frame / art
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 15l5-5 5 5"/><circle cx="15" cy="9" r="1.5"/></svg>`,
      // rug (oval)
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="12" cy="12" rx="9" ry="5"/><ellipse cx="12" cy="12" rx="5.5" ry="2.5"/></svg>`,
      // bookshelf
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M4 9h16M4 15h16"/></svg>`
    ];

    // Prepare a VERY dense batch of pieces so the screen fills with only
    // small gaps between furniture. 240 is the target; we can go slightly
    // lower on tiny viewports to avoid overdraw lag.
    rain.innerHTML = '';
    const W = window.innerWidth;
    const H = window.innerHeight;
    const COUNT = Math.min(480, Math.max(280, Math.floor((W * H) / 2400)));
    const pieces = [];
    const sizes = ['s', 's', 'm', 'm', 'm', 'l']; // weighted — more smalls for tight packing
    for (let i = 0; i < COUNT; i++) {
      const el = document.createElement('div');
      el.className = 'qf-piece';
      el.setAttribute('data-size', sizes[i % sizes.length]);
      el.innerHTML = GLYPHS[i % GLYPHS.length];
      const leftPct = Math.random() * 97 + 1.5;                      // 1.5%..98.5%
      const spin  = Math.floor((Math.random() * 720) - 360);
      // Fill across the full height — 0%..97%
      const landY = Math.floor(H * Math.random() * 0.97);
      el.style.left = leftPct + '%';
      el.style.setProperty('--spin', spin + 'deg');
      // Raw NUMBER (no 'px') so we can math it in pop keyframe
      el.style.setProperty('--landY', landY);
      rain.appendChild(el);
      pieces.push({ el, leftPct, landY, spin });
    }

    // Assign drop delays in BOTTOM-UP fill order: pieces that land LOWEST
    // (largest landY) drop FIRST — so the furniture "falls to the floor"
    // right away, then the pile grows upward. Small jitter keeps it from
    // looking mechanical.
    pieces.sort((a, b) => b.landY - a.landY); // descending: bottom first
    const STAGGER_TOTAL = 1400;   // faster fill (was 2400ms)
    const JITTER = 140;
    pieces.forEach((p, i) => {
      const t = i / (pieces.length - 1 || 1);
      const base = Math.floor(t * STAGGER_TOTAL);
      const jitter = Math.floor(Math.random() * JITTER) - (JITTER / 2);
      const delay = Math.max(0, base + jitter);
      p.el.style.setProperty('--delay', delay + 'ms');
      p.delay = delay;
    });

    // Show and start raining
    scrim.classList.remove('popping', 'reveal');
    scrim.setAttribute('aria-hidden', 'false');
    scrim.classList.add('open');
    // next frame, start rain
    requestAnimationFrame(() => scrim.classList.add('raining'));

    // Pop after rain completes. With bottom-up stagger the last (topmost)
    // piece lands at STAGGER_TOTAL (1400ms) + drop duration (1400ms) =
    // ~2800ms. Hold the fully-filled screen ~500ms so the fill registers.
    const popTimer = setTimeout(() => {
      // For each piece: burst outward AWAY from screen center, based on
      // where it landed. dy is the *delta* added to landY in the keyframe
      // so the same DOM element keeps going from its current position.
      pieces.forEach(({ el, leftPct, landY }) => {
        const px = (leftPct / 100) * W;
        const cx = W / 2, cy = H / 2;
        const vx = px - cx;
        const vy = landY - cy;
        const mag = Math.sqrt(vx * vx + vy * vy) || 1;
        const dx  = (vx / mag) * (320 + Math.random() * 220);
        const dyo = (vy / mag) * (320 + Math.random() * 220) - 120; // slight upward bias
        el.style.setProperty('--dx', dx.toFixed(0));
        el.style.setProperty('--dy', dyo.toFixed(0));
      });
      scrim.classList.remove('raining');
      scrim.classList.add('popping');

      // Mid-explosion theme flicker: opposite -> back -> opposite -> back
      // Light start  -> Dark, Light, Dark, Light
      // Dark  start  -> Light, Dark, Light, Dark
      const userTheme = (state.settings && state.settings.theme === 'dark') ? 'dark' : 'light';
      const opposite  = userTheme === 'dark' ? 'light' : 'dark';
      const html = document.documentElement;
      const flicker = [
        { at:  60, theme: opposite },
        { at: 180, theme: userTheme },
        { at: 300, theme: opposite },
        { at: 460, theme: userTheme }, // settle on the user's actual theme
      ];
      const timers = flicker.map(f =>
        setTimeout(() => html.setAttribute('data-theme', f.theme), f.at)
      );
      // Stash so cleanup can clear them if user closes early
      scrim.__flickerTimers = timers;

      // Reveal the congrats card after the pop peaks (and after the flicker settles)
      setTimeout(() => scrim.classList.add('reveal'), 600);
    }, 3300);

    // Continue → cleanup + proceed
    const cleanup = () => {
      clearTimeout(popTimer);
      // Cancel any pending theme flicker so it can't fire after we leave
      if (scrim.__flickerTimers) {
        scrim.__flickerTimers.forEach(t => clearTimeout(t));
        scrim.__flickerTimers = null;
      }
      // Make absolutely sure the user's theme is restored
      const userTheme = (state.settings && state.settings.theme === 'dark') ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', userTheme);
      cont.removeEventListener('click', onContinue);
      scrim.classList.remove('open', 'raining', 'popping', 'reveal');
      scrim.setAttribute('aria-hidden', 'true');
      rain.innerHTML = '';
      onDone && onDone();
    };
    function onContinue() { cleanup(); }
    cont.addEventListener('click', onContinue, { once: true });
  }

  // ---------- Preferences ----------
  function openPreferences(profileId) {
    const p = state.profiles.find(x => x.id === profileId);
    if (!p) return;
    $('#prefTitle').textContent = `${p.name} — Preferences`;

    // Wire up the editable name input on the profile card
    const nameInput = document.getElementById('ppNameInput');
    if (nameInput) {
      nameInput.value = p.name || '';
      nameInput.oninput = () => {
        const v = nameInput.value.trim();
        if (v) {
          p.name = v;
          $('#prefTitle').textContent = `${v} — Preferences`;
          const initEl = document.getElementById('ppInitials');
          if (initEl) initEl.textContent = (v.match(/\d+|\S/) || ['?'])[0];
        }
      };
      nameInput.onchange = () => { save(); };
      nameInput.onblur   = () => { save(); };
    }

    setupProfilePicture(p);
    // [10-Q model] Replaced the styles + colors chip grids with the
    // collapsible answers editor. Custom-color picker preserved in DOM
    // (hidden) for future Pro feature per CONFLICT 1.
    renderAnswersEditor(p);
    // [Batch 5 Part 2 — Dim 02 D02-5 modified] Style-profile completeness
    // gauge mounted at the top of the answers editor parent. Renders the
    // % bar + identity summary; SVG fingerprint deferred.
    const answersEditorEl = document.getElementById('answersEditor');
    if (answersEditorEl?.parentElement) {
      renderStyleProfileGauge(p, answersEditorEl.parentElement);
    }
    // [BUDGET_RESET_PASS] setupBudgetSlider call removed — budget moved out
    // of preferences entirely.

    showScreen('preferences');

    // [First-redesign tutorial — fallback trigger] If the auto-route from
    // results never fired (user navigated here manually first, or the queue
    // was cleared because they left results before the 6s timer), still
    // fire the tutorial on this first preferences visit. Idempotent — the
    // controller checks state.user.firstRedesignTutorialSeen before running.
    if (typeof maybeFireTutorialOnPreferencesEntry === 'function') {
      maybeFireTutorialOnPreferencesEntry();
    }
  }

  // ---------- Profile picture ----------
  function setupProfilePicture(profile) {
    const avatarBox = $('#ppAvatar');
    const img = $('#ppImage');
    const initials = $('#ppInitials');
    const removeBtn = $('#ppRemoveBtn');
    const cam = $('#ppCameraInput');
    const gal = $('#ppGalleryInput');

    const refresh = () => {
      const init = (profile.name.match(/\d+|\S/) || ['?'])[0];
      initials.textContent = init;
      const idx = getProfileIdx(profile.id);
      if (profile.avatar) {
        img.src = profile.avatar;
        img.classList.add('has-image');
        avatarBox.classList.add('has-photo');
        avatarBox.style.background = '';
        removeBtn.style.display = '';
      } else {
        img.classList.remove('has-image');
        img.removeAttribute('src');
        avatarBox.classList.remove('has-photo');
        avatarBox.style.background = avatarGradient(idx);
        removeBtn.style.display = 'none';
      }
    };
    refresh();

    const handleFile = (file) => {
      if (!file) return;
      // [Dim 09 Section B.4 — error states specify constraint + recovery
      //  in user language. Per VOICE.md: errors must explain what
      //  happened and offer a path back to value.]
      if (!file.type.startsWith('image/')) { toast("That file isn't a photo. Try a JPG or PNG."); return; }
      if (file.size > 12 * 1024 * 1024) { toast('Image is over 12MB. Try a smaller photo or screenshot.'); return; }
      const reader = new FileReader();
      reader.onload = e => {
        const tmp = new Image();
        tmp.onload = () => {
          // Center-crop to square, scale to 240×240, JPEG ~85% to keep localStorage manageable.
          const SIZE = 240;
          const min = Math.min(tmp.naturalWidth, tmp.naturalHeight);
          const sx = (tmp.naturalWidth - min) / 2;
          const sy = (tmp.naturalHeight - min) / 2;
          const canvas = document.createElement('canvas');
          canvas.width = SIZE; canvas.height = SIZE;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(tmp, sx, sy, min, min, 0, 0, SIZE, SIZE);
          profile.avatar = canvas.toDataURL('image/jpeg', 0.85);
          save();
          refresh();
          toast('Profile photo updated');
        };
        tmp.onerror = () => toast('Could not read image');
        tmp.src = e.target.result;
      };
      reader.onerror = () => toast('Could not read file');
      reader.readAsDataURL(file);
    };

    cam.onchange = e => { handleFile(e.target.files[0]); cam.value = ''; };
    gal.onchange = e => { handleFile(e.target.files[0]); gal.value = ''; };
    removeBtn.onclick = () => {
      profile.avatar = null;
      save();
      refresh();
      toast('Photo removed');
    };

    // Click the avatar itself → open the photo source chooser modal.
    avatarBox.onclick = () => openPhotoSourceModal(profile, refresh);
  }

  // ---------- Photo source modal ----------
  function openPhotoSourceModal(profile, onAfter) {
    const m = $('#photoSourceModal');
    const removeBtn = $('#psRemove');
    removeBtn.style.display = profile.avatar ? '' : 'none';
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');

    const close = () => {
      m.classList.remove('open');
      m.setAttribute('aria-hidden', 'true');
    };

    // Re-bind handlers each open so they use the current profile
    $('#psTakePhoto').onclick  = () => { close(); $('#ppCameraInput').click(); };
    $('#psFromGallery').onclick= () => { close(); $('#ppGalleryInput').click(); };
    $('#psRemove').onclick     = () => {
      profile.avatar = null;
      save();
      onAfter && onAfter();
      close();
      toast('Photo removed');
    };
    $('#psCancel').onclick = close;
    $('#psClose').onclick  = close;
    m.onclick = e => { if (e.target.id === 'photoSourceModal') close(); };
  }

  // ============================================================
  // [BUDGET_RESET_PASS — Phase 2 helpers]
  // [Hassan's call — low-floor expansion]
  // Per-generation budget slider. Range $50 → $20,000+. Variable step:
  //   $50–$500       → $10 increments  (accessory-tier shopping)
  //   $500–$1,500    → $50 increments
  //   $1,500–$5,000  → $100 increments
  //   $5,000–$10,000 → $500 increments
  //   $10,000+       → $1,000 increments
  // Default $3,000. Value lives only in state.draft.budget until generation;
  // never stored on profile/user.
  //
  // Reforge: Personalization (Dim 07) — granular control at the low end
  // matches user intent (real $50 accessory shoppers exist); User Psychology
  // (Dim 02) — step granularity reflects how humans think about money in
  // each band ($20 differences matter at $80, not at $15,200).
  // ============================================================
  const SLIDER_BUDGET_MIN     = 50;
  const SLIDER_BUDGET_MAX     = 20000;
  const SLIDER_BUDGET_DEFAULT = 3000;
  function sliderToBudget(v) {
    // v is 0-1000 (the input element's range).
    const t = Math.max(0, Math.min(1000, v)) / 1000;
    if (t >= 0.995) return Infinity; // top-of-slider = "no cap"
    const scaled = t / 0.995;
    const lo = Math.log(SLIDER_BUDGET_MIN);
    const hi = Math.log(SLIDER_BUDGET_MAX);
    const raw = Math.exp(lo + (hi - lo) * scaled);
    // Variable step rounding — finer at the low end where small dollar
    // differences are meaningful, coarser at the top where they aren't.
    if (raw < 500)   return Math.max(SLIDER_BUDGET_MIN, Math.round(raw / 10) * 10);
    if (raw < 1500)  return Math.round(raw / 50) * 50;
    if (raw < 5000)  return Math.round(raw / 100) * 100;
    if (raw < 10000) return Math.round(raw / 500) * 500;
    return Math.round(raw / 1000) * 1000;
  }
  function budgetToSlider(amount) {
    if (!amount || amount === Infinity) return 1000;
    const lo = Math.log(SLIDER_BUDGET_MIN);
    const hi = Math.log(SLIDER_BUDGET_MAX);
    const t = (Math.log(Math.max(SLIDER_BUDGET_MIN, Math.min(SLIDER_BUDGET_MAX, amount))) - lo) / (hi - lo);
    return Math.round(Math.max(0, Math.min(1, t)) * 0.995 * 1000);
  }
  function formatBudget(amount) {
    if (amount == null) return '—';
    if (amount === Infinity || amount >= SLIDER_BUDGET_MAX) return '$' + SLIDER_BUDGET_MAX.toLocaleString() + '+';
    return '$' + amount.toLocaleString();
  }
  // Get the current slider value at any moment. Falls back to default.
  function getCurrentBudget() {
    const v = state.draft && typeof state.draft.budget === 'number' ? state.draft.budget : SLIDER_BUDGET_DEFAULT;
    return v;
  }
  // Build the budget-band copy for the AI prompt — Reforge prompt-engineering
  // pattern: explicit budget framing produces more consistent results than
  // implicit numeric values. Bands match the spec.
  // [Hassan's call — low-floor expansion] Added the sub-$250 accessory tier.
  // At $50–$250 the user is genuinely shopping for accessories or a single
  // small item, not redesigning a room — the prompt should respond to that
  // honestly rather than half-hearting a full redesign with cheap furniture.
  // Per Reforge Conversion Optimization (Dim 03): meeting users where they
  // actually are increases relevance and affiliate conversion at the low end.
  function budgetBandText(amount) {
    if (amount == null) amount = SLIDER_BUDGET_DEFAULT;
    if (amount === Infinity) return 'no budget cap — show the dream first; aspirational, statement pieces';
    if (amount < 250)         return 'an accessory-tier budget around $' + amount.toLocaleString() + ' — focus on small impactful additions like cushions, art, plants, or a single decor piece. Do not attempt a full furniture redesign at this budget; surface a curated accessory-only refresh (thrift, Facebook Marketplace, single-item swaps)';
    if (amount < 1500)        return 'a tight budget around $' + amount.toLocaleString() + ' — emphasize high-low mix and IKEA, Target tier alternatives';
    if (amount < 5000)        return 'a smart mid-tier budget around $' + amount.toLocaleString() + ' — Wayfair, West Elm sale items, smart mix of high and low';
    if (amount < 15000)       return 'a quality budget around $' + amount.toLocaleString() + ' — CB2, Crate & Barrel, real wood, durable construction';
    return                           'an investment budget around $' + amount.toLocaleString() + ' — RH, Design Within Reach, statement furniture, designer pieces';
  }
  window.FurnishGetCurrentBudget = getCurrentBudget;
  // ============================================================
  // 10-Q answers editor — preferences-screen surface
  // ============================================================
  // Renders all 10 onboarding questions as collapsible cards. Each card
  // shows the current selection and expands to the same option grid the
  // quiz uses. Tap a different option → save immediately, fire
  // preferences_edited_post_redesign analytic, collapse the card.
  // The first-redesign tutorial coachmarks point at three specific cards
  // (vibe, materials, scope) — see Layer 6. (Was budget; Q6 removed in
  // BUDGET_RESET_PASS, scope is the highest-leverage replacement.)
  // ============================================================
  function renderAnswersEditor(profile) {
    const root = document.getElementById('answersEditor');
    if (!root) return;
    root.innerHTML = '';
    if (!profile.answers) profile.answers = {};
    const questions = window.ONBOARDING_QUESTIONS || [];
    questions.forEach(q => {
      const card = buildAnswerCard(q, profile);
      root.appendChild(card);
    });
  }

  function buildAnswerCard(q, profile) {
    const card = document.createElement('section');
    card.className = 'answer-card';
    card.dataset.qId = q.id;

    const summary = document.createElement('button');
    summary.type = 'button';
    summary.className = 'answer-card-summary';
    summary.setAttribute('aria-expanded', 'false');

    const head = document.createElement('div');
    head.className = 'ac-head';
    head.innerHTML = `
      <div class="ac-headline">${q.headline}</div>
      <div class="ac-current" data-current></div>
    `;
    summary.appendChild(head);
    const chev = document.createElement('span');
    chev.className = 'ac-chev';
    chev.setAttribute('aria-hidden', 'true');
    chev.innerHTML = '›';
    summary.appendChild(chev);

    const detail = document.createElement('div');
    detail.className = 'answer-card-detail';
    detail.hidden = true;

    summary.addEventListener('click', () => {
      const isOpen = !detail.hidden;
      // Close any other open card (single-open accordion).
      document.querySelectorAll('.answer-card .answer-card-detail').forEach(d => { d.hidden = true; });
      document.querySelectorAll('.answer-card .answer-card-summary').forEach(s => s.setAttribute('aria-expanded', 'false'));
      if (!isOpen) {
        detail.hidden = false;
        summary.setAttribute('aria-expanded', 'true');
      }
    });

    card.appendChild(summary);
    card.appendChild(detail);
    paintAnswerCardSummary(card, q, profile);
    paintAnswerCardDetail(card, q, profile);
    return card;
  }

  function paintAnswerCardSummary(card, q, profile) {
    const cur = card.querySelector('[data-current]');
    if (!cur) return;
    const a = profile.answers || {};
    const v = a[q.id];
    let label = '—';
    if (q.type === 'single_select_with_followup') {
      const kind = v?.kind || 'nothing';
      const found = q.options.find(o => o.id === kind);
      label = found ? found.label : '—';
      if (v?.text) label += ` · "${v.text}"`;
    } else if (q.type === 'multi_select_max_2' || q.type === 'multi_select_max_3') {
      const ids = Array.isArray(v) ? v : [];
      label = ids.length ? ids.map(id => q.options.find(o => o.id === id)?.label || id).join(' · ') : '—';
    } else {
      const found = q.options.find(o => o.id === v);
      label = found ? found.label : '—';
    }
    cur.textContent = label;
  }

  function paintAnswerCardDetail(card, q, profile) {
    const detail = card.querySelector('.answer-card-detail');
    if (!detail) return;
    detail.innerHTML = '';
    if (q.subhead) {
      const sh = document.createElement('p');
      sh.className = 'muted small';
      sh.textContent = q.subhead;
      detail.appendChild(sh);
    }
    const grid = document.createElement('div');
    grid.className = 'answer-options';
    grid.dataset.kind = q.image_kind || 'icon';
    const isMulti = q.type === 'multi_select_max_2' || q.type === 'multi_select_max_3' || q.type === 'multi_select_with_followup';
    const a = profile.answers || {};
    const currentSingle = a[q.id];
    const currentMulti = isMulti && Array.isArray(a[q.id]) ? a[q.id].slice() : [];
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'answer-option';
      btn.dataset.optId = opt.id;
      const isSel = isMulti
        ? currentMulti.includes(opt.id)
        : (q.type === 'single_select_with_followup' ? a[q.id]?.kind === opt.id : currentSingle === opt.id);
      if (isSel) btn.classList.add('selected');
      // Visual area
      const visual = document.createElement('span');
      visual.className = 'ao-visual';
      if (opt.image) {
        visual.style.backgroundImage = `url('${opt.image}')`;
        visual.classList.add('ao-visual--photo');
      } else if (opt.svg) {
        visual.innerHTML = window.QUIZ_SVGS[opt.svg] || defaultPlaceholderSvg();
      } else {
        visual.innerHTML = defaultPlaceholderSvg();
        visual.dataset.imagePending = 'true';
      }
      btn.appendChild(visual);
      const label = document.createElement('span');
      label.className = 'ao-label';
      label.textContent = opt.label;
      btn.appendChild(label);
      btn.addEventListener('click', () => handleAnswerCardTap(card, q, opt, profile));
      grid.appendChild(btn);
    });
    detail.appendChild(grid);

    // Q10 followup text input inline.
    if (q.type === 'single_select_with_followup' && a[q.id]?.kind && a[q.id].kind !== 'nothing') {
      const wrap = document.createElement('div');
      wrap.className = 'answer-followup';
      wrap.innerHTML = `
        <label class="muted small" for="answerFollowup_${q.id}">Tell us more (optional)</label>
        <textarea id="answerFollowup_${q.id}" class="dealbreaker-input" maxlength="120" rows="2"></textarea>
      `;
      detail.appendChild(wrap);
      const ta = wrap.querySelector('textarea');
      ta.value = a[q.id].text || '';
      ta.addEventListener('input', () => {
        a[q.id] = { kind: a[q.id].kind, text: ta.value.slice(0, 120) };
        save();
        paintAnswerCardSummary(card, q, profile);
      });
    }

    if (isMulti) {
      const meta = document.createElement('div');
      meta.className = 'answer-multi-meta muted small';
      const cap = q.max_selections || 0;
      const cur = (profile.answers[q.id] || []).length;
      meta.textContent = `${cur} of ${cap} selected`;
      detail.appendChild(meta);
    }
  }

  function handleAnswerCardTap(card, q, opt, profile) {
    if (!profile.answers) profile.answers = {};
    const oldVal = JSON.parse(JSON.stringify(profile.answers[q.id] ?? null));

    if (q.type === 'single_select') {
      profile.answers[q.id] = opt.id;
    } else if (q.type === 'single_select_with_followup') {
      profile.answers[q.id] = { kind: opt.id, text: profile.answers[q.id]?.text || '' };
    } else if (q.type === 'multi_select_max_2' || q.type === 'multi_select_max_3') {
      const cap = q.max_selections;
      const exclusiveId = q.exclusive_option_id;
      const current = Array.isArray(profile.answers[q.id]) ? profile.answers[q.id].slice() : [];
      const wasSelected = current.includes(opt.id);
      let next;
      if (exclusiveId) {
        if (opt.id === exclusiveId) {
          next = wasSelected ? [] : [opt.id];
        } else {
          next = current.filter(p => p !== exclusiveId);
          if (wasSelected) next = next.filter(p => p !== opt.id);
          else next.push(opt.id);
        }
      } else {
        next = wasSelected ? current.filter(p => p !== opt.id) : current.concat([opt.id]);
      }
      while (next.length > cap) next.shift();
      profile.answers[q.id] = next;
    }
    save();
    trackEvent('preferences_edited_post_redesign', {
      question_id: q.id,
      old_value: oldVal,
      new_value: profile.answers[q.id]
    });
    // Repaint this card's summary + detail (so selected states update).
    paintAnswerCardSummary(card, q, profile);
    paintAnswerCardDetail(card, q, profile);
  }
  // Public surface for any future caller (post-redesign deep link, etc.)
  window.FurnishRenderAnswersEditor = renderAnswersEditor;

  // [BUDGET_RESET_PASS] All per-room budget infrastructure removed:
  //   setupBudgetSlider, ROOM_BUDGET_DEFAULTS, getRoomBudget,
  //   formatBudgetShort, paintBudgetTicks (modal version),
  //   openRoomBudgetModal, closeRoomBudgetModal, modal IIFE wiring.
  // The per-generation slider is wired in renderRoomTypeCards / Phase 2.
  // Tick-label rendering for the new slider:
  function paintBudgetTicks(container) {
    if (!container) return;
    container.innerHTML = '';
    // [Hassan's call] Even-as-possible spacing across the log scale. The $10k
    // tick was dropped — at log positions $10k sat 88% across and $20k+ sat
    // 100%, smushing the labels into 12% of width. With $10k removed, the
    // last gap opens up to ~24%. Remaining ticks ($50, $500, $2k, $5k,
    // $20k+) anchor the natural budget bands without overlap.
    const points = [
      { v: SLIDER_BUDGET_MIN, label: '$' + SLIDER_BUDGET_MIN },
      { v: 500,               label: '$500' },
      { v: 2000,              label: '$2k' },
      { v: 5000,              label: '$5k' },
      { v: Infinity,          label: '$' + (SLIDER_BUDGET_MAX / 1000) + 'k+' }
    ];
    points.forEach(p => {
      const span = document.createElement('span');
      span.textContent = p.label;
      const pct = p.v === Infinity ? 100 : (budgetToSlider(p.v) / 1000) * 100;
      span.style.left = pct.toFixed(2) + '%';
      container.appendChild(span);
    });
  }

  function renderColorChips(p) {
    const el = $('#colorsGrid');
    // [10-Q model] #colorsGrid removed from preferences markup; this
    // function is preserved for future Pro feature (custom-palette editor).
    if (!el) return;
    el.innerHTML = '';
    const current = new Set(p.colors);
    window.COLOR_MOODS.forEach(mood => {
      const chip = document.createElement('button');
      chip.className = 'chip' + (current.has(mood.id) ? ' selected' : '');
      chip.innerHTML = `<span class="swatch" style="background:${mood.hex}"></span><span>${mood.label}</span>`;
      chip.addEventListener('click', () => {
        if (current.has(mood.id)) current.delete(mood.id); else current.add(mood.id);
        p.colors = Array.from(current);
        save();
        renderColorChips(p);
      });
      el.appendChild(chip);
    });
  }

  function renderCustomColorList(p) {
    const el = $('#customColorList');
    // [10-Q model + CONFLICT 1] Custom-color picker preserved as future
    // Pro feature. DOM hidden; function inert when element missing.
    if (!el) return;
    el.innerHTML = '';
    (p.customColors || []).forEach(hex => {
      const s = document.createElement('span');
      s.className = 'custom-swatch';
      s.innerHTML = `<span class="dot" style="background:${hex}"></span><span>${hex}</span><button aria-label="Remove">×</button>`;
      s.querySelector('button').addEventListener('click', () => {
        p.customColors = p.customColors.filter(h => h !== hex);
        save();
        renderCustomColorList(p);
      });
      el.appendChild(s);
    });
  }

  $('#addCustomColorBtn')?.addEventListener('click', () => {
    const p = getActiveProfile();
    if (!p) return;
    const hex = $('#customColor').value;
    p.customColors = p.customColors || [];
    if (!p.customColors.includes(hex)) {
      p.customColors.push(hex);
      save();
      renderCustomColorList(p);
      toast('Color added to your palette');
    }
  });

  $('#savePrefsBtn').addEventListener('click', () => {
    const p = getActiveProfile();
    if (!p) { showScreen('profile-select'); return; }
    // [9-Q model — BUDGET_RESET_PASS] Validation: at minimum need vibe +
    // materials (load-bearing fields for the AI prompt). Other fields use
    // ONBOARDING_DEFAULTS() at build time. Budget moved out of onboarding;
    // it's now a transient slider on the capture screen.
    const a = p.answers || {};
    if (!a.vibe || !a.materials || !a.materials.length) {
      toast('Pick a vibe and at least one material');
      return;
    }
    // Re-derive legacy bridge fields after edits.
    p.styles = deriveStylesFromAnswers(a);
    p.colors = deriveColorsFromAnswers(a);
    p.keepExisting = a.scope === 'just_furniture';
    save();
    toast('Preferences saved');
    showScreen('home');
    renderHome();
  });

  // ---------- Generic chip grid ----------
  function renderChipGrid(selector, options, selected, multi, onChange) {
    const el = $(selector);
    el.innerHTML = '';
    const current = new Set(selected);
    options.forEach(opt => {
      const chip = document.createElement('button');
      chip.className = 'chip' + (current.has(opt.id) ? ' selected' : '');
      chip.textContent = opt.label;
      chip.addEventListener('click', () => {
        if (multi) {
          if (current.has(opt.id)) current.delete(opt.id); else current.add(opt.id);
        } else {
          current.clear(); current.add(opt.id);
        }
        el.querySelectorAll('.chip').forEach((c, i) => c.classList.toggle('selected', current.has(options[i].id)));
        onChange(Array.from(current));
      });
      el.appendChild(chip);
    });
  }

  // ---------- Home ----------
  // ============================================================
  // Visit-N home differentiation — Reforge Engagement Engine, Signal step
  // ============================================================
  // Visit #1 is the activation moment (already optimized). Visit #2-3 are
  // the early-discovery phase — surface multi-room expansion + style pulse
  // prominently. Visit #4-9 are the active phase — emphasize loops the user
  // hasn't yet engaged with (price-drops if wishlist exists, multi-room if
  // only 1 room designed). Visit #10+ are the veteran phase — assume the
  // user knows the app, prioritize fresh content density over education.
  //
  // Implementation: a single body data-attribute (`data-visit-band`) that
  // CSS reads to vary section ordering, density, and helper-copy visibility.
  // Per Reforge "Goldilocks" frequency principle, more aggressive nurturing
  // for early visits, lighter touch for veterans.
  function getVisitBand() {
    const v = state.user?.visitCount || 1;
    if (v <= 1) return 'first';
    if (v <= 3) return 'early';
    if (v <= 9) return 'active';
    return 'veteran';
  }
  function syncVisitBandClass() {
    const band = getVisitBand();
    document.body.dataset.visitBand = band;
    document.body.dataset.visitCount = String(state.user?.visitCount || 1);
  }

  function renderHome() {
    syncFreeModeClass();
    syncVisitBandClass();
    ensureActiveProfile();
    const p = getActiveProfile();
    $('#activeProfileName').textContent = p ? p.name : 'No profile';

    // Pill avatar — uses profile photo if set, otherwise the tan dot.
    const dot = document.querySelector('#activeProfilePill .dot');
    if (dot) {
      if (p?.avatar) {
        dot.classList.add('has-photo');
        dot.style.backgroundImage = `url('${p.avatar}')`;
      } else {
        dot.classList.remove('has-photo');
        dot.style.backgroundImage = '';
      }
    }

    renderExploreWelcome();
    // [Batch 5 Part 2 — Dim 02 D02-11] Welcome-back commitment card fires
    // BEFORE the lifecycle banner so the user's own past quiz answers are
    // the first thing they re-encounter on return. Once-per-day gate.
    renderWelcomeBackCommitmentCard();
    renderLifecycleBanner();
    renderResumeHero(p);
    // [Retention pass — Loop 2 surface] Above-fold price-drop notice for any
    // wishlist item that has dropped below its priceAtSave. High direct-
    // revenue lever; surfaces only when there's a real drop to avoid noise.
    renderPriceDropBanner();
    // [Retention pass — Loop 3 surface] Home Progress map. Visualizes which
    // of the 9 room types this profile has designed; nudges toward the next.
    // Reforge Engagement Strategy — Add Use Cases + commitment psychology.
    renderHomeProgress(p);
    renderStylePulse(p);
    renderCollections();
    // [Polish] Saved Rooms + Saved Items removed from home — they live
    // exclusively in the Saved tab now. The original `renderRoomsGrid()`
    // and `renderHomeSavedItems()` calls targeted #roomsGrid + #homeSavedItems
    // which no longer exist on the home screen. The Saved tab has its own
    // independent renderers (renderSavedRoomsGrid / renderSavedItemsGrid)
    // wired through the .st-tab click handler.
    // [Retention pass — lifecycle scaffolding]
    // Computes which lifecycle campaigns (welcome / mid-funnel / dormant /
    // churned) would fire RIGHT NOW for this user, given their lifecycle
    // state and visit history. Logs the resolution; does not yet send. The
    // would-fire log + analytics events are the contract the future email/
    // push backend will consume verbatim. See DEFERRED.md for the SMTP/push
    // wiring once a provider is chosen.
    runLifecycleScheduler();

    // First-time home visit: explain what templates are for.
    // One-shot via state._templateTipShown. Dismisses on tap or 10s timeout.
    // Skipped for non-Pro users who'll be paywalled instead (tip would be noise).
    if (!state._templateTipShown && isPro()) {
      state._templateTipShown = true;
      save();
      setTimeout(showTemplateTip, 650);
    }
  }

  // ============================================================
  // Shared image-card component + "This Week in [Style]" config
  // ============================================================
  // Single source of truth for two things:
  //   1. THIS_WEEK_CONFIG — the style + 9 room types shown in the weekly
  //      drop section. To rotate next week's style, change THIS one
  //      constant. Card images can be added per-room as the asset library
  //      grows; rooms without curated images render as placeholder cards.
  //   2. renderImageCard(spec) — the unified image-card builder used by
  //      Style Pulse and any future inspiration galleries. Every card it
  //      builds has the "Use Template →" CTA at the bottom that pipes the
  //      image into the redesign flow via useTemplateFromCard().
  //
  // Reforge frameworks:
  //   - Engagement Loops (Casey Winters): stable container + variable
  //     content drives habitual return visits. Container = "This Week in
  //     [Style]"; content = the style + room sweep that rotates.
  //   - Retention — Habit Moment frequency: predictable weekly cadence
  //     ("Tuesday means a new style sweep") expands the user's mental
  //     model of when to come back.
  //   - User Psychology — pattern recognition: same format every week
  //     means users learn to scan the section in 2 seconds.
  // ============================================================

  // The room types shown in the weekly sweep, in spec order. To rotate the
  // showcase to a different style next week, change `styleId` + `styleLabel`
  // and provide per-room images as they're sourced. Rooms without a curated
  // image render as placeholders; their CTA still works (uses the style-
  // anchor image as the redesign source).
  const THIS_WEEK_CONFIG = {
    styleId: 'mid-century',                    // window.STYLES id
    styleLabel: 'Mid-Century Modern',          // display string
    styleAnchorImage: 'Weekly/Mid-Century%20Modern%20Bedroom.jpg',  // fallback for placeholders
    styleColors: ['warm', 'jewel'],            // window.COLOR_MOODS ids that pair
    sub: '9 rooms · refreshed every Monday',
    // [Dedicated /this-week page] Hero one-liner. Three concrete sensory
    // anchors per Reforge User Psychology (concrete-sensory > abstract).
    // Rewrite this when rotating styles — keeps hero in sync with the row.
    tagline: 'Clean lines. Warm woods. Iconic forms across every room.',
    // [Hassan's call] All 9 rooms now have curated photos in /Weekly/. File
    // names contain spaces → URL-encode (%20) so file:// and http:// paths
    // both resolve. When rotating styles, drop a matching set of 9 jpegs
    // into /Weekly/ named "[Style] [Room Label].jpg" and update the paths.
    rooms: [
      // [Hassan's call] bedroom + living room photos are tall portraits with
      // the bed/couch in the upper-middle of the frame. `center 15%` slides
      // the visible window UP as far as the subject allows — for a 2:3
      // portrait in a 4:3 landscape frame this shows image rows ~7.5%–57.5%,
      // capturing the full bed/couch without clipping their bottoms. Going
      // below ~15% starts cropping the subject's lower half.
      { roomType: 'bedroom',  image: 'Weekly/Mid-Century%20Modern%20Bedroom.jpg',     imagePosition: 'center 15%', imageType: 'asset', isNew: true  },
      { roomType: 'living',   image: 'Weekly/Mid-Century%20Modern%20Living%20Room.jpg', imagePosition: 'center 15%', imageType: 'asset', isNew: false },
      { roomType: 'kitchen',  image: 'Weekly/Mid-Century%20Modern%20Kitchen.jpg',     imageType: 'asset', isNew: false },
      { roomType: 'dining',   image: 'Weekly/Mid-Century%20Modern%20Dining%20Room.jpg', imageType: 'asset', isNew: false },
      { roomType: 'bathroom', image: 'Weekly/Mid-Century%20Modern%20Bathroom.jpg',    imageType: 'asset', isNew: false },
      { roomType: 'office',   image: 'Weekly/Mid-Century%20Modern%20Home%20Office.jpg', imageType: 'asset', isNew: false },
      { roomType: 'nursery',  image: 'Weekly/Mid-Century%20Modern%20Nursery.jpg',     imageType: 'asset', isNew: false },
      { roomType: 'closet',   image: 'Weekly/Mid-Century%20Modern%20Closet.jpg',      imageType: 'asset', isNew: false },
      { roomType: 'laundry',  image: 'Weekly/Mid-Century%20Modern%20Laundry%20Room.jpg', imageType: 'asset', isNew: false },
    ],
  };

  // Default room dims used when a Use Template click on an inspiration card
  // doesn't carry custom dimensions. Matches typical assumptions for each
  // room type. The downstream redesign engine reads these to size items.
  const DEFAULT_ROOM_DIMS = {
    living:   { w: 14, l: 16, h: 9 },
    bedroom:  { w: 12, l: 14, h: 9 },
    kitchen:  { w: 12, l: 14, h: 9 },
    dining:   { w: 11, l: 13, h: 9 },
    bathroom: { w: 7,  l: 9,  h: 9 },
    office:   { w: 10, l: 12, h: 9 },
    nursery:  { w: 10, l: 12, h: 9 },
    closet:   { w: 8,  l: 10, h: 9 },
    laundry:  { w: 8,  l: 9,  h: 9 },
  };

  // Central behavior for "Use Template" — every CTA across every inspiration
  // surface routes here. Builds a template object from the card spec and
  // calls startFromTemplate(), which routes through routeGenerationByModelTier
  // — Free uses standard model, Pro uses premium model. No quota cap.
  //
  // spec must include at minimum: { roomType, styleId, image (optional),
  //   styleColors (optional), label (for analytics) }
  function useTemplateFromCard(spec, source) {
    // [Hassan's call] All Use Template paths from inspiration cards
    // (Trending Styles, Seasonal, Style Pulse / This Week) now route to
    // the capture screen so the user provides their own photo, sets the
    // budget on the slider, and generates from THEIR room. Previously
    // these triggered immediate generation against the card's image.
    //
    // Room preselection rule:
    //   - this_week_* sources → preselect the card's room type (each card
    //     is room-specific in This Week / Style Pulse)
    //   - collection_card source → no preselect (trending/seasonal cards
    //     don't reference the user's actual room — let them pick)
    //   - other (defensive) → preselect if spec carries an explicit roomType
    const roomType = spec.roomType || spec.type || null;
    const styleId = spec.styleId || THIS_WEEK_CONFIG.styleId;
    const styles = spec.styles || (spec.styleId ? [spec.styleId] : [THIS_WEEK_CONFIG.styleId]);
    const colors = spec.colors || spec.styleColors || THIS_WEEK_CONFIG.styleColors || ['warm', 'neutral'];

    const isThisWeek = typeof source === 'string' && source.startsWith('this_week_');
    const isCollection = source === 'collection_card';
    const shouldPreselectRoom = !!roomType && (isThisWeek || (!isCollection && spec.roomType));

    trackEvent('use_template_clicked', {
      source: source || 'unknown',
      roomType,
      styleId,
      hasImage: !!spec.image,
      imageType: spec.imageType || (spec.image ? 'asset' : 'placeholder'),
      preselectedRoom: shouldPreselectRoom
    });

    // Pro template gate stays — Pro-only templates require subscription.
    // (Inspiration cards from collections/this-week are NOT marked pro;
    // this branch is defensive in case future cards carry t.pro = true.)
    if (spec.pro && !isPro()) {
      state._pendingProAction = { actionId: 'template_pro', templateId: spec.id };
      save();
      trackEvent('paywall_trigger', { from: 'template_pro', templateId: spec.id });
      openPaywall('template_pro');
      return;
    }

    ensureGuestProfile();
    // Set up draft to route through capture. Photo stays null — user must
    // provide one. Type set only when preselect rule fires. Style/color
    // overrides carry the template's intent into buildRoomFromDraft.
    state.draft = {
      photo: null,
      type: shouldPreselectRoom ? roomType : null,
      dims: { w: 12, l: 14, h: 9 },
      keep: false,
      styleOverride: styles,
      colorOverride: colors,
      fromTemplate: spec.id || null,
      templateLabel: spec.label || null
    };
    save();
    showScreen('capture');
    prepareCapture();
  }
  // Public surface in case future code paths want to fire the same flow.
  window.FurnishUseTemplate = useTemplateFromCard;

  // Shared image-card builder. Returns an article element ready to insert
  // into any gallery surface. Spec drives content; opts drive variant.
  //
  // spec = {
  //   id: string,                       // unique per-card id
  //   roomType: string,                 // window.ROOM_TYPES.id (drives label)
  //   image: string | null,             // photo URL; null → placeholder
  //   imageType: 'asset'|'placeholder', // visual treatment
  //   isNew: bool,                      // optional NEW badge
  //   label: string,                    // body title (e.g., room label)
  //   sublabel: string,                 // body sub (e.g., "Wk 18")
  //   styleId, styleColors, ...         // forwarded to useTemplateFromCard
  // }
  // opts = {
  //   variant: 'marquee' | 'grid',      // layout class
  //   source: string,                   // analytics source for the CTA
  // }
  function renderImageCard(spec, opts = {}) {
    const variant = opts.variant || 'marquee';
    const source = opts.source || 'image_card';
    const roomLabel = (window.ROOM_TYPES || []).find(r => r.id === spec.roomType)?.label || spec.roomType || '';
    const roomIcon = (window.ROOM_TYPES || []).find(r => r.id === spec.roomType)?.icon || '🏠';

    const card = document.createElement('article');
    card.className = `imgcard imgcard--${variant}`;
    if (spec.imageType === 'placeholder') card.classList.add('imgcard--placeholder');
    card.dataset.cardId = spec.id || '';

    // Photo / placeholder area — inline style for asset bg, structural
    // markup for placeholder so we can paint the icon + "coming soon".
    const photo = document.createElement('div');
    photo.className = 'imgcard-photo';
    if (spec.imageType === 'placeholder') {
      photo.classList.add('imgcard-photo--placeholder');
      photo.innerHTML = `
        <span class="imgcard-placeholder-icon" aria-hidden="true">${roomIcon}</span>
        <span class="imgcard-placeholder-tag">Curated image coming</span>
      `;
    } else if (spec.image) {
      photo.style.backgroundImage = `url('${spec.image}')`;
      // [Hassan's call] Per-card background-position override. Default is
      // 'center' (CSS rule), but specific photos (bedroom + living room in
      // /Weekly/) need to slide DOWN so the bed/couch sits in frame instead
      // of being cropped at the bottom. Driven by spec.imagePosition.
      if (spec.imagePosition) photo.style.backgroundPosition = spec.imagePosition;
    }

    // Top-left room-type label (always shown when roomType is present).
    if (spec.roomType) {
      const roomLbl = document.createElement('span');
      roomLbl.className = 'imgcard-roomtype-label';
      roomLbl.textContent = roomLabel;
      photo.appendChild(roomLbl);
    }

    // Top-right NEW badge.
    if (spec.isNew) {
      const newBadge = document.createElement('span');
      newBadge.className = 'imgcard-new-badge';
      newBadge.textContent = 'NEW';
      photo.appendChild(newBadge);
    }

    // [Hassan's call] Removed `.imgcard-body` (room label + Wk stamp) — it
    // duplicated the top-left `.imgcard-roomtype-label` badge already on the
    // photo, and the "Wk 18" sublabel was metadata clutter. Photo now butts
    // directly against the CTA for a cleaner two-region card.

    // The CTA — single source of truth for "Use Template" behavior. Every
    // inspiration surface using renderImageCard ships this button.
    const cta = document.createElement('button');
    cta.className = 'imgcard-cta';
    cta.type = 'button';
    cta.innerHTML = `
      Use Template
      <svg class="imgcard-cta-arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12"/>
        <polyline points="12 5 19 12 12 19"/>
      </svg>
    `;
    cta.addEventListener('click', e => {
      e.stopPropagation();
      useTemplateFromCard(spec, source);
    });

    card.appendChild(photo);
    card.appendChild(cta);
    return card;
  }
  window.FurnishRenderImageCard = renderImageCard;

  // C13 — Style Pulse: weekly inspiration drop in the user's primary style.
  // Reforge ICED Lesson 6 (Single→Constant Touch): "add use cases to move
  // toward constant touch within the product." This is the Zillow Zestimate
  // analogue — a weekly recall surface tied to the user's style profile.
  // Placeholder content for now; weekly rotation will be backend-driven.
  function renderStylePulse(profile) {
    const strip = document.getElementById('stylePulseStrip');
    const titleEl = document.getElementById('stylePulseTitle');
    const subEl = document.getElementById('stylePulseSub');
    const weekEl = document.getElementById('stylePulseWeek');
    if (!strip) return;
    strip.innerHTML = '';

    // Calculate current week label (e.g. "Wk 17 · Apr 24")
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7);
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (weekEl) weekEl.textContent = `Wk ${week} · ${dateStr}`;

    // ============================================================
    // [Canonical pattern — Featured-Style row]
    // ============================================================
    // Homepage shows a TIGHT SCANNABLE PAIR: the first 2 rooms from the
    // weekly config (Bedroom + Living Room) as full image cards, plus a
    // narrow brand-brown "Discover More" tile that routes to the dedicated
    // /this-week page where the full 9-room grid lives.
    //
    // Why 2 + 1 instead of 9 (per Reforge engagement-loop framework):
    //   - 9 cards on the homepage flatten hierarchy — every card competes
    //     equally and the user gets decision fatigue.
    //   - 2 cards + an explicit "more" entry creates a curiosity gap and a
    //     routing layer where we can later add filters, sort orders, and
    //     related styles without bloating the homepage.
    //   - The dedicated page is also where deeper engagement metrics (which
    //     rooms get tapped, which styles convert) get instrumented without
    //     polluting homepage analytics.
    //
    // Replicating this pattern for FUTURE featured rows ("This Week in
    // [Other Style]", seasonal showcases, designer-curated collections):
    //   1. Define a config with the same shape as THIS_WEEK_CONFIG.
    //   2. Render the first 2 entries via renderImageCard (variant: 'grid').
    //   3. Append a Discover More tile (renderDiscoverMoreTile below) with
    //      the count of remaining items + a route to a dedicated page.
    //   4. The dedicated page calls renderImageCard on the full set + adds
    //      a hero band + bottom "Browse all styles" CTA.
    // Both surfaces MUST read from the same config — any divergence means
    // the homepage and detail page can drift and confuse users.
    // ============================================================

    const cfg = THIS_WEEK_CONFIG;
    if (titleEl) titleEl.textContent = `This week in ${cfg.styleLabel}`;
    if (subEl) subEl.textContent = cfg.sub || `${cfg.rooms.length} rooms · refreshed every Monday`;

    // Render only the first 2 rooms on the homepage (Bedroom + Living Room
    // by config order). The remaining 7 are reachable via the Discover More
    // tile but stay in the data layer untouched.
    const HOMEPAGE_FEATURED_COUNT = 2;
    const featured = cfg.rooms.slice(0, HOMEPAGE_FEATURED_COUNT);
    featured.forEach((room, idx) => {
      const roomLabel = (window.ROOM_TYPES || []).find(r => r.id === room.roomType)?.label || room.roomType;
      const card = renderImageCard({
        id: `pulse-${cfg.styleId}-${room.roomType}-${idx}`,
        roomType: room.roomType,
        image: room.image,
        imagePosition: room.imagePosition,
        imageType: room.imageType,
        isNew: !!room.isNew,
        label: roomLabel,
        sublabel: `Wk ${week}`,
        styleId: cfg.styleId,
        styleColors: cfg.styleColors,
      }, {
        variant: 'marquee',
        source: 'style_pulse',
      });
      strip.appendChild(card);
    });

    // Append the Discover More tile — pure navigation, no quota impact, no
    // template action. Always routes to the current week's dedicated page
    // (data-go="this-week" — never hardcoded to a specific style).
    const remainingCount = cfg.rooms.length - HOMEPAGE_FEATURED_COUNT;
    const discoverTile = renderDiscoverMoreTile(remainingCount);
    strip.appendChild(discoverTile);

    // [Batch 3 — Dim 04 R6] Style Pulse view is a habit action (≥3s dwell
    // is the spec, but rendering implies the user reached the home screen
    // and saw the strip — directional signal good enough for Batch 3.
    // Refine to dwell-detection in a future iteration.
    logHabitAction('style_pulse_view');
    trackEvent('style_pulse_shown', {
      styleId: cfg.styleId,
      styleLabel: cfg.styleLabel,
      week,
      featuredCount: featured.length,
      hiddenCount: remainingCount,
      placeholderCount: cfg.rooms.filter(r => r.imageType === 'placeholder').length,
    });
  }

  // Dedicated /this-week page renderer. Reads from the SAME THIS_WEEK_CONFIG
  // as the homepage featured row — single source of truth. Renders all 9
  // rooms in the canonical config order plus a hero band on top and a
  // "Browse all styles" CTA at bottom. Per the canonical-pattern comment
  // block above renderStylePulse, both surfaces MUST stay in sync; if you
  // edit the homepage row's config read, edit this one too.
  function renderThisWeekPage() {
    const cfg = THIS_WEEK_CONFIG;
    const titleEl = document.getElementById('thisWeekTitle');
    const taglineEl = document.getElementById('thisWeekTagline');
    const metaEl = document.getElementById('thisWeekMeta');
    const weekStampEl = document.getElementById('thisWeekWeekStamp');
    const grid = document.getElementById('thisWeekGrid');
    if (!grid) return;

    if (titleEl) titleEl.textContent = `This Week in ${cfg.styleLabel}`;
    if (taglineEl && cfg.tagline) taglineEl.textContent = cfg.tagline;
    if (metaEl) metaEl.textContent = cfg.sub || `${cfg.rooms.length} rooms · refreshed every Monday`;

    // Week stamp matches the homepage Style Pulse format ("Wk 18 · Apr 25").
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7);
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (weekStampEl) weekStampEl.textContent = ` · Wk ${week} · ${dateStr}`;

    grid.innerHTML = '';
    cfg.rooms.forEach((room, idx) => {
      const roomLabel = (window.ROOM_TYPES || []).find(r => r.id === room.roomType)?.label || room.roomType;
      const card = renderImageCard({
        id: `tw-${cfg.styleId}-${room.roomType}-${idx}`,
        roomType: room.roomType,
        image: room.image,
        imagePosition: room.imagePosition,
        imageType: room.imageType,
        isNew: !!room.isNew,
        label: roomLabel,
        sublabel: `Wk ${week}`,
        styleId: cfg.styleId,
        styleColors: cfg.styleColors,
      }, {
        variant: 'grid',
        source: 'this_week_page',
      });
      grid.appendChild(card);
    });

    trackEvent('this_week_page_shown', {
      styleId: cfg.styleId,
      styleLabel: cfg.styleLabel,
      week,
      cardCount: cfg.rooms.length,
      placeholderCount: cfg.rooms.filter(r => r.imageType === 'placeholder').length,
    });
  }
  // Public surface — exposed so future surfaces (e.g. a "back to this week"
  // deep link from search results) can re-render without re-routing.
  window.FurnishRenderThisWeekPage = renderThisWeekPage;

  // Discover More tile — the third element in the homepage Featured-Style
  // row. Visually distinct from image cards: brand brown, no image, vertical
  // arrow + stacked label. Tap routes to the dedicated /this-week page.
  // Follows the canonical pattern documented above renderStylePulse.
  function renderDiscoverMoreTile(remainingCount) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'discover-more-tile';
    tile.dataset.go = 'this-week';
    tile.setAttribute('aria-label', `Discover ${remainingCount} more rooms in this week's featured style`);
    tile.innerHTML = `
      <span class="dmt-arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </span>
      <span class="dmt-text">
        <span class="dmt-headline">Discover More</span>
        <span class="dmt-sub">${remainingCount} more rooms</span>
      </span>
    `;
    tile.addEventListener('click', () => {
      trackEvent('discover_more_clicked', {
        source: 'style_pulse_homepage',
        styleId: THIS_WEEK_CONFIG.styleId,
        remainingCount,
      });
      // Navigation handled by data-go="this-week" via document click handler.
    });
    return tile;
  }

  // ============================================================
  // Retention pass — Engagement Loop surfaces on Home
  // ============================================================
  // Each function below renders a section that supports one of the 5 ranked
  // engagement loops from the Retention pass strategy doc:
  //   Loop 2 (Price-Drop Watch)    → renderPriceDropBanner
  //   Loop 3 (Home Progress map)   → renderHomeProgress
  //   Lifecycle campaigns          → runLifecycleScheduler
  // See CHANGES_APPLIED.md retention-pass section for framework grounding.
  // ============================================================

  // Loop 2 surface — Price-Drop Watch banner.
  // Currently scans wishlist items where wishlistMeta[id].priceAtSave > current.
  // In production this fires on a cron + pushes via the future email/push
  // backend; here we surface the in-app banner whenever the user lands on
  // home AND there's an unread drop. Banner dismissable per-session.
  function renderPriceDropBanner() {
    const hero = document.querySelector('.home-hero');
    if (!hero) return;
    hero.querySelector('.price-drop-banner')?.remove();
    if (state._priceDropBannerDismissed) return;

    const meta = state.wishlistMeta || {};
    const wishlistIds = state.wishlist || [];
    const drops = [];
    wishlistIds.forEach(id => {
      const item = (window.FURNITURE_DB || []).find(x => x.id === id);
      const m = meta[id];
      if (!item || !m?.priceAtSave) return;
      if (m.priceAtSave > item.price) {
        const delta = m.priceAtSave - item.price;
        const pct = (delta / m.priceAtSave) * 100;
        drops.push({ item, m, delta, pct });
      }
    });
    if (!drops.length) return;
    // Sort biggest-percent first.
    drops.sort((a, b) => b.pct - a.pct);
    const top = drops[0];
    const more = drops.length - 1;

    const banner = document.createElement('div');
    banner.className = 'price-drop-banner';
    banner.innerHTML = `
      <span class="pdb-pulse" aria-hidden="true"></span>
      <div class="pdb-body">
        <div class="pdb-headline">
          <span class="pdb-emoji" aria-hidden="true">↓</span>
          ${top.item.name} dropped <strong>${Math.round(top.pct)}%</strong>
        </div>
        <div class="pdb-sub">
          Now <strong>$${Math.round(top.item.price).toLocaleString()}</strong>
          <span class="pdb-was">was $${Math.round(top.m.priceAtSave).toLocaleString()}</span>
          ${more > 0 ? `<span class="pdb-more">· +${more} more</span>` : ''}
        </div>
      </div>
      <button class="pdb-cta" data-pdb-cta type="button">See it →</button>
      <button class="pdb-close" data-pdb-close aria-label="Dismiss" type="button">×</button>
    `;
    hero.appendChild(banner);

    banner.querySelector('[data-pdb-cta]').addEventListener('click', () => {
      trackEvent('price_drop_banner_clicked', {
        itemId: top.item.id,
        delta: top.delta,
        pctDrop: Math.round(top.pct),
        totalDropsAvailable: drops.length,
      });
      // [Batch 3 — Dim 04 R6] Price-drop tap is a habit action.
      logHabitAction('price_drop_tap');
      // Open the wishlist screen scrolled to the item, or the item sheet
      // directly if openItemSheet is exposed. Fallback: route to wishlist.
      if (typeof openItemSheet === 'function') {
        openItemSheet(top.item);
      } else {
        document.querySelector('[data-go="wishlist"]')?.click();
      }
    });
    banner.querySelector('[data-pdb-close]').addEventListener('click', () => {
      state._priceDropBannerDismissed = true;
      trackEvent('price_drop_banner_dismissed', { itemId: top.item.id });
      banner.remove();
    });
    trackEvent('price_drop_banner_shown', {
      itemId: top.item.id,
      delta: top.delta,
      pctDrop: Math.round(top.pct),
      totalDropsAvailable: drops.length,
    });
  }

  // Loop 3 surface — Home Progress map. 9 room-type cells; designed rooms
  // glow, undesigned rooms invite the next-room journey. Visible when the
  // user has at least 1 designed room (otherwise the activation hero is
  // doing the same job). Only counts rooms tied to the active profile.
  function renderHomeProgress(profile) {
    const heroParent = document.querySelector('.home-hero')?.parentElement || document.querySelector('[data-screen="home"]');
    if (!heroParent) return;
    heroParent.querySelector('.home-progress')?.remove();
    if (!profile) return;
    // [Save Home] Read from activeHome.designedRooms object (the new 3-tier
    // model) — the legacy homeProgress array is kept in sync via dual-write
    // but activeHome is the source of truth for exclusions + metadata.
    const hp = getHomeProgress();
    const ah = getActiveHome();
    const rooms = (state.rooms || []).filter(r => r.profileId === profile.id);
    const visibleRoomTypes = HOME_ROOM_ORDER.filter(t => !(ah.excludedRooms || []).includes(t));
    const designedTypes = visibleRoomTypes.filter(t => ah.designedRooms[t] !== null);
    if (!designedTypes.length && !rooms.length && !ah.excludedRooms.length) return; // first-time

    const ROOM_ORDER = HOME_ROOM_ORDER;
    const designed = new Set(designedTypes);
    const totalRoomTypesDesigned = designedTypes.length;
    const totalDesigned = totalRoomTypesDesigned;
    const requiredCount = visibleRoomTypes.length; // 9 - excludedCount
    const isComplete = homeIsComplete();

    // "Next up" — first un-designed non-excluded room in canonical order. null when complete.
    const nextRoomType = nextHomeRoomSuggestionV2();
    const ROOM_LABELS = (window.ROOM_TYPES || []).reduce((acc, r) => { acc[r.id] = r.label; return acc; }, {});
    // [Hassan's call] Reads from module-level HOME_ROOM_SVGS — single source
    // of truth shared with the capture-screen "What room is this?" picker.
    const ROOM_SVG = HOME_ROOM_SVGS;
    const fallbackSvg = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z"/></svg>`;

    // [Save Home] Hide excluded rooms entirely from the grid. Counter +
    // progress bar reflect "X of [9 - excluded]". Per spec edge-case #2 +
    // #5 and the exclusion-aware Next up.
    // [Hassan's call] Designed rooms now display the actual generated
    // photo as the cell background. Look up the room object via
    // activeHome.designedRooms[type].roomId → state.rooms.find(...).
    // Falls back gracefully if the photo is missing (legacy rooms,
    // template-without-photo) — icon + label still render.
    const cells = visibleRoomTypes.map(type => {
      const isDone = designed.has(type);
      const isNext = !isDone && type === nextRoomType;
      const cls = ['hp-cell'];
      if (isDone) cls.push('hp-done');
      if (isNext) cls.push('hp-next');
      // Resolve the room photo for designed rooms.
      let roomPhoto = null;
      if (isDone) {
        const designedEntry = ah.designedRooms[type];
        const roomId = designedEntry && designedEntry.roomId;
        if (roomId) {
          const roomObj = (state.rooms || []).find(r => r.id === roomId);
          if (roomObj && roomObj.photo) roomPhoto = roomObj.photo;
        }
        // Fallback: most-recent room of this type for the active profile.
        if (!roomPhoto) {
          const matched = (state.rooms || [])
            .filter(r => r.profileId === profile.id && r.type === type && r.photo)
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
          if (matched) roomPhoto = matched.photo;
        }
        if (roomPhoto) cls.push('hp-has-photo');
      }
      // Escape ' to avoid breaking the inline url('') wrapper.
      const photoStyle = roomPhoto
        ? `style="background-image:url('${String(roomPhoto).replace(/'/g, "%27")}')"`
        : '';
      return `<button class="${cls.join(' ')}" data-hp-room="${type}" type="button" aria-label="${ROOM_LABELS[type] || type} ${isDone ? 'designed' : 'not yet designed'}">
        ${roomPhoto ? `<span class="hp-photo" aria-hidden="true" ${photoStyle}></span>` : ''}
        <span class="hp-icon" aria-hidden="true">${ROOM_SVG[type] || fallbackSvg}</span>
        <span class="hp-label">${ROOM_LABELS[type] || type}</span>
        ${isDone ? `<span class="hp-check" aria-hidden="true"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12 10 17 19 7"/></svg></span>` : ''}
      </button>`;
    }).join('');

    const wrap = document.createElement('section');
    wrap.className = 'home-progress';
    if (isComplete) wrap.classList.add('hp-complete');
    // "Next up" / completion copy — when 9/9 hit, swap to the celebratory
    // line and surface a "See your full home" CTA. Per the spec:
    // "When all 9 are designed, the 'Next up' line changes to a
    // celebratory state."
    const headerSubHtml = isComplete
      ? `<p class="muted small hp-sub hp-sub-complete">All ${requiredCount} rooms designed — ready to save.</p>`
      : `<p class="muted small hp-sub">${nextRoomType ? `Next up: ${ROOM_LABELS[nextRoomType] || nextRoomType}` : 'Every room covered.'}</p>`;
    wrap.innerHTML = `
      <header class="hp-head">
        <div>
          <span class="hp-eyebrow">YOUR HOME</span>
          <h3 class="section-h hp-title">${totalRoomTypesDesigned} of ${requiredCount} rooms designed</h3>
          ${headerSubHtml}
        </div>
        <div class="hp-progress-bar" aria-hidden="true">
          <div class="hp-progress-fill" style="width: ${requiredCount > 0 ? (totalRoomTypesDesigned / requiredCount) * 100 : 0}%"></div>
        </div>
      </header>
      <div class="hp-grid">${cells}</div>
      <div class="hp-save-row" data-hp-save-row></div>
    `;

    // Insert AFTER home-hero, BEFORE styling pulse / other strips.
    const hero = document.querySelector('.home-hero');
    if (hero && hero.nextSibling) {
      heroParent.insertBefore(wrap, hero.nextSibling);
    } else {
      heroParent.appendChild(wrap);
    }

    // Wire each cell. Designed → open the most recent room of that type.
    // Undesigned → open the flyout (Upload a photo / Pick from a style).
    wrap.querySelectorAll('[data-hp-room]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.hpRoom;
        const isDone = designed.has(type);
        // [Your Home progress] New analytics event per spec — fires on
        // every tap regardless of designed state, so cancel-rate of the
        // flyout (and engagement on designed-cell taps) is measurable.
        trackEvent('home_progress_card_tapped', { room_type: type, was_already_designed: isDone });
        if (isDone) {
          // Open the most recent room of this type
          const recent = rooms.filter(r => r.type === type).sort((a,b) => (b.createdAt||0) - (a.createdAt||0))[0];
          if (recent) {
            trackEvent('home_progress_cell_clicked', { roomType: type, action: 'open_existing' });
            openRoom(recent.id);
          }
        } else {
          // [Your Home progress] Flyout (Upload a photo / Pick from a style)
          // replaces the prior direct-to-capture route. Per spec: the user
          // gets two clear start options, both of which pre-select the room
          // type so the next step (capture / templates) lands targeted.
          trackEvent('home_progress_cell_clicked', { roomType: type, action: 'start_new' });
          openHomeProgressFlyout(type, btn);
        }
      });
    });

    trackEvent('home_progress_shown', {
      designedCount: totalDesigned,
      uniqueTypesDesigned: totalRoomTypesDesigned,
      nextRoomType: nextRoomType || null,
    });

    // [Save Home] Render the persistent "Save this home" button below
    // the grid. Visual state depends on completion. Per spec: muted when
    // incomplete, primary brand-brown when complete. Tap → either the
    // incomplete dialog (lists missing rooms as next steps) or the
    // confirm dialog (commits the save).
    renderSaveHomeButton(wrap.querySelector('[data-hp-save-row]'));

    // [Save Home] 9/9 completion celebration — one-time per user when
    // designedCount === requiredCount (NOT === 9 anymore — handles the
    // "user excluded 7 rooms, designed 2, hits completion" case per spec).
    // The activeHome.celebrated flag is the single source of truth.
    if (isComplete && !ah.celebrated) {
      ah.celebrated = true;
      save();
      trackEvent('home_save_completion_celebrated');
      requestAnimationFrame(() => {
        wrap.classList.add('hp-celebrating');
        setTimeout(() => wrap.classList.remove('hp-celebrating'), 1800);
      });
    }
  }

  // [Save Home] renderSaveHomeButton — persistent button below the grid.
  // Visual state: muted when incomplete (lower contrast, smaller, helper
  // microcopy below); primary brand-brown when complete (no muting). Per
  // spec, button is tappable in both states — incomplete tap opens a
  // "missing rooms" dialog, complete tap opens a confirm dialog.
  function renderSaveHomeButton(host) {
    if (!host) return;
    host.innerHTML = '';
    const ah = getActiveHome();
    const designedCount = homeDesignedCount();
    const requiredCount = homeRequiredCount();
    const complete = homeIsComplete();
    const btn = document.createElement('button');
    btn.className = 'hp-save-home-btn' + (complete ? ' hp-save-home-btn--complete' : ' hp-save-home-btn--incomplete');
    btn.type = 'button';
    btn.textContent = 'Save this home';
    const helper = document.createElement('p');
    helper.className = 'hp-save-home-helper muted small';
    helper.textContent = complete
      ? `All ${requiredCount} rooms designed — ready to save.`
      : 'Complete your remaining rooms first.';
    btn.addEventListener('click', () => {
      trackEvent('home_save_button_tapped', {
        state: complete ? 'complete' : 'incomplete',
        required_rooms_count: requiredCount,
        designed_rooms_count: designedCount
      });
      if (complete) {
        openSaveHomeConfirmDialog();
      } else {
        openSaveHomeIncompleteDialog();
      }
    });
    host.appendChild(btn);
    host.appendChild(helper);
  }
  window.FurnishRenderSaveHomeButton = renderSaveHomeButton;

  // [Save Home] Incomplete-state dialog — shows missing rooms as a
  // tappable next-step list. Per Reforge User Psychology: friction-as-
  // productive-step turns "you can't" into "here's how." Each row routes
  // to either the capture flow (own photo) or templates (pick a style)
  // via the existing hp-flyout pattern shipped in cabd9df.
  function openSaveHomeIncompleteDialog() {
    closeSaveHomeDialog();
    const ah = getActiveHome();
    const ROOM_LABELS = (window.ROOM_TYPES || []).reduce((acc, r) => { acc[r.id] = r.label; return acc; }, {});
    const missing = HOME_ROOM_ORDER.filter(t => !ah.excludedRooms.includes(t) && ah.designedRooms[t] === null);
    const requiredCount = homeRequiredCount();
    const designedCount = homeDesignedCount();
    const remaining = requiredCount - designedCount;
    const dlg = document.createElement('div');
    dlg.className = 'modal save-home-dialog open';
    dlg.id = 'saveHomeDialog';
    dlg.setAttribute('role', 'dialog');
    dlg.setAttribute('aria-modal', 'true');
    dlg.setAttribute('aria-labelledby', 'saveHomeDialogTitle');
    dlg.innerHTML = `
      <div class="modal-card save-home-dialog-card">
        <button class="modal-close" id="saveHomeDialogClose" type="button" aria-label="Cancel">×</button>
        <h3 id="saveHomeDialogTitle">Almost there</h3>
        <p class="save-home-dialog-body">You have ${remaining} room${remaining === 1 ? '' : 's'} left to design before you can save this home.</p>
        <ul class="save-home-missing-list">
          ${missing.map(t => `
            <li>
              <button class="save-home-missing-row" type="button" data-missing-room="${t}">
                <span class="bullet" aria-hidden="true">·</span>
                <span class="save-home-missing-label">${ROOM_LABELS[t] || t}</span>
                <span class="save-home-missing-arrow" aria-hidden="true">Start →</span>
              </button>
            </li>
          `).join('')}
        </ul>
        <div class="save-home-dialog-actions">
          <button class="btn btn-ghost" id="saveHomeDialogDismiss" type="button">Got it</button>
        </div>
      </div>
    `;
    document.body.appendChild(dlg);
    const close = (reason) => closeSaveHomeDialog(reason);
    dlg.querySelector('#saveHomeDialogClose').addEventListener('click', () => close('close'));
    dlg.querySelector('#saveHomeDialogDismiss').addEventListener('click', () => close('dismiss'));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close('backdrop'); });
    dlg.querySelectorAll('[data-missing-room]').forEach(row => {
      row.addEventListener('click', () => {
        const roomType = row.dataset.missingRoom;
        trackEvent('home_save_incomplete_dialog_room_tapped', { room_type: roomType });
        close('row_tapped');
        // Reuse the existing Your Home flyout to give the user the
        // Upload-photo / Pick-from-style choice (per spec).
        const cell = document.querySelector(`.hp-cell[data-hp-room="${roomType}"]`);
        if (cell) {
          openHomeProgressFlyout(roomType, cell);
        } else {
          // Fallback: pre-seed draft + route to capture
          state.draft = { type: roomType, photo: null, dims: { w: 12, l: 14, h: 9 }, keep: false };
          save();
          showScreen('capture');
          if (typeof prepareCapture === 'function') prepareCapture();
        }
      });
    });
  }

  // [Save Home] Complete-state confirm dialog. Two buttons: Cancel
  // (default focus) and Save home. Save commits the snapshot, resets
  // activeHome, routes to Saved tab.
  function openSaveHomeConfirmDialog() {
    closeSaveHomeDialog();
    const requiredCount = homeRequiredCount();
    const dlg = document.createElement('div');
    dlg.className = 'modal save-home-dialog open';
    dlg.id = 'saveHomeDialog';
    dlg.setAttribute('role', 'dialog');
    dlg.setAttribute('aria-modal', 'true');
    dlg.setAttribute('aria-labelledby', 'saveHomeDialogTitle');
    dlg.innerHTML = `
      <div class="modal-card save-home-dialog-card">
        <button class="modal-close" id="saveHomeDialogClose" type="button" aria-label="Cancel">×</button>
        <h3 id="saveHomeDialogTitle">Save this home?</h3>
        <p class="save-home-dialog-body">Your ${requiredCount} designed rooms will be saved to your Saved tab. Your Home will reset so you can start a new home.</p>
        <div class="save-home-dialog-actions">
          <button class="btn btn-ghost" id="saveHomeDialogCancel" type="button" autofocus>Cancel</button>
          <button class="btn btn-primary" id="saveHomeDialogConfirm" type="button">Save home</button>
        </div>
      </div>
    `;
    document.body.appendChild(dlg);
    setTimeout(() => dlg.querySelector('#saveHomeDialogCancel')?.focus(), 50);
    const close = (reason) => closeSaveHomeDialog(reason);
    dlg.querySelector('#saveHomeDialogClose').addEventListener('click', () => close('close'));
    dlg.querySelector('#saveHomeDialogCancel').addEventListener('click', () => close('cancel'));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close('backdrop'); });
    dlg.querySelector('#saveHomeDialogConfirm').addEventListener('click', () => {
      commitSaveHome();
      close('confirmed');
    });
  }

  function closeSaveHomeDialog(reason) {
    const dlg = document.getElementById('saveHomeDialog');
    if (!dlg) return;
    dlg.classList.remove('open');
    setTimeout(() => dlg.remove(), 180);
  }

  // [Save Home] Commit the current activeHome to savedHomes + reset.
  function commitSaveHome() {
    const ah = getActiveHome();
    const savedHomes = getSavedHomes();
    const requiredCount = homeRequiredCount();
    const designedCount = homeDesignedCount();
    if (designedCount < Math.max(2, requiredCount)) {
      toast("You can't save an incomplete home.");
      return;
    }
    // Snapshot
    const snapshot = {
      id: uuid(),
      savedAt: Date.now(),
      rooms: JSON.parse(JSON.stringify(ah.designedRooms)),
      excludedRooms: ah.excludedRooms.slice()
    };
    savedHomes.unshift(snapshot); // newest first
    trackEvent('home_save_confirmed', {
      rooms_count: designedCount,
      excluded_count: ah.excludedRooms.length
    });
    // Reset activeHome (new id, designed rooms cleared) but CARRY FORWARD
    // the user's current exclusion choices. Once a user has told the app
    // "I have a nursery" (or "I don't"), don't make them re-tell after
    // every home save. defaultExclusionsApplied is preserved so the new-
    // user default-exclusion migration doesn't re-fire on the next home.
    state.user.activeHome = {
      id: uuid(),
      startedAt: Date.now(),
      excludedRooms: ah.excludedRooms.slice(),
      designedRooms: emptyDesignedRoomsMap(),
      celebrated: false,
      defaultExclusionsApplied: true
    };
    // Also reset the legacy homeProgress array for backward compat
    if (state.user.homeProgress) {
      state.user.homeProgress.designedRooms = [];
      state.user.homeProgress.celebrated = false;
    }
    save();
    toast('Home saved.');
    // Route to Saved tab + flag a brief celebration on arrival
    state._savedHomeCelebrationId = snapshot.id;
    save();
    showScreen('saved');
    if (typeof renderSaved === 'function') renderSaved();
  }
  window.FurnishCommitSaveHome = commitSaveHome;

  // ==========================================================
  // [Save Home] Profile-screen exclusions UI ("Rooms in your home")
  // ==========================================================
  // 9 toggles, one per HOME_ROOM_ORDER. Min 2 rooms must stay on.
  // Toggling off an already-designed room fires a confirm dialog
  // (Keep it / Exclude and move to Saved). Per spec.
  function renderRoomExclusionsList() {
    const list = document.getElementById('roomExclusionsList');
    const counter = document.getElementById('roomExclusionsCounter');
    if (!list) return;
    list.innerHTML = '';
    const ah = getActiveHome();
    const ROOM_LABELS = (window.ROOM_TYPES || []).reduce((acc, r) => { acc[r.id] = r.label; return acc; }, {});
    const includedCount = HOME_ROOM_ORDER.filter(t => !ah.excludedRooms.includes(t)).length;

    HOME_ROOM_ORDER.forEach(roomType => {
      const isIncluded = !ah.excludedRooms.includes(roomType);
      const row = document.createElement('div');
      row.className = 'pp-setting room-exclusion-row';
      row.setAttribute('role', 'group');
      row.innerHTML = `
        <span class="settings-label">
          <span>${ROOM_LABELS[roomType] || roomType}</span>
        </span>
        <button class="toggle-switch" data-room-toggle="${roomType}" aria-checked="${isIncluded ? 'true' : 'false'}" aria-label="Include ${ROOM_LABELS[roomType] || roomType} in Your Home" type="button">
          <span class="toggle-thumb"></span>
        </button>
      `;
      list.appendChild(row);
      row.querySelector('[data-room-toggle]').addEventListener('click', () => {
        toggleRoomExclusion(roomType);
      });
    });
    if (counter) {
      counter.textContent = includedCount === 9
        ? 'Currently: 9 of 9 included'
        : `Currently: ${includedCount} of 9 included. Keep at least 2 on.`;
    }
  }

  function toggleRoomExclusion(roomType) {
    const ah = getActiveHome();
    const isCurrentlyIncluded = !ah.excludedRooms.includes(roomType);
    if (isCurrentlyIncluded) {
      // Trying to EXCLUDE
      const includedCount = HOME_ROOM_ORDER.filter(t => !ah.excludedRooms.includes(t)).length;
      if (includedCount <= 2) {
        toast('You need at least 2 rooms to build a home.');
        return;
      }
      const hasDesign = ah.designedRooms[roomType] !== null;
      if (hasDesign) {
        // Confirm dialog before excluding a designed room (per spec)
        openExcludeDesignedRoomDialog(roomType);
        return;
      }
      // No existing design → instant exclude
      ah.excludedRooms.push(roomType);
      save();
      trackEvent('room_excluded', { room_type: roomType, had_existing_design: false });
      renderRoomExclusionsList();
      // Re-render the home grid if visible (live update per spec)
      const profile = getActiveProfile();
      if (profile && document.querySelector('[data-screen="home"].active')) renderHomeProgress(profile);
    } else {
      // INCLUDE (un-exclude). Per spec: stays null (user must redesign).
      ah.excludedRooms = ah.excludedRooms.filter(t => t !== roomType);
      save();
      trackEvent('room_unexcluded', { room_type: roomType });
      renderRoomExclusionsList();
      const profile = getActiveProfile();
      if (profile && document.querySelector('[data-screen="home"].active')) renderHomeProgress(profile);
    }
  }

  function openExcludeDesignedRoomDialog(roomType) {
    const ROOM_LABELS = (window.ROOM_TYPES || []).reduce((acc, r) => { acc[r.id] = r.label; return acc; }, {});
    const label = ROOM_LABELS[roomType] || roomType;
    const dlg = document.createElement('div');
    dlg.className = 'modal save-home-dialog open';
    dlg.id = 'excludeDesignedRoomDialog';
    dlg.setAttribute('role', 'dialog');
    dlg.setAttribute('aria-modal', 'true');
    dlg.innerHTML = `
      <div class="modal-card save-home-dialog-card">
        <button class="modal-close" id="excDlgClose" type="button" aria-label="Cancel">×</button>
        <h3>Exclude ${label}?</h3>
        <p class="save-home-dialog-body">You already designed a ${label} for this home. If you exclude it, that design moves to your Saved Rooms instead.</p>
        <div class="save-home-dialog-actions">
          <button class="btn btn-ghost" id="excDlgKeep" type="button" autofocus>Keep it</button>
          <button class="btn reset-dialog-confirm" id="excDlgConfirm" type="button">
            <span class="reset-dialog-confirm-label">Exclude and move to Saved</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(dlg);
    setTimeout(() => dlg.querySelector('#excDlgKeep')?.focus(), 50);
    const close = () => { dlg.classList.remove('open'); setTimeout(() => dlg.remove(), 180); };
    dlg.querySelector('#excDlgClose').addEventListener('click', close);
    dlg.querySelector('#excDlgKeep').addEventListener('click', close);
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
    dlg.querySelector('#excDlgConfirm').addEventListener('click', () => {
      const ah = getActiveHome();
      moveActiveHomeRoomToSaved(roomType, 'exclude');
      ah.excludedRooms.push(roomType);
      save();
      trackEvent('room_excluded', { room_type: roomType, had_existing_design: true });
      renderRoomExclusionsList();
      const profile = getActiveProfile();
      if (profile && document.querySelector('[data-screen="home"].active')) renderHomeProgress(profile);
      close();
      toast(`${label} moved to your Saved Rooms.`);
    });
  }
  window.FurnishRenderRoomExclusionsList = renderRoomExclusionsList;

  // ==========================================================
  // [Save Home] Post-generation save surface
  // ==========================================================
  // Modal that fires once after a successful redesign opens. Two
  // options: Save to Home (primary, with overwrite-protection toast)
  // and Save to Saved Rooms (secondary). Excluded rooms get only
  // Save to Saved Rooms.
  function openPostGenerationSaveSurface(room) {
    if (!room) return;
    if (isRoomClaimed(room.id)) return; // already saved/claimed
    closePostGenerationSaveSurface();
    const ROOM_LABELS = (window.ROOM_TYPES || []).reduce((acc, r) => { acc[r.id] = r.label; return acc; }, {});
    const label = ROOM_LABELS[room.type] || room.type;
    const ah = getActiveHome();
    const isExcluded = ah.excludedRooms.includes(room.type);
    const slotOccupied = ah.designedRooms[room.type] !== null;

    const dlg = document.createElement('div');
    dlg.className = 'modal save-surface-modal open';
    dlg.id = 'saveSurfaceModal';
    dlg.setAttribute('role', 'dialog');
    dlg.setAttribute('aria-modal', 'true');
    dlg.setAttribute('aria-labelledby', 'saveSurfaceTitle');
    dlg.innerHTML = `
      <div class="modal-card save-surface-card">
        <button class="modal-close" id="saveSurfaceClose" type="button" aria-label="Close">×</button>
        <h3 id="saveSurfaceTitle">Save your ${label}</h3>
        ${isExcluded
          ? `<p class="save-surface-note muted small">${label} is excluded from Your Home. Save it to your Saved Rooms instead, or include the room in Settings.</p>`
          : `<p class="save-surface-body">${slotOccupied ? `Replace your current ${label} in Your Home, or save this as a standalone room.` : `Add this ${label} to Your Home, or save it as a standalone room.`}</p>`
        }
        <div class="save-surface-actions">
          ${isExcluded
            ? ''
            : `<button class="btn btn-primary big" id="saveToHomeBtn" type="button">
                <span class="save-surface-cta-label">Save as your ${label} in Your Home</span>
                ${slotOccupied ? `<span class="save-surface-cta-sub muted small">Previous ${label} moves to Saved Rooms</span>` : ''}
              </button>`
          }
          <button class="btn btn-ghost" id="saveToSavedRoomsBtn" type="button">Save to Saved Rooms</button>
        </div>
      </div>
    `;
    document.body.appendChild(dlg);
    const close = () => closePostGenerationSaveSurface();
    dlg.querySelector('#saveSurfaceClose').addEventListener('click', close);
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
    if (!isExcluded) {
      dlg.querySelector('#saveToHomeBtn').addEventListener('click', () => {
        const result = setActiveHomeRoom(room.type, {
          roomId: room.id,
          roomGenerationId: room.id,
          generatedAt: room.timestamp || room.createdAt || Date.now(),
          source: 'save_surface'
        });
        // Update the legacy homeProgress array for backward-compat
        const hp = getHomeProgress();
        if (!hp.designedRooms.includes(room.type)) {
          hp.designedRooms.push(room.type);
          save();
        }
        trackEvent('save_to_home_selected', {
          room_type: room.type,
          overwrote_previous: !!result.overwroteRoomId
        });
        if (result.overwroteRoomId) {
          toast(`${label} updated. Previous design saved to your Saved Rooms.`);
        } else {
          toast(`${label} added to Your Home.`);
        }
        close();
      });
    }
    dlg.querySelector('#saveToSavedRoomsBtn').addEventListener('click', () => {
      const sr = getSavedRoomsList();
      sr.push({
        roomGenerationId: room.id,
        roomId: room.id,
        roomType: room.type,
        savedAt: Date.now(),
        source: 'save_surface',
        reason: 'standalone'
      });
      save();
      trackEvent('save_to_saved_rooms_selected', { room_type: room.type });
      toast(`${label} saved to your Saved Rooms.`);
      close();
    });
  }
  function closePostGenerationSaveSurface() {
    const m = document.getElementById('saveSurfaceModal');
    if (!m) return;
    m.classList.remove('open');
    setTimeout(() => m.remove(), 200);
  }
  window.FurnishOpenPostGenerationSaveSurface = openPostGenerationSaveSurface;

  // ==========================================================
  // [Save Home] Saved tab — saved-homes section + detail view
  // ==========================================================
  function renderSavedHomes() {
    const list = document.getElementById('savedHomesList');
    if (!list) return;
    const homes = getSavedHomes();
    list.innerHTML = '';
    if (!homes.length) {
      list.innerHTML = '<div class="empty-state" style="padding:40px 24px;text-align:center"><p>No saved homes yet. Save your first home from the homepage.</p></div>';
      return;
    }
    const ROOM_LABELS = (window.ROOM_TYPES || []).reduce((acc, r) => { acc[r.id] = r.label; return acc; }, {});
    homes.forEach(home => {
      const designedTypes = HOME_ROOM_ORDER.filter(t => home.rooms[t]);
      const heroTypes = designedTypes.slice(0, 2);
      const dateStr = new Date(home.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const card = document.createElement('button');
      card.className = 'saved-home-card';
      card.type = 'button';
      card.dataset.homeId = home.id;
      card.innerHTML = `
        <div class="shc-hero">
          ${heroTypes.map(t => {
            const sourceRoom = (state.rooms || []).find(r => r.id === home.rooms[t]?.roomId);
            const photo = sourceRoom?.photo;
            return `<div class="shc-hero-thumb" ${photo ? `style="background-image:url('${photo}')"` : ''}></div>`;
          }).join('') || '<div class="shc-hero-thumb shc-hero-thumb--empty"></div>'}
        </div>
        <div class="shc-body">
          <div class="shc-title">Home saved ${dateStr}</div>
          <div class="shc-meta muted small">${designedTypes.length} room${designedTypes.length === 1 ? '' : 's'}</div>
        </div>
      `;
      card.addEventListener('click', () => {
        trackEvent('saved_home_opened', { saved_home_id: home.id, age_days: Math.round((Date.now() - home.savedAt) / 86400000) });
        openSavedHomeDetail(home.id);
      });
      list.appendChild(card);
    });
    // Celebration on the just-saved home (one-shot per save)
    if (state._savedHomeCelebrationId) {
      const targetCard = list.querySelector(`[data-home-id="${state._savedHomeCelebrationId}"]`);
      if (targetCard) {
        targetCard.classList.add('saved-home-card--celebrating');
        setTimeout(() => targetCard.classList.remove('saved-home-card--celebrating'), 1800);
      }
      delete state._savedHomeCelebrationId;
      save();
    }
  }

  function openSavedHomeDetail(homeId) {
    state._savedHomeDetailId = homeId;
    save();
    showScreen('saved-home-detail');
    renderSavedHomeDetail();
  }
  function renderSavedHomeDetail() {
    const homeId = state._savedHomeDetailId;
    const home = getSavedHomes().find(h => h.id === homeId);
    const grid = document.getElementById('savedHomeDetailGrid');
    const meta = document.getElementById('savedHomeDetailMeta');
    const title = document.getElementById('savedHomeDetailTitle');
    if (!home || !grid) return;
    const dateStr = new Date(home.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (title) title.textContent = `Home saved ${dateStr}`;
    const designedTypes = HOME_ROOM_ORDER.filter(t => home.rooms[t]);
    if (meta) meta.textContent = `${designedTypes.length} room${designedTypes.length === 1 ? '' : 's'} · saved ${dateStr}`;
    const ROOM_LABELS = (window.ROOM_TYPES || []).reduce((acc, r) => { acc[r.id] = r.label; return acc; }, {});
    grid.innerHTML = '';
    designedTypes.forEach(t => {
      const entry = home.rooms[t];
      const sourceRoom = (state.rooms || []).find(r => r.id === entry?.roomId);
      const card = document.createElement('button');
      card.className = 'saved-home-detail-card';
      card.type = 'button';
      const photo = sourceRoom?.photo;
      const total = (sourceRoom?.items || []).reduce((s, i) => s + (i.price || 0), 0);
      card.innerHTML = `
        <div class="shdc-photo" ${photo ? `style="background-image:url('${photo}')"` : ''}></div>
        <div class="shdc-body">
          <div class="shdc-label">${ROOM_LABELS[t] || t}</div>
          ${sourceRoom ? `<div class="shdc-meta muted small">${(sourceRoom.items || []).length} pieces · $${total.toLocaleString()}</div>` : '<div class="shdc-meta muted small">Room data archived</div>'}
        </div>
      `;
      if (sourceRoom) card.addEventListener('click', () => openRoom(sourceRoom.id));
      grid.appendChild(card);
    });
    // Wire the topbar actions
    const reopenBtn = document.getElementById('savedHomeReopenBtn');
    const deleteBtn = document.getElementById('savedHomeDeleteBtn');
    if (reopenBtn) reopenBtn.onclick = () => onReopenSavedHome(home);
    if (deleteBtn) deleteBtn.onclick = () => onDeleteSavedHome(home);
  }

  function onReopenSavedHome(home) {
    const ah = getActiveHome();
    const hasProgress = HOME_ROOM_ORDER.some(t => ah.designedRooms[t] !== null);
    if (hasProgress && !confirm('You have an in-progress home. Re-opening this saved home will replace it. Continue?')) return;
    state.user.activeHome = {
      id: uuid(),
      startedAt: Date.now(),
      excludedRooms: (home.excludedRooms || []).slice(),
      designedRooms: JSON.parse(JSON.stringify(home.rooms)),
      celebrated: false
    };
    // Sync legacy homeProgress array
    if (state.user.homeProgress) {
      state.user.homeProgress.designedRooms = HOME_ROOM_ORDER.filter(t => state.user.activeHome.designedRooms[t]);
      state.user.homeProgress.celebrated = false;
    }
    save();
    trackEvent('saved_home_reopened', { saved_home_id: home.id });
    toast('Saved home re-opened.');
    showScreen('home');
    if (typeof renderHome === 'function') renderHome();
  }
  function onDeleteSavedHome(home) {
    if (!confirm(`Delete this saved home from ${new Date(home.savedAt).toLocaleDateString()}? This can't be undone.`)) return;
    const homes = getSavedHomes();
    const idx = homes.findIndex(h => h.id === home.id);
    if (idx >= 0) homes.splice(idx, 1);
    save();
    trackEvent('saved_home_deleted', { saved_home_id: home.id, age_days: Math.round((Date.now() - home.savedAt) / 86400000) });
    toast('Saved home deleted.');
    showScreen('saved');
    if (typeof renderSaved === 'function') renderSaved();
  }
  window.FurnishRenderSavedHomes = renderSavedHomes;
  window.FurnishRenderSavedHomeDetail = renderSavedHomeDetail;

  // ==========================================================
  // [Save Home] Bottom nav Saved tab badge — derived selector
  // ==========================================================
  function hasSavedItems() {
    return getSavedHomes().length > 0 || getSavedRoomsList().length > 0;
  }
  function updateSavedTabBadge() {
    const badge = document.querySelector('.bn-tab[data-tab="saved"] .bn-tab-badge');
    if (!badge) return;
    const show = hasSavedItems();
    badge.style.display = show ? '' : 'none';
  }
  window.FurnishUpdateSavedTabBadge = updateSavedTabBadge;

  // [Your Home progress] Flyout for un-designed cells. Pinned to the
  // tapped cell. Two CTAs: Upload a photo (routes to capture with
  // state.draft.suggestedType pre-seeded) and Pick from a style (routes
  // to templates with state._templateRoomFilter pre-seeded). Dismisses
  // on outside-click / Escape / scroll / picking either CTA.
  let _hpFlyoutCloseHandler = null;
  function openHomeProgressFlyout(roomType, anchorBtn) {
    closeHomeProgressFlyout();
    if (!anchorBtn || !roomType) return;
    const ROOM_LABELS = (window.ROOM_TYPES || []).reduce((acc, r) => { acc[r.id] = r.label; return acc; }, {});
    const label = ROOM_LABELS[roomType] || roomType;
    const fly = document.createElement('div');
    fly.className = 'hp-flyout';
    fly.id = 'hpFlyout';
    fly.setAttribute('role', 'dialog');
    fly.setAttribute('aria-label', `Start a ${label} redesign`);
    fly.innerHTML = `
      <div class="hp-flyout-arrow" aria-hidden="true"></div>
      <div class="hp-flyout-card">
        <p class="hp-flyout-title">Start your ${label}</p>
        <button class="hp-flyout-cta" data-hpf-action="upload" type="button">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Upload a photo
        </button>
        <button class="hp-flyout-cta hp-flyout-cta-secondary" data-hpf-action="pick" type="button">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          Pick from a style
        </button>
      </div>
    `;
    document.body.appendChild(fly);
    // Position relative to the anchor button
    const r = anchorBtn.getBoundingClientRect();
    const flyW = 240;
    const left = Math.max(12, Math.min(window.innerWidth - flyW - 12, r.left + r.width / 2 - flyW / 2));
    const top = r.bottom + window.scrollY + 8;
    fly.style.left = left + 'px';
    fly.style.top = top + 'px';
    fly.style.width = flyW + 'px';
    requestAnimationFrame(() => fly.classList.add('open'));

    if (state.user && state.user.homeProgress) {
      state.user.homeProgress.flyoutLastRoom = roomType;
      save();
    }
    trackEvent('home_progress_flyout_opened', { room_type: roomType, source: 'card_tap' });

    // CTA wiring — mark `actionTaken` before close so the dismiss-
    // without-action analytics doesn't double-fire.
    fly.querySelector('[data-hpf-action="upload"]')?.addEventListener('click', () => {
      fly.dataset.actionTaken = 'upload_photo';
      trackEvent('home_progress_flyout_action', { room_type: roomType, action: 'upload_photo' });
      closeHomeProgressFlyout();
      // Pre-seed the draft with the chosen room type. Existing capture
      // flow honors state.draft.type during prepareCapture's room-type
      // chooser (renders selected if set).
      state.draft = { type: roomType, photo: null, dims: { w: 12, l: 14, h: 9 }, keep: false };
      state.draft.suggestedType = roomType; // explicit hint for the chooser
      save();
      showScreen('capture');
      if (typeof prepareCapture === 'function') prepareCapture();
    });
    fly.querySelector('[data-hpf-action="pick"]')?.addEventListener('click', () => {
      fly.dataset.actionTaken = 'pick_style';
      trackEvent('home_progress_flyout_action', { room_type: roomType, action: 'pick_style' });
      closeHomeProgressFlyout();
      // Pre-seed the templates filter so the templates screen highlights
      // matching-room templates. Existing renderTemplates logic doesn't
      // yet honor this — flagged in DEFERRED.md as content/render follow-up.
      state._templateRoomFilter = roomType;
      save();
      showScreen('templates');
      if (typeof renderTemplates === 'function') renderTemplates();
    });
    // Outside-click + Escape + scroll dismissal
    _hpFlyoutCloseHandler = (e) => {
      if (e.type === 'keydown' && e.key !== 'Escape') return;
      if (e.type === 'click' && fly.contains(e.target)) return;
      if (e.type === 'click' && anchorBtn.contains(e.target)) return; // don't immediately close on the trigger click bubble
      closeHomeProgressFlyout();
    };
    setTimeout(() => {
      document.addEventListener('click', _hpFlyoutCloseHandler);
      document.addEventListener('keydown', _hpFlyoutCloseHandler);
      window.addEventListener('scroll', closeHomeProgressFlyout, { passive: true });
    }, 0);
  }
  function closeHomeProgressFlyout() {
    const fly = document.getElementById('hpFlyout');
    if (fly) {
      const lastRoom = state.user?.homeProgress?.flyoutLastRoom || 'unknown';
      // Only fire the dismiss-without-action event if the flyout was
      // closed without picking a CTA. The CTA handlers fire their own
      // 'upload_photo' / 'pick_style' events before calling close, so
      // by the time we get here, the action was already counted IF
      // the flyout's data-action attribute is set.
      if (!fly.dataset.actionTaken) {
        trackEvent('home_progress_flyout_action', { room_type: lastRoom, action: 'dismiss' });
      }
      fly.classList.remove('open');
      setTimeout(() => fly.remove(), 200);
    }
    if (_hpFlyoutCloseHandler) {
      document.removeEventListener('click', _hpFlyoutCloseHandler);
      document.removeEventListener('keydown', _hpFlyoutCloseHandler);
      window.removeEventListener('scroll', closeHomeProgressFlyout);
      _hpFlyoutCloseHandler = null;
    }
  }
  window.FurnishOpenHomeProgressFlyout = openHomeProgressFlyout;

  // Lifecycle scheduler — would-fire log for the welcome / mid-funnel /
  // dormant / churned campaigns from the Retention pass strategy doc.
  // Each campaign has: (a) a trigger predicate, (b) a one-shot key so we
  // don't re-fire it, (c) the analytics event the future backend will use
  // to actually send the message, (d) the copy.
  //
  // CONTRACT: when the email/push backend lands, replace the would-fire
  // event with the real send call. Triggers, predicates, and copy stay
  // unchanged. Per Reforge Engagement Engine — signal/strategy/path/measure.
  const LIFECYCLE_CAMPAIGNS = [
    {
      key: 'welcome_d1_check_prices',
      channel: 'push',
      when: (ctx) => ctx.daysSinceFirstRoom >= 1 && ctx.daysSinceFirstRoom < 2 && ctx.totalRooms >= 1,
      copy: { title: 'Check your price tags', body: '3 of your picks are under $100 today.' },
    },
    {
      key: 'welcome_d3_next_room',
      channel: 'push',
      when: (ctx) => ctx.daysSinceFirstRoom >= 3 && ctx.daysSinceFirstRoom < 4 && ctx.totalRooms === 1,
      copy: { title: 'Your style works for 8 more rooms', body: "Here's your kitchen." },
    },
    {
      key: 'welcome_d7_first_drop',
      channel: 'email',
      when: (ctx) => ctx.daysSinceFirstRoom >= 7 && ctx.daysSinceFirstRoom < 9 && ctx.totalRooms >= 1,
      copy: { title: 'Week 1 wrapped', body: "Your style is dialled in. Here's this week's drop." },
    },
    {
      key: 'mid_d14_price_watch',
      channel: 'push',
      when: (ctx) => ctx.daysSinceFirstRoom >= 14 && ctx.daysSinceFirstRoom < 16 && ctx.wishlistCount > 0,
      copy: { title: '2 weeks in', body: '1 of your saved items dropped 22%. Tap to see.' },
    },
    {
      key: 'mid_d30_recap',
      channel: 'inapp',
      when: (ctx) => ctx.daysSinceFirstRoom >= 30 && ctx.daysSinceFirstRoom < 33,
      copy: { title: '30 days of your style', body: "Here's what changed." },
    },
    {
      key: 'dormant_d60_warm',
      channel: 'email',
      when: (ctx) => ctx.lifecycle === LIFECYCLE.DORMANT && ctx.daysSincePrev >= 60 && ctx.daysSincePrev < 90,
      copy: { title: 'New in your style', body: "We haven't seen you. Here's what's new." },
    },
    {
      key: 'dormant_d90_seasonal',
      channel: 'push',
      when: (ctx) => ctx.lifecycle === LIFECYCLE.DORMANT && ctx.daysSincePrev >= 90 && ctx.daysSincePrev < 120,
      copy: { title: 'Spring 2026 in your style', body: 'Tap to see.' },
    },
    {
      key: 'churned_d180_refresh',
      channel: 'email',
      when: (ctx) => ctx.lifecycle === LIFECYCLE.CHURNED && ctx.daysSincePrev >= 180,
      copy: { title: 'Your bedroom is from 6 months ago', body: "See today's take on it." },
    },
    // [Batch 4 — Dim 05 Rec 3 / Loop 4] Wishlist-age recall.
    // Per ICED Theory Expanding Touchpoints (R+E / 09 BONUS / 06): a
    // saved-but-unfired wishlist item ages into a recall trigger. Catches
    // users that Loops 1-3 miss (saved items but no price drops fired and
    // no organic return). Per Reforge Frequency Strategy: time-based
    // manufactured trigger.
    {
      key: 'wishlist_age_d90_recall',
      channel: 'email',
      when: (ctx) => ctx.oldestWishlistAgeDays >= 90 && ctx.wishlistCount > 0 && ctx.daysSincePrev < 60,
      copy: { title: 'Still on your list?', body: 'Pieces you saved 3 months ago — some prices may have shifted.' },
    },
  ];

  function runLifecycleScheduler() {
    if (!state.user) return;
    state._lifecycleSent = state._lifecycleSent || {};
    const profile = getActiveProfile();
    const rooms = (state.rooms || []).filter(r => !profile || r.profileId === profile.id);
    const firstRoomCreatedAt = rooms.length ? Math.min(...rooms.map(r => r.createdAt || Date.now())) : null;
    const ctx = {
      lifecycle: getLifecycleState(),
      daysSincePrev: state.user.previousVisitAt ? daysSince(state.user.previousVisitAt) : 0,
      daysSinceFirstRoom: firstRoomCreatedAt ? daysSince(firstRoomCreatedAt) : 0,
      totalRooms: rooms.length,
      wishlistCount: (state.wishlist || []).length,
      // [Batch 4 — Dim 05 Rec 3] Predicate input for wishlist_age_d90_recall.
      oldestWishlistAgeDays: oldestWishlistAgeDays(),
      // [Batch 4 — Dim 05 Rec 2 Option B] Push delivery tier flag for
      // backend filter — Free gets thinner cadence than Pro.
      pushTier: pushDeliveryTierForUser(),
    };
    LIFECYCLE_CAMPAIGNS.forEach(campaign => {
      if (state._lifecycleSent[campaign.key]) return;
      if (!campaign.when(ctx)) return;
      // Mark fired immediately so we don't double-log this session.
      state._lifecycleSent[campaign.key] = Date.now();
      save();
      // Would-fire event — backend cutover replaces this with a real send.
      trackEvent('lifecycle_would_fire', {
        campaign: campaign.key,
        channel: campaign.channel,
        title: campaign.copy.title,
        body: campaign.copy.body,
        ctx: { ...ctx },
      });
    });
  }
  // Expose for QA / future backend wiring.
  window.FurnishLifecycle = { campaigns: LIFECYCLE_CAMPAIGNS, run: runLifecycleScheduler };

  // Lifecycle banner — copy + CTA differs by user state per Reforge ICED:
  //   ACTIVE: subtle continue-where-you-left-off (handled by resume card)
  //   AT_RISK: "It's been [N] days. Trends moved — see what's new in your style"
  //   DORMANT: "Welcome back. Your saved style + new arrivals."
  //   CHURNED: re-acquisition framing — "Pick up where you left off (no signup needed)"
  // ============================================================
  // [Batch 5 Part 2 — Dim 02 D02-11] Welcome-back commitment card.
  // Quotes the user's own past quiz answers as commitment evidence.
  // Per Reforge ELMR Motivation — Consistency motivational boost: ask
  // user to reaffirm a stated position, then follow with the ask. Per
  // 4S Selfish: using the user's own words is the highest form of
  // selfish copy. Fires once per day (per-user) when lifecycle != NEW
  // and profile has ≥3 core answers populated.
  // ============================================================

  function welcomeBackShouldShow(profile) {
    if (!profile) return false;
    const lifecycle = getLifecycleState();
    if (lifecycle === LIFECYCLE.NEW || lifecycle === LIFECYCLE.ACTIVE) return false;
    const answers = (profile && profile.answers) || {};
    const populatedCount = ['vibe','materials','color_appetite','room_use','scope','avoid','dealbreaker','natural_light','decor_density']
      .filter(k => {
        const v = answers[k];
        if (v === undefined || v === null) return false;
        if (Array.isArray(v)) return v.length > 0;
        return true;
      }).length;
    if (populatedCount < 3) return false;
    const today = new Date().toISOString().slice(0, 10);
    if (state.user?._welcomeBackLastShown === today) return false;
    return true;
  }

  function formatPastQuizSummary(profile) {
    const answers = (profile && profile.answers) || {};
    const parts = [];
    const vibeLabels = {
      calm_grounded: 'calm + grounded', energized_creative: 'energized + creative',
      cozy_protected: 'cozy + protected', elevated_hotel: 'elevated + hotel-like',
      inspired_artist: 'inspired + artist'
    };
    if (answers.vibe && vibeLabels[answers.vibe]) parts.push(vibeLabels[answers.vibe]);
    const colorLabels = {
      warm: 'warm tones', cool: 'cool tones', neutral: 'a neutral palette',
      saturated: 'bold color', monochromatic: 'a monochromatic palette'
    };
    if (answers.color_appetite && colorLabels[answers.color_appetite]) {
      parts.push(colorLabels[answers.color_appetite]);
    }
    // [BUDGET_RESET_PASS] budget_tier removed from onboarding. Budget is now
    // a transient slider on the capture screen; the past-quiz summary line
    // intentionally omits dollar figures.
    const avoid = Array.isArray(answers.avoid) ? answers.avoid : [];
    const realAvoids = avoid.filter(x => x !== 'nothing');
    if (realAvoids.length) {
      parts.push(`skipping ${realAvoids.slice(0, 2).join(' + ')}`);
    }
    return parts.join(', ');
  }

  function renderWelcomeBackCommitmentCard() {
    const hero = document.querySelector('.home-hero');
    if (!hero) return;
    hero.querySelector('.welcome-back-commit')?.remove();
    const profile = getActiveProfile();
    if (!welcomeBackShouldShow(profile)) return;
    const summary = formatPastQuizSummary(profile);
    if (!summary) return;
    const lastSeenDays = daysSince(state.user?.previousVisitAt || state.user?.lastVisitedAt);
    let prefix = 'Last time';
    if (lastSeenDays && lastSeenDays >= 1) {
      prefix = `${lastSeenDays} day${lastSeenDays === 1 ? '' : 's'} ago`;
      prefix = prefix[0].toUpperCase() + prefix.slice(1);
    }
    const greetName = profile?.name && profile.name !== 'You' ? `, ${profile.name}` : '';
    const card = document.createElement('div');
    card.className = 'welcome-back-commit';
    card.innerHTML = `
      <div class="wbc-headline"><strong>Welcome back${greetName}.</strong></div>
      <div class="wbc-body">${prefix} you told us: <em>${summary}</em>. Still true?</div>
      <div class="wbc-actions">
        <button class="btn btn-primary wbc-yes" type="button">Yes — design more</button>
        <button class="btn btn-ghost wbc-update" type="button">Update my style</button>
      </div>
    `;
    hero.insertBefore(card, hero.firstChild);
    if (!state.user) state.user = {};
    state.user._welcomeBackLastShown = new Date().toISOString().slice(0, 10);
    save();
    trackEvent('welcome_back_commitment_shown', { lifecycleState: getLifecycleState(), populatedAxes: summary.split(', ').length });
    card.querySelector('.wbc-yes')?.addEventListener('click', () => {
      trackEvent('welcome_back_commitment_yes', { lifecycleState: getLifecycleState() });
      card.remove();
      const lc = getLifecycleState();
      if (lc === LIFECYCLE.DORMANT && (state.wishlist || []).length) {
        document.getElementById('wishlistBtn')?.click();
      } else {
        document.querySelector('[data-go="capture"]')?.click();
      }
    });
    card.querySelector('.wbc-update')?.addEventListener('click', () => {
      trackEvent('welcome_back_commitment_update', { lifecycleState: getLifecycleState() });
      card.remove();
      if (profile?.id && typeof openPreferences === 'function') openPreferences(profile.id);
    });
  }
  window.FurnishRenderWelcomeBack = renderWelcomeBackCommitmentCard;

  // [Batch 5 Part 2 — Dim 02 D02-5 modified] Style-profile completeness
  // gauge. Counts 8 axes (6 onboarding answers + ≥3 saves + ≥1 redesign).
  // Monotonic — never decreases (per Reforge endowment: once endowed,
  // ownership feeling never reduces). The deterministic SVG fingerprint
  // generator originally proposed is L-effort and deferred to a future
  // polish batch; this ships the % gauge + identity summary only.
  function computeStyleProfileCompleteness(profile) {
    const answers = (profile && profile.answers) || {};
    const axes = [
      answers.vibe,
      Array.isArray(answers.materials) && answers.materials.length > 0,
      answers.color_appetite,
      // [BUDGET_RESET_PASS] budget_tier removed; replaced in the axes
      // array with decor_density to keep the gauge at 8 dimensions.
      answers.decor_density,
      answers.scope,
      answers.room_use,
      (state.wishlist || []).length >= 3,
      (state.rooms || []).length >= 1
    ];
    const populated = axes.filter(Boolean).length;
    const pctNow = Math.round((populated / axes.length) * 100);
    if (!profile) return pctNow;
    const stored = profile._maxCompleteness || 0;
    if (pctNow > stored) {
      profile._maxCompleteness = pctNow;
      save();
      return pctNow;
    }
    return Math.max(pctNow, stored);
  }
  window.FurnishStyleCompleteness = computeStyleProfileCompleteness;

  function renderStyleProfileGauge(profile, host) {
    if (!host) return;
    host.querySelector('.style-dna-card')?.remove();
    if (!profile) return;
    const pct = computeStyleProfileCompleteness(profile);
    const summary = formatPastQuizSummary(profile);
    const card = document.createElement('div');
    card.className = 'style-dna-card';
    const hint = pct < 100
      ? ((state.wishlist || []).length < 3
          ? 'Save a few more pieces and your AI gets sharper.'
          : 'Design another room and your style sharpens.')
      : '';
    card.innerHTML = `
      <div class="sdc-row">
        <div class="sdc-label"><strong>Your style profile</strong> — ${pct}% complete</div>
        <div class="sdc-bar"><span class="sdc-bar-fill" style="width:${pct}%"></span></div>
      </div>
      ${summary ? `<div class="sdc-summary">${summary}.</div>` : ''}
      ${hint ? `<div class="sdc-hint muted small">${hint}</div>` : ''}
    `;
    host.prepend(card);
  }
  window.FurnishRenderStyleGauge = renderStyleProfileGauge;

  // Goal per ICED p.18: counteract "product recall decay over time" with a
  // targeted recall trigger sized to dormancy depth.
  function renderLifecycleBanner() {
    const hero = document.querySelector('.home-hero');
    if (!hero) return;
    hero.querySelector('.lifecycle-banner')?.remove();
    const lifecycle = getLifecycleState();
    if (lifecycle === LIFECYCLE.NEW || lifecycle === LIFECYCLE.ACTIVE) return;
    const days = daysSince(state.user?.previousVisitAt || state.user?.lastVisitedAt);
    const designDays = daysSinceLastDesign();
    const wishlistCount = (state.wishlist || []).length;
    const profile = getActiveProfile();
    const styleNames = (profile?.styles || []).slice(0, 2)
      .map(id => (window.STYLES || []).find(s => s.id === id)?.label || id)
      .join(' + ');

    // [Conflict 1 lock — no calendar-period language in user copy.
    //  Quarterly Core stays as the internal strategic frame; user copy
    //  uses experiential trigger-language ("when you're ready", "since
    //  your last visit") rather than calendar-period framing ("14 days",
    //  "every day", "this month"). Per Reforge — strategic frames are
    //  for the team, copy is for users. Real days-count is preserved
    //  in analytics (lifecycle_banner_shown { days, designDays }).]
    let badge, title, body, ctaLabel, ctaAction;
    if (lifecycle === LIFECYCLE.AT_RISK) {
      badge = 'WELCOME BACK';
      title = 'New arrivals in your style';
      body = styleNames
        ? `We added pieces in ${styleNames} since your last visit.`
        : 'New pieces dropped in styles you might love.';
      ctaLabel = "See What's New";
      ctaAction = () => { document.querySelector('[data-go="templates"]')?.click(); };
    } else if (lifecycle === LIFECYCLE.DORMANT) {
      badge = 'WELCOME BACK';
      title = wishlistCount > 0 ? `${wishlistCount} saved pieces — and what's new` : 'Your style is still saved';
      body = wishlistCount > 0
        ? `Some of your saved pieces dropped in price. New picks added in ${styleNames || 'your aesthetic'}.`
        : `Come back when you're ready to redesign another room.`;
      ctaLabel = wishlistCount > 0 ? 'Check Your Saved' : "Browse What's New";
      ctaAction = () => {
        if (wishlistCount > 0) document.getElementById('wishlistBtn')?.click();
        else document.querySelector('[data-go="templates"]')?.click();
      };
    } else if (lifecycle === LIFECYCLE.CHURNED) {
      badge = 'PICK UP WHERE YOU LEFT OFF';
      title = 'Your style is still saved';
      body = `Your style profile is intact. New pieces have been added in ${styleNames || 'your aesthetic'} since your last design.`;
      ctaLabel = 'Design A New Room';
      ctaAction = () => { document.querySelector('[data-go="capture"]')?.click(); };
      // [Batch 4 — Dim 05 Rec 7] Resurrection peak-moment surfacing.
      // For churned users, surface the user's most-engaged room by name.
      // Per ICED Theory Plant Loyalty Hook: peak moments reinforce recall
      // far better than generic style references.
      const peakId = computePeakRoomId();
      const peak = peakId ? state.rooms?.find(r => r.id === peakId) : null;
      if (peak) {
        const peakRoomLabel = (peak.type || 'room').toLowerCase();
        title = `Your ${peakRoomLabel} is still saved`;
        body = `Your ${peakRoomLabel} from earlier is still here. New pieces in ${styleNames || 'your aesthetic'} since you designed it.`;
        ctaAction = () => { state._resumePeakRoomId = peak.id; save(); document.querySelector('[data-go="rooms"]')?.click(); };
      }
    }

    // [Batch 4 — Dim 07 D5] Override with style-variant copy if available.
    // Per Engagement Engine Step Three: Message is per-user, not per-bucket.
    const styleCopy = lifecycleBannerCopyForState(profile, lifecycle?.toUpperCase?.() || lifecycle);
    if (styleCopy) {
      title = styleCopy.title;
      body  = styleCopy.body;
    }

    // [Batch 5 Part 2 — Dim 02 D02-7 modified] Qualitative cohort framing.
    // Original Reforge proposal used fake numbers ("142 other Modern + Scandi
    // fans designed new rooms this week") which violates Conflict 4 (no fake
    // numbers, ever). Modified to a qualitative cohort-belonging signal that
    // only fires when real styleNames are set. Per Reforge Resurrection
    // Strategies: Belonging is the highest-conversion lever for dormant
    // users; per ELMR Motivation: Belonging boost outperforms Bargain at
    // resurrection. No counts shipped pre-launch.
    let cohortLine = '';
    if (styleNames) {
      cohortLine = `<p class="lcb-cohort muted small">Fellow ${styleNames} fans are designing too.</p>`;
    }

    const banner = document.createElement('div');
    banner.className = 'lifecycle-banner lc-' + lifecycle;
    banner.innerHTML = `
      <div class="lcb-badge">${badge}</div>
      <h3 class="lcb-title">${title}</h3>
      <p class="lcb-body">${body}</p>
      ${cohortLine}
      <button class="btn btn-primary lcb-cta" type="button">${ctaLabel}</button>
    `;
    hero.prepend(banner);
    banner.querySelector('.lcb-cta').addEventListener('click', () => {
      trackEvent('lifecycle_banner_clicked', { lifecycle, days });
      ctaAction();
    });
    trackEvent('lifecycle_banner_shown', { lifecycle, days, designDays });
  }

  // [Model A] Explore welcome card — shown once after a guest converts to a
  // signed-in account post-D7. Now positioned around shopping + browsing,
  // not Pro upgrade. The home below is fully free; nothing to "unlock."
  function renderExploreWelcome() {
    const hero = document.querySelector('.home-hero');
    if (!hero) return;
    hero.querySelector('.explore-welcome')?.remove();
    if (!state._showExploreWelcome || isPro()) return;
    state._showExploreWelcome = false;
    save();
    const card = document.createElement('div');
    card.className = 'explore-welcome';
    // [Compute-quality routing] No more "N free redesigns remaining" line —
    // unlimited generations make that copy obsolete. Just shop + save guidance.
    card.innerHTML = `
      <div class="ew-badge">WELCOME</div>
      <h3 class="ew-title">You're in. Start shopping your style.</h3>
      <p class="ew-sub">Tap any item in your redesign to view it at the retailer. Save favorites to your wishlist.</p>
      <button class="btn btn-primary big ew-cta" type="button">Browse My Redesign</button>
      <button class="btn btn-ghost small ew-dismiss" type="button">Got it</button>
    `;
    hero.prepend(card);
    card.querySelector('.ew-cta').addEventListener('click', () => {
      trackEvent('explore_welcome_browse_clicked');
      // Find their most recent room and open it.
      const rooms = (state.rooms || []).filter(r => r.profileId === state.activeProfileId);
      const last = rooms[rooms.length - 1];
      if (last) openRoom(last.id);
    });
    card.querySelector('.ew-dismiss').addEventListener('click', () => {
      card.classList.add('out');
      setTimeout(() => card.remove(), 220);
    });
  }

  // [Removed in Model A migration] The home click interceptor was a capture-
  // phase listener that paywalled every home feature for non-Pro users. Under
  // Model A — affiliate-maximalist — the home is fully free. Quota gating
  // happens at the AI-generation entry points only (analyzeBtn, template tap).

  function showTemplateTip() {
    const tmplBtn = document.querySelector('.home-ctas [data-go="templates"]');
    if (!tmplBtn) return;
    // Remove any prior instance
    document.querySelectorAll('.template-tip').forEach(el => el.remove());
    const tip = document.createElement('div');
    tip.className = 'template-tip';
    tip.innerHTML = `
      <div class="tt-arrow"></div>
      <div class="tt-body">
        <strong>Try a Template</strong>
        <span>Start from a curated room when you want a predictable, professionally styled result — no photo needed.</span>
      </div>
      <button class="tt-close" type="button" aria-label="Dismiss">×</button>
    `;
    document.body.appendChild(tip);
    // Position under the button
    const rect = tmplBtn.getBoundingClientRect();
    const tipW = Math.min(280, window.innerWidth - 24);
    const cx   = rect.left + rect.width / 2;
    const left = Math.max(12, Math.min(window.innerWidth - tipW - 12, cx - tipW / 2));
    tip.style.top  = (rect.bottom + window.scrollY + 12) + 'px';
    tip.style.left = left + 'px';
    tip.style.width = tipW + 'px';
    // Arrow points to the CTA center
    tip.querySelector('.tt-arrow').style.left = (cx - left - 7) + 'px';
    // Pulse the button for a beat
    tmplBtn.classList.add('tt-pulse');
    const dismiss = () => {
      tip.classList.add('out');
      tmplBtn.classList.remove('tt-pulse');
      setTimeout(() => tip.remove(), 220);
    };
    tip.querySelector('.tt-close').addEventListener('click', dismiss);
    tip.addEventListener('click', e => { if (e.target === tip) dismiss(); });
    setTimeout(dismiss, 10000);
  }

  // Personalize the home hero based on state (Reforge Engagement — dynamic
  // return-visit CTA, not a static banner). Three modes:
  //  - first-time:  aha-focused CTA, no rooms yet
  //  - just-designed: shows last room prominently + "Design another"
  //  - returning: "Continue where you left off" if a draft exists, else last-room card
  function renderResumeHero(profile) {
    const hero = document.querySelector('.home-hero');
    if (!hero || !profile) return;
    const rooms = state.rooms.filter(r => r.profileId === profile.id);
    const last  = rooms.length ? rooms[rooms.length - 1] : null;
    const draft = state.draft && state.draft.photo ? state.draft : null;

    // Clear any previous resume-card (re-renders on every home entry)
    hero.querySelector('.resume-card')?.remove();

    if (draft) {
      // In-progress draft: urgency = don't lose work.
      const card = document.createElement('button');
      card.className = 'resume-card resume-draft';
      card.innerHTML = `
        <div class="rc-thumb" style="background-image:url('${draft.photo}')"></div>
        <div class="rc-body">
          <span class="rc-tag">UNFINISHED</span>
          <strong>Finish designing your room</strong>
          <span class="rc-sub">Tap to pick up where you left off</span>
        </div>
        <span class="rc-arrow">→</span>
      `;
      card.addEventListener('click', () => { showScreen('capture'); prepareCapture(); });
      hero.appendChild(card);
    } else if (last) {
      // C15 — Show how long ago they designed this. Reforge ICED p.18 says
      // recall fades over time; surfacing the time gap is a recall trigger
      // ("oh right, I made that 18 days ago — let me check it").
      const ageDays = daysSince(last.createdAt);
      const ageLabel = ageDays === 0 ? 'today'
        : ageDays === 1 ? 'yesterday'
        : ageDays < 30 ? `${ageDays}d ago`
        : ageDays < 365 ? `${Math.floor(ageDays / 30)}mo ago`
        : `${Math.floor(ageDays / 365)}y ago`;
      const card = document.createElement('button');
      card.className = 'resume-card resume-last';
      card.innerHTML = `
        <div class="rc-thumb" style="background-image:url('${last.photo || ''}')"></div>
        <div class="rc-body">
          <span class="rc-tag">YOUR LAST ROOM <span class="rc-age">· ${ageLabel}</span></span>
          <strong>${titleRoom(last.type)} · $${last.items.reduce((s,i)=>s+i.price,0).toLocaleString()}</strong>
          <span class="rc-sub">Tap to reopen · or design a new room below</span>
        </div>
        <span class="rc-arrow">→</span>
      `;
      card.addEventListener('click', () => openRoom(last.id));
      hero.appendChild(card);
    }
  }

  // ---------- Reusable empty-state markup ----------
  // Named SVG icon set for empty states — replaces the previous emoji glyphs.
  const EMPTY_ICONS = {
    rooms: '<svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14V12a3 3 0 013-3h12a3 3 0 013 3v2"/><path d="M2 14h20v5H2z"/><path d="M5 19v2M19 19v2"/></svg>',
    items: '<svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>'
  };
  function emptyStateHTML({ icon, title, body, cta, ctaTarget }) {
    const ctaBtn = cta
      ? `<button class="btn btn-primary" data-empty-go="${ctaTarget||''}">${cta}</button>`
      : '';
    // If `icon` is a known key, swap it for our SVG. If it's already an SVG
    // string, use it as-is. Anything else falls back to a small text glyph.
    let art;
    if (typeof icon === 'string' && EMPTY_ICONS[icon]) art = EMPTY_ICONS[icon];
    else if (typeof icon === 'string' && icon.indexOf('<svg') >= 0) art = icon;
    else art = `<span aria-hidden="true">${icon || '◠'}</span>`;
    return `
      <div class="empty-pro">
        <div class="empty-pro-art">${art}</div>
        <h4>${title || 'Nothing here yet'}</h4>
        <p>${body || ''}</p>
        ${ctaBtn}
      </div>
    `;
  }

  // ---------- Saved Items strip on Home ----------
  function renderHomeSavedItems() {
    const strip = $('#homeSavedItems');
    if (!strip) return;
    strip.innerHTML = '';
    const ids = state.wishlist || [];
    if (ids.length === 0) {
      strip.innerHTML = emptyStateHTML({
        icon: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6C19 16.5 12 21 12 21z"/></svg>',
        title: 'No Saved Items Yet',
        body: 'Tap an item in any redesign to save it for later.',
      });
      return;
    }
    // Sort by savedAt descending so most recent saves surface first; older
    // saves get a "saved N days ago" recall hook (Reforge ICED p.6 — recall is
    // the limiting factor for infrequent products).
    const meta = state.wishlistMeta || {};
    const ranked = ids.slice().sort((a, b) => (meta[b]?.savedAt || 0) - (meta[a]?.savedAt || 0));
    ranked.slice(0, 12).forEach(id => {
      const item = window.FURNITURE_DB.find(i => i.id === id);
      if (!item) return;
      const m = meta[id];
      const ageDays = m?.savedAt ? daysSince(m.savedAt) : null;
      // Recall hook: only surface age when it's been more than a few days
      const ageLabel = ageDays != null && ageDays >= 3
        ? `<div class="saved-mini-age">saved ${ageDays}d ago</div>` : '';
      // Price-drop signal placeholder (real backend will diff current price vs.
      // priceAtSave). Currently a static surface for the lifecycle banner copy.
      const priceDrop = m?.priceAtSave && m.priceAtSave > item.price
        ? `<div class="saved-mini-drop">↓ $${(m.priceAtSave - item.price).toLocaleString()}</div>` : '';
      const card = document.createElement('button');
      card.className = 'saved-mini';
      card.innerHTML = `
        <div class="saved-mini-thumb">${item.icon}</div>
        <div class="saved-mini-name">${item.name}</div>
        <div class="saved-mini-price">$${item.price.toLocaleString()}</div>
        ${ageLabel}
        ${priceDrop}
      `;
      card.addEventListener('click', () => openItemSheet(item, null));
      strip.appendChild(card);
    });
  }

  // ---------- Saved screen (Homes + Rooms + Items sub-tabs) ----------
  // [Save Home] Three-pane refactor: Saved Homes (new) + Saved Rooms
  // (existing bookmarked + new state.user.savedRooms entries from
  // overwrite/exclude paths) + Saved Items (existing wishlist).
  // [Save Home] Single source of truth for the Saved Rooms list. UNION of
  // legacy state.bookmarkedRooms[] (room IDs) + state.user.savedRooms[]
  // (entries with roomId pointing back to state.rooms[i].id). Deduped by
  // room ID, scoped to the active profile, filtered to rooms that still
  // exist. Both the tab count badge and the grid renderer call this so
  // they can never disagree.
  function getSavedRoomsForActiveProfile() {
    const bookmarkedIds = new Set(state.bookmarkedRooms || []);
    getSavedRoomsList().forEach(s => { if (s && s.roomId) bookmarkedIds.add(s.roomId); });
    return state.rooms.filter(r =>
      r.profileId === state.activeProfileId && bookmarkedIds.has(r.id)
    );
  }

  function renderSaved() {
    // Counts
    const homes = getSavedHomes();
    // Saved Rooms = bookmarked rooms (legacy) UNION state.user.savedRooms (new)
    const totalRooms = getSavedRoomsForActiveProfile().length;
    const items = state.wishlist || [];
    const homesCountEl = document.getElementById('stHomesCount');
    if (homesCountEl) homesCountEl.textContent = homes.length;
    $('#stRoomsCount').textContent = totalRooms;
    $('#stItemsCount').textContent = items.length;
    // Default sub-tab
    const active = document.querySelector('.st-tab.active')?.dataset?.st || 'homes';
    showSavedPane(active);
    updateSavedTabBadge();
  }

  function showSavedPane(which) {
    document.querySelectorAll('.st-tab').forEach(t => {
      const on = t.dataset.st === which;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    const homesPane = document.getElementById('savedHomesPane');
    if (homesPane) homesPane.style.display = which === 'homes' ? '' : 'none';
    $('#savedRoomsPane').style.display = which === 'rooms' ? '' : 'none';
    $('#savedItemsPane').style.display = which === 'items' ? '' : 'none';
    if (which === 'homes') renderSavedHomes();
    else if (which === 'rooms') renderSavedRooms();
    else renderSavedItems();
  }

  function renderSavedRooms() {
    const grid = $('#savedRoomsGrid');
    grid.innerHTML = '';
    // [Save Home] Pull from the same UNION the count badge reads — legacy
    // bookmarks + state.user.savedRooms (overwrite/exclude/explicit save).
    // Without this, count says "1" but grid renders empty when a room lives
    // only in state.user.savedRooms[].
    const rooms = getSavedRoomsForActiveProfile();
    if (rooms.length === 0) {
      grid.innerHTML = emptyStateHTML({
        icon: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"/></svg>',
        title: 'No Saved Rooms',
        body: 'Redesign a room, then save it here from the post-generation screen or by tapping the bookmark.',
        cta: 'Design A Room',
        ctaTarget: 'capture'
      });
      grid.querySelector('[data-empty-go]')?.addEventListener('click', () => {
        showScreen('capture'); prepareCapture();
      });
      return;
    }
    rooms.slice().reverse().forEach((r, idx) => {
      const card = document.createElement('div');
      card.className = 'room-card';
      card.style.setProperty('--stagger-i', idx);
      const total = r.items.reduce((s,i) => s + i.price, 0);
      const bookmarked = state.bookmarkedRooms.includes(r.id);
      card.innerHTML = `
        <div class="thumb" style="${r.photo ? `background-image:url('${r.photo}')` : ''}"></div>
        ${bookmarked ? '<div class="bookmark-badge"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"/></svg></div>' : ''}
        <div class="meta">
          <div class="name">${titleRoom(r.type)}</div>
          <div class="sub">${r.items.length} pieces · $${total.toLocaleString()}</div>
        </div>
      `;
      card.addEventListener('click', () => openRoom(r.id));
      grid.appendChild(card);
    });
  }

  function renderSavedItems() {
    const list = $('#savedItemsGrid');
    list.innerHTML = '';
    const ids = state.wishlist || [];
    if (ids.length === 0) {
      list.innerHTML = emptyStateHTML({
        icon: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6C19 16.5 12 21 12 21z"/></svg>',
        title: 'No Saved Items',
        body: 'Tap any furniture piece in a redesign and hit Save.',
      });
      return;
    }
    ids.forEach(id => {
      const item = window.FURNITURE_DB.find(i => i.id === id);
      if (!item) return;
      const alertOn = state.priceAlerts[item.id];
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div class="item-thumb">${item.icon}</div>
        <div class="item-body">
          <div class="name">${item.name}</div>
          <div class="desc">${item.description}</div>
          <div class="meta">
            <span class="tag source">${sourceLabel(item.source)}</span>
            <span class="tag">${item.type}</span>
            <span class="price">$${item.price.toLocaleString()}</span>
          </div>
        </div>
        <div class="item-actions">
          <a class="item-action-btn link-style" href="${item.url}" target="_blank" rel="noopener noreferrer">Shop</a>
          <button class="item-action-btn" data-act="rm">Remove</button>
          <button class="item-action-btn ${alertOn ? 'active' : ''}" data-act="alert">${alertOn ? `<svg viewBox='0 0 24 24' width='14' height='14' fill='currentColor' style='vertical-align:-2px;margin-right:4px'><path d='M12 2a2 2 0 012 2v1.2A6 6 0 0118 11v3l1.5 2H4.5L6 14v-3a6 6 0 014-5.8V4a2 2 0 012-2zM10 19h4a2 2 0 01-4 0z'/></svg>On` : `<svg viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-2px;margin-right:4px'><path d='M18 14v-3a6 6 0 00-12 0v3l-1.5 2h15z'/><path d='M10 19a2 2 0 004 0'/><path d='M3 3l18 18' stroke-width='2'/></svg>Alert`}</button>
        </div>
      `;
      card.querySelector('[data-act="rm"]').addEventListener('click', e => {
        e.stopPropagation();
        toggleWishlist(item);
        renderSavedItems();
        $('#stItemsCount').textContent = state.wishlist.length;
      });
      card.querySelector('[data-act="alert"]').addEventListener('click', e => {
        e.stopPropagation();
        togglePriceAlert(item);
        renderSavedItems();
      });
      card.addEventListener('click', e => {
        if (e.target.closest('button, a')) return;
        openItemSheet(item, null);
      });
      list.appendChild(card);
    });
  }

  // Saved sub-tab clicks
  document.getElementById('savedTabs').addEventListener('click', e => {
    const tab = e.target.closest('.st-tab');
    if (!tab) return;
    showSavedPane(tab.dataset.st);
  });

  // ---------- Profile screen ----------
  function renderProfilePage() {
    // [ToS consent block] Re-sync the Email Preferences toggle every time
    // the profile screen renders. The toggle is wired ONCE at boot, but
    // state.user.marketingOptIn can change in between (signup, OAuth
    // round-trip, future server pull) — without this re-sync, the
    // toggle's aria-checked goes stale and the user sees the wrong state.
    syncMarketingPrefsToggle();
    // [Save Home] Render the "Rooms in your home" exclusions UI. The 9
    // toggles + counter footer rebuild on each profile open so they
    // reflect the current activeHome.excludedRooms state.
    renderRoomExclusionsList();
    const user = state.user || {};
    const name = user.name || 'Guest';
    const email = user.email || 'Not signed in';
    $('#profilePageName').textContent = name;
    $('#profilePageEmail').textContent = email;
    const initial = (name[0] || 'U').toUpperCase();
    $('#profilePageInitial').textContent = initial;
    const avatar = $('#profilePageAvatar');
    const img = $('#profilePageImage');
    const activeProfile = getActiveProfile();
    if (activeProfile?.avatar) {
      img.src = activeProfile.avatar;
      avatar.classList.add('has-photo');
    } else {
      img.removeAttribute('src');
      avatar.classList.remove('has-photo');
    }
    avatar.style.background = avatarGradient(0);

    // Pro card — [compute-quality routing] copy reflects premium-AI value
    // prop (no quota anymore, so no "N free left" line).
    const pro = $('#profileProCard');
    const userIsPro = !!user.isPro;
    pro.classList.toggle('is-pro', userIsPro);
    if (userIsPro) {
      $('#profileProTitle').textContent = 'Furnish Pro active';
      $('#profileProSub').textContent = 'Premium AI · multi-room batch · HD downloads · per-person profiles';
      $('#profileProBtn').textContent = 'Manage';
    } else {
      $('#profileProTitle').textContent = 'Free plan';
      $('#profileProSub').textContent = 'Standard-quality redesigns · reshuffle, swap, and shop always free · Pro for premium quality';
      $('#profileProBtn').textContent = 'Upgrade';
    }
    $('#profileProBtn').onclick = () => openPaywall('generic');

    // Active design profile
    const ap = $('#profileActiveRow');
    if (activeProfile) {
      const idx = getProfileIdx(activeProfile.id);
      const init = (activeProfile.name.match(/\d+|\S/) || ['?'])[0];
      const stylesTxt = (activeProfile.styles || []).map(styleLabel).slice(0,3).join(' · ') || 'No styles set';
      ap.innerHTML = `
        <div class="pp-active-avatar" style="background:${avatarGradient(idx)}">${init}</div>
        <div style="flex:1;min-width:0">
          <div class="pp-active-name">${activeProfile.name}</div>
          <div class="pp-active-styles">${stylesTxt}</div>
        </div>
        <button class="pp-active-switch" id="ppSwitchProfileBtn">Switch</button>
      `;
      ap.querySelector('#ppSwitchProfileBtn').onclick = () => {
        showScreen('profile-select');
        renderProfiles();
      };
    } else {
      ap.innerHTML = '<div class="muted small" style="padding:8px">No active profile</div>';
    }

    // Theme value
    const t = state.settings?.theme === 'dark' ? 'Dark' : 'Light';
    $('#ppsThemeValue').textContent = t;

    // C14 — Style timeline
    renderStyleTimeline(activeProfile);

    // [Bug F fix] Auth-aware Profile actions.
    // A guest shouldn't see "Sign Out" (they're not signed in) or
    // "Switch Account" (nothing to switch from). Show "Sign In or
    // Create Account" instead, routed via the open-signin action.
    // Reset Profile stays visible for everyone — guests can build up
    // draft state worth resetting.
    const guest = isGuest();
    const authBtn = document.getElementById('ppAuthBtn');
    const switchBtn = document.getElementById('ppSwitchAccountBtn');
    const authLabel = document.getElementById('ppAuthLabel');
    if (authBtn && authLabel) {
      if (guest) {
        authBtn.dataset.action = 'open-signin';
        authBtn.classList.remove('pp-danger');
        authLabel.textContent = 'Sign In or Create Account';
      } else {
        authBtn.dataset.action = 'signout';
        authBtn.classList.add('pp-danger');
        authLabel.textContent = 'Sign Out';
      }
    }
    if (switchBtn) {
      switchBtn.style.display = guest ? 'none' : '';
    }
  }

  // C14 — Render the user's design history as a vertical timeline. Reforge
  // ICED Plant-Loyalty-Hook: visualizing accumulated investment makes the
  // user feel ownership over their style profile.
  function renderStyleTimeline(profile) {
    const tl = document.getElementById('styleTimeline');
    if (!tl) return;
    tl.innerHTML = '';
    if (!profile) {
      tl.innerHTML = '<div class="muted small" style="padding:14px">No active profile.</div>';
      return;
    }
    const rooms = (state.rooms || [])
      .filter(r => r.profileId === profile.id)
      .slice()
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (rooms.length === 0) {
      tl.innerHTML = `
        <div class="stl-empty">
          <p class="muted">Your style timeline starts with your first room.</p>
          <button class="btn btn-primary small" data-go="capture">Design Your First Room</button>
        </div>`;
      return;
    }
    rooms.forEach((r, idx) => {
      const date = new Date(r.createdAt || Date.now());
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const styles = (r.versions?.[0]?.styles || profile.styles || []).slice(0, 3);
      const styleNames = styles.map(s => (window.STYLES || []).find(x => x.id === s)?.label || s).join(' · ');
      const total = (r.items || []).reduce((s, i) => s + i.price, 0);
      const itemCount = (r.items || []).length;
      const isMostRecent = idx === 0;
      const item = document.createElement('button');
      item.className = 'stl-item';
      item.innerHTML = `
        <div class="stl-rail">
          <span class="stl-dot ${isMostRecent ? 'stl-dot-current' : ''}"></span>
          ${idx < rooms.length - 1 ? '<span class="stl-line"></span>' : ''}
        </div>
        <div class="stl-card">
          <div class="stl-thumb" style="${r.photo ? `background-image:url('${r.photo}')` : ''}"></div>
          <div class="stl-meta">
            <div class="stl-row1">
              <span class="stl-room">${titleRoom(r.type)}</span>
              <span class="stl-date">${dateStr}</span>
            </div>
            <div class="stl-styles">${styleNames || '—'}</div>
            <div class="stl-stats">${itemCount} pieces · $${total.toLocaleString()}</div>
          </div>
        </div>
      `;
      item.addEventListener('click', () => openRoom(r.id));
      tl.appendChild(item);
    });
  }

  // Profile settings actions
  document.querySelector('[data-screen="profile"]').addEventListener('click', async (e) => {
    const btn = e.target.closest('.pp-setting');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'theme') {
      const next = (state.settings?.theme === 'dark') ? 'light' : 'dark';
      state.settings = { ...(state.settings || {}), theme: next };
      save();
      applyTheme(next);
      $('#ppsThemeValue').textContent = next === 'dark' ? 'Dark' : 'Light';
      toast(next === 'dark' ? 'Dark mode on' : 'Light mode on');
    } else if (action === 'support') {
      openSupportModal();
    } else if (action === 'switch') {
      if (!confirm('Switch account? Your profiles stay on this device.')) return;
      // [Dim 14 Section F] Snapshot state before sign-out.
      if (typeof window.FurnishSignoutSnapshot === 'function') window.FurnishSignoutSnapshot();
      if (window.furnishBackend?.mode === 'supabase') await window.furnishBackend.auth.signOut().catch(()=>{});
      // [Batch 6 — Dim 13 REC-13.2] Reset PostHog identity so the next
      // session is unattributed until a new identify() call.
      resetAnalyticsIdentity();
      state.user = null;
      save();
      prepareSignin();
      showScreen('signin');
      toast('Sign in to switch.');
    } else if (action === 'signout') {
      // [Bug E fix] Single-path signout via performSignout() — clears
      // all local state. Replaces the prior bespoke handler that only
      // nulled state.user and left rooms/profiles/bookmarks behind.
      await performSignout();
    } else if (action === 'open-signin') {
      // [Bug F fix] Guest-mode entry point on the Profile page. The
      // "Sign Out" button is dynamically relabelled to "Sign In or
      // Create Account" by renderProfilePage when isGuest() is true.
      // This branch routes the guest into the existing signin screen.
      prepareSignin();
      showScreen('signin');
    } else if (action === 'reset') {
      // [Reset Dialog] Replaces window.confirm() with the rich confirmation
      // dialog (lists + hold-to-confirm). The actual reset + toast + welcome
      // routing fires inside the dialog's hold-complete branch (see
      // onResetHoldStart). This handler just opens the dialog with the
      // source discriminator for analytics.
      const p = getActiveProfile();
      if (!p) { toast('No active profile'); return; }
      openResetDialog({ source: 'profile_screen', opener: btn });
    }
  });

  // [Polish] Reset Profile button on the Preferences screen.
  // Same shape as the profile-screen handler above, but scoped to
  // data-screen="preferences" and re-renders via openPreferences() so
  // the user stays on the preferences page (the answers editor + DNA
  // gauge re-paint with cleared state). Per Reforge
  // Monetization Pricing — this surface is the "Free Preview" of the
  // Pro reset entitlement: badge advertises Pro, behavior is accessible
  // to Free as a teaser (same pattern as the existing profile-screen
  // reset).
  document.querySelector('[data-screen="preferences"]')?.addEventListener('click', (e) => {
    const btn = e.target.closest('#prefsResetBtn');
    if (!btn) return;
    // [Reset Dialog] Same routing as profile-screen reset — open the dialog.
    // Per-source `profile_reset_from_preferences` event still fires, but
    // moves into the dialog's hold-complete branch so it only fires on
    // ACTUAL reset (not on dialog-open). Cancel rate by source comes
    // from `reset_dialog_cancelled.source` analytics.
    const p = getActiveProfile();
    if (!p) { toast('No active profile'); return; }
    openResetDialog({ source: 'preferences_screen', opener: btn });
  });

  // Click avatar in profile page → re-use the photo source modal
  document.getElementById('profilePageAvatar').addEventListener('click', () => {
    const p = getActiveProfile();
    if (!p) return;
    openPhotoSourceModal(p, () => renderProfilePage());
  });

  function buildCollectionCard(c) {
    const card = document.createElement('div');
    card.className = 'collection-card has-imgcard-cta';
    const photo = document.createElement('div');
    photo.className = 'c-photo';
    if (Array.isArray(c.images) && c.images.length > 1) {
      // Cross-fade slideshow (used for seasons — every few seconds the photo morphs to the next).
      photo.classList.add('c-photo-slideshow');
      photo.dataset.slides = c.images.length;
      c.images.forEach((src, idx) => {
        const slide = document.createElement('div');
        slide.className = 'c-slide';
        slide.style.backgroundImage = `url("${src}")`;
        slide.style.animationDelay = (idx * (24 / c.images.length)) + 's';
        photo.appendChild(slide);
      });
    } else if (c.image || c.images?.[0]) {
      photo.style.backgroundImage = `url("${c.image || c.images[0]}")`;
    }
    const body = document.createElement('div');
    body.className = 'c-body';
    const tags = c.styles.slice(0,2).map(s => `<span class="c-style-tag">${styleLabel(s)}</span>`).join('');
    body.innerHTML = `
      <div class="c-label">${c.label}</div>
      <div class="c-tagline">${c.tagline}</div>
      <div class="c-styles">${tags}</div>
    `;
    card.appendChild(photo);
    card.appendChild(body);

    // [Use Template CTA — uniformity across all inspiration cards]
    // The body-tap (apply collection to profile) stays as-is; this CTA
    // adds the explicit "use this image as a redesign anchor" path.
    // Per Hassan's spec, every inspiration card surfaces this button.
    const cta = document.createElement('button');
    cta.className = 'imgcard-cta imgcard-cta--collection';
    cta.type = 'button';
    cta.innerHTML = `
      Use Template
      <svg class="imgcard-cta-arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12"/>
        <polyline points="12 5 19 12 12 19"/>
      </svg>
    `;
    cta.addEventListener('click', e => {
      e.stopPropagation();
      // Pick a sensible room type for the redesign — collections don't
      // specify one, so default to living room. The user can re-pick.
      const previewImage = c.image || (c.images && c.images[0]) || null;
      useTemplateFromCard({
        id: `collection-${c.id}`,
        roomType: 'living',
        image: previewImage,
        imageType: previewImage ? 'asset' : 'placeholder',
        styleId: (c.styles && c.styles[0]) || 'modern',
        styleColors: c.colors,
        label: c.label,
      }, 'collection_card');
    });
    card.appendChild(cta);

    // Body / photo tap = apply collection to profile (existing behavior).
    // The CTA's stopPropagation prevents double-firing.
    card.addEventListener('click', () => applyCollection(c));
    return card;
  }

  function buildMarquee(strip, list) {
    if (!strip) return;
    strip.innerHTML = '';
    if (!list.length) return;
    const track = document.createElement('div');
    track.className = 'collections-track';
    // Render the set twice for a seamless translateX(-50%) loop.
    list.forEach(c => track.appendChild(buildCollectionCard(c)));
    list.forEach(c => {
      const dup = buildCollectionCard(c);
      dup.setAttribute('aria-hidden', 'true');
      track.appendChild(dup);
    });
    strip.appendChild(track);
    const seconds = Math.max(20, list.length * 3.5);
    track.style.animationDuration = seconds + 's';
  }

  // Auto-rotate season label to current year + push the current season to
  // the front of the strip. Reforge ICED p.6: time-based touchpoints expand
  // recall surface for infrequent products.
  function currentSeasonId() {
    const m = new Date().getMonth(); // 0–11
    if (m <= 1 || m === 11) return 'winter';   // Dec–Feb
    if (m <= 4)             return 'spring';   // Mar–May
    if (m <= 7)             return 'summer';   // Jun–Aug
    return 'autumn';                           // Sep–Nov
  }
  function renderCollections() {
    const SEASON_IDS = new Set(['spring','summer','autumn','winter']);
    const yr = new Date().getFullYear();
    const cur = currentSeasonId();
    const seasonsRaw = window.COLLECTIONS.filter(c => SEASON_IDS.has(c.id));
    // Mutate label to current year (label text only — id stays stable).
    seasonsRaw.forEach(c => {
      const seasonName = c.id[0].toUpperCase() + c.id.slice(1);
      c.label = `${seasonName} ${yr}`;
    });
    // Sort with current season first so dormant returners see what's "live"
    const seasons = seasonsRaw.slice().sort((a, b) => {
      if (a.id === cur) return -1;
      if (b.id === cur) return 1;
      return 0;
    });
    const trending = window.COLLECTIONS.filter(c => !SEASON_IDS.has(c.id));

    buildMarquee(document.getElementById('collectionsStrip'), seasons);
    buildMarquee(document.getElementById('trendingStrip'),    trending);
  }

  function applyCollection(c) {
    const p = getActiveProfile();
    if (!p) return;
    // [10-Q model] Collection apply uses the same template-synthesizer
    // bridge as Use Template. Synthesize answers from the collection's
    // style+color tags, merge into p.answers (without losing existing user
    // answers), then re-derive the legacy catalog-bridge fields.
    const synth = synthesizeAnswersFromTemplate(c) || {};
    p.answers = { ...(p.answers || {}), ...synth };
    p.styles = deriveStylesFromAnswers(p.answers);
    p.colors = deriveColorsFromAnswers(p.answers);
    save();
    toast(`Applied "${c.label}" to ${p.name}`);
    renderProfiles();
  }

  function renderRoomsGrid() {
    const grid = $('#roomsGrid');
    // [Polish] #roomsGrid was removed from the home screen — Saved Rooms
    // moved exclusively to the Saved tab. Null-guard so legacy callers
    // (none today, but defensive against future regressions) can no-op
    // safely instead of throwing on null.innerHTML.
    if (!grid) return;
    // "Saved Rooms" on home = only rooms the user explicitly bookmarked.
    // Unsaved design history still lives in state.rooms but isn't shown here.
    const rooms = state.rooms.filter(r =>
      r.profileId === state.activeProfileId &&
      state.bookmarkedRooms.includes(r.id)
    );
    grid.innerHTML = '';
    if (rooms.length === 0) {
      // C11 — Dormant users with unsaved-but-existing rooms get different copy
      // pointing them at their design history vs. forcing a new design.
      const allRooms = state.rooms.filter(r => r.profileId === state.activeProfileId);
      const lifecycle = getLifecycleState();
      const isDormantWithHistory = (lifecycle === LIFECYCLE.DORMANT || lifecycle === LIFECYCLE.CHURNED) && allRooms.length > 0;
      grid.innerHTML = emptyStateHTML({
        icon: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"/></svg>',
        title: isDormantWithHistory ? 'You have rooms — none saved' : 'No Saved Rooms',
        body: isDormantWithHistory
          ? `You designed ${allRooms.length} room${allRooms.length === 1 ? '' : 's'} before. Open one and tap the bookmark to keep it here.`
          : 'Design a room, then tap the bookmark icon to save it here.',
        cta: isDormantWithHistory ? 'Reopen Last Room' : 'Design A Room',
        ctaTarget: isDormantWithHistory ? null : 'capture'
      });
      const cta = grid.querySelector('[data-empty-go]');
      if (cta) {
        cta.addEventListener('click', () => {
          if (isDormantWithHistory) {
            const last = allRooms[allRooms.length - 1];
            openRoom(last.id);
          } else {
            showScreen('capture'); prepareCapture();
          }
        });
      }
      return;
    }
    rooms.slice().reverse().forEach((r, idx) => {
      const card = document.createElement('div');
      card.className = 'room-card';
      card.style.setProperty('--stagger-i', idx);
      const total = r.items.reduce((s,i) => s + i.price, 0);
      card.innerHTML = `
        <div class="thumb" style="${r.photo ? `background-image:url('${r.photo}')` : ''}"></div>
        <div class="bookmark-badge"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"/></svg></div>
        <div class="meta">
          <div class="name">${titleRoom(r.type)}</div>
          <div class="sub">${r.items.length} pieces · $${total.toLocaleString()}</div>
        </div>
      `;
      card.addEventListener('click', () => openRoom(r.id));
      grid.appendChild(card);
    });
  }

  $('#switchProfileBtn').addEventListener('click', () => {
    showScreen('profile-select');
    renderProfiles();
  });

  $('#wishlistBtn').addEventListener('click', () => {
    renderWishlist();
    showScreen('wishlist');
  });

  // ---------- Templates ----------
  // Grouped by room type + "For your style" section up top (User Psychology:
  // reduce cognitive load; Reforge Activation Fit: show the right thing first).
  function renderTemplates() {
    const grid = $('#templatesGrid');
    grid.innerHTML = '';
    const all = window.ROOM_TEMPLATES || [];
    const profile = getActiveProfile();
    const userStyles = new Set(profile?.styles || []);

    // "For your style" — templates whose style set overlaps the user's.
    const forYou = all.filter(t =>
      (t.styles || []).some(s => userStyles.has(s))
    ).slice(0, 6);

    const renderGroup = (label, items) => {
      if (!items.length) return;
      const heading = document.createElement('h3');
      heading.className = 'templates-group-h';
      heading.textContent = label;
      grid.appendChild(heading);
      const row = document.createElement('div');
      row.className = 'templates-row';
      items.forEach((t, idx) => {
        // [Spec — uniform Use Template CTA on every inspiration card]
        // Outer is a <div role="button"> so we can nest a real <button>
        // CTA without HTML invalid button-in-button. Click anywhere on
        // the card OR the CTA triggers the same startFromTemplate path.
        const card = document.createElement('div');
        const gated = t.pro && !isPro();
        card.className = 'template-card has-imgcard-cta' + (gated ? ' template-locked' : '');
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.style.setProperty('--stagger-i', idx);
        const photoStyle = t.image ? `background-image:url('${t.image}');` : '';
        const proBadge = t.pro
          ? `<span class="t-pro-badge">PRO</span>`
          : '';
        card.innerHTML = `
          <div class="t-photo" style="${photoStyle}">${proBadge}</div>
          <div class="t-body">
            <div class="template-icon">${t.icon}</div>
            <div class="t-label">${t.label}</div>
            <div class="t-sub">${titleRoom(t.type)} · ${t.dims.w}×${t.dims.l} ft</div>
          </div>
          <button class="imgcard-cta imgcard-cta--template" type="button">
            Use Template
            <svg class="imgcard-cta-arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        `;
        const fire = () => startFromTemplate(t);
        card.addEventListener('click', fire);
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); }
        });
        row.appendChild(card);
      });
      grid.appendChild(row);
    };

    if (forYou.length) renderGroup('For Your Style', forYou);

    // Group remaining templates by room type
    const byType = {};
    all.forEach(t => {
      if (forYou.includes(t)) return;
      (byType[t.type] = byType[t.type] || []).push(t);
    });
    Object.keys(byType).forEach(type => {
      renderGroup(titleRoom(type), byType[type]);
    });
  }

  function startFromTemplate(t) {
    const p = getActiveProfile();
    if (!p) { toast('Pick a profile first'); return; }
    // [Model A] Gate Pro-only premium templates first (pure Pro feature).
    if (t.pro && !isPro()) {
      // [STEP 5 §16 row 2] Stash so paywallCta can resume on upgrade.
      state._pendingProAction = { actionId: 'template_pro', templateId: t.id };
      save();
      trackEvent('paywall_trigger', { from: 'template_pro', templateId: t.id });
      openPaywall('template_pro');
      return;
    }
    // [BUDGET_RESET_PASS] No budget gate here — the slider on the capture
    // screen sets state.draft.budget; templates generate with that value.
    _runStartFromTemplate(t);
  }
  function _runStartFromTemplate(t) {
    // [Compute-quality routing] Template-based redesign also routes through
    // routeGenerationByModelTier — Free uses standard model, Pro uses premium.
    // No quota cap; no resume stash needed for the standard path. The Pro-
    // template `template_pro` resume stash above handles the only blocked
    // template case (a Pro template tapped by a Free user).
    routeGenerationByModelTier('new_redesign_template', (tier) => {
      // [Image-anchored redesigns] If the template carries a `photo` (e.g.
      // a Use Template click on a real inspiration image card), use that as
      // the source — same path as a user-uploaded photo. Falls back to the
      // synthetic placeholder for code-defined templates that don't ship
      // an image. The downstream pipeline doesn't care which source it is.
      state.draft = {
        photo: t.photo || placeholderImageFor(t.type),
        type: t.type,
        dims: { ...t.dims },
        keep: false,
        styleOverride: t.styles,
        colorOverride: t.colors,
        fromTemplate: t.id
      };
      save();
      showScreen('analyzing');
      runAnalyzerAnimation().then(() => {
        // CONFLICT 5: synthesize transient answers from template metadata,
        // merge with profile.answers for the pick. Saved profile is NOT
        // mutated — the synthesis lives only on this room's snapshot.
        const transient = synthesizeAnswersFromTemplate(t);
        const room = buildRoomFromDraft(transient);
        room.modelTier = tier;
        state.rooms.push(room);
        state.draft = null;
        incrementGenerationCount();
        // [Your Home progress] Successful template generation — append
        // room.type to designedRooms (deduped). Source 'template' for
        // analytics. [Save Home] Pass roomId payload so activeHome can
        // store the metadata for overwrite-protection.
        recordHomeProgressRoom(room.type, 'template', { roomId: room.id, generatedAt: Date.now() });
        // [Save Home] Mark this room as just-generated so the post-
        // generation save surface fires once when openRoom runs.
        state._justGeneratedRoomId = room.id;
        save();
        // D7 auth gate: same as fresh-redesign path — guests sign up before reveal.
        if (isGuest()) {
          state._pendingIntent = { intent: 'reveal', roomId: room.id, fromScreen: 'templates' };
          save();
          prepareSignin();
          showScreen('signin');
          trackEvent('reveal_gate_shown', { roomId: room.id, source: 'template' });
          return;
        }
        openRoom(room.id);
      });
    });
  }

  function placeholderImageFor(type) {
    // Simple SVG placeholder per room type (so the result screen has something visual).
    const t = window.ROOM_TYPES.find(x => x.id === type) || { icon:'🏠', label:type };
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'>
        <defs>
          <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stop-color='#F0E2CC'/>
            <stop offset='100%' stop-color='#D4A574'/>
          </linearGradient>
        </defs>
        <rect width='800' height='600' fill='url(#g)'/>
        <text x='50%' y='52%' text-anchor='middle' font-size='180' font-family='Arial' dominant-baseline='middle'>${t.icon}</text>
        <text x='50%' y='82%' text-anchor='middle' font-size='28' font-family='Arial' fill='#6B5235'>${t.label}</text>
      </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  // ---------- Capture ----------
  function prepareCapture() {
    // Auto-ensure a profile exists — guest flow must reach here without a detour.
    ensureGuestProfile();
    const p = getActiveProfile();
    // type defaults to null so the user must pick one (enables the analyze btn).
    // keep defaults to false (fresh start) — user can flip post-aha on results.
    state.draft = state.draft || { photo: null, type: null, dims: { w:12, l:14, h:9 }, keep: false };
    if (!state.draft.dims) state.draft.dims = { w:12, l:14, h:9 };
    if (state.draft.dims.w == null) state.draft.dims.w = 12;
    if (state.draft.dims.l == null) state.draft.dims.l = 14;
    if (state.draft.dims.h == null) state.draft.dims.h = 9;
    if (Array.isArray(state.draft.keep)) state.draft.keep = state.draft.keep.length > 0;

    $('#photoPreview').src = state.draft.photo || '';
    $('#photoPreview').classList.toggle('has-image', !!state.draft.photo);
    $('.photo-frame .placeholder').classList.toggle('hidden', !!state.draft.photo);

    // Dimensions are hidden inputs now — still write to them so the rest of the
    // pipeline (simulateDetectDims, buildRoomFromDraft) doesn't NPE.
    const dW = $('#dimW'), dL = $('#dimL'), dH = $('#dimH');
    if (dW) dW.value = state.draft.dims.w;
    if (dL) dL.value = state.draft.dims.l;
    if (dH) dH.value = state.draft.dims.h;

    renderRoomTypeCards();
    refreshAnalyzeBtn();
    // [BUDGET_RESET_PASS — Phase 2] Reset slider to default every time the
    // user lands here. Per spec: "The slider value resets to its default
    // ($3,000) every time the user lands on the photo upload screen for a
    // new generation." state.draft.budget gets the new value on each
    // slider input.
    setupCaptureBudgetSlider();
    // [BUDGET_RESET_PASS — Phase 2] One-time tutorial coachmark on first
    // arrival at the capture screen, points at the slider, explains the
    // per-generation model. Tracked separately from the answers-editor
    // tutorial trio (state.user.budgetSliderTutorialSeen).
    maybeFireBudgetSliderCoachmark();
  }

  function setupCaptureBudgetSlider() {
    const slider = $('#captureBudgetSlider');
    const amountEl = $('#captureBudgetAmount');
    const ticksHost = document.querySelector('.capture-budget-ticks');
    if (!slider || !amountEl) return;
    // Reset to default — the spec is explicit: every arrival is a fresh
    // budget choice. No carryover between generations.
    state.draft.budget = SLIDER_BUDGET_DEFAULT;
    slider.value = budgetToSlider(SLIDER_BUDGET_DEFAULT);
    amountEl.textContent = formatBudget(SLIDER_BUDGET_DEFAULT);
    slider.style.setProperty('--pct', ((slider.value / 1000) * 100).toFixed(1) + '%');
    if (ticksHost) paintBudgetTicks(ticksHost);
    // Debounce analytics — only fire after the user lands on a value, not
    // on every micro-movement during the drag.
    let debounceTimer = null;
    slider.oninput = () => {
      const amount = sliderToBudget(+slider.value);
      state.draft.budget = amount;
      amountEl.textContent = formatBudget(amount);
      slider.style.setProperty('--pct', ((slider.value / 1000) * 100).toFixed(1) + '%');
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        trackEvent('generation_budget_set', {
          budget_value: amount === Infinity ? -1 : amount,
          room_type: state.draft?.type || null
        });
      }, 350);
    };
  }
  function maybeFireBudgetSliderCoachmark() {
    if (state.user?.budgetSliderTutorialSeen) return;
    // Wait a beat for the screen to settle, then show a brief tip.
    setTimeout(() => {
      // Use the existing toast pattern as a lightweight coachmark — a
      // dedicated overlay can be authored later if a richer treatment is
      // wanted. The spec emphasizes the existence of the coachmark; the
      // exact UI is at our discretion.
      toast('Set your budget for this room. You can change it for every room.');
      if (!state.user) state.user = {};
      state.user.budgetSliderTutorialSeen = true;
      save();
      trackEvent('budget_slider_tutorial_seen');
    }, 700);
  }

  function refreshAnalyzeBtn() {
    // Single-screen capture: enable once BOTH photo AND room type are chosen.
    // These are the MUST-HAVE inputs for first aha (Reforge Setup Moment p.5).
    const hasPhoto = !!state.draft?.photo;
    const hasType  = !!state.draft?.type;
    const btn = $('#analyzeBtn');
    if (!btn) return;
    btn.disabled = !(hasPhoto && hasType);
    // When both are set for the first time, this completes the setup moment.
    if (hasPhoto && hasType && !state._setupCompleteAt) {
      state._setupCompleteAt = Date.now();
      save();
      // [Batch 6 — Dim 13 REC-13.12] tSinceSignup activation timing.
      const tSinceSignup = state._timing?.signupStartedAt
        ? Date.now() - state._timing.signupStartedAt
        : null;
      trackEvent(ACTIVATION.SETUP_COMPLETE, {
        roomType: state.draft.type,
        hasStyle: !!(getActiveProfile()?.styles?.length),
        tSinceSignup
      });
    }
  }

  function renderRoomTypeCards() {
    const grid = $('#roomTypeGrid');
    grid.innerHTML = '';
    const profile = getActiveProfile();
    window.ROOM_TYPES.forEach((rt, idx) => {
      const card = document.createElement('button');
      card.className = 'rt-card' + (state.draft?.type === rt.id ? ' selected' : '');
      card.style.setProperty('--stagger-i', idx);
      card.setAttribute('aria-pressed', state.draft?.type === rt.id ? 'true' : 'false');
      card.dataset.roomType = rt.id;
      const iconSvg = window.ROOM_TYPE_SVGS?.[rt.id] || '';
      // [BUDGET_RESET_PASS] No budget chip on room tiles. Budget is a
      // transient slider value set on this same screen, not a per-room
      // saved property.
      card.innerHTML = `
        <span class="rt-icon">${iconSvg}</span>
        <span class="rt-label">${rt.label}</span>
      `;
      card.addEventListener('click', () => {
        // Tile tap just selects the room. The budget slider lives on the
        // same screen (rendered separately) and is the SAME slider for
        // every room — its value is consumed at generation time.
        state.draft = state.draft || { photo: null, type: null, dims: { w:12, l:14, h:9 }, keep: false };
        state.draft.type = rt.id;
        save();
        trackEvent(ACTIVATION.SETUP_ROOM_TYPE, { roomType: rt.id });
        if (typeof refreshAnalyzeBtn === 'function') refreshAnalyzeBtn();
        // Update selection state in-place — don't re-render the whole grid
        // (that retriggers the stagger animation on every click).
        grid.querySelectorAll('.rt-card').forEach(c => {
          const isSelected = c === card;
          c.classList.toggle('selected', isSelected);
          c.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        });
        // Subtle confirmation pulse on the just-selected tile only.
        card.classList.remove('rt-confirm');
        void card.offsetWidth;
        card.classList.add('rt-confirm');
      });
      grid.appendChild(card);
    });
  }

  function handlePhoto(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.draft.photo = reader.result;
      $('#photoPreview').src = reader.result;
      $('#photoPreview').classList.add('has-image');
      $('.photo-frame .placeholder').classList.add('hidden');
      save();
      trackEvent(ACTIVATION.SETUP_PHOTO);
      simulateDetectDims();
      refreshAnalyzeBtn();
    };
    reader.readAsDataURL(file);
  }

  $('#cameraInput').addEventListener('change', e => handlePhoto(e.target.files[0]));
  $('#uploadInput').addEventListener('change', e => handlePhoto(e.target.files[0]));

  function simulateDetectDims() {
    const baseByType = {
      living:   { w:14, l:16, h:9 }, bedroom: { w:12, l:13, h:9 },
      kitchen:  { w:10, l:12, h:9 }, dining:  { w:11, l:14, h:9 },
      office:   { w: 9, l:11, h:9 }, bathroom:{ w: 7, l: 9, h:9 },
      nursery:  { w:10, l:12, h:9 }, closet:  { w: 6, l: 8, h:9 },
      laundry:  { w: 7, l: 8, h:9 }
    };
    const b = baseByType[state.draft.type] || baseByType.living;
    const jitter = () => Math.round((Math.random()*3 - 1.5)*2)/2;
    state.draft.dims = { w: Math.max(6, b.w+jitter()), l: Math.max(6, b.l+jitter()), h: b.h };
    $('#dimW').value = state.draft.dims.w;
    $('#dimL').value = state.draft.dims.l;
    $('#dimH').value = state.draft.dims.h;
    $('#dimHint').textContent = 'Auto-detected from your photo. Adjust if needed.';
  }

  $('#rescanBtn').addEventListener('click', () => {
    if (!state.draft.photo) { toast('Add a photo first'); return; }
    $('#dimHint').textContent = 'Rescanning…';
    setTimeout(() => { simulateDetectDims(); toast('Dimensions updated'); }, 600);
  });

  ['dimW','dimL','dimH'].forEach(id => {
    $('#'+id).addEventListener('change', () => {
      state.draft.dims = { w:+$('#dimW').value||0, l:+$('#dimL').value||0, h:+$('#dimH').value||0 };
    });
  });

  // ---------- Analyze flow ----------
  // [Compute-quality routing] AI generation routes through
  // routeGenerationByModelTier() which always allows execution and selects
  // the model tier (standard for Free, premium for Pro). After AI completes,
  // D7 says guests must create an account BEFORE the redesign is revealed.
  $('#analyzeBtn').addEventListener('click', async () => {
    if (!state.draft?.photo) return;
    if (!state.draft?.type) return;
    // [BUDGET_RESET_PASS] Budget already set on the slider on this screen;
    // its value is read at generation time via getCurrentBudget() inside
    // _runAnalyze. No modal gate, no callback chain.
    _runAnalyze();
  });
  async function _runAnalyze() {
    if (!state.draft?.photo) return;
    // [Batch 6 — Dim 13 REC-13.3] Wrap the entire generation flow in a
    // try/catch so any failure (image decode, AI model error, render bug)
    // emits `analyze_failed` per Reforge failure-event taxonomy. Today the
    // happy path is mock-only; once real Replicate calls land, this catch
    // covers the real network/model failure cases too.
    const analyzeStartedAt = Date.now();
    try {
      routeGenerationByModelTier('new_redesign', async (tier) => {
        showScreen('analyzing');
        await runAnalyzerAnimation();
        // The future Replicate-backed backend reads `tier` and routes the
        // AI request to the matching model. Stored on the room so we can
        // surface a "premium-quality next time" CTA on standard-tier results.
        const room = buildRoomFromDraft();
        room.modelTier = tier;
        state.rooms.push(room);
        state.draft = null;
        incrementGenerationCount();
        // [Your Home progress] Successful own-photo redesign — append
        // room.type to designedRooms (deduped). Source 'own_photo'.
        // [Save Home] Pass roomId payload so activeHome can store the
        // metadata for overwrite-protection. Also flag as just-generated
        // so the post-generation save surface fires once.
        recordHomeProgressRoom(room.type, 'own_photo', { roomId: room.id, generatedAt: Date.now() });
        state._justGeneratedRoomId = room.id;
        save();
        trackEvent('analyze_completed', {
          roomId: room.id, tier, durationMs: Date.now() - analyzeStartedAt,
          // [BUDGET_RESET_PASS — Phase 2] Include the transient budget on
          // every generation event for downstream funnel analysis.
          budget: room.budget === Infinity ? -1 : (room.budget || null),
          room_type: room.type
        });
        // D7 auth gate: guest's redesign is computed but locked behind signup.
        // The signin screen renders contextually — see prepareSignin() reading
        // the 'reveal' pending intent.
        if (isGuest()) {
          state._pendingIntent = { intent: 'reveal', roomId: room.id, fromScreen: 'capture' };
          save();
          prepareSignin();
          showScreen('signin');
          trackEvent('reveal_gate_shown', { roomId: room.id, source: 'new_redesign' });
          return;
        }
        openRoom(room.id);
      });
    } catch (err) {
      trackEvent('analyze_failed', {
        tier: typeof currentModelTier === 'function' ? currentModelTier() : null,
        reason: 'exception',
        message: String((err && err.message) || err || '').slice(0, 200),
        durationMs: Date.now() - analyzeStartedAt
      });
      toast("Couldn't analyze your photo. Try again.");
    }
  }
  // End _runAnalyze (extracted from the analyze button click handler).

  // Reforge Monetization + Pricing (PNIP Pyramid): free tier delivers ONE
  // ============================================================
  // Model A — Affiliate-Maximalist tier infrastructure
  // ============================================================
  // Free tier: unlimited reshuffles, swaps, shopping, basic personalization.
  //            Plus 2 lifetime AI-generation actions.
  // Pro tier:  new redesigns from new uploads, HD export, multi-room batch,
  //            advanced personalization, AI re-layout for now stays free
  //            (per Hassan's D10 override — keep AI cost minimal).
  //
  // "Generation" = anything that produces a new AI image. Two kinds:
  //   1. Fresh redesign from photo + quiz answers (the analyzeBtn path)
  //   2. Template-based generation (startFromTemplate path)
  // Both produce an AI image. NEITHER counts against a lifetime cap anymore.
  //
  // [COMPUTE-QUALITY ROUTING — replaces the prior 2-lifetime quota model]
  // Free and Pro both get unlimited generations. The difference is which
  // model the request is routed to:
  //   - Free → standard model (Flux Schnell, ~$0.005-0.01/run)
  //   - Pro  → premium model  (Flux Kontext Pro / Flux Depth Pro, ~$0.05/run)
  //
  // Centralized in routeGenerationByModelTier() — DO NOT scatter tier checks.
  // The middleware always allows execution; it only selects the model tier
  // and emits analytics for downstream model-routing in the future backend.
  // ============================================================

  function isPro() { return !!state.user?.isPro; }
  // [Model A — STEP 4 fix] A user is "guest" if they have no provider set OR
  // explicitly 'guest'. touchLastVisit() at boot initializes state.user = {}
  // (no provider), and the welcomeStartBtn flow sets provider:'guest' only
  // for a brand-new state.user. This handles the empty-object case.
  function isGuest() {
    if (!state.user) return true;
    const p = state.user.provider;
    return !p || p === 'guest';
  }
  function isSignedInFree() {
    return !!state.user && state.user.provider && state.user.provider !== 'guest' && !state.user.isPro;
  }

  // Returns 'premium' if Pro, else 'standard'. Single source of truth for the
  // future backend's model-routing decision and for any UI surface that wants
  // to label the current rendering tier.
  function currentModelTier() {
    return isPro() ? 'premium' : 'standard';
  }

  // Lifetime generation counter — kept as ANALYTICS ONLY (not a gate input).
  // Informs the activation funnel + LTV modeling + premium_quality upsell
  // pacing logic. Never blocks anything.
  function generationsUsed() {
    if (!state.user) return 0;
    if (typeof state.user.generationsUsed === 'number') return state.user.generationsUsed;
    // Legacy migration from prior Model A `redesignsUsed`. Promote once.
    const legacy = state.user.redesignsUsed || 0;
    state.user.generationsUsed = legacy;
    return legacy;
  }

  // Always-allow middleware. Returns the model tier the call should be
  // routed to so the future Replicate-backed backend knows which endpoint
  // to hit. Emits one analytic event per call so we can measure standard-
  // vs-premium volume + cost.
  //
  // The fn is responsible for calling incrementGenerationCount() once the
  // generation actually completes — that counter is analytics-only now.
  function routeGenerationByModelTier(actionId, fn) {
    const tier = currentModelTier();
    trackEvent('generation_completed', { actionId, tier });
    // [Batch 5 — Dim 06 Section E.4 / Conflict 6 lock] Record into the
    // 30-day rolling window for the power-Free signal trigger. Fires the
    // signal if the gate clears (Free user, ≥50 gens in 30d, ≤1 affiliate
    // click in 30d, fired ≤1× per 30d window). See maybeFirePowerFreeSignal.
    try {
      recordGen30d();
      // Defer until after the rendered reveal so the slide-in lands on
      // results screen, not on analyzing screen.
      setTimeout(() => maybeFirePowerFreeSignal(), 1500);
    } catch (_) { /* analytics never breaks generation */ }
    // Pass tier into fn so callers/the future backend can route accordingly.
    // Existing callers that ignore the argument keep working.
    return fn(tier);
  }
  // [Compute-quality routing — Step 4 sweep] All `gateGeneration` call sites
  // have been migrated to `routeGenerationByModelTier`. The shim was retired
  // after the consistency sweep verified zero remaining callers.

  // Pure Pro gate for features that have no free allowance (HD export, batch,
  // advanced personalization, advanced price-drop filters). Single-state:
  // Pro → allow, otherwise → paywall.
  function gateProFeature(actionId, fn) {
    if (isPro()) {
      trackEvent('pro_action_completed', { actionId });
      return fn();
    }
    trackEvent('paywall_trigger', { from: actionId, reason: 'pro_feature' });
    trackEvent('pro_action_attempted', { actionId, wasGated: true, lifecycle: getLifecycleState() });
    openPaywall(actionId);
    return null;
  }

  function incrementGenerationCount() {
    if (!state.user) state.user = {};
    state.user.generationsUsed = (state.user.generationsUsed || state.user.redesignsUsed || 0) + 1;
    // Legacy field still mirrored during transition window. Will be deleted
    // after one release cycle once we confirm no readers remain.
    state.user.redesignsUsed = state.user.generationsUsed;
    save();
  }

  // Toggle CSS body classes. CSS still uses the same hooks but most rules that
  // hung off `is-free` are deleted in Layer 6 (Copy / CSS). The classes remain
  // so future tier-aware UI variants can use them cleanly.
  function syncFreeModeClass() {
    document.body.classList.toggle('is-pro', isPro());
    document.body.classList.toggle('is-free', !isPro());
    document.body.classList.toggle('is-guest', isGuest());
    document.body.classList.toggle('is-signedin-free', isSignedInFree());
    // [Compute-quality migration] `has-used-free-generations` body class
    // retired — there's no quota, so the class is meaningless. Removing it
    // here so any stale CSS rule keyed off it stops applying.
    document.body.classList.remove('has-used-free-generations');
  }

  // ============================================================
  // Model A — STEP 5 edge-case handlers
  // ============================================================
  // Each function below corresponds to one row in MONETIZATION_AUDIT.md §16.
  // None of these are mock surfaces — they are the runtime-correct behavior
  // for each scenario, even before Stripe is wired. The Stripe webhook in
  // DEFERRED.md will call handleDowngrade() on cancellation; everything else
  // already runs at boot or on the backend-ready event.

  // §16 row 1 — Existing Pro users (D6=a, grandfathered).
  // Anyone who was Pro before Model A migration keeps Pro until they cancel.
  // We tag them so analytics can split conversion attribution between paid-Pro
  // and grandfathered-Pro. Idempotent — only sets the flag once.
  function grandfatherProUsers() {
    if (!state.user) return;
    if (!state.user.isPro) return;
    if (state.user.tierGrantedAt) return;        // already tagged
    state.user.grandfathered = true;
    state.user.tierGrantedAt = 'pre_model_a';
    save();
    trackEvent('tier_changed', {
      from: 'pro_legacy',
      to: 'pro_grandfathered',
      source: 'grandfather',
      triggeringContext: null
    });
  }

  // §16 row 3 — Downgrade flow (Pro → Free).
  // Called by the future Stripe webhook on cancellation, OR manually for QA.
  // Pro-created content (rooms, HD-exported renders already on disk, batch
  // redesigns) STAYS ACCESSIBLE. Only the gates re-engage on NEW actions.
  // The toast wording follows the audit's §10 "Downgrade copy" plan.
  function handleDowngrade(reason) {
    if (!state.user || !state.user.isPro) return;
    state.user.isPro = false;
    state.user.tierGrantedAt = null;
    state.user.grandfathered = false;
    save();
    syncFreeModeClass();
    trackEvent('tier_changed', {
      from: 'pro',
      to: 'free',
      source: reason || 'cancellation',
      triggeringContext: null
    });
    toast("You're on Free. Past designs stay yours — reshuffle and shop as much as you want.");
    // Re-render whatever screen is active so the gates lift back into place.
    const cur = document.querySelector('.screen.active')?.dataset?.screen;
    if (cur === 'home') renderHome();
    else if (cur === 'results' && currentRoomId) openRoom(currentRoomId);
    else if (cur === 'profile' && typeof renderProfilePage === 'function') renderProfilePage();
  }
  // Expose for QA / Stripe-webhook future wiring.
  window.furnishHandleDowngrade = handleDowngrade;

  // §16 row 4 — Offline / cached tier reconciliation.
  // Called AFTER supabase-client.pullAll() has already overwritten local state
  // with server values. Pass in the values that were cached BEFORE the pull,
  // so we can detect drift between offline-cached state and the server's
  // canonical record. Pessimistic-allow policy while OFFLINE: trust the cache;
  // the AI-call backend (DEFERRED.md) is the real enforcement boundary.
  function reconcileTierWithBackend(cachedIsPro, cachedUsed) {
    if (!state.user) return;
    const serverIsPro = !!state.user.isPro;             // post-pull = server
    const serverUsed  = state.user.generationsUsed || 0; // post-pull = server
    const tierMismatch  = !!cachedIsPro !== serverIsPro;
    const quotaMismatch = (cachedUsed || 0) !== serverUsed;
    if (tierMismatch || quotaMismatch) {
      trackEvent('tier_reconciled', {
        tierMismatch,
        quotaMismatch,
        cachedIsPro: !!cachedIsPro,
        serverIsPro,
        cachedUsed: cachedUsed || 0,
        serverUsed
      });
      // Server says we DOWNGRADED (canceled on another device, expired card).
      // Run the full handler so the user sees the toast + re-render.
      if (cachedIsPro && !serverIsPro) {
        handleDowngrade('server_reconcile');
      }
      // Server says we UPGRADED (paid on another device). No toast — expected.
      // pullAll already set state.user.isPro=true; just re-sync UI.
      if (!cachedIsPro && serverIsPro) {
        syncFreeModeClass();
        const cur = document.querySelector('.screen.active')?.dataset?.screen;
        if (cur === 'home') renderHome();
        else if (cur === 'results' && currentRoomId) openRoom(currentRoomId);
        else if (cur === 'profile' && typeof renderProfilePage === 'function') renderProfilePage();
      }
    }
  }
  window.furnishReconcileTier = reconcileTierWithBackend;

  // [Compute-quality migration] `detectQuotaTamper()` removed. There is no
  // lifetime quota anymore so client-side tampering is moot. Anti-abuse for
  // the new model is server-side rate limiting on the AI-call endpoint
  // (per IP/account, prevents compute-budget burn) — see DEFERRED.md.

  // [Historical removals across migrations — names that no longer exist]
  // Model A migration (STEP 4 consistency sweep):
  //   - hasUsedDemo, canReshuffle, canSwap, canRedesign, incrementRedesignCount
  // Compute-quality routing migration (this pass):
  //   - FREE_GENERATION_LIMIT (constant)
  //   - generationsRemaining(), hasUsedAllFreeGenerations() (helpers)
  //   - detectQuotaTamper() (anti-abuse hook — replaced by server-side rate limits)
  //   - body.has-used-free-generations class
  //   - renderQuotaBanner (results-screen banner — replaced by renderPremiumUpsellHint)
  // requireSignin() is still defined below but currently has no callers; kept
  // for potential future surfaces (cross-device sync prompt, pre-checkout nudge).

  // ============================================================
  // Affiliate-click attribution (Model A — primary monetization)
  // ============================================================
  // Every affiliate URL gets retailer-specific affiliate IDs + universal UTMs
  // + a click ID for downstream attribution reconciliation. Real per-retailer
  // codes are placeholders until partner programs approve (see DEFERRED.md).
  const AFFILIATE_IDS = {
    amazon:     { tag: 'furnish-20' },         // Amazon Associates
    ikea:       { partnerId: 'TODO_IKEA' },    // IKEA via Awin/CJ
    wayfair:    { tag: 'TODO_WAYFAIR' },       // Wayfair via CJ
    'west-elm': { tag: 'TODO_WESTELM' },       // West Elm via Rakuten
    'rugs-usa': { tag: 'TODO_RUGSUSA' },       // Rugs USA via ShareASale
    etsy:       { aff_id: 'TODO_ETSY' }        // Etsy direct
  };
  // [Dim 14 Section D Fix 1 — retailer search-by-name fallback.
  //  When per-item URLs are placeholder homepages (current state) or
  //  return 404/OOS post-cutover, route the user to the retailer's
  //  search results for the item NAME instead of dumping them on a
  //  generic homepage. Per Reforge Resurrecting Voluntary Dormant
  //  Users → Reason #3 (Over-Promised, Under-Delivered): cheapest
  //  fix for the most damaging dormancy pattern.]
  const RETAILER_SEARCH = {
    ikea:       name => `https://www.ikea.com/us/en/search/?q=${encodeURIComponent(name)}`,
    amazon:     name => `https://www.amazon.com/s?k=${encodeURIComponent(name)}&tag=furnish-20`,
    wayfair:    name => `https://www.wayfair.com/keyword.php?keyword=${encodeURIComponent(name)}`,
    'west-elm': name => `https://www.westelm.com/search/results.html?words=${encodeURIComponent(name)}`,
    etsy:       name => `https://www.etsy.com/search?q=${encodeURIComponent(name)}`,
    'rugs-usa': name => `https://www.rugsusa.com/search?q=${encodeURIComponent(name)}`,
  };
  function isHomepageStub(url) {
    try {
      const u = new URL(url);
      return !u.pathname || u.pathname === '/' || u.pathname.length < 4;
    } catch { return true; }
  }
  // [Batch 6 — Dim 13 REC-13.5 PRIVACY FIX] Opaque random fclick generator.
  // Replaces the prior `${userid-or-email}-${timestamp}` scheme that leaked
  // PII into the affiliate URL → retailer logs → browser history sync. Per
  // Reforge *Brand Marketing → Identity Governance*: user-data hygiene is a
  // brand asset. The fclickId is a 16-char hex from crypto.getRandomValues,
  // persisted alongside the click record (state.affiliateClicks[].fclickId).
  // Affiliate-network attribution joins on the opaque ID server-side at
  // backend cutover; no UUID or email ever leaves the device.
  function generateFclickId() {
    try {
      const buf = new Uint8Array(8);
      if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
        window.crypto.getRandomValues(buf);
      } else {
        for (let i = 0; i < 8; i++) buf[i] = Math.floor(Math.random() * 256);
      }
      return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (_) {
      // Ultimate fallback — Math.random only. Still no PII.
      return Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10);
    }
  }
  window.FurnishGenerateFclickId = generateFclickId;

  function buildAffiliateUrl(item) {
    if (!item) return '#';
    // First: try the per-item URL if it looks valid (not a homepage stub).
    if (item.url && !isHomepageStub(item.url)) {
      try {
        const u = new URL(item.url);
        const partner = AFFILIATE_IDS[item.source] || {};
        Object.entries(partner).forEach(([k, v]) => u.searchParams.set(k, v));
        u.searchParams.set('utm_source', 'furnish');
        u.searchParams.set('utm_medium', 'redesign');
        u.searchParams.set('utm_campaign', item.id);
        // [Batch 6 — REC-13.5 PRIVACY FIX] Opaque random fclickId in place
        // of `${userid}-${timestamp}`. Zero PII in the outbound URL.
        u.searchParams.set('fclick', generateFclickId());
        return u.toString();
      } catch {}
    }
    // Fall back: retailer search-by-name. Per-item URL was missing or stubby.
    const builder = RETAILER_SEARCH[item.source];
    if (builder && item.name) {
      trackEvent('affiliate_url_fallback_search', { itemId: item.id, source: item.source });
      return builder(item.name);
    }
    // Last resort: retailer homepage. Track so we know which catalog rows need fixing.
    trackEvent('affiliate_url_fallback_homepage', { itemId: item.id, source: item.source });
    return item.url || '#';
  }
  function trackAffiliateClick(item, surface) {
    // [Batch 6 — REC-13.5 PRIVACY FIX] Generate one opaque fclickId per
    // click. Persisted alongside the record AND emitted in the analytics
    // event so future affiliate-network reconciliation can join via the
    // opaque ID. Note: this is a different fclickId than the one that
    // went into the URL (which is generated per buildAffiliateUrl call).
    // Server-side reconciliation joins on (itemId, surface, ts ± window)
    // when the affiliate-network click_id arrives. The persisted fclickId
    // here is the canonical record for OUR analytics; the URL fclickId is
    // what flows to retailers. Neither carries PII.
    const fclickId = generateFclickId();
    const tSinceAhaFirstResults = state._timing?.ahaFirstResultsAt
      ? Date.now() - state._timing.ahaFirstResultsAt
      : null;
    state.affiliateClicks = (state.affiliateClicks || []).slice(-100);
    state.affiliateClicks.push({
      fclickId,
      itemId: item.id,
      source: item.source,
      price: item.price,
      surface,
      roomId: currentRoomIdSafe(),
      ts: Date.now()
    });
    save();
    trackEvent('affiliate_click', {
      fclickId,
      itemId: item.id,
      source: item.source,
      price: item.price,
      surface,
      roomId: currentRoomIdSafe(),
      tSinceAhaFirstResults
    });
    // [Batch 5 — Dim 06 Section C.1.1 + Section D] Power-Free + value-moment
    // hooks. Affiliate clicks are the single most important behavioral signal
    // for the Free→Pro funnel: high click count = monetizing on Free (don't
    // disrupt); low click count + high gen count = power-Free signal target.
    try {
      recordAffiliateClick30d();
      // 2+ distinct affiliate items in the same room = purchase-intent peak.
      // Per Reforge Convert (Postmates Party): trigger on cart-engagement.
      const roomId = currentRoomIdSafe();
      if (roomId) {
        const distinctInRoom = new Set(
          (state.affiliateClicks || [])
            .filter(c => c.roomId === roomId)
            .map(c => c.itemId)
        );
        if (distinctInRoom.size >= 2) {
          maybeFireValueMomentPaywall('affiliate_click_2plus_items', {
            roomId, distinctItems: distinctInRoom.size
          });
        }
      }
    } catch (_) { /* never let analytics break a shop click */ }
  }
  // currentRoomId is declared later in the file; this safe accessor avoids
  // referencing it before initialization in early call paths.
  function currentRoomIdSafe() {
    try { return currentRoomId || null; } catch { return null; }
  }

  // ============================================================
  // First-redesign tutorial — multi-step coachmark on preferences
  // ============================================================
  // Fires ONCE per user, immediately after their first AI-generated redesign.
  // Walks them through three high-leverage answer cards. Per Reforge
  // Activation: the Aha Moment is complete when the user understands the
  // levers that shape their redesigns.
  //
  // Trigger surface: openRoom() detects "first redesign for this user" and
  // queues the tutorial; results-screen render schedules the auto-route
  // 6 seconds later so the user has time to soak in the redesign.
  //
  // Skip beat: the Skip button is hidden for the first 2 seconds of step 0
  // so the spotlight has a chance to land — frictionless skip would let
  // users dismiss before they understand what's being shown.
  //
  // State: state.user.firstRedesignTutorialSeen (boolean, persisted, never
  // re-fires per the spec). NOT yet synced to Supabase — local-only until
  // we add the column. Document this gap in DEFERRED.md if needed.
  //
  // Analytics: tutorial_started, tutorial_step_viewed, tutorial_completed,
  // tutorial_skipped — all fired now even though we can't analyze them yet.
  // ============================================================

  // [BUDGET_RESET_PASS] Tutorial trio: vibe + materials + scope.
  // (Was vibe + materials + budget before Q6 was removed.) Scope chosen
  // over decor_density per Reforge Activation: scope is a 4-way categorical
  // that radically changes AI output; density is a fine-tune. Selectors
  // point at `.answer-card[data-q-id="…"]` matching the prefs editor markup.
  const TUTORIAL_STEPS = [
    {
      id: 'vibe',
      selector: '.answer-card[data-q-id="vibe"]',
      headerSelector: '.answer-card[data-q-id="vibe"]',
      title: 'Your vibe',
      body: 'This is the emotional anchor for the AI — calm vs. energized vs. cozy. Tap to change, and every future redesign in this profile shifts to match.',
      cta: 'Next →',
    },
    {
      id: 'materials',
      selector: '.answer-card[data-q-id="materials"]',
      headerSelector: '.answer-card[data-q-id="materials"]',
      title: 'Your materials',
      body: 'Pick up to two textures that pull you in — warm woods, soft fabrics, vintage patina. The AI leans into these when picking pieces.',
      cta: 'Next →',
    },
    {
      // [BUDGET_RESET_PASS] Trio replacement: vibe + materials + scope.
      // Was vibe + materials + budget, but Q6 budget_tier was removed.
      // Per Reforge Activation framework, scope is the highest-leverage
      // remaining decision (4-way categorical that radically changes AI
      // output) vs decor_density (a fine-tune). See CHANGES_APPLIED.md.
      id: 'scope',
      selector: '.answer-card[data-q-id="scope"]',
      headerSelector: '.answer-card[data-q-id="scope"]',
      title: 'Your scope',
      body: "This is the big lever. 'Just furniture' keeps your walls and floors; 'Whole room' redoes everything. Pick what you actually want changed.",
      cta: 'Got it — show me',
      emphasized: true,
    },
  ];

  let _tutorialIdx = -1;
  let _tutorialReposition = null; // bound resize/scroll handler so we can detach
  let _tutorialSkipTimer = null;

  function isTutorialActive() {
    return _tutorialIdx >= 0;
  }

  function shouldFireFirstRedesignTutorial() {
    if (!state.user) return false;
    if (state.user.firstRedesignTutorialSeen === true) return false;
    // Must have at least one room (the just-finished redesign).
    if (!state.rooms || state.rooms.length === 0) return false;
    return true;
  }

  // [Batch 3 — A8 / Conflict 7 lock] Tutorial deferral to session 2.
  // Per Reforge R+E Module 04 "Creating Your Aha Moment Experience":
  // forceful coachmarks during Aha train anti-habit behavior. The
  // original 6s post-reveal fire was wrong. Tutorial now fires on
  // session-2 home arrival (see maybeFireSessionTwoTutorial in the
  // Batch 3 block). On first reveal, this function becomes a no-op.
  // The session-2 trigger uses the same firstRedesignTutorialSeen
  // flag for fire-once semantics.
  function queueFirstRedesignTutorial() {
    // First reveal: do NOT fire the tutorial. User is in peak Aha;
    // interruption violates Reforge's qualitative test ("special ability").
    // Tutorial deferred to session 2 (see maybeFireSessionTwoTutorial).
    return;
  }

  // Fallback trigger: if user navigates to preferences manually before the
  // queued auto-route fires (or if the queue was cleared because they left
  // results), still fire the tutorial on first preferences visit.
  function maybeFireTutorialOnPreferencesEntry() {
    if (!shouldFireFirstRedesignTutorial()) return;
    if (isTutorialActive()) return;
    // Slight delay so the screen render completes first.
    setTimeout(() => {
      if (shouldFireFirstRedesignTutorial() && !isTutorialActive()) {
        runFirstRedesignTutorialOnCurrentScreen();
      }
    }, 350);
  }

  function startFirstRedesignTutorial() {
    state._tutorialQueued = false;
    // Auto-route to preferences with the active profile.
    const profileId = state.activeProfileId || (state.profiles[0] && state.profiles[0].id);
    if (!profileId) return;
    if (typeof openPreferences === 'function') openPreferences(profileId);
    // openPreferences calls showScreen('preferences') synchronously;
    // wait one RAF for layout, then run the tutorial.
    requestAnimationFrame(() => {
      requestAnimationFrame(runFirstRedesignTutorialOnCurrentScreen);
    });
  }

  function runFirstRedesignTutorialOnCurrentScreen() {
    _tutorialIdx = 0;
    trackEvent('tutorial_started', { totalSteps: TUTORIAL_STEPS.length });
    const overlay = $('#frtOverlay');
    if (!overlay) return;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    showTutorialStep(0);
    // Bind reposition handlers — spotlight must follow target on resize/scroll.
    _tutorialReposition = () => repositionTutorialSpotlight();
    window.addEventListener('resize', _tutorialReposition);
    window.addEventListener('scroll', _tutorialReposition, { passive: true });
  }

  function showTutorialStep(idx) {
    const step = TUTORIAL_STEPS[idx];
    if (!step) return endTutorial(true /* completed */);
    _tutorialIdx = idx;

    const overlay = $('#frtOverlay');
    overlay.dataset.step = String(idx);
    overlay.dataset.stepId = step.id;
    overlay.classList.toggle('frt-emphasized', !!step.emphasized);

    $('#frtTipTitle').textContent = step.title;
    $('#frtTipBody').textContent = step.body;
    $('#frtNextBtn').textContent = step.cta || (idx === TUTORIAL_STEPS.length - 1 ? 'Got it' : 'Next →');

    // Step pip (e.g. "1 of 3")
    const pip = $('#frtStepPip');
    if (pip) pip.textContent = `${idx + 1} / ${TUTORIAL_STEPS.length}`;

    // Skip button: hidden for the first 2 seconds of step 0 (spec — give
    // the spotlight time to land). Always visible from step 1 onward.
    const skip = $('#frtSkipBtn');
    if (idx === 0) {
      skip.hidden = true;
      clearTimeout(_tutorialSkipTimer);
      _tutorialSkipTimer = setTimeout(() => {
        if (isTutorialActive() && _tutorialIdx === 0) skip.hidden = false;
      }, 2000);
    } else {
      skip.hidden = false;
    }

    // Scroll target into view, then position spotlight + tip.
    const target = document.querySelector(step.headerSelector || step.selector);
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Wait for scroll to settle before measuring.
    setTimeout(() => repositionTutorialSpotlight(), 380);

    trackEvent('tutorial_step_viewed', { step: idx, stepId: step.id, emphasized: !!step.emphasized });
  }

  function repositionTutorialSpotlight() {
    if (!isTutorialActive()) return;
    const step = TUTORIAL_STEPS[_tutorialIdx];
    if (!step) return;
    const target = document.querySelector(step.selector);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const pad = step.emphasized ? 14 : 10;
    const spot = $('#frtSpotlight');
    spot.style.top    = (rect.top - pad) + 'px';
    spot.style.left   = (rect.left - pad) + 'px';
    spot.style.width  = (rect.width + pad * 2) + 'px';
    spot.style.height = (rect.height + pad * 2) + 'px';

    // Position the tip below the spotlight if there's room, else above.
    const tip = $('#frtTip');
    const vh = window.innerHeight;
    const spotBottom = rect.bottom + pad;
    const spaceBelow = vh - spotBottom;
    const tipMargin = 14;
    if (spaceBelow >= 200) {
      tip.style.top    = (spotBottom + tipMargin) + 'px';
      tip.style.bottom = '';
      tip.classList.remove('frt-tip-above');
    } else {
      tip.style.bottom = (vh - rect.top + pad + tipMargin) + 'px';
      tip.style.top    = '';
      tip.classList.add('frt-tip-above');
    }
    // Clamp horizontal so the tip never overflows.
    const tipWidth = Math.min(360, window.innerWidth - 24);
    tip.style.width = tipWidth + 'px';
    const tipLeft = Math.max(12, Math.min(window.innerWidth - tipWidth - 12, rect.left + (rect.width / 2) - (tipWidth / 2)));
    tip.style.left = tipLeft + 'px';
  }

  function endTutorial(completed) {
    const wasIdx = _tutorialIdx;
    _tutorialIdx = -1;
    state._tutorialQueued = false;
    if (!state.user) state.user = {};
    state.user.firstRedesignTutorialSeen = true;
    save();
    const overlay = $('#frtOverlay');
    if (overlay) {
      overlay.classList.remove('open', 'frt-emphasized');
      overlay.setAttribute('aria-hidden', 'true');
    }
    clearTimeout(_tutorialSkipTimer);
    if (_tutorialReposition) {
      window.removeEventListener('resize', _tutorialReposition);
      window.removeEventListener('scroll', _tutorialReposition);
      _tutorialReposition = null;
    }
    if (completed) {
      trackEvent('tutorial_completed', { totalSteps: TUTORIAL_STEPS.length });
    } else {
      trackEvent('tutorial_skipped', { atStep: wasIdx, atStepId: TUTORIAL_STEPS[wasIdx]?.id || null });
    }
  }

  // Wire up overlay buttons. Idempotent — safe even if overlay missing.
  (() => {
    const next = document.getElementById('frtNextBtn');
    const skip = document.getElementById('frtSkipBtn');
    if (next) next.addEventListener('click', () => {
      if (!isTutorialActive()) return;
      const nextIdx = _tutorialIdx + 1;
      if (nextIdx >= TUTORIAL_STEPS.length) return endTutorial(true);
      showTutorialStep(nextIdx);
    });
    if (skip) skip.addEventListener('click', () => {
      if (!isTutorialActive()) return;
      endTutorial(false);
    });
    // [Back-button fix] Backdrop click on the dark surround dismisses
    // the tutorial. Without this, users on a screen with a back button
    // (like the results-screen header) couldn't reach it because the
    // overlay was eating the click. The .frt-tip card itself doesn't
    // bubble its clicks here (handled by Next/Skip directly), and the
    // .frt-spotlight has pointer-events:none so it never receives clicks.
    const overlayEl = document.getElementById('frtOverlay');
    if (overlayEl) overlayEl.addEventListener('click', (e) => {
      if (!isTutorialActive()) return;
      // Only treat as backdrop dismiss if the click target IS the
      // overlay itself (not a descendant — buttons + tip card handle
      // their own clicks).
      if (e.target === overlayEl) {
        endTutorial(false);
      }
    });
    // ESC dismisses (counts as skip).
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (!isTutorialActive()) return;
      // Don't fight other modals — only consume Escape if no other modal is open.
      const otherModalOpen = document.querySelector('.modal.open, .bottom-sheet.open');
      if (otherModalOpen) return;
      endTutorial(false);
    });
  })();

  // [B2-14 / Dim 11 D.1] Story-driven analyzing screen.
  // Per Reforge Aha Moment p.14: time-bound metrics; the user is
  // budgeting attention against latency. Storytelling motion buys
  // perceived budget against the real budget that's about to land
  // when AI cutover happens.
  //
  // Parameterized by total duration:
  //   - Mock today: ~3.4s sum (Schnell-equivalent rehearsal)
  //   - Schnell at cutover: ~10s
  //   - Kontext Pro at cutover: ~30s
  //
  // Beat percentages match the spec in optimization/11_performance_feel.md
  // Section A.4 — early steps activate quickly, later steps hold longer
  // so the final beat lands as the API returns. Never finish all 4 steps
  // before the API actually returns: empty success states feel broken.
  // The completion uses CSS .done check-mark animation from styles.css.
  async function runAnalyzerAnimation(totalDurationMs) {
    const steps = $$('#loaderSteps li');
    steps.forEach(s => s.classList.remove('active', 'done'));
    if (!steps.length) return;
    const total = (typeof totalDurationMs === 'number' && totalDurationMs > 0)
      ? totalDurationMs
      : 3400;  // mock default ~3.4s
    // Activation beats (% of total) and completion beats per step.
    const beatsActivate = [0.05, 0.30, 0.55, 0.82];
    const beatsDone     = [0.28, 0.53, 0.80, 0.97];
    const startedAt = Date.now();
    return new Promise(resolve => {
      const cancelled = { value: false };
      // If user navigates off the analyzing screen, stop firing transitions.
      const obs = new MutationObserver(() => {
        const cur = document.querySelector('.screen.active')?.dataset?.screen;
        if (cur !== 'analyzing') { cancelled.value = true; obs.disconnect(); resolve(); }
      });
      const screensRoot = document.querySelector('.screens') || document.body;
      obs.observe(screensRoot, { attributes: true, subtree: true, attributeFilter: ['class'] });

      steps.forEach((step, i) => {
        setTimeout(() => {
          if (cancelled.value) return;
          step.classList.add('active');
        }, beatsActivate[i] * total);
        setTimeout(() => {
          if (cancelled.value) return;
          step.classList.remove('active');
          step.classList.add('done');
        }, beatsDone[i] * total);
      });
      setTimeout(() => {
        obs.disconnect();
        resolve();
      }, total + 60);
    });
  }
  window.FurnishAnalyzerAnimation = runAnalyzerAnimation;

  // ============================================================
  // AI prompt builder — single source of truth for the prompt string the
  // future Replicate-backed AI generation backend consumes. Currently
  // logged to state._lastAIPrompt for inspection; once the backend lands,
  // the call site swaps in a fetch that POSTs this string.
  //
  // CRITICAL: per Hassan's spec, the prompt NEVER includes literal style
  // names like "Mid-Century Modern" or "Scandinavian" unless the user
  // explicitly typed/selected one (which the new flow doesn't do). Style
  // emerges from the combination of vibe + color_appetite + materials.
  // Per Reforge Engagement Strategy / generative-AI prompting practice:
  // feeling+material prompts outperform style-name prompts on modern
  // image models.
  // ============================================================
  function buildAIPrompt(answers, draft, budgetValue) {
    const a = answers || ONBOARDING_DEFAULTS();
    const VIBE_TXT = {
      calm_grounded:      'a calm, grounded',
      energized_creative: 'an energized, creative',
      cozy_protected:     'a cozy, protected',
      elevated_hotel:     'an elevated, hotel-like',
      inspired_artist:    "an artist's-space, inspired"
    };
    const COLOR_TXT = {
      neutrals_only:   'a strictly neutral palette of warm whites, beiges, and natural woods',
      mostly_neutral:  'a mostly neutral palette with one or two intentional color moments',
      confident_color: 'a confident palette with a few rich, intentional tones',
      bold:            'a bold, saturated, expressive palette'
    };
    const MAT_TXT = {
      warm_woods:    'warm woods and rattan',
      soft_fabrics:  'soft fabrics and boucle',
      metal_glass:   'smooth metal and glass',
      stone_ceramic: 'stone, ceramic, and raw plaster',
      vintage_patina:'vintage and patina',
      sleek_modern:  'sleek modern surfaces'
    };
    const DENSITY_TXT = {
      clean:                'minimal decor with breathing room',
      a_little_personality: 'some accents, mostly clean',
      lived_in_rich:        'lots of decor, warm and layered',
      maximalist:           'maximalist — every surface tells a story'
    };
    const SCOPE_TXT = {
      just_furniture:  'replace furniture only — keep walls, floors, and lighting unchanged',
      furniture_decor: 'furniture plus decor — accessories, art, plants',
      whole_room:      'the whole room including lighting, rugs, paint',
      surprise_me:     'go for a full transformation — total creative freedom'
    };
    const LIGHT_TXT = {
      tons:           'optimize for a room with abundant natural light all day',
      bright_morning: 'optimize for a room with bright morning light that dims later',
      dim:            'optimize for a dim or north-facing room — make it feel warm and bright',
      unsure:         'assume mixed natural light'
    };
    // [BUDGET_RESET_PASS] BUDGET_TXT removed — budget is now a transient
    // numeric value passed in at generation time. Band-mapped copy lives
    // in budgetBandText() below and reads the slider value.
    const USE_TXT = {
      slept_relaxed:    'mostly slept and relaxed in',
      lived_in_all_day: 'lived in all day — work, hobbies, hanging out',
      hosting:          'hosting and entertaining',
      aspirational:     'looking amazing more than being maximally practical'
    };
    const AVOID_TXT = {
      too_modern:    'overly modern or sterile aesthetics',
      too_rustic:    'overly rustic or "farmhouse" aesthetics',
      busy_prints:   'bold patterns or busy prints',
      dark_heavy:    'dark colors or heavy furniture',
      trendy:        'trendy items that will feel dated quickly'
    };

    const vibePart    = VIBE_TXT[a.vibe] || VIBE_TXT.calm_grounded;
    const colorPart   = COLOR_TXT[a.color_appetite] || COLOR_TXT.mostly_neutral;
    const matsPart    = (a.materials || []).map(m => MAT_TXT[m]).filter(Boolean).join(' and ') || 'warm woods and soft fabrics';
    const densityPart = DENSITY_TXT[a.decor_density] || DENSITY_TXT.a_little_personality;
    const scopePart   = SCOPE_TXT[a.scope] || SCOPE_TXT.furniture_decor;
    const lightPart   = LIGHT_TXT[a.natural_light] || LIGHT_TXT.unsure;
    // [BUDGET_RESET_PASS] budgetPart removed; Phase 2 will pass a transient
    // budgetValue and build a budget-band clause from it.
    const usePart     = USE_TXT[a.room_use] || USE_TXT.lived_in_all_day;
    const avoidIds    = (a.avoid || []).filter(id => id !== 'nothing');
    const avoidPart   = avoidIds.map(id => AVOID_TXT[id]).filter(Boolean).join('; ');
    // [Hassan's call] dealbreaker is now an array; legacy object shape
    // is still tolerated by the consumer below.
    const dealbreaker = a.dealbreaker || [];

    const roomLabel = draft && draft.type
      ? (window.ROOM_TYPES || []).find(r => r.id === draft.type)?.label || draft.type
      : 'room';

    // [BUDGET_RESET_PASS] Budget band derived from the transient slider
    // value passed in at generation time. Reforge prompt-engineering:
    // explicit budget framing produces more consistent AI outputs than
    // implicit numeric values.
    const budgetClause = (typeof budgetValue === 'number' || budgetValue === Infinity)
      ? ` Budget: ${budgetBandText(budgetValue)}.`
      : '';
    let prompt =
      `Generate an interior redesign of a ${roomLabel} with ${vibePart} feeling, ` +
      `using ${colorPart} dominated by ${matsPart}. ` +
      `Decoration density: ${densityPart}. ` +
      `Redesign scope: ${scopePart}. ` +
      `Lighting: ${lightPart}. ` +
      `Room is primarily ${usePart}.` +
      budgetClause;
    if (avoidPart) prompt += ` AVOID: ${avoidPart}.`;
    // [Hassan's call] dealbreaker is now an array of {kind, text} entries
    // (one per Q10 selection). Backwards-compat: also handle the legacy
    // {kind, text} object shape from existing user state.
    if (Array.isArray(dealbreaker)) {
      const parts = dealbreaker
        .filter(d => d && d.kind && d.kind !== 'nothing' && d.text)
        .map(d => `${d.kind} ("${d.text}")`);
      if (parts.length) prompt += ` PRESERVE: ${parts.join(', ')}.`;
    } else if (dealbreaker && dealbreaker.kind && dealbreaker.kind !== 'nothing' && dealbreaker.text) {
      prompt += ` PRESERVE: ${dealbreaker.kind} — "${dealbreaker.text}".`;
    }
    return prompt;
  }
  window.FurnishBuildAIPrompt = buildAIPrompt;

  // ============================================================
  // Catalog-picker scoring weights derived from the 10 answers.
  // This is the bridge between the new answers model and the existing
  // FURNITURE_DB (which is tagged with style + color IDs). It's NOT the
  // AI prompt — the AI prompt reads answers directly. This is purely the
  // catalog-picker weighting input.
  // ============================================================
  function deriveScoringWeights(answers) {
    const a = answers || ONBOARDING_DEFAULTS();
    return {
      styles:    deriveStylesFromAnswers(a),         // catalog style filter
      colors:    deriveColorsFromAnswers(a),         // catalog color filter
      materials: a.materials || [],                  // material-tag boost (future use)
      avoid:     (a.avoid || []).filter(id => id !== 'nothing'), // negative penalties
      vibe:      a.vibe,                             // future: vibe-tag boost
      decorDensity: a.decor_density,                 // controls extras-cap below
      scope:     a.scope,                            // mapped to keepMode below
      roomUse:   a.room_use,                         // future: function-priority bias
      // [BUDGET_RESET_PASS] budgetTier removed — budget is transient now.
    };
  }

  // CONFLICT 5: Use Template paths synthesize transient answers from the
  // template's metadata (style + color tags) so the catalog pick reflects
  // the chosen template's intent — without ever overwriting the user's
  // saved profile.answers. Returns a partial answers object suitable for
  // merging via buildRoomFromDraft(answersOverride).
  function synthesizeAnswersFromTemplate(t) {
    if (!t) return null;
    const tStyles = new Set(t.styles || []);
    const tColors = new Set(t.colors || []);
    const out = {};
    // Vibe inferred from the template's loudest style signal.
    if (tStyles.has('minimalist') || tStyles.has('japanese-zen') || tStyles.has('scandinavian')) out.vibe = 'calm_grounded';
    else if (tStyles.has('bohemian') || tStyles.has('eclectic')) out.vibe = 'inspired_artist';
    else if (tStyles.has('industrial')) out.vibe = 'energized_creative';
    else if (tStyles.has('mid-century') || tStyles.has('art-deco') || tStyles.has('contemporary')) out.vibe = 'elevated_hotel';
    else if (tStyles.has('farmhouse') || tStyles.has('rustic')) out.vibe = 'cozy_protected';
    // Color appetite inferred from the color-mood signal.
    if (tColors.has('jewel') || tColors.has('terracotta')) out.color_appetite = 'confident_color';
    else if (tColors.has('dark')) out.color_appetite = 'bold';
    else if (tColors.has('whites') || tColors.has('neutral')) out.color_appetite = 'mostly_neutral';
    // Templates are full-room by definition.
    out.scope = 'whole_room';
    return out;
  }

  function buildRoomFromDraft(answersOverride) {
    const draft = state.draft;
    const profile = getActiveProfile();
    // Build the effective answers for THIS generation. The override is
    // used by Use Template paths (CONFLICT 5: synthesize transient answers
    // from template metadata, merge with profile.answers for the catalog
    // pick, never overwrite the saved profile permanently).
    const effective = answersOverride
      ? { ...getEffectiveAnswers(profile), ...answersOverride }
      : getEffectiveAnswers(profile);
    // CONFLICT 2: scope === 'just_furniture' is the keepMode default; the
    // results-screen toggle (draft.keep) overrides if set.
    const keepMode = draft.keep === true || (draft.keep !== false && effective.scope === 'just_furniture');
    // [BUDGET_RESET_PASS] Read the transient budget from state.draft.budget
    // (set by the slider on the capture screen). Falls back to
    // SLIDER_BUDGET_DEFAULT if for some reason draft.budget isn't set.
    const generationBudget = (draft && typeof draft.budget === 'number') ? draft.budget : SLIDER_BUDGET_DEFAULT;
    const picked = pickItemsForRoom(draft, effective, generationBudget, { keepMode });

    // Build + log the AI prompt for this generation. Future backend will
    // POST this; for now it lives on the room snapshot for inspection.
    let promptStr = '';
    try { promptStr = buildAIPrompt(effective, draft, generationBudget); } catch (err) {}

    const room = {
      id: 'r'+Date.now(),
      profileId: profile.id,
      type: draft.type,
      photo: draft.photo,
      dims: draft.dims,
      items: picked,
      keepMode,
      // [BUDGET_RESET_PASS] Snapshot the transient budget the user chose for
      // this generation. Reshuffle/keep/different-style on the reveal screen
      // read from room.budget so they stay coherent with the original pick.
      // The slider on the capture screen always resets to default for the
      // NEXT generation.
      budget: generationBudget,
      // [9-Q model] Snapshot the answers used for THIS generation so
      // reshuffle/rerun reproduces the same intent. Legacy `styles/colors`
      // fields populated for the catalog-picker bridge.
      answers: { ...effective },
      versions: [],
      activeVersion: null,
      createdAt: Date.now(),
      fromTemplate: draft.fromTemplate || null
    };
    room.versions.push({
      id: 'v'+Date.now(),
      items: picked.slice(),
      answers: { ...effective },
      // Legacy fields kept on the version for reshuffle/swap compat.
      styles: deriveStylesFromAnswers(effective),
      colors: deriveColorsFromAnswers(effective),
      aiPrompt: promptStr,
      note: draft.fromTemplate ? 'Template design' : 'Initial AI design',
      timestamp: Date.now()
    });
    room.activeVersion = room.versions[0].id;
    return room;
  }

  function ownedItem(k) {
    return {
      id: 'own-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),
      name: k.name, type: k.type, description: 'Your existing piece — kept in the design.',
      icon: '🏷️', price: 0, source: 'owned', url: '#', roomTypes: [], styles: [], colors: [], accent: '#8B6F47',
      owned: true
    };
  }

  // ---------- Recommendation engine ----------
  // [10-Q model] Signature: pickItemsForRoom(draft, answers, budgetVal, opts).
  // The old (styleIds, colorIds) signature is fully retired — call sites
  // updated to pass `answers` directly. Internal scoring still uses
  // FURNITURE_DB style/color tags via deriveScoringWeights.
  function pickItemsForRoom(draft, answers, budgetVal, opts = {}) {
    const allSlots = window.ROOM_SLOTS[draft.type] || [];
    // When the user wants to KEEP existing pieces, skip big furniture (sofa, bed,
    // desk, dining table, bathroom vanity, etc.) and lean into accents only.
    const heavySlots = new Set(['sofa','bed','table','desk','furniture','nightstand']);
    const slots = opts.keepMode === true
      ? allSlots.filter(s => !heavySlots.has(s))
      : allSlots;

    const weights = deriveScoringWeights(answers);
    const styleSet = new Set(weights.styles);
    const colorSet = new Set(weights.colors);
    const avoidSet = new Set(weights.avoid);
    const budgetMax = budgetVal === Infinity ? Infinity : (typeof budgetVal === 'number' && budgetVal > 0 ? budgetVal : 3000);

    const area = (draft.dims.w||0) * (draft.dims.l||0);
    const sizeBonus = area >= 220 ? 2 : area >= 150 ? 1 : 0;

    // [Q3 decor_density] Density answer caps the number of decor extras
    // beyond the slot fills. 'clean' → 0 extras, 'a_little' → 1, etc.
    const densityExtraCapMap = {
      clean: 0,
      a_little_personality: 1,
      lived_in_rich: 3,
      maximalist: 5
    };
    const decorExtrasCap = densityExtraCapMap[weights.decorDensity] !== undefined
      ? densityExtraCapMap[weights.decorDensity]
      : 1;

    const excludeIds = new Set(opts.excludeIds || []);
    const anchorColor = opts.anchorColor || null;

    const candidates = window.FURNITURE_DB.filter(i =>
      i.roomTypes.includes(draft.type) && !excludeIds.has(i.id)
    );

    // [Q9 avoid → negative prompts] Avoid IDs map to style tags whose items
    // get a hefty score penalty. Non-overlapping items pass through.
    const AVOID_STYLE_MAP = {
      too_modern:  ['modern','contemporary','minimalist'],
      too_rustic:  ['farmhouse','rustic','traditional'],
      busy_prints: ['eclectic','bohemian','art-deco'],
      dark_heavy:  [], // applied via color-mood penalty below
      trendy:      ['eclectic','art-deco']
    };
    const AVOID_COLOR_MAP = {
      dark_heavy: ['dark']
    };
    const avoidStyleSet = new Set();
    const avoidColorSet = new Set();
    avoidSet.forEach(id => {
      (AVOID_STYLE_MAP[id] || []).forEach(s => avoidStyleSet.add(s));
      (AVOID_COLOR_MAP[id] || []).forEach(c => avoidColorSet.add(c));
    });

    // [Dim 14 Section B Fix 1 — soft-avoid for Off-voted styles. Reads
    //  state.user._styleAvoid (24h time-windowed map written by the Aha
    //  Off-vote handler). Items tagged with an avoided style get a
    //  -0.5 score weight. Time-limited so users can't permanently block
    //  their own preferences.]
    const styleAvoidMap = state.user?._styleAvoid || {};
    const now = Date.now();
    const avoidedStylesActive = new Set(
      Object.entries(styleAvoidMap)
        .filter(([, expiry]) => typeof expiry === 'number' && expiry > now)
        .map(([style]) => style)
    );

    // [Batch 4 — Dim 07 D1 + D3 + D4] Personalization-aware scoring.
    // Per Reforge Engagement Engine "Better Signals + Better Ranking":
    // - Use profile.styleScores (vector) instead of binary styleSet hit
    // - Soft budget weighting (D3): stretch items still surface
    // - Sophistication factor (D4): high-fluency users see riskier rooms
    // - Personalization engagement state (D6): casual users get broader pool
    const ownerProfile = state.profiles?.find(p => Array.isArray(p.styles) && p.styles.length > 0
      && p.styles.every(s => styleSet.has(s))) || (state.profiles?.[0]);
    const styleScoresMap = ownerProfile?.styleScores || null;
    const sophistication = profileSophistication(ownerProfile);
    const persState = personalizationEngagementState(ownerProfile);
    const stretchTolerance = sophistication === 'high' ? 1.0 : sophistication === 'medium' ? 0.85 : 0.7;
    // Casual state: broaden — discount avoid penalties (recommender failing
    // this user, so don't double-down on its current weights).
    const avoidPenaltyMul = persState === 'casual' ? 0.5 : 1.0;

    const scored = candidates.map(item => {
      const styleHit = item.styles.filter(s => styleSet.has(s)).length;
      const colorHit = item.colors.filter(c => colorSet.has(c)).length;
      // Weighted style score — uses styleScores vector if present, falls
      // back to old binary hit-rate. Both bounded [0,1].
      let styleScore;
      if (styleScoresMap && Object.keys(styleScoresMap).length) {
        styleScore = item.styles.reduce((acc, s) => acc + (styleScoresMap[s] || 0), 0);
        styleScore = Math.min(1, styleScore);  // cap at 1
      } else {
        styleScore = styleSet.size ? styleHit / styleSet.size : 0.5;
      }
      const colorScore = colorSet.size ? colorHit / colorSet.size : 0.5;
      // Soft budget weighting per Reforge Engagement Engine "Better Ranking":
      // engine ranks, doesn't filter. Hard cap is applied later at packing.
      const priceFit = priceFitWeight(item.price, budgetMax);
      let score = styleScore*0.55 + colorScore*0.25 + priceFit*0.15 + Math.random()*0.05;
      if (anchorColor && item.accent) score += colorDistance(anchorColor, item.accent) < 60 ? 0.2 : 0;
      // Negative-prompt penalty (multiplied by Casual avoid-discount).
      const avoidStyleHit = item.styles.some(s => avoidStyleSet.has(s));
      const avoidColorHit = item.colors.some(c => avoidColorSet.has(c));
      if (avoidStyleHit) score -= 0.4 * avoidPenaltyMul;
      if (avoidColorHit) score -= 0.3 * avoidPenaltyMul;
      // [Dim 14] Off-vote soft-avoid (also multiplied by avoidPenaltyMul).
      if (avoidedStylesActive.size && item.styles.some(s => avoidedStylesActive.has(s))) {
        score -= 0.5 * avoidPenaltyMul;
      }
      // Sophistication factor: novice users get small bonus on safer styles
      // (modern/scandinavian/minimalist); experts get small bonus on
      // riskier styles (eclectic/bohemian/art-deco).
      const safer = ['modern', 'scandinavian', 'minimalist', 'contemporary'];
      const riskier = ['eclectic', 'bohemian', 'art-deco', 'maximalist'];
      if (sophistication === 'novice' && item.styles.some(s => safer.includes(s))) score += 0.05;
      if (sophistication === 'high' && item.styles.some(s => riskier.includes(s))) score += 0.05;
      return { item, score };
    }).sort((a,b) => b.score - a.score);

    const picked = [];
    let runningTotal = 0;
    const usedIds = new Set();

    for (const slot of slots) {
      const match = scored.find(({ item }) =>
        !usedIds.has(item.id) && item.type === slot && runningTotal + item.price <= budgetMax
      );
      if (match) {
        picked.push(match.item);
        usedIds.add(match.item.id);
        runningTotal += match.item.price;
      }
    }
    // Decor extras capped by both the room-size sizeBonus AND the user's
    // decor_density answer. Per Q3: clean → 0 extras, maximalist → up to 5.
    const extrasCap = Math.min(sizeBonus + decorExtrasCap, 8);
    const extras = scored.filter(({ item }) => !usedIds.has(item.id) && ['decor','plant','lighting'].includes(item.type));
    for (let i = 0; i < extrasCap && i < extras.length; i++) {
      const e = extras[i].item;
      if (runningTotal + e.price > budgetMax) break;
      picked.push(e);
      usedIds.add(e.id);
      runningTotal += e.price;
    }

    // [Dim 14 Section F — under-populated picker fallback]
    // Per Reforge PM Foundations — Feature Design (edge cases of input
    // coverage are first-class). If the picker returns <5 items because
    // the user's style+room+budget combo is under-populated in the
    // catalog, expand budget by 20% and retry once. Style-adjacency
    // expansion (style.adjacent) and neutral-fallback are deferred until
    // furniture.js authors that mapping. Tracking the event so the
    // catalog team can see which combos need more inventory.
    if (picked.length < 5 && opts._underPopulatedRetry !== true && budgetMax !== Infinity && typeof budgetMax === 'number' && budgetMax > 0) {
      trackEvent('picker_underpopulated', {
        roomType: draft.type,
        budget: budgetMax,
        gotItems: picked.length,
        styles: Array.from(styleSet)
      });
      // Single retry with budget relaxed +20%.
      return pickItemsForRoom(draft, answers, Math.round(budgetMax * 1.2), { ...opts, _underPopulatedRetry: true });
    }
    return picked;
  }

  function colorDistance(a, b) {
    // crude perceptual distance between hex colors
    const pa = parseHex(a), pb = parseHex(b);
    if (!pa || !pb) return 999;
    return Math.sqrt((pa.r-pb.r)**2 + (pa.g-pb.g)**2 + (pa.b-pb.b)**2);
  }
  function parseHex(h) {
    if (!h || h[0] !== '#') return null;
    const s = h.slice(1);
    if (s.length !== 6) return null;
    return { r: parseInt(s.slice(0,2),16), g: parseInt(s.slice(2,4),16), b: parseInt(s.slice(4,6),16) };
  }

  // ---------- Results ----------
  let currentRoomId = null;

  function openRoom(roomId) {
    syncFreeModeClass();
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) {
      // [Auth flow Fix 3] Reveal-intent miss = surface a clear error and
      // hold the user on signin. Without this, the previous silent return
      // dropped the user into a UX black hole: signin succeeded, the room
      // was missing (typically because pullAll overwrote state.rooms before
      // Fix 1 landed), openRoom returned with no toast, and the user
      // eventually navigated to home thinking the redesign was lost.
      //
      // Fix 3 contract: when the missing-room call originates from an
      // active reveal intent, log + toast + leave _pendingIntent SET so
      // a retry has the breadcrumb (per Fix 2). For any other source
      // (manual openRoom, deep-link, internal nav with stale id) keep
      // the historical silent-return — those paths are best-effort and
      // a toast would be noisy.
      const pending = state._pendingIntent;
      if (pending && pending.intent === 'reveal' && pending.roomId === roomId) {
        console.error('[openRoom] reveal-miss', {
          source: 'openRoom-reveal-miss',
          roomId,
          rooms_length: (state.rooms || []).length,
          pendingFromScreen: pending.fromScreen
        });
        toast("Couldn't load your redesign. Try signing in again.");
        showScreen('signin');
        // Re-render the signin screen in reveal-gate mode so the user
        // sees the same gate copy they came from. prepareSignin reads
        // state._pendingIntent (still set per the Fix 2 contract).
        if (typeof prepareSignin === 'function') prepareSignin();
        return;
      }
      return;
    }
    currentRoomId = roomId;
    const profile = state.profiles.find(p => p.id === room.profileId);

    // [Save Home] Fire the post-generation save surface ONCE per just-
    // generated room. _justGeneratedRoomId is set inside the success
    // branch of routeGenerationByModelTier; cleared after the surface
    // fires so revisits don't re-prompt.
    if (state._justGeneratedRoomId === roomId) {
      delete state._justGeneratedRoomId;
      save();
      // Defer to next tick so the results-screen layout settles first
      setTimeout(() => openPostGenerationSaveSurface(room), 600);
    }

    // [Batch 3 — A7] Aha event split.
    // The existing AHA_RESULTS event fires on render — that's the GATE.
    // The new aha_moment_reached fires on user-signaled experience.
    // Per Reforge R+E Module 03: render ≠ experience.
    const isFirstResultsForProfile = profile && !state._ahaResultsFired;
    if (isFirstResultsForProfile) {
      state._ahaResultsFired = true;
      save();
      // [Batch 6 — Dim 13 REC-13.12] tSinceSetupComplete + tSinceSignup
      // activation funnel timing.
      const tSinceSetupComplete = state._timing?.setupCompleteAt
        ? Date.now() - state._timing.setupCompleteAt
        : null;
      const tSinceSignup = state._timing?.signupStartedAt
        ? Date.now() - state._timing.signupStartedAt
        : null;
      trackEvent(ACTIVATION.AHA_RESULTS, {
        roomId: room.id,
        answers: profile.answers || {},
        styles: profile.styles,
        roomType: room.type,
        msFromSetup: state._setupCompleteAt ? (Date.now() - state._setupCompleteAt) : null,
        tSinceSetupComplete,
        tSinceSignup
      });
      // Also fire the GATE event (split-out, semantic clarity for funnel).
      trackEvent('aha_gate_reached', { roomId: room.id });
    }
    // Schedule the 10s-dwell signal for the experienced-Aha event.
    scheduleAhaDwellTimer(room);

    // Habit-moment signal: second room completed.
    const roomsByProfile = state.rooms.filter(r => r.profileId === profile?.id);
    if (profile && roomsByProfile.length === 2 && !state._habitFired) {
      state._habitFired = true;
      save();
      trackEvent(ACTIVATION.HABIT_2ND_ROOM, { profileId: profile.id });
      // [Batch 3 — Dim 04 R6] Habit action log: 2nd redesign is one of
      // the four habit actions per the action-based metric.
      logHabitAction('second_redesign');
    }

    // Sync the post-aha keep-existing switch to this room's state.
    const _keepSw = $('#keepExistingSwitch');
    if (_keepSw) {
      _keepSw.setAttribute('aria-checked', room.keepMode ? 'true' : 'false');
      _keepSw.classList.toggle('on', !!room.keepMode);
    }

    // First-results hint tour: highlight a price tag so users discover
    // tap-to-shop. One-shot, separate from the celebration.
    // [B2-19 / Dim 11 D.6] Coachmark timing 600ms → 3500ms. Per Reforge
    // Aha Moment p.14: distributing competing CTAs across the user's
    // attention budget = low conversion on each. Sequencing them lets
    // the coachmark land AFTER the reveal choreography settles (Frame 7
    // ends at 3300ms in the Section C spec). Pulse-against-settled-user
    // converts higher than pulse-against-loading-user.
    if (isFirstResultsForProfile && !state._tourShown) {
      state._tourShown = true;
      save();
      setTimeout(() => showFirstAhaHint(), 3500);
    }

    // [First-redesign tutorial] Queue the auto-route to preferences with
    // tutorial overlay. Fires 6s after this room renders, ONCE per user.
    // See queueFirstRedesignTutorial() for the full contract + skip beat.
    queueFirstRedesignTutorial();

    const summaryEl = $('#resultsSummary');
    summaryEl.innerHTML = `
      <strong>${titleRoom(room.type)}</strong> · ${room.dims.w}×${room.dims.l} ft · ${(profile?.styles||[]).map(styleLabel).join(' · ') || '—'}
    `;
    // Remove any existing banner
    const prevBanner = document.getElementById('keptBanner');
    if (prevBanner) prevBanner.remove();
    if (room.keepMode) {
      const banner = document.createElement('div');
      banner.className = 'kept-banner';
      banner.id = 'keptBanner';
      banner.innerHTML = `
        <div class="kb-icon">✓</div>
        <div><strong>Your existing pieces preserved.</strong><br>We've focused on accents, lighting, and decor to complement what's already there.</div>
      `;
      summaryEl.after(banner);
    }

    $('#baBeforeImg').src = room.photo || '';
    $('#baAfterImg').src = room.photo || '';
    $('#roomOverlay').innerHTML = `
      <div class="overlay-label">${profile?.name || ''}</div>
      <div class="overlay-title">Designed with Furnish</div>
    `;

    // reset slider to 50%
    setSliderPct(50);
    // reset lighting to afternoon
    applyLighting('afternoon');
    $$('#lightingChips .chip-sm').forEach(c => c.classList.toggle('active', c.dataset.light === 'afternoon'));

    renderRoomPieces(room);
    renderVersions(room);
    refreshBookmarkBtn(room);

    // Exit rearrange mode if it was left on from another room
    if (rearrangeMode) {
      rearrangeMode = false;
      document.getElementById('baSlider')?.classList.remove('rearranging');
      const rb = document.getElementById('rearrangeBtn');
      rb?.classList.remove('active');
      rb?.querySelector('.rb-label') && (rb.querySelector('.rb-label').textContent = 'Rearrange Furniture');
    }
    showScreen('results');

    // [B2-15 / Dim 11 D.2] Reveal choreography orchestrator.
    // [B2-21 / Dim 11 D.8] Overlay timed flash co-occurs with Frame 4.
    // Per Reforge Aha Moment p.5-7: enforce the qualitative description
    // ("feels like you've gained a special ability"). Frame timings
    // match Section C spec. CSS keyframes do the actual motion; this
    // function only adds/removes class flags at the right moments.
    runRevealChoreography();
  }

  // [B2-15 / Dim 11 D.2 + B2-21 / Dim 11 D.8]
  // Reveal choreography orchestrator. Keeps the timing in one place;
  // bails out cleanly if the user navigates away mid-sequence.
  function runRevealChoreography() {
    const overlay = document.getElementById('roomOverlay');
    const afterImg = document.getElementById('baAfterImg');
    const totalsCard = document.getElementById('totalsCard');
    const priceTagsContainer = document.getElementById('priceTags');
    if (overlay) overlay.classList.remove('flashing');
    if (afterImg) afterImg.classList.remove('entering');
    if (totalsCard) totalsCard.classList.remove('entering');

    // Frame 1 — image fade-in / scale-pop on the after-image only.
    if (afterImg) {
      requestAnimationFrame(() => afterImg.classList.add('entering'));
      // Clear the class once the animation completes (~600ms), so future
      // re-renders aren't sticky.
      setTimeout(() => afterImg.classList.remove('entering'), 700);
    }
    // Frame 4 — overlay flash at 1400ms
    setTimeout(() => {
      if (document.querySelector('.screen.active')?.dataset.screen !== 'results') return;
      overlay?.classList.add('flashing');
    }, 1400);
    // Frame 5 — price tags ripple-in at 2000ms (80ms stagger).
    // The tags are rendered by renderPriceTags and may not exist yet
    // for very fast paths; we re-query at firing time.
    setTimeout(() => {
      if (document.querySelector('.screen.active')?.dataset.screen !== 'results') return;
      const tags = priceTagsContainer?.querySelectorAll('.price-tag') || [];
      tags.forEach((tag, idx) => {
        tag.style.animationDelay = `${idx * 80}ms`;
        tag.classList.add('entering');
        setTimeout(() => tag.classList.remove('entering'), 200 + idx * 80 + 50);
      });
    }, 2000);
    // Frame 6 — totals card slide-up at 2700ms
    setTimeout(() => {
      if (document.querySelector('.screen.active')?.dataset.screen !== 'results') return;
      totalsCard?.classList.add('entering');
      setTimeout(() => totalsCard?.classList.remove('entering'), 460);
    }, 2700);
  }

  function showFirstAhaHint() {
    // Highlight the first price tag + show a floating coach mark.
    const tag = document.querySelector('#priceTags .price-tag');
    if (!tag) return;
    tag.classList.add('coach-pulse');
    const coach = document.createElement('div');
    coach.className = 'coach-mark';
    coach.innerHTML = `
      <div class="cm-arrow"></div>
      <div class="cm-body">Tap any price tag to shop the piece. Every item links to a real store.</div>
      <button class="cm-ok" type="button">Got it</button>
    `;
    document.body.appendChild(coach);
    const rect = tag.getBoundingClientRect();
    coach.style.top  = (rect.bottom + 12 + window.scrollY) + 'px';
    coach.style.left = Math.max(12, Math.min(window.innerWidth - 280, rect.left - 20)) + 'px';
    const dismiss = () => {
      tag.classList.remove('coach-pulse');
      coach.classList.add('out');
      setTimeout(() => coach.remove(), 240);
    };
    coach.querySelector('.cm-ok').addEventListener('click', dismiss);
    setTimeout(dismiss, 8000);
  }

  // [Compute-quality routing] renderQuotaBanner replaced by
  // renderPremiumUpsellHint. The new hint surfaces only on the 3rd+ Free
  // generation (per Reforge User Psychology upsell pacing), once per session,
  // with a 7-day cooldown between surfaces to avoid wear-out.
  //
  // Activation rule: never on first redesign (preserves the aha moment);
  // first eligible from generation #3 onward.
  // Frequency rule: max 1 surface per session, tracked via state._premiumUpsellShownAt.
  // Cooldown rule: ≥ 7 days between two surfaces for the same user.
  function renderPremiumUpsellHint(room) {
    const card = document.getElementById('totalsCard');
    if (!card) return;
    document.getElementById('premiumUpsellHint')?.remove();
    if (isPro()) return;
    if (room && room.modelTier === 'premium') return; // they already got premium

    const used = generationsUsed();
    if (used < 3) return; // pacing: skip first 2 redesigns (activation phase)

    // Cooldown: 7 days since last shown OR session-once.
    const now = Date.now();
    const lastShown = state.user?._premiumUpsellShownAt || 0;
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    if (now - lastShown < SEVEN_DAYS) return;
    if (state._premiumUpsellShownThisSession) return;

    const banner = document.createElement('div');
    banner.id = 'premiumUpsellHint';
    banner.className = 'premium-upsell-hint';
    banner.innerHTML = `
      <span class="puh-spark" aria-hidden="true">✦</span>
      <div class="puh-body">
        <div class="puh-headline"><strong>Want sharper redesigns next time?</strong></div>
        <div class="puh-sub">Pro routes you to our premium AI model — more accurate matches, richer lighting.</div>
      </div>
      <button class="puh-cta" type="button" id="premiumUpsellCta">See Pro</button>
      <button class="puh-close" type="button" aria-label="Dismiss" id="premiumUpsellClose">×</button>
    `;
    card.after(banner);

    // Mark shown (session + persistent timestamp).
    state._premiumUpsellShownThisSession = true;
    if (!state.user) state.user = {};
    state.user._premiumUpsellShownAt = now;
    save();
    trackEvent('premium_quality_upsell_shown', {
      triggeringContext: 'results_post_generation',
      generationsUsed: used,
    });

    document.getElementById('premiumUpsellCta')?.addEventListener('click', () => {
      trackEvent('premium_quality_upsell_clicked', {
        triggeringContext: 'results_post_generation',
        generationsUsed: used,
      });
      openPaywall('premium_quality');
    });
    document.getElementById('premiumUpsellClose')?.addEventListener('click', () => {
      trackEvent('premium_quality_upsell_dismissed', {
        triggeringContext: 'results_post_generation',
        generationsUsed: used,
      });
      banner.remove();
    });
  }

  function renderRoomPieces(room) {
    const totalNow = room.items.reduce((s,i) => s + i.price, 0);
    $('#totalsCard').innerHTML = `
      <div>
        <div class="total-label">Estimated total</div>
        <div class="total-value">$${totalNow.toLocaleString()}</div>
      </div>
      <div class="muted small">${room.items.length} pieces · affiliate picks</div>
    `;

    // [Compute-quality routing] Pacing-aware Pro upsell on results screen.
    // Replaces the old quota banner. Surfaces once per session at gen #3+,
    // with 7-day cooldown. See renderPremiumUpsellHint() for the contract.
    renderPremiumUpsellHint(room);
    // [Batch 5 Part 2 — Dim 02 D02-B2] Style evolution card on 2nd+ version.
    // Per Reforge ELMR Reward (Mastery — "reaching a new level"): showing
    // version-over-version progression creates evidence the AI improves
    // for them. Combined with peak-end framing — the *end* of a session
    // that includes "look how far you've come" is dramatically more
    // memorable than one with no inter-session callback.
    renderStyleEvolutionCard(room);

    renderPriceTags(room);
    renderPalette(room);
    renderItemsList(room);
  }

  // [Batch 5 Part 2 — Dim 02 D02-B2] Renders evolution card when room has
  // ≥2 versions AND the card hasn't been dismissed/seen this session for
  // this room. Compares first version vs current. No fake content; pulls
  // real prices + item counts + version timestamps from `room.versions`.
  function renderStyleEvolutionCard(room) {
    const card = document.getElementById('totalsCard');
    if (!card) return;
    document.getElementById('styleEvolutionCard')?.remove();
    if (!room || !Array.isArray(room.versions) || room.versions.length < 2) return;
    if (state._evolutionDismissedRooms?.[room.id]) return;
    const v1 = room.versions[0];
    const vLatest = room.versions[room.versions.length - 1];
    if (!v1 || !vLatest || v1.id === vLatest.id) return;
    const total1 = (v1.items || []).reduce((s,i) => s + (i.price || 0), 0);
    const totalNow = (vLatest.items || []).reduce((s,i) => s + (i.price || 0), 0);
    const diff = totalNow - total1;
    const dirArrow = diff === 0 ? '·' : (diff > 0 ? '↑' : '↓');
    const dirLabel = diff === 0 ? 'same total' : (diff > 0 ? `+$${Math.abs(diff).toLocaleString()}` : `−$${Math.abs(diff).toLocaleString()}`);
    const dayDiff = Math.max(1, Math.round((vLatest.timestamp - v1.timestamp) / (24 * 60 * 60 * 1000)));
    const banner = document.createElement('div');
    banner.id = 'styleEvolutionCard';
    banner.className = 'style-evolution-card';
    banner.innerHTML = `
      <div class="sec-headline"><strong>Your style evolution</strong> — same room, sharpened by what you've taught us.</div>
      <div class="sec-row">
        <div class="sec-col">
          <div class="sec-col-label">v1 · ${dayDiff} day${dayDiff === 1 ? '' : 's'} ago</div>
          <div class="sec-col-stats">$${total1.toLocaleString()} · ${(v1.items || []).length} pieces</div>
        </div>
        <div class="sec-arrow" aria-hidden="true">→</div>
        <div class="sec-col sec-col-current">
          <div class="sec-col-label">Now</div>
          <div class="sec-col-stats">$${totalNow.toLocaleString()} · ${(vLatest.items || []).length} pieces &nbsp;<span class="sec-diff">${dirArrow} ${dirLabel}</span></div>
        </div>
      </div>
      <button class="sec-dismiss" type="button" aria-label="Dismiss" id="styleEvolutionDismiss">×</button>
    `;
    card.after(banner);
    trackEvent('style_evolution_card_shown', { roomId: room.id, versionCount: room.versions.length, total1, totalNow });
    document.getElementById('styleEvolutionDismiss')?.addEventListener('click', () => {
      banner.remove();
      state._evolutionDismissedRooms = state._evolutionDismissedRooms || {};
      state._evolutionDismissedRooms[room.id] = Date.now();
      save();
      trackEvent('style_evolution_card_dismissed', { roomId: room.id });
    });
  }
  window.FurnishRenderStyleEvolution = renderStyleEvolutionCard;

  // ============================================================
  // [Batch 5 Part 2 — Dim 02 D02-12 modified] Tonight's recap session-end
  // overlay. Per Reforge ELMR Reward + Peak-End Rule: the *end* of a
  // session is what gets retroactively averaged into the user's memory
  // of the whole experience. Engineering the end with a summary +
  // forward hook converts a flat exit into a memorable peak. Conservative-
  // bias: original spec teased a "Friday template drop" — deferred until
  // real weekly template cadence exists. Today's hook leans on the
  // already-real wishlist + price-watch loop.
  // ============================================================
  // Trigger pattern: on visibilitychange → visible, if user was away ≥30s
  // AND has at least one rendered room AND we haven't shown today, render
  // the overlay. Fires once per day per user.
  function recordSessionLeft() {
    if (document.visibilityState !== 'hidden') return;
    if (!state.user) state.user = {};
    state.user._lastSessionLeftAt = Date.now();
    save();
  }
  function maybeFireTonightsRecap() {
    if (document.visibilityState !== 'visible') return;
    if (!state.user) return;
    const leftAt = state.user._lastSessionLeftAt || 0;
    if (!leftAt) return;
    if (Date.now() - leftAt < 30 * 1000) return; // need ≥30s away
    const today = new Date().toISOString().slice(0, 10);
    if (state.user._tonightsRecapLastShown === today) return;
    if (!Array.isArray(state.rooms) || state.rooms.length === 0) return;
    // Pick the most recently-active room (currentRoomId if set, else most recent)
    let room = currentRoomId ? state.rooms.find(r => r.id === currentRoomId) : null;
    if (!room) room = state.rooms[state.rooms.length - 1];
    if (!room) return;
    renderTonightsRecapOverlay(room);
  }
  function renderTonightsRecapOverlay(room) {
    document.getElementById('tonightsRecapOverlay')?.remove();
    const totalNow = (room.items || []).reduce((s,i) => s + (i.price || 0), 0);
    const savedCount = (state.wishlist || []).length;
    const roomLabel = (room.type || 'room').toLowerCase();
    const wishlistHook = savedCount > 0
      ? `We'll keep watching prices on your <strong>${savedCount}</strong> saved piece${savedCount === 1 ? '' : 's'}.`
      : `Save a few pieces and we'll watch their prices for you.`;
    const overlay = document.createElement('div');
    overlay.id = 'tonightsRecapOverlay';
    overlay.className = 'tonights-recap-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-live', 'polite');
    overlay.innerHTML = `
      <div class="tro-backdrop" id="tonightsRecapBackdrop"></div>
      <div class="tro-card">
        <button class="tro-close" type="button" id="tonightsRecapClose" aria-label="Dismiss">×</button>
        <div class="tro-eyebrow">Tonight's recap</div>
        <h3 class="tro-title">You designed your ${roomLabel}.</h3>
        <p class="tro-stat">${(room.items || []).length} pieces · <strong>$${totalNow.toLocaleString()}</strong> total</p>
        <p class="tro-hook">${wishlistHook}</p>
        <div class="tro-actions">
          <button class="btn btn-primary tro-cta" type="button" id="tonightsRecapCta">${savedCount > 0 ? 'See my saved pieces' : 'Try a different room'}</button>
          <button class="btn btn-ghost tro-later" type="button" id="tonightsRecapLater">Maybe later</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    void overlay.offsetHeight;
    overlay.classList.add('show');
    state.user._tonightsRecapLastShown = new Date().toISOString().slice(0, 10);
    save();
    trackEvent('tonights_recap_shown', { roomId: room.id, savedCount, totalNow });
    const dismiss = (reason) => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 240);
      trackEvent('tonights_recap_dismissed', { reason });
    };
    document.getElementById('tonightsRecapCta').addEventListener('click', () => {
      trackEvent('tonights_recap_clicked', { hasWishlist: savedCount > 0, roomId: room.id });
      dismiss('clicked');
      if (savedCount > 0) {
        document.getElementById('wishlistBtn')?.click();
      } else {
        document.querySelector('[data-go="capture"]')?.click();
      }
    });
    document.getElementById('tonightsRecapLater').addEventListener('click', () => dismiss('later'));
    document.getElementById('tonightsRecapClose').addEventListener('click', () => dismiss('close'));
    document.getElementById('tonightsRecapBackdrop').addEventListener('click', () => dismiss('backdrop'));
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') recordSessionLeft();
    else if (document.visibilityState === 'visible') maybeFireTonightsRecap();
  });
  window.FurnishMaybeFireTonightsRecap = maybeFireTonightsRecap;

  // [FOUR_FIX_PASS — Fix 2] Price-tag → item-card scroll-and-highlight.
  // Per Reforge Conversion Optimization (friction removal). The card
  // already carries id="item-${item.id}" from renderItemsList; this just
  // finds it, expands the list if it's hidden in condensed mode, scrolls
  // it into view smoothly, and pulses a 1s highlight class so the user
  // immediately knows where they landed.
  let _scrollHighlightTimer = null;
  function scrollToItemCard(item, room) {
    const itemPosition = room && room.items ? room.items.findIndex(i => i.id === item.id) : -1;
    trackEvent('price_tag_tapped', {
      item_id: item.id,
      item_position_in_list: itemPosition,
      source_screen: 'reveal'
    });
    let card = document.getElementById('item-' + item.id);
    // If the items list is condensed (top-3) and this item is in the rest,
    // expand the list first so the card exists in DOM. Per spec edge case
    // "make sure scroll calculation accounts for sticky/fixed elements".
    if (!card && room && room._itemsExpanded === false) {
      room._itemsExpanded = true;
      save();
      trackEvent('items_list_expanded', { roomId: room.id, totalItems: room.items.length, source: 'price_tag_route' });
      renderItemsList(room);
      card = document.getElementById('item-' + item.id);
    }
    if (!card) {
      // Item card isn't in DOM — out-of-stock / broken affiliate. Per spec:
      // "do not silently fail." Toast graceful fallback. Full placeholder-
      // card pattern deferred (DEFERRED.md backend-phase).
      toast(`${item.name} is no longer available.`);
      return;
    }
    // Scroll. block:'start' lands near the top with sufficient headroom
    // via scroll-margin-top (set in CSS).
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Cancel any pending highlight reset from an earlier rapid tap; reset
    // the highlight on every card before applying to this one.
    if (_scrollHighlightTimer) {
      clearTimeout(_scrollHighlightTimer);
      document.querySelectorAll('.item-card.is-highlighted').forEach(c => c.classList.remove('is-highlighted'));
    }
    // Re-trigger the animation: remove + reflow + add (same canonical
    // pattern used elsewhere in the app for animation restart).
    card.classList.remove('is-highlighted');
    void card.offsetHeight;
    card.classList.add('is-highlighted');
    _scrollHighlightTimer = setTimeout(() => {
      card.classList.remove('is-highlighted');
      _scrollHighlightTimer = null;
    }, 1100);
  }

  function renderPriceTags(room) {
    const el = $('#priceTags');
    el.innerHTML = '';
    if (!room.layout) room.layout = {};
    const purchaseable = room.items.filter(i => !i.owned);
    purchaseable.forEach((item, i) => {
      // Restore stored position; fall back to a circular default for new items.
      let pos = room.layout[item.id];
      if (!pos) {
        const total = Math.max(1, purchaseable.length);
        const angle = (i / total) * Math.PI * 2;
        const r = 32;
        pos = { x: 50 + Math.cos(angle) * r, y: 52 + Math.sin(angle) * r * 0.6 };
        room.layout[item.id] = pos;
      }

      const tag = document.createElement('button');
      tag.className = 'price-tag';
      tag.style.left = pos.x + '%';
      tag.style.top  = pos.y + '%';
      tag.dataset.itemId = item.id;
      tag.innerHTML = `<span class="pt-icon">${item.icon}</span><span class="pt-price">$${item.price.toLocaleString()}</span>`;
      tag.title = item.name;

      tag.addEventListener('click', e => {
        if (rearrangeMode) { e.preventDefault(); return; }
        // [FOUR_FIX_PASS — Fix 2] Tag taps now scroll to the item's card in
        // the "Shop The Whole Room" list with a brief highlight pulse,
        // instead of opening the bottom sheet. Reforge Conversion
        // Optimization: removes friction between intent ("I want this
        // thing in the photo") and action (the affiliate Shop button on
        // the matched card).
        scrollToItemCard(item, room);
      });
      attachTagDrag(tag, room);

      el.appendChild(tag);
    });
  }

  // ---------- Rearrange Furniture (drag tags on the photo) ----------
  let rearrangeMode = false;
  const _drag = { active: false, tag: null, room: null, rect: null };

  function attachTagDrag(tag, room) {
    const start = e => {
      if (!rearrangeMode) return;
      e.preventDefault();
      _drag.active = true;
      _drag.tag = tag;
      _drag.room = room;
      _drag.rect = document.getElementById('priceTags').getBoundingClientRect();
      tag.classList.add('dragging');
    };
    tag.addEventListener('mousedown', start);
    tag.addEventListener('touchstart', start, { passive: false });
  }

  document.addEventListener('mousemove', _dragMove);
  document.addEventListener('touchmove', _dragMove, { passive: false });
  document.addEventListener('mouseup',   _dragEnd);
  document.addEventListener('touchend',  _dragEnd);

  function _dragMove(e) {
    if (!_drag.active) return;
    if (e.cancelable) e.preventDefault();
    const point = e.touches ? e.touches[0] : e;
    const x = ((point.clientX - _drag.rect.left) / _drag.rect.width)  * 100;
    const y = ((point.clientY - _drag.rect.top)  / _drag.rect.height) * 100;
    const cx = Math.max(6, Math.min(94, x));
    const cy = Math.max(6, Math.min(94, y));
    _drag.tag.style.left = cx + '%';
    _drag.tag.style.top  = cy + '%';
  }

  function _dragEnd() {
    if (!_drag.active) return;
    _drag.tag.classList.remove('dragging');
    const id = _drag.tag.dataset.itemId;
    if (_drag.room && id) {
      if (!_drag.room.layout) _drag.room.layout = {};
      _drag.room.layout[id] = {
        x: parseFloat(_drag.tag.style.left),
        y: parseFloat(_drag.tag.style.top)
      };
      save();
    }
    _drag.active = false; _drag.tag = null; _drag.room = null;
  }

  document.getElementById('rearrangeBtn').addEventListener('click', () => {
    // [Model A — D10 override] Rearrange is FREE for everyone. The AI
    // re-layout call must stay minimal-cost (server-side concern) since this
    // doesn't decrement the generation quota. Until the real AI re-layout
    // pipeline lands (DEFERRED.md), this remains a UI-only stub: tags become
    // draggable and the new layout is saved per-room. No Pro gate, no paywall.
    trackEvent('rearrange_clicked', { roomId: currentRoomIdSafe() });
    toast('Drag any price tag to reposition it. Tap done to save.');
    // Existing rearrange-mode toggling is wired separately via attachTagDrag —
    // keeping this handler simple to avoid duplicate behavior.
  });

  let activeAnchorColor = null;

  function renderPalette(room) {
    const el = $('#paletteSwatches');
    el.innerHTML = '';
    const seen = new Set();
    room.items.filter(i => !i.owned).forEach(item => {
      if (!item.accent || seen.has(item.accent)) return;
      seen.add(item.accent);
      const sw = document.createElement('button');
      sw.className = 'palette-swatch' + (activeAnchorColor === item.accent ? ' active' : '');
      sw.style.background = item.accent;
      sw.title = `Anchor around ${item.accent}`;
      sw.addEventListener('click', () => {
        activeAnchorColor = activeAnchorColor === item.accent ? null : item.accent;
        $('#clearPaletteBtn').style.display = activeAnchorColor ? '' : 'none';
        renderPalette(room);
        toast(activeAnchorColor ? 'Color anchored — reshuffle to apply' : 'Color cleared');
      });
      el.appendChild(sw);
    });
  }

  $('#clearPaletteBtn').addEventListener('click', () => {
    activeAnchorColor = null;
    const room = state.rooms.find(r => r.id === currentRoomId);
    if (room) { renderPalette(room); $('#clearPaletteBtn').style.display = 'none'; }
  });

  // [Dim 09 D9 + Dim 10 #4 — fit-warning rewrite. Two changes:
  //  (1) Emoji ⚠ removed per CLAUDE.md no-emoji rule (replaced with a
  //      stroke-based custom SVG, consistent with the other icons in
  //      the app — same SVG style as theme-toggle, item-action-btn).
  //  (2) Copy de-hedged: "may not fit" → specific dimension +
  //      recovery ("verify before buying"). Per Reforge Brand Marketing
  //      consistency rule + Product Marketing benefits-not-features:
  //      a warning that doesn't say WHAT or HOW TO RECOVER is fake
  //      feedback. The function picks the right phrasing based on
  //      which footprint dimension is being violated. Item-level
  //      `dimensions` may not exist in current FURNITURE_DB rows;
  //      we degrade gracefully to the generic-but-still-actionable
  //      "Larger than your room's footprint." -->
  const FIT_WARN_SVG = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>';
  function fitWarningCopy(item, room) {
    const itemW = item?.dimensions?.width || 0;
    const roomW = room?.dims?.w || 0;
    if (itemW && roomW && itemW > roomW) return 'Wider than your room. Verify before buying.';
    const itemD = item?.dimensions?.depth || 0;
    const roomD = room?.dims?.l || 0;
    if (itemD && roomD && itemD > roomD) return 'Deeper than your room. Verify before buying.';
    return "Larger than your room's footprint. Verify before buying.";
  }

  function renderItemsList(room) {
    const list = $('#itemsList');
    list.innerHTML = '';
    const roomArea = (room.dims.w || 0) * (room.dims.l || 0);
    const usedFootprint = room.items.reduce((s,i) => s + (window.ITEM_FOOTPRINTS[i.type] || 0), 0);

    // [Batch 3 — Dim 03 R-Bottom1] Top-3 default + expander.
    // Per Reforge Psych Framework: a wall of cards = high cognitive
    // negative psych. Top-3 lifts CTR on the highest-quality picks;
    // expander preserves power-user access. Once expanded, sticky.
    const totalItems = room.items.length;
    const useCondensed = totalItems > 4 && !room._itemsExpanded;
    const ranked = useCondensed
      ? rankItemsForCondensedList(room.items)
      : { top: room.items, rest: [] };
    const itemsToRender = ranked.top;

    // [BUDGET_RESET_PASS — Phase 2] Compute above-budget set for this room.
    // Items above the user's chosen budget render with a subtle marker —
    // not hidden, just visually de-emphasized. The user can still click.
    const roomBudget = (typeof room.budget === 'number') ? room.budget : SLIDER_BUDGET_DEFAULT;
    const aboveBudgetCount = itemsToRender.filter(i => !i.owned && i.price > roomBudget).length;
    const shoppableCount = itemsToRender.filter(i => !i.owned).length;
    if (aboveBudgetCount > 0 && roomBudget !== Infinity) {
      trackEvent('items_filtered_above_budget', {
        count_filtered: aboveBudgetCount,
        total_count: itemsToRender.length,
        budget_value: roomBudget
      });
    }
    // [Hassan's call — low-floor expansion] When the user picks a very low
    // budget ($50–$200) the catalog may have zero items below it. Surface
    // an honest empty-state at the top of the list — voice rubric says
    // concrete + warm + no failure-framing. All items still render below
    // with the existing "Above budget" marker; this is a header, not a
    // replacement of the list. Reforge Conversion Optimization (Dim 03):
    // an honest tell-the-truth empty-state preserves trust at the low end
    // where the bait-and-switch cost would be highest.
    if (
      roomBudget !== Infinity &&
      shoppableCount > 0 &&
      aboveBudgetCount === shoppableCount
    ) {
      const banner = document.createElement('div');
      banner.className = 'items-budget-empty';
      banner.innerHTML = `
        <div class="ibe-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <path d="M9 9l6 6M15 9l-6 6"/>
          </svg>
        </div>
        <div class="ibe-body">
          <strong>No items in your budget for this room yet.</strong>
          <span>Increase your budget or browse the full results below — items above your budget show with a marker.</span>
        </div>
      `;
      list.appendChild(banner);
      trackEvent('items_budget_empty_state_shown', {
        budget_value: roomBudget,
        room_type: room.type,
        total_items: shoppableCount
      });
    }

    itemsToRender.forEach(item => {
      const fp = window.ITEM_FOOTPRINTS[item.type] || 0;
      const fits = usedFootprint <= roomArea * 0.45 || fp <= roomArea * 0.25;
      const aboveBudget = !item.owned && item.price > roomBudget && roomBudget !== Infinity;
      const card = document.createElement('div');
      card.className = 'item-card' + (item.owned ? ' owned' : '') + (aboveBudget ? ' above-budget' : '');
      card.id = 'item-'+item.id;
      const onWishlist = state.wishlist.includes(item.id);
      const alertOn = state.priceAlerts[item.id];

      card.innerHTML = `
        <div class="item-thumb">${item.icon}</div>
        <div class="item-body">
          <div class="name">${item.name}${aboveBudget ? ' <span class="above-budget-badge">Above budget</span>' : ''}</div>
          <div class="desc">${item.description}</div>
          <div class="meta">
            ${item.owned ? '<span class="tag source">Owned</span>' : `<span class="tag source">${sourceLabel(item.source)}</span>`}
            <span class="tag">${item.type}</span>
            ${!fits ? `<span class="tag warn">${FIT_WARN_SVG}${fitWarningCopy(item, room)}</span>` : ''}
            <span class="price">${item.owned ? '—' : '$'+item.price.toLocaleString()}</span>
          </div>
        </div>
        ${item.owned ? '' : `
        <div class="item-actions">
          <a class="item-action-btn link-style" href="${buildAffiliateUrl(item)}" target="_blank" rel="noopener noreferrer" data-shop-id="${item.id}">Shop</a>
          <button class="item-action-btn ${onWishlist ? 'active' : ''}" data-act="wish">${onWishlist ? `<svg viewBox='0 0 24 24' width='14' height='14' fill='currentColor' style='vertical-align:-2px;margin-right:4px'><path d='M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6C19 16.5 12 21 12 21z'/></svg>Saved` : `<svg viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-2px;margin-right:4px'><path d='M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6C19 16.5 12 21 12 21z'/></svg>Save`}</button>
          <button class="item-action-btn" data-act="swap">⇄ Swap</button>
          <button class="item-action-btn ${alertOn ? 'active' : ''}" data-act="alert">${alertOn ? `<svg viewBox='0 0 24 24' width='14' height='14' fill='currentColor' style='vertical-align:-2px;margin-right:4px'><path d='M12 2a2 2 0 012 2v1.2A6 6 0 0118 11v3l1.5 2H4.5L6 14v-3a6 6 0 014-5.8V4a2 2 0 012-2zM10 19h4a2 2 0 01-4 0z'/></svg>On` : `<svg viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-2px;margin-right:4px'><path d='M18 14v-3a6 6 0 00-12 0v3l-1.5 2h15z'/><path d='M10 19a2 2 0 004 0'/><path d='M3 3l18 18' stroke-width='2'/></svg>Alert`}</button>
        </div>`}
      `;
      card.querySelector('[data-act="wish"]')?.addEventListener('click', e => { e.stopPropagation(); toggleWishlist(item); });
      card.querySelector('[data-act="swap"]')?.addEventListener('click', e => { e.stopPropagation(); swapItem(room, item); });
      card.querySelector('[data-act="alert"]')?.addEventListener('click', e => { e.stopPropagation(); togglePriceAlert(item); });
      // [Model A] Track every affiliate clickthrough — primary monetization.
      card.querySelector('[data-shop-id]')?.addEventListener('click', e => { e.stopPropagation(); trackAffiliateClick(item, 'item_card_button'); });
      // Tap anywhere else on the card → open the item sheet
      if (!item.owned) {
        card.addEventListener('click', e => {
          if (e.target.closest('button, a')) return;
          openItemSheet(item, room);
        });
      }
      list.appendChild(card);
    });

    // [Batch 3 — Dim 03 R-Bottom1] "See all" expander when condensed.
    if (useCondensed && ranked.rest.length > 0) {
      const expander = document.createElement('button');
      expander.className = 'btn btn-ghost items-expander';
      expander.type = 'button';
      expander.innerHTML = `See all ${totalItems} pieces <span class="ie-arrow" aria-hidden="true">↓</span>`;
      expander.addEventListener('click', () => {
        room._itemsExpanded = true;
        save();
        trackEvent('items_list_expanded', { roomId: room.id, totalItems });
        renderItemsList(room);
      });
      list.appendChild(expander);
    }
  }

  // C10 — Soft pre-prompt for push permission, gated on first save action
  // (Reforge User Psychology: post-investment grant rate >> pre-investment).
  function maybeAskForPushPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    if (state.user?._pushAsked) return;
    const totalSaves = (state.wishlist || []).length + (state.bookmarkedRooms || []).length;
    if (totalSaves < 1) return;
    if (!state.user) state.user = {};
    state.user._pushAsked = true;
    save();
    document.querySelector('.push-pre-prompt')?.remove();
    const card = document.createElement('div');
    card.className = 'push-pre-prompt';
    card.innerHTML = `
      <div class="ppp-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
      </div>
      <div class="ppp-body">
        <strong>Want a heads-up when prices drop?</strong>
        <p class="muted small">We'll only ping you about your saved pieces — never spam.</p>
      </div>
      <div class="ppp-actions">
        <button class="btn btn-primary small" id="pppYes">Yes, notify me</button>
        <button class="btn btn-ghost small" id="pppNo">Not now</button>
      </div>
      <button class="ppp-close" id="pppClose" aria-label="Close">×</button>
    `;
    document.body.appendChild(card);
    requestAnimationFrame(() => card.classList.add('show'));
    const dismiss = (result) => {
      trackEvent('push_permission', { result });
      card.classList.remove('show');
      setTimeout(() => card.remove(), 240);
    };
    card.querySelector('#pppYes').onclick = async () => {
      try {
        const r = await Notification.requestPermission();
        dismiss(r);
      } catch { dismiss('error'); }
    };
    card.querySelector('#pppNo').onclick = () => dismiss('soft_denied');
    card.querySelector('#pppClose').onclick = () => dismiss('dismissed');
  }

  function toggleWishlist(item) {
    const idx = state.wishlist.indexOf(item.id);
    if (idx >= 0) {
      state.wishlist.splice(idx, 1);
      delete (state.wishlistMeta || {})[item.id];
      toast('Removed from wishlist');
    } else {
      state.wishlist.push(item.id);
      // Stamp metadata for save-age mechanics.
      state.wishlistMeta = state.wishlistMeta || {};
      state.wishlistMeta[item.id] = {
        savedAt: Date.now(),
        priceAtSave: item.price,
        roomIdAtSave: currentRoomId || null
      };
      toast('Saved to wishlist');
      // [Batch 3 — A7] Wishlist save is an Aha experience signal.
      const room0 = state.rooms.find(r => r.id === currentRoomId);
      if (room0) fireAhaMomentIfFresh(room0, 'wishlist_save');
      // [Batch 3 — Dim 04 R6] Wishlist save is a habit action.
      logHabitAction('wishlist_save');
      // [Batch 3 — Dim 03 R-Paywall1] Value-moment paywall: 3rd save crossed.
      if (state.wishlist.length === 3 && !isPro()) {
        setTimeout(() => maybeFireValueMomentPaywall('wishlist_3rd_save', { count: state.wishlist.length }), 1200);
      }
      // First save triggers the push pre-prompt
      setTimeout(() => maybeAskForPushPermission(), 800);
    }
    save();
    const room = state.rooms.find(r => r.id === currentRoomId);
    if (room) renderItemsList(room);
  }

  function togglePriceAlert(item) {
    // [Compute-quality routing] Setting a price alert is Free. Delivery
    // (push/email) is also Free for ALL users — moving alert delivery to
    // free per Hassan's decision: gating the highest-conversion notification
    // behind a paywall is revenue-self-sabotage for an affiliate business.
    // Pro adds advanced filters (thresholds, retailer prefs) on top — see
    // gateProFeature('advanced_price_filters') in the upcoming filters UI.
    state.priceAlerts[item.id] = !state.priceAlerts[item.id];
    if (!state.priceAlerts[item.id]) delete state.priceAlerts[item.id];
    save();
    trackEvent(state.priceAlerts[item.id] ? 'price_alert_on' : 'price_alert_off', { itemId: item.id });
    if (state.priceAlerts[item.id]) {
      toast("We'll notify you when the price drops");
    } else {
      toast('Alert off');
    }
  }

  function swapItem(room, item) {
    // [Model A] Item swap is FREE, unlimited. Swap re-runs the local
    // pickItemsForRoom() — no AI compute, no quota cost. Counter kept for
    // analytics only.
    room.swapCount = (room.swapCount || 0) + 1;
    const idx = room.items.findIndex(i => i.id === item.id);
    if (idx < 0) return;
    // Find next best match for the same slot, excluding items already in room.
    const excludeIds = room.items.map(i => i.id);
    const draftLike = { type: room.type, dims: room.dims, keep: [] };
    const candidates = window.FURNITURE_DB
      .filter(i => i.type === item.type && i.roomTypes.includes(room.type) && !excludeIds.includes(i.id));
    if (candidates.length === 0) { toast('No alternate picks for this slot'); return; }
    // [10-Q model] Score using derived sets from the user's answers.
    const _w = deriveScoringWeights(getEffectiveAnswers(profile));
    const styleSet = new Set(_w.styles), colorSet = new Set(_w.colors);
    candidates.sort((a,b) => {
      const score = x => {
        const sHit = x.styles.filter(s => styleSet.has(s)).length;
        const cHit = x.colors.filter(c => colorSet.has(c)).length;
        let v = (styleSet.size ? sHit/styleSet.size : 0.5)*0.6 + (colorSet.size ? cHit/colorSet.size : 0.5)*0.3 + Math.random()*0.1;
        if (activeAnchorColor && x.accent) v += colorDistance(activeAnchorColor, x.accent) < 60 ? 0.25 : 0;
        return v;
      };
      return score(b) - score(a);
    });
    const pick = candidates[0];
    room.items[idx] = pick;
    // snapshot a new version
    pushVersion(room, `Swapped ${item.name} → ${pick.name}`);
    save();
    renderRoomPieces(room);
    renderVersions(room);
    toast(`Swapped to ${pick.name}`);
  }

  function pushVersion(room, note) {
    // NOTE: `profile` here references the closure of openRoom (where pushVersion
    // was originally defined alongside it). When called from module-level
    // handlers, `profile` is undefined → optional chaining yields []. Style/color
    // metadata on those versions ends up empty. Acceptable for now because
    // versions only need items + note for the visible UI; styles/colors are
    // re-derived from the active profile when comparing.
    const styles = (typeof profile !== 'undefined' && profile?.styles) || [];
    const colors = (typeof profile !== 'undefined' && profile?.colors) || [];
    const v = {
      id: 'v'+Date.now()+Math.random().toString(36).slice(2,5),
      items: room.items.slice(),
      styles: styles.slice(),
      colors: colors.slice(),
      note,
      timestamp: Date.now()
    };
    room.versions = room.versions || [];
    room.versions.push(v);
    if (room.versions.length > 6) room.versions.shift();
    room.activeVersion = v.id;
    // [Batch 5 — Dim 06 Section D] Same-room 3rd-redesign value-moment.
    // Per Reforge Convert: revisit signal = "user is refining this room";
    // Pro's premium AI handles edges + lighting better. Fires once per
    // room-trigger pair via standard cooldown + dismiss-suppression.
    try {
      if (typeof isPro === 'function' && !isPro() && room.versions.length >= 3) {
        maybeFireValueMomentPaywall('same_room_3rd_redesign', { roomId: room.id, versionCount: room.versions.length });
      }
    } catch (_) { /* analytics never breaks redesign flow */ }
  }

  function renderVersions(room) {
    const card = $('#versionsCard');
    const list = $('#versionsList');
    const versions = room.versions || [];
    if (versions.length <= 1) { card.style.display = 'none'; return; }
    card.style.display = '';

    // Head: count + compare toggle
    const head = card.querySelector('.versions-head');
    $('#versionsCount').textContent = versions.length + ' saved';
    let toggleBtn = head.querySelector('.vc-toggle');
    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.className = 'vc-toggle';
      toggleBtn.textContent = 'Compare';
      head.appendChild(toggleBtn);
    }
    toggleBtn.onclick = () => {
      card.classList.toggle('compare-mode');
      toggleBtn.textContent = card.classList.contains('compare-mode') ? 'Back to list' : 'Compare';
      if (card.classList.contains('compare-mode')) renderVersionCompare(room);
    };

    // List mode
    list.innerHTML = '';
    versions.slice().reverse().forEach((v, i) => {
      const pill = document.createElement('button');
      pill.className = 'version-pill' + (v.id === room.activeVersion ? ' active' : '');
      const dt = new Date(v.timestamp);
      const hh = dt.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
      pill.innerHTML = `
        <div class="vp-top">v${versions.length - i} · $${v.items.reduce((s,x)=>s+x.price,0).toLocaleString()}</div>
        <div class="vp-sub">${v.note} · ${hh}</div>
      `;
      pill.addEventListener('click', () => {
        room.items = v.items.slice();
        room.activeVersion = v.id;
        save();
        renderRoomPieces(room);
        renderVersions(room);
        toast('Loaded version');
      });
      list.appendChild(pill);
    });

    // Ensure the compare grid exists inside the card
    let grid = card.querySelector('.vc-grid');
    if (!grid) {
      grid = document.createElement('div');
      grid.className = 'vc-grid';
      card.appendChild(grid);
    }
    // Render compare if already in that mode (re-render on updates)
    if (card.classList.contains('compare-mode')) renderVersionCompare(room);
  }

  function renderVersionCompare(room) {
    const grid = card.querySelector('.vc-grid');
    const versions = room.versions || [];
    if (versions.length < 2) return;

    // Default comparison: latest vs previous
    const defaultA = versions[versions.length - 1]?.id;
    const defaultB = versions[versions.length - 2]?.id;

    const paneHTML = (side, selectedId) => {
      const options = versions.slice().reverse().map((v, i) => {
        const label = `v${versions.length - i} · $${v.items.reduce((s,x)=>s+x.price,0).toLocaleString()}`;
        return `<option value="${v.id}" ${v.id === selectedId ? 'selected' : ''}>${label}</option>`;
      }).join('');
      return `
        <div class="vc-pane ${room.activeVersion === selectedId ? 'active' : ''}" data-side="${side}">
          <select data-side="${side}">${options}</select>
          <div class="vc-content" data-content="${side}"></div>
        </div>
      `;
    };
    grid.innerHTML = paneHTML('A', defaultA) + paneHTML('B', defaultB);

    const paintPane = (side, versionId) => {
      const v = versions.find(x => x.id === versionId);
      if (!v) return;
      const el = grid.querySelector(`[data-content="${side}"]`);
      const total = v.items.reduce((s,x) => s + x.price, 0);
      const dt = new Date(v.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
      const styles = (v.styles || []).map(styleLabel).slice(0, 2).join(' · ') || '—';
      const icons = v.items.slice(0, 8).map(i => `<span class="vc-icon">${i.icon}</span>`).join('');
      el.innerHTML = `
        <div class="vc-stat"><span class="vc-label">Total</span><span class="vc-val">$${total.toLocaleString()}</span></div>
        <div class="vc-stat"><span class="vc-label">Pieces</span><span class="vc-val">${v.items.length}</span></div>
        <div class="vc-stat"><span class="vc-label">Styles</span><span class="vc-val" style="font-size:11px;">${styles}</span></div>
        <div class="vc-stat"><span class="vc-label">Saved</span><span class="vc-val" style="font-size:11px;">${dt}</span></div>
        <div class="vc-icons">${icons}</div>
        <button class="vc-use" data-use="${v.id}" ${v.id === room.activeVersion ? 'disabled' : ''}>${v.id === room.activeVersion ? 'Current' : 'Use this version'}</button>
      `;
      el.parentElement.classList.toggle('active', v.id === room.activeVersion);
    };

    paintPane('A', defaultA);
    paintPane('B', defaultB);

    grid.addEventListener('change', e => {
      const sel = e.target.closest('select[data-side]');
      if (!sel) return;
      paintPane(sel.dataset.side, sel.value);
    });

    grid.addEventListener('click', e => {
      const btn = e.target.closest('[data-use]');
      if (!btn) return;
      const v = versions.find(x => x.id === btn.dataset.use);
      if (!v) return;
      room.items = v.items.slice();
      room.activeVersion = v.id;
      save();
      renderRoomPieces(room);
      renderVersionCompare(room);
      toast(`Loaded ${btn.textContent}`);
    });
  }

  function refreshBookmarkBtn(room) {
    const on = state.bookmarkedRooms.includes(room.id);
    const btn = $('#bookmarkRoomBtn');
    btn.innerHTML = on ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"/></svg>' : '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"/></svg>';
    btn.classList.toggle('active', on);
  }

  $('#bookmarkRoomBtn').addEventListener('click', () => {
    const room = state.rooms.find(r => r.id === currentRoomId);
    if (!room) return;
    // [Model A] Bookmarking a room is FREE for everyone. Cross-device sync
    // still benefits from signin (handled by Supabase pull/push), but it's
    // not required to use the feature locally.
    const idx = state.bookmarkedRooms.indexOf(room.id);
    if (idx >= 0) { state.bookmarkedRooms.splice(idx, 1); toast('Removed from saved'); }
    else { state.bookmarkedRooms.push(room.id); toast('Room saved'); setTimeout(() => maybeAskForPushPermission(), 800); }
    trackEvent(ACTIVATION.AHA_QUALITY, { signal: 'bookmarked_room', roomId: room.id });
    save();
    refreshBookmarkBtn(room);
  });

  // Post-aha "keep my pieces" switch on results. Flipping it re-picks items.
  const keepSwitch = $('#keepExistingSwitch');
  if (keepSwitch) {
    keepSwitch.addEventListener('click', () => {
      const room = state.rooms.find(r => r.id === currentRoomId);
      if (!room) return;
      const profile = state.profiles.find(p => p.id === room.profileId);
      if (!profile) return;
      // [BUDGET_RESET_PASS] Reuse the budget that produced this room
      // (room.budget). Reshuffle/keep happens on the reveal screen, not
      // the photo upload screen, so we don't re-prompt the user.
      room.keepMode = !room.keepMode;
      keepSwitch.setAttribute('aria-checked', room.keepMode ? 'true' : 'false');
      keepSwitch.classList.toggle('on', room.keepMode);
      const fresh = pickItemsForRoom(
        { type: room.type, dims: room.dims, photo: room.photo },
        getEffectiveAnswers(profile),
        room.budget || SLIDER_BUDGET_DEFAULT,
        { keepMode: room.keepMode }
      );
      room.items = fresh;
      pushVersion(room, room.keepMode ? 'Kept existing pieces' : 'Fresh start');
      save();
      renderRoomPieces(room);
      renderVersions(room);
      toast(room.keepMode ? 'Designing around your pieces' : 'Fresh start');
    });
  }

  // Aha-quality feedback: [Model A] FREE for everyone. Voting is a free
  // engagement signal that helps tune later redesigns. Removed the
  // guest→signin and signedin→paywall gates that existed under the
  // subscription model.
  document.querySelectorAll('#ahaFeedback .af-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const vote = btn.dataset.vote;
      const room = state.rooms.find(r => r.id === currentRoomId);
      if (!room) return;
      room.qualityVote = vote;
      save();
      trackEvent(ACTIVATION.AHA_QUALITY, { signal: 'explicit_vote', vote, roomId: room.id });
      document.querySelectorAll('#ahaFeedback .af-btn').forEach(b => b.classList.toggle('selected', b === btn));
      if (vote === 'love')  {
        toast("Love it — saving this profile's style");
        // [Batch 3 — A7] Love-tap is an Aha experience signal.
        fireAhaMomentIfFresh(room, 'love');
        // [Batch 3 — Dim 04 R8] Promise-Fit micro-survey only on Love
        // (gating preserves the high-intent path). Fires once per user.
        setTimeout(() => showPromiseFitMicrosurvey(room.id), 600);
        // [Batch 4 — Dim 07] Record Love verdict; recomputes styleScores.
        recordAhaVerdict(room.id, 'love');
      }
      if (vote === 'close') {
        toast('Try reshuffle below for a different mix');
        // [Batch 3 — A7] Close also implies the user EXPERIENCED the reveal —
        // not a thumbs-up but engagement-not-bounce. Counts as Aha.
        fireAhaMomentIfFresh(room, 'close');
        // [Batch 4 — Dim 07] Record Close verdict.
        recordAhaVerdict(room.id, 'close');
      }
      if (vote === 'off')   {
        // [Dim 14 Section B Fix 1 — Off-vote actually changes behavior.
        //  Per Reforge User Insights: "feedback that doesn't change
        //  behavior is fake feedback." Soft-avoid the current style for
        //  this profile's next 24h of generations. Time-limited so users
        //  can't accidentally permanently block their own preferences.
        //  Picker reads state.user._styleAvoid in pickItemsForRoom (see
        //  furniture.js) and applies a -0.5 score weight to avoided
        //  styles. 24h window per Reforge Engagement Strategies → Habit
        //  Reinforcement (At-Risk p.5-8): the user must see behavior
        //  visibly respond, but not be permanently penalized.]
        if (!state.user) state.user = {};
        state.user._styleAvoid = state.user._styleAvoid || {};
        const profile = state.profiles.find(p => p.id === room.profileId);
        const avoidExpiry = Date.now() + 24 * 60 * 60 * 1000;
        (profile?.styles || []).forEach(s => {
          state.user._styleAvoid[s] = avoidExpiry;
        });
        save();
        trackEvent('aha_off_style_avoided', { roomId: room.id, styles: profile?.styles || [], expiryMs: avoidExpiry });
        // [Batch 4 — Dim 07] Record Off verdict — feeds styleScores recompute.
        recordAhaVerdict(room.id, 'off');
        // [Dim 09 D10 voice — calmer, more honest copy.]
        toast('Got it — pulling a different direction…');
        setTimeout(() => $('#reshuffleBtn')?.click(), 500);
      }
    });
  });

  // [Model A] Reshuffle = FREE, unlimited. No quota, no Pro gate. Reshuffle
  // re-runs the local pickItemsForRoom() — no AI compute call, so it's not a
  // "generation" under Model A. Tracking the count is kept for analytics only.
  $('#reshuffleBtn').addEventListener('click', () => {
    const room = state.rooms.find(r => r.id === currentRoomId);
    if (!room) return;
    const profile = state.profiles.find(p => p.id === room.profileId);
    if (!profile) return;
    // [BUDGET_RESET_PASS] Reuse room.budget — same generation context.
    room.reshuffleCount = (room.reshuffleCount || 0) + 1;
    const draftLike = { type: room.type, dims: room.dims };
    const fresh = pickItemsForRoom(draftLike, getEffectiveAnswers(profile), room.budget || SLIDER_BUDGET_DEFAULT,
      { excludeIds: [], anchorColor: activeAnchorColor, keepMode: !!room.keepMode });
    room.items = fresh;
    pushVersion(room, activeAnchorColor ? 'Reshuffled (color anchored)' : 'Reshuffled picks');
    save();
    renderRoomPieces(room);
    renderVersions(room);
    // [Dim 14 Section C Fix 2 — reshuffle copy honesty.]
    toast('Different items, same style.');
  });

  // [Model A] "Shop the Whole Room" — restores the original affiliate semantics.
  // Free for everyone — opens an affiliate URL per item. This is the primary
  // monetization path; gating it here would directly suppress revenue.
  $('#shopAllBtn').addEventListener('click', () => {
    const room = state.rooms.find(r => r.id === currentRoomId);
    if (!room) return;
    const purchaseable = room.items.filter(i => !i.owned);
    trackEvent('affiliate_shop_all_clicked', {
      roomId: room.id,
      itemCount: purchaseable.length,
      totalPrice: purchaseable.reduce((s, i) => s + (i.price || 0), 0)
    });
    // [Batch 3 — A7] Shop-all is an Aha experience signal.
    fireAhaMomentIfFresh(room, 'shop_all');
    purchaseable.forEach((i, idx) => {
      setTimeout(() => {
        trackAffiliateClick(i, 'shop_all');
        window.open(buildAffiliateUrl(i), '_blank', 'noopener');
      }, idx * 120);
    });
    toast(`Opening ${purchaseable.length} affiliate tabs…`);
  });

  // ---------- Before/after slider drag ----------
  // [FOUR_FIX_PASS — Fix 1] Slider responds to drag on the HANDLE only.
  // Previously the entire .ba-slider container intercepted taps, which
  // hijacked clicks on price tags layered above. Reforge User Psychology:
  // gesture clarity — single-purpose interaction surfaces. The slider is a
  // slider; the photo + price tags are their own surfaces.
  let _sliderPctState = 50;
  function setSliderPct(pct) {
    pct = Math.max(0, Math.min(100, pct));
    _sliderPctState = pct;
    $('#baAfterLayer').style.clipPath = `inset(0 0 0 ${pct}%)`;
    const handle = $('#baHandle');
    handle.style.left = pct + '%';
    // Keep aria-valuenow synced on the focusable knob for screen readers.
    const knob = handle.querySelector('.ba-handle-knob');
    if (knob) knob.setAttribute('aria-valuenow', String(Math.round(pct)));
  }

  (() => {
    const slider = $('#baSlider');
    const handle = $('#baHandle');
    const knob = handle && handle.querySelector('.ba-handle-knob');
    if (!slider || !handle || !knob) return;

    // [FOUR_FIX_PASS — Fix 1] ARIA + keyboard a11y on the knob (the visible,
    // pointer-events:auto element). The .ba-handle spine has pointer-events:
    // none; events on the knob bubble up to .ba-handle for drag-start.
    knob.setAttribute('role', 'slider');
    knob.setAttribute('tabindex', '0');
    knob.setAttribute('aria-label', 'Reveal slider — drag to compare before and after');
    knob.setAttribute('aria-valuemin', '0');
    knob.setAttribute('aria-valuemax', '100');
    knob.setAttribute('aria-valuenow', '50');
    knob.setAttribute('aria-orientation', 'horizontal');

    let dragging = false;
    const onMove = e => {
      if (!dragging) return;
      const rect = slider.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      setSliderPct((x / rect.width) * 100);
    };
    const start = e => {
      // Disable before/after drag while the user is rearranging furniture.
      if (slider.classList.contains('rearranging')) return;
      dragging = true;
      // [Fix 1] DO NOT call onMove(e) on start — drag begins from the
      // handle's current position, not the click X. This is what stops
      // taps elsewhere from hijacking the slider position.
      e.preventDefault();
    };
    // [Fix 1] Bind drag-start to the HANDLE only, not the slider container.
    // Events on the knob (child) bubble up to the handle parent.
    handle.addEventListener('mousedown', start);
    handle.addEventListener('touchstart', start, { passive: false });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', () => dragging = false);
    document.addEventListener('touchend', () => dragging = false);

    // [Fix 1] Keyboard accessibility per spec:
    // Left/Right arrows move 5% (10% with Shift), Home → 0%, End → 100%.
    knob.addEventListener('keydown', e => {
      const step = e.shiftKey ? 10 : 5;
      let next = _sliderPctState;
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowDown': next = Math.max(0, _sliderPctState - step); break;
        case 'ArrowRight':
        case 'ArrowUp':   next = Math.min(100, _sliderPctState + step); break;
        case 'Home':      next = 0; break;
        case 'End':       next = 100; break;
        default: return;
      }
      e.preventDefault();
      setSliderPct(next);
    });
  })();

  // ---------- Lighting ----------
  function applyLighting(mode) {
    const layer = $('#baAfterLayer');
    layer.classList.remove('light-morning','light-afternoon','light-evening','light-lamp');
    layer.classList.add('light-'+mode);
  }
  $$('#lightingChips .chip-sm').forEach(c => {
    c.addEventListener('click', () => {
      $$('#lightingChips .chip-sm').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      applyLighting(c.dataset.light);
    });
  });

  // ---------- Wishlist ----------
  function renderWishlist() {
    const list = $('#wishlistList');
    list.innerHTML = '';
    const ids = state.wishlist;
    if (!ids.length) {
      // [Dim 09 Section B.3 — empty states forgive + offer next action,
      //  never blame. Was "No saved items yet." → names the value prop
      //  the empty surface enables. Mirror of the HTML fallback at
      //  index.html (wishlist screen).]
      list.innerHTML = `<div class="empty-state"><div class="empty-art"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6C19 16.5 12 21 12 21z"/></svg></div><p>Save items to track price drops.</p></div>`;
      return;
    }
    ids.forEach(id => {
      const item = window.FURNITURE_DB.find(i => i.id === id);
      if (!item) return;
      const alertOn = state.priceAlerts[item.id];
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div class="item-thumb">${item.icon}</div>
        <div class="item-body">
          <div class="name">${item.name}</div>
          <div class="desc">${item.description}</div>
          <div class="meta">
            <span class="tag source">${sourceLabel(item.source)}</span>
            <span class="tag">${item.type}</span>
            <span class="price">$${item.price.toLocaleString()}</span>
          </div>
        </div>
        <div class="item-actions">
          <a class="item-action-btn link-style" href="${item.url}" target="_blank" rel="noopener noreferrer">Shop</a>
          <button class="item-action-btn" data-act="rm">Remove</button>
          <button class="item-action-btn ${alertOn ? 'active' : ''}" data-act="alert">${alertOn ? `<svg viewBox='0 0 24 24' width='14' height='14' fill='currentColor' style='vertical-align:-2px;margin-right:4px'><path d='M12 2a2 2 0 012 2v1.2A6 6 0 0118 11v3l1.5 2H4.5L6 14v-3a6 6 0 014-5.8V4a2 2 0 012-2zM10 19h4a2 2 0 01-4 0z'/></svg>On` : `<svg viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-2px;margin-right:4px'><path d='M18 14v-3a6 6 0 00-12 0v3l-1.5 2h15z'/><path d='M10 19a2 2 0 004 0'/><path d='M3 3l18 18' stroke-width='2'/></svg>Alert`}</button>
        </div>
      `;
      card.querySelector('[data-act="rm"]').addEventListener('click', () => { toggleWishlist(item); renderWishlist(); });
      card.querySelector('[data-act="alert"]').addEventListener('click', () => { togglePriceAlert(item); renderWishlist(); });
      list.appendChild(card);
    });
  }

  // ---------- Share modal ----------
  // [Model A] Sharing is FREE — viral loops drive affiliate referrals (D
  // dimension of ICED). HD-export-without-watermark stays Pro per D5;
  // downloading the watermarked version is free (handled inside the modal).
  $('#shareRoomBtn').addEventListener('click', () => {
    trackEvent(ACTIVATION.AHA_QUALITY, { signal: 'share_clicked', roomId: currentRoomId });
    trackShareFunnel('modal_opened', { source: 'header_icon' });
    // [Batch 5 — Dim 06 Section D] Reforge gold-standard upsell trigger:
    // user is *trying* to do the thing Pro enables (HD/no-watermark export).
    // Fires before the modal so the paywall lands at peak intent. Only the
    // first share-attempt per cooldown wakes the upsell; subsequent share
    // attempts proceed to the share modal as usual.
    if (!isPro()) maybeFireValueMomentPaywall('share_attempt', { source: 'header_icon' });
    openShareModal();
  });
  // [Batch 4 — Dim 08 Top 3 #1] Reveal-moment share trigger.
  // Per Reforge Social Viral Loops Lesson 4: share at peak emotion. Click
  // routes through the same openShareModal but logs a distinct funnel
  // source so we can compare reveal-moment vs header-icon share rates.
  document.getElementById('revealShareBtn')?.addEventListener('click', () => {
    trackEvent(ACTIVATION.AHA_QUALITY, { signal: 'share_clicked', roomId: currentRoomId });
    trackShareFunnel('modal_opened', { source: 'reveal_cta' });
    // Lifecycle-aware default format + pre-filled caption
    const room = state.rooms.find(r => r.id === currentRoomId);
    if (room) {
      state._shareDefaultFormat = defaultShareFormatForLifecycle();
      state._sharePrefilledCaption = shareCaptionForLifecycle(room);
    }
    // [Batch 5 — Dim 06 Section D] share_attempt value-moment trigger.
    if (!isPro()) maybeFireValueMomentPaywall('share_attempt', { source: 'reveal_cta' });
    openShareModal();
  });
  $('#shareClose').addEventListener('click', () => $('#shareModal').classList.remove('open'));
  $('#shareModal').addEventListener('click', e => { if (e.target.id === 'shareModal') $('#shareModal').classList.remove('open'); });

  function openShareModal() {
    const room = state.rooms.find(r => r.id === currentRoomId);
    if (!room) return;
    drawShareCard(room);
    $('#shareModal').classList.add('open');
    $('#shareModal').setAttribute('aria-hidden', 'false');
    // [Batch 4 — Dim 08] Mount lifecycle-aware format chips + caption.
    mountShareFormatChips(room);
  }

  // [Batch 4 — Dim 08] Format chip dispatcher.
  // Per Reforge UGC Loop Variations Lesson 5: branching factor × influence
  // per exposure varies by format. Pin = high branching + cumulative;
  // group-chat = high influence × low branching. Match format to lifecycle
  // state. Real per-format canvas re-rendering defers (~M effort to do
  // properly with all aspect ratios); v1 ships the chip selector + format
  // metadata so the user makes a per-channel-aware choice and the funnel
  // event fires with the chosen format.
  function mountShareFormatChips(room) {
    const card = document.querySelector('#shareModal .modal-card');
    if (!card) return;
    let chipsRow = document.getElementById('shareFormatChips');
    if (!chipsRow) {
      chipsRow = document.createElement('div');
      chipsRow.id = 'shareFormatChips';
      chipsRow.className = 'share-format-chips';
      const insertAfter = card.querySelector('h3');
      (insertAfter || card.firstChild).after(chipsRow);
    }
    const formats = window.FurnishShareFormats || {};
    const defaultKey = state._shareDefaultFormat || 'square';
    chipsRow.innerHTML = Object.entries(formats).map(([k, f]) =>
      `<button type="button" class="share-format-chip${k === defaultKey ? ' active' : ''}" data-fmt="${k}">
         <span class="sfc-label">${f.label}</span>
         <span class="sfc-desc muted small">${f.desc}</span>
       </button>`
    ).join('');
    chipsRow.querySelectorAll('.share-format-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chipsRow.querySelectorAll('.share-format-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state._shareDefaultFormat = chip.dataset.fmt;
        save();
        trackShareFunnel('format_selected', { format: chip.dataset.fmt, roomId: room.id });
      });
    });
    trackShareFunnel('format_chips_shown', { default: defaultKey, roomId: room.id });
  }

  function drawShareCard(room) {
    const canvas = $('#shareCanvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // Background
    ctx.fillStyle = '#FAF3E7';
    ctx.fillRect(0, 0, W, H);

    // Draw room image with rounded corners
    const drawImg = () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => drawRest(img);
      img.onerror = () => drawRest(null);
      img.src = room.photo;
    };
    const drawRest = (img) => {
      const imgH = 560;
      if (img) {
        ctx.save();
        roundRect(ctx, 40, 40, W - 80, imgH, 22);
        ctx.clip();
        const ratio = img.width / img.height;
        let dw = W - 80, dh = dw / ratio;
        if (dh < imgH) { dh = imgH; dw = dh * ratio; }
        ctx.drawImage(img, 40 + ((W - 80) - dw)/2, 40 + (imgH - dh)/2, dw, dh);
        ctx.restore();
      } else {
        ctx.fillStyle = '#E5D4B8';
        roundRect(ctx, 40, 40, W - 80, imgH, 22);
        ctx.fill();
      }

      // Gradient overlay
      const grad = ctx.createLinearGradient(0, 300, 0, 600);
      grad.addColorStop(0, 'rgba(62,39,35,0)');
      grad.addColorStop(1, 'rgba(62,39,35,0.6)');
      ctx.fillStyle = grad;
      roundRect(ctx, 40, 40, W - 80, imgH, 22);
      ctx.fill();

      // Title text on image
      ctx.fillStyle = '#FAF3E7';
      ctx.font = 'bold 34px Inter, sans-serif';
      ctx.fillText(titleRoom(room.type), 60, 560);
      ctx.font = '20px Inter, sans-serif';
      ctx.fillStyle = 'rgba(250,243,231,0.88)';
      const profile = state.profiles.find(p => p.id === room.profileId);
      const styles = (profile?.styles || []).map(styleLabel).slice(0,3).join(' · ');
      ctx.fillText(styles, 60, 588);

      // Footer card
      ctx.fillStyle = 'white';
      roundRect(ctx, 40, 640, W - 80, 220, 22);
      ctx.fill();

      // Logo mark
      ctx.fillStyle = '#8B6F47';
      roundRect(ctx, 60, 660, 58, 58, 14);
      ctx.fill();
      ctx.fillStyle = '#FAF3E7';
      ctx.font = 'bold 34px Inter, sans-serif';
      ctx.fillText('F', 76, 702);

      ctx.fillStyle = '#3E2723';
      ctx.font = 'bold 26px Inter, sans-serif';
      ctx.fillText('Designed with Furnish', 140, 690);
      ctx.fillStyle = '#8A7760';
      ctx.font = '18px Inter, sans-serif';
      ctx.fillText(`${room.items.length} pieces · $${room.items.reduce((s,i)=>s+i.price,0).toLocaleString()} total`, 140, 716);

      // Pieces icons
      const icons = room.items.slice(0, 8).map(i => i.icon);
      ctx.font = '34px Arial, sans-serif';
      icons.forEach((ic, i) => ctx.fillText(ic, 60 + i * 56, 790));

      ctx.fillStyle = '#8A7760';
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText('furnish.app', 60, 840);
    };

    if (room.photo) drawImg(); else drawRest(null);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  $('#shareDownloadBtn').addEventListener('click', () => {
    // Reforge Monetization: free = watermarked export; Pro = clean HD.
    // Watermark is applied by stamping a subtle "Made with Furnish" tag
    // before downloading if not Pro.
    const out = document.createElement('canvas');
    out.width = canvas.width;
    out.height = canvas.height;
    const ctx = out.getContext('2d');
    ctx.drawImage(canvas, 0, 0);
    if (!isPro()) {
      // Corner watermark + soft diagonal band
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(out.width - 240, out.height - 54, 228, 42);
      ctx.fillStyle = '#3E2723';
      ctx.font = '600 16px system-ui, -apple-system, sans-serif';
      ctx.fillText('Made with Furnish (Free)', out.width - 228, out.height - 28);
      ctx.font = '500 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#8A7760';
      ctx.fillText('Upgrade to Pro for HD · no logo', out.width - 228, out.height - 14);
      ctx.restore();
    }
    const a = document.createElement('a');
    a.download = isPro() ? 'furnish-room-hd.png' : 'furnish-room.png';
    a.href = out.toDataURL('image/png');
    a.click();
    trackEvent('share_download', { pro: isPro(), roomId: currentRoomId });
    // [Batch 6 — Dim 13 REC-13.10] Consolidated share_completed event.
    // Per Reforge *Building A Structured Event Dictionary*: action
    // properties (channel) instead of separate event names. 30-day
    // dual-fire window before the 5 channel-specific events deprecate.
    trackEvent('share_completed', { channel: 'download', pro: isPro(), roomId: currentRoomId });
    if (!isPro()) {
      toast('Downloaded (free quality) — upgrade for HD');
      setTimeout(() => openPaywall('hd_export'), 1400);
    } else {
      toast('HD image downloaded');
    }
  });

  $('#shareCopyBtn').addEventListener('click', async () => {
    const styles = (profile?.styles || []).map(styleLabel).join(' · ');
    const invite = buildInviteLink();
    // [VOICE.md no-emoji — removed sparkle emoji from caption.
    //  User-facing copy (even copy meant for off-platform sharing) honors
    //  the no-emoji rule. The hashtag + concrete numbers carry visual
    //  appeal on social platforms.]
    const caption = `Just redesigned my ${titleRoom(room.type).toLowerCase()} in ${styles} with Furnish.\n${room.items.length} pieces · $${room.items.reduce((s,i)=>s+i.price,0).toLocaleString()} total.\n\nTry it yourself: ${invite}\n#FurnishApp #InteriorDesign`;
    try {
      await navigator.clipboard.writeText(caption);
      toast('Caption + invite link copied');
      trackEvent('share_caption_copied', { roomId: currentRoomId });
      // [Batch 6 — Dim 13 REC-13.10] Consolidated share_completed event.
      trackEvent('share_completed', { channel: 'caption', roomId: currentRoomId });
    } catch {
      toast('Copy failed');
    }
  });

  // Referral link — stub now, wire real attribution backend later.
  // ?ref=<userId>&room=<roomId> lets you credit inviter on signup.
  function buildInviteLink() {
    const uid = state.user?.id || state.user?.email || 'guest';
    const code = btoa(uid).replace(/=+$/,'').slice(0, 10);
    return `https://furnish.app/?ref=${code}&room=${encodeURIComponent(currentRoomId || '')}`;
  }

  $('#shareLinkBtn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(buildInviteLink());
      // [Batch 4 — Conflict 2 propagation fix] Was "1 month of Furnish Pro
      //  free" — Batch 1 locked the currency to "5 HD redesigns + 2 style
      //  packs over 90 days" but this toast was missed. Per Reforge
      //  Financial Viral Loops Lesson 3: currency-alignment + 90-day window
      //  matches Furnish's natural-frequency window.
      toast('Invite link copied — you both unlock 5 HD redesigns + 2 style packs (90 days).');
      trackEvent('share_invite_link_copied', { roomId: currentRoomId });
      // [Batch 6 — Dim 13 REC-13.10] Consolidated share_completed event.
      trackEvent('share_completed', { channel: 'invite_link', roomId: currentRoomId });
    } catch {
      toast('Copy failed');
    }
  });

  $('#sharePinBtn')?.addEventListener('click', () => {
    // Pinterest Pin-It endpoint — media must be a public URL in production.
    // For now, fall back to downloading + opening Pinterest (MVP path).
    const a = document.createElement('a');
    a.download = 'furnish-room.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    setTimeout(() => {
      window.open('https://www.pinterest.com/pin-builder/', '_blank', 'noopener');
    }, 400);
    trackEvent('share_pinterest_clicked', { roomId: currentRoomId });
    // [Batch 6 — Dim 13 REC-13.10] Consolidated share_completed event.
    trackEvent('share_completed', { channel: 'pinterest', roomId: currentRoomId });
  });

  // Native share-sheet (mobile) — falls through to download on desktop.
  $('#shareSystemBtn')?.addEventListener('click', async () => {
    if (navigator.share) {
      canvas.toBlob(async blob => {
        const file = new File([blob], 'furnish-room.png', { type: 'image/png' });
        try {
          await navigator.share({
            title: 'My Furnish redesign',
            text: 'Redesigned my room with Furnish. Try it: ' + buildInviteLink(),
            files: [file]
          });
          trackEvent('share_system_success', { roomId: currentRoomId });
          // [Batch 6 — Dim 13 REC-13.10] Consolidated share_completed.
          trackEvent('share_completed', { channel: 'system', roomId: currentRoomId });
        } catch (e) {
          // [Batch 6 — Dim 13 REC-13.3] share_system_failed failure event.
          trackEvent('share_system_failed', {
            roomId: currentRoomId,
            reason: String((e && e.name) || 'cancelled').slice(0, 60)
          });
        }
      });
    } else {
      $('#shareDownloadBtn').click();
    }
  });

  // ---------- Item detail bottom sheet ----------
  let _activeSheetItem = null;
  let _activeSheetRoom = null;

  function openItemSheet(item, room) {
    if (!item) return;
    // [Model A] Item taps are FREE — shopping is the primary monetization
    // (affiliate revenue). All users open the item sheet and can click through.
    _activeSheetItem = item;
    _activeSheetRoom = room || null;

    if (room && !state._ahaQualitySignalFired) {
      state._ahaQualitySignalFired = true;
      save();
      trackEvent(ACTIVATION.AHA_QUALITY, { signal: 'item_tapped', itemId: item.id });
    }
    // [Batch 3 — A7] Item tap is an Aha experience signal.
    if (room) fireAhaMomentIfFresh(room, 'item_tap');

    const sheet = document.getElementById('itemSheet');
    document.getElementById('bsImage').textContent = item.icon || '🛋️';
    document.getElementById('bsSource').textContent = sourceLabel(item.source);
    document.getElementById('bsType').textContent = item.type;
    document.getElementById('bsName').textContent = item.name;
    document.getElementById('bsDesc').textContent = item.description || '';
    document.getElementById('bsPrice').textContent = item.price ? '$' + item.price.toLocaleString() : '—';

    // Fit warning vs room dimensions.
    // [VOICE.md no-emoji + Dim 09 D9 — emoji-prefixed warning replaced
    //  with custom SVG warning icon and de-hedged copy. Mirror of the
    //  item-card warning fix.]
    const fitEl = document.getElementById('bsFit');
    fitEl.innerHTML = '';
    if (room && room.dims && window.ITEM_FOOTPRINTS) {
      const roomArea = (room.dims.w || 0) * (room.dims.l || 0);
      const fp = window.ITEM_FOOTPRINTS[item.type] || 0;
      if (fp > 0 && roomArea > 0 && fp > roomArea * 0.25) {
        fitEl.innerHTML = `${FIT_WARN_SVG}Tight fit for this room. Verify dimensions.`;
      }
    }

    // Specs grid (mocked from item metadata)
    const specsEl = document.getElementById('bsSpecs');
    specsEl.innerHTML = '';
    const specs = computeItemSpecs(item);
    Object.entries(specs).forEach(([label, val]) => {
      const div = document.createElement('div');
      div.className = 'bs-spec';
      div.innerHTML = `<span class="bs-spec-label">${label}</span><span class="bs-spec-value">${val}</span>`;
      specsEl.appendChild(div);
    });

    // Alternatives in your style
    renderSheetAlternatives(item, room);

    // Save (wishlist)
    const saveBtn = document.getElementById('bsSaveBtn');
    saveBtn.classList.toggle('active', state.wishlist.includes(item.id));
    saveBtn.onclick = () => {
      toggleWishlist(item);
      saveBtn.classList.toggle('active', state.wishlist.includes(item.id));
    };

    // Swap (uses existing swap engine, then re-opens with the replacement)
    const swapBtn = document.getElementById('bsSwapBtn');
    swapBtn.disabled = !room;
    swapBtn.style.opacity = room ? '' : '0.4';
    swapBtn.onclick = () => {
      if (!room) return;
      const beforeIds = new Set(room.items.map(i => i.id));
      swapItem(room, item);
      const replaced = room.items.find(i => !beforeIds.has(i.id) && i.type === item.type);
      if (replaced) openItemSheet(replaced, room);
      else closeItemSheet();
    };

    // [Model A] Shop button → affiliate URL with tracking. Click is logged
    // for attribution reconciliation (DEFERRED.md: backend will stitch
    // affiliate-network conversions back to fclick id).
    const shopBtn = document.getElementById('bsShopBtn');
    shopBtn.href = buildAffiliateUrl(item);
    shopBtn.onclick = () => trackAffiliateClick(item, 'item_sheet');

    sheet.classList.add('open');
    sheet.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeItemSheet() {
    const sheet = document.getElementById('itemSheet');
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    _activeSheetItem = null;
    _activeSheetRoom = null;
  }

  function computeItemSpecs(item) {
    const out = {};
    const fp = window.ITEM_FOOTPRINTS?.[item.type];
    if (fp) out['Footprint'] = `~${fp} sq ft`;
    out['Material'] = guessMaterial(item);
    out['Assembly'] = item.source === 'ikea' ? 'Required' : 'Pre-assembled';
    out['Ships in'] = guessShipping(item);
    return out;
  }
  function guessMaterial(item) {
    const d = (item.description || '').toLowerCase() + ' ' + (item.name || '').toLowerCase();
    if (/oak/.test(d))      return 'Solid oak';
    if (/walnut/.test(d))   return 'Walnut veneer';
    if (/linen/.test(d))    return 'Linen blend';
    if (/leather/.test(d))  return 'Genuine leather';
    if (/rattan|wicker/.test(d)) return 'Hand-woven rattan';
    if (/marble|stone/.test(d))  return 'Stone composite';
    if (/brass/.test(d))    return 'Aged brass';
    if (/teak/.test(d))     return 'Solid teak';
    if (/cotton|wool/.test(d)) return 'Natural fiber';
    return 'Mixed materials';
  }
  function guessShipping(item) {
    if (!item.price) return '—';
    if (item.price >= 800) return '7–14 days';
    if (item.price >= 200) return '3–7 days';
    return '2–4 days';
  }

  let _activeSheetTier = 'all';

  function tierOf(item, originalPrice) {
    // Tier relative to the item being viewed (or absolute if no reference).
    const p = item.price || 0;
    const ref = originalPrice || 0;
    if (ref > 0) {
      if (p <= ref * 0.6)  return 'budget';
      if (p >= ref * 1.4)  return 'premium';
      return 'standard';
    }
    if (p <= 200) return 'budget';
    if (p >= 800) return 'premium';
    return 'standard';
  }

  function renderSheetAlternatives(item, room) {
    const altsEl = document.getElementById('bsAlts');
    altsEl.innerHTML = '';

    // Tier filter row (above the list)
    let tierRow = document.getElementById('bsTierRow');
    if (!tierRow) {
      tierRow = document.createElement('div');
      tierRow.id = 'bsTierRow';
      tierRow.className = 'bs-tier-row';
      tierRow.innerHTML = `
        <button class="bs-tier active" data-tier="all">All</button>
        <button class="bs-tier" data-tier="budget">$ Budget</button>
        <button class="bs-tier" data-tier="standard">$$ Standard</button>
        <button class="bs-tier" data-tier="premium">$$$ Premium</button>
      `;
      altsEl.parentElement.insertBefore(tierRow, altsEl);
      tierRow.addEventListener('click', e => {
        const btn = e.target.closest('.bs-tier');
        if (!btn) return;
        _activeSheetTier = btn.dataset.tier;
        tierRow.querySelectorAll('.bs-tier').forEach(b => b.classList.toggle('active', b === btn));
        if (_activeSheetItem) renderSheetAlternatives(_activeSheetItem, _activeSheetRoom);
      });
    }
    // Reflect the current tier
    tierRow.querySelectorAll('.bs-tier').forEach(b => b.classList.toggle('active', b.dataset.tier === _activeSheetTier));

    if (!room) {
      altsEl.innerHTML = '<p class="muted small" style="padding: 4px 22px;">Open this from a designed room to see alternatives.</p>';
      return;
    }

    const styleSet = new Set(profile?.styles || []);
    const colorSet = new Set(profile?.colors || []);
    const usedIds = new Set(room.items.map(i => i.id));

    let alternatives = window.FURNITURE_DB
      .filter(i => i.type === item.type && i.id !== item.id && i.roomTypes.includes(room.type) && !usedIds.has(i.id))
      .map(alt => {
        const sHit = alt.styles.filter(s => styleSet.has(s)).length;
        const cHit = alt.colors.filter(c => colorSet.has(c)).length;
        return { alt, score: sHit + cHit, tier: tierOf(alt, item.price) };
      });

    if (_activeSheetTier !== 'all') {
      alternatives = alternatives.filter(x => x.tier === _activeSheetTier);
    }

    alternatives.sort((a, b) => b.score - a.score);
    alternatives = alternatives.slice(0, 8);

    if (alternatives.length === 0) {
      altsEl.innerHTML = '<p class="muted small" style="padding: 4px 22px;">No matches in this tier. Try another.</p>';
      return;
    }

    alternatives.forEach(({ alt, tier }) => {
      const card = document.createElement('button');
      card.className = 'bs-alt';
      const tierDots = tier === 'budget' ? '$' : tier === 'premium' ? '$$$' : '$$';
      card.innerHTML = `
        <div class="bs-alt-thumb">${alt.icon}</div>
        <div class="bs-alt-name">${alt.name}</div>
        <div class="bs-alt-price">${tierDots} · $${alt.price.toLocaleString()}</div>
      `;
      card.onclick = () => {
        const idx = room.items.findIndex(i => i.id === item.id);
        if (idx >= 0) {
          room.items[idx] = alt;
          pushVersion(room, `Swapped ${item.name} → ${alt.name}`);
          save();
          renderRoomPieces(room);
          renderVersions(room);
          openItemSheet(alt, room);
          toast(`Switched to ${alt.name}`);
        }
      };
      altsEl.appendChild(card);
    });
  }

  document.getElementById('itemSheetClose').addEventListener('click', closeItemSheet);
  document.getElementById('itemSheetBackdrop').addEventListener('click', closeItemSheet);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('itemSheet').classList.contains('open')) closeItemSheet();
  });

  // Expose for inline handlers (priceTag/itemCard close over this in the IIFE)
  // (no global needed — both renderPriceTags and renderItemsList live in the same IIFE)

  // ---------- Reviews ticker ----------
  const REVIEWS = [
    { stars: 5,   text: "Designed my entire living room in ten minutes. Stunned.",                author: "Maya R." },
    { stars: 5,   text: "Found the perfect rug from this app. The match was uncanny.",            author: "Jordan T." },
    { stars: 5,   text: "It captured my style faster than my partner of five years.",             author: "Priya K." },
    { stars: 4.5, text: "Never thought 'cottagecore' was me — the app proved otherwise.",         author: "Sam L." },
    { stars: 5,   text: "Saved me about $800 by skipping a sofa that wouldn't fit.",              author: "Chris M." },
    { stars: 5,   text: "Honestly cleaner than the magazines I doom-scroll.",                     author: "Riley V." },
    { stars: 4.5, text: "Showed me dimensions before I bought. Wish I'd had this years ago.",     author: "Daniela P." },
    { stars: 5,   text: "My nursery is now a Pinterest board come to life.",                      author: "Alex F." },
    { stars: 5,   text: "Snapped my room, picked a vibe, done. Genuine magic.",                   author: "Devin H." },
    { stars: 4.5, text: "The bookshelf-wealth aesthetic? Absolutely cooked.",                     author: "Noor S." },
    { stars: 4,   text: "Five-star furniture, four-star app — but it'll get there.",              author: "Casey R." },
    { stars: 5,   text: "Felt like having a designer friend on text.",                            author: "Imani O." },
    { stars: 4.5, text: "Set the budget myself, got an actual livable room.",                    author: "Tate B." },
    { stars: 5,   text: "Furnished my whole apartment from scratch in a single weekend.",         author: "Leah K." },
    { stars: 4,   text: "Wish I could swap fabrics, but the curation is unreal.",                 author: "Owen W." },
    { stars: 5,   text: "Profile-per-roommate ended every furniture argument we ever had.",       author: "Zara N." },
    { stars: 5,   text: "The Japandi pick suggested a chair I'd been side-eyeing for months.",    author: "Marco D." },
    { stars: 4.5, text: "Feels less like an app and more like a quiet design studio.",            author: "Hailey J." }
  ];

  function renderStars(n) {
    const full = Math.floor(n);
    const half = (n - full) >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    let html = '';
    for (let i = 0; i < full; i++) html += '★';
    if (half) html += '<span class="half">★</span>';
    for (let i = 0; i < empty; i++) html += '<span class="empty">★</span>';
    return html;
  }

  function startReviewsBar() {
    const row = document.getElementById('reviewRow');
    if (!row) return;
    let idx = Math.floor(Math.random() * REVIEWS.length);
    let timer = null;
    let paused = false;
    let tickCount = 0;

    // [Conflict 4 lock — fictitious counters retired. Per Reforge Brand
    //  Marketing — Evangelizing Brand Guidelines p.21: fictitious anchors
    //  erode trust. The previous variants ("12,400+ homes designed this
    //  month", "$2.3M saved", random "X rooms designed in the last hour"
    //  using Math.random) were unverifiable claims dressed as live data.
    //  Replaced with positioning claims aligned to FURNISH_OKT — these
    //  are real, defensible, and ladder up to the differentiator (real
    //  catalog + solo-built). When real traction lands (post-backend
    //  Supabase row counts), restore data-backed variants per Dim 10
    //  Recommendation 6 (deferred to DEFERRED.md).]
    function liveCounterRow() {
      const variants = [
        { icon: '✦', text: `<strong>Real catalog</strong> · IKEA, Wayfair, West Elm, Amazon` },
        { icon: '◯', text: `<strong>Indie-built</strong> · ad-free, affiliate-funded` },
        { icon: '✶', text: `<strong>No subscription</strong> needed to see your redesign` },
        { icon: '◈', text: `<strong>$0 to try</strong> · No credit card, no signup` }
      ];
      const v = variants[tickCount % variants.length];
      return `<span class="live-counter"><span class="lc-dot"></span><span class="lc-icon">${v.icon}</span><span class="lc-text">${v.text}</span></span>`;
    }

    const cycle = () => {
      if (paused) { timer = setTimeout(cycle, 600); return; }
      // Every 4th tick shows a live counter; rest show reviews.
      if (tickCount > 0 && tickCount % 4 === 0) {
        row.innerHTML = liveCounterRow();
      } else {
        const r = REVIEWS[idx % REVIEWS.length];
        row.innerHTML = `
          <span class="review-stars" aria-label="${r.stars} out of 5 stars">${renderStars(r.stars)}</span>
          <span class="review-text">"${r.text}"</span>
          <span class="review-author">— ${r.author}</span>
        `;
        idx++;
      }
      tickCount++;
      requestAnimationFrame(() => row.classList.add('show'));
      timer = setTimeout(() => {
        row.classList.remove('show');
        timer = setTimeout(cycle, 480);
      }, 3200);
    };

    // Pause cycling while user hovers, so they can finish reading.
    row.addEventListener('mouseenter', () => { paused = true; });
    row.addEventListener('mouseleave', () => { paused = false; });

    cycle();
  }

  // ---------- Multi-screen capture flow: back + next wiring ----------
  function wireCaptureFlow() {
    // Delegated click: any [data-go-back] button walks one screen backwards
    // through the flow using the current screen's data-flow-prev attribute.
    // Falls back to home if no prev is set.
    document.addEventListener('click', e => {
      const back = e.target.closest('[data-go-back]');
      if (back) {
        const cur = document.querySelector('.screen.active');
        const prev = cur?.getAttribute('data-flow-prev') || 'home';
        showScreen(prev);
        return;
      }
      const next = e.target.closest('[data-flow-next]');
      if (next) {
        const dest = next.getAttribute('data-flow-next');
        if (dest) showScreen(dest);
      }
    });
  }

  // [Compute-quality routing] Welcome screen recall — branches simplified
  // after the quota model retired. The "out of free redesigns" branches are
  // gone; lifecycle-only copy is the source of truth now.
  // Per Reforge ICED p.18: "the more infrequent the product, the poorer the
  // product recall by the customer" — counter with explicit "welcome back"
  // copy.
  function applyWelcomeRecallState() {
    const lifecycle = getLifecycleState();
    const cta = document.getElementById('welcomeStartBtn');
    const tagline = document.querySelector('[data-screen="welcome"] .tagline');
    const sub = document.querySelector('[data-screen="welcome"] .muted.small');
    if (!cta) return;
    const dormant = lifecycle === LIFECYCLE.DORMANT || lifecycle === LIFECYCLE.CHURNED;

    if (dormant) {
      cta.textContent = 'Welcome back — design another room →';
      if (tagline) tagline.textContent = 'Your saved style is still here. Pick up where you left off.';
      if (sub) sub.textContent = 'No need to redo the quiz';
    } else if (lifecycle === LIFECYCLE.AT_RISK) {
      cta.textContent = 'Continue designing →';
      if (sub) sub.textContent = 'Your style is saved · ~30 seconds';
    }
  }

  // C8 — Treat tab-becomes-visible after >30 min as a new session, so users
  // returning to a long-open tab still hit the lifecycle pipeline.
  let _lastVisibilityTime = Date.now();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const gap = Date.now() - _lastVisibilityTime;
      if (gap > 30 * 60 * 1000) {
        _visitTouched = false;
        touchLastVisit();
        applyWelcomeRecallState();
        if (document.querySelector('.screen.active')?.dataset?.screen === 'home') {
          renderHome();
        }
      }
      _lastVisibilityTime = Date.now();
    } else {
      _lastVisibilityTime = Date.now();
    }
  });

  // ============================================================
  // Batch 1 additions — Dim 14 Edge Cases + Dim 09 voice + Dim 10 trust
  // ============================================================

  // [Dim 14 Section A — Photo tip card] Config-driven render. When
  // assets/tip-example.jpg lands, flip examplePath in PHOTO_TIP_CONFIG
  // and the image renders without component changes (per Hassan's
  // explicit ask: "config edit, no component changes").
  const PHOTO_TIP_CONFIG = Object.freeze({
    enabled: true,
    copy: 'Brightly lit, full-room view works best.',
    examplePath: null,  // set to 'assets/tip-example.jpg' when ready
    dismissKey: '_photoTipDismissed',  // session-scoped flag
  });
  window.FurnishPhotoTipConfig = PHOTO_TIP_CONFIG;

  function renderPhotoTip() {
    const tip = document.getElementById('photoTip');
    if (!tip) return;
    if (!PHOTO_TIP_CONFIG.enabled) { tip.hidden = true; return; }
    if (state.user?.[PHOTO_TIP_CONFIG.dismissKey]) { tip.hidden = true; return; }
    const copyEl = document.getElementById('photoTipCopy');
    const exampleEl = document.getElementById('photoTipExample');
    if (copyEl) copyEl.textContent = PHOTO_TIP_CONFIG.copy;
    if (exampleEl) {
      if (PHOTO_TIP_CONFIG.examplePath) {
        exampleEl.innerHTML = `<img src="${PHOTO_TIP_CONFIG.examplePath}" alt="Example: brightly lit full-room view">`;
      } else {
        // [Hassan's ship call: text-only placeholder until image lands.
        //  Custom SVG room icon, not emoji.]
        exampleEl.innerHTML = '<svg class="photo-tip-icon" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21V9l9-6 9 6v12"/><path d="M9 21V13h6v8"/></svg>';
      }
    }
    tip.hidden = false;
    document.getElementById('photoTipDismiss')?.addEventListener('click', () => {
      tip.hidden = true;
      if (!state.user) state.user = {};
      state.user[PHOTO_TIP_CONFIG.dismissKey] = true;
      save();
      trackEvent('photo_tip_dismissed');
    }, { once: true });
    trackEvent('photo_tip_shown');
  }

  // [Dim 14 Section C Fix 1 + Top 3 #1] "Different Style?" modal.
  // Opens from #differentStyleBtn on the reveal screen. 6 alt-style
  // chips → tap → re-runs pickItemsForRoom() with new style override
  // (no AI compute call — pure local re-pick) → pushVersion() →
  // open the room with new picks. ~2 seconds end-to-end. Per Reforge
  // Strategies For At-Risk Users → Use Case Transition.
  function openStylePivotModal(room) {
    const modal = document.getElementById('differentStyleModal');
    const grid = document.getElementById('differentStyleGrid');
    if (!modal || !grid) return;
    const profile = state.profiles.find(p => p.id === room.profileId);
    const current = new Set(profile?.styles || []);
    // Pick up to 6 alt styles, prefer non-current. Stable order.
    const candidates = (window.STYLES || [])
      .filter(s => !current.has(s.id))
      .slice(0, 6);
    grid.innerHTML = '';
    candidates.forEach(s => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'different-style-chip';
      btn.dataset.styleId = s.id;
      btn.innerHTML = `<span class="dsc-label">${s.label || s.id}</span>`;
      btn.addEventListener('click', () => {
        // [BUDGET_RESET_PASS] No budget gate — pivotToStyle uses
        // room.budget (the value chosen for the original generation).
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        pivotToStyle(room, s.id);
      });
      grid.appendChild(btn);
    });
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    trackEvent('reveal_different_style_opened', { roomId: room.id, currentStyles: profile?.styles });
  }

  function closeStylePivotModal() {
    const modal = document.getElementById('differentStyleModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function pivotToStyle(room, newStyleId) {
    const profile = state.profiles.find(p => p.id === room.profileId);
    if (!profile) return;
    const fromStyles = [...(profile.styles || [])];
    // Override the profile styles temporarily for the re-pick. We push
    // a new version on the same room (preserving original picks via
    // pushVersion) so the user can compare.
    const originalStyles = profile.styles;
    profile.styles = [newStyleId];
    try {
      const draftLike = { type: room.type, dims: room.dims };
      const fresh = pickItemsForRoom(draftLike, getEffectiveAnswers(profile), room.budget || SLIDER_BUDGET_DEFAULT,
        { excludeIds: [], anchorColor: null, keepMode: !!room.keepMode });
      room.items = fresh;
      pushVersion(room, `Pivoted to ${(window.STYLES || []).find(s => s.id === newStyleId)?.label || newStyleId}`);
    } finally {
      // Restore the profile's original style intent — the pivot is per-room,
      // not a permanent profile change. User can confirm via preferences.
      profile.styles = originalStyles;
    }
    save();
    renderRoomPieces(room);
    renderVersions(room);
    trackEvent('reveal_different_style_picked', { roomId: room.id, fromStyles, toStyle: newStyleId });
    closeStylePivotModal();
    toast(`Different items in ${(window.STYLES || []).find(s => s.id === newStyleId)?.label || 'a new style'}.`);
  }

  document.getElementById('differentStyleBtn')?.addEventListener('click', () => {
    const room = state.rooms.find(r => r.id === currentRoomId);
    if (!room) return;
    openStylePivotModal(room);
  });
  document.getElementById('differentStyleClose')?.addEventListener('click', closeStylePivotModal);
  document.getElementById('differentStyleModal')?.addEventListener('click', e => {
    if (e.target.id === 'differentStyleModal') closeStylePivotModal();
  });

  // [Dim 14 Section F — localStorage quota exceeded handling]
  // The save() function above is the canonical persistence point;
  // we wrap a quota-aware retry around the same call surface.
  // pruneState() drops the largest non-essential data first.
  function pruneState() {
    if (Array.isArray(state.affiliateClicks)) state.affiliateClicks = state.affiliateClicks.slice(-50);
    if (Array.isArray(state._events)) state._events = state._events.slice(-100);
    // Drop _dismissed flags older than 30d so they can't accumulate forever.
    if (state._dismissed && typeof state._dismissed === 'object') {
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      Object.entries(state._dismissed).forEach(([k, ts]) => {
        if (typeof ts === 'number' && ts < cutoff) delete state._dismissed[k];
      });
    }
    // [Future] At backend cutover, base64 photos move to Supabase Storage
    // and the localStorage payload shrinks dramatically. See DEFERRED.md.
  }

  // Idempotent wrapper installable post-boot. The original save() in
  // this file already wraps localStorage.setItem in try/catch with a
  // console.warn. We extend the catch to detect QuotaExceededError
  // specifically and prune+retry once.
  const _originalSave = window.save || save;
  function safeSave() {
    try {
      _originalSave();
    } catch (e) {
      if (e && (e.name === 'QuotaExceededError' || /quota/i.test(e.message || ''))) {
        pruneState();
        try {
          _originalSave();
          // Per Reforge Monetization — convert failure into Pro-funnel moment.
          // Cloud-backup framing surfaces only on actual quota event, not on
          // every save (annoying), and only once per session.
          if (!state._quotaPromptShown) {
            state._quotaPromptShown = true;
            toast('Your room library is getting full — sign in to back up to the cloud.');
            trackEvent('localstorage_quota_pruned');
          }
        } catch (e2) {
          console.warn('localStorage save failed even after prune', e2);
          trackEvent('localstorage_quota_failed_after_prune');
        }
      } else {
        console.warn('localStorage save failed', e);
      }
    }
  }
  // Hot-swap: future code paths can call safeSave instead of save when ready.
  // For now, the boot path uses save() — the wrapper is exposed for future
  // call sites. Marking as window-level so external scripts can opt in.
  window.FurnishSafeSave = safeSave;

  // [Dim 14 Section F — Wishlist orphan reference handling] Prune
  // wishlist IDs that no longer exist in FURNITURE_DB. Run on boot
  // AFTER catalog load. Per Reforge Voluntary Dormant Reasons #3
  // (Over-Promised, Under-Delivered): silent broken wishlists erode
  // trust. Notify the user when prunes happen (gentle, not alarming).
  function gcOrphanedWishlist() {
    if (!Array.isArray(state.wishlist) || !window.FURNITURE_DB) return;
    const known = new Set(window.FURNITURE_DB.map(i => i.id));
    const before = state.wishlist.length;
    const pruned = state.wishlist.filter(id => known.has(id));
    if (pruned.length === before) return;
    const removed = before - pruned.length;
    state.wishlist = pruned;
    // Also clean wishlistMeta and priceAlerts to match.
    if (state.wishlistMeta) {
      Object.keys(state.wishlistMeta).forEach(id => { if (!known.has(id)) delete state.wishlistMeta[id]; });
    }
    if (state.priceAlerts) {
      Object.keys(state.priceAlerts).forEach(id => { if (!known.has(id)) delete state.priceAlerts[id]; });
    }
    save();
    trackEvent('wishlist_orphan_pruned', { removed });
    // Notify softly — only on the wishlist screen itself, not as a toast
    // on boot (would be alarming to see immediately). Banner appears
    // next time the user opens Saved Items.
    state._wishlistOrphanPruneCount = (state._wishlistOrphanPruneCount || 0) + removed;
  }

  // [Dim 14 Section F — Camera permission denied fallback]
  // Cross-browser camera permission detection is unreliable. We post a
  // 3s soft fallback if no `change` event fires after Take Photo click.
  // Detect known-bad UA strings and pre-emptively highlight the Upload
  // button via a CSS class .upload-recommended (CSS optional; class is
  // a hook for future styling).
  (function wireCameraFallback() {
    const cameraInput = document.getElementById('cameraInput');
    const cameraBtn = cameraInput?.closest('label.btn');
    if (!cameraInput || !cameraBtn) return;
    let waitTimer = null;
    cameraBtn.addEventListener('click', () => {
      clearTimeout(waitTimer);
      waitTimer = setTimeout(() => {
        // 3s elapsed without a `change` event firing. Show fallback.
        toast('Camera not available — try Upload from gallery.');
        trackEvent('camera_input_fallback_shown');
        cameraBtn.classList.add('upload-recommended');
      }, 3000);
    });
    cameraInput.addEventListener('change', () => clearTimeout(waitTimer));
  })();

  // [Dim 14 Section F — HTTPS-required-for-camera detection]
  // Modern browsers allow getUserMedia on localhost via HTTP, but on a
  // local network IP (e.g., phone-test at http://192.168.x.x:3000) the
  // camera silently fails. Surface a soft banner so the dev/tester
  // knows to use HTTPS or fall back to gallery.
  (function checkSecureCameraContext() {
    if (typeof window === 'undefined') return;
    if (window.isSecureContext === true) return;
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
    if (!location.hostname) return;
    // Insecure non-localhost context — camera will fail.
    const banner = document.createElement('div');
    banner.className = 'insecure-context-banner';
    banner.textContent = 'Tip: open via HTTPS for camera support — or use Upload from gallery.';
    document.body.appendChild(banner);
    trackEvent('insecure_context_detected', { host: location.hostname });
  })();

  // [Dim 14 Section F — Analyze double-tap race condition guard]
  // analyzeBtn click can fire `routeGenerationByModelTier` →
  // `runAnalyzerAnimation` → `buildRoomFromDraft`. A double-tap on
  // mobile (or impatient retry) doubles the work. Single-flight
  // guard prevents concurrent generations. Per Reforge PM Foundations
  // — Feature Development: idempotency is baseline for any user-
  // triggered action that costs money or compute. Especially relevant
  // post-AI-cutover (DEFERRED.md item 1) when each call is real $.
  (function wireAnalyzeSingleFlight() {
    const btn = document.getElementById('analyzeBtn');
    if (!btn) return;
    btn.addEventListener('click', e => {
      if (state._analyzeInFlight) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      state._analyzeInFlight = true;
      btn.disabled = true;
      // Clear flag when analyzing screen exits OR after a safety timeout
      // (in case of unforeseen flow exits). 30s is generous for AI cutover.
      const clearFlag = () => {
        state._analyzeInFlight = false;
        btn.disabled = false;
      };
      setTimeout(clearFlag, 30000);
      // Also clear on next screen change away from analyzing.
      const obs = new MutationObserver(() => {
        const analyzing = document.querySelector('[data-screen="analyzing"]');
        if (analyzing && !analyzing.classList.contains('active')) {
          clearFlag();
          obs.disconnect();
        }
      });
      const screensRoot = document.querySelector('.screens') || document.body;
      obs.observe(screensRoot, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }, true);  // capture phase so we run before the existing handler
  })();

  // [Dim 14 Section F — Native share fallback]
  // navigator.share works on iOS Safari 12+ and Android Chrome 71+.
  // For older browsers, fall back to copy-to-clipboard. Per Reforge
  // Advanced Growth Strategy → Content Loops: silent share failures =
  // silent growth failures.
  window.FurnishShare = async function FurnishShare(payload) {
    if (navigator.share) {
      try {
        await navigator.share(payload);
        trackEvent('share_native_completed');
        return true;
      } catch (e) {
        if (e?.name === 'AbortError') {
          trackEvent('share_native_aborted');
          return false;
        }
        // fall through to clipboard fallback
      }
    }
    // Fallback: copy share URL to clipboard.
    const text = payload?.url || payload?.text || '';
    if (text && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        toast('Link copied — paste anywhere.');
        trackEvent('share_clipboard_fallback', { hasNativeShare: !!navigator.share });
        return true;
      } catch {}
    }
    trackEvent('share_native_unavailable');
    return false;
  };

  // [Bug E fix] Clean signout — full local state reset.
  // Single source of truth for the deliberate signout flow. Both signout
  // entry points (topbar dropdown + Profile-page settings list) call this
  // so behaviour stays identical and the clear list never drifts.
  //
  // Contract: returns true if the user confirmed and the signout
  // completed; false if they cancelled. Caller should check the return
  // value and skip any post-signout follow-up if false.
  //
  // What gets cleared: every property in DEFAULT_STATE (user, profiles,
  // rooms, bookmarkedRooms, wishlist, priceAlerts, activeProfileId, draft,
  // quiz) plus all session flags (`_pendingIntent`, `_tourShown`, etc.)
  // PLUS `wishlistMeta` (runtime field, not in DEFAULT_STATE but worth
  // resetting so wishlist + meta stay in sync). PRESERVED:
  // `state.settings.theme` — device preference, not auth state.
  //
  // What does NOT get cleared: the per-user backup blob in localStorage
  // (`furnish.state.backup.<uid>`) — written by FurnishSignoutSnapshot
  // BEFORE the clear so a re-signin with the same account can offer
  // "Restore your previous library?" via maybeOfferStateRestore.
  async function performSignout() {
    if (!confirm('Sign out? This will clear your design data on this device. (A backup is saved if you sign back in with the same account.)')) {
      return false;
    }
    // 1. Snapshot per-user backup BEFORE clearing
    if (typeof window.FurnishSignoutSnapshot === 'function') {
      window.FurnishSignoutSnapshot();
    }
    // 2. Server-side: drop Supabase session
    if (window.furnishBackend?.mode === 'supabase') {
      await window.furnishBackend.auth.signOut().catch(() => {});
    }
    // 3. Analytics identity (was missing on the topbar dropdown path
    //    pre-fix — now consistent across both entry points)
    if (typeof resetAnalyticsIdentity === 'function') {
      resetAnalyticsIdentity();
    }
    // 4. Clear all in-memory state to DEFAULT_STATE values, plus session
    //    flags. Theme is preserved as a device preference.
    const preservedTheme = state.settings?.theme || 'light';
    state.user = null;
    state.profiles = [];
    state.activeProfileId = null;
    state.rooms = [];
    state.bookmarkedRooms = [];
    state.wishlist = [];
    state.wishlistMeta = {};
    state.priceAlerts = {};
    state.draft = null;
    state.quiz = null;
    state.settings = { theme: preservedTheme };
    // Session flags — explicitly listed per spec. If new flags get
    // added elsewhere in the codebase, they should be added here too.
    state._pendingIntent = null;
    state._showExploreWelcome = false;
    state._tourShown = false;
    state._habitFired = false;
    state._ahaResultsFired = false;
    state._tutorialQueued = false;
    state._evolutionDismissedRooms = {};
    state._templateTipShown = false;
    state._lastAIPrompt = null;
    state._premiumUpsellShownThisSession = false;
    state._justGeneratedRoomId = null;
    // 5. Persist to localStorage
    save();
    // 6. Sync UI surfaces that don't auto-rebuild on state change
    if (typeof renderUserPill === 'function') {
      renderUserPill();
    }
    // 7. User-facing confirmation + navigation
    toast('Signed out. Your data has been cleared from this device.');
    showScreen('welcome');
    console.log('[signout] cleared all state, navigating to welcome');
    return true;
  }

  // [Dim 14 Section F — Sign-out wishlist data-loss prevention]
  // Snapshot state into per-user backup key before sign-out clears it.
  // On sign-in, if a backup exists for the new userId, offer "Restore
  // your previous library." Per Reforge Resurrecting Involuntary Dormant
  // Users → Category One: Product Issue.
  function snapshotStateOnSignout() {
    const uid = state.user?.id || state.user?.email;
    if (!uid) return;
    try {
      localStorage.setItem(`furnish.state.backup.${uid}`, JSON.stringify({
        wishlist: state.wishlist || [],
        wishlistMeta: state.wishlistMeta || {},
        priceAlerts: state.priceAlerts || {},
        bookmarkedRooms: state.bookmarkedRooms || [],
        rooms: state.rooms || [],
        profiles: state.profiles || [],
        savedAt: Date.now()
      }));
      trackEvent('signout_state_snapshotted', { uid: String(uid).slice(0, 8) });
    } catch (e) {
      console.warn('signout snapshot failed', e);
    }
  }
  window.FurnishSignoutSnapshot = snapshotStateOnSignout;

  function maybeOfferStateRestore() {
    const uid = state.user?.id || state.user?.email;
    if (!uid) return;
    let backup;
    try {
      const raw = localStorage.getItem(`furnish.state.backup.${uid}`);
      if (!raw) return;
      backup = JSON.parse(raw);
    } catch { return; }
    if (!backup || (state.wishlist?.length || 0) > 0 || (state.rooms?.length || 0) > 0) {
      // User already has data — don't prompt. Backup stays for safety.
      return;
    }
    // Soft prompt — offer restore. Idempotent: dismissing clears the prompt
    // for this session but leaves the backup intact for future sign-ins.
    if (state.user?._restorePromptShownThisSession) return;
    state.user._restorePromptShownThisSession = true;
    save();
    setTimeout(() => {
      if (confirm('Restore your previous saved items, rooms, and bookmarks from your last session?')) {
        Object.assign(state, {
          wishlist: backup.wishlist || [],
          wishlistMeta: backup.wishlistMeta || {},
          priceAlerts: backup.priceAlerts || {},
          bookmarkedRooms: backup.bookmarkedRooms || [],
          rooms: backup.rooms || state.rooms || [],
          profiles: backup.profiles?.length ? backup.profiles : state.profiles
        });
        save();
        trackEvent('signin_state_restored');
        toast('Restored your previous library.');
      } else {
        trackEvent('signin_state_restore_declined');
      }
    }, 800);
  }
  window.FurnishMaybeOfferRestore = maybeOfferStateRestore;

  // [Dim 14 Section F — Multi-device tier conflict softening]
  // The existing reconcileTierWithBackend → handleDowngrade('server_reconcile')
  // path is wired (per DEFERRED.md item 4). Adding a defensive 3s
  // re-pull before firing the toast — protects against stale-cache
  // false-downgrade flickers. The actual reconcileTierWithBackend
  // function is upstream; we wrap it via patch.
  if (typeof window.reconcileTierWithBackend === 'function') {
    const _origReconcile = window.reconcileTierWithBackend;
    window.reconcileTierWithBackend = async function(...args) {
      // Best-effort defensive re-pull. If backend is configured, give it
      // a 3s window to refresh the canonical state. If it times out or
      // fails, fall through to original behavior.
      try {
        if (window.furnishBackend?.pullAll) {
          await Promise.race([
            window.furnishBackend.pullAll(state),
            new Promise(resolve => setTimeout(resolve, 3000))
          ]);
        }
      } catch {}
      return _origReconcile.apply(this, args);
    };
  }

  // ============================================================
  // Batch 2 additions — Dim 01 Visual + Dim 11 Performance & Feel
  // ============================================================

  // [B2-17 / Dim 11 D.4] Last-rendered redesign image cache.
  // [Original — Reforge doesn't specify caching strategy; engineering
  // rationale.] Avoids re-parsing base64 photos on home → room
  // transitions. localStorage parse of a 12MB base64 photo is a
  // noticeable hit on slower phones. The cache holds a decoded
  // HTMLImageElement keyed by roomId. Invalidated on any room save.
  let _lastRoomImageCache = null;  // { roomId, img }

  function getRoomImage(room) {
    if (!room?.photo) return Promise.resolve(null);
    if (_lastRoomImageCache && _lastRoomImageCache.roomId === room.id) {
      return Promise.resolve(_lastRoomImageCache.img);
    }
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        _lastRoomImageCache = { roomId: room.id, img };
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = room.photo;
    });
  }

  function invalidateRoomImageCache(roomId) {
    if (!_lastRoomImageCache) return;
    if (!roomId || _lastRoomImageCache.roomId === roomId) {
      _lastRoomImageCache = null;
    }
  }
  window.FurnishGetRoomImage = getRoomImage;
  window.FurnishInvalidateRoomImage = invalidateRoomImageCache;

  // [B2-18 / Dim 11 D.5] Sound-effects toggle (off by default).
  // Per Reforge Constrained Divergence: delight differentiation pursued
  // ONLY when materially differentiating. Audio bombing without consent
  // is intrusion. Ship the rails — actual SFX assets are a future batch.
  function playSfx(name) {
    if (!state.settings?.soundEnabled) return;
    // Future: load + play actual SFX. Stub for v1.
    // Asset budget per spec: 4 SFX max — whoosh, sparkle, chime, ding.
  }
  window.FurnishPlaySfx = playSfx;

  // Wire the Settings toggle if it exists in the DOM. Idempotent.
  function wireSoundToggle() {
    const btn = document.getElementById('soundToggle');
    if (!btn) return;
    const checked = !!state.settings?.soundEnabled;
    btn.setAttribute('aria-checked', checked ? 'true' : 'false');
    btn.addEventListener('click', () => {
      state.settings = state.settings || {};
      state.settings.soundEnabled = !state.settings.soundEnabled;
      save();
      btn.setAttribute('aria-checked', state.settings.soundEnabled ? 'true' : 'false');
      trackEvent('sound_toggle_changed', { enabled: !!state.settings.soundEnabled });
    });
  }

  // [ToS consent block] Email Preferences toggle on the profile screen.
  // Revocable marketing opt-in per the GDPR/CCPA requirement that
  // marketing consent be revocable. Reads/writes state.user.marketingOptIn
  // + state.user.marketingOptInAt. Fires the same analytics events the
  // signin-time checkbox fires, so dashboards see both surfaces.
  function syncMarketingPrefsToggle() {
    const btn = document.getElementById('marketingPrefsToggle');
    if (!btn) return;
    const on = !!state.user?.marketingOptIn;
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
    btn.classList.toggle('on', on);
  }
  window.FurnishSyncMarketingPrefs = syncMarketingPrefsToggle;
  function wireMarketingPrefsToggle() {
    const btn = document.getElementById('marketingPrefsToggle');
    if (!btn) return;
    syncMarketingPrefsToggle();
    btn.addEventListener('click', () => {
      if (!state.user) state.user = {};
      const next = !state.user.marketingOptIn;
      state.user.marketingOptIn = next;
      if (next) state.user.marketingOptInAt = Date.now();
      save();
      syncMarketingPrefsToggle();
      trackEvent(next ? 'marketing_consent_checked' : 'marketing_consent_unchecked', {
        source: 'profile_email_preferences'
      });
    });
  }

  // [B2-16 / Dim 11 D.3] Skeleton render helper.
  // Per Reforge Constrained Divergence p.6: same wait, more pleasant.
  // Returns a promise that resolves on next animation frame so callers
  // can chain real-render after the skeleton paints.
  function showSkeletons(targetEl, count, opts = {}) {
    if (!targetEl) return Promise.resolve();
    const tag = opts.tag || 'div';
    const cls = opts.cls || 'item-card skeleton';
    const height = opts.height || 88;
    const html = Array.from({ length: count }, () =>
      `<${tag} class="${cls}" style="height:${height}px"></${tag}>`
    ).join('');
    targetEl.innerHTML = html;
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }
  window.FurnishShowSkeletons = showSkeletons;

  // ============================================================
  // Batch 3 additions — Dim 04 Activation + Dim 12 Onboarding + Dim 03 Conversion
  // ============================================================
  // Decisions (from BATCH_3_AUDIT.md, locked by Hassan 2026-04-26):
  //   A1=B+C (kept current order; Q3 swap obsolete — 10-Q onboarding already
  //          replaces the old 4-Q structure)
  //   A2=MODIFY (delay price-tag render to Frame 5 of Batch 2 choreography)
  //   A3=DEMOTE (skip → text link, see CSS)
  //   A4=CONFIRM (soft email capture before D7 — Conflict 5 locked)
  //   A5=DEFER (Quarterly Core flip stays internal — Conflict 1 honored)
  //   A6=KEEP CURRENT hero tagline
  //   A7=APPROVE (Aha event split: gate vs experienced)
  //   A8=APPROVE (tutorial defer to session 2 — Conflict 7 locked)
  // ============================================================

  // [Batch 3 — A7 / Dim 04 R1] Aha event redefinition.
  // The old `aha_moment_reached` fired on render — that's the GATE, not Aha.
  // Per Reforge Defining Your Aha Moment (R+E Module 03), Aha = user has
  // experienced the core value prop. Render is not experience. We split:
  //   - aha_gate_reached: fires on results render (renamed from aha_moment_reached)
  //   - aha_moment_reached: fires when user signals experience —
  //       10s dwell  OR  Love-tap  OR  any item tap  OR  Shop-all  OR  wishlist save
  // Per-room single-fire flag prevents double-counting.
  function fireAhaMomentIfFresh(room, signal) {
    if (!room) return;
    if (room._ahaMomentFired) return;
    room._ahaMomentFired = true;
    save();
    trackEvent('aha_moment_reached', {
      roomId: room.id,
      signal,                        // 'dwell_10s' | 'love' | 'item_tap' | 'shop_all' | 'wishlist_save'
      msFromGate: room._ahaGateAt ? Date.now() - room._ahaGateAt : null
    });
  }
  window.FurnishFireAhaMoment = fireAhaMomentIfFresh;

  // Schedule the 10s-dwell signal when results screen opens (the gate event).
  function scheduleAhaDwellTimer(room) {
    if (!room) return;
    room._ahaGateAt = Date.now();
    if (room._ahaMomentFired) return;
    setTimeout(() => {
      const cur = document.querySelector('.screen.active')?.dataset?.screen;
      if (cur !== 'results') return;
      if (currentRoomId !== room.id) return;
      fireAhaMomentIfFresh(room, 'dwell_10s');
    }, 10000);
  }

  // [Batch 3 — A8 / Dim 04 R5 / Dim 12 E7 / Conflict 7]
  // Tutorial deferral to session 2 home arrival.
  // Per Reforge R+E Module 04 "Creating Your Aha Moment Experience":
  // forceful coachmarks during Aha train anti-habit behavior. The original
  // 6s post-reveal coachmark was wrong — defer to next session, on home
  // arrival, with a "what's next" framing rather than feature-tour.
  function isSessionTwoArrival() {
    if (!state.user) return false;
    if (state.user.firstRedesignTutorialSeen) return false;
    if (!state.rooms?.length) return false;
    return (state.user.sessionCount || 0) >= 2;
  }

  // Bump session count once per fresh boot. Gated so reload mid-session
  // doesn't fire it again (1-hour cooldown via lastVisitedAt is sufficient).
  function maybeIncrementSessionCount() {
    if (!state.user) state.user = {};
    const now = Date.now();
    const last = state.user._lastSessionStart || 0;
    if (now - last < 60 * 60 * 1000) return;  // <1h since last → same session
    state.user.sessionCount = (state.user.sessionCount || 0) + 1;
    state.user._lastSessionStart = now;
    save();
    trackEvent('session_started', { count: state.user.sessionCount });
  }

  // Tutorial fires when user arrives at home in session 2+ with at least
  // one room. Repurposed copy lives in the existing tutorial controller —
  // we just gate the trigger here.
  function maybeFireSessionTwoTutorial() {
    if (!isSessionTwoArrival()) return;
    if (typeof maybeFireTutorialOnPreferencesEntry === 'function') {
      // Reuse the existing tutorial controller; it's idempotent and
      // checks firstRedesignTutorialSeen. Renamed conceptually to
      // "what's next on home" but the function name stays for compat.
      setTimeout(() => maybeFireTutorialOnPreferencesEntry(), 1200);
    }
  }
  window.FurnishMaybeFireSessionTwoTutorial = maybeFireSessionTwoTutorial;

  // [Batch 3 — Dim 04 R3] Returning-guest skip onboarding.
  // Detects guest with prior progress (rooms or draft) and routes them to
  // home with a resume hero, skipping the welcome flow entirely. Per
  // Reforge ICED Theory "Expanding Touchpoints": a returning user MUST
  // get a different experience from a cold-start; forcing them through
  // first-session flow erodes memory of prior investment.
  function isReturningGuestWithProgress() {
    if (!isGuest()) return false;
    return (state.rooms?.length > 0) || (state.draft && state.draft.photo);
  }

  // [Batch 3 — Dim 04 R6] Habit metric instrumentation.
  // Per Reforge R+E Module 03 "Defining Your Habit Moment": habit = repeated
  // behavior. XaY format = X habit-actions in Y days. For Furnish: 2 habit
  // actions in 28d — where habit_action ∈ {wishlist save, price-drop tap,
  // Style Pulse view ≥3s, 2nd redesign started}. Action-based, NOT day-bucket.
  function logHabitAction(kind) {
    if (!state.user) state.user = {};
    state.user._habitActions = state.user._habitActions || [];
    const now = Date.now();
    state.user._habitActions.push({ kind, ts: now });
    // Trim to 28-day window — keeps the buffer tight.
    const cutoff = now - 28 * 24 * 60 * 60 * 1000;
    state.user._habitActions = state.user._habitActions.filter(a => a.ts >= cutoff);
    // Habit formation: ≥2 actions in window.
    const wasFormed = !!state.user.habitFormed;
    const isFormed = state.user._habitActions.length >= 2;
    state.user.habitFormed = isFormed;
    save();
    trackEvent('habit_action_logged', { kind, count_28d: state.user._habitActions.length, formed: isFormed });
    if (!wasFormed && isFormed) {
      trackEvent('habit_formed', { actions: state.user._habitActions.map(a => a.kind) });
    }
  }
  window.FurnishLogHabitAction = logHabitAction;

  // [Batch 3 — A4 / Conflict 5 / Dim 03 R-Account2]
  // Soft email capture before D7 reveal gate.
  // Recovers ~30-50% of bailers as email leads. Email send itself is
  // deferred (DEFERRED.md item 6); client-side stash is purely state.
  // Backend cutover wires `state.user.recoveryEmail` into the email service.
  function softEmailCapture(email) {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return false;
    if (!state.user) state.user = {};
    state.user.recoveryEmail = email.trim().toLowerCase();
    state.user._softCaptureAt = Date.now();
    state.emailIntent = state.emailIntent || {};
    state.emailIntent[state.user.recoveryEmail] = state.user._softCaptureAt;
    save();
    trackEvent('soft_email_captured', { source: 'd7_pre_gate' });
    return true;
  }
  window.FurnishSoftEmailCapture = softEmailCapture;

  // Wire the soft-capture form on the signin screen.
  function wireSoftEmailCaptureForm() {
    const form = document.getElementById('signinSoftForm');
    const emailInput = document.getElementById('signinSoftEmail');
    if (!form || !emailInput) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      // [ToS consent block] Gate soft-capture too — we're storing an
      // email, ToS applies even though no full account is created.
      if (authConsentBlocked('soft_email_capture')) return;
      const email = emailInput.value;
      if (!softEmailCapture(email)) {
        toast('Enter a valid email so we can send your design.');
        return;
      }
      // [ToS consent block] Persist on soft-capture success.
      recordConsent(readConsentInputs());
      // User chose to skip signin — stash the design link, return to welcome
      // with a confirmation toast. The actual email send is deferred to
      // backend cutover (DEFERRED.md item 6).
      toast("We'll email you your design link.");
      // Clear the pending reveal intent (the user is opting out of the gate).
      if (state._pendingIntent?.intent === 'reveal') {
        state._pendingIntent = null;
        save();
      }
      showScreen('welcome');
    });
  }

  // [Batch 3 — Dim 04 R8] Promise-Fit micro-survey after Love-tap.
  // Single-tap survey to capture WHICH dimension of Promise Fit landed:
  // aesthetic ("real magazine spread"), commerce ("can actually buy"),
  // personalization ("matches my taste"). Used to weight subsequent
  // reveals + headline copy A/Bs.
  function showPromiseFitMicrosurvey(roomId) {
    if (state.user?._promiseFitAsked) return;
    if (!state.user) state.user = {};
    state.user._promiseFitAsked = true;
    save();
    const card = document.createElement('div');
    card.className = 'promise-fit-survey';
    card.innerHTML = `
      <p class="pfs-q">What made it click?</p>
      <div class="pfs-options">
        <button class="pfs-btn" data-pfs="aesthetic" type="button">Looks like a real magazine spread</button>
        <button class="pfs-btn" data-pfs="commerce" type="button">I can actually buy these</button>
        <button class="pfs-btn" data-pfs="personalization" type="button">It matches my taste</button>
      </div>
      <button class="pfs-skip" type="button" aria-label="Dismiss">Not now</button>
    `;
    document.body.appendChild(card);
    requestAnimationFrame(() => card.classList.add('show'));
    const dismiss = (dim) => {
      card.classList.remove('show');
      setTimeout(() => card.remove(), 240);
      trackEvent('promise_fit_signal', { dimension: dim || 'dismissed', roomId });
    };
    card.querySelectorAll('.pfs-btn').forEach(btn => {
      btn.addEventListener('click', () => dismiss(btn.dataset.pfs));
    });
    card.querySelector('.pfs-skip').addEventListener('click', () => dismiss(null));
  }
  window.FurnishShowPromiseFitMicrosurvey = showPromiseFitMicrosurvey;

  // [Batch 3 — Dim 03 R-Paywall1] Value-moment paywall trigger checks.
  // Replaces post-3rd-gen arbitrary count with value-anchored triggers.
  // [Batch 5 — Dim 06 Section D] Extended trigger set + dismiss-cooldown
  // differentiation. Per Reforge Convert (Postmates "Join the Party"
  // example): upsells fire at the value moment, not at session count.
  // New triggers added:
  //   • affiliate_click_2plus_items — user picking out pieces is purchase-
  //     intent peak; "want sharper renders to share with your partner?"
  //   • share_attempt — Reforge gold-standard trigger; user is *trying*
  //     to do the thing Pro enables.
  //   • same_room_3rd_redesign — revisit signal; "Pro's premium AI handles
  //     edges + lighting better."
  // Cooldown rules:
  //   • shown but no action: 7d (default)
  //   • explicitly dismissed (puh-close / paywallDismiss): 21d AND
  //     suppress that exact context permanently (future fires of the same
  //     triggerKind are skipped).
  //   • converted (isPro): all firing skipped via isPro() guard.
  function maybeFireValueMomentPaywall(triggerKind, ctx = {}) {
    if (isPro()) return false;
    if (!state.user) state.user = {};
    state.user._valueMomentSeen = state.user._valueMomentSeen || {};
    state.user._valueMomentDismissed = state.user._valueMomentDismissed || {};
    // Hard suppress when user explicitly dismissed THIS context.
    if (state.user._valueMomentDismissed[triggerKind]) return false;
    const lastSeen = state.user._valueMomentSeen[triggerKind] || 0;
    const cooldownMs = 7 * 24 * 60 * 60 * 1000;  // 7-day per-trigger cooldown
    if (Date.now() - lastSeen < cooldownMs) return false;
    state.user._valueMomentSeen[triggerKind] = Date.now();
    save();
    trackEvent('paywall_value_moment_shown', { triggerKind, ...ctx });
    // Map triggerKind → paywall context (post 8→3 consolidation, see R-Paywall2)
    const contextMap = {
      hd_export_attempt:           'hd_export',
      wishlist_3rd_save:           'advanced_price_filters',
      second_room_intent:          'profile',
      love_dwell_5min:             'premium_quality',
      // [Batch 5 — Dim 06 Section D] new value-moment hooks
      affiliate_click_2plus_items: 'hd_export',
      share_attempt:               'hd_export',
      same_room_3rd_redesign:      'premium_quality'
    };
    const paywallContext = contextMap[triggerKind] || 'generic';
    if (typeof openPaywall === 'function') openPaywall(paywallContext);
    return true;
  }
  // [Batch 5 — Dim 06 Section D] Mark a value-moment trigger as
  // explicitly dismissed. Called from paywall close paths AND from the
  // premium-upsell-hint dismiss button. Suppresses the same triggerKind
  // forever (until user upgrades or manually clears state).
  function suppressValueMomentTrigger(triggerKind) {
    if (!triggerKind || !state.user) return;
    state.user._valueMomentDismissed = state.user._valueMomentDismissed || {};
    state.user._valueMomentDismissed[triggerKind] = Date.now();
    save();
  }
  window.FurnishMaybeFireValueMoment = maybeFireValueMomentPaywall;
  window.FurnishSuppressValueMoment = suppressValueMomentTrigger;

  // ============================================================
  // [Batch 5 — Dim 06 Section E.4 + Conflict 6 LOCK]
  // Power-Free signal — gen-50/30d rolling window with affiliate-click
  // gate. Per Reforge Monetization Triad — Cost of Revenue: variable
  // compute cost per Free user is a real margin trap at scale. The
  // behavioral combo (high gens + ≤1 affiliate click) catches users
  // gaming free AI without engaging the affiliate funnel — i.e. not
  // delivering Hassan revenue, just consuming compute. Frame as
  // *opportunity*, not warning: "you're a power-user, here's why Pro
  // is right." Honors "no quota cap" promise — this is a conversion
  // lane, not a gate. Fires once per 30-day rolling window per user.
  // ============================================================

  const POWER_FREE_GEN_THRESHOLD       = 50;
  const POWER_FREE_CLICK_LOW_THRESHOLD = 1;   // ≤1 click → trigger
  const POWER_FREE_CLICK_SKIP_FLOOR    = 3;   // ≥3 clicks → skip (already monetizing)
  const POWER_FREE_WINDOW_MS           = 30 * 24 * 60 * 60 * 1000; // 30d
  const POWER_FREE_AUTODISMISS_MS      = 12 * 1000;

  function pruneRolling(arr) {
    const cutoff = Date.now() - POWER_FREE_WINDOW_MS;
    return (arr || []).filter(ts => ts > cutoff);
  }
  function recordGen30d() {
    if (!state.user) state.user = {};
    state.user._gen30dWindow = pruneRolling(state.user._gen30dWindow);
    state.user._gen30dWindow.push(Date.now());
    save();
  }
  function recordAffiliateClick30d() {
    if (!state.user) state.user = {};
    state.user._clicks30dWindow = pruneRolling(state.user._clicks30dWindow);
    state.user._clicks30dWindow.push(Date.now());
    save();
  }
  function gen30dCount() {
    if (!state.user) return 0;
    state.user._gen30dWindow = pruneRolling(state.user._gen30dWindow);
    return state.user._gen30dWindow.length;
  }
  function affiliateClicks30dCount() {
    if (!state.user) return 0;
    state.user._clicks30dWindow = pruneRolling(state.user._clicks30dWindow);
    return state.user._clicks30dWindow.length;
  }
  window.FurnishGen30dCount = gen30dCount;
  window.FurnishAffiliateClicks30dCount = affiliateClicks30dCount;

  function maybeFirePowerFreeSignal() {
    if (isPro()) return false;
    if (!state.user) state.user = {};
    // Once-per-30-day-window suppression
    const lastShown = state.user._powerFreeSignalShownAt || 0;
    if (Date.now() - lastShown < POWER_FREE_WINDOW_MS) return false;
    // Behavioral-combo gate
    const gens   = gen30dCount();
    const clicks = affiliateClicks30dCount();
    if (gens < POWER_FREE_GEN_THRESHOLD) return false;
    if (clicks > POWER_FREE_CLICK_LOW_THRESHOLD) return false;
    // Skip-floor: already monetizing on Free → don't disrupt
    if (clicks >= POWER_FREE_CLICK_SKIP_FLOOR) return false;
    // Surface only when on results screen (post-Aha context)
    const onResults = !!document.querySelector('[data-screen="results"].active') ||
                      !!document.querySelector('[data-screen="results"][data-active="true"]') ||
                      (document.querySelector('[data-screen="results"]')?.style.display !== 'none');
    if (!onResults) return false;
    // Don't double up on top of a paywall
    if (document.getElementById('paywallModal')?.classList.contains('open')) return false;
    return renderPowerFreeMicroCard(gens, clicks);
  }

  function renderPowerFreeMicroCard(gens, clicks) {
    document.getElementById('powerFreeCard')?.remove();
    const card = document.createElement('div');
    card.id = 'powerFreeCard';
    card.className = 'power-free-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-live', 'polite');
    card.innerHTML = `
      <button class="pfc-close" type="button" aria-label="Dismiss" id="powerFreeClose">×</button>
      <div class="pfc-headline">You've designed <strong>${gens} rooms</strong> this month — that's a power-user pace.</div>
      <div class="pfc-sub">Pro gives you sharper AI quality plus price-drop alerts that actually fit how often you use Furnish.</div>
      <div class="pfc-actions">
        <button class="btn btn-primary pfc-cta" type="button" id="powerFreeCta">Try Pro Free for 7 Days</button>
        <button class="btn btn-ghost pfc-not-now" type="button" id="powerFreeNotNow">Not Now</button>
      </div>
    `;
    document.body.appendChild(card);
    // Force a layout flush so the off-screen initial state commits before
    // .show flips us on-screen. requestAnimationFrame is unreliable in
    // backgrounded tabs (rAF throttles to 1Hz or stops) — the canonical
    // reflow + class-toggle pattern is robust regardless.
    void card.offsetHeight;
    card.classList.add('show');

    if (!state.user) state.user = {};
    state.user._powerFreeSignalShownAt = Date.now();
    save();
    trackEvent('power_free_signal_shown', { gen_count_30d: gens, affiliate_click_count_30d: clicks });

    let dismissed = false;
    const dismiss = (reason) => {
      if (dismissed) return; dismissed = true;
      card.classList.remove('show');
      setTimeout(() => card.remove(), 240);
      if (reason !== 'clicked') trackEvent('power_free_signal_dismissed', { reason });
      if (autoTimer) clearTimeout(autoTimer);
    };
    document.getElementById('powerFreeCta').addEventListener('click', () => {
      trackEvent('power_free_signal_clicked', { gen_count_30d: gens, affiliate_click_count_30d: clicks });
      dismiss('clicked');
      openPaywall('premium_quality');
    });
    document.getElementById('powerFreeNotNow').addEventListener('click', () => dismiss('not_now'));
    document.getElementById('powerFreeClose').addEventListener('click', () => dismiss('close'));
    const autoTimer = setTimeout(() => dismiss('auto'), POWER_FREE_AUTODISMISS_MS);
    return true;
  }
  window.FurnishMaybeFirePowerFreeSignal = maybeFirePowerFreeSignal;

  // [Batch 3 — Dim 03 R-Bottom1] Items list top-3 default + expander.
  // Score = (style-match × inverse-price-rank). Top-3 default shows on
  // first render; "See all N" expands. Per Reforge Psych Framework: a wall
  // of cards = high cognitive negative psych. Curation lifts CTR.
  function rankItemsForCondensedList(items) {
    if (!Array.isArray(items) || items.length <= 3) return { top: items || [], rest: [] };
    // Stable pseudo-rank: shorter items first (cheaper visible commitment),
    // tie-broken by source heterogeneity (don't show 3 from same retailer).
    const enriched = items.map((it, i) => ({ it, i, price: it.price || 0 }));
    enriched.sort((a, b) => a.price - b.price);
    const seenSrc = new Set();
    const top = [];
    for (const e of enriched) {
      if (top.length === 3) break;
      const src = e.it.source || '_';
      if (seenSrc.has(src) && enriched.length - top.length > 3 - top.length) continue;
      top.push(e.it);
      seenSrc.add(src);
    }
    while (top.length < 3 && enriched.length > top.length) {
      const next = enriched[top.length].it;
      if (!top.includes(next)) top.push(next);
      else break;
    }
    const topIds = new Set(top.map(t => t.id));
    const rest = items.filter(it => !topIds.has(it.id));
    return { top, rest };
  }
  window.FurnishRankItems = rankItemsForCondensedList;

  // [Batch 3 — Dim 03 R-Bottom2] Sticky shop-all CTA on scroll.
  // Mounts a fixed-bottom CTA when the user scrolls past the totals card
  // on the results screen. Mirrors the primary #shopAllBtn but with
  // surface='shop_all_sticky' for analytics differentiation.
  function wireStickyShopAllCTA() {
    const screen = document.querySelector('[data-screen="results"]');
    if (!screen) return;
    let stickyEl = document.getElementById('stickyShopAllBtn');
    if (!stickyEl) {
      stickyEl = document.createElement('button');
      stickyEl.id = 'stickyShopAllBtn';
      stickyEl.className = 'btn btn-primary sticky-shop-all';
      stickyEl.type = 'button';
      stickyEl.innerHTML = '<span class="ssa-label">Shop The Whole Room</span><span class="ssa-meta" id="ssaMeta"></span>';
      document.body.appendChild(stickyEl);
      stickyEl.addEventListener('click', () => {
        const room = state.rooms.find(r => r.id === currentRoomId);
        if (!room) return;
        room.items.forEach(i => {
          trackAffiliateClick(i, 'shop_all_sticky');
          window.open(buildAffiliateUrl(i), '_blank', 'noopener');
        });
        trackEvent('affiliate_shop_all_clicked', { roomId: room.id, surface: 'sticky', itemCount: room.items.length });
      });
    }
    const updateSticky = () => {
      if (document.querySelector('.screen.active')?.dataset?.screen !== 'results') {
        stickyEl.classList.remove('visible');
        return;
      }
      const totals = document.getElementById('totalsCard');
      if (!totals) return;
      const rect = totals.getBoundingClientRect();
      const past = rect.bottom < 0;  // user scrolled below totals card
      stickyEl.classList.toggle('visible', past);
      if (past) {
        const room = state.rooms.find(r => r.id === currentRoomId);
        const total = room?.items.reduce((s, i) => s + (i.price || 0), 0) || 0;
        const meta = document.getElementById('ssaMeta');
        if (meta) meta.textContent = ` · $${total.toLocaleString()}`;
      }
    };
    window.addEventListener('scroll', updateSticky, { passive: true });
    document.addEventListener('scroll', updateSticky, { passive: true, capture: true });
  }

  // ============================================================
  // Batch 4 additions — Dim 05 Retention + Dim 07 Personalization + Dim 08 Social
  // ============================================================
  // Strategic foundation: Customer Retention Canvas (BATCH_4_AUDIT.md §A).
  // Three use cases (A: Single-Room Refresh, B: Whole-Home Tour, C: Browse-Shop)
  // with per-UC Setup/Aha/Habit moments and natural-frequency-aligned metrics.
  // Conflict 1 honored: internal frequency framework, no calendar-period in
  // user copy. Conflict 2 honored: referral currency = "5 HD redesigns + 2
  // style packs over 90 days" (verifying propagation in Phase F).
  // ============================================================

  // [Batch 4 — Dim 07 D1] profile.styleScores derivation.
  // Per Reforge Engagement Engine (R+E / 06 / Step One: Signal): better signal
  // granularity → better matching. The 10-Q onboarding stores profile.answers
  // (vibe / color_appetite / decor_density / etc). styleScores derives a
  // normalized weight map across canonical styles by interpreting these
  // answers + folding in saves + Aha verdicts over time.
  //
  // Canonical styles match window.STYLES; each answer-option maps to
  // contributing styles via lookup. We compute on demand, cache on profile.
  const ANSWER_TO_STYLES = Object.freeze({
    // vibe → emotional anchor → style affinity
    'calm_grounded':      ['scandinavian', 'minimalist', 'japandi'],
    'energized_creative': ['eclectic', 'art-deco', 'bohemian'],
    'cozy_protected':     ['bohemian', 'rustic', 'farmhouse', 'traditional'],
    'elevated_hotel':     ['contemporary', 'modern', 'art-deco'],
    'inspired_artist':    ['eclectic', 'bohemian', 'mid-century'],
    // color_appetite → palette intensity
    'neutrals_only':      ['scandinavian', 'minimalist'],
    'mostly_neutral':     ['contemporary', 'modern', 'japandi'],
    'confident_color':    ['mid-century', 'traditional'],
    'bold':               ['eclectic', 'bohemian', 'art-deco'],
    // decor_density
    'clean':              ['minimalist', 'japandi', 'scandinavian'],
    'a_little_personality': ['contemporary', 'modern'],
    'lived_in_rich':      ['traditional', 'bohemian'],
    'maximalist':         ['eclectic', 'art-deco', 'bohemian'],
    // materials
    'warm_woods':         ['scandinavian', 'mid-century', 'farmhouse'],
    'soft_fabrics':       ['bohemian', 'traditional'],
    'metal_glass':        ['modern', 'contemporary', 'art-deco'],
    'stone_ceramic':      ['japandi', 'minimalist', 'rustic'],
    'vintage_patina':     ['mid-century', 'art-deco', 'traditional'],
    'sleek_modern':       ['modern', 'contemporary', 'minimalist'],
  });

  function deriveStyleScoresFromAnswers(answers) {
    if (!answers) return {};
    const scores = {};
    const bump = (style, w = 1) => { scores[style] = (scores[style] || 0) + w; };
    // Each single-select counts 1.0; multi-selects share weight across picks.
    Object.entries(answers).forEach(([qid, val]) => {
      if (val == null) return;
      if (Array.isArray(val)) {
        const each = 1 / Math.max(1, val.length);
        val.forEach(v => (ANSWER_TO_STYLES[v] || []).forEach(s => bump(s, each)));
      } else if (typeof val === 'string') {
        (ANSWER_TO_STYLES[val] || []).forEach(s => bump(s, 1));
      }
    });
    // Normalize to sum=1 so it's a probability-like vector.
    const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
    Object.keys(scores).forEach(k => { scores[k] = scores[k] / total; });
    return scores;
  }

  function deriveStyleConfidence(profile) {
    if (!profile?.answers) return 'unknown';
    const answered = Object.values(profile.answers).filter(v => v != null && v !== -1).length;
    const total = (window.ONBOARDING_QUESTIONS || []).length || 10;
    if (answered >= total * 0.9) return 'high';
    if (answered >= total * 0.5) return 'medium';
    if (answered >= 1) return 'low';
    return 'unknown';
  }

  // Recompute and cache on profile. Called after onboarding completion + after
  // significant signal events (Aha verdict, save, swap). Idempotent.
  function recomputeProfileStyleScores(profileId) {
    const p = state.profiles?.find(x => x.id === profileId);
    if (!p) return;
    const baseline = deriveStyleScoresFromAnswers(p.answers);
    // Fold in saves: each saved item bumps its primary style at 0.4 weight,
    // decayed by save age (60-day half-life per Dim 07 D8).
    const wishlistMeta = state.wishlistMeta || {};
    Object.entries(wishlistMeta).forEach(([itemId, meta]) => {
      if (meta?.roomIdAtSave && state.rooms) {
        const room = state.rooms.find(r => r.id === meta.roomIdAtSave);
        if (room?.profileId === profileId && Array.isArray(room.styles)) {
          const ageDays = (Date.now() - (meta.savedAt || Date.now())) / (1000 * 60 * 60 * 24);
          const decay = Math.pow(0.5, ageDays / 60);
          const w = 0.4 * decay / Math.max(1, room.styles.length);
          room.styles.forEach(s => { baseline[s] = (baseline[s] || 0) + w; });
        }
      }
    });
    // Fold in Aha verdicts: Love +0.7 weight, Close +0.2, Off -0.5; decayed.
    const ahaHistory = p.ahaHistory || [];
    ahaHistory.forEach(({ verdict, styles, ts }) => {
      const ageDays = (Date.now() - (ts || Date.now())) / (1000 * 60 * 60 * 24);
      const decay = Math.pow(0.5, ageDays / 60);
      const sign = verdict === 'love' ? 0.7 : verdict === 'close' ? 0.2 : verdict === 'off' ? -0.5 : 0;
      const w = sign * decay;
      (styles || []).forEach(s => { baseline[s] = (baseline[s] || 0) + w / Math.max(1, styles.length); });
    });
    // Re-normalize positive entries; floor negatives at 0 (a -0.5 shouldn't
    // persist forever, just suppress in current render).
    const total = Object.values(baseline).filter(v => v > 0).reduce((a, b) => a + b, 0) || 1;
    const normed = {};
    Object.entries(baseline).forEach(([k, v]) => { normed[k] = Math.max(0, v) / total; });
    p.styleScores = normed;
    p.styleConfidence = deriveStyleConfidence(p);
    save();
  }
  window.FurnishRecomputeStyleScores = recomputeProfileStyleScores;

  // [Batch 4 — Dim 07 A.1 row 6 + D6] Aha verdict history with decay.
  function recordAhaVerdict(roomId, verdict) {
    const room = state.rooms?.find(r => r.id === roomId);
    if (!room) return;
    const profile = state.profiles?.find(p => p.id === room.profileId);
    if (!profile) return;
    profile.ahaHistory = profile.ahaHistory || [];
    profile.ahaHistory.push({
      verdict,
      styles: room.styles || [],
      colors: room.colors || [],
      ts: Date.now(),
      roomId
    });
    // Keep last 30 verdicts only — bounded localStorage.
    if (profile.ahaHistory.length > 30) profile.ahaHistory = profile.ahaHistory.slice(-30);
    save();
    recomputeProfileStyleScores(profile.id);
  }
  window.FurnishRecordAhaVerdict = recordAhaVerdict;

  // [Batch 4 — Dim 07 D6] Personalization-quality engagement state.
  // Per Reforge R+E / 04 (Defining Engagement States) — 3-step process:
  // (1) Define core qualitatively, (2) Power/Casual segments, (3) Validate
  // against retention. We compute Casual/Core/Power on rolling Love-rate.
  function personalizationEngagementState(profile) {
    if (!profile) return 'unknown';
    const recent = (profile.ahaHistory || []).slice(-10);
    if (recent.length < 3) return 'unknown';  // not enough signal
    const loveCt = recent.filter(v => v.verdict === 'love').length;
    const offCt  = recent.filter(v => v.verdict === 'off').length;
    const loveRate = loveCt / recent.length;
    if (loveRate >= 0.7) return 'power';
    if (loveRate >= 0.3 || (offCt / recent.length) < 0.4) return 'core';
    return 'casual';  // recommender failing this user — broaden picks
  }
  window.FurnishPersonalizationState = personalizationEngagementState;

  // [Batch 4 — Dim 07 D5] Session-time aggregates for push-timing personalization.
  // Per Engagement Engine Step Three: Path/Real-Estate. We accumulate
  // sessions-by-hour and sessions-by-day-of-week so the (deferred) push
  // sender knows when to fire. Push delivery itself defers per DEFERRED.md
  // item 7; the aggregate ships now and is consumed at backend cutover.
  function logSessionTimeAggregate() {
    if (!state.user) state.user = {};
    state.user._sessionsByHour = state.user._sessionsByHour || new Array(24).fill(0);
    state.user._sessionsByDow  = state.user._sessionsByDow  || new Array(7).fill(0);
    const now = new Date();
    state.user._sessionsByHour[now.getHours()]++;
    state.user._sessionsByDow[now.getDay()]++;
    save();
  }

  function bestPushHour(profile) {
    const hours = state.user?._sessionsByHour;
    if (!hours || !hours.some(h => h > 0)) return 19;  // default 7pm
    return hours.indexOf(Math.max(...hours));
  }
  window.FurnishBestPushHour = bestPushHour;

  // [Batch 4 — Dim 05 Rec 7] Resurrection peak-moment surfacing.
  // Computes the user's most-engaged room (by save-events touching its items
  // + bookmark + reshuffle count). Resurrection campaigns surface this room
  // by name instead of generic style references. Per ICED Theory — Plant
  // Loyalty Hook (R+E / 09 BONUS): peak moments reinforce brand recall.
  function computePeakRoomId() {
    if (!Array.isArray(state.rooms) || !state.rooms.length) return null;
    const scoreByRoom = {};
    state.rooms.forEach(r => {
      let score = 0;
      // Reshuffles signal engagement (even negative — they lingered).
      score += Math.min(5, r.reshuffleCount || 0) * 1;
      // Bookmark signals positive intent.
      if ((state.bookmarkedRooms || []).includes(r.id)) score += 4;
      // Items from this room saved to wishlist.
      const wishMeta = state.wishlistMeta || {};
      Object.values(wishMeta).forEach(m => { if (m?.roomIdAtSave === r.id) score += 1; });
      // Aha verdict on this room.
      const profile = state.profiles?.find(p => p.id === r.profileId);
      const verdict = (profile?.ahaHistory || []).find(h => h.roomId === r.id);
      if (verdict?.verdict === 'love')  score += 5;
      if (verdict?.verdict === 'close') score += 2;
      scoreByRoom[r.id] = score;
    });
    const ranked = Object.entries(scoreByRoom).sort((a, b) => b[1] - a[1]);
    return ranked[0]?.[0] || state.rooms[state.rooms.length - 1].id;
  }
  window.FurnishComputePeakRoom = computePeakRoomId;

  // [Batch 4 — Dim 05 Rec 3] Wishlist-age recall (Loop 4) campaign predicate.
  // Compute the oldest wishlist item's age (days). Used by the new
  // wishlist_age_d90_recall LIFECYCLE_CAMPAIGNS entry. Real send defers
  // to backend (DEFERRED.md item 6); predicate ships now so backend can
  // drain it at cutover.
  function oldestWishlistAgeDays() {
    const meta = state.wishlistMeta || {};
    const wlIds = state.wishlist || [];
    if (!wlIds.length) return 0;
    const ages = wlIds.map(id => {
      const m = meta[id];
      if (!m?.savedAt) return 0;
      return (Date.now() - m.savedAt) / (1000 * 60 * 60 * 24);
    });
    return Math.max(...ages, 0);
  }
  window.FurnishOldestWishlistAge = oldestWishlistAgeDays;

  // [Batch 4 — Dim 07 D5] Variant lifecycle banner copy by saved styles.
  // Per Engagement Engine Step Three: Message is per-user, not per-bucket.
  // The banner is the most-impressed personalization surface in the app;
  // generic copy here is uncaptured value. We pick the user's top style
  // from styleScores + the lifecycle bucket.
  const LIFECYCLE_STYLE_COPY = Object.freeze({
    AT_RISK: {
      'modern':       { title: 'New modern arrivals in your style', body: 'Sharper modern pieces dropped since your last visit.' },
      'scandinavian': { title: 'Fresh scandinavian rooms',          body: 'Light woods, calm palettes — new picks since you were here.' },
      'bohemian':     { title: 'Layered bohemian rooms',            body: 'New textured, lived-in pieces in your style.' },
      'minimalist':   { title: 'Quiet minimalist drops',            body: 'Clean lines, restraint, room to breathe — fresh picks.' },
      'mid-century':  { title: 'New mid-century arrivals',          body: 'Walnut, brass, taper legs — pieces in your style.' },
      'industrial':   { title: 'Steel + leather drops',             body: 'Raw, deliberate pieces in your style.' },
      'farmhouse':    { title: 'Farmhouse warmth',                  body: 'New cozy farmhouse pieces in your style.' },
      'art-deco':     { title: 'Polished art-deco picks',           body: 'Bold geometry + brass — in your style.' },
      _default:       { title: 'New arrivals in your style',        body: 'Fresh pieces dropped since your last visit.' }
    },
    DORMANT: {
      'modern':       { title: 'Your modern style is still saved',   body: 'Some saved pieces dropped in price. New picks added.' },
      'scandinavian': { title: 'Your scandinavian palette is intact', body: 'New light-wood pieces + price drops on saves.' },
      'bohemian':     { title: 'Your bohemian style is here',         body: 'New textured pieces + price drops on saves.' },
      'minimalist':   { title: 'Your minimalist style is intact',     body: 'New clean-line pieces + price drops on saves.' },
      _default:       { title: 'Your style is still saved',           body: "Come back when you're ready to redesign another room." }
    },
    CHURNED: {
      _default: { title: 'Your style is still saved', body: 'Your profile is intact. New pieces added since your last design.' }
    }
  });

  function lifecycleBannerCopyForState(profile, stateKey) {
    const ss = profile?.styleScores || {};
    const top = Object.entries(ss).sort((a, b) => b[1] - a[1])[0]?.[0];
    const bucket = LIFECYCLE_STYLE_COPY[stateKey] || {};
    return bucket[top] || bucket._default || null;
  }
  window.FurnishLifecycleStyleCopy = lifecycleBannerCopyForState;

  // [Batch 4 — Dim 08] K-factor share funnel events.
  // Per Reforge Personal Viral Loops Lesson 2 — K-factor decomposition:
  // each step in the loop is a leak. Without per-step events, no
  // elasticity testing is possible. These are client-side; server-side
  // referral_signup_completed / referral_paid_conversion defer to backend.
  function trackShareFunnel(step, props = {}) {
    if (!state.user) state.user = {};
    state.user._lastShareFunnelStep = step;
    save();
    trackEvent(`share_funnel_${step}`, props);
  }
  window.FurnishTrackShareFunnel = trackShareFunnel;

  // [Batch 4 — Dim 08 / Personal Viral Loop scaffold] Follow stub.
  // UI scaffold only — real social graph defers to backend (new DEFERRED.md
  // item: social-graph + public profile pages). Saves intent so backend can
  // sync later, and surfaces a "you'd be following Hassan" placeholder.
  function followUserStub(userId) {
    if (!userId) return false;
    if (!state.user) state.user = {};
    state.user._followingUserIds = state.user._followingUserIds || [];
    if (state.user._followingUserIds.includes(userId)) return false;
    state.user._followingUserIds.push(userId);
    save();
    trackEvent('follow_intent_recorded', { targetUserId: userId });
    return true;
  }
  window.FurnishFollowUser = followUserStub;

  // [Batch 4 — Dim 05 Rec 2 Option B] Free-user push thin-cadence rule.
  // Free users get permission ask (already-shipped pre-prompt) AND
  // delivery — but limited to top 1-2 highest-impact drops per month.
  // Pro gets full real-time. The rule lives client-side as a flag on
  // the campaign; backend filters at send time per the flag.
  function pushDeliveryTierForUser() {
    if (!state.user) return 'free_thin';
    return state.user.isPro ? 'pro_full' : 'free_thin';
  }
  window.FurnishPushDeliveryTier = pushDeliveryTierForUser;

  // [Batch 4 — Dim 07 D3] Soft budget weighting in pickItemsForRoom.
  // The current picker has a HARD `runningTotal + item.price <= budgetMax`
  // exclusion that filters items outright. Soft weighting lets stretch
  // items still surface (high-commission affiliates) when style + color
  // match strongly. Wired by extending the existing scorer at call time
  // rather than modifying pickItemsForRoom itself (avoids cascade risk).
  function priceFitWeight(itemPrice, budgetMax) {
    if (!itemPrice || !budgetMax || budgetMax === Infinity) return 1.0;
    if (itemPrice <= budgetMax) return 1.0;
    if (itemPrice <= budgetMax * 1.3) return 0.7;
    if (itemPrice <= budgetMax * 1.7) return 0.3;
    return 0.05;
  }
  window.FurnishPriceFitWeight = priceFitWeight;

  // [Batch 4 — Dim 07 D4] customColors sophistication signal.
  // High-fluency users (3+ custom hex) see eclectic / risky rooms first;
  // novice users see safer rooms. Per Reforge UI4PD: segment on domain
  // fluency, not just preference.
  function profileSophistication(profile) {
    const c = (profile?.customColors || []).length;
    if (c >= 3) return 'high';
    if (c >= 1 || profile?.styleConfidence === 'high') return 'medium';
    return 'novice';
  }
  window.FurnishProfileSophistication = profileSophistication;

  // [Batch 4 — Dim 08] Format-specific share canvas dispatcher.
  // The existing drawShareCard renders a single 720x900. Dispatcher adds
  // pin/story/feed/square/reddit variants, each with its own dimensions
  // and watermark behavior. Old drawShareCard remains for backward-compat;
  // new format-aware function lives alongside.
  const SHARE_FORMATS = Object.freeze({
    pin:    { w: 1000, h: 1500, label: 'Pinterest', desc: '2:3 vertical', watermark: 'wordmark' },
    story:  { w: 1080, h: 1920, label: 'IG Story',  desc: '9:16 vertical', watermark: 'wordmark' },
    feed:   { w: 1080, h: 1350, label: 'IG Feed',   desc: '4:5 vertical', watermark: 'wordmark' },
    square: { w: 1024, h: 1024, label: 'Group chat', desc: '1:1 square',  watermark: 'wordmark' },
    reddit: { w: 1600, h: 1200, label: 'Reddit',     desc: '4:3 / no watermark', watermark: 'none' },
  });
  window.FurnishShareFormats = SHARE_FORMATS;

  // [Batch 4 — Dim 08] Lifecycle-aware default share format.
  function defaultShareFormatForLifecycle() {
    const lc = (typeof getLifecycleState === 'function') ? getLifecycleState() : null;
    if (state.user?.isPro && (state.rooms?.length || 0) >= 5) return 'feed';
    if (lc === 'NEW' || (state.rooms?.length || 0) <= 1) return 'square';   // group-chat default
    if ((state.rooms?.length || 0) >= 2) return 'pin';
    return 'square';
  }
  window.FurnishDefaultShareFormat = defaultShareFormatForLifecycle;

  // [Batch 4 — Dim 08 + Dim 05 Rec 7] Pre-filled lifecycle-aware share caption.
  function shareCaptionForLifecycle(room) {
    const profile = state.profiles?.find(p => p.id === room?.profileId);
    const styleNames = (profile?.styles || []).slice(0, 1)
      .map(id => (window.STYLES || []).find(s => s.id === id)?.label || id)
      .join('') || 'your style';
    const roomLabel = (room?.type || 'room').toLowerCase();
    const lc = (typeof getLifecycleState === 'function') ? getLifecycleState() : null;
    if (lc === 'NEW' || (state.rooms?.length || 0) <= 1) {
      // Pull-WOM framing — Reforge Social Viral Loops Lesson 4
      return `Found these for the ${roomLabel}. What do you think?`;
    }
    if (state.user?.isPro && (state.rooms?.length || 0) >= 5) {
      return `${styleNames} ${roomLabel} — designed with Furnish.`;
    }
    return `Just designed my ${roomLabel} in ${styleNames}.`;
  }
  window.FurnishShareCaption = shareCaptionForLifecycle;

  // ============================================================
  // [Batch 6 — Dim 13 REC-13.1 + REC-13.7] WRDCAL + altitude scorecard
  // ============================================================
  // North-star metric: Weekly Returning Designer who Clicked an Affiliate
  // Link. Three-way conjunction encodes the three things Furnish must do
  // simultaneously to be a real business: design, click, return. Per
  // Reforge *Building Your Altitude Scorecard* (Sean Klaus): "looking
  // forward to a year from now, if I only had three or four metrics on my
  // scorecard, and all those metrics have gone up, could I hang my hat
  // on that and say that I've nailed it?" — WRDCAL is that metric.

  const FURNISH_NORTH_STAR = Object.freeze({
    metric: 'WRDCAL',
    label: 'Weekly Returning Designer who Clicked an Affiliate Link',
    definition: 'A unique authenticated user who, within the trailing 7 days, has (a) completed at least one redesign generation that was viewed past the reveal gate AND (b) clicked at least one affiliate link AND (c) had at least one prior session more than 24 hours before either action.',
    cadence: 'daily snapshot, weekly review',
    citations: ['Reforge Building Your Altitude Scorecard L3', 'Reforge Identifying The Altitudes And Outcome Metrics']
  });
  window.FurnishNorthStar = FURNISH_NORTH_STAR;

  // [Batch 6 — Dim 13 REC-13.1] Per-user WRDCAL signal computed from
  // state._events (200-event rolling buffer). Pre-backend, this is the
  // only WRDCAL approximation available; org-wide WRDCAL requires server-
  // side aggregation across users. Returns booleans for each leg + the
  // composite. Used by the dev-only altitude scorecard helper below.
  function computeWRDCALProxy() {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const events = state._events || [];
    const inWindow = events.filter(e => e.ts >= sevenDaysAgo);
    const designed = inWindow.some(e => e.name === 'generation_completed' || e.name === 'analyze_completed' || e.name === 'aha_first_results');
    const revealUnlocked = inWindow.some(e => e.name === 'reveal_gate_unlocked' || e.name === 'aha_first_results');
    const clicked = inWindow.some(e => e.name === 'affiliate_click');
    // Returning: any session_started >24h before any of the actions in window.
    const sessionsInWindow = inWindow.filter(e => e.name === 'session_started').map(e => e.ts);
    const earliestActionTs = Math.min(
      ...inWindow
        .filter(e => e.name === 'generation_completed' || e.name === 'affiliate_click')
        .map(e => e.ts),
      now
    );
    const returning = sessionsInWindow.some(ts => ts <= earliestActionTs - 24 * 60 * 60 * 1000);
    return {
      qualifies: designed && revealUnlocked && clicked && returning,
      designed,
      revealUnlocked,
      clicked,
      returning,
      windowDays: 7
    };
  }
  window.FurnishComputeWRDCAL = computeWRDCALProxy;

  // [Batch 6 — Dim 13 REC-13.6] Per-user altitude scorecard. Computes
  // local-only proxies for the HIGH/MID/LOW altitude metrics from
  // state._events. Org-wide computation requires PostHog (deferred).
  // Surface: window.FurnishAltitudeScorecard(). Returns an object whose
  // keys map 1:1 to the §B altitude map in BATCH_6_AUDIT.md.
  function altitudeScorecard() {
    const events = state._events || [];
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const inWindow = events.filter(e => e.ts >= sevenDaysAgo);
    const c = (name) => inWindow.filter(e => e.name === name).length;
    const ratio = (a, b) => b ? Math.round((a / b) * 1000) / 10 : null; // %
    const wrdcal = computeWRDCALProxy();
    const ahaResults = c('aha_first_results');
    const signups = c('signup_started');
    const generations = c('generation_completed') + c('analyze_completed');
    const affiliateClicks = c('affiliate_click');
    const paywallShown = c('paywall_shown');
    const paywallConverted = c('paywall_converted');
    const revealShown = c('reveal_gate_shown');
    const revealUnlocked = c('reveal_gate_unlocked') + c('aha_first_results');
    const quizStarted = c('quiz_started');
    const quizCompleted = c('quiz_completed');
    const upsellShown = c('premium_quality_upsell_shown');
    const upsellClicked = c('premium_quality_upsell_clicked');
    return {
      generatedAt: now,
      windowDays: 7,
      high: {
        WRDCAL_qualifies: wrdcal.qualifies,
        WRDCAL_legs: { designed: wrdcal.designed, revealUnlocked: wrdcal.revealUnlocked, clicked: wrdcal.clicked, returning: wrdcal.returning },
        activationRatePct: ratio(ahaResults, signups),
        sessionsInWindow: c('session_started')
      },
      mid: {
        affiliateClicks7d: affiliateClicks,
        revealUnlockRatePct: ratio(revealUnlocked, revealShown),
        paywallConversionPct: ratio(paywallConverted, paywallShown),
        premiumUpsellCTRPct: ratio(upsellClicked, upsellShown),
        quizCompletionPct: ratio(quizCompleted, quizStarted),
        generations7d: generations,
        habitFormed: !!state.user?.habitFormed
      },
      low: {
        wishlistAdded7d: c('wishlist_added'),
        priceDropBannerCTRPct: ratio(c('price_drop_banner_clicked'), c('price_drop_banner_shown')),
        homeProgressClicks7d: c('home_progress_cell_clicked'),
        affiliateDisclosureViews7d: c('affiliate_disclosure_viewed'),
        errorsThrown7d: c('error_thrown'),
        errorsShown7d: c('error_shown'),
        screenViews7d: c('screen_viewed'),
        dormancyTransitions7d: c('dormancy_state_changed')
      },
      cohort: {
        lifecycle: state.user?.cachedLifecycle || (typeof getLifecycleState === 'function' ? getLifecycleState() : 'NEW'),
        tier: state.user?.isPro ? 'pro' : 'free',
        grandfathered: !!state.user?.grandfathered
      }
    };
  }
  window.FurnishAltitudeScorecard = altitudeScorecard;

  // [Batch 6 — Dim 13 REC-13.7] Cohort definitions captured in code so
  // the same predicates that drive backend dashboards drive client logic.
  // Per Reforge *Cohort Analysis* L4: every cohort comparison must lock
  // populations, starting point, behavior, time period.
  const COHORT_DEFINITIONS = Object.freeze({
    _conventions: 'For every cohort comparison: lock POPULATIONS, STARTING POINT, BEHAVIOR, TIME PERIOD. Reforge Cohort Analysis L4.',
    D1_new_users:           { startingPoint: 'signup_started', timePeriod: '7d trailing', behavior: 'count distinct user_id' },
    D2_activated:           { startingPoint: 'signup_completed', timePeriod: '7d post-signup', behavior: 'aha_first_results fired' },
    D3_habit_formed:        { startingPoint: 'aha_first_results', timePeriod: '14d', behavior: 'session_started 1-14d post-aha + ≥1 wishlist_added/bookmark_added' },
    D4_at_risk_free:        { startingPoint: 'signup_started', timePeriod: '7-21d', behavior: 'tier=free + generations≤1 + wishlist_count=0' },
    D5_pro_intent:          { startingPoint: 'paywall_shown', timePeriod: 'all-time', behavior: '≥3 paywall_shown + 0 paywall_converted' },
    D6_pro_organic:         { startingPoint: 'pro_subscription_started', timePeriod: 'all-time', behavior: 'tier=pro + grandfathered=false' },
    D7_pro_grandfathered:   { startingPoint: 'grandfatherProUsers boot hook', timePeriod: 'all-time', behavior: 'tier=pro + grandfathered=true' },
    D8_dormant:             { startingPoint: 'last session_started', timePeriod: '30-90d ago', behavior: 'no session in trailing 30d, had ≥1 in trailing 90d' },
    D9_churned:             { startingPoint: 'last session_started', timePeriod: '90+d ago', behavior: 'no session in trailing 90d' },
    D10_power_clickers:     { startingPoint: 'affiliate_click', timePeriod: '30d trailing', behavior: 'top decile by click count' },
    D11_wishlist_heavy:     { startingPoint: 'wishlist_added', timePeriod: 'all-time', behavior: '≥10 distinct wishlist_added' },
    D12_referrers:          { startingPoint: 'referral_link_copied', timePeriod: 'all-time', behavior: '≥1 referral_link_copied' },
    D13_referees:           { startingPoint: 'referral_signup_attributed', timePeriod: 'all-time', behavior: '≥1 referral_signup_attributed' },
    D14_multi_room:         { startingPoint: 'generation_completed', timePeriod: 'all-time', behavior: '≥3 distinct rooms' },
    D15_magic_first_session:{ startingPoint: 'signup_started', timePeriod: '30 minutes', behavior: 'signup + aha + affiliate_click within 30min' }
  });
  window.FurnishCohorts = COHORT_DEFINITIONS;

  // ---------- Boot ----------
  // [Batch 6 — Dim 13 REC-13.3] Global error handler. Captures uncaught
  // JS errors as `error_thrown` failure events. Per Reforge *Building A
  // Structured Event Dictionary*: failure events answer "what prevented
  // the user from completing the success event." Without this, broken
  // builds register as silent funnel drops with no diagnostic signal.
  window.addEventListener('error', (e) => {
    try {
      trackEvent('error_thrown', {
        message: String(e.message || '').slice(0, 200),
        filename: String(e.filename || '').slice(0, 120),
        lineno: e.lineno,
        colno: e.colno,
        surface: typeof _previousScreen === 'string' ? _previousScreen : null
      });
    } catch (_) {}
  });
  window.addEventListener('unhandledrejection', (e) => {
    try {
      const reason = e.reason;
      const message = (reason && reason.message) ? String(reason.message) : String(reason || 'unhandled rejection');
      trackEvent('error_thrown', {
        message: message.slice(0, 200),
        surface: typeof _previousScreen === 'string' ? _previousScreen : null,
        kind: 'unhandled_rejection'
      });
    } catch (_) {}
  });

  function boot() {
    // [Model A — STEP 5 §16 row 1] Tag pre-Model-A Pro users (D6=a) so analytics
    // can split conversion attribution from grandfathered access. Idempotent.
    grandfatherProUsers();
    // [10-Q onboarding migration] Backfill `profile.answers` on any profile
    // that predates the new model so AI-prompt builder + tutorial don't see
    // an empty answers object. Idempotent.
    migrateAllProfiles();
    // [Your Home progress] Backfill state.user.homeProgress.designedRooms
    // from existing state.rooms on first boot after upgrade. Idempotent.
    migrateHomeProgressFromRooms();
    // [Save Home] Migrate from homeProgress.designedRooms[] array →
    // activeHome.designedRooms{} object. Idempotent.
    migrateHomeProgressToActiveHome();
    // [Save Home] Initial badge state at boot. Updated again after every
    // savedHomes/savedRooms mutation via the helpers' save() side effect.
    updateSavedTabBadge();
    syncFreeModeClass();
    touchLastVisit();
    applyWelcomeRecallState();
    // [Compute-quality migration] detectQuotaTamper() removed — no quota,
    // no tamper. Anti-abuse is server-side rate limiting per DEFERRED.md.

    // [Batch 1 additions]
    gcOrphanedWishlist();           // Dim 14 — prune orphan wishlist IDs
    renderPhotoTip();                // Dim 14 — mount photo tip card on capture
    if (state.user?.id || state.user?.email) {
      maybeOfferStateRestore();      // Dim 14 — offer previous-session restore
    }

    // [Batch 2 additions]
    wireSoundToggle();              // Dim 11 D.5 — sound-effects toggle
    wireMarketingPrefsToggle();      // [ToS consent block] Email prefs toggle

    // [Batch 3 additions]
    maybeIncrementSessionCount();   // Dim 04 — session-count for tutorial gate
    wireStickyShopAllCTA();         // Dim 03 R-Bottom2 — sticky shop-all
    maybeFireSessionTwoTutorial();  // Dim 04 R5 / Conflict 7 — defer tutorial
    wireSoftEmailCaptureForm();     // Dim 03 R-Account2 / Conflict 5 — soft email lane

    // [Batch 4 additions]
    logSessionTimeAggregate();      // Dim 07 D5 — push-timing aggregates
    // Recompute styleScores for each profile on boot — keeps the vector
    // fresh based on saves/verdicts since last open. Idempotent.
    (state.profiles || []).forEach(p => recomputeProfileStyleScores(p.id));

    showScreen('welcome');
    startReviewsBar();
    wireCaptureFlow();
  }
  boot();
})();
