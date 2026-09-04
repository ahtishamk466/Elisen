/**
 * A person who logs hours. `PEOPLE` in projectFixtures stays the list of names
 * that can be *assigned* to work; this record carries what a summary screen
 * needs to describe them — designation, payroll group, and whether they still
 * work here.
 *
 * Former employees keep their history: hours already logged are payroll record
 * and cannot be dropped from a total just because someone left, so `active`
 * filters the default view rather than deleting anything.
 */
export interface Employee {
  name: string
  /** Job title, shown under the name. */
  designation: string
  /** Payroll group, as in the client's Hours Worked screen. */
  payrollGroup: string
  active: boolean
}
