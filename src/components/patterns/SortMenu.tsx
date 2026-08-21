import { createPortal } from 'react-dom'
import { ArrowDown, ArrowUp, Check } from 'lucide-react'
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
 * them all: clicking it always opens the field picker, never sorts directly,
 * because a merged column has more than one reasonable "up".
 *
 * No icon at all until the column is actually the active sort — a resting
 * up-down glyph on every sortable heading reads as noise across a wide table,
 * and it was this heading's own "· Priority" suffix that used to overflow
 * into the next column on a narrow one. Active state is a single blue arrow
 * and nothing else: no field name, no "Selected" — the direction is the only
 * fact worth a permanent pixel here.
 */
export function SortMenu<K extends string>({ label, options, sort, onChange }: SortMenuProps<K>) {
  const { open, setOpen, position, triggerRef, menuRef } = useDropdown<HTMLButtonElement>(MENU_WIDTH)
  const active = options.find((o) => o.key === sort?.key)
  const Icon = active && sort ? (sort.dir === 'asc' ? ArrowUp : ArrowDown) : null

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
        {Icon && <Icon size={14} aria-hidden className="text-accent" />}
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
