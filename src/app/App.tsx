import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProjectsListPage } from '@/components/features/projects/ProjectsListPage'
import { ProjectDetailPage } from '@/components/features/projects/ProjectDetailPage'
import { TccaProjectsListPage } from '@/components/features/tcca/TccaProjectsListPage'
import { TccaProjectDetailPage } from '@/components/features/tcca/TccaProjectDetailPage'
import { TimesheetListPage } from '@/components/features/timesheet/TimesheetListPage'
import { HoursWorkedPage } from '@/components/features/timesheet/HoursWorkedPage'
import { ReportsPage } from '@/components/features/reports/ReportsPage'
import { UsersAccessPage } from '@/components/features/access/UsersAccessPage'
import { RolesPermissionsPage } from '@/components/features/access/RolesPermissionsPage'
import { SystemAccessPage } from '@/components/features/access/SystemAccessPage'
import { CompaniesPage } from '@/components/features/lookups/CompaniesPage'
import { AircraftPage } from '@/components/features/lookups/AircraftPage'
import { AtaChaptersPage } from '@/components/features/lookups/AtaChaptersPage'
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
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/tcca-projects" element={<TccaProjectsListPage />} />
        <Route path="/tcca-projects/:id" element={<TccaProjectDetailPage />} />
        <Route path="/timesheet" element={<TimesheetListPage />} />
        <Route path="/hours-worked" element={<HoursWorkedPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/admin/users" element={<UsersAccessPage />} />
        <Route path="/admin/roles" element={<RolesPermissionsPage />} />
        <Route path="/admin/system" element={<SystemAccessPage />} />
        <Route path="/admin/companies" element={<CompaniesPage />} />
        <Route path="/admin/aircraft" element={<AircraftPage />} />
        <Route path="/admin/ata-chapters" element={<AtaChaptersPage />} />
      </Routes>
    </BrowserRouter>
  )
}
