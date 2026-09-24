import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { TableTabs } from '@/components/patterns/TableTabs'
import { useSyncedScroll } from '@/components/patterns/useSyncedScroll'
import { Truncate } from '@/components/patterns/Truncate'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { sourceLabel, subpartParts, subsectionParts, titleCaseName } from '@/lib/gcpDisplay'
import { CodeWithName } from '../CodeWithName'
import type { PlanEntry } from '@/types/gcp'
import type { TccaProject } from '@/types/tcca'

/** Fixed pixel widths, `table-fixed` — the same reason `RegulationListPage`
    sets them: without a measured width, `Truncate` has nothing to clamp
    against and a long title just grows the column instead of wrapping. */
const COLUMNS: { label: string; width: number }[] = [
  { label: '', width: 48 },
  { label: 'Subpart', width: 150 },
  { label: 'Subsection', width: 150 },
  { label: 'Section', width: 100 },
  { label: 'Amdt', width: 80 },
  { label: 'Title', width: 260 },
  { label: 'Source', width: 110 },
  { label: 'Assigned', width: 90 },
]
const TABLE_WIDTH = COLUMNS.reduce((sum, c) => sum + c.width, 0)

/**
 * Step 3 — Scope Rules: every applicable rule for this project's aircraft,
 * marked Assigned or not by this modification. Confirming writes the
 * certification plan, so only the assigned rules travel to step 4.
 *
 * Applicable here is the whole rule pool, the same way the legacy Cert Plan
 * Initialize screen scopes from everything the aircraft's type certificate
 * carries (hundreds of rows) rather than a hand-picked handful — the basis
 * built in step 2 confirms the project has rules to scope; it doesn't narrow
 * which ones show up here.
 */
export function FlowStepInitialize({ project, onBack, onNext }: { project: TccaProject; onBack: () => void; onNext: () => void }) {
  const regulations = useGcpStore((s) => s.regulations)
  const subparts = useGcpStore((s) => s.subparts)
  const subsections = useGcpStore((s) => s.subsections)
  const planEntries = useGcpFlowStore((s) => s.planEntries)
  const initializePlan = useGcpFlowStore((s) => s.initializePlan)
  const [query, setQuery] = useState('')

  const rules = regulations

  /* Subpart tabs — so picking which rules apply reads as "find the right
     category, then work down its list" instead of scanning one flat pool
     of hundreds. Built from whichever subparts this rule pool actually
     uses (never the full, mostly-inactive Subpart catalog), each showing
     how many rules fall under it. A rule whose subpart is the "-" / TBD
     placeholder, inactive, or unrecognized altogether has nowhere named to
     go, so it collects in one shared "Other" tab rather than vanishing or
     getting a one-off tab of its own. */
  const [subpartTab, setSubpartTab] = useState('all')
  const { headerRef, onBodyScroll } = useSyncedScroll()
  const { subpartTabs, otherCodes } = useMemo(() => {
    const counts = new Map<string, number>()
    rules.forEach((r) => counts.set(r.subpartCode, (counts.get(r.subpartCode) ?? 0) + 1))
    const known = subparts
      .filter((sp) => sp.active && sp.code !== '-' && counts.get(sp.code))
      .sort((a, b) => a.sort.localeCompare(b.sort))
      .map((sp) => ({ key: sp.code, label: `${sp.code} — ${titleCaseName(sp.description)}`, count: counts.get(sp.code)! }))
    const knownCodeSet = new Set(known.map((t) => t.key))
    const other = rules.filter((r) => !knownCodeSet.has(r.subpartCode))
    const tabs = [
      { key: 'all', label: 'All', count: rules.length },
      ...known,
      ...(other.length > 0 ? [{ key: 'other', label: 'Other', count: other.length }] : []),
    ]
    return { subpartTabs: tabs, otherCodes: knownCodeSet }
  }, [rules, subparts])

  const bySubpart = useMemo(() => {
    if (subpartTab === 'all') return rules
    if (subpartTab === 'other') return rules.filter((r) => !otherCodes.has(r.subpartCode))
    return rules.filter((r) => r.subpartCode === subpartTab)
  }, [rules, subpartTab, otherCodes])

  const q = query.trim().toLowerCase()
  const filteredRules = useMemo(() => {
    if (!q) return bySubpart
    return bySubpart.filter((r) => `${r.section} ${r.amdt} ${r.title} ${r.sectionRoot}`.toLowerCase().includes(q))
  }, [bySubpart, q])

  /** Re-opening the step shows the answers already given; a rule not yet
      reviewed reads as Not Assigned, the same as the legacy screen shows
      every one of its rows as a definite Yes or No rather than a blank. */
  const [marks, setMarks] = useState<Record<string, boolean>>(() => {
    const seed: Record<string, boolean> = {}
    planEntries.filter((e) => e.projectId === project.id).forEach((e) => { seed[e.regulationId] = e.affected })
    return seed
  })

  const affected = rules.filter((r) => marks[r.id]).length

  const allChecked = filteredRules.length > 0 && filteredRules.every((r) => marks[r.id])
  const someChecked = !allChecked && filteredRules.some((r) => marks[r.id])
  const toggleAll = (checked: boolean) => {
    setMarks((m) => {
      const next = { ...m }
      filteredRules.forEach((r) => { next[r.id] = checked })
      return next
    })
  }

  const confirm = () => {
    const entries: PlanEntry[] = rules.map((r) => {
      const existing = planEntries.find((e) => e.projectId === project.id && e.regulationId === r.id)
      return existing
        ? { ...existing, affected: !!marks[r.id] }
        : {
            id: crypto.randomUUID(),
            projectId: project.id,
            regulationId: r.id,
            affected: !!marks[r.id],
            /* The rule's own Default Moc Text is what a project starts from. */
            methodText: r.defaultMocText,
            comments: '',
            ddsType: '',
            ddsText: '',
            complete: false,
          }
    })
    initializePlan(project.id, entries)
    onNext()
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-lg">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-base">
        <div className="grid gap-xxss">
          <h2 className="text-base font-semibold text-text-primary">Which rules does this modification affect?</h2>
          <p className="text-xs text-text-muted">The rules this modification affects, marked one by one.</p>
        </div>
        <div className="flex flex-wrap items-center gap-base">
          {/* Scoped to the current subpart tab + search, not the whole 412-
              rule pool — a stat describes what's on screen (COMPONENTS.md,
              "Two global rules for lists and filters"). */}
          <p className="whitespace-nowrap text-xs text-text-muted">
            {filteredRules.length} in this view · {filteredRules.filter((r) => marks[r.id]).length} affected
          </p>
          <div className="min-w-0" style={{ width: 280 }}>
            <label htmlFor="scope-rules-search" className="sr-only">Search rules</label>
            <Input id="scope-rules-search" size="sm" leadingIcon={<Search size={16} />} placeholder="Search by section, amdt or title..."
              value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
        {/* Category first, list second: pick a subpart to narrow the pool
            before scanning it, the same "find the right group, then work
            down its list" idea as the reference screenshot, in this app's
            own tab strip rather than a copied visual. Switching tabs — like
            switching the search — never touches the checked marks
            themselves, so partial progress in one subpart survives a look
            at another. */}
        <div className="shrink-0">
          <TableTabs
            ariaLabel="Filter rules by subpart"
            activeKey={subpartTab}
            onChange={setSubpartTab}
            tabs={subpartTabs}
          />
        </div>
        {/* Frozen header, own table — client instruction (2026-09-24): a
            scrollbar must never run alongside a table's header or a tab
            strip, only alongside the data it actually scrolls. A `sticky`
            thead inside one shared `overflow-auto` box still reserves that
            box's full-height scrollbar gutter next to the header, and the
            header itself has to share the box's own reduced width — so the
            header now lives in its own non-scrolling table, full width,
            with the body below it in its own `overflow-auto` box that owns
            the scrollbar alone. A shared `<colgroup>` keeps both tables'
            columns pixel-aligned. The select-all control stays the one
            real, interactive header; the body below carries per-row
            `aria-label`s already, so nothing loses its accessible name. */}
        <div ref={headerRef} className="shrink-0 overflow-x-hidden overflow-y-scroll scrollbar-none">
          <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: TABLE_WIDTH }}>
            <colgroup>
              {COLUMNS.map((c, i) => <col key={c.label || i} style={{ width: c.width }} />)}
              {/* Soaks up whatever's left past `TABLE_WIDTH` on a wide
                  screen instead of leaving it as dead space (client
                  instruction, 2026-09-24) — the real columns keep their own
                  explicit widths either way. */}
              <col />
            </colgroup>
            <thead>
              <tr className="border-b border-border-default bg-neutral-50">
                {COLUMNS.map((c, i) => (
                  <th key={c.label || 'select'} scope="col" style={{ width: c.width }} className="px-base py-base text-sm font-semibold text-text-secondary">
                    {i === 0 ? (
                      <Checkbox
                        aria-label="Select all rules"
                        checked={allChecked}
                        indeterminate={someChecked}
                        onChange={(e) => toggleAll(e.target.checked)}
                      />
                    ) : c.label}
                  </th>
                ))}
                <th aria-hidden />
              </tr>
            </thead>
          </table>
        </div>
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-scroll scrollbar-none" onScroll={onBodyScroll}>
        <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: TABLE_WIDTH }}>
          <caption className="sr-only">Applicable rules for {project.number}</caption>
          <colgroup>
            {COLUMNS.map((c, i) => <col key={c.label || i} style={{ width: c.width }} />)}
            <col />
          </colgroup>
          <tbody>
            {filteredRules.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-base py-lg text-center text-sm text-text-muted">No rules match your search.</td>
              </tr>
            ) : filteredRules.map((r) => {
              const isAssigned = !!marks[r.id]
              return (
                <tr key={r.id} className="border-b border-border-default last:border-b-0">
                  <td className="px-base py-base">
                    <Checkbox
                      aria-label={`Mark ${r.section} · ${r.amdt} as affected`}
                      checked={isAssigned}
                      onChange={(e) => setMarks((m) => ({ ...m, [r.id]: e.target.checked }))}
                    />
                  </td>
                  <td className="px-base py-base"><CodeWithName {...subpartParts(r.subpartCode, subparts)} /></td>
                  <td className="px-base py-base"><CodeWithName {...subsectionParts(r.subsectionCode, subsections)} /></td>
                  <td className="px-base py-base text-sm text-text-primary">{r.section}</td>
                  <td className="px-base py-base text-sm text-text-primary">{r.amdt}</td>
                  <td className="px-base py-base text-sm text-text-primary"><Truncate lines={2}>{r.title}</Truncate></td>
                  <td className="whitespace-nowrap px-base py-base text-sm">
                    {r.url ? (
                      <a href={r.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-xxss rounded-sm text-sm text-accent underline underline-offset-2 transition-colors duration-fast hover:text-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
                        {sourceLabel(r.url)}
                        <ArrowUpRight size={14} aria-hidden className="shrink-0" />
                        <span className="sr-only"> for {r.section} at {r.amdt}, opens in a new tab</span>
                      </a>
                    ) : (
                      <span className="text-text-muted">No source</span>
                    )}
                  </td>
                  <td className="px-base py-base">
                    <span
                      className={`inline-flex items-center whitespace-nowrap rounded-xs px-sm py-xxss text-xs font-medium
                        ${isAssigned ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
                    >
                      {isAssigned ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td aria-hidden />
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between">
        <Button variant="secondary" leadingIcon={<ArrowLeft size={16} />} onClick={onBack}>Back</Button>
        <Button disabled={affected === 0} onClick={confirm}>
          Create plan from {affected} affected rule{affected === 1 ? '' : 's'}
        </Button>
      </div>
    </section>
  )
}
