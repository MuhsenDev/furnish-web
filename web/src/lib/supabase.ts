/*
  Server-side Supabase client per Document 9 §8.

  Used ONLY by API route handlers that need to write past RLS
  (currently just the waitlist signup endpoint). The service-role
  key bypasses RLS, so this module is server-only and the env var
  must NOT be prefixed with NEXT_PUBLIC_.

  The client is a lightweight fetch wrapper rather than the
  @supabase/supabase-js library so we avoid the bundle weight
  for a single insert call. If we add more server-side Supabase
  surface area later, swap in the official client.
*/

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SERVICE_ROLE_KEY.length > 0;
}

export interface SupabaseInsertResult {
  ok: boolean;
  error?: string;
  status?: number;
}

/*
  Insert a single row into the named table via Supabase's REST
  endpoint. Service-role key bypasses RLS. Idempotent inserts are
  the caller's responsibility (e.g., unique constraint on email
  for the waitlist table).
*/
export async function supabaseInsert(
  table: string,
  row: Record<string, unknown>,
): Promise<SupabaseInsertResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'supabase_not_configured' };
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return {
        ok: false,
        error: `supabase_${res.status}`,
        status: res.status,
      };
    }

    return { ok: true, status: res.status };
  } catch (err) {
    const msg =
      (err as { message?: string })?.message ?? 'supabase_network_error';
    return { ok: false, error: msg };
  }
}
