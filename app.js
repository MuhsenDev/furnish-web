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
      // Migrate legacy budget enum ('mid'/'lux'/etc.) → number
      (st.profiles || []).forEach(p => {
        if (typeof p.budget === 'string') {
          p.budget = window.BUDGETS_LEGACY?.[p.budget] ?? 3000;
        }
        if (p.budget == null || (typeof p.budget !== 'number' && p.budget !== Infinity)) p.budget = 3000;
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
  // Bottom-nav surfaces (Home / Saved / Profile) per PDR §13.
  const MAIN_SCREENS = new Set(['home', 'saved', 'profile']);

  function showScreen(name) {
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
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => t.classList.remove('show'), 2200);
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
    showScreen(dest);
    if (dest === 'profile-select') renderProfiles();
    if (dest === 'home') renderHome();
    if (dest === 'capture') prepareCapture();
    if (dest === 'templates') renderTemplates();
    if (dest === 'signin') prepareSignin();
    if (dest === 'saved')   renderSaved();
    if (dest === 'profile') renderProfilePage();
  });

  // Welcome "Get Started" → signin (or skip if already signed in).
  document.getElementById('welcomeStartBtn').addEventListener('click', () => {
    if (state.user) {
      showScreen('profile-select');
      renderProfiles();
    } else {
      prepareSignin();
      showScreen('signin');
    }
  });

  // ---------- Sign in ----------
  let signinMode = 'signin'; // or 'signup'

  function prepareSignin() {
    signinMode = 'signin';
    applySigninMode();
    $('#signinEmail').value = '';
    $('#signinPassword').value = '';
    $('#signinName').value = '';
  }

  function applySigninMode() {
    const isSignup = signinMode === 'signup';
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

  $('#signinForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#signinEmail').value.trim();
    const password = $('#signinPassword').value;
    const name = $('#signinName').value.trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { toast('Enter a valid email'); return; }
    if (!password || password.length < 6) { toast('Password must be 6+ characters'); return; }
    if (signinMode === 'signup' && !name) { toast('Enter your name'); return; }

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
        toast(result.error.message || 'Sign in failed');
        return;
      }
      if (!result.user) {
        toast('Check your email to confirm your account');
        return;
      }

      state.user = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.user_metadata?.name || name || email.split('@')[0],
        provider: 'email',
        signedInAt: Date.now()
      };
      save();
      try { await window.furnishBackend.pullAll(state); save(); } catch (err) { console.warn('[Furnish] pull failed', err); }
      toast(signinMode === 'signup' ? `Welcome, ${state.user.name}!` : 'Signed in');
      showScreen('profile-select');
      renderProfiles();
      return;
    }

    // Local-only fallback (no Supabase configured)
    state.user = {
      name: name || email.split('@')[0],
      email,
      provider: 'email',
      signedInAt: Date.now()
    };
    save();
    submitBtn.disabled = false;
    submitBtn.textContent = signinMode === 'signup' ? 'Create account' : 'Sign in';
    toast(signinMode === 'signup' ? `Welcome, ${state.user.name}!` : 'Signed in');
    showScreen('profile-select');
    renderProfiles();
  });

  $$('.signin-social-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const provider = btn.dataset.provider;
      const label = provider === 'google' ? 'Google' : 'Apple';

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
          name: 'Amazon User',
          email: 'amazon.user@furnish.app',
          provider: 'amazon',
          signedInAt: Date.now()
        };
        save();
        toast('Signed in with Amazon');
        showScreen('profile-select');
        renderProfiles();
        return;
      }

      if (window.furnishBackend?.mode === 'supabase' && provider === 'google') {
        const { error } = await window.furnishBackend.auth.signInWithGoogle();
        if (error) toast(error.message || 'Google sign-in failed');
        // Successful OAuth → page redirects to Google → back to here.
        // Session restoration is handled by the auth.onChange listener below.
        return;
      }

      // Local fallback (mock identity)
      state.user = {
        name: `${label} user`,
        email: `${provider}.user@furnish.app`,
        provider,
        signedInAt: Date.now()
      };
      save();
      toast(`Signed in with ${label}`);
      showScreen('profile-select');
      renderProfiles();
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
      state.user = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || (user.email || '').split('@')[0],
        provider: user.app_metadata?.provider || 'email',
        signedInAt: Date.now()
      };
      try { await window.furnishBackend.pullAll(state); } catch (err) { console.warn('[Furnish] pull failed', err); }
      save();
      // If we just came back from an OAuth redirect, hop to profile-select.
      if (!wasSignedIn && document.querySelector('.screen.active')?.dataset?.screen === 'welcome') {
        showScreen('profile-select');
        renderProfiles();
      } else if (document.querySelector('.screen.active')?.dataset?.screen === 'profile-select') {
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
          if (window.furnishBackend?.mode === 'supabase') {
            await window.furnishBackend.auth.signOut().catch(()=>{});
          }
          state.user = null;
          save();
          prepareSignin();
          showScreen('signin');
          toast('Sign in to switch');
          break;
        case 'furnish-plus':
          openPaywall('generic');
          break;
        case 'support':
          openSupportModal();
          break;
        case 'signout':
          if (!confirm('Sign out? Your profiles stay on this device.')) return;
          if (window.furnishBackend?.mode === 'supabase') {
            await window.furnishBackend.auth.signOut().catch(()=>{});
          }
          state.user = null;
          save();
          toast('Signed out');
          showScreen('welcome');
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
      toast('FAQ coming soon — you\'re early!');
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

    if (state.profiles.length === 0) {
      for (let i = 1; i <= 4; i++) {
        state.profiles.push({ id:'p'+i, name:'Profile '+i, styles:[], colors:[], customColors:[], budget:'mid' });
      }
      save();
    }

    state.profiles.forEach((p, idx) => {
      const card = document.createElement('div');
      card.className = 'profile-card' + (state.activeProfileId === p.id ? ' selected' : '');
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
      card.innerHTML = `
        <button class="profile-edit-btn" aria-label="Rename" title="Rename">✎</button>
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
        state.activeProfileId = p.id;
        save();
        if (p.styles.length === 0) {
          openQuizIntro(p.id);
        } else {
          openPreferences(p.id);
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
    const p = { id:'p'+Date.now(), name:'Profile '+n, styles:[], colors:[], customColors:[], budget:'mid' };
    state.profiles.push(p);
    save();
    renderProfiles();
  });

  // ---------- Paywall ----------
  // Per Reforge Convert And Activate (p.4): context-aware pricing page.
  const PAYWALL_COPY = {
    redesign: {
      title: 'Design rooms without limits',
      sub: "You've used your free redesigns. Join 12,000+ members redesigning with Furnish.",
    },
    profile: {
      title: 'One Furnish for every person',
      sub: 'Give every person in your home their own taste profile — partners, roommates, kids.',
    },
    export: {
      title: 'Export your room in HD',
      sub: 'Ready-to-post kits for Instagram, Pinterest, and TikTok.',
    },
    generic: {
      title: 'Unlock Furnish Pro',
      sub: 'Unlimited redesigns, HD exports, and every style profile your household needs.',
    },
  };

  function openPaywall(context = 'generic') {
    const copy = PAYWALL_COPY[context] || PAYWALL_COPY.generic;
    const titleEl = $('#paywallTitle');
    const subEl = $('#paywallSub');
    if (titleEl) titleEl.textContent = copy.title;
    if (subEl) subEl.textContent = copy.sub;
    const m = $('#paywallModal');
    m.dataset.context = context;
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
  }
  function closePaywall() {
    const m = $('#paywallModal');
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
  }

  // Monthly ↔ Annual toggle (anchor per Figma critique, Convert p.4)
  $$('.pw-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.pw-toggle-btn').forEach(b => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      const annual = btn.dataset.plan === 'annual';
      const priceEl = $('#paywallPrice');
      const unitEl = $('#paywallUnit');
      if (priceEl) priceEl.textContent = annual ? '$4.08' : '$7.99';
      if (unitEl) unitEl.textContent = annual ? '/month, billed annually ($49/yr)' : '/month';
    });
  });

  $('#paywallClose').addEventListener('click', closePaywall);
  $('#paywallDismiss').addEventListener('click', closePaywall);
  $('#paywallCta').addEventListener('click', () => {
    // TODO: wire to Stripe/RevenueCat. For now, mock Pro to unblock flow testing.
    if (!state.user) state.user = {};
    state.user.isPro = true;
    save();
    toast("Welcome to Furnish Pro — 7-day trial started");
    closePaywall();
    if (typeof renderProfilePage === 'function') renderProfilePage();
  });
  $('#paywallModal').addEventListener('click', e => {
    if (e.target.id === 'paywallModal') closePaywall();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('#paywallModal').classList.contains('open')) closePaywall();
  });

  // ---------- Style quiz ----------
  function openQuizIntro(profileId) {
    const p = state.profiles.find(x => x.id === profileId);
    $('#quizIntroTitle').textContent = `${p.name} — let's find your style`;
    state.quiz = { profileId, step: 0, scores: {}, answers: [] };
    save();
    showScreen('quiz-intro');
  }

  $('#startQuizBtn').addEventListener('click', () => {
    renderQuizStep();
    showScreen('quiz');
  });
  $('#skipQuizBtn').addEventListener('click', () => {
    state.quiz = null;
    save();
    openPreferences(state.activeProfileId);
  });
  $('#quizBackBtn').addEventListener('click', () => {
    if (!state.quiz) { showScreen('profile-select'); return; }
    if (state.quiz.step === 0) { showScreen('quiz-intro'); return; }
    state.quiz.step--;
    state.quiz.answers.pop();
    renderQuizStep();
  });

  // "None of these suit me" — skips this question without scoring it.
  $('#quizNoneBtn').addEventListener('click', () => {
    if (!state.quiz) return;
    state.quiz.answers.push(-1);
    state.quiz.step++;
    if (state.quiz.step >= window.QUIZ.length) finishQuiz();
    else renderQuizStep();
  });

  function renderQuizStep() {
    if (!state.quiz) return;
    const q = window.QUIZ[state.quiz.step];
    $('#quizProgress').textContent = `${state.quiz.step + 1} / ${window.QUIZ.length}`;
    $('#quizQuestion').textContent = q.q;
    const opts = $('#quizOptions');
    opts.innerHTML = '';
    const kind = q.kind || 'photo';
    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-card' + (kind !== 'photo' ? ' q-non-photo' : '');
      btn.style.setProperty('--stagger-i', idx);
      let visual = '';
      if (kind === 'palette') {
        visual = `<div class="qoc-palette"><span style="background:${opt.colors[0]}"></span><span style="background:${opt.colors[1]}"></span></div>`;
      } else if (kind === 'icon') {
        visual = `<div class="qoc-icon">${window.QUIZ_SVGS[opt.svg] || ''}</div>`;
      } else if (kind === 'face') {
        visual = `<div class="qoc-face">${window.QUIZ_SVGS[opt.face] || ''}</div>`;
      } else {
        visual = `<div class="qoc-photo" style="background-image:url('${opt.image}')"></div>`;
      }
      btn.innerHTML = `
        ${visual}
        <div class="qoc-label"><span class="qoc-label-text">${opt.label}</span></div>
      `;
      btn.addEventListener('click', () => {
        opts.querySelectorAll('.quiz-option-card').forEach(c => c.classList.remove('selected'));
        btn.classList.add('selected');
        setTimeout(() => selectQuizOption(idx), 240);
      });
      opts.appendChild(btn);
    });
  }

  function selectQuizOption(idx) {
    const q = window.QUIZ[state.quiz.step];
    const chosen = q.options[idx];
    chosen.styles.forEach(s => {
      state.quiz.scores[s] = (state.quiz.scores[s] || 0) + 1;
    });
    state.quiz.answers.push(idx);
    state.quiz.step++;

    if (state.quiz.step >= window.QUIZ.length) {
      finishQuiz();
    } else {
      renderQuizStep();
    }
  }

  function finishQuiz() {
    const top = Object.entries(state.quiz.scores).sort((a,b) => b[1]-a[1]).slice(0,3).map(([s]) => s);
    const p = state.profiles.find(x => x.id === state.quiz.profileId);
    if (p) {
      p.styles = top;
      p.seenFinale = true; // quiz counts as the finale moment
      save();
    }
    state.quiz = null;
    save();
    // Play the "furniture rain → pop → congrats" finale, then route to preferences.
    playQuizFinale(top, () => openPreferences(state.activeProfileId));
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
    const COUNT = Math.min(240, Math.max(140, Math.floor((W * H) / 4800)));
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
    $('#prefTitle').textContent = `${p.name} — preferences`;

    // Wire up the editable name input on the profile card
    const nameInput = document.getElementById('ppNameInput');
    if (nameInput) {
      nameInput.value = p.name || '';
      nameInput.oninput = () => {
        const v = nameInput.value.trim();
        if (v) {
          p.name = v;
          $('#prefTitle').textContent = `${v} — preferences`;
          const initEl = document.getElementById('ppInitials');
          if (initEl) initEl.textContent = (v.match(/\d+|\S/) || ['?'])[0];
        }
      };
      nameInput.onchange = () => { save(); };
      nameInput.onblur   = () => { save(); };
    }

    setupProfilePicture(p);
    renderChipGrid('#stylesGrid', window.STYLES, p.styles, true, ids => { p.styles = ids; save(); });
    renderColorChips(p);
    renderCustomColorList(p);
    setupBudgetSlider(p);

    showScreen('preferences');
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
      if (!file.type.startsWith('image/')) { toast('Pick an image file'); return; }
      if (file.size > 12 * 1024 * 1024) { toast('Image too large (12MB max)'); return; }
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

  // ---------- Budget slider (log-scale $50 → $10,000+) ----------
  function sliderToBudget(v) {
    const t = Math.max(0, Math.min(1000, v)) / 1000;
    // Reserve the final 0.5% of the slider for "no limit" / $10,000+
    if (t >= 0.995) return Infinity;
    const scaled = t / 0.995;
    const lo = Math.log(window.BUDGET_MIN);
    const hi = Math.log(window.BUDGET_MAX);
    const raw = Math.exp(lo + (hi - lo) * scaled);
    // Round to friendlier numbers based on magnitude.
    if (raw < 200)  return Math.max(window.BUDGET_MIN, Math.round(raw / 10) * 10);
    if (raw < 1000) return Math.round(raw / 25) * 25;
    if (raw < 5000) return Math.round(raw / 100) * 100;
    return Math.round(raw / 250) * 250;
  }
  function budgetToSlider(amount) {
    if (!amount || amount === Infinity) return 1000;
    const lo = Math.log(window.BUDGET_MIN);
    const hi = Math.log(window.BUDGET_MAX);
    const t = (Math.log(Math.max(window.BUDGET_MIN, amount)) - lo) / (hi - lo);
    return Math.round(Math.max(0, Math.min(1, t)) * 0.995 * 1000);
  }
  function formatBudget(amount) {
    if (amount == null) return '—';
    if (amount === Infinity || amount >= window.BUDGET_MAX) return '$10,000+';
    return '$' + amount.toLocaleString();
  }
  function setupBudgetSlider(profile) {
    const slider = $('#budgetSlider');
    const display = $('#budgetAmount');
    const initial = budgetToSlider(profile.budget);
    slider.value = initial;
    paintBudgetTicks();
    const paint = () => {
      const amount = sliderToBudget(+slider.value);
      display.textContent = formatBudget(amount);
      slider.style.setProperty('--pct', ((slider.value / 1000) * 100).toFixed(1) + '%');
      profile.budget = amount;
    };
    paint();
    slider.oninput = () => { paint(); };
    slider.onchange = () => { save(); };
  }

  // Render tick labels positioned at their actual log-scale slider %.
  function paintBudgetTicks() {
    const container = document.querySelector('.budget-ticks');
    if (!container) return;
    container.innerHTML = '';
    const points = [
      { v: 50,       label: '$50' },
      { v: 500,      label: '$500' },
      { v: 2000,     label: '$2k' },
      { v: 5000,     label: '$5k' },
      { v: Infinity, label: '$10k+' }
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

  $('#addCustomColorBtn').addEventListener('click', () => {
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
    if (p.styles.length === 0) { toast('Pick at least one style'); return; }
    // First-time save for this profile (whether they used the quiz or not):
    // play the same finale so every profile gets the "locked in" moment.
    if (!p.seenFinale) {
      p.seenFinale = true;
      save();
      playQuizFinale(p.styles, () => { showScreen('home'); renderHome(); });
      return;
    }
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
  function renderHome() {
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

    renderCollections();
    renderRoomsGrid();
    renderHomeSavedItems();
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
    ids.slice(0, 12).forEach(id => {
      const item = window.FURNITURE_DB.find(i => i.id === id);
      if (!item) return;
      const card = document.createElement('button');
      card.className = 'saved-mini';
      card.innerHTML = `
        <div class="saved-mini-thumb">${item.icon}</div>
        <div class="saved-mini-name">${item.name}</div>
        <div class="saved-mini-price">$${item.price.toLocaleString()}</div>
      `;
      card.addEventListener('click', () => openItemSheet(item, null));
      strip.appendChild(card);
    });
  }

  // ---------- Saved screen (Rooms + Items sub-tabs) ----------
  function renderSaved() {
    // Counts
    const rooms = state.rooms.filter(r => r.profileId === state.activeProfileId);
    const items = state.wishlist || [];
    $('#stRoomsCount').textContent = rooms.length;
    $('#stItemsCount').textContent = items.length;

    // Default to whichever sub-tab is currently active
    const active = document.querySelector('.st-tab.active')?.dataset?.st || 'rooms';
    showSavedPane(active);
  }

  function showSavedPane(which) {
    document.querySelectorAll('.st-tab').forEach(t => {
      const on = t.dataset.st === which;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    $('#savedRoomsPane').style.display = which === 'rooms' ? '' : 'none';
    $('#savedItemsPane').style.display = which === 'items' ? '' : 'none';
    if (which === 'rooms') renderSavedRooms();
    else renderSavedItems();
  }

  function renderSavedRooms() {
    const grid = $('#savedRoomsGrid');
    grid.innerHTML = '';
    const rooms = state.rooms.filter(r => r.profileId === state.activeProfileId);
    if (rooms.length === 0) {
      grid.innerHTML = emptyStateHTML({
        icon: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14V12a3 3 0 013-3h12a3 3 0 013 3v2"/><path d="M2 14h20v5H2z"/><path d="M5 19v2M19 19v2"/></svg>',
        title: 'No Saved Rooms',
        body: 'Every redesign you create is saved here automatically.',
        cta: 'Design My Room',
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

    // Pro card
    const pro = $('#profileProCard');
    const isPro = !!user.isPro;
    pro.classList.toggle('is-pro', isPro);
    if (isPro) {
      $('#profileProTitle').textContent = 'Furnish+ active';
      $('#profileProSub').textContent = 'Unlimited redesigns, swaps, and exports';
      $('#profileProBtn').textContent = 'Manage';
    } else {
      const used = user.redesignsUsed || 0;
      const remaining = Math.max(0, FREE_REDESIGN_LIMIT - used);
      $('#profileProTitle').textContent = 'Free plan';
      $('#profileProSub').textContent = remaining > 0
        ? `${remaining} free redesign${remaining === 1 ? '' : 's'} left — upgrade anytime`
        : 'Free redesigns used — upgrade for unlimited';
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
      if (window.furnishBackend?.mode === 'supabase') await window.furnishBackend.auth.signOut().catch(()=>{});
      state.user = null;
      save();
      prepareSignin();
      showScreen('signin');
      toast('Sign in to switch');
    } else if (action === 'signout') {
      if (!confirm('Sign out? Your profiles stay on this device.')) return;
      if (window.furnishBackend?.mode === 'supabase') await window.furnishBackend.auth.signOut().catch(()=>{});
      state.user = null;
      save();
      toast('Signed out');
      showScreen('welcome');
    } else if (action === 'reset') {
      if (!confirm('Reset this profile? Styles, colors, budget, and avatar will clear. Saved rooms stay.')) return;
      const p = getActiveProfile();
      if (!p) { toast('No active profile'); return; }
      p.styles = [];
      p.colors = [];
      p.customColors = [];
      p.budget = 3000;
      p.avatar = null;
      save();
      renderProfilePage();
      toast('Profile reset');
    }
  });

  // Click avatar in profile page → re-use the photo source modal
  document.getElementById('profilePageAvatar').addEventListener('click', () => {
    const p = getActiveProfile();
    if (!p) return;
    openPhotoSourceModal(p, () => renderProfilePage());
  });

  function buildCollectionCard(c) {
    const card = document.createElement('div');
    card.className = 'collection-card';
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

  function renderCollections() {
    const SEASON_IDS = new Set(['spring','summer','autumn','winter']);
    const seasons  = window.COLLECTIONS.filter(c =>  SEASON_IDS.has(c.id));
    const trending = window.COLLECTIONS.filter(c => !SEASON_IDS.has(c.id));

    buildMarquee(document.getElementById('collectionsStrip'), seasons);
    buildMarquee(document.getElementById('trendingStrip'),    trending);
  }

  function applyCollection(c) {
    const p = getActiveProfile();
    if (!p) return;
    p.styles = c.styles.slice();
    p.colors = c.colors.slice();
    save();
    toast(`Applied "${c.label}" to ${p.name}`);
    renderProfiles();
  }

  function renderRoomsGrid() {
    const grid = $('#roomsGrid');
    const rooms = state.rooms.filter(r => r.profileId === state.activeProfileId);
    grid.innerHTML = '';
    if (rooms.length === 0) {
      grid.innerHTML = emptyStateHTML({
        icon: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14V12a3 3 0 013-3h12a3 3 0 013 3v2"/><path d="M2 14h20v5H2z"/><path d="M5 19v2M19 19v2"/></svg>',
        title: 'No Rooms Yet',
        body: 'Snap a photo of a room and Furnish redesigns it in your style.',
        cta: 'Design My Room',
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

  $('#switchProfileBtn').addEventListener('click', () => {
    showScreen('profile-select');
    renderProfiles();
  });

  $('#wishlistBtn').addEventListener('click', () => {
    renderWishlist();
    showScreen('wishlist');
  });

  // ---------- Templates ----------
  function renderTemplates() {
    const grid = $('#templatesGrid');
    grid.innerHTML = '';
    window.ROOM_TEMPLATES.forEach((t, idx) => {
      const card = document.createElement('button');
      card.className = 'template-card';
      card.style.setProperty('--stagger-i', idx);
      const photoStyle = t.image ? `background-image:url('${t.image}');` : '';
      card.innerHTML = `
        <div class="t-photo" style="${photoStyle}"></div>
        <div class="t-body">
          <div class="template-icon">${t.icon}</div>
          <div class="t-label">${t.label}</div>
          <div class="t-sub">${titleRoom(t.type)} · ${t.dims.w}×${t.dims.l} ft</div>
        </div>
      `;
      card.addEventListener('click', () => startFromTemplate(t));
      grid.appendChild(card);
    });
  }

  function startFromTemplate(t) {
    const p = getActiveProfile();
    if (!p) { toast('Pick a profile first'); return; }
    if (!canRedesign()) { openPaywall('redesign'); return; }
    state.draft = {
      photo: placeholderImageFor(t.type),
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
      const room = buildRoomFromDraft(t.styles, t.colors);
      state.rooms.push(room);
      state.draft = null;
      incrementRedesignCount();
      save();
      openRoom(room.id);
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
    const p = getActiveProfile();
    if (!p || p.styles.length === 0) {
      toast('Set a profile first');
      showScreen('profile-select');
      renderProfiles();
      return;
    }
    state.draft = state.draft || { photo: null, type: 'living', dims: { w:12, l:14, h:9 }, keep: true };
    // Backfill any missing fields for partial/legacy drafts
    if (!state.draft.dims) state.draft.dims = { w:12, l:14, h:9 };
    if (state.draft.dims.w == null) state.draft.dims.w = 12;
    if (state.draft.dims.l == null) state.draft.dims.l = 14;
    if (state.draft.dims.h == null) state.draft.dims.h = 9;
    if (state.draft.type == null) state.draft.type = 'living';
    // Legacy drafts with keep: [] → normalize to boolean
    if (Array.isArray(state.draft.keep)) state.draft.keep = state.draft.keep.length > 0;

    $('#photoPreview').src = state.draft.photo || '';
    $('#photoPreview').classList.toggle('has-image', !!state.draft.photo);
    $('.photo-frame .placeholder').classList.toggle('hidden', !!state.draft.photo);

    $('#dimW').value = state.draft.dims.w;
    $('#dimL').value = state.draft.dims.l;
    $('#dimH').value = state.draft.dims.h;

    renderRoomTypeCards();
    setupKeepToggle();
    refreshAnalyzeBtn();
  }

  function setupKeepToggle() {
    const box = $('#keepToggle');
    if (!box) return;
    const setSelected = (val) => {
      box.querySelectorAll('.yesno-btn').forEach(b => {
        b.setAttribute('aria-selected', b.dataset.val === val ? 'true' : 'false');
      });
    };
    setSelected(state.draft.keep ? 'yes' : 'no');
    box.querySelectorAll('.yesno-btn').forEach(btn => {
      btn.onclick = () => {
        const val = btn.dataset.val;
        state.draft.keep = (val === 'yes');
        save();
        setSelected(val);
      };
    });
  }

  function refreshAnalyzeBtn() {
    // Photo is recommended but not required — always allow designing
    $('#analyzeBtn').disabled = false;
  }

  function renderRoomTypeCards() {
    const grid = $('#roomTypeGrid');
    grid.innerHTML = '';
    window.ROOM_TYPES.forEach((rt, idx) => {
      const card = document.createElement('button');
      card.className = 'rt-card' + (state.draft?.type === rt.id ? ' selected' : '');
      card.style.setProperty('--stagger-i', idx);
      card.setAttribute('aria-pressed', state.draft?.type === rt.id ? 'true' : 'false');
      const iconSvg = window.ROOM_TYPE_SVGS?.[rt.id] || '';
      card.innerHTML = `
        <span class="rt-icon">${iconSvg}</span>
        <span class="rt-label">${rt.label}</span>
      `;
      card.addEventListener('click', () => {
        state.draft.type = rt.id;
        refreshAnalyzeBtn();
        renderRoomTypeCards();
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
  $('#analyzeBtn').addEventListener('click', async () => {
    if (!state.draft?.photo) return;
    // Premium gate: first redesign is free, then upsell (PDR §12).
    if (!canRedesign()) { openPaywall('redesign'); return; }
    showScreen('analyzing');
    await runAnalyzerAnimation();
    const room = buildRoomFromDraft();
    state.rooms.push(room);
    state.draft = null;
    incrementRedesignCount();
    save();
    openRoom(room.id);
  });

  // Free tier = 3 redesigns (lets the habit moment land per Reforge Convert p.6–10).
  // Pro = unlimited.
  const FREE_REDESIGN_LIMIT = 3;
  function canRedesign() {
    if (state.user?.isPro) return true;
    const used = state.user?.redesignsUsed || 0;
    return used < FREE_REDESIGN_LIMIT;
  }
  function incrementRedesignCount() {
    if (!state.user) state.user = {};
    state.user.redesignsUsed = (state.user.redesignsUsed || 0) + 1;
  }

  async function runAnalyzerAnimation() {
    const steps = $$('#loaderSteps li');
    steps.forEach(s => s.classList.remove('active','done'));
    const durations = [700, 900, 1000, 800];
    for (let i = 0; i < steps.length; i++) {
      steps[i].classList.add('active');
      await sleep(durations[i] || 700);
      steps[i].classList.remove('active');
      steps[i].classList.add('done');
    }
    await sleep(180);
  }

  function buildRoomFromDraft(styleOverride, colorOverride) {
    const draft = state.draft;
    const profile = getActiveProfile();
    const styles = styleOverride || profile.styles;
    const colors = colorOverride || profile.colors;
    const keepMode = draft.keep === true;
    const picked = pickItemsForRoom(draft, styles, colors, profile.budget, { keepMode });
    const room = {
      id: 'r'+Date.now(),
      profileId: profile.id,
      type: draft.type,
      photo: draft.photo,
      dims: draft.dims,
      items: picked,
      keepMode,
      versions: [],
      activeVersion: null,
      createdAt: Date.now(),
      fromTemplate: draft.fromTemplate || null
    };
    // Seed v1 snapshot.
    room.versions.push({
      id: 'v'+Date.now(),
      items: picked.slice(),
      styles: styles.slice(),
      colors: (colors||[]).slice(),
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
  function pickItemsForRoom(draft, styleIds, colorIds, budgetVal, opts = {}) {
    const allSlots = window.ROOM_SLOTS[draft.type] || [];
    // When the user wants to KEEP existing pieces, skip big furniture (sofa, bed,
    // desk, dining table, bathroom vanity, etc.) and lean into accents only.
    const heavySlots = new Set(['sofa','bed','table','desk','furniture','nightstand']);
    const slots = opts.keepMode === true
      ? allSlots.filter(s => !heavySlots.has(s))
      : allSlots;
    const styleSet = new Set(styleIds || []);
    const colorSet = new Set(colorIds || []);
    const budgetMax = budgetVal === Infinity ? Infinity : (typeof budgetVal === 'number' && budgetVal > 0 ? budgetVal : 3000);

    const area = (draft.dims.w||0) * (draft.dims.l||0);
    const sizeBonus = area >= 220 ? 2 : area >= 150 ? 1 : 0;

    const excludeIds = new Set(opts.excludeIds || []);
    const anchorColor = opts.anchorColor || null;

    const candidates = window.FURNITURE_DB.filter(i =>
      i.roomTypes.includes(draft.type) && !excludeIds.has(i.id)
    );

    const scored = candidates.map(item => {
      const styleHit = item.styles.filter(s => styleSet.has(s)).length;
      const colorHit = item.colors.filter(c => colorSet.has(c)).length;
      const styleScore = styleSet.size ? styleHit / styleSet.size : 0.5;
      const colorScore = colorSet.size ? colorHit / colorSet.size : 0.5;
      let score = styleScore*0.65 + colorScore*0.25 + Math.random()*0.1;
      if (anchorColor && item.accent) score += colorDistance(anchorColor, item.accent) < 60 ? 0.2 : 0;
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
    const extras = scored.filter(({ item }) => !usedIds.has(item.id) && ['decor','plant','lighting'].includes(item.type));
    for (let i = 0; i < sizeBonus && i < extras.length; i++) {
      const e = extras[i].item;
      if (runningTotal + e.price > budgetMax) break;
      picked.push(e);
      usedIds.add(e.id);
      runningTotal += e.price;
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
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) return;
    currentRoomId = roomId;
    const profile = state.profiles.find(p => p.id === room.profileId);

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

    renderPriceTags(room);
    renderPalette(room);
    renderItemsList(room);
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
        openItemSheet(item, room);
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
    // Placeholder for future AI-driven rearrangement — when the image generation
    // backend is wired up, this will request a re-render with the new spatial layout.
    toast('Rearrange will use AI to regenerate this room — coming soon');
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

  function renderItemsList(room) {
    const list = $('#itemsList');
    list.innerHTML = '';
    const roomArea = (room.dims.w || 0) * (room.dims.l || 0);
    const usedFootprint = room.items.reduce((s,i) => s + (window.ITEM_FOOTPRINTS[i.type] || 0), 0);

    room.items.forEach(item => {
      const fp = window.ITEM_FOOTPRINTS[item.type] || 0;
      const fits = usedFootprint <= roomArea * 0.45 || fp <= roomArea * 0.25;
      const card = document.createElement('div');
      card.className = 'item-card' + (item.owned ? ' owned' : '');
      card.id = 'item-'+item.id;
      const onWishlist = state.wishlist.includes(item.id);
      const alertOn = state.priceAlerts[item.id];

      card.innerHTML = `
        <div class="item-thumb">${item.icon}</div>
        <div class="item-body">
          <div class="name">${item.name}</div>
          <div class="desc">${item.description}</div>
          <div class="meta">
            ${item.owned ? '<span class="tag source">Owned</span>' : `<span class="tag source">${sourceLabel(item.source)}</span>`}
            <span class="tag">${item.type}</span>
            ${!fits ? '<span class="tag warn">⚠ may not fit</span>' : ''}
            <span class="price">${item.owned ? '—' : '$'+item.price.toLocaleString()}</span>
          </div>
        </div>
        ${item.owned ? '' : `
        <div class="item-actions">
          <a class="item-action-btn link-style" href="${item.url}" target="_blank" rel="noopener noreferrer">Shop</a>
          <button class="item-action-btn ${onWishlist ? 'active' : ''}" data-act="wish">${onWishlist ? `<svg viewBox='0 0 24 24' width='14' height='14' fill='currentColor' style='vertical-align:-2px;margin-right:4px'><path d='M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6C19 16.5 12 21 12 21z'/></svg>Saved` : `<svg viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-2px;margin-right:4px'><path d='M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6C19 16.5 12 21 12 21z'/></svg>Save`}</button>
          <button class="item-action-btn" data-act="swap">⇄ Swap</button>
          <button class="item-action-btn ${alertOn ? 'active' : ''}" data-act="alert">${alertOn ? `<svg viewBox='0 0 24 24' width='14' height='14' fill='currentColor' style='vertical-align:-2px;margin-right:4px'><path d='M12 2a2 2 0 012 2v1.2A6 6 0 0118 11v3l1.5 2H4.5L6 14v-3a6 6 0 014-5.8V4a2 2 0 012-2zM10 19h4a2 2 0 01-4 0z'/></svg>On` : `<svg viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-2px;margin-right:4px'><path d='M18 14v-3a6 6 0 00-12 0v3l-1.5 2h15z'/><path d='M10 19a2 2 0 004 0'/><path d='M3 3l18 18' stroke-width='2'/></svg>Alert`}</button>
        </div>`}
      `;
      card.querySelector('[data-act="wish"]')?.addEventListener('click', e => { e.stopPropagation(); toggleWishlist(item); });
      card.querySelector('[data-act="swap"]')?.addEventListener('click', e => { e.stopPropagation(); swapItem(room, item); });
      card.querySelector('[data-act="alert"]')?.addEventListener('click', e => { e.stopPropagation(); togglePriceAlert(item); });
      // Tap anywhere else on the card → open the item sheet
      if (!item.owned) {
        card.addEventListener('click', e => {
          if (e.target.closest('button, a')) return;
          openItemSheet(item, room);
        });
      }
      list.appendChild(card);
    });
  }

  function toggleWishlist(item) {
    const idx = state.wishlist.indexOf(item.id);
    if (idx >= 0) { state.wishlist.splice(idx, 1); toast('Removed from wishlist'); }
    else { state.wishlist.push(item.id); toast('Saved to wishlist'); }
    save();
    const room = state.rooms.find(r => r.id === currentRoomId);
    if (room) renderItemsList(room);
  }

  function togglePriceAlert(item) {
    state.priceAlerts[item.id] = !state.priceAlerts[item.id];
    if (!state.priceAlerts[item.id]) delete state.priceAlerts[item.id];
    save();
    toast(state.priceAlerts[item.id] ? "We'll notify you on price drops" : 'Alerts off');
  }

  function swapItem(room, item) {
    const idx = room.items.findIndex(i => i.id === item.id);
    if (idx < 0) return;
    // Find next best match for the same slot, excluding items already in room.
    const excludeIds = room.items.map(i => i.id);
    const draftLike = { type: room.type, dims: room.dims, keep: [] };
    const candidates = window.FURNITURE_DB
      .filter(i => i.type === item.type && i.roomTypes.includes(room.type) && !excludeIds.includes(i.id));
    if (candidates.length === 0) { toast('No alternate picks for this slot'); return; }
    // score and pick
    const styleSet = new Set(profile.styles), colorSet = new Set(profile.colors);
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
    const v = {
      id: 'v'+Date.now()+Math.random().toString(36).slice(2,5),
      items: room.items.slice(),
      styles: (profile?.styles || []).slice(),
      colors: (profile?.colors || []).slice(),
      note,
      timestamp: Date.now()
    };
    room.versions = room.versions || [];
    room.versions.push(v);
    // Cap at 6 versions to keep UI tidy.
    if (room.versions.length > 6) room.versions.shift();
    room.activeVersion = v.id;
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
    const idx = state.bookmarkedRooms.indexOf(room.id);
    if (idx >= 0) { state.bookmarkedRooms.splice(idx, 1); toast('Removed from saved'); }
    else { state.bookmarkedRooms.push(room.id); toast('Room saved'); }
    save();
    refreshBookmarkBtn(room);
  });

  $('#reshuffleBtn').addEventListener('click', () => {
    const draftLike = { type: room.type, dims: room.dims };
    const fresh = pickItemsForRoom(draftLike, profile.styles, profile.colors, profile.budget,
      { excludeIds: [], anchorColor: activeAnchorColor, keepMode: !!room.keepMode });
    room.items = fresh;
    pushVersion(room, activeAnchorColor ? 'Reshuffled (color anchored)' : 'Reshuffled picks');
    save();
    renderRoomPieces(room);
    renderVersions(room);
    toast('Fresh picks curated');
  });

  $('#shopAllBtn').addEventListener('click', () => {
    const purchaseable = room.items.filter(i => !i.owned);
    toast(`Opening ${purchaseable.length} affiliate tabs…`);
    purchaseable.forEach((i, idx) => setTimeout(() => window.open(i.url, '_blank', 'noopener'), idx * 120));
  });

  // ---------- Before/after slider drag ----------
  function setSliderPct(pct) {
    pct = Math.max(0, Math.min(100, pct));
    $('#baAfterLayer').style.clipPath = `inset(0 0 0 ${pct}%)`;
    $('#baHandle').style.left = pct + '%';
  }

  (() => {
    const slider = $('#baSlider');
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
      onMove(e);
      e.preventDefault();
    };
    slider.addEventListener('mousedown', start);
    slider.addEventListener('touchstart', start, { passive: false });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', () => dragging = false);
    document.addEventListener('touchend', () => dragging = false);
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
      list.innerHTML = `<div class="empty-state"><div class="empty-art"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6C19 16.5 12 21 12 21z"/></svg></div><p>No saved items yet.</p></div>`;
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
  $('#shareRoomBtn').addEventListener('click', () => openShareModal());
  $('#shareClose').addEventListener('click', () => $('#shareModal').classList.remove('open'));
  $('#shareModal').addEventListener('click', e => { if (e.target.id === 'shareModal') $('#shareModal').classList.remove('open'); });

  function openShareModal() {
    const room = state.rooms.find(r => r.id === currentRoomId);
    if (!room) return;
    drawShareCard(room);
    $('#shareModal').classList.add('open');
    $('#shareModal').setAttribute('aria-hidden', 'false');
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
    const a = document.createElement('a');
    a.download = 'furnish-room.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    toast('Image downloaded');
  });

  $('#shareCopyBtn').addEventListener('click', async () => {
    const styles = (profile?.styles || []).map(styleLabel).join(' · ');
    const caption = `Just redesigned my ${titleRoom(room.type).toLowerCase()} in ${styles} with Furnish.\n${room.items.length} pieces · $${room.items.reduce((s,i)=>s+i.price,0).toLocaleString()} total ✨\n#FurnishApp #InteriorDesign`;
    try {
      await navigator.clipboard.writeText(caption);
      toast('Caption copied');
    } catch {
      toast('Copy failed');
    }
  });

  // ---------- Item detail bottom sheet ----------
  let _activeSheetItem = null;
  let _activeSheetRoom = null;

  function openItemSheet(item, room) {
    if (!item) return;
    _activeSheetItem = item;
    _activeSheetRoom = room || null;

    const sheet = document.getElementById('itemSheet');
    document.getElementById('bsImage').textContent = item.icon || '🛋️';
    document.getElementById('bsSource').textContent = sourceLabel(item.source);
    document.getElementById('bsType').textContent = item.type;
    document.getElementById('bsName').textContent = item.name;
    document.getElementById('bsDesc').textContent = item.description || '';
    document.getElementById('bsPrice').textContent = item.price ? '$' + item.price.toLocaleString() : '—';

    // Fit warning vs room dimensions
    const fitEl = document.getElementById('bsFit');
    fitEl.textContent = '';
    if (room && room.dims && window.ITEM_FOOTPRINTS) {
      const roomArea = (room.dims.w || 0) * (room.dims.l || 0);
      const fp = window.ITEM_FOOTPRINTS[item.type] || 0;
      if (fp > 0 && roomArea > 0 && fp > roomArea * 0.25) {
        fitEl.textContent = '⚠ Tight fit for this room';
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

    // Shop (real affiliate URL)
    const shopBtn = document.getElementById('bsShopBtn');
    shopBtn.href = item.url || '#';

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
    { stars: 4.5, text: "Loved the budget slider — set $400, got an actual livable room.",        author: "Tate B." },
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

    const cycle = () => {
      if (paused) { timer = setTimeout(cycle, 600); return; }
      const r = REVIEWS[idx % REVIEWS.length];
      row.innerHTML = `
        <span class="review-stars" aria-label="${r.stars} out of 5 stars">${renderStars(r.stars)}</span>
        <span class="review-text">"${r.text}"</span>
        <span class="review-author">— ${r.author}</span>
      `;
      requestAnimationFrame(() => row.classList.add('show'));
      timer = setTimeout(() => {
        row.classList.remove('show');
        idx++;
        timer = setTimeout(cycle, 480); // wait for fade out
      }, 3200);
    };

    // Pause cycling while user hovers, so they can finish reading.
    row.addEventListener('mouseenter', () => { paused = true; });
    row.addEventListener('mouseleave', () => { paused = false; });

    cycle();
  }

  // ---------- Home: Import-from-device button ----------
  function wireHomeImport() {
    const input = document.getElementById('homeImportInput');
    if (!input || input.__wired) return;
    input.__wired = true;
    input.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { toast('Pick an image file'); input.value = ''; return; }
      if (file.size > 12 * 1024 * 1024)    { toast('Image too large (12MB max)'); input.value = ''; return; }
      const reader = new FileReader();
      reader.onload = ev => {
        state.draft = state.draft || { photo: null, type: 'living', dims: { w:12, l:14, h:9 }, keep: true };
        state.draft.photo = ev.target.result;
        save();
        showScreen('capture');
        toast('Photo imported');
        // Pre-populate the capture screen preview if render runs later
        const prev = document.getElementById('photoPreview');
        if (prev) { prev.src = ev.target.result; prev.classList.add('has-image'); }
        const ph = document.querySelector('.photo-frame .placeholder');
        if (ph) ph.classList.add('hidden');
      };
      reader.readAsDataURL(file);
      input.value = '';
    });
  }

  // ---------- Boot ----------
  function boot() {
    showScreen('welcome');
    startReviewsBar();
    wireHomeImport();
  }
  boot();
})();
