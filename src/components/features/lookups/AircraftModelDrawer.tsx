import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { DetailCard, DetailField } from '@/components/patterns/DetailView'
import { Truncate } from '@/components/patterns/Truncate'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import type { AircraftModel, AircraftSerial } from '@/types/lookup'

export interface AircraftModelDrawerProps {
  mode: 'create' | 'edit' | 'view'
  initial?: AircraftModel
  initialSerials?: AircraftSerial[]
  onClose: () => void
  onSave: (model: AircraftModel, serials: AircraftSerial[]) => void
}

// Matches the Aircraft list table exactly: Serial No, Registration No, then
// the model's own columns, in the same left-to-right order.
const COLUMNS = [
  { key: 'serial', label: 'Serial No', width: 90 },
  { key: 'registration', label: 'Reg. No', width: 110 },
  { key: 'modelNumber', label: 'Model Number', width: 100 },
  { key: 'modelName', label: 'Model Name', width: 160 },
  { key: 'manufacturer', label: 'Manufacture', width: 130 },
  { key: 'tccaTc', label: 'TCCA TC', width: 90 },
  { key: 'faaTc', label: 'FAA TC', width: 80 },
  { key: 'easaTc', label: 'EASA TC', width: 80 },
  { key: 'drawingPrefix', label: 'Prefix', width: 64 },
  { key: 'comment', label: 'Comment', width: 160 },
] as const

const blankSerial = (aircraftId: string): AircraftSerial => (
  { id: crypto.randomUUID(), aircraftId, serial: '', registration: '', comment: '', active: true }
)

export function AircraftModelDrawer({ mode, initial, initialSerials = [], onClose, onSave }: AircraftModelDrawerProps) {
  const isView = mode === 'view'
  const isEdit = mode === 'edit'
  const aircraftId = initial?.id ?? crypto.randomUUID()
  const [m, setM] = useState<AircraftModel>(initial ?? {
    id: aircraftId, modelNumber: '', modelName: '', manufacturer: '', tccaTc: '', faaTc: '', easaTc: '', drawingPrefix: '', active: true,
  })
  // A row always exists so the model's own columns have somewhere to render,
  // even before the first serial number is entered.
  const [serials, setSerials] = useState<AircraftSerial[]>(initialSerials.length ? initialSerials : [blankSerial(aircraftId)])
  const [error, setError] = useState('')

  const setField = <K extends keyof AircraftModel>(key: K, value: AircraftModel[K]) => setM((prev) => ({ ...prev, [key]: value }))
  const setSerial = <K extends keyof AircraftSerial>(id: string, key: K, value: AircraftSerial[K]) =>
    setSerials((prev) => prev.map((x) => (x.id === id ? { ...x, [key]: value } : x)))

  const addSerial = () => setSerials((prev) => [...prev, blankSerial(aircraftId)])
  const removeSerial = (id: string) => setSerials((prev) => (prev.length > 1 ? prev.filter((x) => x.id !== id) : prev))

  const submit = () => {
    if (!m.modelNumber.trim()) { setError('Model number is required.'); return }
    onSave({ ...m, modelNumber: m.modelNumber.trim() }, serials.filter((x) => x.serial.trim()))
    onClose()
  }

  const realSerials = initialSerials

  return (
    <Drawer
      open
      onClose={onClose}
      title={isView ? `Aircraft “${initial!.modelNumber}”` : isEdit ? `Edit Aircraft “${initial!.modelNumber}”` : 'Add Aircraft'}
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
        // Read-only: a single Field grid for the whole record, never a
        // disabled input — disabling dims real values to the same gray as
        // an empty placeholder. Serial No/Reg No aren't a separate section;
        // they're the first two fields, same order as the Aircraft table
        // (Serial No, Reg. No, Model No, Model Name, Manufacturer, ...),
        // repeated per serial with a divider between entries.
        <DetailCard title="Aircraft">
          <div className="grid gap-lg">
            {(realSerials.length ? realSerials : [undefined]).map((sn, i) => (
              <div key={sn?.id ?? 'none'} className={i > 0 ? 'border-t border-border-default pt-lg' : ''}>
                <div className="grid grid-cols-2 gap-lg tablet:grid-cols-4">
                  <DetailField label="Serial No" nowrap>{sn?.serial}</DetailField>
                  <DetailField label="Reg. No" nowrap>{sn?.registration}</DetailField>
                  <DetailField label="Model Number" nowrap>{m.modelNumber}</DetailField>
                  <DetailField label="Model Name">{m.modelName && <Truncate>{m.modelName}</Truncate>}</DetailField>
                  <DetailField label="Manufacture">{m.manufacturer}</DetailField>
                  <DetailField label="TCCA TC">{m.tccaTc}</DetailField>
                  <DetailField label="FAA TC">{m.faaTc}</DetailField>
                  <DetailField label="EASA TC">{m.easaTc}</DetailField>
                  <DetailField label="Drawing Prefix">{m.drawingPrefix}</DetailField>
                  <DetailField label="Comment">{sn?.comment && <Truncate>{sn.comment}</Truncate>}</DetailField>
                  <DetailField label="Active">{m.active ? 'Active' : 'Inactive'}</DetailField>
                </div>
              </div>
            ))}
          </div>
        </DetailCard>
      ) : (
        <FormSection title="Aircraft" subtitle="Same columns, same order as the Aircraft table — one row per serial number.">
          <div className="overflow-x-auto">
            <div className="grid gap-sm" style={{ minWidth: 1100 }}>
              <div className="flex items-center gap-sm">
                {COLUMNS.map((col) => (
                  <span key={col.key} className="text-xs font-semibold text-text-secondary" style={{ width: col.width }}>
                    {col.label}{col.key === 'modelNumber' && <span className="text-danger"> *</span>}
                  </span>
                ))}
                <span className="text-xs font-semibold text-text-secondary" style={{ width: 64 }}>Active</span>
                <span aria-hidden style={{ width: 28 }} />
              </div>

              {/* Model columns are one shared record — every row is a real,
                  always-editable input bound to the same state, so typing in
                  any row updates every row (they're the same field). */}
              {serials.map((sn, i) => (
                <div key={sn.id} className="flex items-center gap-sm border-t border-border-default pt-sm first:border-t-0 first:pt-0">
                  <div style={{ width: COLUMNS[0].width }}>
                    <Input aria-label={`Serial No, row ${i + 1}`} value={sn.serial} placeholder="e.g. 593" onChange={(e) => setSerial(sn.id, 'serial', e.target.value)} />
                  </div>
                  <div style={{ width: COLUMNS[1].width }}>
                    <Input aria-label={`Registration No, row ${i + 1}`} value={sn.registration} placeholder="e.g. C-GTXM" onChange={(e) => setSerial(sn.id, 'registration', e.target.value)} />
                  </div>
                  <div style={{ width: COLUMNS[2].width }}>
                    <Input aria-label="Model Number" value={m.modelNumber} error={!!error} placeholder="e.g. A330" onChange={(e) => { setField('modelNumber', e.target.value); setError('') }} />
                  </div>
                  <div style={{ width: COLUMNS[3].width }}>
                    <Input aria-label="Model Name" value={m.modelName} placeholder="e.g. Airbus A330" onChange={(e) => setField('modelName', e.target.value)} />
                  </div>
                  <div style={{ width: COLUMNS[4].width }}>
                    <Input aria-label="Manufacture" value={m.manufacturer} placeholder="e.g. Airbus" onChange={(e) => setField('manufacturer', e.target.value)} />
                  </div>
                  <div style={{ width: COLUMNS[5].width }}>
                    <Input aria-label="TCCA TC" value={m.tccaTc} onChange={(e) => setField('tccaTc', e.target.value)} />
                  </div>
                  <div style={{ width: COLUMNS[6].width }}>
                    <Input aria-label="FAA TC" value={m.faaTc} onChange={(e) => setField('faaTc', e.target.value)} />
                  </div>
                  <div style={{ width: COLUMNS[7].width }}>
                    <Input aria-label="EASA TC" value={m.easaTc} onChange={(e) => setField('easaTc', e.target.value)} />
                  </div>
                  <div style={{ width: COLUMNS[8].width }}>
                    <Input aria-label="Drawing Prefix" value={m.drawingPrefix} placeholder="e.g. AB" onChange={(e) => setField('drawingPrefix', e.target.value)} />
                  </div>
                  <div style={{ width: COLUMNS[9].width }}>
                    <Input aria-label={`Comment, row ${i + 1}`} value={sn.comment} placeholder="Comment" onChange={(e) => setSerial(sn.id, 'comment', e.target.value)} />
                  </div>
                  <div style={{ width: 64 }}>
                    <Checkbox aria-label="Active — available in pickers across the app" checked={m.active} onChange={() => setField('active', !m.active)} />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSerial(sn.id)}
                    disabled={serials.length === 1}
                    aria-label={`Remove serial ${sn.serial || i + 1}`}
                    className="rounded-sm p-xs text-text-secondary transition-colors duration-fast hover:bg-neutral-100 hover:text-danger disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={addSerial}
            className="flex w-fit items-center gap-xs rounded-sm text-sm font-semibold text-text-primary transition-colors duration-fast hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
          >
            <Plus size={16} aria-hidden /> Add Serial Number
          </button>
        </FormSection>
      )}
    </Drawer>
  )
}
