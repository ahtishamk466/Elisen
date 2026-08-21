import { useMemo, useState } from 'react'
import { Plus, Search, Building2, Eye, Pencil, Trash2, CircleCheck, CircleOff } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Truncate } from '@/components/patterns/Truncate'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { CompanyDrawer } from './CompanyDrawer'
import { useLookupStore } from '@/stores/lookupStore'
import type { Company, CompanyContact } from '@/types/lookup'

/** Show at most this many contact chips inline; the rest collapse into a
    "+N more" chip. Matches the Allowed Tasks chips on Work Package cards. */
const CHIP_LIMIT = 2

/** Contacts as chips rather than a bare count — two names are readable at a
    glance, and the whole cell opens the company's View with the full list.
    Never more than two lines: "+N more" sits inline beside the second chip,
    not on a third row. */
function ContactChips({ contacts, onOpen }: { contacts: CompanyContact[]; onOpen: () => void }) {
  if (contacts.length === 0) return <span className="text-sm text-text-muted">—</span>
  const shown = contacts.slice(0, CHIP_LIMIT)
  const extra = contacts.length - shown.length
  const chip = 'max-w-full truncate rounded-sm bg-neutral-100 px-sm py-xxss text-xs text-text-secondary'
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onOpen() }}
      aria-label={`View all ${contacts.length} contact${contacts.length === 1 ? '' : 's'}`}
      className="flex flex-col items-start gap-xs rounded-sm text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
    >
      <span className={chip}>{shown[0].fullName}</span>
      {shown[1] && (
        <span className="flex items-center gap-sm">
          <span className={chip}>{shown[1].fullName}</span>
          {extra > 0 && (
            <span className="whitespace-nowrap text-xs text-text-primary underline underline-offset-2">+{extra} more</span>
          )}
        </span>
      )}
    </button>
  )
}

const HEADERS = ['Name', 'Contacts', 'Address', 'City', 'Zip Code', 'Status', 'Actions']

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
      const inCompany = `${c.name} ${c.city} ${c.country} ${c.address} ${c.postal}`.toLowerCase().includes(q)
      const contactHit = contactsOf(c.id).find((ct) => ct.fullName.toLowerCase().includes(q))
      if (!inCompany && !contactHit) return []
      return [{ company: c, matchedContact: contactHit && !inCompany ? contactHit.fullName : undefined }]
    })
  }, [companies, contacts, query]) // eslint-disable-line react-hooks/exhaustive-deps

  const { visibleCount, loadingMore, loadMore, reset: resetVisible } = useInfiniteReveal(filtered.length, 25)

  const loading = state === 'loading'

  if (state === 'error') {
    return (
      <AppShell title="Companies" activeItem="Reference Data" activeChild="Companies">
        <Alert title="We couldn't load companies">Refresh the page, and if it keeps happening, contact your administrator.</Alert>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Companies"
      description="Customers and their contacts."
      activeItem="Reference Data"
      activeChild="Companies"
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 400 }}>
            <label htmlFor="company-search" className="sr-only">Search companies and contacts</label>
            <Input size="sm"
              id="company-search" value={query} onChange={(e) => { setQuery(e.target.value); resetVisible() }}
              placeholder="Search companies or contacts..." leadingIcon={<Search size={16} />}
            />
          </div>
          <Button size="md" leadingIcon={<Plus size={16} />} onClick={() => setDrawer({ mode: 'create' })}>Add Company</Button>
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
            <table className="w-full border-collapse text-left" style={{ minWidth: 980 }}>
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
                  : filtered.slice(0, visibleCount).map(({ company: c, matchedContact }) => (
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
                        <td className="px-lg py-base align-top" style={{ maxWidth: 180 }}>
                          <ContactChips contacts={contactsOf(c.id)} onOpen={() => setDrawer({ mode: 'view', company: c })} />
                        </td>
                        <td className="px-lg py-base align-top text-sm text-text-primary" style={{ maxWidth: 260 }}><Truncate>{c.address || '—'}</Truncate></td>
                        <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">{c.city || '—'}</td>
                        <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">{c.postal || '—'}</td>
                        <td className="whitespace-nowrap px-lg py-base align-top">
                          <Badge tone={c.active ? 'success' : 'neutral'}>{c.active ? 'Active' : 'Inactive'}</Badge>
                        </td>
                        <td className="px-lg py-base align-top" onClick={(e) => e.stopPropagation()}>
                          <ActionsMenu
                            ariaLabel={`Actions for ${c.name}`}
                            items={[
                              { label: 'View', icon: <Eye size={16} />, onSelect: () => setDrawer({ mode: 'view', company: c }) },
                              { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setDrawer({ mode: 'edit', company: c }) },
                              c.active
                                ? { label: 'Deactivate', icon: <CircleOff size={16} />, onSelect: () => { updateCompany(c.id, { active: false }); setToast(`${c.name} deactivated, hidden from pickers.`) } }
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
            <AutoLoadFooter total={filtered.length} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="companies" />
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
