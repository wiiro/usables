/* Importar fatura PDF: upload -> (senha) -> texto/OCR -> banco/parser -> validação ->
   cartões novos -> revisão. Tudo local; a senha é pedida a cada importação e nunca guardada. */

import { App } from '../state.js';
import { esc, brl } from '../format.js';
import { fmtData } from '../datas.js';
import { icone } from '../icons.js';
import { pedirTexto, toast, selo } from '../ui.js';
import { processarPdf } from '../pdf/pipeline.js';
import { prepararLinhasPDF, cartoesNovos, temSemFinal } from '../domain/importacao.js';
import { opcoesUsuario } from './comum.js';
import { abrirTextoExtraido } from './texto-extraido.js';

const BANCOS = { itau: 'Itaú', nubank: 'Nubank', outro: 'Outro banco' };
const pdf = () => App.ui.imp.pdf;

function atualizarProgresso(p) {
  const d = pdf();
  if (!d) return;
  d.progresso = p;
  const barra = document.getElementById('prog-barra');
  const msg = document.getElementById('prog-msg');
  if (barra) barra.style.width = Math.round((p.pct || 0) * 100) + '%';
  if (msg) msg.textContent = p.mensagem || '';
}

async function executar(senha) {
  const d = pdf();
  d.estado = 'processando';
  d.progresso = { etapa: 'texto', pct: 0, mensagem: 'Abrindo o PDF…' };
  App.render();
  try {
    const proc = await processarPdf(d.bytes, { senha, onProgresso: atualizarProgresso });
    d.proc = proc;
    d.banco = proc.interpretacao.ok ? proc.interpretacao.resultado.banco : 'outro';
    d.associacoes = {};
    d.estado = 'resultado';
    d.bytes = null;                       // o PDF não é guardado
    App.ui.imp.passo = 'pdf-resultado';
  } catch (e) {
    if (e && (e.codigo === 'senha' || e.codigo === 'senha-incorreta')) {
      const nova = await pedirTexto({
        titulo: 'PDF protegido por senha', rotulo: 'Senha do PDF', tipo: 'password', confirmarRotulo: 'Abrir',
        detalhe: (e.codigo === 'senha-incorreta' ? 'Senha incorreta — tente de novo. ' : '') + 'A senha é usada só agora, neste computador, e não é guardada.'
      });
      if (nova === null) { App.ui.imp.pdf = null; App.ui.imp.passo = 'arquivo'; App.render(); return; }
      return executar(nova);
    }
    d.estado = 'erro';
    d.erro = e && e.message ? e.message : 'Falha ao ler o PDF.';
  }
  App.render();
}

export async function carregarPDF(file) {
  App.ui.imp.pdf = { nomeArquivo: file.name, bytes: new Uint8Array(await file.arrayBuffer()), estado: 'processando', progresso: { pct: 0, mensagem: '' } };
  App.ui.imp.passo = 'pdf-resultado';
  await executar(undefined);
}

function resultadoAtual() {
  const d = pdf();
  const r = d.proc.interpretacao.resultado;
  r.banco = d.banco;
  return r;
}

export function renderPdf(state) {
  const d = pdf();
  if (d.estado === 'processando') {
    return '<div class="card"><h2>Lendo a fatura…</h2><p class="suave">' + esc(d.nomeArquivo) + '</p><div class="progresso" role="progressbar"><i id="prog-barra" style="width:' + Math.round((d.progresso.pct || 0) * 100) + '%"></i></div><p class="suave" id="prog-msg">' + esc(d.progresso.mensagem || '') + '</p>' +
      '<p class="fraco" style="font-size:.82rem">' + icone('lock', 14) + ' Tudo é processado neste computador. Nada é enviado para a internet.</p></div>';
  }
  if (d.estado === 'erro') {
    return '<div class="card"><div class="alerta-caixa erro">' + icone('alert') + '<span>' + esc(d.erro) + '</span></div><p style="margin-top:14px"><button class="btn btn-sec" data-acao="imp-recomecar">Escolher outro arquivo</button></p></div>';
  }
  const { interpretacao: it, usouOcr, texto } = d.proc;
  if (!it.ok) {
    return '<div class="card"><div class="alerta-caixa erro">' + icone('alert') + '<span>' + esc(it.avisos.join(' ')) + '</span></div><p style="margin-top:14px"><button class="btn btn-sec" data-acao="pdf-texto">Ver texto extraído</button> <button class="btn btn-sec" data-acao="imp-recomecar">Escolher outro arquivo</button></p></div>';
  }
  const r = resultadoAtual();
  const v = it.validacao;
  const novos = cartoesNovos(state, r);
  const semFinal = temSemFinal(r);
  const pendente = novos.some((f) => d.associacoes[f] === undefined) || (semFinal && d.associacoes[''] === undefined);
  const parser = it.parserId === 'generico' ? 'genérico' : (BANCOS[it.parserId] || it.parserId);

  const validacao = v.bateu
    ? '<div class="alerta-caixa ok">' + icone('check') + '<span><b>✔ bateu</b> — a soma dos ' + r.transacoes.length + ' lançamentos (' + brl(v.totalExtraido) + ') é igual ao total da fatura.</span></div>'
    : '<div class="alerta-caixa erro">' + icone('alert') + '<span><b>' + esc(v.mensagem) + '</b>' + (v.totalFatura != null ? '<br>Total da fatura: ' + brl(v.totalFatura) + ' · soma extraída: ' + brl(v.totalExtraido) : '') + '</span></div>';

  const subs = v.subtotais.length ? '<div class="tabela-wrap" style="margin-top:10px"><table class="tabela"><thead><tr><th>Cartão</th><th class="dir">Subtotal informado</th><th class="dir">Extraído</th><th></th></tr></thead><tbody>' +
    v.subtotais.map((s) => '<tr><td>•••• ' + esc(s.finalCartao) + '</td><td class="num dir">' + brl(s.informado) + '</td><td class="num dir">' + brl(s.extraido) + '</td><td>' + (s.bateu ? selo('✔ bateu', 'ok') : selo('diferença de ' + brl(Math.abs(s.informado - s.extraido)), 'erro')) + '</td></tr>').join('') + '</tbody></table></div>' : '';

  const pessoaSel = (f, rotulo) => '<label class="campo"><span>' + rotulo + '</span><select data-ed="pdf-assoc" data-final="' + esc(f) + '"><option value="__"' + (d.associacoes[f] === undefined ? ' selected' : '') + ' disabled>Escolha…</option>' + opcoesUsuario(state, d.associacoes[f] ?? '', 'Sem pessoa (ninguém)') + '</select></label>';
  const cartoes = (novos.length || semFinal)
    ? '<div class="card"><header><h3>Cartões desta fatura</h3></header><p class="suave">Encontrei cartões que ainda não conheço. De quem é cada um? (Só os 4 últimos dígitos são guardados.)</p><div class="linha-form">' +
      novos.map((f) => pessoaSel(f, 'Cartão final ' + f)).join('') + (semFinal ? pessoaSel('', 'Lançamentos sem cartão identificado') : '') + '</div></div>' : '';

  const suspeitas = r.suspeitas.length ? '<div class="alerta-caixa">' + icone('alert') + '<span><b>' + r.suspeitas.length + ' linha(s) parecem lançamentos, mas não foram capturadas:</b><div class="linhas-suspeitas">' + r.suspeitas.slice(0, 8).map((l) => esc(l)).join('<br>') + (r.suspeitas.length > 8 ? '<br>…' : '') + '</div></span></div>' : '';

  return '<div class="pilha"><div class="card"><header><h2>Fatura lida</h2><span class="suave">' + esc(d.nomeArquivo) + '</span></header>' +
    '<div class="linha-form"><label class="campo"><span>Banco</span><select data-ed="pdf-banco">' + Object.entries(BANCOS).map(([k, n]) => '<option value="' + k + '"' + (d.banco === k ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>' +
    '<div class="campo"><span>Fechamento</span><b class="num" style="color:var(--texto)">' + (fmtData(r.dataFechamento) || '—') + '</b></div><div class="campo"><span>Vencimento</span><b class="num" style="color:var(--texto)">' + (fmtData(r.dataVencimento) || '—') + '</b></div>' +
    '<div class="campo"><span>Total da fatura</span><b class="num" style="color:var(--texto)">' + (r.totalFatura == null ? '—' : brl(r.totalFatura)) + '</b></div></div>' +
    '<p style="margin:12px 0 0">' + selo('parser: ' + parser) + ' ' + ((it.parserId === 'itau' || it.parserId === 'nubank') ? selo('PRELIMINAR', 'aviso') : '') + ' ' + (usouOcr ? selo('lido por OCR', 'aviso') : selo('texto do PDF')) + ' ' + selo(r.transacoes.length + ' lançamentos') + (r.futuras.length ? ' ' + selo(r.futuras.length + ' parcelas de próximas faturas') : '') + '</p>' +
    (it.avisos.length ? '<ul class="suave" style="margin:10px 0 0;padding-left:18px">' + it.avisos.map((a) => '<li>' + esc(a) + '</li>').join('') + '</ul>' : '') + '</div>' +
    validacao + subs + suspeitas + cartoes +
    '<div class="card"><footer style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><span><button class="btn btn-sec" data-acao="imp-recomecar">Escolher outro arquivo</button> <button class="btn btn-sec" data-acao="pdf-texto">' + icone('eye', 16) + ' Ver texto extraído</button></span>' +
    '<button class="btn btn-primario" data-acao="pdf-revisar"' + (pendente || !r.transacoes.length ? ' disabled' : '') + '>Revisar transações</button></footer>' + (pendente ? '<p class="fraco" style="text-align:right;margin:8px 0 0;font-size:.85rem">Escolha a pessoa de cada cartão novo para continuar.</p>' : '') + '</div></div>';
}

export const acoes = {
  'pdf-texto': () => abrirTextoExtraido(pdf().proc.texto, { titulo: 'Texto extraído do PDF' }),
  'pdf-revisar': () => {
    const d = pdf();
    const r = resultadoAtual();
    const v = d.proc.interpretacao.validacao;
    const linhas = prepararLinhasPDF(App.state, r, d.associacoes);
    App.ui.imp.revisao = {
      origem: 'pdf', linhas, associacoes: d.associacoes, futuras: r.futuras, texto: d.proc.texto,
      fatura: { banco: r.banco, dataFechamento: r.dataFechamento, dataVencimento: r.dataVencimento, totalFatura: r.totalFatura, totalExtraido: v.totalExtraido, validada: v.bateu }
    };
    App.ui.imp.passo = 'revisao';
    App.render();
  }
};

export const edicoes = {
  'pdf-banco': (el) => { pdf().banco = el.value; pdf().associacoes = {}; App.render(); },
  'pdf-assoc': (el) => { pdf().associacoes[el.dataset.final] = el.value || null; App.render(); }
};

