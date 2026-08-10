import { create } from 'zustand'
import { APPROVALS } from '@/lib/documentFixtures'
import type { Approval } from '@/types/documents'

interface ApprovalsState {
  approvals: Approval[]
  addApproval: (a: Approval) => void
  updateApproval: (id: string, patch: Partial<Approval>) => void
  linkToProject: (approvalId: string, projectId: string) => void
  unlinkFromProject: (approvalId: string, projectId: string) => void
}

export const useApprovalsStore = create<ApprovalsState>((set) => ({
  approvals: APPROVALS,

  addApproval: (a) => set((s) => ({ approvals: [a, ...s.approvals] })),
  updateApproval: (id, patch) =>
    set((s) => ({ approvals: s.approvals.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
  linkToProject: (approvalId, projectId) =>
    set((s) => ({
      approvals: s.approvals.map((a) =>
        a.id === approvalId && !a.projectIds.includes(projectId) ? { ...a, projectIds: [...a.projectIds, projectId] } : a,
      ),
    })),
  unlinkFromProject: (approvalId, projectId) =>
    set((s) => ({
      approvals: s.approvals.map((a) =>
        a.id === approvalId ? { ...a, projectIds: a.projectIds.filter((p) => p !== projectId) } : a,
      ),
    })),
}))
