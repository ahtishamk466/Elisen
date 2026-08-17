import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/patterns/EmptyState'
import { useTccaStore } from '@/stores/tccaStore'
import { TCCA_STATUS_LABEL, TCCA_STATUS_TONE } from '@/lib/tccaDisplay'
import { TccaProjectDrawer } from './TccaProjectDrawer'

/** The TCCA tab inside an Elisen project: its linked TCCA projects, with a
    second entry point to open one when approval is needed mid-project. */
export function ProjectTccaTab({ projectId }: { projectId: string }) {
  const navigate = useNavigate()
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const addTcca = useTccaStore((s) => s.addTcca)
  const docLinks = useTccaStore((s) => s.docLinks)
  const [adding, setAdding] = useState(false)

  const linked = tccaProjects.filter((t) => t.projectIds.includes(projectId))

  const openAdd = () => setAdding(true)

  return (
    <div className="grid gap-lg">
      {linked.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<ShieldCheck size={48} strokeWidth={1.5} />}
            title="No TCCA project yet"
            description="Open one when the customer wants Elisen to manage Transport Canada approval for this modification."
            action={<Button leadingIcon={<Plus size={16} />} onClick={openAdd}>Add TCCA project</Button>}
          />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-lg">
            <p className="text-sm text-text-secondary">
              Transport Canada projects linked to this Elisen project. Reference links only. No data is copied.
            </p>
            <Button variant="secondary" leadingIcon={<Plus size={16} />} onClick={openAdd}>
              Add TCCA project
            </Button>
          </div>
          <ul className="grid gap-sm">
            {linked.map((t) => {
              const docCount = docLinks.filter((l) => l.tccaProjectId === t.id).length
              const applicable = Object.keys(t.checklist)
              const complete = applicable.filter((id) => t.checklist[id]).length
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/tcca-projects/${t.id}`)}
                    className="grid w-full gap-xs rounded-sm border border-border-default bg-neutral-25 px-lg py-base text-left transition-colors duration-fast hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                  >
                    <span className="flex flex-wrap items-center justify-between gap-sm">
                      <span className="text-sm font-semibold text-text-primary">{t.number}</span>
                      <Badge tone={TCCA_STATUS_TONE[t.status]}>{TCCA_STATUS_LABEL[t.status]}</Badge>
                    </span>
                    <span className="text-sm text-text-secondary">{t.description}</span>
                    <span className="text-xs text-text-muted">
                      Checklist {complete}/{applicable.length} complete · {docCount} document{docCount === 1 ? '' : 's'} tracked · Opened {t.openedDate}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {adding && (
        <TccaProjectDrawer
          open
          mode="create"
          lockedProjectId={projectId}
          onClose={() => setAdding(false)}
          onSubmit={addTcca}
        />
      )}
    </div>
  )
}
