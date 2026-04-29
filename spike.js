// spike.js — quick test of Gemini 2.5 Flash Image (image-to-image) for Furnish AI redesign.
//
// Usage:
//   1. Save the room photo as test-room.jpg in the project root.
//   2. Set the GEMINI_KEY env var (see chat instructions).
//   3. node spike.js
//
// Output: writes output.jpg with the AI-redesigned room next to test-room.jpg.
// This is a one-off spike — NOT wired into the production Furnish app yet.

import { GoogleGenAI } from '@google/genai';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const INPUT_PATH  = resolve('./test-room.jpg');
const OUTPUT_PATH = resolve('./output.jpg');
// Try nano-banana-pro-preview first; fall back to gemini-2.5-flash-image
// on 404. The script tries each in order and uses the first one that
// responds without a not-found error. Add more candidates to the array
// if you discover better-named models from list-models.js output.
const MODEL_CANDIDATES = [
  'nano-banana-pro-preview',
  'gemini-2.5-flash-image',
];

// --- Preflight ---
const apiKey = process.env.GEMINI_KEY;
if (!apiKey) {
  console.error('✗ Missing GEMINI_KEY env var.');
  console.error('  PowerShell:  $env:GEMINI_KEY = "your-key-here"');
  console.error('  bash:        export GEMINI_KEY="your-key-here"');
  process.exit(1);
}
if (!existsSync(INPUT_PATH)) {
  console.error(`✗ Missing input file: ${INPUT_PATH}`);
  console.error('  Save your room photo as test-room.jpg in the project root first.');
  process.exit(1);
}
const inputStat = statSync(INPUT_PATH);
console.log(`→ Input: ${INPUT_PATH} (${(inputStat.size / 1024).toFixed(1)} KB)`);

// --- Build request ---
const ai = new GoogleGenAI({ apiKey });

const prompt = [
  'Redesign this room in a modern minimalist style.',
  'Keep the room geometry, windows, doors, and natural light unchanged.',
  'Replace and add furniture + decor: clean lines, neutral palette',
  '(warm whites, light woods, soft grey), uncluttered surfaces, one or two',
  'intentional accent pieces. Photorealistic interior photography, soft natural',
  'lighting, balanced composition. Output a single high-quality image.',
].join(' ');

const imageBytes = readFileSync(INPUT_PATH);
const imageBase64 = imageBytes.toString('base64');

// Detects "model not found / does not exist" errors so we can fall back
// to the next candidate. Gemini's REST returns 404 with a NOT_FOUND code;
// the SDK surfaces this as an error whose message contains the status.
const isNotFoundError = (err) => {
  const msg = (err?.message || String(err) || '').toLowerCase();
  return /\b(404|not[ _-]?found|does not exist|is not supported)\b/.test(msg);
};

let response = null;
let usedModel = null;
let elapsedMs = 0;
const errors = [];

for (const candidate of MODEL_CANDIDATES) {
  console.log(`→ Sending to ${candidate}…`);
  const t0 = Date.now();
  try {
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
    elapsedMs = Date.now() - t0;
    usedModel = candidate;
    console.log(`← Response in ${elapsedMs} ms (model: ${usedModel})`);
    break;
  } catch (err) {
    elapsedMs = Date.now() - t0;
    errors.push({ model: candidate, err });
    if (isNotFoundError(err)) {
      console.warn(`⚠ ${candidate} not available on this key (${elapsedMs} ms) — trying next candidate…`);
      continue;
    }
    // Non-404 error — surface it and bail; retrying other models won't help.
    console.error(`✗ ${candidate} failed (non-404):`, err?.message || err);
    if (err?.response) console.error('  Response:', err.response);
    process.exit(2);
  }
}

if (!response) {
  console.error('✗ No model in MODEL_CANDIDATES was available on this key.');
  for (const { model, err } of errors) {
    console.error(`  - ${model}: ${err?.message || err}`);
  }
  console.error('  Run `node list-models.js` to see what your account has access to.');
  process.exit(2);
}

// --- Extract image from response ---
const parts = response?.candidates?.[0]?.content?.parts ?? [];
let savedBytes = 0;
for (const part of parts) {
  if (part.inlineData?.data) {
    const buf = Buffer.from(part.inlineData.data, 'base64');
    writeFileSync(OUTPUT_PATH, buf);
    savedBytes = buf.byteLength;
    break;
  }
}

if (!savedBytes) {
  console.error('✗ No image returned. Dumping full response for inspection:');
  console.error(JSON.stringify(response, null, 2));
  process.exit(3);
}

console.log(`✓ Saved ${OUTPUT_PATH} (${(savedBytes / 1024).toFixed(1)} KB)`);

// If the model returned any text commentary alongside the image, log it.
const textParts = parts.filter(p => typeof p.text === 'string' && p.text.length).map(p => p.text);
if (textParts.length) {
  console.log('--- Model notes ---');
  console.log(textParts.join('\n'));
}
