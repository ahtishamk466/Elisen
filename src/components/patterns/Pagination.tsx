import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import { Select } from '@/components/ui/Select'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export interface PaginationProps {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
  /** Plural noun for the count, e.g. "projects" — defaults to "items". */
  itemLabel?: string
}

const jumpBtn = 'inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border-default text-text-primary transition-colors duration-fast hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-text-muted disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary'

export function Pagination({
  page, pageSize, totalItems, onPageChange, onPageSizeChange, pageSizeOptions = PAGE_SIZE_OPTIONS, itemLabel = 'items',
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)
  const atFirst = page <= 1
  const atLast = page >= pageCount

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg py-base"
    >
      <div className="flex items-center gap-sm">
        <label htmlFor="pagination-page-size" className="text-sm text-text-secondary">Page Size:</label>
        <div style={{ width: 88 }}>
          <Select
            id="pagination-page-size"
            value={pageSize}
            onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(1) }}
          >
            {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </div>
      </div>

      <p className="text-sm text-text-secondary">
        {totalItems === 0 ? `No ${itemLabel}` : `Showing ${start} to ${end} of ${totalItems} ${itemLabel}`}
      </p>

      <div className="flex items-center gap-xs">
        <button type="button" aria-label="First page" onClick={() => onPageChange(1)} disabled={atFirst} className={jumpBtn}>
          <ChevronsLeft size={16} aria-hidden />
        </button>
        <button type="button" aria-label="Previous page" onClick={() => onPageChange(page - 1)} disabled={atFirst} className={jumpBtn}>
          <ChevronLeft size={16} aria-hidden />
        </button>
        <span className="px-sm text-sm text-text-primary" aria-live="polite">Page {page} of {pageCount}</span>
        <button type="button" aria-label="Next page" onClick={() => onPageChange(page + 1)} disabled={atLast} className={jumpBtn}>
          <ChevronRight size={16} aria-hidden />
        </button>
        <button type="button" aria-label="Last page" onClick={() => onPageChange(pageCount)} disabled={atLast} className={jumpBtn}>
          <ChevronsRight size={16} aria-hidden />
        </button>
      </div>
    </nav>
  )
}
