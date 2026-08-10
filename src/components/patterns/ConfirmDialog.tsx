import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDivElement>(null)
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel

  // Same fix as Drawer: depend only on `open`, not on a callback prop that's
  // a new function identity every render — see docs/DECISIONS.md.
  useEffect(() => {
    if (open) ref.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancelRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-toast flex items-center justify-center p-lg">
      <div className="absolute inset-0 bg-primary-950/50" onClick={onCancel} aria-hidden />
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative w-full rounded-sm bg-neutral-25 p-2xl shadow-lg outline-none"
        style={{ maxWidth: 560 }}
      >
        <div className="flex items-start justify-between gap-lg">
          <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="rounded-sm p-xs text-text-primary transition-colors duration-fast hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mt-sm text-sm text-text-secondary">{description}</p>
        <div className="mt-2xl flex justify-end gap-sm">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
