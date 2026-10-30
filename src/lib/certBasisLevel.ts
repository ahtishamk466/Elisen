import type { CertBasis, Regulation } from '@/types/gcp'

/** Amendment level meaning "the newest version of every rule", for new or
    novel changes that can't use the aircraft's original basis. */
export const LATEST = 'latest'

/** Where an amendment sits in its Part's sequence: `IR` (the rule as first
    issued) is 0, `25-72` is 72. Codes outside that scheme (a date, a single
    letter) have no place in the sequence and return null. */
export function amdtOrder(amdt: string): number | null {
  if (amdt === 'IR') return 0
  const m = /^\d{2}-(\d+)$/.exec(amdt)
  return m ? Number(m[1]) : null
}

/** The Part a rule belongs to (23, 25, 27, 29…), read off its padded section
    root (`25.0001`). */
export function partOf(r: Regulation): string | null {
  return /^(\d{2})\.\d{4}/.exec(r.sectionRoot)?.[1] ?? null
}

const newestFirst = (a: Regulation, b: Regulation) => (amdtOrder(b.amdt) ?? -1) - (amdtOrder(a.amdt) ?? -1)

/** Parts present in the pool, each with how many sections it has. */
export function partsIn(regs: Regulation[]): { part: string; sections: number }[] {
  const sections = new Map<string, Set<string>>()
  regs.forEach((r) => {
    const p = partOf(r)
    if (p) sections.set(p, (sections.get(p) ?? new Set()).add(r.section))
  })
  return [...sections].map(([part, s]) => ({ part, sections: s.size })).sort((a, b) => a.part.localeCompare(b.part))
}

/** The numbered amendments of a Part found in the pool, newest first. */
export function levelsFor(regs: Regulation[], part: string): string[] {
  const amdts = new Set(regs.filter((r) => partOf(r) === part && (amdtOrder(r.amdt) ?? 0) > 0).map((r) => r.amdt))
  return [...amdts].sort((a, b) => (amdtOrder(b) ?? 0) - (amdtOrder(a) ?? 0))
}

export interface LevelPick {
  section: string
  /** Every version of this rule in the pool, newest first. */
  versions: Regulation[]
  /** The version the level applies, or null when none is at or below it. */
  chosen: Regulation | null
}

/**
 * Harris's rule (GCP walkthrough, 2026-09-09): under a type certificate basis
 * of Part P at amendment level L, each rule applies at its latest amendment at
 * or below L — 25.1301 has IR, 25-123 and 25-152, so a 25-98 basis uses IR.
 * `LATEST` takes the newest version of every rule. One pick per section;
 * versions that can't be ordered are listed but never picked automatically.
 */
export function pickForLevel(regs: Regulation[], part: string, level: string): LevelPick[] {
  const max = level === LATEST ? Infinity : amdtOrder(level) ?? -1
  const bySection = new Map<string, Regulation[]>()
  regs.filter((r) => partOf(r) === part).forEach((r) => bySection.set(r.section, [...(bySection.get(r.section) ?? []), r]))
  return [...bySection.values()]
    .map((versions) => {
      const sorted = [...versions].sort(newestFirst)
      const chosen = sorted.find((v) => { const o = amdtOrder(v.amdt); return o !== null && o <= max }) ?? null
      return { section: sorted[0].section, versions: sorted, chosen }
    })
    .sort((a, b) => a.versions[0].sort.localeCompare(b.versions[0].sort))
}

/** Sections a basis carries more than one version of, each with its versions newest first. */
export function duplicateSections(regs: Regulation[]): Regulation[][] {
  const bySection = new Map<string, Regulation[]>()
  regs.forEach((r) => bySection.set(r.section, [...(bySection.get(r.section) ?? []), r]))
  return [...bySection.values()].filter((v) => v.length > 1).map((v) => [...v].sort(newestFirst))
}

/** The basis's regulation ids with every duplicated section cut back to its
    newest version. */
export function keepLatest(basis: CertBasis, regs: Regulation[]): string[] {
  const drop = new Set(duplicateSections(regs).flatMap((versions) => versions.slice(1).map((r) => r.id)))
  return basis.regulationIds.filter((id) => !drop.has(id))
}

export type ChosenBy = 'level' | 'override' | 'hand'

/** How each of a basis's rules got in, by regulation id: picked by its
    amendment level, chosen against that level (an override, e.g. a TCDS
    exception), or picked by hand on a basis that has no level. */
export function chosenByMap(basis: CertBasis, regs: Regulation[], pool: Regulation[]): Map<string, ChosenBy> {
  if (!basis.level) return new Map(regs.map((r) => [r.id, 'hand' as const]))
  const picked = new Set(pickForLevel(pool, basis.level.part, basis.level.amdt).map((p) => p.chosen?.id))
  return new Map(regs.map((r) => [r.id, picked.has(r.id) ? 'level' as const : 'override' as const]))
}

/** "Part 25 · up to 25-98", "Part 23 · latest", or "Picked by hand". */
export function levelLabel(basis: CertBasis): string {
  if (!basis.level) return 'Picked by hand'
  return `Part ${basis.level.part} · ${basis.level.amdt === LATEST ? 'latest' : `up to ${basis.level.amdt}`}`
}
