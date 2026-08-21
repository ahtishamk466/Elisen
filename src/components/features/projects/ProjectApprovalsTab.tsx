import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Award, Unlink, Link2, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { Truncate } from '@/components/patterns/Truncate'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { useApprovalsStore } from '@/stores/approvalsStore'
import { useLookupStore } from '@/stores/lookupStore'
import type { Approval } from '@/types/documents'
import { formatDate } from '@/lib/formatDate'

const HEADERS = ['Number', 'Description', 'Primary', 'Aircraft', 'Current Revision', 'Actions']

/**
 * Certificates this project relates to — an *association*, nothing more.
 *
 * The requirement document lists this as "Project ↔ Approvals — Link approvals
 * — List, assign" (§1.2), against "List, CRUD" for the Approvals module
 * itself (§1.5). So nothing is created or edited here: a certificate's number,
 * authority and issue date are its own identity, and it is routinely shared by
 * several projects, so editing it from inside one project would silently change
 * it for all of them. Link, unlink, list.
 */
export function ProjectApprovalsTab({ projectId }: { projectId: string }) {
  const approvals = useApprovalsStore((s) => s.approvals)
  const revisions = useApprovalsStore((s) => s.revisions)
  const { linkToProject, unlinkFromProject } = useApprovalsStore()
  const catalog = useLookupStore((s) => s.aircraft)
  const navigate = useNavigate()

  const [unlinking, setUnlinking] = useState<Approval | null>(null)
  const [choice, setChoice] = useState('')

  const linked = approvals.filter((a) => a.projectIds.includes(projectId))
  const currentRevision = (approvalId: string) =>
    revisions.filter((r) => r.approvalId === approvalId).sort((a, b) => b.revision - a.revision)[0]
  const aircraftLabels = (a: Approval) =>
    a.aircraftIds.map((id) => catalog.find((m) => m.id === id)?.modelNumber).filter(Boolean) as string[]

  const linkChosen = () => {
    if (!choice) return
    linkToProject(choice, projectId)
    setChoice('')
  }

  return (
    <div className="grid gap-lg">
      {linked.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<Award size={48} strokeWidth={1.5} />}
            title="No approvals linked to this project"
            description={approvals.length === 0
              ? 'No certificates exist yet. They are created in the Approvals workspace. Once one exists, you can link it to this project below.'
              : 'Choose a certificate below to link it to this project. Its own STC, or an earlier approval it modifies.'}
            action={
              <Button variant="secondary" leadingIcon={<ExternalLink size={16} />} onClick={() => navigate('/approvals')}>
                Open Approvals workspace
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-sm">
            <p className="text-sm text-text-secondary">
              {linked.length} certificate{linked.length === 1 ? '' : 's'} linked to this project
            </p>
            <Button variant="secondary" leadingIcon={<ExternalLink size={16} />} onClick={() => navigate('/approvals')}>
              Manage in Approvals
            </Button>
          </div>

          <div className="overflow-x-auto rounded-sm border border-border-default bg-neutral-25">
            <table className="w-full border-collapse text-left" style={{ minWidth: 760 }}>
              <caption className="sr-only">Approvals tied to this project</caption>
              <thead>
                <tr className="border-b border-border-default bg-neutral-50">
                  {HEADERS.map((h) => (
                    <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linked.map((a) => {
                  const cr = currentRevision(a.id)
                  return (
                    <tr key={a.id} className="border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-neutral-50">
                      <td className="whitespace-nowrap px-lg py-base">
                        <Link to={`/approvals/${a.id}`} className="text-sm font-semibold text-text-primary underline-offset-2 hover:text-accent hover:underline">
                          {a.number}
                        </Link>
                      </td>
                      <td className="px-lg py-base text-sm text-text-primary" style={{ maxWidth: 260 }}><Truncate>{a.description}</Truncate></td>
                      <td className="whitespace-nowrap px-lg py-base"><Badge tone={a.primary ? 'info' : 'neutral'}>{a.primary ? 'Primary' : 'Change'}</Badge></td>
                      <td className="px-lg py-base">
                        {aircraftLabels(a).length === 0
                          ? <span className="text-sm text-text-muted">—</span>
                          : <div className="flex flex-wrap gap-xs">
                              {aircraftLabels(a).map((m) => <Badge key={m} appearance="outline">{m}</Badge>)}
                            </div>}
                      </td>
                      <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">
                        {cr ? `Rev ${cr.revision} · ${formatDate(cr.revisionDate)}` : <span className="text-text-muted">Not issued yet</span>}
                      </td>
                      <td className="px-lg py-base">
                        <ActionsMenu
                          ariaLabel={`Actions for approval ${a.number}`}
                          items={[
                            { label: 'Unlink from project', icon: <Unlink size={16} />, onSelect: () => setUnlinking(a), tone: 'danger' },
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Select and link — never create. Certificates already linked stay in the
          list but disabled with a reason, so the same one can't be linked twice
          and nobody wonders why it is missing. */}
      <div className="grid gap-sm rounded-sm border border-border-default bg-neutral-25 p-lg">
        <div className="grid gap-xxss">
          <label htmlFor="link-approval" className="text-sm font-semibold text-text-primary">
            Select a certificate to link
          </label>
          <p className="text-xs text-text-muted">
            Certificates are created and managed in the Approvals workspace. Here you choose which
            existing ones apply to this project.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <div className="min-w-0 flex-1" style={{ minWidth: 260 }}>
            <SearchableSelect
              id="link-approval"
              size="sm"
              value={choice}
              onChange={setChoice}
              placeholder="Search certificates by number, description or aircraft..."
              emptyLabel="No certificates exist yet, create one in the Approvals workspace first."
              options={approvals.map((a) => ({
                value: a.id,
                label: `${a.number}: ${a.description}`,
                hint: [
                  a.primary ? 'Primary' : 'Change approval',
                  ...aircraftLabels(a),
                ].filter(Boolean).join(' · '),
                disabled: a.projectIds.includes(projectId),
                disabledReason: 'Already linked to this project',
              }))}
            />
          </div>
          <Button leadingIcon={<Link2 size={16} />} onClick={linkChosen} disabled={!choice}>Link to project</Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!unlinking}
        title="Unlink this approval from the project?"
        description={unlinking ? `${unlinking.number} stays in the Approvals workspace and on any other project it's linked to. Only its link to this project is removed, nothing is deleted.` : ''}
        confirmLabel="Unlink from project"
        tone="danger"
        onConfirm={() => { if (unlinking) unlinkFromProject(unlinking.id, projectId); setUnlinking(null) }}
        onCancel={() => setUnlinking(null)}
      />
    </div>
  )
}
