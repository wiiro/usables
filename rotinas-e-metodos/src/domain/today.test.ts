import { describe, expect, it } from 'vitest';
import { makeTask, sampleState } from '../test/fixtures';
import type { AppState } from '../types/state';
import { buildAgenda, lateLabel } from './today';

const today = new Date(2026, 9, 5); // segunda, 5 out 2026

function state(): AppState {
  const s = sampleState();
  s.tasks = [
    makeTask({ id: 'hoje', dueDate: '2026-10-05' }),
    makeTask({ id: 'hoje-feita', dueDate: '2026-10-05', status: 'done' }),
    makeTask({ id: 'atrasada', dueDate: '2026-10-01' }),
    makeTask({ id: 'atrasada-feita', dueDate: '2026-10-01', status: 'done' }),
    makeTask({ id: 'futura', dueDate: '2026-10-09' }),
    makeTask({ id: 'semanal-seg', dueDate: '2026-09-28', recurrence: { freq: 'weekly', weekdays: [1] }, completedOccurrences: ['2026-10-05'] }),
    makeTask({ id: 'semanal-ter', dueDate: '2026-09-29', recurrence: { freq: 'weekly', weekdays: [2] } }),
    makeTask({ id: 'serie-encerrada', dueDate: '2026-09-28', status: 'done', recurrence: { freq: 'daily' } }),
  ];
  s.topics[0].plannedDate = '2026-09-30';
  s.topics[0].status = 'studying';
  return s;
}

describe('buildAgenda', () => {
  it('vence hoje: data de hoje e recorrentes com ocorrência hoje; pendentes primeiro', () => {
    const { dueToday } = buildAgenda(state(), today);
    expect(dueToday.map((i) => `${i.id}:${i.done}`)).toEqual(['hoje:false', 'hoje-feita:true', 'semanal-seg:true']);
    expect(dueToday.find((i) => i.id === 'semanal-seg')).toMatchObject({ recurring: true, date: '2026-10-05' });
  });

  it('atrasados: tarefas e tópicos não feitos com data passada, do mais antigo ao mais novo; recorrentes nunca', () => {
    const { overdue } = buildAgenda(state(), today);
    // Tópico de 30/09 vem antes da tarefa de 01/10.
    expect(overdue.map((i) => `${i.kind}:${i.id}`)).toEqual(['topic:k1', 'task:atrasada']);
    expect(overdue[0]).toMatchObject({ parentName: 'Matéria A', parentColor: '#059669', date: '2026-09-30' });
  });
});

describe('lateLabel', () => {
  it('conta os dias de atraso', () => {
    expect(lateLabel('2026-10-04', today)).toBe('há 1 dia');
    expect(lateLabel('2026-10-01', today)).toBe('há 4 dias');
  });
});
