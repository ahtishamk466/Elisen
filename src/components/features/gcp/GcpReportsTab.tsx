import { useState } from 'react'
import { FileText } from 'lucide-react'
import { EmptyState } from '@/components/patterns/EmptyState'
import { TableTabs } from '@/components/patterns/TableTabs'

/** The three outputs the legacy Reports screen produces from the same GCP
    data. They differ in inputs and content, so each gets its own tab. */
const REPORTS = [
  { key: 'plan', label: 'Certification Plan', description: 'Produced before the work starts: what will be done for every affected rule, and who will find compliance.' },
  { key: 'record', label: 'Certification Record', description: 'Produced at the end: the same content plus each document revision and a compliance statement for every delegate to sign.' },
  { key: 'cross-reference', label: 'Cross-reference', description: 'The quick list specialists work from while writing their reports.' },
] as const

export function GcpReportsTab() {
  const [active, setActive] = useState<string>(REPORTS[0].key)
  const report = REPORTS.find((r) => r.key === active) ?? REPORTS[0]

  return (
    <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <TableTabs
        ariaLabel="GCP reports"
        activeKey={active}
        onChange={setActive}
        tabs={REPORTS.map((r) => ({ key: r.key, label: r.label }))}
      />
      <div role="tabpanel" aria-labelledby={`tab-${active}`} tabIndex={0}>
        <EmptyState
          icon={<FileText size={48} strokeWidth={1.5} />}
          title={report.label}
          description={report.description}
        />
      </div>
    </div>
  )
}
