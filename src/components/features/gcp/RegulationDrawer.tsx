import { useEffect, useRef, useState } from 'react'
import { amendmentLabel } from '@/lib/gcpDisplay'
import { Drawer } from '@/components/patterns/Drawer'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { useGcpStore } from '@/stores/gcpStore'
import type { Regulation } from '@/types/gcp'
import { RegulationClassification } from './RegulationClassification'
import { RegulationFormFields } from './RegulationFormFields'
import { SubpartDrawer } from './SubpartDrawer'
import { SubsectionDrawer } from './SubsectionDrawer'
import { buildRegulation, createRegulationDraft, validateRegulationDraft, type RegulationContext, type RegulationDraftErrors, type SetRegulationField } from './regulationDraft'

export interface RegulationDrawerProps {
  mode: 'create' | 'edit' | 'copy'
  initial?: Regulation
  /** Preselects a new rule's classification; edit/copy values take precedence. */
  context?: RegulationContext
  onClose: () => void
  onSubmit: (r: Regulation) => void
}

export function RegulationDrawer({ mode, initial, context, onClose, onSubmit }: RegulationDrawerProps) {
  const isEdit = mode === 'edit'
  const regulations = useGcpStore((s) => s.regulations)
  const addSubpart = useGcpStore((s) => s.addSubpart)
  const addSubsection = useGcpStore((s) => s.addSubsection)
  const [draft, setDraft] = useState(() => createRegulationDraft(initial, context))
  const original = useRef(draft)
  const [errors, setErrors] = useState<RegulationDraftErrors>({})
  const [child, setChild] = useState<'subpart' | 'subsection' | null>(null)
  const [discard, setDiscard] = useState(false)
  const returnFocus = useRef<string | null>(null)
  const dirty = JSON.stringify(draft) !== JSON.stringify(original.current)

  const setField: SetRegulationField = (key, value) => {
    setDraft((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => ({ ...previous, [key]: undefined }))
  }
  const close = () => {
    if (!dirty) { onClose(); return }
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement.id || 'reg-section' : 'reg-section'
    setDiscard(true)
  }
  const openChild = (kind: 'subpart' | 'subsection') => {
    returnFocus.current = `reg-add-${kind}`
    setChild(kind)
  }

  // Only one dialog is mounted at a time. The parent component and its draft
  // stay mounted while a lookup is created, then focus returns to its trigger.
  useEffect(() => {
    if (child || discard || !returnFocus.current) return
    const id = returnFocus.current
    returnFocus.current = null
    const frame = requestAnimationFrame(() => document.getElementById(id)?.focus())
    return () => cancelAnimationFrame(frame)
  }, [child, discard])

  useEffect(() => {
    if (!discard) return
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="alertdialog"] button:not([disabled])'))
      const next = event.shiftKey ? buttons[buttons.length - 1] : buttons[0]
      const edge = event.shiftKey ? buttons[0] : buttons[buttons.length - 1]
      if (!buttons.includes(document.activeElement as HTMLButtonElement) || document.activeElement === edge) {
        event.preventDefault()
        next?.focus()
      }
    }
    document.addEventListener('keydown', trap, true)
    return () => document.removeEventListener('keydown', trap, true)
  }, [discard])

  const submit = () => {
    const nextErrors = validateRegulationDraft(draft, regulations, isEdit ? initial?.id : undefined)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onSubmit(buildRegulation(draft, isEdit ? initial!.id : crypto.randomUUID()))
    onClose()
  }
  const title = isEdit ? `Edit Regulation “${initial!.section} · ${amendmentLabel(initial!.amdt)}”`
    : mode === 'copy' ? `Copy of “${initial!.section} · ${amendmentLabel(initial!.amdt)}”` : 'Add Regulation'

  return (
    <>
      <Drawer open={!child && !discard} onClose={close} title={title}
        footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create'}</Button></>}>
        <div className="space-y-lg" onKeyDown={(event) => {
          // Portalled picker events still bubble through React. Let the
          // picker close itself, then keep that Escape from closing the form.
          if (event.key === 'Escape' && event.target instanceof Element && event.target.closest('[data-dropdown-panel]')) {
            event.stopPropagation()
          }
        }}>
          <RegulationClassification draft={draft} errors={errors} setField={setField} onAdd={openChild} />
          <RegulationFormFields draft={draft} errors={errors} setField={setField} legacyBlankAmendment={isEdit && initial?.amdt === ''} />
        </div>
      </Drawer>
      {child === 'subpart' && <SubpartDrawer mode="create" onClose={() => setChild(null)} onSubmit={(value) => {
        addSubpart(value)
        setField('subpartCode', value.code)
      }} />}
      {child === 'subsection' && <SubsectionDrawer mode="create" codePrefix={draft.subpartCode}
        onClose={() => setChild(null)} onSubmit={(value) => {
          addSubsection(value)
          setField('subsectionCode', value.code)
        }} />}
      <ConfirmDialog open={discard} title="Discard regulation changes?"
        description="Your unsaved regulation changes will be lost. Any subpart or subsection already created stays in the library."
        confirmLabel="Discard changes" cancelLabel="Keep editing" tone="danger"
        onConfirm={onClose} onCancel={() => setDiscard(false)} />
    </>
  )
}
