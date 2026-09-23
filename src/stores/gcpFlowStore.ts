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

export const useGcpFlowStore = create<GcpFlowState>((set) => ({
  bases: [],
  projectBasis: { 'tp-60': 'seed-basis-tp-60', 'tp-64': 'seed-basis-tp-64' },
  planEntries: seedPlanEntries(),
  items: [],

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
