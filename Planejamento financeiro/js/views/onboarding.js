/* Primeira abertura: pessoas -> salários -> tópicos sugeridos (editáveis depois). */

import { App, update } from '../state.js';
import { esc, uid, brl, brlSemSimbolo, parseValor, parsePercentual, pct } from '../format.js';
import { icone } from '../icons.js';
import { TIPOS_TOPICO } from '../modelo.js';
import { toast } from '../ui.js';
import { criarUsuario, aplicarTopicosSugeridos, TOPICOS_SUGERIDOS, garantirMes } from '../domain/acoes.js';
import { navegar } from '../nav.js';

export const titulo = 'Bem-vindo';

function onb() {
  if (!App.ui.onb) {
    App.ui.onb = { passo: 1, pessoas: [{ id: uid(), nome: '', salario: 0 }], topicos: TOPICOS_SUGERIDOS.map((t) => ({ ...t, id: uid(), ativo: true })) };
  }
  return App.ui.onb;
}

function passos(atual) {
  const nomes = ['Pessoas', 'Salários', 'Tópicos'];
  return '<div class="passos" aria-label="Etapas">' + nomes.map((n, i) => '<span class="passo ' + (i + 1 === atual ? 'ativo' : i + 1 < atual ? 'feito' : '') + '"><span class="n">' + (i + 1 < atual ? '✓' : i + 1) + '</span>' + n + '</span>').join('') + '</div>';
}

function passo1(o) {
  return '<h1>Vamos começar 👋</h1><p class="suave">Quem divide as finanças aqui? Cadastre as pessoas da casa — você pode mudar tudo depois.</p>' +
    '<div class="pilha" style="margin-top:14px">' + o.pessoas.map((p, i) =>
      '<div class="linha-form" style="grid-template-columns:1fr auto"><label class="campo"><span>Nome da pessoa ' + (i + 1) + '</span><input type="text" data-ed="onb-nome" data-id="' + p.id + '" data-fk="onb-nome-' + p.id + '" value="' + esc(p.nome) + '" maxlength="40" placeholder="Ex.: Ana"></label>' +
      (o.pessoas.length > 1 ? '<button class="icone-btn" data-acao="onb-rem-pessoa" data-id="' + p.id + '" aria-label="Remover pessoa">' + icone('trash') + '</button>' : '<span></span>') + '</div>').join('') + '</div>' +
    '<p style="margin-top:12px"><button class="btn btn-sec" data-acao="onb-add-pessoa">' + icone('plus') + ' Adicionar pessoa</button></p>' +
    '<footer class="onb-rodape" style="display:flex;justify-content:space-between;margin-top:20px"><button class="btn btn-sec" data-acao="onb-pular">Pular por enquanto</button><button class="btn btn-primario" data-acao="onb-proximo">Continuar</button></footer>';
}

function passo2(o) {
  const total = o.pessoas.reduce((s, p) => s + p.salario, 0);
  return '<h1>Quanto cada pessoa recebe por mês?</h1><p class="suave">Use o salário líquido (o que cai na conta). A soma vira a <b>renda total</b> que você vai distribuir.</p>' +
    '<div class="pilha" style="margin-top:14px">' + o.pessoas.map((p) =>
      '<label class="campo"><span>' + esc(p.nome || 'Pessoa') + ' — salário líquido (R$)</span><input type="text" inputmode="decimal" class="ed-valor" data-ed="onb-salario" data-id="' + p.id + '" data-fk="onb-sal-' + p.id + '" value="' + (p.salario ? esc(brlSemSimbolo(p.salario)) : '') + '" placeholder="0,00"></label>' +
      (total > 0 ? '<div class="barra"><i style="width:' + Math.round((p.salario / total) * 100) + '%;background:var(--primaria)"></i></div><span class="fraco" style="font-size:.8rem">' + pct((p.salario / total) * 100) + ' da renda total</span>' : '')).join('') + '</div>' +
    '<div class="alerta-caixa info" style="margin-top:16px">' + icone('info') + '<span>Renda total: <b>' + brl(total) + '</b></span></div>' +
    '<footer style="display:flex;justify-content:space-between;margin-top:20px"><button class="btn btn-sec" data-acao="onb-voltar">Voltar</button><button class="btn btn-primario" data-acao="onb-proximo">Continuar</button></footer>';
}

function passo3(o) {
  const totalPct = o.topicos.filter((t) => t.ativo).reduce((s, t) => s + t.pct, 0);
  const cor = totalPct === 100 ? 'ok' : totalPct > 100 ? 'erro' : 'aviso';
  let h = '<h1>Para onde vai o dinheiro?</h1><p class="suave">Sugerimos uma divisão inspirada em 50/30/20. Marque os tópicos que quer, ajuste os percentuais ou apague/crie outros depois.</p><div class="onb-topicos">';
  Object.keys(TIPOS_TOPICO).forEach((tipo) => {
    h += '<div class="onb-tipo">' + esc(TIPOS_TOPICO[tipo].nome) + '</div>';
    o.topicos.filter((t) => t.tipo === tipo).forEach((t) => {
      h += '<div class="onb-linha"><input type="checkbox" data-ed="onb-ativo" data-id="' + t.id + '" ' + (t.ativo ? 'checked' : '') + ' aria-label="Usar ' + esc(t.nome) + '">' +
        '<span>' + t.icone + ' ' + esc(t.nome) + '</span><input type="text" inputmode="decimal" class="entrada entrada-pequena" style="text-align:right" data-ed="onb-pct" data-id="' + t.id + '" data-fk="onb-pct-' + t.id + '" value="' + String(t.pct).replace('.', ',') + '%" aria-label="Percentual de ' + esc(t.nome) + '"></div>';
    });
  });
  h += '</div><div class="alerta-caixa ' + cor + '">' + icone(totalPct === 100 ? 'check' : 'info') + '<span>Distribuído: <b>' + pct(totalPct) + '</b> da renda' + (totalPct === 100 ? ' — tudo com destino! 🎉' : totalPct < 100 ? ' — falta ' + pct(100 - totalPct) + ' (você pode ajustar depois).' : ' — passou de 100%.') + '</span></div>' +
    '<footer style="display:flex;justify-content:space-between;margin-top:20px"><button class="btn btn-sec" data-acao="onb-voltar">Voltar</button><button class="btn btn-primario" data-acao="onb-concluir">Concluir e abrir o painel</button></footer>';
  return h;
}

export function render() {
  const o = onb();
  return '<div class="onb"><div class="card">' + '<div class="marca" style="padding:0 0 12px"><span class="marca-logo">' + icone('planejamento', 18) + '</span><span>Planejamento financeiro</span></div>' + passos(o.passo) + [passo1, passo2, passo3][o.passo - 1](o) + '</div></div>';
}

function sincronizar(o) {
  // garante que o último valor digitado foi lido antes de mudar de passo
  document.querySelectorAll('[data-ed^="onb-"]').forEach((el) => { const f = edicoes[el.dataset.ed]; if (f && el.type !== 'checkbox') f(el, null, true); });
  return o;
}

export const acoes = {
  'onb-add-pessoa': () => { sincronizar(onb()).pessoas.push({ id: uid(), nome: '', salario: 0 }); App.render(); },
  'onb-rem-pessoa': (el) => { const o = onb(); o.pessoas = o.pessoas.filter((p) => p.id !== el.dataset.id); App.render(); },
  'onb-voltar': () => { const o = sincronizar(onb()); o.passo = Math.max(1, o.passo - 1); App.render(); },
  'onb-pular': () => { App.ui.pularOnboarding = true; App.render(); },
  'onb-proximo': () => {
    const o = sincronizar(onb());
    if (o.passo === 1) {
      if (!o.pessoas.some((p) => p.nome.trim())) { toast('Informe o nome de pelo menos uma pessoa.', { tipo: 'erro' }); return; }
      o.pessoas = o.pessoas.filter((p) => p.nome.trim());
    }
    o.passo = Math.min(3, o.passo + 1);
    App.render();
  },
  'onb-concluir': () => {
    const o = sincronizar(onb());
    const mes = App.ui.mes;
    update((s) => {
      o.pessoas.forEach((p) => criarUsuario(s, { nome: p.nome.trim(), salarioLiquido: p.salario }));
      garantirMes(s, mes);
      aplicarTopicosSugeridos(s, o.topicos.filter((t) => t.ativo), mes);
      s.onboardingConcluido = true;
    }, { render: false });
    App.ui.onb = null;
    toast('Tudo pronto! Você pode ajustar os tópicos em Planejamento.');
    navegar('dashboard');
    App.render();
  }
};

export const edicoes = {
  'onb-nome': (el) => { const p = onb().pessoas.find((x) => x.id === el.dataset.id); if (p) p.nome = el.value.trim(); },
  'onb-salario': (el, _ev, silencioso) => {
    const p = onb().pessoas.find((x) => x.id === el.dataset.id);
    const v = parseValor(el.value);
    if (p && v !== null && v >= 0) p.salario = v;
    if (!silencioso) App.render();
  },
  'onb-ativo': (el) => { const t = onb().topicos.find((x) => x.id === el.dataset.id); if (t) t.ativo = el.checked; App.render(); },
  'onb-pct': (el, _ev, silencioso) => {
    const t = onb().topicos.find((x) => x.id === el.dataset.id);
    const v = parsePercentual(el.value);
    if (t && v !== null && v >= 0 && v <= 100) t.pct = v;
    if (!silencioso) App.render();
  }
};
