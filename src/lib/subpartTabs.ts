import type { Regulation, Subpart } from '@/types/gcp'
import { titleCaseName } from './gcpDisplay'

export interface SubpartTab {
  key: string
  label: string
  count: number
}

/**
 * Subpart tabs for a list of rules, so a list of hundreds reads as "find the
 * right category, then work down its list". All first, then every active
 * subpart the list actually uses (never the full, mostly-inactive catalog), in
 * catalog order with its rule count. A rule whose subpart is the "-" / TBD
 * placeholder, inactive or unrecognized has nowhere named to go, so it collects
 * in one shared "Other" tab rather than vanishing or getting a tab of its own.
 * `known` is the set of subpart codes that got a tab of their own.
 */
export function subpartTabs(rules: Regulation[], subparts: Subpart[]): { tabs: SubpartTab[]; known: Set<string> } {
  const counts = new Map<string, number>()
  rules.forEach((r) => counts.set(r.subpartCode, (counts.get(r.subpartCode) ?? 0) + 1))
  const named = subparts
    .filter((sp) => sp.active && sp.code !== '-' && counts.get(sp.code))
    .sort((a, b) => a.sort.localeCompare(b.sort))
    .map((sp) => ({ key: sp.code, label: `${sp.code} — ${titleCaseName(sp.description)}`, count: counts.get(sp.code)! }))
  const known = new Set(named.map((t) => t.key))
  const other = rules.filter((r) => !known.has(r.subpartCode)).length
  return {
    tabs: [
      { key: 'all', label: 'All', count: rules.length },
      ...named,
      ...(other > 0 ? [{ key: 'other', label: 'Other', count: other }] : []),
    ],
    known,
  }
}

/** The rules a subpart tab from `subpartTabs` shows. */
export function rulesInSubpartTab(rules: Regulation[], key: string, known: Set<string>): Regulation[] {
  if (key === 'all') return rules
  if (key === 'other') return rules.filter((r) => !known.has(r.subpartCode))
  return rules.filter((r) => r.subpartCode === key)
}
