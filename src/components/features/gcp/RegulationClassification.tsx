import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { subsectionsForSubpart } from '@/lib/regulationStructure'
import { useGcpStore } from '@/stores/gcpStore'
import type { RegulationDraft, RegulationDraftErrors, SetRegulationField } from './regulationDraft'

interface Props {
  draft: RegulationDraft
  errors: RegulationDraftErrors
  setField: SetRegulationField
  onAdd: (kind: 'subpart' | 'subsection') => void
}

export function RegulationClassification({ draft, errors, setField, onAdd }: Props) {
  const subparts = useGcpStore((s) => s.subparts)
  const subsections = useGcpStore((s) => s.subsections)
  const regulations = useGcpStore((s) => s.regulations)
  const selectedSubpart = subparts.find((s) => s.code === draft.subpartCode)
  const selectedSubsection = subsections.find((s) => s.code === draft.subsectionCode)
  const suggested = new Set(subsectionsForSubpart(draft.subpartCode, subsections, regulations).map((s) => s.code))
  const subpartOptions = subparts.map((s) => ({ value: s.code, label: `${s.code} — ${s.description}` }))
  const subsectionOptions = [...subsections]
    .sort((a, b) => Number(suggested.has(b.code)) - Number(suggested.has(a.code)) || a.code.localeCompare(b.code, undefined, { numeric: true }))
    .map((s) => ({
      value: s.code,
      label: `${s.code} — ${s.title}`,
      hint: !draft.subpartCode ? undefined : suggested.has(s.code) ? 'Suggested for this subpart' : 'Other existing classification',
    }))

  // Keep a saved value visible even if its lookup entry is absent. Changing
  // parent never clears a subsection or rejects an existing classification.
  if (draft.subpartCode && !subpartOptions.some((s) => s.value === draft.subpartCode)) {
    subpartOptions.push({ value: draft.subpartCode, label: `${draft.subpartCode} — Saved classification` })
  }
  if (draft.subsectionCode && !subsectionOptions.some((s) => s.value === draft.subsectionCode)) {
    subsectionOptions.push({ value: draft.subsectionCode, label: `${draft.subsectionCode} — Saved classification`, hint: 'Not in the current list' })
  }

  return (
    <FormSection title="Classification">
      <FormField label="Subpart" htmlFor="reg-subpart" required error={errors.subpartCode} help={selectedSubpart?.description}>
        <SearchableSelect id="reg-subpart" value={draft.subpartCode} error={!!errors.subpartCode}
          placeholder="Select a subpart" emptyLabel="No subparts yet. Add one below."
          options={subpartOptions} onChange={(value) => setField('subpartCode', value)} />
        <Button id="reg-add-subpart" type="button" variant="tertiary" size="sm" onClick={() => onAdd('subpart')}>Add Subpart</Button>
      </FormField>
      <FormField label="Subsection" htmlFor="reg-subsection" required error={errors.subsectionCode}
        help={selectedSubsection?.title || 'Suggestions appear first; all existing classifications remain available.'}>
        <SearchableSelect id="reg-subsection" value={draft.subsectionCode} error={!!errors.subsectionCode}
          placeholder="Select a subsection" emptyLabel="No subsections yet. Add one below."
          options={subsectionOptions} onChange={(value) => setField('subsectionCode', value)} />
        <Button id="reg-add-subsection" type="button" variant="tertiary" size="sm" disabled={!draft.subpartCode}
          onClick={() => onAdd('subsection')}>Add Subsection</Button>
      </FormField>
    </FormSection>
  )
}
