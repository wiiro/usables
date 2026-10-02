import type { ID, ISODate, Recurrence } from '../types/common';
import type { AppState } from '../types/state';
import { daysBetween, isOverdue, isTopicOverdue, toISODate } from './dates';
import { projectName, subjectName, taskTitle, topicTitle } from './labels';
import { occursOn } from './recurrence';

// Regras da tela Hoje: o que vence hoje e o que está atrasado, juntando
// tarefas (data de entrega) e tópicos de estudo (data planejada).

export interface AgendaItem {
  kind: 'task' | 'topic';
  id: ID;
  title: string;
  parentName: string;
  parentColor: string;
  /** Data do item (para atrasados) ou de hoje (para recorrentes). */
  date: ISODate;
  done: boolean;
  /** Recorrente: marcar como feito vale só para a ocorrência de hoje. */
  recurring: boolean;
}

interface DatedItem {
  id: ID;
  title: string;
  date: ISODate | null;
  done: boolean;
  recurrence: Recurrence | null;
  completedOccurrences: ISODate[];
}

/** Vence hoje: data = hoje, ou recorrente com ocorrência hoje (série não encerrada). */
function dueTodayEntry(item: DatedItem, today: ISODate): { done: boolean; recurring: boolean } | null {
  if (!item.date) return null;
  if (item.recurrence) {
    if (item.done || !occursOn(item.recurrence, item.date, today)) return null;
    return { done: item.completedOccurrences.includes(today), recurring: true };
  }
  return item.date === today ? { done: item.done, recurring: false } : null;
}

function datedItems(state: Pick<AppState, 'tasks' | 'topics' | 'projects' | 'subjects'>) {
  const projects = new Map(state.projects.map((p) => [p.id, p]));
  const subjects = new Map(state.subjects.map((s) => [s.id, s]));
  const tasks = state.tasks.map((task) => {
    const project = projects.get(task.projectId);
    return {
      kind: 'task' as const,
      item: { ...task, title: taskTitle(task), date: task.dueDate, done: task.status === 'done' },
      parentName: project ? projectName(project) : '',
      parentColor: project?.color ?? '#64748b',
      overdue: (today: Date) => isOverdue(task, today),
    };
  });
  const topics = state.topics.map((topic) => {
    const subject = subjects.get(topic.subjectId);
    return {
      kind: 'topic' as const,
      item: { ...topic, title: topicTitle(topic), date: topic.plannedDate, done: topic.status === 'done' },
      parentName: subject ? subjectName(subject) : '',
      parentColor: subject?.color ?? '#64748b',
      overdue: (today: Date) => isTopicOverdue(topic, today),
    };
  });
  return [...tasks, ...topics];
}

export interface Agenda {
  dueToday: AgendaItem[];
  overdue: AgendaItem[];
}

export function buildAgenda(state: Pick<AppState, 'tasks' | 'topics' | 'projects' | 'subjects'>, today: Date): Agenda {
  const todayIso = toISODate(today);
  const dueToday: AgendaItem[] = [];
  const overdue: AgendaItem[] = [];

  for (const { kind, item, parentName, parentColor, overdue: isLate } of datedItems(state)) {
    const base = { kind, id: item.id, title: item.title, parentName, parentColor };
    const entry = dueTodayEntry(item, todayIso);
    if (entry) dueToday.push({ ...base, date: todayIso, ...entry });
    else if (isLate(today) && item.date) overdue.push({ ...base, date: item.date, done: false, recurring: false });
  }

  // Pendentes primeiro, depois os já feitos hoje; atrasados do mais antigo ao mais recente.
  dueToday.sort((a, b) => Number(a.done) - Number(b.done) || a.title.localeCompare(b.title, 'pt-BR'));
  overdue.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'pt-BR'));
  return { dueToday, overdue };
}

/** "atrasado há 1 dia", "atrasado há 5 dias". */
export function lateLabel(date: ISODate, today: Date): string {
  const days = daysBetween(date, toISODate(today));
  return days === 1 ? 'há 1 dia' : `há ${days} dias`;
}
