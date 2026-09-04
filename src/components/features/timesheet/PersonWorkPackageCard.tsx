import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { SortMenu } from '@/components/patterns/SortMenu'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { BudgetInline } from '@/components/patterns/ProgressMeter'
import { Badge } from '@/components/ui/Badge'
import { HEALTH_LABEL, HEALTH_TONE, formatHours } from '@/lib/projectHealth'
import { WP_STATUS_LABEL, WP_STATUS_TONE } from '@/lib/workPackageDisplay'
import type { PersonActivityLine, PersonPackageGroup } from '@/lib/hoursByPerson'
import { Chip, RemainingUsedInline, budgetPair } from './PersonProjectPanel'

/**
 * Remaining and Used merged into one column, same as the project header above
 * it: a reader comparing rows down this table was mentally recombining two
 * adjacent figures into the one question they actually have ("how much is
 * left, and how far in are we") — now it's one column, and a narrower one at
 * that, which is most of how this table now fits its pane without scrolling.
 */
type LineSortKey = 'activity' | 'actual' | 'budget' | 'remaining' | 'used' | 'status' | 'entries' | 'notes'

const ACTIVITY_COLUMNS: { label: string; width: string; sort?: LineSortKey; sorts?: { key: LineSortKey; label: string }[] }[] = [
  /* Shares tuned against each column's real single-line content, measured
     live at the pane's narrowest width (1280 viewport → ~604px pane), so no
     row ever breaks onto a second line and the table never scrolls:
       Activity        truncates, so it gives up the most
       Actual / Budget "1063.1h / 780h" — a figure, must not truncate
       Remaining / Used the widest cell: figure + 32px meter + percentage
       Status          "No budget set", the longest badge it carries
       Entries         its own heading is wider than any count
       Notes           chips truncate */
  { label: 'Activity', width: '16%', sort: 'activity' },
  {
    label: 'Actual / Budget',
    width: '18%',
    sorts: [{ key: 'actual', label: 'Actual' }, { key: 'budget', label: 'Budget' }],
  },
  {
    label: 'Remaining / Used',
    width: '23%',
    sorts: [{ key: 'remaining', label: 'Remaining' }, { key: 'used', label: 'Used' }],
  },
  { label: 'Status', width: '17%', sort: 'status' },
  { label: 'Entries', width: '10%', sort: 'entries' },
  { label: 'Notes', width: '16%', sort: 'notes' },
]

/** Everything about an activity that isn't a number: who owns it, who else is
    on it, what hasn't been validated, what hasn't started. */
function notesFor(line: PersonActivityLine, personName: string) {
  const out: React.ReactNode[] = []
  if (!line.assigned) {
    out.push(
      <Chip key="unassigned" title={line.assignedTo ? `Assigned to ${line.assignedTo}` : 'No one is assigned to this activity'}>
        {line.assignedTo ? `${line.assignedTo}'s activity` : 'Unassigned activity'}
      </Chip>,
    )
  }
  if (line.sharedTotal > 0) {
    out.push(
      <Chip key="shared" title={`${formatHours(line.sharedTotal)} logged on this activity in total, ${formatHours(line.actual)} of it by ${personName}`}>
        Shared, {formatHours(line.sharedTotal)} total
      </Chip>,
    )
  }
  if (line.unvalidated > 0) {
    out.push(<Chip key="unvalidated" title="Hours not yet validated by an administrator">{line.unvalidated} unvalidated</Chip>)
  }
  if (line.overtime > 0) {
    out.push(<Chip key="ot" title="Overtime on this activity, which no budget covers">{formatHours(line.overtime)} OT</Chip>)
  }
  if (line.banked > 0) {
    out.push(<Chip key="banked" title="Banked hours accrued here, not spent on the activity">{formatHours(line.banked)} banked</Chip>)
  }
  if (line.entries === 0 && line.budget > 0) {
    out.push(<Chip key="none" title="Assigned, but no hours logged yet">Not started</Chip>)
  }
  return out
}

/** The chips as a cell. Split from `notesFor` so the Notes column can sort on
    how many flags a line carries without rendering them first. */
function NotesCell({ line, personName }: { line: PersonActivityLine; personName: string }) {
  const notes = notesFor(line, personName)
  return notes.length > 0
    ? <span className="flex flex-wrap gap-xs">{notes}</span>
    : <span className="text-sm text-text-muted">—</span>
}

/**
 * One work package of one person's work on a project — **the same
 * collapsed/expanded card `WorkPackageCard` uses on Project → Work Packages**,
 * built locally rather than imported: `features/timesheet` can't reach into
 * `features/projects` (import direction, CLAUDE.md — features only import
 * their own layer or below), and the two feed it different shapes anyway
 * (`WorkPackageCard` edits real assignments with Responsible/Tasks/Actions;
 * this one reads a person's hours, so its table carries Entries/Notes
 * instead). The chevron and the header layout are copied line for line;
 * the table trims cell padding to `px-sm` — this pane runs narrower than
 * the project page's own Work Packages tab, and the padding it saves is
 * most of what keeps six columns on one line here. Its header tint
 * is `bg-neutral-100`, not the `bg-neutral-50` that table uses — matched
 * instead to this screen's other two tinted fills (the person summary's
 * stat band, the rail's selected row), so all three read as one colour on
 * this specific screen even though it puts this table's header a shade
 * darker than every other table's in the app.
 *
 * **The table is `table-fixed`, not a scrolling one.** It used to declare a
 * fixed `minWidth` and let the pane scroll under it — inside a split pane
 * that is often under 700px, six or seven data-dense columns hit that floor
 * immediately. Percentage `<col>` widths mean it always renders at exactly
 * the pane's width instead, and every row stays **one line**: cells truncate
 * rather than wrap, `RemainingUsedInline` is `flex-nowrap`, and the widths
 * above are tuned against each column's real single-line content at the
 * pane's narrowest width.
 */
export function PersonWorkPackageCard({ pkg, personName, defaultOpen }: {
  pkg: PersonPackageGroup
  personName: string
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  /* Notes is a chip list; it sorts by how many flags a line carries, so the
     lines needing attention group together. */
  const { sorted: sortedLines, sort, setSort } = useTableSort(pkg.lines, {
    activity: (l) => l.activityTitle,
    actual: (l) => l.actual,
    budget: (l) => l.budget,
    remaining: (l) => (l.health.budget > 0 ? l.health.remaining : null),
    used: (l) => l.health.progressPct,
    status: (l) => l.health.state,
    entries: (l) => l.entries,
    notes: (l) => notesFor(l, personName).length,
  })

  return (
    <section className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <header className="flex flex-wrap items-center gap-sm px-lg py-base">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-sm text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          <ChevronDown size={16} className={`shrink-0 text-text-muted transition-transform duration-fast ${open ? '' : '-rotate-90'}`} aria-hidden />
          <span className="truncate text-sm font-semibold text-text-primary">{pkg.workPackageTitle}</span>
          {pkg.status && <Badge tone={WP_STATUS_TONE[pkg.status]}>{WP_STATUS_LABEL[pkg.status]}</Badge>}
          <span className="shrink-0 whitespace-nowrap rounded-xs bg-neutral-100 px-sm py-xxss text-xs text-text-secondary">
            {pkg.lines.length} {pkg.lines.length === 1 ? 'Activity' : 'Activities'}
          </span>
        </button>
        <BudgetInline health={pkg.health} ariaLabel={`${pkg.workPackageTitle} budget for ${personName}`} />
      </header>

      {open && (
        <div className="border-t border-border-default">
          <table className="w-full table-fixed border-collapse text-left">
            <caption className="sr-only">
              {personName}: activities in {pkg.workPackageTitle}
            </caption>
            <colgroup>
              {ACTIVITY_COLUMNS.map((c) => <col key={c.label} style={{ width: c.width }} />)}
            </colgroup>
            <thead>
              <tr className="border-b border-border-default bg-neutral-100">
                {ACTIVITY_COLUMNS.map((c) => (
                  <SortableTh key={c.label} sortKey={c.sort} ownsKeys={c.sorts?.map((o) => o.key)}
                    sort={sort} onSortChange={setSort}
                    className="overflow-hidden truncate px-sm py-base text-xs font-semibold text-text-secondary">
                    {c.sorts
                      ? <SortMenu label={c.label} options={c.sorts} sort={sort} onChange={setSort} />
                      : c.label}
                  </SortableTh>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedLines.map((line) => (
                <tr key={line.key} className="border-b border-border-default last:border-b-0">
                  {/* `overflow-hidden` on every cell — the fixed layout's real
                      backstop against a horizontal scrollbar. Percentages are
                      tuned so nothing should hit it in practice, but a column
                      this narrow with a badge, a chip row and a meter in it
                      needs a guarantee, not just a good guess: content clips
                      to its own cell rather than bleeding into the next one. */}
                  <th scope="row" className="overflow-hidden px-sm py-lg text-left text-sm font-normal text-text-primary">
                    <span className="block truncate">{line.activityTitle}</span>
                  </th>
                  <td className="overflow-hidden px-sm py-lg text-sm text-text-primary">
                    <span className="block truncate">{budgetPair(line.health)}</span>
                  </td>
                  <td className="overflow-hidden px-sm py-lg">
                    <RemainingUsedInline health={line.health} ariaLabel={`${line.activityTitle} budget`} />
                  </td>
                  <td className="overflow-hidden px-sm py-lg">
                    <Badge tone={HEALTH_TONE[line.health.state]}>{HEALTH_LABEL[line.health.state]}</Badge>
                  </td>
                  <td className="overflow-hidden px-sm py-lg text-sm text-text-primary">{line.entries}</td>
                  <td className="overflow-hidden px-sm py-lg"><NotesCell line={line} personName={personName} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
