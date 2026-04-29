// ============================================================
// Furnish — Supabase configuration
// ============================================================
// To enable real cloud sign-in + cross-device sync, fill in
// the two values below. Get them from your Supabase project:
//
//    Supabase dashboard → Settings → API
//      • Project URL  →  url
//      • anon / public key  →  anonKey
//
// Leave the placeholders untouched to keep the app in
// LOCAL-ONLY mode (everything stored in this browser only —
// fine for testing without setting up an account).
//
// Full setup guide: SUPABASE_SETUP.md
// ============================================================

window.SUPABASE_CONFIG = {
  url:     'https://dserurqzxtuslbamwaio.supabase.co',
  // TODO(Hassan): paste your anon / publishable key here, replacing the
  // placeholder string below. Get it from:
  //   Supabase Dashboard → Project Settings → API → "anon public" (legacy)
  //   OR → "Publishable key" (new key system, starts with sb_publishable_)
  // The sentinel check in supabase-client.js looks for the literal
  // substring 'YOUR-ANON' — leaving any string that contains that
  // substring keeps the app in local-only mode until you paste the
  // real key.
  anonKey: 'sb_publishable_mevFxvVZ_nxH2azAi8-Itw_xvadNHnL'
};
