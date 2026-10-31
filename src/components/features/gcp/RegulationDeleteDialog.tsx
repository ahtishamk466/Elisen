import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { amendmentLabel } from '@/lib/gcpDisplay'
import { regulationUsage, regulationUsageSummary } from '@/lib/regulationUsage'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { useGcpStore } from '@/stores/gcpStore'
import { useToastStore } from '@/stores/toastStore'
import type { Regulation } from '@/types/gcp'

export interface RegulationDeleteDialogProps {
  regulation: Regulation | null
  onClose: () => void
  onDeleted?: (id: string) => void
}

/** Both library and contextual lists use the same reference-preserving action. */
export function RegulationDeleteDialog({ regulation, onClose, onDeleted }: RegulationDeleteDialogProps) {
  const bases = useGcpFlowStore((s) => s.bases)
  const entries = useGcpFlowStore((s) => s.planEntries)
  const latest = useGcpStore((s) => s.regulations.find((r) => r.id === regulation?.id))
  const updateRegulation = useGcpStore((s) => s.updateRegulation)
  const removeRegulation = useGcpStore((s) => s.removeRegulation)
  const toast = useToastStore((s) => s.show)
  const selected = latest ?? regulation
  const usage = regulationUsage(selected?.id ?? '', bases, entries)

  const confirm = () => {
    if (!selected) return
    const current = useGcpStore.getState().regulations.find((r) => r.id === selected.id)
    if (!current) { toast('This regulation is no longer available.'); onClose(); return }
    if (usage.inUse) {
      if (current.active) {
        updateRegulation(current.id, { active: false })
        toast(`Regulation ${current.section} at ${amendmentLabel(current.amdt)} marked inactive. Existing references are retained.`)
      }
      onClose()
      return
    }
    // The store checks current references again, even if they changed after
    // this confirmation opened. Never report a blocked removal as success.
    if (!removeRegulation(current.id)) {
      toast('This regulation is in use and cannot be deleted.')
      return
    }
    toast(`Regulation ${current.section} at ${amendmentLabel(current.amdt)} deleted.`)
    onDeleted?.(current.id)
    onClose()
  }

  const description = !selected ? '' : usage.inUse
    ? `Referenced by ${regulationUsageSummary(usage)}. Referenced regulations cannot be deleted. ${selected.active ? 'You can mark this regulation inactive instead; its existing references will be retained.' : 'This regulation is already inactive; its existing references will be retained.'}`
    : `“${selected.title}” will be permanently removed from the rule library. This cannot be undone.`

  return (
    <ConfirmDialog open={!!selected}
      title={usage.inUse ? `${selected?.section} at ${amendmentLabel(selected?.amdt ?? '')} is in use` : `Delete ${selected?.section} at ${amendmentLabel(selected?.amdt ?? '')}?`}
      description={description}
      confirmLabel={usage.inUse ? selected?.active ? 'Make inactive' : 'Close' : 'Delete regulation'}
      tone={usage.inUse ? 'primary' : 'danger'} onConfirm={confirm} onCancel={onClose} />
  )
}
