import { useLayoutEffect, useState, type RefObject } from 'react'

/**
 * The element's current content width, live.
 *
 * Exists because a table cannot do proportional-of-the-remainder in CSS: a
 * `<col>` honours `px` and it honours `%`, but a browser quietly ignores
 * `calc(40% - 264px)` on one and falls back to splitting the space evenly —
 * which is exactly the layout this measurement is here to avoid. Measuring the
 * container and writing real pixels is the only way to give the columns that
 * hold names every pixel the fixed columns don't need.
 */
export function useElementWidth(ref: RefObject<HTMLElement | null>): number | null {
  const [width, setWidth] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    // Belt and braces: a ResizeObserver on a scroll container does not always
    // fire when the *viewport* changes but the container's own box is being
    // held open by the content inside it.
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [ref])

  return width
}
