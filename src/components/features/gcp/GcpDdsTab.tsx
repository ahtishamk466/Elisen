import { useState } from 'react'
import { Eye, FileText, Pencil, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { Truncate } from '@/components/patterns/Truncate'
import { useTableSort } from '@/components/patterns/useTableSort'
import { proportionalWidths } from '@/lib/tableWidths'
import { useGcpStore } from '@/stores/gcpStore'
import type { DdsType } from '@/types/gcp'
import { DdsTypeDetailDrawer } from './DdsTypeDetailDrawer'
import { DdsTypeDrawer } from './DdsTypeDrawer'

type SortKey = 'type' | 'ddsText'

const COLUMNS: { label: string; sort: SortKey; width: number }[] = [
  { label: 'DDS Type', sort: 'type', width: 360 },
  /* Legacy DDS Text is blank on every one of the 10 real rows (see
     DDS_TYPES in gcpFixtures.ts) — an unconstrained column would render as
     a huge, entirely empty void next to a narrow DDS Type column, which
     read as broken rather than as a column waiting for real content
     (client instruction, 2026-09-25). Weighted wider than DDS Type since it
     will hold longer text once populated, but capped, not unbounded. */
  { label: 'DDS Text', sort: 'ddsText', width: 480 },
]
const ACTIONS_WIDTH = 64
const TABLE_WIDTH = COLUMNS.reduce((sum, c) => sum + c.width, 0) + ACTIONS_WIDTH
/** `%` per column, same proportion as the pixel weights above — see
    `lib/tableWidths.ts`. */
const COL_WIDTHS = proportionalWidths([...COLUMNS.map((c) => c.width), ACTIONS_WIDTH])

/** `DOMParser` never attaches the parsed document to the page, so nothing
    it contains executes — only `textContent` is read out of it, for a
    safe plain-text table preview of the stored rich HTML (see
    `DdsTypeDetailDrawer`'s own copy of this for the fuller comment). */
function htmlToText(html: string): string {
  if (!html) return ''
  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() ?? ''
}

export interface GcpDdsTabProps {
  /** The page header's "Add DDS Type" button controls this drawer — see
      docs/COMPONENTS.md, "Tabbed page layout". */
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
  /** The page header's search box (next to Add) also lives outside this
      panel, same reasoning. */
  query: string
}

/** Reference Lists' DDS tab — every DDS Type exactly as the legacy
    `dds/index` list has it (10 of 11 rows; the 11th is on a page the
    portal now gates behind a login the app never performs, see
    `gcpFixtures.ts`'s own comment on `DDS_TYPES`). */
export function GcpDdsTab({ createOpen, onCreateOpenChange, query }: GcpDdsTabProps) {
  const ddsTypes = useGcpStore((s) => s.ddsTypes)
  const addDdsType = useGcpStore((s) => s.addDdsType)
  const updateDdsType = useGcpStore((s) => s.updateDdsType)
  const removeDdsType = useGcpStore((s) => s.removeDdsType)

  const [viewing, setViewing] = useState<DdsType | null>(null)
  const [editing, setEditing] = useState<DdsType | null>(null)
  const [toDelete, setToDelete] = useState<DdsType | null>(null)

  const q = query.trim().toLowerCase()
  const filtered = q
    ? ddsTypes.filter((d) => `${d.type} ${htmlToText(d.ddsText)}`.toLowerCase().includes(q))
    : ddsTypes

  const { sorted, sort, setSort } = useTableSort(filtered, {
    type: (d) => d.type,
    ddsText: (d) => htmlToText(d.ddsText),
  })

  return (
    <div className="grid gap-lg">
      {sorted.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<FileText size={48} strokeWidth={1.5} />}
            title={query ? 'No DDS types match your search' : 'No DDS types yet'}
            description={query ? 'Try another type or text.' : 'Add the first DDS type.'}
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border-default bg-neutral-25">
          <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: TABLE_WIDTH }}>
            <caption className="sr-only">DDS types</caption>
            <colgroup>
              {COLUMNS.map((c, i) => <col key={c.label} style={{ width: COL_WIDTHS[i] }} />)}
              <col style={{ width: COL_WIDTHS[COLUMNS.length] }} />
            </colgroup>
            <thead>
              <tr className="border-b border-border-default bg-neutral-50">
                {COLUMNS.map((c) => (
                  <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                    className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">
                    {c.label}
                  </SortableTh>
                ))}
                <SortableTh className="px-lg py-base text-sm font-semibold text-text-secondary">Actions</SortableTh>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => (
                <tr key={d.id} className="border-b border-border-default last:border-b-0">
                  <td className="px-lg py-base text-sm text-text-primary">
                    <Truncate lines={2}>{d.type || '—'}</Truncate>
                  </td>
                  <td className="px-lg py-base text-sm text-text-primary">
                    {d.ddsText ? <Truncate lines={2}>{htmlToText(d.ddsText)}</Truncate> : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-lg py-base">
                    <ActionsMenu
                      ariaLabel={`Actions for DDS type ${d.type || 'untitled'}`}
                      items={[
                        { label: 'View', icon: <Eye size={16} />, onSelect: () => setViewing(d) },
                        { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setEditing(d) },
                        { label: 'Remove', icon: <Trash2 size={16} />, onSelect: () => setToDelete(d), tone: 'danger' },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {createOpen && (
        <DdsTypeDrawer
          mode="create"
          onClose={() => onCreateOpenChange(false)}
          onSubmit={(d) => addDdsType(d)}
        />
      )}

      {editing && (
        <DdsTypeDrawer
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(d) => updateDdsType(d.id, d)}
        />
      )}

      {viewing && (
        <DdsTypeDetailDrawer
          ddsType={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null) }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          open
          title={`Remove “${toDelete.type || 'this DDS type'}”?`}
          description="This DDS type will no longer be offered from the Compliance Plan step's DDS Id field."
          confirmLabel="Remove"
          tone="danger"
          onConfirm={() => { removeDdsType(toDelete.id); setToDelete(null) }}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
