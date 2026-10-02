/* Regras de categorização por palavra-chave ("UBER" -> Transporte). */

import { normalizar } from '../format.js';

const IGNORAR = new Set(['COMPRA', 'COMPRAS', 'PAGAMENTO', 'PAG', 'PIX', 'TED', 'DOC', 'TRANSF', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'CARTAO', 'DE', 'DA', 'DO', 'EM', 'NO', 'NA', 'LTDA', 'SA', 'ME', 'EPP', 'COM', 'BR', 'SP', 'RJ', 'ENVIADO', 'ENVIADA', 'RECEBIDO', 'RECEBIDA', 'PARC', 'PARCELA', 'INT', 'WWW']);

export function palavrasDe(descricao) {
  return normalizar(descricao).split(/[^A-Z0-9]+/).filter(Boolean);
}

/** Melhor palavra-chave para uma descrição: 1ª palavra significativa (≥3 letras, sem dígitos). */
export function sugerirPalavraChave(descricao) {
  return palavrasDe(descricao).find((p) => p.length >= 3 && !/\d/.test(p) && !IGNORAR.has(p)) || '';
}

/** Regra que casa com a descrição: prefere a do usuário e a palavra-chave mais longa. */
export function aplicarRegras(descricao, usuarioId, regras) {
  const d = normalizar(descricao);
  let melhor = null;
  let melhorPeso = -1;
  regras.forEach((r) => {
    const k = normalizar(r.palavraChave);
    if (!k || !d.includes(k)) return;
    if (r.usuarioId && r.usuarioId !== usuarioId) return;
    const peso = k.length + (r.usuarioId ? 1000 : 0);
    if (peso > melhorPeso) { melhor = r; melhorPeso = peso; }
  });
  return melhor;
}

export function casaPalavra(descricao, palavra) {
  return normalizar(descricao).includes(normalizar(palavra));
}
