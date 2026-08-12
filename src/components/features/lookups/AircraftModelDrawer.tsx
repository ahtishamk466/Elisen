import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { DetailCard, DetailField } from '@/components/patterns/DetailView'
import { Truncate } from '@/components/patterns/Truncate'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import type { AircraftModel, AircraftSerial } from '@/types/lookup'

export interface AircraftModelDrawerProps {
  mode: 'create' | 'edit' | 'view'
  initial?: AircraftModel
  /** The one row (model + serial pair) being edited/viewed — a model with
      several tail numbers has several rows, each edited independently. */
  initialSerial?: AircraftSerial
  onClose: () => void
  onSave: (model: AircraftModel, serial: AircraftSerial | null) => void
}

const blankSerial = (aircraftId: string): AircraftSerial => (
  { id: crypto.randomUUID(), aircraftId, serial: '', registration: '', comment: '', active: true }
)

export function AircraftModelDrawer({ mode, initial, initialSerial, onClose, onSave }: AircraftModelDrawerProps) {
  const isView = mode === 'view'
  const isEdit = mode === 'edit'
  const aircraftId = initial?.id ?? crypto.randomUUID()
  const [m, setM] = useState<AircraftModel>(initial ?? {
    id: aircraftId, modelNumber: '', modelName: '', manufacturer: '', tccaTc: '', faaTc: '', easaTc: '', drawingPrefix: '', active: true,
  })
  const [sn, setSn] = useState<AircraftSerial>(initialSerial ?? blankSerial(aircraftId))
  const [error, setError] = useState('')
  const [serialError, setSerialError] = useState('')

  const setField = <K extends keyof AircraftModel>(key: K, value: AircraftModel[K]) => setM((prev) => ({ ...prev, [key]: value }))
  const setSerialField = <K extends keyof AircraftSerial>(key: K, value: AircraftSerial[K]) => setSn((prev) => ({ ...prev, [key]: value }))

  const submit = () => {
    let hasError = false
    if (!m.modelNumber.trim()) { setError('Model number is required.'); hasError = true }
    if (!sn.serial.trim()) { setSerialError('Serial number is required.'); hasError = true }
    if (hasError) return
    // One Status field represents the row; the serial's own flag isn't
    // surfaced separately since nothing else in the app reads it.
    onSave({ ...m, modelNumber: m.modelNumber.trim() }, { ...sn, serial: sn.serial.trim(), active: m.active })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isView ? `Aircraft "${initial!.modelNumber}"` : isEdit ? `Edit Aircraft "${initial!.modelNumber}"` : 'Add Aircraft'}
      footer={
        isView ? (
          <Button variant="secondary" onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create Aircraft'}</Button>
          </>
        )
      }
    >
      {isView ? (
        // Field order matches the Aircraft table's own column order.
        <DetailCard title="Aircraft">
          <div className="grid grid-cols-2 gap-lg tablet:grid-cols-4">
            <DetailField label="Serial No" nowrap>{sn.serial}</DetailField>
            <DetailField label="Reg. No" nowrap>{sn.registration}</DetailField>
            <DetailField label="Model Number" nowrap>{m.modelNumber}</DetailField>
            <DetailField label="Model Name">{m.modelName && <Truncate>{m.modelName}</Truncate>}</DetailField>
            <DetailField label="Manufacture">{m.manufacturer}</DetailField>
            <DetailField label="TCCA TC">{m.tccaTc}</DetailField>
            <DetailField label="FAA TC">{m.faaTc}</DetailField>
            <DetailField label="EASA TC">{m.easaTc}</DetailField>
            <DetailField label="Drawing Prefix">{m.drawingPrefix}</DetailField>
            <DetailField label="Comment">{sn.comment && <Truncate>{sn.comment}</Truncate>}</DetailField>
            <DetailField label="Active">{m.active ? 'Active' : 'Inactive'}</DetailField>
          </div>
        </DetailCard>
      ) : (
        <FormSection title="Aircraft" subtitle="One aircraft — a specific tail number of this model.">
          <FormField label="Serial No" htmlFor="am-serial" required error={serialError}>
            <Input
              id="am-serial" value={sn.serial} error={!!serialError} placeholder="e.g. 593"
              onChange={(e) => { setSerialField('serial', e.target.value); setSerialError('') }}
            />
          </FormField>
          <FormField label="Reg. No" htmlFor="am-reg">
            <Input id="am-reg" value={sn.registration} placeholder="e.g. C-GTXM" onChange={(e) => setSerialField('registration', e.target.value)} />
          </FormField>
          <FormField label="Model Number" htmlFor="am-number" required error={error}>
            <Input id="am-number" value={m.modelNumber} error={!!error} placeholder="e.g. A330" onChange={(e) => { setField('modelNumber', e.target.value); setError('') }} />
          </FormField>
          <FormField label="Model Name" htmlFor="am-name">
            <Input id="am-name" value={m.modelName} placeholder="e.g. Airbus A330" onChange={(e) => setField('modelName', e.target.value)} />
          </FormField>
          <FormField label="Manufacture" htmlFor="am-mfr">
            <Input id="am-mfr" value={m.manufacturer} placeholder="e.g. Airbus" onChange={(e) => setField('manufacturer', e.target.value)} />
          </FormField>
          <FormField label="TCCA TC" htmlFor="am-tcca" help="Type certificate number, or N/A.">
            <Input id="am-tcca" value={m.tccaTc} onChange={(e) => setField('tccaTc', e.target.value)} />
          </FormField>
          <FormField label="FAA TC" htmlFor="am-faa">
            <Input id="am-faa" value={m.faaTc} onChange={(e) => setField('faaTc', e.target.value)} />
          </FormField>
          <FormField label="EASA TC" htmlFor="am-easa">
            <Input id="am-easa" value={m.easaTc} onChange={(e) => setField('easaTc', e.target.value)} />
          </FormField>
          <FormField label="Drawing Prefix" htmlFor="am-prefix" help="Used when numbering drawings for this type.">
            <Input id="am-prefix" value={m.drawingPrefix} placeholder="e.g. AB" onChange={(e) => setField('drawingPrefix', e.target.value)} />
          </FormField>
          <FormField label="Comment" htmlFor="am-comment">
            <Input id="am-comment" value={sn.comment} placeholder="Optional note" onChange={(e) => setSerialField('comment', e.target.value)} />
          </FormField>
          <FormField label="Status" htmlFor="am-status" help="Inactive hides this aircraft from pickers across the app.">
            <Select
              id="am-status"
              value={m.active ? 'active' : 'inactive'}
              onChange={(e) => setField('active', e.target.value === 'active')}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </FormField>
        </FormSection>
      )}
    </Drawer>
  )
}
