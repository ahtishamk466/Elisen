import { useState } from 'react'
import { ArrowRight, ClipboardCheck } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { CertPlanReportDrawer } from './CertPlanReportDrawer'
import { CertRecordReportDrawer } from './CertRecordReportDrawer'
import { RequirementMatrixReportDrawer } from './RequirementMatrixReportDrawer'

const REPORTS = [
  { key: 'cert-plan', name: 'Certification Plan' },
  { key: 'cert-record', name: 'Certification Record' },
  { key: 'requirement-matrix', name: 'Requirement Cross reference – Matrix' },
] as const

type ReportKey = typeof REPORTS[number]['key']

/** The three reports the legacy GCP Reports list runs, each its own
    parameter form before it runs — matching that screen's own shape rather
    than a live-preview params bar, since a report here is generated once
    with a deliberate set of inputs, not filtered live.

    One card per report rather than a two-column table (client instruction,
    2026-09-24), the same treatment as step 5 of the certification flow: with
    only three rows and one action each, a table spent a whole column on a
    header ("Action") that described a button already labelled, and left the
    right half of every row empty. The card puts the name and its one action
    together and the page reads as three things to run, not a list to scan. */
export function GcpReportsPage() {
  const [open, setOpen] = useState<ReportKey | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const download = (name: string) => {
    setToast(`${name} downloaded.`)
  }

  return (
    <AppShell
      activeItem="GCP"
      activeChild="GCP Reports"
      title="Reports"
      description="The reports available across every TCCA project."
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        {/* `flex-col` with the name block flexing, not step 5's plain grid:
            this page shows each report's full name (the flow's narrower
            cards abbreviate the Matrix one), so a name can wrap to two
            lines at tablet width and the buttons would otherwise sit at
            different heights across the row. */}
        <ul className="grid list-none gap-lg tablet:grid-cols-3">
          {REPORTS.map((r) => (
            <li key={r.key} className="flex flex-col gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg py-lg">
              <div className="flex flex-1 items-center gap-base">
                <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-accent-subtle text-accent">
                  <ClipboardCheck size={22} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-text-muted">Report</p>
                  <p className="text-sm font-semibold text-text-primary">{r.name}</p>
                </div>
              </div>
              <Button trailingIcon={<ArrowRight size={16} aria-hidden />} onClick={() => setOpen(r.key)}>
                Enter Parameters
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {open === 'cert-plan' && (
        <CertPlanReportDrawer onClose={() => setOpen(null)} onDownload={() => download('Certification Plan')} />
      )}
      {open === 'cert-record' && (
        <CertRecordReportDrawer onClose={() => setOpen(null)} onDownload={() => download('Certification Record')} />
      )}
      {open === 'requirement-matrix' && (
        <RequirementMatrixReportDrawer onClose={() => setOpen(null)} onDownload={() => download('Requirement Cross reference – Matrix')} />
      )}
    </AppShell>
  )
}
