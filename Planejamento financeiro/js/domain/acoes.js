/* Mutações do modelo. Todas recebem um rascunho do estado (o `next` de update())
   e o alteram no lugar — por isso são fáceis de testar com objetos simples. */

import { uid, proximaCor } from '../format.js';
import { rendaDoMes, valoresPlanejados, percentualDe, ehGrupo, filhosDe } from './orcamento.js';

/* ---------- Meses ---------- */

export function garantirMes(s, mesId) {
  if (!s.meses[mesId]) {
    const rendas = {};
    s.usuarios.forEach((u) => { rendas[u.id] = { salarioLiquido: u.salarioLiquido, outrasRendas: u.outrasRendas }; });
    s.meses[mesId] = { id: mesId, alocacoes: {}, rendas };
  }
  return s.meses[mesId];
}

export function mesAnteriorComPlano(s, mesId) {
  const ids = Object.keys(s.meses).filter((k) => k < mesId && Object.keys(s.meses[k].alocacoes).length).sort();
  return ids.length ? ids[ids.length - 1] : null;
}

/** Copia as alocações do mês anterior que tenha plano. Retorna o id do mês de origem ou null. */
export function copiarPlanoAnterior(s, mesId) {
  const origem = mesAnteriorComPlano(s, mesId);
  if (!origem) return null;
  const destino = garantirMes(s, mesId);
  destino.alocacoes = structuredClone(s.meses[origem].alocacoes);
  return origem;
}

/* ---------- Usuários e rendas ---------- */

export function criarUsuario(s, { nome, salarioLiquido = 0, outrasRendas = 0 }) {
  const u = { id: uid(), nome: nome || 'Pessoa', cor: proximaCor(s.usuarios.map((x) => x.cor)), salarioLiquido, outrasRendas };
  s.usuarios.push(u);
  return u;
}

/** Altera salário/outras rendas: vale para o mês indicado e os seguintes (meses passados mantêm o histórico). */
export function definirRenda(s, usuarioId, campo, valor, mesId) {
  const u = s.usuarios.find((x) => x.id === usuarioId);
  if (!u || !['salarioLiquido', 'outrasRendas'].includes(campo)) return;
  u[campo] = valor;
  Object.keys(s.meses).filter((k) => k >= mesId).forEach((k) => {
    const rendas = s.meses[k].rendas;
    rendas[usuarioId] = { salarioLiquido: u.salarioLiquido, outrasRendas: u.outrasRendas, ...(rendas[usuarioId] || {}), [campo]: valor };
  });
}

export function removerUsuario(s, id) {
  s.usuarios = s.usuarios.filter((u) => u.id !== id);
  s.transacoes.forEach((t) => { if (t.usuarioId === id) t.usuarioId = null; });
  s.cartoes.forEach((c) => { if (c.usuarioId === id) c.usuarioId = null; });
  s.regras = s.regras.filter((r) => r.usuarioId !== id);
  Object.values(s.meses).forEach((m) => { delete m.rendas[id]; });
}

/* ---------- Tópicos ---------- */

function proximaOrdem(s, tipo, pai) {
  const irmaos = s.topicos.filter((t) => t.topicoPai === pai && (pai || t.tipo === tipo));
  return irmaos.length ? Math.max(...irmaos.map((t) => t.ordem)) + 1 : 0;
}

export function criarTopico(s, { nome, tipo = 'desejo', cor, icone = '', topicoPai = null, mesId, modoAlocacao = 'valorFixo', valorPlanejado = 0, percentualPlanejado = 0 }) {
  const pai = topicoPai ? s.topicos.find((t) => t.id === topicoPai) : null;
  const t = {
    id: uid(), nome: nome || 'Novo tópico', icone,
    cor: cor || (pai ? pai.cor : proximaCor(s.topicos.map((x) => x.cor))),
    tipo: pai ? pai.tipo : tipo, topicoPai: pai ? pai.id : null,
    ordem: proximaOrdem(s, tipo, pai ? pai.id : null)
  };
  // Tornar um tópico "pai": sua alocação e transações passam ao primeiro subtópico.
  const primeiroFilho = pai && !ehGrupo(s, pai.id);
  s.topicos.push(t);
  if (primeiroFilho) {
    Object.values(s.meses).forEach((m) => {
      if (m.alocacoes[pai.id]) { m.alocacoes[t.id] = m.alocacoes[pai.id]; delete m.alocacoes[pai.id]; }
    });
    s.transacoes.forEach((x) => { if (x.topicoId === pai.id) x.topicoId = t.id; });
    s.regras.forEach((r) => { if (r.topicoId === pai.id) r.topicoId = t.id; });
  } else if (mesId) {
    garantirMes(s, mesId).alocacoes[t.id] = { modoAlocacao, valorPlanejado, percentualPlanejado };
  }
  return t;
}

export function removerTopico(s, id) {
  const ids = new Set([id]);
  s.topicos.filter((t) => t.topicoPai === id).forEach((t) => ids.add(t.id));
  s.topicos = s.topicos.filter((t) => !ids.has(t.id));
  s.transacoes.forEach((t) => { if (ids.has(t.topicoId)) t.topicoId = null; });
  s.regras = s.regras.filter((r) => !ids.has(r.topicoId));
  Object.values(s.meses).forEach((m) => ids.forEach((i) => { delete m.alocacoes[i]; }));
}

export function editarTopico(s, id, campos) {
  const t = s.topicos.find((x) => x.id === id);
  if (!t) return;
  ['nome', 'cor', 'icone', 'tipo'].forEach((k) => { if (campos[k] !== undefined) t[k] = campos[k]; });
  if (campos.tipo) s.topicos.filter((x) => x.topicoPai === id).forEach((f) => { f.tipo = campos.tipo; });
}

/** Troca de posição com o irmão vizinho (delta -1 sobe, +1 desce). */
export function deslocarTopico(s, id, delta) {
  const t = s.topicos.find((x) => x.id === id);
  if (!t) return;
  const irmaos = s.topicos.filter((x) => x.topicoPai === t.topicoPai && (t.topicoPai || x.tipo === t.tipo)).sort((a, b) => a.ordem - b.ordem);
  const i = irmaos.findIndex((x) => x.id === id);
  const j = i + delta;
  if (j < 0 || j >= irmaos.length) return;
  irmaos.splice(j, 0, irmaos.splice(i, 1)[0]);
  irmaos.forEach((x, k) => { x.ordem = k; });
}

/** Arrastar: coloca `id` imediatamente antes de `alvoId` (adota o tipo do alvo se for de topo). */
export function reposicionarTopico(s, id, alvoId) {
  const t = s.topicos.find((x) => x.id === id);
  const alvo = s.topicos.find((x) => x.id === alvoId);
  if (!t || !alvo || t.id === alvo.id || t.topicoPai !== alvo.topicoPai) return false;
  if (!t.topicoPai && t.tipo !== alvo.tipo) {
    t.tipo = alvo.tipo;
    filhosDe(s, t.id).forEach((f) => { f.tipo = alvo.tipo; });
  }
  const irmaos = s.topicos.filter((x) => x.topicoPai === alvo.topicoPai && (alvo.topicoPai || x.tipo === alvo.tipo) && x.id !== id).sort((a, b) => a.ordem - b.ordem);
  irmaos.splice(irmaos.findIndex((x) => x.id === alvoId), 0, t);
  irmaos.forEach((x, k) => { x.ordem = k; });
  return true;
}

/* ---------- Alocações ---------- */

export function definirAlocacao(s, mesId, topicoId, { modo, valor, percentual }) {
  const mes = garantirMes(s, mesId);
  const atual = mes.alocacoes[topicoId] || { modoAlocacao: 'valorFixo', valorPlanejado: 0, percentualPlanejado: 0 };
  const renda = rendaDoMes(s, mesId).total;
  if (modo && modo !== atual.modoAlocacao) {
    // Conversão automática com base na renda total do mês.
    const emReais = valoresPlanejados(s, mesId, renda)[topicoId] ?? 0;
    atual.modoAlocacao = modo;
    atual.valorPlanejado = emReais;
    atual.percentualPlanejado = percentualDe(emReais, renda);
  }
  if (valor !== undefined) { atual.valorPlanejado = Math.max(0, valor); atual.percentualPlanejado = percentualDe(atual.valorPlanejado, renda); atual.modoAlocacao = 'valorFixo'; }
  if (percentual !== undefined) { atual.percentualPlanejado = Math.max(0, percentual); atual.valorPlanejado = Math.round((renda * atual.percentualPlanejado) / 100); atual.modoAlocacao = 'percentual'; }
  mes.alocacoes[topicoId] = atual;
}

/** Move `valor` (centavos) de um tópico para outro; ambos viram valor fixo. */
export function moverDinheiro(s, mesId, deId, paraId, valor) {
  if (deId === paraId || valor <= 0) return false;
  const renda = rendaDoMes(s, mesId).total;
  const mes = garantirMes(s, mesId);
  const planejados = valoresPlanejados(s, mesId, renda);
  const de = planejados[deId] ?? 0;
  const para = planejados[paraId] ?? 0;
  if (valor > de) return false;
  const fixo = (v) => ({ modoAlocacao: 'valorFixo', valorPlanejado: v, percentualPlanejado: percentualDe(v, renda) });
  mes.alocacoes[deId] = fixo(de - valor);
  mes.alocacoes[paraId] = fixo(para + valor);
  return true;
}

/* ---------- Conjunto inicial de tópicos ---------- */

export const TOPICOS_SUGERIDOS = [
  { nome: 'Moradia', tipo: 'necessidade', icone: '🏠', pct: 22 },
  { nome: 'Mercado', tipo: 'necessidade', icone: '🛒', pct: 12 },
  { nome: 'Contas da casa', tipo: 'necessidade', icone: '💡', pct: 6 },
  { nome: 'Transporte', tipo: 'necessidade', icone: '🚗', pct: 6 },
  { nome: 'Saúde', tipo: 'necessidade', icone: '🩺', pct: 4 },
  { nome: 'Educação', tipo: 'necessidade', icone: '📚', pct: 0 },
  { nome: 'Tarifas/IOF', tipo: 'necessidade', icone: '🧾', pct: 0 },
  { nome: 'Lazer', tipo: 'desejo', icone: '🎉', pct: 8 },
  { nome: 'Restaurantes e delivery', tipo: 'desejo', icone: '🍽️', pct: 8 },
  { nome: 'Compras', tipo: 'desejo', icone: '🛍️', pct: 6 },
  { nome: 'Assinaturas', tipo: 'desejo', icone: '📺', pct: 3 },
  { nome: 'Viagens', tipo: 'desejo', icone: '✈️', pct: 5 },
  { nome: 'Reserva de emergência', tipo: 'poupanca', icone: '🛟', pct: 10 },
  { nome: 'Investimentos', tipo: 'poupanca', icone: '📈', pct: 10 }
];

export function aplicarTopicosSugeridos(s, selecionados, mesId) {
  garantirMes(s, mesId);
  selecionados.forEach((sel) => {
    criarTopico(s, { nome: sel.nome, tipo: sel.tipo, icone: sel.icone, mesId, modoAlocacao: 'percentual', percentualPlanejado: sel.pct });
  });
  // pré-calcula o valor fixo equivalente, para manter os dois campos coerentes
  const renda = rendaDoMes(s, mesId).total;
  Object.values(s.meses[mesId].alocacoes).forEach((a) => { a.valorPlanejado = Math.round((renda * a.percentualPlanejado) / 100); });
}
