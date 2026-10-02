import { addDays } from 'date-fns';
import type { ID } from '../types/common';
import type { Priority, Task } from '../types/work';
import { PRIORITIES, TASK_STATUSES } from '../types/work';
import { isOverdue, toISODate } from './dates';
import { taskProgress } from './progress';
import { sameTag } from './tags';
import { compareTasksForList, statusRank } from './taskSort';

// Filtros e ordenação das tarefas (Lista e Kanban). Ficam no endereço da
// página (?prioridade=high&ordem=dueDate…) para o F5 não perder a escolha.

/** 'open' = tudo que não está Feito. */
export const STATUS_FILTERS = ['open', ...TASK_STATUSES] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

/**
 * Por data de entrega. Itens recorrentes entram pela data de início da série;
 * as ocorrências entram no calendário (Etapa 6).
 */
export const DUE_FILTERS = ['overdue', 'today', 'week', 'none'] as const;
export type DueFilter = (typeof DUE_FILTERS)[number];

export interface TaskFilters {
  projectId: ID | null;
  status: StatusFilter | null;
  priority: Priority | null;
  due: DueFilter | null;
  tag: string | null;
}

export const NO_FILTERS: TaskFilters = { projectId: null, status: null, priority: null, due: null, tag: null };

export function hasActiveFilters(filters: TaskFilters): boolean {
  return Object.values(filters).some((value) => value !== null);
}

export function filterTasks(tasks: readonly Task[], filters: TaskFilters, today: Date): Task[] {
  return tasks.filter(
    (task) =>
      (filters.projectId === null || task.projectId === filters.projectId) &&
      matchesStatus(task, filters.status) &&
      (filters.priority === null || task.priority === filters.priority) &&
      (filters.due === null || matchesDue(task, filters.due, today)) &&
      (filters.tag === null || task.tags.some((tag) => sameTag(tag, filters.tag ?? ''))),
  );
}

function matchesStatus(task: Task, status: StatusFilter | null): boolean {
  if (status === null) return true;
  return status === 'open' ? task.status !== 'done' : task.status === status;
}

function matchesDue(task: Task, due: DueFilter, today: Date): boolean {
  const todayIso = toISODate(today);
  switch (due) {
    case 'overdue':
      return isOverdue(task, today);
    case 'today':
      return task.dueDate === todayIso;
    case 'week':
      return task.dueDate !== null && task.dueDate >= todayIso && task.dueDate <= toISODate(addDays(today, 6));
    case 'none':
      return task.dueDate === null;
  }
}

// ── Ordenação da Lista ──────────────────────────────────────────────────────

export const SORT_KEYS = ['title', 'project', 'status', 'priority', 'dueDate', 'progress'] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = 'asc' | 'desc';
export interface TaskSort {
  key: SortKey;
  dir: SortDir;
}

/** Sentido do primeiro clique em cada coluna: o que a pessoa quase sempre quer ver primeiro. */
export const NATURAL_DIR: Record<SortKey, SortDir> = {
  title: 'asc',
  project: 'asc',
  status: 'asc',
  priority: 'desc', // urgente primeiro
  dueDate: 'asc', // mais próxima primeiro
  progress: 'desc',
};

/** Clique no cabeçalho: sentido natural → invertido → volta à ordem padrão. */
export function cycleSort(current: TaskSort | null, key: SortKey): TaskSort | null {
  if (current?.key !== key) return { key, dir: NATURAL_DIR[key] };
  return current.dir === NATURAL_DIR[key] ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : null;
}

/** null = ordem padrão (status, data, ordem manual). Tarefas sem data ficam sempre no fim. */
export function sortTasks(tasks: readonly Task[], sort: TaskSort | null, projectNames: ReadonlyMap<ID, string>): Task[] {
  const sorted = [...tasks];
  if (!sort) return sorted.sort(compareTasksForList);
  const factor = sort.dir === 'asc' ? 1 : -1;
  return sorted.sort((a, b) => {
    if (sort.key === 'dueDate' && (a.dueDate === null) !== (b.dueDate === null)) return a.dueDate === null ? 1 : -1;
    return compareBy(sort.key, a, b, projectNames) * factor || compareTasksForList(a, b);
  });
}

function compareBy(key: SortKey, a: Task, b: Task, projectNames: ReadonlyMap<ID, string>): number {
  switch (key) {
    case 'title':
      return a.title.localeCompare(b.title, 'pt-BR');
    case 'project':
      return (projectNames.get(a.projectId) ?? '').localeCompare(projectNames.get(b.projectId) ?? '', 'pt-BR');
    case 'status':
      return statusRank(a.status) - statusRank(b.status);
    case 'priority':
      return PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority);
    case 'dueDate':
      return (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
    case 'progress':
      return taskProgress(a) - taskProgress(b);
  }
}
