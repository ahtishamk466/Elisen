import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProjectsListPage } from '@/components/features/projects/ProjectsListPage'
import { ProjectDetailPage } from '@/components/features/projects/ProjectDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<ProjectsListPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}
