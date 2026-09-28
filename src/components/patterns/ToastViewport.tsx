import { useEffect } from 'react'
import { Toast } from '@/components/ui/Toast'
import { useToastStore } from '@/stores/toastStore'

const AUTO_DISMISS_MS = 5000

/** Mounted once, in `AppShell`, above every route — every page's transient
    confirmation ("Project saved.", "Entry deleted.") renders here instead
    of a page rendering its own inline `Alert`, so it never competes with
    the page's own layout and never survives a navigation by accident.
    Fixed top-center on every screen (client instruction, 2026-09-28 — not
    a corner toast), newest at the bottom of the stack; each toast times
    itself out and can also be dismissed by hand. */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => dismiss(t.id), AUTO_DISMISS_MS))
    return () => timers.forEach(clearTimeout)
  }, [toasts, dismiss])

  if (toasts.length === 0) return null

  return (
    <div aria-live="polite" className="fixed left-1/2 top-lg z-toast flex -translate-x-1/2 flex-col items-center gap-sm">
      {toasts.map((t) => (
        <Toast key={t.id} tone={t.tone} title={t.message} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  )
}
