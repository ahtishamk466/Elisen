import { useRef, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil, Copy, Trash2, Package } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ProgressMeter } from '@/components/patterns/ProgressMeter'
import { PersonCell } from '@/components/patterns/PersonCell'
import { Truncate } from '@/components/patterns/Truncate'
import { SortMenu } from '@/components/patterns/SortMenu'
import { useElementWidth } from '@/components/patterns/useElementWidth'
import { PRIORITY_LABEL, STATUS_LABEL, STATUS_TONE, TYPE_LABEL } from '@/lib/projectDisplay'
import { formatHours, formatPct, type Health } from '@/lib/projectHealth'
import type { ProjectListRow } from '@/types/project'
import { DateText } from '@/components/patterns/DateText'

/** A row plus the budget roll-up computed for it by the page. */
export interface ProjectRowWithHealth {
  row: ProjectListRow
  health: Health
}

export type SortKey = 'number' | 'company' | 'contact' | 'budget' | 'actual' | 'remaining' | 'progress' | 'priority' | 'type' | 'opened'
export interface Sort {
  key: SortKey
  dir: 'asc' | 'desc'
}

interface Column {
  label: string
  /** Omitted = not sortable (free text and action columns). */
  sort?: SortKey
  /** Two or more fields stacked in this cell; the heading offers all of them. */
  sorts?: { key: SortKey; label: string }[]
  /** Financial columns come out entirely below manager. */
  financial?: boolean
  /**
   * Pixels, for a column whose content has a **known maximum** — a date, a
   * badge, a 3-dot button. It cannot use more than this however wide the screen
   * gets, so it never takes a share of one.
   */
  fixed?: number
  /**
   * Share of whatever the fixed columns don't need, for a column holding **free
   * text that truncates**. These are the only columns a wider screen should
   * grow.
   */
  flex?: number
  /**
   * Point past which a flexible column stops growing, because its content fits
   * and the rest would be padding. What it gives up goes to the uncapped
   * columns — on this table, to Project.
   */
  max?: number
  /** Its own heading's width: below this the column can't label itself. */
  min?: number
  /** Right-aligns the heading (and hands the SortMenu/headerButton trigger a
      matching justify-end) to sit flush with a right-aligned body column. */
  align?: 'right'
  /**
   * Fallback heading text for a flex column whose full label doesn't fit —
   * still names every field the column holds, just shorter, so a reader is
   * never left wondering whether "Company" also sorts by contact. Shown
   * whenever the column's assigned width is under `fullLabelMin`.
   */
  shortLabel?: string
  fullLabelMin?: number
}

/** Below this the flexible three would start truncating everything — must
    equal the sum of the three flex columns' own `min` (88 + 114 + 94).

    Every `fixed` and `min` here is its column's **measured** content floor —
    the widest thing it ever holds, heading included — plus the 24px column
    gutter. Nothing is a round number: they were read off the rendered table,
    which is why Actions is 70 (its own heading, not its 26px button) and
    Active is 86 (its badge, which used to overflow into the cell padding).

    The gutter came down from 32px to 24px to buy the ~72px that made nine
    columns fit a 1280 laptop without a scrollbar. Wider screens spend the
    surplus on the three flex columns rather than on padding. */
const FLEX_FLOOR = 296

/**
 * Seven columns, and **no horizontal scroll**: the table used to declare a
 * 1501px minimum against roughly 960px of page on a 1280 laptop, so half the
 * record was always off-screen.
 *
 * Related fields are stacked two-to-a-cell instead — line 1 is what you scan
 * for, line 2 is what you confirm once you've found the row. Only fields
 * answering the *same* question are paired, so nothing has to be decoded:
 * a project's identity, its customer, its budget-so-far, its budget-left.
 */
const COLUMNS: Column[] = [
  /* Two kinds of column, and the difference is the whole layout: **fixed** ones
     hold a value with a known maximum — a two-line date, a badge, a button —
     and a wider screen cannot make them more useful, so they never grow.
     **Flex** ones hold free text that truncates, so every pixel the fixed
     columns don't need is split between them. Percentages for all ten grew the
     date column on a 1728px screen while the project names were still cut off. */
  /* Project's floor is set above its heading rather than at it: it is the
     column a reader starts every scan in, and it is the only one holding two
     lines of free text, so it leads the table at every width instead of
     collapsing to the narrowest column on the row. It is also the one column
     with no `max`, so every pixel the others don't claim lands here.
     min 110 → 145: a project number plus a truncated title read as cramped
     at the old floor, and this is the one column meant to lead the row. */
  { label: 'Project', sort: 'number', flex: 52, min: 88 },
  {
    label: 'Priority/Type',
    /* Heading-bound, not content-bound: "Priority/Type" plus its sort icon
       is wider than "5 - Lowest" over "Preferred" ever is. */
    fixed: 120,
    sorts: [{ key: 'priority', label: 'Priority' }, { key: 'type', label: 'Type' }],
  },
  {
    label: 'Company/Contact',
    shortLabel: 'Co./Contact',
    fullLabelMin: 150,
    flex: 26,
    min: 114,
    max: 248,
    sorts: [{ key: 'company', label: 'Company' }, { key: 'contact', label: 'Contact' }],
  },
  { label: 'Person Res.', flex: 22, min: 94, max: 208 },
  /* One line: a date reads as one thing. Sized to the widest month name
     rather than the average — "May 23, 2026" needs 100px where "Jul 6, 2026"
     needs 84, and the column was quietly breaking the wide ones over two
     lines at the old figure. */
  { label: 'Opened', sort: 'opened', fixed: 124 },
  /* One column for the whole budget question, because it *is* one question and
     only two of its four numbers are independent — remaining is budget minus
     actual, used is actual over budget. Split across two columns it read as
     four unrelated figures ("7461.4h / 7800h" then "338.6h ▬ 96%") and a reader
     had to work out which pair belonged to which. Stacked, it reads top to
     bottom as a sentence: what has been spent of what was set aside, then how
     far through that is and what is left. */
  {
    label: 'Budget',
    financial: true,
    /* 204 → 156, measured rather than guessed: line 1's widest pair is
       106px and line 2 ("19.2h over · meter · 124%") is 132px with the meter
       at 36px — so 132 + the 24px gutter. The old figure carried ~48px this
       column never used, which is most of what pushed the table into a
       scrollbar. */
    fixed: 156,
    sorts: [
      { key: 'actual', label: 'Actual' },
      { key: 'budget', label: 'Budget' },
      { key: 'remaining', label: 'Remaining' },
      { key: 'progress', label: 'Used' },
    ],
  },
  /* Both sized to their widest badge plus the gutter: "In Progress" (82px)
     and "Inactive" (62px). Active was 82 — 20px under what its own badge
     needs — so the badge had been quietly spilling into the cell's padding. */
  { label: 'Status', fixed: 106 },
  { label: 'Active', fixed: 86 },
  /* Sized to its **heading**, not its button: the 3-dot trigger is only
     26px, but "Actions" is 45px, and at the old 58 the heading itself was
     clipped to "Action". 70 fits the word and leaves the button sitting
     clear of the table's right edge rather than hard against it. */
  { label: 'Actions', fixed: 70 },
]

export interface ProjectsTableProps {
  rows: ProjectRowWithHealth[]
  loading?: boolean
  /** Hours are budget data — hidden below manager per docs/SECURITY.md rule 8. */
  canSeeFinancials?: boolean
  sort?: Sort
  onSortChange?: (sort: Sort) => void
  onView?: (row: ProjectListRow) => void
  /** Straight to the project's Work Packages tab — the part of a project people
      come back to most, so it shouldn't need a detour through Overview. */
  onOpenWorkPackages?: (row: ProjectListRow) => void
  onEdit?: (row: ProjectListRow) => void
  onDuplicate?: (row: ProjectListRow) => void
  onDelete?: (row: ProjectListRow) => void
  /** Rendered as the table's own footer bar — inside the same card, not a
      second box below it. Typically an <AutoLoadFooter>. */
  pagination?: ReactNode
}

/**
 * Split `available` between the flexible columns in their `flex` ratio, then
 * settle up: a column never goes below its own heading (`min`) and never grows
 * past the point where its content fits (`max`). Whatever that costs or frees
 * lands on the columns with no ceiling — on this table, on Project.
 *
 * Without the settling pass a wide screen pads Company and Person Res. long
 * after their names fit while the project titles are still cut off, and a
 * narrow one starves them below their own column headings.
 */
function shareOut(flexible: Column[], available: number): Map<string, number> {
  const totalShare = flexible.reduce((n, c) => n + (c.flex ?? 0), 0)
  const widths = new Map<string, number>()

  for (const c of flexible) {
    const want = Math.floor((available * (c.flex ?? 0)) / totalShare)
    widths.set(c.label, Math.min(Math.max(want, c.min ?? 0), c.max ?? Infinity))
  }

  // Clamping in either direction leaves the row not adding up; the columns that
  // can still move absorb the difference, down to their own minimum.
  const elastic = flexible.filter((c) => !c.max)
  const elasticShare = elastic.reduce((n, c) => n + (c.flex ?? 0), 0)
  let delta = available - [...widths.values()].reduce((n, w) => n + w, 0)
  if (elasticShare > 0) {
    for (const c of elastic) {
      const share = Math.floor((delta * (c.flex ?? 0)) / elasticShare)
      widths.set(c.label, Math.max((widths.get(c.label) ?? 0) + share, c.min ?? 0))
    }
    delta = 0
  }
  return widths
}

export function ProjectsTable({
  rows, loading = false, canSeeFinancials = true, sort, onSortChange,
  onView, onOpenWorkPackages, onEdit, onDuplicate, onDelete, pagination,
}: ProjectsTableProps) {
  const columns = canSeeFinancials ? COLUMNS : COLUMNS.filter((c) => !c.financial)
  const wrapRef = useRef<HTMLDivElement>(null)
  const measured = useElementWidth(wrapRef)

  /* The fixed columns are subtracted first; every pixel left over is split
     between the three that hold names, in their `flex` ratio. Measured rather
     than expressed in CSS because a browser ignores `calc(40% - 264px)` on a
     <col> and silently splits the space evenly instead. */
  const fixedTotal = columns.reduce((n, c) => n + (c.fixed ?? 0), 0)
  const available = Math.max((measured ?? fixedTotal + FLEX_FLOOR) - fixedTotal, FLEX_FLOOR)
  const flexWidths = shareOut(columns.filter((c) => c.flex), available)
  const widthOf = (c: Column) => c.fixed ?? flexWidths.get(c.label) ?? 0

  const headerButton = (c: Column, key: SortKey) => {
    const active = sort?.key === key
    // Neutral ⇅ marks it sortable at rest; a directional arrow only once it
    // is the active sort — same rule as the merged-column SortMenu headings.
    const Icon = active && sort ? (sort.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
    return (
      <button
        type="button"
        onClick={() => onSortChange?.({ key, dir: active && sort?.dir === 'asc' ? 'desc' : 'asc' })}
        /* Every heading keeps the <th>'s own weight and colour, active or not.
           Darkening the sorted one to text-primary read as a second, heavier
           font next to its grey neighbours — the blue arrow already says which
           column is sorted, without a second cue that looks like a typo. */
        /* `w-full` is what makes `justify-end` mean anything: a <button> is a
           form control, so it shrinks to fit its text even at `display:flex`
           — the heading sat left of a 212px cell with 135px of empty space
           after it, while the <th>'s own `text-right` had no inline content
           left to align. */
        className={`flex items-center gap-xs whitespace-nowrap rounded-sm transition-colors duration-fast hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary
          ${c.align === 'right' ? 'w-full justify-end' : ''}`}
      >
        {c.label}
        <Icon size={14} aria-hidden className={active ? 'text-accent' : 'text-text-muted'} />
      </button>
    )
  }

  return (
    <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <div ref={wrapRef} className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: fixedTotal + FLEX_FLOOR }}>
        <caption className="sr-only">Projects, with budget health per project</caption>
        {/* Widths live on <colgroup>, not the header cells — under
            table-fixed a header without per-column cells hands its widths to
            whatever the first body row happens to contain. */}
        <colgroup>
          {columns.map((c) => <col key={c.label} style={{ width: widthOf(c) }} />)}
        </colgroup>
        <thead>
          <tr className="border-b border-border-default bg-neutral-50">
            {columns.map((c) => {
              // The short form still names every field the column holds —
              // just shorter — so a reader is never left thinking a merged
              // column sorts by only one of them. Only kicks in below the
              // width the full label needs in either its active or inactive
              // state, so choosing that sort never makes the label reflow.
              const label = c.shortLabel && widthOf(c) < (c.fullLabelMin ?? 0) ? c.shortLabel : c.label
              return (
                <th
                  key={c.label}
                  scope="col"
                  aria-sort={sort && (c.sort === sort.key || c.sorts?.some((o) => o.key === sort.key))
                    ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={`whitespace-nowrap px-base py-base align-middle text-xs font-semibold text-text-secondary ${c.align === 'right' ? 'text-right' : ''}`}
                >
                  {c.sorts && onSortChange
                    ? <SortMenu label={label} options={c.sorts} sort={sort} onChange={onSortChange} align={c.align} />
                    : c.sort && onSortChange ? headerButton({ ...c, label }, c.sort) : label}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <tr key={i} className="border-b border-border-default last:border-b-0">
                  {Array.from({ length: columns.length }, (_, j) => (
                    <td key={j} className="px-base py-base"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            : rows.map(({ row, health }) => {
                const over = health.remaining < 0
                return (
                  <tr
                    key={row.id}
                    onClick={() => onView?.(row)}
                    className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle"
                  >
                    {/* Number leads — it is how a project is asked for — with
                        the title under it as the line that confirms the row. */}
                    <td className="px-base py-base align-middle">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onView?.(row) }}
                        className="block w-full text-left underline-offset-2 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                      >
                        <span className="block whitespace-nowrap text-sm font-semibold tabular-nums text-text-primary">
                          {row.number}-{row.subNumber}
                        </span>
                        <span className="block text-xs text-text-secondary"><Truncate lines={1}>{row.title}</Truncate></span>
                      </button>
                    </td>
                    {/* Priority reads as one phrase ("5 - Lowest"), with the
                        project's type under it. */}
                    <td className="px-base py-base align-middle">
                      <span className="block truncate text-sm font-semibold text-text-primary">{PRIORITY_LABEL[row.priority]}</span>
                      <span className="block truncate text-xs text-text-muted">{TYPE_LABEL[row.type]}</span>
                    </td>
                    {/* Both client-side: who we work for, and who we call. */}
                    <td className="px-base py-base align-middle">
                      <span className="block truncate text-sm text-text-primary" title={row.companyName}>{row.companyName}</span>
                      {/* Initials mark line 2 as a person, so a company and its
                          contact are never mistaken for one another. */}
                      <PersonCell name={row.contactName} variant="secondary" />
                    </td>
                    <td className="px-base py-base align-middle">
                      <PersonCell name={row.personResponsible} />
                    </td>
                    {/* ISO, as everywhere else in the app: it is unambiguous
                        across locales and it sorts as text. */}
                    <td className="px-base py-base align-middle text-sm tabular-nums text-text-primary">
                      <DateText value={row.openedDate} />
                    </td>
                    {canSeeFinancials && (
                      /* Left-aligned, like every other column on this table —
                         Budget was the one exception, right-aligned on its own
                         because the column is sized for the widest row's
                         figures. Consistency with the rest of the table wins.
                         Line 1 is the two real numbers — spent, of what was set
                         aside. Line 2 is what they mean: how far through, and
                         what is left, in words, so nobody has to decode whether
                         a minus sign is good news. */
                      <td className="whitespace-nowrap px-base py-base align-middle">
                        {/* One weight, one colour, for the whole line: actual
                            and budget used to be two different colours
                            (text-primary against text-muted), which read as
                            two different values rather than one figure with
                            its target attached. Both are text-primary now,
                            separated only by the "/" a reader already parses
                            as "of". */}
                        <span className="block text-sm tabular-nums text-text-primary">
                          {formatHours(health.actual)}
                          {health.budget > 0 ? ` / ${formatHours(health.budget)}` : ' / no budget'}
                        </span>
                        {health.progressPct === null ? (
                          <span className="mt-xxss block text-xs text-text-muted">Not budgeted</span>
                        ) : (
                          /* Remaining, then the meter, then the percentage — the
                             same order `RemainingUsedInline` uses on Person
                             Detail, so the budget line reads identically
                             wherever it appears. */
                          <span className="mt-xxss flex items-center gap-xs">
                            <span className={`text-xs tabular-nums ${over ? 'text-danger' : 'text-text-muted'}`}>
                              {over
                                ? `${formatHours(Math.abs(health.remaining))} over`
                                : `${formatHours(health.remaining)} left`}
                            </span>
                            {/* 44px → 36px: this line is the column's own
                                width bottleneck (remaining text + meter +
                                percentage, all three at once) — narrowing
                                the meter a touch is what let Budget shrink
                                without cutting off "396.8h over" on its
                                worst row. */}
                            <span className="shrink-0" style={{ width: 36 }}>
                              <ProgressMeter health={health} size="sm" ariaLabel={`Project ${row.number}-${row.subNumber} budget`} />
                            </span>
                            <span className={`text-xs tabular-nums ${over ? 'text-danger' : 'text-text-secondary'}`}>
                              {formatPct(health.progressPct)}
                            </span>
                          </span>
                        )}
                      </td>
                    )}
                    {/* Budget health is not repeated here — the meter beside it
                        already carries it, with the percentage and a signed
                        Remaining as its non-colour cues. */}
                    <td className="whitespace-nowrap px-base py-base align-middle">
                      <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                    </td>
                    {/* Its own column, not a second line under Status: where
                        the work has got to and whether the record is still
                        live are different questions, and a badge that answers
                        both looked like it was answering neither clearly. */}
                    <td className="whitespace-nowrap px-base py-base align-middle">
                      <Badge tone={row.active ? 'success' : 'neutral'}>{row.active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    {/* Row opens View; the menu must not trigger it too. */}
                    <td className="px-base py-base align-middle" onClick={(e) => e.stopPropagation()}>
                      <ActionsMenu
                        ariaLabel={`Actions for project ${row.number}-${row.subNumber}`}
                        items={[
                          { label: 'View', icon: <Eye size={16} />, onSelect: () => onView?.(row) },
                          { label: 'Work Packages', icon: <Package size={16} />, onSelect: () => onOpenWorkPackages?.(row) },
                          { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => onEdit?.(row) },
                          { label: 'Duplicate', icon: <Copy size={16} />, onSelect: () => onDuplicate?.(row) },
                          { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => onDelete?.(row), tone: 'danger' },
                        ]}
                      />
                    </td>
                  </tr>
                )
              })}
        </tbody>
      </table>
      </div>
      {pagination}
    </div>
  )
}
