import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

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
 *
 * A long strip (GCP's subpart tabs, dozens wide) scrolls, but nothing said
 * so at a glance — client instruction, 2026-09-24: a full-height arrow cell
 * at the edge, white, divided from the tabs by a single stroke, so the strip
 * visibly stops somewhere rather than just running out, and clicking the
 * arrow pages the strip in that direction instead of leaving the reader to
 * guess they can drag-scroll it. Defaults to the right (there's more to see,
 * nothing to go back to yet); once scrolled to the end, the right arrow
 * drops and the left one takes over. Both can show at once in the middle of
 * a very long strip.
 */
export function TableTabs({ tabs, activeKey, onChange, ariaLabel }: TableTabsProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = () => {
    const el = listRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      observer.disconnect()
    }
    // Re-measure whenever the tab set itself changes (a filter changing how
    // many subpart tabs exist, for instance), not just on resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.length])

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

  const page = (direction: 1 | -1) => {
    const el = listRef.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div
        ref={listRef}
        role="tablist"
        aria-label={ariaLabel}
        className="scrollbar-none flex overflow-x-auto border-b border-border-default"
      >
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
              className={`-mb-px flex shrink-0 items-center gap-xs whitespace-nowrap border-b-2 px-base py-lg text-sm transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary
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

      {/* Each arrow is its own full-height cell at the strip's edge — the
          strip's own height, a white fill, and one stroke on the inner side
          dividing it from the tabs it scrolls (client instruction,
          2026-09-24, matching their reference). `border-b` carries the
          tablist's own bottom border across the cell so that line stays
          unbroken. Replaces the small floating rounded button that sat on a
          fade-to-white gradient: the stroke now does the work the fade used
          to, marking where the tabs stop, so the gradient is gone with it. */}
      {canScrollLeft && (
        <button
          type="button"
          aria-label="Scroll tabs left"
          onClick={() => page(-1)}
          className="absolute inset-y-0 left-0 flex w-5xl items-center justify-center border-b border-r border-border-default bg-neutral-25 text-text-secondary transition-colors duration-fast hover:bg-neutral-50 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary"
        >
          <ArrowLeft size={16} aria-hidden />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          aria-label="Scroll tabs right"
          onClick={() => page(1)}
          className="absolute inset-y-0 right-0 flex w-5xl items-center justify-center border-b border-l border-border-default bg-neutral-25 text-text-secondary transition-colors duration-fast hover:bg-neutral-50 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary"
        >
          <ArrowRight size={16} aria-hidden />
        </button>
      )}
    </div>
  )
}
