/* ==========================================================================
   Servidor estático mínimo do Rotinas e Métodos, usado pelo abrir.cmd.
   Uso: node serve.js [porta]
   Serve SEMPRE a pasta dist\ ao lado deste arquivo, nunca um caminho
   recebido de fora, e escuta só em 127.0.0.1 (nada exposto na rede).
   Mesmo desenho do _serve.js do Template.
   ========================================================================== */

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PORT = 8790;
const port = Number(process.argv[2]) || DEFAULT_PORT;
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

/** Caminho absoluto dentro de dist\, ou null se a URL tentar sair dela. */
function resolveInsideRoot(urlPath) {
  const file = path.resolve(root, '.' + urlPath);
  return file === root || file.startsWith(root + path.sep) ? file : null;
}

const server = createServer(async (req, res) => {
  let rel;
  try {
    rel = decodeURIComponent((req.url ?? '/').split('?')[0]);
  } catch {
    res.writeHead(400).end('400');
    return;
  }
  if (rel === '/' || rel === '') rel = '/index.html';

  const file = resolveInsideRoot(rel);
  if (!file) {
    res.writeHead(403).end('403 - fora da pasta servida');
    return;
  }

  try {
    const body = await readFile(file);
    // no-store: depois de uma nova compilação, o navegador sempre pega a
    // versão nova do index.html em vez de reaproveitar a antiga do cache.
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('404 - ' + rel);
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`A porta ${port} já está em uso. Feche a outra janela do app e tente de novo.`);
  } else {
    console.error('Erro no servidor:', error.message);
  }
  process.exit(1);
});

server.listen(port, '127.0.0.1', () => {
  console.log('Servindo ' + root);
  console.log(`http://localhost:${port}/`);
  console.log('Feche esta janela para parar.');
});
