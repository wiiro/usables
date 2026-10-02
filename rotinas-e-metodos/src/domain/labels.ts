import type { Weekday } from '../types/common';
import type { TopicStatus } from '../types/study';
import type { Priority, TaskStatus } from '../types/work';
import type { DueFilter, StatusFilter } from './taskFilters';

// Todos os textos em pt-BR dos valores internos ficam aqui.

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'A fazer',
  doing: 'Fazendo',
  blocked: 'Bloqueado',
  done: 'Feito',
};

export const TOPIC_STATUS_LABELS: Record<TopicStatus, string> = {
  not_started: 'Não iniciado',
  studying: 'Estudando',
  done: 'Concluído',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

export const STATUS_FILTER_LABELS: Record<StatusFilter, string> = { open: 'Em aberto', ...TASK_STATUS_LABELS };

export const DUE_FILTER_LABELS: Record<DueFilter, string> = {
  overdue: 'Atrasadas',
  today: 'Vencem hoje',
  week: 'Próximos 7 dias',
  none: 'Sem data',
};

export const WEEKDAY_LABELS: Record<Weekday, { short: string; long: string }> = {
  0: { short: 'D', long: 'domingo' },
  1: { short: 'S', long: 'segunda' },
  2: { short: 'T', long: 'terça' },
  3: { short: 'Q', long: 'quarta' },
  4: { short: 'Q', long: 'quinta' },
  5: { short: 'S', long: 'sexta' },
  6: { short: 'S', long: 'sábado' },
};

/** Nome para exibir: um projeto com o nome apagado não some da tela. */
export function projectName(project: { name: string }): string {
  return project.name.trim() || 'Projeto sem nome';
}

export function taskTitle(task: { title: string }): string {
  return task.title.trim() || 'Tarefa sem título';
}

export function subjectName(subject: { name: string }): string {
  return subject.name.trim() || 'Matéria sem nome';
}

export function topicTitle(topic: { title: string }): string {
  return topic.title.trim() || 'Tópico sem título';
}

/** "Sem tópicos", "1 de 1 tópico concluído", "3 de 8 tópicos concluídos". */
export function topicCountLabel(topics: readonly { status: TopicStatus }[]): string {
  if (topics.length === 0) return 'Sem tópicos';
  const done = topics.filter((topic) => topic.status === 'done').length;
  return topics.length === 1 ? `${done} de 1 tópico concluído` : `${done} de ${topics.length} tópicos concluídos`;
}

/** "Sem tarefas", "0 de 1 tarefa feita", "3 de 8 tarefas feitas". */
export function taskCountLabel(tasks: readonly { status: TaskStatus }[]): string {
  if (tasks.length === 0) return 'Sem tarefas';
  const done = tasks.filter((task) => task.status === 'done').length;
  return tasks.length === 1 ? `${done} de 1 tarefa feita` : `${done} de ${tasks.length} tarefas feitas`;
}
