import { Select } from '@/components/ui/Select'

export interface ActiveSelectProps {
  id: string
  value: boolean
  onChange: (active: boolean) => void
  /** Wording for the inactive option where "Inactive" isn't what it's called
      (a retired activity, a superseded setting). Defaults to Inactive. */
  inactiveLabel?: string
}

/**
 * THE way `active` is set anywhere in the app: **a dropdown, never a checkbox.**
 *
 * A checkbox states one option and leaves the other implied, so an unticked box
 * is ambiguous — "not active yet" and "deliberately retired" look identical, and
 * the reader has to know which. Two named options say which state the record is
 * in and which it can be moved to, and they match how `active` already reads
 * everywhere it is *displayed*: an Active / Inactive badge, never a tick.
 */
export function ActiveSelect({ id, value, onChange, inactiveLabel = 'Inactive' }: ActiveSelectProps) {
  return (
    <Select id={id} value={value ? 'active' : 'inactive'} onChange={(e) => onChange(e.target.value === 'active')}>
      <option value="active">Active</option>
      <option value="inactive">{inactiveLabel}</option>
    </Select>
  )
}
