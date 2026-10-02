import { Briefcase, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { projectName } from '../../domain/labels';
import { useToday } from '../../hooks/useToday';
import { useAppState } from '../../store/StoreContext';
import type { Task } from '../../types/work';
import { ProjectCard } from './components/ProjectCard';
import { NewProjectDrawer } from './components/ProjectDrawers';
import { WorkTabs } from './components/WorkTabs';

/** /trabalho: os projetos, cada um com sua barra de progresso. */
export function WorkPage() {
  const { projects, tasks } = useAppState();
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const today = useToday();

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => projectName(a).localeCompare(projectName(b), 'pt-BR')),
    [projects],
  );
  const tasksByProject = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) map.set(task.projectId, [...(map.get(task.projectId) ?? []), task]);
    return map;
  }, [tasks]);

  const newProjectButton = (
    <Button variant="primary" onClick={() => setCreating(true)}>
      <Plus className="size-4" aria-hidden />
      Novo projeto
    </Button>
  );

  return (
    <>
      <PageHeader title="Trabalho" description="Projetos, tarefas e subtarefas." actions={newProjectButton}>
        <WorkTabs />
      </PageHeader>
      <div className="p-6 md:p-8">
        {projects.length === 0 ? (
          <EmptyState icon={Briefcase} title="Nenhum projeto ainda">
            <p>Crie o primeiro projeto para começar a organizar suas tarefas.</p>
            <div className="mt-4">{newProjectButton}</div>
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sortedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} tasks={tasksByProject.get(project.id) ?? []} today={today} />
            ))}
          </div>
        )}
      </div>
      {creating && (
        <NewProjectDrawer
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            navigate(`/trabalho/projetos/${id}`);
          }}
        />
      )}
    </>
  );
}
