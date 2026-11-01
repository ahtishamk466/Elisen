import type { Delegation, Foc } from '@/types/gcp'

/** Legacy picker presentation: rule-specific delegates first, then Default
 * codes. Delegation Active does not filter the OLD TPMS endpoint's choices. */
export function focOptionsForRule(focs: readonly Foc[], delegations: readonly Delegation[], sectionRoot: string | undefined) {
  if (sectionRoot === undefined) return []
  const delegated = new Set(delegations.filter((d) => d.sectionRoot === sectionRoot).map((d) => d.focCode))
  const option = (f: Foc) => ({ value: f.code, label: `${f.code} -- ${f.authoritySpecialist}` })
  return [
    ...focs.filter((f) => delegated.has(f.code)).map((f) => ({ ...option(f), hint: 'Delegated for this rule' })),
    ...focs.filter((f) => f.isDefault && !delegated.has(f.code)).map(option),
  ]
}
