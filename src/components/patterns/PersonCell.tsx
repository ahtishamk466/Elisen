import { Avatar } from './Avatar'

export interface PersonCellProps {
  /** Empty renders the em dash — the table's standard "nothing here". */
  name: string
  /** `secondary` only shrinks the *label*; the avatar never changes. */
  variant?: 'primary' | 'secondary'
}

/**
 * THE way a person appears in a table or list: **initials avatar, then the
 * name**, in the one avatar design used app-wide.
 *
 * It exists to make the rule structural rather than remembered. A column of
 * bare names gives a reader nothing to aim at, and two people-columns styled
 * differently read as two different kinds of data when they are the same kind.
 * Use it for every person: responsible, contact, owner, employee, next action.
 *
 * `min-w-0` plus `truncate` on the label is what keeps the avatar inside the
 * cell: without it the flex child refuses to shrink below its text and pushes
 * the avatar past the column edge.
 */
export function PersonCell({ name, variant = 'primary' }: PersonCellProps) {
  if (!name || name === '—') return <span className="text-sm text-text-muted">—</span>
  return (
    <span className="flex min-w-0 items-center gap-xs">
      <Avatar name={name} size="sm" />
      <span className={`min-w-0 truncate ${variant === 'secondary' ? 'text-xs text-text-muted' : 'text-sm text-text-primary'}`}>
        {name}
      </span>
    </span>
  )
}
