// identity.js — Furnish single source of truth for user identity.
// ====================================================================
//
// PURPOSE
// -------
// Replaces the scattered `state.user` reads/writes that fragmented the
// app's idea of "who is the user?" across 8 overlapping signals. After
// the full migration (Stages 1-5), Identity is the ONLY authoritative
// answer to that question. Everything else (profiles, rooms, intents,
// backups) keeps living where it lives.
//
// LIFECYCLE STAGES this module participates in:
//   Stage 1 (this commit): module + bus exist, no consumers yet.
//                          App behavior unchanged. Hydrates from
//                          localStorage at boot so Identity.current()
//                          is populated before any subscriber attaches.
//   Stage 2: write sites in app.js fire Identity.replace() alongside
//            the existing state.user mutations (parallel writes).
//   Stage 3: render orchestration moves to a single Identity.subscribe
//            handler. renderAuthDependentSurfaces and its 6 manual
//            call sites are deleted.
//   Stage 4: read sites in app.js delegate to Identity.* predicates
//            (isGuest, userId, email, name, provider).
//   Stage 5 (deferred): state.user kitchen sink decomposes into
//                       state.tier / state.session / state.tutorials
//                       / state.consent / state.analytics buckets.
//
// CONTRACT
// --------
//   - Identity is the authoritative answer to "who is the user?"
//   - Single write entry point: Identity.replace(newRecord).
//   - Single subscribe entry point: Identity.subscribe(cb).
//   - Records are frozen — subscribers cannot mutate the current record.
//   - Every transition is a full record replacement; no in-place edits.
//
// INVARIANTS
// ----------
//   - Identity.current() always returns a frozen IdentityRecord post-boot
//     (never undefined; never a mutable object).
//   - Identity.isGuest() and Identity.isAuthenticated() are mutually
//     exclusive AND cover all states (no third state).
//   - subscribe(cb) fires cb(null, current) immediately on subscription.
//   - replace() throws synchronously on invalid record shape (defense
//     against accidental writes from random callers).
//
// IDENTITY RECORD SHAPE
// ---------------------
//   {
//     kind: 'guest' | 'authenticated',
//     supabaseUserId: string | null,
//     email:          string | null,
//     name:           string | null,
//     provider:       'email' | 'google' | 'apple' | 'amazon' | null,
//     signedInAt:     number | null,    // epoch ms when this signin landed
//   }
//
// What lives ELSEWHERE (intentionally not in IdentityRecord):
//   - state.profiles[] / state.activeProfileId  → design profiles, not identity
//   - state.rooms[]                              → designed rooms, not identity
//   - state._pendingIntent                       → conversion intent, not identity
//   - state.user.isPro / generationsUsed         → tier/quota (Stage 5: state.tier)
//   - state.user.lastVisitedAt / visitCount      → session metadata (Stage 5: state.session)
//   - state.user.firstRedesignTutorialSeen etc.  → tutorial flags (Stage 5: state.tutorials)
//   - state.user.tosAcceptedAt etc.              → consent (Stage 5: state.consent)
//   - state.user._habitActions etc.              → analytics (Stage 5: state.analytics)
//
// Boot hydration intentionally reads localStorage directly (NOT through
// app.js's `state` closure variable, which isn't accessible from here).
// Same source of truth (the `furnish.state` localStorage blob), parallel
// read path. Both Identity and app.js will read identical bytes at boot.
// ====================================================================

(() => {
  'use strict';

  // ---------- Frozen guest record (singleton) ----------
  const GUEST_RECORD = Object.freeze({
    kind: 'guest',
    supabaseUserId: null,
    email: null,
    name: null,
    provider: null,
    signedInAt: null,
  });

  // ---------- Internal state ----------
  let _record = null;
  const _subs = new Set();

  // ---------- Validation ----------
  // Throws synchronously on invalid shape. Catches the most common
  // accidental-misuse cases (string instead of object, missing kind,
  // authenticated without an id, etc.). Tolerant on optional fields.
  function _validateRecord(record) {
    if (!record || typeof record !== 'object') {
      throw new Error('[Identity] replace() requires an IdentityRecord object, got ' + typeof record);
    }
    if (record.kind !== 'guest' && record.kind !== 'authenticated') {
      throw new Error('[Identity] record.kind must be "guest" or "authenticated", got ' + JSON.stringify(record.kind));
    }
    if (record.kind === 'authenticated' && (!record.supabaseUserId || typeof record.supabaseUserId !== 'string')) {
      throw new Error('[Identity] authenticated record requires a non-empty string supabaseUserId');
    }
    const stringOrNull = (v, fieldName) => {
      if (v !== null && typeof v !== 'string') {
        throw new Error(`[Identity] record.${fieldName} must be string or null, got ` + typeof v);
      }
    };
    stringOrNull(record.email, 'email');
    stringOrNull(record.name, 'name');
    stringOrNull(record.provider, 'provider');
    if (record.signedInAt !== null && typeof record.signedInAt !== 'number') {
      throw new Error('[Identity] record.signedInAt must be number or null, got ' + typeof record.signedInAt);
    }
  }

  // ---------- Bus ----------
  // Subscriber errors are caught + logged; one bad subscriber does not
  // break others or silently corrupt state. Iteration order is insertion
  // order (Set guarantee), so subscribers fire in the order they
  // registered — useful for cases where ordering matters (e.g., the
  // claim-guest-room subscriber should fire before the render subscriber).
  function _emit(prev, next) {
    for (const cb of _subs) {
      try {
        cb(prev, next);
      } catch (e) {
        console.error('[Identity] subscriber threw', e);
      }
    }
  }

  // ---------- Migration helper (Stages 1-4 only; removed in Stage 5) ----------
  // Builds an IdentityRecord from the legacy state.user blob.
  //
  // Used by:
  //   - Stage 1: boot hydration below.
  //   - Stage 2: call-site migrations in app.js so each signin/signout
  //              site can pass the just-mutated state.user without
  //              reconstructing the IdentityRecord by hand.
  //
  // Tolerant of: null, empty object {}, missing provider, partial
  // fields. The 'state.user = {}' defensive-init pattern in app.js
  // produces an object with no provider; this function correctly
  // resolves that to a guest record (Audit Disagreement #1 mitigated).
  function _fromUserBlob(userBlob) {
    if (!userBlob || typeof userBlob !== 'object') return GUEST_RECORD;
    const provider = userBlob.provider;
    // Guest if no provider, provider === 'guest', or no id (auth requires both).
    if (!provider || provider === 'guest' || !userBlob.id) {
      return GUEST_RECORD;
    }
    return Object.freeze({
      kind: 'authenticated',
      supabaseUserId: userBlob.id,
      email: userBlob.email || null,
      name: userBlob.name || null,
      provider: provider,
      signedInAt: typeof userBlob.signedInAt === 'number' ? userBlob.signedInAt : null,
    });
  }

  // ---------- Public API ----------
  const Identity = {
    // ----- Read API -----
    current() {
      return _record;
    },
    isGuest() {
      return !_record || _record.kind === 'guest';
    },
    isAuthenticated() {
      return !!_record && _record.kind === 'authenticated' && !!_record.supabaseUserId;
    },
    userId() {
      return (_record && _record.supabaseUserId) || null;
    },
    email() {
      return (_record && _record.email) || null;
    },
    name() {
      return (_record && _record.name) || null;
    },
    provider() {
      return (_record && _record.provider) || null;
    },

    // ----- Write API -----
    // Single mutation entry point. Validates shape, freezes the record
    // (idempotent — no-op if already frozen), swaps _record, fires bus.
    // Subscribers see (prev, next) where prev is the record from BEFORE
    // this call and next is the record being installed.
    replace(record) {
      _validateRecord(record);
      const frozen = Object.isFrozen(record) ? record : Object.freeze({ ...record });
      const prev = _record;
      _record = frozen;
      _emit(prev, _record);
    },
    // Convenience for transitioning to the guest singleton without
    // having to import GUEST_RECORD or reconstruct it.
    beginGuest() {
      Identity.replace(GUEST_RECORD);
    },
    // Alias of beginGuest with a name that reads better at signout sites.
    completeSignout() {
      Identity.replace(GUEST_RECORD);
    },

    // ----- Event bus -----
    // cb signature: (prev, next) → void
    //   prev: the previous IdentityRecord, or null on initial fire.
    //   next: the current IdentityRecord (always non-null post-boot).
    //
    // Initial fire: cb(null, current) is invoked synchronously inside
    // subscribe(), so subscribers don't need to read current() separately
    // before waiting for the first transition. Useful for renderers that
    // want to paint based on identity state at attach-time.
    //
    // Returns an unsubscribe function. Calling it removes the callback.
    // Idempotent (calling unsub more than once is safe).
    subscribe(cb) {
      if (typeof cb !== 'function') {
        throw new Error('[Identity] subscribe requires a function');
      }
      _subs.add(cb);
      try {
        cb(null, _record);
      } catch (e) {
        console.error('[Identity] subscriber threw on initial fire', e);
      }
      return () => _subs.delete(cb);
    },

    // ----- Internal helpers (Stages 1-4 only; removed in Stage 5) -----
    // Exposed for app.js call-site migrations during Stage 2. Do NOT
    // rely on these from new application code — use the public API.
    _fromUserBlob,
    _GUEST_RECORD: GUEST_RECORD,
  };

  // ---------- Boot hydration ----------
  // Read the same `furnish.state` blob app.js will read a few ms later.
  // Identity is populated before app.js's IIFE attaches subscribers, so
  // the initial-fire contract works cleanly: every subscriber gets a
  // non-null `current` on attach.
  try {
    const raw = localStorage.getItem('furnish.state');
    const stateBlob = raw ? JSON.parse(raw) : null;
    const userBlob = stateBlob && stateBlob.user;
    _record = _fromUserBlob(userBlob);
  } catch (e) {
    console.warn('[Identity] failed to hydrate from localStorage; defaulting to guest', e);
    _record = GUEST_RECORD;
  }

  // ---------- Expose ----------
  window.Identity = Identity;
})();
