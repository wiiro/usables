/* ==========================================================================
   Guia de Tarefas Interativo — render.js
   Reconstrói o innerHTML de #app a cada mudança de estado. Dois mecanismos
   de preservação de foco coexistem (ver conversa de planejamento):

   1) Extract/reinsert (App._preserveEditingNode/_restoreEditingNode) — para
      campos do padrão "lápis" (App.editableField). Só entra em jogo quando
      algo FORA do próprio campo dispara um render enquanto ele está em
      edição (o próprio digitar não renderiza — ver onChange abaixo).
   2) Capture/restore por data-focus-key (App._captureFocus/_restoreFocus) —
      para campos sempre-editáveis sem toggle (estimativa/real, data,
      rascunhos de "adicionar novo").

   Delegação de eventos: um único listener por tipo de evento no container
   #app, usando um registro de funções (App._h) reconstruído a cada render
   (coerente com a arquitetura de "full rebuild" — nada acumula entre renders).
   ========================================================================== */

/* ---------- Escape de texto/atributo ---------- */

App._esc = function (str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

/* ---------- Registro de handlers (reconstruído a cada render) ---------- */

App._h = {};
App._hSeq = 0;
App._reg = function (fn) {
  var id = 'h' + (App._hSeq++);
  App._h[id] = fn;
  return id;
};

/* ==========================================================================
   Mecanismo 1 — extract/reinsert para campos em editingField
   ========================================================================== */

App._preserveEditingNode = function (container) {
  var key = App.state.editingField;
  if (!key) return null;
  var el = container.querySelector('[data-focus-key="' + key + '"]');
  if (!el) return null;
  var sel = { start: el.selectionStart, end: el.selectionEnd };
  el.remove(); // desconecta do DOM mas mantém a referência JS viva
  return { key: key, node: el, sel: sel };
};

App._restoreEditingNode = function (container, preserved) {
  if (!preserved) return;
  var placeholder = container.querySelector('[data-focus-key="' + preserved.key + '"]');
  if (!placeholder) return; // campo não existe mais na nova árvore — fica órfão descartado, tudo bem
  placeholder.replaceWith(preserved.node);
  preserved.node.focus();
  if (typeof preserved.sel.start === 'number' && preserved.node.setSelectionRange) {
    try { preserved.node.setSelectionRange(preserved.sel.start, preserved.sel.end); } catch (e) { /* input type sem seleção */ }
  }
};

/* ==========================================================================
   Mecanismo 2 — capture/restore para campos sempre-editáveis sem toggle
   ========================================================================== */

App._captureFocus = function (container) {
  var active = document.activeElement;
  if (!active || !container.contains(active)) return null;
  var key = active.getAttribute && active.getAttribute('data-focus-key');
  if (!key) return null;
  return { key: key, start: active.selectionStart, end: active.selectionEnd };
};

App._restoreFocus = function (container, captured) {
  if (!captured) return;
  var el = container.querySelector('[data-focus-key="' + captured.key + '"]');
  if (!el) return;
  el.focus();
  if (typeof captured.start === 'number' && el.setSelectionRange) {
    try { el.setSelectionRange(captured.start, captured.end); } catch (e) { /* input type sem seleção */ }
  }
};

/* ==========================================================================
   Mecanismo 3 — foco na abertura do campo (transição view → edit)

   Quando o usuário clica no lápis, o campo editável nasce dentro do innerHTML
   novo e ninguém o focou: não há nó preservado (Mecanismo 1 — o campo não
   estava em edição antes) nem foco capturado (Mecanismo 2 — o clique foi num
   <div>, não num campo). O atributo `autofocus` NÃO resolve isso: o navegador
   só processa autofocus para elementos inseridos durante o carregamento da
   página — num innerHTML atribuído depois, ele é ignorado em silêncio.

   Sem isto, o usuário clica no lápis, o campo abre, ele digita, e as teclas
   não vão a lugar nenhum até clicar de novo dentro do campo.
   ========================================================================== */

App._focusEditingField = function (container) {
  var key = App.state.editingField;
  if (!key) return;
  // Se alguma coisa dentro do app já tem o foco, não roubar: ou é o nó
  // preservado do Mecanismo 1, ou um campo sempre-editável do Mecanismo 2.
  var active = document.activeElement;
  if (active && container.contains(active)) return;
  var el = container.querySelector('[data-focus-key="' + key + '"]');
  if (!el || typeof el.focus !== 'function') return;
  el.focus();
  // Caret no fim do texto existente — abrir um campo preenchido é para revisar,
  // não para sobrescrever do início.
  if (typeof el.selectionStart === 'number' && el.setSelectionRange) {
    try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) { /* input type sem seleção */ }
  }
};

/* ==========================================================================
   Renderizadores de campo reaproveitáveis
   ========================================================================== */

// Campo do padrão "lápis" — view.field vem de App.editableField(...).
// onChangeFn(value) é chamado a cada tecla via App.updateSilent (sem
// re-render — ver logic.js). tag: 'input'|'textarea'.
App._field = function (field, onChangeFn, opts) {
  opts = opts || {};
  var tag = opts.tag || 'input';
  if (field.isEditing) {
    var hi = App._reg(function (v) { onChangeFn(v); });
    var hblur = App._reg(function () { field.onStopEdit(); });
    if (tag === 'textarea') {
      var rows = opts.autoGrowRows ? App.estimateRows(field.value) : (opts.rows || 3);
      // Sem `autofocus`: não funciona em elemento inserido via innerHTML depois
      // do carregamento da página. Quem foca é App._focusEditingField, no fim
      // do render().
      return '<textarea class="gti-field-input" data-focus-key="' + field.key + '" rows="' + rows + '"' +
        (opts.autoGrowRows ? ' data-autogrow="1"' : '') +
        ' data-hi="' + hi + '" data-hblur="' + hblur + '">' + App._esc(field.value) + '</textarea>';
    }
    return '<input class="gti-field-input" type="text" data-focus-key="' + field.key + '" value="' + App._esc(field.value) + '"' +
      ' data-hi="' + hi + '" data-hblur="' + hblur + '">';
  }
  var hStart = App._reg(field.onStartEdit);
  return '<div class="gti-field-view' + (field.isEmpty ? ' is-empty' : '') + '" data-h="' + hStart + '">' +
    '<span class="gti-field-text" style="' + field.viewTextStyle + '">' + App._esc(field.displayValue) + '</span>' +
    '<span class="gti-field-pencil">✎</span>' +
    '</div>';
};

// Campo sempre-editável, sem toggle (estimativa/real, data, rascunhos).
// Protegido pelo Mecanismo 2. onChangeFn(value) dispara render normal
// (App.update/App.setState) — o foco sobrevive via capture/restore.
App._alwaysInput = function (focusKey, value, onChangeFn, opts) {
  opts = opts || {};
  var cls = opts.cls || 'gti-inline-input';
  var type = opts.type || 'text';
  var placeholder = opts.placeholder ? ' placeholder="' + App._esc(opts.placeholder) + '"' : '';
  var hi = App._reg(function (v) { onChangeFn(v); });
  return '<input class="' + cls + '" type="' + type + '" data-focus-key="' + focusKey + '" value="' + App._esc(value) + '"' +
    placeholder + ' data-hi="' + hi + '">';
};

App._alwaysDraftRow = function (focusKey, value, onChangeFn, onAddFn, opts) {
  opts = opts || {};
  var placeholder = opts.placeholder || 'Adicionar item...';
  var input = App._alwaysInput(focusKey, value, onChangeFn, { cls: 'gti-draft-input', placeholder: placeholder });
  var hAdd = App._reg(function () { onAddFn(); });
  return '<div style="display:flex;gap:8px;margin-top:8px;">' + input +
    '<button class="btn btn-secondary btn-sm" data-h="' + hAdd + '">+ Adicionar</button></div>';
};

/* ==========================================================================
   Header
   ========================================================================== */

App._buildHeader = function () {
  var s = App.state;
  var hTitle = App._reg(function () {
    var v = window.prompt('Título do guia:', s.title);
    if (v !== null && v.trim()) App.setState({ title: v.trim() });
  });
  var hSubtitle = App._reg(function () {
    var v = window.prompt('Subtítulo:', s.subtitle);
    if (v !== null) App.setState({ subtitle: v.trim() });
  });
  var hToggleSidebar = App._reg(function () { App.setState({ sidebarCollapsed: !s.sidebarCollapsed }); });
  var hTheme = App._reg(function () { App.setState({ theme: s.theme === 'dark' ? 'light' : 'dark' }); });
  var hExportPdf = App._reg(function () { App.onExportPdf(); });
  var hExportHtml = App._reg(function () { App.onExportHtml(); });

  var items = App.allItems(s);
  var doneCount = items.filter(function (i) { return i.status === 'done'; }).length;
  var overallPct = items.length ? Math.round(doneCount / items.length * 100) : 0;
  var themeIcon = s.theme === 'dark' ? '☾' : '☀';

  return '' +
    '<header class="gti-header">' +
      '<button class="gti-nav-toggle" data-h="' + hToggleSidebar + '" title="Mostrar/ocultar navegação">' + (s.sidebarCollapsed ? '☰' : '‹') + '</button>' +
      '<button class="gti-header-title" data-h="' + hTitle + '">' + App._esc(s.title) + '</button>' +
      '<button class="gti-header-subtitle" data-h="' + hSubtitle + '">' + App._esc(s.subtitle) + '</button>' +
      '<div class="gti-header-exports">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-right:4px;">' +
          '<div style="width:100px;height:6px;border-radius:var(--radius-full);background:var(--gti-border);overflow:hidden;">' +
            '<div style="height:100%;width:' + overallPct + '%;background:var(--brand-primary);"></div></div>' +
          '<span style="font-size:var(--text-12);font-weight:var(--weight-semibold);color:var(--brand-primary);min-width:34px;">' + overallPct + '%</span>' +
        '</div>' +
        '<button class="btn btn-ghost btn-sm" data-h="' + hExportHtml + '">Exportar HTML</button>' +
        '<button class="btn btn-primary btn-sm" data-h="' + hExportPdf + '">Exportar PDF</button>' +
        '<button class="gti-nav-toggle" data-h="' + hTheme + '" title="Alternar tema">' + themeIcon + '</button>' +
      '</div>' +
    '</header>';
};

/* ==========================================================================
   Sidebar
   ========================================================================== */

App._navItem = function (label, dotColor, isActive, onSelect, extra) {
  var hSel = App._reg(onSelect);
  return '<button class="gti-nav-item' + (isActive ? ' is-active' : '') + '" data-h="' + hSel + '">' +
    '<span class="gti-nav-dot" style="background:' + dotColor + ';"></span>' +
    '<span class="gti-nav-label" title="' + App._esc(label) + '">' + App._esc(label) + '</span>' +
    (extra || '') +
    '</button>';
};

App._buildSidebar = function () {
  var s = App.state;
  var html = '<nav class="gti-sidebar-nav">';

  html += App._navItem('Visão Geral', 'var(--brand-primary)', s.activeTab === '__overview',
    function () { App.setState({ activeTab: '__overview' }); });
  html += App._navItem('Resumo Executivo', 'var(--neutral-500)', s.activeTab === '__resumo',
    function () { App.setState({ activeTab: '__resumo' }); });

  html += '<div class="gti-nav-section-label">Fases</div>';
  s.tabs.forEach(function (tab, idx) {
    var hDelete = App._reg(function () {
      // Container: pergunta sempre, dizendo o que vai junto (ver logic.js).
      var nEtapas = tab.sections.length;
      var nItens = App.tabItems(tab).length;
      var cascata = (nEtapas || nItens)
        ? '\n\nVão junto ' + App.plural(nEtapas, 'etapa', 'etapas') + ' e ' + App.plural(nItens, 'item', 'itens') + '.'
        : '';
      if (!App.confirmDelete('Excluir a fase "' + tab.label + '"?' + cascata)) return;
      App.update(function (next) { next.tabs = next.tabs.filter(function (t) { return t.id !== tab.id; }); });
    });
    var extra = '<span class="gti-nav-delete" data-h="' + hDelete + '" title="Excluir fase">×</span>';
    html += App._navItem((idx + 1) + '. ' + tab.label, App.TAB_DOTS[tab.color] || App.TAB_DOTS.gray,
      s.activeTab === tab.id, (function (id) { return function () { App.setState({ activeTab: id }); }; })(tab.id), extra);
  });
  var hAddTab = App._reg(function () {
    var label = window.prompt('Nome da nova fase:', 'Nova fase');
    if (!label || !label.trim()) return;
    App.update(function (next) {
      var color = App.TAB_ORDER[next.tabs.length % App.TAB_ORDER.length];
      var nt = { id: App.uid(), label: label.trim(), color: color, sections: [] };
      next.tabs.push(nt);
      next.activeTab = nt.id;
    });
  });
  html += '<button class="gti-nav-add" data-h="' + hAddTab + '">＋ Nova fase</button>';

  html += '<div style="height:1px;background:var(--gti-border);margin:14px 4px;"></div>';
  html += App._navItem('Testes & Riscos', 'var(--feedback-warning)', s.activeTab === '__testes',
    function () { App.setState({ activeTab: '__testes' }); });
  html += App._navItem('Progresso & Relatório', 'var(--brand-accent)', s.activeTab === '__progress',
    function () { App.setState({ activeTab: '__progress' }); });

  html += '</nav>' +
    '<div class="gti-sidebar-resize-handle" data-resize-handle="1"></div>';

  var collapsed = s.sidebarCollapsed;
  var widthPx = collapsed ? '0px' : (s.sidebarWidth || 236) + 'px';
  var resizing = s.sidebarResizing ? ' is-resizing' : '';
  return '<aside class="gti-sidebar' + resizing + '" style="width:' + widthPx + ';" data-sidebar="1">' + html + '</aside>';
};

/* ==========================================================================
   Visão Geral
   ========================================================================== */

App._buildOverview = function () {
  var s = App.state;
  var scopeField = App.editableField('overview:scope', s.overview.scope, {
    viewTextStyle: 'line-height:1.6;', emptyLabel: 'Descreva o objetivo e o escopo desta tarefa...'
  });
  var archField = App.editableField('overview:architecture', s.overview.architecture, {
    viewTextStyle: 'line-height:1.6;', emptyLabel: 'Descreva a arquitetura da solução, componentes envolvidos...'
  });
  var decisions = App.simpleListVals(['overview', 'decisions'], 'ov_decisions');
  var apis = App.twoFieldListVals(['overview', 'apis'], 'ov_apis');

  var planoFasesRows = s.tabs.map(function (tab) {
    var ti = App.tabItems(tab);
    var done = ti.filter(function (i) { return i.status === 'done'; }).length;
    var pct = ti.length ? Math.round(done / ti.length * 100) : 0;
    return '<tr><td style="padding:8px 10px;">' + App._esc(tab.label) + '</td>' +
      '<td style="padding:8px 10px;text-align:center;">' + tab.sections.length + '</td>' +
      '<td style="padding:8px 10px;text-align:center;">' + ti.length + '</td>' +
      '<td style="padding:8px 10px;text-align:right;font-weight:600;color:var(--brand-primary);">' + pct + '%</td></tr>';
  }).join('');

  return '' +
    '<h1 class="gti-page-title">Visão Geral</h1>' +
    '<div style="margin-bottom:var(--gap-section);">' +
      '<h2 style="font-size:var(--text-16);font-weight:var(--weight-semibold);margin-bottom:8px;">Escopo</h2>' +
      App._field(scopeField, function (v) { App.updateSilent(function (next) { next.overview.scope = v; }); }, { tag: 'textarea', rows: 4 }) +
    '</div>' +
    '<div style="margin-bottom:var(--gap-section);">' +
      '<h2 style="font-size:var(--text-16);font-weight:var(--weight-semibold);margin-bottom:8px;">Arquitetura</h2>' +
      App._field(archField, function (v) { App.updateSilent(function (next) { next.overview.architecture = v; }); }, { tag: 'textarea', rows: 4 }) +
    '</div>' +
    '<div style="margin-bottom:var(--gap-section);">' +
      '<h2 style="font-size:var(--text-16);font-weight:var(--weight-semibold);margin-bottom:8px;">Decisões</h2>' +
      App._buildSimpleList(decisions, 'Registrar decisão...') +
    '</div>' +
    '<div style="margin-bottom:var(--gap-section);">' +
      '<h2 style="font-size:var(--text-16);font-weight:var(--weight-semibold);margin-bottom:8px;">APIs / Repositórios relacionados</h2>' +
      App._buildTwoFieldList(apis) +
    '</div>' +
    (s.tabs.length ? (
      '<div>' +
        '<h2 style="font-size:var(--text-16);font-weight:var(--weight-semibold);margin-bottom:8px;">Plano resumido em fases</h2>' +
        '<table style="width:100%;border-collapse:collapse;font-size:var(--text-13);background:var(--gti-surface);border:1px solid var(--gti-border);border-radius:var(--radius-input);overflow:hidden;">' +
          '<thead><tr style="background:var(--gti-surface2);text-align:left;">' +
            '<th style="padding:8px 10px;">Fase</th><th style="padding:8px 10px;">Etapas</th>' +
            '<th style="padding:8px 10px;">Itens</th><th style="padding:8px 10px;text-align:right;">Progresso</th></tr></thead>' +
          '<tbody>' + planoFasesRows + '</tbody>' +
        '</table>' +
      '</div>'
    ) : '');
};

/* ---------- Listas genéricas: renderização ---------- */

App._buildSimpleList = function (listVals, placeholder) {
  var rows = listVals.items.map(function (it) {
    var hDel = App._reg(it.onDelete);
    return '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;">' +
      '<div style="flex:1;">' + App._field(it.field, it.onTextChange, { tag: 'textarea', rows: 1, autoGrowRows: true }) + '</div>' +
      '<button class="gti-item-delete" data-h="' + hDel + '">×</button></div>';
  }).join('');
  var hChange = App._reg(function (v) { listVals.onDraftChange(v); });
  var hAdd = App._reg(function () { listVals.onAdd(); });
  return rows +
    '<div style="display:flex;gap:8px;margin-top:8px;">' +
    '<input class="gti-draft-input" type="text" data-focus-key="listdraft:' + listVals.draftKey + '" value="' + App._esc(listVals.draft) + '" placeholder="' + App._esc(placeholder) + '" data-hi="' + hChange + '">' +
    '<button class="btn btn-secondary btn-sm" data-h="' + hAdd + '">+ Adicionar</button></div>';
};

App._buildTwoFieldList = function (listVals) {
  var rows = listVals.items.map(function (it) {
    var hDel = App._reg(it.onDelete);
    return '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;">' +
      '<div style="flex:1;">' + App._field(it.labelField, it.onLabelChange, {}) + '</div>' +
      '<div style="flex:2;">' + App._field(it.urlField, it.onUrlChange, {}) + '</div>' +
      '<button class="gti-item-delete" data-h="' + hDel + '">×</button></div>';
  }).join('');
  var hLabel = App._reg(function (v) { listVals.onDraftLabelChange(v); });
  var hUrl = App._reg(function (v) { listVals.onDraftUrlChange(v); });
  var hAdd = App._reg(function () { listVals.onAdd(); });
  return rows +
    '<div style="display:flex;gap:8px;margin-top:8px;">' +
    '<input class="gti-draft-input" style="flex:1;" type="text" data-focus-key="listdraft:' + listVals.draftKey + ':label" value="' + App._esc(listVals.draftLabel) + '" placeholder="Nome..." data-hi="' + hLabel + '">' +
    '<input class="gti-draft-input" style="flex:2;" type="text" data-focus-key="listdraft:' + listVals.draftKey + ':url" value="' + App._esc(listVals.draftUrl) + '" placeholder="URL / referência..." data-hi="' + hUrl + '">' +
    '<button class="btn btn-secondary btn-sm" data-h="' + hAdd + '">+ Adicionar</button></div>';
};

/* ==========================================================================
   Resumo Executivo
   ========================================================================== */

App._buildResumo = function () {
  var s = App.state;
  var nextSteps = App.simpleListVals(['resumo', 'nextSteps'], 'resumo_next');
  var repos = App.twoFieldListVals(['resumo', 'repos'], 'resumo_repos');

  var feito = [], pendente = [];
  s.tabs.forEach(function (tab) {
    tab.sections.forEach(function (sec) {
      sec.items.forEach(function (item) {
        if (item.status === 'done') feito.push({ text: item.text, tabLabel: tab.label });
        else pendente.push({ text: item.text, tabLabel: tab.label, blocked: item.status === 'blocked' });
      });
    });
  });

  var hDate = App._reg(function (v) { App.update(function (next) { next.resumo.statusDate = v; }); });

  return '' +
    '<h1 class="gti-page-title">Resumo Executivo</h1>' +
    '<div style="margin-bottom:var(--gap-section);display:flex;align-items:center;gap:10px;">' +
      '<label style="font-size:var(--text-12);color:var(--gti-text3);">Data de referência</label>' +
      '<input class="gti-inline-input" type="date" data-focus-key="resumo:statusDate" value="' + App._esc(s.resumo.statusDate) + '" data-hi="' + hDate + '">' +
    '</div>' +
    '<div class="gti-kpi-grid">' +
      App._kpiCard('Concluído', feito.length + ' tarefas', '', 'success') +
      App._kpiCard('Pendente', pendente.length + ' tarefas', '', pendente.some(function (p) { return p.blocked; }) ? 'error' : '') +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--gap-card-lg);margin-bottom:var(--gap-section);">' +
      '<div><h2 style="font-size:var(--text-16);font-weight:var(--weight-semibold);margin-bottom:8px;">O que já foi feito</h2>' +
        (feito.length ? feito.map(function (f) {
          return '<div style="padding:6px 0;border-bottom:1px solid var(--gti-border);font-size:var(--text-13);">✓ ' + App._esc(f.text) +
            ' <span style="color:var(--gti-text3);font-size:var(--text-12);">(' + App._esc(f.tabLabel) + ')</span></div>';
        }).join('') : '<div style="color:var(--gti-text3);font-size:var(--text-13);">Nada concluído ainda.</div>') +
      '</div>' +
      '<div><h2 style="font-size:var(--text-16);font-weight:var(--weight-semibold);margin-bottom:8px;">Pendente</h2>' +
        (pendente.length ? pendente.map(function (p) {
          return '<div style="padding:6px 0;border-bottom:1px solid var(--gti-border);font-size:var(--text-13);">' + (p.blocked ? '⚠ ' : '○ ') + App._esc(p.text) +
            ' <span style="color:var(--gti-text3);font-size:var(--text-12);">(' + App._esc(p.tabLabel) + ')</span></div>';
        }).join('') : '<div style="color:var(--gti-text3);font-size:var(--text-13);">Nada pendente — tudo concluído.</div>') +
      '</div>' +
    '</div>' +
    '<div style="margin-bottom:var(--gap-section);">' +
      '<h2 style="font-size:var(--text-16);font-weight:var(--weight-semibold);margin-bottom:8px;">Próximos passos</h2>' +
      App._buildSimpleList(nextSteps, 'Adicionar próximo passo...') +
    '</div>' +
    '<div>' +
      '<h2 style="font-size:var(--text-16);font-weight:var(--weight-semibold);margin-bottom:8px;">Repositórios</h2>' +
      App._buildTwoFieldList(repos) +
    '</div>';
};

App._kpiCard = function (label, value, hint, variant) {
  return '<div class="kpi-card' + (variant ? ' variant-' + variant : '') + '">' +
    '<div class="kpi-card-label">' + App._esc(label) + '</div>' +
    '<div class="kpi-card-value">' + App._esc(value) + '</div>' +
    (hint ? '<div class="kpi-card-hint">' + App._esc(hint) + '</div>' : '') +
    '</div>';
};

/* ==========================================================================
   Fase dinâmica (a view mais densa)
   ========================================================================== */

App._buildFaseView = function (tab) {
  var s = App.state;
  var totalMin = tab.sections.reduce(function (sum, sec) { return sum + App.parseMinutes(sec.estimate); }, 0);
  var totalActualMin = tab.sections.reduce(function (sum, sec) { return sum + App.parseMinutes(sec.actual); }, 0);
  var tabLate = App.tabLateness(tab.sections);
  var maxImpact = App.maxImpact(tab.sections);

  var badges = '' +
    '<span class="tag tag-neutral">Estimado: ' + App.formatMinutes(totalMin) + '</span>' +
    '<span class="tag tag-neutral">Real: ' + App.formatMinutes(totalActualMin) + '</span>' +
    '<span class="tag tag-' + App.IMPACT_VARIANT[maxImpact] + '">Impacto geral: ' + App.IMPACT_LABEL[maxImpact] + '</span>' +
    (tabLate.hasLate ? ('<span class="tag tag-' + (tabLate.isLate ? 'error' : 'success') + '">' + (tabLate.isLate ? '⚠ Atrasado' : '✓ No prazo') + '</span>') : '');

  var sectionsHtml = tab.sections.map(function (sec, si) {
    return App._buildSection(tab, sec, si);
  }).join('');

  var hMoveNote = ''; // reservado — sem reordenar fases (fora de escopo, ver decisão registrada)

  return '' +
    '<h1 class="gti-page-title">' + App._esc(tab.label) + '</h1>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:var(--gap-section);">' + badges + '</div>' +
    sectionsHtml +
    App._buildAddSection(tab);
};

App._buildAddSection = function (tab) {
  var hAdd = App._reg(function () {
    App.update(function (next) {
      var t = App.findTab(next, tab.id);
      t.sections.push({ id: App.uid(), title: 'Nova etapa', subtitle: '', estimate: '', actual: '', impact: 'baixo', items: [] });
    });
  });
  return '<button class="btn btn-secondary" data-h="' + hAdd + '" style="margin-top:8px;">+ Nova etapa</button>';
};

App._buildSection = function (tab, sec, idx) {
  var markerState = App.sectionMarkerState(sec.items);
  var lateness = App.lateness(sec.estimate, sec.actual);

  var titleField = App.editableField('sec:' + sec.id + ':title', sec.title, {
    viewTextStyle: 'font-size:var(--text-16);font-weight:var(--weight-bold);color:var(--gti-text);', emptyLabel: 'Título da etapa...'
  });
  var subtitleField = App.editableField('sec:' + sec.id + ':subtitle', sec.subtitle || '', {
    viewTextStyle: 'font-size:var(--text-13);color:var(--gti-text3);', emptyLabel: 'Descrição opcional...'
  });

  var hTitle = function (v) { App.updateSilent(function (next) { App.findSec(next, tab.id, sec.id).title = v; }); };
  var hSubtitle = function (v) { App.updateSilent(function (next) { App.findSec(next, tab.id, sec.id).subtitle = v; }); };

  var hEstimate = App._reg(function (v) { App.update(function (next) { App.findSec(next, tab.id, sec.id).estimate = v; }); });
  var hActual = App._reg(function (v) { App.update(function (next) { App.findSec(next, tab.id, sec.id).actual = v; }); });

  var impactBadges = App.IMPACTS.map(function (imp) {
    var sel = sec.impact === imp;
    var hSel = App._reg(function () { App.update(function (next) { App.findSec(next, tab.id, sec.id).impact = imp; }); });
    return '<span class="tag' + (sel ? ' tag-selected' : '') + '" data-h="' + hSel + '" style="cursor:pointer;">' + App.IMPACT_LABEL[imp] + '</span>';
  }).join(' ');

  var lateBadge = lateness.hasLate ?
    ('<span class="tag tag-' + (lateness.isLate ? 'error' : 'success') + '">' + (lateness.isLate ? '⚠ Atrasado' : '✓ No prazo') + '</span>') : '';

  var hDeleteSec = App._reg(function () {
    // Container: pergunta sempre, dizendo quantos itens vão junto (ver logic.js).
    var cascata = sec.items.length ? '\n\nVão junto ' + App.plural(sec.items.length, 'item', 'itens') + '.' : '';
    if (!App.confirmDelete('Excluir a etapa "' + (sec.title || '(sem título)') + '"?' + cascata)) return;
    App.update(function (next) { var t = App.findTab(next, tab.id); t.sections = t.sections.filter(function (x) { return x.id !== sec.id; }); });
  });
  var hMoveUp = App._reg(function () {
    App.update(function (next) {
      var t = App.findTab(next, tab.id); var i = t.sections.findIndex(function (x) { return x.id === sec.id; });
      if (i > 0) { var tmp = t.sections[i]; t.sections[i] = t.sections[i - 1]; t.sections[i - 1] = tmp; }
    });
  });
  var hMoveDown = App._reg(function () {
    App.update(function (next) {
      var t = App.findTab(next, tab.id); var i = t.sections.findIndex(function (x) { return x.id === sec.id; });
      if (i < t.sections.length - 1) { var tmp = t.sections[i]; t.sections[i] = t.sections[i + 1]; t.sections[i + 1] = tmp; }
    });
  });

  var itemsHtml = sec.items.map(function (item) { return App._buildItem(tab, sec, item); }).join('');
  var hAddItem = App._reg(function () {
    var text = (App.state.itemDrafts[sec.id] || '').trim();
    if (!text) return;
    App.update(function (next) {
      App.findSec(next, tab.id, sec.id).items.push({ id: App.uid(), text: text, meta: '', status: 'pending' });
      next.itemDrafts[sec.id] = '';
    });
  });
  var hDraftChange = App._reg(function (v) {
    App.setState({ itemDrafts: Object.assign({}, App.state.itemDrafts, { }, (function () { var o = {}; o[sec.id] = v; return o; })()) });
  });

  return '' +
    '<div class="kpi-card" style="margin-bottom:14px;display:block;">' +
      '<div style="display:flex;gap:14px;align-items:flex-start;">' +
        '<div class="gti-marker state-' + markerState + '">' + (markerState === 'done' ? '✓' : (markerState === 'blocked' ? '!' : String(idx + 1))) + '</div>' +
        '<div style="flex:1;min-width:0;">' +
          App._field(titleField, hTitle, {}) +
          App._field(subtitleField, hSubtitle, { tag: 'textarea', rows: 1, autoGrowRows: true }) +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0;">' + impactBadges + lateBadge + '</div>' +
          '<div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;">' +
            '<label style="font-size:var(--text-12);color:var(--gti-text3);display:flex;align-items:center;gap:6px;">Estimado ' +
              App._alwaysInput('sec:' + sec.id + ':estimate', sec.estimate || '', function (v) { App._h[hEstimate](v); }, { placeholder: 'ex: 1h 30min' }) + '</label>' +
            '<label style="font-size:var(--text-12);color:var(--gti-text3);display:flex;align-items:center;gap:6px;">Real ' +
              App._alwaysInput('sec:' + sec.id + ':actual', sec.actual || '', function (v) { App._h[hActual](v); }, { placeholder: 'ex: 2h' }) + '</label>' +
          '</div>' +
          itemsHtml +
          App._alwaysDraftRow('sec:' + sec.id + ':draft', (App.state.itemDrafts[sec.id] || ''), function (v) { App._h[hDraftChange](v); }, function () { App._h[hAddItem](); }, { placeholder: 'Adicionar item...' }) +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:4px;">' +
          '<button class="btn-ghost btn-sm" style="border:none;" data-h="' + hMoveUp + '" title="Mover para cima">↑</button>' +
          '<button class="btn-ghost btn-sm" style="border:none;" data-h="' + hMoveDown + '" title="Mover para baixo">↓</button>' +
          '<button class="btn-ghost btn-sm" style="border:none;color:var(--feedback-error);" data-h="' + hDeleteSec + '" title="Excluir etapa">×</button>' +
        '</div>' +
      '</div>' +
    '</div>';
};

App._buildItem = function (tab, sec, item) {
  var isDone = item.status === 'done', isBlocked = item.status === 'blocked';
  var textField = App.editableField('item:' + item.id + ':text', item.text, {
    viewTextStyle: 'font-size:var(--text-14);padding:1px 0;' + (isDone ? 'color:var(--gti-text3);text-decoration:line-through;' : 'color:var(--gti-text);'),
    emptyLabel: 'Descreva o item...'
  });
  var metaField = App.editableField('item:' + item.id + ':meta', item.meta || '', {
    viewTextStyle: 'font-size:var(--text-12);color:var(--gti-text3);',
    emptyLabel: isBlocked ? 'Motivo do bloqueio...' : 'Observação (opcional)'
  });

  var hText = function (v) { App.updateSilent(function (next) { App.findSec(next, tab.id, sec.id).items.find(function (x) { return x.id === item.id; }).text = v; }); };
  var hMeta = function (v) { App.updateSilent(function (next) { App.findSec(next, tab.id, sec.id).items.find(function (x) { return x.id === item.id; }).meta = v; }); };

  var hToggleDone = App._reg(function () {
    App.update(function (next) {
      var it = App.findSec(next, tab.id, sec.id).items.find(function (x) { return x.id === item.id; });
      it.status = it.status === 'done' ? 'pending' : 'done';
    });
  });
  var hToggleBlocked = App._reg(function () {
    App.update(function (next) {
      var it = App.findSec(next, tab.id, sec.id).items.find(function (x) { return x.id === item.id; });
      it.status = it.status === 'blocked' ? 'pending' : 'blocked';
    });
  });
  var hDelete = App._reg(function () {
    if (!App.confirmDeleteEntrada(item.text, 'o item')) return;
    App.update(function (next) {
      var sc = App.findSec(next, tab.id, sec.id);
      sc.items = sc.items.filter(function (x) { return x.id !== item.id; });
    });
  });

  var checkGlyph = isDone ? '✓' : (isBlocked ? '!' : '');

  return '<div class="gti-item-row' + (isDone ? ' is-done' : '') + (isBlocked ? ' is-blocked' : '') + '">' +
    '<button class="gti-checkbox' + (isDone ? ' is-done' : '') + (isBlocked ? ' is-blocked' : '') + '" data-h="' + hToggleDone + '">' + checkGlyph + '</button>' +
    '<div style="flex:1;min-width:0;">' +
      App._field(textField, hText, { tag: 'textarea', rows: 1, autoGrowRows: true }) +
      App._field(metaField, hMeta, {}) +
    '</div>' +
    '<button class="gti-block-btn' + (isBlocked ? ' is-active' : '') + '" data-h="' + hToggleBlocked + '">Bloqueio</button>' +
    '<button class="gti-item-delete" data-h="' + hDelete + '">×</button>' +
    '</div>';
};

/* ==========================================================================
   Testes & Riscos
   ========================================================================== */

App._buildTestes = function () {
  var s = App.state;
  var errorsList = App.simpleListVals(['testes', 'errors'], 'testes_errors');
  var improvements = App.simpleListVals(['testes', 'improvements'], 'testes_improvements');

  var testOpts = [{ v: 'pending', label: 'Pendente' }, { v: 'pass', label: 'Passou' }, { v: 'fail', label: 'Falhou' }];
  var testsHtml = s.testes.tests.map(function (it) {
    var field = App.editableField('tests:' + it.id, it.text, { emptyLabel: 'Descreva o teste...' });
    var hText = function (v) { App.updateSilent(function (next) { next.testes.tests.find(function (x) { return x.id === it.id; }).text = v; }); };
    var hDel = App._reg(function () {
      if (!App.confirmDeleteEntrada(it.text, 'o teste')) return;
      App.update(function (next) { next.testes.tests = next.testes.tests.filter(function (x) { return x.id !== it.id; }); });
    });
    var statusBadges = testOpts.map(function (o) {
      var sel = it.status === o.v;
      var col = o.v === 'pass' ? 'success' : (o.v === 'fail' ? 'error' : 'neutral');
      var hSel = App._reg(function () { App.update(function (next) { next.testes.tests.find(function (x) { return x.id === it.id; }).status = o.v; }); });
      return '<span class="tag' + (sel ? (' tag-' + col) : '') + '" data-h="' + hSel + '" style="cursor:pointer;">' + o.label + '</span>';
    }).join(' ');
    var hDelWrap = hDel;
    return '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;padding:8px;border:1px solid var(--gti-border);border-radius:var(--radius-input);">' +
      '<div style="flex:1;">' + App._field(field, hText, { tag: 'textarea', rows: 1, autoGrowRows: true }) + '<div style="margin-top:6px;display:flex;gap:6px;">' + statusBadges + '</div></div>' +
      '<button class="gti-item-delete" data-h="' + hDelWrap + '">×</button></div>';
  }).join('');
  var hTestDraft = App._reg(function (v) { App.setState({ listDrafts: Object.assign({}, s.listDrafts || {}, { testes_tests: v }) }); });
  var hTestAdd = App._reg(function () {
    var text = ((s.listDrafts || {}).testes_tests || '').trim();
    if (!text) return;
    App.update(function (next) {
      next.testes.tests.push({ id: App.uid(), text: text, status: 'pending' });
      next.listDrafts = next.listDrafts || {}; next.listDrafts.testes_tests = '';
    });
  });

  var risksHtml = s.testes.risks.map(function (it) {
    var field = App.editableField('risks:' + it.id, it.text, { emptyLabel: 'Descreva o risco...' });
    var hText = function (v) { App.updateSilent(function (next) { next.testes.risks.find(function (x) { return x.id === it.id; }).text = v; }); };
    var hDel = App._reg(function () {
      if (!App.confirmDeleteEntrada(it.text, 'o risco')) return;
      App.update(function (next) { next.testes.risks = next.testes.risks.filter(function (x) { return x.id !== it.id; }); });
    });
    var sevBadges = App.IMPACTS.map(function (sev) {
      var sel = it.severity === sev;
      var hSel = App._reg(function () { App.update(function (next) { next.testes.risks.find(function (x) { return x.id === it.id; }).severity = sev; }); });
      return '<span class="tag' + (sel ? ' tag-selected' : '') + '" data-h="' + hSel + '" style="cursor:pointer;">' + App.IMPACT_LABEL[sev] + '</span>';
    }).join(' ');
    return '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;padding:8px;border:1px solid var(--gti-border);border-radius:var(--radius-input);">' +
      '<div style="flex:1;">' + App._field(field, hText, { tag: 'textarea', rows: 1, autoGrowRows: true }) + '<div style="margin-top:6px;display:flex;gap:6px;">' + sevBadges + '</div></div>' +
      '<button class="gti-item-delete" data-h="' + hDel + '">×</button></div>';
  }).join('');
  var hRiskDraft = App._reg(function (v) { App.setState({ listDrafts: Object.assign({}, s.listDrafts || {}, { testes_risks: v }) }); });
  var hRiskAdd = App._reg(function () {
    var text = ((s.listDrafts || {}).testes_risks || '').trim();
    if (!text) return;
    App.update(function (next) {
      next.testes.risks.push({ id: App.uid(), text: text, severity: 'medio' });
      next.listDrafts = next.listDrafts || {}; next.listDrafts.testes_risks = '';
    });
  });

  var hExportMd = App._reg(function () { App.onExportTestesMd(); });

  return '' +
    '<h1 class="gti-page-title">Testes &amp; Riscos</h1>' +
    '<button class="btn btn-secondary btn-sm" data-h="' + hExportMd + '" style="margin-bottom:var(--gap-section);">Exportar Markdown</button>' +
    '<div style="margin-bottom:var(--gap-section);">' +
      '<h2 style="font-size:var(--text-16);font-weight:var(--weight-semibold);margin-bottom:8px;">Testes</h2>' +
      testsHtml +
      App._alwaysDraftRow('testes:draft', (s.listDrafts || {}).testes_tests || '', function (v) { App._h[hTestDraft](v); }, function () { App._h[hTestAdd](); }, { placeholder: 'Descreva o teste...' }) +
    '</div>' +
    '<div style="margin-bottom:var(--gap-section);">' +
      '<h2 style="font-size:var(--text-16);font-weight:var(--weight-semibold);margin-bottom:8px;">Erros</h2>' +
      App._buildSimpleList(errorsList, 'Registrar erro...') +
    '</div>' +
    '<div style="margin-bottom:var(--gap-section);">' +
      '<h2 style="font-size:var(--text-16);font-weight:var(--weight-semibold);margin-bottom:8px;">Riscos</h2>' +
      risksHtml +
      App._alwaysDraftRow('risks:draft', (s.listDrafts || {}).testes_risks || '', function (v) { App._h[hRiskDraft](v); }, function () { App._h[hRiskAdd](); }, { placeholder: 'Descreva o risco...' }) +
    '</div>' +
    '<div>' +
      '<h2 style="font-size:var(--text-16);font-weight:var(--weight-semibold);margin-bottom:8px;">Sugestões de melhorias futuras</h2>' +
      App._buildSimpleList(improvements, 'Registrar sugestão...') +
    '</div>';
};

/* ==========================================================================
   Progresso & Relatório
   ========================================================================== */

App._buildProgress = function () {
  var s = App.state;

  var hToggleForm = App._reg(function () { App.setState({ annFormOpen: !s.annFormOpen }); });

  var formHtml = '';
  if (s.annFormOpen) {
    var hType = App._reg(function (v) { App.setState({ annDraft: Object.assign({}, s.annDraft, { type: v }) }); });
    var hTitle = App._reg(function (v) { App.setState({ annDraft: Object.assign({}, s.annDraft, { title: v }) }); });
    var hText = App._reg(function (v) { App.setState({ annDraft: Object.assign({}, s.annDraft, { text: v }) }); });
    var hSave = App._reg(function () {
      var title = (s.annDraft.title || '').trim();
      var text = (s.annDraft.text || '').trim();
      // Basta um dos dois. Exigir título E descrição atrapalha o registro
      // rápido no meio da execução, que é quando a anotação costuma nascer.
      if (!title && !text) return;
      App.update(function (next) {
        next.annotations.push({ id: App.uid(), type: s.annDraft.type, title: title, text: text, ts: App.ts() });
      });
      App.setState({ annFormOpen: false, annDraft: { type: 'nota', title: '', text: '' } });
    });
    var typeOptions = Object.keys(App.ANN_TYPES).map(function (t) {
      return '<option value="' + t + '"' + (s.annDraft.type === t ? ' selected' : '') + '>' + App.ANN_TYPES[t].label + '</option>';
    }).join('');
    formHtml = '<div class="callout" style="margin-bottom:12px;">' +
      '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
        '<select class="gti-inline-input" style="flex:0 0 132px;" data-focus-key="ann:type" data-hc="' + hType + '">' + typeOptions + '</select>' +
        '<input class="gti-inline-input" style="flex:1;min-width:0;" type="text" data-focus-key="ann:title" placeholder="Título da anotação..." value="' + App._esc(s.annDraft.title) + '" data-hi="' + hTitle + '">' +
      '</div>' +
      '<textarea class="gti-draft-input" style="width:100%;box-sizing:border-box;" rows="3" data-focus-key="ann:text" placeholder="Descrição..." data-hi="' + hText + '">' + App._esc(s.annDraft.text) + '</textarea>' +
      '<button class="btn btn-primary btn-sm" data-h="' + hSave + '" style="margin-top:8px;">Salvar anotação</button>' +
    '</div>';
  }

  var annotationsHtml = s.annotations.slice().reverse().map(function (ann) {
    var meta = App.ANN_TYPES[ann.type] || App.ANN_TYPES.nota;
    var hDel = App._reg(function () {
      // Anotação pergunta sempre, mesmo vazia: é registro histórico, não
      // editável, e não dá para recriar o que ela dizia (ver logic.js).
      if (!App.confirmDelete('Excluir esta anotação de ' + ann.ts + '?')) return;
      App.update(function (next) { next.annotations = next.annotations.filter(function (x) { return x.id !== ann.id; }); });
    });
    var tituloHtml = ann.title ? '<div style="font-size:var(--text-14);font-weight:var(--weight-semibold);margin-bottom:3px;">' + App._esc(ann.title) + '</div>' : '';
    var textoHtml = ann.text ? '<div style="font-size:var(--text-13);white-space:pre-wrap;">' + App._esc(ann.text) + '</div>' : '';
    return '<div class="callout callout-' + meta.variant + '" style="margin-bottom:8px;display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">' +
      '<div><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:4px;opacity:0.8;">' +
        App._esc(meta.label + ' · ' + ann.ts) + '</div>' + tituloHtml + textoHtml + '</div>' +
      '<button class="gti-item-delete" data-h="' + hDel + '">×</button></div>';
  }).join('') || '<div style="color:var(--gti-text3);font-size:var(--text-13);">Nenhuma anotação registrada ainda.</div>';

  return '' +
    '<h1 class="gti-page-title">Progresso &amp; Relatório</h1>' +
    '<div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<h2 style="font-size:var(--text-16);font-weight:var(--weight-semibold);">Anotações</h2>' +
        '<button class="btn btn-secondary btn-sm" data-h="' + hToggleForm + '">' + (s.annFormOpen ? 'Fechar formulário' : '+ Nova anotação') + '</button>' +
      '</div>' +
      formHtml + annotationsHtml +
    '</div>';
};

/* ==========================================================================
   Relatório de impressão (dedicado — ver decisão registrada na conversa)
   ========================================================================== */

App._buildPrintReport = function () {
  var s = App.state;
  var items = App.allItems(s);
  var doneCount = items.filter(function (i) { return i.status === 'done'; }).length;
  var overallPct = items.length ? Math.round(doneCount / items.length * 100) : 0;
  var blocked = [];
  s.tabs.forEach(function (tab) { tab.sections.forEach(function (sec) { sec.items.forEach(function (item) { if (item.status === 'blocked') blocked.push({ text: item.text, tabLabel: tab.label }); }); }); });

  var blockedHtml = blocked.length ? (
    '<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:14px 16px;margin-bottom:24px;">' +
      '<div style="font-size:12px;font-weight:700;color:#b91c1c;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Bloqueios ativos (' + blocked.length + ')</div>' +
      blocked.map(function (b) { return '<div style="font-size:13px;color:#7f1d1d;padding:3px 0;">• ' + App._esc(b.text) + ' <span style="color:#991b1b;opacity:0.75;">(' + App._esc(b.tabLabel) + ')</span></div>'; }).join('') +
    '</div>'
  ) : '';

  var tabsHtml = s.tabs.map(function (tab) {
    var ti = App.tabItems(tab);
    var tDone = ti.filter(function (i) { return i.status === 'done'; }).length;
    var tPct = ti.length ? Math.round(tDone / ti.length * 100) : 0;
    var secHtml = tab.sections.map(function (sec) {
      var itemsHtml = sec.items.map(function (item) {
        var color = item.status === 'done' ? '#059669' : (item.status === 'blocked' ? '#d30000' : '#6b7280');
        var symbol = item.status === 'done' ? '✓' : (item.status === 'blocked' ? '✕' : '○');
        return '<div style="font-size:12.5px;padding:2px 0;color:' + color + ';">' + symbol + ' ' + App._esc(item.text) + '</div>';
      }).join('');
      return '<div style="padding:10px 16px;border-top:1px solid #f1f5f9;">' +
        '<div style="font-size:12.5px;font-weight:600;color:#475569;margin-bottom:6px;">' + App._esc(sec.title) + '</div>' + itemsHtml + '</div>';
    }).join('');
    return '<div style="border:1px solid #e2e8f0;border-radius:10px;margin-bottom:14px;overflow:hidden;">' +
      '<div style="display:flex;justify-content:space-between;padding:10px 16px;background:#f8fafc;">' +
        '<span style="font-weight:700;font-size:13px;color:#1e293b;">' + App._esc(tab.label) + '</span>' +
        '<span style="font-size:12px;font-weight:600;color:#1d3f80;">' + tPct + '%</span></div>' + secHtml + '</div>';
  }).join('');

  // Anotações em ordem cronológica (a tela mostra da mais recente para a mais
  // antiga; no relatório a leitura natural é do começo da tarefa para o fim).
  var annReportHtml = (s.annotations && s.annotations.length) ? (
    '<div style="margin-top:20px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:8px;">Anotações</div>' +
    s.annotations.map(function (ann) {
      var meta = App.ANN_TYPES[ann.type] || App.ANN_TYPES.nota;
      return '<div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin-bottom:8px;background:#f8fafc;">' +
        '<div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:700;margin-bottom:3px;">' +
          App._esc(meta.label) + ' · ' + App._esc(ann.ts) + '</div>' +
        (ann.title ? '<div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:3px;">' + App._esc(ann.title) + '</div>' : '') +
        (ann.text ? '<div style="font-size:12.5px;color:#475569;white-space:pre-wrap;">' + App._esc(ann.text) + '</div>' : '') +
      '</div>';
    }).join('') + '</div>'
  ) : '';

  var printDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return '<div class="gti-print-report">' +
    '<div style="border-bottom:3px solid #1d3f80;padding-bottom:14px;margin-bottom:20px;">' +
      '<div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;">Relatório de andamento</div>' +
      '<div style="font-size:22px;font-weight:800;color:#0f172a;">' + App._esc(s.title) + '</div>' +
      '<div style="font-size:12px;color:#6b7280;">' + App._esc(s.subtitle) + ' · Gerado em ' + printDate + '</div>' +
    '</div>' +
    '<div style="display:flex;gap:20px;margin-bottom:24px;">' +
      '<div style="font-size:36px;font-weight:800;color:#1d3f80;">' + overallPct + '%</div>' +
      '<div style="flex:1;"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Progresso geral · ' + doneCount + ' de ' + items.length + ' tarefas</div>' +
      '<div style="height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;"><div style="height:100%;width:' + overallPct + '%;background:#1d3f80;"></div></div></div>' +
    '</div>' +
    blockedHtml + tabsHtml + annReportHtml +
    '</div>';
};

/* ==========================================================================
   Montagem final + ponto de entrada
   ========================================================================== */

App._buildContent = function () {
  var s = App.state;
  if (s.activeTab === '__overview') return App._buildOverview();
  if (s.activeTab === '__resumo') return App._buildResumo();
  if (s.activeTab === '__testes') return App._buildTestes();
  if (s.activeTab === '__progress') return App._buildProgress();
  var tab = App.findTab(s, s.activeTab);
  if (tab) return App._buildFaseView(tab);
  return App._buildOverview(); // fallback defensivo — não deveria acontecer (loadState já normaliza activeTab)
};

App._buildShell = function () {
  return '<div class="gti-shell" data-gti-theme="' + App.state.theme + '">' +
    App._buildHeader() +
    '<div class="gti-body">' + App._buildSidebar() + '<div class="gti-content">' + App._buildContent() + '</div></div>' +
    '</div>' +
    App._buildPrintReport();
};

App._container = null;

App.render = function () {
  App._container = App._container || document.getElementById('app');
  var container = App._container;

  App.pruneEditingField(App.state);

  var preserved = App._preserveEditingNode(container);
  var captured = !preserved ? App._captureFocus(container) : null;

  App._h = {};
  App._hSeq = 0;

  container.innerHTML = App._buildShell();

  App._restoreEditingNode(container, preserved);
  App._restoreFocus(container, captured);
  // Nenhum dos dois mecanismos acima reclamou o foco: se há campo em modo
  // edição, ele acabou de nascer e precisa receber o cursor.
  if (!preserved && !captured) App._focusEditingField(container);
};

/* ==========================================================================
   Delegação de eventos — registrada uma única vez (ver app.js)
   ========================================================================== */

App.initEvents = function () {
  var container = document.getElementById('app');
  App._container = container;

  container.addEventListener('click', function (e) {
    var el = e.target.closest('[data-h]');
    if (el) { var fn = App._h[el.getAttribute('data-h')]; if (fn) fn(e); return; }
  });

  container.addEventListener('input', function (e) {
    var el = e.target.closest('[data-hi]');
    if (el) { var fn = App._h[el.getAttribute('data-hi')]; if (fn) fn(e.target.value, e); }
    // Auto-crescimento: recalcula rows direto no nó, sem passar por render()
    // (ver decisão registrada — o campo em edição não pode ser reconstruído).
    if (e.target.tagName === 'TEXTAREA' && e.target.getAttribute('data-autogrow') === '1') {
      e.target.rows = App.estimateRows(e.target.value);
    }
  });

  container.addEventListener('change', function (e) {
    var el = e.target.closest('[data-hc]');
    if (el) { var fn = App._h[el.getAttribute('data-hc')]; if (fn) fn(e.target.value, e); }
  });

  // focusout é o equivalente "delegável" de blur (blur não borbulha).
  container.addEventListener('focusout', function (e) {
    var el = e.target.closest('[data-hblur]');
    if (el) { var fn = App._h[el.getAttribute('data-hblur')]; if (fn) fn(e); }
  });

  // Redimensionar a sidebar por arraste — mutação direta de style.width
  // durante o movimento (sem render()); só commita no state no mouseup.
  container.addEventListener('mousedown', function (e) {
    if (!e.target.closest('[data-resize-handle]')) return;
    e.preventDefault();
    var sidebar = container.querySelector('[data-sidebar]');
    if (!sidebar) return;
    var startX = e.clientX;
    var startWidth = App.state.sidebarWidth || 236;
    sidebar.classList.add('is-resizing');
    function onMove(ev) {
      var next = Math.max(200, Math.min(420, startWidth + (ev.clientX - startX)));
      sidebar.style.width = next + 'px';
    }
    function onUp(ev) {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      var finalWidth = Math.max(200, Math.min(420, startWidth + (ev.clientX - startX)));
      App.setState({ sidebarWidth: finalWidth }); // único render(), reflete a largura final
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
};
