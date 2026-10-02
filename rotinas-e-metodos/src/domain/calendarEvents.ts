import type { ID, ISODate } from '../types/common';
import type { AppState, CalendarArea } from '../types/state';
import { readableTextColor } from './colors';
import { taskTitle, topicTitle } from './labels';
import type { RRuleInput } from './recurrence';
import { toRRuleInput } from './recurrence';

// Tarefas e tópicos → eventos do FullCalendar. Função pura: o componente só
// entrega o resultado ao calendário. Tudo é evento de dia inteiro.

export type CalendarItemKind = 'task' | 'topic';

export interface CalendarEventData {
  kind: CalendarItemKind;
  itemId: ID;
  /** Ocorrências já feitas (só recorrentes): o calendário as mostra esmaecidas. */
  completedOccurrences: ISODate[];
  /** Item concluído (status Feito/Concluído): esmaecido inteiro. */
  done: boolean;
  recurring: boolean;
}

export interface CalendarEventInput {
  id: string;
  title: string;
  allDay: true;
  start?: ISODate;
  rrule?: RRuleInput;
  /** Recorrentes não são arrastáveis: mudar a série é pelo painel (decisão do projeto). */
  editable: boolean;
  color: string;
  contrastColor: string;
  className: string;
  extendedProps: CalendarEventData;
}

interface Datable {
  id: ID;
  date: ISODate | null;
  title: string;
  color: string;
  done: boolean;
  recurrence: AppState['tasks'][number]['recurrence'];
  completedOccurrences: ISODate[];
}

function toEvent(kind: CalendarItemKind, item: Datable): CalendarEventInput | null {
  if (!item.date) return null;
  const recurring = item.recurrence !== null;
  return {
    id: `${kind}:${item.id}`,
    title: item.title,
    allDay: true,
    ...(item.recurrence ? { rrule: toRRuleInput(item.recurrence, item.date) } : { start: item.date }),
    editable: !recurring,
    color: item.color,
    contrastColor: readableTextColor(item.color),
    className: `cal-${kind}`,
    extendedProps: { kind, itemId: item.id, completedOccurrences: item.completedOccurrences, done: item.done, recurring },
  };
}

/** Eventos da área pedida. Itens sem data não aparecem. */
export function buildCalendarEvents(
  state: Pick<AppState, 'tasks' | 'topics' | 'projects' | 'subjects'>,
  area: CalendarArea,
): CalendarEventInput[] {
  const events: (CalendarEventInput | null)[] = [];
  if (area !== 'study') {
    const colors = new Map(state.projects.map((p) => [p.id, p.color]));
    for (const task of state.tasks) {
      events.push(
        toEvent('task', {
          ...task,
          date: task.dueDate,
          title: taskTitle(task),
          color: colors.get(task.projectId) ?? '#64748b',
          done: task.status === 'done',
        }),
      );
    }
  }
  if (area !== 'work') {
    const colors = new Map(state.subjects.map((s) => [s.id, s.color]));
    for (const topic of state.topics) {
      events.push(
        toEvent('topic', {
          ...topic,
          date: topic.plannedDate,
          title: topicTitle(topic),
          color: colors.get(topic.subjectId) ?? '#64748b',
          done: topic.status === 'done',
        }),
      );
    }
  }
  return events.filter((event): event is CalendarEventInput => event !== null);
}
