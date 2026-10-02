/* Parser Nubank — PRELIMINAR.
   Suposições (ver README, "Suposições a confirmar"):
   - datas "15 OUT" (mês abreviado em pt-BR) ou dd/mm; o ano vem do período
     "TRANSAÇÕES DE 16 SET A 15 OUT" e/ou do vencimento;
   - lançamento: "15 OUT [•••• 1234] DESCRIÇÃO R$ 45,90"; estorno com sinal de menos;
   - parcela na descrição: "Parcela 3/10" ou "3/10";
   - compra internacional: linha de apoio com "USD 10,00 · Cotação R$ 5,40 · IOF R$ 2,10"
     (ou IOF numa linha própria logo abaixo da compra).
   Calibrar com o texto extraído de uma fatura real. */

import { normalizar } from '../../format.js';
import { MESES_ABREV, addDias, inferirAno, montarISO, dataValida } from '../../datas.js';
import {
  limparLinha, parseValorBR, resolverData, ehLinhaIgnorada, montarTransacao, novoResultado,
  pareceLancamento, lerIOF, lerMoedaEstrangeira, hojeISOLocal, RX_LINHA_TRANSACAO, RX_VALOR_FIM
} from './comum.js';

const MON = MESES_ABREV.join('|');
const NUM = '(\\d{1,3}(?:\\.\\d{3})*,\\d{2})';
const DATA_TXT = '(\\d{1,2})\\s+(' + MON + ')(?:\\s+(\\d{4}))?';

function dataExtenso(m, anoPadrao) {
  const dia = +m[1], mes = MESES_ABREV.indexOf(m[2]) + 1;
  const ano = m[3] ? +m[3] : anoPadrao;
  return ano && dataValida(ano, mes, dia) ? montarISO(ano, mes, dia) : null;
}

export default {
  id: 'nubank',
  nome: 'Nubank',
  preliminar: true,

  detectar(texto) {
    const t = normalizar(texto);
    let c = 0;
    if (/\bNUBANK\b|NU PAGAMENTOS|NU FINANCEIRA/.test(t)) c += 0.6;
    if (new RegExp('TRANSACOES DE \\d{1,2} (' + MON + ') A \\d{1,2} (' + MON + ')').test(t)) c += 0.3;
    if (/ESTA E A SUA FATURA|OLA, .*FATURA/.test(t)) c += 0.1;
    if (/\bITAU\b/.test(t)) c -= 0.5;
    return Math.max(0, Math.min(1, c));
  },

  extrair(linhasBrutas) {
    const linhas = linhasBrutas.map(limparLinha).filter(Boolean);
    const r = novoResultado('nubank');

    // --- cabeçalho ---
    let venc = null, fecha = null;
    for (const l of linhas) {
      const n = normalizar(l);
      let m;
      if (r.totalFatura === null && (m = new RegExp('(?:TOTAL A PAGAR|VALOR DA FATURA|TOTAL DA FATURA|FATURA ATUAL)[^\\d-]*(?:R\\$\\s*)?' + NUM).exec(n)) && !/ANTERIOR/.test(n)) r.totalFatura = parseValorBR(m[1]);
      if (!venc && (m = new RegExp('VENCIMENTO[^\\d]{0,12}(?:' + DATA_TXT + '|(\\d{2})/(\\d{2})/(\\d{4}))').exec(n))) venc = m[4] ? { dia: +m[4], mes: +m[5], ano: +m[6] } : { dia: +m[1], mes: MESES_ABREV.indexOf(m[2]) + 1, ano: m[3] ? +m[3] : null };
      if (!fecha && (m = new RegExp('TRANSACOES DE ' + DATA_TXT + ' A ' + DATA_TXT).exec(n))) fecha = { dia: +m[4], mes: MESES_ABREV.indexOf(m[5]) + 1, ano: m[6] ? +m[6] : null };
      if (!fecha && (m = new RegExp('(?:FATURA FECHA EM|FECHAMENTO|FATURA FECHADA EM)[^\\d]{0,6}' + DATA_TXT).exec(n))) fecha = { dia: +m[1], mes: MESES_ABREV.indexOf(m[2]) + 1, ano: m[3] ? +m[3] : null };
    }

    if (venc) {
      const anoV = venc.ano || inferirAno(venc.dia, venc.mes, hojeISOLocal());
      if (!venc.ano) r.avisos.push('Ano do vencimento não consta no documento; inferido pela data de hoje.');
      r.dataVencimento = dataValida(anoV, venc.mes, venc.dia) ? montarISO(anoV, venc.mes, venc.dia) : null;
    }
    if (fecha) {
      let ano = fecha.ano;
      if (!ano && r.dataVencimento) {
        const [av, mv] = r.dataVencimento.split('-').map(Number);
        ano = fecha.mes > mv ? av - 1 : av;
      }
      if (!ano) { ano = inferirAno(fecha.dia, fecha.mes, hojeISOLocal()); r.avisos.push('Ano do fechamento inferido pela data de hoje.'); }
      r.dataFechamento = dataValida(ano, fecha.mes, fecha.dia) ? montarISO(ano, fecha.mes, fecha.dia) : null;
    }
    if (!r.dataFechamento && r.dataVencimento) {
      r.dataFechamento = addDias(r.dataVencimento, -7);
      r.avisos.push('Data de fechamento não encontrada; assumida como 7 dias antes do vencimento.');
    }
    const ref = r.dataFechamento || r.dataVencimento;
    if (!ref) { r.avisos.push('Sem datas de fechamento/vencimento: não foi possível inferir o ano das compras.'); return r; }

    // --- corpo ---
    let ultima = null;
    linhas.forEach((l) => {
      const n = normalizar(l);
      const m = RX_LINHA_TRANSACAO.exec(l);

      if (m) {
        let desc = m[2];
        let final = null;
        const c = /^[•*xX.]{2,}\s*(\d{4})\s+/.exec(desc);
        if (c) { final = c[1]; desc = desc.slice(c[0].length); }
        if (ehLinhaIgnorada(desc)) return;
        const valor = parseValorBR(m[3]);
        const data = resolverData(m[1], ref);
        if (!data || valor === null) { r.suspeitas.push(l); return; }

        if (/^IOF\b/.test(normalizar(desc))) {
          if (ultima && ultima.moedaOriginal && !ultima._iofAplicado) { ultima.iof = valor; ultima.valor += valor; ultima._iofAplicado = true; return; }
          r.transacoes.push(montarTransacao({ data, descricao: desc, valor, finalCartao: final, linhaOriginal: l, extra: { topicoSugerido: 'Tarifas/IOF' } }));
          return;
        }
        ultima = montarTransacao({ data, descricao: desc, valor, finalCartao: final || (ultima && ultima.finalCartao) || null, linhaOriginal: l });
        r.transacoes.push(ultima);
        return;
      }

      // linha de apoio (sem data) logo abaixo de uma compra: moeda, cotação, IOF
      if (ultima && !/^\d{1,2}[\s/]/.test(l) && /IOF|COTACAO|\b(USD|EUR|GBP)\b/.test(n)) {
        const est = lerMoedaEstrangeira(l);
        if (est.moedaOriginal && !ultima.moedaOriginal) Object.assign(ultima, { moedaOriginal: est.moedaOriginal, valorOriginal: est.valorOriginal });
        if (est.cotacao && !ultima.cotacao) ultima.cotacao = est.cotacao;
        const iof = lerIOF(l);
        if (iof !== null && !ultima._iofAplicado) { ultima.iof = iof; ultima.valor += iof; ultima._iofAplicado = true; }
        else if (/\bIOF\b/.test(n) && iof === null && RX_VALOR_FIM.test(l)) r.suspeitas.push(l);
        return;
      }

      if (pareceLancamento(l) && !ehLinhaIgnorada(l)) r.suspeitas.push(l);
    });

    return r;
  }
};
