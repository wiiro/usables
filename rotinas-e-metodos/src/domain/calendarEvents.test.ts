import { describe, expect, it } from 'vitest';
import { makeTask, sampleState } from '../test/fixtures';
import { buildCalendarEvents } from './calendarEvents';
import { readableTextColor } from './colors';

describe('buildCalendarEvents', () => {
  const state = () => {
    const s = sampleState();
    s.tasks.push(makeTask({ id: 't2', dueDate: '2026-10-08', status: 'done' }), makeTask({ id: 't3' })); // t3 sem data
    s.topics[0].plannedDate = '2026-10-09';
    return s;
  };

  it('tarefas com data viram eventos de dia inteiro na cor do projeto; sem data, não aparecem', () => {
    const events = buildCalendarEvents(state(), 'work');
    expect(events.map((e) => e.id)).toEqual(['task:t1', 'task:t2']);
    const done = events.find((e) => e.id === 'task:t2')!;
    expect(done).toMatchObject({ start: '2026-10-08', allDay: true, editable: true, color: '#2563eb', className: 'cal-task' });
    expect(done.extendedProps).toMatchObject({ kind: 'task', itemId: 't2', done: true, recurring: false });
  });

  it('recorrentes saem com rrule a partir da data e não são arrastáveis', () => {
    const recurring = buildCalendarEvents(state(), 'work').find((e) => e.id === 'task:t1')!;
    expect(recurring.start).toBeUndefined();
    expect(recurring.rrule).toEqual({ freq: 'weekly', dtstart: '2026-10-10', byweekday: ['mo', 'we'] });
    expect(recurring.editable).toBe(false);
    expect(recurring.extendedProps.completedOccurrences).toEqual(['2026-10-06']);
  });

  it('filtra por área', () => {
    expect(buildCalendarEvents(state(), 'study').map((e) => e.id)).toEqual(['topic:k1']);
    expect(buildCalendarEvents(state(), 'all')).toHaveLength(3);
  });
});

describe('readableTextColor', () => {
  it('branco sobre cores escuras, escuro sobre claras', () => {
    expect(readableTextColor('#2563eb')).toBe('#ffffff');
    expect(readableTextColor('#ca8a04')).toBe('#111827'); // amarelo
    expect(readableTextColor('inválida')).toBe('#ffffff');
  });
});
