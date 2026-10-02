/* Importar CSV: arquivo -> mapeamento de colunas (com pré-visualização) -> revisão. */

import { App } from '../state.js';
import { esc } from '../format.js';
import { icone } from '../icons.js';
import { toast } from '../ui.js';
import { analisarCSV, FORMATOS_DATA } from '../csv/leitor.js';
import { sugerirColunas, converterLinhas, acharMapeamentoSalvo, novoMapeamento } from '../csv/mapeamento.js';
import { prepararLinhasCSV } from '../domain/importacao.js';
import { opcoesUsuario } from './comum.js';

const csv = () => App.ui.imp.csv;

export async function carregarCSV(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const analise = analisarCSV(bytes);
  if (!analise.dados.length) { toast('Não encontrei linhas de dados neste arquivo.', { tipo: 'erro' }); return; }
  const salvo = acharMapeamentoSalvo(App.state.mapeamentos, analise);
  const c = {
    nomeArquivo: file.name, bytes, analise, opcoes: {},
    colunas: salvo ? { ...salvo.colunas } : sugerirColunas(analise),
    formatoData: salvo ? salvo.formatoData : analise.formatoData,
    separadorDecimal: salvo ? salvo.separadorDecimal : analise.separadorDecimal,
    inverterSinal: salvo ? salvo.inverterSinal : false,
    nomeBanco: salvo ? salvo.nomeBanco : '', salvar: true, usouSalvo: !!salvo,
    usuarioId: App.state.usuarios.length === 1 ? App.state.usuarios[0].id : ''
  };
  c.modoValor = c.colunas.valor >= 0 || (c.colunas.debito < 0 && c.colunas.credito < 0) ? 'unica' : 'dc';
  App.ui.imp.csv = c;
  App.ui.imp.passo = 'mapeamento';
  App.render();
}

function converter() {
  const c = csv();
  const colunas = c.modoValor === 'unica' ? { ...c.colunas, debito: -1, credito: -1 } : { ...c.colunas, valor: -1 };
  return { colunas, ...converterLinhas(c.analise.dados, { colunas, formatoData: c.formatoData, separadorDecimal: c.separadorDecimal, inverterSinal: c.inverterSinal }) };
}

function selectColuna(campo, rotulo, c, opcional) {
  const cab = c.analise.cabecalho;
  return '<label class="campo"><span>' + rotulo + '</span><select data-ed="csv-coluna" data-campo="' + campo + '">' + (opcional ? '<option value="-1">(nenhuma)</option>' : '') +
    cab.map((n, i) => '<option value="' + i + '"' + (c.colunas[campo] === i ? ' selected' : '') + '>' + esc(n) + '</option>').join('') + '</select></label>';
}

export function renderMapeamento(state) {
  const c = csv();
  const a = c.analise;
  const { itens, erros } = converter();
  const entradas = itens.filter((i) => i.tipo === 'entrada').length;
  const prev = a.dados.slice(0, 6);
  const ok = c.colunas.data >= 0 && c.colunas.descricao >= 0 && (c.modoValor === 'unica' ? c.colunas.valor >= 0 : c.colunas.debito >= 0 && c.colunas.credito >= 0);

  return '<div class="pilha"><div class="card"><header><h2>Mapear colunas</h2><span class="suave">' + esc(c.nomeArquivo) + '</span></header>' +
    (c.usouSalvo ? '<div class="alerta-caixa ok" style="margin-bottom:12px">' + icone('check') + '<span>Reconheci este layout: usei o mapeamento salvo de <b>' + esc(c.nomeBanco) + '</b>.</span></div>' : '') +
    '<div class="linha-form"><label class="campo"><span>Separador</span><select data-ed="csv-opcao" data-campo="delimitador">' + [[';', 'Ponto e vírgula ( ; )'], [',', 'Vírgula ( , )'], ['\t', 'Tabulação'], ['|', 'Barra vertical ( | )']].map(([v, r]) => '<option value="' + (v === '\t' ? 'tab' : v) + '"' + (a.delimitador === v ? ' selected' : '') + '>' + r + '</option>').join('') + '</select></label>' +
    '<label class="campo"><span>Codificação</span><select data-ed="csv-opcao" data-campo="encoding"><option value="utf-8"' + (a.encoding === 'utf-8' ? ' selected' : '') + '>UTF-8</option><option value="windows-1252"' + (a.encoding === 'windows-1252' ? ' selected' : '') + '>Latin-1 / Windows-1252</option></select></label>' +
    '<label class="campo"><span>Formato de data</span><select data-ed="csv-campo" data-campo="formatoData">' + FORMATOS_DATA.map((f) => '<option' + (c.formatoData === f ? ' selected' : '') + '>' + f + '</option>').join('') + '</select></label>' +
    '<label class="campo"><span>Separador decimal</span><select data-ed="csv-campo" data-campo="separadorDecimal"><option value=","' + (c.separadorDecimal === ',' ? ' selected' : '') + '>Vírgula (1.234,56)</option><option value="."' + (c.separadorDecimal === '.' ? ' selected' : '') + '>Ponto (1,234.56)</option></select></label></div>' +
    '<div class="linha-form" style="margin-top:14px">' + selectColuna('data', 'Coluna da data', c, false) + selectColuna('descricao', 'Coluna da descrição', c, false) +
    '<label class="campo"><span>Como vem o valor?</span><select data-ed="csv-campo" data-campo="modoValor"><option value="unica"' + (c.modoValor === 'unica' ? ' selected' : '') + '>Uma coluna (negativo = saída)</option><option value="dc"' + (c.modoValor === 'dc' ? ' selected' : '') + '>Débito e crédito separados</option></select></label></div>' +
    '<div class="linha-form" style="margin-top:14px">' + (c.modoValor === 'unica' ? selectColuna('valor', 'Coluna do valor', c, false) : selectColuna('debito', 'Coluna de débito (saídas)', c, false) + selectColuna('credito', 'Coluna de crédito (entradas)', c, false)) +
    '<label style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="checkbox" data-ed="csv-inverter" ' + (c.inverterSinal ? 'checked' : '') + '> Inverter sinal (entradas ↔ saídas)</label></div></div>' +

    '<div class="card"><header><h3>Pré-visualização</h3><span class="suave num">' + itens.length + ' linhas válidas (' + (itens.length - entradas) + ' saídas, ' + entradas + ' entradas)' + (erros.length ? ' · <b style="color:var(--erro)">' + erros.length + ' com problema</b>' : '') + '</span></header>' +
    '<div class="tabela-wrap"><table class="tabela"><thead><tr>' + a.cabecalho.map((n) => '<th>' + esc(n) + '</th>').join('') + '</tr></thead><tbody>' + prev.map((l) => '<tr>' + a.cabecalho.map((_, i) => '<td>' + esc(l[i] ?? '') + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' +
    (itens.length ? '<p class="suave" style="margin:10px 0 0;font-size:.88rem">Primeira linha lida: <b>' + esc(itens[0].data) + '</b> · ' + esc(itens[0].descricao) + ' · <b>' + (itens[0].tipo === 'entrada' ? 'entrada' : 'saída') + '</b> de ' + (itens[0].valor / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + '</p>' : '') +
    (erros.length ? '<div class="linhas-suspeitas">' + erros.slice(0, 5).map((e) => 'linha ' + e.linha + ': ' + esc(e.motivo)).join('<br>') + (erros.length > 5 ? '<br>…' : '') + '</div>' : '') + '</div>' +

    '<div class="card"><div class="linha-form"><label class="campo"><span>Esses lançamentos são de qual pessoa?</span><select data-ed="csv-campo" data-campo="usuarioId">' + opcoesUsuario(state, c.usuarioId, 'Não informar') + '</select></label>' +
    '<label class="campo"><span>Nome do banco (para lembrar este mapeamento)</span><input type="text" data-ed="csv-campo" data-campo="nomeBanco" value="' + esc(c.nomeBanco) + '" placeholder="Ex.: Itaú conta corrente" maxlength="40"></label>' +
    '<label style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="checkbox" data-ed="csv-salvar" ' + (c.salvar ? 'checked' : '') + '> Salvar mapeamento</label></div>' +
    '<footer style="display:flex;justify-content:space-between;margin-top:14px"><button class="btn btn-sec" data-acao="imp-recomecar">Escolher outro arquivo</button><button class="btn btn-primario" data-acao="csv-revisar"' + (ok && itens.length ? '' : ' disabled') + '>Revisar transações</button></footer></div></div>';
}

export const acoes = {
  'csv-revisar': () => {
    const c = csv();
    const { itens } = converter();
    const colunas = c.modoValor === 'unica' ? { ...c.colunas, debito: -1, credito: -1 } : { ...c.colunas, valor: -1 };
    const linhas = prepararLinhasCSV(App.state, itens, { usuarioId: c.usuarioId || null });
    const mapeamento = c.salvar ? novoMapeamento({ nomeBanco: c.nomeBanco.trim() || 'Banco sem nome', analise: c.analise, colunas, formatoData: c.formatoData, separadorDecimal: c.separadorDecimal, inverterSinal: c.inverterSinal }) : null;
    App.ui.imp.revisao = { origem: 'csv', linhas, mapeamento };
    App.ui.imp.passo = 'revisao';
    App.render();
  }
};

export const edicoes = {
  'csv-coluna': (el) => { csv().colunas[el.dataset.campo] = Number(el.value); App.render(); },
  'csv-campo': (el) => { csv()[el.dataset.campo] = el.value; App.render(); },
  'csv-inverter': (el) => { csv().inverterSinal = el.checked; App.render(); },
  'csv-salvar': (el) => { csv().salvar = el.checked; App.render(); },
  'csv-opcao': (el) => {
    const c = csv();
    c.opcoes[el.dataset.campo] = el.value === 'tab' ? '\t' : el.value;
    c.analise = analisarCSV(c.bytes, c.opcoes);
    c.colunas = sugerirColunas(c.analise);
    c.formatoData = c.analise.formatoData;
    c.separadorDecimal = c.analise.separadorDecimal;
    c.modoValor = c.colunas.valor >= 0 || (c.colunas.debito < 0 && c.colunas.credito < 0) ? 'unica' : 'dc';
    App.render();
  }
};
