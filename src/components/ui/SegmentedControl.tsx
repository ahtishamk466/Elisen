import { useId } from 'react'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  /** Shown as a pill beside the label, as on `TableTabs`; omit for none. */
  count?: number
}

export interface SegmentedControlProps<T extends string> {
  /** Names the group for assistive tech, e.g. "Show rules". */
  ariaLabel: string
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
}

/**
 * One choice from a few, all in view: All / Active / Inactive. Native radio
 * inputs under the styling, so it is one tab stop and the arrow keys move the
 * choice, with no ARIA needed. 36px tall, the page-header row height, so it sits
 * level with the search beside it (COMPONENTS.md → "Control heights").
 */
export function SegmentedControl<T extends string>({ ariaLabel, options, value, onChange, disabled = false }: SegmentedControlProps<T>) {
  const name = useId()
  return (
    <fieldset disabled={disabled} className="inline-flex h-9 shrink-0 items-stretch gap-xxss rounded-sm border border-border-default bg-neutral-25 p-xxss disabled:opacity-50">
      <legend className="sr-only">{ariaLabel}</legend>
      {options.map((o) => {
        const selected = o.value === value
        return (
          <label key={o.value} className={`flex ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <input type="radio" name={name} value={o.value} checked={selected} onChange={() => onChange(o.value)} className="peer sr-only" />
            <span className={`flex items-center gap-xs whitespace-nowrap rounded-xs px-base text-sm transition-colors duration-fast peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-text-primary
              ${selected ? 'bg-accent-subtle font-semibold text-text-primary' : 'text-text-secondary hover:bg-neutral-50 hover:text-text-primary'}`}>
              {o.label}
              {o.count !== undefined && (
                <span className={`rounded-sm px-sm py-xxss text-xs font-medium tabular-nums ${selected ? 'bg-neutral-25 text-accent' : 'bg-neutral-100 text-text-secondary'}`}>{o.count}</span>
              )}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
