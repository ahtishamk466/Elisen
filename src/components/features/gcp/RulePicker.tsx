import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useGcpStore } from '@/stores/gcpStore'
import { amdtOrder } from '@/lib/certBasisLevel'
import type { Regulation } from '@/types/gcp'

export interface RulePickerProps {
  /** Prefix for the two fields' ids, unique on the page. */
  idPrefix: string
  /** The rules on the list, in the order they were added. */
  value: string[]
  onChange: (ids: string[]) => void
  /** Rules the basis already has but the list doesn't show (the Edit
      drawer, where they live in the page's rules table). */
  existing?: string[]
  /** Heading over the list, e.g. "Rules to add". */
  listLabel: string
}

const bySection = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true })
const byAmdt = (a: Regulation, b: Regulation) => (amdtOrder(a.amdt) ?? 9999) - (amdtOrder(b.amdt) ?? 9999) || a.amdt.localeCompare(b.amdt)

/**
 * Adds rules to a certification basis one exact rule at a time: a Regulation
 * Section, then one of its amendments, then Add (user's choice, 2026-10-30,
 * over one combined search). The two fields stay separate, as the client
 * asked on 2026-09-24, but nothing is ever combined: the old pair of
 * multi-selects attached every chosen section at every chosen amendment, so
 * A4N_23-14's 402 rules read back as 520. An amendment already in the basis
 * or on the list is offered greyed out with the reason, and a second version
 * of a section is allowed but called out, since a basis applies each rule at
 * one amendment.
 */
export function RulePicker({ idPrefix, value, onChange, existing = [], listLabel }: RulePickerProps) {
  const regulations = useGcpStore((s) => s.regulations)
  const [section, setSection] = useState('')
  const [regId, setRegId] = useState('')
  const [error, setError] = useState('')

  const byId = useMemo(() => new Map(regulations.map((r) => [r.id, r])), [regulations])
  const sectionOptions = useMemo(() => {
    const title = new Map<string, string>()
    for (const r of regulations) if (!title.has(r.section)) title.set(r.section, r.title)
    return [...title].sort(([a], [b]) => bySection(a, b)).map(([s, t]) => ({ value: s, label: s, hint: t }))
  }, [regulations])

  const taken = new Set([...existing, ...value])
  const versions = regulations.filter((r) => r.section === section).sort(byAmdt)
  const otherVersions = versions.filter((r) => taken.has(r.id) && r.id !== regId)
  const picked = value.map((id) => byId.get(id)).filter((r): r is Regulation => !!r)

  const add = () => {
    if (!section || !regId) { setError('Pick a section and an amendment first.'); return }
    onChange([...value, regId])
    setSection('')
    setRegId('')
  }

  return (
    <div className="grid gap-base">
      <FormField label="Regulation Section" htmlFor={`${idPrefix}-section`} fullWidth error={error && !section ? error : undefined}>
        <SearchableSelect id={`${idPrefix}-section`} value={section} placeholder="Type a section, e.g. 25.1301…"
          emptyLabel="No regulations in the library yet." options={sectionOptions}
          onChange={(s) => { setSection(s); setRegId(''); setError('') }} />
      </FormField>
      <FormField label="Regulation Amendment" htmlFor={`${idPrefix}-amdt`} fullWidth error={error && section && !regId ? error : undefined}
        help={section && otherVersions.length > 0
          ? `Already has ${section} at ${otherVersions.map((r) => r.amdt).join(', ')}; a second version shows as a duplicate.`
          : undefined}>
        <SearchableSelect id={`${idPrefix}-amdt`} value={regId} disabled={!section}
          placeholder={section ? 'Pick an amendment…' : 'Pick a section first'}
          options={versions.map((r) => ({
            value: r.id, label: r.amdt, hint: r.title, disabled: taken.has(r.id),
            disabledReason: existing.includes(r.id) ? 'Already in this basis' : 'Already on the list',
          }))}
          onChange={(id) => { setRegId(id); setError('') }} />
      </FormField>
      <div>
        <Button variant="secondary" leadingIcon={<Plus size={16} />} onClick={add}>Add Rule</Button>
      </div>

      <div className="overflow-hidden rounded-sm border border-border-default">
        <p className="border-b border-border-default bg-neutral-50 px-lg py-sm text-sm font-semibold text-text-secondary" aria-live="polite">
          {listLabel} ({picked.length})
        </p>
        {picked.length === 0 ? (
          <p className="px-lg py-base text-sm text-text-muted">Rules you add appear here.</p>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {picked.map((r) => (
              <li key={r.id} className="flex items-center gap-base border-b border-border-default px-lg py-xs text-sm last:border-b-0">
                <span className="w-20 shrink-0 font-semibold text-text-primary">{r.section}</span>
                <span className="w-16 shrink-0 text-text-primary">{r.amdt}</span>
                <span className="min-w-0 flex-1 truncate text-text-secondary" title={r.title}>{r.title}</span>
                <Button variant="tertiary" size="sm" leadingIcon={<Trash2 size={14} />} aria-label={`Remove ${r.section} at ${r.amdt}`}
                  onClick={() => onChange(value.filter((id) => id !== r.id))}>Remove</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
