import { create } from 'zustand'
import { REGULATION_GROUPS, REGULATION_GROUP_SECTIONS, REGULATIONS, SUBPARTS, SUBSECTIONS } from '@/lib/gcpFixtures'
import type { Regulation, RegulationGroup, RegulationGroupSection, Subpart, Subsection } from '@/types/gcp'

interface GcpState {
  regulations: Regulation[]
  subparts: Subpart[]
  subsections: Subsection[]
  groups: RegulationGroup[]
  groupSections: RegulationGroupSection[]

  addRegulation: (r: Regulation) => void
  updateRegulation: (id: string, patch: Partial<Regulation>) => void
  removeRegulation: (id: string) => void

  addSubpart: (s: Subpart) => void
  updateSubpart: (id: string, patch: Partial<Subpart>) => void
  removeSubpart: (id: string) => void

  addSubsection: (s: Subsection) => void
  updateSubsection: (id: string, patch: Partial<Subsection>) => void
  removeSubsection: (id: string) => void

  addGroup: (g: RegulationGroup) => void
  updateGroup: (id: string, patch: Partial<RegulationGroup>) => void
  /** Also drops the rules attached to it: a section cannot outlive its group. */
  removeGroup: (id: string) => void

  /** Replaces the whole set of rules attached to one group — the picker edits
      them together, never one at a time. */
  setGroupSections: (groupId: string, sectionRoots: string[]) => void
  updateGroupSection: (id: string, patch: Partial<RegulationGroupSection>) => void
  removeGroupSection: (id: string) => void
}

export const useGcpStore = create<GcpState>((set) => ({
  regulations: REGULATIONS,
  subparts: SUBPARTS,
  subsections: SUBSECTIONS,
  groups: REGULATION_GROUPS,
  groupSections: REGULATION_GROUP_SECTIONS,

  addRegulation: (r) => set((s) => ({ regulations: [r, ...s.regulations] })),
  updateRegulation: (id, patch) => set((s) => ({
    regulations: s.regulations.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  })),
  removeRegulation: (id) => set((s) => ({ regulations: s.regulations.filter((r) => r.id !== id) })),

  addSubpart: (sp) => set((s) => ({ subparts: [sp, ...s.subparts] })),
  updateSubpart: (id, patch) => set((s) => ({
    subparts: s.subparts.map((x) => (x.id === id ? { ...x, ...patch } : x)),
  })),
  removeSubpart: (id) => set((s) => ({ subparts: s.subparts.filter((x) => x.id !== id) })),

  addSubsection: (ss) => set((s) => ({ subsections: [ss, ...s.subsections] })),
  updateSubsection: (id, patch) => set((s) => ({
    subsections: s.subsections.map((x) => (x.id === id ? { ...x, ...patch } : x)),
  })),
  removeSubsection: (id) => set((s) => ({ subsections: s.subsections.filter((x) => x.id !== id) })),

  addGroup: (g) => set((s) => ({ groups: [g, ...s.groups] })),
  updateGroup: (id, patch) => set((s) => ({
    groups: s.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
  })),
  removeGroup: (id) => set((s) => ({
    groups: s.groups.filter((g) => g.id !== id),
    groupSections: s.groupSections.filter((x) => x.groupId !== id),
  })),

  setGroupSections: (groupId, sectionRoots) => set((s) => ({
    groupSections: [
      ...s.groupSections.filter((x) => x.groupId !== groupId),
      ...sectionRoots.map((root) => {
        const existing = s.groupSections.find((x) => x.groupId === groupId && x.sectionRoot === root)
        return existing ?? { id: crypto.randomUUID(), groupId, sectionRoot: root, active: true }
      }),
    ],
  })),
  updateGroupSection: (id, patch) => set((s) => ({
    groupSections: s.groupSections.map((x) => (x.id === id ? { ...x, ...patch } : x)),
  })),
  removeGroupSection: (id) => set((s) => ({ groupSections: s.groupSections.filter((x) => x.id !== id) })),
}))
