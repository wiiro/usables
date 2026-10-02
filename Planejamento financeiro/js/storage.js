/* IndexedDB — armazenamento principal. Três stores:
   'estado' (chave 'main'), 'transacoes' e 'faturas' (keyPath 'id'). */

const DB_NOME = 'planejamento-financeiro';
const DB_VERSAO = 1;

let dbPromessa = null;

function abrir() {
  if (!dbPromessa) {
    dbPromessa = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB indisponível')); return; }
      const req = indexedDB.open(DB_NOME, DB_VERSAO);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('estado')) db.createObjectStore('estado');
        if (!db.objectStoreNames.contains('transacoes')) db.createObjectStore('transacoes', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('faturas')) db.createObjectStore('faturas', { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Falha ao abrir IndexedDB'));
      req.onblocked = () => reject(new Error('IndexedDB bloqueado por outra aba'));
    });
    dbPromessa.catch(() => { dbPromessa = null; });
  }
  return dbPromessa;
}

const pedido = (req) => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const fim = (tx) => new Promise((resolve, reject) => {
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error || new Error('transação abortada'));
});

/** Lê tudo. `estado` é null quando o banco está vazio (primeira abertura). */
export async function lerTudo() {
  const db = await abrir();
  const tx = db.transaction(['estado', 'transacoes', 'faturas'], 'readonly');
  const [estado, transacoes, faturas] = await Promise.all([
    pedido(tx.objectStore('estado').get('main')),
    pedido(tx.objectStore('transacoes').getAll()),
    pedido(tx.objectStore('faturas').getAll())
  ]);
  return { estado: estado ?? null, transacoes, faturas };
}

/** Grava em UMA transação (tudo ou nada). */
export async function gravar({ estado, transacoesPut = [], transacoesDel = [], faturasPut = [], faturasDel = [] }) {
  const db = await abrir();
  const tx = db.transaction(['estado', 'transacoes', 'faturas'], 'readwrite');
  if (estado) tx.objectStore('estado').put(estado, 'main');
  const t = tx.objectStore('transacoes');
  transacoesDel.forEach((id) => t.delete(id));
  transacoesPut.forEach((x) => t.put(x));
  const f = tx.objectStore('faturas');
  faturasDel.forEach((id) => f.delete(id));
  faturasPut.forEach((x) => f.put(x));
  await fim(tx);
}

/** Substitui TODO o conteúdo (restaurar backup / importar JSON). */
export async function substituirTudo({ estado, transacoes, faturas }) {
  const db = await abrir();
  const tx = db.transaction(['estado', 'transacoes', 'faturas'], 'readwrite');
  tx.objectStore('estado').clear();
  tx.objectStore('transacoes').clear();
  tx.objectStore('faturas').clear();
  tx.objectStore('estado').put(estado, 'main');
  transacoes.forEach((x) => tx.objectStore('transacoes').put(x));
  faturas.forEach((x) => tx.objectStore('faturas').put(x));
  await fim(tx);
}

/** Pede ao navegador que não apague os dados sob pressão de disco. */
export async function pedirPersistencia() {
  try {
    if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist();
  } catch (e) { /* sem suporte: segue sem */ }
  return false;
}

export async function espacoUsado() {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const e = await navigator.storage.estimate();
      return { usado: e.usage || 0, cota: e.quota || 0 };
    }
  } catch (e) { /* ignora */ }
  return { usado: 0, cota: 0 };
}
