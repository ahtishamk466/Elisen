import { useState } from 'react'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

export interface ChangePasswordTabProps {
  loading?: boolean
  onChanged: (message: string) => void
}

const BLANK = { old: '', next: '', retype: '' }

/** The legacy Change Password screen's exact three fields — Old Password,
    New Password, Retype Password — nothing added, nothing dropped. */
export function ChangePasswordTab({ loading = false, onChanged }: ChangePasswordTabProps) {
  const [values, setValues] = useState(BLANK)
  const [errors, setErrors] = useState<{ old?: string; next?: string; retype?: string }>({})

  const setField = (key: keyof typeof BLANK) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const submit = () => {
    const next: typeof errors = {}
    if (!values.old) next.old = 'Enter your current password.'
    if (!values.next) next.next = 'Enter a new password.'
    else if (values.next.length < 8) next.next = 'Use at least 8 characters.'
    else if (values.next === values.old) next.next = 'The new password must be different from the old one.'
    // Only checked once the new password itself is valid, so the user fixes
    // one field at a time instead of chasing two errors for one mistake.
    if (!next.next && values.retype !== values.next) next.retype = "Passwords don't match."
    if (Object.keys(next).length) { setErrors(next); return }
    setValues(BLANK)
    setErrors({})
    onChanged('Password changed.')
  }

  if (loading) {
    return (
      <div className="rounded-sm border border-border-default bg-neutral-25 p-lg">
        <Skeleton className="h-6 w-40" />
        {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="mt-lg h-9 w-full" />)}
      </div>
    )
  }

  return (
    // A plain form submit, so Enter works from any field — same reason the
    // legacy page was a form. preventDefault since there's no backend yet.
    <form onSubmit={(e) => { e.preventDefault(); submit() }} className="grid gap-lg">
      <FormSection title="Change Password" subtitle="Fill out the following fields to change your password.">
        <FormField label="Old Password" htmlFor="pw-old" required error={errors.old}>
          <Input
            id="pw-old" type="password" autoComplete="current-password"
            value={values.old} error={!!errors.old} onChange={setField('old')}
          />
        </FormField>
        <FormField label="New Password" htmlFor="pw-new" required error={errors.next} help={errors.next ? undefined : 'At least 8 characters.'}>
          <Input
            id="pw-new" type="password" autoComplete="new-password"
            value={values.next} error={!!errors.next} onChange={setField('next')}
          />
        </FormField>
        <FormField label="Retype Password" htmlFor="pw-retype" required error={errors.retype}>
          <Input
            id="pw-retype" type="password" autoComplete="new-password"
            value={values.retype} error={!!errors.retype} onChange={setField('retype')}
          />
        </FormField>
      </FormSection>

      <div className="flex justify-end gap-sm">
        <Button type="button" variant="secondary" onClick={() => { setValues(BLANK); setErrors({}) }}>Cancel</Button>
        <Button type="submit">Change Password</Button>
      </div>
    </form>
  )
}
