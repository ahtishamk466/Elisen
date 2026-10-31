import type { CertBasis, PlanEntry } from '@/types/gcp'

export interface RegulationUsage {
  basisCount: number
  planEntryCount: number
  /** Distinct projects represented by the matching plan entries. */
  projectCount: number
  inUse: boolean
}

/** Exact record references count even when a plan is complete or unaffected.
    An amendment with the same section is a different record, not a match. */
export function regulationUsage(
  regulationId: string,
  bases: readonly Pick<CertBasis, 'regulationIds'>[],
  planEntries: readonly Pick<PlanEntry, 'regulationId' | 'projectId'>[],
): RegulationUsage {
  const basisCount = bases.filter((basis) => basis.regulationIds.includes(regulationId)).length
  const entries = planEntries.filter((entry) => entry.regulationId === regulationId)
  return {
    basisCount,
    planEntryCount: entries.length,
    projectCount: new Set(entries.map((entry) => entry.projectId)).size,
    inUse: basisCount > 0 || entries.length > 0,
  }
}

export function regulationUsageSummary(usage: RegulationUsage) {
  const parts: string[] = []
  if (usage.basisCount) parts.push(`${usage.basisCount} certification ${usage.basisCount === 1 ? 'basis' : 'bases'}`)
  if (usage.planEntryCount) {
    parts.push(`${usage.planEntryCount} compliance-plan ${usage.planEntryCount === 1 ? 'entry' : 'entries'} across ${usage.projectCount} ${usage.projectCount === 1 ? 'project' : 'projects'}`)
  }
  return parts.join(' and ') || 'no certification bases or compliance-plan entries'
}
