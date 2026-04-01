'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Search, X, ExternalLink } from 'lucide-react'

interface Report {
  file: string
  title: string
  description: string
  project: string
}

export default function ReportsBrowser({ reports }: { reports: Report[] }) {
  const [query, setQuery] = useState('')
  const [activeProject, setActiveProject] = useState<string | null>(null)

  const projects = useMemo(() => {
    return Array.from(new Set(reports.map(r => r.project))).sort()
  }, [reports])

  const filtered = useMemo(() => {
    let result = reports
    if (activeProject) {
      result = result.filter(r => r.project === activeProject)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        r =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.project.toLowerCase().includes(q)
      )
    }
    return result
  }, [reports, query, activeProject])

  // Build slug from file path: "Dewey/Irreducibly-Human-AI-Sherpa.html" -> "Dewey/Irreducibly-Human-AI-Sherpa"
  const toSlug = (file: string) => file.replace(/\.html$/, '')

  return (
    <>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reports…"
          className="w-full pl-10 pr-10 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {projects.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center mb-8">
          <span className="text-xs text-muted-foreground mr-1">Project:</span>
          {activeProject && (
            <button onClick={() => setActiveProject(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
          {projects.map(project => (
            <Badge
              key={project}
              variant={activeProject === project ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setActiveProject(activeProject === project ? null : project)}
            >
              {project}
            </Badge>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">{query || activeProject ? 'No reports match your search.' : 'No reports yet.'}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(report => (
            <Link key={report.file} href={`/reports/${toSlug(report.file)}`}>
              <Card className="h-full hover:border-foreground/20 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {report.title}
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </CardTitle>
                  {report.description && <CardDescription className="line-clamp-2">{report.description}</CardDescription>}
                  <div className="pt-2">
                    <Badge variant="secondary" className="text-[10px]">{report.project}</Badge>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
