/* Ponto de entrada: carrega o estado, monta a casca (menu, barra superior), roteia as
   telas e liga a delegação de eventos (cliques, edição na linha, arrastar). */

import { App, loadState, substituirEstado, lerPrefsLeves, gravarPrefsLeves, update, Sync, SyncStatus } from './state.js';
import { snapshotParaEstado } from './modelo.js';
import { mesAtual, nomeMes } from './datas.js';
import { esc } from './format.js';
import { icone } from './icons.js';
import { modal, toast, capturarFoco, restaurarFoco } from './ui.js';
import { parseHash, navegar, irParaMes, filtrosPadrao } from './nav.js';
import { resumoMes } from './domain/orcamento.js';
import { descartarTodos } from './charts/base.js';
import { garantirMes } from './domain/acoes.js';
import { acoes as acoesNova } from './views/nova-transacao.js';
import * as onboarding from './views/onboarding.js';
import * as dashboard from './views/dashboard.js';
import * as planejamento from './views/planejamento.js';
import * as transacoes from './views/transacoes.js';
import * as cartoes from './views/cartoes.js';
import * as importar from './views/importar.js';
import * as configuracoes from './views/configuracoes.js';

const VIEWS = { dashboard, planejamento, transacoes, cartoes, importar, configuracoes };
const NAV = [
  ['dashboard', 'Dashboard', 'dashboard'], ['planejamento', 'Planejamento', 'planejamento'], ['transacoes', 'Transações', 'transacoes'],
  ['cartoes', 'Cartões e Faturas', 'cartoes'], ['importar', 'Importar', 'importar'], ['configuracoes', 'Configurações', 'config']
];

const ACOES = { ...acoesNova, ...onboarding.acoes };
const EDICOES = { ...onboarding.edicoes };
const ENTRADAS = {};
Object.values(VIEWS).forEach((v) => {
  Object.assign(ACOES, v.acoes || {});
  Object.assign(EDICOES, v.edicoes || {});
  Object.assign(ENTRADAS, v.entradas || {});
});

/* ---------- Tema ---------- */

function aplicarTema(tema) {
  const raiz = document.documentElement;
  if (tema === 'claro' || tema === 'escuro') raiz.setAttribute('data-theme', tema); else raiz.removeAttribute('data-theme');
}

export function temaEfetivo() {
  const t = App.state.preferencias.tema;
  return t === 'sistema' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro') : t;
}

function alternarTema() {
  const ordem = ['sistema', 'claro', 'escuro'];
  const prox = ordem[(ordem.indexOf(App.state.preferencias.tema) + 1) % 3];
  gravarPrefsLeves({ tema: prox });
  aplicarTema(prox);
  update((s) => { s.preferencias.tema = prox; });
  toast('Tema: ' + { sistema: 'automático (do sistema)', claro: 'claro', escuro: 'escuro' }[prox], { tipo: 'info', ms: 2000 });
}

/* ---------- Casca ---------- */

function statusSalvo() {
  const s = SyncStatus;
  if (!App.ui.armazenamentoOk) return ['offline', 'Erro ao gravar no navegador'];
  const rotulos = { ocioso: 'Dados no navegador', pendente: 'Salvando em arquivo…', salvando: 'Salvando em arquivo…', ok: 'Salvo' + (s.ultimoSalvamento ? ' às ' + new Date(s.ultimoSalvamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''), offline: 'Sem arquivo (servidor off)' };
  return [s.estado, rotulos[s.estado] || ''];
}

function htmlStatus() {
  const [cls, txt] = statusSalvo();
  return '<button class="status-salvo ' + cls + '" data-acao="ir-config" title="Ver detalhes do salvamento"><i class="ponto"></i><span>' + esc(txt) + '</span></button>';
}

const ICONE_TEMA = { sistema: 'auto', claro: 'sun', escuro: 'moon' };

function casca(rota, conteudo) {
  const v = VIEWS[rota];
  const tema = App.state.preferencias.tema;
  const nav = NAV.map(([id, nome, ic]) => '<a class="nav-item" href="#/' + id + '"' + (id === rota ? ' aria-current="page"' : '') + '>' + icone(ic, 20) + '<span>' + nome + '</span></a>').join('');
  const navBaixo = NAV.map(([id, nome, ic]) => '<a href="#/' + id + '"' + (id === rota ? ' aria-current="page"' : '') + '>' + icone(ic, 22) + '<span>' + nome.replace('Cartões e Faturas', 'Cartões') + '</span></a>').join('');
  const aviso = (!App.ui.armazenamentoOk && App.ui.avisoArmazenamento)
    ? '<div class="alerta-caixa erro aviso-topo" role="alert">' + icone('alert') + '<span>' + esc(App.ui.avisoArmazenamento) + '</span></div>' : '';
  const offline = (SyncStatus.estado === 'offline')
    ? '<div class="alerta-caixa aviso-topo" role="status">' + icone('alert') + '<span><b>Servidor local não respondeu.</b> O app segue funcionando, mas os dados estão salvos só neste navegador (sem o arquivo de segurança). Abra pelo atalho <code>abrir.cmd</code> para reativar o arquivo.</span></div>' : '';
  return '<div class="app">' +
    '<aside class="lateral" aria-label="Menu principal"><div class="marca"><span class="marca-logo">' + icone('planejamento', 18) + '</span><span>Planejamento<br>financeiro</span></div>' + nav +
    '<div class="lateral-rodape">' + htmlStatus() + '<button class="nav-item" data-acao="alternar-tema" aria-label="Alternar tema">' + icone(ICONE_TEMA[tema], 20) + '<span>Tema: ' + { sistema: 'automático', claro: 'claro', escuro: 'escuro' }[tema] + '</span></button></div></aside>' +
    '<div class="principal"><header class="topo"><h1>' + esc(v.titulo) + '</h1>' +
    '<div class="seletor-mes" role="group" aria-label="Mês de referência"><button class="icone-btn" data-acao="mes-ant" aria-label="Mês anterior">' + icone('chevL') + '</button>' +
    '<button class="mes-nome" data-acao="mes-escolher" aria-label="Escolher mês">' + esc(nomeMes(App.ui.mes)) + '</button>' +
    '<button class="icone-btn" data-acao="mes-prox" aria-label="Próximo mês">' + icone('chevR') + '</button></div>' +
    '<button class="btn btn-primario" data-acao="nova-transacao">' + icone('plus', 18) + ' Nova transação</button></header>' +
    aviso + offline + '<main class="conteudo" id="conteudo" tabindex="-1">' + conteudo + '</main></div></div>' +
    '<nav class="nav-baixo" aria-label="Menu principal (celular)">' + navBaixo + '</nav>';
}

function renderizar() {
  const raiz = document.getElementById('app');
  const foco = capturarFoco();
  const scrollY = window.scrollY;
  descartarTodos();
  const { rota, params } = parseHash();
  App.ui.rota = rota;
  App.ui.params = params;

  if (!App.state.onboardingConcluido && !App.ui.pularOnboarding) {
    raiz.innerHTML = onboarding.render();
    restaurarFoco(foco);
    return;
  }
  const v = VIEWS[rota];
  const ctx = { state: App.state, ui: App.ui, mes: App.ui.mes, resumo: resumoMes(App.state, App.ui.mes), params };
  raiz.innerHTML = casca(rota, v.render(ctx));
  window.scrollTo(0, scrollY);
  if (v.montar) v.montar(document.getElementById('conteudo'), ctx);
  restaurarFoco(foco);
}

/* Renderização adiada: espera o foco assentar (Tab entre campos) e o mouse subir
   (para o clique não se perder quando uma edição re-renderiza a tela). */
let timerRender = null;
let renderPendente = false;
App.render = function agendar() {
  clearTimeout(timerRender);
  timerRender = setTimeout(() => {
    if (App.ui.apontadorBaixo) { renderPendente = true; return; }
    renderPendente = false;
    renderizar();
  }, 0);
};
document.addEventListener('pointerdown', () => { App.ui.apontadorBaixo = true; }, true);
const soltou = () => {
  App.ui.apontadorBaixo = false;
  if (renderPendente) { renderPendente = false; setTimeout(renderizar, 0); }
};
document.addEventListener('pointerup', soltou, true);
document.addEventListener('pointercancel', soltou, true);

/* ---------- Ações da casca ---------- */

Object.assign(ACOES, {
  'alternar-tema': alternarTema,
  'mes-ant': () => irParaMes(-1),
  'mes-prox': () => irParaMes(1),
  'ir-config': () => navegar('configuracoes'),
  'mes-escolher': async () => {
    let escolhido = null;
    const r = await modal({
      titulo: 'Escolher mês',
      corpo: '<label class="campo"><span>Mês e ano</span><input type="month" id="mes-input" value="' + esc(App.ui.mes) + '"></label>',
      botoes: [{ rotulo: 'Hoje', id: 'hoje' }, { rotulo: 'Ir', id: 'ir', primario: true }],
      validar: (d) => { escolhido = d.querySelector('#mes-input').value; return true; }
    });
    if (r === 'hoje') irParaMes(mesAtual());
    else if (r === 'ir' && /^\d{4}-\d{2}$/.test(escolhido)) irParaMes(escolhido);
  }
});

/* ---------- Delegação de eventos ---------- */

function ligarEventos() {
  const raiz = document.getElementById('app');

  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-acao]');
    if (!el || el.disabled) return;
    const fn = ACOES[el.dataset.acao];
    if (fn) { ev.preventDefault?.(); Promise.resolve(fn(el, ev)).catch((e) => { console.error('ação falhou:', el.dataset.acao, e && e.name); toast('Algo deu errado: ' + (e && e.message ? e.message : 'erro'), { tipo: 'erro' }); }); }
  });

  document.addEventListener('change', (ev) => {
    const el = ev.target.closest('[data-ed]');
    if (!el) return;
    const fn = EDICOES[el.dataset.ed];
    if (fn) Promise.resolve(fn(el, ev)).catch((e) => toast('Não foi possível salvar: ' + (e && e.message ? e.message : 'erro'), { tipo: 'erro' }));
  });

  document.addEventListener('input', (ev) => {
    const el = ev.target.closest('[data-entrada]');
    if (el && ENTRADAS[el.dataset.entrada]) ENTRADAS[el.dataset.entrada](el, ev);
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.target.classList && ev.target.classList.contains('ed')) {
      if (ev.key === 'Enter') { ev.preventDefault(); ev.target.blur(); }
      if (ev.key === 'Escape') { ev.target.value = ev.target.defaultValue; ev.target.blur(); }
    }
  });
  document.addEventListener('focusin', (ev) => {
    if (ev.target.classList && ev.target.classList.contains('ed-valor')) setTimeout(() => ev.target.select(), 0);
  });

  // Arrastar tópicos / soltar arquivos: as telas registram seus próprios handlers via `arrastar`.
  ['dragstart', 'dragover', 'dragleave', 'drop', 'dragend'].forEach((tipo) => {
    raiz.addEventListener(tipo, (ev) => {
      const el = ev.target.closest('[data-arrastar]');
      if (!el) return;
      const fn = ACOES['arrastar-' + el.dataset.arrastar];
      if (fn) fn(el, ev, tipo);
    });
  });
  // Impede o navegador de abrir o arquivo se for solto fora da zona.
  ['dragover', 'drop'].forEach((t) => window.addEventListener(t, (e) => { if (!e.target.closest || !e.target.closest('[data-arrastar]')) e.preventDefault(); }));

  window.addEventListener('hashchange', () => App.render());
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (App.state.preferencias.tema === 'sistema') App.render(); });
  SyncStatus.onChange = () => {
    const b = document.querySelector('.status-salvo');
    if (b) { const [cls, txt] = statusSalvo(); b.className = 'status-salvo ' + cls; b.querySelector('span').textContent = txt; }
    if (SyncStatus.estado === 'offline' && !App.ui.avisouOffline) { App.ui.avisouOffline = true; App.render(); }
    if (SyncStatus.estado === 'ok' && App.ui.avisouOffline) { App.ui.avisouOffline = false; App.render(); }
  };
}

/* ---------- Inicialização ---------- */

async function iniciar() {
  const prefs = lerPrefsLeves();
  aplicarTema(prefs.tema || 'sistema');
  App.ui.mes = /^\d{4}-\d{2}$/.test(prefs.ultimoMes || '') ? prefs.ultimoMes : mesAtual();
  App.ui.filtros = filtrosPadrao();
  App.ui.selecionadas = new Set();
  ligarEventos();

  const r = await loadState();
  aplicarTema(App.state.preferencias.tema === 'sistema' && prefs.tema ? prefs.tema : App.state.preferencias.tema);
  if (App.state.onboardingConcluido && App.state.usuarios.length && !App.state.meses[App.ui.mes]) {
    update((s) => { garantirMes(s, App.ui.mes); }, { render: false });
  }

  if (r.origem === 'vazio' && r.arquivo) {
    const quando = r.arquivo.salvoEm ? new Date(r.arquivo.salvoEm).toLocaleString('pt-BR') : 'data desconhecida';
    const escolha = await modal({
      titulo: 'Restaurar dados salvos?',
      corpo: '<p>O navegador está sem dados, mas encontramos um arquivo de backup (<b>salvo em ' + esc(quando) + '</b>) na pasta de dados do app.</p><p class="suave">Se você começar do zero, o arquivo será sobrescrito na próxima gravação (os últimos backups datados continuam na pasta <code>backups</code>).</p>',
      botoes: [{ rotulo: 'Começar do zero', id: 'zero' }, { rotulo: 'Restaurar backup', id: 'restaurar', primario: true }]
    });
    if (escolha === 'restaurar') {
      try { await substituirEstado(snapshotParaEstado(r.arquivo)); toast('Dados restaurados do arquivo.'); }
      catch (e) { toast(e.message, { tipo: 'erro' }); }
    }
  }
  if (r.origem === 'vazio' && r.servidor === false) Sync.marcarOffline();
  if (!location.hash) location.hash = '#/dashboard';
  renderizar();
}

iniciar().catch((e) => {
  document.getElementById('app').innerHTML = '<div class="onb"><div class="card"><h1>Não foi possível iniciar</h1><p>' + esc(e && e.message) + '</p></div></div>';
});

