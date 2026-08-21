import { ExternalLink } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { DetailCard, DetailField } from '@/components/patterns/DetailView'
import { PersonCell } from '@/components/patterns/PersonCell'
import { isOpenableUrl } from '@/components/patterns/UrlField'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/formatDate'
import { KIND_LABEL, REVISION_STATUS_LABEL, REVISION_STATUS_TONE } from '@/lib/documentDisplay'
import type { DocRevision, ProjectDocument } from '@/types/documents'

export interface RevisionViewDrawerProps {
  document: ProjectDocument
  revision: DocRevision
  /** Project labels this revision is attached to, e.g. `3200-00`. */
  projectLabels: string[]
  onClose: () => void
  onEdit: () => void
}

/**
 * A document revision in full, read-only — the app's one View layout, the same
 * as Company, Aircraft and Activity.
 *
 * A revision's facts are split across two records (the document owns number,
 * title, type, owner; the revision owns its dates, status and file), and the
 * table can only ever show a slice. This is where the whole thing is legible,
 * which is why the row menu opens it rather than the edit form.
 */
export function RevisionViewDrawer({ document, revision, projectLabels, onClose, onEdit }: RevisionViewDrawerProps) {
  const isDrawing = document.kind === 'drawing'
  // KIND_LABEL's singular is lowercase for mid-sentence use ("Edit drawing");
  // a card title is a heading, so it starts the sentence.
  const label = KIND_LABEL[document.kind]
  const cardTitle = label.singular.charAt(0).toUpperCase() + label.singular.slice(1)

  return (
    <Drawer
      open
      onClose={onClose}
      title={`${document.number} rev ${revision.rev}`}
      footer={
        <div className="flex w-full items-center justify-between gap-sm">
          {isOpenableUrl(revision.url) ? (
            <Button
              variant="tertiary"
              leadingIcon={<ExternalLink size={16} />}
              onClick={() => window.open(revision.url.trim(), '_blank', 'noopener,noreferrer')}
            >
              Go To
            </Button>
          ) : <span />}
          <div className="flex gap-sm">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button onClick={() => { onEdit(); onClose() }}>Edit</Button>
          </div>
        </div>
      }
    >
      <DetailCard title={cardTitle}>
        <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
          <DetailField label="Number" nowrap>{document.number}</DetailField>
          <DetailField label="Title">{document.title}</DetailField>
          <DetailField label="Type">{document.type}</DetailField>
          <DetailField label="Owner"><PersonCell name={document.owner} /></DetailField>
          {isDrawing && <DetailField label="Aircraft type">{document.aircraft}</DetailField>}
          {isDrawing && <DetailField label="ATA chapter" nowrap>{document.ataChapter}</DetailField>}
        </div>
      </DetailCard>

      <DetailCard title="Revision">
        <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
          <DetailField label="Revision" nowrap>{revision.rev}</DetailField>
          <DetailField label="Status">
            <Badge tone={REVISION_STATUS_TONE[revision.status]}>{REVISION_STATUS_LABEL[revision.status]}</Badge>
          </DetailField>
          <DetailField label="Next action">
            {revision.nextAction ? <PersonCell name={revision.nextAction} /> : undefined}
          </DetailField>
          <DetailField label="Opened" nowrap>{formatDate(revision.openedDate)}</DetailField>
          <DetailField label="Due" nowrap>{formatDate(revision.dueDate)}</DetailField>
          <DetailField label="Released" nowrap>{formatDate(revision.releasedDate)}</DetailField>
          <DetailField label="Received" nowrap>{formatDate(revision.receivedDate)}</DetailField>
          <DetailField label="Closed" nowrap>{formatDate(revision.closedDate)}</DetailField>
          <DetailField label="File">{revision.url || undefined}</DetailField>
        </div>
      </DetailCard>

      <DetailCard title="Projects">
        {projectLabels.length === 0 ? (
          <p className="text-sm text-text-muted">Not linked to a project yet.</p>
        ) : (
          <div className="flex flex-wrap gap-xs">
            {projectLabels.map((l) => <Badge key={l} appearance="outline">{l}</Badge>)}
          </div>
        )}
      </DetailCard>
    </Drawer>
  )
}
