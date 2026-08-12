import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { SETTING_TYPE_LABEL } from '@/lib/settingFixtures'
import type { SettingType, SoftwareSetting } from '@/types/setting'

export interface SettingDrawerProps {
  mode: 'create' | 'edit'
  initial?: SoftwareSetting
  /** Existing sections, offered as suggestions on the free-text field. */
  sections: string[]
  onClose: () => void
  onSave: (setting: SoftwareSetting) => void
}

const TYPES = Object.keys(SETTING_TYPE_LABEL) as SettingType[]

export function SettingDrawer({ mode, initial, sections, onClose, onSave }: SettingDrawerProps) {
  const isEdit = mode === 'edit'
  const [s, setS] = useState<SoftwareSetting>(initial ?? {
    id: crypto.randomUUID(), type: 'string', section: '', key: '', value: '', description: '', active: true,
  })
  const [errors, setErrors] = useState<{ section?: string; key?: string; value?: string }>({})

  const setField = <K extends keyof SoftwareSetting>(key: K, value: SoftwareSetting[K]) =>
    setS((prev) => ({ ...prev, [key]: value }))

  const submit = () => {
    const next: typeof errors = {}
    if (!s.section.trim()) next.section = 'Section is required.'
    if (!s.key.trim()) next.key = 'Key is required.'
    // A null setting has no value by definition; everything else needs one.
    if (s.type !== 'null' && !s.value.trim()) next.value = 'Value is required.'
    if (s.type === 'integer' && s.value.trim() && !/^-?\d+$/.test(s.value.trim())) next.value = 'Enter a whole number.'
    if (s.type === 'float' && s.value.trim() && !/^-?\d*\.?\d+$/.test(s.value.trim())) next.value = 'Enter a number.'
    if (Object.keys(next).length) { setErrors(next); return }
    onSave({ ...s, section: s.section.trim(), key: s.key.trim(), value: s.type === 'null' ? '' : s.value.trim() })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit Setting "${initial!.key}"` : 'Create Setting'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create Setting'}</Button>
        </>
      }
    >
      <FormSection title="Setting" subtitle="A configuration value, identified by its section and key.">
        <FormField label="Type" htmlFor="st-type" required help="How the value is read by the app.">
          <Select
            id="st-type"
            value={s.type}
            onChange={(e) => { setField('type', e.target.value as SettingType); setErrors((x) => ({ ...x, value: undefined })) }}
          >
            {TYPES.map((t) => <option key={t} value={t}>{SETTING_TYPE_LABEL[t]}</option>)}
          </Select>
        </FormField>
        <FormField label="Section" htmlFor="st-section" required error={errors.section} help="Groups related keys, e.g. visibility.">
          <Input
            id="st-section" list="st-sections" value={s.section} error={!!errors.section} placeholder="e.g. visibility"
            onChange={(e) => { setField('section', e.target.value); setErrors((x) => ({ ...x, section: undefined })) }}
          />
          <datalist id="st-sections">
            {sections.map((sec) => <option key={sec} value={sec} />)}
          </datalist>
        </FormField>
        <FormField label="Key" htmlFor="st-key" required error={errors.key}>
          <Input
            id="st-key" value={s.key} error={!!errors.key} placeholder="e.g. active-field"
            onChange={(e) => { setField('key', e.target.value); setErrors((x) => ({ ...x, key: undefined })) }}
          />
        </FormField>

        {/* The Value control follows Type — a boolean setting shouldn't be a
            free-text box where "ture" is accepted. */}
        <FormField
          label="Value"
          htmlFor="st-value"
          required={s.type !== 'null'}
          error={errors.value}
          help={s.type === 'null' ? 'A null setting has no value.' : undefined}
        >
          {s.type === 'boolean' ? (
            <Select id="st-value" value={s.value || 'true'} onChange={(e) => { setField('value', e.target.value); setErrors((x) => ({ ...x, value: undefined })) }}>
              <option value="true">true</option>
              <option value="false">false</option>
            </Select>
          ) : s.type === 'null' ? (
            <Input id="st-value" value="" placeholder="—" readOnly />
          ) : (
            <Input
              id="st-value"
              value={s.value}
              error={!!errors.value}
              inputMode={s.type === 'integer' || s.type === 'float' ? 'decimal' : undefined}
              placeholder={s.type === 'integer' ? 'e.g. 4610' : s.type === 'float' ? 'e.g. 1.5' : 'e.g. enabled'}
              onChange={(e) => { setField('value', e.target.value); setErrors((x) => ({ ...x, value: undefined })) }}
            />
          )}
        </FormField>

        <FormField label="Description" htmlFor="st-description">
          <Textarea id="st-description" rows={3} value={s.description} placeholder="What this setting controls" onChange={(e) => setField('description', e.target.value)} />
        </FormField>
        <FormField label="Status" htmlFor="st-status" help="Inactive settings are ignored by the app.">
          <Select id="st-status" value={s.active ? 'active' : 'inactive'} onChange={(e) => setField('active', e.target.value === 'active')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FormField>
      </FormSection>
    </Drawer>
  )
}
