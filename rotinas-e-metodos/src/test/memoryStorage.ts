import type { KeyValueStorage } from '../store/persistence';

/**
 * localStorage em memória para os testes. `failWrites` simula o navegador
 * recusando gravações (ex.: espaço esgotado).
 */
export class MemoryStorage implements KeyValueStorage {
  readonly data = new Map<string, string>();
  failWrites = false;

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failWrites) throw new DOMException('Espaço esgotado', 'QuotaExceededError');
    this.data.set(key, value);
  }
}
