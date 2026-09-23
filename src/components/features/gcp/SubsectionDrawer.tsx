import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { ActiveSelect } from '@/components/patterns/ActiveSelect'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGcpStore } from '@/stores/gcpStore'
import type { Subsection } from '@/types/gcp'

export interface SubsectionDrawerProps {
  mode: 'create' | 'edit'
  initial?: Subsection
  /** Create mode only: the parent subpart's code, offered as the start of a
      new subsection code (e.g. "C" before "C15") rather than typed from
      scratch. */
  codePrefix?: string
  onClose: () => void
  onSubmit: (s: Subsection) => void
}

export function SubsectionDrawer({ mode, initial, codePrefix, onClose, onSubmit }: SubsectionDrawerProps) {
  const isEdit = mode === 'edit'
  const subsections = useGcpStore((s) => s.subsections)
  const [code, setCode] = useState(initial?.code ?? codePrefix ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [part23, setPart23] = useState(initial?.part23 ?? '')
  const [part25, setPart25] = useState(initial?.part25 ?? '')
  const [part27, setPart27] = useState(initial?.part27 ?? '')
  const [part29, setPart29] = useState(initial?.part29 ?? '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [errors, setErrors] = useState<{ code?: string; title?: string }>({})

  const submit = () => {
    const e: typeof errors = {}
    if (!code.trim()) e.code = 'Code is required.'
    else if (subsections.some((s) => s.id !== initial?.id && s.code.toLowerCase() === code.trim().toLowerCase())) {
      e.code = `Subsection ${code.trim()} already exists.`
    }
    if (!title.trim()) e.title = 'Title is required.'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      code: code.trim(),
      title: title.trim(),
      part23: part23.trim(),
      part25: part25.trim(),
      part27: part27.trim(),
      part29: part29.trim(),
      active,
    })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit Subsection “${initial!.code}”` : 'Add Subsection'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create'}</Button>
        </>
      }
    >
      <FormSection title="Subsection" subtitle="A group of rules inside one subpart.">
        <FormField label="Code" htmlFor="ss-code" required error={errors.code}>
          <Input id="ss-code" value={code} error={!!errors.code} placeholder="e.g. C05"
            onChange={(e) => { setCode(e.target.value); setErrors((p) => ({ ...p, code: undefined })) }} />
        </FormField>
        <FormField label="Title" htmlFor="ss-title" required error={errors.title}>
          <Input id="ss-title" value={title} error={!!errors.title} placeholder="e.g. Control Surface and System Loads"
            onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })) }} />
        </FormField>
      </FormSection>

      <FormSection title="Rule ranges" subtitle="What this subsection covers in each Part. X where that Part has no equivalent.">
        <FormField label="Part 23" htmlFor="ss-p23">
          <Input id="ss-p23" value={part23} placeholder="e.g. 23.391-23.415" onChange={(e) => setPart23(e.target.value)} />
        </FormField>
        <FormField label="Part 25" htmlFor="ss-p25">
          <Input id="ss-p25" value={part25} placeholder="e.g. 25.391-25.459" onChange={(e) => setPart25(e.target.value)} />
        </FormField>
        <FormField label="Part 27" htmlFor="ss-p27">
          <Input id="ss-p27" value={part27} placeholder="e.g. 27.391-27.427" onChange={(e) => setPart27(e.target.value)} />
        </FormField>
        <FormField label="Part 29" htmlFor="ss-p29">
          <Input id="ss-p29" value={part29} placeholder="e.g. X" onChange={(e) => setPart29(e.target.value)} />
        </FormField>
        <FormField label="Active" htmlFor="ss-active" help="Inactive stays on old records, out of pickers.">
          <ActiveSelect id="ss-active" value={active} onChange={setActive} />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
