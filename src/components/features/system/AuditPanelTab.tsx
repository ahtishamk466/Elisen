import { BarChart } from '@/components/patterns/BarChart'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  AUDIT_DAYS, AUDIT_SERIES_DESCRIPTION, AUDIT_SERIES_LABEL, formatCount, formatDayLabel, seriesTotal,
} from '@/lib/auditFixtures'
import type { AuditSeriesKey } from '@/types/audit'

/** Entries is the parent record, so it leads at full width; the four things
    that attach to an entry follow as small multiples. */
const SECONDARY: AuditSeriesKey[] = ['trails', 'mails', 'javascripts', 'errors']

function seriesData(key: AuditSeriesKey) {
  return AUDIT_DAYS.map((d) => ({ label: formatDayLabel(d.date), value: d.counts[key] }))
}

function ChartCard({ series, height }: { series: AuditSeriesKey; height: number }) {
  const total = seriesTotal(series)
  return (
    <section className="grid gap-lg rounded-sm border border-border-default bg-neutral-25 p-lg">
      <div className="grid gap-xxss">
        <div className="flex items-baseline justify-between gap-lg">
          <h2 className="text-lg font-bold text-text-primary">{AUDIT_SERIES_LABEL[series]}</h2>
          <p className="whitespace-nowrap text-2xl font-bold text-text-primary">{formatCount(total)}</p>
        </div>
        <p className="text-xs text-text-muted">{AUDIT_SERIES_DESCRIPTION[series]}</p>
      </div>
      <BarChart
        caption={`${AUDIT_SERIES_LABEL[series]} per day, 6 to 12 August 2026`}
        data={seriesData(series)}
        tone={series === 'errors' ? 'danger' : 'accent'}
        height={height}
        format={formatCount}
        emptyLabel={`No ${AUDIT_SERIES_LABEL[series].toLowerCase()} in the last 7 days`}
      />
    </section>
  )
}

export function AuditPanelTab({ loading = false }: { loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid gap-lg">
        <div className="rounded-sm border border-border-default bg-neutral-25 p-lg">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-lg h-44 w-full" />
        </div>
        <div className="grid gap-lg tablet:grid-cols-2">
          {SECONDARY.map((s) => (
            <div key={s} className="rounded-sm border border-border-default bg-neutral-25 p-lg">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="mt-lg h-36 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-lg">
      <p className="text-sm text-text-secondary">
        Audit activity for the last 7 days, Thu 6 – Wed 12 August 2026. Each chart counts records
        per day; the figure beside each heading is the total for the week.
      </p>
      <ChartCard series="entries" height={200} />
      {/* Each chart keeps its own scale — Errors and Trails differ by three
          orders of magnitude, so a shared axis would flatten Trails to
          nothing. The y-axis on each says what its scale is. */}
      <div className="grid gap-lg tablet:grid-cols-2">
        {SECONDARY.map((s) => <ChartCard key={s} series={s} height={150} />)}
      </div>
    </div>
  )
}
