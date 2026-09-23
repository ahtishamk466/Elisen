import { ExternalLink } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { DetailCard, DetailField } from '@/components/patterns/DetailView'
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
            <DetailField label="Source">
              {r.url ? (
                <a href={r.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-xs rounded-sm text-accent underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
                  <ExternalLink size={14} aria-hidden />
                  {sourceLabel(r.url)} — {r.url}
                </a>
              ) : ''}
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
