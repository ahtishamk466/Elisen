import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { EmptyState } from '@/components/patterns/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useDocumentsStore } from '@/stores/documentsStore'
import { KIND_LABEL, REVISION_STATUS_LABEL, REVISION_STATUS_TONE } from '@/lib/documentDisplay'
import type { DocumentKind } from '@/types/documents'

/** Reuse an existing revision on this project — "we did an iPad on another
    project, didn't we? Maybe I can use that same drawing." Searches the whole
    pool, including by aircraft type for drawings. */
export function LinkExistingRevisionDrawer({ kind, projectId, onClose }: { kind: DocumentKind; projectId: string; onClose: () => void }) {
  const documents = useDocumentsStore((s) => s.documents)
  const revisions = useDocumentsStore((s) => s.revisions)
  const links = useDocumentsStore((s) => s.links)
  const linkRevisionToProject = useDocumentsStore((s) => s.linkRevisionToProject)
  const [query, setQuery] = useState('')

  const linkedIds = new Set(links.filter((l) => l.projectId === projectId).map((l) => l.revisionId))

  const available = useMemo(() => {
    const rows = revisions.flatMap((r) => {
      const doc = documents.find((d) => d.id === r.documentId)
      if (!doc || doc.kind !== kind || linkedIds.has(r.id)) return []
      return [{ rev: r, doc }]
    })
    if (!query.trim()) return rows
    const q = query.toLowerCase()
    return rows.filter(({ rev, doc }) =>
      `${doc.number} ${rev.rev} ${doc.title} ${doc.aircraft ?? ''} ${doc.ataChapter ?? ''}`.toLowerCase().includes(q),
    )
  }, [documents, revisions, links, kind, projectId, query]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Drawer open onClose={onClose} title={`Link existing ${KIND_LABEL[kind].singular}`}
      footer={<><span /><Button variant="secondary" onClick={onClose}>Done</Button></>}>
      <div>
        <label htmlFor="pool-search" className="sr-only">Search the pool</label>
        <Input id="pool-search" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder={kind === 'drawing' ? 'Search by number, title or aircraft...' : 'Search by number or title...'}
          leadingIcon={<Search size={16} />} />
      </div>
      {available.length === 0 ? (
        <EmptyState title="No matching revisions" description="Everything in the pool is already linked to this project, or nothing matches your search." />
      ) : (
        <ul className="grid gap-sm">
          {available.map(({ rev, doc }) => (
            <li key={rev.id} className="flex items-center justify-between gap-lg rounded-sm border border-border-default px-base py-sm">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">
                  {doc.number} <span className="font-normal text-text-muted">rev {rev.rev}</span>
                </p>
                <p className="truncate text-sm text-text-secondary">{doc.title}</p>
                <p className="text-xs text-text-muted">
                  {doc.aircraft ? `${doc.aircraft} · ATA ${doc.ataChapter} · ` : ''}
                  <Badge tone={REVISION_STATUS_TONE[rev.status]}>{REVISION_STATUS_LABEL[rev.status]}</Badge>
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => linkRevisionToProject(projectId, rev.id)}>Link</Button>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  )
}
