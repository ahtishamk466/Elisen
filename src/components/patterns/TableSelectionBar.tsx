import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Checkbox } from '@/components/ui/Checkbox'
import { useDropdown } from './useDropdown'

export interface TableSelectionBarProps {
  /** Rows currently selected. The bar only renders when this is above zero —
      the caller swaps it in for the header row, it never renders beside one. */
  selectedCount: number
  /** Every selectable row across the whole filtered list, not just the page. */
  totalCount: number
  /** Plural noun for the count, e.g. "projects". */
  itemLabel: string
  /** Select every row in the filtered list (all `totalCount` of them). */
  onSelectAll: () => void
  onClearAll: () => void
  /** Bulk action buttons — Duplicate, Delete, Export… — supplied by the page,
      because what a selection can *do* differs per table. */
  children?: ReactNode
}

const MENU_WIDTH = 176

/**
 * THE header a table shows while rows are selected: the column titles hand
 * their row over to *what the selection can do* — count, select-all menu and
 * the bulk actions — and come back the moment the selection is empty.
 *
 * One state lives in one place: the checked box, the count and the actions all
 * describe the same selection, so they share the row. The box is checked when
 * every row is selected and shows the minus when only some are; clicking it
 * always clears, because from here "uncheck" can only mean "stop selecting".
 */
export function TableSelectionBar({
  selectedCount, totalCount, itemLabel, onSelectAll, onClearAll, children,
}: TableSelectionBarProps) {
  const { open, setOpen, position, triggerRef, menuRef } = useDropdown<HTMLButtonElement>(MENU_WIDTH)
  const allSelected = selectedCount >= totalCount

  const pick = (fn: () => void) => () => { setOpen(false); fn() }

  return (
    <div className="flex flex-wrap items-center gap-base">
      <Checkbox
        checked={allSelected}
        indeterminate={!allSelected}
        onChange={onClearAll}
        aria-label={`Deselect all ${selectedCount} selected ${itemLabel}`}
      />
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-xs rounded-sm text-sm font-semibold text-text-primary transition-colors duration-fast hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
      >
        {selectedCount} selected
        {open ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
      </button>
      {children && <div className="flex flex-wrap items-center gap-sm">{children}</div>}

      {open && position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Selection"
            className="fixed z-dropdown overflow-y-auto rounded-sm border border-border-default bg-neutral-25 py-xs shadow-lg"
            style={{ ...position, width: MENU_WIDTH }}
          >
            <button
              type="button"
              role="menuitem"
              disabled={allSelected}
              onClick={pick(onSelectAll)}
              className="flex w-full items-center px-lg py-sm text-left text-sm text-text-primary transition-colors duration-fast hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-text-muted focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary"
            >
              Select all {totalCount}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={pick(onClearAll)}
              className="flex w-full items-center px-lg py-sm text-left text-sm text-text-primary transition-colors duration-fast hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary"
            >
              Unselect all
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}
