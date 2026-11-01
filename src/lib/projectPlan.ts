import type { CertBasis, PlanEntry } from '@/types/gcp'

/**
 * A project's plan: its entries for the rules in its current basis.
 *
 * An entry whose rule has left the basis (the basis was rebuilt in step 2, or
 * the rule was removed on the basis page) keeps its MOC text, DDS, comments
 * and GCP data, but stays out of the plan and its counts until the rule is
 * back in the basis. Nothing deletes plan work but the project's own edits.
 */
export function projectPlan<T extends Pick<PlanEntry, 'projectId' | 'regulationId'>>(
  entries: readonly T[], projectId: string, basis: Pick<CertBasis, 'regulationIds'> | undefined,
): T[] {
  const inBasis = new Set(basis?.regulationIds)
  return entries.filter((e) => e.projectId === projectId && inBasis.has(e.regulationId))
}
