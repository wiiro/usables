/* Dashboard (padrão Monarch): cards de resumo, Sankey e grade de gráficos. */

import { addMeses, fmtData } from '../datas.js';
import { esc, brl, pct } from '../format.js';
import { icone } from '../icons.js';
import { estadoVazio, selo } from '../ui.js';
import { resumoMes, topicosEstourados } from '../domain/orcamento.js';
import { navegar, verTransacoes } from '../nav.js';
import { montarSankey } from '../charts/sankey.js';
import * as G from '../charts/graficos.js';
import { nomeTopico, corTopico, bolinha, selosTransacao } from './comum.js';

export const titulo = 'Dashboard';

/** ▲/▼ % em relação ao mês anterior. `maisEhBom`: true = subir é bom (renda), false = subir é ruim (gasto). */
function variacao(atual, anterior, maisEhBom) {
  if (!anterior && !atual) return '<span class="comp">sem movimento no mês anterior</span>';
  if (!anterior) return '<span class="comp">novo vs. mês anterior</span>';
  const v = ((atual - anterior) / Math.abs(anterior)) * 100;
  if (Math.abs(v) < 0.05) return '<span class="comp">= igual ao mês anterior</span>';
  const sobe = v > 0;
  const bom = sobe === maisEhBom;
  return '<span class="comp"><span class="' + (bom ? 'bom' : 'ruim') + '">' + (sobe ? '▲' : '▼') + ' ' + pct(Math.abs(v)) + '</span> vs. mês anterior</span>';
}

function variacaoPP(atual, anterior) {
  const d = (atual - anterior) * 100;
  if (Math.abs(d) < 0.05) return '<span class="comp">= igual ao mês anterior</span>';
  return '<span class="comp"><span class="' + (d > 0 ? 'bom' : 'ruim') + '">' + (d > 0 ? '▲' : '▼') + ' ' + pct(Math.abs(d)) + ' p.p.</span> vs. mês anterior</span>';
}

function cartao(rotulo, ic, valor, comp, cls = '') {
  return '<div class="card card-resumo ' + cls + '"><div class="rotulo">' + icone(ic, 16) + rotulo + '</div><div class="valor num">' + valor + '</div>' + comp + '</div>';
}

export function render({ state, mes, resumo: r }) {
  if (!state.usuarios.length || !state.topicos.length) {
    return '<div class="card">' + estadoVazio({
      icone: 'planejamento', titulo: 'Seu painel começa no Planejamento',
      texto: !state.usuarios.length ? 'Cadastre as pessoas e seus salários para ver quanto cada uma representa da renda.' : 'Crie tópicos (Moradia, Mercado, Lazer…) e distribua a renda entre eles.',
      acao: { acao: 'ir-planejamento', rotulo: 'Ir para Planejamento' }
    }) + '</div>';
  }
  const ant = resumoMes(state, addMeses(mes, -1));
  const faltaCls = r.faltaDistribuir < 0 ? 'alerta' : r.faltaDistribuir === 0 ? 'bom' : '';
  const cards =
    cartao('Renda total', 'user', brl(r.renda), variacao(r.renda, ant.renda, true)) +
    cartao('Total planejado', 'planejamento', brl(r.planejado), variacao(r.planejado, ant.planejado, true)) +
    cartao('Total gasto', 'transacoes', brl(r.gasto), variacao(r.gasto, ant.gasto, false)) +
    cartao('Saldo do mês', 'cloud', brl(r.saldo), variacao(r.saldo, ant.saldo, true), r.saldo < 0 ? 'alerta' : '') +
    cartao('Taxa de poupança', 'arrowUp', pct(r.taxaPoupanca * 100), variacaoPP(r.taxaPoupanca, ant.taxaPoupanca)) +
    cartao('Valor sem destino', 'info', brl(r.faltaDistribuir), variacao(r.faltaDistribuir, ant.faltaDistribuir, false), faltaCls) +
    cartao('Parcelas previstas', 'calendar', brl(r.previstas), variacao(r.previstas, ant.previstas, false));

  const ultimas = state.transacoes.filter((t) => t.data.slice(0, 7) === mes && t.status !== 'prevista').sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 6);
  const estourados = topicosEstourados(state, mes, r).slice(0, 6);

  return '<div class="grade grade-resumo" aria-label="Resumo do mês">' + cards + '</div>' +
    '<section class="card" style="margin-top:16px"><header><h2>Para onde vai a renda (planejado)</h2><span class="suave">Clique em um nó para ver as transações</span></header><div class="grafico grafico-sankey" id="g-sankey" role="img" aria-label="Diagrama Sankey: pessoas, renda total e tópicos"></div></section>' +
    '<div class="grade grade-graficos">' +
    '<section class="card"><header><h3>Renda por pessoa</h3></header><div class="grafico" id="g-usuarios" role="img" aria-label="Rosca com o percentual de cada pessoa na renda"></div></section>' +
    '<section class="card"><header><h3>Tópicos sobre a renda</h3></header><div class="grafico" id="g-topicos" role="img" aria-label="Rosca com o percentual de cada tópico sobre a renda"></div></section>' +
    '<section class="card"><header><h3>Planejado × realizado</h3></header><div class="grafico grafico-alto" id="g-planreal" role="img" aria-label="Barras de planejado versus realizado por tópico"></div></section>' +
    '<section class="card"><header><h3>Gastos por cartão e pessoa</h3></header><div class="grafico grafico-alto" id="g-cartoes" role="img" aria-label="Gastos por pessoa separados por cartão"></div></section>' +
    '<section class="card" style="grid-column:1/-1"><header><h3>Evolução mensal</h3><span class="suave">Linha tracejada: parcelas previstas</span></header><div class="grafico grafico-alto" id="g-evolucao" role="img" aria-label="Evolução mensal de renda, gasto e poupança"></div></section>' +
    '<section class="card"><header><h3>Últimas transações</h3><button class="btn-link" data-acao="dash-ver-todas">Ver todas</button></header>' +
    (ultimas.length ? '<ul class="lista-mini" style="margin:0;padding:0">' + ultimas.map((t) => '<li class="item-mini"><div class="meio"><div class="t">' + esc(t.descricao) + ' ' + selosTransacao(t) + '</div><div class="fraco" style="font-size:.8rem">' + fmtData(t.data) + ' · ' + bolinha(corTopico(state, t.topicoId)) + ' ' + esc(nomeTopico(state, t.topicoId)) + '</div></div><div class="num ' + (t.tipo === 'entrada' ? 'valor-entrada' : 'valor-saida') + '">' + (t.tipo === 'entrada' ? '+' : '') + brl(t.valor) + '</div></li>').join('') + '</ul>'
      : estadoVazio({ icone: 'transacoes', titulo: 'Nenhuma transação neste mês', texto: 'Lance uma transação manualmente ou importe um CSV/fatura.', acao: { acao: 'ir-importar', rotulo: 'Importar extrato ou fatura' } })) + '</section>' +
    '<section class="card"><header><h3>Tópicos que estouraram</h3></header>' +
    (estourados.length ? '<ul class="lista-mini" style="margin:0;padding:0">' + estourados.map((e) => '<li class="item-mini"><div class="meio"><button class="link-card t" data-acao="ver-topico" data-id="' + esc(e.topico.id) + '">' + bolinha(e.topico.cor) + ' ' + esc(e.topico.nome) + '</button><div class="fraco" style="font-size:.8rem">' + brl(e.gasto) + ' de ' + brl(e.planejado) + '</div></div>' + selo('+' + brl(e.gasto - e.planejado), 'erro') + '</li>').join('') + '</ul>'
      : '<div class="vazio" style="padding:20px">' + icone('check', 30) + '<p>Nenhum tópico estourou o planejado. 👏</p></div>') + '</section>' +
    '</div>';
}

export function montar(el, { state, mes, resumo }) {
  if (!state.usuarios.length || !state.topicos.length) return;
  const q = (id) => el.querySelector('#' + id);
  const aoTopico = (id) => verTransacoes({ topicoId: id });
  const aoUsuario = (id) => verTransacoes({ usuarioId: id || '' });
  montarSankey(q('g-sankey'), state, resumo, (tipo, ref) => (tipo === 'usuario' ? aoUsuario(ref) : aoTopico(ref)));
  G.roscaUsuarios(q('g-usuarios'), state, resumo, aoUsuario);
  G.roscaTopicos(q('g-topicos'), state, resumo, aoTopico);
  G.barrasPlanejadoRealizado(q('g-planreal'), state, resumo, aoTopico);
  G.gastosPorCartaoUsuario(q('g-cartoes'), state, mes, aoUsuario);
  G.evolucaoMensal(q('g-evolucao'), state, mes);
  // gráficos sem dados mostram uma mensagem curta no lugar do canvas vazio
  ['g-usuarios', 'g-topicos', 'g-planreal', 'g-cartoes'].forEach((id) => {
    const c = q(id);
    if (c && !c.querySelector('canvas')) c.innerHTML = '<div class="vazio" style="padding:50px 10px">' + icone('info', 28) + '<p>Sem dados para este mês ainda.</p></div>';
  });
  const sk = q('g-sankey');
  if (sk && !sk.querySelector('canvas')) sk.innerHTML = '<div class="vazio">' + icone('info', 28) + '<p>Defina valores no Planejamento para ver o fluxo da renda.</p></div>';
}

export const acoes = {
  'ir-planejamento': () => navegar('planejamento'),
  'ir-importar': () => navegar('importar'),
  'dash-ver-todas': () => verTransacoes({}),
  'ver-topico': (el) => verTransacoes({ topicoId: el.dataset.id })
};
