import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { columnDropId } from '../../../domain/kanban';
import { TASK_STATUS_LABELS } from '../../../domain/labels';
import type { Task, TaskStatus } from '../../../types/work';
import { KanbanCard } from './KanbanCard';
import type { TaskDisplay } from './taskDisplay';

const STATUS_DOT: Record<TaskStatus, string> = {
  todo: 'bg-slate-400',
  doing: 'bg-blue-500',
  blocked: 'bg-red-500',
  done: 'bg-emerald-500',
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  display: TaskDisplay;
}

export function KanbanColumn({ status, tasks, display }: KanbanColumnProps) {
  // A coluna inteira também é alvo: permite soltar numa coluna vazia ou no fim dela.
  const { setNodeRef, isOver } = useDroppable({ id: columnDropId(status) });
  const label = TASK_STATUS_LABELS[status];

  return (
    <section aria-label={`${label}: ${tasks.length}`} className="flex min-w-64 flex-1 basis-0 flex-col rounded-xl bg-surface-muted/70">
      <header className="flex items-center gap-2 px-3 py-2.5">
        <span className={`size-2 rounded-full ${STATUS_DOT[status]}`} aria-hidden />
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-xs tabular-nums text-fg-muted">{tasks.length}</span>
      </header>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex min-h-28 flex-1 flex-col gap-2 rounded-b-xl px-2 pb-2 transition-colors ${isOver ? 'bg-accent-soft' : ''}`}
        >
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} display={display} />
          ))}
          {tasks.length === 0 && (
            <p className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-line p-4 text-xs text-fg-muted">
              Arraste tarefas para cá
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
