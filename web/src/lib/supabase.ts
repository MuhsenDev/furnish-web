/*
  Server-side Supabase client per Document 9 §8.

  Used ONLY by API route handlers that need to write past RLS
  (currently the waitlist signup endpoint and the home-page row
  count). The service-role key bypasses RLS, so this module is
  server-only and the env var must NOT be prefixed with
  NEXT_PUBLIC_.

  The client is a lightweight fetch wrapper around the Supabase
  PostgREST endpoints rather than the @supabase/supabase-js
  library, so we avoid the bundle weight for a small set of calls.
  If the surface area grows we can swap in the official client.

  Helpers exposed:
    - isSupabaseConfigured(): are env vars set?
    - supabaseInsert(table, row, opts): insert a row, optionally
      returning the inserted representation
    - supabaseSelect(table, query): query rows with a raw PostgREST
      query string
    - supabaseCount(table): cheap exact count via Prefer: count=exact
*/

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SERVICE_ROLE_KEY.length > 0;
}

function authHeaders(extra: Record<string, string> = {}): HeadersInit {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function tableUrl(table: string, query?: string): string {
  const base = `${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}`;
  return query ? `${base}?${query}` : base;
}

export interface SupabaseInsertOptions {
  /**
   * If true, set Prefer: return=representation so the inserted
   * row is returned in the body. Default false (Prefer:
   * return=minimal, faster).
   */
  returning?: boolean;
}

export interface SupabaseInsertResult<T = unknown> {
  ok: boolean;
  error?: string;
  status?: number;
  /** Inserted row(s), only present when options.returning was true. */
  data?: T[];
}

export async function supabaseInsert<T = unknown>(
  table: string,
  row: Record<string, unknown>,
  options: SupabaseInsertOptions = {},
): Promise<SupabaseInsertResult<T>> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'supabase_not_configured' };
  }

  try {
    const prefer = options.returning ? 'return=representation' : 'return=minimal';
    const res = await fetch(tableUrl(table), {
      method: 'POST',
      headers: authHeaders({ Prefer: prefer }),
      body: JSON.stringify(row),
      cache: 'no-store',
    });

    if (!res.ok) {
      return {
        ok: false,
        error: `supabase_${res.status}`,
        status: res.status,
      };
    }

    const data = options.returning
      ? ((await res.json().catch(() => null)) as T[] | null) ?? undefined
      : undefined;

    return { ok: true, status: res.status, data };
  } catch (err) {
    const msg =
      (err as { message?: string })?.message ?? 'supabase_network_error';
    return { ok: false, error: msg };
  }
}

export interface SupabaseSelectResult<T = unknown> {
  ok: boolean;
  error?: string;
  status?: number;
  data?: T[];
}

/**
 * Run a SELECT against a table. `query` is a raw PostgREST query
 * string (e.g. `referral_code=eq.abcd1234&select=email,position`).
 * Caller is responsible for URL encoding.
 */
export async function supabaseSelect<T = unknown>(
  table: string,
  query: string,
): Promise<SupabaseSelectResult<T>> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'supabase_not_configured' };
  }

  try {
    const res = await fetch(tableUrl(table, query), {
      method: 'GET',
      headers: authHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) {
      return {
        ok: false,
        error: `supabase_${res.status}`,
        status: res.status,
      };
    }

    const data = ((await res.json().catch(() => null)) as T[] | null) ?? [];
    return { ok: true, status: res.status, data };
  } catch (err) {
    const msg =
      (err as { message?: string })?.message ?? 'supabase_network_error';
    return { ok: false, error: msg };
  }
}

/**
 * Cheap count via `Prefer: count=exact` + `select=*&limit=0`.
 * Returns the row count parsed from the Content-Range response
 * header. Used to render the homepage public counter.
 */
export interface SupabaseCountResult {
  ok: boolean;
  error?: string;
  count?: number;
}

export async function supabaseCount(table: string): Promise<SupabaseCountResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'supabase_not_configured' };
  }

  try {
    const res = await fetch(tableUrl(table, 'select=*&limit=0'), {
      method: 'GET',
      headers: authHeaders({ Prefer: 'count=exact' }),
      cache: 'no-store',
    });

    if (!res.ok) {
      return { ok: false, error: `supabase_${res.status}` };
    }

    const contentRange = res.headers.get('content-range') ?? '';
    const match = /\/(\d+)$/.exec(contentRange);
    const count = match ? parseInt(match[1], 10) : 0;
    return { ok: true, count };
  } catch (err) {
    const msg =
      (err as { message?: string })?.message ?? 'supabase_network_error';
    return { ok: false, error: msg };
  }
}
