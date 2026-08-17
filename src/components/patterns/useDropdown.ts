import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface DropdownPosition {
  left: number
  /** Cap so a tall menu scrolls inside itself instead of off the screen. */
  maxHeight: number
  /** Exactly one is set: `top` opens downward, `bottom` opens upward. */
  top?: number
  bottom?: number
}

/**
 * Shared open/position/outside-click/Escape logic for portal-rendered menus
 * (ActionsMenu, ExportMenu, the filter menus, SidebarProfile). Portaling to
 * <body> is required because table rows sit inside an overflow-x-auto
 * container — per the CSS overflow spec, setting overflow-x alone forces
 * overflow-y to computed 'auto' too, so a menu positioned inside that
 * container would get clipped at the row boundary.
 *
 * Placement is viewport-aware: it opens upward when there is no room below,
 * clamps horizontally, and returns a `maxHeight` so a menu taller than the
 * space available scrolls inside itself. Without the cap a 600px filter panel
 * on a 620px viewport rendered at `top: -49`, putting its first field above the
 * fold where nothing could reach it.
 */
export function useDropdown<Trigger extends HTMLElement>(menuWidth: number) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<DropdownPosition | null>(null)
  const triggerRef = useRef<Trigger>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open) return
    const GAP = 4
    const MARGIN = 8
    /** Below this there isn't room worth opening downward into. */
    const MIN_HEIGHT = 180

    const place = () => {
      const r = triggerRef.current?.getBoundingClientRect()
      if (!r) return
      const below = window.innerHeight - r.bottom - GAP - MARGIN
      const above = r.top - GAP - MARGIN
      const openUp = below < MIN_HEIGHT && above > below
      setPosition({
        // Anchoring upward by `bottom` needs no height measurement, so a tall
        // menu can't first render off-screen and then jump.
        ...(openUp
          ? { bottom: Math.max(MARGIN, window.innerHeight - r.top + GAP) }
          : { top: r.bottom + GAP }),
        // Right-aligned to the trigger, then clamped inside the viewport.
        left: Math.max(MARGIN, Math.min(r.right - menuWidth, window.innerWidth - menuWidth - MARGIN)),
        maxHeight: Math.max(MIN_HEIGHT, openUp ? above : below),
      })
    }

    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, menuWidth])

  useEffect(() => {
    if (!open) return
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      // A dropdown opened from *inside* this menu (a Select in a filter panel)
      // renders through a portal on <body>, so by DOM containment its options
      // look like an outside click — and picking one would close the menu it
      // belongs to. Anything inside a portalled panel is treated as inside.
      if (target instanceof Element && target.closest('[data-dropdown-panel]')) return
      setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return { open, setOpen, position, triggerRef, menuRef }
}
