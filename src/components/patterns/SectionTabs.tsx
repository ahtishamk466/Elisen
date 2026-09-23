export interface SectionTabsProps<T extends string> {
  tabs: readonly T[]
  active: T
  onChange: (tab: T) => void
  ariaLabel: string
  /** Optional count beside a label — omit a tab to leave it countless. */
  counts?: Partial<Record<T, number>>
}

/**
 * The section strip at the top of a detail page — Project Detail's Overview /
 * Work Packages / Team row, and the same row on TCCA Project Detail.
 *
 * Distinct from `TableTabs`: that one belongs to a table and renders as the
 * first child of its card, switching which rows are listed. This one switches
 * whole sections of a record, sits above the content it swaps, and carries the
 * page's own border.
 */
export function SectionTabs<T extends string>({ tabs, active, onChange, ariaLabel, counts }: SectionTabsProps<T>) {
  return (
    <nav className="flex gap-lg overflow-x-auto rounded-sm border border-border-default bg-neutral-25 px-lg" aria-label={ariaLabel}>
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          aria-current={active === t ? 'page' : undefined}
          className={`whitespace-nowrap border-b-2 py-base text-sm transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary
            ${active === t ? 'border-text-primary font-semibold text-text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}
        >
          {t}
          {counts?.[t] !== undefined && (
            <span
              className={`ml-sm rounded-sm px-sm py-xxss text-xs font-medium ${
                active === t ? 'bg-accent-subtle text-accent' : 'bg-neutral-100 text-text-secondary'
              }`}
            >
              {counts[t]}
            </span>
          )}
        </button>
      ))}
    </nav>
  )
}
