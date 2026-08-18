import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, FolderOpen, Link2, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { useTccaStore } from '@/stores/tccaStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { STATUS_LABEL, STATUS_TONE } from '@/lib/projectDisplay'
import type { TccaProject } from '@/types/tcca'
import type { ProjectListRow } from '@/types/project'

/**
 * The Elisen projects this TCCA project covers. The same link lives on the
 * project's own TCCA tab, and both sides call the same two store verbs, so a
 * link made here shows there immediately.
 */
export function TccaProjectsTab({ tcca }: { tcca: TccaProject }) {
  const navigate = useNavigate()
  const projects = useProjectsStore((s) => s.rows)
  const linkProject = useTccaStore((s) => s.linkProject)
  const unlinkProject = useTccaStore((s) => s.unlinkProject)

  const [choice, setChoice] = useState('')
  const [unlinking, setUnlinking] = useState<ProjectListRow | null>(null)

  const linked = useMemo(
    () => tcca.projectIds.map((id) => projects.find((p) => p.id === id)).filter(Boolean) as ProjectListRow[],
    [tcca.projectIds, projects],
  )
  const options = useMemo(
    () => projects.map((p) => ({
      value: p.id,
      label: `${p.number}-${p.subNumber}`,
      hint: p.title,
      disabled: tcca.projectIds.includes(p.id),
      disabledReason: 'Already linked to this TCCA project',
    })),
    [projects, tcca.projectIds],
  )

  const linkChosen = () => {
    if (!choice) return
    linkProject(tcca.id, choice)
    setChoice('')
  }

  return (
    <div className="grid gap-lg">
      {linked.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<FolderOpen size={48} strokeWidth={1.5} />}
            title="No Elisen project linked"
            description="Baseline and DAO work legitimately has no project. Otherwise, link the project this Transport Canada work belongs to."
          />
        </div>
      ) : (
        <>
          <p className="text-sm text-text-secondary">
            {linked.length} Elisen project{linked.length === 1 ? '' : 's'} linked. Reference links only.
            No data is copied between the two.
          </p>
          <ul className="grid gap-sm">
            {linked.map((p) => (
              <li key={p.id} className="flex items-start gap-sm rounded-sm border border-border-default bg-neutral-25 px-lg py-base">
                <button
                  type="button"
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="grid min-w-0 flex-1 gap-xs text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                >
                  <span className="flex flex-wrap items-center gap-sm">
                    <span className="text-sm font-semibold text-text-primary">{p.number}-{p.subNumber}</span>
                    <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                  </span>
                  <span className="text-sm text-text-secondary">{p.title}</span>
                  <span className="text-xs text-text-muted">{p.companyName} · {p.personResponsible}</span>
                </button>
                <ActionsMenu
                  ariaLabel={`Actions for project ${p.number}-${p.subNumber}`}
                  items={[
                    { label: 'Open project', icon: <ExternalLink size={16} />, onSelect: () => navigate(`/projects/${p.id}`) },
                    { label: 'Unlink', icon: <Unlink size={16} />, onSelect: () => setUnlinking(p), tone: 'danger' },
                  ]}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="grid gap-sm rounded-sm border border-border-default bg-neutral-25 p-lg">
        <div className="grid gap-xxss">
          <label htmlFor="link-elisen-project" className="text-sm font-semibold text-text-primary">
            Select an Elisen project to link
          </label>
          <p className="text-xs text-text-muted">
            Projects are created in Projects. Here you choose which ones this Transport Canada work covers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <div className="min-w-0 flex-1" style={{ minWidth: 260 }}>
            <SearchableSelect
              id="link-elisen-project"
              size="sm"
              value={choice}
              onChange={setChoice}
              options={options}
              placeholder="Search projects by number or title..."
              emptyLabel="No projects exist yet."
            />
          </div>
          <Button leadingIcon={<Link2 size={16} />} onClick={linkChosen} disabled={!choice}>Link project</Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!unlinking}
        title="Unlink this project?"
        description={unlinking
          ? `${unlinking.number}-${unlinking.subNumber} stays in Projects. Only its link to ${tcca.number} is removed, nothing is deleted.`
          : ''}
        confirmLabel="Unlink"
        tone="danger"
        onConfirm={() => { if (unlinking) unlinkProject(tcca.id, unlinking.id); setUnlinking(null) }}
        onCancel={() => setUnlinking(null)}
      />
    </div>
  )
}
