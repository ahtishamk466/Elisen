import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FolderTree, Plus, Search } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGcpStore } from '@/stores/gcpStore'
import type { RegulationGroup, RegulationGroupSection } from '@/types/gcp'
import { GcpRegulationsTabs } from './GcpRegulationsTabs'
import { RegulationGroupDrawer } from './RegulationGroupDrawer'
import { RegulationGroupSectionDrawer } from './RegulationGroupSectionDrawer'
import { RegulationGroupRail } from './RegulationGroupRail'
import { RegulationGroupRegulationsPanel } from './RegulationGroupRegulationsPanel'
import { useGcpData } from './GcpDataGate'
import { WalkthroughButton } from './WalkthroughButton'

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
  // The section picker reads the regulations; start their load.
  useGcpData()
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

  const selectedRules = selected ? rulesOf(selected.id) : []

  return (
    <AppShell
      activeItem="GCP"
      activeChild="Regulatory Library"
      title="Regulatory Library"
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
          <WalkthroughButton to="/gcp/regulations/walkthrough" />
          <Button size="md" leadingIcon={<Plus size={16} />} onClick={() => setGroupDrawer({ mode: 'create' })}>
            Add Group
          </Button>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-lg">
        <GcpRegulationsTabs active="Regulation Groups" counts={{ 'Regulation Groups': filtered.length }} />

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
                : <Button leadingIcon={<Plus size={16} />} onClick={() => setGroupDrawer({ mode: 'create' })}>Add Group</Button>}
            />
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 gap-lg laptop:grid-cols-[320px_minmax(0,1fr)]">
            <RegulationGroupRail groups={filtered} selectedId={selected?.id} count={(id) => rulesOf(id).length}
              onSelect={select} onEdit={(group) => setGroupDrawer({ mode: 'edit', group })} onDelete={setDeletingGroup} />
            {selected && <RegulationGroupRegulationsPanel group={selected} rules={selectedRules}
              onEditRules={() => setRulesDrawer(selected.id)} onRemove={setDeletingRule} />}
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
