import { useNavigate } from 'react-router-dom'
import { SectionTabs } from '@/components/patterns/SectionTabs'

export const REGULATION_SECTIONS = ['Regulations', 'Certification Topics', 'Regulation Groups', 'Checklist'] as const
export type RegulationSection = (typeof REGULATION_SECTIONS)[number]

/** Keep existing bookmarks while displaying the user-chosen section names. */
export const sectionSlug = (s: RegulationSection) => {
  if (s === 'Certification Topics') return 'structure'
  if (s === 'Regulation Groups') return 'groups'
  return s.toLowerCase().replace(/ /g, '-')
}

/**
 * The Regulatory Library screen's own sections. Subpart and Subsection are not
 * sections of their own — they describe how a regulation is filed, so they sit
 * together under Certification Topics; a group and the rules it carries sit together under
 * Regulation Groups.
 */
export function GcpRegulationsTabs({ active, counts }: {
  active: RegulationSection
  counts?: Partial<Record<RegulationSection, number>>
}) {
  const navigate = useNavigate()
  return (
    <SectionTabs
      ariaLabel="Regulatory Library sections"
      tabs={REGULATION_SECTIONS.filter((section) => section !== 'Checklist')}
      active={active}
      counts={counts}
      onChange={(s) => navigate(s === 'Regulations' ? '/gcp/regulations' : `/gcp/regulations?tab=${sectionSlug(s)}`)}
    />
  )
}


