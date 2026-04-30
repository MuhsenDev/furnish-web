// ============================================================
// Furnish — Supabase integration layer
// ============================================================
// Exposes `window.furnishBackend`:
//   .mode        'supabase' | 'local'
//   .auth        { signUp, signIn, signInWithGoogle, signOut, getUser, onChange }
//   .pullAll(state)   Restore profiles/rooms/wishlist/settings from Postgres.
//   .pushAll(state)   Push local state to Postgres (debounced by caller).
//
// When Supabase isn't configured, mode === 'local' and the app
// falls back to its original localStorage-only behaviour.
// ============================================================

(async () => {
  const emit = () => window.dispatchEvent(new Event('furnish:backend-ready'));

  const cfg = window.SUPABASE_CONFIG || {};
  const configured =
    cfg.url && cfg.anonKey &&
    !cfg.url.includes('YOUR-PROJECT') &&
    !cfg.anonKey.includes('YOUR-ANON');

  if (!configured) {
    // [Phase 3] Top-level boot verdict — high-visibility line so it's easy
    // to spot in DevTools without scrolling through other startup noise.
    console.log('Furnish: local-only mode (placeholder credentials detected)');
    console.info('[Furnish] Supabase not configured — running in local-only mode.');
    window.furnishBackend = { mode: 'local' };
    emit();
    return;
  }

  let createClient;
  try {
    ({ createClient } = await import('https://esm.sh/@supabase/supabase-js@2'));
  } catch (err) {
    // [Phase 3] CDN fetch failed — config IS valid, but we can't load the
    // SDK. Log it as the local-only branch so the user sees clearly which
    // mode is actually running, plus the original error for debugging.
    console.log('Furnish: local-only mode (placeholder credentials detected)');
    console.error('[Furnish] Could not load supabase-js — falling back to local mode.', err);
    window.furnishBackend = { mode: 'local' };
    emit();
    return;
  }

  const sb = createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  // ---------- Auth ----------
  // [OAuth ## bug — DO NOT "fix" these back to window.location.href]
  // redirectTo / emailRedirectTo MUST be a clean URL: origin + pathname
  // only, NO hash, NO query string.
  //
  // Using window.location.href compounds a stray '#' on every signin
  // attempt after the first OAuth: Supabase v2's detectSessionInUrl
  // strips access_token=... from the URL but leaves a bare '#' behind.
  // window.location.href on the next signin therefore is e.g.
  // 'http://localhost:PORT/#'. Passed as redirectTo, Google appends its
  // own fragment producing 'http://localhost:PORT/##access_token=...'.
  // The double-hash breaks Supabase's URLSearchParams parsing, no
  // SIGNED_IN event fires, the app's 3s OAuth-race wait times out,
  // user lands on welcome thinking signin failed.
  //
  // origin + pathname is structurally hash-free by definition, so this
  // form cannot regress regardless of what state window.location is in
  // when the user clicks signin. See commit log for full diagnosis.
  const auth = {
    async signUp(email, password, name) {
      const { data, error } = await sb.auth.signUp({
        email, password,
        options: { data: { name }, emailRedirectTo: `${window.location.origin}${window.location.pathname}` }
      });
      return { user: data?.user, session: data?.session, error };
    },
    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      return { user: data?.user, session: data?.session, error };
    },
    async signInWithGoogle() {
      const { data, error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${window.location.pathname}` }
      });
      return { error, data };
    },
    async signOut() {
      const { error } = await sb.auth.signOut();
      return { error };
    },
    async getUser() {
      const { data } = await sb.auth.getUser();
      return data?.user || null;
    },
    onChange(cb) {
      // [OAuth-visual-bug fix] Surface the Supabase event name to the
      // caller so app.js can distinguish authoritative signout events
      // (SIGNED_OUT, USER_DELETED) from transient null-session events
      // (INITIAL_SESSION before OAuth-hash detection finishes,
      // TOKEN_REFRESHED on a transient refresh failure). Without this,
      // every null-session fire was indistinguishable from a real signout.
      const { data } = sb.auth.onAuthStateChange((evt, session) => cb(session?.user || null, evt));
      return () => data?.subscription?.unsubscribe?.();
    }
  };

  // ---------- Data mapping ----------
  const toRemoteBudget = b => (b === Infinity ? 999999 : Math.round(b || 0));
  const toLocalBudget  = b => (b >= 999999 ? Infinity : Number(b || 0));

  const profileToRow = (p, userId, position) => ({
    id: p.id,
    user_id: userId,
    name: p.name,
    avatar_url: p.avatar || null,
    styles: p.styles || [],
    colors: p.colors || [],
    custom_colors: p.customColors || [],
    budget: toRemoteBudget(p.budget),
    position,
    updated_at: new Date().toISOString()
  });

  const rowToProfile = r => ({
    id: r.id,
    name: r.name,
    avatar: r.avatar_url,
    styles: r.styles || [],
    colors: r.colors || [],
    customColors: r.custom_colors || [],
    budget: toLocalBudget(r.budget)
  });

  const roomToRow = (r, userId) => ({
    id: r.id,
    user_id: userId,
    profile_id: r.profileId,
    room_type: r.type,
    photo_url: r.photo || null,
    dims: r.dims || {},
    items: r.items || [],
    keep_mode: !!r.keepMode,
    versions: r.versions || [],
    active_version: r.activeVersion || null,
    from_template: r.fromTemplate || null,
    updated_at: new Date().toISOString()
  });

  const rowToRoom = r => ({
    id: r.id,
    profileId: r.profile_id,
    type: r.room_type,
    photo: r.photo_url,
    dims: r.dims,
    items: r.items,
    keepMode: r.keep_mode,
    versions: r.versions || [],
    activeVersion: r.active_version,
    fromTemplate: r.from_template,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now()
  });

  // ---------- Data API ----------
  async function pullAll(state) {
    const user = await auth.getUser();
    if (!user) return;

    const [{ data: profiles }, { data: rooms }, { data: wishlist }, { data: settings }] = await Promise.all([
      sb.from('profiles').select('*').eq('user_id', user.id).order('position'),
      sb.from('rooms').select('*').eq('user_id', user.id).order('created_at'),
      sb.from('wishlist_items').select('*').eq('user_id', user.id),
      sb.from('user_settings').select('*').eq('user_id', user.id).maybeSingle()
    ]);

    // [Auth flow Fix 1] Reveal-aware merge.
    // When a guest's redesign has just been generated and they're at the
    // signin gate (state._pendingIntent.intent === 'reveal'), the local
    // state.rooms holds a freshly-generated room that has NOT yet been
    // pushed to the server. A naive overwrite would erase it the moment
    // the user signs into an account that already has prior rooms on the
    // server, breaking afterSigninRouting → openRoom and stranding the
    // user. Preserve the pending room (and its profile) through the pull.
    const pendingReveal = state._pendingIntent?.intent === 'reveal'
      ? state._pendingIntent
      : null;

    if (profiles?.length) {
      const pulledProfiles = profiles.map(rowToProfile);
      if (pendingReveal) {
        // The room's profileId points at the local guest profile. If the
        // server doesn't know that profile yet (typical guest → existing-
        // account signin), keep the local one alongside the pulled set so
        // openRoom's profile lookup still resolves.
        const pendingRoom = (state.rooms || []).find(r => r.id === pendingReveal.roomId);
        const pendingProfileId = pendingRoom?.profileId;
        const localProfile = pendingProfileId
          ? (state.profiles || []).find(p => p.id === pendingProfileId)
          : null;
        if (localProfile && !pulledProfiles.some(p => p.id === pendingProfileId)) {
          pulledProfiles.push(localProfile);
        }
      }
      state.profiles = pulledProfiles;
    }

    if (rooms?.length) {
      const pulledRooms = rooms.map(rowToRoom);
      if (pendingReveal) {
        const localPending = (state.rooms || []).find(r => r.id === pendingReveal.roomId);
        if (localPending && !pulledRooms.some(r => r.id === pendingReveal.roomId)) {
          pulledRooms.push(localPending);
          console.log('[pullAll] reveal-aware merge: preserved roomId=' + pendingReveal.roomId);
        } else {
          // Pending intent existed but either local room is missing or the
          // server already has it (rare — implies a prior partial push).
          // Either way, the standard overwrite is safe.
          console.log('[pullAll] standard overwrite (no pending reveal)');
        }
      } else {
        console.log('[pullAll] standard overwrite (no pending reveal)');
      }
      state.rooms = pulledRooms;
    } else if (pendingReveal) {
      // Server has zero rooms but we have a pending reveal — preserve
      // the local set unchanged. (Without this branch, the empty-server
      // path leaves state.rooms as-is anyway, but the explicit log helps
      // debugging and documents the intent.)
      console.log('[pullAll] reveal-aware merge: preserved roomId=' + pendingReveal.roomId);
    }

    state.wishlist = (wishlist || []).map(w => w.item_id);
    state.priceAlerts = {};
    (wishlist || []).forEach(w => { if (w.price_alert) state.priceAlerts[w.item_id] = true; });

    if (settings) {
      state.settings = { theme: settings.theme || 'light' };
      state.bookmarkedRooms = settings.bookmarked_rooms || [];
      if (state.user) {
        // [Compute-quality migration] Server is canonical for `is_pro` only.
        // `generations_used` is now an analytics counter (no quota), but we
        // still hydrate it so client-side reporting + the premium-quality
        // upsell pacing logic see the right number.
        state.user.isPro = !!settings.is_pro;
        if (typeof settings.generations_used === 'number') {
          state.user.generationsUsed = settings.generations_used;
          state.user.redesignsUsed = settings.generations_used; // legacy mirror
        }
      }
    }
  }

  async function pushAll(state) {
    const user = await auth.getUser();
    if (!user) return;

    // Profiles (with position order preserved)
    if (state.profiles?.length) {
      const rows = state.profiles.map((p, i) => profileToRow(p, user.id, i));
      await sb.from('profiles').upsert(rows, { onConflict: 'id' });
    }

    // Rooms
    if (state.rooms?.length) {
      const rows = state.rooms.map(r => roomToRow(r, user.id));
      await sb.from('rooms').upsert(rows, { onConflict: 'id' });
    }

    // Settings (compute-quality model: `is_pro` is canonical for tier; the
    // future Replicate-backed backend reads it to route to standard vs
    // premium model. `generations_used` is analytics-only — no quota uses
    // it — but we keep syncing it so analytics aggregations stay accurate
    // across devices.)
    await sb.from('user_settings').upsert({
      user_id: user.id,
      theme: state.settings?.theme || 'light',
      bookmarked_rooms: state.bookmarkedRooms || [],
      is_pro: !!state.user?.isPro,
      generations_used: Number(state.user?.generationsUsed || state.user?.redesignsUsed || 0),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    // Wishlist diff: clear then re-upsert current set.
    await sb.from('wishlist_items').delete().eq('user_id', user.id);
    if (state.wishlist?.length) {
      const rows = state.wishlist.map(id => ({
        user_id: user.id,
        item_id: id,
        price_alert: !!state.priceAlerts?.[id]
      }));
      await sb.from('wishlist_items').insert(rows);
    }
  }

  async function clearRemote() {
    const user = await auth.getUser();
    if (!user) return;
    await Promise.all([
      sb.from('profiles').delete().eq('user_id', user.id),
      sb.from('rooms').delete().eq('user_id', user.id),
      sb.from('wishlist_items').delete().eq('user_id', user.id),
      sb.from('user_settings').delete().eq('user_id', user.id)
    ]);
  }

  // [Photo storage] Upload a base64 dataURL or Blob to the source-photos
  // bucket and return a public URL. Path: {userId}/{roomId}.jpg with
  // upsert:true so re-uploads from the same room (e.g. retry after a
  // failed first attempt, or boot-time migration re-runs) are idempotent.
  //
  // PREREQUISITE: source-photos bucket must be PUBLIC and have an INSERT
  // RLS policy scoping authenticated writes to {auth.uid()}/* — see the
  // commit body for the exact SQL.
  //
  // Returns the public URL on success, throws on upload failure.
  async function uploadSourcePhoto(userId, roomId, dataUrlOrBlob) {
    if (!userId || !roomId) {
      throw new Error('uploadSourcePhoto requires userId and roomId');
    }
    let blob;
    if (typeof dataUrlOrBlob === 'string') {
      // base64 dataURL: data:image/jpeg;base64,XXXX
      const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrlOrBlob);
      if (!m) throw new Error('uploadSourcePhoto: input is not a base64 dataURL');
      const contentType = m[1];
      const bin = atob(m[2]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      blob = new Blob([bytes], { type: contentType });
    } else if (dataUrlOrBlob instanceof Blob) {
      blob = dataUrlOrBlob;
    } else {
      throw new Error('uploadSourcePhoto: input must be a base64 dataURL or Blob');
    }
    const path = `${userId}/${roomId}.jpg`;
    const { error: uploadErr } = await sb.storage
      .from('source-photos')
      .upload(path, blob, {
        upsert: true,
        contentType: blob.type || 'image/jpeg'
      });
    if (uploadErr) throw uploadErr;
    const { data } = sb.storage.from('source-photos').getPublicUrl(path);
    if (!data?.publicUrl) {
      throw new Error('uploadSourcePhoto: getPublicUrl returned empty');
    }
    return data.publicUrl;
  }

  window.furnishBackend = { mode: 'supabase', sb, auth, pullAll, pushAll, clearRemote, uploadSourcePhoto };
  emit();
  // [Phase 3] Top-level boot verdict — paired with the local-mode log
  // above. One line per app boot, no scrolling needed to verify which
  // mode is running.
  console.log('Furnish: cloud mode active');
  console.info('[Furnish] Supabase backend ready.');
})();
