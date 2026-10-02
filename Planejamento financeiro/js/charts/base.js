/* ECharts (vendor/echarts, offline): criação, redimensionamento e descarte. */

import { brl, pct } from '../format.js';

const instancias = [];
let observador = null;

export function coresTema() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  return { texto: v('--texto'), suave: v('--texto-suave'), grade: v('--borda'), superficie: v('--superficie'), primaria: v('--primaria'), ok: v('--ok'), aviso: v('--aviso'), erro: v('--erro') };
}

export function criarGrafico(el, option, { aoClicar = null } = {}) {
  if (!el || typeof echarts === 'undefined') return null;
  const c = coresTema();
  const g = echarts.init(el, null, { renderer: 'canvas' });
  g.setOption({
    textStyle: { fontFamily: getComputedStyle(document.body).fontFamily, color: c.suave },
    animationDuration: 300,
    ...option
  });
  if (aoClicar) g.on('click', aoClicar);
  instancias.push(g);
  if (!observador && typeof ResizeObserver !== 'undefined') {
    observador = new ResizeObserver(() => instancias.forEach((i) => { if (!i.isDisposed()) i.resize(); }));
  }
  if (observador) observador.observe(el);
  return g;
}

export function descartarTodos() {
  instancias.splice(0).forEach((g) => { try { if (observador) observador.unobserve(g.getDom()); g.dispose(); } catch (e) { /* já descartado */ } });
}

/** Tooltip padrão: valor em R$ e % (sobre `total`). */
export function tooltipValorPct(total) {
  const c = coresTema();
  return {
    trigger: 'item', backgroundColor: c.superficie, borderColor: c.grade, textStyle: { color: c.texto },
    formatter: (p) => '<b>' + p.name + '</b><br>' + brl(p.value) + (total > 0 ? ' · ' + pct((p.value / total) * 100) : '')
  };
}
