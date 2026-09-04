import { useState } from 'react'
import { Link2, Plane, Trash2 } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useLookupStore } from '@/stores/lookupStore'
import { projectLabel } from './useProjectLabel'
import type { AircraftEntry, ProjectListRow } from '@/types/project'

export interface AircraftEditDrawerProps {
  open: boolean
  row: ProjectListRow
  onClose: () => void
  onSave: (aircraft: AircraftEntry[]) => void
}

/**
 * Link aircraft to a project from the Reference Data catalog — never type them
 * in here. A project can carry as many as it needs.
 *
 * "Link" is the verb used across all four association tabs (Aircraft,
 * Approvals, Deliverables, Design Data) so the same gesture always reads the
 * same way — and because "attach" is ambiguous on screens whose records hold
 * file URLs, where it can be misread as "upload a file".
 *
 * Serial number is optional and separate: when a project is opened the team
 * often knows only the type ("a 777"), and the specific airframe is assigned
 * later. Picking a serial afterwards updates the existing row rather than
 * creating a second one.
 */
export function AircraftEditDrawer({ open, row, onClose, onSave }: AircraftEditDrawerProps) {
  const catalog = useLookupStore((s) => s.aircraft)
  const serials = useLookupStore((s) => s.serials)

  const [entries, setEntries] = useState<AircraftEntry[]>(() => row.aircraft)
  const [pick, setPick] = useState('')

  const attach = () => {
    const model = catalog.find((a) => a.id === pick)
    if (!model) return
    setEntries((prev) => [...prev, {
      id: crypto.randomUUID(),
      aircraftId: model.id,
      modelName: model.modelName || model.modelNumber,
      modelNumber: model.modelNumber,
      manufacturer: model.manufacturer,
    }])
    setPick('')
  }

  const setSerial = (entryId: string, serialId: string) =>
    setEntries((prev) => prev.map((e) => {
      if (e.id !== entryId) return e
      const s = serials.find((x) => x.id === serialId)
      return { ...e, serialId: serialId || undefined, serial: s?.serial }
    }))

  const remove = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id))

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Aircraft: ${projectLabel(row)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave(entries); onClose() }}>Save Changes</Button>
        </>
      }
    >
      <FormSection
        title="Link aircraft"
        subtitle="Select from the aircraft in Reference Data. Link as many as the project covers. They are created and managed in Reference Data."
      >
        <div className="flex flex-wrap items-center gap-sm">
          <div className="min-w-0 flex-1" style={{ minWidth: 240 }}>
            <SearchableSelect
              id="attach-aircraft"
              size="sm"
              value={pick}
              onChange={setPick}
              placeholder="Search aircraft by model or manufacturer..."
              emptyLabel="No aircraft in Reference Data yet."
              options={catalog
                // Inactive aircraft stay on projects that already use them,
                // but can't be linked to anything new.
                .filter((a) => a.active || entries.some((e) => e.aircraftId === a.id))
                .map((a) => ({
                  value: a.id,
                  label: a.modelName ? `${a.modelNumber}: ${a.modelName}` : a.modelNumber,
                  hint: a.manufacturer,
                  disabled: entries.some((e) => e.aircraftId === a.id),
                  disabledReason: 'Already linked to this project',
                }))}
            />
          </div>
          <Button leadingIcon={<Link2 size={16} />} onClick={attach} disabled={!pick}>Link to project</Button>
        </div>
      </FormSection>

      <FormSection
        title={`Linked aircraft (${entries.length})`}
        subtitle="Serial number is optional, add it once the specific airframe is known."
      >
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-sm rounded-sm border border-dashed border-border-default bg-neutral-50 px-lg py-2xl text-center">
            <Plane size={24} aria-hidden className="text-text-muted" />
            <p className="text-sm text-text-muted">No aircraft linked yet.</p>
          </div>
        ) : (
          entries.map((e, i) => {
            const options = serials.filter((s) => s.aircraftId === e.aircraftId && s.active)
            return (
              <div key={e.id} className={i > 0 ? 'border-t border-border-default pt-lg' : ''}>
                <div className="flex items-start justify-between gap-lg">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{e.modelNumber}</p>
                    <p className="text-xs text-text-muted">
                      {[e.modelName, e.manufacturer].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(e.id)}
                    aria-label={`Remove ${e.modelNumber} from this project`}
                    className="rounded-sm p-xs text-text-secondary transition-colors duration-fast hover:bg-neutral-100 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
                <div className="mt-base grid gap-xs">
                  <label htmlFor={`serial-${e.id}`} className="text-xs font-semibold text-text-secondary">
                    Serial No (optional)
                  </label>
                  <SearchableSelect
                    id={`serial-${e.id}`}
                    value={e.serialId ?? ''}
                    onChange={(v) => setSerial(e.id, v)}
                    placeholder={options.length ? 'Not assigned yet' : 'No serials recorded for this aircraft'}
                    emptyLabel="No serials recorded for this aircraft."
                    options={options.map((s) => ({
                      value: s.id,
                      label: s.serial,
                      hint: s.registration || undefined,
                    }))}
                  />
                </div>
              </div>
            )
          })
        )}
      </FormSection>
    </Drawer>
  )
}
