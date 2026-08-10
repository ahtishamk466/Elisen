import { Download, FileText } from 'lucide-react'

export interface ReportCardProps {
  title: string
  subtitle?: string
  onDownload?: () => void
  pending?: boolean
}

/** One downloadable-report tile — active (danger-tinted icon, clickable) or
    pending (muted, disabled). Shared by TCCA Reports and Project Overview. */
export function ReportCard({ title, subtitle, onDownload, pending = false }: ReportCardProps) {
  if (pending) {
    return (
      <div className="flex items-center justify-between gap-lg rounded-sm border border-border-default bg-neutral-50 px-lg py-base opacity-60">
        <span className="flex items-center gap-sm">
          <span className="rounded-sm bg-neutral-100 p-xs text-text-muted" aria-hidden><FileText size={18} /></span>
          <span>
            <span className="block text-sm font-semibold text-text-primary">{title}</span>
            <span className="block text-xs text-text-muted">{subtitle ?? 'Pending report definitions'}</span>
          </span>
        </span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onDownload}
      className="flex items-center justify-between gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg py-base text-left transition-colors duration-fast hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
    >
      <span className="flex items-center gap-sm">
        <span className="rounded-sm bg-danger-subtle p-xs text-danger" aria-hidden><FileText size={18} /></span>
        <span className="text-sm font-semibold text-text-primary">{title}</span>
      </span>
      <Download size={18} className="shrink-0 text-text-secondary" aria-hidden />
    </button>
  )
}
