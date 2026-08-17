import { useMemo, useState } from 'react'
import { Plus, Search, Users } from 'lucide-react'
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
import { TimesheetTable } from './TimesheetTable'
import { TimesheetEntryDrawer } from './TimesheetEntryDrawer'
import { TimesheetFilterMenu, EMPTY_FILTERS, timesheetFilterChips, type TimesheetFilters } from './TimesheetFilterMenu'
import { useTimesheetStore } from '@/stores/timesheetStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { useWorkPackagesStore } from '@/stores/workPackagesStore'
import { deliverableSummaries, useDocumentsStore } from '@/stores/documentsStore'
import { enrichTimesheetRows } from '@/lib/timesheetLookup'
import { PEOPLE } from '@/lib/projectFixtures'
import type { TimesheetEntry } from '@/types/timesheet'
import type { TimesheetEntryValues } from './useTimesheetEntryForm'

export type PageState = 'ready' | 'loading' | 'empty' | 'error'

export interface HoursWorkedPageProps {
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

/** Admin, cross-employee view of the same records the Timesheet screen shows
    scoped to one person — see docs/DECISIONS.md ("Timesheet & Hours Worked"). */
export function HoursWorkedPage({ state = 'ready' }: HoursWorkedPageProps) {
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
  const [drawer, setDrawer] = useState<{ mode: 'create' | 'edit' | 'view'; row?: TimesheetEntry } | null>(null)
  const [deletingRow, setDeletingRow] = useState<TimesheetEntry | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const enriched = useMemo(() => enrichTimesheetRows(rows, projects, workPackages, deliverables), [rows, projects, workPackages, deliverables])

  const hasActiveFilters = Object.values(filters).some(Boolean)

  const filtered = useMemo(() => {
    let list = enriched
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((r) =>
        [r.employeeName, r.projectLabel, r.projectDescription, r.workPackageTitle, r.activityTitle, r.task, r.deliverableNumber, r.comment]
          .join(' ').toLowerCase().includes(q),
      )
    }
    if (filters.employeeName) list = list.filter((r) => r.employeeName === filters.employeeName)
    if (filters.projectId) list = list.filter((r) => r.projectId === filters.projectId)
    if (filters.validated) list = list.filter((r) => (filters.validated === 'yes' ? r.validated : !r.validated))
    if (filters.active) list = list.filter((r) => (filters.active === 'yes' ? r.active : !r.active))
    if (filters.dateFrom) list = list.filter((r) => r.workingDate >= filters.dateFrom)
    if (filters.dateTo) list = list.filter((r) => r.workingDate <= filters.dateTo)
    return list
  }, [enriched, query, filters])

  const totalHours = filtered.reduce((sum, r) => sum + r.hoursRegular, 0)
  const pendingValidation = filtered.filter((r) => !r.validated).length
  const uniqueEmployees = new Set(filtered.map((r) => r.employeeName)).size
  const { visibleCount, loadingMore, loadMore, reset: resetVisible } = useInfiniteReveal(filtered.length, 25)
  const pageRows = filtered.slice(0, visibleCount)

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
      title="Hours Worked"
      activeItem="Time Entry"
      activeChild="Hours Worked"
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 400 }}>
            <label htmlFor="hours-worked-search" className="sr-only">Search entries</label>
            <Input size="sm"
              id="hours-worked-search" value={query} onChange={(e) => { setQuery(e.target.value); resetVisible() }}
              placeholder="Search by employee, project, activity or comment..." leadingIcon={<Search size={16} />}
            />
          </div>
          <TimesheetFilterMenu projects={projects} employees={PEOPLE} filters={filters} onApply={(f) => { setFilters(f); resetVisible() }} />
          <Button size="md" leadingIcon={<Plus size={16} />} onClick={() => setDrawer({ mode: 'create' })}>
            Add Entry
          </Button>
        </>
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        <FilterChips
          chips={timesheetFilterChips(filters, projects, (f) => { setFilters(f); resetVisible() })}
          onClearAll={() => { setFilters(EMPTY_FILTERS); resetVisible() }}
        />

        <div className="grid gap-lg mobile:grid-cols-2 laptop:grid-cols-4">
          <StatCard value={filtered.length} label="Entries" loading={loading} />
          <StatCard value={totalHours.toFixed(2)} label="Total regular hours" loading={loading} />
          <StatCard value={pendingValidation} label="Pending validation" loading={loading} />
          <StatCard value={uniqueEmployees} label="Employees" loading={loading} />
        </div>

        {state === 'error' ? (
          <Alert title="We couldn't load hours worked">
            Something went wrong fetching entries. Refresh the page, and if it keeps happening, contact your administrator.
          </Alert>
        ) : showEmpty && !loading ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<Users size={48} strokeWidth={1.5} />}
              title={query || hasActiveFilters ? 'No entries match your search' : 'No hours logged yet'}
              description={
                query || hasActiveFilters
                  ? 'Try a different employee, project, activity or filter.'
                  : 'Entries logged by any employee will appear here.'
              }
              action={
                (query || hasActiveFilters) && (
                  <Button variant="secondary" onClick={() => { setQuery(''); setFilters(EMPTY_FILTERS) }}>Clear search & filters</Button>
                )
              }
            />
          </div>
        ) : (
          <TimesheetTable
            rows={pageRows}
            loading={loading}
            showEmployee
            canValidate
            onView={(row) => setDrawer({ mode: 'view', row })}
            onEdit={(row) => setDrawer({ mode: 'edit', row })}
            onDuplicate={handleDuplicate}
            onDelete={setDeletingRow}
            onToggleValidated={handleToggleValidated}
            pagination={!loading && (
              <AutoLoadFooter total={filtered.length} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="entries" />
            )}
          />
        )}
      </div>

      <TimesheetEntryDrawer
        key={drawer ? `${drawer.mode}-${drawer.row?.id ?? 'new'}` : 'closed'}
        open={!!drawer}
        mode={drawer?.mode ?? 'create'}
        initialValues={drawer?.row ? rowToValues(drawer.row) : undefined}
        currentEmployee={drawer?.row?.employeeName ?? ''}
        employeeMode="selectable"
        employeeOptions={PEOPLE}
        onClose={() => setDrawer(null)}
        onSubmit={(v) => {
          if (drawer?.mode === 'edit' && drawer.row) {
            updateRow(drawer.row.id, {
              employeeName: v.employeeName, projectId: v.projectId, workPackageId: v.workPackageId, activityId: v.activityId, task: v.task,
              deliverableRevisionId: v.deliverableRevisionId, workingDate: v.workingDate,
              hoursRegular: Number(v.hoursRegular) || 0, hoursOvertime: Number(v.hoursOvertime) || 0,
              bankHoursRegular: Number(v.bankHoursRegular) || 0, comment: v.comment,
            })
            setToast('Entry updated.')
          } else {
            addRow({
              id: crypto.randomUUID(), employeeName: v.employeeName, projectId: v.projectId, workPackageId: v.workPackageId,
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
        description={deletingRow ? `This timesheet entry for ${deletingRow.employeeName} on ${deletingRow.workingDate} will be permanently removed. This cannot be undone.` : ''}
        confirmLabel="Delete entry"
        tone="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeletingRow(null)}
      />
    </AppShell>
  )
}
