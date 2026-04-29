// supabase/functions/generate-redesign/index.ts
//
// Edge Function port of spike.js. Same Gemini SDK + same model fallback
// pattern, but driven by a redesigns row instead of a hardcoded local
// JPEG. spike.js is preserved as-is at the project root for local testing.
//
// Pipeline (each step idempotent enough that a retry won't double-spend):
//   1. POST { redesign_id }
//   2. Fetch redesigns row + linked profile/anonymous_session preferences
//   3. status: pending → generating
//   4. Download source photo (HTTP fetch on source_photo_url)
//   5. Build a parameterized prompt from preferences (style/mood/room/budget)
//   6. Call Gemini nano-banana-pro-preview (with 2.5-flash-image fallback)
//   7. Upload result to generated-photos/{owner_id}/{redesign_id}.jpg
//   8. status: generating → tagging, write public URL
//
// Failures: status → failed, error column populated, 500 returned.
//
// Required Supabase secrets:
//   GEMINI_KEY                 — Google AI Studio API key
//   SUPABASE_URL               — auto-injected by the Edge runtime
//   SUPABASE_SERVICE_ROLE_KEY  — auto-injected by the Edge runtime
//
// Deploy: supabase functions deploy generate-redesign
// Secret: supabase secrets set GEMINI_KEY=<key>

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import {
  encodeBase64,
  decodeBase64,
} from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
// Pinned to the same major spike.js runs against (package.json: "^1.50.1").
// Note: @google/genai has NO 0.21.x — published versions jump from the
// 0.x line straight to 1.x. An earlier 0.21.0 pin failed deploy with
// "Could not find npm package '@google/genai' matching '0.21.0'".
import { GoogleGenAI } from 'npm:@google/genai@1.50.1';

// ---------- Config ----------
// Same fallback list as spike.js — try the preview model first, fall back
// to the GA model if the preview slug isn't enabled on the key.
const MODEL_CANDIDATES = [
  'nano-banana-pro-preview',
  'gemini-2.5-flash-image',
];

const GENERATED_BUCKET = 'generated-photos';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ---------- Helpers ----------

// Mirrors spike.js's isNotFoundError — used to decide whether to roll
// over to the next model candidate or surface the error immediately.
function isNotFoundError(err: unknown): boolean {
  const msg = (
    (err as { message?: string })?.message ??
    String(err) ??
    ''
  ).toLowerCase();
  return /\b(404|not[ _-]?found|does not exist|is not supported)\b/.test(msg);
}

function adminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Fire-and-forget POST to the tag-redesign Edge Function in the same
// project. Belt-and-suspenders against the Edge runtime tearing down the
// worker before the request completes:
//   1. `keepalive: true` on fetch — Fetch-API standard for "this request
//      should outlive the calling context." Works without EdgeRuntime.
//   2. EdgeRuntime.waitUntil() if available — extends worker lifetime.
//   3. Heavy logging at every step so a future trigger drop is visible
//      in the function's Logs tab.
//
// Does not throw — the redesign row is already at status='tagging' so a
// polling worker or manual retry can pick up any dropped triggers.
function triggerTagRedesign(redesignId: string): void {
  const tag = `[trigger ${redesignId}]`;
  console.log(`${tag} entered triggerTagRedesign`);

  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  console.log(`${tag} env: SUPABASE_URL=${url ? 'present' : 'MISSING'}, SERVICE_ROLE_KEY=${key ? `present(${key.length} chars)` : 'MISSING'}`);
  if (!url || !key) {
    console.warn(`${tag} aborting — required env missing`);
    return;
  }

  // [Auth audit] Log first 8 + last 4 chars of the key so we can verify
  // its shape on the next run without leaking the full token.
  //   eyJ...XXXX  → legacy service-role JWT (~218 chars; gateway expects this)
  //   sb_...XXXX  → new sb_secret_* format (NOT a JWT; gateway will 401 with
  //                 UNAUTHORIZED_INVALID_JWT_FORMAT). If you see this, the
  //                 project has been migrated to the new API key system —
  //                 deploy tag-redesign with --no-verify-jwt, OR fetch the
  //                 legacy JWT from Dashboard → Settings → API → "service_role
  //                 key (legacy)" and set it as a custom secret (e.g. via
  //                 `supabase secrets set TAG_TRIGGER_KEY=eyJ...`).
  const keyShape = `${key.slice(0, 8)}...${key.slice(-4)}`;
  // Build the Authorization value as a separate variable so we can log
  // its exact shape (proves no double-Bearer, no truncation, no quotes
  // around the value, literal single space after "Bearer").
  const authHeaderValue = `Bearer ${key}`;
  const authShape = `${authHeaderValue.slice(0, 8)}...${authHeaderValue.slice(-4)}`;
  console.log(`${tag} key shape=${keyShape}  authHeader shape="${authShape}" (len=${authHeaderValue.length})`);

  const target = `${url}/functions/v1/tag-redesign`;
  console.log(`${tag} target=${target}`);

  // EdgeRuntime detection — log what we find regardless of result so
  // the dashboard tells us whether the runtime supports waitUntil.
  const er = (globalThis as unknown as {
    EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void };
  }).EdgeRuntime;
  const hasWaitUntil = typeof er?.waitUntil === 'function';
  console.log(`${tag} EdgeRuntime=${er ? 'present' : 'undefined'}, waitUntil=${hasWaitUntil ? 'function' : 'unavailable'}`);

  console.log(`${tag} initiating fetch (keepalive=true)`);
  let trigger: Promise<unknown>;
  try {
    trigger = fetch(target, {
      method: 'POST',
      headers: {
        // Using the pre-built `authHeaderValue` const (logged above) so
        // the value sent on the wire is provably the same one printed in
        // the diagnostic log. No re-templating, no quoting, no trimming.
        'Authorization': authHeaderValue,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ redesign_id: redesignId }),
      // keepalive lets the request outlive the worker even when
      // EdgeRuntime.waitUntil isn't available. Required for true
      // fire-and-forget semantics on Deno/Supabase Edge.
      keepalive: true,
    })
      .then(async r => {
        // Read the body so we can surface the tag-redesign acknowledgment
        // in our own logs. Body read also prevents the connection from
        // being prematurely closed before the downstream handler picks up.
        const bodyPreview = await r.text().catch(() => '<unreadable>');
        console.log(`${tag} fetch resolved: status=${r.status}, body=${bodyPreview.slice(0, 200)}`);
        return r;
      })
      .catch(err => {
        const msg = (err as { message?: string })?.message ?? String(err);
        const stack = (err as { stack?: string })?.stack ?? '<no stack>';
        console.error(`${tag} fetch threw: ${msg}\n${stack}`);
      });
  } catch (syncErr) {
    // Synchronous throw from fetch() construction (rare — bad URL, etc.)
    const msg = (syncErr as { message?: string })?.message ?? String(syncErr);
    console.error(`${tag} fetch() threw synchronously: ${msg}`);
    return;
  }

  if (hasWaitUntil && er?.waitUntil) {
    console.log(`${tag} handing trigger Promise to EdgeRuntime.waitUntil`);
    try {
      er.waitUntil(trigger);
    } catch (wuErr) {
      console.error(`${tag} waitUntil threw: ${(wuErr as { message?: string })?.message ?? wuErr}`);
    }
  } else {
    console.warn(`${tag} no waitUntil — relying on keepalive:true to deliver request`);
  }

  console.log(`${tag} triggerTagRedesign returning (fetch is in-flight)`);
}

// Best-effort failure writer. Wrapped in its own try/catch because we
// never want failure-recording to itself throw and mask the real error.
async function recordFailure(redesignId: string | null, error: string) {
  if (!redesignId) return;
  try {
    const sb = adminClient();
    await sb
      .from('redesigns')
      .update({
        status: 'failed',
        error: error.slice(0, 2000), // cap to keep a runaway stack out of the column
      })
      .eq('id', redesignId);
  } catch (writeErr) {
    console.error('[generate-redesign] could not write failure:', writeErr);
  }
}

// Pull whichever preferences blob is set on the redesign's owner.
// Returns { preferences, ownerKey } where ownerKey is the storage path
// prefix (profile id or session id) — used to namespace the upload.
async function fetchOwnerPreferences(
  sb: SupabaseClient,
  redesign: { profile_id: string | null; session_id: string | null },
): Promise<{ preferences: Record<string, unknown> | null; ownerKey: string }> {
  if (redesign.profile_id) {
    const { data, error } = await sb
      .from('profiles')
      .select('preferences')
      .eq('id', redesign.profile_id)
      .single();
    if (error) throw new Error(`profiles fetch failed: ${error.message}`);
    return {
      preferences: (data?.preferences as Record<string, unknown>) ?? null,
      ownerKey: redesign.profile_id,
    };
  }
  if (redesign.session_id) {
    const { data, error } = await sb
      .from('anonymous_sessions')
      .select('preferences')
      .eq('id', redesign.session_id)
      .single();
    if (error) throw new Error(`anonymous_sessions fetch failed: ${error.message}`);
    return {
      preferences: (data?.preferences as Record<string, unknown>) ?? null,
      ownerKey: redesign.session_id,
    };
  }
  throw new Error('redesign has neither profile_id nor session_id set');
}

// Read a possibly-public, possibly-signed URL pointing at Supabase Storage
// (or anywhere reachable over HTTPS) and return raw bytes. Keeping this as
// plain fetch means the function works whether the bucket is public OR the
// caller passes a signed URL. Signed URLs expire — caller's job to refresh.
async function downloadPhotoBytes(url: string): Promise<Uint8Array> {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`source photo download failed: ${resp.status} ${resp.statusText}`);
  }
  const buf = await resp.arrayBuffer();
  return new Uint8Array(buf);
}

// Build a redesign prompt from preferences. Mirrors spike.js's prompt shape
// (geometry-preserving + photoreal interior) but parameterizes the four
// fields the user named: style, mood, room type, budget. Tolerant of:
//   - new 9-Q model (vibe, color_appetite, materials, scope, decor_density)
//   - legacy fields (style, mood, room_type, budget)
//   - empty/null preferences (falls back to the spike.js default copy)
// Reads room_type from the redesign row first if present, then preferences.
function buildPrompt(
  preferences: Record<string, unknown> | null,
  redesignRow: Record<string, unknown>,
): string {
  const p = preferences ?? {};
  const r = redesignRow ?? {};

  const style =
    (p.style as string) ||
    (Array.isArray(p.styles) ? (p.styles as string[])[0] : '') ||
    (p.vibe as string) ||
    'modern minimalist';

  const mood =
    (p.mood as string) ||
    (p.color_appetite as string) ||
    'warm, calm, lived-in';

  const roomType =
    (r.room_type as string) ||
    (p.room_type as string) ||
    'room';

  const budget =
    (p.budget as string | number) ??
    (r.budget as string | number) ??
    null;
  const budgetClause = budget
    ? ` Target budget around ${typeof budget === 'number' ? `$${budget.toLocaleString()}` : budget}.`
    : '';

  // Optional richer signals — if present, fold them in as additive clauses
  // rather than replacing the core sentence (matches spike.js's structure).
  const materials = Array.isArray(p.materials)
    ? (p.materials as string[]).join(', ')
    : (p.materials as string) || '';
  const density =
    (p.decor_density as string) ||
    (p.density as string) ||
    '';
  const naturalLight = (p.natural_light as string) || '';

  const extras: string[] = [];
  if (materials) extras.push(`Lean on ${materials}.`);
  if (density) extras.push(`Decor density: ${density}.`);
  if (naturalLight) extras.push(`Lighting: ${naturalLight}.`);

  return [
    `Redesign this ${roomType} in a ${style} style with a ${mood} feel.`,
    'Keep the room geometry, windows, doors, and natural light unchanged.',
    'Replace and add furniture + decor to fit the style above; cohesive palette,',
    'one or two intentional accent pieces.',
    extras.join(' '),
    'Photorealistic interior photography, soft natural lighting, balanced composition.',
    `Output a single high-quality image.${budgetClause}`,
  ]
    .filter(Boolean)
    .join(' ');
}

// Calls Gemini with the same model-fallback loop spike.js uses. Returns
// the raw image bytes from the first part with inlineData.data.
async function generateImage(
  apiKey: string,
  imageBytes: Uint8Array,
  prompt: string,
): Promise<{ bytes: Uint8Array; usedModel: string }> {
  const ai = new GoogleGenAI({ apiKey });
  const imageBase64 = encodeBase64(imageBytes);

  let response: any = null;
  let usedModel = '';
  const errs: string[] = [];

  for (const candidate of MODEL_CANDIDATES) {
    try {
      console.log(`[generate-redesign] trying model ${candidate}`);
      response = await ai.models.generateContent({
        model: candidate,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
              { text: prompt },
            ],
          },
        ],
      });
      usedModel = candidate;
      break;
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? String(err);
      errs.push(`${candidate}: ${msg}`);
      if (isNotFoundError(err)) {
        console.warn(`[generate-redesign] ${candidate} not available, trying next`);
        continue;
      }
      // Non-404 — bail. Retrying other models won't help (auth, quota, etc).
      throw new Error(`Gemini call failed on ${candidate}: ${msg}`);
    }
  }

  if (!response) {
    throw new Error(`no candidate model worked: ${errs.join(' | ')}`);
  }

  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part?.inlineData?.data) {
      return { bytes: decodeBase64(part.inlineData.data), usedModel };
    }
  }

  throw new Error('Gemini returned no inlineData image part');
}

// ---------- Handler ----------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'POST only' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  let redesignId: string | null = null;

  try {
    // 1. Parse body
    const body = await req.json().catch(() => ({}));
    redesignId = (body?.redesign_id as string) ?? null;
    if (!redesignId) {
      throw new Error('Missing redesign_id in request body');
    }

    const sb = adminClient();

    // 2. Fetch redesign row. Selecting * so room_type / budget can ride
    // along on the row too without us having to know the exact schema —
    // buildPrompt reads optionally.
    const { data: redesign, error: fetchErr } = await sb
      .from('redesigns')
      .select('*')
      .eq('id', redesignId)
      .single();
    if (fetchErr) throw new Error(`redesigns fetch failed: ${fetchErr.message}`);
    if (!redesign) throw new Error('redesign row not found');

    if (!redesign.source_photo_url) {
      throw new Error('redesign.source_photo_url is empty');
    }

    // 3. Fetch the right preferences blob + the storage owner key.
    const { preferences, ownerKey } = await fetchOwnerPreferences(sb, {
      profile_id: redesign.profile_id ?? null,
      session_id: redesign.session_id ?? null,
    });

    // 4. Move row to generating BEFORE the long-running Gemini call so the
    // client can poll status and see progress.
    {
      const { error } = await sb
        .from('redesigns')
        .update({ status: 'generating' })
        .eq('id', redesignId);
      if (error) throw new Error(`status→generating failed: ${error.message}`);
    }

    // 5. Download source photo bytes
    const photoBytes = await downloadPhotoBytes(redesign.source_photo_url as string);

    // 6. Build the prompt
    const prompt = buildPrompt(preferences, redesign);
    console.log(`[generate-redesign] prompt: ${prompt.slice(0, 240)}…`);

    // 7. Call Gemini
    const apiKey = Deno.env.get('GEMINI_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_KEY secret not set');
    }
    const { bytes: outputBytes, usedModel } = await generateImage(apiKey, photoBytes, prompt);
    console.log(`[generate-redesign] generated ${outputBytes.byteLength} bytes via ${usedModel}`);

    // 8. Upload to generated-photos bucket. upsert:true makes retries safe.
    const storagePath = `${ownerKey}/${redesignId}.jpg`;
    {
      const { error } = await sb.storage
        .from(GENERATED_BUCKET)
        .upload(storagePath, outputBytes, {
          contentType: 'image/jpeg',
          upsert: true,
        });
      if (error) throw new Error(`storage upload failed: ${error.message}`);
    }

    // 9. Resolve the public URL. If the bucket is private, this still
    // returns a URL — it just won't be reachable without a signed token.
    // If you need signed URLs instead, swap to createSignedUrl(path, ttl).
    const { data: publicUrlData } = sb.storage
      .from(GENERATED_BUCKET)
      .getPublicUrl(storagePath);
    const generatedUrl = publicUrlData?.publicUrl;
    if (!generatedUrl) {
      throw new Error('could not resolve public URL for uploaded object');
    }

    // 10. Hand off to the next stage
    {
      const { error } = await sb
        .from('redesigns')
        .update({
          generated_photo_url: generatedUrl,
          status: 'tagging',
          // null out any error from a previous failed attempt
          error: null,
        })
        .eq('id', redesignId);
      if (error) throw new Error(`status→tagging failed: ${error.message}`);
    }

    // 11. Fire-and-forget trigger of the tag-redesign stage. Two layers
    // of background-task durability inside triggerTagRedesign:
    //   (a) keepalive:true on fetch — Fetch-API standard for outlasting
    //       the calling context; runtime-version-independent.
    //   (b) EdgeRuntime.waitUntil if available — extends worker lifetime.
    // Heavy logging at every step so trigger drops are visible in the
    // function's Logs tab. Trigger failure does NOT fail the redesign —
    // the tag stage can be re-invoked manually or by a polling worker
    // against rows stuck in status='tagging'.
    console.log(`[generate-redesign] reached step 11 (tag trigger) for ${redesignId}`);
    triggerTagRedesign(redesignId);
    console.log(`[generate-redesign] returned from triggerTagRedesign for ${redesignId}, sending 200`);

    return new Response(
      JSON.stringify({
        ok: true,
        redesign_id: redesignId,
        generated_photo_url: generatedUrl,
        model: usedModel,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    const msg = (err as { message?: string })?.message ?? String(err);
    console.error('[generate-redesign] failed:', msg);
    await recordFailure(redesignId, msg);
    return new Response(
      JSON.stringify({ ok: false, error: msg, redesign_id: redesignId }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
