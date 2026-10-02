import { describe, expect, it } from 'vitest';
import { makeTask, sampleState } from '../../test/fixtures';
import type { AppState } from '../../types/state';
import {
  addSubtask, createTask, deleteTask, moveTask, removeSubtask, setTaskDueDate,
  setTaskRecurrence, updateSubtask, updateTask,
} from './tasks';

const NOW = '2026-10-02T09:00:00.000Z';
const task = (state: AppState, id = 't1') => state.tasks.find((t) => t.id === id)!;

describe('createTask', () => {
  it('cria com valores padrão, no fim da ordem', () => {
    const state = sampleState();
    createTask(state, { projectId: 'p1', title: ' Escrever relatório ' }, { id: 't2', now: NOW });
    expect(task(state, 't2')).toMatchObject({
      title: 'Escrever relatório', status: 'todo', priority: 'medium', dueDate: null,
      tags: [], subtasks: [], recurrence: null, order: 2, createdAt: NOW,
    });
  });

  it('projeto inexistente: erro', () => {
    expect(() => createTask(sampleState(), { projectId: 'x', title: 'a' }, { id: 't2', now: NOW })).toThrow();
  });
});

describe('updateTask', () => {
  it('troca os campos enviados e o updatedAt', () => {
    const state = sampleState();
    updateTask(state, 't1', { status: 'done', priority: 'urgent' }, NOW);
    expect(task(state)).toMatchObject({ status: 'done', priority: 'urgent', title: 'Tarefa 1', updatedAt: NOW });
  });

  it('não move para projeto inexistente', () => {
    const state = sampleState();
    expect(() => updateTask(state, 't1', { projectId: 'x' }, NOW)).toThrow('Projeto não encontrado');
    expect(task(state).projectId).toBe('p1');
  });
});

describe('data e recorrência', () => {
  it('tirar a data tira também a repetição e as ocorrências marcadas', () => {
    const state = sampleState();
    setTaskDueDate(state, 't1', null, NOW);
    expect(task(state)).toMatchObject({ dueDate: null, recurrence: null, completedOccurrences: [] });
  });

  it('trocar a data mantém a repetição', () => {
    const state = sampleState();
    setTaskDueDate(state, 't1', '2026-11-01', NOW);
    expect(task(state).recurrence).toEqual({ freq: 'weekly', weekdays: [1, 3] });
  });

  it('repetição exige data', () => {
    const state = sampleState();
    setTaskDueDate(state, 't1', null, NOW);
    expect(() => setTaskRecurrence(state, 't1', { freq: 'daily' }, NOW)).toThrow('data de entrega');
  });

  it('semanal: dias ordenados e sem repetição; pelo menos um dia', () => {
    const state = sampleState();
    setTaskRecurrence(state, 't1', { freq: 'weekly', weekdays: [5, 1, 5] }, NOW);
    expect(task(state).recurrence).toEqual({ freq: 'weekly', weekdays: [1, 5] });
    expect(() => setTaskRecurrence(state, 't1', { freq: 'weekly', weekdays: [] }, NOW)).toThrow();
  });

  it('remover a repetição limpa as ocorrências marcadas', () => {
    const state = sampleState();
    setTaskRecurrence(state, 't1', null, NOW);
    expect(task(state)).toMatchObject({ recurrence: null, completedOccurrences: [], dueDate: '2026-10-10' });
  });
});

describe('moveTask', () => {
  const board = (): AppState => ({
    ...sampleState(),
    tasks: [
      makeTask({ id: 'a', order: 1 }),
      makeTask({ id: 'b', order: 2 }),
      makeTask({ id: 'c', order: 3, status: 'doing' }),
    ],
  });

  it('entre dois vizinhos: ordem no meio, e muda o status', () => {
    const state = board();
    moveTask(state, 'c', { status: 'todo', prevId: 'a', nextId: 'b' }, NOW);
    expect(task(state, 'c')).toMatchObject({ status: 'todo', order: 1.5, updatedAt: NOW });
  });

  it('no topo, no fim e em coluna vazia', () => {
    const state = board();
    moveTask(state, 'c', { status: 'todo', prevId: null, nextId: 'a' }, NOW);
    expect(task(state, 'c').order).toBe(0);
    moveTask(state, 'a', { status: 'todo', prevId: 'b', nextId: null }, NOW);
    expect(task(state, 'a').order).toBe(3);
    moveTask(state, 'b', { status: 'done', prevId: null, nextId: null }, NOW);
    expect(task(state, 'b')).toMatchObject({ status: 'done', order: 2 });
  });

  it('sem espaço entre os vizinhos: renumera tudo e mantém a sequência', () => {
    const state = board();
    task(state, 'b').order = 1 + 1e-9;
    moveTask(state, 'c', { status: 'todo', prevId: 'a', nextId: 'b' }, NOW);
    const sequence = [...state.tasks].sort((x, y) => x.order - y.order).map((t) => t.id);
    expect(sequence).toEqual(['a', 'c', 'b']);
    expect(task(state, 'b').order - task(state, 'a').order).toBeGreaterThan(0.5);
  });
});

describe('deleteTask', () => {
  it('apaga a tarefa e as seções dela', () => {
    const state = sampleState();
    deleteTask(state, 't1');
    expect(state.tasks).toEqual([]);
    expect(state.blockers).toEqual([]);
    expect(state.ideas).toHaveLength(1); // a ideia é do projeto, não da tarefa
  });
});

describe('subtarefas', () => {
  it('adiciona com título limpo e ignora texto vazio', () => {
    const state = sampleState();
    addSubtask(state, 't1', '  Revisar ', { id: 's2', now: NOW });
    addSubtask(state, 't1', '   ', { id: 's3', now: NOW });
    expect(task(state).subtasks).toEqual([
      { id: 's1', title: 'Passo 1', done: true },
      { id: 's2', title: 'Revisar', done: false },
    ]);
  });

  it('marca, renomeia e remove', () => {
    const state = sampleState();
    updateSubtask(state, 't1', 's1', { done: false, title: 'Passo 1b' }, NOW);
    expect(task(state).subtasks[0]).toEqual({ id: 's1', title: 'Passo 1b', done: false });
    expect(task(state).updatedAt).toBe(NOW);

    removeSubtask(state, 't1', 's1', NOW);
    expect(task(state).subtasks).toEqual([]);
  });
});
