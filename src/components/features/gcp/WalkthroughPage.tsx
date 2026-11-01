import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { DetailCard } from '@/components/patterns/DetailView'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import type { Walkthrough } from '@/lib/walkthroughs'

/**
 * A narrated walkthrough video, for the client (2026-11-02), opened from its area's "Watch
 * Walkthrough". The browser's own player (keyboard, fullscreen, speed) with an English
 * captions track; nothing downloads until play (`preload="none"`, the title card as poster).
 * The transcript carries the same words. Header as on Create Certification Basis: a ← back
 * icon beside the title.
 */
export function WalkthroughPage({ walkthrough: w }: { walkthrough: Walkthrough }) {
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)
  return (
    <AppShell activeItem="GCP" activeChild={w.activeChild} title={w.title} description={w.description}
      headerLeft={
        <div className="min-w-0">
          <div className="flex items-center gap-sm">
            <Button variant="tertiary" size="sm" aria-label={w.back.label} title="Go back"
              leadingIcon={<ArrowLeft size={18} aria-hidden />} onClick={() => navigate(w.back.to)} />
            <h1 className="text-2xl font-bold text-text-primary">{w.title}</h1>
          </div>
          <p className="mt-xxss text-sm text-text-secondary">{w.description}</p>
        </div>
      }>
      <div className="grid gap-lg" style={{ maxWidth: 1280 }}>
        {failed && (
          <Alert tone="warning" title="The video could not be loaded">
            Refresh the page to try again. The transcript below has the full narration.
          </Alert>
        )}
        <video key={w.video} src={w.video} poster={w.poster} width={1920} height={1080} controls preload="none"
          onError={() => setFailed(true)} aria-label={w.title}
          className="block h-auto w-full rounded-sm border border-border-default">
          <track kind="captions" src={w.captions} srcLang="en" label="English" />
          Your browser cannot play this video. The transcript below has the full narration.
        </video>
        <DetailCard title="Transcript">
          <div className="grid gap-lg">
            {w.chapters.map((chapter, i) => (
              <section key={chapter.title} aria-labelledby={`walkthrough-chapter-${i}`}>
                <h3 id={`walkthrough-chapter-${i}`} className="text-sm font-semibold text-text-primary">{i + 1}. {chapter.title}</h3>
                <p className="mt-xs text-sm text-text-secondary">{chapter.text}</p>
              </section>
            ))}
          </div>
        </DetailCard>
      </div>
    </AppShell>
  )
}
