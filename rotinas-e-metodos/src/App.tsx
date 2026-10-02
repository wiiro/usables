import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { AppShell } from './components/layout/AppShell'
import { CalendarPage, StudyCalendarPage, WorkCalendarPage } from './features/calendar/CalendarPage'
import { StudyPage } from './features/study/StudyPage'
import { SubjectDetailPage } from './features/study/SubjectDetailPage'
import { TodayPage } from './features/today/TodayPage'
import { AllTasksPage } from './features/work/AllTasksPage'
import { ProjectDetailPage } from './features/work/ProjectDetailPage'
import { WorkPage } from './features/work/WorkPage'

// HashRouter (endereços com #, ex. localhost:8790/#/trabalho): o F5 funciona
// em qualquer tela servindo só arquivos estáticos, sem regra extra no servidor.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<TodayPage />} />
          <Route path="trabalho" element={<WorkPage />} />
          <Route path="trabalho/tarefas" element={<AllTasksPage />} />
          <Route path="trabalho/calendario" element={<WorkCalendarPage />} />
          <Route path="trabalho/projetos/:projectId/:section?" element={<ProjectDetailPage />} />
          <Route path="estudos" element={<StudyPage />} />
          <Route path="estudos/calendario" element={<StudyCalendarPage />} />
          <Route path="estudos/materias/:subjectId" element={<SubjectDetailPage />} />
          <Route path="calendario" element={<CalendarPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
