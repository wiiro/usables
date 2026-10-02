import { ListChecks, OctagonAlert, Repeat } from 'lucide-react';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { formatShortDate, isOverdue } from '../../../domain/dates';
import { projectName, taskTitle } from '../../../domain/labels';
import { taskProgress } from '../../../domain/progress';
import type { Task } from '../../../types/work';
import type { TaskDisplay } from '../views/taskDisplay';
import { PriorityBadge, StatusBadge } from './badges';

interface TaskRowProps {
  task: Task;
  display: TaskDisplay;
  onToggleDone: (done: boolean) => void;
}

/** Linha da Lista. Clicar em qualquer ponto abre o painel; pelo teclado, o botão do título. */
export function TaskRow({ task, display, onToggleDone }: TaskRowProps) {
  const title = taskTitle(task);
  const done = task.status === 'done';
  const overdue = isOverdue(task, display.today);
  const project = display.projectsById.get(task.projectId);
  const doneSubtasks = task.subtasks.filter((subtask) => subtask.done).length;
  const open = () => display.onOpen(task.id);

  return (
    <tr onClick={open} className="cursor-pointer transition-colors hover:bg-surface-muted/60">
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={done}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onToggleDone(event.target.checked)}
            aria-label={`Marcar "${title}" como feita`}
            className="size-4 shrink-0 cursor-pointer accent-accent"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                open();
              }}
              className={`truncate text-left font-medium hover:underline ${done ? 'text-fg-muted line-through' : ''}`}
            >
              {title}
            </button>
            <TaskMeta task={task} blocked={display.blockedIds.has(task.id)} doneSubtasks={doneSubtasks} />
          </div>
        </div>
      </td>
      {display.showProject && (
        <td className="px-3 py-2.5">
          {project && (
            <span className="inline-flex max-w-48 items-center gap-1.5 text-xs">
              <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: project.color }} aria-hidden />
              <span className="truncate">{projectName(project)}</span>
            </span>
          )}
        </td>
      )}
      <td className="px-3 py-2.5">
        <StatusBadge status={task.status} />
      </td>
      <td className="px-3 py-2.5">
        <PriorityBadge priority={task.priority} />
      </td>
      <td className={`px-3 py-2.5 text-xs whitespace-nowrap tabular-nums ${overdue ? 'font-medium text-red-600 dark:text-red-400' : 'text-fg-muted'}`}>
        {task.dueDate ? formatShortDate(task.dueDate, display.today) : '—'}
        {overdue && ' · atrasada'}
      </td>
      <td className="px-3 py-2.5">
        <ProgressBar value={taskProgress(task)} label={`Progresso de ${title}`} color={project?.color} size="sm" />
      </td>
    </tr>
  );
}

function TaskMeta({ task, blocked, doneSubtasks }: { task: Task; blocked: boolean; doneSubtasks: number }) {
  if (!blocked && !task.recurrence && task.subtasks.length === 0 && task.tags.length === 0) return null;
  return (
    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-fg-muted">
      {blocked && (
        <span className="inline-flex items-center gap-1 font-medium text-red-600 dark:text-red-400">
          <OctagonAlert className="size-3.5" aria-hidden />
          Bloqueio ativo
        </span>
      )}
      {task.subtasks.length > 0 && (
        <span className="inline-flex items-center gap-1">
          <ListChecks className="size-3.5" aria-hidden />
          {doneSubtasks}/{task.subtasks.length}
          <span className="sr-only"> subtarefas concluídas</span>
        </span>
      )}
      {task.recurrence && (
        <span className="inline-flex items-center gap-1">
          <Repeat className="size-3.5" aria-hidden />
          Repete
        </span>
      )}
      {task.tags.map((tag) => (
        <span key={tag} className="rounded bg-surface-muted px-1.5 py-px">
          {tag}
        </span>
      ))}
    </span>
  );
}
