/* Peças de interface reutilizáveis: toast (com "desfazer"), modais, campos de valor,
   preservação de foco entre renderizações. Sem dependências. */

import { esc, brlSemSimbolo } from './format.js';
import { icone } from './icons.js';

/* ---------- Toast ---------- */

let areaToast = null;

export function toast(msg, { tipo = 'ok', desfazer = null, acao = null, ms = 5000 } = {}) {
  if (!areaToast) {
    areaToast = document.createElement('div');
    areaToast.className = 'toasts';
    areaToast.setAttribute('role', 'status');
    areaToast.setAttribute('aria-live', 'polite');
    document.body.appendChild(areaToast);
  }
  const el = document.createElement('div');
  el.className = 'toast toast-' + tipo;
  el.innerHTML = icone(tipo === 'erro' ? 'alert' : tipo === 'info' ? 'info' : 'check', 18) + '<span>' + esc(msg) + '</span>';
  const fechar = () => { el.remove(); };
  if (desfazer) {
    const b = document.createElement('button');
    b.className = 'btn-link';
    b.textContent = 'Desfazer';
    b.onclick = () => { desfazer(); fechar(); };
    el.appendChild(b);
  }
  if (acao) {
    const b = document.createElement('button');
    b.className = 'btn-link';
    b.textContent = acao.rotulo;
    b.onclick = () => { acao.fn(); fechar(); };
    el.appendChild(b);
  }
  areaToast.appendChild(el);
  setTimeout(fechar, desfazer || acao ? Math.max(ms, 9000) : ms);
}

/* ---------- Modal ---------- */

/**
 * @param {{titulo:string, corpo:string, botoes?:Array, largo?:boolean, aoAbrir?:Function}} o
 * botoes: [{ rotulo, id, primario, perigo }]. Retorna Promise<id do botão | null>.
 * `aoAbrir(el)` recebe o diálogo (para ligar eventos); `valor()` lê campos no clique.
 */
export function modal({ titulo, corpo, botoes = [{ rotulo: 'Fechar', id: 'ok', primario: true }], largo = false, aoAbrir = null, validar = null }) {
  return new Promise((resolve) => {
    const anterior = document.activeElement;
    const fundo = document.createElement('div');
    fundo.className = 'modal-fundo';
    fundo.innerHTML = '<div class="modal ' + (largo ? 'modal-largo' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(titulo) + '">' +
      '<header><h2>' + esc(titulo) + '</h2><button class="icone-btn" data-modal="fechar" aria-label="Fechar">' + icone('x') + '</button></header>' +
      '<div class="modal-corpo">' + corpo + '</div>' +
      '<footer>' + botoes.map((b) => '<button class="btn ' + (b.primario ? 'btn-primario' : b.perigo ? 'btn-perigo' : 'btn-sec') + '" data-modal="' + esc(b.id) + '">' + esc(b.rotulo) + '</button>').join('') + '</footer></div>';
    document.body.appendChild(fundo);
    const dlg = fundo.firstElementChild;

    const fim = (id) => {
      if (id !== null && id !== 'cancelar' && validar && !validar(dlg, id)) return;
      document.removeEventListener('keydown', teclas, true);
      fundo.remove();
      if (anterior && anterior.focus) anterior.focus();
      resolve(id === 'fechar' ? null : id);
    };
    const teclas = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); fim(null); }
      if (e.key === 'Tab') {
        const f = [...dlg.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
      if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        const p = dlg.querySelector('.btn-primario');
        if (p) { e.preventDefault(); p.click(); }
      }
    };
    document.addEventListener('keydown', teclas, true);
    fundo.addEventListener('mousedown', (e) => { if (e.target === fundo) fim(null); });
    dlg.addEventListener('click', (e) => {
      const b = e.target.closest('[data-modal]');
      if (b) fim(b.dataset.modal === 'fechar' ? null : b.dataset.modal);
    });
    if (aoAbrir) aoAbrir(dlg);
    const primeiro = dlg.querySelector('input, select, textarea') || dlg.querySelector('.btn-primario');
    if (primeiro) primeiro.focus();
  });
}

export async function confirmar(msg, { titulo = 'Confirmar', rotulo = 'Confirmar', perigo = false } = {}) {
  const r = await modal({ titulo, corpo: '<p>' + esc(msg) + '</p>', botoes: [{ rotulo: 'Cancelar', id: 'cancelar' }, { rotulo, id: 'sim', primario: !perigo, perigo }] });
  return r === 'sim';
}

/** Pede um texto (ex.: senha do PDF). Retorna string ou null. Nunca guarda nem registra o valor. */
export async function pedirTexto({ titulo, rotulo, tipo = 'text', detalhe = '', confirmarRotulo = 'Continuar', valor = '' }) {
  let digitado = null;
  const r = await modal({
    titulo,
    corpo: (detalhe ? '<p class="suave">' + esc(detalhe) + '</p>' : '') + '<label class="campo"><span>' + esc(rotulo) + '</span><input type="' + tipo + '" id="pedir-texto" autocomplete="off" value="' + esc(valor) + '"></label>',
    botoes: [{ rotulo: 'Cancelar', id: 'cancelar' }, { rotulo: confirmarRotulo, id: 'ok', primario: true }],
    validar: (dlg) => { digitado = dlg.querySelector('#pedir-texto').value; return true; }
  });
  return r === 'ok' ? digitado : null;
}

/* ---------- Campos ---------- */

/** Input de valor em R$ (edição na linha). `data` = atributos data-* para o handler. */
export function campoValor({ centavos, data = {}, classe = '', rotulo = 'Valor', fk = '' }) {
  const attrs = Object.entries(data).map(([k, v]) => 'data-' + k + '="' + esc(v) + '"').join(' ');
  return '<input type="text" inputmode="decimal" class="ed ed-valor ' + classe + '" value="' + esc(brlSemSimbolo(centavos)) + '" ' + attrs + ' data-fk="' + esc(fk) + '" aria-label="' + esc(rotulo) + '" autocomplete="off">';
}

export function opcoesSelect(lista, selecionado, vazio = null) {
  return (vazio !== null ? '<option value="">' + esc(vazio) + '</option>' : '') +
    lista.map((o) => '<option value="' + esc(o.valor) + '"' + (o.valor === selecionado ? ' selected' : '') + '>' + esc(o.rotulo) + '</option>').join('');
}

/* ---------- Foco entre renderizações ---------- */

export function capturarFoco() {
  const a = document.activeElement;
  if (!a || !a.dataset) return null;
  const f = a.dataset.fk ? { fk: a.dataset.fk } : a.dataset.acao ? { acao: a.dataset.acao, id: a.dataset.id || '' } : null;
  if (!f) return null;
  try { f.ini = a.selectionStart; f.fim = a.selectionEnd; } catch (e) { /* tipo sem seleção */ }
  return f;
}

export function restaurarFoco(f) {
  if (!f) return;
  const el = f.fk
    ? document.querySelector('[data-fk="' + CSS.escape(f.fk) + '"]')
    : [...document.querySelectorAll('[data-acao="' + CSS.escape(f.acao) + '"]')].find((x) => (x.dataset.id || '') === f.id);
  if (!el) return;
  el.focus({ preventScroll: true });
  try { if (f.ini != null) el.setSelectionRange(f.ini, f.fim); } catch (e) { /* ignora */ }
}

/** Estado vazio amigável: explicação + botão de ação. */
export function estadoVazio({ icone: ic = 'info', titulo, texto, acao = null }) {
  return '<div class="vazio">' + icone(ic, 36) + '<h3>' + esc(titulo) + '</h3><p>' + esc(texto) + '</p>' +
    (acao ? '<button class="btn btn-primario" data-acao="' + esc(acao.acao) + '"' + (acao.data || '') + '>' + esc(acao.rotulo) + '</button>' : '') + '</div>';
}

export function selo(texto, tipo = '') {
  return '<span class="selo ' + tipo + '">' + esc(texto) + '</span>';
}
