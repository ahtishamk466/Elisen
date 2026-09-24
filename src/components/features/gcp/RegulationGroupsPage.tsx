import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FolderTree, ListTree, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { useSyncedScroll } from '@/components/patterns/useSyncedScroll'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGcpStore } from '@/stores/gcpStore'
import type { RegulationGroup, RegulationGroupSection } from '@/types/gcp'
import { GcpRegulationsTabs } from './GcpRegulationsTabs'
import { GcpChip } from './GcpChip'
import { RegulationGroupDrawer } from './RegulationGroupDrawer'
import { RegulationGroupSectionDrawer } from './RegulationGroupSectionDrawer'

const COLUMNS: { label: string; sort?: 'root' | 'active'; width: number }[] = [
  { label: 'Regulation Section Root', sort: 'root', width: 280 },
  { label: 'Active', sort: 'active', width: 120 },
  { label: 'Actions', width: 80 },
]

/**
 * GCP → Regulations → Groups, as a **master–detail**, the same shape as
 * Reference Data → ATA Chapters: every group on a rail at the left, the
 * selected group's regulations at the right.
 *
 * The two listings were separate screens in the legacy system, so "which rules
 * does the galley group carry?" meant filtering a second table by hand. Here
 * the group is the navigation, and a rule is attached from inside the group it
 * belongs to.
 */
export function RegulationGroupsPage() {
  const groups = useGcpStore((s) => s.groups)
  const groupSections = useGcpStore((s) => s.groupSections)
  const addGroup = useGcpStore((s) => s.addGroup)
  const updateGroup = useGcpStore((s) => s.updateGroup)
  const removeGroup = useGcpStore((s) => s.removeGroup)
  const setGroupSections = useGcpStore((s) => s.setGroupSections)
  const removeGroupSection = useGcpStore((s) => s.removeGroupSection)

  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [groupDrawer, setGroupDrawer] = useState<{ mode: 'create' | 'edit'; group?: RegulationGroup } | null>(null)
  const [rulesDrawer, setRulesDrawer] = useState<string | null>(null)
  const [deletingGroup, setDeletingGroup] = useState<RegulationGroup | null>(null)
  const [deletingRule, setDeletingRule] = useState<RegulationGroupSection | null>(null)
  const railRef = useRef<HTMLDivElement>(null)

  const rulesOf = (groupId: string) => groupSections.filter((s) => s.groupId === groupId)

  /** Search spans a group's own text *and* the rules under it, so a section
      root finds the group that carries it. */
  const q = query.trim().toLowerCase()
  const filtered = q
    ? groups.filter((g) =>
        `${g.title} ${g.description}`.toLowerCase().includes(q)
        || rulesOf(g.id).some((s) => s.sectionRoot.toLowerCase().includes(q)))
    : groups

  /* Selection lives in the URL (?group=…) so a group is linkable; when the
     search filters the selected one away, fall back to the first hit without
     rewriting the URL from under the user. */
  const urlId = searchParams.get('group')
  const selected = filtered.find((g) => g.id === urlId) ?? filtered.find((g) => g.active) ?? filtered[0] ?? null
  const select = (g: RegulationGroup) => {
    const p = new URLSearchParams(searchParams)
    p.set('group', g.id)
    setSearchParams(p, { replace: true })
  }

  useEffect(() => {
    railRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [selected?.id])

  const selectedRules = selected ? rulesOf(selected.id) : []
  const { sorted, sort, setSort } = useTableSort(selectedRules, {
    root: (s) => s.sectionRoot,
    active: (s) => s.active,
  })
  const { headerRef, onBodyScroll } = useSyncedScroll()

  return (
    <AppShell
      activeItem="GCP"
      activeChild="Regulations"
      title="Regulations"
      description="The rule library shared by every certification basis."
      fill
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 320 }}>
            <label htmlFor="rg-search" className="sr-only">Search groups and their regulations</label>
            <Input id="rg-search" size="sm" leadingIcon={<Search size={16} />}
              placeholder="Search by group or section root..."
              value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button size="md" leadingIcon={<Plus size={16} />} onClick={() => setGroupDrawer({ mode: 'create' })}>
            Add New Group
          </Button>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-lg">
        <GcpRegulationsTabs active="Groups" counts={{ Groups: filtered.length }} />

        {filtered.length === 0 ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<FolderTree size={48} strokeWidth={1.5} />}
              title={query ? 'No groups match your search' : 'No regulation groups yet'}
              description={query
                ? 'Try a group title, a description or a section root.'
                : 'Add a kind of modification, then attach the regulations it typically affects.'}
              action={query
                ? <Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>
                : <Button leadingIcon={<Plus size={16} />} onClick={() => setGroupDrawer({ mode: 'create' })}>Add New Group</Button>}
            />
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 gap-lg laptop:grid-cols-[320px_minmax(0,1fr)]">
            {/* ------- The group rail ------- */}
            <nav aria-label="Regulation groups" className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
              <div className="flex shrink-0 items-center gap-sm border-b border-border-default bg-neutral-50 px-base py-base">
                <span className="min-w-0 flex-1 text-xs font-semibold text-text-secondary">Group</span>
                <span className="shrink-0 text-xs font-semibold text-text-secondary">Regs</span>
              </div>
              <div ref={railRef} className="min-h-0 flex-1 overflow-y-auto">
                <ul>
                  {filtered.map((g) => {
                    const isSel = g.id === selected?.id
                    const count = rulesOf(g.id).length
                    return (
                      <li key={g.id} className="border-b border-border-default last:border-b-0">
                        <button
                          type="button"
                          onClick={() => select(g)}
                          aria-current={isSel ? 'true' : undefined}
                          className={`flex w-full items-center gap-sm border-l-2 px-base py-base text-left transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary
                            ${isSel ? 'border-accent bg-neutral-100' : 'border-transparent hover:bg-neutral-50'}`}
                        >
                          <span className="grid min-w-0 flex-1 gap-xxss">
                            <span className={`block truncate text-sm ${isSel ? 'font-semibold' : ''} ${g.active ? 'text-text-primary' : 'text-text-muted'}`}>
                              {g.title}
                            </span>
                            {/* What the group covers, under its name — the title
                                alone reads as a label, not a choice. */}
                            <span className="block truncate text-xs text-text-muted">{g.description}</span>
                            {!g.active && <span className="block text-xs text-text-muted">Inactive</span>}
                          </span>
                          <span aria-hidden className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full border border-border-default px-xs text-xs font-semibold tabular-nums text-text-secondary">
                            {count}
                          </span>
                          <span className="sr-only">
                            {g.title}, {count} regulation{count === 1 ? '' : 's'}{g.active ? '' : ', inactive'}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </nav>

            {/* ------- The selected group ------- */}
            {selected && (
              <section aria-label={selected.title} className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
                <header className="flex shrink-0 flex-wrap items-center gap-sm px-lg py-lg">
                  <div className="grid min-w-0 flex-1 gap-xxss">
                    <h2 className="truncate text-sm font-semibold text-text-primary">{selected.title}</h2>
                    <p className="text-xs text-text-muted">{selected.description}</p>
                  </div>
                  <Badge tone={selected.active ? 'success' : 'neutral'}>{selected.active ? 'Active' : 'Inactive'}</Badge>
                  <ActionsMenu
                    ariaLabel={`Actions for ${selected.title}`}
                    items={[
                      { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setGroupDrawer({ mode: 'edit', group: selected }) },
                      { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeletingGroup(selected), tone: 'danger' },
                    ]}
                  />
                </header>

                <div className="flex shrink-0 items-center justify-between gap-sm border-t border-border-default px-lg py-lg">
                  <div className="grid gap-xxss">
                    <h3 className="text-sm font-semibold text-text-primary">Regulation List</h3>
                    <p className="text-xs text-text-muted">The regulations this kind of modification typically affects.</p>
                  </div>
                  <Button size="sm" leadingIcon={<Plus size={14} />} onClick={() => setRulesDrawer(selected.id)}>
                    Add Regulation
                  </Button>
                </div>

                {selectedRules.length === 0 ? (
                  <div className="border-t border-border-default">
                    <EmptyState
                      icon={<ListTree size={48} strokeWidth={1.5} />}
                      title="No results found."
                      description="No regulations are attached to this group yet."
                    />
                  </div>
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col border-t border-border-default">
                    {/* Frozen header, own table, full width — a scrollbar
                        never runs alongside a table's header
                        (docs/COMPONENTS.md). */}
                    <div ref={headerRef} className="shrink-0 overflow-x-hidden overflow-y-scroll scrollbar-none">
                      <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: 480 }}>
                        <colgroup>
                          {COLUMNS.map((c) => <col key={c.label} style={{ width: c.width }} />)}
                          {/* Soaks up whatever's left past 480px on a wide
                              screen instead of leaving it as dead space
                              (client instruction, 2026-09-24) — the real
                              columns keep their own explicit widths either
                              way. */}
                          <col />
                        </colgroup>
                        <thead>
                          <tr className="border-b border-border-default bg-neutral-50">
                            {COLUMNS.map((c) => (
                              <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                                className="px-lg py-base text-sm font-semibold text-text-secondary">{c.label}</SortableTh>
                            ))}
                            <th aria-hidden />
                          </tr>
                        </thead>
                      </table>
                    </div>
                    <div className="min-h-0 flex-1 overflow-x-auto overflow-y-scroll scrollbar-none" onScroll={onBodyScroll}>
                    <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: 480 }}>
                      <caption className="sr-only">Regulations in {selected.title}</caption>
                      <colgroup>
                        {COLUMNS.map((c) => <col key={c.label} style={{ width: c.width }} />)}
                        <col />
                      </colgroup>
                      <tbody>
                        {sorted.map((s) => (
                          <tr key={s.id} className="border-b border-border-default last:border-b-0">
                            <td className="px-lg py-base"><GcpChip value={s.sectionRoot} label="section roots" /></td>
                            <td className="px-lg py-base">
                              <Badge tone={s.active ? 'success' : 'neutral'}>{s.active ? 'Active' : 'Inactive'}</Badge>
                            </td>
                            <td className="px-lg py-base">
                              <ActionsMenu
                                ariaLabel={`Actions for ${s.sectionRoot}`}
                                items={[
                                  { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setRulesDrawer(selected.id) },
                                  { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeletingRule(s), tone: 'danger' },
                                ]}
                              />
                            </td>
                            <td aria-hidden />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      {groupDrawer && (
        <RegulationGroupDrawer
          key={groupDrawer.group?.id ?? 'new'}
          mode={groupDrawer.mode}
          initial={groupDrawer.group}
          onClose={() => setGroupDrawer(null)}
          onSubmit={(g) => {
            if (groupDrawer.mode === 'edit') updateGroup(g.id, g)
            else { addGroup(g); select(g) }
          }}
        />
      )}
      {rulesDrawer && (
        <RegulationGroupSectionDrawer
          key={rulesDrawer}
          groupId={rulesDrawer}
          onClose={() => setRulesDrawer(null)}
          onSubmit={(groupId, roots) => setGroupSections(groupId, roots)}
        />
      )}

      <ConfirmDialog
        open={!!deletingGroup}
        title={`Delete ${deletingGroup?.title}?`}
        description={deletingGroup
          ? `"${deletingGroup.description}" will be permanently removed${rulesOf(deletingGroup.id).length > 0 ? `, along with the ${rulesOf(deletingGroup.id).length} regulation${rulesOf(deletingGroup.id).length === 1 ? '' : 's'} attached to it` : ''}. This cannot be undone.`
          : ''}
        confirmLabel="Delete group"
        tone="danger"
        onConfirm={() => { if (deletingGroup) removeGroup(deletingGroup.id); setDeletingGroup(null) }}
        onCancel={() => setDeletingGroup(null)}
      />
      <ConfirmDialog
        open={!!deletingRule}
        title={`Remove ${deletingRule?.sectionRoot} from ${selected?.title}?`}
        description="The regulation stays in the library; only its place in this group is removed."
        confirmLabel="Remove regulation"
        tone="danger"
        onConfirm={() => { if (deletingRule) removeGroupSection(deletingRule.id); setDeletingRule(null) }}
        onCancel={() => setDeletingRule(null)}
      />
    </AppShell>
  )
}
