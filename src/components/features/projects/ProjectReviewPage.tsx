import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ClipboardList } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { FilterChips } from '@/components/patterns/FilterChips'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { TableTabs } from '@/components/patterns/TableTabs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { ProjectReviewTable } from './ProjectReviewTable'
import { ProjectFilterMenu, EMPTY_PROJECT_FILTERS, projectFilterChips, type ProjectFilters } from './ProjectFilterMenu'
import { ExportMenu } from './ExportMenu'
import { AddProjectDrawer } from './AddProjectDrawer'
import { useProjectsStore } from '@/stores/projectsStore'
import { PEOPLE } from '@/lib/projectFixtures'
import { REVIEW_PRESETS, byPriority, matchesPreset } from '@/lib/reviewPresets'
import type { ProjectListRow } from '@/types/project'
import type { AddProjectValues } from './useAddProjectForm'

export type PageState = 'ready' | 'loading' | 'error'

function rowToInitialValues(row: ProjectListRow): Partial<AddProjectValues> {
  return {
    number: row.number, subNumber: row.subNumber, type: row.type, priority: row.priority,
    description: row.title, company: row.companyName,
    contact: row.contactName === '—' ? '' : row.contactName,
    personResponsible: row.personResponsible, status: row.status,
    openedDate: row.openedDate, dueDate: row.dueDate,
    nextAction: row.nextAction, comments: row.comments,
  }
}

/**
 * The legacy Projects Review's 7 tabs, consolidated into one filterable
 * list — see docs/DECISIONS.md. The tabs were the same `project` table
 * filtered 7 ways, so they're preset chips here; the Filters menu narrows
 * *within* a chip, a combination the tabs could never express.
 */
export function ProjectReviewPage({ state = 'ready', canSeeFinancials = true }: { state?: PageState; canSeeFinancials?: boolean }) {
  const navigate = useNavigate()
  const rows = useProjectsStore((s) => s.rows)
  const updateRow = useProjectsStore((s) => s.updateRow)

  // Legacy landed on Priorities — "what needs attention now", no clicks.
  const [presetKey, setPresetKey] = useState('priorities')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<ProjectFilters>(EMPTY_PROJECT_FILTERS)
  const [editingRow, setEditingRow] = useState<ProjectListRow | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const preset = REVIEW_PRESETS.find((p) => p.key === presetKey) ?? REVIEW_PRESETS[0]

  const companies = useMemo(
    () => Array.from(new Set(rows.map((r) => r.companyName).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [rows],
  )
  const people = useMemo(
    () => Array.from(new Set([...PEOPLE, ...rows.map((r) => r.personResponsible)].filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [rows],
  )

  /** Counts are per preset alone, so a chip always tells the truth about
      its own slice regardless of the search/filters currently applied. */
  const presetCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of REVIEW_PRESETS) counts[p.key] = rows.filter((r) => matchesPreset(r, p)).length
    return counts
  }, [rows])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const list = rows.filter((r) => {
      if (!matchesPreset(r, preset)) return false
      if (filters.company && r.companyName !== filters.company) return false
      if (filters.personResponsible && r.personResponsible !== filters.personResponsible) return false
      if (filters.priority && r.priority !== filters.priority) return false
      if (filters.status && r.status !== filters.status) return false
      if (filters.type && r.type !== filters.type) return false
      if (filters.active && (filters.active === 'yes') !== r.active) return false
      if (!q) return true
      return [r.number, r.subNumber, r.title, r.companyName, r.personResponsible, r.comments, r.nextAction]
        .join(' ').toLowerCase().includes(q)
    })
    return preset.sortByPriority ? [...list].sort(byPriority) : list
  }, [rows, preset, filters, query])

  const { visibleCount, loadingMore, loadMore, reset: resetVisible } = useInfiniteReveal(filtered.length, 25)

  const loading = state === 'loading'
  const resetPage = resetVisible

  /** The 7 legacy tabs, as presets over one list — rendered inside the
      table's card so they read as its header (see docs/DECISIONS.md). */
  const presetTabs = (
    <TableTabs
      ariaLabel="Review presets"
      activeKey={preset.key}
      onChange={(key) => { setPresetKey(key); resetPage() }}
      tabs={REVIEW_PRESETS.map((p) => ({ key: p.key, label: p.label, count: presetCounts[p.key] }))}
    />
  )

  if (state === 'error') {
    return (
      <AppShell title="Projects Review" activeItem="Projects" activeChild="Projects Review">
        <Alert title="We couldn't load the review">
          Something went wrong fetching projects. Refresh the page, and if it keeps happening, contact your administrator.
        </Alert>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Projects Review"
      description="Triage what needs attention."
      activeItem="Projects"
      activeChild="Projects Review"
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 400 }}>
            <label htmlFor="review-search" className="sr-only">Search projects review</label>
            <Input size="sm"
              id="review-search" value={query} onChange={(e) => { setQuery(e.target.value); resetPage() }}
              placeholder="Search number, project, company, comments..." leadingIcon={<Search size={16} />}
            />
          </div>
          <ProjectFilterMenu
            ariaLabel="Filter projects review"
            companies={companies} people={people} filters={filters}
            onApply={(f) => { setFilters(f); resetPage() }}
          />
          <ExportMenu
            rows={filtered}
            onUnavailableFormat={(format) => setToast(`${format} export isn't wired up yet: HTML, CSV and Text are ready now.`)}
          />
        </>
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        <FilterChips
          chips={projectFilterChips(filters, (f) => { setFilters(f); resetPage() })}
          onClearAll={() => { setFilters(EMPTY_PROJECT_FILTERS); resetPage() }}
        />

        {!loading && filtered.length === 0 ? (
          // The tabs stay put when a slice comes back empty, so the user can
          // switch away without losing them.
          <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
            {presetTabs}
            <EmptyState
              icon={<ClipboardList size={48} strokeWidth={1.5} />}
              title="No projects match this view"
              description="Try a different preset, clear the filters, or search for another project."
              action={
                <Button
                  variant="secondary"
                  onClick={() => { setQuery(''); setFilters(EMPTY_PROJECT_FILTERS); setPresetKey('all'); resetPage() }}
                >
                  Show all projects
                </Button>
              }
            />
          </div>
        ) : (
          <ProjectReviewTable
            rows={filtered.slice(0, visibleCount)}
            loading={loading}
            canSeeFinancials={canSeeFinancials}
            tabs={presetTabs}
            activeTabKey={preset.key}
            onView={(row) => navigate(`/projects/${row.id}`)}
            onOpenWorkPackages={(row) => navigate(`/projects/${row.id}?tab=work-packages`)}
            onEdit={setEditingRow}
            pagination={!loading && (
              <AutoLoadFooter total={filtered.length} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="projects" />
            )}
          />
        )}
      </div>

      {editingRow && (
        <AddProjectDrawer
          key={editingRow.id}
          open
          mode="edit"
          initialValues={rowToInitialValues(editingRow)}
          canSeeFinancials={canSeeFinancials}
          onClose={() => setEditingRow(null)}
          onSubmit={(v) => {
            updateRow(editingRow.id, {
              number: v.number, subNumber: v.subNumber,
              type: v.type as ProjectListRow['type'],
              title: v.description || editingRow.title,
              companyName: v.company, contactName: v.contact || '—',
              personResponsible: v.personResponsible,
              priority: v.priority as ProjectListRow['priority'],
              status: (v.status as ProjectListRow['status']) || editingRow.status,
              openedDate: v.openedDate, dueDate: v.dueDate,
              nextAction: v.nextAction, comments: v.comments,
            })
            setToast(`Project ${v.number}-${v.subNumber} updated.`)
            setEditingRow(null)
          }}
        />
      )}
    </AppShell>
  )
}
