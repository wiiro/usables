import type { AppState, Theme } from '../types/state';
import type { KeyValueStorage, ReadResult } from './persistence';
import { STORAGE_KEY, createEmptyState, readState, saveState, stashUnreadable } from './persistence';
import type { AppStore } from './store';
import { createAppStore } from './store';

// Monta o store a partir do que estiver salvo e decide o que fazer em cada
// situação ruim. A regra é a mesma em todas: nunca gravar por cima de dados
// que não conseguimos ler sem antes guardar uma cópia deles.

const STORAGE_UNAVAILABLE =
  'O navegador não deu acesso ao armazenamento local (modo privado ou dados de sites bloqueados).';
const UNREADABLE_WITHOUT_COPY =
  'Os dados salvos estão ilegíveis e não houve espaço para guardar uma cópia deles. ' +
  'Para não perder nada, o salvamento foi desligado.';

export interface BootstrapDeps {
  storage: KeyValueStorage | null;
  /** Tema do primeiro uso, quando ainda não há nada salvo. */
  initialTheme: Theme;
  now: () => Date;
}

export function createStoreFromStorage({ storage, initialTheme, now }: BootstrapDeps): AppStore {
  const emptyState = createEmptyState(initialTheme);
  if (!storage) return readOnlyStore(emptyState, STORAGE_UNAVAILABLE);

  let result: ReadResult;
  try {
    result = readState(storage);
  } catch (error) {
    console.error('[Rotinas e Métodos] leitura do armazenamento bloqueada', error);
    return readOnlyStore(emptyState, STORAGE_UNAVAILABLE);
  }

  const save = (state: AppState) => saveState(storage, state);

  if (result.kind === 'empty') return createAppStore({ initialState: emptyState, save, initialIssue: null });
  if (result.kind === 'loaded') return createAppStore({ initialState: result.state, save, initialIssue: null });

  const recoveryKey = stashUnreadable(storage, result.raw, now());
  if (!recoveryKey) return readOnlyStore(emptyState, UNREADABLE_WITHOUT_COPY);

  // A cópia está guardada: grava o estado vazio já, para o próximo carregamento
  // não encontrar o mesmo conteúdo ilegível e duplicar a cópia. Se falhar, o
  // primeiro update tenta de novo e mostra o erro.
  saveState(storage, emptyState);
  return createAppStore({ initialState: emptyState, save, initialIssue: { kind: 'recovered', recoveryKey } });
}

function readOnlyStore(initialState: AppState, message: string): AppStore {
  return createAppStore({ initialState, save: null, initialIssue: { kind: 'read-only', message } });
}

/** localStorage do navegador, ou null se o acesso for bloqueado. */
export function getBrowserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Com o app aberto em duas abas, cada uma gravaria por cima da outra. Quando
 * outra aba grava, esta passa a mostrar o que foi gravado lá.
 */
export function syncWithOtherTabs(storage: Storage, store: AppStore, target: Window): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.storageArea !== storage || event.key !== STORAGE_KEY) return;
    try {
      const result = readState(storage);
      if (result.kind === 'loaded') store.replace(result.state);
    } catch (error) {
      console.error('[Rotinas e Métodos] falha ao ler a gravação de outra aba', error);
    }
  };
  target.addEventListener('storage', onStorage);
  return () => target.removeEventListener('storage', onStorage);
}
