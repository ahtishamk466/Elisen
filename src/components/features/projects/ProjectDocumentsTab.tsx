import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Link2, Pencil, Unlink, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { PersonCell } from '@/components/patterns/PersonCell'
import { isOpenableUrl } from '@/components/patterns/UrlField'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { Truncate } from '@/components/patterns/Truncate'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { useDocumentsStore } from '@/stores/documentsStore'
import { KIND_LABEL, REVISION_STATUS_LABEL, REVISION_STATUS_TONE } from '@/lib/documentDisplay'
import { RevisionDrawer } from './RevisionDrawer'
import type { DocRevision, DocumentKind, ProjectDocument } from '@/types/documents'
import { DateText } from '@/components/patterns/DateText'

export interface ProjectDocumentsTabProps {
  kind: DocumentKind
  projectId: string
}

const WORKSPACE_PATH: Record<DocumentKind, string> = {
  deliverable: '/documents/deliverables',
  drawing: '/documents/design-data',
}

/**
 * Documents applicable to this project — an *association*, nothing more.
 *
 * The requirement document is explicit about the split (§1.2 Project
 * Associations vs §1.3/1.4): a project's actions on deliverables and design
 * data are "List, assign", while "List, CRUD" belongs to the Deliverables and
 * Design Data modules. So nothing is created here. You pick a revision that
 * already exists and link it; creating and editing the records themselves
 * happens in their workspace.
 *
 * That also matches why they are global: one drawing is reused across projects
 * ("we did an iPad on another project, didn't we? Maybe I can use that same
 * drawing"), so no project can own one.
 *
 * Same shape as ProjectApprovalsTab, deliberately: link, unlink, list.
 */
type SortKey = 'number' | 'revision' | 'title' | 'aircraft' | 'ata' | 'owner'
  | 'opened' | 'due' | 'nextAction' | 'status'

export function ProjectDocumentsTab({ kind, projectId }: ProjectDocumentsTabProps) {
  const navigate = useNavigate()
  const documents = useDocumentsStore((s) => s.documents)
  const revisions = useDocumentsStore((s) => s.revisions)
  const links = useDocumentsStore((s) => s.links)
  const linkRevisionToProject = useDocumentsStore((s) => s.linkRevisionToProject)
  const unlinkRevisionFromProject = useDocumentsStore((s) => s.unlinkRevisionFromProject)

  const [editing, setEditing] = useState<{ doc: ProjectDocument; rev: DocRevision } | null>(null)
  const [unlinking, setUnlinking] = useState<{ doc: ProjectDocument; rev: DocRevision } | null>(null)
  const [choice, setChoice] = useState('')

  const isDrawing = kind === 'drawing'
  const label = KIND_LABEL[kind]

  const rows = useMemo(
    () =>
      links
        .filter((l) => l.projectId === projectId)
        .flatMap((l) => {
          const rev = revisions.find((r) => r.id === l.revisionId)
          const doc = rev && documents.find((d) => d.id === rev.documentId)
          return rev && doc && doc.kind === kind ? [{ rev, doc }] : []
        })
        .sort((a, b) => a.doc.number.localeCompare(b.doc.number) || a.rev.rev.localeCompare(b.rev.rev)),
    [links, revisions, documents, kind, projectId],
  )

  /** Every revision of this kind in the pool. Ones already linked stay in the
      list but disabled with a reason, so "why isn't it there?" never comes up.
      Aircraft and ATA ride in the hint because SearchableSelect searches hints
      too — that is what keeps "find the drawing we did for a 737" working. */
  const options = useMemo(() => {
    const linked = new Set(links.filter((l) => l.projectId === projectId).map((l) => l.revisionId))
    return revisions
      .flatMap((rev) => {
        const doc = documents.find((d) => d.id === rev.documentId)
        return doc && doc.kind === kind ? [{ rev, doc }] : []
      })
      .sort((a, b) => a.doc.number.localeCompare(b.doc.number) || a.rev.rev.localeCompare(b.rev.rev))
      .map(({ rev, doc }) => ({
        value: rev.id,
        label: `${doc.number} rev ${rev.rev}: ${doc.title}`,
        hint: [
          isDrawing ? doc.aircraft : doc.owner,
          isDrawing && doc.ataChapter ? `ATA ${doc.ataChapter}` : '',
          REVISION_STATUS_LABEL[rev.status],
        ].filter(Boolean).join(' · '),
        disabled: linked.has(rev.id),
        disabledReason: 'Already linked to this project',
      }))
  }, [revisions, documents, links, kind, projectId, isDrawing])

  const linkChosen = () => {
    if (!choice) return
    linkRevisionToProject(projectId, choice)
    setChoice('')
  }

  /* Number and Rev stand apart, Title carries its Type underneath — the same
     shape as the Documents workspace, so a revision reads identically on both. */
  const columns: { label: string; sort?: SortKey }[] = isDrawing
    ? [
        { label: 'Number', sort: 'number' }, { label: 'Rev', sort: 'revision' },
        { label: 'Title / Type', sort: 'title' }, { label: 'Aircraft', sort: 'aircraft' },
        { label: 'ATA', sort: 'ata' }, { label: 'Opened', sort: 'opened' },
        { label: 'Next Action', sort: 'nextAction' }, { label: 'Status', sort: 'status' },
        { label: 'Actions' },
      ]
    : [
        { label: 'Number', sort: 'number' }, { label: 'Rev', sort: 'revision' },
        { label: 'Title / Type', sort: 'title' }, { label: 'Owner', sort: 'owner' },
        { label: 'Opened', sort: 'opened' }, { label: 'Due', sort: 'due' },
        { label: 'Next Action', sort: 'nextAction' }, { label: 'Status', sort: 'status' },
        { label: 'Actions' },
      ]

  /* The project's own tracking fields (dates, next action, status) live on
     the revision; identity fields live on the document. */
  const { sorted, sort, setSort } = useTableSort(rows, {
    number: (r) => r.doc.number,
    revision: (r) => r.rev.rev,
    title: (r) => r.doc.title,
    aircraft: (r) => r.doc.aircraft,
    ata: (r) => r.doc.ataChapter,
    owner: (r) => r.doc.owner,
    opened: (r) => r.rev.openedDate,
    due: (r) => r.rev.dueDate,
    nextAction: (r) => r.rev.nextAction,
    status: (r) => r.rev.status,
  })

  const openWorkspace = () => navigate(WORKSPACE_PATH[kind])

  return (
    <div className="grid gap-lg">
      {rows.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<FileText size={48} strokeWidth={1.5} />}
            title={`No ${label.plural.toLowerCase()} linked to this project`}
            description={
              options.length === 0
                ? `No ${label.plural.toLowerCase()} exist yet. They are created in the ${label.plural} workspace. Once one exists, you can link it to this project below.`
                : isDrawing
                  ? 'Choose a drawing revision below to link it to this project, including one from an earlier project, searchable by aircraft type.'
                  : 'Choose a deliverable revision below to link it to this project.'
            }
            action={
              <Button variant="secondary" leadingIcon={<ExternalLink size={16} />} onClick={openWorkspace}>
                Open {label.plural} workspace
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-sm">
            <p className="text-sm text-text-secondary">
              {rows.length} revision{rows.length === 1 ? '' : 's'} linked to this project
              {isDrawing && ': drawings stay on the Elisen side, never tracked with TCCA'}
            </p>
            <Button variant="secondary" leadingIcon={<ExternalLink size={16} />} onClick={openWorkspace}>
              Manage in {label.plural}
            </Button>
          </div>

          <div className="overflow-x-auto rounded-sm border border-border-default bg-neutral-25">
            <table className="w-full border-collapse text-left" style={{ minWidth: 820 }}>
              <caption className="sr-only">{label.plural} linked to this project</caption>
              <thead>
                <tr className="border-b border-border-default bg-neutral-50">
                  {columns.map((c) => (
                    <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                      className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{c.label}</SortableTh>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(({ rev, doc }) => (
                  <tr key={rev.id} className="border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-primary">
                      {doc.number}
                      {rev.initialProjectId !== projectId && (
                        <span className="ml-xs align-middle text-text-muted" title="Reused from another project"><ExternalLink size={12} aria-label="Reused from another project" /></span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-primary">{rev.rev}</td>
                    <td className="px-lg py-base text-sm text-text-primary" style={{ maxWidth: 260 }}>
                      <Truncate lines={1}>{doc.title}</Truncate>
                      <span className="block truncate text-xs text-text-muted">{doc.type}</span>
                    </td>
                    {isDrawing ? (
                      <>
                        <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{doc.aircraft || '—'}</td>
                        <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{doc.ataChapter || '—'}</td>
                        <td className="px-lg py-base text-sm tabular-nums text-text-primary"><DateText value={rev.openedDate} /></td>
                      </>
                    ) : (
                      <>
                        <td className="px-lg py-base"><PersonCell name={doc.owner} /></td>
                        <td className="px-lg py-base text-sm tabular-nums text-text-primary"><DateText value={rev.openedDate} /></td>
                        <td className="px-lg py-base text-sm tabular-nums text-text-primary"><DateText value={rev.dueDate} /></td>
                      </>
                    )}
                    <td className="px-lg py-base"><PersonCell name={rev.nextAction} /></td>
                    <td className="px-lg py-base"><Badge tone={REVISION_STATUS_TONE[rev.status]}>{REVISION_STATUS_LABEL[rev.status]}</Badge></td>
                    <td className="px-lg py-base">
                      {/* No "add revision" here: a new revision is a new record,
                          and records are created in the workspace. What stays is
                          updating this revision's tracking — the next-action
                          person drives someone's to-do list — and unlinking. */}
                      <ActionsMenu
                        ariaLabel={`Actions for ${doc.number} rev ${rev.rev}`}
                        items={[
                          ...(isOpenableUrl(rev.url)
                            ? [{ label: 'Go To', icon: <ExternalLink size={16} />, onSelect: () => window.open(rev.url.trim(), '_blank', 'noopener,noreferrer') }]
                            : []),
                          { label: 'Edit revision tracking', icon: <Pencil size={16} />, onSelect: () => setEditing({ doc, rev }) },
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

      {/* Select and link — never create. The copy says so out loud, because the
          old screen let people create here and it was the wrong mental model. */}
      <div className="grid gap-sm rounded-sm border border-border-default bg-neutral-25 p-lg">
        <div className="grid gap-xxss">
          <label htmlFor={`link-${kind}`} className="text-sm font-semibold text-text-primary">
            Select a {label.singular} revision to link
          </label>
          <p className="text-xs text-text-muted">
            {label.plural} are created and managed in the {label.plural} workspace. Here you choose
            which existing revisions apply to this project.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <div className="min-w-0 flex-1" style={{ minWidth: 260 }}>
            <SearchableSelect
              id={`link-${kind}`}
              size="sm"
              value={choice}
              onChange={setChoice}
              placeholder={isDrawing
                ? 'Search drawings by number, title or aircraft...'
                : 'Search deliverables by number, title or owner...'}
              emptyLabel={`No ${label.plural.toLowerCase()} exist yet, create one in the ${label.plural} workspace first.`}
              options={options}
            />
          </div>
          <Button leadingIcon={<Link2 size={16} />} onClick={linkChosen} disabled={!choice}>Link to project</Button>
        </div>
      </div>

      {editing && (
        <RevisionDrawer document={editing.doc} projectId={projectId} initial={editing.rev} onClose={() => setEditing(null)} />
      )}

      <ConfirmDialog
        open={!!unlinking}
        title={`Unlink this ${label.singular} from the project?`}
        description={
          unlinking
            ? `${unlinking.doc.number} rev ${unlinking.rev.rev} stays in the ${label.plural} workspace and on any other project it's linked to. Only its link to this project is removed, nothing is deleted.`
            : ''
        }
        confirmLabel="Unlink from project"
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
