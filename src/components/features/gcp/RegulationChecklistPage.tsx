import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useTccaStore } from '@/stores/tccaStore'
import { deliverableSummaries, useDocumentsStore } from '@/stores/documentsStore'
import { GcpRegulationsTabs } from './GcpRegulationsTabs'

/**
 * GCP → Regulations → Regulation Checklist.
 *
 * The legacy screen opens by asking for a TCCA project and a deliverable, and
 * that pair is all the client's table stores. What it lists once chosen is
 * still to be confirmed, so the picked pair is shown and the listing below says
 * so rather than inventing columns.
 */
export function RegulationChecklistPage() {
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const documents = useDocumentsStore((s) => s.documents)
  const docRevisions = useDocumentsStore((s) => s.revisions)
  const deliverables = deliverableSummaries(documents, docRevisions)

  const [projectId, setProjectId] = useState('')
  const [deliverableId, setDeliverableId] = useState('')
  const [selected, setSelected] = useState<{ project: string; deliverable: string } | null>(null)

  const project = tccaProjects.find((t) => t.id === projectId)
  const deliverable = deliverables.find((d) => d.id === deliverableId)

  return (
    <AppShell
      activeItem="GCP"
      activeChild="Regulations"
      title="Regulations"
      description="The rule library shared by every certification basis."
    >
      <div className="grid gap-lg">
        <GcpRegulationsTabs active="Checklist" />

        <div className="grid gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg py-lg">
          <div className="grid gap-base tablet:grid-cols-2">
            <FormField label="TCCA Project Number" htmlFor="rc-project" fullWidth>
              <SearchableSelect
                id="rc-project"
                value={projectId}
                placeholder="Select a TCCA Project"
                emptyLabel="No TCCA projects yet."
                options={tccaProjects.map((t) => ({ value: t.id, label: t.number, hint: t.description }))}
                onChange={setProjectId}
              />
            </FormField>
            <FormField label="Deliverable Number" htmlFor="rc-deliverable" fullWidth>
              <SearchableSelect
                id="rc-deliverable"
                value={deliverableId}
                placeholder="Select a Deliverable"
                emptyLabel="No deliverables yet."
                options={deliverables.map((d) => ({ value: d.id, label: `${d.number} Rev ${d.rev}`, hint: d.title }))}
                onChange={setDeliverableId}
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-sm">
            <Button variant="secondary"
              onClick={() => { setProjectId(''); setDeliverableId(''); setSelected(null) }}>
              Clear
            </Button>
            <Button
              disabled={!projectId || !deliverableId}
              onClick={() => setSelected({
                project: project?.number ?? '',
                deliverable: deliverable ? `${deliverable.number} Rev ${deliverable.rev}` : '',
              })}
            >
              Select
            </Button>
          </div>
        </div>

        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<ClipboardList size={48} strokeWidth={1.5} />}
            title={selected ? `${selected.project} · ${selected.deliverable}` : 'Pick a project and a deliverable'}
            description={selected
              ? 'The checklist for this pair will appear here. What it lists is still being confirmed with the client.'
              : 'The checklist is read one TCCA project and deliverable at a time.'}
          />
        </div>
      </div>
    </AppShell>
  )
}
