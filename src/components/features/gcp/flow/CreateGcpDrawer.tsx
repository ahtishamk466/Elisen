import { useMemo, useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormField } from '@/components/patterns/FormField'
import { FormSection } from '@/components/patterns/FormSection'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useTccaStore } from '@/stores/tccaStore'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { amendmentLabel } from '@/lib/gcpDisplay'
import { focOptionsForRule } from '@/lib/focOptions'
import type { PlanEntry } from '@/types/gcp'

export interface CreateGcpDrawerProps {
  onClose: () => void
  /** Called once the GCP is set up: the project it was created for, and its
      rule's index among that project's affected rules, for step 4. */
  onCreated: (projectId: string, planIndex: number) => void
}

/**
 * Create GCP — step 1's header CTA, a quick-pick alternative to scanning the
 * project table for the same row-click entry point.
 *
 * One specific regulation, not a multi-pick basis-builder like
 * `FlowStepBasis` — client instruction, 2026-09-24: Create GCP sets up a
 * project's basis, plan and first GCP data item all in one pass, for one
 * named rule, matching the legacy `gcp/create` screen's own fields (Section
 * and Amdt are their own dropdowns there too, not one merged field).
 *
 * Mounted only while open, so every opening starts from a blank form.
 */
export function CreateGcpDrawer({ onClose, onCreated }: CreateGcpDrawerProps) {
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const regulations = useGcpStore((s) => s.regulations)
  const disciplines = useGcpStore((s) => s.disciplines)
  const mocs = useGcpStore((s) => s.mocs)
  const focs = useGcpStore((s) => s.focs)
  const delegations = useGcpStore((s) => s.delegations)
  const bases = useGcpFlowStore((s) => s.bases)
  const projectBasis = useGcpFlowStore((s) => s.projectBasis)
  const planEntries = useGcpFlowStore((s) => s.planEntries)
  const saveBasis = useGcpFlowStore((s) => s.saveBasis)
  const linkBasis = useGcpFlowStore((s) => s.linkBasis)
  const initializePlan = useGcpFlowStore((s) => s.initializePlan)
  const addItem = useGcpFlowStore((s) => s.addItem)

  const [createProjectId, setCreateProjectId] = useState('')
  const [createSection, setCreateSection] = useState('')
  const [createRegulationId, setCreateRegulationId] = useState('')
  const [createDao, setCreateDao] = useState('')
  const [createMoc, setCreateMoc] = useState('')
  const [createFoc, setCreateFoc] = useState('')
  const [createDeliverable, setCreateDeliverable] = useState('')

  const createSectionOptions = useMemo(() => [...new Set(regulations.map((r) => r.section))].sort(), [regulations])
  const createVersionOptions = useMemo(() => regulations.filter((r) => r.section === createSection), [regulations, createSection])
  const createRegulation = regulations.find((r) => r.section === createSection && r.id === createRegulationId)
  const createFocOptions = focOptionsForRule(focs, delegations, createRegulation?.sectionRoot)
  const handleCreateSectionChange = (next: string) => {
    setCreateSection(next)
    setCreateRegulationId('') // Always require an explicit version choice, including blank amendments.
    setCreateFoc('')
  }
  const handleCreateRegulationChange = (id: string) => {
    setCreateRegulationId(id)
    const rule = regulations.find((r) => r.section === createSection && r.id === id)
    if (!focOptionsForRule(focs, delegations, rule?.sectionRoot).some((option) => option.value === createFoc)) setCreateFoc('')
  }

  /* Sets up a project's basis (attaches this one regulation, creating the
     basis if the project has none yet), its plan entry (marked affected),
     and — if any of the four fields were filled in — its first GCP data
     item, then jumps straight to step 4 on that exact rule. Every other
     entry the project already had (from a previous pass through the flow)
     is preserved untouched. */
  const handleCreateGcp = () => {
    const targetProject = tccaProjects.find((t) => t.id === createProjectId)
    const regulation = regulations.find((r) => r.section === createSection && r.id === createRegulationId)
    if (!targetProject || !regulation) return

    const existingBasis = bases.find((b) => b.id === projectBasis[targetProject.id])
    if (!existingBasis?.regulationIds.includes(regulation.id)) {
      /* Adding the rule changes the basis: keep the rest of it, and copy a
         basis other projects share instead of changing it under them, as step
         2 does. The copy takes this project's number and leaves the source PDF
         with the original, which revokes its URL when deleted. */
      const shared = !!existingBasis && Object.entries(projectBasis).some(([pid, bid]) => bid === existingBasis.id && pid !== targetProject.id)
      const basisId = existingBasis && !shared ? existingBasis.id : crypto.randomUUID()
      saveBasis({
        ...existingBasis,
        id: basisId,
        aircraftModel: existingBasis && !shared ? existingBasis.aircraftModel : targetProject.number,
        tcdsNumber: existingBasis?.tcdsNumber ?? '',
        sourceDocument: shared ? undefined : existingBasis?.sourceDocument,
        regulationIds: [...(existingBasis?.regulationIds ?? []), regulation.id],
      })
      linkBasis(targetProject.id, basisId)
    }

    const otherEntries = planEntries.filter((e) => e.projectId === targetProject.id && e.regulationId !== regulation.id)
    const existingEntry = planEntries.find((e) => e.projectId === targetProject.id && e.regulationId === regulation.id)
    const entryId = existingEntry?.id ?? crypto.randomUUID()
    const entry: PlanEntry = existingEntry
      ? { ...existingEntry, affected: true }
      : { id: entryId, projectId: targetProject.id, regulationId: regulation.id, affected: true, methodText: regulation.defaultMocText, comments: '', ddsType: '', ddsText: '', complete: false }
    initializePlan(targetProject.id, [...otherEntries, entry])

    if (createDao || createMoc || createFoc || createDeliverable) {
      addItem({ id: crypto.randomUUID(), planEntryId: entryId, daoSpecialtyCode: createDao, mocCode: createMoc, focCode: createFoc, deliverableId: createDeliverable, active: true })
    }

    onCreated(targetProject.id, otherEntries.filter((e) => e.affected).length)
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Create GCP"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={!createProjectId || !createSection || !createRegulationId} onClick={handleCreateGcp}>
            Create
          </Button>
        </>
      }
    >
      <FormSection title="Project and Regulation" requirement="required">
        <FormField label="TCCA Project" htmlFor="create-gcp-project" required>
          <SearchableSelect
            id="create-gcp-project"
            value={createProjectId}
            onChange={setCreateProjectId}
            placeholder="Select a TCCA project…"
            options={tccaProjects.map((t) => ({ value: t.id, label: t.number, hint: t.description }))}
          />
        </FormField>
        {/* Regulation Section and Amdt are their own dropdowns, not one
            merged field the way the legacy screen shows them — client
            instruction, 2026-09-24. Single-pick, not `FlowStepBasis`'s
            multi-select: Create GCP sets up one named rule, not a whole
            basis at once. */}
        <FormField label="Regulation Section" htmlFor="create-gcp-section" required>
          <SearchableSelect
            id="create-gcp-section"
            value={createSection}
            onChange={handleCreateSectionChange}
            placeholder="Select regulation section…"
            options={createSectionOptions.map((s) => ({ value: s, label: s }))}
          />
        </FormField>
        <FormField label="Regulation Amendment" htmlFor="create-gcp-amdt" required>
          <SearchableSelect
            id="create-gcp-amdt"
            value={createRegulationId}
            onChange={handleCreateRegulationChange}
            placeholder={createSection ? 'Select regulation amendment…' : 'Select a section first'}
            disabled={!createSection}
            options={createVersionOptions.map((r) => ({ value: r.id, label: amendmentLabel(r.amdt), hint: r.title }))}
          />
        </FormField>
      </FormSection>
      <FormSection title="GCP Data" requirement="optional">
        <FormField label="Design Approval Organization (DAO) Specialty Code" htmlFor="create-gcp-dao"
          help="The discipline doing the work.">
          <SearchableSelect
            id="create-gcp-dao"
            value={createDao}
            onChange={setCreateDao}
            placeholder="Select a DAO specialty code…"
            options={disciplines.filter((d) => d.active).map((d) => ({ value: d.daoSpecialtyCode, label: `${d.daoSpecialtyCode} -- ${d.elisenDiscipline}` }))}
          />
        </FormField>
        <FormField label="Means of Compliance (MOC)" htmlFor="create-gcp-moc"
          help="How this rule will be shown.">
          <SearchableSelect
            id="create-gcp-moc"
            value={createMoc}
            onChange={setCreateMoc}
            placeholder="Select a means of compliance code…"
            options={mocs.map((m) => ({ value: m.code, label: `${m.code} -- ${m.description}` }))}
          />
        </FormField>
        <FormField label="Finding of Compliance (FOC)" htmlFor="create-gcp-foc"
          help="Who signs that the design meets this rule.">
          <SearchableSelect
            id="create-gcp-foc"
            value={createFoc}
            onChange={setCreateFoc}
            placeholder={createRegulation ? 'Select a finding of compliance code…' : 'Select an amendment first'}
            disabled={!createRegulation}
            options={createFocOptions}
          />
        </FormField>
        {/* Free text, not a dropdown: unlike Section/Amdt/DAO/MOC/FOC, no
            deliverable-number master list exists yet anywhere in the app
            to pick from (flagged rather than guessed at a source). */}
        <FormField label="Deliverable Number" htmlFor="create-gcp-deliverable">
          <Input id="create-gcp-deliverable" value={createDeliverable} placeholder="e.g. A4ALL-2-08-1-1623-CR"
            onChange={(e) => setCreateDeliverable(e.target.value)} />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
