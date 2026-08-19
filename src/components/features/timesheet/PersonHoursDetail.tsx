import { useState } from 'react'
import { ProgressMeter } from '@/components/patterns/ProgressMeter'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { HEALTH_LABEL, HEALTH_TONE, formatHours, formatPct } from '@/lib/projectHealth'
import type { PersonActivityLine, PersonSummary } from '@/lib/hoursByPerson'

const COLUMNS = [
  'Project / Work Package', 'Activity', 'Actual / Budget', 'Remaining',
  'Used', 'Status', 'Time Entries', 'Notes',
]

/** Neutral count/flag chip — the app's one way of saying "and also this". */
function Chip({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <span title={title} className="whitespace-nowrap rounded-sm bg-neutral-100 px-sm py-xxss text-xs text-text-secondary">
      {children}
    </span>
  )
}

function hours(n: number, dash = false) {
  return dash && n <= 0 ? '—' : formatHours(n)
}

/**
 * What one person's hours are made of, when their summary row is expanded.
 *
 * **Grouped flat, not nested.** Cross-project detail is three levels deep
 * (project → work package → activity) and a three-deep accordion is unreadable.
 * So it is one table with a project header row and a project sub-total, which
 * stays scannable and keeps every activity on a directly comparable line.
 *
 * Non-project time sits in its own group at the end with no budget columns,
 * because holiday and sick leave have no budget to be measured against.
 *
 * Busy people span a lot of projects, so only the busiest few open by default —
 * with the rest one click away and **the number said out loud**, never a silent
 * truncation that reads as "this is all of it".
 */
const PROJECT_LIMIT = 5

export function PersonHoursDetail({ person }: { person: PersonSummary }) {
  const [showAll, setShowAll] = useState(false)
  const hidden = Math.max(0, person.projects.length - PROJECT_LIMIT)
  const groups = showAll ? person.projects : person.projects.slice(0, PROJECT_LIMIT)
  const notes = (line: PersonActivityLine) => {
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
        <Chip key="shared" title={`${formatHours(line.sharedTotal)} logged on this activity in total, ${formatHours(line.actual)} of it by ${person.name}`}>
          Shared, {formatHours(line.sharedTotal)} total
        </Chip>,
      )
    }
    if (line.unvalidated > 0) {
      out.push(<Chip key="unvalidated" title="Hours not yet validated by an administrator">{line.unvalidated} unvalidated</Chip>)
    }
    if (line.entries === 0 && line.budget > 0) {
      out.push(<Chip key="none" title="Assigned, but no hours logged yet">Not started</Chip>)
    }
    return out.length > 0 ? <span className="flex flex-wrap gap-xs">{out}</span> : <span className="text-sm text-text-muted">—</span>
  }

  return (
    /* Its own card on the tinted row rather than a slab bolted to the table:
       the inset is what makes the detail read as belonging to the person above
       it instead of breaking the container. */
    <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left" style={{ minWidth: 1080 }}>
        <caption className="sr-only">
          {person.name}: every activity with hours or an assignment, grouped by project
        </caption>
        <thead>
          <tr className="border-b border-border-default">
            {COLUMNS.map((h) => (
              <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-xs font-semibold text-text-secondary">{h}</th>
            ))}
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.projectId} className="border-b border-border-default last:border-b-0">
            {/* Project header carries its own sub-total, so a person on four
                projects can see which one is the problem without adding them up. */}
            <tr className="bg-neutral-50">
              <th scope="colgroup" colSpan={2} className="px-lg py-base text-left">
                <span className="text-sm font-semibold text-text-primary">{group.projectLabel}</span>
                <span className="ml-sm text-xs text-text-secondary">{group.projectTitle}</span>
              </th>
              <td className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-primary">
                {group.health.budget > 0 ? `${hours(group.health.actual)} / ${hours(group.health.budget)}` : `${hours(group.health.actual)} / no budget`}
              </td>
              <td className={`whitespace-nowrap px-lg py-base text-sm font-semibold ${group.health.remaining < 0 ? 'text-danger' : 'text-text-primary'}`}>
                {group.health.budget > 0 ? `${group.health.remaining < 0 ? '−' : ''}${formatHours(Math.abs(group.health.remaining))}` : '—'}
              </td>
              <td className="whitespace-nowrap px-lg py-base">
                <span className="block text-sm font-semibold text-text-primary">{formatPct(group.health.progressPct)}</span>
                <span className="mt-xxss block" style={{ width: 44 }}>
                  <ProgressMeter health={group.health} size="sm" ariaLabel={`${person.name} on ${group.projectLabel}`} />
                </span>
              </td>
              <td className="whitespace-nowrap px-lg py-base"><Badge tone={HEALTH_TONE[group.health.state]}>{HEALTH_LABEL[group.health.state]}</Badge></td>
              <td className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-primary">{group.entries}</td>
              <td className="px-lg py-base">
                {group.overtime > 0 || group.banked > 0 ? (
                  <span className="flex flex-wrap gap-xs">
                    {group.overtime > 0 && <Chip title="Overtime, which no budget covers">{formatHours(group.overtime)} OT</Chip>}
                    {group.banked > 0 && <Chip title="Banked hours accrued, not spent on the project">{formatHours(group.banked)} banked</Chip>}
                  </span>
                ) : <span className="text-sm text-text-muted">—</span>}
              </td>
            </tr>
            {group.lines.map((line) => (
              <tr key={line.key} className="border-t border-border-default">
                <td className="px-lg py-base text-sm text-text-primary">{line.workPackageTitle}</td>
                <td className="px-lg py-base text-sm text-text-primary">{line.activityTitle}</td>
                <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">
                  {line.budget > 0 ? `${hours(line.actual)} / ${hours(line.budget)}` : `${hours(line.actual)} / no budget`}
                </td>
                <td className={`whitespace-nowrap px-lg py-base text-sm ${line.health.remaining < 0 ? 'font-semibold text-danger' : 'text-text-primary'}`}>
                  {line.budget > 0 ? `${line.health.remaining < 0 ? '−' : ''}${formatHours(Math.abs(line.health.remaining))}` : '—'}
                </td>
                <td className="whitespace-nowrap px-lg py-base">
                  <span className="block text-sm text-text-primary">{formatPct(line.health.progressPct)}</span>
                  <span className="mt-xxss block" style={{ width: 44 }}>
                    <ProgressMeter health={line.health} size="sm" ariaLabel={`${line.activityTitle} budget`} />
                  </span>
                </td>
                <td className="whitespace-nowrap px-lg py-base"><Badge tone={HEALTH_TONE[line.health.state]}>{HEALTH_LABEL[line.health.state]}</Badge></td>
                <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{line.entries}</td>
                <td className="px-lg py-base">{notes(line)}</td>
              </tr>
            ))}
          </tbody>
        ))}

        {person.nonProject.length > 0 && (
          <tbody>
            <tr className="border-t border-border-default bg-neutral-50">
              <th scope="colgroup" colSpan={2} className="px-lg py-base text-left">
                <span className="text-sm font-semibold text-text-primary">Non-project time</span>
                <span className="ml-sm text-xs text-text-secondary">Holiday, absence, training. Not budgeted.</span>
              </th>
              <td className="whitespace-nowrap px-lg py-base text-sm text-text-muted">—</td>
              <td className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-primary">{formatHours(person.nonProjectHours)}</td>
              <td colSpan={5} className="px-lg py-base text-sm text-text-muted">Excluded from budget figures</td>
            </tr>
            {person.nonProject.map((line) => (
              <tr key={line.activityId} className="border-t border-border-default">
                <td className="px-lg py-base text-sm text-text-primary">General &amp; Absence</td>
                <td className="px-lg py-base text-sm text-text-primary">{line.activityTitle}</td>
                <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{formatHours(line.hours)}</td>
                <td colSpan={3} className="px-lg py-base text-sm text-text-muted">—</td>
                <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{line.entries}</td>
                <td className="px-lg py-base text-sm text-text-muted">—</td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
      </div>
      {hidden > 0 && (
        <div className="border-t border-border-default px-lg py-base">
          <Button variant="secondary" size="sm" onClick={() => setShowAll((v) => !v)}>
            {showAll
              ? `Show the ${PROJECT_LIMIT} busiest projects only`
              : `Show all ${person.projects.length} projects (${hidden} more)`}
          </Button>
        </div>
      )}
    </div>
  )
}
