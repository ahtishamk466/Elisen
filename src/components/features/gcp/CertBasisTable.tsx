import { useMemo } from 'react'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { SortableTh } from '@/components/patterns/SortableTh'
import { Truncate } from '@/components/patterns/Truncate'
import { useSyncedScroll } from '@/components/patterns/useSyncedScroll'
import { useTableSort } from '@/components/patterns/useTableSort'
import { Badge } from '@/components/ui/Badge'
import { proportionalWidths } from '@/lib/tableWidths'
import { chosenByMap, duplicateSections } from '@/lib/certBasisLevel'
import type { CertBasis, Regulation } from '@/types/gcp'

type SortKey = 'section' | 'amdt' | 'title' | 'note'

const COLUMNS: { label: string; sort: SortKey; width: number }[] = [
  { label: 'Section', sort: 'section', width: 150 },
  { label: 'Amdt', sort: 'amdt', width: 110 },
  { label: 'Title', sort: 'title', width: 380 },
  { label: 'Note', sort: 'note', width: 160 },
]
const ACTIONS_WIDTH = 64
const TABLE_WIDTH = COLUMNS.reduce((sum, c) => sum + c.width, 0) + ACTIONS_WIDTH
/** `%` per column in proportion to the pixel weights (`lib/tableWidths.ts`). */
const COL_WIDTHS = proportionalWidths([...COLUMNS.map((c) => c.width), ACTIONS_WIDTH])

export interface CertBasisTableProps {
  basis: CertBasis
  rules: Regulation[]
  pool: Regulation[]
  onView: (r: Regulation) => void
  onEditRegulation: (r: Regulation) => void
  onRemove: (r: Regulation) => void
}

/**
 * The selected basis's rules on the Certification Basis page. The basis's name is
 * shown once, above, so rows carry only the rule. **Note** tags only the
 * exceptions — an Override (chosen against the basis's level) or a Duplicate
 * (a section the basis carries at more than one amendment) — and stays blank
 * for the ordinary rule, so the exceptions are what stand out.
 */
export function CertBasisTable({ basis, rules, pool, onView, onEditRegulation, onRemove }: CertBasisTableProps) {
  const notes = useMemo(() => {
    const chosen = chosenByMap(basis, rules, pool)
    const dupes = new Set(duplicateSections(rules).map((v) => v[0].section))
    return new Map(rules.map((r) => [r.id, { override: chosen.get(r.id) === 'override', duplicate: dupes.has(r.section) }]))
  }, [basis, rules, pool])

  const { sorted, sort, setSort } = useTableSort(rules, {
    section: (r) => r.sort,
    amdt: (r) => r.amdt,
    title: (r) => r.title,
    note: (r) => (notes.get(r.id)?.duplicate ? 2 : notes.get(r.id)?.override ? 1 : 0),
  })
  const { headerRef, onBodyScroll } = useSyncedScroll()

  const colgroup = (
    <colgroup>
      {COLUMNS.map((c, i) => <col key={c.label} style={{ width: COL_WIDTHS[i] }} />)}
      <col style={{ width: COL_WIDTHS[COLUMNS.length] }} />
    </colgroup>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-border-default">
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
          <caption className="sr-only">Rules in certification basis {basis.aircraftModel}</caption>
          {colgroup}
          <tbody>
            {sorted.map((r) => {
              const note = notes.get(r.id)
              return (
                <tr key={r.id} className="border-b border-border-default last:border-b-0">
                  <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{r.section}</td>
                  <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{r.amdt}</td>
                  <td className="px-lg py-base text-sm text-text-primary"><Truncate lines={2}>{r.title}</Truncate></td>
                  <td className="px-lg py-base">
                    <span className="flex flex-wrap gap-xs">
                      {note?.override && <Badge tone="info">Override</Badge>}
                      {note?.duplicate && <Badge tone="warning">Duplicate</Badge>}
                    </span>
                  </td>
                  <td className="px-lg py-base">
                    <ActionsMenu ariaLabel={`Actions for ${r.section} · ${r.amdt}`} items={[
                      { label: 'View', icon: <Eye size={16} />, onSelect: () => onView(r) },
                      { label: 'Edit Regulation', icon: <Pencil size={16} />, onSelect: () => onEditRegulation(r) },
                      { label: 'Remove from Basis', icon: <Trash2 size={16} />, onSelect: () => onRemove(r), tone: 'danger' as const },
                    ]} />
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
