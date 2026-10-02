import { describe, expect, it } from 'vitest';
import { sampleState } from '../../test/fixtures';
import {
  addBlocker, addIdea, addProgressLog, deleteBlocker, deleteIdea, deleteProgressLog,
  setBlockerStatus, updateBlocker, updateIdea, updateProgressLog,
} from './sections';

const NOW = '2026-10-02T09:00:00.000Z';
const project = { ownerType: 'project', ownerId: 'p1' } as const;
const task = { ownerType: 'task', ownerId: 't1' } as const;

describe('ideias', () => {
  it('adiciona ligada ao dono, com título limpo', () => {
    const state = sampleState();
    addIdea(state, project, { title: ' Automatizar ', description: 'd', date: '2026-10-02' }, { id: 'i2', now: NOW });
    expect(state.ideas.at(-1)).toEqual({
      id: 'i2', createdAt: NOW, updatedAt: NOW, ownerType: 'project', ownerId: 'p1',
      title: 'Automatizar', description: 'd', date: '2026-10-02',
    });
  });

  it('dono inexistente: erro e nada é gravado', () => {
    const state = sampleState();
    const missing = { ownerType: 'task', ownerId: 'nao-existe' } as const;
    expect(() => addIdea(state, missing, { title: 'x', description: '', date: '2026-10-02' }, { id: 'i2', now: NOW })).toThrow(
      'Dono da seção não encontrado',
    );
    expect(state.ideas).toHaveLength(1);
  });

  it('edita e exclui', () => {
    const state = sampleState();
    updateIdea(state, 'i1', { title: 'Nova' }, NOW);
    expect(state.ideas[0]).toMatchObject({ title: 'Nova', updatedAt: NOW });
    deleteIdea(state, 'i1');
    expect(state.ideas).toEqual([]);
  });
});

describe('bloqueios', () => {
  it('nasce ativo, sem data de resolução', () => {
    const state = sampleState();
    addBlocker(state, task, '  Sem acesso ao banco ', { id: 'b2', now: NOW });
    expect(state.blockers.at(-1)).toMatchObject({ description: 'Sem acesso ao banco', status: 'active', resolvedOn: null });
  });

  it('resolver grava a data de hoje; reabrir apaga', () => {
    const state = sampleState();
    setBlockerStatus(state, 'b1', 'resolved', '2026-10-02', NOW);
    expect(state.blockers[0]).toMatchObject({ status: 'resolved', resolvedOn: '2026-10-02' });
    setBlockerStatus(state, 'b1', 'active', '2026-10-03', NOW);
    expect(state.blockers[0]).toMatchObject({ status: 'active', resolvedOn: null });
  });

  it('edita descrição e data de resolução; exclui', () => {
    const state = sampleState();
    updateBlocker(state, 'b1', { description: 'Outro motivo', resolvedOn: '2026-10-01' }, NOW);
    expect(state.blockers[0]).toMatchObject({ description: 'Outro motivo', resolvedOn: '2026-10-01' });
    deleteBlocker(state, 'b1');
    expect(state.blockers).toEqual([]);
  });
});

describe('avanços', () => {
  it('adiciona, edita e exclui', () => {
    const state = sampleState();
    addProgressLog(state, task, { date: '2026-10-02', content: 'Mapeei 3 regras' }, { id: 'l2', now: NOW });
    expect(state.progressLogs.at(-1)).toMatchObject({ ownerType: 'task', ownerId: 't1', content: 'Mapeei 3 regras' });
    updateProgressLog(state, 'l2', { content: 'Mapeei 4 regras' }, NOW);
    expect(state.progressLogs.at(-1)?.content).toBe('Mapeei 4 regras');
    deleteProgressLog(state, 'l2');
    expect(state.progressLogs.map((l) => l.id)).toEqual(['l1']);
  });

  it('item inexistente: erro', () => {
    expect(() => deleteProgressLog(sampleState(), 'x')).toThrow('Avanço não encontrado');
  });
});
