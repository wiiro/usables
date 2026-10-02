import { normalizeWeekdays, occursOn } from '../../domain/recurrence';
import type { ISODate, Recurrence } from '../../types/common';

// Regras de repetição comuns a tarefas (data de entrega) e tópicos (data planejada).

interface Recurring {
  recurrence: Recurrence | null;
  completedOccurrences: ISODate[];
}

export function clearRecurrence(item: Recurring): void {
  item.recurrence = null;
  item.completedOccurrences = [];
}

/**
 * Aplica a regra (null remove). A série começa em `startDate`, que precisa
 * existir; `dateLabel` é o nome dessa data na mensagem de erro.
 */
export function applyRecurrence(
  item: Recurring,
  startDate: ISODate | null,
  recurrence: Recurrence | null,
  dateLabel: string,
): void {
  if (!recurrence) {
    clearRecurrence(item);
    return;
  }
  if (!startDate) throw new Error(`A repetição precisa de uma ${dateLabel}.`);
  if (recurrence.freq === 'weekly') {
    const weekdays = normalizeWeekdays(recurrence.weekdays);
    if (weekdays.length === 0) throw new Error('A repetição semanal precisa de ao menos um dia.');
    item.recurrence = { freq: 'weekly', weekdays };
  } else {
    item.recurrence = recurrence;
  }
}

/** Marca ou desmarca uma ocorrência como feita. A data precisa ser uma ocorrência da série. */
export function setOccurrenceDone(item: Recurring, startDate: ISODate | null, date: ISODate, done: boolean): void {
  if (!item.recurrence || !startDate || !occursOn(item.recurrence, startDate, date)) {
    throw new Error(`${date} não é uma ocorrência deste item.`);
  }
  const others = item.completedOccurrences.filter((d) => d !== date);
  item.completedOccurrences = done ? [...others, date].sort() : others;
}
