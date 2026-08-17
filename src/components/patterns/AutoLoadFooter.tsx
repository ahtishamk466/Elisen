import { useEffect, useRef } from 'react'
import { Spinner } from '@/components/ui/Spinner'

export interface AutoLoadFooterProps {
  total: number
  visibleCount: number
  loading: boolean
  onLoadMore: () => void
  /** Plural noun for the count, e.g. "projects" — defaults to "items". */
  itemLabel?: string
}

/**
 * Replaces `Pagination` as a table's footer bar: instead of page controls,
 * the next batch loads itself when this bar scrolls into view. No border/
 * rounded/bg of its own — sits inside the same card as the table, separated
 * by one top border, exactly like `Pagination` did.
 *
 * Pair with `useInfiniteReveal` for the `visibleCount`/`loading`/`onLoadMore`
 * state; this component only renders the bar and owns the scroll trigger.
 */
export function AutoLoadFooter({ total, visibleCount, loading, onLoadMore, itemLabel = 'items' }: AutoLoadFooterProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const done = visibleCount >= total

  useEffect(() => {
    if (done) return
    const el = sentinelRef.current
    if (!el) return
    // rootMargin fires the load slightly before the bar is actually on
    // screen, so the next batch is ready by the time the user reaches it.
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onLoadMore() },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [done, onLoadMore])

  return (
    <div className="border-t border-border-default px-lg py-base">
      <p className="text-center text-sm text-text-secondary">
        {total === 0 ? `No ${itemLabel}` : `Showing ${visibleCount} of ${total} ${itemLabel}`}
      </p>
      {!done && (
        <div ref={sentinelRef} className="mt-base flex items-center justify-center gap-sm" aria-live="polite">
          {loading && (
            <>
              <Spinner size={16} />
              <span className="text-sm text-text-secondary">Loading more…</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
