import { PEOPLE } from './projectFixtures'
import type { Employee } from '@/types/employee'

/**
 * Obviously-fake demo staff. The five assignable people are `PEOPLE`; Gordon
 * MacLeod is deliberately **inactive with historical hours only** — he is the
 * case that proves a summary built from assignments alone would lose someone,
 * and that "active employees" has to be a filter rather than a hard-coded
 * WHERE clause.
 */
export const EMPLOYEES: Employee[] = [
  { name: 'Sofia Reyes', designation: 'Mechanical Design Engineer', payrollGroup: '1', active: true },
  { name: 'Lloyd Pedvis', designation: 'Stress Engineer', payrollGroup: '1', active: true },
  { name: 'Remi Rocheleau', designation: 'Electrical Design Engineer', payrollGroup: '2', active: true },
  { name: 'Kelly Osei', designation: 'Certification Engineer', payrollGroup: '2', active: true },
  { name: 'Harris Bell', designation: 'Design Approval Delegate', payrollGroup: '1', active: true },
  { name: 'Gordon MacLeod', designation: 'Senior Designer', payrollGroup: '2', active: false },
]

export const PAYROLL_GROUPS = [...new Set(EMPLOYEES.map((e) => e.payrollGroup))].sort()

const BY_NAME = new Map(EMPLOYEES.map((e) => [e.name, e]))

/** Undefined for a name that has hours but no staff record — a real gap in
    imported data, so callers show the name rather than dropping the row. */
export const employeeByName = (name: string): Employee | undefined => BY_NAME.get(name)

/** Guards the fixtures against drift: everyone assignable must be on staff. */
export const UNKNOWN_ASSIGNEES = PEOPLE.filter((p) => !BY_NAME.has(p))
