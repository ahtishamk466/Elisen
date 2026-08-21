import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useLookupStore } from '@/stores/lookupStore'
import type { AtaChapter } from '@/types/lookup'
import { ActiveSelect } from '@/components/patterns/ActiveSelect'

export interface AtaChapterDrawerProps {
  mode: 'create' | 'edit'
  initial?: AtaChapter
  onClose: () => void
  onSubmit: (c: AtaChapter) => void
}

export function AtaChapterDrawer({ mode, initial, onClose, onSubmit }: AtaChapterDrawerProps) {
  const isEdit = mode === 'edit'
  const chapters = useLookupStore((s) => s.chapters)
  const [chapter, setChapter] = useState(initial?.chapter ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [definition, setDefinition] = useState(initial?.definition ?? '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [errors, setErrors] = useState<{ chapter?: string; title?: string }>({})

  const submit = () => {
    const e: typeof errors = {}
    if (!/^\d{2}$/.test(chapter.trim())) e.chapter = 'Use a two-digit chapter code, e.g. 05.'
    else if (chapters.some((c) => c.id !== initial?.id && c.chapter === chapter.trim())) {
      const taken = chapters.find((c) => c.chapter === chapter.trim())!
      e.chapter = `Chapter ${taken.chapter} already exists: ${taken.title}.`
    }
    if (!title.trim()) e.title = 'Title is required.'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      chapter: chapter.trim(),
      title: title.trim(),
      definition: definition.trim(),
      sort: initial?.sort ?? Number(chapter.trim()),
      active,
    })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit ATA Chapter “${initial!.chapter}: ${initial!.title}”` : 'Add ATA Chapter'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create Chapter'}</Button>
        </>
      }
    >
      <FormSection title="Chapter" subtitle="An ATA specification chapter. Sub chapters are managed on its card.">
        <FormField label="Chapter" htmlFor="ata-chapter" required error={errors.chapter}>
          <Input id="ata-chapter" value={chapter} error={!!errors.chapter} inputMode="numeric" maxLength={2} placeholder="e.g. 05" disabled={isEdit} onChange={(e) => { setChapter(e.target.value); setErrors((p) => ({ ...p, chapter: undefined })) }} />
        </FormField>
        <FormField label="Title" htmlFor="ata-title" required error={errors.title}>
          <Input id="ata-title" value={title} error={!!errors.title} placeholder="e.g. Time limits/maintenance checks" onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })) }} />
        </FormField>
        <FormField label="Definition" htmlFor="ata-def">
          <Textarea id="ata-def" value={definition} placeholder="What this chapter covers..." onChange={(e) => setDefinition(e.target.value)} />
        </FormField>
        <FormField label="Active" htmlFor="ata-active" help="Inactive stays on old drawings, out of pickers.">
          <ActiveSelect id="ata-active" value={active} onChange={setActive} />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
