/* Transações: tabela com busca, filtros, ordenação, edição do tópico na linha e
   recategorização em lote. */

import { App, update } from '../state.js';
import { esc, brl, normalizar, uid } from '../format.js';
import { fmtData, nomeMes } from '../datas.js';
import { icone } from '../icons.js';
import { estadoVazio, toast } from '../ui.js';
import { filtrarTransacoes, ordenar } from '../domain/transacoes.js';
import { sugerirPalavraChave, casaPalavra } from '../domain/regras.js';
import { navegar, filtrosPadrao, comDesfazer } from '../nav.js';
import { abrirNovaTransacao } from './nova-transacao.js';
import { opcoesTopico, opcoesUsuario, iconeOrigem, selosTransacao, usuarioDe, nomeTopico } from './comum.js';

export const titulo = 'Transações';
const LIMITE = 200;

function filtrosAtuais() {
  const f = App.ui.filtros;
  return { ...f, mes: f.todosMeses ? null : App.ui.mes };
}

function opcoesFiltro(lista, sel, vazio) {
  return '<option value="">' + vazio + '</option>' + lista.map(([v, r]) => '<option value="' + esc(v) + '"' + (v === sel ? ' selected' : '') + '>' + esc(r) + '</option>').join('');
}

function cabecalho(campo, rotulo, f) {
  const ativa = f.ordem === campo;
  return '<th class="ordenavel" data-acao="tr-ordenar" data-campo="' + campo + '" aria-sort="' + (ativa ? (f.dir === 'asc' ? 'ascending' : 'descending') : 'none') + '">' + rotulo + (ativa ? (f.dir === 'asc' ? ' ▲' : ' ▼') : '') + '</th>';
}

export function render({ state }) {
  const f = App.ui.filtros;
  const sel = App.ui.selecionadas;
  const todas = filtrarTransacoes(state, filtrosAtuais());
  const lista = ordenar(todas, f.ordem, f.dir);
  const visiveis = lista.slice(0, App.ui.limiteTransacoes || LIMITE);
  const finais = [...new Set(state.transacoes.map((t) => t.finalCartao).filter(Boolean))].sort();
  const entradas = todas.filter((t) => t.tipo === 'entrada' && t.status !== 'prevista').reduce((s, t) => s + t.valor, 0);
  const saidas = todas.filter((t) => t.tipo === 'saida' && t.status !== 'prevista').reduce((s, t) => s + t.valor, 0);
  const filtrado = f.busca || f.usuarioId || f.topicoId || f.finalCartao || f.origem || f.status !== 'todas';

  const barra =
    '<div class="filtros"><div class="busca">' + icone('search', 16) + '<input class="entrada" type="search" placeholder="Buscar descrição…" data-entrada="tr-busca" data-fk="tr-busca" value="' + esc(f.busca) + '" aria-label="Buscar"></div>' +
    '<select class="entrada" data-ed="tr-filtro" data-campo="usuarioId" aria-label="Filtrar por pessoa">' + opcoesFiltro(state.usuarios.map((u) => [u.id, u.nome]), f.usuarioId, 'Todas as pessoas') + '</select>' +
    '<select class="entrada" data-ed="tr-filtro" data-campo="topicoId" aria-label="Filtrar por tópico"><option value="">Todos os tópicos</option><option value="__sem"' + (f.topicoId === '__sem' ? ' selected' : '') + '>Não categorizado</option>' + opcoesTopico(state, f.topicoId, null) + '</select>' +
    '<select class="entrada" data-ed="tr-filtro" data-campo="finalCartao" aria-label="Filtrar por cartão">' + opcoesFiltro(finais.map((x) => [x, 'Cartão final ' + x]), f.finalCartao, 'Todos os cartões') + '</select>' +
    '<select class="entrada" data-ed="tr-filtro" data-campo="origem" aria-label="Filtrar por origem">' + opcoesFiltro([['manual', 'Manual'], ['csv', 'CSV'], ['pdf', 'Fatura PDF']], f.origem, 'Todas as origens') + '</select>' +
    '<select class="entrada" data-ed="tr-filtro" data-campo="status" aria-label="Filtrar por status">' + [['todas', 'Realizadas e previstas'], ['realizada', 'Só realizadas'], ['prevista', 'Só previstas']].map(([v, r]) => '<option value="' + v + '"' + (f.status === v ? ' selected' : '') + '>' + r + '</option>').join('') + '</select>' +
    '<label style="display:flex;gap:6px;align-items:center;font-size:.88rem"><input type="checkbox" data-ed="tr-todos-meses" ' + (f.todosMeses ? 'checked' : '') + '> Todos os meses</label>' +
    (filtrado || f.todosMeses ? '<button class="btn-link" data-acao="tr-limpar">Limpar filtros</button>' : '') + '</div>';

  const lote = sel.size
    ? '<div class="barra-lote" role="region" aria-label="Ações em lote"><span>' + sel.size + ' selecionada(s)</span><select class="entrada" id="lote-topico" aria-label="Tópico para as selecionadas">' + opcoesTopico(state, '', 'Escolher tópico…') + '</select>' +
      '<button class="btn btn-primario btn-pequeno" data-acao="tr-lote-aplicar">Recategorizar</button><button class="btn btn-sec btn-pequeno" data-acao="tr-lote-excluir">Excluir</button><button class="btn-link" data-acao="tr-lote-limpar">Cancelar seleção</button></div>' : '';

  const linhas = visiveis.map((t) => {
    const u = usuarioDe(state, t.usuarioId);
    return '<tr class="' + (t.status === 'prevista' ? 'prevista' : '') + '"><td><input type="checkbox" data-ed="tr-sel" data-id="' + t.id + '" ' + (sel.has(t.id) ? 'checked' : '') + ' aria-label="Selecionar ' + esc(t.descricao) + '"></td>' +
      '<td class="num">' + fmtData(t.data) + '</td><td class="desc" title="' + esc(t.descricao) + '">' + esc(t.descricao) + ' ' + selosTransacao(t) + '</td><td>' + iconeOrigem(t.origem) + '</td>' +
      '<td>' + (t.tipo === 'entrada' ? '<span class="fraco">—</span>' : '<select class="ed" data-ed="tr-topico" data-id="' + t.id + '" aria-label="Tópico de ' + esc(t.descricao) + '">' + opcoesTopico(state, t.topicoId || '') + '</select>') + '</td>' +
      '<td>' + (u ? '<i class="cor-bolinha" style="background:' + esc(u.cor) + '"></i> ' + esc(u.nome) : '<span class="fraco">—</span>') + '</td>' +
      '<td class="num">' + (t.finalCartao ? '••' + esc(t.finalCartao) : '<span class="fraco">—</span>') + '</td>' +
      '<td class="num dir ' + (t.tipo === 'entrada' ? 'valor-entrada' : 'valor-saida') + '">' + (t.tipo === 'entrada' ? '+' : '') + brl(t.valor) + '</td>' +
      '<td class="acoes-linha" style="white-space:nowrap"><button class="icone-btn peq" data-acao="tr-editar" data-id="' + t.id + '" aria-label="Editar" title="Editar">' + icone('edit', 16) + '</button><button class="icone-btn peq" data-acao="tr-excluir" data-id="' + t.id + '" aria-label="Excluir" title="Excluir">' + icone('trash', 16) + '</button></td></tr>';
  }).join('');

  let corpo;
  if (!state.transacoes.length) {
    corpo = estadoVazio({ icone: 'transacoes', titulo: 'Nenhuma transação ainda', texto: 'Lance uma transação manualmente ou importe um extrato CSV ou uma fatura de cartão em PDF.', acao: { acao: 'nova-transacao', rotulo: '+ Nova transação' } }) +
      '<p style="text-align:center"><button class="btn btn-sec" data-acao="tr-ir-importar">' + icone('importar') + ' Importar CSV ou fatura</button></p>';
  } else if (!lista.length) {
    corpo = estadoVazio({ icone: 'search', titulo: 'Nada encontrado', texto: 'Nenhuma transação com esses filtros' + (f.todosMeses ? '.' : ' em ' + nomeMes(App.ui.mes) + '.'), acao: { acao: 'tr-limpar', rotulo: 'Limpar filtros e ver todos os meses' } });
  } else {
    const todosSel = visiveis.length && visiveis.every((t) => sel.has(t.id));
    corpo = '<div class="tabela-wrap"><table class="tabela"><thead><tr><th><input type="checkbox" data-ed="tr-sel-todas" ' + (todosSel ? 'checked' : '') + ' aria-label="Selecionar todas"></th>' +
      cabecalho('data', 'Data', f) + cabecalho('descricao', 'Descrição', f) + '<th>Origem</th><th>Tópico</th><th>Pessoa</th><th>Cartão</th>' + cabecalho('valor', 'Valor', f).replace('<th', '<th style="text-align:right"') + '<th></th></tr></thead><tbody>' + linhas + '</tbody></table></div>' +
      (lista.length > visiveis.length ? '<p style="text-align:center;margin-top:12px"><button class="btn btn-sec" data-acao="tr-mais">Mostrar mais (' + (lista.length - visiveis.length) + ' restantes)</button></p>' : '');
  }

  return '<div class="card">' + barra + lote + '<div class="suave" style="margin:0 0 10px;font-size:.88rem">' + lista.length + ' transação(ões)' + (f.todosMeses ? ' em todos os meses' : ' em ' + esc(nomeMes(App.ui.mes))) + ' · entradas <b class="valor-entrada num">' + brl(entradas) + '</b> · saídas <b class="num">' + brl(saidas) + '</b></div>' + corpo + '</div>';
}

/* ---------- regra a partir de uma recategorização ---------- */

function oferecerRegra(descricao, topicoId) {
  const palavra = sugerirPalavraChave(descricao);
  if (!palavra) return;
  const s = App.state;
  if (s.regras.some((r) => normalizar(r.palavraChave) === normalizar(palavra))) return;
  const parecidas = s.transacoes.filter((t) => !t.topicoId && t.tipo === 'saida' && casaPalavra(t.descricao, palavra)).length;
  toast('Classificado como ' + nomeTopico(s, topicoId) + '.', {
    acao: {
      rotulo: 'Criar regra para "' + palavra + '"' + (parecidas ? ' (+' + parecidas + ')' : ''),
      fn: () => comDesfazer('Regra criada: "' + palavra + '" → ' + nomeTopico(s, topicoId) + (parecidas ? '; ' + parecidas + ' transação(ões) atualizadas.' : '.'), (st) => {
        st.regras.push({ id: uid(), palavraChave: palavra, topicoId, usuarioId: null });
        st.transacoes.forEach((t) => { if (!t.topicoId && t.tipo === 'saida' && casaPalavra(t.descricao, palavra)) t.topicoId = topicoId; });
      })
    }
  });
}

export const acoes = {
  'tr-ordenar': (el) => { const f = App.ui.filtros; const c = el.dataset.campo; if (f.ordem === c) f.dir = f.dir === 'asc' ? 'desc' : 'asc'; else { f.ordem = c; f.dir = c === 'descricao' ? 'asc' : 'desc'; } App.render(); },
  'tr-limpar': () => { App.ui.filtros = { ...filtrosPadrao(), todosMeses: false }; App.ui.selecionadas = new Set(); App.render(); },
  'tr-mais': () => { App.ui.limiteTransacoes = (App.ui.limiteTransacoes || LIMITE) + LIMITE; App.render(); },
  'tr-ir-importar': () => navegar('importar'),
  'tr-editar': (el) => {
    const t = App.state.transacoes.find((x) => x.id === el.dataset.id);
    if (t) abrirNovaTransacao({ id: t.id, tipo: t.tipo, data: t.data, descricao: t.descricao, valorTexto: (t.valor / 100).toFixed(2).replace('.', ','), usuarioId: t.usuarioId, topicoId: t.topicoId });
  },
  'tr-excluir': (el) => comDesfazer('Transação excluída.', (s) => { s.transacoes = s.transacoes.filter((t) => t.id !== el.dataset.id); }),
  'tr-lote-limpar': () => { App.ui.selecionadas = new Set(); App.render(); },
  'tr-lote-aplicar': () => {
    const id = document.getElementById('lote-topico').value;
    if (!id) { toast('Escolha o tópico para as transações selecionadas.', { tipo: 'erro' }); return; }
    const ids = new Set(App.ui.selecionadas);
    comDesfazer(ids.size + ' transação(ões) recategorizadas.', (s) => { s.transacoes.forEach((t) => { if (ids.has(t.id) && t.tipo === 'saida') t.topicoId = id; }); });
    App.ui.selecionadas = new Set();
  },
  'tr-lote-excluir': () => {
    const ids = new Set(App.ui.selecionadas);
    comDesfazer(ids.size + ' transação(ões) excluídas.', (s) => { s.transacoes = s.transacoes.filter((t) => !ids.has(t.id)); });
    App.ui.selecionadas = new Set();
  }
};

export const edicoes = {
  'tr-filtro': (el) => { App.ui.filtros[el.dataset.campo] = el.value; App.ui.limiteTransacoes = 0; App.render(); },
  'tr-todos-meses': (el) => { App.ui.filtros.todosMeses = el.checked; App.render(); },
  'tr-sel': (el) => { if (el.checked) App.ui.selecionadas.add(el.dataset.id); else App.ui.selecionadas.delete(el.dataset.id); App.render(); },
  'tr-sel-todas': (el) => {
    const todas = ordenar(filtrarTransacoes(App.state, filtrosAtuais()), App.ui.filtros.ordem, App.ui.filtros.dir).slice(0, App.ui.limiteTransacoes || LIMITE);
    App.ui.selecionadas = el.checked ? new Set(todas.map((t) => t.id)) : new Set();
    App.render();
  },
  'tr-topico': (el) => {
    const id = el.dataset.id;
    const t = App.state.transacoes.find((x) => x.id === id);
    const novo = el.value || null;
    const eraVazio = t && !t.topicoId;
    update((s) => { const x = s.transacoes.find((y) => y.id === id); if (x) x.topicoId = novo; });
    if (novo && eraVazio) oferecerRegra(t.descricao, novo);
  }
};

export const entradas = {
  'tr-busca': (el) => { App.ui.filtros.busca = el.value; App.ui.limiteTransacoes = 0; App.render(); }
};
