import { useMemo, useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Checkbox } from '@/components/ui/Checkbox'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useLookupStore } from '@/stores/lookupStore'
import { useApprovalsStore } from '@/stores/approvalsStore'
import type { Approval } from '@/types/documents'

export interface ApprovalDrawerProps {
  initial?: Approval
  onClose: () => void
  onSave: (a: Approval) => void
}

/**
 * Record an issued certificate, on the fields the client actually named:
 * "In the approval form there was name, title, and there was Primary, and
 * inside it the aircraft had to be selected, and if it has a serial number then
 * we had to select that too."
 *
 * The earlier form invented Authority / Type / Issued Date — hence "This form
 * is also wrong." None of them exist on the legacy `approval` table, and the
 * issue date belongs to a revision, not to the certificate.
 *
 * Only the Approvals workspace opens this. A project links to certificates, it
 * never creates them (requirement §1.2).
 */
export function ApprovalDrawer({ initial, onClose, onSave }: ApprovalDrawerProps) {
  const catalog = useLookupStore((s) => s.aircraft)
  const serials = useLookupStore((s) => s.serials)
  const companies = useLookupStore((s) => s.companies)
  const approvals = useApprovalsStore((s) => s.approvals)

  /**
   * Holders come from Reference Data companies plus any holder already recorded
   * on an approval, so existing values like "Elisen Inc." stay selectable even
   * though they predate the company list. Searchable regardless of length: it is
   * a name, and you know the one you want.
   */
  const holderOptions = useMemo(() => {
    const names = new Set<string>()
    approvals.forEach((a) => a.designApprovalHolder && names.add(a.designApprovalHolder))
    companies.forEach((c) => c.name && names.add(c.name))
    if (initial?.designApprovalHolder) names.add(initial.designApprovalHolder)
    return Array.from(names).sort((a, b) => a.localeCompare(b))
  }, [approvals, companies, initial])
  const isEdit = !!initial

  const [number, setNumber] = useState(initial?.number ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [primary, setPrimary] = useState(initial?.primary ?? true)
  const [holder, setHolder] = useState(initial?.designApprovalHolder ?? '')
  const [comment, setComment] = useState(initial?.comment ?? '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [aircraftIds, setAircraftIds] = useState<string[]>(initial?.aircraftIds ?? [])
  const [serialIds, setSerialIds] = useState<string[]>(initial?.serialIds ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})

  /** Serials are only offered for the aircraft the certificate covers — a tail
      number under a model this approval says nothing about is meaningless. */
  const serialOptions = serials
    .filter((sn) => aircraftIds.includes(sn.aircraftId))
    .map((sn) => {
      const model = catalog.find((a) => a.id === sn.aircraftId)
      return {
        value: sn.id,
        label: sn.registration ? `${sn.serial}: ${sn.registration}` : sn.serial,
        hint: model?.modelNumber,
      }
    })

  const submit = () => {
    const e: Record<string, string> = {}
    if (!number.trim()) e.number = 'Certificate number is required.'
    if (!description.trim()) e.description = 'Description is required.'
    setErrors(e)
    if (Object.values(e).some(Boolean)) return
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      number: number.trim(),
      description: description.trim(),
      primary,
      designApprovalHolder: holder.trim(),
      comment: comment.trim(),
      active,
      projectIds: initial?.projectIds ?? [],
      aircraftIds,
      // Dropping an aircraft must drop its serials too, or the approval keeps
      // tails for a model it no longer covers.
      serialIds: serialIds.filter((id) => serialOptions.some((o) => o.value === id)),
    })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit Approval ${initial.number}` : 'Add Approval'}
      footer={
        <>
          <div className="flex gap-sm">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Add Approval'}</Button>
          </div>
        </>
      }
    >
      <FormSection
        title="Certificate"
        subtitle="The certificate itself. Dates live on its revisions. An approval has no single date, because it changes each time it is re-issued."
      >
        <FormField label="Number" htmlFor="ap-number" required error={errors.number} help="e.g. STC SA26-102">
          <Input id="ap-number" value={number} error={!!errors.number} onChange={(e) => { setNumber(e.target.value); setErrors((p) => ({ ...p, number: '' })) }} />
        </FormField>
        <FormField label="Description" htmlFor="ap-description" required error={errors.description}>
          <Textarea id="ap-description" value={description} error={!!errors.description}
            onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: '' })) }} />
        </FormField>
        {/* A flag, and a checkbox on the legacy screen — the "booleans are
            Selects" convention here covers Active/Status, which reads as a
            state, not a one-off attribute like this. */}
        <FormField label="Primary Approval" htmlFor="ap-primary">
          <Checkbox id="ap-primary" checked={primary} onChange={(e) => setPrimary(e.target.checked)}
            label="This is a primary approval" />
          <p className="mt-xxss pl-2xl text-xs text-text-muted">
            Leave unticked when the certificate only exists as a change against another approval.
          </p>
        </FormField>
        <FormField label="Design Approval Holder" htmlFor="ap-holder"
          help="The organisation holding the design approval. From Reference Data companies, plus holders already in use.">
          <SearchableSelect
            id="ap-holder" value={holder} onChange={setHolder}
            options={holderOptions.map((h) => ({ value: h, label: h }))}
            placeholder="Select an organisation..."
            emptyLabel="No companies in Reference Data yet."
            indicator="radio"
            searchThreshold={0}
          />
        </FormField>
        <FormField label="Comment" htmlFor="ap-comment">
          <Textarea id="ap-comment" value={comment} onChange={(e) => setComment(e.target.value)} />
        </FormField>
        <FormField label="Status" htmlFor="ap-active">
          <Select id="ap-active" value={active ? 'active' : 'inactive'} onChange={(e) => setActive(e.target.value === 'active')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FormField>
      </FormSection>

      {/* Aircraft and serials are selected here at creation and can be added to
          later from the approval's own tabs — "We can add two aircraft in it.
          After that, inside it we can add more revisions. Or aircraft or serial
          numbers can be added." */}
      <FormSection
        title="Coverage"
        subtitle="Which aircraft this certificate covers. Both optional. An approval often names a type before any specific airframe is known."
      >
        <FormField label="Aircraft Model Number" htmlFor="ap-aircraft" help="From Reference Data. Select as many models as the certificate covers.">
          <MultiSelect
            id="ap-aircraft"
            value={aircraftIds}
            onChange={setAircraftIds}
            placeholder="Select aircraft..."
            emptyLabel="No aircraft in Reference Data yet."
            options={catalog
              .filter((a) => a.active || aircraftIds.includes(a.id))
              .map((a) => ({
                value: a.id,
                label: a.modelName ? `${a.modelNumber}: ${a.modelName}` : a.modelNumber,
                hint: a.manufacturer,
              }))}
          />
        </FormField>
        <FormField label="Serial Number" htmlFor="ap-serials"
          help={aircraftIds.length === 0
            ? 'Select an aircraft first. Serials are listed per model.'
            : 'The specific airframes covered. Leave empty if the approval covers the type generally.'}>
          <MultiSelect
            id="ap-serials"
            value={serialIds}
            onChange={setSerialIds}
            placeholder={aircraftIds.length === 0 ? 'Select an aircraft first' : 'Select serial numbers...'}
            emptyLabel="No serials recorded for the selected aircraft."
            options={serialOptions}
          />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
