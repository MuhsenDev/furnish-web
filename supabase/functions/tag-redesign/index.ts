// supabase/functions/tag-redesign/index.ts
//
// Stage 2 of the redesign pipeline. Picks up rows where
// generate-redesign has finished (status === 'tagging') and uses
// OpenAI's vision model to identify every distinct furniture/decor
// item, then writes one row per item into redesign_items.
//
// Pipeline:
//   1. POST { redesign_id }
//   2. Fetch redesigns row, validate status === 'tagging'
//   3. Download generated_photo_url, encode as base64 data URL
//   4. Call OpenAI chat-completions with vision input + JSON prompt
//      (tries response_format:json_object first; falls back to text
//      parse if the model rejects structured output)
//   5. Parse the array of items. Atomic bulk-insert into redesign_items.
//   6. status: tagging → done
//
// Failure path: status → failed, error column populated. If items were
// already inserted before the failure, they are NOT rolled back — the
// user explicitly wanted partial progress preserved (a retry can dedup
// or skip with a status check).
//
// Required Supabase secrets:
//   OPENAI_KEY                 — OpenAI API key (sk-...)
//   SUPABASE_URL               — auto-injected
//   SUPABASE_SERVICE_ROLE_KEY  — auto-injected
//
// Deploy: supabase functions deploy tag-redesign
// Secret: supabase secrets set OPENAI_KEY=<key>

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// ---------- Config ----------

const OPENAI_MODEL = 'gpt-5.4';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

// json_object response_format requires the model to emit an object at the
// root, so we ask for `{ items: [...] }` and unwrap. The text fallback
// path tolerates either shape (object-with-items OR raw array).
const TAGGING_PROMPT = [
  'Identify every distinct furniture and decor item in this room.',
  'Return ONLY valid JSON — an object with an "items" key whose value is an array.',
  'Each item is an object with:',
  '- bbox: object with x, y, width, height as decimal numbers 0-1 representing percentages of image dimensions',
  '- description: 5-10 words including style, color, material',
  '- category: one of: sofa, chair, table, lamp, rug, art, plant, decor, other',
  '- search_query: a phrase suitable for shopping, e.g. "modern beige linen sofa 3-seater"',
  'Do not include any text outside the JSON object.',
].join(' ');

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ---------- Types ----------

interface TaggedItem {
  bbox: { x: number; y: number; width: number; height: number };
  description: string;
  category: string;
  search_query: string;
}

// ---------- Helpers ----------

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

// Best-effort failure writer. Wrapped in its own try/catch so failure-
// recording can never itself throw and mask the original error. Note
// this does NOT delete already-inserted redesign_items rows — the spec
// says partial progress is preserved.
async function recordFailure(redesignId: string | null, error: string) {
  if (!redesignId) return;
  try {
    const sb = adminClient();
    await sb
      .from('redesigns')
      .update({
        status: 'failed',
        error: error.slice(0, 2000),
      })
      .eq('id', redesignId);
  } catch (writeErr) {
    console.error('[tag-redesign] could not write failure:', writeErr);
  }
}

async function downloadImageAsDataUrl(url: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`generated image download failed: ${resp.status} ${resp.statusText}`);
  }
  // Best-effort content type. Storage upload was image/jpeg in
  // generate-redesign, so default to that if the header is missing.
  const ct = resp.headers.get('content-type') ?? 'image/jpeg';
  const buf = new Uint8Array(await resp.arrayBuffer());
  const base64 = encodeBase64(buf);
  return `data:${ct};base64,${base64}`;
}

// Strip a markdown code fence if the model wrapped the JSON. Common with
// vision/legacy models that ignore "no extra text" instructions.
function stripFence(s: string): string {
  const m = s.match(/^\s*```(?:json)?\s*([\s\S]*?)\s*```\s*$/i);
  return m ? m[1] : s;
}

// Parse the model's content into an array of TaggedItem. Tolerant of:
//   - { items: [...] }     — when json_object mode worked
//   - [...]                — when the model returned a raw array (text mode)
//   - markdown-fenced JSON — strips and retries
function parseTaggedItems(content: string): TaggedItem[] {
  const cleaned = stripFence(content || '').trim();
  if (!cleaned) throw new Error('OpenAI returned empty content');

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    const msg = (err as { message?: string })?.message ?? String(err);
    throw new Error(`OpenAI returned malformed JSON: ${msg}. First 200 chars: ${cleaned.slice(0, 200)}`);
  }

  let arr: unknown;
  if (Array.isArray(parsed)) {
    arr = parsed;
  } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).items)) {
    arr = (parsed as Record<string, unknown>).items;
  } else {
    throw new Error(`OpenAI returned JSON in unexpected shape (expected array or {items:[]}, got ${typeof parsed})`);
  }

  // Coerce + validate. Tolerant on extras, strict on required fields.
  const items: TaggedItem[] = [];
  for (const raw of arr as unknown[]) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const bbox = r.bbox as Record<string, unknown> | undefined;
    if (!bbox || typeof bbox.x !== 'number' || typeof bbox.y !== 'number'
        || typeof bbox.width !== 'number' || typeof bbox.height !== 'number') {
      console.warn('[tag-redesign] dropping item with bad bbox:', r);
      continue;
    }
    items.push({
      bbox: { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height },
      description: String(r.description ?? '').slice(0, 500),
      category: String(r.category ?? 'other'),
      search_query: String(r.search_query ?? r.description ?? '').slice(0, 500),
    });
  }
  return items;
}

// Calls OpenAI Chat Completions with vision input. Tries json_object
// response_format first (more reliable when supported). On 4xx errors
// that mention response_format / json_object, retries without it and
// relies on the parser to handle the text response.
async function callOpenAI(apiKey: string, dataUrl: string): Promise<string> {
  const baseBody: Record<string, unknown> = {
    model: OPENAI_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: TAGGING_PROMPT },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
  };

  // Attempt 1: structured output
  const firstBody = { ...baseBody, response_format: { type: 'json_object' } };
  let resp = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(firstBody),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    const looksLikeFormatComplaint =
      resp.status >= 400 && resp.status < 500 &&
      /response_format|json_object|json mode|not supported/i.test(errText);
    if (looksLikeFormatComplaint) {
      console.warn('[tag-redesign] response_format rejected; retrying without it');
      // Attempt 2: plain text, parser handles JSON extraction
      resp = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(baseBody),
      });
      if (!resp.ok) {
        throw new Error(`OpenAI fallback call failed: ${resp.status} ${await resp.text()}`);
      }
    } else {
      throw new Error(`OpenAI call failed: ${resp.status} ${errText}`);
    }
  }

  const json = await resp.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('OpenAI response missing choices[0].message.content');
  }
  return content;
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

    // 2. Fetch + validate
    const { data: redesign, error: fetchErr } = await sb
      .from('redesigns')
      .select('id, status, generated_photo_url')
      .eq('id', redesignId)
      .single();
    if (fetchErr) throw new Error(`redesigns fetch failed: ${fetchErr.message}`);
    if (!redesign) throw new Error('redesign row not found');
    if (redesign.status !== 'tagging') {
      throw new Error(`redesign.status is "${redesign.status}", expected "tagging" — refusing to re-tag`);
    }
    if (!redesign.generated_photo_url) {
      throw new Error('redesign.generated_photo_url is empty');
    }

    // 3. Download the generated image as a base64 data URL. We pass the
    // URL through the model as an inline image rather than as an HTTPS
    // reference — works whether the bucket is public or private later,
    // and avoids OpenAI cold-fetch flakiness on freshly-uploaded objects.
    const dataUrl = await downloadImageAsDataUrl(redesign.generated_photo_url as string);

    // 4. OpenAI vision call
    const apiKey = Deno.env.get('OPENAI_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_KEY secret not set');
    }
    const rawContent = await callOpenAI(apiKey, dataUrl);
    const items = parseTaggedItems(rawContent);
    if (items.length === 0) {
      throw new Error('OpenAI returned zero valid items (none had a usable bbox)');
    }
    console.log(`[tag-redesign] parsed ${items.length} items for ${redesignId}`);

    // 5. Atomic bulk insert. Postgres handles all-or-nothing per call;
    // if it fails, no rows persist and the catch records the failure.
    // If it succeeds, items are durable — the catch below will NOT
    // delete them even if the status update on step 6 fails.
    const rows = items.map(item => ({
      redesign_id: redesignId,
      bbox: item.bbox,
      description: item.description,
      category: item.category,
      search_query: item.search_query,
    }));
    {
      const { error } = await sb.from('redesign_items').insert(rows);
      if (error) throw new Error(`redesign_items insert failed: ${error.message}`);
    }

    // 6. Hand off — pipeline complete
    {
      const { error } = await sb
        .from('redesigns')
        .update({
          status: 'done',
          // null out any error from a previous failed attempt
          error: null,
        })
        .eq('id', redesignId);
      if (error) throw new Error(`status→done failed: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        redesign_id: redesignId,
        item_count: items.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    const msg = (err as { message?: string })?.message ?? String(err);
    console.error('[tag-redesign] failed:', msg);
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
