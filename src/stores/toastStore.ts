import { create } from 'zustand'

export interface ToastMessage {
  id: string
  message: string
  tone: 'success' | 'danger'
}

interface ToastState {
  toasts: ToastMessage[]
  show: (message: string, tone?: ToastMessage['tone']) => void
  dismiss: (id: string) => void
}

/** Every transient confirmation in the app ("Project saved.", "Entry
    deleted.") goes through here rather than a page's own `useState` — one
    global stack, rendered once by `ToastViewport` in `AppShell`, so no page
    has to remember to render its own banner or clear it on navigation.
    Defaults to `success` since nearly every call site is confirming an
    action went through; pass `'danger'` explicitly for a failed one. */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message, tone = 'success') => set((s) => ({
    toasts: [...s.toasts, { id: crypto.randomUUID(), message, tone }],
  })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
