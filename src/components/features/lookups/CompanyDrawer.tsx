import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { DetailCard, DetailField } from '@/components/patterns/DetailView'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PhoneInput } from '@/components/ui/PhoneInput'
import type { Company, CompanyContact } from '@/types/lookup'

export interface CompanyDrawerProps {
  mode: 'create' | 'edit' | 'view'
  initial?: Company
  initialContacts?: CompanyContact[]
  onClose: () => void
  onSave: (company: Company, contacts: CompanyContact[]) => void
}

const phoneLabel = (countryCode: string, number: string) => [countryCode, number].filter(Boolean).join(' ')

export function CompanyDrawer({ mode, initial, initialContacts = [], onClose, onSave }: CompanyDrawerProps) {
  const isView = mode === 'view'
  const isEdit = mode === 'edit'
  const companyId = initial?.id ?? crypto.randomUUID()
  const [c, setC] = useState<Company>(initial ?? {
    id: companyId, name: '', address: '', city: '', country: '', postal: '', active: true,
  })
  const [contacts, setContacts] = useState<CompanyContact[]>(initialContacts)
  const [collapsed, setCollapsed] = useState<string[]>([])
  const [error, setError] = useState('')

  const toggleCollapsed = (id: string) =>
    setCollapsed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const setField = <K extends keyof Company>(key: K, value: Company[K]) => setC((prev) => ({ ...prev, [key]: value }))
  const setContact = <K extends keyof CompanyContact>(id: string, key: K, value: CompanyContact[K]) =>
    setContacts((prev) => prev.map((x) => (x.id === id ? { ...x, [key]: value } : x)))

  const addContact = () =>
    setContacts((prev) => [...prev, { id: crypto.randomUUID(), companyId, fullName: '', phoneCountryCode: '', phoneNumber: '', active: true }])

  const submit = () => {
    if (!c.name.trim()) { setError('Company name is required.'); return }
    onSave(
      { ...c, name: c.name.trim() },
      contacts.filter((x) => x.fullName.trim()).map((x) => ({ ...x, fullName: x.fullName.trim() })),
    )
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isView ? `Company “${initial!.name}”` : isEdit ? `Edit Company “${initial!.name}”` : 'Add Company'}
      footer={
        isView ? (
          <Button variant="secondary" onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create Company'}</Button>
          </>
        )
      }
    >
      {isView ? (
        // One card, everything about the record — the company's own fields,
        // then each contact as a divider-separated group underneath, never
        // a second bordered box for "Contacts". Same standard as Aircraft.
        <DetailCard title="Company">
          <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
            <DetailField label="Name">{c.name}</DetailField>
            <DetailField label="City">{c.city}</DetailField>
            <DetailField label="Country">{c.country}</DetailField>
            <DetailField label="Address">{c.address}</DetailField>
            <DetailField label="Zip Code" nowrap>{c.postal}</DetailField>
            <DetailField label="Active">{c.active ? 'Active' : 'Inactive'}</DetailField>
          </div>

          <div className="mt-2xl border-t border-border-default pt-lg">
            <h3 className="text-sm font-semibold text-text-primary">Contacts</h3>
            {contacts.length === 0 ? (
              <p className="mt-sm text-sm text-text-muted">No contacts yet.</p>
            ) : (
              <div className="mt-lg grid gap-lg">
                {contacts.map((ct, i) => (
                  <div key={ct.id} className={i > 0 ? 'border-t border-border-default pt-lg' : ''}>
                    <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
                      <DetailField label="Full Name">{ct.fullName}</DetailField>
                      <DetailField label="Phone No" nowrap>{phoneLabel(ct.phoneCountryCode, ct.phoneNumber)}</DetailField>
                      <DetailField label="Status">{ct.active ? 'Active' : 'Inactive'}</DetailField>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DetailCard>
      ) : (
        <>
          <FormSection title="Company" subtitle="Customer or partner organisation.">
            <FormField label="Name" htmlFor="co-name" required error={error}>
              <Input id="co-name" value={c.name} error={!!error} placeholder="e.g. Air Canada" onChange={(e) => { setField('name', e.target.value); setError('') }} />
            </FormField>
            <FormField label="Address" htmlFor="co-address">
              <Input id="co-address" value={c.address} placeholder="Street, unit, province/state" onChange={(e) => setField('address', e.target.value)} />
            </FormField>
            <FormField label="City" htmlFor="co-city">
              <Input id="co-city" placeholder="e.g. Dorval" value={c.city} onChange={(e) => setField('city', e.target.value)} />
            </FormField>
            <FormField label="Country" htmlFor="co-country">
              <Input id="co-country" placeholder="e.g. Canada" value={c.country} onChange={(e) => setField('country', e.target.value)} />
            </FormField>
            <FormField label="Postal / Zipcode" htmlFor="co-postal">
              <Input id="co-postal" placeholder="e.g. H4Y 1C2" value={c.postal} onChange={(e) => setField('postal', e.target.value)} />
            </FormField>
            <FormField label="Status" htmlFor="co-status" help="Inactive keeps history, out of the pickers.">
              <Select id="co-status" value={c.active ? 'active' : 'inactive'} onChange={(e) => setField('active', e.target.value === 'active')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormField>
          </FormSection>

          {/* Collapsible entry per contact with stacked FormFields — the same
              pattern as AircraftEditDrawer's aircraft entries, so every
              repeated-child list in the app reads the same way. */}
          <FormSection title="Contacts" subtitle="People at this company. Entries without a name are dropped on save.">
            {contacts.length === 0 && <p className="text-sm text-text-muted">No contacts yet.</p>}
            {contacts.map((ct, i) => {
              const isOpen = !collapsed.includes(ct.id)
              return (
                <div key={ct.id} className={i > 0 ? 'border-t border-border-default pt-lg' : ''}>
                  <div className="flex items-center justify-between gap-lg">
                    <button
                      type="button"
                      onClick={() => toggleCollapsed(ct.id)}
                      aria-expanded={isOpen}
                      className="flex items-center gap-xs rounded-sm text-sm font-semibold text-text-primary transition-colors duration-fast hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                    >
                      <span aria-hidden className="text-text-muted">
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                      {ct.fullName || `Contact ${i + 1}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setContacts((prev) => prev.filter((x) => x.id !== ct.id))}
                      aria-label={`Remove ${ct.fullName || `contact ${i + 1}`}`}
                      className="rounded-sm p-xs text-text-secondary transition-colors duration-fast hover:bg-neutral-100 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="mt-lg grid gap-lg">
                      <FormField label="Full Name" htmlFor={`ct-name-${ct.id}`}>
                        <Input
                          id={`ct-name-${ct.id}`} value={ct.fullName} placeholder="e.g. Adrian Bergstrom"
                          onChange={(e) => setContact(ct.id, 'fullName', e.target.value)}
                        />
                      </FormField>
                      <FormField label="Phone No" htmlFor={`ct-phone-${ct.id}`}>
                        <PhoneInput
                          id={`ct-phone-${ct.id}`}
                          countryCode={ct.phoneCountryCode} onCountryCodeChange={(v) => setContact(ct.id, 'phoneCountryCode', v)}
                          number={ct.phoneNumber} onNumberChange={(v) => setContact(ct.id, 'phoneNumber', v)}
                        />
                      </FormField>
                      <FormField label="Status" htmlFor={`ct-status-${ct.id}`}>
                        <Select
                          id={`ct-status-${ct.id}`}
                          value={ct.active ? 'active' : 'inactive'}
                          onChange={(e) => setContact(ct.id, 'active', e.target.value === 'active')}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </Select>
                      </FormField>
                    </div>
                  )}
                </div>
              )
            })}

            <button
              type="button"
              onClick={addContact}
              className="flex w-fit items-center gap-xs rounded-sm text-sm font-semibold text-text-primary transition-colors duration-fast hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
            >
              <Plus size={16} aria-hidden /> Add Another Contact
            </button>
          </FormSection>
        </>
      )}
    </Drawer>
  )
}
