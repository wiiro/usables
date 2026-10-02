/* Parcelas: reconhece "03/10", "PARC 03/10", "Parcela 3/10" e projeta as parcelas
   futuras como transações "prevista". Quando a parcela real chega (fatura seguinte),
   ela substitui a prevista da mesma chave — sem duplicar. */

import { normalizar, uid, hash } from '../format.js';
import { addMesesData } from '../datas.js';

const RX_PARC_EXPLICITA = /\bPARC(?:ELA)?\.?\s*(\d{1,2})\s*(?:\/|DE)\s*(\d{1,2})\b/i;
const RX_PARC_SIMPLES = /(?:^|\s)(\d{1,2})\s*\/\s*(\d{1,2})(?=\s|$)/;

function valida(atual, total) {
  return total >= 2 && total <= 99 && atual >= 1 && atual <= total;
}

/** Retorna { atual, total, descricao } (descrição sem o marcador) ou null. */
export function detectarParcela(descricao) {
  const d = String(descricao || '');
  let m = RX_PARC_EXPLICITA.exec(d);
  let rx = RX_PARC_EXPLICITA;
  if (!m || !valida(+m[1], +m[2])) { m = RX_PARC_SIMPLES.exec(d); rx = RX_PARC_SIMPLES; }
  if (!m || !valida(+m[1], +m[2])) return null;
  const limpa = d.replace(rx, ' ').replace(/\s+/g, ' ').replace(/[-–\s]+$/, '').trim();
  return { atual: +m[1], total: +m[2], descricao: limpa || d.trim() };
}

/** Descrição "base" da compra: sem o marcador de parcela, sem acento, maiúscula. */
export function descricaoBase(descricao) {
  const p = detectarParcela(descricao);
  return normalizar(p ? p.descricao : descricao).replace(/\s*[-–]\s*$/, '');
}

export function chaveParcela(t) {
  return [t.finalCartao || '', descricaoBase(t.descricao), t.parcelaTotal, t.parcelaAtual].join('|');
}

const cadeia = (t) => [t.finalCartao || '', descricaoBase(t.descricao), t.parcelaTotal].join('|');

/**
 * Gera as parcelas previstas depois da parcela real `real`.
 * `refISO` é a data da cobrança desta parcela (fechamento da fatura); cada parcela
 * seguinte cai um mês depois.
 */
export function projetarPrevistas(real, refISO, jaExistem = new Set()) {
  if (!real.parcelaTotal || !real.parcelaAtual) return [];
  const out = [];
  for (let k = real.parcelaAtual + 1; k <= real.parcelaTotal; k++) {
    const prev = { ...real, id: uid(), data: addMesesData(refISO, k - real.parcelaAtual), parcelaAtual: k, status: 'prevista', origem: real.origem, valorOriginal: null, moedaOriginal: null, iof: 0 };
    const chave = chaveParcela(prev);
    if (jaExistem.has(chave)) continue;
    prev.chaveParcela = chave;
    prev.hash = 'prev|' + hash(chave);
    out.push(prev);
  }
  return out;
}

/**
 * Aplica a reconciliação sobre o rascunho do estado `s`:
 *  - remove previstas substituídas por parcelas reais recém-importadas;
 *  - cria as previstas seguintes (sem duplicar as que já existem).
 * `reais` = transações reais já com id/hash; `refPor` devolve a data de cobrança de cada uma.
 */
export function reconciliarParcelas(s, reais, refPor = (t) => t.data) {
  const parceladas = reais.filter((t) => t.parcelaAtual && t.parcelaTotal && t.status !== 'prevista');
  if (!parceladas.length) return { removidas: 0, criadas: 0 };

  const chavesReais = new Set(parceladas.map(chaveParcela));
  const antes = s.transacoes.length;
  s.transacoes = s.transacoes.filter((t) => !(t.status === 'prevista' && chavesReais.has(chaveParcela(t))));
  const removidas = antes - s.transacoes.length;

  const existentes = new Set(s.transacoes.filter((t) => t.parcelaTotal).map(chaveParcela));
  parceladas.forEach((r) => existentes.add(chaveParcela(r)));
  let criadas = 0;
  parceladas.forEach((r) => {
    projetarPrevistas(r, refPor(r), existentes).forEach((p) => { s.transacoes.push(p); existentes.add(chaveParcela(p)); criadas++; });
  });
  return { removidas, criadas };
}

const chaveSemFinal = (t) => [descricaoBase(t.descricao), t.parcelaTotal, t.parcelaAtual].join('|');

/**
 * Previstas vindas da seção "próximas faturas" (sem a parcela real no mês).
 * O cartão dessas linhas é incerto no layout, então a existência é checada SEM o final do cartão
 * (descrição + total + parcela) e o final é herdado de outra parcela da mesma compra, se houver.
 */
export function previstasDeFuturas(futuras, refISO, base, transacoes) {
  const jaExistem = new Set(transacoes.filter((t) => t.parcelaTotal).map(chaveSemFinal));
  const porCadeia = {};
  futuras.forEach((f) => { (porCadeia[cadeia(f)] = porCadeia[cadeia(f)] || []).push(f); });
  const out = [];
  Object.values(porCadeia).forEach((grupo) => {
    const minK = Math.min(...grupo.map((g) => g.parcelaAtual));
    grupo.forEach((f) => {
      if (jaExistem.has(chaveSemFinal(f))) return;
      jaExistem.add(chaveSemFinal(f));
      const irma = transacoes.find((t) => t.parcelaTotal === f.parcelaTotal && descricaoBase(t.descricao) === descricaoBase(f.descricao));
      const final = (irma && irma.finalCartao) || f.finalCartao || base.finalCartao || null;
      const p = { ...f, finalCartao: final };
      const chave = chaveParcela(p);
      out.push({ ...base, id: uid(), data: addMesesData(refISO, 1 + f.parcelaAtual - minK), descricao: f.descricao, valor: f.valor, tipo: 'saida', parcelaAtual: f.parcelaAtual, parcelaTotal: f.parcelaTotal, finalCartao: final, status: 'prevista', chaveParcela: chave, hash: 'prev|' + hash(chave) });
    });
  });
  return out;
}
