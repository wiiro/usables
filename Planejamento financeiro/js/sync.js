/* Sincronização com o arquivo data/estado.json (via API do servidor local).
   O IndexedDB é a fonte principal; o arquivo é um espelho com debounce (~2 s).
   Se o servidor não responder, o app segue só com o IndexedDB e avisa na tela. */

const DEBOUNCE_MS = 2000;
const RETENTAR_MS = 15000;

export const Sync = {
  /** 'ocioso' | 'pendente' | 'salvando' | 'ok' | 'offline' */
  estado: 'ocioso',
  ultimoSalvamento: null,
  mensagem: '',
  onChange: null
};

let timer = null;
let emVoo = false;
let refazer = false;
let obterSnapshot = null;

function mudar(estado, mensagem = '') {
  Sync.estado = estado;
  Sync.mensagem = mensagem;
  if (Sync.onChange) Sync.onChange(Sync);
}

async function api(caminho, opcoes) {
  const r = await fetch('/api/' + caminho, { cache: 'no-store', ...opcoes });
  if (!r.ok) {
    const e = new Error('HTTP ' + r.status);
    e.status = r.status;
    throw e;
  }
  return r.status === 204 ? null : r.json();
}

export function marcarOffline() {
  mudar('offline', 'Servidor local não respondeu — os dados estão salvos só neste navegador.');
}

export function configurar(fnSnapshot) { obterSnapshot = fnSnapshot; }

export function agendar() {
  if (!obterSnapshot) return;
  clearTimeout(timer);
  mudar('pendente');
  timer = setTimeout(salvarAgora, DEBOUNCE_MS);
}

export async function salvarAgora() {
  if (!obterSnapshot) return false;
  clearTimeout(timer);
  if (emVoo) { refazer = true; return false; }
  emVoo = true;
  mudar('salvando');
  try {
    const corpo = JSON.stringify(obterSnapshot());
    const r = await api('estado', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: corpo });
    Sync.ultimoSalvamento = r.salvoEm;
    mudar('ok');
    return true;
  } catch (e) {
    mudar('offline', 'Servidor local não respondeu — os dados estão salvos só neste navegador.');
    timer = setTimeout(salvarAgora, RETENTAR_MS);
    return false;
  } finally {
    emVoo = false;
    if (refazer) { refazer = false; agendar(); }
  }
}

/** Lê o arquivo de dados. Retorna null se não existir (204); lança se o servidor estiver fora. */
export function lerArquivo() {
  return api('estado');
}

export async function infoArquivo() {
  try {
    const i = await api('info');
    if (i.ultimoSalvamento && !Sync.ultimoSalvamento) Sync.ultimoSalvamento = i.ultimoSalvamento;
    return i;
  } catch (e) { return null; }
}

export const listarBackups = () => api('backups');
export const lerBackup = (nome) => api('backups/' + encodeURIComponent(nome));

// Salva ao fechar a aba o que ainda estiver pendente (best effort).
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (Sync.estado === 'pendente' && obterSnapshot) {
      try {
        fetch('/api/estado', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obterSnapshot()), keepalive: true });
      } catch (e) { /* melhor esforço */ }
    }
  });
}
