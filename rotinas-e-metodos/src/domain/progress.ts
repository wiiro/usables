import type { Topic } from '../types/study';
import type { Task } from '../types/work';

// Progresso é sempre calculado na hora, nunca gravado: assim não tem como
// ficar desatualizado em relação às subtarefas, tarefas e tópicos.
// As funções devolvem uma fração de 0 a 1; toPercent converte para exibir.

type ProgressInput = Pick<Task, 'status' | 'subtasks'>;

/**
 * Com subtarefas: concluídas ÷ total, independente do status.
 * Sem subtarefas: 1 se a tarefa está "Feito", senão 0.
 */
export function taskProgress(task: ProgressInput): number {
  const total = task.subtasks.length;
  if (total === 0) return task.status === 'done' ? 1 : 0;
  const done = task.subtasks.filter((subtask) => subtask.done).length;
  return done / total;
}

/** Média do progresso das tarefas; null quando o projeto ainda não tem tarefas. */
export function projectProgress(tasks: readonly ProgressInput[]): number | null {
  if (tasks.length === 0) return null;
  const sum = tasks.reduce((acc, task) => acc + taskProgress(task), 0);
  return sum / tasks.length;
}

/** Tópicos concluídos ÷ total; null quando a matéria ainda não tem tópicos. */
export function subjectProgress(topics: readonly Pick<Topic, 'status'>[]): number | null {
  if (topics.length === 0) return null;
  const done = topics.filter((topic) => topic.status === 'done').length;
  return done / topics.length;
}

/** Fração → porcentagem inteira para exibir (2/3 → 67). */
export function toPercent(ratio: number): number {
  return Math.round(ratio * 100);
}
