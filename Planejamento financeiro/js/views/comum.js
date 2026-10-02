/* Helpers de apresentação compartilhados entre as telas. */

import { esc } from '../format.js';
import { icone } from '../icons.js';
import { TIPOS_TOPICO } from '../modelo.js';
import { ehGrupo } from '../domain/orcamento.js';

export const COR_SEM_TOPICO = '#9aa3ab';
export const TIPOS = Object.keys(TIPOS_TOPICO);

/** Raízes de um tipo na ordem escolhida pelo usuário. */
export const raizes = (state, tipo) => state.topicos.filter((t) => !t.topicoPai && t.tipo === tipo).sort((a, b) => a.ordem - b.ordem);
export const filhos = (state, id) => state.topicos.filter((t) => t.topicoPai === id).sort((a, b) => a.ordem - b.ordem);

/** Lista achatada na ordem de exibição: tipo -> raiz -> filhos. */
export function topicosOrdenados(state) {
  const out = [];
  TIPOS.forEach((tipo) => raizes(state, tipo).forEach((r) => { out.push(r); filhos(state, r.id).forEach((f) => out.push(f)); }));
  return out;
}

export const folhasOrdenadas = (state) => topicosOrdenados(state).filter((t) => !ehGrupo(state, t.id));

export function nomeTopico(state, id) {
  const t = state.topicos.find((x) => x.id === id);
  if (!t) return 'Não categorizado';
  const pai = t.topicoPai && state.topicos.find((x) => x.id === t.topicoPai);
  return (pai ? pai.nome + ' › ' : '') + t.nome;
}

export const corTopico = (state, id) => (state.topicos.find((x) => x.id === id) || {}).cor || COR_SEM_TOPICO;
export const usuarioDe = (state, id) => state.usuarios.find((u) => u.id === id) || null;

/** <option>s agrupadas por tipo, só com tópicos "folha". */
export function opcoesTopico(state, selecionado, vazio = 'Não categorizado') {
  let h = vazio === null ? '' : '<option value="">' + esc(vazio) + '</option>';
  TIPOS.forEach((tipo) => {
    const itens = folhasOrdenadas(state).filter((t) => t.tipo === tipo);
    if (!itens.length) return;
    h += '<optgroup label="' + esc(TIPOS_TOPICO[tipo].nome) + '">' +
      itens.map((t) => '<option value="' + esc(t.id) + '"' + (t.id === selecionado ? ' selected' : '') + '>' + esc((t.icone ? t.icone + ' ' : '') + nomeTopico(state, t.id)) + '</option>').join('') + '</optgroup>';
  });
  return h;
}

export function opcoesUsuario(state, selecionado, vazio = 'Sem usuário') {
  return (vazio === null ? '' : '<option value="">' + esc(vazio) + '</option>') +
    state.usuarios.map((u) => '<option value="' + esc(u.id) + '"' + (u.id === selecionado ? ' selected' : '') + '>' + esc(u.nome) + '</option>').join('');
}

export function iconeOrigem(origem) {
  const m = { manual: ['manual', 'Lançamento manual'], csv: ['csv', 'Importado de CSV'], pdf: ['pdf', 'Importado de fatura PDF'] }[origem] || ['info', origem];
  return '<span title="' + esc(m[1]) + '" class="fraco">' + icone(m[0], 17) + '<span class="sr">' + esc(m[1]) + '</span></span>';
}

export function selosTransacao(t) {
  let h = '';
  if (t.parcelaAtual && t.parcelaTotal) h += '<span class="selo">' + t.parcelaAtual + '/' + t.parcelaTotal + '</span> ';
  if (t.status === 'prevista') h += '<span class="selo prevista">prevista</span> ';
  if (t.moedaOriginal) h += '<span class="selo" title="Compra em moeda estrangeira">' + esc(t.moedaOriginal) + '</span> ';
  return h;
}

export function bolinha(cor) { return '<i class="cor-bolinha" style="background:' + esc(cor) + '"></i>'; }

export function barraProgresso(uso) {
  const p = Math.min(100, Math.max(0, uso * 100));
  const cls = uso > 1 ? 'vermelha' : uso >= 0.8 ? 'amarela' : '';
  return '<div class="barra ' + cls + '" role="progressbar" aria-valuenow="' + Math.round(uso * 100) + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + p + '%"></i></div>';
}
