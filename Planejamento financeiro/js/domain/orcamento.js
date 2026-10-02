/* Cálculos do orçamento (puros): renda do mês, planejado, gasto e disponível por tópico.
   Só tópicos "folha" (sem subtópicos) recebem alocação e transações; o tópico pai é
   um grupo cujos totais são a soma dos filhos. */

import { addMeses } from '../datas.js';

export const mesDa = (t) => String(t.data).slice(0, 7);

/** Renda do mês: usa o instantâneo do mês (se houver) ou o cadastro atual do usuário. */
export function rendaDoMes(state, mesId) {
  const mes = state.meses[mesId];
  const porUsuario = {};
  let total = 0;
  state.usuarios.forEach((u) => {
    const r = (mes && mes.rendas && mes.rendas[u.id]) || u;
    const salario = r.salarioLiquido || 0;
    const outras = r.outrasRendas || 0;
    porUsuario[u.id] = { salario, outras, total: salario + outras };
    total += salario + outras;
  });
  return { total, porUsuario };
}

export const filhosDe = (state, id) => state.topicos.filter((t) => t.topicoPai === id).sort((a, b) => a.ordem - b.ordem);
export const ehGrupo = (state, id) => state.topicos.some((t) => t.topicoPai === id);
export const folhas = (state) => state.topicos.filter((t) => !ehGrupo(state, t.id));

export function alocacaoDe(state, mesId, topicoId) {
  const mes = state.meses[mesId];
  return (mes && mes.alocacoes && mes.alocacoes[topicoId]) || null;
}

/** Valor planejado (centavos) de uma folha. Percentual é sempre sobre a renda total do mês. */
export function valorAlocado(aloc, renda) {
  if (!aloc) return 0;
  if (aloc.modoAlocacao === 'percentual') return Math.round((renda * (aloc.percentualPlanejado || 0)) / 100);
  return aloc.valorPlanejado || 0;
}

/**
 * Valor planejado (centavos) de TODAS as folhas do mês. Os percentuais são acumulados antes de
 * arredondar, para que percentuais que somam 100% somem exatamente a renda (sem sobrar/faltar 1 centavo).
 */
export function valoresPlanejados(state, mesId, renda = rendaDoMes(state, mesId).total) {
  const out = {};
  let acumBP = 0, anterior = 0;
  folhas(state).forEach((t) => {
    const aloc = alocacaoDe(state, mesId, t.id);
    if (aloc && aloc.modoAlocacao === 'percentual') {
      acumBP += Math.round((aloc.percentualPlanejado || 0) * 100);
      const acumulado = Math.round((renda * acumBP) / 10000);
      out[t.id] = acumulado - anterior;
      anterior = acumulado;
    } else out[t.id] = aloc ? aloc.valorPlanejado || 0 : 0;
  });
  return out;
}

export function percentualDe(valor, renda) {
  return renda > 0 ? Math.round((valor / renda) * 10000) / 100 : 0;
}

/**
 * Resumo completo de um mês.
 * - gasto: saídas REALIZADAS do mês (estornos negativos abatem).
 * - gastoConsumo: gasto fora dos tópicos de poupança/investimento (base da taxa de poupança).
 */
export function resumoMes(state, mesId) {
  const renda = rendaDoMes(state, mesId);
  const porTopico = {};
  state.topicos.forEach((t) => { porTopico[t.id] = { planejado: 0, gasto: 0 }; });

  let planejado = 0;
  const planejados = valoresPlanejados(state, mesId, renda.total);
  folhas(state).forEach((t) => {
    porTopico[t.id].planejado = planejados[t.id];
    planejado += planejados[t.id];
  });

  let gasto = 0, gastoConsumo = 0, semCategoria = 0, entradas = 0, previstas = 0, nTransacoes = 0;
  state.transacoes.forEach((t) => {
    if (mesDa(t) !== mesId) return;
    if (t.status === 'prevista') { if (t.tipo === 'saida') previstas += t.valor; return; }
    nTransacoes++;
    if (t.tipo === 'entrada') { entradas += t.valor; return; }
    gasto += t.valor;
    const topico = state.topicos.find((x) => x.id === t.topicoId);
    if (!topico) semCategoria += t.valor;
    else porTopico[topico.id].gasto += t.valor;
    if (!topico || topico.tipo !== 'poupanca') gastoConsumo += t.valor;
  });

  // Totais dos grupos = soma dos filhos.
  state.topicos.filter((t) => ehGrupo(state, t.id)).forEach((g) => {
    filhosDe(state, g.id).forEach((f) => {
      porTopico[g.id].planejado += porTopico[f.id].planejado;
      porTopico[g.id].gasto += porTopico[f.id].gasto;
    });
  });
  Object.values(porTopico).forEach((p) => { p.disponivel = p.planejado - p.gasto; p.uso = p.planejado > 0 ? p.gasto / p.planejado : (p.gasto > 0 ? Infinity : 0); });

  const porTipo = { necessidade: { planejado: 0, gasto: 0 }, desejo: { planejado: 0, gasto: 0 }, poupanca: { planejado: 0, gasto: 0 } };
  folhas(state).forEach((t) => {
    porTipo[t.tipo].planejado += porTopico[t.id].planejado;
    porTipo[t.tipo].gasto += porTopico[t.id].gasto;
  });

  return {
    mesId, renda: renda.total, rendaPorUsuario: renda.porUsuario,
    planejado, faltaDistribuir: renda.total - planejado,
    gasto, gastoConsumo, semCategoria, entradas, previstas, nTransacoes,
    saldo: renda.total - gasto,
    taxaPoupanca: renda.total > 0 ? (renda.total - gastoConsumo) / renda.total : 0,
    porTopico, porTipo
  };
}

/** Série mensal para o gráfico de evolução: [{mes, renda, gasto, poupanca, previstas, futuro}]. */
export function serieMensal(state, mesCentral, antes = 5, depois = 5) {
  const out = [];
  for (let i = -antes; i <= depois; i++) {
    const mesId = addMeses(mesCentral, i);
    const r = resumoMes(state, mesId);
    out.push({ mes: mesId, renda: r.renda, gasto: r.gasto, poupanca: r.renda - r.gastoConsumo, previstas: r.previstas, offset: i });
  }
  return out;
}

/** Tópicos que estouraram o planejado no mês (folhas e grupos de topo). */
export function topicosEstourados(state, mesId, resumo = resumoMes(state, mesId)) {
  return state.topicos
    .filter((t) => !t.topicoPai)
    .map((t) => ({ topico: t, ...resumo.porTopico[t.id] }))
    .filter((x) => x.gasto > x.planejado && x.gasto > 0)
    .sort((a, b) => (b.gasto - b.planejado) - (a.gasto - a.planejado));
}
