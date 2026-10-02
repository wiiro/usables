import { PRIORITY_LABELS, TASK_STATUS_LABELS } from '../../../domain/labels';
import type { Priority, TaskStatus } from '../../../types/work';

const BADGE = 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap';

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  doing: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  blocked: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
};

const PRIORITY_STYLES: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  medium: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  urgent: 'bg-red-600 text-white dark:bg-red-500 dark:text-red-950',
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`${BADGE} ${STATUS_STYLES[status]}`}>{TASK_STATUS_LABELS[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`${BADGE} ${PRIORITY_STYLES[priority]}`}>
      <span className="sr-only">Prioridade </span>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
