/* Tela de revisão (CSV e PDF): sugestão de tópico por regras, duplicatas, edição antes de confirmar. */

import { App, update } from '../state.js';
import { esc, brl } from '../format.js';
import { fmtData } from '../datas.js';
import { icone } from '../icons.js';
import { toast } from '../ui.js';
import { confirmarImportacao } from '../domain/importacao.js';
import { casaPalavra, sugerirPalavraChave } from '../domain/regras.js';
import { opcoesTopico, opcoesUsuario, selosTransacao, nomeTopico } from './comum.js';

const rv = () => App.ui.imp.revisao;
const achar = (id) => rv().linhas.find((l) => l.tmpId === id);

export function renderRevisao(state) {
  const r = rv();
  const aceitas = r.linhas.filter((l) => l.sel);
  const dups = r.linhas.filter((l) => l.duplicata === 'exata').length;
  const provaveis = r.linhas.filter((l) => l.duplicata === 'provavel').length;
  const semTopico = aceitas.filter((l) => l.tipo === 'saida' && !l.topicoId).length;
  const total = aceitas.filter((l) => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0);

  const linhas = r.linhas.map((l) => {
    const regraChip = l.palavraRegra && l.topicoId && l.regraOferecida
      ? '<label class="fraco" style="font-size:.78rem;display:flex;gap:4px;align-items:center;margin-top:2px"><input type="checkbox" data-ed="rev-regra" data-id="' + l.tmpId + '" ' + (l.criarRegra ? 'checked' : '') + '> criar regra "' + esc(l.palavraRegra) + '" para descrições parecidas</label>' : '';
    return '<tr class="' + (l.duplicata === 'exata' ? 'dup' : '') + '"><td><input type="checkbox" data-ed="rev-sel" data-id="' + l.tmpId + '" ' + (l.sel ? 'checked' : '') + ' aria-label="Importar ' + esc(l.descricao) + '"></td>' +
      '<td class="num">' + fmtData(l.data) + '</td><td class="desc" title="' + esc(l.descricao) + '">' + esc(l.descricao) + ' ' + selosTransacao({ ...l, status: 'realizada' }) +
      (l.duplicata === 'exata' ? ' <span class="selo aviso">já importada</span>' : l.duplicata === 'provavel' ? ' <span class="selo aviso" title="Mesma data e valor de outra transação">possível duplicata</span>' : '') + regraChip + '</td>' +
      '<td>' + (l.tipo === 'entrada' ? '<span class="selo ok">entrada</span>' : '<select class="ed" data-ed="rev-topico" data-id="' + l.tmpId + '" aria-label="Tópico">' + opcoesTopico(state, l.topicoId || '') + '</select>') + '</td>' +
      '<td><select class="ed" data-ed="rev-usuario" data-id="' + l.tmpId + '" aria-label="Pessoa">' + opcoesUsuario(state, l.usuarioId || '') + '</select></td>' +
      '<td class="num dir ' + (l.tipo === 'entrada' ? 'valor-entrada' : 'valor-saida') + '">' + (l.tipo === 'entrada' ? '+' : '') + brl(l.valor) + '</td></tr>';
  }).join('');

  return '<div class="pilha">' +
    (dups ? '<div class="alerta-caixa">' + icone('alert') + '<span><b>' + dups + ' transação(ões) já foram importadas antes</b> (mesma data, valor e descrição). Elas vêm desmarcadas — marque se quiser importar mesmo assim.</span></div>' : '') +
    (provaveis ? '<div class="alerta-caixa info">' + icone('info') + '<span>' + provaveis + ' transação(ões) têm a mesma data e valor de outras já registradas (possível duplicata entre CSV e fatura). Confira.</span></div>' : '') +
    '<div class="card"><header><h2>Revisar antes de importar</h2><span class="suave num">' + aceitas.length + ' de ' + r.linhas.length + ' marcadas · saídas ' + brl(total) + (semTopico ? ' · <b>' + semTopico + ' sem tópico</b>' : '') + '</span></header>' +
    '<div class="tabela-wrap"><table class="tabela"><thead><tr><th><input type="checkbox" data-ed="rev-sel-todas" ' + (r.linhas.every((l) => l.sel) ? 'checked' : '') + ' aria-label="Marcar todas"></th><th>Data</th><th>Descrição</th><th>Tópico sugerido</th><th>Pessoa</th><th style="text-align:right">Valor</th></tr></thead><tbody>' + linhas + '</tbody></table></div>' +
    '<p class="fraco" style="font-size:.82rem">Sem regra para a descrição? O tópico fica "Não categorizado" — escolha um e marque "criar regra" para as próximas importações.</p>' +
    '<footer style="display:flex;justify-content:space-between;gap:10px;margin-top:12px;flex-wrap:wrap"><button class="btn btn-sec" data-acao="rev-voltar">Voltar</button><button class="btn btn-primario" data-acao="rev-confirmar"' + (aceitas.length ? '' : ' disabled') + '>' + icone('check', 18) + ' Importar ' + aceitas.length + ' transação(ões)</button></footer></div></div>';
}

export const acoes = {
  'rev-voltar': () => { const i = App.ui.imp; i.passo = i.revisao.origem === 'pdf' ? 'pdf-resultado' : 'mapeamento'; App.render(); },
  'rev-confirmar': () => {
    const i = App.ui.imp;
    const r = i.revisao;
    let res = null;
    update((s) => {
      if (r.mapeamento) {
        s.mapeamentos = s.mapeamentos.filter((m) => m.assinatura !== r.mapeamento.assinatura);
        s.mapeamentos.push(r.mapeamento);
      }
      res = confirmarImportacao(s, { origem: r.origem, linhas: r.linhas, fatura: r.fatura, futuras: r.futuras || [], associacoes: r.associacoes || {}, texto: r.texto || '' });
    });
    i.passo = 'concluido';
    i.resultado = res;
    i.revisao = null; i.csv = null; i.pdf = null;
    toast(res.importadas + ' transação(ões) importadas.');
    App.render();
  }
};

export const edicoes = {
  'rev-sel': (el) => { const l = achar(el.dataset.id); l.sel = el.checked; l.forcar = el.checked; App.render(); },
  'rev-sel-todas': (el) => { rv().linhas.forEach((l) => { l.sel = el.checked; l.forcar = el.checked; }); App.render(); },
  'rev-usuario': (el) => { achar(el.dataset.id).usuarioId = el.value || null; },
  'rev-regra': (el) => { achar(el.dataset.id).criarRegra = el.checked; App.render(); },
  'rev-topico': (el) => {
    const l = achar(el.dataset.id);
    const eraVazio = !l.topicoId;
    l.topicoId = el.value || null;
    if (l.topicoId && eraVazio) {
      l.palavraRegra = sugerirPalavraChave(l.descricao);
      l.regraOferecida = !!l.palavraRegra;
      l.criarRegra = !!l.palavraRegra;
      // aplica já às outras linhas ainda sem tópico com a mesma palavra
      let n = 0;
      if (l.palavraRegra) rv().linhas.forEach((o) => { if (o !== l && !o.topicoId && o.tipo === 'saida' && casaPalavra(o.descricao, l.palavraRegra)) { o.topicoId = l.topicoId; n++; } });
      if (n) toast(n + ' linha(s) parecida(s) também foram classificadas como ' + nomeTopico(App.state, l.topicoId) + '.', { tipo: 'info' });
    }
    App.render();
  }
};

