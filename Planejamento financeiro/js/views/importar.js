/* Importar: abas CSV | Fatura PDF, zona de arrastar-e-soltar e fluxo em etapas. */

import { App } from '../state.js';
import { esc, brl } from '../format.js';
import { icone } from '../icons.js';
import { toast } from '../ui.js';
import { navegar, verTransacoes } from '../nav.js';
import * as csv from './importar-csv.js';
import * as pdf from './importar-pdf.js';
import * as rev from './importar-revisao.js';

export const titulo = 'Importar';

function imp() {
  if (!App.ui.imp) App.ui.imp = { aba: 'csv', passo: 'arquivo' };
  return App.ui.imp;
}

function passosUi(i) {
  const csvPassos = [['arquivo', 'Arquivo'], ['mapeamento', 'Colunas'], ['revisao', 'Revisão']];
  const pdfPassos = [['arquivo', 'Arquivo'], ['pdf-resultado', 'Leitura e validação'], ['revisao', 'Revisão']];
  const lista = i.aba === 'csv' ? csvPassos : pdfPassos;
  const idx = Math.max(0, lista.findIndex(([k]) => k === i.passo));
  return '<div class="passos">' + lista.map(([k, n], j) => '<span class="passo ' + (j === idx ? 'ativo' : j < idx ? 'feito' : '') + '"><span class="n">' + (j < idx ? '✓' : j + 1) + '</span>' + n + '</span>').join('') + '</div>';
}

function zona(i) {
  const csvAba = i.aba === 'csv';
  return '<div class="zona-drop" data-arrastar="zona" tabindex="0" role="button" data-acao="imp-escolher" aria-label="Escolher arquivo ou arrastar e soltar aqui">' + icone(csvAba ? 'csv' : 'pdf', 40) +
    '<h3>' + (csvAba ? 'Arraste o extrato CSV aqui' : 'Arraste a fatura em PDF aqui') + '</h3><p class="suave">ou</p><button class="btn btn-primario" data-acao="imp-escolher">' + icone('importar', 18) + ' Escolher arquivo</button>' +
    '<input type="file" id="arquivo-input" hidden data-ed="imp-arquivo" accept="' + (csvAba ? '.csv,.txt,text/csv' : '.pdf,application/pdf') + '">' +
    '<p class="fraco" style="margin:14px 0 0;font-size:.85rem">' + icone('lock', 14) + ' Os arquivos são lidos neste computador — nada é enviado para a internet.</p></div>' +
    (csvAba
      ? '<p class="suave" style="margin-top:14px">Aceito CSV com <b>;</b> ou <b>,</b>, em UTF-8 ou Latin-1, valores como <b>1.234,56</b> ou <b>1,234.56</b> e datas <b>dd/mm/aaaa</b> ou <b>aaaa-mm-dd</b>. Você confere o mapeamento das colunas antes de importar.</p>'
      : '<p class="suave" style="margin-top:14px">Funciona com fatura do <b>Itaú</b> e do <b>Nubank</b> (os leitores ainda são <b>preliminares</b>) e, para outros bancos, com um leitor genérico. PDF protegido por senha? Eu pergunto. PDF escaneado? Uso OCR.</p>');
}

function concluido(i) {
  const r = i.resultado;
  return '<div class="card"><div class="vazio" style="padding:24px">' + icone('check', 40) + '<h3>Importação concluída</h3><p><b>' + r.importadas + '</b> transação(ões) importadas' + (r.ignoradas ? ', ' + r.ignoradas + ' ignoradas' : '') +
    (r.parcelas && r.parcelas.criadas ? ' · ' + r.parcelas.criadas + ' parcela(s) futura(s) prevista(s)' : '') + (r.parcelas && r.parcelas.removidas ? ' · ' + r.parcelas.removidas + ' prevista(s) substituída(s) pela parcela real' : '') + (r.regrasCriadas ? ' · ' + r.regrasCriadas + ' regra(s) criada(s)' : '') + '.</p>' +
    '<p><button class="btn btn-primario" data-acao="imp-ver">Ver transações</button> <button class="btn btn-sec" data-acao="imp-recomecar">Importar outro arquivo</button></p></div></div>';
}

export function render({ state }) {
  const i = imp();
  const abas = '<div class="abas" role="tablist"><button class="aba" role="tab" aria-selected="' + (i.aba === 'csv') + '" data-acao="imp-aba" data-aba="csv">Extrato CSV</button><button class="aba" role="tab" aria-selected="' + (i.aba === 'pdf') + '" data-acao="imp-aba" data-aba="pdf">Fatura de cartão (PDF)</button></div>';
  if (!state.usuarios.length || !state.topicos.length) {
    return abas + '<div class="alerta-caixa info" style="margin-bottom:14px">' + icone('info') + '<span>Dica: cadastre pessoas e tópicos em <a href="#/planejamento">Planejamento</a> antes de importar — assim já classifico as transações.</span></div>' + corpo(i, state);
  }
  return abas + corpo(i, state);
}

function corpo(i, state) {
  if (i.passo === 'concluido') return concluido(i);
  if (i.passo === 'revisao') return passosUi(i) + rev.renderRevisao(state);
  if (i.aba === 'csv') return passosUi(i) + (i.passo === 'mapeamento' && i.csv ? csv.renderMapeamento(state) : zona(i));
  return passosUi(i) + (i.passo === 'pdf-resultado' && i.pdf ? pdf.renderPdf(state) : zona(i));
}

async function receber(file) {
  const i = imp();
  if (!file) return;
  try {
    if (i.aba === 'csv') {
      if (!/\.(csv|txt)$/i.test(file.name)) { toast('Este arquivo não parece um CSV.', { tipo: 'erro' }); return; }
      await csv.carregarCSV(file);
    } else {
      if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') { toast('Este arquivo não parece um PDF.', { tipo: 'erro' }); return; }
      await pdf.carregarPDF(file);
    }
  } catch (e) {
    toast('Não consegui ler o arquivo: ' + (e && e.message ? e.message : 'erro'), { tipo: 'erro' });
  }
}

export const acoes = {
  ...csv.acoes, ...pdf.acoes, ...rev.acoes,
  'imp-aba': (el) => { App.ui.imp = { aba: el.dataset.aba, passo: 'arquivo' }; App.render(); },
  'imp-recomecar': () => { App.ui.imp = { aba: imp().aba, passo: 'arquivo' }; App.render(); },
  'imp-escolher': (el, ev) => { if (ev && ev.target.tagName === 'INPUT') return; const inp = document.getElementById('arquivo-input'); if (inp) inp.click(); },
  'imp-ver': () => verTransacoes({ origem: '', todosMeses: true }),
  'arrastar-zona': (el, ev, tipo) => {
    if (tipo === 'dragover') { ev.preventDefault(); el.classList.add('sobre'); }
    else if (tipo === 'dragleave') el.classList.remove('sobre');
    else if (tipo === 'drop') { ev.preventDefault(); el.classList.remove('sobre'); receber(ev.dataTransfer.files && ev.dataTransfer.files[0]); }
  }
};

export const edicoes = {
  ...csv.edicoes, ...pdf.edicoes, ...rev.edicoes,
  'imp-arquivo': (el) => { const f = el.files && el.files[0]; el.value = ''; return receber(f); }
};

