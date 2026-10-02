import { describe, expect, it } from 'vitest';
import type { Recurrence } from '../types/common';
import { describeRecurrence, normalizeWeekdays, occursOn, recurrenceFor, weekdayOf } from './recurrence';

describe('weekdayOf', () => {
  it('dia da semana da data (2026-10-01 é quinta)', () => {
    expect(weekdayOf('2026-10-01')).toBe(4);
    expect(weekdayOf('inválida')).toBeNull();
  });
});

describe('recurrenceFor', () => {
  it('semanal começa no dia da semana da data inicial', () => {
    expect(recurrenceFor('weekly', '2026-10-05')).toEqual({ freq: 'weekly', weekdays: [1] });
  });

  it('diária e mensal não têm parâmetros', () => {
    expect(recurrenceFor('daily', '2026-10-05')).toEqual({ freq: 'daily' });
    expect(recurrenceFor('monthly', '2026-10-05')).toEqual({ freq: 'monthly' });
  });
});

describe('normalizeWeekdays', () => {
  it('ordena e tira repetidos', () => {
    expect(normalizeWeekdays([5, 1, 5, 0])).toEqual([0, 1, 5]);
  });
});

describe('occursOn', () => {
  it('nada antes do início', () => {
    expect(occursOn({ freq: 'daily' }, '2026-10-05', '2026-10-04')).toBe(false);
  });

  it('diária: todo dia a partir do início', () => {
    expect(occursOn({ freq: 'daily' }, '2026-10-05', '2026-10-05')).toBe(true);
    expect(occursOn({ freq: 'daily' }, '2026-10-05', '2027-01-01')).toBe(true);
  });

  it('semanal: só nos dias marcados, inclusive no próprio início', () => {
    const weekly: Recurrence = { freq: 'weekly', weekdays: [1, 3] }; // seg e qua
    expect(occursOn(weekly, '2026-10-05', '2026-10-05')).toBe(true); // seg
    expect(occursOn(weekly, '2026-10-05', '2026-10-07')).toBe(true); // qua
    expect(occursOn(weekly, '2026-10-05', '2026-10-06')).toBe(false); // ter
    // Início numa quinta que não está marcada: a quinta não conta.
    expect(occursOn(weekly, '2026-10-01', '2026-10-01')).toBe(false);
  });

  it('mensal: mesmo dia; nos meses curtos, o último dia', () => {
    expect(occursOn({ freq: 'monthly' }, '2026-01-15', '2026-02-15')).toBe(true);
    expect(occursOn({ freq: 'monthly' }, '2026-01-15', '2026-02-16')).toBe(false);
    expect(occursOn({ freq: 'monthly' }, '2026-01-31', '2026-02-28')).toBe(true);
    expect(occursOn({ freq: 'monthly' }, '2026-01-31', '2026-04-30')).toBe(true);
    expect(occursOn({ freq: 'monthly' }, '2026-01-31', '2026-04-29')).toBe(false);
    expect(occursOn({ freq: 'monthly' }, '2026-01-30', '2028-02-29')).toBe(true); // bissexto
  });
});

describe('describeRecurrence', () => {
  it('diária', () => {
    expect(describeRecurrence({ freq: 'daily' }, '2026-10-01')).toBe('Repete todos os dias.');
  });

  it('semanal lista os dias em ordem', () => {
    expect(describeRecurrence({ freq: 'weekly', weekdays: [3, 1] }, '2026-10-01')).toBe('Repete toda segunda e quarta.');
    expect(describeRecurrence({ freq: 'weekly', weekdays: [1, 3, 5] }, '2026-10-01')).toBe(
      'Repete toda segunda, quarta e sexta.',
    );
  });

  it('mensal avisa sobre os meses curtos a partir do dia 29', () => {
    expect(describeRecurrence({ freq: 'monthly' }, '2026-10-10')).toBe('Repete todo dia 10 do mês.');
    expect(describeRecurrence({ freq: 'monthly' }, '2026-10-31')).toBe(
      'Repete todo dia 31 do mês (nos meses mais curtos, no último dia).',
    );
  });
});
