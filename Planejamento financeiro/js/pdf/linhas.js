/* Reconstrução de linhas a partir dos itens de texto do pdf.js, usando coordenadas.
   Item: { str, x, y, w, h }  (y cresce para cima, como no PDF).
   Layouts de duas colunas: acha a "calha" vertical vazia no meio da página e lê
   a coluna esquerda inteira, depois a direita (faixas cheias — cabeçalhos que
   atravessam a calha — dividem a página em regiões lidas de cima para baixo). */

/** Agrupa itens em linhas (de cima para baixo) e junta cada linha da esquerda p/ a direita. */
export function montarLinhas(itens) {
  const ordenados = itens.filter((i) => i.str.trim() !== '').sort((a, b) => b.y - a.y || a.x - b.x);
  const linhas = [];
  ordenados.forEach((it) => {
    const alvo = linhas.find((l) => Math.abs(l.y - it.y) <= Math.max(2, Math.min(l.h, it.h || l.h) * 0.45));
    if (alvo) alvo.itens.push(it);
    else linhas.push({ y: it.y, h: it.h || 8, itens: [it] });
  });
  linhas.sort((a, b) => b.y - a.y);
  return linhas.map((l) => {
    const its = l.itens.sort((a, b) => a.x - b.x);
    let txt = '';
    let fim = null;
    its.forEach((it) => {
      const s = it.str.replace(/\s+/g, ' ');
      if (fim === null) txt = s.trimStart();
      else {
        const gap = it.x - fim;
        const h = it.h || l.h || 8;
        const sep = gap < h * 0.12 ? '' : gap < h * 2.5 ? ' ' : '  ';
        txt = txt.trimEnd() + (sep === '' && /^\s/.test(s) ? ' ' : sep) + s.trimStart();
      }
      fim = it.x + it.w;
    });
    return txt.trim();
  }).filter(Boolean);
}

/** Faixas verticais livres (quase nenhum item as atravessa) na região central da página. */
function faixasLivres(uteis, larguraPagina) {
  const ini = larguraPagina * 0.3, fimX = larguraPagina * 0.7;
  const faixas = [];
  let atual = null;
  for (let c = ini; c <= fimX; c += 2) {
    const cruzam = uteis.filter((i) => i.x < c && i.x + i.w > c).length;
    if (cruzam / uteis.length <= 0.08) atual = atual ? { de: atual.de, ate: c } : { de: c, ate: c };
    else { if (atual) faixas.push(atual); atual = null; }
  }
  if (atual) faixas.push(atual);
  return faixas.filter((f) => f.ate - f.de >= 10).map((f) => ({ ...f, centro: (f.de + f.ate) / 2 }));
}

const mediaChars = (lado) => {
  const ls = montarLinhas(lado);
  return ls.length ? ls.reduce((n, l) => n + l.length, 0) / ls.length : 0;
};

/** x da calha entre duas colunas, ou null. Entre as faixas livres, vale a mais próxima do centro da página
    cujos dois lados formam linhas de texto "cheias" (uma tabela comum — descrição à esquerda, valores à
    direita — também tem faixa livre, mas o lado direito seria só uma coluna de valores). */
export function acharCalha(itens, larguraPagina) {
  const uteis = itens.filter((i) => i.str.trim() !== '');
  if (uteis.length < 12) return null;
  const candidatas = faixasLivres(uteis, larguraPagina).sort((a, b) => Math.abs(a.centro - larguraPagina / 2) - Math.abs(b.centro - larguraPagina / 2));
  for (const f of candidatas) {
    const x = f.centro;
    const esq = uteis.filter((i) => i.x + i.w <= x + 1);
    const dir = uteis.filter((i) => i.x >= x - 1);
    if (esq.length < 6 || dir.length < 6 || esq.length / uteis.length < 0.2 || dir.length / uteis.length < 0.2) continue;
    if (mediaChars(esq) < 14 || mediaChars(dir) < 14) continue;
    return x;
  }
  return null;
}

/** Linhas de uma página, tratando duas colunas quando houver. */
export function linhasDaPagina(itens, larguraPagina) {
  const x = acharCalha(itens, larguraPagina);
  if (x === null) return montarLinhas(itens);

  const cruza = (i) => i.x < x && i.x + i.w > x;
  const faixas = itens.filter(cruza).sort((a, b) => b.y - a.y);
  const resto = itens.filter((i) => !cruza(i));
  const naFaixa = (i, f) => Math.abs(i.y - f.y) <= 2;
  const limites = [Infinity, ...faixas.map((f) => f.y), -Infinity];

  const saida = [];
  for (let k = 0; k <= faixas.length; k++) {
    const hi = limites[k], lo = limites[k + 1];
    const dentro = resto.filter((i) => i.y < hi && i.y > lo && !faixas.some((f) => naFaixa(i, f)));
    saida.push(...montarLinhas(dentro.filter((i) => i.x + i.w / 2 < x)), ...montarLinhas(dentro.filter((i) => i.x + i.w / 2 >= x)));
    if (k < faixas.length) saida.push(...montarLinhas([faixas[k], ...resto.filter((i) => naFaixa(i, faixas[k]))]));
  }
  return saida;
}
