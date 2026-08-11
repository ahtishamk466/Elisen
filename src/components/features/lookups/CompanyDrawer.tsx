import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import type { Company, CompanyContact } from '@/types/lookup'

export interface CompanyDrawerProps {
  mode: 'create' | 'edit'
  initial?: Company
  initialContacts?: CompanyContact[]
  onClose: () => void
  onSave: (company: Company, contacts: CompanyContact[]) => void
}

export function CompanyDrawer({ mode, initial, initialContacts = [], onClose, onSave }: CompanyDrawerProps) {
  const isEdit = mode === 'edit'
  const companyId = initial?.id ?? crypto.randomUUID()
  const [c, setC] = useState<Company>(initial ?? {
    id: companyId, name: '', address1: '', address2: '', city: '', provState: '', country: '', postal: '', phone: '', active: true,
  })
  const [contacts, setContacts] = useState<CompanyContact[]>(initialContacts)
  const [error, setError] = useState('')

  const setField = <K extends keyof Company>(key: K, value: Company[K]) => setC((prev) => ({ ...prev, [key]: value }))
  const setContact = <K extends keyof CompanyContact>(id: string, key: K, value: CompanyContact[K]) =>
    setContacts((prev) => prev.map((x) => (x.id === id ? { ...x, [key]: value } : x)))

  const addContact = () =>
    setContacts((prev) => [...prev, { id: crypto.randomUUID(), companyId, fullName: '', phone: '', active: true }])

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
      title={isEdit ? `Edit Company “${initial!.name}”` : 'Add Company'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create Company'}</Button>
        </>
      }
    >
      <FormSection title="Company" subtitle="Customer or partner organisation.">
        <FormField label="Name" htmlFor="co-name" required error={error}>
          <Input id="co-name" value={c.name} error={!!error} placeholder="e.g. Air Canada" onChange={(e) => { setField('name', e.target.value); setError('') }} />
        </FormField>
        <FormField label="Address Line 1" htmlFor="co-a1">
          <Input id="co-a1" value={c.address1} onChange={(e) => setField('address1', e.target.value)} />
        </FormField>
        <FormField label="Address Line 2" htmlFor="co-a2">
          <Input id="co-a2" value={c.address2} onChange={(e) => setField('address2', e.target.value)} />
        </FormField>
        <FormField label="City" htmlFor="co-city">
          <Input id="co-city" value={c.city} onChange={(e) => setField('city', e.target.value)} />
        </FormField>
        <FormField label="Prov / State" htmlFor="co-prov">
          <Input id="co-prov" value={c.provState} onChange={(e) => setField('provState', e.target.value)} />
        </FormField>
        <FormField label="Country" htmlFor="co-country">
          <Input id="co-country" value={c.country} onChange={(e) => setField('country', e.target.value)} />
        </FormField>
        <FormField label="Postal / Zipcode" htmlFor="co-postal">
          <Input id="co-postal" value={c.postal} onChange={(e) => setField('postal', e.target.value)} />
        </FormField>
        <FormField label="Telephone" htmlFor="co-phone">
          <Input id="co-phone" value={c.phone} onChange={(e) => setField('phone', e.target.value)} />
        </FormField>
        <Checkbox label="Active — available in pickers across the app" checked={c.active} onChange={() => setField('active', !c.active)} />
      </FormSection>

      {/* Compact rows rather than stacked FormFields — a company can have
          several contacts, and this reads as the table it replaces. */}
      <FormSection title="Contacts" subtitle="People at this company. Rows without a name are dropped on save.">
        {contacts.length === 0 ? (
          <p className="text-sm text-text-muted">No contacts yet.</p>
        ) : (
          <div className="grid gap-sm">
            <div className="hidden items-center gap-sm tablet:flex">
              <span className="min-w-0 flex-1 text-xs font-semibold text-text-secondary">Full Name</span>
              <span className="text-xs font-semibold text-text-secondary" style={{ width: 180 }}>Telephone</span>
              <span className="text-xs font-semibold text-text-secondary" style={{ width: 64 }}>Active</span>
              <span className="sr-only">Remove</span>
              <span aria-hidden style={{ width: 28 }} />
            </div>
            {contacts.map((ct, i) => (
              <div key={ct.id} className="flex flex-wrap items-center gap-sm border-t border-border-default pt-sm tablet:border-t-0 tablet:pt-0">
                <div className="min-w-0 flex-1">
                  <Input
                    aria-label={`Full name, contact ${i + 1}`} value={ct.fullName} placeholder="e.g. Remi Rocheleau"
                    onChange={(e) => setContact(ct.id, 'fullName', e.target.value)}
                  />
                </div>
                <div style={{ width: 180 }}>
                  <Input
                    aria-label={`Telephone, contact ${i + 1}`} value={ct.phone} placeholder="Telephone"
                    onChange={(e) => setContact(ct.id, 'phone', e.target.value)}
                  />
                </div>
                <div style={{ width: 64 }}>
                  <Checkbox
                    aria-label={`Active, contact ${i + 1}`} checked={ct.active}
                    onChange={() => setContact(ct.id, 'active', !ct.active)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setContacts((prev) => prev.filter((x) => x.id !== ct.id))}
                  aria-label={`Remove contact ${ct.fullName || i + 1}`}
                  className="rounded-sm p-xs text-text-secondary transition-colors duration-fast hover:bg-neutral-100 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={addContact}
          className="flex w-fit items-center gap-xs rounded-sm text-sm font-semibold text-text-primary transition-colors duration-fast hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          <Plus size={16} aria-hidden /> Add Contact
        </button>
      </FormSection>
    </Drawer>
  )
}
