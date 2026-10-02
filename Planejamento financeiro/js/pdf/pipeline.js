/* Pipeline completo no navegador: PDF -> texto (pdf.js | OCR) -> banco/parser -> validação. */

import { abrirPdf, extrairTextoPdf } from './extrair.js';
import { ocrDocumento } from './ocr.js';
import { interpretarFatura } from './interpretar.js';

const MIN_CHARS_POR_PAGINA = 40;

/**
 * @param {File|Blob|ArrayBuffer|Uint8Array} origem
 * @param {{senha?:string, onProgresso?:Function}} opcoes
 * Lança ErroPdf('senha'|'senha-incorreta'|'invalido') para o chamador pedir a senha.
 * O PDF em si nunca é guardado; só o texto extraído (e só o da última fatura de cada banco).
 */
export async function processarPdf(origem, { senha, onProgresso = () => {} } = {}) {
  const buf = origem instanceof Uint8Array ? origem : new Uint8Array(origem.arrayBuffer ? await origem.arrayBuffer() : origem);
  const doc = await abrirPdf(buf, senha);
  try {
    onProgresso({ etapa: 'texto', pct: 0, mensagem: 'Lendo o PDF' });
    let { linhas, chars, paginas } = await extrairTextoPdf(doc, onProgresso);
    let usouOcr = false;
    if (chars / Math.max(1, paginas) < MIN_CHARS_POR_PAGINA) {
      onProgresso({ etapa: 'ocr', pct: 0, mensagem: 'PDF sem texto: iniciando OCR' });
      linhas = await ocrDocumento(doc, onProgresso);
      usouOcr = true;
    }
    onProgresso({ etapa: 'interpretar', pct: 1, mensagem: 'Interpretando a fatura' });
    const interpretacao = interpretarFatura(linhas);
    if (usouOcr) interpretacao.avisos.unshift('Texto obtido por OCR: confira os valores com atenção.');
    return { linhas, texto: linhas.join('\n'), usouOcr, paginas, interpretacao };
  } finally {
    // libera memória/worker (a API variou entre versões do pdf.js)
    try { if (doc.loadingTask && doc.loadingTask.destroy) await doc.loadingTask.destroy(); else if (doc.destroy) await doc.destroy(); } catch (e) { /* já destruído */ }
  }
}
