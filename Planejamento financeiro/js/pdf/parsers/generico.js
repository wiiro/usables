/* Parser genérico: regex "data + descrição + valor" para layouts desconhecidos.
   Também é o fallback quando o parser do banco detectado falha ou não valida. */

import { normalizar } from '../../format.js';
import { addDias } from '../../datas.js';
import {
  limparLinha, parseValorBR, resolverData, ehLinhaIgnorada, montarTransacao, novoResultado,
  pareceLancamento, hojeISOLocal, RX_LINHA_TRANSACAO
} from './comum.js';

const NUM = '(\\d{1,3}(?:\\.\\d{3})*,\\d{2})';

export default {
  id: 'generico',
  nome: 'Genérico',
  preliminar: false,

  detectar() { return 0.1; },

  extrair(linhasBrutas) {
    const linhas = linhasBrutas.map(limparLinha).filter(Boolean);
    const r = novoResultado('outro');

    for (const l of linhas) {
      const n = normalizar(l);
      let m;
      if (!/ANTERIOR/.test(n) && (m = new RegExp('TOTAL\\s+(?:DA|DESTA|DE)?\\s*FATURA[^\\d-]*(?:R\\$\\s*)?' + NUM).exec(n))) r.totalFatura = parseValorBR(m[1]);
      if (!r.dataVencimento && (m = /VENCIMENTO\D{0,8}(\d{2}\/\d{2}\/\d{4})/.exec(n))) r.dataVencimento = resolverData(m[1]);
      if (!r.dataFechamento && !/PROXIM/.test(n) && (m = /FECHAMENTO\D{0,25}(\d{2}\/\d{2}\/\d{4})/.exec(n))) r.dataFechamento = resolverData(m[1]);
    }
    if (!r.dataFechamento && r.dataVencimento) r.dataFechamento = addDias(r.dataVencimento, -7);
    let ref = r.dataFechamento || r.dataVencimento;
    if (!ref) { ref = hojeISOLocal(); r.avisos.push('Sem datas de fechamento/vencimento no texto; o ano das compras foi inferido pela data de hoje.'); }

    let final = null;
    linhas.forEach((l) => {
      const n = normalizar(l);
      const m = RX_LINHA_TRANSACAO.exec(l);
      if (m) {
        if (ehLinhaIgnorada(m[2])) return;
        const data = resolverData(m[1], ref);
        const valor = parseValorBR(m[3]);
        if (!data || valor === null) { r.suspeitas.push(l); return; }
        r.transacoes.push(montarTransacao({ data, descricao: m[2], valor, finalCartao: final, linhaOriginal: l }));
        return;
      }
      const c = /(?:FINAL|CARTAO)[^\d]{0,24}(\d{4})\b/.exec(n);
      if (c && !/^\d/.test(n)) { final = c[1]; return; }
      if (pareceLancamento(l) && !ehLinhaIgnorada(l)) r.suspeitas.push(l);
    });
    return r;
  }
};
