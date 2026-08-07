import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProjectsListPage } from '@/components/features/projects/ProjectsListPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<ProjectsListPage />} />
      </Routes>
    </BrowserRouter>
  )
}
