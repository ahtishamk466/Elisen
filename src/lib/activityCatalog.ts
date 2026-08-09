/**
 * The standard activity list — activities represent which group/discipline
 * performs the work, and stay standardized across projects (unlike work
 * packages, which are free text). Names follow the client's estimate sheet.
 */
export interface CatalogActivity {
  id: string
  name: string
}

export const ACTIVITY_CATALOG: CatalogActivity[] = [
  { id: 'airworthiness', name: 'Airworthiness' },
  { id: 'delegate', name: 'Delegate' },
  { id: 'mech-design', name: 'Mechanical Design' },
  { id: 'elec-design', name: 'Electrical Design' },
  { id: 'struct-validation', name: 'Structural Validation' },
  { id: 'elec-validation', name: 'Electrical Validation' },
  { id: 'project-mgmt', name: 'Project Management' },
  { id: 'manuals', name: 'Manuals & Publications' },
  { id: 'general-cert', name: 'General Certification' },
  { id: 'rfq-response', name: 'RFQ Response' },
  { id: 'customer-support', name: 'Customer Support' },
]

export const activityName = (id: string) => ACTIVITY_CATALOG.find((a) => a.id === id)?.name ?? id

/**
 * Standard activity → task associations. Tasks give extra granularity below
 * an activity and drive the filtered picklist in Time Entry; they're managed
 * centrally (Admin), not per work package.
 */
export const ACTIVITY_TASKS: Record<string, string[]> = {
  airworthiness: ['Compliance plan drafting', 'Continuing airworthiness (ICA)'],
  delegate: ['Document check & sign-off', 'Witness testing'],
  'struct-validation': ['Static strength analysis', 'Stress analysis report'],
  'elec-validation': ['Electrical load analysis', 'Burn test procedure'],
  manuals: ['Flight manual supplement', 'Maintenance manual update'],
  'general-cert': ['Certification plan', 'Design compliance report'],
  'rfq-response': ['Prepare estimate sheet', 'Quote review'],
}
