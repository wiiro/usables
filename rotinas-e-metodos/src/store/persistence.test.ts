import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sampleState } from '../test/fixtures';
import { MemoryStorage } from '../test/memoryStorage';
import { RECOVERY_KEY_PREFIX, STORAGE_KEY, readState, saveState, stashUnreadable } from './persistence';

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('readState', () => {
  it('sem nada salvo: empty', () => {
    expect(readState(new MemoryStorage())).toEqual({ kind: 'empty' });
  });

  it('lê de volta exatamente o que foi salvo', () => {
    const storage = new MemoryStorage();
    const state = sampleState();
    saveState(storage, state);
    expect(readState(storage)).toEqual({ kind: 'loaded', state });
  });

  it('completa campos que faltam com valores padrão (dados de versão antiga)', () => {
    const storage = new MemoryStorage();
    const old = {
      schemaVersion: 1,
      tasks: [{ id: 't1', createdAt: 'x', updatedAt: 'x', projectId: 'p1', title: 'Antiga' }],
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(old));

    const result = readState(storage);

    expect(result.kind).toBe('loaded');
    if (result.kind !== 'loaded') return;
    expect(result.state.theme).toBe('light');
    expect(result.state.preferences).toEqual({ taskView: 'kanban', calendarView: 'month', calendarArea: 'all' });
    expect(result.state.projects).toEqual([]);
    expect(result.state.tasks[0]).toMatchObject({
      title: 'Antiga', status: 'todo', priority: 'medium', tags: [], subtasks: [],
      notes: '', recurrence: null, completedOccurrences: [], dueDate: null, order: 0,
    });
  });

  it('JSON quebrado: unreadable, devolvendo o conteúdo original', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{"schemaVersion":1,');
    expect(readState(storage)).toEqual({ kind: 'unreadable', raw: '{"schemaVersion":1,' });
  });

  it('estrutura inválida (tarefa sem projeto): unreadable', () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify({ schemaVersion: 1, tasks: [{ id: 't1', createdAt: 'x', updatedAt: 'x', title: 'Sem projeto' }] });
    storage.setItem(STORAGE_KEY, raw);
    expect(readState(storage)).toEqual({ kind: 'unreadable', raw });
  });

  it('versão de formato desconhecida: unreadable', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...sampleState(), schemaVersion: 99 }));
    expect(readState(storage).kind).toBe('unreadable');
  });
});

describe('saveState', () => {
  it('grava o estado como JSON na chave do app', () => {
    const storage = new MemoryStorage();
    expect(saveState(storage, sampleState())).toEqual({ ok: true });
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? '')).toEqual(sampleState());
  });

  it('espaço esgotado: devolve erro com mensagem para a tela', () => {
    const storage = new MemoryStorage();
    storage.failWrites = true;
    const result = saveState(storage, sampleState());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/espaço de armazenamento/);
  });
});

describe('stashUnreadable', () => {
  it('guarda o conteúdo numa chave própria e datada', () => {
    const storage = new MemoryStorage();
    const key = stashUnreadable(storage, 'lixo', new Date('2026-10-01T12:34:56.789Z'));
    expect(key).toBe(`${RECOVERY_KEY_PREFIX}2026-10-01T12-34-56-789Z`);
    expect(storage.getItem(key ?? '')).toBe('lixo');
  });

  it('devolve null se nem a cópia couber', () => {
    const storage = new MemoryStorage();
    storage.failWrites = true;
    expect(stashUnreadable(storage, 'lixo', new Date())).toBeNull();
  });
});
