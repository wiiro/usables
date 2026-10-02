import { describe, expect, it } from 'vitest';
import { sampleState } from '../test/fixtures';
import { backupFileName, createBackup, findIntegrityProblems, parseBackup, summarizeState } from './backup';

const NOW = new Date(2026, 9, 1, 15, 30);

describe('exportar', () => {
  it('embrulha o estado com nome do app e data', () => {
    const backup = createBackup(sampleState(), NOW);
    expect(backup).toMatchObject({ app: 'rotinas-e-metodos', exportedAt: NOW.toISOString() });
    expect(backup.state).toEqual(sampleState());
    expect(backupFileName(NOW)).toBe('rotinas-e-metodos-backup-2026-10-01.json');
  });
});

describe('importar', () => {
  it('lê de volta o que foi exportado', () => {
    const text = JSON.stringify(createBackup(sampleState(), NOW));
    expect(parseBackup(text)).toEqual({ ok: true, state: sampleState() });
  });

  it('aceita também o estado puro (sem o envelope)', () => {
    expect(parseBackup(JSON.stringify(sampleState()))).toEqual({ ok: true, state: sampleState() });
  });

  it('recusa JSON quebrado, arquivo de outro app e formato inválido', () => {
    expect(parseBackup('{ nada')).toMatchObject({ ok: false, message: expect.stringContaining('JSON válido') });
    expect(parseBackup(JSON.stringify({ app: 'outro', state: sampleState() }))).toMatchObject({ ok: false, message: expect.stringContaining('não é um backup') });
    expect(parseBackup(JSON.stringify({ schemaVersion: 1, tasks: [{ id: 1 }] }))).toMatchObject({ ok: false, message: expect.stringContaining('formato esperado') });
  });

  it('recusa vínculos quebrados', () => {
    const state = sampleState();
    state.tasks[0].projectId = 'sumiu';
    const result = parseBackup(JSON.stringify(state));
    expect(result).toMatchObject({ ok: false, message: expect.stringContaining('tarefa t1 sem projeto') });
  });
});

describe('findIntegrityProblems', () => {
  it('estado íntegro: nenhum problema', () => {
    expect(findIntegrityProblems(sampleState())).toEqual([]);
  });

  it('acha ids repetidos, tópico sem matéria e seção sem dono', () => {
    const state = sampleState();
    state.projects.push({ ...state.projects[0] });
    state.topics[0].subjectId = 'sumiu';
    state.ideas[0].ownerId = 'sumiu';
    expect(findIntegrityProblems(state)).toEqual([
      'ids repetidos em projects',
      'tópico k1 sem matéria',
      'item i1 ligado a project inexistente',
    ]);
  });
});

describe('summarizeState', () => {
  it('conta cada coleção, no singular e no plural', () => {
    expect(summarizeState(sampleState())).toBe('1 projeto, 1 tarefa, 1 matéria, 1 tópico, 4 registros de seções');
  });
});
