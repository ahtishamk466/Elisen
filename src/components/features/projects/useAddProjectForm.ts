import { useCallback, useMemo, useState } from 'react'
import { TAKEN_NUMBERS } from '@/lib/projectFixtures'
import type { ScopeKey } from '@/types/project'

export interface AddProjectValues {
  // Step 1
  number: string
  subNumber: string
  type: string
  priority: string
  description: string
  company: string
  contact: string
  personResponsible: string
  scope: ScopeKey[]
  contractCurrency: string
  contractValue: string
  tccaRequired: 'yes' | 'no'
  // Step 2
  status: string
  openedDate: string
  dueDate: string
  aircraftInputDate: string
  closedDate: string
  aircraftModelName: string
  aircraftModelNumber: string
  aircraftManufacturer: string
  proposalSubmitted: string
  proposalSubmittedDate: string
  proposalAccepted: string
  proposalAcceptedDate: string
  nextAction: string
  comments: string
  // Step 3
  tccaNumber: string
  tccaDescription: string
  checklist: string[]
}

export type Errors = Partial<Record<keyof AddProjectValues, string>>

const today = () => new Date().toISOString().slice(0, 10)

export const INITIAL: AddProjectValues = {
  number: '', subNumber: '00', type: 'internal', priority: '3-med', description: '',
  company: '', contact: '', personResponsible: '', scope: [],
  contractCurrency: 'USD', contractValue: '', tccaRequired: 'no',
  status: '', openedDate: today(), dueDate: '', aircraftInputDate: '', closedDate: '',
  aircraftModelName: '', aircraftModelNumber: '', aircraftManufacturer: '',
  proposalSubmitted: 'no', proposalSubmittedDate: '', proposalAccepted: 'no', proposalAcceptedDate: '',
  nextAction: '', comments: '',
  tccaNumber: '', tccaDescription: '', checklist: [],
}

/**
 * Required set matches what the client demonstrated live: number, sub number,
 * type, company, person responsible, priority and open date. Contract value
 * and scope are deliberately optional — projects are created at RFQ stage
 * before either is known.
 */
export function validateStep(step: number, v: AddProjectValues): Errors {
  const e: Errors = {}
  if (step === 0) {
    if (!v.number.trim()) e.number = 'Project number is required.'
    else if (!/^\d{4}$/.test(v.number.trim())) e.number = 'Use a 4-digit project number, e.g. 3206.'
    else if (TAKEN_NUMBERS.includes(v.number.trim()) && v.subNumber === '00')
      e.number = `Project ${v.number}-00 already exists. Use a new sub number or a different project number.`
    if (!v.subNumber) e.subNumber = 'Sub number is required.'
    if (!v.type) e.type = 'Type is required.'
    if (!v.priority) e.priority = 'Priority is required.'
    if (!v.company) e.company = 'Company is required.'
    if (!v.personResponsible) e.personResponsible = 'Person responsible is required.'
    if (v.contractValue && Number.isNaN(Number(v.contractValue)))
      e.contractValue = 'Enter a number, without symbols or commas.'
  }
  if (step === 1) {
    if (!v.openedDate) e.openedDate = 'Project opened date is required.'
    if (v.dueDate && v.openedDate && v.dueDate < v.openedDate)
      e.dueDate = 'Due date cannot be before the opened date.'
    if (v.closedDate && v.openedDate && v.closedDate < v.openedDate)
      e.closedDate = 'Closed date cannot be before the opened date.'
  }
  if (step === 2) {
    if (!v.tccaNumber.trim()) e.tccaNumber = 'TCCA project number is required.'
  }
  return e
}

export function useAddProjectForm() {
  const [values, setValues] = useState<AddProjectValues>(INITIAL)
  const [errors, setErrors] = useState<Errors>({})
  const [step, setStep] = useState(0)
  const [dirty, setDirty] = useState(false)

  const steps = useMemo(
    () => (values.tccaRequired === 'yes' ? ['Basic Info', 'Additional Details', 'TCCA Setup'] : ['Basic Info', 'Additional Details']),
    [values.tccaRequired],
  )

  const setField = useCallback(<K extends keyof AddProjectValues>(key: K, value: AddProjectValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
    setDirty(true)
  }, [])

  const next = useCallback(() => {
    const e = validateStep(step, values)
    setErrors(e)
    if (Object.keys(e).length === 0) setStep((s) => Math.min(s + 1, steps.length - 1))
    return Object.keys(e).length === 0
  }, [step, values, steps.length])

  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), [])

  const reset = useCallback(() => {
    setValues(INITIAL)
    setErrors({})
    setStep(0)
    setDirty(false)
  }, [])

  const isLastStep = step === steps.length - 1

  return { values, errors, setErrors, step, steps, isLastStep, dirty, setField, next, back, reset }
}
