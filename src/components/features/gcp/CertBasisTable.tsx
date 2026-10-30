import { useMemo } from 'react'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { SortableTh } from '@/components/patterns/SortableTh'
import { Truncate } from '@/components/patterns/Truncate'
import { useSyncedScroll } from '@/components/patterns/useSyncedScroll'
import { useTableSort } from '@/components/patterns/useTableSort'
import { Badge } from '@/components/ui/Badge'
import { proportionalWidths } from '@/lib/tableWidths'
import { chosenByMap, duplicateSections, type ChosenBy } from '@/lib/certBasisLevel'
import type { CertBasis, Regulation } from '@/types/gcp'

type SortKey = 'basis' | 'section' | 'amdt' | 'title' | 'chosen'

const COLUMNS: { label: string; sort: SortKey; width: number }[] = [
  { label: 'Cert Basis', sort: 'basis', width: 190 },
  { label: 'Regulation Section', sort: 'section', width: 150 },
  { label: 'Regulation Amdt', sort: 'amdt', width: 130 },
  { label: 'Regulation Title', sort: 'title', width: 300 },
  { label: 'Chosen by', sort: 'chosen', width: 170 },
]
const ACTIONS_WIDTH = 64
const TABLE_WIDTH = COLUMNS.reduce((sum, c) => sum + c.width, 0) + ACTIONS_WIDTH
/** `%` per column in proportion to the pixel weights, so a wide screen grows
    every column instead of leaving a void past Actions (`lib/tableWidths.ts`). */
const COL_WIDTHS = proportionalWidths([...COLUMNS.map((c) => c.width), ACTIONS_WIDTH])

const CHOSEN_LABEL: Record<ChosenBy, string> = { level: 'Amendment level', override: 'Override', hand: 'By hand' }

/** One row per basis↔regulation link, or a placeholder (`regulation: null`)
    for a basis with none, so it still has a row to manage it from. */
export type CertBasisRow = { basis: CertBasis; regulation: Regulation | null }

export interface CertBasisTableProps {
  rows: CertBasisRow[]
  pool: Regulation[]
  onView: (r: Regulation) => void
  onEditRegulation: (r: Regulation) => void
  onRemove: (b: CertBasis, r: Regulation) => void
  onEditBasis: (b: CertBasis) => void
  onDeleteBasis: (b: CertBasis) => void
}

/**
 * Cert Basis as **one flat table** (client instruction, 2026-09-25, after the
 * legacy `cert-basis/index` grid). Every row names its basis; basis-level
 * Edit/Delete ride in each row's menu beside the regulation's own actions.
 * **Chosen by** says how the rule got in (amendment level, override, by
 * hand) and flags a section the basis carries at more than one amendment.
 */
export function CertBasisTable({ rows, pool, onView, onEditRegulation, onRemove, onEditBasis, onDeleteBasis }: CertBasisTableProps) {
  /* Per basis: how each rule was chosen, and which sections are duplicated. */
  const meta = useMemo(() => {
    const out = new Map<string, { chosen: Map<string, ChosenBy>; dupes: Set<string> }>()
    for (const { basis } of rows) {
      if (out.has(basis.id)) continue
      const regs = rows.filter((x) => x.basis.id === basis.id && x.regulation).map((x) => x.regulation!)
      out.set(basis.id, {
        chosen: chosenByMap(basis, regs, pool),
        dupes: new Set(duplicateSections(regs).map((v) => v[0].section)),
      })
    }
    return out
  }, [rows, pool])

  const { sorted, sort, setSort } = useTableSort(rows, {
    basis: (row) => row.basis.aircraftModel,
    section: (row) => row.regulation?.section,
    amdt: (row) => row.regulation?.amdt,
    title: (row) => row.regulation?.title,
    chosen: (row) => (row.regulation ? meta.get(row.basis.id)?.chosen.get(row.regulation.id) : undefined),
  })
  const { headerRef, onBodyScroll } = useSyncedScroll()

  const colgroup = (
    <colgroup>
      {COLUMNS.map((c, i) => <col key={c.label} style={{ width: COL_WIDTHS[i] }} />)}
      <col style={{ width: COL_WIDTHS[COLUMNS.length] }} />
    </colgroup>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      {/* Frozen header, own table — a scrollbar never runs alongside a table's
          header (docs/COMPONENTS.md); kept in sync with the body below. */}
      <div ref={headerRef} className="shrink-0 overflow-x-hidden overflow-y-scroll scrollbar-none">
        <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: TABLE_WIDTH }}>
          {colgroup}
          <thead>
            <tr className="border-b border-border-default bg-neutral-50">
              {COLUMNS.map((c) => (
                <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                  className="px-lg py-base text-sm font-semibold text-text-secondary">{c.label}</SortableTh>
              ))}
              <SortableTh className="px-lg py-base text-sm font-semibold text-text-secondary">Actions</SortableTh>
            </tr>
          </thead>
        </table>
      </div>
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-scroll scrollbar-none" onScroll={onBodyScroll}>
        <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: TABLE_WIDTH }}>
          <caption className="sr-only">Every Cert Basis and its regulations, one row per link</caption>
          {colgroup}
          <tbody>
            {sorted.map(({ basis: b, regulation: r }) => {
              const m = meta.get(b.id)
              const how = r ? m?.chosen.get(r.id) : undefined
              return (
                <tr key={r ? `${b.id}-${r.id}` : `empty-${b.id}`} className="border-b border-border-default last:border-b-0">
                  <td className="px-lg py-base">
                    <span className="block truncate text-sm font-semibold text-text-primary">{b.aircraftModel}</span>
                    <span className="block truncate text-xs text-text-muted">{b.tcdsNumber ? `TCDS ${b.tcdsNumber}` : 'Project-specific'}</span>
                  </td>
                  {r ? (
                    <>
                      <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{r.section}</td>
                      <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{r.amdt}</td>
                      <td className="px-lg py-base text-sm text-text-primary"><Truncate lines={2}>{r.title}</Truncate></td>
                      <td className="px-lg py-base">
                        <span className="flex flex-wrap gap-xs">
                          {how && <Badge tone={how === 'override' ? 'info' : 'neutral'}>{CHOSEN_LABEL[how]}</Badge>}
                          {m?.dupes.has(r.section) && <Badge tone="warning">Duplicate</Badge>}
                        </span>
                      </td>
                    </>
                  ) : (
                    <td colSpan={4} className="px-lg py-base text-sm text-text-muted">No regulations yet.</td>
                  )}
                  <td className="px-lg py-base">
                    <ActionsMenu
                      ariaLabel={r ? `Actions for ${r.section} · ${r.amdt}` : `Actions for cert basis ${b.aircraftModel}`}
                      items={[
                        ...(r
                          ? [
                              { label: 'View', icon: <Eye size={16} />, onSelect: () => onView(r) },
                              { label: 'Edit regulation', icon: <Pencil size={16} />, onSelect: () => onEditRegulation(r) },
                              { label: 'Remove from basis', icon: <Trash2 size={16} />, onSelect: () => onRemove(b, r), tone: 'danger' as const },
                            ]
                          : []),
                        { label: 'Edit Cert Basis', icon: <Pencil size={16} />, onSelect: () => onEditBasis(b) },
                        { label: 'Delete Cert Basis', icon: <Trash2 size={16} />, onSelect: () => onDeleteBasis(b), tone: 'danger' as const },
                      ]}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
