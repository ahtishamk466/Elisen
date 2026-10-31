import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { DateText } from '@/components/patterns/DateText'
import { EmptyState } from '@/components/patterns/EmptyState'
import { Truncate } from '@/components/patterns/Truncate'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { useTableSort } from '@/components/patterns/useTableSort'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TCCA_STATUS_LABEL, TCCA_STATUS_TONE } from '@/lib/tccaDisplay'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { useTccaStore } from '@/stores/tccaStore'

/** Read-only usage of a shared Master. Association changes stay in GCP Projects. */
export function CertBasisUsage({ basisId }: { basisId: string }) {
  const navigate = useNavigate()
  const projects = useTccaStore((s) => s.tccaProjects)
  const links = useGcpFlowStore((s) => s.projectBasis)
  const elisenProjects = useProjectsStore((s) => s.rows)
  const rows = projects.filter((p) => links[p.id] === basisId).map((project) => ({
    project,
    linked: project.projectIds.flatMap((id) => {
      const p = elisenProjects.find((item) => item.id === id)
      return p ? [p] : []
    }),
  }))
  const { sorted, sort, setSort } = useTableSort(rows, {
    number: (r) => r.project.number,
    description: (r) => r.project.description,
    project: (r) => r.linked.map((p) => `${p.number}-${p.subNumber} ${p.title}`).join(' ') || null,
    status: (r) => TCCA_STATUS_LABEL[r.project.status],
    opened: (r) => r.project.openedDate || null,
  })
  const { visibleCount, loadingMore, loadMore } = useInfiniteReveal(sorted.length, 25)

  if (!rows.length) return <EmptyState title="No linked TCCA projects"
    description="Choose this Master from the Certification Basis step in GCP Projects." />

  return (
    <div>
      <p className="border-b border-border-default px-lg py-base text-sm text-text-muted">
        {rows.length} TCCA projects use this shared Master. Manage associations in GCP Projects.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-left text-sm" style={{ minWidth: 1100 }}>
          <colgroup>{[16, 28, 26, 10, 10, 10].map((width, i) => <col key={i} style={{ width: `${width}%` }} />)}</colgroup>
          <thead className="bg-neutral-50">
            <tr className="border-b border-border-default">
              {([
                ['number', 'TCCA Project'], ['description', 'Description'],
                ['project', 'Linked Elisen Projects'], ['status', 'Status'], ['opened', 'Opened'],
              ] as const).map(([key, label]) => (
                <SortableTh key={key} sortKey={key} sort={sort} onSortChange={setSort}
                  className="px-lg py-base">{label}</SortableTh>
              ))}
              <th className="px-lg py-base">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, visibleCount).map(({ project, linked }) => (
              <tr key={project.id} className="border-b border-border-default hover:bg-neutral-50">
                <td className="px-lg py-base font-semibold text-text-primary">{project.number}</td>
                <td className="px-lg py-base text-text-secondary"><Truncate>{project.description || '—'}</Truncate></td>
                <td className="px-lg py-base">
                  {linked.length ? <ul className="grid gap-sm">{linked.map((p) => (
                    <li key={p.id}>
                      <span className="font-semibold text-text-primary">{p.number}-{p.subNumber}</span>
                      {p.title && <p className="text-text-secondary"><Truncate>{p.title}</Truncate></p>}
                    </li>
                  ))}</ul> : <span className="text-text-muted">{project.projectIds.length ? 'Linked project unavailable' : 'Baseline / DAO'}</span>}
                </td>
                <td className="whitespace-nowrap px-lg py-base"><Badge tone={TCCA_STATUS_TONE[project.status]}>{TCCA_STATUS_LABEL[project.status]}</Badge></td>
                <td className="whitespace-nowrap px-lg py-base"><DateText value={project.openedDate} /></td>
                <td className="whitespace-nowrap px-lg py-base">
                  <Button variant="tertiary" size="sm" trailingIcon={<ArrowRight size={14} aria-hidden />}
                    aria-label={`Open GCP for ${project.number}`}
                    onClick={() => navigate(`/gcp/flow?project=${encodeURIComponent(project.id)}&step=2`)}>Open GCP</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AutoLoadFooter total={sorted.length} visibleCount={visibleCount} loading={loadingMore}
        onLoadMore={loadMore} itemLabel="TCCA projects" />
    </div>
  )
}
