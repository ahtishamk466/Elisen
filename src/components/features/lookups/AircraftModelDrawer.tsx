import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { DetailCard, DetailField } from '@/components/patterns/DetailView'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { AircraftModel } from '@/types/lookup'

export interface AircraftModelDrawerProps {
  mode: 'create' | 'edit' | 'view'
  initial?: AircraftModel
  onClose: () => void
  onSave: (model: AircraftModel) => void
}

const BLANK: AircraftModel = {
  id: '', modelNumber: '', modelName: '', manufacturer: '',
  tccaTc: '', faaTc: '', easaTc: '', drawingPrefix: '', active: true,
}

/**
 * An aircraft **type**: model number, name, manufacturer, its three type
 * certificates and the drawing prefix.
 *
 * No serial number here, deliberately. A model is not an airframe, and the
 * client was explicit: "Serial Number and Aircraft will be separate", because
 * at the moment a project starts "the person creating the project may not know
 * what the Serial Number is yet". Airframes live on the Serial Numbers tab.
 */
export function AircraftModelDrawer({ mode, initial, onClose, onSave }: AircraftModelDrawerProps) {
  const isView = mode === 'view'
  const [values, setValues] = useState<AircraftModel>(initial ?? BLANK)
  const [errors, setErrors] = useState<{ modelNumber?: string }>({})

  const set = <K extends keyof AircraftModel>(key: K, value: AircraftModel[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    if (key === 'modelNumber') setErrors({})
  }

  const submit = () => {
    if (!values.modelNumber.trim()) {
      setErrors({ modelNumber: 'Model number is required.' })
      return
    }
    onSave({ ...values, id: values.id || crypto.randomUUID(), modelNumber: values.modelNumber.trim() })
    onClose()
  }

  const title = mode === 'create' ? 'Add Aircraft'
    : mode === 'edit' ? `Edit Aircraft ${initial?.modelNumber}`
      : `Aircraft ${initial?.modelNumber}`

  return (
    <Drawer
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <div className="flex gap-sm">
            <Button variant="secondary" onClick={onClose}>{isView ? 'Close' : 'Cancel'}</Button>
            {!isView && <Button onClick={submit}>{mode === 'create' ? 'Create Aircraft' : 'Save Changes'}</Button>}
          </div>
        </>
      }
    >
      {isView ? (
        <DetailCard title="Aircraft">
          <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
            <DetailField label="Model Number" nowrap>{values.modelNumber}</DetailField>
            <DetailField label="Model Name">{values.modelName}</DetailField>
            <DetailField label="Manufacture">{values.manufacturer}</DetailField>
            <DetailField label="TCCA TC" nowrap>{values.tccaTc}</DetailField>
            <DetailField label="FAA TC" nowrap>{values.faaTc}</DetailField>
            <DetailField label="EASA TC" nowrap>{values.easaTc}</DetailField>
            <DetailField label="Drawing Prefix" nowrap>{values.drawingPrefix}</DetailField>
            <DetailField label="Status">{values.active ? 'Active' : 'Inactive'}</DetailField>
          </div>
        </DetailCard>
      ) : (
        <>
          <FormSection title="Aircraft" subtitle="The type, not a specific airframe.">
            <FormField label="Manufacture" htmlFor="am-manufacturer">
              <Input id="am-manufacturer" value={values.manufacturer} placeholder="e.g. Boeing"
                onChange={(e) => set('manufacturer', e.target.value)} />
            </FormField>
            <FormField label="Model Number" htmlFor="am-number" required error={errors.modelNumber}>
              <Input id="am-number" value={values.modelNumber} error={!!errors.modelNumber} placeholder="e.g. 737-8"
                onChange={(e) => set('modelNumber', e.target.value)} />
            </FormField>
            <FormField label="Model Name" htmlFor="am-name">
              <Input id="am-name" value={values.modelName} placeholder="e.g. B737-800"
                onChange={(e) => set('modelName', e.target.value)} />
            </FormField>
          </FormSection>

          <FormSection title="Type Certificates" subtitle="Held against the type by each authority. Leave blank when not applicable.">
            <FormField label="TCCA TC" htmlFor="am-tcca">
              <Input id="am-tcca" value={values.tccaTc} onChange={(e) => set('tccaTc', e.target.value)} />
            </FormField>
            <FormField label="FAA TC" htmlFor="am-faa">
              <Input id="am-faa" value={values.faaTc} onChange={(e) => set('faaTc', e.target.value)} />
            </FormField>
            <FormField label="EASA TC" htmlFor="am-easa">
              <Input id="am-easa" value={values.easaTc} onChange={(e) => set('easaTc', e.target.value)} />
            </FormField>
            <FormField label="Drawing Prefix" htmlFor="am-prefix" help="Two letters. Drives drawing numbering for this type.">
              <Input id="am-prefix" value={values.drawingPrefix} maxLength={2} className="w-24"
                onChange={(e) => set('drawingPrefix', e.target.value.toUpperCase())} />
            </FormField>
            <FormField label="Status" htmlFor="am-status" help="Inactive types stay on the projects that already use them.">
              <Select id="am-status" value={values.active ? 'active' : 'inactive'}
                onChange={(e) => set('active', e.target.value === 'active')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormField>
          </FormSection>
        </>
      )}
    </Drawer>
  )
}
