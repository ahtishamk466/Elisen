import type { Regulation } from '@/types/gcp'

export interface RegulationContext {
  subpartCode: string
  subsectionCode: string
}

export type RegulationDraft = Omit<Regulation, 'id'>
export type RegulationDraftErrors = Partial<Record<keyof RegulationDraft, string>>

/** Context only supplies a new record's classification. Edit/copy values win,
    including blank, placeholder and cross-prefix legacy classifications. */
export function createRegulationDraft(initial?: Regulation, context?: RegulationContext): RegulationDraft {
  return {
    section: initial?.section ?? '',
    amdt: initial?.amdt ?? '',
    title: initial?.title ?? '',
    subpartCode: initial?.subpartCode ?? context?.subpartCode ?? '',
    subsectionCode: initial?.subsectionCode ?? context?.subsectionCode ?? '',
    url: initial?.url ?? '',
    sort: initial?.sort ?? '',
    requirementText: initial?.requirementText ?? '',
    defaultMocText: initial?.defaultMocText ?? '',
    sectionRoot: initial?.sectionRoot ?? '',
    active: initial?.active ?? true,
  }
}

function rootOf(section: string) {
  const m = section.trim().match(/^(\d+)\.(\d+)(.*)$/)
  if (!m) return section.trim()
  return `${m[1]}.${m[2].padStart(4, '0')}${m[3]}`
}

export function regulationDraftKeys(draft: RegulationDraft) {
  const root = draft.sectionRoot.trim() || (draft.section.trim() ? rootOf(draft.section) : '')
  const sort = draft.sort.trim() || (root && draft.amdt.trim() ? `${root}_${draft.amdt.trim()}` : '')
  return { root, sort }
}

export function validateRegulationDraft(draft: RegulationDraft, regulations: Regulation[], editingId?: string) {
  const errors: RegulationDraftErrors = {}
  const keys = regulationDraftKeys(draft)
  if (!draft.section.trim()) errors.section = 'Section is required.'
  if (!draft.amdt.trim()) errors.amdt = 'Amendment is required when creating or editing a regulation.'
  if (!draft.title.trim()) errors.title = 'Title is required.'
  if (!draft.subpartCode) errors.subpartCode = 'Subpart is required.'
  if (!draft.subsectionCode) errors.subsectionCode = 'Subsection is required.'
  if (!draft.requirementText.trim()) errors.requirementText = 'Requirement Text is required.'
  if (!keys.sort) errors.sort = 'Sort is required.'
  if (!keys.root) errors.sectionRoot = 'Section Root is required.'
  if (!errors.section && !errors.amdt) {
    const clash = regulations.find((r) => r.id !== editingId
      && r.section === draft.section.trim() && r.amdt === draft.amdt.trim())
    if (clash) errors.amdt = `${clash.section} at ${clash.amdt} already exists — one record per rule and amendment.`
  }
  return errors
}

export function buildRegulation(draft: RegulationDraft, id: string): Regulation {
  const keys = regulationDraftKeys(draft)
  return {
    ...draft,
    id,
    section: draft.section.trim(),
    amdt: draft.amdt.trim(),
    title: draft.title.trim(),
    url: draft.url.trim(),
    sort: keys.sort,
    requirementText: draft.requirementText.trim(),
    defaultMocText: draft.defaultMocText.trim(),
    sectionRoot: keys.root,
  }
}

export type SetRegulationField = <K extends keyof RegulationDraft>(key: K, value: RegulationDraft[K]) => void
