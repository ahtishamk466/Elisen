import { useMemo, useState } from 'react'
import { CircleCheck, CircleOff, Pencil, Plus, Settings as SettingsIcon, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { FilterChips } from '@/components/patterns/FilterChips'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Truncate } from '@/components/patterns/Truncate'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { SettingDrawer } from './SettingDrawer'
import { SoftwareSettingsFilterMenu, EMPTY_SETTING_FILTERS, settingFilterChips, type SettingFilters } from './SoftwareSettingsFilterMenu'
import { useSettingsStore } from '@/stores/settingsStore'
import type { SoftwareSetting } from '@/types/setting'

type SortKey = 'number' | 'type' | 'section' | 'key' | 'value' | 'status' | 'description'

const COLUMNS: { label: string; sort?: SortKey }[] = [
  { label: '#', sort: 'number' },
  { label: 'Type', sort: 'type' },
  { label: 'Section', sort: 'section' },
  { label: 'Key', sort: 'key' },
  { label: 'Value', sort: 'value' },
  { label: 'Status', sort: 'status' },
  { label: 'Description', sort: 'description' },
  { label: 'Actions' },
]

export type PageState = 'ready' | 'loading' | 'error'

/**
 * The old Settings screen. Same columns and same six filters — Type,
 * Section, Key, Value, Status, Description — but as one Filters menu rather
 * than a row of inputs wedged into the table header, and with Edit/Delete
 * behind the standard Actions menu instead of two unlabelled icons.
 */
export function SoftwareSettingsPage({ state = 'ready' }: { state?: PageState }) {
  const settings = useSettingsStore((s) => s.settings)
  const saveSetting = useSettingsStore((s) => s.saveSetting)
  const updateSetting = useSettingsStore((s) => s.updateSetting)
  const removeSetting = useSettingsStore((s) => s.removeSetting)

  const [filters, setFilters] = useState<SettingFilters>(EMPTY_SETTING_FILTERS)
  const [drawer, setDrawer] = useState<{ mode: 'create' | 'edit'; setting?: SoftwareSetting } | null>(null)
  const [deleting, setDeleting] = useState<SoftwareSetting | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const sections = useMemo(
    () => Array.from(new Set(settings.map((s) => s.section).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [settings],
  )

  /** The "#" column is the setting's position in the full list, so a filtered
      view still shows each row's real number rather than renumbering 1..n. */
  const numbered = useMemo(() => settings.map((s, i) => ({ setting: s, number: i + 1 })), [settings])

  const filtered = useMemo(() => {
    const contains = (haystack: string, needle: string) =>
      !needle.trim() || haystack.toLowerCase().includes(needle.toLowerCase().trim())
    return numbered.filter(({ setting: s }) => {
      if (filters.type && s.type !== filters.type) return false
      if (filters.section && s.section !== filters.section) return false
      if (filters.status && (filters.status === 'active') !== s.active) return false
      return contains(s.key, filters.key) && contains(s.value, filters.value) && contains(s.description, filters.description)
    })
  }, [numbered, filters])

  const { visibleCount, loadingMore, loadMore, reset: resetVisible } = useInfiniteReveal(filtered.length, 25)

  const { sorted, sort, setSort } = useTableSort(filtered, {
    number: (r) => r.number,
    type: (r) => r.setting.type,
    section: (r) => r.setting.section,
    key: (r) => r.setting.key,
    value: (r) => r.setting.value,
    status: (r) => r.setting.active,
    description: (r) => r.setting.description,
  }, { onSortChange: resetVisible })

  const loading = state === 'loading'

  if (state === 'error') {
    return (
      <AppShell title="Software Settings" activeItem="System" activeChild="Software Settings">
        <Alert title="We couldn't load the settings">
          Refresh the page, and if it keeps happening, contact your administrator.
        </Alert>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Software Settings"
      activeItem="System"
      activeChild="Software Settings"
      headerActions={
        <>
          <SoftwareSettingsFilterMenu
            sections={sections} filters={filters}
            onApply={(f) => { setFilters(f); resetVisible() }}
          />
          <Button size="md" leadingIcon={<Plus size={16} />} onClick={() => setDrawer({ mode: 'create' })}>
            Create Setting
          </Button>
        </>
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        <FilterChips
          chips={settingFilterChips(filters, (f) => { setFilters(f); resetVisible() })}
          onClearAll={() => { setFilters(EMPTY_SETTING_FILTERS); resetVisible() }}
        />

        {!loading && filtered.length === 0 ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<SettingsIcon size={48} strokeWidth={1.5} />}
              title={settings.length === 0 ? 'No settings yet' : 'No settings match your filters'}
              description={
                settings.length === 0
                  ? 'Create the configuration values the app reads at runtime.'
                  : 'Try a different type, section or search term.'
              }
              action={
                settings.length === 0
                  ? <Button leadingIcon={<Plus size={16} />} onClick={() => setDrawer({ mode: 'create' })}>Create Setting</Button>
                  : <Button variant="secondary" onClick={() => { setFilters(EMPTY_SETTING_FILTERS); resetVisible() }}>Clear filters</Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left" style={{ minWidth: 940 }}>
                <caption className="sr-only">Software settings</caption>
                <thead>
                  <tr className="border-b border-border-default bg-neutral-50">
                    {COLUMNS.map((c) => (
                      <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                        className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{c.label}</SortableTh>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 8 }, (_, i) => (
                        <tr key={i} className="border-b border-border-default last:border-b-0">
                          {COLUMNS.map((c) => <td key={c.label} className="px-lg py-base"><Skeleton className="h-4 w-full" /></td>)}
                        </tr>
                      ))
                    : sorted.slice(0, visibleCount).map(({ setting: s, number }) => (
                        <tr
                          key={s.id}
                          onClick={() => setDrawer({ mode: 'edit', setting: s })}
                          className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle"
                        >
                          <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-muted">{number}</td>
                          <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">{s.type}</td>
                          <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">{s.section}</td>
                          <td className="whitespace-nowrap px-lg py-base align-top">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setDrawer({ mode: 'edit', setting: s }) }}
                              className="text-left text-sm font-semibold text-text-primary underline-offset-2 hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                            >
                              {s.key}
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">{s.value || '—'}</td>
                          <td className="whitespace-nowrap px-lg py-base align-top">
                            <Badge tone={s.active ? 'success' : 'neutral'}>{s.active ? 'Active' : 'Inactive'}</Badge>
                          </td>
                          <td className="px-lg py-base align-top text-sm text-text-primary" style={{ maxWidth: 220 }}>
                            <Truncate>{s.description || '—'}</Truncate>
                          </td>
                          <td className="px-lg py-base align-top" onClick={(e) => e.stopPropagation()}>
                            <ActionsMenu
                              ariaLabel={`Actions for ${s.key}`}
                              items={[
                                { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setDrawer({ mode: 'edit', setting: s }) },
                                s.active
                                  ? { label: 'Deactivate', icon: <CircleOff size={16} />, onSelect: () => { updateSetting(s.id, { active: false }); setToast(`"${s.key}" deactivated. The app will ignore it.`) } }
                                  : { label: 'Activate', icon: <CircleCheck size={16} />, onSelect: () => { updateSetting(s.id, { active: true }); setToast(`"${s.key}" activated.`) } },
                                { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeleting(s), tone: 'danger' },
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            {!loading && (
              <AutoLoadFooter total={filtered.length} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="items" />
            )}
          </div>
        )}
      </div>

      {drawer && (
        <SettingDrawer
          key={`${drawer.mode}-${drawer.setting?.id ?? 'new'}`}
          mode={drawer.mode}
          initial={drawer.setting}
          sections={sections}
          onClose={() => setDrawer(null)}
          onSave={(setting) => { saveSetting(setting); setToast(`Setting "${setting.key}" saved.`) }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete this setting?"
        description={
          deleting
            ? `"${deleting.section}.${deleting.key}" will be permanently removed. Anything in the app that reads it will fall back to its built-in default. Prefer Deactivate if you might need it back.`
            : ''
        }
        confirmLabel="Delete setting"
        tone="danger"
        onConfirm={() => { if (deleting) { removeSetting(deleting.id); setToast(`Setting "${deleting.key}" deleted.`) } setDeleting(null) }}
        onCancel={() => setDeleting(null)}
      />
    </AppShell>
  )
}
