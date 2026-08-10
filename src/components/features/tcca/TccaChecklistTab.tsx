import { AccordionSection } from '@/components/patterns/AccordionSection'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useTccaStore } from '@/stores/tccaStore'
import { TCCA_CHECKLIST } from '@/lib/tccaChecklist'
import type { TccaProject } from '@/types/tcca'

/**
 * One standard checklist per TCCA project. Unticked = Not Applicable;
 * ticked without a date = applicable, in progress; ticked with a date =
 * complete. This mirrors the client's existing form logic exactly.
 */
export function TccaChecklistTab({ tcca }: { tcca: TccaProject }) {
  const setChecklistItem = useTccaStore((s) => s.setChecklistItem)

  const applicableIds = Object.keys(tcca.checklist)
  const completeCount = applicableIds.filter((id) => tcca.checklist[id]).length

  return (
    <div className="grid gap-lg">
      <div className="flex flex-wrap items-center justify-between gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg py-base">
        <p className="text-sm text-text-secondary">
          Tick what applies to this certificate; enter the date when each task is completed.
        </p>
        <p className="text-sm font-semibold text-text-primary">
          {completeCount} of {applicableIds.length} applicable items complete
        </p>
      </div>

      {TCCA_CHECKLIST.map((phase) => {
        const applicable = phase.items.filter((i) => i.id in tcca.checklist)
        const complete = applicable.filter((i) => tcca.checklist[i.id])
        return (
          <AccordionSection
            key={phase.id}
            title={phase.title}
            meta={`${complete.length} of ${applicable.length} complete · ${phase.items.length - applicable.length} N/A`}
          >
            <div className="grid gap-base">
              {phase.items.map((item) => {
                const isApplicable = item.id in tcca.checklist
                const date = tcca.checklist[item.id] ?? ''
                return (
                  <div key={item.id} className="grid items-center gap-sm tablet:grid-cols-[1fr_180px_130px]">
                    <Checkbox
                      label={item.label}
                      checked={isApplicable}
                      onChange={() => setChecklistItem(tcca.id, item.id, isApplicable ? undefined : '')}
                    />
                    <div>
                      <label htmlFor={`date-${item.id}`} className="sr-only">{item.label} completion date</label>
                      <Input
                        id={`date-${item.id}`}
                        type="date"
                        value={date}
                        disabled={!isApplicable}
                        onChange={(e) => setChecklistItem(tcca.id, item.id, e.target.value)}
                      />
                    </div>
                    <div>
                      {!isApplicable ? (
                        <Badge tone="neutral">Not applicable</Badge>
                      ) : date ? (
                        <Badge tone="success">Complete</Badge>
                      ) : (
                        <Badge tone="warning">In progress</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </AccordionSection>
        )
      })}
    </div>
  )
}
