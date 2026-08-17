import { useEffect, useState } from 'react'

export interface PanelPosition {
  left: number
  width: number
  /** Cap so a long list scrolls inside the panel instead of off the screen. */
  maxHeight: number
  /** Exactly one of these is set: `top` opens downward, `bottom` opens upward. */
  top?: number
  bottom?: number
}

const GAP = 4
/** Keep the panel clear of the viewport edge. */
const MARGIN = 8
/** Below this there isn't enough room to be worth opening downward. */
const MIN_HEIGHT = 160
/** Upper bound so a 100-option list doesn't become a full-height wall. */
const MAX_HEIGHT = 320

/**
 * Places a portalled dropdown panel against its trigger, **inside the
 * viewport**.
 *
 * The bug this exists to prevent: pinning the panel to `trigger.bottom` alone
 * means any dropdown near the foot of a page opens below the fold. Because the
 * panel is `position: fixed` and re-anchors on scroll, scrolling can never bring
 * it back — the options are simply unreachable. That hit the link rows at the
 * bottom of the project Deliverables, Design Data and Approvals tabs.
 *
 * So: open upward when there isn't room below, cap the height to the space that
 * actually exists so the list scrolls internally, and clamp horizontally so a
 * wide panel never runs off the right edge.
 */
export function usePanelPosition(
  open: boolean,
  triggerRef: React.RefObject<HTMLElement | null>,
  /** Floor for the panel width, for triggers too narrow to read options in. */
  minWidth = 0,
) {
  const [position, setPosition] = useState<PanelPosition | null>(null)

  useEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }
    const place = () => {
      const r = triggerRef.current?.getBoundingClientRect()
      if (!r) return

      const width = Math.max(r.width, minWidth)
      const spaceBelow = window.innerHeight - r.bottom - GAP - MARGIN
      const spaceAbove = r.top - GAP - MARGIN
      const openUp = spaceBelow < MIN_HEIGHT && spaceAbove > spaceBelow
      const available = openUp ? spaceAbove : spaceBelow

      setPosition({
        // Anchoring upward by `bottom` means the panel's height never has to be
        // measured first, so it can't flicker into place.
        ...(openUp
          ? { bottom: Math.max(MARGIN, window.innerHeight - r.top + GAP) }
          : { top: r.bottom + GAP }),
        left: Math.max(MARGIN, Math.min(r.left, window.innerWidth - width - MARGIN)),
        width,
        maxHeight: Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, available)),
      })
    }

    place()
    // `true` captures scrolls in any ancestor, not just the window — these sit
    // inside drawers and overflow containers.
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, triggerRef, minWidth])

  return position
}
