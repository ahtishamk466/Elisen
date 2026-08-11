import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface DropdownPosition {
  top: number
  left: number
}

/**
 * Shared open/position/outside-click/Escape logic for portal-rendered
 * dropdowns (ActionsMenu, ExportMenu). Portaling to <body> is required
 * because table rows sit inside an overflow-x-auto container — per the
 * CSS overflow spec, setting overflow-x alone forces overflow-y to
 * computed 'auto' too, so a menu positioned inside that container would
 * get clipped at the row boundary.
 */
export function useDropdown<Trigger extends HTMLElement>(menuWidth: number) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<DropdownPosition | null>(null)
  const triggerRef = useRef<Trigger>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPosition({ top: rect.bottom + 4, left: Math.max(8, rect.right - menuWidth) })
  }, [open, menuWidth])

  // Second pass once the menu has real height: flip above the trigger when it
  // would run off the bottom. Needed for bottom-anchored triggers such as the
  // sidebar profile menu.
  useLayoutEffect(() => {
    if (!open || !menuRef.current || !triggerRef.current) return
    const menu = menuRef.current.getBoundingClientRect()
    const trigger = triggerRef.current.getBoundingClientRect()
    const overflowsBottom = trigger.bottom + 4 + menu.height > window.innerHeight
    const fitsAbove = trigger.top - 4 - menu.height >= 0
    if (overflowsBottom && fitsAbove) {
      setPosition((prev) => (prev ? { ...prev, top: trigger.top - 4 - menu.height } : prev))
    }
  }, [open, position?.top])

  useEffect(() => {
    if (!open) return
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
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
