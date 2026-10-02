import { describe, expect, it, vi } from 'vitest';
import { sampleState } from '../test/fixtures';
import type { SaveResult } from './persistence';
import { createAppStore } from './store';

const ok: SaveResult = { ok: true };

describe('createAppStore', () => {
  it('update aplica a mudança numa cópia, grava e avisa quem assina', () => {
    const initial = sampleState();
    const save = vi.fn(() => ok);
    const store = createAppStore({ initialState: initial, save, initialIssue: null });
    const listener = vi.fn();
    store.subscribe(listener);

    store.update((draft) => {
      draft.projects[0].name = 'Renomeado';
    });

    expect(store.getState().projects[0].name).toBe('Renomeado');
    expect(initial.projects[0].name).toBe('Projeto A');
    expect(save).toHaveBeenCalledWith(store.getState());
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('se a mudança lançar erro, o estado não muda e nada é gravado', () => {
    const save = vi.fn(() => ok);
    const store = createAppStore({ initialState: sampleState(), save, initialIssue: null });
    const before = store.getState();

    expect(() =>
      store.update((draft) => {
        draft.projects[0].name = 'Meio do caminho';
        throw new Error('falhou');
      }),
    ).toThrow('falhou');

    expect(store.getState()).toBe(before);
    expect(save).not.toHaveBeenCalled();
  });

  it('falha ao gravar vira aviso, que some na próxima gravação bem-sucedida', () => {
    let result: SaveResult = { ok: false, message: 'cheio' };
    const store = createAppStore({ initialState: sampleState(), save: () => result, initialIssue: null });

    store.update((draft) => {
      draft.theme = 'dark';
    });
    expect(store.getIssue()).toEqual({ kind: 'save-failed', message: 'cheio' });

    result = ok;
    store.update((draft) => {
      draft.theme = 'light';
    });
    expect(store.getIssue()).toBeNull();
  });

  it('sem função de gravação (somente leitura): muda só em memória e mantém o aviso', () => {
    const issue = { kind: 'read-only', message: 'bloqueado' } as const;
    const store = createAppStore({ initialState: sampleState(), save: null, initialIssue: issue });

    store.update((draft) => {
      draft.theme = 'dark';
    });

    expect(store.getState().theme).toBe('dark');
    expect(store.getIssue()).toEqual(issue);
  });

  it('replace troca o estado e avisa, sem gravar', () => {
    const save = vi.fn(() => ok);
    const store = createAppStore({ initialState: sampleState(), save, initialIssue: null });
    const listener = vi.fn();
    store.subscribe(listener);
    const next = { ...sampleState(), theme: 'dark' as const };

    store.replace(next);

    expect(store.getState()).toBe(next);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled();
  });

  it('dismissIssue fecha só o aviso de recuperação', () => {
    const recovered = createAppStore({
      initialState: sampleState(), save: () => ok, initialIssue: { kind: 'recovered', recoveryKey: 'k' },
    });
    recovered.dismissIssue();
    expect(recovered.getIssue()).toBeNull();

    const readOnly = createAppStore({
      initialState: sampleState(), save: null, initialIssue: { kind: 'read-only', message: 'x' },
    });
    readOnly.dismissIssue();
    expect(readOnly.getIssue()).not.toBeNull();
  });

  it('cancelar a assinatura para de avisar', () => {
    const store = createAppStore({ initialState: sampleState(), save: () => ok, initialIssue: null });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.update((draft) => {
      draft.theme = 'dark';
    });
    expect(listener).not.toHaveBeenCalled();
  });
});
