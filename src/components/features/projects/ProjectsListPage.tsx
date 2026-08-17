import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, FolderOpen } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { StatCard } from '@/components/patterns/StatCard'
import { EmptyState } from '@/components/patterns/EmptyState'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { FilterChips } from '@/components/patterns/FilterChips'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { ProjectsTable, type ProjectRowWithHealth, type Sort } from './ProjectsTable'
import { AddProjectDrawer } from './AddProjectDrawer'
import { ExportMenu } from './ExportMenu'
import { ProjectFilterMenu, EMPTY_PROJECT_FILTERS, projectFilterChips, type ProjectFilters } from './ProjectFilterMenu'
import { useProjectsStore } from '@/stores/projectsStore'
import { useWorkPackagesStore } from '@/stores/workPackagesStore'
import { useLookupStore } from '@/stores/lookupStore'
import { useApprovalsStore } from '@/stores/approvalsStore'
import { useDocumentsStore } from '@/stores/documentsStore'
import { PEOPLE } from '@/lib/projectFixtures'
import { HEALTH_LABEL, rollUpProject, type HealthState } from '@/lib/projectHealth'
import { useTccaStore } from '@/stores/tccaStore'
import { getNextProjectNumber } from '@/lib/projectFixtures'
import type { ProjectListRow } from '@/types/project'
import type { AddProjectValues } from './useAddProjectForm'

/** Maps the subset of AddProjectValues fields that exist on a list row. */
function rowToInitialValues(row: ProjectListRow): Partial<AddProjectValues> {
  return {
    number: row.number,
    subNumber: row.subNumber,
    type: row.type,
    priority: row.priority,
    company: row.companyName,
    contact: row.contactName === '—' ? '' : row.contactName,
    personResponsible: row.personResponsible,
  }
}

export type PageState = 'ready' | 'loading' | 'empty' | 'error'

export interface ProjectsListPageProps {
  state?: PageState
  canSeeFinancials?: boolean
}

export function ProjectsListPage({ state = 'ready', canSeeFinancials = true }: ProjectsListPageProps) {
  const navigate = useNavigate()
  const rows = useProjectsStore((s) => s.rows)
  const addRow = useProjectsStore((s) => s.addRow)
  const updateRow = useProjectsStore((s) => s.updateRow)
  const removeRow = useProjectsStore((s) => s.removeRow)
  const addTcca = useTccaStore((s) => s.addTcca)
  const workPackages = useWorkPackagesStore((s) => s.workPackages)
  const catalogAircraft = useLookupStore((s) => s.aircraft)
  const linkApprovalToProject = useApprovalsStore((s) => s.linkToProject)
  const linkRevisionToProject = useDocumentsStore((s) => s.linkRevisionToProject)
  const activities = useWorkPackagesStore((s) => s.activities)

  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<ProjectFilters>(EMPTY_PROJECT_FILTERS)
  const [sort, setSort] = useState<Sort>({ key: 'number', dir: 'asc' })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [editingRow, setEditingRow] = useState<ProjectListRow | null>(null)
  const [deletingRow, setDeletingRow] = useState<ProjectListRow | null>(null)

  const companies = useMemo(
    () => Array.from(new Set(rows.map((r) => r.companyName).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [rows],
  )
  const people = useMemo(
    () => Array.from(new Set([...PEOPLE, ...rows.map((r) => r.personResponsible)].filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [rows],
  )

  /** Health is rolled up from work-package activities — the level hours are
      actually booked at — so the list and the detail page can never disagree. */
  const withHealth = useMemo(
    () => rows.map((row) => ({
      row,
      health: rollUpProject(row.id, workPackages, activities, {
        budgetHours: row.budgetHours, actualHours: row.actualHours, complete: row.status === 'complete',
      }),
    })),
    [rows, workPackages, activities],
  )

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return withHealth.filter(({ row: r, health }) => {
      if (filters.company && r.companyName !== filters.company) return false
      if (filters.personResponsible && r.personResponsible !== filters.personResponsible) return false
      if (filters.priority && r.priority !== filters.priority) return false
      if (filters.status && r.status !== filters.status) return false
      if (filters.type && r.type !== filters.type) return false
      if (filters.active && (filters.active === 'yes') !== r.active) return false
      if (filters.health && health.state !== filters.health) return false
      if (!q) return true
      return [r.number, r.subNumber, r.title, r.companyName, r.contactName, r.personResponsible]
        .join(' ').toLowerCase().includes(q)
    })
  }, [withHealth, query, filters])

  const sorted = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1
    // Rows with no budget have no progress to compare — park them last in
    // either direction rather than letting null sort as zero.
    const value = ({ row, health }: ProjectRowWithHealth) => {
      switch (sort.key) {
        case 'number': return `${row.number}-${row.subNumber}`
        case 'company': return row.companyName
        case 'priority': return row.priority
        case 'budget': return health.budget
        case 'actual': return health.actual
        case 'remaining': return health.budget > 0 ? health.remaining : null
        case 'progress': return health.progressPct
      }
    }
    return [...filtered].sort((a, b) => {
      const av = value(a), bv = value(b)
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * dir
      return ((av as number) - (bv as number)) * dir
    })
  }, [filtered, sort])

  const { visibleCount, loadingMore, loadMore, reset: resetVisible } = useInfiniteReveal(sorted.length, 25)

  const loading = state === 'loading'
  const showEmpty = state === 'empty' || (state === 'ready' && sorted.length === 0)
  const hasFilters = Object.values(filters).some(Boolean)

  /**
   * Stats describe **what is on screen**, so they move with search and filters
   * and read 0 when nothing matches. Counting the whole table while the list
   * showed a filtered slice made the tiles contradict the rows beneath them.
   *
   * Health counts lead: "how many need attention" is the question the old
   * Total/In-progress/Completed tiles couldn't answer.
   */
  const countOf = (s: HealthState) => sorted.filter((x) => x.health.state === s).length
  const stats = canSeeFinancials
    ? [
        { value: sorted.length, label: 'Projects shown' },
        { value: countOf('on-track'), label: HEALTH_LABEL['on-track'] },
        { value: countOf('at-risk'), label: HEALTH_LABEL['at-risk'] },
        { value: countOf('over-budget'), label: HEALTH_LABEL['over-budget'] },
      ]
    : [
        { value: sorted.length, label: 'Projects shown' },
        { value: sorted.filter(({ row }) => row.status === 'active').length, label: 'In progress' },
        { value: sorted.filter(({ row }) => row.status === 'complete').length, label: 'Completed projects' },
        { value: sorted.filter(({ row }) => row.priority === '1-fire').length, label: 'Priority 1: Fire' },
      ]

  const handleDuplicate = (row: ProjectListRow) => {
    const number = getNextProjectNumber(rows)
    addRow({ ...row, id: crypto.randomUUID(), number, subNumber: '00', title: `${row.title} (Copy)`, actualHours: 0, status: 'quoted' })
    setToast(`Duplicated as project ${number}-00.`)
  }

  const handleDeleteConfirmed = () => {
    if (!deletingRow) return
    removeRow(deletingRow.id)
    setToast(`Project ${deletingRow.number}-${deletingRow.subNumber} deleted.`)
    setDeletingRow(null)
  }

  return (
    <AppShell
      title="Projects List"
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 400 }}>
            <label htmlFor="project-search" className="sr-only">Search projects</label>
            <Input size="sm"
              id="project-search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); resetVisible() }}
              placeholder="Search by number, project, company or person..."
              leadingIcon={<Search size={16} />}
            />
          </div>
          <ProjectFilterMenu
            ariaLabel="Filter projects"
            companies={companies} people={people} filters={filters}
            onApply={(f) => { setFilters(f); resetVisible() }}
          />
          <ExportMenu
            rows={sorted.map(({ row }) => row)}
            onUnavailableFormat={(format) => setToast(`${format} export isn't wired up yet: HTML, CSV and Text are ready now.`)}
          />
          <Button size="md" leadingIcon={<Plus size={16} />} onClick={() => setDrawerOpen(true)}>
            Add new project
          </Button>
        </>
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        <FilterChips
          chips={projectFilterChips(filters, (f) => { setFilters(f); resetVisible() })}
          onClearAll={() => { setFilters(EMPTY_PROJECT_FILTERS); resetVisible() }}
        />

        <div className="grid gap-lg mobile:grid-cols-2 laptop:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} value={s.value} label={s.label} loading={loading} />
          ))}
        </div>

        {state === 'error' ? (
          <Alert title="We couldn't load projects">
            Something went wrong fetching the project list. Refresh the page, and if it keeps happening, contact your administrator.
          </Alert>
        ) : showEmpty && !loading ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<FolderOpen size={48} strokeWidth={1.5} />}
              title={query || hasFilters ? 'No projects match your search' : 'No projects yet'}
              description={
                query || hasFilters
                  ? 'Try a different project number, company or person, or clear the filters.'
                  : 'Create your first project to start tracking work packages, deliverables and TCCA approvals.'
              }
              action={
                query || hasFilters ? (
                  <Button variant="secondary" onClick={() => { setQuery(''); setFilters(EMPTY_PROJECT_FILTERS) }}>Clear search &amp; filters</Button>
                ) : (
                  <Button leadingIcon={<Plus size={16} />} onClick={() => setDrawerOpen(true)}>Add new project</Button>
                )
              }
            />
          </div>
        ) : (
          <>
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-lg rounded-sm border border-accent bg-accent-subtle px-lg py-base">
              <p className="text-sm font-semibold text-text-primary">
                {selectedIds.length} project{selectedIds.length === 1 ? '' : 's'} selected
              </p>
              <div className="flex flex-wrap items-center gap-sm">
                <ExportMenu
                  rows={sorted.filter(({ row }) => selectedIds.includes(row.id)).map(({ row }) => row)}
                  onUnavailableFormat={(format) => setToast(`${format} export isn't wired up yet: HTML, CSV and Text are ready now.`)}
                />
                <Button variant="tertiary" onClick={() => setSelectedIds([])}>Clear selection</Button>
              </div>
            </div>
          )}
          <ProjectsTable
            rows={sorted.slice(0, visibleCount)}
            loading={loading}
            canSeeFinancials={canSeeFinancials}
            sort={sort}
            onSortChange={(s) => { setSort(s); resetVisible() }}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onView={(row) => navigate(`/projects/${row.id}`)}
            onOpenWorkPackages={(row) => navigate(`/projects/${row.id}?tab=work-packages`)}
            onEdit={setEditingRow}
            onDuplicate={handleDuplicate}
            onDelete={setDeletingRow}
            pagination={!loading && (
              <AutoLoadFooter total={sorted.length} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="projects" />
            )}
          />
          </>
        )}
      </div>

      <AddProjectDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        canSeeFinancials={canSeeFinancials}
        onSubmit={(v) => {
          const projectId = crypto.randomUUID()
          addRow({
            id: projectId,
            number: v.number,
            subNumber: v.subNumber,
            type: v.type as ProjectListRow['type'],
            title: v.description || 'Untitled project',
            companyName: v.company,
            companyNumber: '—',
            contactName: v.contact || '—',
            contactEmail: '',
            personResponsible: v.personResponsible,
            actualHours: 0,
            budgetHours: 0,
            priority: v.priority as ProjectListRow['priority'],
            status: (v.status as ProjectListRow['status']) || 'quoted',
            active: true,
            openedDate: v.openedDate,
            dueDate: v.dueDate,
            aircraftInputDate: v.aircraftInputDate,
            closedDate: v.closedDate,
            scope: v.scope,
            contractCurrency: v.contractCurrency,
            contractValue: v.contractValue,
            proposalSubmitted: v.proposalSubmitted as ProjectListRow['proposalSubmitted'],
            proposalSubmittedDate: v.proposalSubmittedDate,
            proposalAccepted: v.proposalAccepted as ProjectListRow['proposalAccepted'],
            proposalAcceptedDate: v.proposalAcceptedDate,
            nextAction: v.nextAction,
            comments: v.comments,
            // Snapshot the chosen catalog aircraft so the project row can be
            // rendered without a second lookup; aircraftId keeps the link real.
            aircraft: v.aircraftIds.flatMap((aircraftId) => {
              const a = catalogAircraft.find((x) => x.id === aircraftId)
              return a ? [{
                id: crypto.randomUUID(), aircraftId: a.id,
                modelName: a.modelName || a.modelNumber, modelNumber: a.modelNumber, manufacturer: a.manufacturer,
              }] : []
            }),
          })
          // Links chosen on the form are created against the global records —
          // the project references them, it doesn't own copies.
          v.approvalIds.forEach((approvalId) => linkApprovalToProject(approvalId, projectId))
          ;[...v.deliverableRevisionIds, ...v.designDataRevisionIds]
            .forEach((revisionId) => linkRevisionToProject(projectId, revisionId))
          if (v.tccaRequired === 'yes') {
            addTcca({
              id: crypto.randomUUID(),
              number: v.tccaNumber,
              description: v.tccaDescription || v.description || `Certification for project ${v.number}-${v.subNumber}`,
              status: 'in-progress',
              openedDate: v.openedDate,
              closedDate: '',
              nextAction: '',
              comments: '',
              projectIds: [projectId],
              checklist: Object.fromEntries(v.checklist.map((itemId) => [itemId, ''])),
            })
          }
          setToast(
            v.tccaRequired === 'yes'
              ? `Project ${v.number}-${v.subNumber} created, with TCCA project ${v.tccaNumber} linked.`
              : `Project ${v.number}-${v.subNumber} created.`,
          )
        }}
      />

      {editingRow && (
        <AddProjectDrawer
          key={editingRow.id}
          open
          mode="edit"
          initialValues={rowToInitialValues(editingRow)}
          onClose={() => setEditingRow(null)}
          canSeeFinancials={canSeeFinancials}
          onSubmit={(v) => {
            updateRow(editingRow.id, {
              number: v.number,
              subNumber: v.subNumber,
              type: v.type as ProjectListRow['type'],
              priority: v.priority as ProjectListRow['priority'],
              companyName: v.company,
              contactName: v.contact || '—',
              personResponsible: v.personResponsible,
            })
            setToast(`Project ${v.number}-${v.subNumber} updated.`)
          }}
        />
      )}

      <ConfirmDialog
        open={!!deletingRow}
        title="Delete this project?"
        description={
          deletingRow
            ? `"${deletingRow.title}" (${deletingRow.number}-${deletingRow.subNumber}) will be permanently removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete project"
        tone="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeletingRow(null)}
      />
    </AppShell>
  )
}
