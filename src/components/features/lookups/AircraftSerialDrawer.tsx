import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { DetailCard, DetailField } from '@/components/patterns/DetailView'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useLookupStore } from '@/stores/lookupStore'
import type { AircraftSerial } from '@/types/lookup'

export interface AircraftSerialDrawerProps {
  mode: 'create' | 'edit' | 'view'
  initial?: AircraftSerial
  /** Preselects the model when added from an aircraft's row. */
  aircraftId?: string
  onClose: () => void
  onSave: (serial: AircraftSerial) => void
}

const blank = (aircraftId = ''): AircraftSerial => ({
  id: '', aircraftId, serial: '', registration: '',
  ownerName: '', company: '', addressLine1: '', addressLine2: '', city: '',
  provState: '', country: '', postalZipcode: '', telephone: '', email: '',
  comment: '', active: true,
})

/**
 * One airframe: which model it is, its serial and registration, and the owner
 * or operator it belongs to.
 *
 * The owner block is why this is its own record rather than a column on the
 * model, and it is what makes "has our team worked on this tail number?"
 * answerable: search the serial, get the aircraft and who to call.
 */
export function AircraftSerialDrawer({ mode, initial, aircraftId, onClose, onSave }: AircraftSerialDrawerProps) {
  const catalog = useLookupStore((s) => s.aircraft)
  const serials = useLookupStore((s) => s.serials)
  const isView = mode === 'view'

  const [values, setValues] = useState<AircraftSerial>(initial ?? blank(aircraftId))
  const [errors, setErrors] = useState<{ aircraftId?: string; serial?: string }>({})

  const set = <K extends keyof AircraftSerial>(key: K, value: AircraftSerial[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }
  const model = catalog.find((a) => a.id === values.aircraftId)

  const submit = () => {
    const e: typeof errors = {}
    if (!values.aircraftId) e.aircraftId = 'Choose the aircraft this airframe is one of.'
    if (!values.serial.trim()) e.serial = 'Serial number is required.'
    // Serials repeat across manufacturers, so uniqueness is per model, never global.
    else if (serials.some((x) => x.id !== values.id && x.aircraftId === values.aircraftId
      && x.serial.trim().toLowerCase() === values.serial.trim().toLowerCase()))
      e.serial = `${values.serial.trim()} already exists on this aircraft.`
    setErrors(e)
    if (Object.values(e).some(Boolean)) return
    onSave({ ...values, id: values.id || crypto.randomUUID(), serial: values.serial.trim() })
    onClose()
  }

  const title = mode === 'create' ? 'Add Serial Number'
    : mode === 'edit' ? `Edit Serial ${initial?.serial}`
      : `Serial ${initial?.serial}`

  return (
    <Drawer
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <div className="flex gap-sm">
            <Button variant="secondary" onClick={onClose}>{isView ? 'Close' : 'Cancel'}</Button>
            {!isView && <Button onClick={submit}>{mode === 'create' ? 'Create Serial Number' : 'Save Changes'}</Button>}
          </div>
        </>
      }
    >
      {isView ? (
        <>
          <DetailCard title="Airframe">
            <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
              <DetailField label="Aircraft" nowrap>{model?.modelNumber}</DetailField>
              <DetailField label="Serial No" nowrap>{values.serial}</DetailField>
              <DetailField label="Reg. No" nowrap>{values.registration}</DetailField>
              <DetailField label="Status">{values.active ? 'Active' : 'Inactive'}</DetailField>
            </div>
          </DetailCard>
          <DetailCard title="Owner / Operator">
            <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
              <DetailField label="Name">{values.ownerName}</DetailField>
              <DetailField label="Company">{values.company}</DetailField>
              <DetailField label="Telephone No" nowrap>{values.telephone}</DetailField>
              <DetailField label="Email">{values.email}</DetailField>
              <DetailField label="Address Line 1">{values.addressLine1}</DetailField>
              <DetailField label="Address Line 2">{values.addressLine2}</DetailField>
              <DetailField label="City">{values.city}</DetailField>
              <DetailField label="Prov / State">{values.provState}</DetailField>
              <DetailField label="Country">{values.country}</DetailField>
              <DetailField label="Postal / Zipcode" nowrap>{values.postalZipcode}</DetailField>
              <DetailField label="Comment">{values.comment}</DetailField>
            </div>
          </DetailCard>
        </>
      ) : (
        <>
          <FormSection title="Airframe" subtitle="Which aircraft this is one of, and how it is identified.">
            <FormField label="Aircraft Model Number" htmlFor="as-aircraft" required error={errors.aircraftId}
              help="A serial is unique within its model only.">
              <SearchableSelect
                id="as-aircraft" value={values.aircraftId} error={!!errors.aircraftId}
                onChange={(v) => set('aircraftId', v)}
                options={catalog.map((a) => ({
                  value: a.id,
                  label: a.modelNumber,
                  hint: a.modelName || a.manufacturer,
                }))}
                placeholder="Select an aircraft..."
                emptyLabel="No aircraft yet. Add one on the Aircraft tab first."
              />
            </FormField>
            <FormField label="Serial Number" htmlFor="as-serial" required error={errors.serial}>
              <Input id="as-serial" placeholder="e.g. FL-1234" value={values.serial} error={!!errors.serial}
                onChange={(e) => set('serial', e.target.value)} />
            </FormField>
            <FormField label="Registration Number" htmlFor="as-reg"
              help="Tail number — it can change; the serial can't.">
              <Input id="as-reg" value={values.registration} placeholder="e.g. C-GTXM"
                onChange={(e) => set('registration', e.target.value)} />
            </FormField>
            <FormField label="Status" htmlFor="as-status" help="Inactive stays on old records, out of pickers.">
              <Select id="as-status" value={values.active ? 'active' : 'inactive'}
                onChange={(e) => set('active', e.target.value === 'active')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormField>
          </FormSection>

          <FormSection title="Owner / Operator" subtitle="Who to contact about this airframe. All optional.">
            <FormField label="Name" htmlFor="as-owner">
              <Input id="as-owner" placeholder="Owner or operator name..." value={values.ownerName} onChange={(e) => set('ownerName', e.target.value)} />
            </FormField>
            <FormField label="Company" htmlFor="as-company">
              <Input id="as-company" placeholder="e.g. Duncan Aviation" value={values.company} onChange={(e) => set('company', e.target.value)} />
            </FormField>
            <FormField label="Address Line 1" htmlFor="as-addr1">
              <Input id="as-addr1" placeholder="Street address..." value={values.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} />
            </FormField>
            <FormField label="Address Line 2" htmlFor="as-addr2">
              <Input id="as-addr2" placeholder="Suite, unit, floor..." value={values.addressLine2} onChange={(e) => set('addressLine2', e.target.value)} />
            </FormField>
            <FormField label="City" htmlFor="as-city">
              <Input id="as-city" placeholder="e.g. Montreal" value={values.city} onChange={(e) => set('city', e.target.value)} />
            </FormField>
            <FormField label="Prov / State" htmlFor="as-prov">
              <Input id="as-prov" placeholder="e.g. Quebec" value={values.provState} onChange={(e) => set('provState', e.target.value)} />
            </FormField>
            <FormField label="Country" htmlFor="as-country">
              <Input id="as-country" placeholder="e.g. Canada" value={values.country} onChange={(e) => set('country', e.target.value)} />
            </FormField>
            <FormField label="Postal / Zipcode" htmlFor="as-postal">
              <Input id="as-postal" placeholder="e.g. H4Y 1C2" value={values.postalZipcode} className="w-40"
                onChange={(e) => set('postalZipcode', e.target.value)} />
            </FormField>
            <FormField label="Telephone No" htmlFor="as-tel">
              <Input id="as-tel" placeholder="e.g. +1 514 555 0100" value={values.telephone} onChange={(e) => set('telephone', e.target.value)} />
            </FormField>
            <FormField label="Email" htmlFor="as-email">
              <Input id="as-email" placeholder="name@company.com" type="email" value={values.email} onChange={(e) => set('email', e.target.value)} />
            </FormField>
            <FormField label="Comment" htmlFor="as-comment">
              <Textarea id="as-comment" placeholder="Anything worth noting..." value={values.comment} onChange={(e) => set('comment', e.target.value)} />
            </FormField>
          </FormSection>
        </>
      )}
    </Drawer>
  )
}
