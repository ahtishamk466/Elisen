import { WORK_PACKAGES, WP_ACTIVITIES } from './workPackageFixtures'
import { ACTIVITY_TASK_LINKS, TASKS } from './catalogFixtures'
import { DOCUMENTS, DOC_REVISIONS } from './documentFixtures'
import type { TimesheetEntry } from '@/types/timesheet'

/** The signed-in demo user for the self-service Timesheet screen. */
export const CURRENT_EMPLOYEE = 'Lloyd Pedvis'

/**
 * Obviously-fake demo data, **generated from the activity assignments** rather
 * than typed out, so one invariant holds by construction:
 *
 *   the regular hours logged against an activity sum to that activity's
 *   `actualHours`.
 *
 * That is what stops Hours by Person (which totals timesheet rows) from ever
 * disagreeing with the project's Work Packages tab (which totals activity
 * actuals). Hand-written rows drifted from the activity figures the moment
 * either side was edited.
 *
 * Everything is index-derived, never random: the same dataset has to come back
 * on every reload or the numbers in a screenshot stop matching the app.
 *
 * Deliberately included, because each one breaks a screen that assumes it away:
 * - **overtime and banked hours**, which no budget covers, so they are extra to
 *   `actualHours` and never folded into it;
 * - **non-project time** (GEN holiday / sick / training) against 0000-00;
 * - **shared activities**, where someone logs time on work assigned to a
 *   colleague, so per-person hours and per-activity hours attribute differently;
 * - **a former employee** (Gordon MacLeod) with history but no assignments;
 * - **unvalidated rows**, since a summary that silently counts unverified hours
 *   presents them as fact.
 */

/** Deterministic 0..n-1 from a string — stands in for a seeded shuffle. */
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

const DAY_MS = 86_400_000
/**
 * The demo's "today", which **follows the real one**.
 *
 * It used to be pinned to 2026-07-31. Every entry is generated as an offset
 * back from here, so once the wall clock passed that date the whole timesheet
 * became historical: Hours Worked's This Week and This Month periods returned
 * nothing at all, and the newest entry on the system was always further in the
 * past each day the demo was opened. Anchoring to the current date keeps the
 * fixture's *shape* — roughly 120 working days of history, Gordon MacLeod's
 * hours still stranded ~200 days back — while keeping the recent end of it
 * recent.
 */
const today = new Date()
const PERIOD_END = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())

/** Working date `back` days before the period end, skipping weekends. */
function workingDate(back: number): string {
  let d = new Date(PERIOD_END - back * DAY_MS)
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d = new Date(d.getTime() - DAY_MS)
  return d.toISOString().slice(0, 10)
}

/** Split `total` into `parts` pieces of one decimal that sum back exactly. */
function split(total: number, parts: number): number[] {
  if (total <= 0) return []
  const out: number[] = []
  let left = Math.round(total * 10)
  for (let i = parts; i > 1; i -= 1) {
    const piece = Math.max(1, Math.round(left / i))
    out.push(piece)
    left -= piece
  }
  out.push(left)
  return out.filter((n) => n > 0).map((n) => n / 10)
}

const PROJECT_OF = new Map(WORK_PACKAGES.map((w) => [w.id, w.projectId]))

/** Task names an activity actually offers, from the catalog's own links — a
    logged task that its activity doesn't carry would be unreachable in the
    Time Entry form, so the demo data must not invent one. */
const TASK_NAME = new Map(TASKS.map((t) => [t.id, t.name]))
const TASKS_FOR_ACTIVITY = ACTIVITY_TASK_LINKS.reduce<Record<string, string[]>>((acc, l) => {
  const name = TASK_NAME.get(l.taskId)
  if (name) (acc[l.activityId] ??= []).push(name)
  return acc
}, {})

/** Deliverable revisions raised for each project, so an entry can only point at
    a deliverable that exists on the project it was logged against. */
const DELIVERABLE_IDS = new Set(DOCUMENTS.filter((d) => d.kind === 'deliverable').map((d) => d.id))
const REVISIONS_FOR_PROJECT = DOC_REVISIONS.reduce<Record<string, string[]>>((acc, r) => {
  if (DELIVERABLE_IDS.has(r.documentId)) (acc[r.initialProjectId] ??= []).push(r.id)
  return acc
}, {})

const NON_PROJECT_MIX: { activityId: string; hours: number; comment: string }[] = [
  { activityId: 'gen-holiday', hours: 8, comment: 'Statutory holiday.' },
  { activityId: 'gen-sick', hours: 8, comment: 'Sick day.' },
  { activityId: 'gen-training', hours: 4, comment: 'Recurrent human factors training.' },
  { activityId: 'gen-internal', hours: 2, comment: 'Design review meeting.' },
  { activityId: 'gen-paid-absence', hours: 8, comment: 'Approved paid absence.' },
]

function build(): TimesheetEntry[] {
  const rows: TimesheetEntry[] = []
  let n = 0
  const push = (r: Omit<TimesheetEntry, 'id'>) => { n += 1; rows.push({ ...r, id: `ts-${n}` }) }

  WP_ACTIVITIES.forEach((activity, index) => {
    const projectId = PROJECT_OF.get(activity.workPackageId)
    if (!projectId || activity.actualHours <= 0) return

    const seed = hash(activity.id)
    // A few activities are worked by two people. Hours still sum to the
    // activity's actual — only the attribution differs, which is exactly the
    // case that makes "whose hours are these" a different question from "what
    // did this activity cost".
    const shared = seed % 12 === 0
    // Two activities carry a slice logged by the former employee, so his
    // history is part of the activity total rather than extra to it.
    const former = index === 6 || index === 14
    const pieces = split(activity.actualHours, 1 + (seed % 3))

    pieces.forEach((hours, i) => {
      const last = i === pieces.length - 1
      // The colleague is picked from the assignment list, so a shared row is
      // always someone who actually works here.
      const other = WP_ACTIVITIES[(index + 5) % WP_ACTIVITIES.length].responsible
      const employeeName = former && last ? 'Gordon MacLeod'
        : shared && last && other !== activity.responsible ? other
          : activity.responsible

      push({
        employeeName,
        projectId,
        workPackageId: activity.workPackageId,
        activityId: activity.activityId,
        // Not every entry names a task or a deliverable — roughly two in three
        // do, which is what the client's own data looks like.
        task: (() => {
          const options = TASKS_FOR_ACTIVITY[activity.activityId] ?? []
          return options.length > 0 && (seed + i) % 3 !== 0 ? options[(seed + i) % options.length] : ''
        })(),
        deliverableRevisionId: (() => {
          const options = REVISIONS_FOR_PROJECT[projectId] ?? []
          return options.length > 0 && (seed + i) % 3 !== 1 ? options[(seed + i) % options.length] : ''
        })(),
        // The former employee's slice is old, as history should be.
        workingDate: workingDate(employeeName === 'Gordon MacLeod' ? 200 + i * 3 : (seed + i * 7) % 120),
        hoursRegular: hours,
        // Overtime is extra to the budgeted actual, never part of it.
        hoursOvertime: seed % 9 === 0 && i === 0 ? 1 + (seed % 3) : 0,
        // Banked hours are accrued, not spent on the project.
        bankHoursRegular: seed % 14 === 0 && i === 0 ? 2 : 0,
        comment: '',
        // Older entries are validated; recent ones are still pending, which is
        // how a real month looks mid-review.
        validated: (seed + i) % 4 !== 0,
        // `active` voids an entry; it says nothing about whether the person
        // still works here. A couple are voided so the filter has something.
        active: !(seed % 37 === 0 && i === 0),
      })
    })
  })

  // Non-project time for the current staff, against 0000-00.
  const genPackage = WORK_PACKAGES.find((w) => w.id === 'wp-gen')
  const staff = [...new Set(WP_ACTIVITIES.map((a) => a.responsible))]
  if (genPackage) {
    staff.forEach((employeeName, i) => {
      NON_PROJECT_MIX.slice(0, 2 + (i % 3)).forEach((gen, j) => {
        push({
          employeeName,
          projectId: genPackage.projectId,
          workPackageId: genPackage.id,
          activityId: gen.activityId,
          task: '',
          deliverableRevisionId: '',
          workingDate: workingDate((i * 11 + j * 9) % 90),
          hoursRegular: gen.hours,
          hoursOvertime: 0,
          bankHoursRegular: 0,
          comment: gen.comment,
          validated: true,
          active: true,
        })
      })
    })

  }

  return rows
}

export const TIMESHEET_ENTRIES: TimesheetEntry[] = build()
