#!/usr/bin/env node
/**
 * trust-template/generate.js
 *
 * Usage:
 *   node trust-template/generate.js <game-config-dir> <source-dir> <output-dir>
 *   node trust-template/generate.js <game-config-dir> <source-dir> --dry-run
 *
 * Reads example-game.json from <game-config-dir>, copies all files from
 * <source-dir> into <output-dir>, then:
 *   1. Injects <title>, <meta description>, <meta keywords> into index.html
 *   2. Adds a <script src="js/user-config.js"> tag before the closing </head>
 *   3. Generates js/user-config.js with PEEP_METADATA from the strategies config
 */

const fs = require("fs");
const path = require("path");

// --- Args ---
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const positional = args.filter((a) => a !== "--dry-run");

const [configDir, sourceDir, outputDir] = positional;

if (!configDir || !sourceDir || (!outputDir && !dryRun)) {
  console.error(
    "Usage: node generate.js <game-config-dir> <source-dir> <output-dir>"
  );
  console.error(
    "       node generate.js <game-config-dir> <source-dir> --dry-run"
  );
  process.exit(1);
}

// Guard: output-dir must not be a flag
if (outputDir && outputDir.startsWith("--")) {
  console.error(
    `ERROR: Output directory "${outputDir}" looks like a flag, not a path.`
  );
  console.error(
    "If you meant --dry-run, omit the output directory: node generate.js <config-dir> <source-dir> --dry-run"
  );
  process.exit(1);
}

const configPath = path.resolve(configDir, "example-game.json");
const srcPath = path.resolve(sourceDir);
const destPath = outputDir ? path.resolve(outputDir) : null;

// --- Helpers ---
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

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcEntry = path.join(src, entry.name);
    const destEntry = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcEntry, destEntry);
    } else {
      fs.copyFileSync(srcEntry, destEntry);
    }
  }
}

function listDirRecursive(dir, prefix) {
  prefix = prefix || "";
  const entries = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      entries.push(...listDirRecursive(path.join(dir, entry.name), rel));
    } else {
      entries.push(rel);
    }
  }
  return entries;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// --- Main ---
console.log("=== trust-template generator ===");
console.log(`Config dir : ${configDir}`);
console.log(`Source dir : ${sourceDir}`);
if (dryRun) {
  console.log(`Mode       : --dry-run (no files will be written)`);
} else {
  console.log(`Output dir : ${outputDir}`);
}
console.log();

// 1. Read config
if (!fs.existsSync(configPath)) {
  console.error(`ERROR: Config file not found: ${configPath}`);
  process.exit(1);
}
const rawConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const config = stripNoteFields(rawConfig);

// Normalize keywords: string → array
if (typeof config.keywords === "string") {
  config.keywords = config.keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

// Validate all 8 required strategy IDs are present
const REQUIRED_STRATEGIES = [
  "tft", "all_d", "all_c", "grudge", "prober", "tf2t", "pavlov", "random",
];
const presentStrategies = Object.keys(config.strategies || {});
const missing = REQUIRED_STRATEGIES.filter((s) => !presentStrategies.includes(s));
const extra = presentStrategies.filter((s) => !REQUIRED_STRATEGIES.includes(s));
if (missing.length > 0) {
  console.error(
    `❌ game.json is missing required strategy IDs: ${missing.join(", ")}`
  );
  console.error(
    `   All 8 are required: ${REQUIRED_STRATEGIES.join(", ")}`
  );
  process.exit(1);
}
if (extra.length > 0) {
  console.error(
    `❌ game.json contains unknown strategy IDs: ${extra.join(", ")}`
  );
  console.error(
    `   Only these 8 are valid: ${REQUIRED_STRATEGIES.join(", ")}`
  );
  process.exit(1);
}

console.log(`Loaded config: "${config.title}"`);
console.log(
  `  Strategies: ${Object.keys(config.strategies).join(", ")} (${Object.keys(config.strategies).length} total)`
);
console.log();

// 2. Validate source directory
if (!fs.existsSync(srcPath)) {
  console.error(`ERROR: Source directory not found: ${srcPath}`);
  process.exit(1);
}

const requiredFiles = ["index.html", "js/sims/PD.js"];
for (const reqFile of requiredFiles) {
  if (!fs.existsSync(path.join(srcPath, reqFile))) {
    console.error(
      `❌ Missing required file in trust-source: ${reqFile}. Is this the ncase/trust repository?`
    );
    process.exit(1);
  }
}

// 3. Copy source → output
if (dryRun) {
  const files = listDirRecursive(srcPath);
  const dirs = new Set();
  for (const f of files) {
    const d = path.dirname(f);
    if (d !== ".") dirs.add(d);
  }
  for (const d of Array.from(dirs).sort()) {
    console.log(`[dry-run] Would copy: ./${sourceDir}/${d} → ./${outputDir || "dist"}/${d}`);
  }
  console.log(
    `[dry-run] Would copy ${files.length} files total`
  );
} else {
  console.log(`Copying ${srcPath} → ${destPath} ...`);
  copyDirSync(srcPath, destPath);
  console.log("  Done.");
}
console.log();

// 4. Inject meta tags into index.html
const indexPath = dryRun
  ? path.join(srcPath, "index.html")
  : path.join(destPath, "index.html");

let html = fs.readFileSync(
  dryRun ? path.join(srcPath, "index.html") : indexPath,
  "utf-8"
);

// Replace <title>
html = html.replace(
  /<title>[^<]*<\/title>/,
  `<title>${escapeHtml(config.title)}</title>`
);

// Replace or inject <meta name="description">
const descTag = `<meta name="description" content="${escapeHtml(config.description)}"/>`;
if (/<meta\s+name="description"/.test(html)) {
  html = html.replace(/<meta\s+name="description"[^>]*\/?>/, descTag);
} else {
  html = html.replace(/<\/title>/, `</title>\n\t${descTag}`);
}

// Inject <meta name="keywords"> (add after description)
const kwString = Array.isArray(config.keywords)
  ? config.keywords.join(", ")
  : config.keywords || "";
const kwTag = `<meta name="keywords" content="${escapeHtml(kwString)}"/>`;
if (/<meta\s+name="keywords"/.test(html)) {
  html = html.replace(/<meta\s+name="keywords"[^>]*\/?>/, kwTag);
} else {
  html = html.replace(descTag, `${descTag}\n\t${kwTag}`);
}

// Inject <script src="js/user-config.js"> before </head>
const configScript = `<script src="js/user-config.js"></script>`;
if (!html.includes("user-config.js")) {
  html = html.replace("</head>", `\t${configScript}\n</head>`);
}

if (dryRun) {
  console.log(`[dry-run] Would write: ./${outputDir || "dist"}/index.html (patched)`);
  console.log("  Injections:");
} else {
  fs.writeFileSync(indexPath, html, "utf-8");
  console.log("Injected into index.html:");
}
console.log(`  <title>${config.title}</title>`);
console.log(`  ${descTag}`);
console.log(`  ${kwTag}`);
console.log(`  ${configScript}`);
console.log();

// 5. Generate js/user-config.js
const peepLines = Object.entries(config.strategies)
  .map(
    ([id, meta]) =>
      `  ${JSON.stringify(id)}: { frame: ${meta.frame}, color: ${JSON.stringify(meta.color)} }`
  )
  .join(",\n");

const userConfigContent = `// Auto-generated by trust-template/generate.js
var PEEP_METADATA = {
${peepLines}
};
`;

if (dryRun) {
  console.log(
    `[dry-run] Would generate: ./${outputDir || "dist"}/js/user-config.js`
  );
  console.log(
    `  ${Object.keys(config.strategies).length} strategy entries`
  );
} else {
  const jsDir = path.join(destPath, "js");
  fs.mkdirSync(jsDir, { recursive: true });
  const userConfigPath = path.join(jsDir, "user-config.js");
  fs.writeFileSync(userConfigPath, userConfigContent, "utf-8");
  console.log(`Generated ${userConfigPath}`);
  console.log(
    `  ${Object.keys(config.strategies).length} strategy entries written`
  );
}
console.log();
console.log("=== Generation complete ===");
