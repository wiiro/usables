/* Validação da fatura: soma das transações extraídas x total da fatura. */

import { brl } from '../format.js';

/** Soma das transações do mês (as parcelas futuras de `futuras` nunca entram). */
export function somaTransacoes(transacoes) {
  return transacoes.reduce((s, t) => s + t.valor, 0);
}

export function validarFatura(resultado) {
  const total = resultado.totalFatura;
  const soma = somaTransacoes(resultado.transacoes);
  const v = { totalFatura: total, totalExtraido: soma, diferenca: null, bateu: false, mensagem: '', subtotais: [] };

  if (total === null || total === undefined) {
    v.mensagem = 'Total da fatura não encontrado no texto — não foi possível validar.';
  } else {
    v.diferenca = total - soma;
    v.bateu = v.diferenca === 0;
    v.mensagem = v.bateu ? '✔ bateu' : 'Diferença de ' + brl(Math.abs(v.diferenca)) + (v.diferenca > 0 ? ' (faltam lançamentos)' : ' (extraído a mais)');
  }

  // Subtotais por cartão: validação intermediária.
  Object.keys(resultado.subtotais || {}).forEach((final) => {
    const extraido = somaTransacoes(resultado.transacoes.filter((t) => t.finalCartao === final));
    v.subtotais.push({ finalCartao: final, informado: resultado.subtotais[final], extraido, bateu: extraido === resultado.subtotais[final] });
  });
  return v;
}

/** Qualidade para comparar parsers: validou > menor diferença > mais transações. */
export function pontuacao(resultado, validacao) {
  if (!resultado.transacoes.length) return -Infinity;
  if (validacao.bateu) return 1e12 + resultado.transacoes.length;
  const dif = validacao.diferenca === null ? 1e9 : Math.abs(validacao.diferenca);
  return -dif * 1000 + resultado.transacoes.length - resultado.suspeitas.length * 5;
}
