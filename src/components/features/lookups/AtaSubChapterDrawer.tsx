import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Checkbox } from '@/components/ui/Checkbox'
import type { AtaChapter, AtaSubChapter } from '@/types/lookup'

export interface AtaSubChapterDrawerProps {
  mode: 'create' | 'edit'
  chapter: AtaChapter
  initial?: AtaSubChapter
  onClose: () => void
  onSubmit: (s: AtaSubChapter) => void
}

/** A section always belongs to the chapter whose card opened this drawer —
    the parent is named in the title, never asked for. */
export function AtaSubChapterDrawer({ mode, chapter, initial, onClose, onSubmit }: AtaSubChapterDrawerProps) {
  const isEdit = mode === 'edit'
  const [section, setSection] = useState(initial?.section ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [definition, setDefinition] = useState(initial?.definition ?? '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [errors, setErrors] = useState<{ section?: string; title?: string }>({})

  const submit = () => {
    const e: typeof errors = {}
    if (!/^\d{2}$/.test(section.trim())) e.section = 'Use a two-digit section code, e.g. 10 (00 = General).'
    if (!title.trim()) e.title = 'Title is required.'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      chapterId: chapter.id,
      section: section.trim(),
      title: title.trim(),
      definition: definition.trim(),
      sort: initial?.sort ?? Number(`${chapter.chapter}${section.trim()}`),
      active,
    })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={
        isEdit
          ? `Edit Section “${chapter.chapter}-${initial!.section} ${initial!.title}”`
          : `Add Section to Chapter “${chapter.chapter}: ${chapter.title}”`
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Add Section'}</Button>
        </>
      }
    >
      <FormSection title="Section" subtitle={`Numbered ${chapter.chapter}-XX within this chapter.`}>
        <FormField label="Section" htmlFor="atas-section" required error={errors.section}>
          <Input id="atas-section" value={section} error={!!errors.section} inputMode="numeric" maxLength={2} placeholder="e.g. 10" disabled={isEdit} onChange={(e) => { setSection(e.target.value); setErrors((p) => ({ ...p, section: undefined })) }} />
        </FormField>
        <FormField label="Title" htmlFor="atas-title" required error={errors.title}>
          <Input id="atas-title" value={title} error={!!errors.title} placeholder="e.g. Time Limits" onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })) }} />
        </FormField>
        <FormField label="Definition" htmlFor="atas-def">
          <Textarea id="atas-def" value={definition} placeholder="What this section covers..." onChange={(e) => setDefinition(e.target.value)} />
        </FormField>
        <Checkbox label="Active" checked={active} onChange={() => setActive((v) => !v)} />
      </FormSection>
    </Drawer>
  )
}
