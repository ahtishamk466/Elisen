import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { AccordionSection } from '@/components/patterns/AccordionSection'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Checkbox } from '@/components/ui/Checkbox'
import { Alert } from '@/components/ui/Alert'
import { TCCA_CHECKLIST } from '@/lib/tccaChecklist'
import type { StepProps } from './StepBasicInfo'

const SUGGESTED_TCCA_NUMBER = 'A-26-0198'

/**
 * Applicability only. Completion dates are recorded later, on the project's
 * TCCA → Checklist tab, as each task is actually finished.
 */
export function StepTccaSetup({ values, errors, setField }: StepProps) {
  const toggle = (id: string) =>
    setField('checklist', values.checklist.includes(id) ? values.checklist.filter((c) => c !== id) : [...values.checklist, id])

  return (
    <>
      <FormSection title="TCCA Project" subtitle="Tracks Elisen's interactions with Transport Canada for this project.">
        <FormField
          label="TCCA Project Number" htmlFor="tccaNumber" required error={errors.tccaNumber}
          help={`Suggested: ${SUGGESTED_TCCA_NUMBER}`}
        >
          <Input
            id="tccaNumber" value={values.tccaNumber} error={!!errors.tccaNumber}
            placeholder={SUGGESTED_TCCA_NUMBER} onChange={(e) => setField('tccaNumber', e.target.value)}
          />
        </FormField>
        <FormField label="Description" htmlFor="tccaDescription" help="What Elisen intends to do for Transport Canada on this project.">
          <Textarea id="tccaDescription" value={values.tccaDescription} placeholder="Describe the change and intended approval..." onChange={(e) => setField('tccaDescription', e.target.value)} />
        </FormField>
      </FormSection>

      <Alert tone="info" title="Tick only what applies to this project">
        Completion dates are recorded later, on the project's TCCA tab, as each task is finished.
      </Alert>

      {TCCA_CHECKLIST.map((phase) => {
        const applicable = phase.items.filter((i) => values.checklist.includes(i.id)).length
        return (
          <AccordionSection
            key={phase.id}
            title={phase.title}
            meta={`${applicable} of ${phase.items.length} applicable`}
            defaultOpen={phase.id === 'application'}
          >
            <fieldset>
              <legend className="sr-only">{phase.title}</legend>
              <div className="grid gap-base">
                {phase.items.map((item) => (
                  <Checkbox
                    key={item.id}
                    label={item.label}
                    checked={values.checklist.includes(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                ))}
              </div>
            </fieldset>
          </AccordionSection>
        )
      })}
    </>
  )
}
