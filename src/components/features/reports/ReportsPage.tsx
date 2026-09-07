import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, FileBarChart } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { ReportDetailPanel, ReportDetailSkeleton } from './ReportDetailPanel'
import { CATEGORY_LABEL, REPORT_CATALOG, type ReportCategory, type ReportDef } from '@/lib/reportCatalog'
import { periodRange } from '@/lib/hoursPeriod'
import { downloadReportAs, type ReportFormat } from '@/lib/reportExport'
import {
  buildApprovals, buildDetailedTime, buildHoursWorked, buildHoursWorkedSummary,
  buildOpenDeliverablesActionOn, buildProjectStatus, buildTccaPriority, buildTccaProjects,
  type ReportResult,
} from '@/lib/reportGenerators'
import { useProjectsStore } from '@/stores/projectsStore'
import { useTccaStore } from '@/stores/tccaStore'
import { useApprovalsStore } from '@/stores/approvalsStore'
import { deliverableSummaries, useDocumentsStore } from '@/stores/documentsStore'
import { useTimesheetStore } from '@/stores/timesheetStore'
import { useWorkPackagesStore } from '@/stores/workPackagesStore'
import { useCatalogStore } from '@/stores/catalogStore'

const CATEGORIES: ReportCategory[] = ['project', 'time', 'gcp']

/**
 * The dates a report's fields arrive pre-filled with.
 *
 * Last week, the same default Hours Worked opens on — a shared *convention*,
 * not shared state. Reading Hours Worked's live filter here would mean a
 * filter set on one screen silently changing what a report exports on
 * another, and a report is a document someone hands on: the range it covers
 * has to be visible and deliberate, never inherited from somewhere off
 * screen. Half these reports aren't time-scoped at all, so there would be
 * nothing to inherit for them anyway.
 */
function defaultDateValues(): Record<string, string> {
  const range = periodRange('last-week')
  return range ? { startDate: range.from, endDate: range.to } : {}
}

export type PageState = 'ready' | 'loading' | 'error'

/**
 * The report catalog as a master–detail, same shape as ATA Chapters and
 * Person Detail: every report on a rail at the left, the selected one opened
 * out at the right with its parameters, live preview and download. The flow
 * is one line: pick a report, pick its date range, the preview appears, then
 * download it in any format — and the preview and the file are built from
 * the same result, so they can never disagree.
 *
 * Selection rides in `?report=`, so a report is linkable and survives
 * refresh. Pending reports stay on the rail (nothing from the old system is
 * silently missing) and explain themselves in the pane instead of being
 * dead buttons.
 */
export function ReportsPage({ state = 'ready' }: { state?: PageState }) {
  const projects = useProjectsStore((s) => s.rows)
  const tccas = useTccaStore((s) => s.tccaProjects)
  const approvals = useApprovalsStore((s) => s.approvals)
  const documents = useDocumentsStore((s) => s.documents)
  const revisions = useDocumentsStore((s) => s.revisions)
  const entries = useTimesheetStore((s) => s.rows)
  const ensureTimesheet = useTimesheetStore((s) => s.ensureLoaded)
  useEffect(ensureTimesheet, [ensureTimesheet])
  const workPackages = useWorkPackagesStore((s) => s.workPackages)
  const catalogActivities = useCatalogStore((s) => s.activities)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'' | ReportCategory>('')
  const [toast, setToast] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const railRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return REPORT_CATALOG.filter(
      (r) => (!category || r.category === category)
        && (!q || `${r.name} ${r.description}`.toLowerCase().includes(q)),
    )
  }, [query, category])

  /* The URL names the selection; filtering the rail never clears it, so
     narrowing to a category doesn't yank the report out from under you. */
  const selected = REPORT_CATALOG.find((r) => r.id === searchParams.get('report'))
  const select = (r: ReportDef) => setSearchParams({ report: r.id }, { replace: true })

  useEffect(() => {
    railRef.current
      ?.querySelector('[aria-current="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [selected?.id])

  const run = (report: ReportDef, values: Record<string, string>): ReportResult => {
    const joins = { projects, workPackages, deliverables: deliverableSummaries(documents, revisions), activities: catalogActivities }
    switch (report.id) {
      case 'approvals': return buildApprovals(approvals, projects)
      case 'project-status': return buildProjectStatus(projects)
      case 'tcca-projects': return buildTccaProjects(tccas, projects)
      case 'tcca-priority': return buildTccaPriority(tccas, projects)
      case 'open-deliverables-action-on': return buildOpenDeliverablesActionOn(values.personResponsible, documents, revisions, projects)
      case 'detailed-time': return buildDetailedTime(entries, joins, values.startDate, values.endDate)
      case 'hours-worked': return buildHoursWorked(entries, joins, values.startDate, values.endDate)
      case 'hours-worked-individual': return buildHoursWorked(entries, joins, values.startDate, values.endDate, values.employee)
      case 'hours-worked-summary': return buildHoursWorkedSummary(entries, joins, values.startDate, values.endDate)
      default: throw new Error(`No generator for report "${report.id}"`)
    }
  }

  const handleDownload = (result: ReportResult, format: ReportFormat) => {
    setToast(downloadReportAs(result, format))
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
      description="Pick a report, set its date range, preview, download."
      activeItem="Reports"
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 320 }}>
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
      <div className="flex min-h-0 flex-1 flex-col gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        {state === 'loading' ? (
          <div className="grid min-h-0 flex-1 gap-lg laptop:grid-cols-[320px_minmax(0,1fr)]">
            <div className="grid content-start gap-sm rounded-sm border border-border-default bg-neutral-25 p-lg">
              {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-11 w-full" />)}
            </div>
            <ReportDetailSkeleton />
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 gap-lg laptop:grid-cols-[320px_minmax(0,1fr)]">
            {/* ------- The report rail ------- */}
            <nav aria-label="Reports" className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
              <div ref={railRef} className="relative min-h-0 flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                  <EmptyState
                    icon={<FileBarChart size={48} strokeWidth={1.5} />}
                    title="No reports match"
                    description="Try a different name, or switch back to all categories."
                    action={<Button variant="secondary" onClick={() => { setQuery(''); setCategory('') }}>Clear search &amp; filter</Button>}
                  />
                ) : (
                  CATEGORIES.map((cat) => {
                    const reports = filtered.filter((r) => r.category === cat)
                    if (reports.length === 0) return null
                    return (
                      <section key={cat} aria-label={CATEGORY_LABEL[cat]}>
                        <h2 className="sticky top-0 z-sticky border-b border-border-default bg-neutral-50 px-lg py-sm text-xs font-semibold uppercase tracking-wide text-text-secondary">
                          {CATEGORY_LABEL[cat]}
                        </h2>
                        <ul>
                          {reports.map((r) => {
                            const isSel = r.id === selected?.id
                            return (
                              <li key={r.id} className="border-b border-border-default last:border-b-0">
                                <button
                                  type="button"
                                  onClick={() => select(r)}
                                  aria-current={isSel ? 'true' : undefined}
                                  className={`flex w-full items-start gap-sm border-l-2 px-lg py-base text-left transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary
                                    ${isSel ? 'border-accent bg-neutral-100' : 'border-transparent hover:bg-neutral-50'}`}
                                >
                                  <span className="min-w-0 flex-1">
                                    <span className={`block truncate text-sm ${isSel ? 'font-semibold' : ''} ${r.status === 'pending' ? 'text-text-muted' : 'text-text-primary'}`}>
                                      {r.name}
                                    </span>
                                    <span className="mt-xxss block truncate text-xs text-text-muted" title={r.description}>{r.description}</span>
                                  </span>
                                  {r.status === 'pending' && <Badge tone="warning">Pending</Badge>}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </section>
                    )
                  })
                )}
              </div>
            </nav>

            {/* ------- The selected report ------- */}
            {selected ? (
              <ReportDetailPanel
                key={selected.id}
                report={selected}
                initialValues={defaultDateValues()}
                run={(values) => run(selected, values)}
                onDownload={handleDownload}
              />
            ) : (
              <section aria-label="No report selected" className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
                <EmptyState
                  icon={<FileBarChart size={48} strokeWidth={1.5} />}
                  title="Select a report"
                  description="Pick a report on the left to set its date range, preview the data and download it as Excel, PDF, CSV, Text or HTML."
                />
              </section>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
