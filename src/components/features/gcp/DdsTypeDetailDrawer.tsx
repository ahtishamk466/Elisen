import { Drawer } from '@/components/patterns/Drawer'
import { DetailCard, DetailField } from '@/components/patterns/DetailView'
import { Button } from '@/components/ui/Button'
import type { DdsType } from '@/types/gcp'

export interface DdsTypeDetailDrawerProps {
  ddsType: DdsType
  onClose: () => void
  onEdit: () => void
}

/** Plain text pulled out of stored rich HTML for a *read-only* view —
    `DOMParser` never attaches the parsed document to the page, so nothing
    it contains executes; only `textContent` is read out of it. Formatting
    (bold/lists/tables) is why `RichTextEditor` itself renders the HTML for
    editing, but a View screen never uses `dangerouslySetInnerHTML`
    (docs/SECURITY.md rule 3) — this reads the words without the markup. */
function htmlToText(html: string): string {
  if (!html) return ''
  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() ?? ''
}

/** Read-only view of one DDS type — Type, then its DDS Text as plain text
    (see `htmlToText`), editing behind Edit. */
export function DdsTypeDetailDrawer({ ddsType: d, onClose, onEdit }: DdsTypeDetailDrawerProps) {
  return (
    <Drawer
      open
      onClose={onClose}
      title={d.type || 'DDS Type'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={onEdit}>Edit</Button>
        </>
      }
    >
      <DetailCard title="DDS Type">
        <DetailField label="Type">{d.type}</DetailField>
        <div className="mt-lg">
          <DetailField label="DDS Text">{htmlToText(d.ddsText)}</DetailField>
        </div>
      </DetailCard>
    </Drawer>
  )
}
