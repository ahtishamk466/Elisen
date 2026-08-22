import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ListChecks, Search, Users } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { Avatar } from '@/components/patterns/Avatar'
import { EmptyState } from '@/components/patterns/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useTimesheetStore } from '@/stores/timesheetStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { useWorkPackagesStore } from '@/stores/workPackagesStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { employeeByName } from '@/lib/employeeFixtures'
import { summarisePeople, type PersonSummary } from '@/lib/hoursByPerson'
import { HEALTH_LABEL, HEALTH_TONE, formatHours, healthOf } from '@/lib/projectHealth'
import { HOURS_PERIODS, inPeriod, periodRange, periodRangeLabel, toHoursPeriod } from '@/lib/hoursPeriod'
import { Stat } from '@/components/patterns/Stat'
import { Chip, PersonNonProjectPanel, PersonProjectPanel, RemainingText, UsedCell, budgetPair } from './PersonProjectPanel'

const NON_PROJECT = 'non-project'

/** A person with a staff record but nothing logged in the chosen period still
    gets their identity, their stats (all zero) and an explanation — never a
    blank screen that reads as "this person does not exist". */
function emptyPerson(name: string): PersonSummary {
  const staff = employeeByName(name)
  return {
    name,
    designation: staff?.designation ?? 'Not on staff record',
    payrollGroup: staff?.payrollGroup ?? '—',
    employed: staff?.active ?? false,
    onStaff: !!staff,
    projects: [], nonProject: [], health: healthOf(0, 0),
    overtime: 0, banked: 0, nonProjectHours: 0, totalLogged: 0,
    entries: 0, unvalidated: 0, projectCount: 0, packageCount: 0,
    activityCount: 0, overCount: 0, budgetedCount: 0,
  }
}

/**
 * One person's hours, in full — reached by clicking their row in Hours Worked
 * → By Person.
 *
 * **Why it is a page and not an expanding row.** The old detail opened inside
 * the summary table: a second table, up to eight columns wide, nested in a cell
 * of an eleven-column one, listing every activity across every project flat.
 * On a busy person that was 40+ rows of three-level data with the levels
 * flattened out of it, and it pushed the next person's row a screen and a half
 * down. The information was all there and none of it was legible.
 *
 * So the same master–detail shape as ATA Chapters: the person's identity and
 * roll-up at the top, their projects on a rail, and the selected project opened
 * out into work packages and their activities. Nothing is dropped — every
 * figure, chip and flag the expanded row carried has a place here — but each
 * level now sits at its own level instead of being folded into a column.
 *
 * The period filter is on this screen rather than inherited from the list
 * because the question changes: the list asks "who is over budget", which wants
 * everything; the person view asks "what did they do in March", which wants one
 * window. See `lib/hoursPeriod.ts` for why the windows are whole calendar
 * periods rather than rolling ones.
 */
export function PersonDetailPage() {
  const { name: encoded } = useParams<{ name: string }>()
  const name = decodeURIComponent(encoded ?? '')
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const railRef = useRef<HTMLDivElement>(null)

  const allRows = useTimesheetStore((s) => s.rows)
  const projects = useProjectsStore((s) => s.rows)
  const workPackages = useWorkPackagesStore((s) => s.workPackages)
  const wpActivities = useWorkPackagesStore((s) => s.activities)
  const catalogActivities = useCatalogStore((s) => s.activities)

  const period = toHoursPeriod(searchParams.get('period'))
  const query = searchParams.get('q') ?? ''
  const setParam = (key: string, value: string | null) => {
    const p = new URLSearchParams(searchParams)
    if (value === null || value === '') p.delete(key)
    else p.set(key, value)
    setSearchParams(p, { replace: true })
  }

  /* Search is applied to the **rows**, not to the finished groups, so one rule
     scopes the header figures, the rail and the panel together — filtering the
     groups afterwards would leave the twelve figures above describing work the
     list below no longer shows. Project label, project title and work package
     title only: that is what the field says it searches. */
  const matchesQuery = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    const wpById = new Map(workPackages.map((w) => [w.id, w]))
    const projectById = new Map(projects.map((p) => [p.id, p]))
    return (projectId: string, workPackageId: string) => {
      const project = projectById.get(projectId)
      const label = project ? `${project.number}-${project.subNumber}` : ''
      const wp = wpById.get(workPackageId)
      return `${label} ${project?.title ?? ''} ${wp?.title ?? ''}`.toLowerCase().includes(q)
    }
  }, [query, workPackages, projects])

  const person = useMemo(() => {
    const range = periodRange(period)
    let rows = allRows.filter((r) => r.employeeName === name && inPeriod(r.workingDate, range))
    if (matchesQuery) rows = rows.filter((r) => matchesQuery(r.projectId, r.workPackageId))
    /* Assignments with no hours are shown only on All Time. Inside a window,
       "nothing logged in March" is not "not started" — the same rule the Hours
       Worked list applies when a date filter is on. */
    const wpById = new Map(workPackages.map((w) => [w.id, w]))
    const unstartedActivities = period === 'all'
      ? wpActivities.filter((a) => {
          if (a.responsible !== name) return false
          const wp = wpById.get(a.workPackageId)
          return !matchesQuery || (!!wp && matchesQuery(wp.projectId, a.workPackageId))
        })
      : []
    const summaries = summarisePeople({
      rows, workPackages, activities: wpActivities, projects, catalogActivities, unstartedActivities,
    })
    return summaries.find((p) => p.name === name) ?? emptyPerson(name)
  }, [allRows, name, period, matchesQuery, workPackages, wpActivities, projects, catalogActivities])

  /* Selection lives in the URL so a person's project is linkable. When the
     period change takes the selected project away, fall back to the busiest
     one rather than rewriting the URL from under the reader. */
  const selectedId = searchParams.get('project')
  const selectedGroup = person.projects.find((g) => g.projectId === selectedId)
  const showNonProject = selectedId === NON_PROJECT && person.nonProject.length > 0
  const active = selectedGroup ?? (showNonProject ? null : person.projects[0] ?? null)

  useEffect(() => {
    railRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active?.projectId, showNonProject])

  const hasData = person.projects.length > 0 || person.nonProject.length > 0

  return (
    <AppShell
      title={name}
      activeItem="Time Entry"
      activeChild="Hours Worked"
      fill
      headerLeft={
        <button
          type="button"
          onClick={() => navigate('/hours-worked?tab=by-person')}
          className="inline-flex items-center gap-sm rounded-sm text-sm text-text-secondary transition-colors duration-fast hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          <ArrowLeft size={18} aria-hidden />
          Go back to All Person
        </button>
      }
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 360 }}>
            <label htmlFor="person-search" className="sr-only">Search projects and work packages</label>
            <Input
              size="sm" id="person-search" value={query}
              onChange={(e) => setParam('q', e.target.value)}
              placeholder="Search projects, work package" leadingIcon={<Search size={16} />}
            />
          </div>
          {/* The window in dates rides on the control's own tooltip rather than
              a line under the name: "Last Week" is ambiguous read on a Monday,
              and this keeps the answer one hover away without adding a row the
              design doesn't have. */}
          <div className="min-w-0" style={{ width: 150 }} title={periodRangeLabel(period)}>
            <label htmlFor="person-period" className="sr-only">Time period</label>
            <Select
              id="person-period"
              size="sm"
              value={period}
              onChange={(e) => setParam('period', e.target.value === 'all' ? null : e.target.value)}
            >
              {HOURS_PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </Select>
          </div>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-lg">
        {/* ------- Who they are, and where they stand overall ------- */}
        {/* Identity and all twelve figures in **one card**: the four counts used
            to sit below as their own StatCard tiles, which read as a second,
            unrelated block and cost ~114px of the panes underneath. Header on
            white, figures on a tinted band under a divider. */}
        <section aria-label={`${name} summary`} className="shrink-0 overflow-hidden rounded-sm border border-border-default bg-neutral-25">
          <header className="flex flex-wrap items-center gap-sm px-lg py-lg">
            <Avatar name={name} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold text-text-primary">{name}</h1>
              <p className="flex flex-wrap items-center gap-sm text-sm text-text-secondary">
                <span className="truncate">{person.designation}</span>
                {person.onStaff && (
                  <>
                    <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-border-strong" />
                    <span>Payroll group {person.payrollGroup}</span>
                  </>
                )}
              </p>
            </div>
            {/* State in words before anything else: a badge tone is a
                reinforcement, never the only way to read the row. */}
            {!person.onStaff ? (
              <Badge tone="danger">Not on staff record</Badge>
            ) : !person.employed ? (
              <Badge tone="neutral">Former employee</Badge>
            ) : null}
            {person.unvalidated > 0 && (
              <Chip title="Entries an administrator has not validated yet">{person.unvalidated} Unvalidated</Chip>
            )}
            <Badge tone={HEALTH_TONE[person.health.state]}>{HEALTH_LABEL[person.health.state]}</Badge>
            <ActionsMenu
              ariaLabel={`Actions for ${name}`}
              items={[
                {
                  label: 'View time entries',
                  icon: <ListChecks size={16} />,
                  onSelect: () => navigate(`/hours-worked?employee=${encodeURIComponent(name)}`),
                },
              ]}
            />
          </header>

          {/* Inset 3px on every side from the card, per the reference design —
              not a spacing-scale value (the nearest tokens are xxss 2px and xs
              4px); flagged as a deliberate, exact deviation from DESIGN.md's
              token-only rule (CLAUDE.md rule 4) rather than rounded to the
              nearest token, since the ask was to match this pixel exactly. The
              radius sits on this wrapper, not the card, so it reads as its own
              inset panel instead of a full-bleed strip with a divider line. */}
          {/* neutral-100, not neutral-50: matched to the project card's stat
              strip and its work-package table header, so this screen's three
              tinted fills (this band, the selected rail row, every activity
              table header) are one colour rather than three close-but-not-
              identical shades. */}
          <div className="rounded-sm bg-neutral-100" style={{ margin: 3 }}>
          {/* Six across from laptop up, in the order the design sets: the three
              counts, then the budget question, then everything no budget covers.
              Three at tablet and two at mobile, so a figure never has to share a
              column with a value it isn't comparable to. */}
          <dl className="grid gap-2xl px-lg py-lg mobile:grid-cols-2 tablet:grid-cols-3 laptop:grid-cols-6">
            <Stat dl label="Project">{person.projectCount}</Stat>
            <Stat dl label="Work packages">{person.packageCount}</Stat>
            <Stat dl label="Activities">{person.activityCount}</Stat>
            <Stat dl label="Actual / Budget" hint="Regular project hours against the budget of the activities assigned to them.">
              {budgetPair(person.health)}
            </Stat>
            <Stat dl label="Remaining"><RemainingText health={person.health} /></Stat>
            <Stat dl label="Used">
              <UsedCell health={person.health} ariaLabel={`${name} budget across all projects`} inline />
            </Stat>
            <Stat dl label="Over budget" hint="Activities already past their own estimate — the figure a blended average buries.">
              {person.budgetedCount > 0
                ? <span className={person.overCount > 0 ? 'text-danger' : undefined}>
                    {person.overCount} of {person.budgetedCount} budgeted
                  </span>
                : '—'}
            </Stat>
            <Stat dl label="Total logged" hint="Regular + overtime + non-project: everything they were at work for.">
              {formatHours(person.totalLogged)}
            </Stat>
            <Stat dl label="Overtime" hint="Worked beyond regular hours. No budget covers it, so it is never inside Actual.">
              {person.overtime > 0 ? formatHours(person.overtime) : '—'}
            </Stat>
            <Stat dl label="Banked" hint="Accrued to be taken as time off later, not spent on a project.">
              {person.banked > 0 ? formatHours(person.banked) : '—'}
            </Stat>
            <Stat dl label="Non-project" hint="Holiday, absence and training. No budget covers it either.">
              {person.nonProjectHours > 0 ? formatHours(person.nonProjectHours) : '—'}
            </Stat>
            <Stat dl label="Time entries">{person.entries}</Stat>
          </dl>
          </div>
        </section>

        {!hasData ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<Users size={48} strokeWidth={1.5} />}
              title={
                query ? 'No projects or work packages match your search'
                  : period === 'all' ? `No hours recorded for ${name}`
                    : 'Nothing logged in this period'
              }
              description={
                query
                  ? `Nothing ${name} worked on${period === 'all' ? '' : ` in ${periodRangeLabel(period)}`} is called "${query}".`
                  : period === 'all'
                    ? 'No timesheet entries and no assignments exist for this name.'
                    : `${name} has no entries between ${periodRangeLabel(period)}. Try a wider period.`
              }
              action={(query || period !== 'all') && (
                <Button
                  variant="secondary"
                  onClick={() => { setSearchParams(new URLSearchParams(), { replace: true }) }}
                >
                  {query ? 'Clear search & period' : 'View all time'}
                </Button>
              )}
            />
          </div>
        ) : (
          /* Rail and panel each scroll inside a frame that ends at the fold —
             the same two-pane shape as ATA Chapters, so someone who has learned
             one has learned both. */
          <div className="grid min-h-0 flex-1 gap-lg laptop:grid-cols-[320px_minmax(0,1fr)]">
            <nav aria-label={`Projects ${name} worked on`} className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
              {/* The rail's own heading row — this is the "select a project"
                  control, so its labels carry heading weight (14px semibold,
                  Neutral 950) rather than the 12px muted a table's column
                  headers use. Both labels move together: styling only the
                  first would leave two mismatched labels in one row. */}
              <div className="flex shrink-0 items-center gap-sm border-b border-border-default bg-neutral-100 px-base py-sm">
                <span className="min-w-0 flex-1 text-sm font-semibold text-text-primary">Project</span>
                <span className="shrink-0 text-sm font-semibold text-text-primary">Work Packages</span>
              </div>
              <div ref={railRef} className="min-h-0 flex-1 overflow-y-auto">
                <ul>
                  {person.projects.map((g) => {
                    const isSel = !showNonProject && g.projectId === active?.projectId
                    return (
                      <li key={g.projectId} className="border-b border-border-default last:border-b-0">
                        <button
                          type="button"
                          onClick={() => setParam('project', g.projectId)}
                          aria-current={isSel ? 'true' : undefined}
                          className={`flex w-full items-center gap-sm border-l-2 px-base py-sm text-left transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary
                            ${isSel ? 'border-accent bg-neutral-100' : 'border-transparent hover:bg-neutral-50'}`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className={`block truncate text-sm tabular-nums text-text-primary ${isSel ? 'font-semibold' : ''}`}>
                              {g.projectLabel}
                            </span>
                            <span className="block truncate text-xs text-text-secondary">{g.projectTitle}</span>
                          </span>
                          <span aria-hidden className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full border border-border-default px-xs text-xs font-semibold tabular-nums text-text-secondary">
                            {g.packages.length}
                          </span>
                          <span className="sr-only">
                            Project {g.projectLabel}, {g.projectTitle}, {g.packages.length} work package{g.packages.length === 1 ? '' : 's'},
                            {' '}{HEALTH_LABEL[g.health.state]}
                          </span>
                        </button>
                      </li>
                    )
                  })}

                  {/* Last, and visually apart: it is time that exists but has no
                      budget, so it does not belong in the same run as the
                      projects it would otherwise be compared against. */}
                  {person.nonProject.length > 0 && (
                    <li className="border-t-2 border-border-default">
                      <button
                        type="button"
                        onClick={() => setParam('project', NON_PROJECT)}
                        aria-current={showNonProject ? 'true' : undefined}
                        className={`flex w-full items-center gap-sm border-l-2 px-base py-sm text-left transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary
                          ${showNonProject ? 'border-accent bg-neutral-100' : 'border-transparent hover:bg-neutral-50'}`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-sm text-text-primary ${showNonProject ? 'font-semibold' : ''}`}>Non-project time</span>
                          <span className="block truncate text-xs text-text-secondary">Holiday, absence, training</span>
                        </span>
                        <span aria-hidden className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full border border-border-default px-xs text-xs font-semibold tabular-nums text-text-secondary">
                          {person.nonProject.length}
                        </span>
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            </nav>

            <section
              aria-label={showNonProject ? 'Non-project time' : `Project ${active?.projectLabel ?? ''}`}
              /* No border, no radius, no background of its own: a bordered
                 box here was a fifth container wrapping the other four —
                 the project card plus three work-package cards each already
                 have their own border and corner radius. This is a layout
                 frame only; it sizes the scroll region within the grid
                 column. The tint each card needs to read as separate from
                 its neighbour still comes through — AppShell's own canvas
                 (the app root, `bg-neutral-50`) shows through a fully
                 transparent section exactly as it would through one painted
                 the same colour. */
              className="flex min-h-0 flex-col overflow-hidden"
            >
              {showNonProject ? (
                <PersonNonProjectPanel lines={person.nonProject} total={person.nonProjectHours} personName={name} />
              ) : active ? (
                <PersonProjectPanel group={active} personName={name} />
              ) : (
                <p className="px-lg py-base text-sm text-text-muted">Pick a project to see its work packages.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </AppShell>
  )
}
