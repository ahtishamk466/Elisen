import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { Textarea } from '@/components/ui/Textarea'
import { Checkbox } from '@/components/ui/Checkbox'
import { PEOPLE, NEXT_AVAILABLE_NUMBER } from '@/lib/projectFixtures'
import { useLookupStore } from '@/stores/lookupStore'
import type { ScopeKey } from '@/types/project'
import type { AddProjectValues, Errors } from './useAddProjectForm'

const SCOPES: { key: ScopeKey; label: string }[] = [
  { key: 'design', label: 'Design' },
  { key: 'validation', label: 'Validation' },
  { key: 'certification', label: 'Certification' },
  { key: 'parts-kit', label: 'Parts kit' },
  { key: 'aircraft-mod', label: 'Aircraft mod' },
]

export interface StepProps {
  values: AddProjectValues
  errors: Errors
  setField: <K extends keyof AddProjectValues>(key: K, value: AddProjectValues[K]) => void
  /** Financial fields are manager-and-above only (see docs/SECURITY.md rule 8). */
  canSeeFinancials?: boolean
}

export function StepBasicInfo({ values, errors, setField, canSeeFinancials = true }: StepProps) {
  // Company/Contact options come from the Lookup Tables (Admin), not
  // hardcoded lists — inactive records are hidden, contacts follow the
  // chosen company.
  const companies = useLookupStore((s) => s.companies)
  const lookupContacts = useLookupStore((s) => s.contacts)
  const activeCompanies = [...companies.filter((c) => c.active)].sort((a, b) => a.name.localeCompare(b.name))
  const selectedCompany = companies.find((c) => c.name === values.company)
  const companyContacts = selectedCompany
    ? lookupContacts.filter((ct) => ct.companyId === selectedCompany.id && ct.active)
    : []

  const toggleScope = (key: ScopeKey) =>
    setField('scope', values.scope.includes(key) ? values.scope.filter((s) => s !== key) : [...values.scope, key])

  return (
    <>
      <FormSection title="Identification" subtitle="Basic details that identify this project.">
        <FormField
          label="Project Number" htmlFor="number" required error={errors.number}
          help={`Next available is ${NEXT_AVAILABLE_NUMBER}.`}
        >
          <Input
            id="number" value={values.number} error={!!errors.number} inputMode="numeric" maxLength={4}
            placeholder={`e.g. ${NEXT_AVAILABLE_NUMBER}`} onChange={(e) => setField('number', e.target.value)}
          />
        </FormField>
        <FormField
          label="Sub Number" htmlFor="subNumber" required error={errors.subNumber}
          help="Use a new sub number for a change request against an existing project."
        >
          <Select id="subNumber" value={values.subNumber} error={!!errors.subNumber} onChange={(e) => setField('subNumber', e.target.value)}>
            <option value="00">00 (next available)</option>
            <option value="01">01</option>
            <option value="02">02</option>
          </Select>
        </FormField>
        <FormField label="Type" htmlFor="type" required error={errors.type}>
          <Select id="type" value={values.type} error={!!errors.type} onChange={(e) => setField('type', e.target.value)}>
            <option value="internal">Internal</option>
            <option value="preferred">Preferred</option>
            <option value="preferred-duncan">Preferred: Duncan Aviation</option>
            <option value="preferred-topaces">Preferred: Top Aces</option>
            <option value="external">External</option>
            <option value="other">Other</option>
          </Select>
        </FormField>
        <FormField label="Priority" htmlFor="priority" required error={errors.priority}>
          <Select id="priority" value={values.priority} error={!!errors.priority} onChange={(e) => setField('priority', e.target.value)}>
            <option value="1-fire">1: Fire</option>
            <option value="2-high">2: High</option>
            <option value="3-med">3: Med</option>
            <option value="4-low">4: Low</option>
          </Select>
        </FormField>
        <FormField label="Description" htmlFor="description">
          <Textarea id="description" value={values.description} placeholder="Enter description..." onChange={(e) => setField('description', e.target.value)} />
        </FormField>
      </FormSection>

      <FormSection title="Company & Profile" subtitle="Who this project is for, and who owns it internally.">
        <FormField label="Company" htmlFor="company" required error={errors.company} help="Managed under Admin → Companies.">
          <Select
            id="company" value={values.company} error={!!errors.company} placeholder="Select a company..."
            onChange={(e) => { setField('company', e.target.value); setField('contact', '') }}
          >
            {activeCompanies.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </Select>
        </FormField>
        <FormField
          label="Contact" htmlFor="contact"
          help={!values.company ? 'Select a company first.' : companyContacts.length === 0 ? 'This company has no active contacts yet.' : undefined}
        >
          <PersonSelect
            id="contact" value={values.contact} disabled={!values.company || companyContacts.length === 0}
            placeholder="Select a contact..." emptyLabel="This company has no active contacts yet."
            people={companyContacts.map((ct) => ct.fullName)}
            onChange={(v) => setField('contact', v)}
          />
        </FormField>
        <FormField label="Person Responsible" htmlFor="personResponsible" required error={errors.personResponsible}>
          <PersonSelect id="personResponsible" value={values.personResponsible} error={!!errors.personResponsible}
            people={PEOPLE} onChange={(v) => setField('personResponsible', v)} />
        </FormField>
      </FormSection>

      <FormSection title="Scope" subtitle="What kind of work this project covers. Can be set later.">
        <fieldset>
          <legend className="mb-sm text-sm font-semibold text-text-primary">Scope of work</legend>
          <div className="flex flex-wrap gap-x-2xl gap-y-sm">
            {SCOPES.map((s) => (
              <Checkbox key={s.key} label={s.label} checked={values.scope.includes(s.key)} onChange={() => toggleScope(s.key)} />
            ))}
          </div>
        </fieldset>
      </FormSection>

      {canSeeFinancials && (
        <FormSection title="Financial" subtitle="Optional at quote stage, fill in once the contract value is known.">
          <FormField label="Contract Value" htmlFor="contractValue" error={errors.contractValue}>
            <div className="flex gap-sm">
              <Select aria-label="Currency" value={values.contractCurrency} className="w-24 shrink-0" onChange={(e) => setField('contractCurrency', e.target.value)}>
                <option value="USD">USD</option>
                <option value="CAD">CAD</option>
                <option value="EUR">EUR</option>
              </Select>
              <Input id="contractValue" value={values.contractValue} error={!!errors.contractValue} inputMode="decimal" placeholder="0" onChange={(e) => setField('contractValue', e.target.value)} />
            </div>
          </FormField>
        </FormSection>
      )}

    </>
  )
}
