import { create } from 'zustand'
import type { CertBasis, GcpItem, PlanEntry } from '@/types/gcp'

/**
 * Demo plan only, so the GCP Projects table has something other than dashes
 * for Applicable / Affected / GCP Progress before anyone runs Initialize: the
 * first eight rules of `tp-60`'s real basis ("1568 -Top Aces 1623" uses
 * A4N_23-14), five affected and three of those complete. The legacy plans
 * themselves (`certplan`) are not imported yet.
 */
function demoPlan(bases: CertBasis[], projectBasis: Record<string, string>): PlanEntry[] {
  const basis = bases.find((b) => b.id === projectBasis['tp-60'])
  return (basis?.regulationIds.slice(0, 8) ?? []).map((regulationId, i) => ({
    id: `seed-tp-60-reg-${i + 1}`,
    projectId: 'tp-60',
    regulationId,
    affected: i < 5,
    methodText: '',
    comments: '',
    ddsType: '',
    ddsText: '',
    complete: i < 3,
  }))
}

interface GcpFlowState {
  /** The client's bases from the legacy database, plus any built here. Empty
      until `hydrate` runs with the GCP data (`useGcpStore.ensureGcpData`). */
  bases: CertBasis[]
  /** TCCA project id → basis id, the link the legacy "Associate" screen made. */
  projectBasis: Record<string, string>
  planEntries: PlanEntry[]
  items: GcpItem[]

  /** Loads the database's bases and project links, and the demo plan on top. */
  hydrate: (bases: CertBasis[], projectBasis: Record<string, string>) => void
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
  bases: [],
  projectBasis: {},
  planEntries: [],
  items: seedItems(),

  hydrate: (bases, projectBasis) => set({ bases, projectBasis, planEntries: demoPlan(bases, projectBasis) }),
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
