import { FrozenTable } from '@/components/patterns/FrozenTable'
import { appendBasisRules } from '@/lib/basisRuleBatch'
import { amendmentLabel } from '@/lib/gcpDisplay'
import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { FormField } from '@/components/patterns/FormField'
import { Truncate } from '@/components/patterns/Truncate'
import { Alert } from '@/components/ui/Alert'
import { duplicateSections } from '@/lib/certBasisLevel'
import { Button } from '@/components/ui/Button'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { useGcpStore } from '@/stores/gcpStore'
import { amdtOrder } from '@/lib/certBasisLevel'
import { RegulationDetailDrawer } from './RegulationDetailDrawer'
import { AmendmentText } from './AmendmentText'
import { RegulationSectionButton } from './RegulationSectionButton'
import type { Regulation } from '@/types/gcp'

/** Header cell: the Projects List heading style (small, semibold, secondary). */
const TH = 'px-base py-base text-sm font-semibold text-text-secondary'

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
  onPendingChange?: (pending: boolean) => void
  /** Desktop row trial; other consumers retain the existing stacked presentation. */
  layout?: 'stacked' | 'row'
}

const EMPTY_IDS: string[] = []
const bySection = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true })
const byAmdt = (a: Regulation, b: Regulation) => (amdtOrder(a.amdt) ?? 9999) - (amdtOrder(b.amdt) ?? 9999) || a.amdt.localeCompare(b.amdt)

/** Stages multiple exact library records for one explicit batch Add.
 * Every option retains its own section/amendment/title identity. */
export function RulePicker({ idPrefix, value, onChange, existing = EMPTY_IDS, listLabel, onPendingChange, layout = 'stacked' }: RulePickerProps) {
  const regulations = useGcpStore((s) => s.regulations)
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [viewing, setViewing] = useState<Regulation | null>(null)

  const byId = useMemo(() => new Map(regulations.map((r) => [r.id, r])), [regulations])
  const taken = useMemo(() => new Set([...existing, ...value]), [existing, value])
  const options = useMemo(() => [...regulations].sort((a, b) => bySection(a.section, b.section) || byAmdt(a, b)).map((r) => ({
    value: r.id, label: `${r.section} · ${amendmentLabel(r.amdt)}`, hint: r.title,
    disabled: taken.has(r.id), disabledReason: 'Already in this basis',
  })), [regulations, taken])
  const batch = appendBasisRules(value, checkedIds, regulations, existing)
  const hasPending = batch.additions.length > 0
  useEffect(() => { onPendingChange?.(hasPending) }, [hasPending, onPendingChange])
  useEffect(() => () => { onPendingChange?.(false) }, [onPendingChange])
  const picked = value.map((id) => byId.get(id)).filter((r): r is Regulation => !!r)
  const pending = batch.additions.map((id) => byId.get(id)!).filter(Boolean)
  const add = () => {
    if (batch.additions.length === 0) return
    onChange(batch.ids)
    setCheckedIds([])
  }

  return (
    <div className="grid gap-base">
      <div className={layout === 'row' ? 'grid gap-lg laptop:grid-cols-6' : 'grid gap-base'}>
        <div className={layout === 'row' ? 'min-w-0 laptop:col-span-5' : 'min-w-0'}>
          <FormField label="Select regulations" htmlFor={`${idPrefix}-records`} fullWidth>
            <MultiSelect id={`${idPrefix}-records`} value={checkedIds} onChange={setCheckedIds}
              options={options} virtualized placeholder="Search and select regulations…"
              emptyLabel="No regulations in the library yet." />
          </FormField>
        </div>
        <div className={layout === 'row' ? 'laptop:pt-2xl' : ''}>
          <Button variant="secondary" size={layout === 'row' ? 'lg' : 'md'} className={layout === 'row' ? 'w-full' : ''}
            leadingIcon={<Plus size={16} />} disabled={batch.additions.length === 0} onClick={add}>Add selected ({batch.additions.length})</Button>
        </div>
      </div>
      {duplicateSections([...picked, ...pending]).length > 0 && <Alert tone="warning" title="Multiple amendments selected">Your selection includes more than one amendment of the same section. Check each version before adding or saving.</Alert>}
      <div className="overflow-hidden rounded-sm border border-border-default">
        <p className="border-b border-border-default bg-neutral-50 px-lg py-sm text-sm font-semibold text-text-secondary" aria-live="polite">
          {listLabel} ({picked.length})
        </p>
        {picked.length === 0 ? (
          <p className="px-lg py-base text-sm text-text-muted">Rules you add appear here.</p>
        ) : (
          <div>
            <FrozenTable columns={[140, 130, 'auto', 72]} minWidth={620}
              columnLabels={['Section', 'Amendment', 'Title', 'Actions']} caption="Selected regulations"
              tableClassName="w-full text-left text-sm" header={<thead className="bg-neutral-50"><tr><th className={TH}>Section</th><th className={TH}>Amendment</th><th className={TH}>Title</th><th className={TH}>Actions</th></tr></thead>}>

              {/* Same reading order as the basis page's rules table: a bold section, a
                  regular title, the whole row opens the rule, one quiet Remove icon. */}
              <tbody>{picked.map((r) => <tr key={r.id} onClick={() => setViewing(r)} className="cursor-pointer border-t border-border-default transition-colors duration-fast hover:bg-accent-subtle">
                <td className="px-base py-base"><RegulationSectionButton regulation={r} onOpen={() => setViewing(r)} /></td>
                <td className="px-base py-base"><AmendmentText amdt={r.amdt} /></td>
                <td className="px-base py-base text-text-primary"><Truncate lines={2}>{r.title}</Truncate></td>
                <td className="px-base py-base"><Button variant="tertiary" size="sm" leadingIcon={<Trash2 size={16} />} aria-label={`Remove ${r.section} at ${amendmentLabel(r.amdt)}`} title="Remove"
                  onClick={(e) => { e.stopPropagation(); onChange(value.filter((id) => id !== r.id)) }} /></td>
              </tr>)}</tbody>
            </FrozenTable>
          </div>
        )}
      </div>
      {viewing && <RegulationDetailDrawer regulation={viewing} sequence={picked} onClose={() => setViewing(null)} />}
    </div>
  )
}
