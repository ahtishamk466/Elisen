import { useMemo, useState } from 'react'
import { CalendarRange, CircleDashed, SearchX, SlidersHorizontal } from 'lucide-react'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

import { CATEGORY_LABEL, type ReportDef } from '@/lib/reportCatalog'
import type { ReportResult } from '@/lib/reportGenerators'
import { ReportParamsBar, type ParamValues } from './ReportParamsBar'
import { DownloadMenu } from './DownloadMenu'
import type { ReportFormat } from '@/lib/reportExport'

export interface ReportDetailPanelProps {
  report: ReportDef
  /** Pre-filled parameter values — shown in the fields, applied only on Apply. */
  initialValues: ParamValues
  /** Builds the result from applied values; the page owns the store wiring,
      the panel owns the flow. */
  run: (values: ParamValues) => ReportResult
  onDownload: (result: ReportResult, format: ReportFormat) => void
}

/** Inclusive: Aug 21 to Aug 21 is one day, not zero. */
function dayCount(from: string, to: string) {
  const a = new Date(`${from}T00:00:00`)
  const b = new Date(`${to}T00:00:00`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1
}

/**
 * The right half of the Reports master–detail: parameters, preview and
 * download for the selected report.
 *
 * Two sets of values, deliberately: the **draft** the reader is editing lives
 * in `ReportParamsBar`, and the **applied** set below drives both the preview
 * and the download. They are the same object, so the file can never cover a
 * different range than the table above it.
 */
export function ReportDetailPanel({ report, initialValues, run, onDownload }: ReportDetailPanelProps) {
  /* Null until the reader confirms — a report with no applied range shows the
     gate, not a guess. Reports with no parameters apply immediately, since
     there is nothing to confirm. */
  const [applied, setApplied] = useState<ParamValues | null>(report.params.length === 0 ? {} : null)

  const result = useMemo(
    () => (report.status === 'ready' && applied ? run(applied) : null),
    [applied], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const from = applied?.startDate
  const to = applied?.endDate
  const days = from && to ? dayCount(from, to) : null
  const hasDateParams = report.params.some((p) => p.kind === 'date')

  return (
    <section aria-label={`Report ${report.name}`} className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      {/* ------- Pane header ------- */}
      <div className="flex flex-wrap items-start gap-x-2xl gap-y-lg border-b border-border-default px-2xl py-lg">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-sm">
            <h2 className="text-xl font-bold text-text-primary">{report.name}</h2>
            <Badge appearance="outline">{CATEGORY_LABEL[report.category]}</Badge>
            {report.status === 'pending' && <Badge tone="warning">Pending</Badge>}
          </div>
          <p className="mt-xs text-sm text-text-secondary">{report.description}</p>
        </div>
        <DownloadMenu
          disabled={!result}
          disabledReason={report.status === 'pending'
            ? report.pendingReason
            : hasDateParams
              ? 'Apply a date range to enable the download.'
              : 'Apply a selection to enable the download.'}
          onSelect={(format) => result && onDownload(result, format)}
        />
      </div>

      {report.status === 'pending' ? (
        <EmptyState
          icon={<CircleDashed size={48} strokeWidth={1.5} />}
          title="This report isn't available yet"
          description={`${report.pendingReason}. It stays listed so nothing from the old system is silently missing.`}
        />
      ) : (
        <>
          {report.params.length > 0 && (
            <ReportParamsBar
              params={report.params}
              initial={initialValues}
              applied={applied}
              onApply={setApplied}
              onClear={() => setApplied(null)}
            />
          )}

          {/* ------- What you are looking at ------- */}
          {result && (
            <div className="flex flex-wrap items-center gap-x-2xl gap-y-sm border-b border-border-default px-2xl py-base">
              {result.range && (
                <span className="flex items-center gap-sm">
                  <CalendarRange size={16} className="text-text-muted" aria-hidden />
                  {/* The applied range, read the way every date in the app
                      reads. Straight off the result, so the line here and the
                      line at the top of the downloaded file are the same
                      string. */}
                  <span className="text-sm font-semibold text-text-primary">{result.range}</span>
                  {days !== null && (
                    <span className="text-sm text-text-muted">
                      {days} day{days === 1 ? '' : 's'}
                    </span>
                  )}
                </span>
              )}
              <span className="text-sm text-text-secondary">{result.meta}</span>
            </div>
          )}

          {/* ------- Preview ------- */}
          {!result ? (
            /* A report with no date parameter is gated on something else
               entirely (a person, say), so the copy names what is actually
               missing rather than talking about dates that aren't there. */
            hasDateParams ? (
              <EmptyState
                icon={<CalendarRange size={48} strokeWidth={1.5} />}
                title="Set a date range to preview"
                description="The dates above are pre-filled with last week. Adjust them if you need to, then select Apply — the same range is used for the preview and the downloaded file."
              />
            ) : (
              <EmptyState
                icon={<SlidersHorizontal size={48} strokeWidth={1.5} />}
                title="Choose what this report covers"
                description="Make the selection above, then select Apply — the same selection is used for the preview and the downloaded file."
              />
            )
          ) : result.rows.length === 0 ? (
            <EmptyState
              icon={<SearchX size={48} strokeWidth={1.5} />}
              title="No records match"
              description={from && to
                ? 'Nothing was logged in this date range. Widen it and apply again.'
                : 'Nothing matches the selection above. Try a different one and apply again.'}
            />
          ) : (
            <PreviewTable result={result} />
          )}
        </>
      )}
    </section>
  )
}

/** The preview rows, sortable like every other table in the app. */
function PreviewTable({ result }: { result: ReportResult }) {
  const accessors = useMemo(
    () => Object.fromEntries(result.columns.map((_, i) => [String(i), (row: string[]) => (row[i] === '—' ? null : row[i])])),
    [result.columns],
  )
  const { sorted, sort, setSort } = useTableSort(result.rows, accessors)

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full border-collapse text-left" style={{ minWidth: result.columns.length * 120 }}>
        <caption className="sr-only">{result.title} preview</caption>
        <thead>
          <tr className="border-b border-border-default bg-neutral-50">
            {result.columns.map((c, i) => (
              <SortableTh key={c} sortKey={String(i)} sort={sort} onSortChange={setSort}
                className="sticky top-0 z-sticky whitespace-nowrap bg-neutral-50 px-lg py-base text-xs font-semibold text-text-secondary">
                {c}
              </SortableTh>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, ri) => (
            <tr key={ri} className="border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-neutral-50">
              {row.map((v, ci) => (
                <td key={ci} className="px-lg py-lg align-top text-sm text-text-primary">{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Skeleton twin of the panel, for the page's loading state. */
export function ReportDetailSkeleton() {
  return (
    <section aria-hidden className="flex min-h-0 flex-col gap-lg overflow-hidden rounded-sm border border-border-default bg-neutral-25 p-2xl">
      <Skeleton className="h-7 w-72" />
      <Skeleton className="h-4 w-96" />
      <div className="mt-lg grid gap-base">
        {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-11 w-full" />)}
      </div>
    </section>
  )
}
