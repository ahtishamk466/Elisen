import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProjectsListPage } from '@/components/features/projects/ProjectsListPage'
import { ProjectDetailPage } from '@/components/features/projects/ProjectDetailPage'
import { TccaProjectsListPage } from '@/components/features/tcca/TccaProjectsListPage'
import { TccaProjectDetailPage } from '@/components/features/tcca/TccaProjectDetailPage'
import { TimesheetListPage } from '@/components/features/timesheet/TimesheetListPage'
import { HoursWorkedPage } from '@/components/features/timesheet/HoursWorkedPage'

export default function App() {
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
      </Routes>
    </BrowserRouter>
  )
}
