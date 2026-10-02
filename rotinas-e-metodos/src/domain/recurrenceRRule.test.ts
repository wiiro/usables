import { addDays, format } from 'date-fns';
import { RRule } from 'rrule';
import type { Options } from 'rrule';
import { describe, expect, it } from 'vitest';
import type { ISODate, Recurrence } from '../types/common';
import type { RRuleInput } from './recurrence';
import { occursOn, toRRuleInput } from './recurrence';

// Garante que o calendário (que desenha pela biblioteca rrule) e o resto do
// app (que decide por occursOn: tela Hoje, marcar ocorrência) concordam
// sobre quais dias são ocorrências. Compara os dois ao longo de um ano.

const FREQ = { daily: RRule.DAILY, weekly: RRule.WEEKLY, monthly: RRule.MONTHLY };
const WEEKDAY = { su: RRule.SU, mo: RRule.MO, tu: RRule.TU, we: RRule.WE, th: RRule.TH, fr: RRule.FR, sa: RRule.SA };

/** A biblioteca rrule trata datas como UTC "flutuante": dia D = Date.UTC(D). */
const utc = (iso: ISODate) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const isoOfUtc = (date: Date) => date.toISOString().slice(0, 10);

function rruleDates(input: RRuleInput, from: ISODate, to: ISODate): ISODate[] {
  const options: Partial<Options> = {
    freq: FREQ[input.freq],
    dtstart: utc(input.dtstart),
    byweekday: input.byweekday?.map((d) => WEEKDAY[d]),
    bymonthday: input.bymonthday,
    bysetpos: input.bysetpos,
  };
  return new RRule(options).between(utc(from), utc(to), true).map(isoOfUtc);
}

function occursOnDates(recurrence: Recurrence, start: ISODate, from: ISODate, days: number): ISODate[] {
  const result: ISODate[] = [];
  for (let i = 0; i <= days; i++) {
    const day = format(addDays(new Date(`${from}T12:00:00`), i), 'yyyy-MM-dd');
    if (occursOn(recurrence, start, day)) result.push(day);
  }
  return result;
}

const CASES: [string, Recurrence, ISODate][] = [
  ['diária', { freq: 'daily' }, '2026-10-05'],
  ['semanal seg/qua/sex', { freq: 'weekly', weekdays: [1, 3, 5] }, '2026-10-05'],
  ['semanal com início fora dos dias marcados', { freq: 'weekly', weekdays: [2] }, '2026-10-01'],
  ['mensal dia 15', { freq: 'monthly' }, '2026-01-15'],
  ['mensal dia 29', { freq: 'monthly' }, '2026-01-29'],
  ['mensal dia 30', { freq: 'monthly' }, '2026-01-30'],
  ['mensal dia 31', { freq: 'monthly' }, '2026-01-31'],
];

describe('toRRuleInput × occursOn', () => {
  it.each(CASES)('%s: mesmos dias ao longo de um ano', (_, recurrence, start) => {
    const from = '2025-12-20';
    const to = '2027-01-31';
    const days = 407;
    expect(rruleDates(toRRuleInput(recurrence, start), from, to)).toEqual(occursOnDates(recurrence, start, from, days));
  });

  it('mensal dia 31 cai em 30 de abril e 28 de fevereiro', () => {
    const dates = rruleDates(toRRuleInput({ freq: 'monthly' }, '2026-01-31'), '2026-02-01', '2026-04-30');
    expect(dates).toEqual(['2026-02-28', '2026-03-31', '2026-04-30']);
  });
});
