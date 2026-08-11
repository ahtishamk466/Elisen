import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSessionStore } from '@/stores/sessionStore'

/** Shown after Logout. There's no auth backend, so signing back in is a
    single click — real session handling belongs on the server
    (docs/SECURITY.md rule 8). */
export function SignedOutScreen() {
  const signIn = useSessionStore((s) => s.signIn)

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-lg">
      <div className="w-full rounded-sm border border-border-default bg-neutral-25 p-2xl text-center" style={{ maxWidth: 420 }}>
        <img src="/logo-elisen.svg" alt="Elisen" width={600} height={104} className="mx-auto h-6 w-auto" />
        <span aria-hidden className="mt-2xl inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-text-muted">
          <LogOut size={22} />
        </span>
        <h1 className="mt-lg text-2xl font-bold text-text-primary">You've been logged out</h1>
        <p className="mt-sm text-sm text-text-secondary">
          Your session on this device has ended. Sign back in to return to the workspace.
        </p>
        <div className="mt-2xl">
          <Button onClick={signIn}>Sign back in</Button>
        </div>
      </div>
    </main>
  )
}
