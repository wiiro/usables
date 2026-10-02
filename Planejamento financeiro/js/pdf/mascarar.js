/* "Copiar texto mascarado": remove CPF, CNPJ, e-mail, nome do titular e números de
   cartão (exceto os 4 últimos dígitos). É este texto que se envia para calibrar
   os parsers — por isso erra sempre para o lado de mascarar demais. */

import { normalizar } from '../format.js';

const VARIANTES = { A: 'AÁÀÂÃÄ', E: 'EÉÈÊË', I: 'IÍÌÎÏ', O: 'OÓÒÔÕÖ', U: 'UÚÙÛÜ', C: 'CÇ', N: 'NÑ' };

function regexDeNome(nome) {
  const partes = normalizar(nome).split(' ').filter(Boolean).map((p) =>
    [...p].map((ch) => (VARIANTES[ch] ? '[' + VARIANTES[ch] + ']' : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join(''));
  return new RegExp('(?<![A-Za-zÀ-ÿ])' + partes.join('\\s+') + '(?![A-Za-zÀ-ÿ])', 'gi');
}

const NOME_MAIUSC = "[A-ZÀ-Ú][A-ZÀ-Ú']+(?:\\s+(?:D[AEO]S?\\s+)?[A-ZÀ-Ú][A-ZÀ-Ú']+)+";
const NOME_TITULO = "[A-ZÀ-Ú][a-zà-ú']+(?:\\s+(?:d[aeo]s?\\s+)?[A-ZÀ-Ú][a-zà-ú']+)*";

/** Nomes que aparecem junto a pistas ("Titular:", "Olá,", "cartão final 1234 - NOME"). */
export function coletarNomes(texto) {
  const nomes = new Set();
  const add = (n) => { const t = String(n || '').trim().replace(/[.,;:]+$/, ''); if (t.length >= 4) nomes.add(t); };
  const padroes = [
    new RegExp('(?:TITULAR|NOME DO TITULAR|PORTADOR|CLIENTE|NOME)\\s*[:\\-]?\\s*(' + NOME_MAIUSC + ')', 'g'),
    new RegExp('(?:[Tt]itular|[Pp]ortador|[Cc]liente|[Nn]ome(?: do titular)?)\\s*[:\\-]?\\s*(' + NOME_TITULO + ')', 'g'),
    new RegExp('(?:Ol[aá]|OL[AÁ]),?\\s+(' + NOME_TITULO + ')', 'g'),
    new RegExp('(?:CART[AÃ]O|FINAL|[Cc]art[aã]o|[Ff]inal)[^\\n]{0,30}\\d{4}\\s*[-–]\\s*(' + NOME_MAIUSC + ')', 'g'),
    new RegExp('^(' + NOME_MAIUSC + ')\\s*(?:\\(adicional\\))?\\s*[-–]\\s*(?:CART|FINAL)', 'gim')
  ];
  padroes.forEach((rx) => { let m; while ((m = rx.exec(texto))) add(m[1]); });
  return [...nomes];
}

export function mascararTexto(texto, { nomes = [] } = {}) {
  let t = String(texto);
  const cont = { cpf: 0, cnpj: 0, cartoes: 0, emails: 0, nomes: 0 };
  const troca = (rx, fn, chave) => { t = t.replace(rx, (...a) => { cont[chave]++; return fn(...a); }); };

  troca(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, () => '[CNPJ]', 'cnpj');
  troca(/(?<![\d.,])\d{3}\.\d{3}\.\d{3}-\d{2}(?![\d])/g, () => '[CPF]', 'cpf');
  troca(/(?<![\d.,])\d{11}(?![\d.,])/g, () => '[CPF]', 'cpf');
  troca(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, () => '[EMAIL]', 'emails');
  // Cartão: grupos de 4 (dígitos ou máscara) separados por espaço/traço/ponto, ou 13–19 dígitos seguidos.
  troca(/(?<![\d])(?:[\dX*•]{4}[ .-]){2,4}(\d{1,4})(?![\d])/gi, (_, f) => '•••• •••• •••• ' + f, 'cartoes');
  troca(/(?<![\d.,])\d{13,19}(?![\d.,])/g, (m) => '•••• •••• •••• ' + m.slice(-4), 'cartoes');

  const todos = [...new Set([...nomes, ...coletarNomes(t)])].filter((n) => n && n.length >= 4).sort((a, b) => b.length - a.length);
  todos.forEach((n) => { troca(regexDeNome(n), () => '[NOME]', 'nomes'); });
  // Primeiro nome sozinho em saudações ("Olá, Maria.").
  troca(/((?:Ol[aá]|OL[AÁ]),?\s+)[A-ZÀ-Ú][A-Za-zÀ-ú']+/g, (_, pre) => pre + '[NOME]', 'nomes');
  return { texto: t, substituicoes: cont };
}
