import { describe, expect, it } from 'vitest';
import type { TaskStatus } from '../types/work';
import { compareByOrder, compareTasksForList } from './taskSort';

const row = (id: string, status: TaskStatus, dueDate: string | null, order: number, createdAt = '2026-10-01') => ({
  id, status, dueDate, order, createdAt,
});

describe('compareTasksForList', () => {
  it('ordena por status, depois data (sem data por último), depois ordem manual', () => {
    const rows = [
      row('feito', 'done', '2026-01-01', 1),
      row('sem data', 'todo', null, 2),
      row('depois', 'todo', '2026-10-20', 3),
      row('antes', 'todo', '2026-10-10', 4),
      row('fazendo', 'doing', null, 5),
      row('sem data, mais acima', 'todo', null, 0),
    ];

    const ids = [...rows].sort(compareTasksForList).map((r) => r.id);

    expect(ids).toEqual(['antes', 'depois', 'sem data, mais acima', 'sem data', 'fazendo', 'feito']);
  });
});

describe('compareByOrder', () => {
  it('usa a ordem e, em empate, a criação e depois o id', () => {
    const rows = [row('c', 'todo', null, 1, '2026-10-02'), row('b', 'todo', null, 1, '2026-10-01'), row('a', 'todo', null, 1, '2026-10-01'), row('z', 'todo', null, 0)];
    expect([...rows].sort(compareByOrder).map((r) => r.id)).toEqual(['z', 'a', 'b', 'c']);
  });
});
