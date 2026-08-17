import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { DetailField as Field } from '@/components/patterns/DetailView'
import { useProjectsStore } from '@/stores/projectsStore'
import { useTccaStore } from '@/stores/tccaStore'
import { TCCA_STATUS_LABEL, TCCA_STATUS_TONE } from '@/lib/tccaDisplay'
import type { TccaProject } from '@/types/tcca'

export interface TccaOverviewTabProps {
  tcca: TccaProject
}

/** Read-only overview — editing happens through the header's actions menu,
    not a pencil on every section. */
export function TccaOverviewTab({ tcca }: TccaOverviewTabProps) {
  const projects = useProjectsStore((s) => s.rows)
  const updateTcca = useTccaStore((s) => s.updateTcca)
  const [linkChoice, setLinkChoice] = useState('')

  const linked = tcca.projectIds
    .map((id) => projects.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
  const unlinked = projects.filter((p) => !tcca.projectIds.includes(p.id))

  const addLink = () => {
    if (!linkChoice) return
    updateTcca(tcca.id, { projectIds: [...tcca.projectIds, linkChoice] })
    setLinkChoice('')
  }
  const removeLink = (id: string) =>
    updateTcca(tcca.id, { projectIds: tcca.projectIds.filter((p) => p !== id) })

  return (
    <div className="grid gap-lg">
      <section className="rounded-sm border border-border-default bg-neutral-25 p-lg">
        <h2 className="text-sm font-semibold text-text-primary">Details</h2>
        <div className="mt-lg grid grid-cols-2 gap-lg tablet:grid-cols-4">
          <Field label="Number">{tcca.number}</Field>
          <Field label="Status"><Badge tone={TCCA_STATUS_TONE[tcca.status]}>{TCCA_STATUS_LABEL[tcca.status]}</Badge></Field>
          <Field label="Opened">{tcca.openedDate}</Field>
          <Field label="Closed">{tcca.closedDate || '—'}</Field>
        </div>
        <div className="mt-lg">
          <Field label="Description">{tcca.description}</Field>
        </div>
      </section>

      <section className="rounded-sm border border-border-default bg-neutral-25 p-lg">
        <h2 className="text-sm font-semibold text-text-primary">Notes</h2>
        <div className="mt-lg grid gap-lg">
          <Field label="Next Action">{tcca.nextAction || '—'}</Field>
          <Field label="Comments">{tcca.comments || '—'}</Field>
        </div>
      </section>

      <section className="rounded-sm border border-border-default bg-neutral-25 p-lg">
        <h2 className="text-sm font-semibold text-text-primary">Linked Elisen Projects</h2>
        <p className="mt-xxss text-xs text-text-muted">
          Reference links only. No data is shared between the two. Hours are charged to the linked project.
        </p>
        <ul className="mt-lg grid gap-sm">
          {linked.length === 0 && (
            <li className="text-sm text-text-muted">No linked project, baseline / DAO organizational work.</li>
          )}
          {linked.map((p, i) => (
            <li key={p.id} className="flex items-center justify-between gap-lg rounded-sm border border-border-default px-base py-sm">
              <div className="min-w-0">
                <Link to={`/projects/${p.id}`} className="text-sm font-semibold text-text-primary underline-offset-2 hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
                  {p.number}-{p.subNumber}
                </Link>
                <span className="ml-sm text-sm text-text-secondary">{p.title}</span>
                {i === 0 && <span className="ml-sm text-xs text-text-muted">(primary)</span>}
              </div>
              <button type="button" onClick={() => removeLink(p.id)} aria-label={`Unlink project ${p.number}-${p.subNumber}`}
                className="rounded-sm p-xs text-text-muted transition-colors duration-fast hover:bg-neutral-100 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
                <X size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        {unlinked.length > 0 && (
          <div className="mt-lg flex flex-wrap items-center gap-sm">
            <label htmlFor="link-project" className="sr-only">Link another project</label>
            <Select id="link-project" value={linkChoice} placeholder="Link another project..." className="min-w-0 flex-1" onChange={(e) => setLinkChoice(e.target.value)}>
              {unlinked.map((p) => (
                <option key={p.id} value={p.id}>{p.number}-{p.subNumber} — {p.title}</option>
              ))}
            </Select>
            <Button variant="secondary" onClick={addLink} disabled={!linkChoice}>Link</Button>
          </div>
        )}
      </section>
    </div>
  )
}
