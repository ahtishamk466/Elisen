import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layers, Plus, Search } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGcpStore } from '@/stores/gcpStore'
import { titleCaseName } from '@/lib/gcpDisplay'
import { selectedRegulationTopic, subsectionsForSubpart } from '@/lib/regulationStructure'
import type { Subpart, Subsection } from '@/types/gcp'
import { GcpRegulationsTabs } from './GcpRegulationsTabs'
import { SubpartDrawer } from './SubpartDrawer'
import { SubsectionDrawer } from './SubsectionDrawer'
import { GcpDataGate } from './GcpDataGate'
import { RegulationSubpartRail } from './RegulationSubpartRail'
import { RegulationSubsectionsPanel } from './RegulationSubsectionsPanel'
import { RegulationTopicPanel } from './RegulationTopicPanel'
import { WalkthroughButton } from './WalkthroughButton'

/** Browse existing Subpart → topic → exact regulation/amendment records.
 * Prefix-based topic suggestions also include saved cross-topic classifications. */
export function RegulationStructurePage() {
  const subparts = useGcpStore((s) => s.subparts)
  const subsections = useGcpStore((s) => s.subsections)
  const regulations = useGcpStore((s) => s.regulations)
  const addSubpart = useGcpStore((s) => s.addSubpart)
  const updateSubpart = useGcpStore((s) => s.updateSubpart)
  const removeSubpart = useGcpStore((s) => s.removeSubpart)
  const addSubsection = useGcpStore((s) => s.addSubsection)
  const updateSubsection = useGcpStore((s) => s.updateSubsection)
  const removeSubsection = useGcpStore((s) => s.removeSubsection)

  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [subpartsCollapsed, setSubpartsCollapsed] = useState(false)
  const [createdTopics, setCreatedTopics] = useState<{ subpart: string; subsection: string }[]>([])
  const [subpartDrawer, setSubpartDrawer] = useState<{ mode: 'create' | 'edit'; subpart?: Subpart } | null>(null)
  const [subsectionDrawer, setSubsectionDrawer] = useState<{ mode: 'create' | 'edit'; subsection?: Subsection } | null>(null)
  const [deletingSubpart, setDeletingSubpart] = useState<Subpart | null>(null)
  const [deletingSubsection, setDeletingSubsection] = useState<Subsection | null>(null)

  const subsectionsOf = (code: string) => {
    const codes = new Set(subsectionsForSubpart(code, subsections, regulations).map((s) => s.code))
    createdTopics.filter((pair) => pair.subpart === code).forEach((pair) => codes.add(pair.subsection))
    return subsections.filter((s) => codes.has(s.code))
  }
  const rulesUnderSubpart = (code: string) => regulations.filter((r) => r.subpartCode === code).length
  const rulesUnderSubsection = (code: string) => regulations.filter((r) => r.subsectionCode === code).length

  /** Search spans a subpart's own text *and* the subsections nested under it,
      so a subsection code or title finds the subpart that carries it. */
  const q = query.trim().toLowerCase()
  const filtered = q
    ? subparts.filter((sp) =>
        `${sp.code} ${sp.description}`.toLowerCase().includes(q)
        || subsectionsOf(sp.code).some((ss) => `${ss.code} ${ss.title}`.toLowerCase().includes(q)))
    : subparts

  /* Selection lives in the URL (?subpart=…) so a subpart is linkable. */
  const urlCode = searchParams.get('subpart')
  const selected = filtered.find((sp) => sp.code === urlCode) ?? filtered.find((sp) => sp.active) ?? filtered[0] ?? null
  const select = (sp: Subpart) => {
    const p = new URLSearchParams(searchParams)
    p.set('subpart', sp.code)
    p.delete('subsection')
    setSearchParams(p, { replace: true })
  }

  const selectedSubsections = selected ? subsectionsOf(selected.code) : []
  const selectedTopic = selectedRegulationTopic(selected?.code, urlCode, searchParams.get('subsection'), subsections)
  const lastTopicRef = useRef<string | null>(null)
  const openTopic = (ss: Subsection) => {
    const p = new URLSearchParams(searchParams)
    p.set('subpart', selected!.code)
    p.set('subsection', ss.code)
    setSearchParams(p)
  }
  const closeTopic = () => {
    const p = new URLSearchParams(searchParams)
    p.delete('subsection')
    setSearchParams(p)
  }
  useEffect(() => {
    if (selectedTopic) lastTopicRef.current = selectedTopic.code
    else if (lastTopicRef.current) {
      document.getElementById(`reg-topic-${lastTopicRef.current}`)?.focus()
      lastTopicRef.current = null
    }
  }, [selectedTopic])

  const deletingSubpartUse = deletingSubpart
    ? rulesUnderSubpart(deletingSubpart.code) + subsectionsOf(deletingSubpart.code).length
    : 0
  const deletingSubsectionUse = deletingSubsection ? rulesUnderSubsection(deletingSubsection.code) : 0

  return (
    <AppShell
      activeItem="General Certification"
      activeChild="Regulatory Library"
      title="Regulatory Library"
      description="The rule library shared by every certification basis."
      fill
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 320 }}>
            <label htmlFor="struct-search" className="sr-only">Search subparts and subsections</label>
            <Input id="struct-search" size="sm" leadingIcon={<Search size={16} />}
              placeholder="Search by subpart or subsection..."
              value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <WalkthroughButton to="/gcp/regulations/walkthrough" />
          <Button size="md" leadingIcon={<Plus size={16} />} onClick={() => setSubpartDrawer({ mode: 'create' })}>
            Add Subpart
          </Button>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-lg">
        <GcpRegulationsTabs active="Certification Topics" />

        <GcpDataGate>
        {filtered.length === 0 ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<Layers size={48} strokeWidth={1.5} />}
              title={query ? 'No subparts match your search' : 'No subparts yet'}
              description={query
                ? 'Try a subpart code, or a nested subsection code or title.'
                : 'Add the FAA subparts the rules are grouped under.'}
              action={query
                ? <Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>
                : <Button leadingIcon={<Plus size={16} />} onClick={() => setSubpartDrawer({ mode: 'create' })}>Add Subpart</Button>}
            />
          </div>
        ) : (
          <div className={`grid min-h-0 flex-1 gap-sm ${subpartsCollapsed ? 'grid-cols-[64px_minmax(0,1fr)]' : 'laptop:grid-cols-[280px_minmax(0,1fr)]'}`}>
            {/* ------- The subpart rail — the parent level ------- */}
            <RegulationSubpartRail subparts={filtered} selectedCode={selected?.code}
              count={(code) => subsectionsOf(code).length} onSelect={select}
              collapsed={subpartsCollapsed} onToggle={() => setSubpartsCollapsed((value) => !value)}
              onEdit={(sp) => setSubpartDrawer({ mode: 'edit', subpart: sp })} onDelete={setDeletingSubpart} />

            {/* ------- The selected subpart's subsections — the child level ------- */}
            {selected && (
              <section aria-label={`Subpart ${selected.code}`} className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
                {selectedTopic ? (
                  <RegulationTopicPanel key={`${selected.code}-${selectedTopic.code}`} subpart={selected} subsection={selectedTopic} onBack={closeTopic} />
                ) : (
                  <RegulationSubsectionsPanel subpart={selected} subsections={selectedSubsections} regulations={regulations}
                    onOpen={openTopic} onAdd={() => setSubsectionDrawer({ mode: 'create' })}
                    onEdit={(ss) => setSubsectionDrawer({ mode: 'edit', subsection: ss })} onDelete={setDeletingSubsection} />
                )}
              </section>
            )}
          </div>
        )}
        </GcpDataGate>
      </div>

      {subpartDrawer && (
        <SubpartDrawer
          key={subpartDrawer.subpart?.id ?? 'new'}
          mode={subpartDrawer.mode}
          initial={subpartDrawer.subpart}
          onClose={() => setSubpartDrawer(null)}
          onSubmit={(sp) => {
            if (subpartDrawer.mode === 'edit') updateSubpart(sp.id, sp)
            else { addSubpart(sp); select(sp) }
          }}
        />
      )}
      {subsectionDrawer && (
        <SubsectionDrawer
          key={subsectionDrawer.subsection?.id ?? 'new'}
          mode={subsectionDrawer.mode}
          initial={subsectionDrawer.subsection}
          codePrefix={selected?.code}
          onClose={() => setSubsectionDrawer(null)}
          onSubmit={(ss) => {
            if (subsectionDrawer.mode === 'edit') updateSubsection(ss.id, ss)
            else {
              addSubsection(ss)
              if (selected) {
                setCreatedTopics((pairs) => [...pairs, { subpart: selected.code, subsection: ss.code }])
                openTopic(ss)
              }
            }
          }}
        />
      )}

      <ConfirmDialog
        open={!!deletingSubpart}
        title={deletingSubpartUse > 0 ? `Subpart ${deletingSubpart?.code} is in use` : `Delete subpart ${deletingSubpart?.code}?`}
        description={deletingSubpart
          ? deletingSubpartUse > 0
            ? `${subsectionsOf(deletingSubpart.code).length} subsection${subsectionsOf(deletingSubpart.code).length === 1 ? '' : 's'} and ${rulesUnderSubpart(deletingSubpart.code)} regulation${rulesUnderSubpart(deletingSubpart.code) === 1 ? '' : 's'} are filed under ${deletingSubpart.code}. Retiring it keeps them intact and takes the subpart out of the pickers.`
            : `"${deletingSubpart.code}: ${titleCaseName(deletingSubpart.description)}" will be permanently removed. This cannot be undone.`
          : ''}
        confirmLabel={deletingSubpartUse > 0 ? 'Retire it instead' : 'Delete subpart'}
        tone={deletingSubpartUse > 0 ? 'primary' : 'danger'}
        onConfirm={() => {
          if (!deletingSubpart) return
          if (deletingSubpartUse > 0) updateSubpart(deletingSubpart.id, { active: false })
          else removeSubpart(deletingSubpart.id)
          setDeletingSubpart(null)
        }}
        onCancel={() => setDeletingSubpart(null)}
      />
      <ConfirmDialog
        open={!!deletingSubsection}
        title={deletingSubsectionUse > 0 ? `Subsection ${deletingSubsection?.code} is in use` : `Delete subsection ${deletingSubsection?.code}?`}
        description={deletingSubsection
          ? deletingSubsectionUse > 0
            ? `${deletingSubsectionUse} regulation${deletingSubsectionUse === 1 ? ' is' : 's are'} filed under ${deletingSubsection.code}. Retiring it keeps them intact and takes the code out of the pickers.`
            : `"${titleCaseName(deletingSubsection.title)}" will be permanently removed. This cannot be undone.`
          : ''}
        confirmLabel={deletingSubsectionUse > 0 ? 'Retire it instead' : 'Delete subsection'}
        tone={deletingSubsectionUse > 0 ? 'primary' : 'danger'}
        onConfirm={() => {
          if (!deletingSubsection) return
          if (deletingSubsectionUse > 0) updateSubsection(deletingSubsection.id, { active: false })
          else removeSubsection(deletingSubsection.id)
          setDeletingSubsection(null)
        }}
        onCancel={() => setDeletingSubsection(null)}
      />
    </AppShell>
  )
}
