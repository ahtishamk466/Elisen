import { createPortal } from 'react-dom'
import { ArrowDown, ArrowUp, ArrowUpDown, Check } from 'lucide-react'
import { useDropdown } from './useDropdown'

export interface SortOption<K extends string> {
  key: K
  label: string
}

export interface SortMenuProps<K extends string> {
  /** The column heading, e.g. "Remaining / Used". */
  label: string
  options: SortOption<K>[]
  sort?: { key: K; dir: 'asc' | 'desc' }
  onChange: (sort: { key: K; dir: 'asc' | 'desc' }) => void
}

const MENU_WIDTH = 220

/**
 * A column heading that sorts by any of the fields stacked inside it.
 *
 * Merging columns to kill horizontal scroll would otherwise cost a sort per
 * field folded away — four of them on the Projects table. The heading keeps
 * them all: it names the column, and says which of its fields the table is
 * currently sorted by ("Remaining / Used · Used ↓"), so a merged column is
 * never less capable than the columns it replaced.
 */
export function SortMenu<K extends string>({ label, options, sort, onChange }: SortMenuProps<K>) {
  const { open, setOpen, position, triggerRef, menuRef } = useDropdown<HTMLButtonElement>(MENU_WIDTH)
  const active = options.find((o) => o.key === sort?.key)
  const Icon = !active || !sort ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown

  const choose = (key: K) => {
    // Re-picking the active field flips direction, as a plain sort header does.
    const dir = sort?.key === key && sort.dir === 'asc' ? 'desc' : 'asc'
    onChange({ key, dir })
    setOpen(false)
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        /* One centred line: the arrow sits on the middle of the label, not at
           the top of a heading that may be two words long. */
        className={`flex items-center gap-xs whitespace-nowrap rounded-sm text-left transition-colors duration-fast hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary
          ${active ? 'text-text-primary' : ''}`}
      >
        <span className="whitespace-nowrap">{label}</span>
        {/* Which of the stacked fields is doing the sorting, so the arrow is
            never ambiguous on a column holding two numbers. */}
        {active && <span className="whitespace-nowrap text-xs font-normal text-accent">· {active.label}</span>}
        <Icon size={14} aria-hidden className={active ? 'text-accent' : 'text-text-muted'} />
      </button>
      {open && position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Sort by, in ${label}`}
            className="fixed z-dropdown overflow-y-auto rounded-sm border border-border-default bg-neutral-25 py-xs shadow-lg"
            style={{ ...position, width: MENU_WIDTH }}
          >
            <p className="px-lg py-xs text-xs font-semibold text-text-muted">Sort by</p>
            {options.map((o) => {
              const isActive = sort?.key === o.key
              return (
                <button
                  key={o.key}
                  type="button"
                  role="menuitem"
                  onClick={() => choose(o.key)}
                  className="flex w-full items-center justify-between gap-sm px-lg py-sm text-left text-sm text-text-primary transition-colors duration-fast hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary"
                >
                  <span>{o.label}</span>
                  {isActive && (
                    <span className="flex items-center gap-xs text-xs text-accent">
                      {sort!.dir === 'asc' ? 'Low to high' : 'High to low'}
                      <Check size={14} aria-hidden />
                    </span>
                  )}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </>
  )
}
