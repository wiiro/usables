/* Mapeamento de colunas do CSV -> transações. Puro. */

import { normalizar, uid } from '../format.js';
import { parseNumero, parseDataFormato, pareceNumero, detectarFormatoData } from './leitor.js';

/** Sugere as colunas pelo nome do cabeçalho; sem cabeçalho, pelo conteúdo. -1 = não encontrada. */
export function sugerirColunas(analise) {
  const nomes = analise.cabecalho.map(normalizar);
  const acha = (rx) => nomes.findIndex((n) => rx.test(n));
  const col = {
    data: acha(/^(DATA|DATE|DT)\b|\bDATA\b/),
    descricao: acha(/DESCRI|HISTORICO|LANCAMENTO|ESTABELECIMENTO|MEMO|TITULO|NOME|DETALHE/),
    valor: acha(/^(VALOR|AMOUNT|MONTANTE)\b|\bVALOR\b/),
    debito: acha(/DEBITO|SAIDA|DEBIT\b/),
    credito: acha(/CREDITO|ENTRADA|CREDIT\b/)
  };
  const n = analise.cabecalho.length;
  const amostra = (i) => analise.dados.slice(0, 100).map((l) => l[i] ?? '').filter((v) => v !== '');
  if (col.data < 0) col.data = [...Array(n).keys()].find((i) => detectarFormatoData(amostra(i))) ?? -1;
  if (col.valor < 0 && (col.debito < 0 || col.credito < 0)) {
    col.valor = [...Array(n).keys()].find((i) => i !== col.data && amostra(i).length && amostra(i).filter(pareceNumero).length / amostra(i).length > 0.8) ?? -1;
  }
  if (col.descricao < 0) {
    const usados = new Set([col.data, col.valor, col.debito, col.credito]);
    let melhor = -1, tam = 0;
    for (let i = 0; i < n; i++) {
      if (usados.has(i)) continue;
      const m = amostra(i).reduce((s, v) => s + v.length, 0);
      if (m > tam) { tam = m; melhor = i; }
    }
    col.descricao = melhor;
  }
  if (col.debito >= 0 && col.credito >= 0) col.valor = -1;
  return col;
}

/** Assinatura do layout: cabeçalho normalizado (ou nº de colunas). Reconhece o mesmo banco depois. */
export function assinaturaLayout(analise) {
  return analise.temCabecalho ? analise.cabecalho.map(normalizar).join('|') : 'colunas:' + analise.cabecalho.length;
}

export function acharMapeamentoSalvo(mapeamentos, analise) {
  const a = assinaturaLayout(analise);
  return mapeamentos.find((m) => m.assinatura === a) || null;
}

export function novoMapeamento({ nomeBanco, analise, colunas, formatoData, separadorDecimal, inverterSinal }) {
  return {
    id: uid(), nomeBanco, delimitador: analise.delimitador, encoding: analise.encoding,
    formatoData, separadorDecimal, colunas: { ...colunas }, inverterSinal: !!inverterSinal,
    assinatura: assinaturaLayout(analise)
  };
}

/**
 * Converte as linhas do CSV em transações brutas { data, descricao, valor (positivo), tipo }.
 * Coluna única de valor: negativo = saída, positivo = entrada (inverterSinal troca).
 * Débito+crédito: débito = saída, crédito = entrada.
 */
export function converterLinhas(dados, { colunas, formatoData, separadorDecimal, inverterSinal }) {
  const itens = [];
  const erros = [];
  const dec = separadorDecimal || ',';
  dados.forEach((linha, idx) => {
    const num = idx + 1;
    const cel = (i) => (i >= 0 ? (linha[i] ?? '').trim() : '');
    const data = parseDataFormato(cel(colunas.data), formatoData);
    const descricao = cel(colunas.descricao).replace(/\s+/g, ' ');
    let valor = null;

    if (colunas.valor >= 0) {
      const v = parseNumero(cel(colunas.valor), dec);
      if (v !== null) valor = inverterSinal ? v : -v; // internamente: saída positiva
    } else {
      const d = parseNumero(cel(colunas.debito), dec) || 0;
      const c = parseNumero(cel(colunas.credito), dec) || 0;
      if (cel(colunas.debito) !== '' || cel(colunas.credito) !== '') valor = inverterSinal ? Math.abs(c) - Math.abs(d) : Math.abs(d) - Math.abs(c);
    }
    // convenção interna acima: valor > 0 = saída. (para coluna única: -v, ou v se invertido)
    if (!data && valor === null && !descricao) return;
    if (!data) { erros.push({ linha: num, motivo: 'data inválida: "' + cel(colunas.data) + '"' }); return; }
    if (valor === null) {
      if (/SALDO/.test(normalizar(descricao))) return;
      erros.push({ linha: num, motivo: 'valor inválido ou vazio' });
      return;
    }
    if (valor === 0) return;
    itens.push({ data, descricao: descricao || '(sem descrição)', valor: Math.abs(valor), tipo: valor > 0 ? 'saida' : 'entrada', linha: num });
  });
  return { itens, erros };
}
