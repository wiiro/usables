/* ==========================================================================
   Servidor local do Planejamento financeiro (fallback com Node.js).
   Uso: node _serve.js [porta]        (porta padrao: 8795)

   - Serve SEMPRE o diretorio deste arquivo, nunca um caminho recebido de fora.
   - Escuta apenas em 127.0.0.1 (nao expoe a rede).
   - Endpoint de dados (arquivo-espelho do IndexedDB):
       GET  /api/estado            -> data/estado.json (204 se ainda nao existe)
       PUT  /api/estado            -> grava data/estado.json (escrita atomica)
       GET  /api/info              -> metadados (pasta, ultimo salvamento, backups)
       GET  /api/backups           -> lista de snapshots
       GET  /api/backups/<nome>    -> conteudo de um snapshot
   - Aceita somente cliente 127.0.0.1, Host localhost/127.0.0.1:PORTA e, quando
     houver Origin, exatamente http://localhost:PORTA.
   - Cada gravacao gera um snapshot datado em <pasta>/backups (ultimos N).
   - config.json: { "pastaDados": "./data", "maxBackups": 10,
                    "intervaloMinimoSnapshotMin": 0 }
   O _serve.py implementa o MESMO contrato — mantenha os dois em sincronia.
   ========================================================================== */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

var __dirname = path.dirname(fileURLToPath(import.meta.url));

var port = Number(process.argv[2]) || 8795;
var root = path.resolve(__dirname);
var MAX_BODY = 200 * 1024 * 1024;
var NOME_SNAPSHOT = /^estado-\d{8}-\d{6}-\d{3}\.json$/;

var TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.wasm': 'application/wasm',
  '.traineddata': 'application/octet-stream',
  '.gz': 'application/gzip',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bcmap': 'application/octet-stream',
  '.pfb': 'application/octet-stream',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2'
};

/* ---------- Configuracao ---------- */

function lerConfig() {
  var cfg = { pastaDados: './data', maxBackups: 10, intervaloMinimoSnapshotMin: 0 };
  try {
    var bruto = JSON.parse(fs.readFileSync(path.join(root, 'config.json'), 'utf8'));
    if (bruto && typeof bruto.pastaDados === 'string' && bruto.pastaDados.trim()) cfg.pastaDados = bruto.pastaDados.trim();
    if (Number(bruto.maxBackups) >= 1) cfg.maxBackups = Math.floor(Number(bruto.maxBackups));
    if (Number(bruto.intervaloMinimoSnapshotMin) >= 0) cfg.intervaloMinimoSnapshotMin = Number(bruto.intervaloMinimoSnapshotMin);
  } catch (e) { /* sem config.json (ou invalido): usa os padroes */ }
  return cfg;
}

var config = lerConfig();
var pastaDados = path.resolve(root, config.pastaDados);
var pastaBackups = path.join(pastaDados, 'backups');
var arquivoEstado = path.join(pastaDados, 'estado.json');

function dentroDe(pasta, alvo) {
  var rel = path.relative(pasta, alvo);
  return rel === '' || (rel.indexOf('..') !== 0 && !path.isAbsolute(rel));
}

/* ---------- Seguranca da API ---------- */

function clienteLocal(req) {
  var a = req.socket.remoteAddress || '';
  return a === '127.0.0.1' || a === '::ffff:127.0.0.1';
}

function hostValido(req) {
  var h = String(req.headers.host || '').toLowerCase();
  return h === 'localhost:' + port || h === '127.0.0.1:' + port;
}

function originValido(req, exigir) {
  var o = req.headers.origin;
  if (o === undefined) return !exigir;
  return o === 'http://localhost:' + port;
}

function json(res, status, obj) {
  var corpo = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(corpo);
}

/* ---------- Gravacao atomica + snapshots ---------- */

function stamp(d) {
  function p(n, t) { return String(n).padStart(t || 2, '0'); }
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' +
    p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + '-' + p(d.getMilliseconds(), 3);
}

function listarSnapshots() {
  try {
    return fs.readdirSync(pastaBackups).filter(function (n) { return NOME_SNAPSHOT.test(n); }).sort().reverse()
      .map(function (n) {
        var st = fs.statSync(path.join(pastaBackups, n));
        return { nome: n, bytes: st.size, data: st.mtime.toISOString() };
      });
  } catch (e) { return []; }
}

function gravarEstado(buf) {
  fs.mkdirSync(pastaBackups, { recursive: true });
  var tmp = arquivoEstado + '.tmp';
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, arquivoEstado);

  var snaps = listarSnapshots();
  var recente = snaps.length ? Date.parse(snaps[0].data) : 0;
  var intervalo = config.intervaloMinimoSnapshotMin * 60000;
  if (!recente || Date.now() - recente >= intervalo) {
    fs.writeFileSync(path.join(pastaBackups, 'estado-' + stamp(new Date()) + '.json'), buf);
    snaps = listarSnapshots();
  }
  snaps.slice(config.maxBackups).forEach(function (s) {
    try { fs.unlinkSync(path.join(pastaBackups, s.nome)); } catch (e) { /* ja removido */ }
  });
  return { ok: true, salvoEm: new Date().toISOString(), bytes: buf.length, backups: Math.min(snaps.length, config.maxBackups) };
}

function lerCorpo(req, cb) {
  var partes = [];
  var total = 0;
  var estourou = false;
  req.on('data', function (c) {
    total += c.length;
    if (total > MAX_BODY) { estourou = true; req.destroy(); return; }
    partes.push(c);
  });
  req.on('end', function () { if (!estourou) cb(null, Buffer.concat(partes)); });
  req.on('error', function (e) { cb(e); });
  req.on('close', function () { if (estourou) cb(new Error('corpo grande demais')); });
}

function api(req, res, rota) {
  if (!clienteLocal(req) || !hostValido(req)) return json(res, 403, { erro: 'acesso negado' });
  var escreve = req.method !== 'GET';
  if (!originValido(req, escreve)) return json(res, 403, { erro: 'origem nao permitida' });

  if (rota === '/api/estado' && req.method === 'GET') {
    fs.readFile(arquivoEstado, function (err, buf) {
      if (err) { res.writeHead(204, { 'Cache-Control': 'no-store' }); res.end(); return; }   // ainda sem arquivo
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(buf);
    });
    return;
  }

  if (rota === '/api/estado' && req.method === 'PUT') {
    var ct = String(req.headers['content-type'] || '');
    if (ct.indexOf('application/json') !== 0) return json(res, 415, { erro: 'use application/json' });
    lerCorpo(req, function (err, buf) {
      if (err) return json(res, 413, { erro: 'corpo invalido ou grande demais' });
      try {
        var obj = JSON.parse(buf.toString('utf8'));
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('raiz deve ser objeto');
      } catch (e) { return json(res, 400, { erro: 'JSON invalido' }); }
      try { json(res, 200, gravarEstado(buf)); }
      catch (e) { json(res, 500, { erro: 'falha ao gravar: ' + e.code }); }
    });
    return;
  }

  if (rota === '/api/info' && req.method === 'GET') {
    var st = null;
    try { st = fs.statSync(arquivoEstado); } catch (e) { /* ainda nao existe */ }
    return json(res, 200, {
      pastaDados: pastaDados,
      existe: !!st,
      bytes: st ? st.size : 0,
      ultimoSalvamento: st ? st.mtime.toISOString() : null,
      backups: listarSnapshots().length,
      maxBackups: config.maxBackups
    });
  }

  if (rota === '/api/backups' && req.method === 'GET') return json(res, 200, listarSnapshots());

  if (rota.indexOf('/api/backups/') === 0 && req.method === 'GET') {
    var nome = rota.slice('/api/backups/'.length);
    if (!NOME_SNAPSHOT.test(nome)) return json(res, 400, { erro: 'nome invalido' });
    fs.readFile(path.join(pastaBackups, nome), function (err, buf) {
      if (err) return json(res, 404, { erro: 'nao encontrado' });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(buf);
    });
    return;
  }

  json(res, 404, { erro: 'rota desconhecida' });
}

/* ---------- Arquivos estaticos ---------- */

var NEGADOS = ['config.json', '_serve.js', '_serve.py', 'abrir.cmd'];

function estatico(req, res, rel) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end('405'); return; }
  if (rel === '/' || rel === '') rel = '/index.html';

  var file = path.resolve(root, '.' + rel);
  if (!dentroDe(root, file)) { res.writeHead(403); res.end('403 - fora do diretorio servido'); return; }
  var primeiro = path.relative(root, file).split(path.sep)[0];
  if (dentroDe(pastaDados, file) || NEGADOS.indexOf(primeiro) !== -1 || primeiro === 'tools' || primeiro === 'tests') {
    res.writeHead(403); res.end('403'); return;
  }

  fs.readFile(file, function (err, buf) {
    if (err) { res.writeHead(404); res.end('404 - ' + rel); return; }
    // no-store: a origem localhost:PORTA e compartilhada; evita servir JS velho.
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store, must-revalidate'
    });
    res.end(req.method === 'HEAD' ? undefined : buf);
  });
}

http.createServer(function (req, res) {
  var rel;
  try { rel = decodeURIComponent(req.url.split('?')[0]); }
  catch (e) { res.writeHead(400); res.end('400'); return; }

  if (rel.indexOf('/api/') === 0) return api(req, res, rel);
  estatico(req, res, rel);
}).listen(port, '127.0.0.1', function () {
  console.log('Servindo ' + root);
  console.log('Dados em  ' + pastaDados);
  console.log('http://localhost:' + port + '/');
  console.log('Feche esta janela para parar.');
});
