/* Utilitários compartilhados pelos parsers de fatura (puros, sem DOM).
   Interface de cada parser (um arquivo por banco):
     export default { id, nome, preliminar, detectar(texto) -> 0..1, extrair(linhas) -> Resultado }
   Resultado = { banco, dataFechamento, dataVencimento, totalFatura, transacoes[], futuras[],
                 subtotais{final:centavos}, suspeitas[], avisos[] }
   Transação = { data, descricao, valor (centavos; estorno negativo), parcelaAtual, parcelaTotal,
                 moedaOriginal, valorOriginal, cotacao, iof, finalCartao, topicoSugerido?, linhaOriginal }
   Datas em ISO. Sem logs: faturas contêm CPF e números de cartão. */

import { normalizar } from '../../format.js';
import { MESES_ABREV, montarISO, dataValida, inferirAno } from '../../datas.js';
import { detectarParcela } from '../../domain/parcelas.js';

export const MOEDAS = 'USD|EUR|GBP|ARS|CAD|CHF|JPY|AUD|CLP|UYU|PYG|MXN|CNY';

/** Padroniza caracteres que variam entre PDFs: menos unicode, nbsp, bullets de máscara. */
export function limparLinha(l) {
  return String(l).replace(/[−–—]/g, '-').replace(/[   ]/g, ' ').replace(/\s+/g, ' ').trim();
}

const VALOR = '-?\\s*(?:R\\$\\s*)?-?\\s*\\d{1,3}(?:\\.\\d{3})*,\\d{2}(?:\\s*-|\\s*CR)?';
export const RX_VALOR_FIM = new RegExp('(' + VALOR + ')\\s*$', 'i');
export const RX_VALOR_QUALQUER = new RegExp(VALOR, 'gi');

export function parseValorBR(texto) {
  let s = String(texto ?? '').toUpperCase().replace(/R\$/g, '').replace(/\s/g, '');
  let neg = false;
  if (s.endsWith('CR')) { neg = true; s = s.slice(0, -2); }
  if (s.endsWith('-')) { neg = !neg; s = s.slice(0, -1); }
  if (s.startsWith('-')) { neg = !neg; s = s.slice(1); }
  if (!/^\d{1,3}(?:\.\d{3})*,\d{2}$|^\d+,\d{2}$/.test(s)) return null;
  const c = Number(s.replace(/\./g, '').replace(',', '')) ;
  return neg ? -c : c;
}

const MON = MESES_ABREV.join('|');
/** Token de data: dd/mm, dd/mm/aa(aa), "15 OUT", "15 OUT 2026". */
export const DATA_TOKEN = '(\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?|\\d{1,2}\\s+(?:' + MON + ')(?:\\s+\\d{4})?)';
export const RX_LINHA_TRANSACAO = new RegExp('^' + DATA_TOKEN + '\\s+(.+?)\\s+(' + VALOR + ')$', 'i');

/** Converte um token de data da fatura para ISO. `refISO` (fechamento) resolve o ano ausente. */
export function resolverData(token, refISO) {
  const t = String(token).trim().toUpperCase();
  let m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(t);
  if (m) {
    const ano = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return dataValida(ano, +m[2], +m[1]) ? montarISO(ano, +m[2], +m[1]) : null;
  }
  m = /^(\d{1,2})\/(\d{1,2})$/.exec(t) || (() => {
    const x = new RegExp('^(\\d{1,2})\\s+(' + MON + ')(?:\\s+(\\d{4}))?$').exec(t);
    return x ? [x[0], x[1], String(MESES_ABREV.indexOf(x[2]) + 1), x[3]] : null;
  })();
  if (!m) return null;
  const dia = +m[1], mes = +m[2];
  const ano = m[3] ? Number(m[3]) : inferirAno(dia, mes, refISO);
  return dataValida(ano, mes, dia) ? montarISO(ano, mes, dia) : null;
}

/** Linhas que NÃO são gasto do mês. */
const IGNORAR = [
  /^PAGAMENTO\b/, /^PGTO\b/, /\bPAGAMENTO (RECEBIDO|EFETUADO|EM)\b/, /\bPAGTO\b.*\bRECEB/,
  /^SALDO (ANTERIOR|FINAL|DEVEDOR)/, /TOTAL DA FATURA ANTERIOR/, /^FATURA ANTERIOR/, /^TOTAL (DESTA|DA|DOS|DE|A PAGAR)\b/,
  /^SUBTOTAL/, /^PAGAMENTO MINIMO/, /^VALOR MINIMO/, /^LIMITE\b/, /^TOTAL\b/
];

export function ehLinhaIgnorada(descricao) {
  const d = normalizar(descricao);
  return IGNORAR.some((rx) => rx.test(d));
}

/** Tenta ler "USD 10,00" / "10,00 USD" / "cotação 5,40" numa linha de apoio. */
export function lerMoedaEstrangeira(texto) {
  const t = limparLinha(texto);
  const out = {};
  let m = new RegExp('\\b(' + MOEDAS + ')\\s*(\\d{1,3}(?:\\.\\d{3})*,\\d{2})').exec(t) || new RegExp('(\\d{1,3}(?:\\.\\d{3})*,\\d{2})\\s*(' + MOEDAS + ')\\b').exec(t);
  if (m) {
    const cod = /^[A-Z]{3}$/.test(m[1]) ? m[1] : m[2];
    const val = /^[A-Z]{3}$/.test(m[1]) ? m[2] : m[1];
    out.moedaOriginal = cod;
    out.valorOriginal = parseValorBR(val);
  }
  m = /COTA[CÇ][AÃ]O[:\s]*(?:R\$\s*)?(\d+,\d{2,6})/i.exec(t);
  if (m) out.cotacao = Number(m[1].replace(',', '.'));
  return out;
}

export function lerIOF(texto) {
  const m = /\bIOF\b[^\d-]*(?:R\$\s*)?(-?\d{1,3}(?:\.\d{3})*,\d{2})/i.exec(limparLinha(texto));
  return m ? parseValorBR(m[1]) : null;
}

/** Monta a transação a partir de descrição já limpa, detectando parcela. */
export function montarTransacao({ data, descricao, valor, finalCartao, linhaOriginal, extra = {} }) {
  const p = detectarParcela(descricao);
  return {
    data, descricao: (p ? p.descricao : descricao).trim(), valor,
    parcelaAtual: p ? p.atual : null, parcelaTotal: p ? p.total : null,
    moedaOriginal: null, valorOriginal: null, cotacao: null, iof: 0,
    finalCartao: finalCartao || null, linhaOriginal, ...extra
  };
}

export function novoResultado(banco) {
  return { banco, dataFechamento: null, dataVencimento: null, totalFatura: null, transacoes: [], futuras: [], subtotais: {}, suspeitas: [], avisos: [] };
}

/** Linha com cara de lançamento (começa com data e tem valor) — para apontar o que o parser não capturou. */
export function pareceLancamento(linha) {
  return new RegExp('^' + DATA_TOKEN + '\\s').test(linha) && /\d,\d{2}/.test(linha);
}

/** Ano de referência quando o documento não traz: usa a data de hoje (com aviso do chamador). */
export function hojeISOLocal() {
  const d = new Date();
  return montarISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
