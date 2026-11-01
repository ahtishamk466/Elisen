import { useLayoutEffect, useState, type RefObject } from 'react'
import { layoutRect } from '@/components/ui/usePanelPosition'

const MIN_BODY_CAP = 160
const EDGE_GAP = 16

/** Match both scrollports, and cap naturally sized tables in layout CSS px. */
export function useFrozenTableLayout(
  frameRef: RefObject<HTMLDivElement | null>,
  bodyRef: RefObject<HTMLDivElement | null>,
  headerRef: RefObject<HTMLDivElement | null>,
  fill: boolean,
) {
  const [size, setSize] = useState<{ width?: number; maxHeight?: number }>({})

  useLayoutEffect(() => {
    const frame = frameRef.current
    const body = bodyRef.current
    if (!frame || !body) return
    const ancestors: HTMLElement[] = []
    for (let node = frame.parentElement; node; node = node.parentElement) ancestors.push(node)
    const scrollPanes = new Set<HTMLElement>()
    let pending = 0
    const measure = () => {
      pending = 0
      if (!body.clientWidth) return
      const rect = layoutRect(body)
      let bottom = rect.viewportHeight - EDGE_GAP
      if (!fill) {
        for (const ancestor of ancestors) {
          const computed = getComputedStyle(ancestor)
          const overflow = computed.overflowY
          // Ignore intrinsic overflow-hidden cards and unbounded horizontal
          // wrappers: their height follows this table and would feed back.
          if (overflow === 'scroll' || (overflow === 'auto' && ancestor.scrollHeight > ancestor.clientHeight + 1)) scrollPanes.add(ancestor)
          if (scrollPanes.has(ancestor) && (overflow === 'auto' || overflow === 'scroll')) {
            const bottomPadding = Number.parseFloat(computed.paddingBottom) || 0
            bottom = Math.min(bottom, layoutRect(ancestor).top + ancestor.clientTop + ancestor.clientHeight - Math.max(EDGE_GAP, bottomPadding))
          }
        }
      }
      // One layout pixel leaves room for the enclosing card's closing border
      // and prevents fractional zoom rounding from creating an outer scrollbar.
      const maxHeight = fill ? undefined : Math.max(MIN_BODY_CAP, Math.floor(bottom - rect.top - 1))
      const width = body.clientWidth
      setSize((previous) => previous.width === width && previous.maxHeight === maxHeight ? previous : { width, maxHeight })
    }
    const schedule = () => { if (!pending) pending = requestAnimationFrame(measure) }
    const onScroll = (event: Event) => {
      if (event.target instanceof Node && frame.contains(event.target)) return
      schedule()
    }
    const observer = new ResizeObserver(schedule)
    for (const element of [frame, body, headerRef.current, ...ancestors]) if (element) observer.observe(element)
    measure()
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      observer.disconnect()
      if (pending) cancelAnimationFrame(pending)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [frameRef, bodyRef, headerRef, fill])

  return size
}
