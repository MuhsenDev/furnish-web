// list-models.js — probe which Gemini models are available on your API key
// and surface the image-generation candidates so we can pick the right
// MODEL constant for spike.js.
//
// Usage:
//   $env:GEMINI_KEY = "your-key-here"
//   node list-models.js
//
// Hits the REST endpoint directly (more reliable than the SDK's listModels
// during model-name churn). Prints three sections:
//   1. Image-generation candidates (model name contains "image")
//   2. Imagen family (Google's dedicated image-gen line)
//   3. All other models (so you can sanity-check the key works at all)

const apiKey = process.env.GEMINI_KEY;
if (!apiKey) {
  console.error('✗ Missing GEMINI_KEY env var. Set it first, then re-run.');
  console.error('  PowerShell:  $env:GEMINI_KEY = "your-key-here"');
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=200`;

console.log('→ Querying https://generativelanguage.googleapis.com/v1beta/models …\n');

let res;
try {
  res = await fetch(url);
} catch (err) {
  console.error('✗ Network error:', err.message);
  process.exit(2);
}

if (!res.ok) {
  console.error(`✗ HTTP ${res.status} ${res.statusText}`);
  console.error(await res.text());
  process.exit(3);
}

const data = await res.json();
const models = data.models || [];

if (!models.length) {
  console.error('✗ No models returned. Response:', JSON.stringify(data, null, 2));
  process.exit(4);
}

console.log(`✓ ${models.length} models found.\n`);

const isGemini25FlashImage = m => /gemini-2\.5.*flash.*image/i.test(m.name);
const isOtherImageGemini   = m => /image/i.test(m.name) && !isGemini25FlashImage(m);
const isImagen             = m => /^models\/imagen/i.test(m.name);

const flash25Image = models.filter(isGemini25FlashImage);
const otherImage   = models.filter(m => isOtherImageGemini(m) && !isImagen(m));
const imagen       = models.filter(isImagen);
const others       = models.filter(m => !isGemini25FlashImage(m) && !isOtherImageGemini(m) && !isImagen(m));

const printModel = m => {
  console.log(`  • ${m.name}`);
  if (m.displayName) console.log(`      display: ${m.displayName}`);
  if (m.supportedGenerationMethods)
    console.log(`      methods: ${m.supportedGenerationMethods.join(', ')}`);
  if (m.description)
    console.log(`      desc:    ${m.description.replace(/\s+/g, ' ').slice(0, 140)}${m.description.length > 140 ? '…' : ''}`);
};

console.log(`=== Gemini 2.5 Flash Image candidates (${flash25Image.length}) ===`);
if (!flash25Image.length) console.log('  (none — your key may not have access to this family yet)');
flash25Image.forEach(printModel);

console.log(`\n=== Other Gemini models with "image" in the name (${otherImage.length}) ===`);
if (!otherImage.length) console.log('  (none)');
otherImage.forEach(printModel);

console.log(`\n=== Imagen family (${imagen.length}) ===`);
if (!imagen.length) console.log('  (none — Imagen requires a separately enabled tier on most accounts)');
imagen.forEach(printModel);

console.log(`\n=== All other models (${others.length}) — name only ===`);
others.forEach(m => console.log(`  • ${m.name}`));

console.log('\n— Done. Paste the "Gemini 2.5 Flash Image candidates" section back to Claude');
console.log('  and the MODEL constant in spike.js will be updated to match.');
