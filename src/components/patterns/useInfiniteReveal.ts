import { useEffect, useRef, useState } from 'react'

/**
 * Drives an auto-loading table footer: how many of `totalItems` are
 * currently revealed, growing by `batchSize` each time `loadMore` fires.
 * `loadMore` simulates the network delay a real "load next page" request
 * would have, so the loading state briefly shown by `AutoLoadFooter` reads
 * as genuine rather than instant.
 *
 * Callers reset explicitly on search/filter change (`reset()`), the same
 * point every list page already called `setPage(1)` from — this hook is a
 * drop-in replacement for the `page`/`pageSize` state `Pagination` used.
 */
export function useInfiniteReveal(totalItems: number, batchSize = 25) {
  const [visibleCount, setVisibleCount] = useState(batchSize)
  const [loadingMore, setLoadingMore] = useState(false)
  const timeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  const loadMore = () => {
    if (loadingMore || visibleCount >= totalItems) return
    setLoadingMore(true)
    timeoutRef.current = window.setTimeout(() => {
      setVisibleCount((v) => Math.min(v + batchSize, totalItems))
      setLoadingMore(false)
    }, 500)
  }

  const reset = () => {
    window.clearTimeout(timeoutRef.current)
    setVisibleCount(batchSize)
    setLoadingMore(false)
  }

  return { visibleCount: Math.min(visibleCount, totalItems), loadingMore, loadMore, reset }
}
