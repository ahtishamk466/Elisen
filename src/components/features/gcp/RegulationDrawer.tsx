import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { ActiveSelect } from '@/components/patterns/ActiveSelect'
import { UrlField } from '@/components/patterns/UrlField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useGcpStore } from '@/stores/gcpStore'
import type { Regulation } from '@/types/gcp'

export interface RegulationDrawerProps {
  /** `copy` opens as a new record carrying another one's values — the legacy
      list's copy action, which duplicated a rule to a new amendment. */
  mode: 'create' | 'edit' | 'copy'
  initial?: Regulation
  onClose: () => void
  onSubmit: (r: Regulation) => void
}

/** Section root without its amendment, padded the way the stored keys are:
    23.1 → 23.0001, 23.21(a) → 23.0021(a). The legacy sort key is that root
    joined to the amendment, so both are offered rather than typed twice. */
function rootOf(section: string) {
  const m = section.trim().match(/^(\d+)\.(\d+)(.*)$/)
  if (!m) return section.trim()
  return `${m[1]}.${m[2].padStart(4, '0')}${m[3]}`
}

export function RegulationDrawer({ mode, initial, onClose, onSubmit }: RegulationDrawerProps) {
  const isEdit = mode === 'edit'
  const regulations = useGcpStore((s) => s.regulations)
  const subparts = useGcpStore((s) => s.subparts)
  const subsections = useGcpStore((s) => s.subsections)

  const [section, setSection] = useState(initial?.section ?? '')
  const [amdt, setAmdt] = useState(initial?.amdt ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [subpartCode, setSubpartCode] = useState(initial?.subpartCode ?? '')
  const [subsectionCode, setSubsectionCode] = useState(initial?.subsectionCode ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [sort, setSort] = useState(initial?.sort ?? '')
  const [requirementText, setRequirementText] = useState(initial?.requirementText ?? '')
  const [defaultMocText, setDefaultMocText] = useState(initial?.defaultMocText ?? '')
  const [sectionRoot, setSectionRoot] = useState(initial?.sectionRoot ?? '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [errors, setErrors] = useState<{
    section?: string; amdt?: string; title?: string
    subpartCode?: string; subsectionCode?: string; sort?: string
    requirementText?: string; sectionRoot?: string
  }>({})

  const derivedRoot = sectionRoot.trim() || (section.trim() ? rootOf(section) : '')
  const derivedSort = sort.trim() || (derivedRoot && amdt.trim() ? `${derivedRoot}_${amdt.trim()}` : '')

  const submit = () => {
    const e: typeof errors = {}
    if (!section.trim()) e.section = 'Section is required.'
    if (!amdt.trim()) e.amdt = 'Amdt is required. Use IR for the rule as first issued.'
    if (!title.trim()) e.title = 'Title is required.'
    if (!subpartCode) e.subpartCode = 'Subpart Code is required.'
    if (!subsectionCode) e.subsectionCode = 'Subsection Code is required.'
    if (!requirementText.trim()) e.requirementText = 'Requirement Text is required.'
    if (!derivedSort) e.sort = 'Sort is required.'
    if (!derivedRoot) e.sectionRoot = 'Section Root is required.'
    if (!e.section && !e.amdt) {
      const clash = regulations.find((r) => r.id !== (isEdit ? initial?.id : undefined)
        && r.section === section.trim() && r.amdt === amdt.trim())
      if (clash) e.amdt = `${clash.section} at ${clash.amdt} already exists — one record per rule and amendment.`
    }
    setErrors(e)
    if (Object.keys(e).length > 0) return
    onSubmit({
      id: isEdit ? initial!.id : crypto.randomUUID(),
      section: section.trim(),
      amdt: amdt.trim(),
      title: title.trim(),
      subpartCode,
      subsectionCode,
      url: url.trim(),
      sort: derivedSort,
      requirementText: requirementText.trim(),
      defaultMocText: defaultMocText.trim(),
      sectionRoot: derivedRoot,
      active,
    })
    onClose()
  }

  const title_ = isEdit
    ? `Edit Regulation “${initial!.section} · ${initial!.amdt}”`
    : mode === 'copy'
      ? `Copy of “${initial!.section} · ${initial!.amdt}”`
      : 'Add Regulation'

  return (
    <Drawer
      open
      onClose={onClose}
      title={title_}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create'}</Button>
        </>
      }
    >
      <FormSection title="Rule" subtitle="One record per rule at one amendment.">
        <FormField label="Section" htmlFor="reg-section" required error={errors.section}>
          <Input id="reg-section" value={section} error={!!errors.section} placeholder="e.g. 23.21(a)"
            onChange={(e) => { setSection(e.target.value); setErrors((p) => ({ ...p, section: undefined })) }} />
        </FormField>
        <FormField label="Amdt" htmlFor="reg-amdt" required error={errors.amdt} help="IR is the rule as first issued.">
          <Input id="reg-amdt" value={amdt} error={!!errors.amdt} placeholder="e.g. 23-34"
            onChange={(e) => { setAmdt(e.target.value); setErrors((p) => ({ ...p, amdt: undefined })) }} />
        </FormField>
        <FormField label="Title" htmlFor="reg-title" required error={errors.title}>
          <Textarea id="reg-title" value={title} error={!!errors.title} placeholder="e.g. Proof of compliance."
            onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })) }} />
        </FormField>
        <FormField label="Subpart Code" htmlFor="reg-subpart" required error={errors.subpartCode}>
          <SearchableSelect
            id="reg-subpart"
            value={subpartCode}
            error={!!errors.subpartCode}
            placeholder="Select a Subpart Code"
            emptyLabel="No subparts yet."
            options={subparts.map((s) => ({ value: s.code, label: `${s.code} -- ${s.description}` }))}
            onChange={(v) => { setSubpartCode(v); setErrors((p) => ({ ...p, subpartCode: undefined })) }}
          />
        </FormField>
        <FormField label="Subsection Code" htmlFor="reg-subsection" required error={errors.subsectionCode}>
          <SearchableSelect
            id="reg-subsection"
            value={subsectionCode}
            error={!!errors.subsectionCode}
            placeholder="Select a Subsection Code"
            emptyLabel="No subsections yet."
            options={subsections.map((s) => ({ value: s.code, label: `${s.code} -- ${s.title}` }))}
            onChange={(v) => { setSubsectionCode(v); setErrors((p) => ({ ...p, subsectionCode: undefined })) }}
          />
        </FormField>
        <FormField label="Url" htmlFor="reg-url" help="Where this rule's text can be read.">
          <UrlField id="reg-url" value={url} onChange={setUrl} placeholder="Link to the rule text..." />
        </FormField>
        <FormField label="Sort" htmlFor="reg-sort" required error={errors.sort} help="Leave blank to take the suggestion.">
          <Input id="reg-sort" value={sort} error={!!errors.sort} placeholder={derivedSort || 'e.g. 23.0021(a)_IR'}
            onChange={(e) => { setSort(e.target.value); setErrors((p) => ({ ...p, sort: undefined })) }} />
        </FormField>
      </FormSection>

      <FormSection title="Text" subtitle="What prints for this rule, and what a project starts from.">
        <FormField label="Requirement Text" htmlFor="reg-requirement" required error={errors.requirementText} fullWidth>
          <Textarea id="reg-requirement" rows={8} value={requirementText} error={!!errors.requirementText}
            placeholder="The rule's own wording, as it prints in the certification plan..."
            onChange={(e) => { setRequirementText(e.target.value); setErrors((p) => ({ ...p, requirementText: undefined })) }} />
        </FormField>
        <FormField label="Default Moc Text" htmlFor="reg-moc" fullWidth
          help="Offered as the method statement when this rule is planned on a project.">
          <Textarea id="reg-moc" rows={4} value={defaultMocText}
            placeholder="e.g. Design review will demonstrate compliance..."
            onChange={(e) => setDefaultMocText(e.target.value)} />
        </FormField>
      </FormSection>

      <FormSection title="Placement" subtitle="What delegation is granted against, and whether the rule can be picked.">
        <FormField label="Section Root" htmlFor="reg-root" required error={errors.sectionRoot}
          help="Leave blank to take the suggestion.">
          <Input id="reg-root" value={sectionRoot} error={!!errors.sectionRoot} placeholder={derivedRoot || 'e.g. 23.0021'}
            onChange={(e) => { setSectionRoot(e.target.value); setErrors((p) => ({ ...p, sectionRoot: undefined })) }} />
        </FormField>
        <FormField label="Active" htmlFor="reg-active" help="Inactive stays on old plans, out of pickers.">
          <ActiveSelect id="reg-active" value={active} onChange={setActive} />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
