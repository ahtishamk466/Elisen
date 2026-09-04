import { createPortal } from 'react-dom'
import { ChevronDown, Download, FileSpreadsheet, FileText, FileType2, Globe } from 'lucide-react'
import { useDropdown } from '@/components/patterns/useDropdown'
import { Button } from '@/components/ui/Button'
import { FORMAT_LABEL, type ReportFormat } from '@/lib/reportExport'

export interface DownloadMenuProps {
  onSelect: (format: ReportFormat) => void
  /** No preview yet = nothing to download; the reason rides on the trigger. */
  disabled?: boolean
  disabledReason?: string
}

const MENU_WIDTH = 208

/** Order mirrors how often the client asks for each format at hand-off:
    spreadsheets first, the print/paper pair, then the raw ones. */
const FORMATS: { format: ReportFormat; icon: React.ReactNode; hint?: string }[] = [
  { format: 'excel', icon: <FileSpreadsheet size={16} /> },
  { format: 'csv', icon: <FileSpreadsheet size={16} /> },
  { format: 'pdf', icon: <FileType2 size={16} />, hint: 'Via the print dialog' },
  { format: 'html', icon: <Globe size={16} /> },
  { format: 'text', icon: <FileText size={16} /> },
]

/** The one download control on the Reports screen. Local to features/reports:
    the projects `ExportMenu` is welded to `ProjectListRow` and the import
    direction rule forbids reaching sideways into features/projects for it. */
export function DownloadMenu({ onSelect, disabled = false, disabledReason }: DownloadMenuProps) {
  const { open, setOpen, position, triggerRef, menuRef } = useDropdown<HTMLButtonElement>(MENU_WIDTH)

  return (
    <>
      <Button
        ref={triggerRef}
        leadingIcon={<Download size={16} />}
        trailingIcon={<ChevronDown size={16} />}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        Download
      </Button>
      {open && position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Download format"
            className="fixed z-dropdown overflow-y-auto rounded-sm border border-border-default bg-neutral-25 py-xs shadow-lg"
            style={{ ...position, width: MENU_WIDTH }}
          >
            <p className="px-lg py-sm text-xs font-semibold text-text-muted">Download as</p>
            {FORMATS.map(({ format, icon, hint }) => (
              <button
                key={format}
                type="button"
                role="menuitem"
                onClick={() => { onSelect(format); setOpen(false) }}
                className="flex w-full items-center gap-sm px-lg py-sm text-left text-sm text-text-primary transition-colors duration-fast hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary"
              >
                <span className="text-text-muted" aria-hidden>{icon}</span>
                <span className="flex-1">{FORMAT_LABEL[format]}</span>
                {hint && <span className="text-xs text-text-muted">{hint}</span>}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
