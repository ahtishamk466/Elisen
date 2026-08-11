import { createPortal } from 'react-dom'
import { ChevronDown, Download, FileSpreadsheet, FileText, FileType2 } from 'lucide-react'
import { useDropdown } from '@/components/patterns/useDropdown'
import { Button } from '@/components/ui/Button'
import { exportRowsAsCsv, exportRowsAsHtml, exportRowsAsText } from '@/lib/exportRows'
import type { ProjectListRow } from '@/types/project'

export interface ExportMenuProps {
  rows: ProjectListRow[]
  /** PDF/Excel need a binary-generation library not yet added — see docs/SECURITY.md rule 7. */
  onUnavailableFormat: (format: string) => void
}

const MENU_WIDTH = 208

export function ExportMenu({ rows, onUnavailableFormat }: ExportMenuProps) {
  const { open, setOpen, position, triggerRef, menuRef } = useDropdown<HTMLButtonElement>(MENU_WIDTH)

  const items = [
    { label: 'HTML', icon: <Download size={16} />, tone: 'text-info', onSelect: () => exportRowsAsHtml(rows) },
    { label: 'CSV', icon: <FileSpreadsheet size={16} />, tone: 'text-info', onSelect: () => exportRowsAsCsv(rows) },
    { label: 'Text', icon: <FileText size={16} />, tone: 'text-text-muted', onSelect: () => exportRowsAsText(rows) },
    { label: 'PDF', icon: <FileType2 size={16} />, tone: 'text-danger', onSelect: () => onUnavailableFormat('PDF') },
    { label: 'Excel', icon: <FileSpreadsheet size={16} />, tone: 'text-success', onSelect: () => onUnavailableFormat('Excel') },
  ]

  return (
    <>
      <Button
        ref={triggerRef}
        variant="secondary"
        size="lg"
        trailingIcon={<ChevronDown size={16} />}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Export
      </Button>
      {open && position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Export page data"
            className="fixed z-dropdown rounded-sm border border-border-default bg-neutral-25 py-xs shadow-lg"
            style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
          >
            <p className="px-lg py-sm text-xs font-semibold text-text-muted">Export Page Data</p>
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  item.onSelect()
                }}
                className="flex w-full items-center gap-sm px-lg py-sm text-left text-sm text-text-primary transition-colors duration-fast hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary"
              >
                <span aria-hidden className={item.tone}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
