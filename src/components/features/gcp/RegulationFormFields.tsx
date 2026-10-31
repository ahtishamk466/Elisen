import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { ActiveSelect } from '@/components/patterns/ActiveSelect'
import { UrlField } from '@/components/patterns/UrlField'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { regulationDraftKeys, type RegulationDraft, type RegulationDraftErrors, type SetRegulationField } from './regulationDraft'

interface Props {
  draft: RegulationDraft
  errors: RegulationDraftErrors
  setField: SetRegulationField
  legacyBlankAmendment: boolean
}

/** Stored text stays unchanged; this trial changes authoring context only. */
export function RegulationFormFields({ draft: d, errors: e, setField, legacyBlankAmendment }: Props) {
  const keys = regulationDraftKeys(d)
  return (
    <>
      <FormSection title="Rule">
        <FormField label="Section" htmlFor="reg-section" required error={e.section}>
          <Input id="reg-section" value={d.section} error={!!e.section} placeholder="e.g. 23.21(a)"
            aria-describedby={e.section ? 'reg-section-message' : undefined}
            onChange={(event) => setField('section', event.target.value)} />
        </FormField>
        <FormField label="Amendment" htmlFor="reg-amdt" required error={e.amdt}
          help={legacyBlankAmendment ? 'This record has no amendment recorded. You can link it to a basis without editing it.' : 'Use IR only for an explicitly recorded initial revision.'}>
          <Input id="reg-amdt" value={d.amdt} error={!!e.amdt} placeholder="e.g. 23-34"
            aria-describedby="reg-amdt-message" onChange={(event) => setField('amdt', event.target.value)} />
        </FormField>
        <FormField label="Title" htmlFor="reg-title" required error={e.title}>
          <Textarea id="reg-title" value={d.title} error={!!e.title} placeholder="e.g. Proof of compliance."
            aria-describedby={e.title ? 'reg-title-message' : undefined}
            onChange={(event) => setField('title', event.target.value)} />
        </FormField>
        <FormField label="Source link" htmlFor="reg-url" help="Where this rule's text can be read.">
          <UrlField id="reg-url" value={d.url} onChange={(value) => setField('url', value)} placeholder="Link to the rule text..." />
        </FormField>
      </FormSection>
      <FormSection title="Text">
        <FormField label="Requirement Text" htmlFor="reg-requirement" required error={e.requirementText} fullWidth>
          <Textarea id="reg-requirement" rows={8} value={d.requirementText} error={!!e.requirementText}
            aria-describedby={e.requirementText ? 'reg-requirement-message' : undefined}
            placeholder="The rule's own wording, as it prints in the certification plan..."
            onChange={(event) => setField('requirementText', event.target.value)} />
        </FormField>
        <FormField label="Default Means of Compliance (MOC) Text" htmlFor="reg-moc" fullWidth
          help="Offered as the method statement when this rule is planned on a project.">
          <Textarea id="reg-moc" rows={4} value={d.defaultMocText} aria-describedby="reg-moc-message"
            placeholder="e.g. Design review will demonstrate compliance..."
            onChange={(event) => setField('defaultMocText', event.target.value)} />
        </FormField>
      </FormSection>
      <FormSection title="Placement">
        <FormField label="Sort" htmlFor="reg-sort" required error={e.sort} help="Leave blank to take the suggestion.">
          <Input id="reg-sort" value={d.sort} error={!!e.sort} placeholder={keys.sort || 'e.g. 23.0021(a)_IR'}
            aria-describedby="reg-sort-message" onChange={(event) => setField('sort', event.target.value)} />
        </FormField>
        <FormField label="Section Root" htmlFor="reg-root" required error={e.sectionRoot}
          help="The rule number delegation is granted against. Blank takes the suggestion.">
          <Input id="reg-root" value={d.sectionRoot} error={!!e.sectionRoot} placeholder={keys.root || 'e.g. 23.0021'}
            aria-describedby="reg-root-message" onChange={(event) => setField('sectionRoot', event.target.value)} />
        </FormField>
        <FormField label="Active" htmlFor="reg-active" help="Inactive stays on old plans, out of pickers.">
          <ActiveSelect id="reg-active" value={d.active} onChange={(value) => setField('active', value)} />
        </FormField>
      </FormSection>
    </>
  )
}
