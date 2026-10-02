/* Gráficos do dashboard (ECharts). Cada função recebe o elemento, os dados e um callback de clique. */

import { brl, pct } from '../format.js';
import { nomeMesCurto } from '../datas.js';
import { criarGrafico, coresTema, tooltipValorPct } from './base.js';
import { raizes, COR_SEM_TOPICO, TIPOS } from '../views/comum.js';
import { serieMensal } from '../domain/orcamento.js';

const sobreRenda = (v, renda) => (renda > 0 ? pct((v / renda) * 100) : '—');

/** Rosca: % de cada pessoa na renda total. */
export function roscaUsuarios(el, state, resumo, aoClicar) {
  const dados = state.usuarios.map((u) => ({ name: u.nome, value: resumo.rendaPorUsuario[u.id].total, itemStyle: { color: u.cor }, ref: u.id })).filter((d) => d.value > 0);
  if (!dados.length) return null;
  return criarGrafico(el, {
    tooltip: tooltipValorPct(resumo.renda),
    series: [{ type: 'pie', radius: ['52%', '78%'], avoidLabelOverlap: true, label: { color: coresTema().texto, formatter: (p) => p.name + '\n' + pct(p.percent) }, data: dados }]
  }, { aoClicar: (p) => aoClicar(p.data.ref) });
}

/** Rosca: % de cada tópico (de topo) sobre a renda, com "Sem destino". */
export function roscaTopicos(el, state, resumo, aoClicar) {
  const dados = [];
  TIPOS.forEach((tipo) => raizes(state, tipo).forEach((r) => {
    const v = resumo.porTopico[r.id].planejado;
    if (v > 0) dados.push({ name: r.nome, value: v, itemStyle: { color: r.cor }, ref: r.id });
  }));
  if (resumo.faltaDistribuir > 0) dados.push({ name: 'Sem destino', value: resumo.faltaDistribuir, itemStyle: { color: COR_SEM_TOPICO }, ref: null });
  if (!dados.length) return null;
  return criarGrafico(el, {
    tooltip: tooltipValorPct(resumo.renda),
    series: [{ type: 'pie', radius: ['52%', '78%'], label: { color: coresTema().texto, formatter: (p) => p.name + '\n' + sobreRenda(p.value, resumo.renda) }, data: dados }]
  }, { aoClicar: (p) => { if (p.data.ref) aoClicar(p.data.ref); } });
}

/** Barras horizontais: planejado x realizado por tópico (de topo). */
export function barrasPlanejadoRealizado(el, state, resumo, aoClicar) {
  const c = coresTema();
  const itens = [];
  TIPOS.forEach((tipo) => raizes(state, tipo).forEach((r) => {
    const p = resumo.porTopico[r.id];
    if (p.planejado > 0 || p.gasto > 0) itens.push({ t: r, ...p });
  }));
  if (!itens.length) return null;
  itens.reverse();
  const tip = { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: c.superficie, borderColor: c.grade, textStyle: { color: c.texto },
    formatter: (ps) => '<b>' + ps[0].name + '</b><br>' + ps.map((x) => x.marker + x.seriesName + ': ' + brl(x.value)).join('<br>') };
  return criarGrafico(el, {
    tooltip: tip, legend: { top: 0, textStyle: { color: c.suave } },
    grid: { left: 8, right: 24, top: 30, bottom: 8, containLabel: true },
    xAxis: { type: 'value', axisLabel: { color: c.suave, formatter: (v) => 'R$ ' + (v / 100).toLocaleString('pt-BR') }, splitLine: { lineStyle: { color: c.grade } } },
    yAxis: { type: 'category', data: itens.map((i) => i.t.nome), axisLabel: { color: c.texto } },
    series: [
      { name: 'Planejado', type: 'bar', barGap: '10%', data: itens.map((i) => i.planejado), itemStyle: { color: c.grade, borderColor: c.suave, borderWidth: 1 } },
      { name: 'Realizado', type: 'bar', data: itens.map((i) => ({ value: i.gasto, itemStyle: { color: i.gasto > i.planejado ? c.erro : i.t.cor } })) }
    ]
  }, { aoClicar: (p) => aoClicar(itens[p.dataIndex].t.id) });
}

/** Barras empilhadas: gasto por pessoa, separado por cartão. */
export function gastosPorCartaoUsuario(el, state, mesId, aoClicar) {
  const c = coresTema();
  const doMes = state.transacoes.filter((t) => t.data.slice(0, 7) === mesId && t.status !== 'prevista' && t.tipo === 'saida');
  if (!doMes.length) return null;
  const chavesUsuario = [...state.usuarios.map((u) => u.id), ''];
  const nomeUsuario = (id) => (state.usuarios.find((u) => u.id === id) || { nome: 'Sem pessoa' }).nome;
  const cartoes = [...new Set(doMes.map((t) => t.finalCartao || ''))];
  const rotuloCartao = (f) => (f ? (state.cartoes.find((x) => x.finalCartao === f) || {}).apelido || 'Cartão ' + f : 'Sem cartão');
  const cores = ['#4f7cac', '#e07a5f', '#81b29a', '#9b72aa', '#d4a373', '#3d9a9a'];
  const usuariosComGasto = chavesUsuario.filter((u) => doMes.some((t) => (t.usuarioId || '') === u));
  return criarGrafico(el, {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: c.superficie, borderColor: c.grade, textStyle: { color: c.texto },
      formatter: (ps) => '<b>' + ps[0].name + '</b><br>' + ps.filter((x) => x.value > 0).map((x) => x.marker + x.seriesName + ': ' + brl(x.value)).join('<br>') },
    legend: { top: 0, textStyle: { color: c.suave } },
    grid: { left: 8, right: 16, top: 34, bottom: 8, containLabel: true },
    xAxis: { type: 'category', data: usuariosComGasto.map(nomeUsuario), axisLabel: { color: c.texto } },
    yAxis: { type: 'value', axisLabel: { color: c.suave, formatter: (v) => 'R$ ' + (v / 100).toLocaleString('pt-BR') }, splitLine: { lineStyle: { color: c.grade } } },
    series: cartoes.map((f, i) => ({
      name: rotuloCartao(f), type: 'bar', stack: 'g', itemStyle: { color: cores[i % cores.length] },
      data: usuariosComGasto.map((u) => doMes.filter((t) => (t.usuarioId || '') === u && (t.finalCartao || '') === f).reduce((s, t) => s + t.valor, 0))
    }))
  }, { aoClicar: (p) => aoClicar(usuariosComGasto[p.dataIndex]) });
}

/** Linhas: renda, gasto e poupança; parcelas previstas tracejadas nos meses futuros. */
export function evolucaoMensal(el, state, mesId) {
  const c = coresTema();
  const serie = serieMensal(state, mesId, 5, 5);
  const meses = serie.map((s) => nomeMesCurto(s.mes));
  const passado = (campo) => serie.map((s) => (s.offset <= 0 ? s[campo] : null));
  const futuro = serie.map((s) => (s.offset >= 0 ? (s.offset === 0 ? s.gasto + s.previstas : s.previstas) : null));
  const fmt = (v) => (v == null ? '' : brl(v));
  return criarGrafico(el, {
    tooltip: { trigger: 'axis', backgroundColor: c.superficie, borderColor: c.grade, textStyle: { color: c.texto },
      formatter: (ps) => '<b>' + ps[0].axisValue + '</b><br>' + ps.filter((x) => x.value != null).map((x) => x.marker + x.seriesName + ': ' + fmt(x.value)).join('<br>') },
    legend: { top: 0, textStyle: { color: c.suave } },
    grid: { left: 8, right: 20, top: 34, bottom: 8, containLabel: true },
    xAxis: { type: 'category', data: meses, axisLabel: { color: c.suave } },
    yAxis: { type: 'value', axisLabel: { color: c.suave, formatter: (v) => 'R$ ' + (v / 100).toLocaleString('pt-BR') }, splitLine: { lineStyle: { color: c.grade } } },
    series: [
      { name: 'Renda', type: 'line', smooth: true, data: serie.map((s) => s.renda), itemStyle: { color: c.primaria }, lineStyle: { width: 3 } },
      { name: 'Gasto', type: 'line', smooth: true, data: passado('gasto'), itemStyle: { color: '#e07a5f' }, lineStyle: { width: 3 } },
      { name: 'Poupança (sobra)', type: 'line', smooth: true, data: passado('poupanca'), itemStyle: { color: '#81b29a' }, lineStyle: { width: 3 } },
      { name: 'Gasto + parcelas previstas', type: 'line', smooth: true, data: futuro, itemStyle: { color: '#e07a5f' }, lineStyle: { width: 2, type: 'dashed' }, symbol: 'emptyCircle' }
    ]
  });
}
