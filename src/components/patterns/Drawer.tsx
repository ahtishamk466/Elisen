import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Focus the panel once, when the drawer transitions to open — not on every
  // render. Depending on `onClose` here re-stole focus from form fields on
  // every keystroke, because callers pass a new function each render.
  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current()
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-modal">
      <div className="absolute inset-0 bg-primary-950/50" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="absolute right-0 top-0 flex h-full w-full flex-col bg-neutral-25 shadow-lg outline-none"
        style={{ maxWidth: 680 }}
      >
        <header className="flex items-center justify-between px-2xl py-lg">
          <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm p-xs text-text-primary transition-colors duration-fast hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
          >
            <X size={20} />
          </button>
        </header>
        {/* Block flow, not grid: grid rows stretch to equal heights here and
            clip section content. */}
        <div className="flex-1 space-y-lg overflow-y-auto px-2xl pb-2xl">{children}</div>
        {footer && (
          <footer className="flex items-center justify-between gap-sm border-t border-border-default bg-neutral-25 px-2xl py-lg">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
