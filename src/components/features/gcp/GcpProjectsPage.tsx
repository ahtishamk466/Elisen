import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShieldCheck } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { Truncate } from '@/components/patterns/Truncate'
import { DateText } from '@/components/patterns/DateText'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useTccaStore } from '@/stores/tccaStore'
import { TCCA_STATUS_LABEL, TCCA_STATUS_TONE } from '@/lib/tccaDisplay'

const COLUMNS = [
  { label: 'Project', sort: 'number' as const },
  { label: 'Description', sort: 'description' as const },
  { label: 'Opened', sort: 'opened' as const },
  { label: 'Status', sort: 'status' as const },
]

/** Where GCP work starts: pick the TCCA project, then everything inside it —
    basis, rules, compliance, reports — is that project's own. */
export function GcpProjectsPage() {
  const navigate = useNavigate()
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = q
    ? tccaProjects.filter((t) => `${t.number} ${t.description}`.toLowerCase().includes(q))
    : tccaProjects

  const { visibleCount, loadingMore, loadMore, reset: resetVisible } = useInfiniteReveal(filtered.length, 25)

  const { sorted, sort, setSort } = useTableSort(filtered, {
    number: (t) => t.number,
    description: (t) => t.description,
    opened: (t) => t.openedDate,
    status: (t) => TCCA_STATUS_LABEL[t.status],
  }, { onSortChange: resetVisible })

  return (
    <AppShell
      activeItem="GCP"
      activeChild="GCP Projects"
      title="GCP Projects"
      description="Certification planning for Transport Canada projects."
      headerActions={
        <div style={{ width: 280 }}>
          <label htmlFor="gcp-project-search" className="sr-only">Search by project number or description</label>
          <Input
            id="gcp-project-search"
            size="sm"
            leadingIcon={<Search size={16} />}
            placeholder="Search..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); resetVisible() }}
          />
        </div>
      }
    >
      <div className="grid gap-lg">
        {filtered.length === 0 ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<ShieldCheck size={48} strokeWidth={1.5} />}
              title={query ? 'No projects match your search' : 'No TCCA projects yet'}
              description={query
                ? 'Try a different project number or description.'
                : 'GCP planning starts from a TCCA project. Create one under Projects → TCCA Projects.'}
              action={query
                ? <Button variant="secondary" size="md" onClick={() => { setQuery(''); resetVisible() }}>Clear search</Button>
                : <Button size="md" onClick={() => navigate('/tcca-projects')}>Go to TCCA Projects</Button>}
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left" style={{ minWidth: 720 }}>
                <caption className="sr-only">TCCA projects with GCP work</caption>
                <thead>
                  <tr className="border-b border-border-default bg-neutral-50">
                    {COLUMNS.map((c) => (
                      <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                        className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{c.label}</SortableTh>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice(0, visibleCount).map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => navigate(`/gcp/projects/${t.id}`)}
                      className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle"
                    >
                      <td className="whitespace-nowrap px-lg py-base">
                        <Link to={`/gcp/projects/${t.id}`} className="text-sm font-semibold text-text-primary underline-offset-2 hover:text-accent hover:underline">
                          {t.number}
                        </Link>
                      </td>
                      <td className="px-lg py-base text-sm text-text-primary" style={{ maxWidth: 360 }}><Truncate>{t.description}</Truncate></td>
                      <td className="px-lg py-base text-sm text-text-primary"><DateText value={t.openedDate} /></td>
                      <td className="px-lg py-base"><Badge tone={TCCA_STATUS_TONE[t.status]}>{TCCA_STATUS_LABEL[t.status]}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AutoLoadFooter total={filtered.length} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="projects" />
          </div>
        )}
      </div>
    </AppShell>
  )
}
