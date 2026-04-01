import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

export interface HtmlDocMeta {
  slug: string
  filename: string
  title: string
  description: string
  tags: string[]
}

export interface ArtifactMeta {
  slug: string
  title: string
  description: string
  tags: string[]
  isDirectory: boolean
  artifactPath: string
}

export interface GroupedHtmlDocs {
  folder: string
  folderTitle: string
  docs: HtmlDocMeta[]
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
}

function extractTag(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern)
  return match ? decodeHtmlEntities(match[1].trim()) : null
}

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function scanHtmlDir(dir: string): HtmlDocMeta[] {
  let files: string[]
  try {
    files = readdirSync(dir).filter(f => f.endsWith('.html')).sort()
  } catch {
    return []
  }

  return files.map(filename => {
    const slug = filename.replace('.html', '')
    let title = titleCase(slug)
    let description = ''
    let tags: string[] = []

    try {
      const html = readFileSync(join(dir, filename), 'utf-8')
      const t = extractTag(html, /<title[^>]*>([^<]+)<\/title>/i)
      if (t) title = t
      const d = extractTag(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
        ?? extractTag(html, /<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i)
      if (d) description = d
      const k = extractTag(html, /<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i)
        ?? extractTag(html, /<meta\s+content=["']([^"']+)["']\s+name=["']keywords["']/i)
      if (k) tags = k.split(',').map(t => t.trim()).filter(Boolean)
    } catch {}

    return { slug, filename, title, description, tags }
  })
}

/** Scan subdirectories of `dir`, returning docs grouped by folder name, sorted alphabetically. */
export function scanHtmlSubdirs(dir: string): GroupedHtmlDocs[] {
  let entries: string[]
  try {
    entries = readdirSync(dir).sort()
  } catch {
    return []
  }

  const groups: GroupedHtmlDocs[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    try {
      if (!statSync(fullPath).isDirectory()) continue
    } catch {
      continue
    }

    const docs = scanHtmlDir(fullPath).map(doc => ({
      ...doc,
      // prefix slug with folder so routes resolve correctly
      slug: `${entry}/${doc.slug}`,
    }))

    if (docs.length > 0) {
      groups.push({
        folder: entry,
        folderTitle: titleCase(entry),
        docs: docs.sort((a, b) => a.title.localeCompare(b.title)),
      })
    }
  }

  return groups
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
      const slug = entry.replace('.html', '')
      try {
        const html = readFileSync(fullPath, 'utf-8')
        const t = extractTag(html, /<title[^>]*>([^<]+)<\/title>/i)
        const d =
          extractTag(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ??
          extractTag(html, /<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i)
        const k =
          extractTag(html, /<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i) ??
          extractTag(html, /<meta\s+content=["']([^"']+)["']\s+name=["']keywords["']/i)
        results.push({
          slug,
          title: t || titleCase(slug),
          description: d || '',
          tags: k ? k.split(',').map(s => s.trim()).filter(Boolean) : [],
          isDirectory: false,
          artifactPath: `/artifacts/${entry}`,
        })
      } catch {}
    } else if (stat.isDirectory()) {
      const indexPath = join(fullPath, 'index.html')
      try {
        const html = readFileSync(indexPath, 'utf-8')
        const t = extractTag(html, /<title[^>]*>([^<]+)<\/title>/i)
        const d =
          extractTag(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ??
          extractTag(html, /<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i)
        const k =
          extractTag(html, /<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i) ??
          extractTag(html, /<meta\s+content=["']([^"']+)["']\s+name=["']keywords["']/i)
        results.push({
          slug: entry,
          title: t || titleCase(entry),
          description: d || '',
          tags: k ? k.split(',').map(s => s.trim()).filter(Boolean) : [],
          isDirectory: true,
          artifactPath: `/artifacts/${entry}/index.html`,
        })
      } catch {
        // No index.html — skip
      }
    }
  }

  return results
}
