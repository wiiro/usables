import type { Task, TaskStatus } from '../types/work';
import { TASK_STATUSES } from '../types/work';

export const statusRank = (status: TaskStatus) => TASK_STATUSES.indexOf(status);

type OrderedTask = Pick<Task, 'order' | 'createdAt' | 'id'>;

/**
 * Ordem manual (a do Kanban): campo `order`, com criação e id desempatando,
 * para duas tarefas com a mesma ordem aparecerem sempre na mesma posição.
 */
export function compareByOrder(a: OrderedTask, b: OrderedTask): number {
  return a.order - b.order || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
}

type SortableTask = Pick<Task, 'status' | 'dueDate'> & OrderedTask;

/**
 * Ordem padrão da Lista: por status (A fazer, Fazendo, Bloqueado, Feito),
 * depois pela data de entrega (sem data por último) e então pela ordem manual.
 */
export function compareTasksForList(a: SortableTask, b: SortableTask): number {
  const byStatus = statusRank(a.status) - statusRank(b.status);
  if (byStatus !== 0) return byStatus;
  if (a.dueDate !== b.dueDate) {
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return compareByOrder(a, b);
}
