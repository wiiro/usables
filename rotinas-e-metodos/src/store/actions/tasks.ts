import type { ID, ISODate, ISODateTime, Recurrence } from '../../types/common';
import type { AppState } from '../../types/state';
import type { Subtask, Task, TaskStatus } from '../../types/work';
import { compareByOrder } from '../../domain/taskSort';
import type { CreateMeta } from './common';
import { findById, removeSectionsOf } from './common';
import { applyRecurrence, clearRecurrence, setOccurrenceDone } from './recurring';

/** Campos que podem ser trocados livremente. Data e recorrência têm ações próprias por causa das regras entre elas. */
export type TaskPatch = Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'tags' | 'projectId' | 'notes'>>;

export function createTask(
  draft: AppState,
  input: { projectId: ID; title: string; dueDate?: ISODate | null },
  { id, now }: CreateMeta,
): void {
  findById(draft.projects, input.projectId, 'Projeto');
  // Entra no fim: maior ordem existente + 1.
  const order = draft.tasks.reduce((max, task) => Math.max(max, task.order), 0) + 1;
  draft.tasks.push({
    id,
    createdAt: now,
    updatedAt: now,
    projectId: input.projectId,
    title: input.title.trim(),
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: input.dueDate ?? null,
    tags: [],
    subtasks: [],
    notes: '',
    recurrence: null,
    completedOccurrences: [],
    order,
  });
}

export function updateTask(draft: AppState, id: ID, patch: TaskPatch, now: ISODateTime): void {
  const task = findById(draft.tasks, id, 'Tarefa');
  if (patch.projectId !== undefined) findById(draft.projects, patch.projectId, 'Projeto');
  Object.assign(task, patch, { updatedAt: now });
}

/** Tirar a data também tira a repetição, que começa nela. */
export function setTaskDueDate(draft: AppState, id: ID, dueDate: ISODate | null, now: ISODateTime): void {
  const task = findById(draft.tasks, id, 'Tarefa');
  task.dueDate = dueDate;
  if (!dueDate) clearRecurrence(task);
  task.updatedAt = now;
}

export function setTaskRecurrence(draft: AppState, id: ID, recurrence: Recurrence | null, now: ISODateTime): void {
  const task = findById(draft.tasks, id, 'Tarefa');
  applyRecurrence(task, task.dueDate, recurrence, 'data de entrega');
  task.updatedAt = now;
}

/** Ocorrência de uma tarefa recorrente marcada (ou desmarcada) como feita. */
export function setTaskOccurrenceDone(draft: AppState, id: ID, date: ISODate, done: boolean, now: ISODateTime): void {
  const task = findById(draft.tasks, id, 'Tarefa');
  setOccurrenceDone(task, task.dueDate, date, done);
  task.updatedAt = now;
}

/** Abaixo disso, a média entre vizinhos começa a perder precisão: renumera tudo. */
const MIN_ORDER_GAP = 1e-6;

export interface MoveTarget {
  status: TaskStatus;
  /** Tarefas que ficam imediatamente acima e abaixo na coluna (null = início/fim). */
  prevId: ID | null;
  nextId: ID | null;
}

/** Kanban: muda o status e põe a tarefa entre os vizinhos indicados. */
export function moveTask(draft: AppState, id: ID, target: MoveTarget, now: ISODateTime): void {
  const task = findById(draft.tasks, id, 'Tarefa');
  let order = orderBetween(draft, target, task.order);
  if (order === null) {
    renumberOrders(draft);
    order = orderBetween(draft, target, task.order) ?? task.order;
  }
  task.status = target.status;
  task.order = order;
  task.updatedAt = now;
}

function orderBetween(draft: AppState, { prevId, nextId }: MoveTarget, current: number): number | null {
  const prev = prevId ? findById(draft.tasks, prevId, 'Tarefa').order : null;
  const next = nextId ? findById(draft.tasks, nextId, 'Tarefa').order : null;
  if (prev !== null && next !== null) return next - prev < MIN_ORDER_GAP ? null : (prev + next) / 2;
  if (prev !== null) return prev + 1;
  if (next !== null) return next - 1;
  return current;
}

/** Reescreve as ordens como 1, 2, 3… mantendo a sequência atual de todas as tarefas. */
function renumberOrders(draft: AppState): void {
  [...draft.tasks].sort(compareByOrder).forEach((task, index) => {
    task.order = index + 1;
  });
}

/** Exclui a tarefa e as seções dela (ideias, bloqueios, avanços). */
export function deleteTask(draft: AppState, id: ID): void {
  findById(draft.tasks, id, 'Tarefa');
  draft.tasks = draft.tasks.filter((task) => task.id !== id);
  removeSectionsOf(draft, 'task', new Set([id]));
}

export function addSubtask(draft: AppState, taskId: ID, title: string, { id, now }: CreateMeta): void {
  const trimmed = title.trim();
  if (!trimmed) return;
  const task = findById(draft.tasks, taskId, 'Tarefa');
  task.subtasks.push({ id, title: trimmed, done: false });
  task.updatedAt = now;
}

export function updateSubtask(
  draft: AppState,
  taskId: ID,
  subtaskId: ID,
  patch: Partial<Pick<Subtask, 'title' | 'done'>>,
  now: ISODateTime,
): void {
  const task = findById(draft.tasks, taskId, 'Tarefa');
  Object.assign(findById(task.subtasks, subtaskId, 'Subtarefa'), patch);
  task.updatedAt = now;
}

export function removeSubtask(draft: AppState, taskId: ID, subtaskId: ID, now: ISODateTime): void {
  const task = findById(draft.tasks, taskId, 'Tarefa');
  findById(task.subtasks, subtaskId, 'Subtarefa');
  task.subtasks = task.subtasks.filter((subtask) => subtask.id !== subtaskId);
  task.updatedAt = now;
}
