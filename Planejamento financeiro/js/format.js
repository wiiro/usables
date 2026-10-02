/* Formatação e conversões puras (pt-BR). Valores monetários são SEMPRE
   inteiros em centavos no modelo de dados — nunca ponto flutuante. */

export function uid() {
  return '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

export function brl(centavos) {
  const v = Number(centavos) || 0;
  const abs = Math.abs(v);
  const inteiro = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = String(abs % 100).padStart(2, '0');
  return (v < 0 ? '-' : '') + 'R$ ' + inteiro + ',' + dec;
}

export function brlSemSimbolo(centavos) {
  return brl(centavos).replace('R$ ', '');
}

export function pct(valor, casas = 1) {
  if (!isFinite(valor)) return '—';
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: casas }) + '%';
}

/** Texto digitado pelo usuário -> centavos (int) ou null. Vírgula é o decimal; ponto só é
    decimal se não houver vírgula e vier seguido de 1–2 dígitos ("12.5"). */
export function parseValor(texto) {
  if (texto == null) return null;
  let s = String(texto).trim().replace(/−/g, '-').replace(/R\$/gi, '').replace(/\s/g, '');
  if (!s) return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (s.startsWith('-')) { neg = !neg; s = s.slice(1); }
  if (s.startsWith('+')) s = s.slice(1);
  if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return null;
  let dec = '';
  let inteiro = s;
  if (s.includes(',')) {
    const i = s.lastIndexOf(',');
    inteiro = s.slice(0, i);
    dec = s.slice(i + 1);
  } else if (/\.\d{1,2}$/.test(s)) {
    const i = s.lastIndexOf('.');
    inteiro = s.slice(0, i);
    dec = s.slice(i + 1);
  }
  inteiro = inteiro.replace(/[.,]/g, '');
  if (dec.length > 2 || /[.,]/.test(dec) || !/^\d*$/.test(inteiro)) return null;
  const c = Number(inteiro || '0') * 100 + Number((dec + '00').slice(0, 2));
  return neg ? -c : c;
}

/** Percentual digitado ("12,5" / "12.5%") -> número ou null. */
export function parsePercentual(texto) {
  if (texto == null) return null;
  const s = String(texto).replace('%', '').replace(',', '.').trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Math.round(Number(s) * 100) / 100;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Maiúsculas, sem acento, espaços colapsados — chave de comparação de descrições. */
export function normalizar(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
}

/** Hash não criptográfico (cyrb53) para detectar duplicatas. */
export function hash(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export const PALETA = ['#4f7cac', '#e07a5f', '#81b29a', '#f2cc8f', '#9b72aa', '#3d9a9a', '#d4a373', '#7b8cde', '#c97b9b', '#6b9080', '#b5838d', '#8d99ae'];

export function proximaCor(usadas) {
  const livre = PALETA.find((c) => !usadas.includes(c));
  return livre || PALETA[usadas.length % PALETA.length];
}
