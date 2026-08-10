import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface PaginationProps {
  page: number
  pageCount: number
  summary: string
  onChange: (page: number) => void
}

export function Pagination({ page, pageCount, summary, onChange }: PaginationProps) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1)
  return (
    <nav className="flex flex-wrap items-center justify-between gap-lg" aria-label="Pagination">
      <p className="text-sm text-text-secondary">{summary}</p>
      <div className="flex items-center gap-xs">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-9 items-center gap-xs rounded-sm border border-border-default px-base text-sm text-text-primary transition-colors duration-fast hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          <ChevronLeft size={16} aria-hidden />
          Previous
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`h-9 w-9 rounded-sm text-sm transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary
              ${p === page ? 'bg-primary-700 font-semibold text-text-inverse' : 'border border-border-default text-text-primary hover:bg-neutral-50'}`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
          className="inline-flex h-9 items-center gap-xs rounded-sm border border-border-default px-base text-sm text-text-primary transition-colors duration-fast hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          Next
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
    </nav>
  )
}
