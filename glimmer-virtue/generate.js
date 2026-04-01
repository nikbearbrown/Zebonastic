#!/usr/bin/env node
/**
 * character-drift generator
 *
 * Usage:
 *   node generate.js <input-dir> <source-html> [output-dir]
 *   node generate.js <input-dir> <source-html> --nextjs <nextjs-root>
 *   node generate.js <input-dir> <source-html> --validate
 *   node generate.js <input-dir> <source-html> --dry-run
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const REQUIRED_STATES = ['consistent_mild', 'consistent_severe', 'mixed_mild', 'mixed_severe'];
const MIN_TURNS = 6;
const MAX_TURNS = 15;

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── VALIDATION ───────────────────────────────────────────────────────────────

function validate(config) {
  var errors = [], warnings = [];

  if (!config.meta) errors.push('Missing "meta" object');
  else {
    if (!config.meta.title)       errors.push('meta.title is required');
    if (!config.meta.description) warnings.push('meta.description missing');
    if (!config.meta.keywords)    warnings.push('meta.keywords missing');
    if (!config.meta.slug)        warnings.push('meta.slug not set — will derive from title');
  }

  if (!config.role)    errors.push('Missing "role"');
  if (!config.context) errors.push('Missing "context"');

  if (typeof config.turns !== 'number') errors.push('turns must be a number');
  else if (config.turns < MIN_TURNS || config.turns > MAX_TURNS)
    errors.push('turns must be between ' + MIN_TURNS + ' and ' + MAX_TURNS);

  if (!Array.isArray(config.drift_check_turns) || config.drift_check_turns.length === 0) {
    errors.push('drift_check_turns must be a non-empty array');
  } else {
    config.drift_check_turns.forEach(function(t) {
      if (t < 1 || t > config.turns) errors.push('drift_check_turn ' + t + ' out of range');
    });
    if (!config.drift_check_turns.includes(config.turns))
      warnings.push('Last turn (' + config.turns + ') is not a drift check — the glimmer moment typically requires it');
  }

  if (!Array.isArray(config.decisions)) {
    errors.push('decisions must be an array');
  } else {
    if (config.decisions.length !== config.turns)
      errors.push('decisions has ' + config.decisions.length + ' entries but turns is ' + config.turns);
    config.decisions.forEach(function(dec, i) {
      if (!dec.situation) errors.push('decisions[' + i + ']: situation required');
      if (!Array.isArray(dec.options) || dec.options.length < 2)
        errors.push('decisions[' + i + ']: need at least 2 options');
      else {
        dec.options.forEach(function(opt, j) {
          if (!opt.choice) errors.push('decisions[' + i + '].options[' + j + ']: choice required');
          if (!opt.card)   errors.push('decisions[' + i + '].options[' + j + ']: card required');
        });
        var cards = dec.options.map(function(o) { return o.card; });
        if (new Set(cards).size === 1)
          warnings.push('decisions[' + i + ']: all options have same card — no differentiation');
        if (!dec.options.some(function(o) { return o.is_virtuous; }))
          warnings.push('decisions[' + i + ']: no is_virtuous option — moral licensing won\'t apply after this turn');
      }
    });
  }

  if (!Array.isArray(config.incompatible_patterns) || config.incompatible_patterns.length === 0) {
    warnings.push('incompatible_patterns empty — no blocking will occur');
  } else {
    var allCards = new Set();
    if (Array.isArray(config.decisions)) config.decisions.forEach(function(d) {
      if (d.options) d.options.forEach(function(o) { if (o.card) allCards.add(o.card); });
    });
    config.incompatible_patterns.forEach(function(rule, i) {
      if (!rule.if_dominant) errors.push('incompatible_patterns[' + i + ']: if_dominant required');
      if (!rule.blocks_card) errors.push('incompatible_patterns[' + i + ']: blocks_card required');
      if (rule.blocks_card && !allCards.has(rule.blocks_card))
        warnings.push('incompatible_patterns[' + i + ']: blocks_card "' + rule.blocks_card + '" not in any option');
      if (rule.if_dominant && !allCards.has(rule.if_dominant))
        warnings.push('incompatible_patterns[' + i + ']: if_dominant "' + rule.if_dominant + '" not in any option');
    });
  }

  if (!config.reveal) errors.push('Missing "reveal"');
  else {
    if (!config.reveal.closing_question) errors.push('reveal.closing_question required');
    if (!config.reveal.states) errors.push('Missing reveal.states');
    else REQUIRED_STATES.forEach(function(s) {
      if (!config.reveal.states[s]) errors.push('Missing reveal.states.' + s);
      else if (!config.reveal.states[s].what_the_player_did)
        errors.push('reveal.states.' + s + '.what_the_player_did required');
    });
  }

  if (config._mechanic_argument) warnings.push('_mechanic_argument is engine-fixed and will be stripped');

  return { errors: errors, warnings: warnings };
}

// ── USER-CONFIG ──────────────────────────────────────────────────────────────

function generateUserConfig(config) {
  var clean = JSON.parse(JSON.stringify(config));
  delete clean._mechanic_argument;
  delete clean.meta;
  return '// user-config.js — GENERATED FILE\n' +
    '// Edit game.json and re-run generate.js. Do not edit directly.\n' +
    '//\n' +
    '// NOTE: _mechanic_argument is engine-fixed and not configurable.\n' +
    '//\n' +
    '// REMINDER: card text describes what a decision REVEALS about character,\n' +
    '// not what the decision IS.\n\n' +
    'GAME_CONFIG = ' + JSON.stringify(clean, null, 2) + ';\n';
}

// ── HTML PATCHING ────────────────────────────────────────────────────────────

function patchHtml(src, config) {
  var html = src;
  var meta = config.meta;
  html = html.replace(/<title>[^<]*<\/title>/, '<title>' + escapeHtml(meta.title) + '</title>');
  var descTag = '<meta name="description" content="' + escapeHtml(meta.description || '') + '"/>';
  if (/<meta[^>]+name="description"/.test(html))
    html = html.replace(/<meta[^>]+name="description"[^>]*>/, descTag);
  else html = html.replace('</head>', '  ' + descTag + '\n</head>');
  var kwTag = '<meta name="keywords" content="' + escapeHtml((meta.keywords || []).join(', ')) + '"/>';
  if (/<meta[^>]+name="keywords"/.test(html))
    html = html.replace(/<meta[^>]+name="keywords"[^>]*>/, kwTag);
  else html = html.replace('</head>', '  ' + kwTag + '\n</head>');
  return html;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

function main() {
  var args = process.argv.slice(2);
  if (args.includes('--help') || args.length < 2) {
    console.log('\ncharacter-drift generator');
    console.log('  node generate.js <input-dir> <source-html> [output-dir]');
    console.log('  node generate.js <input-dir> <source-html> --nextjs <root>');
    console.log('  node generate.js <input-dir> <source-html> --validate');
    console.log('  node generate.js <input-dir> <source-html> --dry-run\n');
    process.exit(args.length < 2 ? 1 : 0);
  }

  var inputDir = path.resolve(args[0]);
  var sourceHtml = path.resolve(args[1]);
  var validateOnly = args.includes('--validate');
  var dryRun = args.includes('--dry-run');

  console.log('=== character-drift generator ===\n');

  var configPath = path.join(inputDir, 'game.json');
  if (!fs.existsSync(configPath)) { console.error('ERROR: game.json not found in: ' + inputDir); process.exit(1); }

  var config;
  try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); }
  catch(e) { console.error('ERROR: Invalid JSON: ' + e.message); process.exit(1); }

  if (!config.meta) config.meta = {};
  if (!config.meta.slug) config.meta.slug = slugify(config.meta.title || 'character-drift');
  if (config.meta.keywords && typeof config.meta.keywords === 'string')
    config.meta.keywords = config.meta.keywords.split(',').map(function(k) { return k.trim(); }).filter(Boolean);

  var result = validate(config);
  if (result.warnings.length) {
    console.log('Warnings:');
    result.warnings.forEach(function(w) { console.log('  WARN: ' + w); });
    console.log('');
  }
  if (result.errors.length) {
    console.error('Validation errors:');
    result.errors.forEach(function(e) { console.error('  ERROR: ' + e); });
    console.error('\n' + result.errors.length + ' errors, ' + result.warnings.length + ' warnings');
    process.exit(1);
  }
  console.log('Validation passed. 0 errors, ' + result.warnings.length + ' warnings');
  console.log('  ' + config.turns + ' turns, ' + config.drift_check_turns.length + ' drift checks, ' +
    (config.incompatible_patterns || []).length + ' incompatible pairs\n');
  if (validateOnly) process.exit(0);

  if (!fs.existsSync(sourceHtml)) { console.error('ERROR: Source HTML not found: ' + sourceHtml); process.exit(1); }

  var outputDir;
  var nextjsIdx = args.indexOf('--nextjs');
  if (nextjsIdx !== -1) {
    var root = args[nextjsIdx + 1];
    if (!root || root.startsWith('--')) { console.error('ERROR: --nextjs requires a path'); process.exit(1); }
    outputDir = path.join(path.resolve(root), 'public', 'games', config.meta.slug);
  } else if (!dryRun) {
    outputDir = path.resolve(args.find(function(a, i) { return !a.startsWith('-') && i > 1; }) || 'dist');
  }

  if (dryRun) {
    console.log('[dry-run] Would write:');
    console.log('  index.html (patched: title="' + config.meta.title + '")');
    console.log('  user-config.js');
    console.log('\nDry run complete.');
    process.exit(0);
  }

  console.log('Config     : ' + configPath);
  console.log('Source HTML: ' + sourceHtml);
  console.log('Slug       : ' + config.meta.slug);
  console.log('Output     : ' + outputDir + '\n');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'assets'), { recursive: true });

  fs.writeFileSync(path.join(outputDir, 'index.html'), patchHtml(fs.readFileSync(sourceHtml, 'utf8'), config));
  console.log('Wrote ' + path.join(outputDir, 'index.html'));

  fs.writeFileSync(path.join(outputDir, 'user-config.js'), generateUserConfig(config));
  console.log('Wrote ' + path.join(outputDir, 'user-config.js'));

  var userAssets = path.join(inputDir, 'assets');
  if (fs.existsSync(userAssets)) {
    var files = fs.readdirSync(userAssets).filter(function(f) { return !f.startsWith('.'); });
    files.forEach(function(f) { fs.copyFileSync(path.join(userAssets, f), path.join(outputDir, 'assets', f)); });
    if (files.length > 0) console.log('Copied ' + files.length + ' user assets');
  }

  console.log('\n=== Generation complete ===');
  console.log('Deploy: push to main, appears at /games/' + config.meta.slug);
}

main();
