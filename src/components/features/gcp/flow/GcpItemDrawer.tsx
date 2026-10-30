import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { ActiveSelect } from '@/components/patterns/ActiveSelect'
import { Button } from '@/components/ui/Button'
import { SearchableSelect, type SearchableOption } from '@/components/ui/SearchableSelect'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { useGcpStore } from '@/stores/gcpStore'
import { useDocumentsStore } from '@/stores/documentsStore'
import { useTccaStore } from '@/stores/tccaStore'
import type { GcpItem } from '@/types/gcp'

export interface GcpItemDrawerProps {
  mode: 'create' | 'edit'
  planEntryId: string
  initial?: GcpItem
  /** The rule the item belongs to, named in the title so the group is never
      asked for twice. */
  ruleLabel: string
  /** The rule's Section Root — Delegation is keyed on it, not on the amendment. */
  sectionRoot: string
  /** The TCCA project whose linked deliverables Deliverable Number offers. */
  tccaProjectId: string
  onClose: () => void
}

/** Keeps a saved code pickable on edit when it has since left the list
    (an inactive discipline, a deliverable unlinked from the project). */
function withCurrent(options: SearchableOption[], value: string): SearchableOption[] {
  if (!value || options.some((o) => o.value === value)) return options
  return [{ value, label: value, hint: 'Not in the current list' }, ...options]
}

/**
 * One GCP Data row: who shows compliance with a rule, how, and where.
 *
 * Every field picks from the client's own reference lists, as the legacy GCP
 * screen does. FOC Code is the legacy list above and below its line: first
 * the codes delegated for this rule's Section Root (they make the finding
 * themselves), then every FOC marked Default (candidates `(C)`, CEs, outside
 * DARs, TCCA), who are offered on any rule. A delegate code (Default: No) is
 * left out on rules it holds no delegation for, which is the mistake the
 * legacy database exists to prevent. Delegation's own Active flag is not
 * applied: the legacy picker lists delegates flagged inactive too (AP-08 on
 * 25.1301, client demo 2026-09-09). Deliverable Number lists only
 * deliverables linked to this TCCA project.
 */
export function GcpItemDrawer({ mode, planEntryId, initial, ruleLabel, sectionRoot, tccaProjectId, onClose }: GcpItemDrawerProps) {
  const isEdit = mode === 'edit'
  const addItem = useGcpFlowStore((s) => s.addItem)
  const updateItem = useGcpFlowStore((s) => s.updateItem)
  const disciplines = useGcpStore((s) => s.disciplines)
  const mocs = useGcpStore((s) => s.mocs)
  const focs = useGcpStore((s) => s.focs)
  const delegations = useGcpStore((s) => s.delegations)
  const documents = useDocumentsStore((s) => s.documents)
  const revisions = useDocumentsStore((s) => s.revisions)
  const docLinks = useTccaStore((s) => s.docLinks)
  const [daoSpecialtyCode, setDaoSpecialtyCode] = useState(initial?.daoSpecialtyCode ?? '')
  const [mocCode, setMocCode] = useState(initial?.mocCode ?? '')
  const [focCode, setFocCode] = useState(initial?.focCode ?? '')
  const [deliverableId, setDeliverableId] = useState(initial?.deliverableId ?? '')
  const [active, setActive] = useState(initial?.active ?? true)

  const daoOptions = disciplines.filter((d) => d.active)
    .map((d) => ({ value: d.daoSpecialtyCode, label: `${d.daoSpecialtyCode} -- ${d.elisenDiscipline}` }))
  const mocOptions = mocs.map((m) => ({ value: m.code, label: `${m.code} -- ${m.description}` }))

  const delegated = new Set(delegations.filter((d) => d.sectionRoot === sectionRoot).map((d) => d.focCode))
  const focLabel = (code: string, name: string) => `${code} -- ${name}`
  const focOptions = [
    ...focs.filter((f) => delegated.has(f.code))
      .map((f) => ({ value: f.code, label: focLabel(f.code, f.authoritySpecialist), hint: 'Delegated for this rule' })),
    ...focs.filter((f) => f.isDefault && !delegated.has(f.code))
      .map((f) => ({ value: f.code, label: focLabel(f.code, f.authoritySpecialist) })),
  ]

  const linkedRevisionIds = new Set(docLinks.filter((l) => l.tccaProjectId === tccaProjectId).map((l) => l.revisionId))
  const linkedDocumentIds = new Set(revisions.filter((r) => linkedRevisionIds.has(r.id)).map((r) => r.documentId))
  const deliverableOptions = documents
    .filter((d) => d.kind === 'deliverable' && linkedDocumentIds.has(d.id))
    .map((d) => ({ value: d.number, label: d.number, hint: d.title }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const submit = () => {
    if (isEdit && initial) {
      updateItem(initial.id, { daoSpecialtyCode, mocCode, focCode, deliverableId, active })
    } else {
      addItem({ id: crypto.randomUUID(), planEntryId, daoSpecialtyCode, mocCode, focCode, deliverableId, active })
    }
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit GCP data for ${ruleLabel}` : `GCP data for ${ruleLabel}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Add'}</Button>
        </>
      }
    >
      <FormSection title="GCP Data" subtitle="Who shows compliance with this rule, how, and where it is written.">
        <FormField label="DAO Specialty Code" htmlFor="item-dao"
          help="The Design Approval Organization discipline doing the work.">
          <SearchableSelect id="item-dao" value={daoSpecialtyCode} onChange={setDaoSpecialtyCode}
            placeholder="Select DAO specialty code…" options={withCurrent(daoOptions, daoSpecialtyCode)} />
        </FormField>
        <FormField label="MOC Code" htmlFor="item-moc"
          help="Means of Compliance: how this rule will be shown.">
          <SearchableSelect id="item-moc" value={mocCode} onChange={setMocCode}
            placeholder="Select MOC code…" options={withCurrent(mocOptions, mocCode)} />
        </FormField>
        <FormField label="FOC Code" htmlFor="item-foc"
          help="Finding of Compliance: who signs. Delegates for this rule come first.">
          <SearchableSelect id="item-foc" value={focCode} onChange={setFocCode}
            placeholder="Select FOC code…" options={withCurrent(focOptions, focCode)} />
        </FormField>
        <FormField label="Deliverable Number" htmlFor="item-deliverable"
          help="The report this rule's evidence goes into.">
          <SearchableSelect id="item-deliverable" value={deliverableId} onChange={setDeliverableId}
            placeholder="Select a deliverable…" options={withCurrent(deliverableOptions, deliverableId)}
            emptyLabel="No deliverables are linked to this TCCA project yet." />
        </FormField>
        <FormField label="Active" htmlFor="item-active">
          <ActiveSelect id="item-active" value={active} onChange={setActive} />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
