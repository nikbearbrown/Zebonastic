import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

export interface ArtifactMeta {
  slug: string
  title: string
  description: string
  tags: string[]
  isDirectory: boolean
  artifactPath: string
}

function extractTag(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern)
  return match ? match[1].trim() : null
}

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function extractMeta(html: string, slug: string): Pick<ArtifactMeta, 'title' | 'description' | 'tags'> {
  let title = titleCase(slug)
  let description = ''
  let tags: string[] = []

  const t = extractTag(html, /<title[^>]*>([^<]+)<\/title>/i)
  if (t) title = t
  const d =
    extractTag(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ??
    extractTag(html, /<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i)
  if (d) description = d
  const k =
    extractTag(html, /<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i) ??
    extractTag(html, /<meta\s+content=["']([^"']+)["']\s+name=["']keywords["']/i)
  if (k) tags = k.split(',').map(t => t.trim()).filter(Boolean)

  return { title, description, tags }
}

/**
 * Scan a directory for artifact tools. Supports two layouts:
 *   1. Flat HTML files:  <dir>/foo-tool.html  → slug='foo-tool', artifactPath='/artifacts/foo-tool.html'
 *   2. Directory games:  <dir>/my-game/index.html → slug='my-game', artifactPath='/artifacts/my-game/index.html'
 *
 * Returns sorted ArtifactMeta[].
 */
export function scanArtifactsDir(dir: string): ArtifactMeta[] {
  let entries: string[]
  try {
    entries = readdirSync(dir).sort()
  } catch {
    return []
  }

  const results: ArtifactMeta[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    let stat
    try {
      stat = statSync(fullPath)
    } catch {
      continue
    }

    if (stat.isFile() && entry.endsWith('.html')) {
      // Flat HTML file
      const slug = entry.replace('.html', '')
      try {
        const html = readFileSync(fullPath, 'utf-8')
        const meta = extractMeta(html, slug)
        results.push({
          slug,
          isDirectory: false,
          artifactPath: `/artifacts/${entry}`,
          ...meta,
        })
      } catch {}
    } else if (stat.isDirectory()) {
      // Directory with index.html
      const indexPath = join(fullPath, 'index.html')
      try {
        const html = readFileSync(indexPath, 'utf-8')
        const meta = extractMeta(html, entry)
        results.push({
          slug: entry,
          isDirectory: true,
          artifactPath: `/artifacts/${entry}/index.html`,
          ...meta,
        })
      } catch {
        // No index.html in this directory — skip
      }
    }
  }

  return results
}
