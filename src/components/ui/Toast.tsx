import { CircleAlert, CircleCheck, X } from 'lucide-react'

export type ToastTone = 'success' | 'danger'

export interface ToastProps {
  tone?: ToastTone
  title: string
  onDismiss: () => void
}

/** A single floating confirmation — a hug-width pill (not a banner), white
    with the same border every card/stat container uses and a light shadow
    so it reads as floating above the page. A 320px floor keeps a short
    message ("Entry deleted.") from reading as a cramped little chip next
    to a longer one — the message flexes to fill it, so the close button
    always sits at the pill's own right edge rather than hugging the text.
    `ToastViewport` positions, stacks and times these; nothing else should
    render one directly. */
export function Toast({ tone = 'success', title, onDismiss }: ToastProps) {
  const Icon = tone === 'danger' ? CircleAlert : CircleCheck
  return (
    <div role="status" className="inline-flex items-center gap-base rounded-sm border border-border-default bg-neutral-25 py-base pl-xl pr-lg shadow-sm" style={{ minWidth: 320 }}>
      <Icon size={18} className={`shrink-0 ${tone === 'danger' ? 'text-danger' : 'text-success'}`} aria-hidden />
      <p className="flex-1 whitespace-nowrap text-sm font-medium text-text-primary">{title}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-sm p-xxss text-text-secondary transition-colors duration-fast hover:bg-neutral-100 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  )
}
