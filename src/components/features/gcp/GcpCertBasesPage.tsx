import { AppShell } from '@/components/patterns/AppShell'
import { GcpTabPanel } from './GcpTabPanel'

/** No tabs here: a basis and its rules are one record, so the rules open from
    inside the basis row rather than from a second tab. Import is an action on
    this screen, and linking a basis to a project belongs to the project. */
export function GcpCertBasesPage() {
  return (
    <AppShell
      activeItem="GCP"
      activeChild="Cert Bases"
      title="Cert Bases"
      description="Each aircraft's rule set: which regulation, at which amendment."
    >
      <div className="rounded-sm border border-border-default bg-neutral-25">
        <GcpTabPanel
          title="Master Cert Basis and Cert Basis"
          description="The list of bases — aircraft model with its type certificate, or a project-specific basis — and the rules inside each one. Rules are imported from the FAA export."
        />
      </div>
    </AppShell>
  )
}
