import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Link2, ShieldCheck, Unlink } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { useTccaStore } from '@/stores/tccaStore'
import { TCCA_STATUS_LABEL, TCCA_STATUS_TONE } from '@/lib/tccaDisplay'
import type { TccaProject } from '@/types/tcca'
import { formatDate } from '@/lib/formatDate'

/**
 * Transport Canada projects this Elisen project relates to, as an association
 * and nothing more.
 *
 * A TCCA project is opened in the TCCA Projects workspace and only *linked*
 * here, the same rule that governs Aircraft, Approvals, Deliverables and Design
 * Data: one TCCA project can cover several Elisen projects, so no project owns
 * one. Unlinking here breaks the reference only, the TCCA project survives.
 */
export function ProjectTccaTab({ projectId }: { projectId: string }) {
  const navigate = useNavigate()
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const docLinks = useTccaStore((s) => s.docLinks)
  const linkProject = useTccaStore((s) => s.linkProject)
  const unlinkProject = useTccaStore((s) => s.unlinkProject)

  const [choice, setChoice] = useState('')
  const [unlinking, setUnlinking] = useState<TccaProject | null>(null)

  const linked = useMemo(
    () => tccaProjects.filter((t) => t.projectIds.includes(projectId)),
    [tccaProjects, projectId],
  )

  /** The whole pool, with already-linked entries disabled and a reason, so
      "why isn't it in the list?" never comes up. */
  const options = useMemo(
    () => tccaProjects.map((t) => ({
      value: t.id,
      label: t.number,
      hint: t.description,
      disabled: t.projectIds.includes(projectId),
      disabledReason: 'Already linked to this project',
    })),
    [tccaProjects, projectId],
  )

  const linkChosen = () => {
    if (!choice) return
    linkProject(choice, projectId)
    setChoice('')
  }

  return (
    <div className="grid gap-lg">
      {linked.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<ShieldCheck size={48} strokeWidth={1.5} />}
            title="No TCCA project linked to this project"
            description={tccaProjects.length === 0
              ? 'No TCCA projects exist yet. They are opened in TCCA Projects, and once one exists you can link it here.'
              : 'Choose a TCCA project below to link it, for when Elisen manages Transport Canada approval for this change.'}
            action={
              <Button variant="secondary" leadingIcon={<ExternalLink size={16} />} onClick={() => navigate('/tcca-projects')}>
                Open TCCA Projects
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-sm">
            <p className="text-sm text-text-secondary">
              {linked.length} Transport Canada project{linked.length === 1 ? '' : 's'} linked to this Elisen project.
              Reference links only. No data is copied between the two.
            </p>
            <Button variant="secondary" leadingIcon={<ExternalLink size={16} />} onClick={() => navigate('/tcca-projects')}>
              Manage in TCCA Projects
            </Button>
          </div>
          <ul className="grid gap-sm">
            {linked.map((t) => {
              const docCount = docLinks.filter((l) => l.tccaProjectId === t.id).length
              const applicable = Object.keys(t.checklist)
              const complete = applicable.filter((id) => t.checklist[id]).length
              return (
                <li key={t.id} className="flex items-start gap-sm rounded-sm border border-border-default bg-neutral-25 px-lg py-base">
                  <button
                    type="button"
                    onClick={() => navigate(`/tcca-projects/${t.id}`)}
                    className="grid min-w-0 flex-1 gap-xs text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                  >
                    <span className="flex flex-wrap items-center gap-sm">
                      <span className="text-sm font-semibold text-text-primary">{t.number}</span>
                      <Badge tone={TCCA_STATUS_TONE[t.status]}>{TCCA_STATUS_LABEL[t.status]}</Badge>
                    </span>
                    <span className="text-sm text-text-secondary">{t.description}</span>
                    <span className="text-xs text-text-muted">
                      Checklist {complete}/{applicable.length} complete · {docCount} document{docCount === 1 ? '' : 's'} tracked · Started {formatDate(t.openedDate)}
                    </span>
                  </button>
                  <ActionsMenu
                    ariaLabel={`Actions for TCCA project ${t.number}`}
                    items={[
                      { label: 'Unlink from project', icon: <Unlink size={16} />, onSelect: () => setUnlinking(t), tone: 'danger' },
                    ]}
                  />
                </li>
              )
            })}
          </ul>
        </>
      )}

      {/* Select and link, never create. */}
      <div className="grid gap-sm rounded-sm border border-border-default bg-neutral-25 p-lg">
        <div className="grid gap-xxss">
          <label htmlFor="link-tcca-project" className="text-sm font-semibold text-text-primary">
            Select a TCCA project to link
          </label>
          <p className="text-xs text-text-muted">
            Transport Canada projects are opened and managed in TCCA Projects. Here you choose which
            existing ones relate to this project.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <div className="min-w-0 flex-1" style={{ minWidth: 260 }}>
            <SearchableSelect
              id="link-tcca-project"
              size="sm"
              value={choice}
              onChange={setChoice}
              options={options}
              placeholder="Search TCCA projects by number or description..."
              emptyLabel="No TCCA projects exist yet, open one in TCCA Projects first."
            />
          </div>
          <Button leadingIcon={<Link2 size={16} />} onClick={linkChosen} disabled={!choice}>Link to project</Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!unlinking}
        title="Unlink this TCCA project?"
        description={unlinking
          ? `${unlinking.number} stays in TCCA Projects and on any other project it's linked to. Only its link to this project is removed, nothing is deleted.`
          : ''}
        confirmLabel="Unlink from project"
        tone="danger"
        onConfirm={() => { if (unlinking) unlinkProject(unlinking.id, projectId); setUnlinking(null) }}
        onCancel={() => setUnlinking(null)}
      />
    </div>
  )
}
