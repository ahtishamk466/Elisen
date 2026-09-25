
import { Drawer } from '@/components/patterns/Drawer'
import { DetailCard, DetailField } from '@/components/patterns/DetailView'
import { FileLink } from '@/components/patterns/FileLink'
import { GcpChip } from './GcpChip'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { sourceLabel } from '@/lib/gcpDisplay'
import type { Regulation } from '@/types/gcp'

export interface RegulationDetailDrawerProps {
  regulation: Regulation
  /** Already resolved to "A — GENERAL" by the list. */
  subpart: string
  subsection: string
  onClose: () => void
  onEdit: () => void
}

/** Read-only view of one regulation — every stored field, editing behind the
    Edit action, the same split as every other View in the app. */
export function RegulationDetailDrawer({ regulation: r, subpart, subsection, onClose, onEdit }: RegulationDetailDrawerProps) {
  return (
    <Drawer
      open
      onClose={onClose}
      title={`${r.section} · ${r.amdt}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={onEdit}>Edit</Button>
        </>
      }
    >
      <div className="grid gap-lg">
        <DetailCard title="Rule">
          <div className="grid grid-cols-2 gap-lg">
            <DetailField label="Section">{r.section}</DetailField>
            <DetailField label="Amdt"><GcpChip value={r.amdt} label="amendments" /></DetailField>
            <DetailField label="Subpart">{subpart}</DetailField>
            <DetailField label="Subsection">{subsection}</DetailField>
          </div>
          <div className="mt-lg">
            <DetailField label="Title">{r.title}</DetailField>
          </div>
          <div className="mt-lg">
            {/* Was printing the whole URL inline after its label, which
                wraps over several lines on a long one — same bug the
                Documents drawer's File field had (client instruction,
                2026-09-25). `FileLink` keeps it to one clipped line. */}
            {/* Label is "FAA Source"/"Source" alone, not the URL appended
                after it — the same over-long-URL-as-text problem `FileLink`
                exists to avoid in the first place (client instruction,
                2026-09-25: "dont write all this [URL]... instead say Go
                To"). Matches the sibling copies of this same source link on
                `RegulationListPage`/`GcpFlowPage`/`FlowStepInitialize`. */}
            <DetailField label="Source">
              <FileLink url={r.url} label={r.url ? sourceLabel(r.url) : undefined} />
            </DetailField>
          </div>
        </DetailCard>

        <DetailCard title="Text">
          <DetailField label="Requirement Text">
            <span className="whitespace-pre-wrap">{r.requirementText}</span>
          </DetailField>
          <div className="mt-lg">
            <DetailField label="Default Moc Text">
              <span className="whitespace-pre-wrap">{r.defaultMocText}</span>
            </DetailField>
          </div>
        </DetailCard>

        <DetailCard title="Placement">
          <div className="grid grid-cols-2 gap-lg">
            <DetailField label="Section Root"><GcpChip value={r.sectionRoot} label="section roots" /></DetailField>
            <DetailField label="Sort">{r.sort}</DetailField>
            <DetailField label="Active">
              <Badge tone={r.active ? 'success' : 'neutral'}>{r.active ? 'Active' : 'Inactive'}</Badge>
            </DetailField>
          </div>
        </DetailCard>
      </div>
    </Drawer>
  )
}
