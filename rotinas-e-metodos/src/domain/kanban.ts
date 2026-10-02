import type { ID } from '../types/common';
import type { Blocker } from '../types/sections';
import type { Task, TaskStatus } from '../types/work';
import { TASK_STATUSES } from '../types/work';
import { compareByOrder } from './taskSort';

// Lógica do quadro Kanban, sem React nem dnd-kit: as colunas são listas de
// ids por status. Durante o arraste, a tela trabalha numa cópia destas
// colunas; só ao soltar a mudança vai para o estado (ver useKanbanDrag).

export type Columns = Record<TaskStatus, ID[]>;

const COLUMN_PREFIX = 'coluna:';

/** Id do alvo "coluna" no arraste (para soltar numa coluna vazia ou no fim dela). */
export const columnDropId = (status: TaskStatus) => `${COLUMN_PREFIX}${status}`;

function parseColumnDropId(id: string): TaskStatus | null {
  if (!id.startsWith(COLUMN_PREFIX)) return null;
  return TASK_STATUSES.find((status) => status === id.slice(COLUMN_PREFIX.length)) ?? null;
}

export function buildColumns(tasks: readonly Task[]): Columns {
  const sorted = [...tasks].sort(compareByOrder);
  const columns = Object.fromEntries(TASK_STATUSES.map((status) => [status, [] as ID[]])) as Columns;
  for (const task of sorted) columns[task.status].push(task.id);
  return columns;
}

/** Coluna de um cartão, ou a própria coluna se o id for de coluna. */
export function findColumn(columns: Columns, id: string): TaskStatus | null {
  return parseColumnDropId(id) ?? TASK_STATUSES.find((status) => columns[status].includes(id)) ?? null;
}

/**
 * Enquanto arrasta: se o cartão passou por cima de outra coluna, ele muda
 * de coluna na cópia (na posição do cartão de baixo, ou no fim). Devolve as
 * mesmas colunas quando não há mudança, para não redesenhar à toa.
 */
export function moveAcross(columns: Columns, activeId: ID, overId: string): Columns {
  const from = findColumn(columns, activeId);
  const to = findColumn(columns, overId);
  if (!from || !to || from === to) return columns;

  const target = columns[to];
  const overIndex = target.indexOf(overId);
  const insertAt = overIndex === -1 ? target.length : overIndex;
  return {
    ...columns,
    [from]: columns[from].filter((id) => id !== activeId),
    [to]: [...target.slice(0, insertAt), activeId, ...target.slice(insertAt)],
  };
}

export interface DropResult {
  status: TaskStatus;
  /** Vizinhos na posição final, para calcular a nova ordem. */
  prevId: ID | null;
  nextId: ID | null;
}

/**
 * Ao soltar: posição final dentro da coluna. Devolve null se o cartão
 * terminou exatamente onde começou (nada a gravar).
 */
export function settleDrop(original: Columns, preview: Columns, activeId: ID, overId: string): DropResult | null {
  const status = findColumn(preview, activeId);
  if (!status) return null;

  let ids = preview[status];
  const from = ids.indexOf(activeId);
  const over = ids.indexOf(overId);
  if (over !== -1 && over !== from) {
    ids = [...ids];
    ids.splice(from, 1);
    ids.splice(over, 0, activeId);
  }

  const index = ids.indexOf(activeId);
  // Mesma coluna e mesmo índice de antes: nada mudou. (Em outra coluna, indexOf dá -1.)
  if (original[status].indexOf(activeId) === index) return null;
  return { status, prevId: ids[index - 1] ?? null, nextId: ids[index + 1] ?? null };
}

/** Tarefas com pelo menos um bloqueio ativo registrado nelas (ícone no cartão). */
export function tasksWithActiveBlocker(blockers: readonly Blocker[]): Set<ID> {
  return new Set(blockers.filter((b) => b.ownerType === 'task' && b.status === 'active').map((b) => b.ownerId));
}
