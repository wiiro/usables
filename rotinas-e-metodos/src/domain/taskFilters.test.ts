import { describe, expect, it } from 'vitest';
import { makeTask } from '../test/fixtures';
import { NO_FILTERS, cycleSort, filterTasks, hasActiveFilters, sortTasks } from './taskFilters';

describe('cycleSort', () => {
  it('natural → invertido → padrão; outra coluna recomeça no natural', () => {
    const first = cycleSort(null, 'priority');
    expect(first).toEqual({ key: 'priority', dir: 'desc' });
    const second = cycleSort(first, 'priority');
    expect(second).toEqual({ key: 'priority', dir: 'asc' });
    expect(cycleSort(second, 'priority')).toBeNull();
    expect(cycleSort(second, 'title')).toEqual({ key: 'title', dir: 'asc' });
  });
});

const today = new Date(2026, 9, 1); // 1 out 2026

const tasks = [
  makeTask({ id: 'atrasada', dueDate: '2026-09-28', priority: 'urgent', tags: ['Reunião'], projectId: 'p2' }),
  makeTask({ id: 'hoje', dueDate: '2026-10-01', priority: 'low', status: 'doing' }),
  makeTask({ id: 'semana', dueDate: '2026-10-07', priority: 'high', status: 'blocked' }),
  makeTask({ id: 'longe', dueDate: '2026-10-08', status: 'done' }),
  makeTask({ id: 'sem-data', subtasks: [{ id: 's', title: 's', done: true }] }),
];

const ids = (list: { id: string }[]) => list.map((task) => task.id);

describe('filterTasks', () => {
  it('sem filtros devolve tudo', () => {
    expect(filterTasks(tasks, NO_FILTERS, today)).toHaveLength(tasks.length);
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
  });

  it('por projeto, prioridade e status', () => {
    expect(ids(filterTasks(tasks, { ...NO_FILTERS, projectId: 'p2' }, today))).toEqual(['atrasada']);
    expect(ids(filterTasks(tasks, { ...NO_FILTERS, priority: 'high' }, today))).toEqual(['semana']);
    expect(ids(filterTasks(tasks, { ...NO_FILTERS, status: 'blocked' }, today))).toEqual(['semana']);
  });

  it('"em aberto" esconde só as feitas', () => {
    expect(ids(filterTasks(tasks, { ...NO_FILTERS, status: 'open' }, today))).not.toContain('longe');
    expect(filterTasks(tasks, { ...NO_FILTERS, status: 'open' }, today)).toHaveLength(4);
  });

  it('por prazo: atrasadas, hoje, próximos 7 dias (hoje incluso) e sem data', () => {
    expect(ids(filterTasks(tasks, { ...NO_FILTERS, due: 'overdue' }, today))).toEqual(['atrasada']);
    expect(ids(filterTasks(tasks, { ...NO_FILTERS, due: 'today' }, today))).toEqual(['hoje']);
    expect(ids(filterTasks(tasks, { ...NO_FILTERS, due: 'week' }, today))).toEqual(['hoje', 'semana']);
    expect(ids(filterTasks(tasks, { ...NO_FILTERS, due: 'none' }, today))).toEqual(['sem-data']);
  });

  it('por etiqueta, sem diferenciar maiúsculas e acentos', () => {
    expect(ids(filterTasks(tasks, { ...NO_FILTERS, tag: 'reuniao' }, today))).toEqual(['atrasada']);
  });

  it('filtros combinados precisam valer todos', () => {
    expect(filterTasks(tasks, { ...NO_FILTERS, priority: 'urgent', due: 'today' }, today)).toEqual([]);
  });
});

describe('sortTasks', () => {
  const names = new Map([['p1', 'Beta'], ['p2', 'Alfa']]);

  it('sem escolha: ordem padrão (status, data)', () => {
    expect(ids(sortTasks(tasks, null, names))).toEqual(['atrasada', 'sem-data', 'hoje', 'semana', 'longe']);
  });

  it('por prioridade, nos dois sentidos', () => {
    expect(ids(sortTasks(tasks, { key: 'priority', dir: 'desc' }, names))[0]).toBe('atrasada');
    expect(ids(sortTasks(tasks, { key: 'priority', dir: 'asc' }, names))[0]).toBe('hoje');
  });

  it('por data: sem data fica no fim nos dois sentidos', () => {
    expect(ids(sortTasks(tasks, { key: 'dueDate', dir: 'asc' }, names))).toEqual(['atrasada', 'hoje', 'semana', 'longe', 'sem-data']);
    expect(ids(sortTasks(tasks, { key: 'dueDate', dir: 'desc' }, names))).toEqual(['longe', 'semana', 'hoje', 'atrasada', 'sem-data']);
  });

  it('por projeto usa o nome do projeto', () => {
    expect(ids(sortTasks(tasks, { key: 'project', dir: 'asc' }, names))[0]).toBe('atrasada');
  });

  it('por progresso', () => {
    expect(ids(sortTasks(tasks, { key: 'progress', dir: 'desc' }, names)).slice(0, 2).sort()).toEqual(['longe', 'sem-data']);
  });

  it('não altera a lista original', () => {
    const copy = [...tasks];
    sortTasks(tasks, { key: 'title', dir: 'desc' }, names);
    expect(tasks).toEqual(copy);
  });
});
