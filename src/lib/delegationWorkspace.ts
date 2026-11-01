import type { Delegation, Foc, Regulation } from '@/types/gcp'
import { regulationGroupOptions } from './regulationGroupOptions'

export interface DelegationWorkspaceRule {
  delegation: Delegation
  label: string
  hint: string
  hasRegulation: boolean
  /** Every saved row remains editable, including repeated exact roots. */
  duplicate: boolean
}

export interface DelegationWorkspaceGroup {
  focCode: string
  foc?: Foc
  authoritySpecialist: string
  specialty: string
  rules: DelegationWorkspaceRule[]
  matchingRules: DelegationWorkspaceRule[]
  recordCount: number
  rootCount: number
  matchingRecordCount: number
  matchingRootCount: number
  /** Extra saved rows beyond the unique raw roots, not rows to discard. */
  duplicateRecordCount: number
}

const searchable = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase()

/** Specialist-first presentation of saved delegations, without interpreting
    Active, Limitation or amendment eligibility. Identity stays the exact FOC
    code and Section Root strings, including unknown and placeholder values. */
export function delegationWorkspace(
  delegations: Delegation[], focs: Foc[], regulations: Regulation[], query = '',
): DelegationWorkspaceGroup[] {
  const roots = regulationGroupOptions(regulations, delegations.map((row) => row.sectionRoot))
  const metadata = new Map(roots.map((root) => [root.value, root]))
  // All source titles are searchable. Placeholder roots still display the
  // shared helper's explicit unspecified-root copy, never one arbitrary title.
  const titleSearch = new Map<string, string>()
  for (const regulation of regulations) {
    titleSearch.set(regulation.sectionRoot,
      `${titleSearch.get(regulation.sectionRoot) ?? ''} ${searchable(regulation.title)}`)
  }

  const grouped = new Map<string, { foc?: Foc; rows: Delegation[] }>()
  for (const foc of focs) {
    if (!grouped.has(foc.code)) grouped.set(foc.code, { foc, rows: [] })
  }
  for (const row of delegations) {
    const group = grouped.get(row.focCode) ?? { rows: [] }
    group.rows.push(row)
    grouped.set(row.focCode, group)
  }

  const q = searchable(query)
  const result: DelegationWorkspaceGroup[] = []
  for (const [focCode, { foc, rows }] of grouped) {
    const rootCounts = new Map<string, number>()
    for (const row of rows) rootCounts.set(row.sectionRoot, (rootCounts.get(row.sectionRoot) ?? 0) + 1)
    const rules = rows.map((delegation) => {
      const root = metadata.get(delegation.sectionRoot)!
      return { delegation, label: root.label, hint: root.hint, hasRegulation: titleSearch.has(delegation.sectionRoot), duplicate: rootCounts.get(delegation.sectionRoot)! > 1 }
    })
    const personMatches = searchable(`${focCode} ${foc?.authoritySpecialist ?? ''} ${foc?.specialty ?? ''}`).includes(q)
    const matchingRules = !q || personMatches ? rules : rules.filter((rule) => searchable(
      `${rule.delegation.sectionRoot} ${rule.label} ${rule.hint} ${titleSearch.get(rule.delegation.sectionRoot) ?? ''}`,
    ).includes(q))
    if (q && !personMatches && matchingRules.length === 0) continue

    result.push({
      focCode, foc,
      authoritySpecialist: foc ? foc.authoritySpecialist || 'No specialist name recorded' : 'FOC entry not found',
      specialty: foc?.specialty ?? '',
      rules, matchingRules,
      recordCount: rules.length,
      rootCount: rootCounts.size,
      matchingRecordCount: matchingRules.length,
      matchingRootCount: new Set(matchingRules.map((rule) => rule.delegation.sectionRoot)).size,
      duplicateRecordCount: rules.length - rootCounts.size,
    })
  }
  return result.sort((a, b) => a.focCode.localeCompare(b.focCode, undefined, { numeric: true }))
}
