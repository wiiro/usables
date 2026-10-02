import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sampleState } from '../test/fixtures';
import { MemoryStorage } from '../test/memoryStorage';
import { createStoreFromStorage } from './bootstrap';
import { RECOVERY_KEY_PREFIX, STORAGE_KEY, createEmptyState } from './persistence';

const NOW = new Date('2026-10-01T12:00:00.000Z');
const deps = (storage: MemoryStorage | null) => ({ storage, initialTheme: 'dark' as const, now: () => NOW });
const recoveryKeys = (storage: MemoryStorage) =>
  [...storage.data.keys()].filter((key) => key.startsWith(RECOVERY_KEY_PREFIX));

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('createStoreFromStorage', () => {
  it('primeiro uso: estado vazio com o tema inicial, sem aviso', () => {
    const store = createStoreFromStorage(deps(new MemoryStorage()));
    expect(store.getState()).toEqual(createEmptyState('dark'));
    expect(store.getIssue()).toBeNull();
  });

  it('dados válidos: carrega o que estava salvo', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify(sampleState()));
    const store = createStoreFromStorage(deps(storage));
    expect(store.getState()).toEqual(sampleState());
    expect(store.getIssue()).toBeNull();
  });

  it('dados ilegíveis: guarda cópia, começa do zero e avisa', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, 'não é json');

    const store = createStoreFromStorage(deps(storage));

    const [copyKey] = recoveryKeys(storage);
    expect(storage.getItem(copyKey)).toBe('não é json');
    expect(store.getIssue()).toEqual({ kind: 'recovered', recoveryKey: copyKey });
    expect(store.getState()).toEqual(createEmptyState('dark'));
    // A chave principal já foi limpa: recarregar não gera uma segunda cópia.
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? '')).toEqual(createEmptyState('dark'));
  });

  it('dados ilegíveis sem espaço para a cópia: não grava nada por cima', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, 'não é json');
    storage.failWrites = true;

    const store = createStoreFromStorage(deps(storage));
    storage.failWrites = false;
    store.update((draft) => {
      draft.theme = 'light';
    });

    expect(store.getIssue()?.kind).toBe('read-only');
    expect(storage.getItem(STORAGE_KEY)).toBe('não é json');
    expect(recoveryKeys(storage)).toEqual([]);
  });

  it('armazenamento indisponível: funciona só em memória e avisa', () => {
    const store = createStoreFromStorage(deps(null));
    expect(store.getIssue()?.kind).toBe('read-only');
  });

  it('leitura bloqueada pelo navegador: somente leitura', () => {
    const storage = new MemoryStorage();
    storage.getItem = () => {
      throw new DOMException('bloqueado', 'SecurityError');
    };
    const store = createStoreFromStorage(deps(storage));
    expect(store.getIssue()?.kind).toBe('read-only');
  });
});
