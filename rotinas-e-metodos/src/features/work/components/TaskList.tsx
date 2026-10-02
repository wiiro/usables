import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { SortKey, TaskSort } from '../../../domain/taskFilters';
import { useWorkActions } from '../../../store/actions/useWorkActions';
import type { Task } from '../../../types/work';
import type { TaskDisplay } from '../views/taskDisplay';
import { TaskRow } from './TaskRow';

const COLUMNS: { key: SortKey; label: string; globalOnly?: boolean; className?: string }[] = [
  { key: 'title', label: 'Tarefa' },
  { key: 'project', label: 'Projeto', globalOnly: true },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Prioridade' },
  { key: 'dueDate', label: 'Entrega' },
  { key: 'progress', label: 'Progresso', className: 'w-36' },
];

interface TaskListProps {
  /** Já filtradas e ordenadas. */
  tasks: Task[];
  display: TaskDisplay;
  sort: TaskSort | null;
  onSort: (key: SortKey) => void;
}

/** Visualização em Lista: tabela com ordenação clicando no cabeçalho. */
export function TaskList({ tasks, display, sort, onSort }: TaskListProps) {
  const { updateTask } = useWorkActions();
  const columns = COLUMNS.filter((column) => display.showProject || !column.globalOnly);

  return (
    // relative: prende os textos sr-only (posição absoluta) dentro da área rolável.
    <div className="relative overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="border-b border-line text-left text-xs text-fg-muted">
          <tr>
            {columns.map((column) => (
              <SortHeader
                key={column.key}
                sortKey={column.key}
                label={column.label}
                className={column.className}
                sort={sort}
                onSort={onSort}
              />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              display={display}
              onToggleDone={(done) => updateTask(task.id, { status: done ? 'done' : 'todo' })}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface SortHeaderProps {
  sortKey: SortKey;
  label: string;
  className?: string;
  sort: TaskSort | null;
  onSort: (key: SortKey) => void;
}

function SortHeader({ sortKey, label, className = '', sort, onSort }: SortHeaderProps) {
  const active = sort?.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`px-3 py-2 font-medium ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`group inline-flex items-center gap-1 rounded hover:text-fg ${active ? 'text-fg' : ''}`}
      >
        {label}
        <Icon className={`size-3.5 ${active ? '' : 'opacity-0 group-hover:opacity-60'}`} aria-hidden />
      </button>
    </th>
  );
}
