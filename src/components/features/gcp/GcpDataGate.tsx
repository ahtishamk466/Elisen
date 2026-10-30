import { useEffect, type ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { EmptyState } from '@/components/patterns/EmptyState'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useGcpStore } from '@/stores/gcpStore'

/** Starts the GCP data load (once, shared by every caller) and returns where
    it stands. Screens that only need the data inside a drawer call this
    rather than waiting behind `GcpDataGate`. */
export function useGcpData() {
  const status = useGcpStore((s) => s.dataStatus)
  const ensure = useGcpStore((s) => s.ensureGcpData)
  useEffect(ensure, [ensure])
  return status
}

/**
 * Holds a GCP screen's content until the client's regulations and
 * certification bases have arrived (`lib/dataset.ts`): a loading state while
 * they load, and Try Again if they don't. Goes inside the page's `AppShell`,
 * so the menu and heading show straight away.
 */
export function GcpDataGate({ children }: { children: ReactNode }) {
  const status = useGcpData()
  const retry = useGcpStore((s) => s.ensureGcpData)
  if (status === 'ready') return <>{children}</>

  /* `EmptyState` hides its icon from screen readers, so the region itself
     announces the change. */
  return (
    <div role={status === 'error' ? 'alert' : 'status'} className="rounded-sm border border-border-default bg-neutral-25">
      {status === 'error' ? (
        <EmptyState icon={<TriangleAlert size={48} strokeWidth={1.5} />} title="Regulations couldn't be loaded"
          description="Check your connection, then try again."
          action={<Button variant="secondary" onClick={retry}>Try Again</Button>} />
      ) : (
        <EmptyState icon={<Spinner size={48} />} title="Loading regulations…"
          description="Fetching every regulation and certification basis from the client's database." />
      )}
    </div>
  )
}
