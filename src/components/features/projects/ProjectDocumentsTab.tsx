import { useState } from 'react'
import { Plus, FileText, Link2, Pencil, FilePlus2, Unlink, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { useDocumentsStore } from '@/stores/documentsStore'
import { KIND_LABEL, REVISION_STATUS_LABEL, REVISION_STATUS_TONE } from '@/lib/documentDisplay'
import { DocumentDrawer } from './DocumentDrawer'
import { RevisionDrawer } from './RevisionDrawer'
import { LinkExistingRevisionDrawer } from './LinkExistingRevisionDrawer'
import type { DocRevision, DocumentKind, ProjectDocument } from '@/types/documents'

export interface ProjectDocumentsTabProps {
  kind: DocumentKind
  projectId: string
  projectNumber: string
}

/** Deliverables and Design Data share this tab — the same two-level
    document → revision model; drawings just add aircraft + ATA columns. */
export function ProjectDocumentsTab({ kind, projectId, projectNumber }: ProjectDocumentsTabProps) {
  const documents = useDocumentsStore((s) => s.documents)
  const revisions = useDocumentsStore((s) => s.revisions)
  const links = useDocumentsStore((s) => s.links)
  const unlinkRevisionFromProject = useDocumentsStore((s) => s.unlinkRevisionFromProject)

  const [adding, setAdding] = useState(false)
  const [linking, setLinking] = useState(false)
  const [revisionTarget, setRevisionTarget] = useState<ProjectDocument | null>(null)
  const [editing, setEditing] = useState<{ doc: ProjectDocument; rev: DocRevision } | null>(null)
  const [unlinking, setUnlinking] = useState<{ doc: ProjectDocument; rev: DocRevision } | null>(null)

  const isDrawing = kind === 'drawing'
  const rows = links
    .filter((l) => l.projectId === projectId)
    .flatMap((l) => {
      const rev = revisions.find((r) => r.id === l.revisionId)
      const doc = rev && documents.find((d) => d.id === rev.documentId)
      return rev && doc && doc.kind === kind ? [{ rev, doc }] : []
    })
    .sort((a, b) => a.doc.number.localeCompare(b.doc.number) || a.rev.rev.localeCompare(b.rev.rev))

  const headers = isDrawing
    ? ['Number / Rev', 'Title', 'Type', 'Aircraft', 'ATA', 'Next Action', 'Status', 'Actions']
    : ['Number / Rev', 'Title', 'Type', 'Owner', 'Due', 'Next Action', 'Status', 'Actions']

  const label = KIND_LABEL[kind]

  return (
    <div className="grid gap-lg">
      {rows.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<FileText size={48} strokeWidth={1.5} />}
            title={`No ${label.plural.toLowerCase()} yet`}
            description={
              isDrawing
                ? 'Create a drawing for this project, or reuse one from an earlier project — searchable by aircraft type.'
                : 'Create a document for this project, or link a revision that already exists in the pool.'
            }
            action={
              <div className="flex flex-wrap justify-center gap-sm">
                <Button leadingIcon={<Plus size={16} />} onClick={() => setAdding(true)}>Add {label.singular}</Button>
                <Button variant="secondary" leadingIcon={<Link2 size={16} />} onClick={() => setLinking(true)}>Link existing</Button>
              </div>
            }
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-sm">
            <p className="text-sm text-text-secondary">
              {rows.length} revision{rows.length === 1 ? '' : 's'} applicable to this project
              {isDrawing && ' — drawings stay on the Elisen side, never tracked with TCCA'}
            </p>
            <div className="flex gap-sm">
              <Button variant="secondary" leadingIcon={<Link2 size={16} />} onClick={() => setLinking(true)}>Link existing</Button>
              <Button leadingIcon={<Plus size={16} />} onClick={() => setAdding(true)}>Add {label.singular}</Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-sm border border-border-default bg-neutral-25">
            <table className="w-full border-collapse text-left" style={{ minWidth: 820 }}>
              <caption className="sr-only">{label.plural} applicable to this project</caption>
              <thead>
                <tr className="border-b border-border-default bg-neutral-50">
                  {headers.map((h) => (
                    <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ rev, doc }) => (
                  <tr key={rev.id} className="border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">
                      {doc.number} <span className="text-text-muted">rev {rev.rev}</span>
                      {rev.initialProjectId !== projectId && (
                        <span className="ml-xs align-middle text-text-muted" title="Reused from another project"><ExternalLink size={12} aria-label="Reused from another project" /></span>
                      )}
                    </td>
                    <td className="px-lg py-base text-sm text-text-primary">{doc.title}</td>
                    <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{doc.type}</td>
                    {isDrawing ? (
                      <>
                        <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{doc.aircraft || '—'}</td>
                        <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{doc.ataChapter || '—'}</td>
                      </>
                    ) : (
                      <>
                        <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{doc.owner}</td>
                        <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{rev.dueDate || '—'}</td>
                      </>
                    )}
                    <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{rev.nextAction || '—'}</td>
                    <td className="px-lg py-base"><Badge tone={REVISION_STATUS_TONE[rev.status]}>{REVISION_STATUS_LABEL[rev.status]}</Badge></td>
                    <td className="px-lg py-base">
                      <ActionsMenu
                        ariaLabel={`Actions for ${doc.number} rev ${rev.rev}`}
                        items={[
                          { label: 'Edit revision', icon: <Pencil size={16} />, onSelect: () => setEditing({ doc, rev }) },
                          { label: 'Add new revision', icon: <FilePlus2 size={16} />, onSelect: () => setRevisionTarget(doc) },
                          { label: 'Unlink from project', icon: <Unlink size={16} />, onSelect: () => setUnlinking({ doc, rev }), tone: 'danger' },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {adding && <DocumentDrawer kind={kind} projectId={projectId} projectNumber={projectNumber} onClose={() => setAdding(false)} />}
      {linking && <LinkExistingRevisionDrawer kind={kind} projectId={projectId} onClose={() => setLinking(false)} />}
      {revisionTarget && <RevisionDrawer document={revisionTarget} projectId={projectId} onClose={() => setRevisionTarget(null)} />}
      {editing && <RevisionDrawer document={editing.doc} projectId={projectId} initial={editing.rev} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={!!unlinking}
        title={`Unlink this ${label.singular} revision?`}
        description={
          unlinking
            ? `${unlinking.doc.number} rev ${unlinking.rev.rev} stays in the pool and on its other projects — only its link to this project is removed.`
            : ''
        }
        confirmLabel="Unlink"
        tone="danger"
        onConfirm={() => {
          if (unlinking) unlinkRevisionFromProject(projectId, unlinking.rev.id)
          setUnlinking(null)
        }}
        onCancel={() => setUnlinking(null)}
      />
    </div>
  )
}
