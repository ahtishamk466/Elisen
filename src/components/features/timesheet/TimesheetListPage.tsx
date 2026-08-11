import { useMemo, useState } from 'react'
import { Plus, Search, CalendarClock } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { StatCard } from '@/components/patterns/StatCard'
import { EmptyState } from '@/components/patterns/EmptyState'
import { Pagination } from '@/components/patterns/Pagination'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { TimesheetTable } from './TimesheetTable'
import { TimesheetEntryDrawer } from './TimesheetEntryDrawer'
import { TimesheetFilterMenu, EMPTY_FILTERS, type TimesheetFilters } from './TimesheetFilterMenu'
import { useTimesheetStore } from '@/stores/timesheetStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { useWorkPackagesStore } from '@/stores/workPackagesStore'
import { deliverableSummaries, useDocumentsStore } from '@/stores/documentsStore'
import { enrichTimesheetRows } from '@/lib/timesheetLookup'
import { CURRENT_EMPLOYEE } from '@/lib/timesheetFixtures'
import type { TimesheetEntry } from '@/types/timesheet'
import type { TimesheetEntryValues } from './useTimesheetEntryForm'

export type PageState = 'ready' | 'loading' | 'empty' | 'error'

export interface TimesheetListPageProps {
  state?: PageState
}

function rowToValues(row: TimesheetEntry): Partial<TimesheetEntryValues> {
  return {
    employeeName: row.employeeName, projectId: row.projectId, workPackageId: row.workPackageId,
    activityId: row.activityId, task: row.task, deliverableRevisionId: row.deliverableRevisionId,
    workingDate: row.workingDate, hoursRegular: String(row.hoursRegular), hoursOvertime: String(row.hoursOvertime),
    bankHoursRegular: String(row.bankHoursRegular), comment: row.comment,
  }
}

export function TimesheetListPage({ state = 'ready' }: TimesheetListPageProps) {
  const rows = useTimesheetStore((s) => s.rows)
  const addRow = useTimesheetStore((s) => s.addRow)
  const updateRow = useTimesheetStore((s) => s.updateRow)
  const removeRow = useTimesheetStore((s) => s.removeRow)
  const projects = useProjectsStore((s) => s.rows)
  const workPackages = useWorkPackagesStore((s) => s.workPackages)
  const documents = useDocumentsStore((s) => s.documents)
  const docRevisions = useDocumentsStore((s) => s.revisions)
  const deliverables = useMemo(() => deliverableSummaries(documents, docRevisions), [documents, docRevisions])

  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<TimesheetFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [drawer, setDrawer] = useState<{ mode: 'create' | 'edit' | 'view'; row?: TimesheetEntry } | null>(null)
  const [deletingRow, setDeletingRow] = useState<TimesheetEntry | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const ownRows = useMemo(() => rows.filter((r) => r.employeeName === CURRENT_EMPLOYEE), [rows])
  const enriched = useMemo(() => enrichTimesheetRows(ownRows, projects, workPackages, deliverables), [ownRows, projects, workPackages, deliverables])

  const hasActiveFilters = Object.values(filters).some(Boolean)

  const filtered = useMemo(() => {
    let list = enriched
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((r) =>
        [r.projectLabel, r.projectDescription, r.workPackageTitle, r.activityTitle, r.task, r.deliverableNumber, r.comment]
          .join(' ').toLowerCase().includes(q),
      )
    }
    if (filters.projectId) list = list.filter((r) => r.projectId === filters.projectId)
    if (filters.validated) list = list.filter((r) => (filters.validated === 'yes' ? r.validated : !r.validated))
    if (filters.active) list = list.filter((r) => (filters.active === 'yes' ? r.active : !r.active))
    if (filters.dateFrom) list = list.filter((r) => r.workingDate >= filters.dateFrom)
    if (filters.dateTo) list = list.filter((r) => r.workingDate <= filters.dateTo)
    return list
  }, [enriched, query, filters])

  const totalHours = filtered.reduce((sum, r) => sum + r.hoursRegular, 0)
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)

  const loading = state === 'loading'
  const showEmpty = state === 'empty' || (state === 'ready' && filtered.length === 0)

  const handleDuplicate = (row: TimesheetEntry) => {
    addRow({ ...row, id: crypto.randomUUID(), validated: false })
    setToast('Entry duplicated.')
  }
  const handleToggleValidated = (row: TimesheetEntry) => {
    updateRow(row.id, { validated: !row.validated })
    setToast(row.validated ? 'Entry unmarked as validated.' : 'Entry marked as validated.')
  }
  const handleDeleteConfirmed = () => {
    if (!deletingRow) return
    removeRow(deletingRow.id)
    setToast('Entry deleted.')
    setDeletingRow(null)
  }

  return (
    <AppShell
      title="Timesheet — List"
      activeItem="Time Entry"
      activeChild="Timesheet"
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 300 }}>
            <label htmlFor="timesheet-search" className="sr-only">Search entries</label>
            <Input
              id="timesheet-search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              placeholder="Search by project, activity, task or comment..." leadingIcon={<Search size={16} />}
            />
          </div>
          <TimesheetFilterMenu projects={projects} filters={filters} onApply={(f) => { setFilters(f); setPage(1) }} />
          <Button size="lg" leadingIcon={<Plus size={16} />} onClick={() => setDrawer({ mode: 'create' })}>
            Add Entry
          </Button>
        </>
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        <div className="grid gap-lg mobile:grid-cols-2">
          <StatCard value={filtered.length} label="Entries" loading={loading} />
          <StatCard value={totalHours.toFixed(2)} label="Total regular hours" loading={loading} />
        </div>

        {state === 'error' ? (
          <Alert title="We couldn't load your timesheet">
            Something went wrong fetching your entries. Refresh the page, and if it keeps happening, contact your administrator.
          </Alert>
        ) : showEmpty && !loading ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<CalendarClock size={48} strokeWidth={1.5} />}
              title={query || hasActiveFilters ? 'No entries match your search' : 'No timesheet entries yet'}
              description={
                query || hasActiveFilters
                  ? 'Try a different project, activity, comment or filter.'
                  : 'Log your first entry to start tracking hours against a project.'
              }
              action={
                query || hasActiveFilters ? (
                  <Button variant="secondary" onClick={() => { setQuery(''); setFilters(EMPTY_FILTERS) }}>Clear search & filters</Button>
                ) : (
                  <Button leadingIcon={<Plus size={16} />} onClick={() => setDrawer({ mode: 'create' })}>Add Entry</Button>
                )
              }
            />
          </div>
        ) : (
          <TimesheetTable
            rows={pageRows}
            loading={loading}
            onView={(row) => setDrawer({ mode: 'view', row })}
            onEdit={(row) => setDrawer({ mode: 'edit', row })}
            onDuplicate={handleDuplicate}
            onDelete={setDeletingRow}
            onToggleValidated={handleToggleValidated}
            pagination={!loading && (
              <Pagination
                page={page} pageSize={pageSize} totalItems={filtered.length} itemLabel="entries"
                onPageChange={setPage} onPageSizeChange={setPageSize}
              />
            )}
          />
        )}
      </div>

      <TimesheetEntryDrawer
        key={drawer ? `${drawer.mode}-${drawer.row?.id ?? 'new'}` : 'closed'}
        open={!!drawer}
        mode={drawer?.mode ?? 'create'}
        initialValues={drawer?.row ? rowToValues(drawer.row) : undefined}
        currentEmployee={CURRENT_EMPLOYEE}
        onClose={() => setDrawer(null)}
        onSubmit={(v) => {
          if (drawer?.mode === 'edit' && drawer.row) {
            updateRow(drawer.row.id, {
              projectId: v.projectId, workPackageId: v.workPackageId, activityId: v.activityId, task: v.task,
              deliverableRevisionId: v.deliverableRevisionId, workingDate: v.workingDate,
              hoursRegular: Number(v.hoursRegular) || 0, hoursOvertime: Number(v.hoursOvertime) || 0,
              bankHoursRegular: Number(v.bankHoursRegular) || 0, comment: v.comment,
            })
            setToast('Entry updated.')
          } else {
            addRow({
              id: crypto.randomUUID(), employeeName: CURRENT_EMPLOYEE, projectId: v.projectId, workPackageId: v.workPackageId,
              activityId: v.activityId, task: v.task, deliverableRevisionId: v.deliverableRevisionId, workingDate: v.workingDate,
              hoursRegular: Number(v.hoursRegular) || 0, hoursOvertime: Number(v.hoursOvertime) || 0,
              bankHoursRegular: Number(v.bankHoursRegular) || 0, comment: v.comment, validated: false, active: true,
            })
            setToast('Entry created.')
          }
        }}
      />

      <ConfirmDialog
        open={!!deletingRow}
        title="Delete this entry?"
        description={deletingRow ? `This timesheet entry for ${deletingRow.workingDate} will be permanently removed. This cannot be undone.` : ''}
        confirmLabel="Delete entry"
        tone="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeletingRow(null)}
      />
    </AppShell>
  )
}
