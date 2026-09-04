import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProjectsListPage } from '@/components/features/projects/ProjectsListPage'
import { WorkPackagesPage } from '@/components/features/projects/WorkPackagesPage'
import { ProjectReviewPage } from '@/components/features/projects/ProjectReviewPage'
import { ProjectDetailPage } from '@/components/features/projects/ProjectDetailPage'
import { TccaProjectsListPage } from '@/components/features/tcca/TccaProjectsListPage'
import { TccaProjectDetailPage } from '@/components/features/tcca/TccaProjectDetailPage'
import { TimesheetListPage } from '@/components/features/timesheet/TimesheetListPage'
import { HoursWorkedPage } from '@/components/features/timesheet/HoursWorkedPage'
import { PersonDetailPage } from '@/components/features/timesheet/PersonDetailPage'
import { ActivityCatalogPage } from '@/components/features/lookups/ActivityCatalogPage'
import { ReportsPage } from '@/components/features/reports/ReportsPage'
import { UsersAccessPage } from '@/components/features/access/UsersAccessPage'
import { RolesPermissionsPage } from '@/components/features/access/RolesPermissionsPage'
import { SystemAccessPage } from '@/components/features/access/SystemAccessPage'
import { CompaniesPage } from '@/components/features/lookups/CompaniesPage'
import { AircraftPage } from '@/components/features/lookups/AircraftPage'
import { AtaChaptersPage } from '@/components/features/lookups/AtaChaptersPage'
import { DatabaseBackupsPage } from '@/components/features/system/DatabaseBackupsPage'
import { SoftwareSettingsPage } from '@/components/features/system/SoftwareSettingsPage'
import { AuditControlPage } from '@/components/features/system/AuditControlPage'
import { ProfilePage } from '@/components/features/profile/ProfilePage'
import { ApprovalsWorkspace } from '@/components/features/approvals/ApprovalsWorkspace'
import { ApprovalDetailPage } from '@/components/features/approvals/ApprovalDetailPage'
import { DocumentsPage } from '@/components/features/documents/DocumentsPage'
import { SignedOutScreen } from './SignedOutScreen'
import { useSessionStore } from '@/stores/sessionStore'

export default function App() {
  const signedIn = useSessionStore((s) => s.signedIn)
  if (!signedIn) return <SignedOutScreen />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<ProjectsListPage />} />
        <Route path="/work-packages" element={<WorkPackagesPage />} />
        <Route path="/projects/review" element={<ProjectReviewPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/approvals" element={<ApprovalsWorkspace />} />
        {/* Before the :id route — otherwise "revisions" is read as an approval id. */}
        {/* Old bookmark: the revisions listing is a tab now. */}
        <Route path="/approvals/revisions" element={<Navigate to="/approvals?tab=revisions" replace />} />
        <Route path="/approvals/:id" element={<ApprovalDetailPage />} />
        <Route path="/documents" element={<Navigate to="/documents/deliverables" replace />} />
        <Route path="/documents/deliverables" element={<DocumentsPage kind="deliverable" />} />
        <Route path="/documents/design-data" element={<DocumentsPage kind="drawing" />} />
        <Route path="/tcca-projects" element={<TccaProjectsListPage />} />
        <Route path="/tcca-projects/:id" element={<TccaProjectDetailPage />} />
        <Route path="/timesheet" element={<TimesheetListPage />} />
        <Route path="/hours-worked" element={<HoursWorkedPage />} />
        <Route path="/hours-worked/person/:name" element={<PersonDetailPage />} />
        <Route path="/admin/activities" element={<ActivityCatalogPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/admin/users" element={<UsersAccessPage />} />
        <Route path="/admin/roles" element={<RolesPermissionsPage />} />
        <Route path="/admin/system" element={<SystemAccessPage />} />
        <Route path="/admin/companies" element={<CompaniesPage />} />
        <Route path="/admin/aircraft" element={<AircraftPage />} />
        <Route path="/admin/ata-chapters" element={<AtaChaptersPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/system/settings" element={<SoftwareSettingsPage />} />
        <Route path="/system/audit" element={<AuditControlPage />} />
        <Route path="/system/database" element={<DatabaseBackupsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
