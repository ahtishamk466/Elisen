import { useNavigate } from 'react-router-dom'
import { SectionTabs } from '@/components/patterns/SectionTabs'

export const REGULATION_SECTIONS = ['Regulations', 'Structure', 'Groups', 'Checklist'] as const
export type RegulationSection = (typeof REGULATION_SECTIONS)[number]

export const sectionSlug = (s: RegulationSection) => s.toLowerCase().replace(/ /g, '-')

/**
 * The Regulations screen's own sections. Subpart and Subsection are not
 * sections of their own — they describe how a regulation is filed, so they sit
 * together under Structure; a group and the rules it carries sit together under
 * Groups.
 */
export function GcpRegulationsTabs({ active, counts }: {
  active: RegulationSection
  counts?: Partial<Record<RegulationSection, number>>
}) {
  const navigate = useNavigate()
  return (
    <SectionTabs
      ariaLabel="Regulation sections"
      tabs={REGULATION_SECTIONS}
      active={active}
      counts={counts}
      onChange={(s) => navigate(s === 'Regulations' ? '/gcp/regulations' : `/gcp/regulations?tab=${sectionSlug(s)}`)}
    />
  )
}


