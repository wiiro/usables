import { describe, expect, it } from 'vitest';
import { sampleState } from '../../test/fixtures';
import { createProject, deleteProject, updateProject } from './projects';

const NOW = '2026-10-02T09:00:00.000Z';

describe('createProject', () => {
  it('cria com carimbos de data, nome sem espaços nas pontas e anotações vazias', () => {
    const state = sampleState();
    createProject(
      state,
      { name: '  Novo  ', description: 'd', color: '#16a34a', startDate: null, dueDate: '2026-12-01' },
      { id: 'p2', now: NOW },
    );
    expect(state.projects.at(-1)).toEqual({
      id: 'p2', createdAt: NOW, updatedAt: NOW, name: 'Novo', description: 'd',
      color: '#16a34a', startDate: null, dueDate: '2026-12-01', notes: '',
    });
  });
});

describe('updateProject', () => {
  it('aplica só os campos enviados e atualiza o updatedAt', () => {
    const state = sampleState();
    updateProject(state, 'p1', { name: 'Renomeado' }, NOW);
    expect(state.projects[0]).toMatchObject({ name: 'Renomeado', color: '#2563eb', updatedAt: NOW });
  });

  it('projeto inexistente: erro', () => {
    expect(() => updateProject(sampleState(), 'nao-existe', { name: 'x' }, NOW)).toThrow('Projeto não encontrado');
  });
});

describe('deleteProject', () => {
  it('apaga o projeto, as tarefas dele e as seções de ambos; o resto fica', () => {
    const state = sampleState();
    // Um segundo projeto com tarefa e bloqueio, que não pode ser afetado.
    createProject(state, { name: 'Outro', description: '', color: '#000', startDate: null, dueDate: null }, { id: 'p2', now: NOW });
    state.tasks.push({ ...state.tasks[0], id: 't2', projectId: 'p2' });
    state.blockers.push({ ...state.blockers[0], id: 'b2', ownerId: 't2' });

    deleteProject(state, 'p1');

    expect(state.projects.map((p) => p.id)).toEqual(['p2']);
    expect(state.tasks.map((t) => t.id)).toEqual(['t2']);
    expect(state.blockers.map((b) => b.id)).toEqual(['b2']); // b1 era da tarefa t1
    expect(state.ideas).toEqual([]); // i1 era do projeto p1
    // Seções de estudo não são tocadas.
    expect(state.progressLogs).toHaveLength(1);
    expect(state.questions).toHaveLength(1);
  });
});
