import { describe, expect, it } from 'vitest';
import { readTaskParams, writeTaskParams } from './taskFilterParams';
import { NO_FILTERS } from './taskFilters';

describe('parâmetros de filtro no endereço', () => {
  it('ida e volta', () => {
    const filters = { projectId: 'p1', status: 'open', priority: 'high', due: 'week', tag: 'reunião' } as const;
    const sort = { key: 'dueDate', dir: 'desc' } as const;

    const params = writeTaskParams(new URLSearchParams(), filters, sort);

    expect(readTaskParams(params)).toEqual({ filters, sort });
  });

  it('valores desconhecidos são ignorados', () => {
    const params = new URLSearchParams('status=xyz&prioridade=altissima&prazo=ontem&ordem=cor');
    expect(readTaskParams(params)).toEqual({ filters: NO_FILTERS, sort: null });
  });

  it('mantém parâmetros que não são de filtro (ex.: tarefa aberta) e remove os vazios', () => {
    const params = writeTaskParams(new URLSearchParams('tarefa=t1&prioridade=low'), NO_FILTERS, null);
    expect(params.toString()).toBe('tarefa=t1');
  });
});
