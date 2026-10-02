import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { readTaskParams, writeTaskParams } from '../../../domain/taskFilterParams';
import type { SortKey, TaskFilters } from '../../../domain/taskFilters';
import { NO_FILTERS, cycleSort } from '../../../domain/taskFilters';

// Filtros e ordenação ficam no endereço (?prioridade=…&ordem=…): o F5 mantém
// a tela como estava. "replace" para não encher o histórico. A tarefa aberta
// no painel usa useItemDrawer('tarefa').

export function useTaskFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, sort } = useMemo(() => readTaskParams(searchParams), [searchParams]);

  const write = (nextFilters: TaskFilters, nextSort: typeof sort) =>
    setSearchParams((prev) => writeTaskParams(prev, nextFilters, nextSort), { replace: true });

  return {
    filters,
    sort,
    setFilter: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => write({ ...filters, [key]: value }, sort),
    toggleSort: (key: SortKey) => write(filters, cycleSort(sort, key)),
    clearFilters: () => write(NO_FILTERS, sort),
  };
}
