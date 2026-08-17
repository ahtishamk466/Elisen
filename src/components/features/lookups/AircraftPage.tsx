import { useMemo, useState } from 'react'
import { Plus, Search, Plane, Eye, Pencil, Trash2, CircleCheck, CircleOff } from 'lucide-react'
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
import { AircraftModelDrawer } from './AircraftModelDrawer'
import { useLookupStore } from '@/stores/lookupStore'
import type { AircraftModel, AircraftSerial } from '@/types/lookup'

const HEADERS = ['Serial No', 'Reg. No', 'Model Number', 'Model Name', 'Manufacture', 'TCCA TC', 'FAA TC', 'EASA TC', 'Prefix', 'Comment', 'Active', 'Actions']

export type PageState = 'ready' | 'loading' | 'error'

/** Old "Aircraft" + "Serial Numbers" lookup pages merged: one row per serial
    (matching the old flat Serial Number List), model details repeated on
    each row. A model with no serials still gets one row so it isn't lost.
    Editing/viewing/deleting always act on the model — see docs/DECISIONS.md. */
export function AircraftPage({ state = 'ready' }: { state?: PageState }) {
  const aircraft = useLookupStore((s) => s.aircraft)
  const serials = useLookupStore((s) => s.serials)
  const saveAircraft = useLookupStore((s) => s.saveAircraft)
  const updateAircraft = useLookupStore((s) => s.updateAircraft)
  const removeAircraft = useLookupStore((s) => s.removeAircraft)

  const [query, setQuery] = useState('')
  const [drawer, setDrawer] = useState<{ mode: 'create' | 'edit' | 'view'; model?: AircraftModel; serial?: AircraftSerial } | null>(null)
  const [deleting, setDeleting] = useState<AircraftModel | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const serialsOf = (aircraftId: string) => serials.filter((s) => s.aircraftId === aircraftId)

  const flatRows = useMemo(() => aircraft.flatMap((a) => {
    const ss = serialsOf(a.id)
    return ss.length === 0
      ? [{ model: a, serial: undefined as AircraftSerial | undefined }]
      : ss.map((s) => ({ model: a, serial: s }))
  }), [aircraft, serials]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Matches model fields OR this row's own serial/registration — a search
      for "C-GHPE" surfaces only that serial row, not every 767-33A row. */
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return flatRows
    return flatRows.filter(({ model: a, serial: s }) => {
      const inModel = `${a.modelNumber} ${a.modelName} ${a.manufacturer}`.toLowerCase().includes(q)
      const inSerial = s ? `${s.serial} ${s.registration}`.toLowerCase().includes(q) : false
      return inModel || inSerial
    })
  }, [flatRows, query])

  const { visibleCount, loadingMore, loadMore, reset: resetVisible } = useInfiniteReveal(filtered.length, 25)

  const loading = state === 'loading'

  if (state === 'error') {
    return (
      <AppShell title="Aircraft" activeItem="Reference Data" activeChild="Aircraft">
        <Alert title="We couldn't load aircraft">Refresh the page, and if it keeps happening, contact your administrator.</Alert>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Aircraft"
      activeItem="Reference Data"
      activeChild="Aircraft"
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 400 }}>
            <label htmlFor="aircraft-search" className="sr-only">Search aircraft and serials</label>
            <Input size="sm"
              id="aircraft-search" value={query} onChange={(e) => { setQuery(e.target.value); resetVisible() }}
              placeholder="Search by model, serial or registration..." leadingIcon={<Search size={16} />}
            />
          </div>
          <Button size="md" leadingIcon={<Plus size={16} />} onClick={() => setDrawer({ mode: 'create' })}>Add Aircraft</Button>
        </>
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        {!loading && filtered.length === 0 ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<Plane size={48} strokeWidth={1.5} />}
              title={query ? 'No aircraft match your search' : 'No aircraft yet'}
              description={query ? 'Try a different model, serial or registration.' : 'Add the aircraft types projects and drawings will reference.'}
              action={query
                ? <Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>
                : <Button leadingIcon={<Plus size={16} />} onClick={() => setDrawer({ mode: 'create' })}>Add Aircraft</Button>}
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left" style={{ minWidth: 1240 }}>
              <caption className="sr-only">Aircraft serial numbers and their model</caption>
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
                  : filtered.slice(0, visibleCount).map(({ model: a, serial: s }) => (
                      <tr
                        key={`${a.id}-${s?.id ?? 'none'}`}
                        onClick={() => setDrawer({ mode: 'edit', model: a, serial: s })}
                        className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle"
                      >
                        <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">{s?.serial || '—'}</td>
                        <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">{s?.registration || '—'}</td>
                        <td className="whitespace-nowrap px-lg py-base align-top">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDrawer({ mode: 'edit', model: a, serial: s }) }}
                            className="text-left text-sm font-semibold text-text-primary underline-offset-2 hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                          >
                            {a.modelNumber}
                          </button>
                        </td>
                        <td className="px-lg py-base align-top text-sm text-text-primary" style={{ maxWidth: 200 }}><Truncate>{a.modelName || '—'}</Truncate></td>
                        <td className="px-lg py-base align-top text-sm text-text-primary" style={{ maxWidth: 160 }}><Truncate>{a.manufacturer || '—'}</Truncate></td>
                        <td className="px-lg py-base align-top text-sm text-text-primary">{a.tccaTc || '—'}</td>
                        <td className="px-lg py-base align-top text-sm text-text-primary">{a.faaTc || '—'}</td>
                        <td className="px-lg py-base align-top text-sm text-text-primary">{a.easaTc || '—'}</td>
                        <td className="px-lg py-base align-top text-sm text-text-primary">{a.drawingPrefix || '—'}</td>
                        <td className="px-lg py-base align-top text-sm text-text-primary" style={{ maxWidth: 180 }}><Truncate>{s?.comment || '—'}</Truncate></td>
                        <td className="px-lg py-base align-top">
                          <Badge tone={a.active ? 'success' : 'neutral'}>{a.active ? 'Active' : 'Inactive'}</Badge>
                        </td>
                        <td className="px-lg py-base align-top" onClick={(e) => e.stopPropagation()}>
                          <ActionsMenu
                            ariaLabel={`Actions for ${a.modelNumber}${s?.serial ? ` serial ${s.serial}` : ''}`}
                            items={[
                              { label: 'View', icon: <Eye size={16} />, onSelect: () => setDrawer({ mode: 'view', model: a, serial: s }) },
                              { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setDrawer({ mode: 'edit', model: a, serial: s }) },
                              a.active
                                ? { label: 'Deactivate', icon: <CircleOff size={16} />, onSelect: () => { updateAircraft(a.id, { active: false }); setToast(`${a.modelNumber} deactivated, hidden from pickers.`) } }
                                : { label: 'Activate', icon: <CircleCheck size={16} />, onSelect: () => { updateAircraft(a.id, { active: true }); setToast(`${a.modelNumber} activated.`) } },
                              { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeleting(a), tone: 'danger' },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {!loading && (
            <AutoLoadFooter total={filtered.length} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="serial numbers" />
          )}
          </div>
        )}
      </div>

      {drawer && (
        <AircraftModelDrawer
          key={`${drawer.mode}-${drawer.model?.id ?? 'new'}-${drawer.serial?.id ?? 'none'}`}
          mode={drawer.mode}
          initial={drawer.model}
          initialSerial={drawer.serial}
          onClose={() => setDrawer(null)}
          onSave={(model, serial) => { saveAircraft(model, serial); setToast(`Aircraft "${model.modelNumber}" saved.`) }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete this aircraft?"
        description={
          deleting
            ? `"${deleting.modelNumber}" and its ${serialsOf(deleting.id).length} serial number${serialsOf(deleting.id).length === 1 ? '' : 's'} will be permanently removed. Prefer Deactivate to keep history.`
            : ''
        }
        confirmLabel="Delete aircraft"
        tone="danger"
        onConfirm={() => { if (deleting) { removeAircraft(deleting.id); setToast(`Aircraft "${deleting.modelNumber}" deleted.`) } setDeleting(null) }}
        onCancel={() => setDeleting(null)}
      />
    </AppShell>
  )
}
