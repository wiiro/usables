import { PRIORITIES } from '../types/work';
import type { SortDir, TaskFilters, TaskSort } from './taskFilters';
import { DUE_FILTERS, SORT_KEYS, STATUS_FILTERS } from './taskFilters';

// Leitura e escrita dos filtros no endereço. Valor desconhecido (endereço
// digitado à mão, versão antiga) é ignorado em vez de quebrar a tela.

const PARAMS = {
  projectId: 'projeto',
  status: 'status',
  priority: 'prioridade',
  due: 'prazo',
  tag: 'etiqueta',
  sortKey: 'ordem',
  sortDir: 'direcao',
} as const;

function oneOf<T extends string>(options: readonly T[], raw: string | null): T | null {
  return options.find((option) => option === raw) ?? null;
}

export function readTaskParams(params: URLSearchParams): { filters: TaskFilters; sort: TaskSort | null } {
  const sortKey = oneOf(SORT_KEYS, params.get(PARAMS.sortKey));
  const sortDir = oneOf<SortDir>(['asc', 'desc'], params.get(PARAMS.sortDir));
  return {
    filters: {
      projectId: params.get(PARAMS.projectId) || null,
      status: oneOf(STATUS_FILTERS, params.get(PARAMS.status)),
      priority: oneOf(PRIORITIES, params.get(PARAMS.priority)),
      due: oneOf(DUE_FILTERS, params.get(PARAMS.due)),
      tag: params.get(PARAMS.tag) || null,
    },
    sort: sortKey ? { key: sortKey, dir: sortDir ?? 'asc' } : null,
  };
}

/** Novo conjunto de parâmetros com os filtros aplicados; os demais (ex.: ?tarefa=) são mantidos. */
export function writeTaskParams(params: URLSearchParams, filters: TaskFilters, sort: TaskSort | null): URLSearchParams {
  const next = new URLSearchParams(params);
  const set = (key: string, value: string | null) => (value ? next.set(key, value) : next.delete(key));
  set(PARAMS.projectId, filters.projectId);
  set(PARAMS.status, filters.status);
  set(PARAMS.priority, filters.priority);
  set(PARAMS.due, filters.due);
  set(PARAMS.tag, filters.tag);
  set(PARAMS.sortKey, sort?.key ?? null);
  set(PARAMS.sortDir, sort?.dir ?? null);
  return next;
}
