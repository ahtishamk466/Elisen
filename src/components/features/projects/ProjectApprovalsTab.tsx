import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Award, Pencil, Unlink } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { Truncate } from '@/components/patterns/Truncate'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { useApprovalsStore } from '@/stores/approvalsStore'
import { useTccaStore } from '@/stores/tccaStore'
import { APPROVAL_TYPE_LABEL, AUTHORITY_LABEL } from '@/lib/documentDisplay'
import { ApprovalDrawer } from './ApprovalDrawer'
import type { Approval } from '@/types/documents'

const HEADERS = ['Number', 'Title', 'Authority', 'Type', 'Aircraft', 'Issued', 'TCCA Project', 'Actions']

/** Certificates this project relates to: its own approvals, and earlier
    ones it modifies ("this is the original approval" — the change project
    references the console STC it's changing). */
export function ProjectApprovalsTab({ projectId }: { projectId: string }) {
  const approvals = useApprovalsStore((s) => s.approvals)
  const { addApproval, updateApproval, linkToProject, unlinkFromProject } = useApprovalsStore()
  const tccaProjects = useTccaStore((s) => s.tccaProjects)

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Approval | null>(null)
  const [unlinking, setUnlinking] = useState<Approval | null>(null)
  const [linkChoice, setLinkChoice] = useState('')

  const linked = approvals.filter((a) => a.projectIds.includes(projectId))
  const unlinked = approvals.filter((a) => !a.projectIds.includes(projectId))
  const tccaOf = (id?: string) => tccaProjects.find((t) => t.id === id)

  const linkExisting = () => {
    if (!linkChoice) return
    linkToProject(linkChoice, projectId)
    setLinkChoice('')
  }

  return (
    <div className="grid gap-lg">
      {linked.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<Award size={48} strokeWidth={1.5} />}
            title="No approvals tied to this project"
            description="Record a certificate once it's issued, or tie this project to an earlier approval it modifies — like a change to an existing console STC."
            action={<Button leadingIcon={<Plus size={16} />} onClick={() => setAdding(true)}>Add approval</Button>}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-sm">
            <p className="text-sm text-text-secondary">
              {linked.length} certificate{linked.length === 1 ? '' : 's'} tied to this project
            </p>
            <Button leadingIcon={<Plus size={16} />} onClick={() => setAdding(true)}>Add approval</Button>
          </div>

          <div className="overflow-x-auto rounded-sm border border-border-default bg-neutral-25">
            <table className="w-full border-collapse text-left" style={{ minWidth: 820 }}>
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
                  const tcca = tccaOf(a.tccaProjectId)
                  return (
                    <tr key={a.id} className="border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-neutral-50">
                      <td className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-primary">{a.number}</td>
                      <td className="px-lg py-base text-sm text-text-primary" style={{ maxWidth: 260 }}><Truncate>{a.title}</Truncate></td>
                      <td className="whitespace-nowrap px-lg py-base"><Badge tone={a.authority === 'tcca' ? 'info' : 'neutral'}>{AUTHORITY_LABEL[a.authority]}</Badge></td>
                      <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{APPROVAL_TYPE_LABEL[a.type]}</td>
                      <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{a.aircraft || '—'}</td>
                      <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{a.issuedDate}</td>
                      <td className="whitespace-nowrap px-lg py-base text-sm">
                        {tcca ? (
                          <Link to={`/tcca-projects/${tcca.id}`} className="text-text-primary underline-offset-2 hover:text-accent hover:underline">
                            {tcca.number}
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="px-lg py-base">
                        <ActionsMenu
                          ariaLabel={`Actions for approval ${a.number}`}
                          items={[
                            { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setEditing(a) },
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

      {unlinked.length > 0 && (
        <div className="flex flex-wrap items-center gap-sm rounded-sm border border-border-default bg-neutral-25 px-lg py-base">
          <label htmlFor="link-approval" className="text-sm text-text-secondary">Tie an existing certificate to this project:</label>
          <Select id="link-approval" value={linkChoice} placeholder="Select an approval..." className="min-w-0 flex-1" onChange={(e) => setLinkChoice(e.target.value)}>
            {unlinked.map((a) => (
              <option key={a.id} value={a.id}>{a.number} — {a.title}</option>
            ))}
          </Select>
          <Button variant="secondary" onClick={linkExisting} disabled={!linkChoice}>Link</Button>
        </div>
      )}

      {adding && <ApprovalDrawer projectId={projectId} onClose={() => setAdding(false)} onSubmit={addApproval} />}
      {editing && <ApprovalDrawer projectId={projectId} initial={editing} onClose={() => setEditing(null)} onSubmit={(a) => updateApproval(editing.id, a)} />}

      <ConfirmDialog
        open={!!unlinking}
        title="Unlink this approval?"
        description={unlinking ? `${unlinking.number} stays in the registry — only its tie to this project is removed.` : ''}
        confirmLabel="Unlink"
        tone="danger"
        onConfirm={() => { if (unlinking) unlinkFromProject(unlinking.id, projectId); setUnlinking(null) }}
        onCancel={() => setUnlinking(null)}
      />
    </div>
  )
}
