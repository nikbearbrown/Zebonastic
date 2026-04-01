import { join } from 'path'
import type { Metadata } from 'next'
import Link from 'next/link'
import { scanArtifactsDir } from '@/lib/html-meta'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Games - Zebonastic',
  description: 'Interactive games exploring ethics, trust, and game theory.',
}

export default function GamesPage() {
  const games = scanArtifactsDir(join(process.cwd(), 'public', 'games'))

  return (
    <div className="container px-4 md:px-6 mx-auto py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tighter mb-4">Games</h1>
        <p className="text-muted-foreground mb-8">
          Interactive games exploring ethics, trust, and game theory.
        </p>

        {games.length === 0 ? (
          <p className="text-sm text-muted-foreground">Games coming soon.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {games.map((game) => (
              <Link key={game.slug} href={`/games/${game.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">{game.title}</CardTitle>
                    {game.description && (
                      <CardDescription>{game.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {game.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {game.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
