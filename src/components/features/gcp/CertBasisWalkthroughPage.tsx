import { useState } from 'react'
import { AppShell } from '@/components/patterns/AppShell'
import { DetailCard } from '@/components/patterns/DetailView'
import { Alert } from '@/components/ui/Alert'
import { WALKTHROUGH } from '@/lib/certBasisWalkthrough'

/**
 * The narrated Certification Basis walkthrough, for the client (2026-11-02), opened
 * from the list page's "Watch Walkthrough". The browser's own player (keyboard,
 * fullscreen, speed) with an English captions track; nothing downloads until play
 * (`preload="none"`, the title card as poster). The transcript carries the same words.
 */
export function CertBasisWalkthroughPage() {
  const [failed, setFailed] = useState(false)
  return (
    <AppShell activeItem="GCP" activeChild="Certification Basis" title="Certification Basis Walkthrough"
      description="A narrated tour of finding, creating, reviewing and sharing a certification basis. 2 min 40 s.">
      <div className="grid gap-lg" style={{ maxWidth: 1280 }}>
        {failed && (
          <Alert tone="warning" title="The video could not be loaded">
            Refresh the page to try again. The transcript below has the full narration.
          </Alert>
        )}
        <video src={WALKTHROUGH.video} poster={WALKTHROUGH.poster} width={1920} height={1080} controls preload="none"
          onError={() => setFailed(true)} aria-label="Certification Basis walkthrough"
          className="block h-auto w-full rounded-sm border border-border-default">
          <track kind="captions" src={WALKTHROUGH.captions} srcLang="en" label="English" />
          Your browser cannot play this video. The transcript below has the full narration.
        </video>
        <DetailCard title="Transcript">
          <div className="grid gap-lg">
            {WALKTHROUGH.chapters.map((chapter, i) => (
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
