import { useEffect, useMemo, useState } from 'react'
import { BookMarked } from 'lucide-react'
import { EmptyState } from '@/components/patterns/EmptyState'
import { FormField } from '@/components/patterns/FormField'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { useGcpStore } from '@/stores/gcpStore'
import type { CertBasis } from '@/types/gcp'
import type { BasisDraft } from './FlowStepBasis'

/**
 * Step 2's "Pick rules by hand" mode — the original Certification Basis step,
 * moved here unchanged when the step gained its amendment-level builder.
 *
 * A regulation only counts as a real, attachable match once *both* a section
 * and an amdt are picked — a section alone names a whole family of
 * regulations at different amendments, not one to attach, so it renders as a
 * pending row (Amdt: "Not selected yet") instead of quietly attaching every
 * amendment under it (client instruction, 2026-09-24).
 *
 * The two `MultiSelect`s cascade (client instruction, 2026-09-24): Section
 * narrows Amdt's own options, and picking an Amdt first auto-fills its parent
 * section(s) into an empty Section, once.
 */
export function BasisHandPicker({ projectNumber, existing, onDraft }: {
  projectNumber: string
  existing?: CertBasis
  onDraft: (draft: BasisDraft | null) => void
}) {
  const regulations = useGcpStore((s) => s.regulations)

  const existingRegs = useMemo(
    () => (existing?.regulationIds ?? []).map((id) => regulations.find((r) => r.id === id)).filter((r): r is NonNullable<typeof r> => !!r),
    [existing, regulations],
  )
  const [sections, setSections] = useState<string[]>(() => [...new Set(existingRegs.map((r) => r.section))])
  const [amdts, setAmdts] = useState<string[]>(() => [...new Set(existingRegs.map((r) => r.amdt))])

  const sectionOptions = useMemo(() => [...new Set(regulations.map((r) => r.section))].sort(), [regulations])
  const amdtOptions = useMemo(() => {
    const pool = sections.length === 0 ? regulations : regulations.filter((r) => sections.includes(r.section))
    return [...new Set(pool.map((r) => r.amdt))].sort()
  }, [regulations, sections])

  const handleSectionsChange = (next: string[]) => {
    setSections(next)
    /* Dropping a section can strand an amdt that only belonged to it — prune
       rather than leave a selection the narrowed dropdown no longer offers. */
    if (next.length > 0) {
      const stillValid = new Set(regulations.filter((r) => next.includes(r.section)).map((r) => r.amdt))
      setAmdts((prev) => prev.filter((a) => stillValid.has(a)))
    }
  }

  const handleAmdtsChange = (next: string[]) => {
    if (sections.length === 0 && next.length > 0) {
      setSections([...new Set(regulations.filter((r) => next.includes(r.amdt)).map((r) => r.section))])
    }
    setAmdts(next)
  }

  const matched = useMemo(
    () => (sections.length > 0 && amdts.length > 0
      ? regulations.filter((r) => sections.includes(r.section) && amdts.includes(r.amdt))
      : []),
    [regulations, sections, amdts],
  )
  const pendingSections = amdts.length === 0 ? sections : []

  useEffect(() => {
    onDraft(matched.length > 0
      ? { kind: 'save', regulationIds: matched.map((r) => r.id), fields: { level: undefined } }
      : null)
  }, [matched, onDraft])

  return (
    <div className="flex flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <div className="grid items-start gap-base px-lg py-lg tablet:grid-cols-2">
        <FormField label="Regulation Section" htmlFor="flow-section" fullWidth>
          <MultiSelect id="flow-section" value={sections} onChange={handleSectionsChange}
            placeholder="Select regulation section…" emptyLabel="No sections in the rule pool yet."
            options={sectionOptions.map((s) => ({ value: s, label: s }))} />
        </FormField>
        <FormField label="Regulation Amendment" htmlFor="flow-amdt" fullWidth>
          <MultiSelect id="flow-amdt" value={amdts} onChange={handleAmdtsChange}
            placeholder="Select regulation amendment…" emptyLabel="No amendments in the rule pool yet."
            options={amdtOptions.map((a) => ({ value: a, label: a }))} />
        </FormField>
      </div>

      {matched.length === 0 && pendingSections.length === 0 ? (
        <div className="border-t border-border-default">
          <EmptyState icon={<BookMarked size={48} strokeWidth={1.5} />} title="No regulations match yet"
            description="Pick at least a section or an amendment above to scope this basis." />
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-border-default">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Regulations this basis will attach to {projectNumber}</caption>
            <thead>
              <tr className="border-b border-border-default bg-neutral-50">
                {['Regulation Section', 'Regulation Amendment'].map((h) => (
                  <th key={h} scope="col" className="px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingSections.map((s) => (
                <tr key={s} className="border-b border-border-default last:border-b-0">
                  <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{s}</td>
                  <td className="whitespace-nowrap px-lg py-base text-sm text-text-muted">Not selected yet</td>
                </tr>
              ))}
              {matched.map((r) => (
                <tr key={r.id} className="border-b border-border-default last:border-b-0">
                  <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{r.section}</td>
                  <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{r.amdt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
