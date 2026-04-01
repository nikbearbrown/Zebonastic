#!/usr/bin/env node
/**
 * veil-template/generate.js
 *
 * Usage:
 *   node generate.js <input-dir> <source-html> [output-dir]
 *   node generate.js <input-dir> <source-html> --nextjs <nextjs-root>
 *   node generate.js <input-dir> <source-html> --validate
 *   node generate.js <input-dir> <source-html> --dry-run
 */

const fs = require("fs");
const path = require("path");

// ── Arg parsing ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flagValidate = args.includes("--validate");
const flagDryRun = args.includes("--dry-run");
const nextjsIdx = args.indexOf("--nextjs");
const positional = args.filter(
  (a, i) => a !== "--validate" && a !== "--dry-run" && a !== "--nextjs" && (nextjsIdx < 0 || i !== nextjsIdx + 1)
);
const nextjsRoot = nextjsIdx >= 0 ? args[nextjsIdx + 1] : null;

const inputDir = positional[0];
const sourceHtml = positional[1];
let outputDir = positional[2] || null;

if (!inputDir || !sourceHtml) {
  console.error("Usage: node generate.js <input-dir> <source-html> [output-dir]");
  console.error("       node generate.js <input-dir> <source-html> --nextjs <nextjs-root>");
  console.error("       node generate.js <input-dir> <source-html> --validate");
  console.error("       node generate.js <input-dir> <source-html> --dry-run");
  process.exit(1);
}

if (outputDir && outputDir.startsWith("--")) {
  console.error(`ERROR: Output directory "${outputDir}" looks like a flag, not a path.`);
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripNoteFields(obj) {
  if (Array.isArray(obj)) return obj.map(stripNoteFields);
  if (obj !== null && typeof obj === "object") {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith("_")) continue;
      cleaned[key] = stripNoteFields(value);
    }
    return cleaned;
  }
  return obj;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

let warnings = [];
let errors = [];

function warn(msg) {
  warnings.push(msg);
  console.warn(`  WARN: ${msg}`);
}

function fail(msg) {
  errors.push(msg);
  console.error(`  ERROR: ${msg}`);
}

// ── Load config ──────────────────────────────────────────────────────────────

console.log("=== veil-template generator ===\n");

const configPath = path.resolve(inputDir, "game.json");
if (!fs.existsSync(configPath)) {
  console.error(`ERROR: game.json not found at ${configPath}`);
  process.exit(1);
}

const rawConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Strip _mechanic_argument with warning
if (rawConfig._mechanic_argument !== undefined) {
  warn("game.json contains _mechanic_argument — this field is engine-fixed and has been removed.");
}

const config = stripNoteFields(rawConfig);

// Normalize keywords
if (config.meta && typeof config.meta.keywords === "string") {
  config.meta.keywords = config.meta.keywords.split(",").map((k) => k.trim()).filter(Boolean);
}

// Derive slug if absent
if (config.meta && !config.meta.slug && config.meta.title) {
  config.meta.slug = slugify(config.meta.title);
}

// ── Validation ───────────────────────────────────────────────────────────────

console.log("Validating game.json...");

// Required: meta
if (!config.meta) fail("Missing 'meta' object");
else {
  if (!config.meta.title) fail("Missing meta.title");
  if (!config.meta.slug) fail("Missing meta.slug (and cannot derive from title)");
  if (!config.meta.description) fail("Missing meta.description");
  if (!config.meta.keywords || !Array.isArray(config.meta.keywords) || config.meta.keywords.length === 0) {
    warn("meta.keywords is missing or empty");
  }
}

// Required: positions
if (!Array.isArray(config.positions)) fail("Missing 'positions' array");
else {
  if (config.positions.length < 2 || config.positions.length > 5)
    fail(`positions must have 2-5 entries, got ${config.positions.length}`);

  const posIds = new Set();
  let shareSum = 0;
  config.positions.forEach((p, i) => {
    if (!p.id) fail(`positions[${i}].id is missing`);
    else {
      if (posIds.has(p.id)) fail(`Duplicate position id: "${p.id}"`);
      posIds.add(p.id);
    }
    if (!p.label) fail(`positions[${i}].label is missing`);
    if (typeof p.population_share !== "number") fail(`positions[${i}].population_share must be a number`);
    else shareSum += p.population_share;
  });
  if (Math.abs(shareSum - 1.0) > 0.01)
    fail(`positions population_share must sum to ~1.0, got ${shareSum.toFixed(4)}`);
}

// Required: allocation_categories
if (!Array.isArray(config.allocation_categories)) fail("Missing 'allocation_categories' array");
else {
  if (config.allocation_categories.length < 2 || config.allocation_categories.length > 8)
    fail(`allocation_categories must have 2-8 entries, got ${config.allocation_categories.length}`);

  const posIds = (config.positions || []).map((p) => p.id);
  config.allocation_categories.forEach((cat, i) => {
    if (!cat.id) fail(`allocation_categories[${i}].id is missing`);
    if (!cat.label) fail(`allocation_categories[${i}].label is missing`);
    if (!cat.weights || typeof cat.weights !== "object") {
      fail(`allocation_categories[${i}].weights is missing or not an object`);
    } else {
      const wKeys = Object.keys(cat.weights);
      posIds.forEach((pid) => {
        if (!wKeys.includes(pid)) fail(`allocation_categories[${i}].weights missing key "${pid}"`);
      });
      const wSum = Object.values(cat.weights).reduce((a, b) => a + b, 0);
      if (Math.abs(wSum - 1.0) > 0.05)
        warn(`allocation_categories[${i}] ("${cat.id}") weights sum to ${wSum.toFixed(3)}, expected ~1.0`);
    }
  });
}

// Required: design_points
if (typeof config.design_points !== "number") fail("Missing design_points (integer)");
else if (config.design_points < 5 || config.design_points > 20 || !Number.isInteger(config.design_points))
  fail(`design_points must be an integer 5-20, got ${config.design_points}`);

// Required: worst_position
if (!config.worst_position) fail("Missing worst_position");
else if (config.positions && !config.positions.find((p) => p.id === config.worst_position))
  fail(`worst_position "${config.worst_position}" does not match any position id`);

// Optional: rawls_threshold
if (config.rawls_threshold === undefined) {
  warn("rawls_threshold is missing, defaulting to 6");
  config.rawls_threshold = 6;
}

// Required: reveal
const REQUIRED_STATES = [
  "worst_not_maximin", "worst_maximin", "middle_not_maximin",
  "favorable_not_maximin", "any_maximin",
];
if (!config.reveal) fail("Missing 'reveal' object");
else {
  if (!config.reveal.closing_question) fail("Missing reveal.closing_question");
  if (!config.reveal.states || typeof config.reveal.states !== "object") {
    fail("Missing reveal.states object");
  } else {
    REQUIRED_STATES.forEach((sk) => {
      if (!config.reveal.states[sk]) fail(`Missing reveal.states.${sk}`);
      else if (!config.reveal.states[sk].what_the_player_did)
        fail(`reveal.states.${sk}.what_the_player_did is missing or empty`);
    });
  }
}

console.log(`\n  ${errors.length} errors, ${warnings.length} warnings\n`);

if (errors.length > 0) {
  console.error("Validation FAILED. Fix the errors above.\n");
  process.exit(1);
}

if (flagValidate) {
  console.log("Validation passed.\n");
  process.exit(0);
}

// ── Resolve output directory ─────────────────────────────────────────────────

const slug = config.meta.slug;

if (nextjsRoot) {
  outputDir = path.join(nextjsRoot, "public", "games", slug);
}

if (!outputDir && !flagDryRun) {
  console.error("ERROR: No output directory specified. Use a positional arg, --nextjs, or --dry-run.");
  process.exit(1);
}

const destPath = outputDir ? path.resolve(outputDir) : null;
const srcHtmlPath = path.resolve(sourceHtml);

if (!fs.existsSync(srcHtmlPath)) {
  console.error(`ERROR: Source HTML not found: ${srcHtmlPath}`);
  process.exit(1);
}

console.log(`Config     : ${configPath}`);
console.log(`Source HTML: ${srcHtmlPath}`);
console.log(`Slug       : ${slug}`);
if (flagDryRun) console.log("Mode       : --dry-run (no files will be written)");
else console.log(`Output     : ${destPath}`);
console.log();

// ── HTML patching ────────────────────────────────────────────────────────────

let html = fs.readFileSync(srcHtmlPath, "utf-8");

html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(config.meta.title)}</title>`);

const descTag = `<meta name="description" content="${escapeHtml(config.meta.description)}"/>`;
if (/<meta\s+name="description"/.test(html)) {
  html = html.replace(/<meta\s+name="description"[^>]*\/?>/, descTag);
} else {
  html = html.replace(/<\/title>/, `</title>\n  ${descTag}`);
}

const kwString = (config.meta.keywords || []).join(", ");
const kwTag = `<meta name="keywords" content="${escapeHtml(kwString)}"/>`;
if (/<meta\s+name="keywords"/.test(html)) {
  html = html.replace(/<meta\s+name="keywords"[^>]*\/?>/, kwTag);
} else {
  html = html.replace(descTag, `${descTag}\n  ${kwTag}`);
}

// ── user-config.js generation ────────────────────────────────────────────────

const userConfigContent = `// user-config.js — GENERATED FILE\n// Edit game.json and re-run generate.js\nGAME_CONFIG = ${JSON.stringify(config, null, 2)};\n`;

// ── Placeholder PNGs ─────────────────────────────────────────────────────────

let canvasAvailable = false;
let createCanvas;
try {
  const canvasMod = require("canvas");
  createCanvas = canvasMod.createCanvas;
  canvasAvailable = true;
} catch {
  warn("canvas package not found — placeholder images not generated. Install with: npm install canvas");
}

const userAssetsDir = path.resolve(inputDir, "assets");
const positionsNeedingPlaceholder = [];

(config.positions || []).forEach((pos) => {
  const fname = `${pos.id}.png`;
  const userPath = path.join(userAssetsDir, fname);
  if (fs.existsSync(userPath)) return; // user supplied
  positionsNeedingPlaceholder.push(pos);
  if (!canvasAvailable) return; // already warned
});

function generatePlaceholderPng(pos) {
  const canvas = createCanvas(140, 140);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#E8E0D0";
  ctx.fillRect(0, 0, 140, 140);
  ctx.fillStyle = "#4A4A4A";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 16px sans-serif";
  const firstWord = (pos.label || pos.id).split(/[,\s]/)[0];
  ctx.fillText(firstWord, 70, 62);
  ctx.font = "12px sans-serif";
  ctx.fillText(pos.id.toUpperCase(), 70, 82);
  return canvas.toBuffer("image/png");
}

// ── Write output ─────────────────────────────────────────────────────────────

if (flagDryRun) {
  const outLabel = destPath || `./output/${slug}`;
  console.log(`[dry-run] Would write: ${outLabel}/index.html (patched)`);
  console.log("  Injections:");
  console.log(`    <title>${config.meta.title}</title>`);
  console.log(`    ${descTag}`);
  console.log(`    ${kwTag}`);
  console.log();
  console.log(`[dry-run] Would generate: ${outLabel}/user-config.js`);
  console.log(`    GAME_CONFIG with ${(config.positions || []).length} positions, ${(config.allocation_categories || []).length} categories`);
  console.log();

  // Assets
  const userAssets = [];
  try {
    userAssets.push(...fs.readdirSync(userAssetsDir).filter((f) => !f.startsWith(".")));
  } catch {}
  if (userAssets.length > 0) {
    console.log(`[dry-run] Would copy ${userAssets.length} user assets from ${userAssetsDir}/`);
    userAssets.forEach((f) => console.log(`    ${f}`));
  }
  if (positionsNeedingPlaceholder.length > 0) {
    console.log(`[dry-run] Would generate ${positionsNeedingPlaceholder.length} placeholder PNGs:`);
    positionsNeedingPlaceholder.forEach((p) => console.log(`    ${p.id}.png (${(p.label || "").split(/[,\s]/)[0]})`));
    if (!canvasAvailable) console.log("    (skipped — canvas not installed)");
  }

  console.log();
  console.log("=== Dry run complete ===");
  process.exit(0);
}

// Actual write
fs.mkdirSync(destPath, { recursive: true });
fs.mkdirSync(path.join(destPath, "assets"), { recursive: true });

// Write index.html
fs.writeFileSync(path.join(destPath, "index.html"), html, "utf-8");
console.log(`Wrote ${path.join(destPath, "index.html")}`);

// Write user-config.js
fs.writeFileSync(path.join(destPath, "user-config.js"), userConfigContent, "utf-8");
console.log(`Wrote ${path.join(destPath, "user-config.js")}`);

// Copy user assets
try {
  const userAssets = fs.readdirSync(userAssetsDir).filter((f) => !f.startsWith("."));
  userAssets.forEach((f) => {
    fs.copyFileSync(path.join(userAssetsDir, f), path.join(destPath, "assets", f));
  });
  if (userAssets.length > 0) console.log(`Copied ${userAssets.length} user assets`);
} catch {}

// Generate placeholder PNGs
if (canvasAvailable && positionsNeedingPlaceholder.length > 0) {
  positionsNeedingPlaceholder.forEach((pos) => {
    const buf = generatePlaceholderPng(pos);
    fs.writeFileSync(path.join(destPath, "assets", `${pos.id}.png`), buf);
  });
  console.log(`Generated ${positionsNeedingPlaceholder.length} placeholder PNGs`);
}

console.log("\n=== Generation complete ===");
