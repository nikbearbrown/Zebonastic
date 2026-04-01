import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { scanArtifactsDir } from './lib/lib-html-meta-addition'

// ── Setup ────────────────────────────────────────────────────────────────────

const TEST_DIR = '/tmp/test-artifacts-spike'

// Clean slate
if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })

// Flat HTML tool
mkdirSync(TEST_DIR, { recursive: true })
writeFileSync(
  join(TEST_DIR, 'flat-tool.html'),
  `<html><head>
  <title>Flat Tool</title>
  <meta name="description" content="A flat HTML tool"/>
  <meta name="keywords" content="test, flat, html"/>
</head><body></body></html>`
)

// Directory-based game
mkdirSync(join(TEST_DIR, 'dir-game'), { recursive: true })
writeFileSync(
  join(TEST_DIR, 'dir-game', 'index.html'),
  `<html><head>
  <title>Directory Game</title>
  <meta name="description" content="A directory-based game"/>
  <meta name="keywords" content="game, directory, trust, ethics"/>
</head><body></body></html>`
)

// ── Run ──────────────────────────────────────────────────────────────────────

const results = scanArtifactsDir(TEST_DIR)

// ── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(name: string, ok: boolean) {
  if (ok) {
    console.log(`  PASS  ${name}`)
    passed++
  } else {
    console.log(`  FAIL  ${name}`)
    failed++
  }
}

const flat = results.find(r => r.slug === 'flat-tool')
const dir = results.find(r => r.slug === 'dir-game')

// ── Assertions ───────────────────────────────────────────────────────────────

console.log('\n=== scanArtifactsDir spike tests ===\n')

assert('Result count = 2', results.length === 2)

// flat-tool checks
assert('flat-tool: isDirectory = false', flat?.isDirectory === false)
assert("flat-tool: slug = 'flat-tool'", flat?.slug === 'flat-tool')
assert(
  "flat-tool: artifactPath = '/artifacts/flat-tool.html'",
  flat?.artifactPath === '/artifacts/flat-tool.html'
)
assert(
  "flat-tool: keywords includes 'test', 'flat', 'html'",
  ['test', 'flat', 'html'].every(k => flat?.tags.includes(k) ?? false)
)

// dir-game checks
assert('dir-game: isDirectory = true', dir?.isDirectory === true)
assert("dir-game: slug = 'dir-game'", dir?.slug === 'dir-game')
assert(
  "dir-game: artifactPath = '/artifacts/dir-game/index.html'",
  dir?.artifactPath === '/artifacts/dir-game/index.html'
)
assert(
  "dir-game: keywords includes 'game', 'directory', 'trust', 'ethics'",
  ['game', 'directory', 'trust', 'ethics'].every(k => dir?.tags.includes(k) ?? false)
)
assert("dir-game: title = 'Directory Game'", dir?.title === 'Directory Game')

// Both descriptions non-empty
assert(
  'Both results: description is non-empty string',
  typeof flat?.description === 'string' &&
    flat.description.length > 0 &&
    typeof dir?.description === 'string' &&
    dir.description.length > 0
)

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n--- ${passed} passed, ${failed} failed ---\n`)

// ── Cleanup ──────────────────────────────────────────────────────────────────

rmSync(TEST_DIR, { recursive: true })
console.log('Cleaned up', TEST_DIR)

process.exit(failed > 0 ? 1 : 0)
