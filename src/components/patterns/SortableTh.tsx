import type { CSSProperties, ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { TableSort } from './useTableSort'

export interface SortableThProps<K extends string> {
  /** The heading text. */
  children: ReactNode
  /** Omit to render a plain, unsortable heading — Actions and icon-only
      columns keep the same cell padding without becoming a button. */
  sortKey?: K
  /**
   * Every key this heading covers, for a cell whose control is a `SortMenu`
   * rather than this component's own button. The menu owns the click; the
   * cell still has to report `aria-sort` when any of its stacked fields is
   * the active one.
   */
  ownsKeys?: K[]
  sort?: TableSort<K>
  onSortChange?: (sort: TableSort<K>) => void
  /** Right-aligns the trigger to sit flush with a right-aligned body column.
      Rare here: table columns are left-aligned app-wide (COMPONENTS.md). */
  align?: 'right'
  /** The table's own heading classes — padding, size, width. Each table keeps
      its own; this component owns only the button and the sort state. */
  className?: string
  style?: CSSProperties
  colSpan?: number
}

/**
 * THE sortable column heading for every table in the app.
 *
 * Extracted from `ProjectsTable`, which carried the only sortable headings in
 * the app for months while 28 other tables rendered plain text — the same
 * table, the same reader, and no way to reorder it. The visuals are unchanged
 * from that original, so nothing new appears on screen: a resting neutral ⇅
 * marks a heading as clickable, and only the active column shows a single
 * accent arrow pointing the way the rows are ordered.
 *
 * The heading keeps the header row's own weight and colour whether or not it
 * is the active sort — darkening it made one heading read as a heavier font
 * than its neighbours, and the arrow already carries that state.
 *
 * For a cell holding two stacked fields, use `SortMenu` instead: it offers
 * each field rather than guessing which one the reader meant by "up".
 */
export function SortableTh<K extends string>({
  children, sortKey, ownsKeys, sort, onSortChange, align, className = '', style, colSpan,
}: SortableThProps<K>) {
  const active = !!sort && (sortKey ? sort.key === sortKey : !!ownsKeys?.includes(sort.key))
  const Icon = active && sort ? (sort.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <th
      scope="col"
      colSpan={colSpan}
      style={style}
      /* aria-sort belongs on the cell, not the button: it tells a screen
         reader how the column is ordered, which is a property of the column
         itself. */
      aria-sort={active && sort ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
      className={className}
    >
      {sortKey && onSortChange ? (
        <button
          type="button"
          onClick={() => onSortChange({ key: sortKey, dir: active && sort?.dir === 'asc' ? 'desc' : 'asc' })}
          /* `w-full` is what makes `justify-end` mean anything: a <button> is
             a form control, so it shrinks to fit its text even at
             `display:flex`, leaving the heading stranded left of a wide cell
             while the <th>'s own text-right has no inline content to move. */
          className={`flex items-center gap-xs whitespace-nowrap rounded-sm transition-colors duration-fast hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary
            ${align === 'right' ? 'w-full justify-end' : ''}`}
        >
          {children}
          <Icon size={14} aria-hidden className={active ? 'text-accent' : 'text-text-muted'} />
        </button>
      ) : (
        children
      )}
    </th>
  )
}
