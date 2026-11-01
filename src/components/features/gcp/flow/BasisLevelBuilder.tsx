import { FrozenTable } from '@/components/patterns/FrozenTable'
import { amendmentLabel } from '@/lib/gcpDisplay'
import { useEffect, useMemo, useState } from 'react'
import { BookMarked } from 'lucide-react'
import { EmptyState } from '@/components/patterns/EmptyState'
import { FormField } from '@/components/patterns/FormField'
import { Stat } from '@/components/patterns/Stat'
import { UrlField } from '@/components/patterns/UrlField'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useGcpStore } from '@/stores/gcpStore'
import { LATEST, levelsFor, partsIn, pickForLevel } from '@/lib/certBasisLevel'
import type { CertBasis } from '@/types/gcp'
import type { BasisDraft } from './FlowStepBasis'

/** Section → regulation id, or '' to leave the rule out. Only rules whose
    choice differs from the level's own pick are stored. */
type Overrides = Record<string, string>

/**
 * Step 2's "Build from amendment level" mode — Harris's own process (GCP
 * walkthrough, 2026-09-09): read the Part and amendment level off the
 * aircraft's TCDS, and each rule applies at its latest amendment at or below
 * that level. The level picks one version of every rule; a row's Applies
 * dropdown overrides it for a TCDS exception, or leaves the rule out.
 */
export function BasisLevelBuilder({ projectNumber, existing, onDraft }: {
  projectNumber: string
  existing?: CertBasis
  onDraft: (draft: BasisDraft | null) => void
}) {
  const regulations = useGcpStore((s) => s.regulations)
  const parts = useMemo(() => partsIn(regulations), [regulations])

  const [part, setPart] = useState(existing?.level?.part ?? parts[0]?.part ?? '')
  const levels = useMemo(() => levelsFor(regulations, part), [regulations, part])
  const [level, setLevel] = useState(existing?.level?.amdt ?? levels[0] ?? LATEST)
  const [name, setName] = useState(existing?.aircraftModel ?? '')
  const [tcdsNumber, setTcdsNumber] = useState(existing?.tcdsNumber ?? '')
  const [tcdsUrl, setTcdsUrl] = useState(existing?.tcdsUrl ?? '')
  const [statement, setStatement] = useState(existing?.basisStatement ?? '')

  const picks = useMemo(() => pickForLevel(regulations, part, level), [regulations, part, level])
  const [overrides, setOverrides] = useState<Overrides>(() => {
    if (!existing?.level) return {}
    const kept = new Set(existing.regulationIds)
    return Object.fromEntries(picks.flatMap((p) => {
      const mine = p.versions.find((v) => kept.has(v.id))?.id ?? ''
      return mine === (p.chosen?.id ?? '') ? [] : [[p.section, mine]]
    }))
  })

  const changePart = (next: string) => {
    setPart(next)
    setLevel(levelsFor(regulations, next)[0] ?? LATEST)
    setOverrides({})
  }

  const applied = (section: string, chosenId: string | undefined) =>
    section in overrides ? overrides[section] : chosenId ?? ''
  const regulationIds = useMemo(
    () => picks.map((p) => (p.section in overrides ? overrides[p.section] : p.chosen?.id ?? '')).filter(Boolean),
    [picks, overrides],
  )
  const overrideCount = picks.filter((p) => p.section in overrides && overrides[p.section] !== (p.chosen?.id ?? '')).length
  const notAtLevel = picks.filter((p) => !p.chosen && !(p.section in overrides)).length

  useEffect(() => {
    onDraft(regulationIds.length > 0 ? {
      kind: 'save',
      regulationIds,
      fields: {
        level: { part, amdt: level },
        aircraftModel: name.trim() || projectNumber,
        tcdsNumber: tcdsNumber.trim(),
        tcdsUrl: tcdsUrl.trim(),
        basisStatement: statement.trim(),
      },
    } : null)
  }, [regulationIds, part, level, name, tcdsNumber, tcdsUrl, statement, projectNumber, onDraft])

  if (parts.length === 0) {
    return (
      <div className="rounded-sm border border-border-default bg-neutral-25">
        <EmptyState icon={<BookMarked size={48} strokeWidth={1.5} />} title="No Part-numbered rules yet"
          description="Add regulations with a section root like 25.0001, or pick rules by hand." />
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <div className="grid items-start gap-base px-lg py-lg tablet:grid-cols-2 laptop:grid-cols-3">
        <FormField label="Part" htmlFor="basis-part" fullWidth>
          <SearchableSelect id="basis-part" value={part} onChange={changePart} placeholder="Select a Part…"
            options={parts.map((p) => ({ value: p.part, label: `Part ${p.part}`, hint: `${p.sections} rules in the pool` }))} />
        </FormField>
        <FormField label="Amendment level" htmlFor="basis-level" fullWidth help="The level on the TCDS, or Latest for a new or novel change.">
          <SearchableSelect id="basis-level" value={level} onChange={setLevel} placeholder="Select a level…"
            options={[{ value: LATEST, label: 'Latest', hint: 'Newest version of every rule' }, ...levels.map((a) => ({ value: a, label: a }))]} />
        </FormField>
        <FormField label="Basis name" htmlFor="basis-name" fullWidth>
          <Input id="basis-name" value={name} placeholder={projectNumber} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Type Certificate Data Sheet (TCDS) number" htmlFor="basis-tcds-number" fullWidth>
          <Input id="basis-tcds-number" value={tcdsNumber} placeholder="e.g. A-177" onChange={(e) => setTcdsNumber(e.target.value)} />
        </FormField>
        <FormField label="TCDS link" htmlFor="basis-tcds-url" fullWidth>
          <UrlField id="basis-tcds-url" value={tcdsUrl} onChange={setTcdsUrl} placeholder="Link to the TCDS document..." />
        </FormField>
        <FormField label="Basis as written on the TCDS" htmlFor="basis-statement" fullWidth>
          <Input id="basis-statement" value={statement} placeholder="e.g. Part 25, Amdt 25-1 to 25-98, plus 25.2 at 25-72"
            onChange={(e) => setStatement(e.target.value)} />
        </FormField>
      </div>

      <dl className="grid grid-cols-2 gap-base border-t border-border-default bg-neutral-50 px-lg py-base tablet:grid-cols-4">
        <Stat dl label="Rules in basis">{regulationIds.length}</Stat>
        <Stat dl label="Versions per rule">One each</Stat>
        <Stat dl label="Overridden">{overrideCount}</Stat>
        <Stat dl label="Not at this level">{notAtLevel}</Stat>
      </dl>

      <div className=" border-t border-border-default">
        <FrozenTable columns={['14%', '30%', '20%', '18%', '18%']} minWidth={760}
              columnLabels={['Section', 'Title', 'Versions in pool', 'Applies', 'Why']} caption={<>Which amendment of each Part {part} rule applies at level {level}</>}
              tableClassName="w-full table-fixed border-collapse text-left" header={<thead>
            <tr className="border-b border-border-default bg-neutral-50">
              {['Section', 'Title', 'Versions in pool', 'Applies', 'Why'].map((h) => (
                <th key={h} scope="col" className="px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
              ))}
            </tr>
          </thead>}>

          <tbody>
            {picks.map((p) => {
              const value = applied(p.section, p.chosen?.id)
              const shown = p.versions.find((v) => v.id === value) ?? p.chosen ?? p.versions[0]
              const why = p.section in overrides && value !== (p.chosen?.id ?? '')
                ? (value ? <Badge tone="info">Override</Badge> : <Badge>Left out</Badge>)
                : p.chosen ? <Badge>Amendment level</Badge> : <Badge tone="warning">Not at this level</Badge>
              return (
                <tr key={p.section} className="border-b border-border-default last:border-b-0">
                  <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{p.section}</td>
                  <td className="truncate px-lg py-base text-sm text-text-primary" title={shown.title}>{shown.title}</td>
                  <td className="truncate px-lg py-base text-sm text-text-muted">{p.versions.map((v) => amendmentLabel(v.amdt)).join(', ')}</td>
                  <td className="px-lg py-sm">
                    <SearchableSelect id={`applies-${p.section}`} size="sm" value={value} ariaLabel={`Amendment of ${p.section} that applies`}
                      onChange={(v) => setOverrides((o) => ({ ...o, [p.section]: v }))}
                      options={[...p.versions.map((v) => ({ value: v.id, label: amendmentLabel(v.amdt) })), { value: '', label: 'Leave out' }]} />
                  </td>
                  <td className="px-lg py-base">{why}</td>
                </tr>
              )
            })}
          </tbody>
        </FrozenTable>
      </div>
    </div>
  )
}
