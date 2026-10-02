import type { AppState } from '../types/state';
import type { SaveResult } from './persistence';

// Estado em memória + mutação central, como o App.update do Template:
// clona o estado, aplica a mudança, grava e avisa a tela. O React lê pelo
// useSyncExternalStore (ver StoreContext.ts), então qualquer update redesenha
// quem depende do estado.

export type PersistenceIssue =
  /** A última gravação falhou; some sozinho quando uma gravação der certo. */
  | { kind: 'save-failed'; message: string }
  /** Os dados salvos estavam ilegíveis; o app começou do zero e guardou uma cópia. */
  | { kind: 'recovered'; recoveryKey: string }
  /** Gravação desligada: nada do que for feito agora será salvo. */
  | { kind: 'read-only'; message: string };

export interface AppStore {
  getState(): AppState;
  getIssue(): PersistenceIssue | null;
  subscribe(listener: () => void): () => void;
  /** Aplica a mudança numa cópia do estado, grava e redesenha. */
  update(mutator: (draft: AppState) => void): void;
  /** Troca o estado sem gravar: usado quando outra aba já gravou. */
  replace(next: AppState): void;
  /** Fecha o aviso de recuperação; os outros avisos só somem quando o problema some. */
  dismissIssue(): void;
}

export interface AppStoreOptions {
  initialState: AppState;
  /** null desliga a gravação (armazenamento indisponível, ou dado ilegível sem cópia). */
  save: ((state: AppState) => SaveResult) | null;
  initialIssue: PersistenceIssue | null;
}

export function createAppStore({ initialState, save, initialIssue }: AppStoreOptions): AppStore {
  let state = initialState;
  let issue = initialIssue;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());

  const persist = (next: AppState) => {
    if (!save) return;
    const result = save(next);
    if (!result.ok) issue = { kind: 'save-failed', message: result.message };
    else if (issue?.kind === 'save-failed') issue = null;
  };

  return {
    getState: () => state,
    getIssue: () => issue,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update(mutator) {
      // Se o mutator lançar, a cópia é descartada e o estado não muda.
      const draft = structuredClone(state);
      mutator(draft);
      state = draft;
      persist(state);
      notify();
    },
    replace(next) {
      state = next;
      notify();
    },
    dismissIssue() {
      if (issue?.kind !== 'recovered') return;
      issue = null;
      notify();
    },
  };
}
