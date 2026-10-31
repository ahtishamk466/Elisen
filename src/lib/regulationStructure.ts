import type { Regulation, Subsection } from '@/types/gcp'

/** Code prefixes suggest the normal filing structure. Existing regulation
 * classifications also count: e.g. AWM records under K reuse other topics.
 * Browsing must preserve those saved pairs rather than reclassify them. */
export function subsectionsForSubpart(code: string, subsections: Subsection[], regulations: Regulation[]) {
  const usedCodes = new Set(regulations.filter((r) => r.subpartCode === code).map((r) => r.subsectionCode))
  return subsections.filter((s) => s.code.replace(/\d+$/, '') === code || usedCodes.has(s.code))
}

/** Amendments stay separate exact records, including historical blank values. */
export function regulationsForTopic(subpartCode: string, subsectionCode: string, regulations: Regulation[]) {
  return regulations.filter((r) => r.subpartCode === subpartCode && r.subsectionCode === subsectionCode)
}

/** A search fallback must not pair the previous topic with a different parent.
    Explicit URL pairs still support newly created and cross-prefix topics. */
export function selectedRegulationTopic(
  selectedSubpartCode: string | undefined,
  requestedSubpartCode: string | null,
  requestedTopicCode: string | null,
  subsections: Subsection[],
) {
  if (!selectedSubpartCode || selectedSubpartCode !== requestedSubpartCode) return undefined
  return subsections.find((subsection) => subsection.code === requestedTopicCode)
}
