import { describe, expect, it } from 'vitest';
import { makeTask } from '../test/fixtures';
import type { Columns } from './kanban';
import { buildColumns, columnDropId, findColumn, moveAcross, settleDrop, tasksWithActiveBlocker } from './kanban';

const columns: Columns = { todo: ['a', 'b', 'c'], doing: ['d'], blocked: [], done: [] };

describe('buildColumns', () => {
  it('agrupa por status na ordem manual', () => {
    const tasks = [
      makeTask({ id: 'b', order: 2 }),
      makeTask({ id: 'a', order: 1 }),
      makeTask({ id: 'd', order: 3, status: 'doing' }),
    ];
    expect(buildColumns(tasks)).toEqual({ todo: ['a', 'b'], doing: ['d'], blocked: [], done: [] });
  });
});

describe('findColumn', () => {
  it('acha a coluna de um cartão ou de um alvo de coluna', () => {
    expect(findColumn(columns, 'd')).toBe('doing');
    expect(findColumn(columns, columnDropId('blocked'))).toBe('blocked');
    expect(findColumn(columns, 'nao-existe')).toBeNull();
  });
});

describe('moveAcross', () => {
  it('passa para outra coluna na posição do cartão de baixo', () => {
    expect(moveAcross(columns, 'b', 'd')).toEqual({ todo: ['a', 'c'], doing: ['b', 'd'], blocked: [], done: [] });
  });

  it('em cima da coluna (vazia ou não), vai para o fim dela', () => {
    expect(moveAcross(columns, 'a', columnDropId('blocked')).blocked).toEqual(['a']);
    expect(moveAcross(columns, 'a', columnDropId('doing')).doing).toEqual(['d', 'a']);
  });

  it('na mesma coluna, não muda nada (devolve o mesmo objeto)', () => {
    expect(moveAcross(columns, 'a', 'c')).toBe(columns);
  });
});

describe('settleDrop', () => {
  it('reordena dentro da coluna e devolve os vizinhos', () => {
    expect(settleDrop(columns, columns, 'a', 'c')).toEqual({ status: 'todo', prevId: 'c', nextId: null });
    expect(settleDrop(columns, columns, 'c', 'a')).toEqual({ status: 'todo', prevId: null, nextId: 'a' });
  });

  it('depois de mudar de coluna, usa a posição da cópia', () => {
    const preview = moveAcross(columns, 'b', 'd'); // doing: [b, d]
    // Solto sobre o próprio cartão: fica onde a cópia o pôs, acima de d.
    expect(settleDrop(columns, preview, 'b', 'b')).toEqual({ status: 'doing', prevId: null, nextId: 'd' });
    // Solto sobre d: ocupa a posição de d (é o que o dnd-kit mostra durante o arraste).
    expect(settleDrop(columns, preview, 'b', 'd')).toEqual({ status: 'doing', prevId: 'd', nextId: null });
  });

  it('soltar no mesmo lugar: null (nada a gravar)', () => {
    expect(settleDrop(columns, columns, 'b', 'b')).toBeNull();
    expect(settleDrop(columns, columns, 'b', columnDropId('todo'))).toBeNull();
  });
});

describe('tasksWithActiveBlocker', () => {
  it('só bloqueios ativos de tarefas', () => {
    const base = { createdAt: '', updatedAt: '', description: '', resolvedOn: null };
    const ids = tasksWithActiveBlocker([
      { ...base, id: '1', ownerType: 'task', ownerId: 't1', status: 'active' },
      { ...base, id: '2', ownerType: 'task', ownerId: 't2', status: 'resolved' },
      { ...base, id: '3', ownerType: 'project', ownerId: 'p1', status: 'active' },
    ]);
    expect([...ids]).toEqual(['t1']);
  });
});
