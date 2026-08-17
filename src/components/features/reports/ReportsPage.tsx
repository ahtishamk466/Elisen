import { useMemo, useState } from 'react'
import { Search, FileBarChart } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ReportCard } from '@/components/patterns/ReportCard'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { RunReportDrawer } from './RunReportDrawer'
import { CATEGORY_LABEL, REPORT_CATALOG, type ReportCategory, type ReportDef } from '@/lib/reportCatalog'
import {
  runApprovals, runDetailedTime, runHoursWorked, runHoursWorkedSummary,
  runOpenDeliverablesActionOn, runProjectStatus, runTccaPriority, runTccaProjects,
} from '@/lib/reportGenerators'
import { useProjectsStore } from '@/stores/projectsStore'
import { useTccaStore } from '@/stores/tccaStore'
import { useApprovalsStore } from '@/stores/approvalsStore'
import { deliverableSummaries, useDocumentsStore } from '@/stores/documentsStore'
import { useTimesheetStore } from '@/stores/timesheetStore'
import { useWorkPackagesStore } from '@/stores/workPackagesStore'

const CATEGORIES: ReportCategory[] = ['project', 'time', 'gcp']

export type PageState = 'ready' | 'loading' | 'error'

/** The old system's three report pages (7 + 4 + 3 reports) merged into one
    searchable catalog; parameters are collected in the Run drawer instead of
    shown as list columns — see docs/DECISIONS.md. */
export function ReportsPage({ state = 'ready' }: { state?: PageState }) {
  const projects = useProjectsStore((s) => s.rows)
  const tccas = useTccaStore((s) => s.tccaProjects)
  const approvals = useApprovalsStore((s) => s.approvals)
  const documents = useDocumentsStore((s) => s.documents)
  const revisions = useDocumentsStore((s) => s.revisions)
  const entries = useTimesheetStore((s) => s.rows)
  const workPackages = useWorkPackagesStore((s) => s.workPackages)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'' | ReportCategory>('')
  const [running, setRunning] = useState<ReportDef | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return REPORT_CATALOG.filter(
      (r) => (!category || r.category === category) && (!q || r.name.toLowerCase().includes(q)),
    )
  }, [query, category])

  const generate = (report: ReportDef, values: Record<string, string>) => {
    const joins = { projects, workPackages, deliverables: deliverableSummaries(documents, revisions) }
    switch (report.id) {
      case 'approvals': runApprovals(approvals, projects); break
      case 'project-status': runProjectStatus(projects); break
      case 'tcca-projects': runTccaProjects(tccas, projects); break
      case 'tcca-priority': runTccaPriority(tccas, projects); break
      case 'open-deliverables-action-on': runOpenDeliverablesActionOn(values.personResponsible, documents, revisions, projects); break
      case 'detailed-time': runDetailedTime(entries, joins, values.startDate, values.endDate); break
      case 'hours-worked': runHoursWorked(entries, joins, values.startDate, values.endDate); break
      case 'hours-worked-individual': runHoursWorked(entries, joins, values.startDate, values.endDate, values.employee); break
      case 'hours-worked-summary': runHoursWorkedSummary(entries, joins, values.startDate, values.endDate); break
    }
    setToast(`"${report.name}" downloaded.`)
  }

  const handleRun = (report: ReportDef) => {
    if (report.params.length === 0) generate(report, {})
    else setRunning(report)
  }

  if (state === 'error') {
    return (
      <AppShell title="Reports" activeItem="Reports">
        <Alert title="We couldn't load reports">Refresh the page, and if it keeps happening, contact your administrator.</Alert>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Reports"
      activeItem="Reports"
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 400 }}>
            <label htmlFor="report-search" className="sr-only">Search reports</label>
            <Input size="sm"
              id="report-search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all reports..." leadingIcon={<Search size={16} />}
            />
          </div>
          <div>
            <label htmlFor="report-category" className="sr-only">Filter by category</label>
            <Select
              id="report-category" size="sm" value={category} className="w-56"
              onChange={(e) => setCategory(e.target.value as '' | ReportCategory)}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </Select>
          </div>
        </>
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        {state === 'loading' ? (
          <div className="grid gap-lg rounded-sm border border-border-default bg-neutral-25 p-lg">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<FileBarChart size={48} strokeWidth={1.5} />}
              title="No reports match your filters"
              description={
                category
                  ? `Nothing in ${CATEGORY_LABEL[category]} matches your search, clear it or switch back to all categories.`
                  : 'Try a different report name, search covers all three categories.'
              }
              action={
                <Button variant="secondary" onClick={() => { setQuery(''); setCategory('') }}>
                  Clear search & filter
                </Button>
              }
            />
          </div>
        ) : (
          CATEGORIES.map((cat) => {
            const reports = filtered.filter((r) => r.category === cat)
            if (reports.length === 0) return null
            return (
              <section key={cat} className="rounded-sm border border-border-default bg-neutral-25 p-lg">
                <h2 className="text-lg font-bold text-text-primary">{CATEGORY_LABEL[cat]}</h2>
                <div className="mt-lg grid gap-lg tablet:grid-cols-2">
                  {reports.map((r) =>
                    r.status === 'pending' ? (
                      <ReportCard key={r.id} title={r.name} pending subtitle={r.pendingReason} />
                    ) : (
                      <ReportCard key={r.id} title={r.name} onDownload={() => handleRun(r)} />
                    ),
                  )}
                </div>
              </section>
            )
          })
        )}
      </div>

      {running && (
        <RunReportDrawer
          key={running.id}
          report={running}
          onClose={() => setRunning(null)}
          onGenerate={(values) => generate(running, values)}
        />
      )}
    </AppShell>
  )
}
