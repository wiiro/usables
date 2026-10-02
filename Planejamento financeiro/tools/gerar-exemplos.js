/* Gera os exemplos FICTÍCIOS em ../exemplos (CSV, textos de fatura e PDFs).
   Uso (precisa de `npm install` nesta pasta):  node gerar-exemplos.js */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import { createCanvas } from '@napi-rs/canvas';
import { FATURAS, PDFS, linhasLogicas } from './dados-faturas.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.join(aqui, '..', 'exemplos');
['csv', 'faturas', 'pdf'].forEach((d) => fs.mkdirSync(path.join(raiz, d), { recursive: true }));

/* ---------- CSV ---------- */

const csvA = [
  'Data;Histórico;Documento;Valor',
  '01/10/2026;PIX RECEBIDO SALARIO EMPRESA XYZ;000123;5.230,45',
  '02/10/2026;Padaria São João;000124;-45,90',
  '03/10/2026;SUPERMERCADO ESTRELA;000125;-312,45',
  '05/10/2026;UBER *TRIP;000126;-23,90',
  '07/10/2026;Farmácia Saúde;000127;-89,90',
  '10/10/2026;PAGAMENTO FATURA CARTAO;000128;-1.108,84',
  '12/10/2026;PIX ENVIADO JOAO;000129;-150,00',
  '15/10/2026;CONTA DE LUZ;000130;-210,35'
].join('\r\n') + '\r\n';
fs.writeFileSync(path.join(raiz, 'csv', 'extrato-banco-a-latin1.csv'), Buffer.from(csvA, 'latin1'));

const csvB = [
  'date,description,debit,credit,balance',
  '2026-10-01,SALARIO,,5230.45,6000.00',
  '2026-10-02,Padaria São João,45.90,,5954.10',
  '2026-10-03,"MERCADO, ESTRELA",312.45,,5641.65',
  '2026-10-05,Uber *Trip,23.90,,5617.75',
  '2026-10-08,Netflix,55.90,,5561.85',
  '2026-10-09,Estorno Netflix,,55.90,5617.75',
  '2026-10-12,"Posto ""Ipiranga""",210.00,,5407.75'
].join('\n') + '\n';
fs.writeFileSync(path.join(raiz, 'csv', 'extrato-banco-b-debito-credito.csv'), csvB, 'utf8');

/* ---------- Textos de fatura (para os testes dos parsers) ---------- */

FATURAS.forEach((f) => {
  const texto = linhasLogicas(f).map((l) => l.split('\t').join('  ')).join('\n') + '\n';
  fs.writeFileSync(path.join(raiz, 'faturas', f.id + '.txt'), texto, 'utf8');
  fs.writeFileSync(path.join(raiz, 'faturas', f.id + '.esperado.json'), JSON.stringify(f.esperado, null, 2) + '\n', 'utf8');
});

/* ---------- PDFs ---------- */

const PAGINA = { w: 595.28, h: 841.89 };
const troca = (s) => s.replace(/−/g, '-');   // U+2212 não existe na fonte padrão do PDF

function posicoes(linha, x0, x1) {
  const seg = troca(linha).split('\t');
  return seg.map((s, i) => ({ s, x: i === 0 ? x0 : i === seg.length - 1 && seg.length > 1 ? null : x0 + 62, direita: i === seg.length - 1 && seg.length > 1, x1 }));
}

function desenhaLinhas(doc, linhas, x0, x1, y0, passo) {
  linhas.forEach((l, i) => {
    const y = y0 + i * passo;
    posicoes(l, x0, x1).forEach((p) => {
      if (p.direita) doc.text(p.s, x0, y, { width: x1 - x0, align: 'right', lineBreak: false });
      else doc.text(p.s, p.x, y, { lineBreak: false });
    });
  });
}

function pdfDigital(f, senha) {
  const opts = { size: 'A4', margin: 40, info: { Title: 'Fatura FICTICIA ' + f.id } };
  if (senha) { opts.userPassword = senha; opts.ownerPassword = senha + '-dono'; }
  const doc = new PDFDocument(opts);
  doc.font('Helvetica').fontSize(10);
  if (f.colunas) {
    desenhaLinhas(doc, f.cabecalho, 40, 555, 50, 16);
    const y0 = 50 + f.cabecalho.length * 16 + 12;
    desenhaLinhas(doc, f.esquerda, 40, 280, y0, 16);
    desenhaLinhas(doc, f.direita, 320, 555, y0, 16);
  } else {
    desenhaLinhas(doc, f.linhas, 40, 555, 50, 16);
  }
  return doc;
}

function pdfEscaneado(f) {
  const esc = 2;                                    // 2 px por ponto
  const canvas = createCanvas(Math.round(PAGINA.w * esc), Math.round(PAGINA.h * esc));
  const c = canvas.getContext('2d');
  c.fillStyle = '#fff'; c.fillRect(0, 0, canvas.width, canvas.height);
  c.fillStyle = '#000'; c.font = (11 * esc) + 'px Arial'; c.textBaseline = 'top';
  linhasLogicas(f).forEach((l, i) => {
    const seg = troca(l).split('\t');
    const y = (50 + i * 18) * esc;
    seg.forEach((s, k) => {
      if (k === seg.length - 1 && seg.length > 1) { c.textAlign = 'right'; c.fillText(s, 555 * esc, y); }
      else { c.textAlign = 'left'; c.fillText(s, (k === 0 ? 40 : 102) * esc, y); }
    });
  });
  const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: 'Fatura FICTICIA escaneada ' + f.id } });
  doc.image(canvas.toBuffer('image/png'), 0, 0, { width: PAGINA.w, height: PAGINA.h });
  return doc;
}

for (const p of PDFS) {
  const f = FATURAS.find((x) => x.id === p.fatura);
  const doc = p.escaneado ? pdfEscaneado(f) : pdfDigital(f, p.senha);
  const destino = path.join(raiz, 'pdf', p.arquivo);
  await new Promise((resolve, reject) => {
    const s = fs.createWriteStream(destino);
    s.on('finish', resolve); s.on('error', reject);
    doc.pipe(s); doc.end();
  });
  console.log('gerado', p.arquivo);
}
