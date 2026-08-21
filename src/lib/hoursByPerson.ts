import { activityName, isNonProjectActivity } from './catalog'
import type { Activity } from '@/types/catalog'
import { employeeByName } from './employeeFixtures'
import { healthOf, type Health } from './projectHealth'
import type { TimesheetEntry } from '@/types/timesheet'
import type { ProjectListRow } from '@/types/project'
import type { WorkPackage, WorkPackageActivity, WorkPackageStatus } from '@/types/workPackage'

/**
 * Hours rolled up per person, across every project — the aggregate behind the
 * Hours Worked → By Person tab.
 *
 * ## Where each number comes from, and why
 *
 * **Actual hours come from the timesheet**, not from `activity.actualHours`.
 * "How many hours has this person worked" is a timesheet question: the
 * timesheet is the only record that knows *who* logged time, and the only one
 * carrying overtime and banked hours at all. The fixtures keep the two in step
 * (logged regular hours sum to the activity actual), so this tab and the
 * project's Work Packages tab agree.
 *
 * **Budget comes from the activity**, because that is the only place a budget
 * exists, and it counts for the person the activity is *assigned to*. Someone
 * logging time on a colleague's activity has hours but no budget of their own —
 * flagged rather than hidden, since silently giving them a share of someone
 * else's budget would make both people's percentages wrong.
 *
 * **Overtime, banked and non-project hours are never inside Actual.** No budget
 * covers them, so folding them in would push every hard-working person over
 * budget for reasons that have nothing to do with the estimate. They are real
 * hours, so they are reported — in their own columns.
 *
 * ## What the roll-up deliberately keeps
 *
 * A blended percentage hides a disaster: four projects averaging 95% can
 * contain one at 200%. So `overCount` travels with the average and the row
 * shows both — the badge says where the person stands overall, the count says
 * how many individual activities have already gone past their estimate.
 */

/** One activity a person has hours on, or is assigned to, in one project. */
export interface PersonActivityLine {
  key: string
  projectId: string
  projectLabel: string
  projectTitle: string
  workPackageId: string
  workPackageTitle: string
  activityId: string
  activityTitle: string
  /** 0 when the activity belongs to someone else. */
  budget: number
  /** Regular hours this person logged. */
  actual: number
  overtime: number
  banked: number
  entries: number
  unvalidated: number
  /** False = they logged time on work assigned to someone else. */
  assigned: boolean
  /** Who owns the activity, when it isn't them. */
  assignedTo: string
  /** Set when colleagues also logged time here, with the activity's own total. */
  sharedTotal: number
  health: Health
}

/**
 * A person's lines within one work package, with that package's sub-total.
 *
 * The level the flat grouping used to skip. A person's work is *organised* as
 * project → work package → activity, and a reader asking "where did my 40
 * hours on 3369 go" wants the package answer before the activity one — the
 * package is the unit of work that gets planned, quoted and reported on.
 */
export interface PersonPackageGroup {
  workPackageId: string
  workPackageTitle: string
  /** Absent when the package has been deleted out from under its hours. */
  status?: WorkPackageStatus
  lines: PersonActivityLine[]
  health: Health
  overtime: number
  banked: number
  entries: number
  unvalidated: number
}

/** A person's lines within one project, with that project's sub-total. */
export interface PersonProjectGroup {
  projectId: string
  projectLabel: string
  projectTitle: string
  /** Every line in the project, flat — the comparable-rows view. */
  lines: PersonActivityLine[]
  /** The same lines nested under their work package, for the detail view. */
  packages: PersonPackageGroup[]
  health: Health
  overtime: number
  banked: number
  entries: number
  unvalidated: number
}

/** General/absence time, which has no budget and no work package worth naming. */
export interface NonProjectLine {
  activityId: string
  activityTitle: string
  hours: number
  entries: number
}

export interface PersonSummary {
  name: string
  designation: string
  payrollGroup: string
  /** False for a former employee — history stays, they are just filtered out. */
  employed: boolean
  /** False when hours exist for a name with no staff record. */
  onStaff: boolean
  projects: PersonProjectGroup[]
  nonProject: NonProjectLine[]
  /** Budget vs regular project hours, across everything they own or logged. */
  health: Health
  overtime: number
  banked: number
  nonProjectHours: number
  /** Regular + overtime + non-project: everything they were at work for. */
  totalLogged: number
  entries: number
  unvalidated: number
  projectCount: number
  packageCount: number
  activityCount: number
  /** Lines over their budget — the figure a blended average would bury. */
  overCount: number
  /** How many of their activities carry a budget at all, to size `overCount`. */
  budgetedCount: number
}

export interface SummariseInput {
  /** Already filtered by date range, project, validation etc. */
  rows: TimesheetEntry[]
  workPackages: WorkPackage[]
  /**
   * **Every** assignment, unfiltered. Used only to look up who owns an activity
   * and what it was budgeted at, so a row logged against a colleague's activity
   * still resolves that colleague's name however the list is filtered.
   */
  activities: WorkPackageActivity[]
  projects: ProjectListRow[]
  /** The catalog, for activity names and the non-project flag. */
  catalogActivities: Activity[]
  /**
   * Assignments to show even with no hours logged against them — an assignment
   * sitting at zero is the one a manager most needs to see. Pass the same
   * filtering the rows got, or the list quietly ignores the active filters.
   *
   * Omit when the filters are about *when* or *what kind of* hours (a date
   * range, a validation state): "nothing logged in July" is not "not started",
   * and an activity with no entries can't satisfy a filter on entries.
   */
  unstartedActivities?: WorkPackageActivity[]
}

export function summarisePeople({
  rows, workPackages, activities, projects, catalogActivities, unstartedActivities = [],
}: SummariseInput): PersonSummary[] {
  const packageById = new Map(workPackages.map((w) => [w.id, w]))
  const projectById = new Map(projects.map((p) => [p.id, p]))
  const projectLabel = (id: string) => {
    const p = projectById.get(id)
    return p ? `${p.number}-${p.subNumber}` : '—'
  }

  /** Assignment lookup: which activity record covers this package + activity. */
  const assignmentOf = new Map<string, WorkPackageActivity>()
  for (const a of activities) assignmentOf.set(`${a.workPackageId}|${a.activityId}`, a)

  /** Total regular hours logged on each activity, by anyone — for the shared flag. */
  const loggedOnActivity = new Map<string, number>()
  for (const r of rows) {
    if (isNonProjectActivity(catalogActivities, r.activityId)) continue
    const k = `${r.workPackageId}|${r.activityId}`
    loggedOnActivity.set(k, (loggedOnActivity.get(k) ?? 0) + r.hoursRegular)
  }

  interface Bucket {
    line: Omit<PersonActivityLine, 'health'>
    people: Set<string>
  }
  const perPerson = new Map<string, Map<string, Bucket>>()
  const nonProjectPerPerson = new Map<string, Map<string, NonProjectLine>>()
  const seenNames = new Set<string>()

  const bucketFor = (person: string, key: string, seed: () => Omit<PersonActivityLine, 'health'>) => {
    let mine = perPerson.get(person)
    if (!mine) { mine = new Map(); perPerson.set(person, mine) }
    let b = mine.get(key)
    if (!b) { b = { line: seed(), people: new Set() }; mine.set(key, b) }
    return b
  }

  // 1. Timesheet rows — the record of who actually worked.
  for (const r of rows) {
    seenNames.add(r.employeeName)

    if (isNonProjectActivity(catalogActivities, r.activityId)) {
      let mine = nonProjectPerPerson.get(r.employeeName)
      if (!mine) { mine = new Map(); nonProjectPerPerson.set(r.employeeName, mine) }
      const line = mine.get(r.activityId)
        ?? { activityId: r.activityId, activityTitle: activityName(catalogActivities, r.activityId), hours: 0, entries: 0 }
      line.hours += r.hoursRegular + r.hoursOvertime
      line.entries += 1
      mine.set(r.activityId, line)
      continue
    }

    const wp = packageById.get(r.workPackageId)
    const key = `${r.workPackageId}|${r.activityId}`
    const assignment = assignmentOf.get(key)
    const assigned = assignment?.responsible === r.employeeName
    const b = bucketFor(r.employeeName, key, () => ({
      key, projectId: r.projectId, projectLabel: projectLabel(r.projectId),
      projectTitle: projectById.get(r.projectId)?.title ?? '—',
      workPackageId: r.workPackageId, workPackageTitle: wp?.title ?? '—',
      activityId: r.activityId, activityTitle: activityName(catalogActivities, r.activityId),
      budget: assigned ? assignment!.budgetHours : 0,
      actual: 0, overtime: 0, banked: 0, entries: 0, unvalidated: 0,
      assigned, assignedTo: assigned ? '' : assignment?.responsible ?? '',
      sharedTotal: 0,
    }))
    b.line.actual += r.hoursRegular
    b.line.overtime += r.hoursOvertime
    b.line.banked += r.bankHoursRegular
    b.line.entries += 1
    if (!r.validated) b.line.unvalidated += 1
  }

  // 2. Assignments with no hours logged against them.
  for (const a of unstartedActivities) {
    if (!a.responsible) continue
    const wp = packageById.get(a.workPackageId)
    if (!wp) continue
    seenNames.add(a.responsible)
    const key = `${a.workPackageId}|${a.activityId}`
    bucketFor(a.responsible, key, () => ({
      key, projectId: wp.projectId, projectLabel: projectLabel(wp.projectId),
      projectTitle: projectById.get(wp.projectId)?.title ?? '—',
      workPackageId: a.workPackageId, workPackageTitle: wp.title,
      activityId: a.activityId, activityTitle: activityName(catalogActivities, a.activityId),
      budget: a.budgetHours, actual: 0, overtime: 0, banked: 0, entries: 0,
      unvalidated: 0, assigned: true, assignedTo: '', sharedTotal: 0,
    }))
  }

  const summaries: PersonSummary[] = []

  for (const name of seenNames) {
    const staff = employeeByName(name)
    const buckets = [...(perPerson.get(name)?.values() ?? [])]

    const lines: PersonActivityLine[] = buckets.map((b) => {
      const total = loggedOnActivity.get(b.line.key) ?? 0
      // "Shared" only when someone else's hours are in there too.
      const sharedTotal = total > b.line.actual + 0.05 ? total : 0
      const complete = false
      return { ...b.line, sharedTotal, health: healthOf(b.line.budget, b.line.actual, complete) }
    })

    const byProject = new Map<string, PersonProjectGroup>()
    for (const line of lines) {
      let g = byProject.get(line.projectId)
      if (!g) {
        g = {
          projectId: line.projectId, projectLabel: line.projectLabel, projectTitle: line.projectTitle,
          lines: [], packages: [], health: healthOf(0, 0), overtime: 0, banked: 0, entries: 0, unvalidated: 0,
        }
        byProject.set(line.projectId, g)
      }
      g.lines.push(line)
      g.overtime += line.overtime
      g.banked += line.banked
      g.entries += line.entries
      g.unvalidated += line.unvalidated
    }
    for (const g of byProject.values()) {
      g.lines.sort((a, b) =>
        a.workPackageTitle.localeCompare(b.workPackageTitle) || a.activityTitle.localeCompare(b.activityTitle))
      g.health = healthOf(
        g.lines.reduce((s, l) => s + l.budget, 0),
        g.lines.reduce((s, l) => s + l.actual, 0),
      )

      /* The same lines again, nested under their package. Built from the
         sorted flat list so the packages come out in the order the flat view
         shows them, and every sub-total is the sum of the rows under it
         rather than a second, independently-derived figure that could drift. */
      const byPackage = new Map<string, PersonPackageGroup>()
      for (const line of g.lines) {
        let p = byPackage.get(line.workPackageId)
        if (!p) {
          p = {
            workPackageId: line.workPackageId, workPackageTitle: line.workPackageTitle,
            status: packageById.get(line.workPackageId)?.status,
            lines: [], health: healthOf(0, 0), overtime: 0, banked: 0, entries: 0, unvalidated: 0,
          }
          byPackage.set(line.workPackageId, p)
        }
        p.lines.push(line)
        p.overtime += line.overtime
        p.banked += line.banked
        p.entries += line.entries
        p.unvalidated += line.unvalidated
      }
      for (const p of byPackage.values()) {
        p.health = healthOf(
          p.lines.reduce((s, l) => s + l.budget, 0),
          p.lines.reduce((s, l) => s + l.actual, 0),
        )
      }
      g.packages = [...byPackage.values()]
    }

    const nonProject = [...(nonProjectPerPerson.get(name)?.values() ?? [])]
      .sort((a, b) => b.hours - a.hours || a.activityTitle.localeCompare(b.activityTitle))

    const budget = lines.reduce((s, l) => s + l.budget, 0)
    const actual = lines.reduce((s, l) => s + l.actual, 0)
    const overtime = lines.reduce((s, l) => s + l.overtime, 0)
    const banked = lines.reduce((s, l) => s + l.banked, 0)
    const entries = lines.reduce((s, l) => s + l.entries, 0) + nonProject.reduce((s, l) => s + l.entries, 0)
    const nonProjectHours = nonProject.reduce((s, l) => s + l.hours, 0)
    const budgeted = lines.filter((l) => l.budget > 0)

    summaries.push({
      name,
      designation: staff?.designation ?? 'Not on staff record',
      payrollGroup: staff?.payrollGroup ?? '—',
      employed: staff?.active ?? false,
      onStaff: !!staff,
      projects: [...byProject.values()].sort((a, b) => b.health.actual - a.health.actual || a.projectLabel.localeCompare(b.projectLabel)),
      nonProject,
      health: healthOf(budget, actual),
      overtime,
      banked,
      nonProjectHours,
      totalLogged: actual + overtime + nonProjectHours,
      entries,
      unvalidated: lines.reduce((s, l) => s + l.unvalidated, 0),
      projectCount: byProject.size,
      packageCount: new Set(lines.map((l) => l.workPackageId)).size,
      activityCount: lines.length,
      overCount: budgeted.filter((l) => l.health.state === 'over-budget').length,
      budgetedCount: budgeted.length,
    })
  }

  // Most hours first: whoever carries the load leads, and anyone over budget
  // surfaces near the top where it matters.
  return summaries.sort((a, b) => b.health.actual - a.health.actual || a.name.localeCompare(b.name))
}
