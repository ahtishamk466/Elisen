import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { useGcpStore } from '@/stores/gcpStore'

export interface RegulationGroupSectionDrawerProps {
  /** The group being edited — always known, since the drawer opens from inside
      that group's own panel. */
  groupId: string
  onClose: () => void
  onSubmit: (groupId: string, sectionRoots: string[]) => void
}

/**
 * Attaches regulations to one group, by section root.
 *
 * The legacy screen used two facing list boxes with `>` `>>` `<` `<<` between
 * them, and asked which group first. Here the group is already open, so the
 * drawer only asks the question that is still unanswered: which rules.
 */
export function RegulationGroupSectionDrawer({ groupId, onClose, onSubmit }: RegulationGroupSectionDrawerProps) {
  const groups = useGcpStore((s) => s.groups)
  const groupSections = useGcpStore((s) => s.groupSections)
  const regulations = useGcpStore((s) => s.regulations)

  const group = groups.find((g) => g.id === groupId)
  const [roots, setRoots] = useState<string[]>(
    groupSections.filter((s) => s.groupId === groupId).map((s) => s.sectionRoot),
  )

  /** Every section root in the rule pool, each offered once. */
  const available = Array.from(new Set(regulations.map((r) => r.sectionRoot).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

  return (
    <Drawer
      open
      onClose={onClose}
      title={group ? `Regulations for “${group.title}”` : 'Regulations'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSubmit(groupId, roots); onClose() }}>Save</Button>
        </>
      }
    >
      <FormSection title="Regulation Section Roots" subtitle="The regulations this kind of modification typically affects.">
        <FormField label="Section Roots" htmlFor="rgs-roots" fullWidth
          help={`${available.length} in the rule pool. Search to narrow the list.`}>
          <MultiSelect
            id="rgs-roots"
            value={roots}
            onChange={setRoots}
            placeholder="Select section roots…"
            emptyLabel="No section roots in the rule pool yet."
            options={available.map((r) => ({ value: r, label: r }))}
          />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
