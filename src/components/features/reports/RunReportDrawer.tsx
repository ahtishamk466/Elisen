import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { PEOPLE } from '@/lib/projectFixtures'
import type { ReportDef } from '@/lib/reportCatalog'

export interface RunReportDrawerProps {
  report: ReportDef
  onClose: () => void
  /** Called with the collected parameter values; the page owns generation. */
  onGenerate: (values: Record<string, string>) => void
}

/** Collects a report's parameters — the old UI's "Parameter 1/2/3" columns,
    turned into a proper form at the moment they're actually needed. */
export function RunReportDrawer({ report, onClose, onGenerate }: RunReportDrawerProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setField = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev))
  }

  const generate = () => {
    const e: Record<string, string> = {}
    for (const p of report.params) {
      if (p.required && !values[p.key]) e[p.key] = `${p.label} is required.`
    }
    const from = values.startDate
    const to = values.endDate
    if (from && to && from > to) e.endDate = 'End date cannot be before the start date.'
    setErrors(e)
    if (Object.values(e).some(Boolean)) return
    onGenerate(values)
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={`Run Report “${report.name}”`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={generate}>Generate Report</Button>
        </>
      }
    >
      <FormSection title="Parameters" subtitle="What this report should cover.">
        {report.params.map((p) => (
          <FormField key={p.key} label={p.label} htmlFor={`param-${p.key}`} required={p.required} error={errors[p.key] || undefined}>
            {p.kind === 'date' ? (
              <Input
                id={`param-${p.key}`} type="date" value={values[p.key] ?? ''} error={!!errors[p.key]}
                onChange={(e) => setField(p.key, e.target.value)}
              />
            ) : (
              <PersonSelect
                id={`param-${p.key}`} value={values[p.key] ?? ''} error={!!errors[p.key]}
                placeholder={`Select ${p.label.toLowerCase()}...`} people={PEOPLE}
                onChange={(v) => setField(p.key, v)}
              />
            )}
          </FormField>
        ))}
      </FormSection>
    </Drawer>
  )
}
