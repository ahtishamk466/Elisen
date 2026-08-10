import { Download, FileText } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { useProjectsStore } from '@/stores/projectsStore'
import { useTccaStore } from '@/stores/tccaStore'
import { deliverableSummaries, useDocumentsStore } from '@/stores/documentsStore'
import { downloadCompletionChecklist } from '@/lib/pccReport'
import { PENDING_REPORTS } from '@/lib/pendingReports'
import type { DeliverableRevision, TccaProject } from '@/types/tcca'

export function TccaReportsTab({ tcca }: { tcca: TccaProject }) {
  const projects = useProjectsStore((s) => s.rows)
  const documents = useDocumentsStore((s) => s.documents)
  const docRevisions = useDocumentsStore((s) => s.revisions)
  const revisions = deliverableSummaries(documents, docRevisions)
  const docLinks = useTccaStore((s) => s.docLinks)

  const generatePcc = () => {
    const linkedProjects = tcca.projectIds
      .map((id) => projects.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p)
    const links = docLinks
      .filter((l) => l.tccaProjectId === tcca.id)
      .map((link) => ({ link, revision: revisions.find((r) => r.id === link.revisionId) }))
      .filter((x): x is { link: typeof x.link; revision: DeliverableRevision } => !!x.revision)
    downloadCompletionChecklist(tcca, linkedProjects, links)
  }

  return (
    <div className="grid gap-lg">
      <div className="grid gap-lg tablet:grid-cols-2">
        <button
          type="button"
          onClick={generatePcc}
          className="flex items-center justify-between gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg py-base text-left transition-colors duration-fast hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          <span className="flex items-center gap-sm">
            <span className="rounded-sm bg-danger-subtle p-xs text-danger" aria-hidden><FileText size={18} /></span>
            <span className="text-sm font-semibold text-text-primary">Project Completion Checklist</span>
          </span>
          <Download size={18} className="shrink-0 text-text-secondary" aria-hidden />
        </button>

        {PENDING_REPORTS.map((name) => (
          <div key={name} className="flex items-center justify-between gap-lg rounded-sm border border-border-default bg-neutral-50 px-lg py-base opacity-60">
            <span className="flex items-center gap-sm">
              <span className="rounded-sm bg-neutral-100 p-xs text-text-muted" aria-hidden><FileText size={18} /></span>
              <span>
                <span className="block text-sm font-semibold text-text-primary">{name}</span>
                <span className="block text-xs text-text-muted">Pending report definitions</span>
              </span>
            </span>
          </div>
        ))}
      </div>

      <Alert tone="info" title="Only the Project Completion Checklist is defined so far">
        The remaining report set lives with management (Jalal) and hasn't been specified yet — those cards will activate once the definitions arrive.
      </Alert>
    </div>
  )
}
