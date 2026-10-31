import type { Regulation } from '@/types/gcp'

/** Resolve an exact existing record, never synthesize an amendment or choose
 * arbitrarily between versions. A unique section record needs no extra pick. */
export function resolveBasisRule(regulations: Regulation[], section: string, selectedId: string): Regulation | null {
  if (!section) return null
  const versions = regulations.filter((r) => r.section === section)
  if (selectedId) return versions.find((r) => r.id === selectedId) ?? null
  return versions.length === 1 ? versions[0] : null
}
