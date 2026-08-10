import { useCallback, useState } from 'react'

export interface TimesheetEntryValues {
  employeeName: string
  projectId: string
  workPackageId: string
  activityId: string
  task: string
  deliverableRevisionId: string
  workingDate: string
  hoursRegular: string
  hoursOvertime: string
  bankHoursRegular: string
  comment: string
}

export type Errors = Partial<Record<keyof TimesheetEntryValues, string>>

const today = () => new Date().toISOString().slice(0, 10)

export function makeInitial(employeeName: string): TimesheetEntryValues {
  return {
    employeeName, projectId: '', workPackageId: '', activityId: '', task: '',
    deliverableRevisionId: '', workingDate: today(), hoursRegular: '', hoursOvertime: '', bankHoursRegular: '', comment: '',
  }
}

function isValidHours(v: string) {
  return v.trim() !== '' && !Number.isNaN(Number(v)) && Number(v) >= 0
}

export function validate(v: TimesheetEntryValues): Errors {
  const e: Errors = {}
  if (!v.employeeName.trim()) e.employeeName = 'Employee is required.'
  if (!v.projectId) e.projectId = 'Project is required.'
  if (!v.workPackageId) e.workPackageId = 'Work package is required.'
  if (!v.activityId) e.activityId = 'Activity is required.'
  if (!v.workingDate) e.workingDate = 'Working date is required.'
  if (!isValidHours(v.hoursRegular)) e.hoursRegular = 'Enter a valid number of hours.'
  if (v.hoursOvertime && !isValidHours(v.hoursOvertime)) e.hoursOvertime = 'Enter a valid number.'
  if (v.bankHoursRegular && !isValidHours(v.bankHoursRegular)) e.bankHoursRegular = 'Enter a valid number.'
  return e
}

export function useTimesheetEntryForm(employeeName: string, initialValues?: Partial<TimesheetEntryValues>) {
  const [base] = useState<TimesheetEntryValues>(() => ({ ...makeInitial(employeeName), ...initialValues }))
  const [values, setValues] = useState<TimesheetEntryValues>(base)
  const [errors, setErrors] = useState<Errors>({})
  const [dirty, setDirty] = useState(false)

  const setField = useCallback(<K extends keyof TimesheetEntryValues>(key: K, value: TimesheetEntryValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
    setDirty(true)
  }, [])

  const reset = useCallback(() => {
    setValues(base)
    setErrors({})
    setDirty(false)
  }, [base])

  return { values, errors, setErrors, dirty, setField, reset }
}
