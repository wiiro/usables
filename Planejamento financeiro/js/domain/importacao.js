/* Importação (CSV e PDF): monta as linhas de revisão e confirma no estado.
   Fluxo: preparar*  ->  (usuário revisa)  ->  confirmarImportacao(s, ...)  */

import { uid, normalizar } from '../format.js';
import { addMesesData } from '../datas.js';
import { aplicarRegras, sugerirPalavraChave } from './regras.js';
import { marcarDuplicatas, novaTransacao } from './transacoes.js';
import { reconciliarParcelas, previstasDeFuturas } from './parcelas.js';
import { mascararTexto } from '../pdf/mascarar.js';

function topicoPorNome(state, nome) {
  const n = normalizar(nome);
  const t = state.topicos.find((x) => normalizar(x.nome) === n);
  return t ? t.id : null;
}

function categorizar(state, linha) {
  const regra = aplicarRegras(linha.descricao, linha.usuarioId, state.regras);
  if (regra) return regra.topicoId;
  if (linha.topicoSugerido) return topicoPorNome(state, linha.topicoSugerido);
  return null;
}

function linhaDe(state, base, extra) {
  const l = { tmpId: uid(), sel: true, forcar: false, criarRegra: false, palavraRegra: '', ...base, ...extra };
  l.topicoId = l.topicoId ?? categorizar(state, l);
  l.palavraRegra = sugerirPalavraChave(l.descricao);
  return l;
}

/** CSV: itens { data, descricao, valor, tipo } -> linhas de revisão (com duplicatas marcadas). */
export function prepararLinhasCSV(state, itens, { usuarioId = null } = {}) {
  const linhas = itens.map((i) => linhaDe(state, { data: i.data, descricao: i.descricao, valor: i.valor, tipo: i.tipo, usuarioId, origem: 'csv', linhaArquivo: i.linha }, {}));
  marcarDuplicatas(linhas, state.transacoes);
  linhas.forEach((l) => { if (l.duplicata === 'exata') l.sel = false; });
  return linhas;
}

/** Cartões que o resultado do PDF menciona e que ainda não existem. */
export function cartoesNovos(state, resultado) {
  const finais = new Set(resultado.transacoes.map((t) => t.finalCartao || ''));
  Object.keys(resultado.subtotais || {}).forEach((f) => finais.add(f));
  return [...finais].filter((f) => f && !state.cartoes.some((c) => c.banco === resultado.banco && c.finalCartao === f));
}

/** Há transações sem final identificado? (será preciso escolher o titular delas) */
export const temSemFinal = (resultado) => resultado.transacoes.some((t) => !t.finalCartao);

export function usuarioDoCartao(state, banco, final, associacoes) {
  const c = state.cartoes.find((x) => x.banco === banco && x.finalCartao === final);
  if (c) return c.usuarioId;
  return associacoes[final || ''] ?? null;
}

/** PDF: transações da fatura -> linhas de revisão. `associacoes` = { final|'' : usuarioId }. */
export function prepararLinhasPDF(state, resultado, associacoes = {}) {
  const linhas = resultado.transacoes.map((t) => {
    const usuarioId = usuarioDoCartao(state, resultado.banco, t.finalCartao, associacoes);
    return linhaDe(state, {
      data: t.data, descricao: t.descricao, valor: t.valor, tipo: 'saida', usuarioId, origem: 'pdf',
      parcelaAtual: t.parcelaAtual, parcelaTotal: t.parcelaTotal, moedaOriginal: t.moedaOriginal,
      valorOriginal: t.valorOriginal, iof: t.iof || 0, finalCartao: t.finalCartao, topicoSugerido: t.topicoSugerido
    }, {});
  });
  marcarDuplicatas(linhas, state.transacoes);
  linhas.forEach((l) => { if (l.duplicata === 'exata') l.sel = false; });
  return linhas;
}

/** Reaplica regras às linhas ainda sem tópico (depois de criar uma regra na revisão). */
export function reaplicarRegras(state, linhas, regrasExtras = []) {
  const todas = [...state.regras, ...regrasExtras];
  linhas.forEach((l) => {
    if (l.topicoId) return;
    const r = aplicarRegras(l.descricao, l.usuarioId, todas);
    if (r) l.topicoId = r.topicoId;
  });
}

/** Parcela com data anterior ao período da fatura = data da compra original: cobra no fechamento. */
function dataDeCobranca(t, fechamento) {
  if (!fechamento || !t.parcelaAtual || t.parcelaAtual <= 1) return t.data;
  return t.data > addMesesData(fechamento, -1) ? t.data : fechamento;
}

/**
 * Grava a importação no rascunho do estado.
 * @param p.linhas      linhas revisadas
 * @param p.fatura      { banco, dataFechamento, dataVencimento, totalFatura, totalExtraido, validada } | null (CSV)
 * @param p.futuras     parcelas das próximas faturas (Itaú) | []
 * @param p.associacoes { final|'' : usuarioId } para cartões novos
 * @param p.texto       texto extraído (será guardado MASCARADO, só o da última fatura do banco)
 */
export function confirmarImportacao(s, { origem, linhas, fatura = null, futuras = [], associacoes = {}, texto = '' }) {
  const idImportacao = uid();
  const aceitas = linhas.filter((l) => l.sel && (l.duplicata !== 'exata' || l.forcar));

  // Cartões novos
  const cartaoPorFinal = {};
  if (fatura) {
    const finais = new Set([...aceitas.map((l) => l.finalCartao || ''), ...futuras.map((f) => f.finalCartao || '')]);
    finais.forEach((f) => {
      let c = f ? s.cartoes.find((x) => x.banco === fatura.banco && x.finalCartao === f) : null;
      if (!c && f) {
        c = {
          id: uid(), banco: fatura.banco, finalCartao: f, usuarioId: associacoes[f] ?? null,
          apelido: (fatura.banco === 'itau' ? 'Itaú' : fatura.banco === 'nubank' ? 'Nubank' : 'Cartão') + ' ' + f,
          diaFechamento: fatura.dataFechamento ? Number(fatura.dataFechamento.slice(8)) : null,
          diaVencimento: fatura.dataVencimento ? Number(fatura.dataVencimento.slice(8)) : null
        };
        s.cartoes.push(c);
      }
      cartaoPorFinal[f] = c;
    });
  }

  const novas = aceitas.map((l) => novaTransacao({
    data: dataDeCobranca(l, fatura && fatura.dataFechamento), descricao: l.descricao, valor: l.valor, tipo: l.tipo,
    topicoId: l.topicoId || null, usuarioId: l.usuarioId || null, origem, idImportacao, hash: l.hash,
    parcelaAtual: l.parcelaAtual || null, parcelaTotal: l.parcelaTotal || null, moedaOriginal: l.moedaOriginal || null,
    valorOriginal: l.valorOriginal ?? null, iof: l.iof || 0, finalCartao: l.finalCartao || null, status: 'realizada'
  }));
  s.transacoes.push(...novas);

  // Parcelas: a real substitui a prevista; projeta as seguintes.
  const ref = fatura && fatura.dataFechamento;
  const parc = reconciliarParcelas(s, novas, (t) => t.data);
  if (futuras.length && ref) {
    const base = { origem, idImportacao, topicoId: null, usuarioId: null };
    const prev = previstasDeFuturas(futuras, ref, base, s.transacoes).map((p) => {
      const c = cartaoPorFinal[p.finalCartao || ''];
      const usuarioId = c ? c.usuarioId : null;
      const igual = novas.find((n) => n.parcelaTotal === p.parcelaTotal && normalizar(n.descricao) === normalizar(p.descricao));
      return novaTransacao({ ...p, usuarioId, topicoId: igual ? igual.topicoId : null });
    });
    s.transacoes.push(...prev);
    parc.criadas += prev.length;
  }

  // Regras novas marcadas na revisão
  let regrasCriadas = 0;
  aceitas.concat(linhas.filter((l) => l.criarRegra && l.topicoId)).forEach((l) => {
    if (!l.criarRegra || !l.topicoId || !l.palavraRegra) return;
    const k = normalizar(l.palavraRegra);
    if (s.regras.some((r) => normalizar(r.palavraChave) === k && !r.usuarioId)) return;
    s.regras.push({ id: uid(), palavraChave: l.palavraRegra, topicoId: l.topicoId, usuarioId: null });
    regrasCriadas++;
  });

  // Fatura (só PDF)
  let faturaId = null;
  if (fatura) {
    const principal = novas.find((n) => n.finalCartao) || null;
    const cartao = principal ? cartaoPorFinal[principal.finalCartao] : Object.values(cartaoPorFinal).find(Boolean);
    s.faturas.forEach((f) => { if (f.banco === fatura.banco) f.textoExtraido = ''; }); // só a última de cada banco guarda texto
    const f = {
      id: uid(), banco: fatura.banco, cartaoId: cartao ? cartao.id : null,
      dataFechamento: fatura.dataFechamento, dataVencimento: fatura.dataVencimento,
      totalFatura: fatura.totalFatura, totalExtraido: fatura.totalExtraido, validada: !!fatura.validada,
      idImportacao, textoExtraido: texto ? mascararTexto(texto, { nomes: s.usuarios.map((u) => u.nome) }).texto : ''
    };
    s.faturas.push(f);
    faturaId = f.id;
  }
  return { idImportacao, importadas: novas.length, ignoradas: linhas.length - aceitas.length, regrasCriadas, parcelas: parc, faturaId };
}
