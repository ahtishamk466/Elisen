import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { EmptyState } from '@/components/patterns/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useProjectsStore } from '@/stores/projectsStore'
import { useTccaStore } from '@/stores/tccaStore'
import { deliverableSummaries, useDocumentsStore } from '@/stores/documentsStore'
import type { TccaProject } from '@/types/tcca'

/** Pick a deliverable revision from the Elisen-side pool and link it to this
    TCCA project. The full pool is offered — a revision created for one project
    can be reused on another (client-confirmed behavior). */
export function LinkRevisionDrawer({ open, tcca, onClose }: { open: boolean; tcca: TccaProject; onClose: () => void }) {
  const projects = useProjectsStore((s) => s.rows)
  const documents = useDocumentsStore((s) => s.documents)
  const docRevisions = useDocumentsStore((s) => s.revisions)
  const revisions = deliverableSummaries(documents, docRevisions)
  const docLinks = useTccaStore((s) => s.docLinks)
  const linkRevision = useTccaStore((s) => s.linkRevision)
  const [query, setQuery] = useState('')

  const linkedIds = new Set(docLinks.filter((l) => l.tccaProjectId === tcca.id).map((l) => l.revisionId))
  const available = useMemo(() => {
    const pool = revisions.filter((r) => !linkedIds.has(r.id))
    const fromLinked = pool.filter((r) => tcca.projectIds.includes(r.projectId))
    const others = pool.filter((r) => !tcca.projectIds.includes(r.projectId))
    const ordered = [...fromLinked, ...others]
    if (!query.trim()) return ordered
    const q = query.toLowerCase()
    return ordered.filter((r) => `${r.number} ${r.rev} ${r.title}`.toLowerCase().includes(q))
  }, [revisions, docLinks, tcca, query]) // eslint-disable-line react-hooks/exhaustive-deps

  const projectLabel = (id: string) => {
    const p = projects.find((x) => x.id === id)
    return p ? `${p.number}-${p.subNumber}` : '—'
  }

  return (
    <Drawer open={open} onClose={onClose} title={`Link document to ${tcca.number}`}
      footer={<><Button variant="secondary" onClick={onClose}>Done</Button></>}>
      <div>
        <label htmlFor="rev-search" className="sr-only">Search revisions</label>
        <Input id="rev-search" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by number or title..." leadingIcon={<Search size={16} />} />
      </div>
      {available.length === 0 ? (
        <EmptyState title="No matching revisions" description="Every revision in the pool is already linked, or nothing matches your search." />
      ) : (
        <ul className="grid gap-sm">
          {available.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-lg rounded-sm border border-border-default px-base py-sm">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">{r.number} <span className="font-normal text-text-muted">rev {r.rev}</span></p>
                <p className="truncate text-sm text-text-secondary">{r.title}</p>
                <p className="text-xs text-text-muted">
                  Created for {projectLabel(r.projectId)}
                  {!tcca.projectIds.includes(r.projectId) && ', not a linked project'}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => linkRevision(tcca.id, r.id)}>Link</Button>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  )
}
