import type { CertBasis, Regulation, Subpart, Subsection } from '@/types/gcp'
import type { XlsxSheet } from './xlsx'

/** The legacy Cert Basis Import's sheet layout, columns A–H; row 1 is headings. */
export const IMPORT_COLUMNS = ['Section', 'Amendment', 'Title', 'Subpart', 'Subsection', 'URL', 'Sort', 'Section Root'] as const

const MAX_ROWS = 10_000
const MAX_TEXT = 255 // the legacy `regulation` columns are varchar(255)
const MAX_URL = 2048

export interface ImportPlan {
  /** Rows read across every sheet. */
  rows: number
  /** Regulations the library doesn't have yet, matched on Section + Amendment. */
  newRegulations: Regulation[]
  /** Rules to add to the basis, in sheet order. */
  addIds: string[]
  /** Rows whose rule the basis already has, or that repeat an earlier row. */
  skipped: number
  /** Anything here blocks the whole import: all or nothing, like the legacy
      transaction. */
  errors: string[]
}

/**
 * The legacy `CertBasisController::actionImport`, step for step: every sheet,
 * from row 2 to the first empty row; a regulation is found by Section +
 * Amendment or created (active); a rule the basis already has is skipped.
 * Two things are stricter than the legacy code, which saved whatever it read:
 * Section is required; a blank Amendment must match an existing blank-version
 * record (never defaulted to IR). New records require Amendment. Subpart / Subsection must be a
 * known id (what the legacy sheet holds) or code.
 */
export function planImport(
  sheets: XlsxSheet[], basis: CertBasis, regulations: Regulation[], subparts: Subpart[], subsections: Subsection[],
): ImportPlan {
  const plan: ImportPlan = { rows: 0, newRegulations: [], addIds: [], skipped: 0, errors: [] }
  const byKey = new Map<string, string>()
  for (const r of [...regulations].reverse()) byKey.set(`${r.section}\u0000${r.amdt}`, r.id) // first match wins
  const inBasis = new Set(basis.regulationIds)
  const codeOf = (value: string, list: { id: string; code: string }[]) =>
    value === '' ? '-' : list.find((x) => x.id === value)?.code ?? list.find((x) => x.code === value)?.code

  for (const sheet of sheets) {
    const byRow = new Map(sheet.rows.map((r) => [r.n, r.cells]))
    for (let n = 2; ; n++) {
      const cells = byRow.get(n)
      if (!cells || cells.every((c) => c === '')) break
      if (++plan.rows > MAX_ROWS) {
        plan.errors.push(`More than ${MAX_ROWS.toLocaleString()} rows; split the file.`)
        return plan
      }
      const [section, amdt, title, subpart, subsection, url, sort, sectionRoot] = cells
      const at = `${sheet.name} row ${n}`
      const problems = [
        !section && 'Section is required',
        (!amdt && !byKey.has(`${section}\u0000${amdt}`)) && 'Amendment is required for a new regulation; no existing record matches this section with no amendment recorded',
        cells.some((c, i) => i !== 5 && c.length > MAX_TEXT) && `a value is over ${MAX_TEXT} characters`,
        url && (url.length > MAX_URL || !/^https?:\/\//i.test(url)) && 'URL must be a web link (http or https)',
        codeOf(subpart, subparts) === undefined && `Subpart "${subpart}" is not a known id or code`,
        codeOf(subsection, subsections) === undefined && `Subsection "${subsection}" is not a known id or code`,
      ].filter(Boolean)
      if (problems.length) {
        plan.errors.push(`${at}: ${problems.join('; ')}.`)
        continue
      }

      const key = `${section}\u0000${amdt}`
      let id = byKey.get(key)
      if (!id) {
        id = `reg-${crypto.randomUUID()}`
        byKey.set(key, id)
        plan.newRegulations.push({
          id, section, amdt, title, url, sort, sectionRoot,
          subpartCode: codeOf(subpart, subparts)!, subsectionCode: codeOf(subsection, subsections)!,
          requirementText: '', defaultMocText: '', active: true,
        })
      }
      if (inBasis.has(id)) plan.skipped++
      else { inBasis.add(id); plan.addIds.push(id) }
    }
  }
  if (plan.rows === 0) plan.errors.push('No rows below the headings in row 1.')
  return plan
}
