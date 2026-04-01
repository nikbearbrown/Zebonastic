#!/usr/bin/env node
/**
 * the-network generator
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

const REQUIRED_STATES = ['severed_biased', 'severed_unbiased', 'intact_biased', 'intact_unbiased'];

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function validate(config) {
  var errors = [], warnings = [];

  if (!config.meta) errors.push('Missing "meta" object');
  else {
    if (!config.meta.title)       errors.push('meta.title is required');
    if (!config.meta.description) warnings.push('meta.description missing');
    if (!config.meta.keywords)    warnings.push('meta.keywords missing');
    if (!config.meta.slug)        warnings.push('meta.slug not set');
  }

  if (!config.role)    errors.push('Missing "role"');
  if (!config.context) errors.push('Missing "context"');
  if (!config.player_cluster) errors.push('Missing "player_cluster"');

  if (typeof config.attention_tokens_per_turn !== 'number') errors.push('attention_tokens_per_turn must be a number');
  if (typeof config.turns !== 'number') errors.push('turns must be a number');
  if (typeof config.bridge_critical_threshold !== 'number') errors.push('bridge_critical_threshold must be a number');
  if (typeof config.network_fragmentation_multiplier !== 'number')
    warnings.push('network_fragmentation_multiplier missing — will default to 1.4');

  if (!Array.isArray(config.relationships) || config.relationships.length < 3) {
    errors.push('relationships must have at least 3 entries');
  } else {
    var bridges = config.relationships.filter(function(r) { return r.bridge; });
    if (bridges.length === 0) errors.push('At least one relationship must be a bridge');

    var ids = new Set();
    config.relationships.forEach(function(rel, i) {
      if (!rel.id) errors.push('relationships[' + i + '].id required');
      if (!rel.label) errors.push('relationships[' + i + '].label required');
      if (!rel.role) warnings.push('relationships[' + i + '].role missing');
      if (typeof rel.starting_strength !== 'number') errors.push('relationships[' + i + '].starting_strength must be a number');
      if (typeof rel.base_need !== 'number') errors.push('relationships[' + i + '].base_need must be a number');
      if (!['low','medium','high'].includes(rel.need_variance))
        warnings.push('relationships[' + i + '].need_variance should be low/medium/high');
      if (rel.bridge) {
        if (!Array.isArray(rel.clusters) || rel.clusters.length < 2)
          errors.push('Bridge "' + (rel.id||i) + '" must have clusters array with 2+ entries');
        if (rel.need_variance === 'high')
          warnings.push('Bridge "' + (rel.id||i) + '" has high need_variance — bridges should appear stable');
      } else if (!rel.cluster) {
        errors.push('Non-bridge "' + (rel.id||i) + '" must have a cluster field');
      }
      if (rel.id && ids.has(rel.id)) errors.push('Duplicate id: ' + rel.id);
      if (rel.id) ids.add(rel.id);
    });
  }

  if (!config.reveal) errors.push('Missing "reveal"');
  else {
    if (!config.reveal.closing_question) errors.push('reveal.closing_question required');
    if (!config.reveal.states) errors.push('Missing reveal.states');
    else REQUIRED_STATES.forEach(function(s) {
      if (!config.reveal.states[s]) errors.push('Missing reveal.states.' + s);
      else if (!config.reveal.states[s].what_the_player_did) errors.push('reveal.states.' + s + '.what_the_player_did required');
    });
  }

  if (config._mechanic_argument) warnings.push('_mechanic_argument is engine-fixed and will be stripped');

  return { errors: errors, warnings: warnings };
}

function generateUserConfig(config) {
  var clean = JSON.parse(JSON.stringify(config));
  delete clean._mechanic_argument;
  delete clean.meta;
  return '// user-config.js — GENERATED FILE\n' +
    '// Edit game.json and re-run generate.js. Do not edit directly.\n' +
    '//\n' +
    '// NOTE: _mechanic_argument is engine-fixed and not configurable.\n\n' +
    'GAME_CONFIG = ' + JSON.stringify(clean, null, 2) + ';\n';
}

function patchHtml(src, config) {
  var html = src, meta = config.meta;
  html = html.replace(/<title>[^<]*<\/title>/, '<title>' + escapeHtml(meta.title) + '</title>');
  var descTag = '<meta name="description" content="' + escapeHtml(meta.description || '') + '"/>';
  if (/<meta[^>]+name="description"/.test(html))
    html = html.replace(/<meta[^>]+name="description"[^>]*\/?>/, descTag);
  else html = html.replace('</head>', '  ' + descTag + '\n</head>');
  var kwTag = '<meta name="keywords" content="' + escapeHtml((meta.keywords || []).join(', ')) + '"/>';
  if (/<meta[^>]+name="keywords"/.test(html))
    html = html.replace(/<meta[^>]+name="keywords"[^>]*\/?>/, kwTag);
  else html = html.replace('</head>', '  ' + kwTag + '\n</head>');
  return html;
}

function main() {
  var args = process.argv.slice(2);
  if (args.includes('--help') || args.length < 2) {
    console.log('\nthe-network generator');
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

  console.log('=== the-network generator ===\n');

  var configPath = path.join(inputDir, 'game.json');
  if (!fs.existsSync(configPath)) { console.error('ERROR: game.json not found in: ' + inputDir); process.exit(1); }

  var config;
  try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); }
  catch(e) { console.error('ERROR: Invalid JSON: ' + e.message); process.exit(1); }

  if (!config.meta) config.meta = {};
  if (!config.meta.slug) config.meta.slug = slugify(config.meta.title || 'the-network');
  if (config.meta.keywords && typeof config.meta.keywords === 'string')
    config.meta.keywords = config.meta.keywords.split(',').map(function(k){return k.trim();}).filter(Boolean);

  var result = validate(config);
  if (result.warnings.length) { console.log('Warnings:'); result.warnings.forEach(function(w){console.log('  WARN: '+w);}); console.log(''); }
  if (result.errors.length) {
    console.error('Validation errors:');
    result.errors.forEach(function(e){console.error('  ERROR: '+e);});
    console.error('\n'+result.errors.length+' errors, '+result.warnings.length+' warnings');
    process.exit(1);
  }
  var bridges = (config.relationships||[]).filter(function(r){return r.bridge;});
  console.log('Validation passed. 0 errors, '+result.warnings.length+' warnings');
  console.log('  '+config.relationships.length+' relationships, '+bridges.length+' bridges, '+config.turns+' turns\n');
  if (validateOnly) process.exit(0);

  if (!fs.existsSync(sourceHtml)) { console.error('ERROR: Source HTML not found: '+sourceHtml); process.exit(1); }

  var outputDir;
  var nextjsIdx = args.indexOf('--nextjs');
  if (nextjsIdx !== -1) {
    var root = args[nextjsIdx+1];
    if (!root||root.startsWith('--')) { console.error('ERROR: --nextjs requires a path'); process.exit(1); }
    outputDir = path.join(path.resolve(root), 'public', 'games', config.meta.slug);
  } else if (!dryRun) {
    outputDir = path.resolve(args.find(function(a,i){return !a.startsWith('-')&&i>1;})||'dist');
  }

  if (dryRun) {
    console.log('[dry-run] Would write: index.html, user-config.js');
    console.log('\nDry run complete.');
    process.exit(0);
  }

  console.log('Config     : '+configPath);
  console.log('Source HTML: '+sourceHtml);
  console.log('Slug       : '+config.meta.slug);
  console.log('Output     : '+outputDir+'\n');

  fs.mkdirSync(outputDir,{recursive:true});
  fs.mkdirSync(path.join(outputDir,'assets'),{recursive:true});

  fs.writeFileSync(path.join(outputDir,'index.html'), patchHtml(fs.readFileSync(sourceHtml,'utf8'), config));
  console.log('Wrote '+path.join(outputDir,'index.html'));

  fs.writeFileSync(path.join(outputDir,'user-config.js'), generateUserConfig(config));
  console.log('Wrote '+path.join(outputDir,'user-config.js'));

  var userAssets = path.join(inputDir,'assets');
  if (fs.existsSync(userAssets)) {
    var files = fs.readdirSync(userAssets).filter(function(f){return !f.startsWith('.');});
    files.forEach(function(f){fs.copyFileSync(path.join(userAssets,f),path.join(outputDir,'assets',f));});
    if (files.length>0) console.log('Copied '+files.length+' user assets');
  }

  console.log('\n=== Generation complete ===');
  console.log('Deploy: push to main, appears at /games/'+config.meta.slug);
}

main();
