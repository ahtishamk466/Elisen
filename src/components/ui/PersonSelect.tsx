import { SearchableSelect } from './SearchableSelect'

export interface PersonSelectProps {
  id: string
  /** Names, in the order they should appear. */
  people: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyLabel?: string
  error?: boolean
  disabled?: boolean
  /** `sm` (36px) in toolbar rows and filter panels; `md` (44px) in forms. */
  size?: 'sm' | 'md'
  ariaLabel?: string
}

/**
 * THE control for every person field: person responsible, contact, owner, next
 * action, employee, activity responsible.
 *
 * It exists to make one rule structural rather than remembered — **a name field
 * is always searchable, however short the list**. The app-wide "search over five
 * options" threshold is right for enums (a status, a priority, yes/no) where you
 * pick from a set you can see. Names are different: you already know who you
 * want, so typing three letters beats reading the list, and the demo's five
 * people become dozens in a real deployment.
 *
 * Use this instead of a `Select` over `PEOPLE` so a new person field can't
 * accidentally ship without search.
 */
export function PersonSelect({
  id, people, value, onChange,
  placeholder = 'Select a person...',
  emptyLabel = 'No people to choose from.',
  error = false, disabled = false, size = 'md', ariaLabel,
}: PersonSelectProps) {
  return (
    <SearchableSelect
      id={id}
      value={value}
      onChange={onChange}
      options={people.map((p) => ({ value: p, label: p }))}
      placeholder={placeholder}
      emptyLabel={emptyLabel}
      error={error}
      disabled={disabled}
      size={size}
      ariaLabel={ariaLabel}
      indicator="radio"
      // 0 = always show the search box. The point of this component.
      searchThreshold={0}
    />
  )
}
