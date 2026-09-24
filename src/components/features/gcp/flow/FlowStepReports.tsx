import { useState } from 'react'
import { ArrowRight, ClipboardCheck } from 'lucide-react'
import { CertPlanReportDrawer } from '../CertPlanReportDrawer'
import { CertRecordReportDrawer } from '../CertRecordReportDrawer'
import { RequirementMatrixReportDrawer } from '../RequirementMatrixReportDrawer'
import { Button } from '@/components/ui/Button'
import type { TccaProject } from '@/types/tcca'

const REPORTS = [
  { key: 'cert-plan', name: 'Certification Plan' },
  { key: 'cert-record', name: 'Certification Record' },
  { key: 'requirement-matrix', name: 'Requirement Cross Ref – Matrix' },
] as const

type ReportKey = typeof REPORTS[number]['key']

/**
 * Step 5 — Reports: the three GCP reports, as one card each, scoped to the
 * project this flow is already on. Each card opens the same parameter drawer
 * `GcpReportsPage` uses, with this project pre-selected since the reader
 * already picked it in step 1.
 */
export function FlowStepReports({ project }: { project: TccaProject }) {
  const [open, setOpen] = useState<ReportKey | null>(null)

  return (
    <section className="grid gap-lg">
      <div className="grid gap-xxss">
        <h2 className="text-base font-semibold text-text-primary">Reports</h2>
        <p className="text-xs text-text-muted">The reports available for this TCCA project.</p>
      </div>

      <div className="grid gap-lg tablet:grid-cols-3">
        {REPORTS.map((r) => (
          <div key={r.key} className="grid gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg py-lg">
            <div className="flex items-center gap-base">
              <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-accent-subtle text-accent">
                <ClipboardCheck size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-text-muted">Report</p>
                <p className="truncate text-sm font-semibold text-text-primary">{r.name}</p>
              </div>
            </div>
            <Button trailingIcon={<ArrowRight size={16} aria-hidden />} onClick={() => setOpen(r.key)}>
              Enter Parameters
            </Button>
          </div>
        ))}
      </div>

      {open === 'cert-plan' && (
        <CertPlanReportDrawer defaultTccaProjectId={project.id} onClose={() => setOpen(null)} />
      )}
      {open === 'cert-record' && (
        <CertRecordReportDrawer defaultTccaProjectId={project.id} onClose={() => setOpen(null)} />
      )}
      {open === 'requirement-matrix' && (
        <RequirementMatrixReportDrawer defaultTccaProjectId={project.id} onClose={() => setOpen(null)} />
      )}
    </section>
  )
}
