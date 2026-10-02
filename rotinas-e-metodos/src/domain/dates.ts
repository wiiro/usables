import { differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ISODate, Recurrence } from '../types/common';
import type { TaskStatus } from '../types/work';

// Datas de calendário (dueDate, startDate…) são strings 'AAAA-MM-DD' no
// horário local. Comparar duas delas como texto dá a ordem cronológica certa.

export function toISODate(date: Date): ISODate {
  return format(date, 'yyyy-MM-dd');
}

/** 'AAAA-MM-DD' → Date à meia-noite local; null se o texto não for uma data. */
export function parseISODate(value: ISODate): Date | null {
  const date = parseISO(value);
  return isValid(date) ? date : null;
}

/** "10 out" no ano corrente, "10 out 2027" em outro ano. */
export function formatShortDate(value: ISODate, today: Date): string {
  const date = parseISODate(value);
  if (!date) return value;
  const pattern = date.getFullYear() === today.getFullYear() ? 'd MMM' : 'd MMM yyyy';
  return format(date, pattern, { locale: ptBR });
}

/** "10 de outubro de 2026". */
export function formatLongDate(value: ISODate): string {
  const date = parseISODate(value);
  return date ? format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : value;
}

/** Rótulo de dia para registros cronológicos: "Hoje", "Ontem", "segunda, 28 set". */
export function formatDayLabel(value: ISODate, today: Date): string {
  const date = parseISODate(value);
  if (!date) return value;
  const days = differenceInCalendarDays(today, date);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  const pattern = date.getFullYear() === today.getFullYear() ? 'EEE, d MMM' : 'EEE, d MMM yyyy';
  return format(date, pattern, { locale: ptBR });
}

/** Dia local de um carimbo ISO completo (createdAt → 'AAAA-MM-DD'). */
export function dateOfTimestamp(timestamp: string): ISODate {
  return toISODate(new Date(timestamp));
}

/** Dias corridos de `from` até `to` (datas 'AAAA-MM-DD'); 0 se alguma for inválida. */
export function daysBetween(from: ISODate, to: ISODate): number {
  const start = parseISODate(from);
  const end = parseISODate(to);
  return start && end ? differenceInCalendarDays(end, start) : 0;
}

interface DueItem {
  dueDate: ISODate | null;
  status: TaskStatus;
  recurrence: Recurrence | null;
}

/**
 * Data já passou e não está Feito. Itens recorrentes nunca contam como
 * atrasados: uma tarefa diária geraria uma lista sem fim de atrasos.
 */
export function isOverdue(item: DueItem, today: Date): boolean {
  if (item.recurrence || !item.dueDate || item.status === 'done') return false;
  return item.dueDate < toISODate(today);
}

/** Mesma regra para tópicos de estudo, pela data planejada. */
export function isTopicOverdue(
  topic: { plannedDate: ISODate | null; status: string; recurrence: Recurrence | null },
  today: Date,
): boolean {
  if (topic.recurrence || !topic.plannedDate || topic.status === 'done') return false;
  return topic.plannedDate < toISODate(today);
}
