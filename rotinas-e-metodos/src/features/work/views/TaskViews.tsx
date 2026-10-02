import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { projectName } from '../../../domain/labels';
import { collectTags } from '../../../domain/tags';
import { filterTasks, sortTasks } from '../../../domain/taskFilters';
import { useWorkActions } from '../../../store/actions/useWorkActions';
import { useAppState } from '../../../store/StoreContext';
import type { Project, Task } from '../../../types/work';
import { useItemDrawer } from '../../../hooks/useItemDrawer';
import { TaskDrawerHost } from '../components/TaskDrawerHost';
import { TaskList } from '../components/TaskList';
import { KanbanBoard } from './KanbanBoard';
import { QuickAddTask } from './QuickAddTask';
import { useTaskDisplay } from './taskDisplay';
import { TaskToolbar } from './TaskToolbar';
import { useTaskFilters } from './useTaskParams';

interface TaskViewsProps {
  /** Tarefas deste contexto (todas, ou as de um projeto). */
  tasks: Task[];
  /** Na página de um projeto: esconde o filtro e a coluna de projeto. */
  fixedProject?: Project;
}

/** Kanban ou Lista (a última escolha fica salva), com filtros e o painel da tarefa. */
export function TaskViews({ tasks, fixedProject }: TaskViewsProps) {
  const { projects, preferences } = useAppState();
  const { setTaskView } = useWorkActions();
  const { filters, sort, setFilter, toggleSort, clearFilters } = useTaskFilters();
  const drawer = useItemDrawer('tarefa');
  const display = useTaskDisplay(!fixedProject, (taskId) => drawer.open(taskId));
  const view = preferences.taskView;

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => projectName(a).localeCompare(projectName(b), 'pt-BR')),
    [projects],
  );
  const tags = useMemo(() => collectTags(tasks), [tasks]);
  // Filtros que não se aplicam aqui são ignorados (continuam no endereço para quando voltar).
  const applied = { ...filters, projectId: fixedProject ? null : filters.projectId, status: view === 'kanban' ? null : filters.status };
  const visible = filterTasks(tasks, applied, display.today);

  return (
    <div className="flex flex-col gap-4">
      {sortedProjects.length > 0 && (
        <QuickAddTask fixedProjectId={fixedProject?.id ?? null} projects={sortedProjects} suggestedProjectId={applied.projectId} />
      )}
      <TaskToolbar
        view={view}
        onViewChange={setTaskView}
        filters={applied}
        onFilterChange={setFilter}
        onClear={clearFilters}
        projects={fixedProject ? null : sortedProjects}
        tags={tags}
        shown={visible.length}
        total={tasks.length}
      />
      <ViewBody hasTasks={tasks.length > 0} hasVisible={visible.length > 0} onClear={clearFilters}>
        {view === 'kanban' ? (
          <KanbanBoard tasks={visible} display={display} />
        ) : (
          <TaskList tasks={sortTasks(visible, sort, projectNames(projects))} display={display} sort={sort} onSort={toggleSort} />
        )}
      </ViewBody>
      <TaskDrawerHost />
    </div>
  );
}

const projectNames = (projects: Project[]) => new Map(projects.map((p) => [p.id, projectName(p)]));

interface ViewBodyProps {
  hasTasks: boolean;
  hasVisible: boolean;
  onClear: () => void;
  children: ReactNode;
}

function ViewBody({ hasTasks, hasVisible, onClear, children }: ViewBodyProps) {
  if (hasTasks && hasVisible) return <>{children}</>;
  return (
    <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-fg-muted">
      {hasTasks ? (
        <>
          Nenhuma tarefa com esses filtros.{' '}
          <button type="button" onClick={onClear} className="font-medium text-accent underline">
            Limpar filtros
          </button>
        </>
      ) : (
        'Nenhuma tarefa ainda. Depois de criar, clique numa tarefa para ver os detalhes e as subtarefas.'
      )}
    </p>
  );
}
