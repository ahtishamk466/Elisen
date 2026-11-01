import { useMemo, useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { regulationGroupOptions } from '@/lib/regulationGroupOptions'
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
  const [savedRoots] = useState(() =>
    groupSections.filter((s) => s.groupId === groupId).map((s) => s.sectionRoot),
  )
  const [roots, setRoots] = useState(savedRoots)
  const options = useMemo(() => regulationGroupOptions(regulations, savedRoots), [regulations, savedRoots])

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
      <FormField label="Select regulations" htmlFor="rgs-roots" fullWidth>
        <MultiSelect
          id="rgs-roots"
          value={roots}
          onChange={setRoots}
          placeholder="Search and select regulations…"
          emptyLabel="No regulations in the library yet."
          options={options}
          virtualized
        />
      </FormField>
    </Drawer>
  )
}
