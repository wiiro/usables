import type { AppState, Theme } from '../types/state';
import { appStateSchema } from './stateSchema';

// Único arquivo que lê e grava o localStorage. Equivale ao loadState/persist
// do state.js do Template. Se um dia o limite do localStorage apertar, trocar
// para IndexedDB mexe só aqui.

/** Precisa bater com a chave lida pelo script de tema em index.html. */
export const STORAGE_KEY = 'rotinas_state_v1';

/** Prefixo das cópias de dados ilegíveis, guardadas para nunca serem sobrescritas. */
export const RECOVERY_KEY_PREFIX = `${STORAGE_KEY}__ilegivel_`;

/** O que este módulo precisa do localStorage; nos testes, um Map em memória. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function createEmptyState(theme: Theme): AppState {
  return {
    schemaVersion: 1,
    theme,
    preferences: { taskView: 'kanban', calendarView: 'month', calendarArea: 'all' },
    projects: [],
    tasks: [],
    subjects: [],
    topics: [],
    ideas: [],
    blockers: [],
    progressLogs: [],
    questions: [],
  };
}

export type ReadResult =
  | { kind: 'empty' }
  | { kind: 'loaded'; state: AppState }
  | { kind: 'unreadable'; raw: string };

/**
 * Lê o estado salvo. Não decide o que fazer com dado ilegível: isso fica com
 * quem chama (ver bootstrap.ts). Pode lançar se o navegador bloquear o acesso.
 */
export function readState(storage: KeyValueStorage): ReadResult {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return { kind: 'empty' };
  const state = parseState(raw);
  return state ? { kind: 'loaded', state } : { kind: 'unreadable', raw };
}

function parseState(raw: string): AppState | null {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    console.warn('[Rotinas e Métodos] dados salvos não são um JSON válido');
    return null;
  }
  const result = appStateSchema.safeParse(json);
  if (!result.success) {
    // Só os caminhos dos campos, nunca os valores: o conteúdo é do usuário.
    const paths = result.error.issues.slice(0, 5).map((issue) => issue.path.join('.'));
    console.warn('[Rotinas e Métodos] dados salvos com formato inválido em:', paths);
    return null;
  }
  return result.data;
}

export type SaveResult = { ok: true } | { ok: false; message: string };

export function saveState(storage: KeyValueStorage, state: AppState): SaveResult {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch (error) {
    console.error('[Rotinas e Métodos] falha ao salvar', error);
    return { ok: false, message: describeSaveError(error) };
  }
}

/**
 * Guarda o conteúdo ilegível numa chave própria antes de o app começar do zero.
 * Devolve a chave usada, ou null se nem a cópia coube.
 */
export function stashUnreadable(storage: KeyValueStorage, raw: string, now: Date): string | null {
  const key = RECOVERY_KEY_PREFIX + now.toISOString().replace(/[:.]/g, '-');
  try {
    storage.setItem(key, raw);
    return key;
  } catch (error) {
    console.error('[Rotinas e Métodos] não foi possível guardar a cópia dos dados ilegíveis', error);
    return null;
  }
}

const QUOTA_ERROR_NAMES = ['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'];

function describeSaveError(error: unknown): string {
  if (error instanceof DOMException && QUOTA_ERROR_NAMES.includes(error.name)) {
    return 'O espaço de armazenamento do navegador acabou. Exporte um backup e apague itens antigos para liberar espaço.';
  }
  return 'O navegador recusou a gravação dos dados.';
}
