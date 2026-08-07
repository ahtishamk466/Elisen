import { useMemo, useState } from 'react'
import { Plus, Search, SlidersHorizontal, ChevronDown, FolderOpen } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { StatCard } from '@/components/patterns/StatCard'
import { EmptyState } from '@/components/patterns/EmptyState'
import { Pagination } from '@/components/patterns/Pagination'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { ProjectsTable } from './ProjectsTable'
import { AddProjectDrawer } from './AddProjectDrawer'
import { PROJECT_ROWS } from '@/lib/projectFixtures'
import type { ProjectListRow } from '@/types/project'

export type PageState = 'ready' | 'loading' | 'empty' | 'error'

export interface ProjectsListPageProps {
  state?: PageState
  rows?: ProjectListRow[]
  canSeeFinancials?: boolean
}

export function ProjectsListPage({ state = 'ready', rows = PROJECT_ROWS, canSeeFinancials = true }: ProjectsListPageProps) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return rows
    const q = query.toLowerCase()
    return rows.filter((r) =>
      [r.number, r.subNumber, r.title, r.companyName, r.contactName, r.personResponsible]
        .join(' ').toLowerCase().includes(q),
    )
  }, [rows, query])

  const loading = state === 'loading'
  const showEmpty = state === 'empty' || (state === 'ready' && filtered.length === 0)

  const stats = [
    { value: rows.length, label: 'Total projects' },
    { value: rows.filter((r) => r.status === 'active').length, label: 'In progress' },
    { value: rows.filter((r) => r.status === 'complete').length, label: 'Completed projects' },
    { value: rows.filter((r) => r.priority === '1-fire').length, label: 'Priority 1 — Fire' },
  ]

  return (
    <AppShell title="Projects — List">
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        <div className="grid gap-lg mobile:grid-cols-2 laptop:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} value={s.value} label={s.label} loading={loading} />
          ))}
        </div>

        <div className="grid gap-sm tablet:flex tablet:flex-wrap tablet:items-center">
          <div className="min-w-0 tablet:flex-1" style={{ maxWidth: 380 }}>
            <label htmlFor="project-search" className="sr-only">Search projects</label>
            <Input
              id="project-search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              placeholder="Search by number, project, company or person..."
              leadingIcon={<Search size={16} />}
            />
          </div>
          <div className="flex flex-wrap items-center gap-sm">
            <Button variant="secondary" leadingIcon={<SlidersHorizontal size={16} />} aria-label="Filter projects">
              Filter
            </Button>
            <Button variant="secondary" trailingIcon={<ChevronDown size={16} />}>Export</Button>
          </div>
          <span className="hidden tablet:block tablet:flex-1" />
          <Button leadingIcon={<Plus size={16} />} onClick={() => setDrawerOpen(true)}>
            Add new project
          </Button>
        </div>

        {state === 'error' ? (
          <Alert title="We couldn't load projects">
            Something went wrong fetching the project list. Refresh the page, and if it keeps happening, contact your administrator.
          </Alert>
        ) : showEmpty && !loading ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<FolderOpen size={48} strokeWidth={1.5} />}
              title={query ? 'No projects match your search' : 'No projects yet'}
              description={
                query
                  ? 'Try a different project number, company or person.'
                  : 'Create your first project to start tracking work packages, deliverables and TCCA approvals.'
              }
              action={
                query ? (
                  <Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>
                ) : (
                  <Button leadingIcon={<Plus size={16} />} onClick={() => setDrawerOpen(true)}>Add new project</Button>
                )
              }
            />
          </div>
        ) : (
          <>
            <ProjectsTable rows={filtered} loading={loading} canSeeFinancials={canSeeFinancials} />
            {!loading && (
              <Pagination
                page={page}
                pageCount={3}
                summary={`Showing 1 to ${filtered.length} of ${filtered.length} projects`}
                onChange={setPage}
              />
            )}
          </>
        )}
      </div>

      <AddProjectDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        canSeeFinancials={canSeeFinancials}
        onCreated={(v) =>
          setToast(
            v.tccaRequired === 'yes'
              ? `Project ${v.number}-${v.subNumber} created, with TCCA project ${v.tccaNumber} linked.`
              : `Project ${v.number}-${v.subNumber} created.`,
          )
        }
      />
    </AppShell>
  )
}
