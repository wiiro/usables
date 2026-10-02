/* Extração de texto de PDF com pdf.js (vendor/, offline). A senha vem do chamador e
   NUNCA é armazenada nem registrada. Nada do conteúdo vai para console/log. */

import { linhasDaPagina } from './linhas.js';

const VENDOR = new URL('../../vendor/pdfjs/', import.meta.url).href;
let libPromessa = null;

export function carregarPdfjs() {
  if (!libPromessa) {
    libPromessa = import(VENDOR + 'pdf.min.mjs').then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = VENDOR + 'pdf.worker.min.mjs';
      return lib;
    });
    libPromessa.catch(() => { libPromessa = null; });
  }
  return libPromessa;
}

export class ErroPdf extends Error {
  constructor(codigo, mensagem) { super(mensagem); this.codigo = codigo; }
}

/** Abre o PDF. Lança ErroPdf('senha' | 'senha-incorreta' | 'invalido'). */
export async function abrirPdf(bytes, senha) {
  const lib = await carregarPdfjs();
  const tarefa = lib.getDocument({
    data: bytes.slice(),            // pdf.js transfere o buffer; trabalhe numa cópia
    password: senha || undefined,
    cMapUrl: VENDOR + 'cmaps/', cMapPacked: true,
    standardFontDataUrl: VENDOR + 'standard_fonts/',
    wasmUrl: VENDOR + 'wasm/', iccUrl: VENDOR + 'iccs/',
    isEvalSupported: false, useSystemFonts: false
  });
  try {
    return await tarefa.promise;
  } catch (e) {
    if (e && e.name === 'PasswordException') {
      throw new ErroPdf(e.code === 2 ? 'senha-incorreta' : 'senha', e.code === 2 ? 'Senha incorreta.' : 'Este PDF é protegido por senha.');
    }
    throw new ErroPdf('invalido', 'Não foi possível abrir este PDF.');
  }
}

/** Texto de todas as páginas, reconstruído por coordenadas. */
export async function extrairTextoPdf(doc, onProgresso = () => {}) {
  const linhas = [];
  let chars = 0;
  for (let p = 1; p <= doc.numPages; p++) {
    const pagina = await doc.getPage(p);
    const vp = pagina.getViewport({ scale: 1 });
    const conteudo = await pagina.getTextContent();
    const itens = conteudo.items.filter((i) => typeof i.str === 'string').map((i) => ({
      str: i.str, x: i.transform[4], y: i.transform[5], w: i.width, h: i.height || Math.abs(i.transform[3])
    }));
    const ls = linhasDaPagina(itens, vp.width);
    chars += ls.reduce((n, l) => n + l.length, 0);
    linhas.push(...ls);
    onProgresso({ etapa: 'texto', pct: p / doc.numPages, mensagem: 'Lendo página ' + p + ' de ' + doc.numPages });
    pagina.cleanup();
  }
  return { linhas, chars, paginas: doc.numPages };
}
