import type { BaseEntity, ID, ISODate, Recurrence } from './common';

// As listas de valores são a fonte única: os tipos, a validação (stateSchema)
// e as telas (colunas do Kanban, filtros) derivam delas.
export const TASK_STATUSES = ['todo', 'doing', 'blocked', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface Project extends BaseEntity {
  name: string;
  description: string;
  /** Cor em hexadecimal, ex. '#2563eb'. */
  color: string;
  startDate: ISODate | null;
  dueDate: ISODate | null;
  /** Seção "Anotações", em Markdown. */
  notes: string;
}

export interface Subtask {
  id: ID;
  title: string;
  done: boolean;
}

export interface Task extends BaseEntity {
  projectId: ID;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: ISODate | null;
  tags: string[];
  /** Gravadas dentro da própria tarefa: sempre lidas e salvas junto com ela. */
  subtasks: Subtask[];
  /** Seção "Anotações", em Markdown. */
  notes: string;
  recurrence: Recurrence | null;
  /** Datas das ocorrências marcadas como feitas (só para tarefas recorrentes). */
  completedOccurrences: ISODate[];
  /** Posição dentro da coluna do Kanban (menor = mais acima). */
  order: number;
}
