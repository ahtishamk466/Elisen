import { useEffect, useRef } from 'react'

export interface TableTab {
  key: string
  label: string
  /** Shown as a pill beside the label; omit for no count. */
  count?: number
}

export interface TableTabsProps {
  tabs: TableTab[]
  activeKey: string
  onChange: (key: string) => void
  /** Names the tablist for screen readers, e.g. "Review presets". */
  ariaLabel: string
}

/**
 * Tabs that read as the table's own header rather than a separate control:
 * they sit inside the table's bordered card, and the active tab is marked by
 * an accent underline that sits *on* the card's dividing line (via -mb-px) so
 * the selected tab visually joins the rows below it.
 *
 * Real ARIA tabs — the table below is the tabpanel — so arrow keys move
 * between tabs and only the active tab is a tab stop (roving tabindex).
 */
export function TableTabs({ tabs, activeKey, onChange, ariaLabel }: TableTabsProps) {
  const listRef = useRef<HTMLDivElement>(null)

  // The strip scrolls when the tabs overflow a narrow viewport, so a
  // half-visible tab always pulls itself fully into view once selected —
  // whatever selected it (click, arrow key, or state elsewhere).
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeKey])

  const focusTab = (index: number) => {
    const next = (index + tabs.length) % tabs.length
    onChange(tabs[next].key)
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); focusTab(index + 1) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); focusTab(index - 1) }
    else if (e.key === 'Home') { e.preventDefault(); focusTab(0) }
    else if (e.key === 'End') { e.preventDefault(); focusTab(tabs.length - 1) }
  }

  return (
    <div ref={listRef} role="tablist" aria-label={ariaLabel} className="scrollbar-none flex overflow-x-auto border-b border-border-default">
      {tabs.map((tab, i) => {
        const selected = tab.key === activeKey
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`-mb-px flex shrink-0 items-center gap-xs whitespace-nowrap border-b-2 px-base py-base text-sm transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary
              ${selected
                ? 'border-accent font-semibold text-text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`rounded-sm px-sm py-xxss text-xs font-medium ${selected ? 'bg-accent-subtle text-accent' : 'bg-neutral-100 text-text-secondary'}`}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
