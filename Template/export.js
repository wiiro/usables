/* ==========================================================================
   Guia de Tarefas Interativo — export.js
   Os 3 mecanismos de exportação (ver ARCHITECTURE.md, "Relatório de
   impressão" — e App.persist em state.js para o lado da persistência):
   1) PDF — window.print() na seção .gti-print-report dedicada (render.js)
   2) HTML — snapshot estático somente-leitura (Blob + link temporário)
   3) Markdown — só da view Testes & Riscos (Blob + link temporário)

   IMPORTANTE: as strings de texto do usuário (item.text, ann.text, etc.)
   são inseridas SEM escape de HTML no export de HTML — igual ao original.
   Não é descuido: é fidelidade ao comportamento existente. Se algum dia
   isso for revisitado, é uma mudança de comportamento a decidir, não uma
   correção "óbvia".
   ========================================================================== */

// Convenção de slug reaproveitada pelos dois exports que geram arquivo
// Convenção de nome de arquivo: minúsculas, espaços viram hífen, o resto cai.
App.slug = function (title) {
  return (title || 'guia').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

App._download = function (content, mime, filename) {
  var blob = new Blob([content], { type: mime });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
};

/* ---------- 1) PDF ---------- */

App.onExportPdf = function () {
  window.print();
};

/* ---------- 2) HTML (snapshot estático) ---------- */

App.onExportHtml = function () {
  var s = App.state;
  var items = App.allItems(s);
  var doneCount = items.filter(function (i) { return i.status === 'done'; }).length;
  var pct = items.length ? Math.round(doneCount / items.length * 100) : 0;

  var tabsHtml = s.tabs.map(function (tab) {
    var ti = App.tabItems(tab);
    var td = ti.filter(function (i) { return i.status === 'done'; }).length;
    var tp = ti.length ? Math.round(td / ti.length * 100) : 0;
    var secHtml = tab.sections.map(function (sec) {
      var itemsHtml = sec.items.map(function (item) {
        var color = item.status === 'done' ? '#059669' : (item.status === 'blocked' ? '#d30000' : '#6b7280');
        var sym = item.status === 'done' ? '✓' : (item.status === 'blocked' ? '✕' : '○');
        return '<li style="padding:4px 0;color:' + color + ';">' + sym + ' ' + item.text + (item.meta ? ' <span style="color:#94a3b8;font-size:11px;">(' + item.meta + ')</span>' : '') + '</li>';
      }).join('');
      return '<div style="padding:10px 16px;border-top:1px solid #f1f5f9;"><div style="font-weight:600;font-size:12.5px;color:#475569;margin-bottom:6px;">' + sec.title + '</div><ul style="list-style:none;margin:0;padding:0;font-size:12.5px;">' + itemsHtml + '</ul></div>';
    }).join('');
    return '<div style="border:1px solid #e2e8f0;border-radius:10px;margin-bottom:14px;overflow:hidden;"><div style="display:flex;justify-content:space-between;padding:10px 16px;background:#f8fafc;"><span style="font-weight:700;font-size:13px;">' + tab.label + '</span><span style="font-size:12px;font-weight:600;color:#1d3f80;">' + tp + '%</span></div>' + secHtml + '</div>';
  }).join('');

  var annHtml = (s.annotations || []).map(function (a) {
    var meta = App.ANN_TYPES[a.type] || App.ANN_TYPES.nota;
    return '<div style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:12.5px;">' +
      '<b>' + meta.label + '</b> · <span style="color:#94a3b8;">' + a.ts + '</span>' +
      (a.title ? '<div style="font-weight:600;margin-top:2px;">' + a.title + '</div>' : '') +
      (a.text ? '<div style="white-space:pre-wrap;margin-top:2px;">' + a.text + '</div>' : '') +
    '</div>';
  }).join('') || '<p style="color:#94a3b8;">Nenhuma anotação registrada.</p>';

  var html = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório - ' + s.title + '</title>'
    + '<style>body{font-family:Inter,sans-serif;background:#f8f9fb;color:#111827;padding:32px;}h1{color:#1d3f80;}</style></head><body>'
    + '<h1>' + s.title + '</h1><p>' + s.subtitle + '</p><p>Progresso geral: <b>' + pct + '%</b> (' + doneCount + ' de ' + items.length + ' tarefas)</p>'
    + tabsHtml
    + '<h2>Anotações</h2>' + annHtml
    + '</body></html>';

  App._download(html, 'text/html;charset=utf-8', 'relatorio-' + App.slug(s.title) + '.html');
};

/* ---------- 3) Markdown (só Testes & Riscos) ---------- */

App.onExportTestesMd = function () {
  var s = App.state;
  var STAT = { pending: 'Pendente', pass: 'Passou', fail: 'Falhou' };
  var lines = ['# Testes e riscos — ' + s.title, '', '_Gerado em ' + App.ts() + '_', ''];

  lines.push('## Testes', '');
  if (s.testes.tests.length) {
    lines.push('| Teste | Status |', '|---|---|');
    s.testes.tests.forEach(function (t) { lines.push('| ' + t.text + ' | ' + (STAT[t.status] || t.status) + ' |'); });
  } else lines.push('_Nenhum teste registrado._');

  lines.push('', '## Erros', '');
  if (s.testes.errors.length) {
    s.testes.errors.forEach(function (e) { lines.push('- ' + e.text); });
  } else lines.push('_Nenhum erro registrado._');

  lines.push('', '## Riscos', '');
  if (s.testes.risks.length) {
    lines.push('| Risco | Severidade |', '|---|---|');
    s.testes.risks.forEach(function (r) { lines.push('| ' + r.text + ' | ' + (App.IMPACT_LABEL[r.severity] || r.severity) + ' |'); });
  } else lines.push('_Nenhum risco registrado._');

  lines.push('', '## Sugestões de melhorias futuras', '');
  if (s.testes.improvements.length) {
    s.testes.improvements.forEach(function (i) { lines.push('- ' + i.text); });
  } else lines.push('_Nenhuma sugestão registrada._');

  var md = lines.join('\n');
  App._download(md, 'text/markdown;charset=utf-8', 'testes-' + App.slug(s.title) + '.md');
};
