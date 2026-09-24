import { useRef, type UIEvent } from 'react'

/**
 * Keeps a frozen table header in horizontal sync with its independently
 * scrolling body. The header's own `overflow-hidden` only clips it at
 * whatever position it first rendered at — it never moves on its own, so a
 * table wide enough to need horizontal scroll left the header stranded
 * while the body scrolled underneath it. `onBodyScroll` mirrors the body's
 * `scrollLeft` onto the header ref on every scroll event.
 */
export function useSyncedScroll() {
  const headerRef = useRef<HTMLDivElement>(null)
  const onBodyScroll = (e: UIEvent<HTMLDivElement>) => {
    if (headerRef.current) headerRef.current.scrollLeft = e.currentTarget.scrollLeft
  }
  return { headerRef, onBodyScroll }
}
