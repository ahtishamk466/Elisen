import { useMemo, useState } from 'react'
import { Plus, Search, Building2, Eye, Pencil, Trash2, CircleCheck, CircleOff } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { Pagination } from '@/components/patterns/Pagination'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Truncate } from '@/components/patterns/Truncate'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { CompanyDrawer } from './CompanyDrawer'
import { useLookupStore } from '@/stores/lookupStore'
import type { Company } from '@/types/lookup'

const HEADERS = ['Name', 'City, Country', 'Address Line 1', 'Address Line 2', 'Province/State', 'Zip Code', 'Contacts', 'Active', 'Actions']

export type PageState = 'ready' | 'loading' | 'error'

/** Old "Companies" + "Contacts" lookup pages merged: a contact belongs to a
    company, so contacts are managed inside the company — see docs/DECISIONS.md. */
export function CompaniesPage({ state = 'ready' }: { state?: PageState }) {
  const companies = useLookupStore((s) => s.companies)
  const contacts = useLookupStore((s) => s.contacts)
  const saveCompany = useLookupStore((s) => s.saveCompany)
  const updateCompany = useLookupStore((s) => s.updateCompany)
  const removeCompany = useLookupStore((s) => s.removeCompany)

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [drawer, setDrawer] = useState<{ mode: 'create' | 'edit' | 'view'; company?: Company } | null>(null)
  const [deleting, setDeleting] = useState<Company | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const contactsOf = (companyId: string) => contacts.filter((c) => c.companyId === companyId)

  /** Matches company fields OR a contact's name — finding a person finds
      their company (the one thing the flat Contacts page was good at). */
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return companies.map((c) => ({ company: c, matchedContact: undefined as string | undefined }))
    return companies.flatMap((c) => {
      const inCompany = `${c.name} ${c.city} ${c.country} ${c.address1} ${c.address2} ${c.provState} ${c.postal} ${c.phoneNumber}`.toLowerCase().includes(q)
      const contactHit = contactsOf(c.id).find((ct) => ct.fullName.toLowerCase().includes(q))
      if (!inCompany && !contactHit) return []
      return [{ company: c, matchedContact: contactHit && !inCompany ? contactHit.fullName : undefined }]
    })
  }, [companies, contacts, query]) // eslint-disable-line react-hooks/exhaustive-deps

  const loading = state === 'loading'

  if (state === 'error') {
    return (
      <AppShell title="Companies & Contacts" activeItem="Admin" activeChild="Companies & Contacts">
        <Alert title="We couldn't load companies">Refresh the page, and if it keeps happening, contact your administrator.</Alert>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Companies & Contacts"
      activeItem="Admin"
      activeChild="Companies & Contacts"
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 300 }}>
            <label htmlFor="company-search" className="sr-only">Search companies and contacts</label>
            <Input
              id="company-search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              placeholder="Search companies or contacts..." leadingIcon={<Search size={16} />}
            />
          </div>
          <Button size="lg" leadingIcon={<Plus size={16} />} onClick={() => setDrawer({ mode: 'create' })}>Add Company</Button>
        </>
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        {!loading && filtered.length === 0 ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<Building2 size={48} strokeWidth={1.5} />}
              title={query ? 'No companies or contacts match your search' : 'No companies yet'}
              description={query ? 'Try a different company or person name.' : 'Add the customers and partners projects will reference.'}
              action={query
                ? <Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>
                : <Button leadingIcon={<Plus size={16} />} onClick={() => setDrawer({ mode: 'create' })}>Add Company</Button>}
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left" style={{ minWidth: 1240 }}>
              <caption className="sr-only">Companies and their contacts</caption>
              <thead>
                <tr className="border-b border-border-default bg-neutral-50">
                  {HEADERS.map((h) => (
                    <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }, (_, i) => (
                      <tr key={i} className="border-b border-border-default last:border-b-0">
                        {HEADERS.map((h) => <td key={h} className="px-lg py-base"><Skeleton className="h-4 w-full" /></td>)}
                      </tr>
                    ))
                  : filtered.slice((page - 1) * pageSize, page * pageSize).map(({ company: c, matchedContact }) => (
                      <tr
                        key={c.id}
                        onClick={() => setDrawer({ mode: 'edit', company: c })}
                        className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle"
                      >
                        <td className="px-lg py-base align-top" style={{ maxWidth: 220 }}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDrawer({ mode: 'edit', company: c }) }}
                            className="block w-full text-left text-sm font-semibold text-text-primary underline-offset-2 hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                          >
                            <Truncate lines={1}>{c.name}</Truncate>
                          </button>
                          {matchedContact && (
                            <span className="ml-sm"><Badge appearance="outline">contact: {matchedContact}</Badge></span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">
                          {[c.city, c.country].filter(Boolean).join(', ') || '—'}
                        </td>
                        <td className="px-lg py-base align-top text-sm text-text-primary" style={{ maxWidth: 180 }}><Truncate>{c.address1 || '—'}</Truncate></td>
                        <td className="px-lg py-base align-top text-sm text-text-primary" style={{ maxWidth: 180 }}><Truncate>{c.address2 || '—'}</Truncate></td>
                        <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">{c.provState || '—'}</td>
                        <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">{c.postal || '—'}</td>
                        <td className="px-lg py-base align-top text-sm text-text-primary">{contactsOf(c.id).length}</td>
                        <td className="px-lg py-base align-top">
                          <Badge tone={c.active ? 'success' : 'neutral'} dot>{c.active ? 'Active' : 'Inactive'}</Badge>
                        </td>
                        <td className="px-lg py-base align-top" onClick={(e) => e.stopPropagation()}>
                          <ActionsMenu
                            ariaLabel={`Actions for ${c.name}`}
                            items={[
                              { label: 'View', icon: <Eye size={16} />, onSelect: () => setDrawer({ mode: 'view', company: c }) },
                              { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setDrawer({ mode: 'edit', company: c }) },
                              c.active
                                ? { label: 'Deactivate', icon: <CircleOff size={16} />, onSelect: () => { updateCompany(c.id, { active: false }); setToast(`${c.name} deactivated — hidden from pickers.`) } }
                                : { label: 'Activate', icon: <CircleCheck size={16} />, onSelect: () => { updateCompany(c.id, { active: true }); setToast(`${c.name} activated.`) } },
                              { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeleting(c), tone: 'danger' },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {!loading && (
            <Pagination
              page={page} pageSize={pageSize} totalItems={filtered.length} itemLabel="companies"
              onPageChange={setPage} onPageSizeChange={setPageSize}
            />
          )}
          </div>
        )}
      </div>

      {drawer && (
        <CompanyDrawer
          key={`${drawer.mode}-${drawer.company?.id ?? 'new'}`}
          mode={drawer.mode}
          initial={drawer.company}
          initialContacts={drawer.company ? contactsOf(drawer.company.id) : []}
          onClose={() => setDrawer(null)}
          onSave={(company, cts) => { saveCompany(company, cts); setToast(`Company "${company.name}" saved.`) }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete this company?"
        description={
          deleting
            ? `"${deleting.name}" and its ${contactsOf(deleting.id).length} contact${contactsOf(deleting.id).length === 1 ? '' : 's'} will be permanently removed. Prefer Deactivate to keep history.`
            : ''
        }
        confirmLabel="Delete company"
        tone="danger"
        onConfirm={() => { if (deleting) { removeCompany(deleting.id); setToast(`Company "${deleting.name}" deleted.`) } setDeleting(null) }}
        onCancel={() => setDeleting(null)}
      />
    </AppShell>
  )
}
