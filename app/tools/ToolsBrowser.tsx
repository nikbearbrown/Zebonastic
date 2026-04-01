'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Search, X } from 'lucide-react'

export interface ToolCard {
  id: string
  name: string
  description: string
  tags: string[]
  source: 'filesystem' | 'database'
  type: 'artifact' | 'link'
  href: string
  artifactPath?: string
  externalUrl?: string
  openExternal: boolean
}

export default function ToolsBrowser({ tools, filterTags = [] }: { tools: ToolCard[]; filterTags?: string[] }) {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const allTags = useMemo(() => {
    if (filterTags.length > 0) return filterTags
    const set = new Set<string>()
    tools.forEach(t => t.tags?.forEach(tag => set.add(tag)))
    return Array.from(set).sort()
  }, [tools, filterTags])

  const filtered = useMemo(() => {
    let result = tools
    if (activeTag) {
      result = result.filter(t => t.tags?.includes(activeTag))
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        t =>
          t.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tags?.some(tag => tag.toLowerCase().includes(q))
      )
    }
    return result
  }, [tools, query, activeTag])

  return (
    <>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools…"
          className="w-full pl-10 pr-10 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center mb-8">
          <span className="text-xs text-muted-foreground mr-1">Filter:</span>
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
          {allTags.map(tag => (
            <Badge
              key={tag}
              variant={activeTag === tag ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Cards */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {query || activeTag ? 'No tools match your search.' : 'Tools directory coming soon.'}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {filtered.map((tool) => {
            const cardContent = (
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {tool.name}
                    <Badge variant="default" className="text-xs">
                      {tool.type === 'artifact' ? 'Artifact' : 'Link'}
                    </Badge>
                  </CardTitle>
                  {tool.description && (
                    <CardDescription>{tool.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {tool.tags && tool.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tool.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )

            if (tool.openExternal) {
              return (
                <a
                  key={tool.id}
                  href={tool.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {cardContent}
                </a>
              )
            }

            return (
              <Link key={tool.id} href={tool.href}>
                {cardContent}
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
