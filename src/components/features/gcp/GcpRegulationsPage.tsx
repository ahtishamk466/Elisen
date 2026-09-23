import { useSearchParams } from 'react-router-dom'
import { REGULATION_SECTIONS, sectionSlug, type RegulationSection } from './GcpRegulationsTabs'
import { RegulationListPage } from './RegulationListPage'
import { RegulationStructurePage } from './RegulationStructurePage'
import { RegulationGroupsPage } from './RegulationGroupsPage'
import { RegulationChecklistPage } from './RegulationChecklistPage'

/** One route for the whole rule library; `?tab=` picks the section and, where
    a section holds two listings, `?view=` picks which. */
export function GcpRegulationsPage() {
  const [searchParams] = useSearchParams()
  const section: RegulationSection =
    REGULATION_SECTIONS.find((s) => sectionSlug(s) === searchParams.get('tab')) ?? 'Regulations'

  switch (section) {
    case 'Structure':
      return <RegulationStructurePage />
    case 'Groups':
      return <RegulationGroupsPage />
    case 'Checklist':
      return <RegulationChecklistPage />
    default:
      return <RegulationListPage />
  }
}
