/* Transações: criação, hash/duplicatas e filtros. */

import { uid, hash, normalizar } from '../format.js';

export function chaveDup(t) {
  return [t.data, t.valor, t.tipo, normalizar(t.descricao)].join('|');
}

export function novaTransacao(p) {
  const t = {
    id: uid(), data: '', descricao: '', valor: 0, tipo: 'saida', topicoId: null, usuarioId: null,
    origem: 'manual', idImportacao: null, hash: '', parcelaAtual: null, parcelaTotal: null,
    moedaOriginal: null, valorOriginal: null, iof: 0, finalCartao: null, status: 'realizada',
    ...p
  };
  if (!t.hash) t.hash = hash(chaveDup(t) + '|0');
  return t;
}

/**
 * Marca duplicatas em `novas` (muta cada item: `duplicata` = 'exata' | 'provavel' | null).
 * 'exata': mesma data + valor + descrição já importada (ou repetida no mesmo lote além do que existe).
 * 'provavel': mesma data + valor + tipo, mas descrição/origem diferentes (ex.: CSV x PDF).
 * Linhas idênticas dentro do mesmo arquivo recebem um sufixo de sequência no hash —
 * assim duas compras legítimas iguais no mesmo dia não são confundidas com duplicata.
 */
export function marcarDuplicatas(novas, existentes) {
  const hashes = new Set();
  const porDataValor = new Map();
  existentes.forEach((e) => {
    if (e.status === 'prevista') return;
    hashes.add(e.hash);
    const k = e.data + '|' + e.valor + '|' + e.tipo;
    if (!porDataValor.has(k)) porDataValor.set(k, []);
    porDataValor.get(k).push(e);
  });

  const sequencia = new Map();
  novas.forEach((n) => {
    const base = chaveDup(n);
    const seq = sequencia.get(base) || 0;
    sequencia.set(base, seq + 1);
    n.hash = hash(base + '|' + seq);
    n.duplicata = null;
    if (hashes.has(n.hash)) { n.duplicata = 'exata'; return; }
    const parecidas = (porDataValor.get(n.data + '|' + n.valor + '|' + n.tipo) || []).filter((e) => e.origem !== n.origem);
    if (parecidas.length) n.duplicata = 'provavel';
  });
  return novas;
}

/** Filtros da tela de Transações. `status` 'todas' inclui previstas. */
export function filtrarTransacoes(state, f) {
  const busca = f.busca ? normalizar(f.busca) : '';
  return state.transacoes.filter((t) => {
    if (f.mes && t.data.slice(0, 7) !== f.mes) return false;
    if (f.usuarioId && t.usuarioId !== f.usuarioId) return false;
    if (f.topicoId) {
      if (f.topicoId === '__sem') { if (t.topicoId) return false; }
      else {
        const filhos = state.topicos.filter((x) => x.topicoPai === f.topicoId).map((x) => x.id);
        if (t.topicoId !== f.topicoId && !filhos.includes(t.topicoId)) return false;
      }
    }
    if (f.finalCartao && t.finalCartao !== f.finalCartao) return false;
    if (f.origem && t.origem !== f.origem) return false;
    if (f.status && f.status !== 'todas' && t.status !== f.status) return false;
    if (busca && !normalizar(t.descricao).includes(busca)) return false;
    return true;
  });
}

export function ordenar(lista, campo, dir) {
  const m = dir === 'asc' ? 1 : -1;
  const chave = { data: (t) => t.data, valor: (t) => (t.tipo === 'entrada' ? t.valor : -t.valor), descricao: (t) => normalizar(t.descricao) }[campo] || ((t) => t.data);
  return [...lista].sort((a, b) => {
    const ka = chave(a), kb = chave(b);
    return (ka < kb ? -1 : ka > kb ? 1 : 0) * m;
  });
}
