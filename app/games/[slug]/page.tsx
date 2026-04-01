import Link from 'next/link'
import { notFound } from 'next/navigation'
import { join } from 'path'
import { existsSync } from 'fs'
import { scanArtifactsDir } from '@/lib/html-meta'

function resolveGame(slug: string) {
  const dir = join(process.cwd(), 'public', 'games')
  // Directory game: public/games/[slug]/index.html
  if (existsSync(join(dir, slug, 'index.html'))) {
    const games = scanArtifactsDir(dir)
    return games.find(g => g.slug === slug) || null
  }
  // Flat HTML game: public/games/[slug].html
  if (existsSync(join(dir, `${slug}.html`))) {
    const games = scanArtifactsDir(dir)
    return games.find(g => g.slug === slug) || null
  }
  return null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const game = resolveGame(slug)
  if (game) {
    return {
      title: `${game.title} - Zebonastic Games`,
      description: game.description || `${game.title} — a Zebonastic game`,
    }
  }
  return { title: 'Game - Zebonastic' }
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const game = resolveGame(slug)
  if (!game) notFound()

  // Rewrite artifactPath from /artifacts/ to /games/
  const src = game.artifactPath.replace('/artifacts/', '/games/')

  return (
    <div className="flex flex-col w-full" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      <div className="w-full border-b bg-background">
        <div className="container px-4 md:px-6 mx-auto py-4">
          <Link
            href="/games"
            className="text-sm text-muted-foreground hover:text-foreground mb-1 inline-block"
          >
            ← Back to Games
          </Link>
          <h1 className="text-2xl font-bold tracking-tighter">{game.title}</h1>
          {game.description && (
            <p className="text-sm text-muted-foreground mt-1">{game.description}</p>
          )}
        </div>
      </div>
      <div className="flex-1 w-full">
        <iframe
          src={src}
          title={game.title}
          className="w-full border-none"
          style={{ minHeight: 'calc(100vh - 12rem)' }}
        />
      </div>
    </div>
  )
}
