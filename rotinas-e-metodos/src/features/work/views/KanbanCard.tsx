import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, ListChecks, OctagonAlert, Repeat } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { formatShortDate, isOverdue } from '../../../domain/dates';
import { projectName, taskTitle } from '../../../domain/labels';
import { taskProgress } from '../../../domain/progress';
import type { Task } from '../../../types/work';
import { PriorityBadge } from '../components/badges';
import type { TaskDisplay } from './taskDisplay';

interface KanbanCardProps {
  task: Task;
  display: TaskDisplay;
}

/** Cartão arrastável. Clique (ou Enter) abre o painel; Espaço pega para mover. */
export function KanbanCard({ task, display }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    attributes: { roleDescription: 'tarefa arrastável' },
  });

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    listeners?.onKeyDown?.(event);
    if (event.key === 'Enter' && !isDragging) display.onOpen(task.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onKeyDown={onKeyDown}
      onClick={() => display.onOpen(task.id)}
      className={[
        'cursor-grab rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        isDragging ? 'opacity-40' : '',
      ].join(' ')}
    >
      <KanbanCardContent task={task} display={display} />
    </div>
  );
}

/** Conteúdo do cartão; também usado na "sombra" que acompanha o mouse ao arrastar. */
export function KanbanCardContent({ task, display, lifted }: KanbanCardProps & { lifted?: boolean }) {
  const project = display.projectsById.get(task.projectId);
  const title = taskTitle(task);
  const overdue = isOverdue(task, display.today);
  const doneSubtasks = task.subtasks.filter((subtask) => subtask.done).length;

  return (
    <div
      className={`rounded-lg border border-line bg-surface p-3 ${lifted ? 'rotate-1 shadow-xl' : 'shadow-sm hover:shadow'}`}
      style={{ borderLeft: `3px solid ${project?.color ?? 'var(--app-line)'}` }}
    >
      <div className="flex items-start gap-2">
        <p className={`flex-1 text-sm font-medium ${task.status === 'done' ? 'text-fg-muted line-through' : ''}`}>{title}</p>
        {display.blockedIds.has(task.id) && (
          <span title="Tem bloqueio ativo" className="text-red-600 dark:text-red-400">
            <OctagonAlert className="size-4" aria-hidden />
            <span className="sr-only">Tem bloqueio ativo</span>
          </span>
        )}
      </div>
      {display.showProject && project && <p className="mt-0.5 truncate text-xs text-fg-muted">{projectName(project)}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-fg-muted">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className={`inline-flex items-center gap-1 ${overdue ? 'font-medium text-red-600 dark:text-red-400' : ''}`}>
            <CalendarDays className="size-3.5" aria-hidden />
            {formatShortDate(task.dueDate, display.today)}
            {overdue && ' · atrasada'}
          </span>
        )}
        {task.recurrence && <Repeat className="size-3.5" aria-label="Repete" />}
        {task.subtasks.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <ListChecks className="size-3.5" aria-hidden />
            {doneSubtasks}/{task.subtasks.length}
          </span>
        )}
      </div>
      <div className="mt-2.5">
        <ProgressBar value={taskProgress(task)} label={`Progresso de ${title}`} color={project?.color} size="sm" />
      </div>
    </div>
  );
}
