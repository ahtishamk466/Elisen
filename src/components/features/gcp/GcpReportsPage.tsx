import { useState } from 'react'
import { Play } from 'lucide-react'
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
    with a deliberate set of inputs, not filtered live. */
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
      description="Generate a report by choosing its parameters."
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">GCP reports</caption>
            <thead>
              <tr className="border-b border-border-default bg-neutral-50">
                <th scope="col" className="px-lg py-base text-sm font-semibold text-text-secondary">Name</th>
                <th scope="col" className="px-lg py-base text-sm font-semibold text-text-secondary">Action</th>
              </tr>
            </thead>
            <tbody>
              {REPORTS.map((r) => (
                <tr key={r.key} className="border-b border-border-default last:border-b-0">
                  <td className="px-lg py-base text-sm text-text-primary">{r.name}</td>
                  <td className="px-lg py-base">
                    <Button variant="tertiary" size="sm" leadingIcon={<Play size={14} />} onClick={() => setOpen(r.key)}>
                      Enter Parameters
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
