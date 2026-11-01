import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RadioCard } from '@/components/ui/RadioCard'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import type { CertBasis } from '@/types/gcp'
import type { TccaProject } from '@/types/tcca'
import { BasisHandPicker } from './BasisHandPicker'
import { BasisLevelBuilder } from './BasisLevelBuilder'
import { BasisReusePicker } from './BasisReusePicker'

/** What step 2 will do on Continue: save a basis built here and link it, or
    link an existing basis as it is. */
export type BasisDraft =
  | { kind: 'save'; regulationIds: string[]; fields: Partial<CertBasis> }
  | { kind: 'link'; basisId: string }

type Mode = 'level' | 'reuse' | 'hand'

const MODES: { mode: Mode; title: string; description: string }[] = [
  { mode: 'level', title: 'Build from amendment level', description: 'Part and level from the Type Certificate Data Sheet (TCDS) pick each rule’s amendment.' },
  { mode: 'reuse', title: 'Start from an existing basis', description: 'Reuse a basis already built for this aircraft.' },
  { mode: 'hand', title: 'Pick rules by hand', description: 'Choose sections and amendments one by one.' },
]

/**
 * Step 2 — the project's certification basis, built one of three ways (see
 * `MODES`). The amendment-level builder and existing-basis reuse follow
 * Harris's GCP walkthrough (2026-09-09); picking by hand is the step as it
 * was before (client instruction, 2026-09-23), unchanged in
 * `BasisHandPicker`.
 *
 * A basis this project shares with others is never edited from here:
 * building or hand-picking while linked to a shared basis saves a new one.
 */
export function FlowStepBasis({ project, onBack, onNext }: { project: TccaProject; onBack: () => void; onNext: () => void }) {
  const bases = useGcpFlowStore((s) => s.bases)
  const projectBasis = useGcpFlowStore((s) => s.projectBasis)
  const saveBasis = useGcpFlowStore((s) => s.saveBasis)
  const linkBasis = useGcpFlowStore((s) => s.linkBasis)

  const existing = bases.find((b) => b.id === projectBasis[project.id])
  const shared = !!existing && Object.entries(projectBasis).some(([pid, bid]) => bid === existing.id && pid !== project.id)
  const owned = existing && !shared ? existing : undefined

  const [mode, setMode] = useState<Mode>(() => (!existing ? 'level' : shared ? 'reuse' : existing.level ? 'level' : 'hand'))
  const [draft, setDraft] = useState<BasisDraft | null>(null)

  const changeMode = (next: Mode) => { setDraft(null); setMode(next) }

  const continueWithBasis = () => {
    if (!draft) return
    if (draft.kind === 'link') {
      linkBasis(project.id, draft.basisId)
    } else {
      const id = owned?.id ?? crypto.randomUUID()
      /* The project's own basis keeps what the builder doesn't edit
         (description, source document). */
      saveBasis({
        ...owned,
        aircraftModel: owned?.aircraftModel ?? project.number,
        tcdsNumber: owned?.tcdsNumber ?? '',
        ...draft.fields,
        id,
        regulationIds: draft.regulationIds,
      })
      linkBasis(project.id, id)
    }
    onNext()
  }

  const count = draft?.kind === 'save' ? draft.regulationIds.length : 0

  return (
    /* The choices scroll; Back and Continue stay at the bottom of the screen
       (as on Scope Rules) instead of scrolling away under a long rule list. */
    <section className="flex min-h-0 flex-1 flex-col gap-lg">
      <div className="grid min-h-0 flex-1 content-start gap-lg overflow-y-auto">
        <div className="grid gap-xxss">
          <h2 className="text-base font-semibold text-text-primary">Certification basis</h2>
          <p className="text-xs text-text-muted">The rules this project is certified against, each at one amendment.</p>
        </div>

        <fieldset className="grid gap-base tablet:grid-cols-3">
          <legend className="sr-only">How to build the certification basis</legend>
          {MODES.map((m) => (
            <RadioCard key={m.mode} name="basis-mode" value={m.mode} title={m.title} description={m.description}
              checked={mode === m.mode} onChange={() => changeMode(m.mode)} />
          ))}
        </fieldset>

        {mode === 'level' && <BasisLevelBuilder projectNumber={project.number} existing={owned} onDraft={setDraft} />}
        {mode === 'reuse' && <BasisReusePicker initialBasisId={shared ? existing?.id : undefined} onDraft={setDraft} />}
        {mode === 'hand' && <BasisHandPicker existing={owned} onDraft={setDraft} />}
      </div>

      <div className="flex shrink-0 items-center justify-between">
        <Button variant="secondary" leadingIcon={<ArrowLeft size={16} />} onClick={onBack}>Back</Button>
        <Button disabled={!draft} onClick={continueWithBasis}>
          {mode === 'reuse'
            ? 'Use this basis & continue'
            : count > 0 ? `Attach ${count} regulation${count === 1 ? '' : 's'} & continue` : 'Attach regulations & continue'}
        </Button>
      </div>
    </section>
  )
}
