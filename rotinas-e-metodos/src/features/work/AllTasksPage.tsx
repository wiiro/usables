import { Link } from 'react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAppState } from '../../store/StoreContext';
import { WorkTabs } from './components/WorkTabs';
import { TaskViews } from './views/TaskViews';

/** /trabalho/tarefas: as tarefas de todos os projetos, em Kanban ou Lista. */
export function AllTasksPage() {
  const { projects, tasks } = useAppState();

  return (
    <>
      <PageHeader title="Trabalho" description="Projetos, tarefas e subtarefas.">
        <WorkTabs />
      </PageHeader>
      <div className="p-6 md:p-8">
        {projects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-fg-muted">
            Toda tarefa pertence a um projeto.{' '}
            <Link to="/trabalho" className="font-medium text-accent underline">
              Crie o primeiro projeto
            </Link>{' '}
            para começar.
          </p>
        ) : (
          <TaskViews tasks={tasks} />
        )}
      </div>
    </>
  );
}
