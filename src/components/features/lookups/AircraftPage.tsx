import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, Pencil, Plane, Plus, Search, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { TableTabs } from '@/components/patterns/TableTabs'
import { Truncate } from '@/components/patterns/Truncate'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { AircraftModelDrawer } from './AircraftModelDrawer'
import { AircraftSerialDrawer } from './AircraftSerialDrawer'
import { useLookupStore } from '@/stores/lookupStore'
import type { AircraftModel, AircraftSerial } from '@/types/lookup'

export type PageState = 'ready' | 'loading' | 'error'

type ModelSortKey = 'modelNumber' | 'modelName' | 'manufacturer' | 'tccaTc' | 'faaTc'
  | 'easaTc' | 'prefix' | 'airframes' | 'active'
type SerialSortKey = 'serial' | 'registration' | 'aircraft' | 'owner' | 'company'
  | 'location' | 'telephone' | 'active'

const MODEL_COLUMNS: { label: string; sort?: ModelSortKey }[] = [
  { label: 'Model Number', sort: 'modelNumber' },
  { label: 'Model Name', sort: 'modelName' },
  { label: 'Manufacture', sort: 'manufacturer' },
  { label: 'TCCA TC', sort: 'tccaTc' },
  { label: 'FAA TC', sort: 'faaTc' },
  { label: 'EASA TC', sort: 'easaTc' },
  { label: 'Prefix', sort: 'prefix' },
  { label: 'Airframes', sort: 'airframes' },
  { label: 'Active', sort: 'active' },
  { label: 'Actions' },
]
const SERIAL_COLUMNS: { label: string; sort?: SerialSortKey }[] = [
  { label: 'Serial No', sort: 'serial' },
  { label: 'Reg. No', sort: 'registration' },
  { label: 'Aircraft', sort: 'aircraft' },
  { label: 'Owner', sort: 'owner' },
  { label: 'Company', sort: 'company' },
  { label: 'Location', sort: 'location' },
  { label: 'Telephone', sort: 'telephone' },
  { label: 'Active', sort: 'active' },
  { label: 'Actions' },
]

type Tab = 'aircraft' | 'serials'

/**
 * Reference Data → Aircraft, as two tabs over one workspace.
 *
 * They are **separate records**, which the client settled explicitly: "Serial
 * Number and Aircraft will be separate", because a model carries type
 * certificates and a drawing prefix while an airframe carries a tail number and
 * its owner's contact details, and because at project start "the person
 * creating the project may not know what the Serial Number is yet".
 *
 * They share one sidebar entry rather than two because you move between them
 * constantly, exactly as Deliverables and Design Data do. Tabs, not a merged
 * grid: merging repeated every model field on every airframe row and made
 * "edit" ambiguous about which of the two records it acted on.
 */
export function AircraftPage({ state = 'ready' }: { state?: PageState }) {
  const aircraft = useLookupStore((s) => s.aircraft)
  const serials = useLookupStore((s) => s.serials)
  const saveAircraft = useLookupStore((s) => s.saveAircraft)
  const removeAircraft = useLookupStore((s) => s.removeAircraft)
  const saveSerial = useLookupStore((s) => s.saveSerial)
  const removeSerial = useLookupStore((s) => s.removeSerial)

  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = searchParams.get('tab') === 'serials' ? 'serials' : 'aircraft'
  const setTab = (next: Tab) => {
    const p = new URLSearchParams(searchParams)
    if (next === 'aircraft') p.delete('tab')
    else p.set('tab', next)
    setSearchParams(p, { replace: true })
  }

  const [query, setQuery] = useState('')
  const [modelDrawer, setModelDrawer] = useState<{ mode: 'create' | 'edit' | 'view'; model?: AircraftModel } | null>(null)
  const [serialDrawer, setSerialDrawer] = useState<{ mode: 'create' | 'edit' | 'view'; serial?: AircraftSerial; aircraftId?: string } | null>(null)
  const [deletingModel, setDeletingModel] = useState<AircraftModel | null>(null)
  const [deletingSerial, setDeletingSerial] = useState<AircraftSerial | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const loading = state === 'loading'
  const serialsOf = (id: string) => serials.filter((s) => s.aircraftId === id)
  const modelOf = (id: string) => aircraft.find((a) => a.id === id)

  const q = query.toLowerCase().trim()
  const models = useMemo(() => aircraft.filter((a) =>
    !q || `${a.modelNumber} ${a.modelName} ${a.manufacturer} ${a.tccaTc} ${a.faaTc} ${a.easaTc}`.toLowerCase().includes(q)),
    [aircraft, q])
  const airframes = useMemo(() => serials.filter((s) => {
    const m = modelOf(s.aircraftId)
    return !q || `${s.serial} ${s.registration} ${m?.modelNumber ?? ''} ${s.ownerName} ${s.company} ${s.city} ${s.country}`.toLowerCase().includes(q)
  }), [serials, aircraft, q]) // eslint-disable-line react-hooks/exhaustive-deps

  const rowCount = tab === 'aircraft' ? models.length : airframes.length
  const { visibleCount, loadingMore, loadMore, reset: resetVisible } = useInfiniteReveal(rowCount, 25)

  /* One sort per tab, both hooks always called so the order is stable.
     Location sorts on the same joined "city, province, country" string the
     cell prints, so what you read is what you ordered by. */
  const modelSort = useTableSort(models, {
    modelNumber: (a) => a.modelNumber,
    modelName: (a) => a.modelName,
    manufacturer: (a) => a.manufacturer,
    tccaTc: (a) => a.tccaTc,
    faaTc: (a) => a.faaTc,
    easaTc: (a) => a.easaTc,
    prefix: (a) => a.drawingPrefix,
    airframes: (a) => serialsOf(a.id).length,
    active: (a) => a.active,
  }, { onSortChange: resetVisible })

  const serialSort = useTableSort(airframes, {
    serial: (sn) => sn.serial,
    registration: (sn) => sn.registration,
    aircraft: (sn) => modelOf(sn.aircraftId)?.modelNumber,
    owner: (sn) => sn.ownerName,
    company: (sn) => sn.company,
    location: (sn) => [sn.city, sn.provState, sn.country].filter(Boolean).join(', '),
    telephone: (sn) => sn.telephone,
    active: (sn) => sn.active,
  }, { onSortChange: resetVisible })

  const tabs = (
    <TableTabs
      ariaLabel="Aircraft reference data"
      activeKey={tab}
      onChange={(k) => { setTab(k as Tab); resetVisible() }}
      tabs={[
        { key: 'aircraft', label: 'Aircraft', count: aircraft.length },
        { key: 'serials', label: 'Serial Numbers', count: serials.length },
      ]}
    />
  )

  if (state === 'error') {
    return (
      <AppShell title="Aircraft" activeItem="Reference Data" activeChild="Aircraft">
        <Alert title="We couldn't load aircraft">
          Refresh the page, and if it keeps happening, contact your administrator.
        </Alert>
      </AppShell>
    )
  }

  const columns: { label: string; sort?: string }[] = tab === 'aircraft' ? MODEL_COLUMNS : SERIAL_COLUMNS
  const { sort, setSort } = (tab === 'aircraft' ? modelSort : serialSort) as {
    sort?: { key: string; dir: 'asc' | 'desc' }
    setSort: (s: { key: string; dir: 'asc' | 'desc' }) => void
  }

  return (
    <AppShell
      title="Aircraft"
      activeItem="Reference Data"
      activeChild="Aircraft"
      description={tab === 'aircraft'
        ? 'Aircraft types, with certificates and drawing prefix.'
        : 'Specific airframes, with their owner or operator.'}
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 400 }}>
            <label htmlFor="aircraft-search" className="sr-only">Search aircraft and serial numbers</label>
            <Input size="sm"
              id="aircraft-search" value={query} onChange={(e) => { setQuery(e.target.value); resetVisible() }}
              placeholder={tab === 'aircraft'
                ? 'Search by model, name or manufacturer...'
                : 'Search by serial, registration, owner or company...'}
              leadingIcon={<Search size={16} />}
            />
          </div>
          {tab === 'aircraft' ? (
            <Button leadingIcon={<Plus size={16} />} onClick={() => setModelDrawer({ mode: 'create' })}>Add Aircraft</Button>
          ) : (
            <Button leadingIcon={<Plus size={16} />} onClick={() => setSerialDrawer({ mode: 'create' })}>Add Serial Number</Button>
          )}
        </>
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        {!loading && rowCount === 0 ? (
          <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
            {tabs}
            <EmptyState
              icon={<Plane size={48} strokeWidth={1.5} />}
              title={query
                ? `No ${tab === 'aircraft' ? 'aircraft' : 'serial numbers'} match your search`
                : `No ${tab === 'aircraft' ? 'aircraft' : 'serial numbers'} yet`}
              description={query
                ? 'Try a different term.'
                : tab === 'aircraft'
                  ? 'Add the aircraft types Elisen works on. Serial numbers are added against a type afterwards.'
                  : 'Add an airframe once you know its serial, so "have we worked on this tail number?" becomes answerable.'}
              action={query
                ? <Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>
                : tab === 'aircraft'
                  ? <Button leadingIcon={<Plus size={16} />} onClick={() => setModelDrawer({ mode: 'create' })}>Add Aircraft</Button>
                  : <Button leadingIcon={<Plus size={16} />} onClick={() => setSerialDrawer({ mode: 'create' })}>Add Serial Number</Button>}
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
            {tabs}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left" style={{ minWidth: tab === 'aircraft' ? 1040 : 1120 }}>
                <caption className="sr-only">{tab === 'aircraft' ? 'Aircraft types' : 'Aircraft serial numbers'}</caption>
                <thead>
                  <tr className="border-b border-border-default bg-neutral-50">
                    {columns.map((c) => (
                      <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                        className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{c.label}</SortableTh>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 6 }, (_, i) => (
                        <tr key={i} className="border-b border-border-default last:border-b-0">
                          {columns.map((c) => <td key={c.label} className="px-lg py-base"><Skeleton className="h-4 w-full" /></td>)}
                        </tr>
                      ))
                    : tab === 'aircraft'
                      ? modelSort.sorted.slice(0, visibleCount).map((a) => {
                          const count = serialsOf(a.id).length
                          return (
                            <tr key={a.id} onClick={() => setModelDrawer({ mode: 'view', model: a })}
                              className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle">
                              <td className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-primary">{a.modelNumber}</td>
                              <td className="px-lg py-base text-sm text-text-primary" style={{ maxWidth: 220 }}><Truncate>{a.modelName || '—'}</Truncate></td>
                              <td className="px-lg py-base text-sm text-text-primary" style={{ maxWidth: 200 }}><Truncate>{a.manufacturer || '—'}</Truncate></td>
                              <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{a.tccaTc || '—'}</td>
                              <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{a.faaTc || '—'}</td>
                              <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{a.easaTc || '—'}</td>
                              <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{a.drawingPrefix || '—'}</td>
                              <td className="whitespace-nowrap px-lg py-base text-sm">
                                {count === 0
                                  ? <span className="text-text-muted">None</span>
                                  : <button type="button"
                                      onClick={(e) => { e.stopPropagation(); setQuery(a.modelNumber); setTab('serials'); resetVisible() }}
                                      className="text-text-primary underline-offset-2 hover:text-accent hover:underline">
                                      {count} airframe{count === 1 ? '' : 's'}
                                    </button>}
                              </td>
                              <td className="whitespace-nowrap px-lg py-base">
                                <Badge tone={a.active ? 'success' : 'neutral'}>{a.active ? 'Active' : 'Inactive'}</Badge>
                              </td>
                              <td className="px-lg py-base" onClick={(e) => e.stopPropagation()}>
                                <ActionsMenu
                                  ariaLabel={`Actions for ${a.modelNumber}`}
                                  items={[
                                    { label: 'View', icon: <Eye size={16} />, onSelect: () => setModelDrawer({ mode: 'view', model: a }) },
                                    { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setModelDrawer({ mode: 'edit', model: a }) },
                                    { label: 'Add serial number', icon: <Plus size={16} />, onSelect: () => setSerialDrawer({ mode: 'create', aircraftId: a.id }) },
                                    { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeletingModel(a), tone: 'danger' },
                                  ]}
                                />
                              </td>
                            </tr>
                          )
                        })
                      : serialSort.sorted.slice(0, visibleCount).map((sn) => {
                          const m = modelOf(sn.aircraftId)
                          const place = [sn.city, sn.provState, sn.country].filter(Boolean).join(', ')
                          return (
                            <tr key={sn.id} onClick={() => setSerialDrawer({ mode: 'view', serial: sn })}
                              className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle">
                              <td className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-primary">{sn.serial}</td>
                              <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{sn.registration || '—'}</td>
                              <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{m?.modelNumber ?? '—'}</td>
                              <td className="px-lg py-base text-sm text-text-primary" style={{ maxWidth: 180 }}><Truncate>{sn.ownerName || '—'}</Truncate></td>
                              <td className="px-lg py-base text-sm text-text-primary" style={{ maxWidth: 200 }}><Truncate>{sn.company || '—'}</Truncate></td>
                              <td className="px-lg py-base text-sm text-text-primary" style={{ maxWidth: 220 }}><Truncate>{place || '—'}</Truncate></td>
                              <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{sn.telephone || '—'}</td>
                              <td className="whitespace-nowrap px-lg py-base">
                                <Badge tone={sn.active ? 'success' : 'neutral'}>{sn.active ? 'Active' : 'Inactive'}</Badge>
                              </td>
                              <td className="px-lg py-base" onClick={(e) => e.stopPropagation()}>
                                <ActionsMenu
                                  ariaLabel={`Actions for serial ${sn.serial}`}
                                  items={[
                                    { label: 'View', icon: <Eye size={16} />, onSelect: () => setSerialDrawer({ mode: 'view', serial: sn }) },
                                    { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setSerialDrawer({ mode: 'edit', serial: sn }) },
                                    { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeletingSerial(sn), tone: 'danger' },
                                  ]}
                                />
                              </td>
                            </tr>
                          )
                        })}
                </tbody>
              </table>
            </div>
            {!loading && (
              <AutoLoadFooter total={rowCount} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore}
                itemLabel={tab === 'aircraft' ? 'aircraft' : 'serial numbers'} />
            )}
          </div>
        )}
      </div>

      {modelDrawer && (
        <AircraftModelDrawer
          key={modelDrawer.model?.id ?? 'new'}
          mode={modelDrawer.mode}
          initial={modelDrawer.model}
          onClose={() => setModelDrawer(null)}
          onSave={(m) => { saveAircraft(m); setToast(`Aircraft ${m.modelNumber} saved.`) }}
        />
      )}
      {serialDrawer && (
        <AircraftSerialDrawer
          key={serialDrawer.serial?.id ?? 'new'}
          mode={serialDrawer.mode}
          initial={serialDrawer.serial}
          aircraftId={serialDrawer.aircraftId}
          onClose={() => setSerialDrawer(null)}
          onSave={(sn) => { saveSerial(sn); setToast(`Serial ${sn.serial} saved.`) }}
        />
      )}

      {/* A serial cannot exist without its aircraft, so deleting the type takes
          its airframes with it. The count makes that consequence visible. */}
      <ConfirmDialog
        open={!!deletingModel}
        title="Delete this aircraft?"
        description={deletingModel
          ? `${deletingModel.modelNumber} and its ${serialsOf(deletingModel.id).length} airframe${serialsOf(deletingModel.id).length === 1 ? '' : 's'} will be permanently removed. Prefer Inactive to keep history.`
          : ''}
        confirmLabel="Delete aircraft"
        tone="danger"
        onConfirm={() => {
          if (deletingModel) { removeAircraft(deletingModel.id); setToast(`${deletingModel.modelNumber} deleted.`) }
          setDeletingModel(null)
        }}
        onCancel={() => setDeletingModel(null)}
      />
      <ConfirmDialog
        open={!!deletingSerial}
        title="Delete this serial number?"
        description={deletingSerial
          ? `${deletingSerial.serial} will be permanently removed, along with its owner details. The aircraft type is untouched. Prefer Inactive to keep history.`
          : ''}
        confirmLabel="Delete serial number"
        tone="danger"
        onConfirm={() => {
          if (deletingSerial) { removeSerial(deletingSerial.id); setToast(`Serial ${deletingSerial.serial} deleted.`) }
          setDeletingSerial(null)
        }}
        onCancel={() => setDeletingSerial(null)}
      />
    </AppShell>
  )
}
