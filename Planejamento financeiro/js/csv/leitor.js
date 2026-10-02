/* Leitura de CSV: encoding, delimitador, separador decimal, formato de data. Tudo puro. */

import { montarISO, dataValida } from '../datas.js';

/** Decodifica bytes: tenta UTF-8 estrito; se falhar, Windows-1252 (cobre Latin-1). */
export function decodificar(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  try {
    let texto = new TextDecoder('utf-8', { fatal: true }).decode(u8);
    if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1);
    return { texto, encoding: 'utf-8' };
  } catch (e) {
    return { texto: new TextDecoder('windows-1252').decode(u8), encoding: 'windows-1252' };
  }
}

const CANDIDATOS = [';', ',', '\t', '|'];

function contarFora(linha, d) {
  let n = 0, aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') aspas = !aspas;
    else if (c === d && !aspas) n++;
  }
  return n;
}

export function detectarDelimitador(texto) {
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim()).slice(0, 25);
  let melhor = ';', melhorScore = -1;
  CANDIDATOS.forEach((d) => {
    const contagens = linhas.map((l) => contarFora(l, d));
    const freq = {};
    contagens.forEach((c) => { freq[c] = (freq[c] || 0) + 1; });
    const [moda, vezes] = Object.entries(freq).sort((a, b) => b[1] - a[1] || Number(b[0]) - Number(a[0]))[0] || ['0', 0];
    const score = Number(moda) > 0 ? (vezes / (linhas.length || 1)) * 10 + Math.min(Number(moda), 8) / 10 : 0;
    if (score > melhorScore) { melhor = d; melhorScore = score; }
  });
  return melhor;
}

/** Parser CSV com campos entre aspas (""), quebras de linha dentro de aspas e CRLF/LF. */
export function parseCSV(texto, delim) {
  const linhas = [];
  let campo = '', linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else aspas = false; }
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === delim) { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); campo = '';
      if (linha.some((x) => x.trim() !== '')) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  linha.push(campo);
  if (linha.some((x) => x.trim() !== '')) linhas.push(linha);
  return linhas.map((l) => l.map((x) => x.trim()));
}

/* ---------- Números ---------- */

const RX_NUM = /^[-+(]?\s*(?:R\$\s*)?[-+]?\d[\d.,]*\s*[-)]?$/;

export const pareceNumero = (s) => RX_NUM.test(String(s).trim());

/** '1.234,56' -> ',' | '1,234.56' -> '.' (maioria dos valores; empate favorece vírgula). */
export function detectarSeparadorDecimal(valores) {
  let virgula = 0, ponto = 0;
  valores.forEach((v) => {
    const s = String(v).replace(/[^\d.,]/g, '');
    const m = /[.,](?=[^.,]*$)/.exec(s);
    if (!m) return;
    const sep = m[0];
    const digitos = s.length - m.index - 1;
    // até 2 dígitos depois do último separador => ele é o decimal; 3 dígitos => é milhar (o decimal é o outro)
    if (digitos <= 2) { if (sep === ',') virgula++; else ponto++; }
    else if (digitos === 3) { if (sep === '.') virgula++; else ponto++; }
  });
  return ponto > virgula ? '.' : ',';
}

/** Texto -> centavos (int, com sinal) usando o separador decimal informado; null se inválido. */
export function parseNumero(texto, sepDecimal = ',') {
  let s = String(texto ?? '').trim().replace(/−/g, '-').replace(/R\$/gi, '').replace(/\s/g, '');
  if (!s) return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (s.endsWith('-')) { neg = true; s = s.slice(0, -1); }
  if (s.startsWith('-')) { neg = !neg; s = s.slice(1); }
  if (s.startsWith('+')) s = s.slice(1);
  if (!/^[\d.,]+$/.test(s)) return null;
  const milhar = sepDecimal === ',' ? '.' : ',';
  const partes = s.split(sepDecimal);
  if (partes.length > 2) return null;
  const inteiro = partes[0].split(milhar).join('');
  const dec = partes[1] || '';
  if (!/^\d*$/.test(inteiro) || !/^\d*$/.test(dec) || dec.length > 2) return null;
  if (!inteiro && !dec) return null;
  const c = Number(inteiro || '0') * 100 + Number((dec + '00').slice(0, 2));
  return neg ? -c : c;
}

/* ---------- Datas ---------- */

export const FORMATOS_DATA = ['dd/mm/aaaa', 'aaaa-mm-dd', 'dd-mm-aaaa', 'dd/mm/aa'];

export function detectarFormatoData(valores) {
  const rx = { 'aaaa-mm-dd': /^\d{4}-\d{2}-\d{2}/, 'dd/mm/aaaa': /^\d{2}\/\d{2}\/\d{4}/, 'dd-mm-aaaa': /^\d{2}-\d{2}-\d{4}/, 'dd/mm/aa': /^\d{2}\/\d{2}\/\d{2}$/ };
  let melhor = null, max = 0;
  Object.keys(rx).forEach((f) => {
    const n = valores.filter((v) => rx[f].test(String(v).trim())).length;
    if (n > max) { max = n; melhor = f; }
  });
  return melhor;
}

export function parseDataFormato(texto, formato) {
  const s = String(texto ?? '').trim();
  let m;
  if (formato === 'aaaa-mm-dd') m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  else if (formato === 'dd/mm/aaaa') { m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(s); if (m) m = [m[0], m[3], m[2], m[1]]; }
  else if (formato === 'dd-mm-aaaa') { m = /^(\d{2})-(\d{2})-(\d{4})/.exec(s); if (m) m = [m[0], m[3], m[2], m[1]]; }
  else if (formato === 'dd/mm/aa') { m = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(s); if (m) m = [m[0], String(2000 + Number(m[3])), m[2], m[1]]; }
  if (!m) return null;
  const [a, mm, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return dataValida(a, mm, d) ? montarISO(a, mm, d) : null;
}

/* ---------- Análise completa ---------- */

/** Analisa os bytes de um CSV e devolve tudo o que a tela de mapeamento precisa. */
export function analisarCSV(bytes, opcoes = {}) {
  let { texto, encoding } = decodificar(bytes);
  if (opcoes.encoding && opcoes.encoding !== encoding) {
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    texto = new TextDecoder(opcoes.encoding).decode(u8);
    if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1);
    encoding = opcoes.encoding;
  }
  const delimitador = opcoes.delimitador || detectarDelimitador(texto);
  const linhas = parseCSV(texto, delimitador);
  const primeira = linhas[0] || [];
  const temCabecalho = primeira.length > 0 && primeira.every((c) => c !== '' && !pareceNumero(c)) && !detectarFormatoData(primeira);
  const cabecalho = temCabecalho ? primeira : primeira.map((_, i) => 'Coluna ' + (i + 1));
  const dados = temCabecalho ? linhas.slice(1) : linhas;
  const colunas = cabecalho.length;

  const amostraPorColuna = (i) => dados.slice(0, 200).map((l) => l[i] ?? '').filter((v) => v !== '');
  let formatoData = null;
  const candidatosValor = [];
  for (let i = 0; i < colunas; i++) {
    const amostra = amostraPorColuna(i);
    formatoData = formatoData || detectarFormatoData(amostra);
    if (amostra.length && amostra.filter(pareceNumero).length / amostra.length > 0.8 && !detectarFormatoData(amostra)) candidatosValor.push(...amostra);
  }
  return {
    encoding, delimitador, temCabecalho, cabecalho, dados,
    formatoData: formatoData || 'dd/mm/aaaa',
    separadorDecimal: detectarSeparadorDecimal(candidatosValor)
  };
}
