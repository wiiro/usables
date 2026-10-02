/* Estado + persistência. Mesma interface do state.js do Template
   (loadState / persist / update, hidratação defensiva), mas o armazenamento
   principal é o IndexedDB e há um espelho em arquivo (ver sync.js).
   localStorage guarda só preferências leves: tema e último mês aberto. */

import { hidratar, parteEstado, montarSnapshot, seedEstado } from './modelo.js';
import * as Storage from './storage.js';
import * as Sync from './sync.js';
import { mesAtual } from './datas.js';

const LS_PREFS = 'pf_prefs_v1';

export const App = {
  state: seedEstado(),
  /** Estado transitório de interface — nunca persiste. */
  ui: { mes: mesAtual(), rota: 'dashboard', armazenamentoOk: true, avisoArmazenamento: '' },
  render: () => {},
  onErro: (msg) => console.error(msg)
};

/* ---------- Preferências leves (localStorage) ---------- */

export function lerPrefsLeves() {
  try { return JSON.parse(localStorage.getItem(LS_PREFS)) || {}; } catch (e) { return {}; }
}

export function gravarPrefsLeves(patch) {
  try { localStorage.setItem(LS_PREFS, JSON.stringify({ ...lerPrefsLeves(), ...patch })); } catch (e) { /* sem localStorage: segue */ }
}

/* ---------- Persistência ---------- */

const cacheTransacoes = new Map();
const cacheFaturas = new Map();
let fila = Promise.resolve();

function diferenca(lista, cache) {
  const put = [];
  const vistos = new Set();
  lista.forEach((x) => {
    const j = JSON.stringify(x);
    if (cache.get(x.id) !== j) { put.push(x); cache.set(x.id, j); }
    vistos.add(x.id);
  });
  const del = [];
  cache.forEach((_, id) => { if (!vistos.has(id)) del.push(id); });
  del.forEach((id) => cache.delete(id));
  return { put, del };
}

function reiniciarCaches(s) {
  cacheTransacoes.clear();
  cacheFaturas.clear();
  s.transacoes.forEach((x) => cacheTransacoes.set(x.id, JSON.stringify(x)));
  s.faturas.forEach((x) => cacheFaturas.set(x.id, JSON.stringify(x)));
}

/** Grava no IndexedDB (só o que mudou) e agenda o espelho em arquivo. */
export function persist() {
  const s = App.state;
  const t = diferenca(s.transacoes, cacheTransacoes);
  const f = diferenca(s.faturas, cacheFaturas);
  const lote = { estado: parteEstado(s), transacoesPut: t.put, transacoesDel: t.del, faturasPut: f.put, faturasDel: f.del };
  fila = fila.then(() => Storage.gravar(lote)).then(() => {
    App.ui.armazenamentoOk = true;
  }).catch((e) => {
    App.ui.armazenamentoOk = false;
    App.ui.avisoArmazenamento = 'Não foi possível gravar no navegador (' + (e && e.name ? e.name : 'erro') + '). Exporte um backup JSON.';
    App.onErro(App.ui.avisoArmazenamento);
  });
  Sync.agendar();
  return fila;
}

/** Clona o estado, aplica a mutação, persiste e re-renderiza. */
export function update(mutator, { render = true } = {}) {
  const next = structuredClone(App.state);
  mutator(next);
  App.state = next;
  persist();
  if (render) App.render();
}

/** Volta a um estado anterior (usado pelo "Desfazer"). */
export function restaurarEstado(antes) {
  App.state = antes;
  persist();
  App.render();
}

/** Troca o estado inteiro (restaurar / importar) e grava de forma atômica. */
export async function substituirEstado(novo) {
  App.state = hidratar(novo);
  reiniciarCaches(App.state);
  await Storage.substituirTudo({ estado: parteEstado(App.state), transacoes: App.state.transacoes, faturas: App.state.faturas });
  Sync.agendar();
  App.render();
}

/**
 * Carrega o estado ao abrir. Retorna:
 *  { origem: 'banco' }                        — IndexedDB tinha dados
 *  { origem: 'vazio', arquivo: null }         — nada em lugar nenhum (primeira abertura)
 *  { origem: 'vazio', arquivo: {...} }        — banco vazio, mas há arquivo para restaurar
 *  { servidor: false } junto, se o servidor não respondeu
 */
export async function loadState() {
  Sync.configurar(() => montarSnapshot(App.state));
  Storage.pedirPersistencia();
  let lido = null;
  try {
    lido = await Storage.lerTudo();
  } catch (e) {
    App.ui.armazenamentoOk = false;
    App.ui.avisoArmazenamento = 'IndexedDB indisponível neste navegador: os dados só serão guardados no arquivo local.';
  }
  if (lido && lido.estado) {
    App.state = hidratar({ ...lido.estado, transacoes: lido.transacoes, faturas: lido.faturas });
    reiniciarCaches(App.state);
    Sync.infoArquivo().then((i) => { if (!i) Sync.marcarOffline(); });
    return { origem: 'banco' };
  }
  App.state = seedEstado();
  reiniciarCaches(App.state);
  let arquivo = null;
  let servidor = true;
  try { arquivo = await Sync.lerArquivo(); } catch (e) { servidor = false; }
  return { origem: 'vazio', arquivo, servidor };
}

export const SyncStatus = Sync.Sync;
export { Sync };
