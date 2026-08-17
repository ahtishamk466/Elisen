import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  AUDIT_RETENTION_DAYS, AUDIT_SERIES_DESCRIPTION, AUDIT_SERIES_LABEL, AUDIT_STORED, formatCount,
} from '@/lib/auditFixtures'
import type { AuditSeriesKey } from '@/types/audit'

const TYPES = Object.keys(AUDIT_SERIES_LABEL) as AuditSeriesKey[]

export interface AuditCleanTabProps {
  loading?: boolean
  onCleaned: (message: string) => void
}

/**
 * The old "Clean" screen: purge audit records past their useful life. Audit
 * data is write-heavy and never read after a few weeks, so this is routine
 * housekeeping — but it is a permanent delete, so the count being removed is
 * shown before the button, not after.
 */
export function AuditCleanTab({ loading = false, onCleaned }: AuditCleanTabProps) {
  const [days, setDays] = useState(90)
  const [selected, setSelected] = useState<AuditSeriesKey[]>(TYPES)
  const [confirming, setConfirming] = useState(false)
  const [cleaned, setCleaned] = useState<AuditSeriesKey[]>([])

  const rows = useMemo(
    () => TYPES.map((key) => {
      const stored = AUDIT_STORED[key]
      // A cleaned type reports nothing left to purge for this run.
      const purgeable = cleaned.includes(key) ? 0 : stored.olderThan[days] ?? 0
      return { key, total: cleaned.includes(key) ? stored.total - (stored.olderThan[days] ?? 0) : stored.total, purgeable }
    }),
    [days, cleaned],
  )

  const toPurge = rows.filter((r) => selected.includes(r.key) && r.purgeable > 0)
  const totalToPurge = toPurge.reduce((sum, r) => sum + r.purgeable, 0)

  const toggle = (key: AuditSeriesKey) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  if (loading) {
    return (
      <div className="grid gap-lg rounded-sm border border-border-default bg-neutral-25 p-lg">
        <Skeleton className="h-6 w-48" />
        {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-8 w-full" />)}
      </div>
    )
  }

  return (
    <div className="grid gap-lg">
      <Alert tone="info" title="Deleting audit records is permanent">
        Audit data can't be regenerated. Once a day's entries are gone, so is the record of what
        happened. Keep at least as much history as your retention policy requires.
      </Alert>

      <section className="grid gap-lg rounded-sm border border-border-default bg-neutral-25 p-lg">
        <div className="grid gap-xxss">
          <h2 className="text-lg font-bold text-text-primary">Clean up old audit data</h2>
          <p className="text-sm text-text-secondary">
            Choose an age and which record types to remove. Anything newer than the age you pick is kept.
          </p>
        </div>

        <div className="grid gap-xs" style={{ maxWidth: 320 }}>
          <label htmlFor="audit-age" className="text-sm font-semibold text-text-primary">Delete records older than</label>
          <Select id="audit-age" value={String(days)} onChange={(e) => setDays(Number(e.target.value))}>
            {AUDIT_RETENTION_DAYS.map((d) => <option key={d} value={d}>{d} days</option>)}
          </Select>
        </div>

        <div className="overflow-hidden rounded-sm border border-border-default">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Audit record types, how many are stored, and how many are old enough to delete</caption>
            <thead>
              <tr className="border-b border-border-default bg-neutral-50">
                <th scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">Record type</th>
                <th scope="col" className="whitespace-nowrap px-lg py-base text-right text-sm font-semibold text-text-secondary">Stored</th>
                <th scope="col" className="whitespace-nowrap px-lg py-base text-right text-sm font-semibold text-text-secondary">Older than {days} days</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-border-default last:border-b-0">
                  <td className="px-lg py-base align-top">
                    <Checkbox
                      // Nothing to purge = nothing to choose; the row still
                      // shows so the type isn't silently missing.
                      disabled={r.purgeable === 0}
                      checked={selected.includes(r.key)}
                      onChange={() => toggle(r.key)}
                      label={AUDIT_SERIES_LABEL[r.key]}
                    />
                    {/* Indented to the checkbox's label, not its box. */}
                    <p className="mt-xxss pl-2xl text-xs text-text-muted">{AUDIT_SERIES_DESCRIPTION[r.key]}</p>
                  </td>
                  <td className="whitespace-nowrap px-lg py-base text-right align-top text-sm text-text-primary">{formatCount(r.total)}</td>
                  <td className="whitespace-nowrap px-lg py-base text-right align-top text-sm text-text-primary">
                    {r.purgeable > 0 ? formatCount(r.purgeable) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-lg">
          <p className="text-sm text-text-secondary">
            {totalToPurge > 0
              ? <><span className="font-semibold text-text-primary">{formatCount(totalToPurge)}</span> records will be deleted.</>
              : 'Nothing selected is old enough to delete.'}
          </p>
          <Button variant="danger" leadingIcon={<Trash2 size={16} />} disabled={totalToPurge === 0} onClick={() => setConfirming(true)}>
            Delete Records
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={confirming}
        title={`Delete ${formatCount(totalToPurge)} audit records?`}
        description={
          `${toPurge.map((r) => `${formatCount(r.purgeable)} ${AUDIT_SERIES_LABEL[r.key].toLowerCase()}`).join(', ')} older than ${days} days will be permanently removed. This can't be undone.`
        }
        confirmLabel="Delete records"
        tone="danger"
        onConfirm={() => {
          setCleaned((prev) => [...new Set([...prev, ...toPurge.map((r) => r.key)])])
          onCleaned(`${formatCount(totalToPurge)} audit records older than ${days} days deleted.`)
          setConfirming(false)
        }}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}
