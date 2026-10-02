/* Sankey: Pessoas -> Renda total -> Tópicos (-> subtópicos). Largura proporcional ao valor. */

import { brl, pct } from '../format.js';
import { criarGrafico, coresTema } from './base.js';
import { raizes, filhos, TIPOS, COR_SEM_TOPICO } from '../views/comum.js';
import { ehGrupo } from '../domain/orcamento.js';

export function montarSankey(el, state, resumo, aoClicarNo) {
  const renda = resumo.renda;
  const c = coresTema();
  const nos = new Map();      // id -> { rotulo, cor, tipo, ref }
  const links = [];
  const no = (id, rotulo, cor, tipo, ref) => { if (!nos.has(id)) nos.set(id, { rotulo, cor, tipo, ref }); };
  const liga = (de, para, valor) => { if (valor > 0) links.push({ source: de, target: para, value: valor }); };

  const ID_RENDA = '__renda';
  no(ID_RENDA, 'Renda total', c.primaria, 'renda');
  state.usuarios.forEach((u) => {
    const v = resumo.rendaPorUsuario[u.id].total;
    if (v > 0) { no('u:' + u.id, u.nome, u.cor, 'usuario', u.id); liga('u:' + u.id, ID_RENDA, v); }
  });

  TIPOS.forEach((tipo) => raizes(state, tipo).forEach((r) => {
    const pr = resumo.porTopico[r.id].planejado;
    if (pr <= 0) return;
    no('t:' + r.id, r.nome, r.cor, 'topico', r.id);
    liga(ID_RENDA, 't:' + r.id, pr);
    if (ehGrupo(state, r.id)) {
      filhos(state, r.id).forEach((f) => {
        const pf = resumo.porTopico[f.id].planejado;
        if (pf > 0) { no('t:' + f.id, f.nome, f.cor, 'topico', f.id); liga('t:' + r.id, 't:' + f.id, pf); }
      });
    }
  }));

  if (resumo.faltaDistribuir > 0) { no('__sem', 'Sem destino', COR_SEM_TOPICO, 'sem'); liga(ID_RENDA, '__sem', resumo.faltaDistribuir); }
  if (resumo.faltaDistribuir < 0) { no('__acima', 'Planejado acima da renda', c.erro, 'acima'); liga('__acima', ID_RENDA, -resumo.faltaDistribuir); }

  if (!links.length) return null;
  const rotulo = (id) => (nos.get(id) || {}).rotulo || id;
  const option = {
    tooltip: {
      trigger: 'item', backgroundColor: c.superficie, borderColor: c.grade, textStyle: { color: c.texto },
      formatter: (p) => {
        if (p.dataType === 'edge') return rotulo(p.data.source) + ' → ' + rotulo(p.data.target) + '<br><b>' + brl(p.data.value) + '</b>' + (renda > 0 ? ' · ' + pct((p.data.value / renda) * 100) + ' da renda' : '');
        return '<b>' + rotulo(p.data.name) + '</b><br>' + brl(p.value) + (renda > 0 ? ' · ' + pct((p.value / renda) * 100) + ' da renda' : '');
      }
    },
    series: [{
      type: 'sankey', left: 8, right: 130, top: 8, bottom: 8, nodeWidth: 16, nodeGap: 10, draggable: false, emphasis: { focus: 'adjacency' },
      lineStyle: { color: 'gradient', opacity: 0.35, curveness: 0.5 },
      label: { color: c.texto, fontSize: 12, formatter: (p) => rotulo(p.name) },
      data: [...nos.entries()].map(([id, n]) => ({ name: id, itemStyle: { color: n.cor, borderColor: n.cor } })),
      links
    }]
  };
  return criarGrafico(el, option, {
    aoClicar: (p) => { if (p.dataType === 'node') { const n = nos.get(p.data.name); if (n && n.ref) aoClicarNo(n.tipo, n.ref); } }
  });
}
