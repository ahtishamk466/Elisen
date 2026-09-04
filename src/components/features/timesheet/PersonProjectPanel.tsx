import { ProgressMeter } from '@/components/patterns/ProgressMeter'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { Stat } from '@/components/patterns/Stat'
import { Badge } from '@/components/ui/Badge'
import { HEALTH_LABEL, HEALTH_TONE, formatHours, formatPct, type Health } from '@/lib/projectHealth'
import type { NonProjectLine, PersonProjectGroup } from '@/lib/hoursByPerson'
import { PersonWorkPackageCard } from './PersonWorkPackageCard'

/** Neutral count/flag chip — the app's one way of saying "and also this".
    `truncate` rather than `whitespace-nowrap`: in a narrow table cell a chip
    that overflows used to be cut mid-word with a hard edge, which reads as
    broken; an ellipsis reads as deliberate, and the full text is already on
    the `title` for anyone who needs it. */
export function Chip({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <span title={title} className="max-w-full truncate rounded-xs bg-neutral-100 px-sm py-xxss text-xs text-text-secondary">
      {children}
    </span>
  )
}

/** `1,234h / 1,500h`, or the honest version when nothing was budgeted. */
export function budgetPair(health: Health) {
  return health.budget > 0
    ? `${formatHours(health.actual)} / ${formatHours(health.budget)}`
    : `${formatHours(health.actual)} / no budget`
}

/** Remaining, signed in words rather than by colour alone. */
export function RemainingText({ health, bold = false }: { health: Health; bold?: boolean }) {
  if (health.budget <= 0) return <span className="text-text-muted">—</span>
  const over = health.remaining < 0
  return (
    <span className={over ? 'font-semibold text-danger' : bold ? 'font-semibold text-text-primary' : 'text-text-primary'}>
      {over ? `${formatHours(Math.abs(health.remaining))} over` : `${formatHours(health.remaining)} left`}
    </span>
  )
}

/**
 * Percentage over its meter — the pairing used in every other table here.
 *
 * `inline` lays the two side by side instead, meter first: the person header's
 * figure band gives each cell one line, and a stacked pair there would make
 * Used twice the height of the eleven figures beside it.
 */
export function UsedCell({ health, ariaLabel, bold = false, inline = false }: {
  health: Health
  ariaLabel: string
  bold?: boolean
  inline?: boolean
}) {
  const meter = (
    <span className="block shrink-0" style={{ width: 44 }}>
      <ProgressMeter health={health} size="sm" ariaLabel={ariaLabel} />
    </span>
  )
  if (inline) {
    return (
      <span className="flex items-center gap-base">
        {meter}
        <span className={`text-sm ${bold ? 'font-semibold' : ''} text-text-primary`}>{formatPct(health.progressPct)}</span>
      </span>
    )
  }
  return (
    <>
      <span className={`block text-sm ${bold ? 'font-semibold' : ''} text-text-primary`}>{formatPct(health.progressPct)}</span>
      <span className="mt-xxss">{meter}</span>
    </>
  )
}

/**
 * Remaining + its meter + the percentage, on one line — the merged figure the
 * reference design uses in place of two separate "Remaining" and "Used"
 * columns/figures. A reader was recombining them anyway ("−0.6h... and that's
 * 105%"), so one column now answers the one question, and it is most of how
 * the activity table (`PersonWorkPackageCard`) fits its pane without a
 * horizontal scrollbar. `bold` matches a Stat value (14px semibold, the
 * global spec); plain is the dense table row's regular 14px.
 */
export function RemainingUsedInline({ health, ariaLabel, bold = false }: { health: Health; ariaLabel: string; bold?: boolean }) {
  if (health.budget <= 0) return <span className="text-text-muted">—</span>
  const over = health.remaining < 0
  const size = bold ? 'text-sm font-semibold' : 'text-sm'
  return (
    /* `flex-nowrap` and a narrower meter: inside the activity table this is
       the widest cell, and `flex-wrap` let it break after the meter so a row
       ran to two lines. It stays one line now — the meter is the only part
       that can afford to give up pixels, since the two figures beside it
       are the data. */
    <span className="flex flex-nowrap items-center gap-xs">
      {/* Signed, per the reference: "−0.6h", not "0.6h over". The minus is
          what carries "over budget" without relying on the red, so the pair
          still reads correctly in monochrome — as does the percentage beside
          it, which is itself above 100. */}
      <span className={`whitespace-nowrap tabular-nums ${size} ${over ? 'text-danger' : 'text-text-primary'}`}>
        {over ? '−' : ''}{formatHours(Math.abs(health.remaining))}
      </span>
      <span className="shrink-0" style={{ width: 32 }}>
        <ProgressMeter health={health} size="sm" ariaLabel={ariaLabel} />
      </span>
      <span className={`whitespace-nowrap tabular-nums ${size} text-text-primary`}>{formatPct(health.progressPct)}</span>
    </span>
  )
}

/**
 * One figure in the project card's divided stat strip — the global `Stat`
 * pair inside this strip's own divider/padding wrapper.
 */
function HeaderStat({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    /* An explicit `border-l`, not the `divide-x` this strip used to carry:
       Tailwind v4 emits `@property --tw-divide-x-reverse` for that class but
       never the utility rule itself, so every child computed
       `border-left-width: 0` and the dividers the reference shows simply were
       not there. (ProjectWorkPackagesTab and ProjectTeamTab still use
       `divide-x` and have the same invisible-divider bug.)
     No `flex-1`: each stat keeps its own content width (so "Remaining /
       Used" — the widest, with its meter — never wraps), and `justify-between`
       on the parent spends the card's leftover width as equal gaps between
       them instead of stretching every stat to the same width, which starved
       that one figure of the room its meter needs. */
    <div className="border-l border-border-default px-2xl first:border-l-0 first:pl-0 last:pr-0">
      <Stat dl nowrap label={label} hint={hint}>{children}</Stat>
    </div>
  )
}

/**
 * One project of one person's work, opened out: the project's own roll-up, then
 * every work package under it with its activities.
 *
 * This is the level the old expandable row flattened away. Work package was a
 * *column* there — the same package title repeating down a list of activities,
 * with no sub-total of its own — so "how is the Certification Plan package
 * doing for me" could only be answered by adding rows up by hand. Here it is a
 * heading that carries its own figures, and the activities sit under it.
 */
export function PersonProjectPanel({ group, personName }: { group: PersonProjectGroup; personName: string }) {
  return (
    /* `grid gap-lg` with **no padding of its own** — exactly the right-hand
       column on Project Detail. The `p-lg` this used to carry inset every
       card 16px, so the first one started 16px below the rail beside it
       while Project Detail's two columns begin on the same line. Cards are
       flush to the column, the gap between them is the same 16px as every
       other section on both screens. */
    <div className="grid min-h-0 flex-1 auto-rows-min gap-lg overflow-auto">
      <article className="rounded-sm border border-border-default bg-neutral-25 px-lg py-lg">
        <div className="flex flex-wrap items-start justify-between gap-sm">
          <div className="min-w-0">
            {/* Title leads, the way a project's own detail page does — the
                code used to be a coloured chip in front of it, which put a
                6-character label ahead of the name a reader actually scans
                for. It moves to the subtitle line instead, plain text beside
                the counts it belongs with. */}
            <h2 className="truncate text-sm font-semibold text-text-primary">{group.projectTitle}</h2>
            {/* Neutral 500 / 12px / Regular — one step quieter than the
                title, since this line is context for it, not a second
                heading. */}
            <p className="mt-xs flex flex-wrap items-center gap-sm text-xs font-normal text-text-muted">
              <span className="tabular-nums">{group.projectLabel}</span>
              <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-border-strong" />
              <span>{group.packages.length} Work package{group.packages.length === 1 ? '' : 's'}</span>
              <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-border-strong" />
              <span>{group.lines.length} Activit{group.lines.length === 1 ? 'y' : 'ies'}</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-sm">
            {/* Both tags are `Badge`, not one Badge beside a hand-rolled
                span: the span had drifted to 14px/regular against the
                badge's 12px/semibold, which is exactly the mismatch a
                shared component prevents. Neutral tone gives the same
                `bg-neutral-100` the span carried. */}
            <Badge tone="neutral" size="md">
              {group.entries} Time {group.entries === 1 ? 'Entry' : 'Entries'}
            </Badge>
            <Badge tone={HEALTH_TONE[group.health.state]} size="md">{HEALTH_LABEL[group.health.state]}</Badge>
          </div>
        </div>

        {/* The project sub-total, spelled out rather than left to be added up
            from the packages below it. Remaining and Used share one figure —
            see RemainingUsedInline — so this strip and every activity row
            below answer that question the same way.
            `justify-between`, not a left-clustered row: each `HeaderStat` is
            `flex-1`, so the four figures span the card's full width with
            equal space between them instead of bunching at the left and
            leaving Banked stranded with empty card to its right. */}
        <dl className="mt-2xl flex items-stretch justify-between">
          <HeaderStat label="Actual / Budget">{budgetPair(group.health)}</HeaderStat>
          <HeaderStat label="Remaining / Used">
            <RemainingUsedInline health={group.health} ariaLabel={`${personName} on ${group.projectLabel}`} bold />
          </HeaderStat>
          <HeaderStat label="Overtime" hint="Worked beyond regular hours. No budget covers it, so it is never inside Actual.">
            {group.overtime > 0 ? formatHours(group.overtime) : '—'}
          </HeaderStat>
          <HeaderStat label="Banked" hint="Hours accrued to be taken as time off later, not spent on the project.">
            {group.banked > 0 ? formatHours(group.banked) : '—'}
          </HeaderStat>
        </dl>
      </article>

      {group.packages.map((pkg, i) => (
        <PersonWorkPackageCard key={pkg.workPackageId} pkg={pkg} personName={personName} defaultOpen={i === 0} />
      ))}
    </div>
  )
}

/**
 * Holiday, absence and training, which have no budget to be measured against —
 * so this panel has no budget columns at all rather than a row of dashes
 * pretending the question was asked and answered.
 */
type LineSortKey = 'activity' | 'hours' | 'entries'

const LINE_COLUMNS: { label: string; sort?: LineSortKey }[] = [
  { label: 'Activity', sort: 'activity' },
  { label: 'Hours', sort: 'hours' },
  { label: 'Entries', sort: 'entries' },
]

export function PersonNonProjectPanel({ lines, total, personName }: { lines: NonProjectLine[]; total: number; personName: string }) {
  const { sorted: sortedLines, sort, setSort } = useTableSort(lines, {
    activity: (l) => l.activityTitle,
    hours: (l) => l.hours,
    entries: (l) => l.entries,
  })

  return (
    /* Same shape as PersonProjectPanel: cards on the page's own tinted
       canvas, not one bordered box wrapping both a header and a table. The
       panel that hosts this component supplies no border of its own now —
       see PersonDetailPage — so this owns its own two, the same way the
       project card and each work-package card do. No padding here either,
       so its cards line up with the rail exactly as the project panel's do. */
    <div className="grid min-h-0 flex-1 auto-rows-min gap-lg overflow-auto">
      <article className="rounded-sm border border-border-default bg-neutral-25 px-lg py-lg">
        <h2 className="text-2xl font-bold text-text-primary">Non-project time</h2>
        <p className="mt-xs text-sm text-text-secondary">
          Holiday, absence and training. Not budgeted, and never counted inside the Actual figures above.
        </p>
        <dl className="mt-2xl flex flex-wrap items-stretch gap-y-base">
          <HeaderStat label="Total hours">{formatHours(total)}</HeaderStat>
          <HeaderStat label="Kinds of time">{lines.length}</HeaderStat>
          <HeaderStat label="Entries">{lines.reduce((s, l) => s + l.entries, 0)}</HeaderStat>
        </dl>
      </article>
      <section className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
        <table className="w-full border-collapse text-left" style={{ minWidth: 520 }}>
          <caption className="sr-only">{personName}: non-project time</caption>
          <thead>
            <tr className="border-b border-border-default bg-neutral-50">
              {LINE_COLUMNS.map((c) => (
                <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                  className="whitespace-nowrap px-base py-base text-xs font-semibold text-text-secondary">{c.label}</SortableTh>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedLines.map((l) => (
              <tr key={l.activityId} className="border-b border-border-default last:border-b-0">
                <th scope="row" className="px-base py-lg text-left text-sm font-normal text-text-primary">{l.activityTitle}</th>
                <td className="whitespace-nowrap px-base py-lg text-sm text-text-primary">{formatHours(l.hours)}</td>
                <td className="whitespace-nowrap px-base py-lg text-sm text-text-primary">{l.entries}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
