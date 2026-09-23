import { create } from 'zustand'
import type { CertBasis, GcpItem, PlanEntry } from '@/types/gcp'

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
  projectBasis: {},
  planEntries: [],
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
