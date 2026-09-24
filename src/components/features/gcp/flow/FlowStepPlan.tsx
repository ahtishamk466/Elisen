import { useState } from 'react'
import { ArrowLeft, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { EmptyState } from '@/components/patterns/EmptyState'
import { FormField } from '@/components/patterns/FormField'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { useGcpStore } from '@/stores/gcpStore'
import type { GcpItem, PlanEntry, Regulation } from '@/types/gcp'
import { GcpItemDrawer } from './GcpItemDrawer'

/** Real option set, read off the legacy `dds_id` dropdown — not invented. */
const DDS_ID_OPTIONS = [
  'Applicant Proposed Alternative or Additional DDS',
  'Accepted ASTM and Applicant Proposed Additional DDS',
  'Published ASTM & Applicant Proposed Additional DDS',
  'Addressed via other standards',
]

export interface FlowStepPlanProps {
  /** Owned by `GcpFlowPage`, not this component — its persistent summary
      card needs the same current rule to swap its stat band for, and shows
      this project's own identity (this screen doesn't repeat it). */
  rows: { entry: PlanEntry; rule: Regulation }[]
  /** Which row the Prev/Select/Next nav in the persistent summary card above
      has picked — this screen only reads it, it doesn't render that nav. */
  index: number
  onBack: () => void
  onNext: () => void
}

/**
 * Step 4 — Compliance Plan: every affected rule, one at a time, with
 * everything the legacy Cert Plan Dashboard tracked for it. Prev/Select/Next
 * lives in the persistent summary card above this step, not here — this
 * screen is only the editable fields for whichever rule that nav has picked.
 */
export function FlowStepPlan({ rows, index, onBack, onNext }: FlowStepPlanProps) {
  const items = useGcpFlowStore((s) => s.items)
  const updatePlanEntry = useGcpFlowStore((s) => s.updatePlanEntry)
  const removeItem = useGcpFlowStore((s) => s.removeItem)
  const updateRegulation = useGcpStore((s) => s.updateRegulation)

  const [drawer, setDrawer] = useState<{ mode: 'create' | 'edit'; item?: GcpItem } | null>(null)

  if (rows.length === 0) {
    return (
      <section className="grid gap-lg">
        <div className="grid gap-xxss">
          <h2 className="text-base font-semibold text-text-primary">Compliance plan</h2>
          <p className="text-xs text-text-muted">Each affected rule’s compliance plan, one at a time.</p>
        </div>
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState icon={<ListChecks size={48} strokeWidth={1.5} />}
            title="No affected rules yet"
            description="Scope the basis in Scope Rules first; the rules marked affected arrive here." />
        </div>
        <div className="flex justify-start">
          <Button variant="secondary" leadingIcon={<ArrowLeft size={16} />} onClick={onBack}>Back</Button>
        </div>
      </section>
    )
  }

  const current = rows[Math.min(index, rows.length - 1)]
  const currentItems = items.filter((i) => i.planEntryId === current.entry.id)

  return (
    <section className="grid gap-lg">
      <div className="grid gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg py-lg">
        <div className="grid gap-xxss">
          <h2 className="text-base font-semibold text-text-primary">Compliance plan</h2>
          <p className="text-xs text-text-muted">Each affected rule’s compliance plan, one at a time.</p>
        </div>

        <FormField label="Regulation Requirement Text" htmlFor="plan-requirement" fullWidth>
          <RichTextEditor
            id="plan-requirement"
            toolbar="compact"
            ariaLabel="Regulation Requirement Text"
            value={current.rule.requirementText}
            onChange={(html) => updateRegulation(current.rule.id, { requirementText: html })}
          />
        </FormField>

        <FormField label="DDS Id" htmlFor="plan-dds-id" fullWidth>
          <Select id="plan-dds-id" value={current.entry.ddsType}
            onChange={(e) => updatePlanEntry(current.entry.id, { ddsType: e.target.value })}>
            <option value="">Select…</option>
            {DDS_ID_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </FormField>

        <FormField label="DDS Text" htmlFor="plan-dds-text" fullWidth>
          <RichTextEditor
            id="plan-dds-text"
            toolbar="full"
            ariaLabel="DDS Text"
            value={current.entry.ddsText}
            onChange={(html) => updatePlanEntry(current.entry.id, { ddsText: html })}
          />
        </FormField>

        <Checkbox
          label="Complete"
          checked={current.entry.complete}
          onChange={(e) => updatePlanEntry(current.entry.id, { complete: e.target.checked })}
        />

        <FormField label="MOC Text" htmlFor="plan-moc-text" fullWidth>
          <Textarea id="plan-moc-text" rows={4} value={current.entry.methodText}
            placeholder="e.g. Design review will demonstrate compliance..."
            onChange={(e) => updatePlanEntry(current.entry.id, { methodText: e.target.value })} />
        </FormField>
        {current.rule.defaultMocText && current.entry.methodText !== current.rule.defaultMocText && (
          <div className="flex justify-start">
            <Button variant="secondary" size="sm"
              onClick={() => updatePlanEntry(current.entry.id, { methodText: current.rule.defaultMocText })}>
              Copy Regulation Default MOC Text
            </Button>
          </div>
        )}

        <FormField label="Comment" htmlFor="plan-comment" fullWidth>
          <Textarea id="plan-comment" rows={3} value={current.entry.comments}
            placeholder="Optional…"
            onChange={(e) => updatePlanEntry(current.entry.id, { comments: e.target.value })} />
        </FormField>

        <div className="grid gap-base border-t border-border-default pt-lg">
          <div className="flex flex-wrap items-center justify-between gap-base">
            <h3 className="text-sm font-semibold text-text-primary">GCP Data</h3>
            {/* No running total here — this table holds a handful of rows at
                most, all of them on screen at once, so a count restates what
                the reader can already see (client instruction, 2026-09-24). */}
            <Button size="sm" leadingIcon={<Plus size={14} />} onClick={() => setDrawer({ mode: 'create' })}>Add GCP Data</Button>
          </div>

          {currentItems.length === 0 ? (
            <EmptyState icon={<ListChecks size={48} strokeWidth={1.5} />}
              title="No GCP data yet"
              description="Add a row for each discipline that has work to do against this rule." />
          ) : (
            <div className="overflow-x-auto rounded-sm border border-border-default bg-neutral-25">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">GCP data for {current.rule.section}</caption>
                <thead>
                  <tr className="border-b border-border-default bg-neutral-50">
                    {['DAO Specialty Code', 'MOC Code', 'FOC Code', 'Deliverable #', 'Active'].map((h) => (
                      <th key={h} scope="col" className="whitespace-nowrap px-base py-base text-sm font-semibold text-text-secondary">{h}</th>
                    ))}
                    {/* Actions scrolls with the rest here, unlike every other
                        table in the app: this one is a handful of rows inside
                        a form, not a long list to scan, so pinning the column
                        bought nothing and its edge shadow read as a stray
                        divider mid-table (client instruction, 2026-09-24 —
                        this table only). */}
                    <th scope="col" className="whitespace-nowrap px-base py-base text-sm font-semibold text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((i) => (
                    <tr key={i.id} className="border-b border-border-default last:border-b-0">
                      <td className="whitespace-nowrap px-base py-base text-sm text-text-primary">{i.daoSpecialtyCode || '—'}</td>
                      <td className="whitespace-nowrap px-base py-base text-sm text-text-primary">{i.mocCode || '—'}</td>
                      <td className="whitespace-nowrap px-base py-base text-sm text-text-primary">{i.focCode || '—'}</td>
                      <td className="whitespace-nowrap px-base py-base text-sm text-text-primary">{i.deliverableId || '—'}</td>
                      <td className="whitespace-nowrap px-base py-base"><Badge tone={i.active ? 'success' : 'neutral'}>{i.active ? 'Active' : 'Inactive'}</Badge></td>
                      <td className="whitespace-nowrap px-base py-base">
                        <ActionsMenu
                          ariaLabel={`Actions for ${i.daoSpecialtyCode || 'GCP data row'}`}
                          items={[
                            { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setDrawer({ mode: 'edit', item: i }) },
                            { label: 'Remove', icon: <Trash2 size={16} />, onSelect: () => removeItem(i.id), tone: 'danger' },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="secondary" leadingIcon={<ArrowLeft size={16} />} onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Continue to Reports</Button>
      </div>

      {drawer && (
        <GcpItemDrawer
          mode={drawer.mode}
          initial={drawer.item}
          planEntryId={current.entry.id}
          ruleLabel={`${current.rule.section} · ${current.rule.amdt}`}
          onClose={() => setDrawer(null)}
        />
      )}
    </section>
  )
}
