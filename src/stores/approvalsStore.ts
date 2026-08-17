import { create } from 'zustand'
import { APPROVALS, APPROVAL_REVISIONS } from '@/lib/documentFixtures'
import type { Approval, ApprovalRevision } from '@/types/documents'

interface ApprovalsState {
  approvals: Approval[]
  revisions: ApprovalRevision[]

  addApproval: (a: Approval) => void
  updateApproval: (id: string, patch: Partial<Approval>) => void
  /** Cascades its revisions — a revision cannot outlive its certificate. */
  removeApproval: (id: string) => void

  addRevision: (r: ApprovalRevision) => void
  updateRevision: (id: string, patch: Partial<ApprovalRevision>) => void
  removeRevision: (id: string) => void

  /** Linkable from either side — the project's Approvals tab and the
      approval's Projects tab call the same two verbs. */
  linkToProject: (approvalId: string, projectId: string) => void
  unlinkFromProject: (approvalId: string, projectId: string) => void

  /** `approval_aircraft` / `approval_serialnumber`, as assign lists. */
  linkAircraft: (approvalId: string, aircraftId: string) => void
  unlinkAircraft: (approvalId: string, aircraftId: string) => void
  linkSerial: (approvalId: string, serialId: string) => void
  unlinkSerial: (approvalId: string, serialId: string) => void
}

/** Adds `value` to the named string array on one approval, ignoring repeats. */
const addTo = (key: 'projectIds' | 'aircraftIds' | 'serialIds') =>
  (approvals: Approval[], id: string, value: string) =>
    approvals.map((a) =>
      a.id === id && !a[key].includes(value) ? { ...a, [key]: [...a[key], value] } : a,
    )

const removeFrom = (key: 'projectIds' | 'aircraftIds' | 'serialIds') =>
  (approvals: Approval[], id: string, value: string) =>
    approvals.map((a) => (a.id === id ? { ...a, [key]: a[key].filter((v) => v !== value) } : a))

export const useApprovalsStore = create<ApprovalsState>((set) => ({
  approvals: APPROVALS,
  revisions: APPROVAL_REVISIONS,

  addApproval: (a) => set((s) => ({ approvals: [a, ...s.approvals] })),
  updateApproval: (id, patch) =>
    set((s) => ({ approvals: s.approvals.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
  removeApproval: (id) =>
    set((s) => ({
      approvals: s.approvals.filter((a) => a.id !== id),
      revisions: s.revisions.filter((r) => r.approvalId !== id),
    })),

  addRevision: (r) => set((s) => ({ revisions: [r, ...s.revisions] })),
  updateRevision: (id, patch) =>
    set((s) => ({ revisions: s.revisions.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
  removeRevision: (id) => set((s) => ({ revisions: s.revisions.filter((r) => r.id !== id) })),

  linkToProject: (approvalId, projectId) =>
    set((s) => ({ approvals: addTo('projectIds')(s.approvals, approvalId, projectId) })),
  unlinkFromProject: (approvalId, projectId) =>
    set((s) => ({ approvals: removeFrom('projectIds')(s.approvals, approvalId, projectId) })),

  linkAircraft: (approvalId, aircraftId) =>
    set((s) => ({ approvals: addTo('aircraftIds')(s.approvals, approvalId, aircraftId) })),
  unlinkAircraft: (approvalId, aircraftId) =>
    set((s) => ({ approvals: removeFrom('aircraftIds')(s.approvals, approvalId, aircraftId) })),
  linkSerial: (approvalId, serialId) =>
    set((s) => ({ approvals: addTo('serialIds')(s.approvals, approvalId, serialId) })),
  unlinkSerial: (approvalId, serialId) =>
    set((s) => ({ approvals: removeFrom('serialIds')(s.approvals, approvalId, serialId) })),
}))
