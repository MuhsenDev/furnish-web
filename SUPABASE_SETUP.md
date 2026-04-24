# Supabase setup for Furnish

This turns Furnish from a local-only prototype into a real app with email/password sign-in, Google sign-in, and cloud-synced profiles, rooms, and wishlist.

**Free tier handles ~50,000 monthly users.** No credit card required.

---

## Step 1 — Create a Supabase project

1. Go to https://supabase.com → **Start your project** → sign up (GitHub or email).
2. Click **New project**.
3. Name it whatever (e.g. `furnish`), pick the closest region, set a strong database password.
4. Wait ~1 minute for it to provision.

---

## Step 2 — Create the database tables

In your Supabase project:

1. Left sidebar → **SQL Editor** → **New query**.
2. Paste the entire block below.
3. Click **Run**.

```sql
-- Profiles per user
create table public.profiles (
  id            text primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  name          text not null,
  avatar_url    text,
  styles        jsonb default '[]'::jsonb,
  colors        jsonb default '[]'::jsonb,
  custom_colors jsonb default '[]'::jsonb,
  budget        bigint default 3000,
  position      integer default 0,
  updated_at    timestamptz default now()
);

-- Rooms designed
create table public.rooms (
  id             text primary key,
  user_id        uuid references auth.users(id) on delete cascade not null,
  profile_id     text references public.profiles(id) on delete cascade,
  room_type      text not null,
  photo_url      text,
  dims           jsonb,
  items          jsonb,
  keep_mode      boolean default false,
  versions       jsonb,
  active_version text,
  from_template  text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Wishlist items
create table public.wishlist_items (
  id          bigserial primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  item_id     text not null,
  price_alert boolean default false,
  created_at  timestamptz default now(),
  unique (user_id, item_id)
);

-- User-level settings (theme, bookmarked rooms, pro status)
create table public.user_settings (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  theme            text default 'light',
  bookmarked_rooms jsonb default '[]'::jsonb,
  is_pro           boolean default false,
  updated_at       timestamptz default now()
);

-- Row-level security: every user sees only their own data
alter table public.profiles       enable row level security;
alter table public.rooms          enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.user_settings  enable row level security;

create policy "profiles_owner"  on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "rooms_owner"     on public.rooms
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wishlist_owner"  on public.wishlist_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "settings_owner"  on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

You should see "Success. No rows returned." That's correct.

---

## Step 3 — Plug your project's credentials into Furnish

1. In Supabase: **Settings** → **API**.
2. Copy:
   - **Project URL** (looks like `https://abcdef.supabase.co`)
   - **anon public** key (a long `eyJ…` token — NOT the `service_role` key)
3. Open `supabase-config.js` in the unzipped Furnish folder.
4. Paste the two values:

```js
window.SUPABASE_CONFIG = {
  url:     'https://abcdef.supabase.co',
  anonKey: 'eyJhbGciOi...your-long-token...'
};
```

5. Save the file. Reload the app.

If everything's right, you'll see this in the browser console:
```
[Furnish] Supabase backend ready.
```

---

## Step 4 — Configure auth providers

### Email + password (works out of the box)

By default Supabase sends a **confirmation email** when someone signs up. To skip that during testing:

- Supabase → **Authentication** → **Providers** → **Email** → toggle **Confirm email** OFF → Save.

For production, leave it on.

### Sign in with Google

1. In Supabase: **Authentication** → **Providers** → **Google** → toggle ON.
2. Follow Supabase's link to the Google Cloud Console to create OAuth credentials. Quick version:
   - Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID → **Web application**.
   - Authorised redirect URI: copy from the Supabase Google provider page (looks like `https://abcdef.supabase.co/auth/v1/callback`).
   - Copy the resulting Client ID + Client Secret back into Supabase.
3. Save. The "Continue with Google" button now works.

### Sign in with Apple

Requires an **Apple Developer account ($99/year)**. The "Continue with Apple" button is wired up but disabled until you're ready. When you are:

1. In Apple Developer → Certificates, IDs & Profiles → register a Services ID + create a key.
2. In Supabase: **Authentication** → **Providers** → **Apple** → enable, paste your Services ID + key.
3. Update the Apple button handler in `app.js` to call `furnishBackend.auth.signInWithApple()` (one-line change — pattern is identical to Google).

---

## Step 5 — Verify it works

1. Reload the app.
2. **Get Started** → **Create an account** → enter email + password (6+ chars) + name.
3. You should see "Check your email…" if confirmation is on, or land directly on the profile screen if it's off.
4. Set up a profile — pick styles, colors, etc.
5. Open Supabase → **Table Editor** → **profiles** — your profile should appear there with your `user_id`.
6. Open the app in **another browser** (or incognito) and sign in with the same email/password — your profile, rooms, theme, and wishlist all restore.

That's a real, working, multi-device app.

---

## What gets synced

| Thing | Synced | Notes |
|---|---|---|
| Email/password identity | ✅ | Stored in Supabase Auth |
| Profiles (name, styles, colors, budget) | ✅ | `profiles` table |
| Profile photos (avatar) | ✅ | Stored as base64 in `avatar_url` (good enough for prototype) |
| Designed rooms + versions | ✅ | `rooms` table |
| Captured room photos | ✅ | Same — base64 in `photo_url` |
| Wishlist items + price alerts | ✅ | `wishlist_items` table |
| Theme (light/dark) | ✅ | `user_settings` table |
| Pro status | ✅ | `user_settings.is_pro` (you set this manually for now) |

**Sync model:** local-first. Every change saves to localStorage immediately (snappy UX), then debounces a push to Supabase 1.5s later. On sign-in from a fresh device, data is pulled from Supabase.

---

## Production hardening (when you're ready)

- **Move photos to Supabase Storage** — base64 in DB rows works for ~100 rooms/user; beyond that, switch to a `room-photos` storage bucket and store URLs.
- **Add email confirmation flow** — turn it back on in production. Furnish already shows a "Check your email" toast.
- **Set a password policy** — Supabase → Auth → Policies (min length, special chars).
- **Enable rate limiting** — Auth → Rate limits.
- **Add `delete account` flow** — required for App Store / GDPR. Supabase has a single RPC for this.

---

## Troubleshooting

**"Supabase not configured — running in local-only mode"** in the console
→ You haven't filled in `supabase-config.js` yet, or the values still contain `YOUR-PROJECT`.

**Sign-up succeeds but no email arrives**
→ Check spam. Or disable email confirmation (Step 4 → Email → Confirm email OFF).

**"new row violates row-level security policy"**
→ The user isn't actually authenticated when the write is attempted. Check the browser console for `auth.getUser()` returning null.

**"relation 'public.profiles' does not exist"**
→ You skipped Step 2. Run the SQL block.

**Google button does nothing**
→ Provider isn't enabled in Supabase, or the OAuth credentials are wrong / redirect URI mismatch.

**Data syncs in but doesn't push**
→ Check Network tab in DevTools while doing something (add a profile). You should see POSTs to `https://your-project.supabase.co/rest/v1/profiles`.
