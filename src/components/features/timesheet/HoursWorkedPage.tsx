import { useMemo, useState } from 'react'
import { Plus, Search, Users } from 'lucide-react'
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
import { PEOPLE } from '@/lib/projectFixtures'
import type { TimesheetEntry } from '@/types/timesheet'
import type { TimesheetEntryValues } from './useTimesheetEntryForm'

const PAGE_SIZE = 10

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
  const [page, setPage] = useState(1)
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
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
    <AppShell title="Hours Worked — Admin — List" activeItem="Time Entry" activeChild="Hours Worked">
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        <div className="grid gap-lg mobile:grid-cols-2 laptop:grid-cols-4">
          <StatCard value={filtered.length} label="Entries" loading={loading} />
          <StatCard value={totalHours.toFixed(2)} label="Total regular hours" loading={loading} />
          <StatCard value={pendingValidation} label="Pending validation" loading={loading} />
          <StatCard value={uniqueEmployees} label="Employees" loading={loading} />
        </div>

        <div className="grid gap-sm tablet:flex tablet:flex-wrap tablet:items-center">
          <div className="min-w-0 tablet:flex-1" style={{ maxWidth: 380 }}>
            <label htmlFor="hours-worked-search" className="sr-only">Search entries</label>
            <Input
              id="hours-worked-search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              placeholder="Search by employee, project, activity or comment..." leadingIcon={<Search size={16} />}
            />
          </div>
          <TimesheetFilterMenu projects={projects} employees={PEOPLE} filters={filters} onApply={(f) => { setFilters(f); setPage(1) }} />
          <span className="hidden tablet:block tablet:flex-1" />
          <Button leadingIcon={<Plus size={16} />} onClick={() => setDrawer({ mode: 'create' })}>
            Add Entry
          </Button>
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
          <>
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
            />
            {!loading && (
              <Pagination
                page={page}
                pageCount={pageCount}
                summary={`Showing ${pageRows.length ? (page - 1) * PAGE_SIZE + 1 : 0} to ${(page - 1) * PAGE_SIZE + pageRows.length} of ${filtered.length} entries`}
                onChange={setPage}
              />
            )}
          </>
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
