import { amendmentLabel, sourceLabel } from '@/lib/gcpDisplay'
import { useMemo } from 'react'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { TableTabs } from '@/components/patterns/TableTabs'
import { Truncate } from '@/components/patterns/Truncate'
import { useSyncedScroll } from '@/components/patterns/useSyncedScroll'
import { useTableSort } from '@/components/patterns/useTableSort'
import { Badge } from '@/components/ui/Badge'
import { useGcpStore } from '@/stores/gcpStore'
import { proportionalWidths } from '@/lib/tableWidths'
import { chosenByMap, duplicateSections } from '@/lib/certBasisLevel'
import { rulesInSubpartTab, subpartTabs } from '@/lib/subpartTabs'
import type { CertBasis, Regulation } from '@/types/gcp'
import { AmendmentText } from './AmendmentText'
import { GcpChip } from './GcpChip'
import { RegulationSectionButton } from './RegulationSectionButton'
import { RegulationSourceLink } from './RegulationSourceLink'

type SortKey = 'section' | 'amdt' | 'title' | 'root' | 'sort' | 'source' | 'active'
/** Which rules the page's All / Active / Inactive switch shows. */
export type RuleStatus = 'all' | 'active' | 'inactive'

const COLUMNS: { label: string; sort: SortKey; width: number }[] = [
  { label: 'Section', sort: 'section', width: 150 },
  { label: 'Amendment', sort: 'amdt', width: 110 },
  { label: 'Title', sort: 'title', width: 290 },
  { label: 'Section Root', sort: 'root', width: 120 },
  { label: 'Sort', sort: 'sort', width: 140 },
  { label: 'Source', sort: 'source', width: 130 },
  { label: 'Active', sort: 'active', width: 90 },
]
const ACTIONS_WIDTH = 64
const TABLE_WIDTH = COLUMNS.reduce((sum, c) => sum + c.width, 0) + ACTIONS_WIDTH
/** `%` per column in proportion to the pixel weights (`lib/tableWidths.ts`). */
const COL_WIDTHS = proportionalWidths([...COLUMNS.map((c) => c.width), ACTIONS_WIDTH])

export interface CertBasisTableProps {
  basis: CertBasis
  rules: Regulation[]
  pool: Regulation[]
  /** Open a rule; `sequence` is the list as shown, for the drawer's Previous / Next. */
  onView: (r: Regulation, sequence: Regulation[]) => void
  onEditRegulation: (r: Regulation) => void
  onRemove: (r: Regulation) => void
  /** Which slice is shown: `all`, `duplicates`, a subpart code or `other`.
      Owned by the page (`?view=`) so its duplicate warning can link here. */
  view: string
  onViewChange: (view: string) => void
  /** The page header's search (section, amendment or title); see "Tabbed page
      layout" in COMPONENTS.md — the panel filters with it, never owns one. */
  query: string
  /** The page header's All / Active / Inactive switch. */
  status: RuleStatus
}

/**
 * The selected basis's rules on the Certification Basis page. The basis's name is
 * shown once, in the band above, so rows carry only the rule, in the Regulatory
 * Library's columns (Section Root, Sort and Active replaced Note, 2026-11-02).
 * Only the exceptions are tagged, beside the section — an Override (chosen
 * against the basis's level) or a Duplicate (a section the basis carries at more
 * than one amendment) — so the ordinary rule carries no tag.
 *
 * A basis holds ~400 rules, so it slices like Scope Rules (2026-11-01):
 * `TableTabs` for All, Duplicates (when there are any) and each subpart the
 * basis uses, first in the table's card, filtered by the header search.
 */
export function CertBasisTable({ basis, rules, pool, onView, onEditRegulation, onRemove, view, onViewChange, query, status }: CertBasisTableProps) {
  const subparts = useGcpStore((s) => s.subparts)
  const notes = useMemo(() => {
    const chosen = chosenByMap(basis, rules, pool)
    const dupes = new Set(duplicateSections(rules).map((v) => v[0].section))
    return new Map(rules.map((r) => [r.id, { override: chosen.get(r.id) === 'override', duplicate: dupes.has(r.section) }]))
  }, [basis, rules, pool])

  /* Duplicates are judged on the whole basis (above); the switch then narrows
     what is listed, and the tab counts follow it so they describe the rows shown. */
  const shown = useMemo(() => (status === 'all' ? rules : rules.filter((r) => r.active === (status === 'active'))), [rules, status])
  const { tabs, known } = useMemo(() => {
    const bySubpart = subpartTabs(shown, subparts)
    const duplicates = shown.filter((r) => notes.get(r.id)?.duplicate).length
    const [all, ...rest] = bySubpart.tabs
    return { tabs: duplicates > 0 ? [all, { key: 'duplicates', label: 'Duplicates', count: duplicates }, ...rest] : bySubpart.tabs, known: bySubpart.known }
  }, [shown, subparts, notes])
  const active = tabs.some((t) => t.key === view) ? view : 'all'
  const q = query.trim().toLowerCase()
  const visible = useMemo(() => {
    const inTab = active === 'duplicates' ? shown.filter((r) => notes.get(r.id)?.duplicate) : rulesInSubpartTab(shown, active, known)
    return q ? inTab.filter((r) => `${r.section} ${amendmentLabel(r.amdt)} ${r.title}`.toLowerCase().includes(q)) : inTab
  }, [shown, notes, active, known, q])

  const { sorted, sort, setSort } = useTableSort(visible, {
    section: (r) => r.sort,
    amdt: (r) => r.amdt,
    title: (r) => r.title,
    root: (r) => r.sectionRoot,
    sort: (r) => r.sort,
    /* Rules with a link first (blanks park last), FAA before other hosts. */
    source: (r) => (r.url.trim() ? sourceLabel(r.url) : null),
    active: (r) => r.active,
  })
  const { headerRef, onBodyScroll } = useSyncedScroll()

  const colgroup = (
    <colgroup>
      {COLUMNS.map((c, i) => <col key={c.label} style={{ width: COL_WIDTHS[i] }} />)}
      <col style={{ width: COL_WIDTHS[COLUMNS.length] }} />
    </colgroup>
  )

  return (
      <section aria-label={`Rules in ${basis.aircraftModel}`} className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <div className="shrink-0"><TableTabs ariaLabel="Filter rules by subpart" activeKey={active} onChange={onViewChange} tabs={tabs} /></div>
      {sorted.length === 0 ? (
        <EmptyState title="No rules match" description="Try another subpart or status, or a section number, amendment or word from the title." />
      ) : <>
      {/* Frozen header, own table — a scrollbar never runs alongside a table's
          header (docs/COMPONENTS.md); kept in sync with the body below. */}
      <div ref={headerRef} className="shrink-0 overflow-x-hidden overflow-y-scroll scrollbar-none">
        <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: TABLE_WIDTH }}>
          {colgroup}
          <thead>
            <tr className="border-b border-border-default bg-neutral-50">
              {COLUMNS.map((c) => (
                <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                  className="px-base py-base text-sm font-semibold text-text-secondary">{c.label}</SortableTh>
              ))}
              <SortableTh className="px-base py-base text-sm font-semibold text-text-secondary">Actions</SortableTh>
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
                /* Only the section is bold — it is what a reader scans for. The
                   title is the confirming line, so it stays regular; the whole
                   row opens the rule, with the section as its keyboard control. */
                <tr key={r.id} onClick={() => onView(r, sorted)} className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle">
                  <td className="px-base py-base">
                    <span className="flex flex-wrap items-center gap-xs">
                      <RegulationSectionButton regulation={r} onOpen={() => onView(r, sorted)} />
                      {note?.override && <Badge tone="info">Override</Badge>}
                      {note?.duplicate && <Badge tone="warning">Duplicate</Badge>}
                    </span>
                  </td>
                  <td className="px-base py-base"><AmendmentText amdt={r.amdt} /></td>
                  <td className="px-base py-base text-sm text-text-primary"><Truncate lines={2}>{r.title}</Truncate></td>
                  <td className="px-base py-base"><GcpChip value={r.sectionRoot} label="section roots" /></td>
                  {/* The library's ordering key ("25.0493_25-97"), up to 48 characters: wraps. */}
                  <td className="break-all px-base py-base text-sm tabular-nums text-text-primary">{r.sort}</td>
                  {/* Where the rule text can be read (FAA DRS for most). */}
                  <td className="whitespace-nowrap px-base py-base"><RegulationSourceLink regulation={r} /></td>
                  <td className="whitespace-nowrap px-base py-base"><Badge tone={r.active ? 'success' : 'neutral'}>{r.active ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="px-base py-base" onClick={(e) => e.stopPropagation()}>
                    <ActionsMenu ariaLabel={`Actions for ${r.section} · ${amendmentLabel(r.amdt)}`} items={[
                      { label: 'View', icon: <Eye size={16} />, onSelect: () => onView(r, sorted) },
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
      </>}
      </section>
  )
}
