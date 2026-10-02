import { describe, expect, it } from 'vitest';
import {
  dateOfTimestamp, daysBetween, formatDayLabel, formatShortDate, isOverdue, parseISODate, toISODate,
} from './dates';

const today = new Date(2026, 9, 1); // 1 out 2026, horário local

describe('toISODate / parseISODate', () => {
  it('converte nos dois sentidos pelo horário local', () => {
    expect(toISODate(today)).toBe('2026-10-01');
    expect(parseISODate('2026-10-01')?.getDate()).toBe(1);
  });

  it('texto que não é data vira null', () => {
    expect(parseISODate('ontem')).toBeNull();
  });
});

describe('formatShortDate', () => {
  it('omite o ano corrente e mostra os outros', () => {
    expect(formatShortDate('2026-10-10', today)).toBe('10 out');
    expect(formatShortDate('2027-01-05', today)).toBe('5 jan 2027');
  });
});

describe('formatDayLabel', () => {
  it('Hoje, Ontem e depois dia da semana com data', () => {
    expect(formatDayLabel('2026-10-01', today)).toBe('Hoje');
    expect(formatDayLabel('2026-09-30', today)).toBe('Ontem');
    expect(formatDayLabel('2026-09-28', today)).toBe('segunda, 28 set');
    expect(formatDayLabel('2025-12-31', today)).toBe('quarta, 31 dez 2025');
  });
});

describe('daysBetween / dateOfTimestamp', () => {
  it('conta dias corridos entre datas', () => {
    expect(daysBetween('2026-09-28', '2026-10-01')).toBe(3);
    expect(daysBetween('2026-10-01', '2026-10-01')).toBe(0);
  });

  it('carimbo ISO vira o dia local', () => {
    const local = new Date(2026, 9, 1, 23, 30);
    expect(dateOfTimestamp(local.toISOString())).toBe('2026-10-01');
  });
});

describe('isOverdue', () => {
  const item = { dueDate: '2026-09-30', status: 'doing', recurrence: null } as const;

  it('data passada e não feita: atrasada', () => {
    expect(isOverdue(item, today)).toBe(true);
  });

  it('vence hoje ainda não está atrasada', () => {
    expect(isOverdue({ ...item, dueDate: '2026-10-01' }, today)).toBe(false);
  });

  it('feita, sem data ou recorrente: nunca atrasada', () => {
    expect(isOverdue({ ...item, status: 'done' }, today)).toBe(false);
    expect(isOverdue({ ...item, dueDate: null }, today)).toBe(false);
    expect(isOverdue({ ...item, recurrence: { freq: 'daily' } }, today)).toBe(false);
  });
});
