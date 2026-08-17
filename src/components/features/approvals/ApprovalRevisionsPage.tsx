import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Truncate } from '@/components/patterns/Truncate'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApprovalRevisionDrawer } from './ApprovalRevisionDrawer'
import { useApprovalsStore } from '@/stores/approvalsStore'
import type { Approval, ApprovalRevision } from '@/types/documents'

const HEADERS = ['Approval Number', 'Revision', 'Change Description', 'Revision Date', 'Document', 'Actions']

export type PageState = 'ready' | 'loading' | 'error'

type Row = { revision: ApprovalRevision; approval: Approval | undefined }

/**
 * Every revision across every certificate. This is a listing in its own right,
 * not a view of the workspace: the legacy create screen opens with an approval
 * picker, because a revision is raised against a certificate you choose rather
 * than one you are already looking at.
 *
 * Sorted newest-first — the question this page answers is "what has been
 * re-issued lately", which no single approval's workspace can show.
 */
export function ApprovalRevisionsPage({ state = 'ready' }: { state?: PageState }) {
  const navigate = useNavigate()
  const approvals = useApprovalsStore((s) => s.approvals)
  const allRevisions = useApprovalsStore((s) => s.revisions)
  const removeRevision = useApprovalsStore((s) => s.removeRevision)

  const [query, setQuery] = useState('')
  const [drawer, setDrawer] = useState<{ revision?: ApprovalRevision } | null>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const rows = useMemo<Row[]>(() => {
    const q = query.toLowerCase().trim()
    return allRevisions
      .map((revision) => ({ revision, approval: approvals.find((a) => a.id === revision.approvalId) }))
      .filter(({ revision, approval }) =>
        !q || `${approval?.number ?? ''} ${approval?.description ?? ''} ${revision.revision} ${revision.changeDescription} ${revision.document}`
          .toLowerCase().includes(q))
      .sort((a, b) =>
        b.revision.revisionDate.localeCompare(a.revision.revisionDate)
        || (a.approval?.number ?? '').localeCompare(b.approval?.number ?? '')
        || b.revision.revision - a.revision.revision)
  }, [allRevisions, approvals, query])

  const { visibleCount, loadingMore, loadMore, reset: resetVisible } = useInfiniteReveal(rows.length, 25)
  const loading = state === 'loading'

  if (state === 'error') {
    return (
      <AppShell title="Approval Revisions" activeItem="Approvals" activeChild="Approval Revisions">
        <Alert title="We couldn't load approval revisions">
          Refresh the page, and if it keeps happening, contact your administrator.
        </Alert>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Approval Revisions"
      activeItem="Approvals"
      activeChild="Approval Revisions"
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 400 }}>
            <label htmlFor="rev-search" className="sr-only">Search approval revisions</label>
            <Input size="sm"
              id="rev-search" value={query} onChange={(e) => { setQuery(e.target.value); resetVisible() }}
              placeholder="Search by approval, change description or document..." leadingIcon={<Search size={16} />}
            />
          </div>
          <Button leadingIcon={<Plus size={16} />} onClick={() => setDrawer({})}>
            Raise Revision
          </Button>
        </>
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        <p className="text-sm text-text-secondary">
          Every revision raised against a certificate, newest first. A revision records what changed
          and when, and it is what authorises extending an approval to further aircraft.
        </p>

        {!loading && rows.length === 0 ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<FileText size={48} strokeWidth={1.5} />}
              title={query ? 'No revisions match your search' : 'No approval revisions yet'}
              description={query
                ? 'Try a different approval number, change description or document.'
                : 'A certificate is granted by its first revision. Raise one against an approval to record it.'}
              action={query
                ? <Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>
                : <Button leadingIcon={<Plus size={16} />} onClick={() => setDrawer({})}>Raise Revision</Button>}
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left" style={{ minWidth: 1000 }}>
                <caption className="sr-only">Approval revisions across all certificates</caption>
                <thead>
                  <tr className="border-b border-border-default bg-neutral-50">
                    {HEADERS.map((h) => (
                      <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 6 }, (_, i) => (
                        <tr key={i} className="border-b border-border-default last:border-b-0">
                          {HEADERS.map((h) => <td key={h} className="px-lg py-base"><Skeleton className="h-4 w-full" /></td>)}
                        </tr>
                      ))
                    : rows.slice(0, visibleCount).map((row) => {
                        const { revision, approval } = row
                        return (
                          <tr
                            key={revision.id}
                            onClick={() => approval && navigate(`/approvals/${approval.id}`)}
                            className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle"
                          >
                            <td className="whitespace-nowrap px-lg py-base align-top">
                              {approval ? (
                                <Link
                                  to={`/approvals/${approval.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-sm font-semibold text-text-primary underline-offset-2 hover:text-accent hover:underline"
                                >
                                  {approval.number}
                                </Link>
                              ) : (
                                <span className="text-sm text-text-muted">Approval deleted</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-lg py-base align-top">
                              <Badge appearance="outline">Rev {revision.revision}</Badge>
                            </td>
                            <td className="px-lg py-base align-top text-sm text-text-primary" style={{ maxWidth: 380 }}>
                              <Truncate>{revision.changeDescription}</Truncate>
                            </td>
                            <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">{revision.revisionDate}</td>
                            <td className="px-lg py-base align-top text-sm text-text-primary">
                              {revision.document
                                ? <span className="inline-flex items-center gap-xs"><FileText size={14} aria-hidden />{revision.document}</span>
                                : <span className="text-text-muted">—</span>}
                            </td>
                            <td className="px-lg py-base align-top" onClick={(e) => e.stopPropagation()}>
                              <ActionsMenu
                                ariaLabel={`Actions for ${approval?.number ?? 'approval'} revision ${revision.revision}`}
                                items={[
                                  { label: 'Edit revision', icon: <Pencil size={16} />, onSelect: () => setDrawer({ revision }) },
                                  { label: 'Delete revision', icon: <Trash2 size={16} />, onSelect: () => setDeleting(row), tone: 'danger' },
                                ]}
                              />
                            </td>
                          </tr>
                        )
                      })}
                </tbody>
              </table>
            </div>
            {!loading && (
              <AutoLoadFooter total={rows.length} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="revisions" />
            )}
          </div>
        )}
      </div>

      {drawer && (
        <ApprovalRevisionDrawer
          key={drawer.revision?.id ?? 'new'}
          initial={drawer.revision}
          onClose={() => setDrawer(null)}
          onSaved={setToast}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete this revision?"
        description={deleting
          ? `Revision ${deleting.revision.revision} of ${deleting.approval?.number ?? 'this approval'} will be permanently removed from the certificate's history. This can't be undone.`
          : ''}
        confirmLabel="Delete revision"
        tone="danger"
        onConfirm={() => {
          if (deleting) {
            removeRevision(deleting.revision.id)
            setToast(`${deleting.approval?.number ?? 'Approval'} revision ${deleting.revision.revision} deleted.`)
          }
          setDeleting(null)
        }}
        onCancel={() => setDeleting(null)}
      />
    </AppShell>
  )
}
