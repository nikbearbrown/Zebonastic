import { join } from 'path'
import { readFileSync } from 'fs'
import type { Metadata } from 'next'
import { sql } from '@/lib/db'
import { scanArtifactsDir } from '@/lib/html-meta'
import ToolsBrowser from './ToolsBrowser'
import type { ToolCard } from './ToolsBrowser'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tools - Zebonastic',
  description: 'Tools directory curated by Zebonastic.',
}

interface DbTool {
  id: string
  name: string
  slug: string
  description: string
  tool_type: 'link' | 'artifact'
  claude_url: string | null
  tags: string[]
}

export default async function ToolsPage() {
  // 1. Filesystem artifacts
  const artifactDocs = scanArtifactsDir(join(process.cwd(), 'public', 'artifacts'))
  const artifactTools: ToolCard[] = artifactDocs.map(doc => ({
    id: `fs-${doc.slug}`,
    name: doc.title,
    description: doc.description,
    tags: doc.tags,
    source: 'filesystem' as const,
    type: 'artifact' as const,
    href: `/tools/${doc.slug}`,
    artifactPath: doc.artifactPath,
    openExternal: false,
  }))

  // 2. Database link tools
  let dbRows: DbTool[] = []
  try {
    dbRows = await sql`SELECT * FROM tools WHERE tool_type = 'link' ORDER BY created_at DESC` as unknown as DbTool[]
  } catch (err) {
    console.error('[tools/page] Failed to fetch DB tools:', err)
  }
  const dbTools: ToolCard[] = dbRows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description || '',
    tags: row.tags || [],
    source: 'database' as const,
    type: 'link' as const,
    href: row.claude_url || '#',
    externalUrl: row.claude_url || undefined,
    openExternal: true,
  }))

  // 3. Merge, deduplicate by id prefix (filesystem wins)
  const fsNames = new Set(artifactTools.map(t => t.name))
  const linkTools = dbTools.filter(t => !fsNames.has(t.name))
  const allTools = [...artifactTools, ...linkTools]

  // Read curated filter tags from filters.json
  let filterTags: string[] = []
  try {
    const raw = readFileSync(join(process.cwd(), 'public', 'artifacts', 'filters.json'), 'utf-8')
    filterTags = JSON.parse(raw)
  } catch {}

  return (
    <div className="container px-4 md:px-6 mx-auto py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tighter mb-4">Tools</h1>
        <p className="text-muted-foreground mb-8">
          A curated directory of AI tools for educators, students, and professionals.
        </p>
        <ToolsBrowser tools={allTools} filterTags={filterTags} />
      </div>
    </div>
  )
}
