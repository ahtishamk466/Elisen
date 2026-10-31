import type { Regulation } from '@/types/gcp'

/** Add only checked, exact library records. Existing IDs and unknown current
 * IDs are preserved; no section/amendment combinations or versions are invented. */
export function appendBasisRules(current: string[], checked: string[], regulations: Regulation[], existing: string[] = []) {
  const libraryIds = new Set(regulations.map((r) => r.id))
  const taken = new Set([...current, ...existing])
  const additions = [...new Set(checked)].filter((id) => libraryIds.has(id) && !taken.has(id))
  return { additions, ids: [...new Set([...current, ...additions])] }
}
