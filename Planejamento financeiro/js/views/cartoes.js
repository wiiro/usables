/* Cartões e Faturas (padrão dos apps brasileiros): cartão por cartão, faturas por mês,
   status da validação e parcelas futuras comprometidas. */

import { App, update } from '../state.js';
import { esc, brl, uid } from '../format.js';
import { fmtData, nomeMes, mesDe } from '../datas.js';
import { icone } from '../icons.js';
import { estadoVazio, modal, toast, confirmar, selo } from '../ui.js';
import { navegar, verTransacoes, comDesfazer } from '../nav.js';
import { opcoesUsuario, usuarioDe } from './comum.js';
import { abrirTextoExtraido } from './texto-extraido.js';

export const titulo = 'Cartões e Faturas';
const BANCOS = { itau: 'Itaú', nubank: 'Nubank', outro: 'Outro banco' };

const gastoDoCartao = (state, c, mes) => state.transacoes.filter((t) => t.finalCartao === c.finalCartao && t.status !== 'prevista' && t.tipo === 'saida' && mesDe(t.data) === mes).reduce((s, t) => s + t.valor, 0);

function faturaDoMes(state, c, mes) {
  return state.faturas.filter((f) => f.cartaoId === c.id).sort((a, b) => (a.dataFechamento < b.dataFechamento ? 1 : -1))
    .find((f) => mesDe(f.dataVencimento || f.dataFechamento) === mes || mesDe(f.dataFechamento) === mes);
}

function statusFatura(f) {
  if (!f) return '';
  if (f.totalFatura == null) return selo('sem total para validar', 'aviso');
  const dif = f.totalFatura - f.totalExtraido;
  return dif === 0 ? selo('✔ bateu', 'ok') : selo('diferença de ' + brl(Math.abs(dif)), 'erro');
}

function listaCartoes(state, mes) {
  if (!state.cartoes.length) {
    return '<div class="card">' + estadoVazio({ icone: 'cartoes', titulo: 'Nenhum cartão cadastrado', texto: 'Os cartões aparecem sozinhos quando você importa uma fatura em PDF — ou cadastre um manualmente.', acao: { acao: 'cartao-novo', rotulo: '+ Cadastrar cartão' } }) +
      '<p style="text-align:center"><button class="btn btn-sec" data-acao="ir-importar">' + icone('importar') + ' Importar fatura</button></p></div>';
  }
  return '<div class="grade-cartoes">' + state.cartoes.map((c) => {
    const u = usuarioDe(state, c.usuarioId);
    const f = faturaDoMes(state, c, mes);
    const valor = f ? f.totalFatura ?? f.totalExtraido : gastoDoCartao(state, c, mes);
    return '<button class="card cartao-card" data-acao="cartao-abrir" data-id="' + c.id + '"><div class="cartao-visual ' + esc(c.banco) + '"><span>' + esc(BANCOS[c.banco] || c.banco) + '</span><span class="final">•••• ' + esc(c.finalCartao) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;gap:8px"><b>' + esc(c.apelido) + '</b>' + (u ? '<span><i class="cor-bolinha" style="background:' + esc(u.cor) + '"></i> ' + esc(u.nome) + '</span>' : '<span class="fraco">sem pessoa</span>') + '</div>' +
      '<div class="suave" style="font-size:.85rem">Fecha dia ' + (c.diaFechamento || '—') + ' · vence dia ' + (c.diaVencimento || '—') + '</div>' +
      '<div style="margin-top:10px" class="suave">' + (f ? 'Fatura de ' + esc(nomeMes(mes, false)) : 'Gastos de ' + esc(nomeMes(mes, false))) + '</div><div class="num" style="font-size:1.3rem;font-weight:700">' + brl(valor) + '</div>' + (f ? statusFatura(f) : '') + '</button>';
  }).join('') + '</div>';
}

function detalhe(state, c) {
  const u = usuarioDe(state, c.usuarioId);
  const faturas = state.faturas.filter((f) => f.cartaoId === c.id).sort((a, b) => (a.dataFechamento < b.dataFechamento ? 1 : -1));
  const previstas = state.transacoes.filter((t) => t.status === 'prevista' && t.finalCartao === c.finalCartao);
  const porMes = {};
  previstas.forEach((t) => { const m = mesDe(t.data); (porMes[m] = porMes[m] || { total: 0, n: 0 }); porMes[m].total += t.valor; porMes[m].n++; });
  const meses = Object.keys(porMes).sort();
  const totalComprometido = previstas.reduce((s, t) => s + t.valor, 0);

  return '<div class="pilha"><div class="filtros"><button class="btn btn-sec" data-acao="cartao-voltar">' + icone('chevL') + ' Todos os cartões</button><span style="margin-left:auto" class="filtros"><button class="btn btn-sec btn-pequeno" data-acao="cartao-editar" data-id="' + c.id + '">' + icone('edit', 16) + ' Editar</button><button class="btn btn-sec btn-pequeno" data-acao="cartao-excluir" data-id="' + c.id + '">' + icone('trash', 16) + ' Excluir</button></span></div>' +
    '<div class="card"><div class="cartao-visual ' + esc(c.banco) + '" style="max-width:420px"><span>' + esc(BANCOS[c.banco] || c.banco) + ' · ' + esc(c.apelido) + '</span><span class="final">•••• ' + esc(c.finalCartao) + '</span></div>' +
    '<p class="suave" style="margin:0">' + (u ? 'Titular no app: <b>' + esc(u.nome) + '</b> · ' : '') + 'fecha dia ' + (c.diaFechamento || '—') + ', vence dia ' + (c.diaVencimento || '—') + '. Só os 4 últimos dígitos são guardados.</p></div>' +
    '<div class="card"><header><h2>Faturas</h2></header>' +
    (faturas.length ? '<div class="tabela-wrap"><table class="tabela"><thead><tr><th>Vencimento</th><th>Fechamento</th><th class="dir">Total da fatura</th><th class="dir">Soma extraída</th><th>Validação</th><th></th></tr></thead><tbody>' + faturas.map((f) =>
      '<tr><td class="num">' + fmtData(f.dataVencimento) + '</td><td class="num">' + fmtData(f.dataFechamento) + '</td><td class="num dir">' + (f.totalFatura == null ? '—' : brl(f.totalFatura)) + '</td><td class="num dir">' + brl(f.totalExtraido) + '</td><td>' + statusFatura(f) + '</td>' +
      '<td style="white-space:nowrap"><button class="btn-link" data-acao="fatura-ver" data-id="' + f.id + '">Transações</button> ' + (f.textoExtraido ? '<button class="btn-link" data-acao="fatura-texto" data-id="' + f.id + '">Ver texto extraído</button>' : '') + ' <button class="icone-btn peq" data-acao="fatura-excluir" data-id="' + f.id + '" aria-label="Excluir fatura" title="Excluir fatura e suas transações">' + icone('trash', 16) + '</button></td></tr>').join('') + '</tbody></table></div>'
      : estadoVazio({ icone: 'pdf', titulo: 'Nenhuma fatura importada para este cartão', texto: 'Importe o PDF da fatura para acompanhar o fechamento e validar o total.', acao: { acao: 'ir-importar', rotulo: 'Importar fatura' } })) + '</div>' +
    '<div class="card"><header><h2>Parcelas futuras comprometidas</h2>' + (totalComprometido ? '<span class="num suave">Total: <b style="color:var(--texto)">' + brl(totalComprometido) + '</b></span>' : '') + '</header>' +
    (meses.length ? '<div class="tabela-wrap"><table class="tabela"><thead><tr><th>Mês</th><th class="dir">Parcelas</th><th class="dir">Valor previsto</th></tr></thead><tbody>' + meses.map((m) => '<tr><td>' + esc(nomeMes(m)) + '</td><td class="num dir">' + porMes[m].n + '</td><td class="num dir">' + brl(porMes[m].total) + '</td></tr>').join('') + '</tbody></table></div>'
      : '<p class="suave">Nenhuma parcela futura conhecida para este cartão.</p>') + '</div></div>';
}

export function render({ state, mes }) {
  const aberto = App.ui.cartaoAberto && state.cartoes.find((c) => c.id === App.ui.cartaoAberto);
  const topo = aberto ? '' : '<div class="filtros"><span class="suave">Valores referentes a ' + esc(nomeMes(mes)) + '.</span><button class="btn btn-sec" style="margin-left:auto" data-acao="cartao-novo">' + icone('plus') + ' Cadastrar cartão</button></div>';
  return topo + (aberto ? detalhe(state, aberto) : listaCartoes(state, mes));
}

async function formCartao(base = {}) {
  const s = App.state;
  let dados = null;
  const r = await modal({
    titulo: base.id ? 'Editar cartão' : 'Cadastrar cartão',
    corpo: '<div class="linha-form"><label class="campo"><span>Banco</span><select id="cc-banco">' + Object.entries(BANCOS).map(([k, v]) => '<option value="' + k + '"' + (k === (base.banco || 'itau') ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></label>' +
      '<label class="campo"><span>Final (4 últimos dígitos)</span><input id="cc-final" inputmode="numeric" maxlength="4" value="' + esc(base.finalCartao || '') + '"></label></div>' +
      '<label class="campo"><span>Apelido</span><input id="cc-apelido" maxlength="40" value="' + esc(base.apelido || '') + '" placeholder="Ex.: Itaú da Ana"></label>' +
      '<label class="campo"><span>Pessoa</span><select id="cc-usuario">' + opcoesUsuario(s, base.usuarioId || '') + '</select></label>' +
      '<div class="linha-form"><label class="campo"><span>Dia de fechamento</span><input id="cc-fecha" inputmode="numeric" maxlength="2" value="' + esc(base.diaFechamento || '') + '"></label>' +
      '<label class="campo"><span>Dia de vencimento</span><input id="cc-venc" inputmode="numeric" maxlength="2" value="' + esc(base.diaVencimento || '') + '"></label></div>' +
      '<p id="cc-erro" role="alert" style="color:var(--erro);min-height:1.2em;margin:8px 0 0"></p><p class="fraco" style="font-size:.82rem">Nunca guardamos o número completo do cartão.</p>',
    botoes: [{ rotulo: 'Cancelar', id: 'cancelar' }, { rotulo: 'Salvar', id: 'salvar', primario: true }],
    validar: (d) => {
      const v = (id) => d.querySelector(id).value.trim();
      const erro = (m) => { d.querySelector('#cc-erro').textContent = m; return false; };
      if (!/^\d{4}$/.test(v('#cc-final'))) return erro('Informe exatamente os 4 últimos dígitos.');
      const dia = (x) => (x === '' ? null : Number(x));
      const dias = [dia(v('#cc-fecha')), dia(v('#cc-venc'))];
      if (dias.some((x) => x !== null && !(x >= 1 && x <= 31))) return erro('Os dias devem estar entre 1 e 31.');
      dados = { banco: v('#cc-banco'), finalCartao: v('#cc-final'), apelido: v('#cc-apelido') || (BANCOS[v('#cc-banco')] + ' ' + v('#cc-final')), usuarioId: v('#cc-usuario') || null, diaFechamento: dias[0], diaVencimento: dias[1] };
      return true;
    }
  });
  return r === 'salvar' ? dados : null;
}

export const acoes = {
  'ir-importar': () => navegar('importar'),
  'cartao-abrir': (el) => { App.ui.cartaoAberto = el.dataset.id; App.render(); },
  'cartao-voltar': () => { App.ui.cartaoAberto = null; App.render(); },
  'cartao-novo': async () => {
    const d = await formCartao();
    if (!d) return;
    if (App.state.cartoes.some((c) => c.banco === d.banco && c.finalCartao === d.finalCartao)) { toast('Esse cartão já está cadastrado.', { tipo: 'erro' }); return; }
    update((s) => { s.cartoes.push({ id: uid(), ...d }); });
    toast('Cartão cadastrado.');
  },
  'cartao-editar': async (el) => {
    const c = App.state.cartoes.find((x) => x.id === el.dataset.id);
    const d = await formCartao(c);
    if (!d) return;
    update((s) => { Object.assign(s.cartoes.find((x) => x.id === c.id), d); });
    toast('Cartão atualizado.');
  },
  'cartao-excluir': async (el) => {
    if (!(await confirmar('Excluir este cartão? As faturas e transações já importadas continuam salvas.', { titulo: 'Excluir cartão', rotulo: 'Excluir', perigo: true }))) return;
    comDesfazer('Cartão excluído.', (s) => { s.cartoes = s.cartoes.filter((c) => c.id !== el.dataset.id); s.faturas.forEach((f) => { if (f.cartaoId === el.dataset.id) f.cartaoId = null; }); });
    App.ui.cartaoAberto = null;
  },
  'fatura-ver': (el) => {
    const f = App.state.faturas.find((x) => x.id === el.dataset.id);
    const c = App.state.cartoes.find((x) => x.id === f.cartaoId);
    verTransacoes({ finalCartao: c ? c.finalCartao : '', todosMeses: true, origem: 'pdf' });
  },
  'fatura-texto': (el) => {
    const f = App.state.faturas.find((x) => x.id === el.dataset.id);
    return abrirTextoExtraido(f.textoExtraido, { titulo: 'Texto extraído — fatura ' + (BANCOS[f.banco] || f.banco), jaMascarado: true });
  },
  'fatura-excluir': async (el) => {
    const f = App.state.faturas.find((x) => x.id === el.dataset.id);
    const n = App.state.transacoes.filter((t) => t.idImportacao === f.idImportacao).length;
    if (!(await confirmar('Excluir esta fatura e as ' + n + ' transações importadas com ela? (Dá para desfazer logo em seguida.)', { titulo: 'Excluir fatura', rotulo: 'Excluir', perigo: true }))) return;
    comDesfazer('Fatura e ' + n + ' transações excluídas.', (s) => { s.faturas = s.faturas.filter((x) => x.id !== f.id); s.transacoes = s.transacoes.filter((t) => t.idImportacao !== f.idImportacao); });
  }
};
