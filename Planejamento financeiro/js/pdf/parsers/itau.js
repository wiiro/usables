/* Parser Itaú — PRELIMINAR.
   Escrito a partir de suposições sobre o layout (ver README, seção "Suposições a confirmar"):
   - datas dd/mm; lançamentos agrupados por cartão ("cartão final 1234");
   - seções: "Lançamentos: compras e saques", "Lançamentos internacionais",
     "Compras parceladas - próximas faturas" (esta última NÃO entra no total do mês);
   - internacionais: "dd/mm DESCRIÇÃO USD 10,00 5,40 54,00" e IOF em linha própria;
   - subtotal por cartão: "Total dos lançamentos no cartão final 1234 R$ x".
   Calibrar com o texto extraído de uma fatura real (botão "copiar texto mascarado"). */

import { normalizar } from '../../format.js';
import { addDias } from '../../datas.js';
import {
  limparLinha, parseValorBR, resolverData, ehLinhaIgnorada, montarTransacao, novoResultado,
  pareceLancamento, lerIOF, RX_LINHA_TRANSACAO, RX_VALOR_FIM, MOEDAS, DATA_TOKEN
} from './comum.js';
import { detectarParcela } from '../../domain/parcelas.js';

const NUM = '(\\d{1,3}(?:\\.\\d{3})*,\\d{2})';
const RX_INTERNACIONAL = new RegExp('^' + DATA_TOKEN + '\\s+(.+?)\\s+(' + MOEDAS + ')\\s+' + NUM + '\\s+(?:(\\d+,\\d{2,6})\\s+)?(-?' + NUM + ')$', 'i');
const RX_FUTURA = new RegExp('^(?:' + DATA_TOKEN + '\\s+)?(.+?)\\s+(-?' + NUM + ')$', 'i');

export default {
  id: 'itau',
  nome: 'Itaú',
  preliminar: true,

  detectar(texto) {
    const t = normalizar(texto);
    let c = 0;
    if (/\bITAU\b/.test(t)) c += 0.5;
    if (/ITAUCARD|ITAU UNIBANCO|BANCO ITAU/.test(t)) c += 0.3;
    if (/LANCAMENTOS: COMPRAS E SAQUES|PROXIMAS FATURAS/.test(t)) c += 0.2;
    if (/NUBANK|NU PAGAMENTOS/.test(t)) c -= 0.5;
    return Math.max(0, Math.min(1, c));
  },

  extrair(linhasBrutas) {
    const linhas = linhasBrutas.map(limparLinha).filter(Boolean);
    const r = novoResultado('itau');

    // --- cabeçalho: total, vencimento, fechamento ---
    for (const l of linhas) {
      const n = normalizar(l);
      let m;
      if (r.totalFatura === null && (m = new RegExp('TOTAL (?:DESTA|DA) FATURA[^\\d-]*(?:R\\$\\s*)?' + NUM).exec(n)) && !/ANTERIOR/.test(n)) r.totalFatura = parseValorBR(m[1]);
      if (!r.dataVencimento && (m = /VENCIMENTO\D{0,6}(\d{2}\/\d{2}\/\d{4})/.exec(n))) r.dataVencimento = resolverData(m[1]);
      if (!r.dataFechamento && !/PROXIM/.test(n) && (m = /FECHAMENTO\D{0,25}(\d{2}\/\d{2}\/\d{4})/.exec(n))) r.dataFechamento = resolverData(m[1]);
    }
    if (!r.dataFechamento && r.dataVencimento) {
      r.dataFechamento = addDias(r.dataVencimento, -7);
      r.avisos.push('Data de fechamento não encontrada; assumida como 7 dias antes do vencimento.');
    }
    const ref = r.dataFechamento || r.dataVencimento;
    if (!ref) { r.avisos.push('Sem datas de fechamento/vencimento: não foi possível inferir o ano das compras.'); return r; }

    // --- corpo ---
    let secao = 'nacional';
    let final = null;
    let ultima = null;

    linhas.forEach((l) => {
      const n = normalizar(l);

      if (/LANCAMENTOS: COMPRAS E SAQUES|LANCAMENTOS NACIONAIS/.test(n)) { secao = 'nacional'; return; }
      if (/LANCAMENTOS INTERNACIONAIS|COMPRAS INTERNACIONAIS/.test(n)) { secao = 'internacional'; return; }
      if (/COMPRAS PARCELADAS.*PROXIMAS FATURAS|^PROXIMAS FATURAS/.test(n)) { secao = 'futuras'; return; }

      const sub = new RegExp('TOTAL (?:DOS )?LANCAMENTOS(?: NO)? CARTAO(?: FINAL)? (\\d{4}).*?' + NUM + '$').exec(n);
      if (sub) { r.subtotais[sub[1]] = (r.subtotais[sub[1]] || 0) + parseValorBR(sub[2]); return; }

      if (!RX_VALOR_FIM.test(l) && !/^\d{1,2}\//.test(l)) {
        const c = /FINAL\s*(\d{4})\b/.exec(n) || /CARTAO[^\d]*(?:[X*•]{4}[\s.-]*)+(\d{4})\b/.exec(n);
        if (c) { final = c[1]; return; }
      }

      if (secao === 'futuras') {
        const f = RX_FUTURA.exec(l);
        const p = f && detectarParcela(f[2]);
        if (f && p) r.futuras.push({ descricao: p.descricao, valor: parseValorBR(f[3]), parcelaAtual: p.atual, parcelaTotal: p.total, finalCartao: final });
        return;
      }

      if (/^(\d{1,2}\/\d{1,2}\s+)?IOF\b/.test(n)) {
        const iof = lerIOF(l) ?? parseValorBR((RX_VALOR_FIM.exec(l) || [])[1]);
        if (iof !== null && ultima && ultima.moedaOriginal && !ultima._iofAplicado) {
          ultima.iof = iof; ultima.valor += iof; ultima._iofAplicado = true;
        } else if (iof !== null) {
          const d = resolverData((/^(\d{1,2}\/\d{1,2})/.exec(l) || [])[1] || '', ref) || ref;
          r.transacoes.push(montarTransacao({ data: d, descricao: 'IOF', valor: iof, finalCartao: final, linhaOriginal: l, extra: { topicoSugerido: 'Tarifas/IOF' } }));
        }
        return;
      }

      let m = secao === 'internacional' ? RX_INTERNACIONAL.exec(l) : null;
      if (m) {
        const data = resolverData(m[1], ref);
        const t = montarTransacao({ data, descricao: m[2], valor: parseValorBR(m[6]), finalCartao: final, linhaOriginal: l });
        t.moedaOriginal = m[3].toUpperCase();
        t.valorOriginal = parseValorBR(m[4]);
        t.cotacao = m[5] ? Number(m[5].replace(',', '.')) : null;
        if (data) { r.transacoes.push(t); ultima = t; } else r.suspeitas.push(l);
        return;
      }

      m = RX_LINHA_TRANSACAO.exec(l);
      if (m) {
        if (ehLinhaIgnorada(m[2])) return;
        const data = resolverData(m[1], ref);
        const valor = parseValorBR(m[3]);
        if (!data || valor === null) { r.suspeitas.push(l); return; }
        const t = montarTransacao({ data, descricao: m[2], valor, finalCartao: final, linhaOriginal: l });
        r.transacoes.push(t);
        ultima = t;
        return;
      }

      if (pareceLancamento(l) && !ehLinhaIgnorada(l.replace(/^\S+\s+/, ''))) r.suspeitas.push(l);
    });

    return r;
  }
};
