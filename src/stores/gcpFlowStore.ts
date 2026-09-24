import { create } from 'zustand'
import type { CertBasis, GcpItem, PlanEntry } from '@/types/gcp'

/**
 * Demo seed only, so the Step 1 project table has something other than
 * em-dashes to show for Applicable / Affected / GCP Progress before anyone
 * has actually run Initialize on a project. Ids match two real TCCA projects
 * (`tp-60` "1568 -Top Aces 1623", `tp-64` "A-11-0007") and the ten fixture
 * regulations in `gcpFixtures.ts` — no client data invented, just wired up
 * early instead of waiting for a real Initialize pass.
 */
function seedPlanEntries(): PlanEntry[] {
  const forProject = (projectId: string, affectedCount: number, completeCount: number, total: number): PlanEntry[] =>
    Array.from({ length: total }, (_, i) => {
      const affected = i < affectedCount
      return {
        id: `seed-${projectId}-reg-${i + 1}`,
        projectId,
        regulationId: `reg-${i + 1}`,
        affected,
        methodText: '',
        comments: '',
        ddsType: '',
        ddsText: '',
        complete: affected && i < completeCount,
      }
    })
  return [
    ...forProject('tp-60', 5, 3, 8),
    ...forProject('tp-64', 6, 6, 6),
  ]
}

interface GcpFlowState {
  /** Every basis built so far. Empty until one is created or imported. */
  bases: CertBasis[]
  /** TCCA project id → basis id, the link the legacy "Associate" screen made. */
  projectBasis: Record<string, string>
  planEntries: PlanEntry[]
  items: GcpItem[]

  saveBasis: (basis: CertBasis) => void
  linkBasis: (projectId: string, basisId: string) => void

  /** Initialize: writes one entry per rule in the basis, affected or not. */
  initializePlan: (projectId: string, entries: PlanEntry[]) => void
  updatePlanEntry: (id: string, patch: Partial<PlanEntry>) => void

  addItem: (item: GcpItem) => void
  updateItem: (id: string, patch: Partial<GcpItem>) => void
  removeItem: (id: string) => void
}

/**
 * The two bases `projectBasis` below already points at — without these, the
 * Cert Basis page had nothing to show (its rail read `bases`, which was
 * empty) and `FlowStepBasis` read an empty `regulationIds` for both seeded
 * projects. Same regulation ids `seedPlanEntries` already uses for each
 * project, so the counts agree everywhere (8 for tp-60, 6 for tp-64).
 */
function seedBases(): CertBasis[] {
  const regIds = (n: number) => Array.from({ length: n }, (_, i) => `reg-${i + 1}`)
  return [
    { id: 'seed-basis-tp-60', aircraftModel: '1568 -Top Aces 1623', tcdsNumber: '', regulationIds: regIds(8) },
    { id: 'seed-basis-tp-64', aircraftModel: 'A-11-0007', tcdsNumber: '', regulationIds: regIds(6) },
  ]
}

/**
 * One demo `GcpItem` so the GCP Projects table's Discipline/MOC/FOC/
 * Deliverable # columns have something real to show for at least one row —
 * real fixture codes (`disc-2` "A1", `moc-2` "A", `foc-3` "AP-01" in
 * `gcpFixtures.ts`), and the same deliverable-number shape the legacy
 * screens already use for this exact project (1623), not invented.
 */
function seedItems(): GcpItem[] {
  return [
    { id: 'seed-item-tp-60-1', planEntryId: 'seed-tp-60-reg-1', daoSpecialtyCode: 'A1', mocCode: 'A', focCode: 'AP-01', deliverableId: 'A4ALL-2-08-1-1623-CR', active: true },
  ]
}

export const useGcpFlowStore = create<GcpFlowState>((set) => ({
  bases: seedBases(),
  projectBasis: { 'tp-60': 'seed-basis-tp-60', 'tp-64': 'seed-basis-tp-64' },
  planEntries: seedPlanEntries(),
  items: seedItems(),

  saveBasis: (basis) => set((s) => ({
    bases: s.bases.some((b) => b.id === basis.id)
      ? s.bases.map((b) => (b.id === basis.id ? basis : b))
      : [basis, ...s.bases],
  })),
  linkBasis: (projectId, basisId) => set((s) => ({
    projectBasis: { ...s.projectBasis, [projectId]: basisId },
  })),

  initializePlan: (projectId, entries) => set((s) => ({
    planEntries: [...s.planEntries.filter((e) => e.projectId !== projectId), ...entries],
  })),
  updatePlanEntry: (id, patch) => set((s) => ({
    planEntries: s.planEntries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
  })),

  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  updateItem: (id, patch) => set((s) => ({
    items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
  })),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}))
