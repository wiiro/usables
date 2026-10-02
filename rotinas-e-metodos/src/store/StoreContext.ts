import { createContext, useContext, useSyncExternalStore } from 'react';
import type { AppState } from '../types/state';
import type { AppStore, PersistenceIssue } from './store';

export const StoreContext = createContext<AppStore | null>(null);

export function useStore(): AppStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore precisa estar dentro de <StoreProvider>.');
  return store;
}

/** Estado atual do app; o componente redesenha a cada alteração. */
export function useAppState(): AppState {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.getState);
}

/** Problema de gravação a mostrar na tela, se houver. */
export function usePersistenceIssue(): PersistenceIssue | null {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.getIssue);
}
