import { useCallback, useMemo, useRef, useState } from 'react'

export type SortDir = 'asc' | 'desc'

export interface TableSort<K extends string = string> {
  key: K
  dir: SortDir
}

/** What a column sorts on. Booleans sort false-then-true ascending, so an
    Active column reads Inactive → Active the way its badge pair does. */
export type SortValue = string | number | boolean | null | undefined

/** One accessor per sortable column key — the value that column sorts on,
    which is rarely the string in the cell (a badge sorts by its underlying
    status, a two-line cell by whichever line the heading names). */
export type SortAccessors<T, K extends string> = Record<K, (row: T) => SortValue>

const isBlank = (v: SortValue) => v === null || v === undefined || v === ''

/**
 * `numeric` is what makes `3200-00` sort before `3300-01` instead of after
 * `32000` — project, approval and document numbers all read as digits to a
 * user, never as text. `sensitivity: 'base'` keeps a lower-case entry from
 * sorting into its own block after the capitals.
 */
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

function compare(a: SortValue, b: SortValue): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'boolean' || typeof b === 'boolean') return Number(a) - Number(b)
  return collator.compare(String(a), String(b))
}

/**
 * Blanks sink in **both** directions rather than flipping to the top on
 * descending: an em dash is the absence of a value, not a value lower than
 * every other one, and a column of them arriving first buries the rows the
 * reader actually sorted for.
 */
function compareRows(a: SortValue, b: SortValue, dir: SortDir): number {
  const aBlank = isBlank(a)
  const bBlank = isBlank(b)
  if (aBlank && bBlank) return 0
  if (aBlank) return 1
  if (bBlank) return -1
  return compare(a, b) * (dir === 'asc' ? 1 : -1)
}

export interface UseTableSortOptions<K extends string> {
  /** Sort applied before the reader touches a heading. Omit to keep the
      order the page already built (usually a deliberate fixture order). */
  initial?: TableSort<K>
  /** Fires on every sort change — pass `reset` from `useInfiniteReveal` so a
      re-sort shows the new first page rather than the old row count. */
  onSortChange?: () => void
}

/**
 * Sort state plus the sorted rows for one table.
 *
 * The rows go in already filtered and searched; sorting is the last step
 * before `slice(0, visibleCount)`, so it orders the whole result set rather
 * than only the page that happens to be revealed.
 *
 * `Array.prototype.sort` is stable, so rows with equal values keep the order
 * the page gave them — a second sort never reshuffles ties.
 */
export function useTableSort<T, K extends string>(
  rows: T[],
  accessors: SortAccessors<T, K>,
  options: UseTableSortOptions<K> = {},
) {
  const [sort, setSortState] = useState<TableSort<K> | undefined>(options.initial)

  /* Held in a ref so a caller can pass an object literal without wrapping it
     in its own useMemo — the accessors are pure lookups, and making 28 call
     sites memoize them would be the kind of ceremony that gets skipped. */
  const accessorsRef = useRef(accessors)
  accessorsRef.current = accessors
  const onChangeRef = useRef(options.onSortChange)
  onChangeRef.current = options.onSortChange

  const setSort = useCallback((next: TableSort<K>) => {
    setSortState(next)
    onChangeRef.current?.()
  }, [])

  const sorted = useMemo(() => {
    if (!sort) return rows
    const get = accessorsRef.current[sort.key]
    if (!get) return rows
    return [...rows].sort((a, b) => compareRows(get(a), get(b), sort.dir))
  }, [rows, sort])

  return { sorted, sort, setSort }
}
