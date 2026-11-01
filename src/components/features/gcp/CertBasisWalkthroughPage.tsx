import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { DetailCard } from '@/components/patterns/DetailView'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { WALKTHROUGH } from '@/lib/certBasisWalkthrough'

/**
 * The narrated Certification Basis walkthrough, for the client (2026-11-02), opened
 * from the list page's "Watch Walkthrough". The browser's own player (keyboard,
 * fullscreen, speed) with an English captions track; nothing downloads until play
 * (`preload="none"`, the title card as poster). The transcript carries the same words.
 */
export function CertBasisWalkthroughPage() {
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)
  const description = 'A narrated tour of finding, creating, reviewing and sharing a certification basis. 2 min 40 s.'
  return (
    <AppShell activeItem="GCP" activeChild="Certification Basis" title="Certification Basis Walkthrough" description={description}
      /* The ← beside the title, as on Create Certification Basis: back to the list it opens from. */
      headerLeft={
        <div className="min-w-0">
          <div className="flex items-center gap-sm">
            <Button variant="tertiary" size="sm" aria-label="Go back to all certification bases" title="Go back"
              leadingIcon={<ArrowLeft size={18} aria-hidden />} onClick={() => navigate('/gcp/cert-bases')} />
            <h1 className="text-2xl font-bold text-text-primary">Certification Basis Walkthrough</h1>
          </div>
          <p className="mt-xxss text-sm text-text-secondary">{description}</p>
        </div>
      }>
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
