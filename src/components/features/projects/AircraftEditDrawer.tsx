import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { projectLabel } from './useProjectLabel'
import type { AircraftEntry, ProjectListRow } from '@/types/project'

export interface AircraftEditDrawerProps {
  open: boolean
  row: ProjectListRow
  onClose: () => void
  onSave: (aircraft: AircraftEntry[]) => void
}

const blankAircraft = (): AircraftEntry => ({ id: crypto.randomUUID(), modelName: '', modelNumber: '', manufacturer: '' })

/** A project can apply to more than one aircraft type — add/remove entries
    freely; the last remaining entry can't be deleted (blank it instead). */
export function AircraftEditDrawer({ open, row, onClose, onSave }: AircraftEditDrawerProps) {
  const [entries, setEntries] = useState<AircraftEntry[]>(() => (row.aircraft.length ? row.aircraft : [blankAircraft()]))
  const [collapsed, setCollapsed] = useState<string[]>([])

  const toggleCollapsed = (id: string) =>
    setCollapsed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const updateEntry = <K extends keyof AircraftEntry>(id: string, key: K, value: AircraftEntry[K]) =>
    setEntries((prev) => prev.map((a) => (a.id === id ? { ...a, [key]: value } : a)))

  const removeEntry = (id: string) => setEntries((prev) => (prev.length > 1 ? prev.filter((a) => a.id !== id) : prev))

  const handleSave = () => {
    onSave(entries.filter((a) => a.modelName.trim() || a.modelNumber.trim() || a.manufacturer.trim()))
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Edit Aircraft “${projectLabel(row)}”`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </>
      }
    >
      <FormSection title="Aircraft" subtitle="Basic details that identify this project.">
        {/* Entries are separated by a divider rule, not nested boxes — the
            FormSection card is already the surrounding container. */}
        {entries.map((a, i) => {
          const isOpen = !collapsed.includes(a.id)
          return (
            <div key={a.id} className={i > 0 ? 'border-t border-border-default pt-lg' : ''}>
              <div className="flex items-center justify-between gap-lg">
                <button
                  type="button"
                  onClick={() => toggleCollapsed(a.id)}
                  aria-expanded={isOpen}
                  className="flex items-center gap-xs rounded-sm text-sm font-semibold text-text-primary transition-colors duration-fast hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                >
                  <span aria-hidden className="text-text-muted">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                  {a.modelName || `Aircraft ${i + 1}`}
                </button>
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEntry(a.id)}
                    aria-label={`Remove ${a.modelName || `aircraft ${i + 1}`}`}
                    className="rounded-sm p-xs text-text-secondary transition-colors duration-fast hover:bg-neutral-100 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                )}
              </div>
              {isOpen && (
                <div className="mt-lg grid gap-lg">
                  <FormField label="Model Name" htmlFor={`modelName-${a.id}`} required>
                    <Input id={`modelName-${a.id}`} value={a.modelName} placeholder="e.g. King Air 350" onChange={(e) => updateEntry(a.id, 'modelName', e.target.value)} />
                  </FormField>
                  <FormField label="Model Number" htmlFor={`modelNumber-${a.id}`} required>
                    <Input id={`modelNumber-${a.id}`} value={a.modelNumber} placeholder="e.g. BE350" onChange={(e) => updateEntry(a.id, 'modelNumber', e.target.value)} />
                  </FormField>
                  <FormField label="Manufacture" htmlFor={`manufacturer-${a.id}`} required>
                    <Input id={`manufacturer-${a.id}`} value={a.manufacturer} placeholder="e.g. Beechcraft" onChange={(e) => updateEntry(a.id, 'manufacturer', e.target.value)} />
                  </FormField>
                </div>
              )}
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => setEntries((prev) => [...prev, blankAircraft()])}
          className="flex w-fit items-center gap-xs rounded-sm text-sm font-semibold text-text-primary transition-colors duration-fast hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          <Plus size={16} aria-hidden /> Add Another Aircraft
        </button>
      </FormSection>
    </Drawer>
  )
}
