import { getDaysInMonth } from 'date-fns';
import type { ISODate, Recurrence, Weekday } from '../types/common';
import { WEEKDAYS } from '../types/common';
import { parseISODate } from './dates';
import { WEEKDAY_LABELS } from './labels';

// Regras de recorrência que não dependem do calendário. A conversão para
// rrule (ocorrências no calendário) entra na Etapa 6.

export type RecurrenceFreq = Recurrence['freq'];

/** Dia da semana de uma data 'AAAA-MM-DD' (0 = domingo); null se a data for inválida. */
export function weekdayOf(value: ISODate): Weekday | null {
  const date = parseISODate(value);
  return date ? WEEKDAYS[date.getDay()] : null;
}

/** Regra nova ao trocar a frequência; a semanal começa no dia da semana da data inicial. */
export function recurrenceFor(freq: RecurrenceFreq, startDate: ISODate): Recurrence {
  if (freq === 'weekly') return { freq, weekdays: [weekdayOf(startDate) ?? 1] };
  return { freq };
}

/** Dias sem repetição e em ordem (domingo primeiro). */
export function normalizeWeekdays(weekdays: readonly Weekday[]): Weekday[] {
  return [...new Set(weekdays)].sort((a, b) => a - b);
}

/**
 * A série cai nesta data? Mesma regra que o calendário desenha: diária todo
 * dia a partir do início; semanal nos dias marcados (o dia do início só conta
 * se estiver marcado); mensal no dia do início, ou no último dia dos meses
 * mais curtos.
 */
export function occursOn(recurrence: Recurrence, startDate: ISODate, date: ISODate): boolean {
  if (date < startDate) return false;
  const day = parseISODate(date);
  const start = parseISODate(startDate);
  if (!day || !start) return false;
  switch (recurrence.freq) {
    case 'daily':
      return true;
    case 'weekly':
      return recurrence.weekdays.includes(WEEKDAYS[day.getDay()]);
    case 'monthly':
      return day.getDate() === Math.min(start.getDate(), getDaysInMonth(day));
  }
}

const RRULE_WEEKDAYS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'] as const;

/** Regra no formato do plugin rrule do FullCalendar (campos da biblioteca rrule). */
export interface RRuleInput {
  freq: 'daily' | 'weekly' | 'monthly';
  dtstart: ISODate;
  byweekday?: (typeof RRULE_WEEKDAYS)[number][];
  bymonthday?: number[];
  bysetpos?: number;
}

/**
 * Converte a regra para o calendário, com o mesmo resultado de occursOn.
 * Mensal a partir do dia 29: "o último entre os dias 28…D que existirem no
 * mês" (bymonthday + bysetpos -1) — assim o dia 31 cai no dia 30 em abril e
 * no 28/29 em fevereiro, em vez de pular o mês.
 */
export function toRRuleInput(recurrence: Recurrence, startDate: ISODate): RRuleInput {
  switch (recurrence.freq) {
    case 'daily':
      return { freq: 'daily', dtstart: startDate };
    case 'weekly':
      return { freq: 'weekly', dtstart: startDate, byweekday: normalizeWeekdays(recurrence.weekdays).map((d) => RRULE_WEEKDAYS[d]) };
    case 'monthly': {
      const day = parseISODate(startDate)?.getDate() ?? 1;
      if (day <= 28) return { freq: 'monthly', dtstart: startDate, bymonthday: [day] };
      const candidates = Array.from({ length: day - 27 }, (_, i) => 28 + i);
      return { freq: 'monthly', dtstart: startDate, bymonthday: candidates, bysetpos: -1 };
    }
  }
}

/** Frase para mostrar abaixo do campo, ex.: "Repete toda segunda e quarta." */
export function describeRecurrence(recurrence: Recurrence, startDate: ISODate): string {
  switch (recurrence.freq) {
    case 'daily':
      return 'Repete todos os dias.';
    case 'weekly':
      return `Repete toda ${joinPt(normalizeWeekdays(recurrence.weekdays).map((day) => WEEKDAY_LABELS[day].long))}.`;
    case 'monthly':
      return describeMonthly(startDate);
  }
}

function describeMonthly(startDate: ISODate): string {
  const day = parseISODate(startDate)?.getDate();
  if (!day) return 'Repete todo mês.';
  const base = `Repete todo dia ${day} do mês`;
  return day >= 29 ? `${base} (nos meses mais curtos, no último dia).` : `${base}.`;
}

/** ["a", "b", "c"] → "a, b e c". */
function joinPt(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}
