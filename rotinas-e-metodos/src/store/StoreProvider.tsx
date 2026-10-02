import type { ReactNode } from 'react';
import type { AppStore } from './store';
import { StoreContext } from './StoreContext';

export function StoreProvider({ store, children }: { store: AppStore; children: ReactNode }) {
  return <StoreContext value={store}>{children}</StoreContext>;
}
