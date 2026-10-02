/* ==========================================================================
   Servidor estatico minimo — fallback para maquinas sem Python.
   Uso: node _serve.js [porta]
   Serve SEMPRE o diretorio onde este arquivo esta (__dirname), nunca um
   caminho recebido de fora. Escuta apenas em 127.0.0.1 — nao expoe a rede.
   ========================================================================== */

var http = require('http');
var fs = require('fs');
var path = require('path');

var port = Number(process.argv[2]) || 8778;
var root = path.resolve(__dirname);

var TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

http.createServer(function (req, res) {
  var rel;
  try {
    rel = decodeURIComponent(req.url.split('?')[0]);
  } catch (e) {
    res.writeHead(400); res.end('400'); return;
  }
  if (rel === '/' || rel === '') rel = '/index.html';

  // Path traversal: resolve e exige que o alvo continue dentro de root.
  var file = path.resolve(root, '.' + rel);
  if (file !== root && file.indexOf(root + path.sep) !== 0) {
    res.writeHead(403); res.end('403 - fora do diretorio servido'); return;
  }

  fs.readFile(file, function (err, buf) {
    if (err) { res.writeHead(404); res.end('404 - ' + rel); return; }
    // no-store: dois documentos servidos na mesma porta compartilham as
    // mesmas URLs (localhost:PORTA/state.js). Sem isso o navegador reusa o
    // state.js de um documento no outro e os DOC_ID se misturam.
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store, must-revalidate'
    });
    res.end(buf);
  });
}).listen(port, '127.0.0.1', function () {
  console.log('Servindo ' + root);
  console.log('http://localhost:' + port + '/');
  console.log('Feche esta janela para parar.');
});
