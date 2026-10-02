/* Datas em ISO 'AAAA-MM-DD' e meses 'AAAA-MM'. Sem fuso: só strings e aritmética inteira. */

export const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const pad = (n) => String(n).padStart(2, '0');

export function hojeISO() {
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

export function mesAtual() { return hojeISO().slice(0, 7); }

export function diasNoMes(ano, mes) { return new Date(ano, mes, 0).getDate(); }

export function dataValida(ano, mes, dia) {
  return mes >= 1 && mes <= 12 && dia >= 1 && dia <= diasNoMes(ano, mes);
}

export function montarISO(ano, mes, dia) {
  return ano + '-' + pad(mes) + '-' + pad(dia);
}

export function mesDe(iso) { return String(iso).slice(0, 7); }

export function addMeses(mesId, n) {
  const [a, m] = mesId.split('-').map(Number);
  const t = a * 12 + (m - 1) + n;
  return Math.floor(t / 12) + '-' + pad((t % 12) + 1);
}

/** Soma n meses a uma data, limitando o dia ao fim do mês (31/01 + 1 = 28/02). */
export function addMesesData(iso, n) {
  const [a, m, d] = iso.split('-').map(Number);
  const alvo = addMeses(a + '-' + pad(m), n);
  const [aa, mm] = alvo.split('-').map(Number);
  return montarISO(aa, mm, Math.min(d, diasNoMes(aa, mm)));
}

export function addDias(iso, n) {
  const [a, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + n));
  return dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate());
}

export function nomeMes(mesId, comAno = true) {
  const [a, m] = mesId.split('-').map(Number);
  return MESES[m - 1] + (comAno ? ' de ' + a : '');
}

export function nomeMesCurto(mesId) {
  const [a, m] = mesId.split('-').map(Number);
  return MESES[m - 1].slice(0, 3) + '/' + String(a).slice(2);
}

export function fmtData(iso) {
  if (!iso) return '';
  const [a, m, d] = String(iso).slice(0, 10).split('-');
  return d + '/' + m + '/' + a;
}

/** Infere o ano de um dia/mês sem ano a partir da data de referência (fechamento):
    a data nunca é posterior à referência, então "dezembro" numa fatura que fecha
    em janeiro pertence ao ano anterior. */
export function inferirAno(dia, mes, refISO) {
  const [ra, rm, rd] = refISO.split('-').map(Number);
  return mes > rm || (mes === rm && dia > rd) ? ra - 1 : ra;
}

/** Converte texto de data (dd/mm/aaaa, aaaa-mm-dd, dd-mm-aaaa, dd/mm/aa) para ISO ou null. */
export function parseDataTexto(texto) {
  const s = String(texto || '').trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return dataValida(+m[1], +m[2], +m[3]) ? montarISO(+m[1], +m[2], +m[3]) : null;
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})\b/.exec(s);
  if (m) {
    const ano = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return dataValida(ano, +m[2], +m[1]) ? montarISO(ano, +m[2], +m[1]) : null;
  }
  return null;
}
