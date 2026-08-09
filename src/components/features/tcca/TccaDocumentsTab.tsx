import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { useProjectsStore } from '@/stores/projectsStore'
import { useTccaStore } from '@/stores/tccaStore'
import { DOC_STATE_LABEL, DOC_STATE_TONE, INVOLVEMENT_LABEL } from '@/lib/tccaDisplay'
import { LinkRevisionDrawer } from './LinkRevisionDrawer'
import { DocTrackingDrawer } from './DocTrackingDrawer'
import type { TccaDocLink, TccaProject } from '@/types/tcca'

const HEADERS = ['Number / Rev', 'Title', 'From Project', 'Involvement', 'Sent', 'Status', 'Actions']

export function TccaDocumentsTab({ tcca }: { tcca: TccaProject }) {
  const projects = useProjectsStore((s) => s.rows)
  const revisions = useTccaStore((s) => s.revisions)
  const docLinks = useTccaStore((s) => s.docLinks)
  const unlinkDoc = useTccaStore((s) => s.unlinkDoc)

  const [linking, setLinking] = useState(false)
  const [editingLink, setEditingLink] = useState<TccaDocLink | null>(null)
  const [removingLink, setRemovingLink] = useState<TccaDocLink | null>(null)

  const links = docLinks.filter((l) => l.tccaProjectId === tcca.id)
  const revisionOf = (id: string) => revisions.find((r) => r.id === id)
  const projectOf = (id: string) => projects.find((p) => p.id === id)

  return (
    <div className="grid gap-lg">
      <div className="flex items-center justify-between gap-lg">
        <p className="text-sm text-text-secondary">
          Deliverable revisions tracked with Transport Canada. Documents only — drawings stay on the Elisen side.
        </p>
        <Button leadingIcon={<Plus size={16} />} onClick={() => setLinking(true)}>
          Link document revision
        </Button>
      </div>

      {links.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<FileText size={48} strokeWidth={1.5} />}
            title="No documents linked yet"
            description="Link deliverable revisions from the related Elisen projects to track what TCCA wants to see, what's been sent, and what's been accepted."
            action={<Button leadingIcon={<Plus size={16} />} onClick={() => setLinking(true)}>Link document revision</Button>}
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border-default bg-neutral-25">
          <table className="w-full border-collapse text-left" style={{ minWidth: 760 }}>
            <caption className="sr-only">Documents tracked with Transport Canada</caption>
            <thead>
              <tr className="border-b border-border-default bg-neutral-50">
                {HEADERS.map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {links.map((link) => {
                const rev = revisionOf(link.revisionId)
                if (!rev) return null
                const project = projectOf(rev.projectId)
                return (
                  <tr key={link.id} className="border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{rev.number} <span className="text-text-muted">rev {rev.rev}</span></td>
                    <td className="px-lg py-base text-sm text-text-primary">{rev.title}</td>
                    <td className="whitespace-nowrap px-lg py-base text-sm">
                      {project ? (
                        <Link to={`/projects/${project.id}`} className="text-text-primary underline-offset-2 hover:text-accent hover:underline">
                          {project.number}-{project.subNumber}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{INVOLVEMENT_LABEL[link.involvement]}</td>
                    <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{link.sentDate || '—'}</td>
                    <td className="px-lg py-base"><Badge tone={DOC_STATE_TONE[link.state]}>{DOC_STATE_LABEL[link.state]}</Badge></td>
                    <td className="px-lg py-base">
                      <ActionsMenu
                        ariaLabel={`Actions for ${rev.number} rev ${rev.rev}`}
                        items={[
                          { label: 'Edit tracking', icon: <Pencil size={16} />, onSelect: () => setEditingLink(link) },
                          { label: 'Unlink', icon: <Trash2 size={16} />, onSelect: () => setRemovingLink(link), tone: 'danger' },
                        ]}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <LinkRevisionDrawer open={linking} tcca={tcca} onClose={() => setLinking(false)} />
      {editingLink && (
        <DocTrackingDrawer link={editingLink} revision={revisionOf(editingLink.revisionId)} onClose={() => setEditingLink(null)} />
      )}
      <ConfirmDialog
        open={!!removingLink}
        title="Unlink this document?"
        description="The revision stays on the Elisen side — only its TCCA tracking record is removed."
        confirmLabel="Unlink"
        tone="danger"
        onConfirm={() => { if (removingLink) unlinkDoc(removingLink.id); setRemovingLink(null) }}
        onCancel={() => setRemovingLink(null)}
      />
    </div>
  )
}
