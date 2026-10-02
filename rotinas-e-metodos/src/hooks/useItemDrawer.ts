import { useSearchParams } from 'react-router';
import type { ID, ISODate } from '../types/common';

// O item aberto no painel lateral fica no endereço (?tarefa=<id> ou
// ?topico=<id>), então o F5 mantém o painel aberto. Quando o item é aberto a
// partir de uma ocorrência no calendário, a data vai junto (?ocorrencia=…).
// "replace": abrir e fechar painel não enche o histórico do navegador.

const OCCURRENCE_PARAM = 'ocorrencia';

export function useItemDrawer(param: 'tarefa' | 'topico') {
  const [searchParams, setSearchParams] = useSearchParams();

  const setOpen = (id: ID | null, occurrence: ISODate | null) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        // Abrir um tipo de item fecha o outro (calendário unificado).
        for (const key of ['tarefa', 'topico', OCCURRENCE_PARAM]) next.delete(key);
        if (id) next.set(param, id);
        if (id && occurrence) next.set(OCCURRENCE_PARAM, occurrence);
        return next;
      },
      { replace: true },
    );

  return {
    openId: searchParams.get(param),
    occurrence: searchParams.get(OCCURRENCE_PARAM),
    open: (id: ID, occurrence: ISODate | null = null) => setOpen(id, occurrence),
    close: () => setOpen(null, null),
  };
}
