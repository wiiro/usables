/* OCR local (Tesseract.js, idioma "por") — fallback para PDF sem camada de texto.
   Worker, núcleo WASM e dados do idioma ficam em vendor/tesseract (funciona offline). */

const BASE = new URL('../../vendor/tesseract/', import.meta.url).href;
let scriptPromessa = null;

function carregarScript() {
  if (!scriptPromessa) {
    scriptPromessa = new Promise((resolve, reject) => {
      if (window.Tesseract) { resolve(window.Tesseract); return; }
      const s = document.createElement('script');
      s.src = BASE + 'tesseract.min.js';
      s.onload = () => resolve(window.Tesseract);
      s.onerror = () => reject(new Error('Não foi possível carregar o Tesseract local.'));
      document.head.appendChild(s);
    });
    scriptPromessa.catch(() => { scriptPromessa = null; });
  }
  return scriptPromessa;
}

/** Renderiza cada página e reconhece o texto. onProgresso({ etapa:'ocr', pct, mensagem }). */
export async function ocrDocumento(doc, onProgresso = () => {}) {
  const Tesseract = await carregarScript();
  let paginaAtual = 0;
  const total = doc.numPages;
  const worker = await Tesseract.createWorker('por', 1, {
    workerPath: BASE + 'worker.min.js',
    corePath: BASE,
    langPath: BASE + 'lang',
    workerBlobURL: false,
    logger: (m) => {
      if (m.status === 'recognizing text') onProgresso({ etapa: 'ocr', pct: (paginaAtual + m.progress) / total, mensagem: 'Reconhecendo página ' + (paginaAtual + 1) + ' de ' + total });
    }
  });
  const linhas = [];
  try {
    for (let p = 1; p <= total; p++) {
      paginaAtual = p - 1;
      onProgresso({ etapa: 'ocr', pct: paginaAtual / total, mensagem: 'Preparando página ' + p + ' de ' + total });
      const pagina = await doc.getPage(p);
      const vp = pagina.getViewport({ scale: 2.5 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(vp.width);
      canvas.height = Math.ceil(vp.height);
      await pagina.render({ canvasContext: canvas.getContext('2d'), viewport: vp, canvas }).promise;
      const { data } = await worker.recognize(canvas);
      data.text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).forEach((l) => linhas.push(l));
      canvas.width = canvas.height = 0;
      pagina.cleanup();
    }
  } finally {
    await worker.terminate();
  }
  return linhas;
}
