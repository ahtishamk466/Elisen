import { useRef, useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FormField } from '@/components/patterns/FormField'
import { useAccessStore } from '@/stores/accessStore'
import { useSessionStore } from '@/stores/sessionStore'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Stands in for the server round trip, so the loading state is real. */
const SIGN_IN_DELAY_MS = 600

/**
 * The sign-in page, shown whenever no one is signed in.
 *
 * There is no auth backend: an email that belongs to an active user in User
 * Access Control signs in as that user, and the password is not checked —
 * no password may live in client code (docs/SECURITY.md rules 1 and 8).
 */
export function LoginScreen() {
  const users = useAccessStore((s) => s.users)
  const lastUserId = useSessionStore((s) => s.currentUserId)
  const signIn = useSessionStore((s) => s.signIn)

  // Whoever just signed out, so signing back in only needs the password.
  const lastEmail = users.find((u) => u.id === lastUserId)?.email ?? ''
  const [email, setEmail] = useState(lastEmail)
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [rejected, setRejected] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const address = email.trim()
    const next: typeof errors = {}
    if (!address) next.email = 'Enter your email address.'
    else if (!EMAIL_PATTERN.test(address)) next.email = 'Enter an email address like jane@example.com.'
    if (!password) next.password = 'Enter your password.'
    setErrors(next)
    setRejected(false)
    if (next.email || next.password) {
      ;(next.email ? emailRef : passwordRef).current?.focus()
      return
    }

    setSubmitting(true)
    window.setTimeout(() => {
      const user = users.find((u) => u.status === 'active' && u.email.toLowerCase() === address.toLowerCase())
      if (user) return signIn(user.id)
      // One message for both cases, so the page never confirms an account exists.
      setSubmitting(false)
      setRejected(true)
      setPassword('')
      passwordRef.current?.focus()
    }, SIGN_IN_DELAY_MS)
  }

  return (
    <main className="flex min-h-viewport items-center justify-center bg-neutral-50 px-lg py-3xl">
      <div className="w-full rounded-sm border border-border-default bg-neutral-25 p-2xl" style={{ maxWidth: 420 }}>
        <img src="/logo-elisen.svg" alt="Elisen" width={600} height={104} className="h-8 w-auto" />
        <h1 className="mt-2xl text-2xl font-bold text-text-primary">Sign in to Elisen</h1>

        <form noValidate onSubmit={submit} className="mt-2xl grid gap-xl">
          {rejected && <Alert title="Email or password is incorrect">Check both and try again.</Alert>}

          <FormField label="Email" htmlFor="login-email" fullWidth error={errors.email}>
            <Input
              ref={emailRef} id="login-email" type="email" required maxLength={254}
              autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus={!lastEmail}
              placeholder="e.g. jane@example.com"
              value={email} error={!!errors.email}
              aria-describedby={errors.email ? 'login-email-message' : undefined}
              onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })) }}
            />
          </FormField>

          <FormField label="Password" htmlFor="login-password" fullWidth error={errors.password}>
            <Input
              ref={passwordRef} id="login-password" type="password" required maxLength={128}
              autoComplete="current-password" autoFocus={!!lastEmail}
              placeholder="Enter your password"
              value={password} error={!!errors.password}
              aria-describedby={errors.password ? 'login-password-message' : undefined}
              onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })) }}
            />
          </FormField>

          <Button type="submit" size="lg" loading={submitting} className="w-full">Sign in</Button>
        </form>

        <p className="mt-xl text-xs text-text-muted">Forgot your password? Ask your system administrator to reset it.</p>
        <p role="status" className="sr-only">{submitting ? 'Signing in…' : ''}</p>
      </div>
    </main>
  )
}
