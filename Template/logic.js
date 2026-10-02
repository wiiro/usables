/* ==========================================================================
   Guia de Tarefas Interativo — logic.js
   Regras de negócio (ver business-rules.md) + as fábricas reaproveitáveis
   de campo editável e lista genérica. Tudo aqui é testável isoladamente no
   console do navegador, sem precisar do render.js.
   ========================================================================== */

App.IMPACTS = ['baixo', 'medio', 'alto'];
App.IMPACT_LABEL = { baixo: 'Baixo', medio: 'Médio', alto: 'Alto' };
App.IMPACT_VARIANT = { baixo: 'success', medio: 'warning', alto: 'error' };
// Categorias de anotação. A ordem aqui é a ordem do dropdown.
// variant mapeia para .callout-<variant> no styles.css — só info, warning e
// error têm estilo próprio; os demais caem no .callout neutro de propósito.
App.ANN_TYPES = {
  nota:    { label: 'Nota',     variant: 'info' },
  decisao: { label: 'Decisão',  variant: 'neutral' },
  bloqueio:{ label: 'Bloqueio', variant: 'error' },
  insight: { label: 'Insight',  variant: 'success' },
  bug:     { label: 'Bug',      variant: 'warning' }
};
App.TAB_DOTS = {
  blue: 'var(--dot-blue)', violet: 'var(--dot-violet)', teal: 'var(--dot-teal)',
  emerald: 'var(--dot-emerald)', amber: 'var(--dot-amber)', red: 'var(--dot-red)', gray: 'var(--dot-gray)'
};
App.TAB_ORDER = ['blue', 'violet', 'teal', 'emerald', 'amber', 'red', 'gray'];

/* ---------- Navegação: localizar fase/etapa por id ---------- */

App.findTab = function (s, id) {
  return s.tabs.find(function (t) { return t.id === id; });
};
App.findSec = function (s, tabId, secId) {
  var t = App.findTab(s, tabId);
  return t ? t.sections.find(function (x) { return x.id === secId; }) : null;
};

/* ---------- Tempo (estimate/actual são texto livre — ver business-rules.md) ---------- */

App.parseMinutes = function (str) {
  if (!str) return 0;
  var h = /([0-9]+)\s*h/i.exec(str);
  var m = /([0-9]+)\s*m/i.exec(str);
  var total = (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
  if (!h && !m) { var n = /^([0-9]+)$/.exec(str.trim()); if (n) total = parseInt(n[1], 10); }
  return total;
};

App.formatMinutes = function (total) {
  if (!total) return '—';
  var h = Math.floor(total / 60), m = total % 60;
  return (h ? h + 'h ' : '') + (m ? m + 'min' : (h ? '' : '0min'));
};

// Uma etapa (ou fase inteira, somando as etapas) só é "com prazo definido" quando
// ambos estimate/actual estão preenchidos — nunca alerta de atraso antes do tempo
// real ser preenchido (decisão deliberada, ver business-rules.md).
App.lateness = function (estimateStr, actualStr) {
  var est = App.parseMinutes(estimateStr), act = App.parseMinutes(actualStr);
  var hasLate = !!(estimateStr && actualStr && (est > 0 || act > 0));
  var isLate = hasLate && act > est;
  return { hasLate: hasLate, isLate: isLate, estMin: est, actMin: act };
};

// Atraso agregado por FASE — diferente do cálculo por etapa (App.lateness):
// soma os minutos de todas as etapas primeiro, depois compara os totais direto,
// sem checar as strings originais de estimate/actual (só os minutos somados).
App.tabLateness = function (sections) {
  var totalMin = sections.reduce(function (sum, sec) { return sum + App.parseMinutes(sec.estimate); }, 0);
  var totalActualMin = sections.reduce(function (sum, sec) { return sum + App.parseMinutes(sec.actual); }, 0);
  var hasLate = totalMin > 0 && totalActualMin > 0;
  var isLate = hasLate && totalActualMin > totalMin;
  return { hasLate: hasLate, isLate: isLate, totalMin: totalMin, totalActualMin: totalActualMin };
};

// Impacto da fase = o MAIOR valor entre as etapas, não uma média.
App.maxImpact = function (sections) {
  var rank = { baixo: 0, medio: 1, alto: 2 };
  var max = 'baixo';
  sections.forEach(function (sec) {
    if (sec.impact && rank[sec.impact] > rank[max]) max = sec.impact;
  });
  return max;
};

/* ---------- Itens / marcador de progresso da etapa ---------- */

App.allItems = function (state) {
  var arr = [];
  state.tabs.forEach(function (t) { t.sections.forEach(function (s) { s.items.forEach(function (i) { arr.push(i); }); }); });
  return arr;
};
App.tabItems = function (tab) {
  var arr = [];
  tab.sections.forEach(function (s) { s.items.forEach(function (i) { arr.push(i); }); });
  return arr;
};

// Bloqueio de qualquer item sempre vence no marcador da etapa — ver business-rules.md.
App.sectionMarkerState = function (items) {
  if (!items.length) return 'pending';
  if (items.some(function (i) { return i.status === 'blocked'; })) return 'blocked';
  if (items.every(function (i) { return i.status === 'done'; })) return 'done';
  if (items.some(function (i) { return i.status === 'done'; })) return 'active';
  return 'pending';
};

/* ==========================================================================
   Exclusão destrutiva — confirmação

   Não existe desfazer neste documento: App.update persiste no localStorage na
   mesma chamada que muta o estado. Por isso toda exclusão que leva CONTEÚDO
   junto passa por uma pergunta.

   A regra (ver business-rules.md, "Exclusão"): containers (fase, etapa)
   sempre perguntam, porque arrastam tudo que está dentro; folhas (item,
   teste, risco, linha de lista) perguntam só quando têm texto. Perguntar
   também na linha vazia treinaria o usuário a clicar "OK" sem ler — que é o
   oposto da proteção. Anotação pergunta sempre: é registro histórico, não
   editável, e não dá para recriar o que ela dizia.
   ========================================================================== */

App.confirmDelete = function (pergunta) {
  if (typeof window === 'undefined' || typeof window.confirm !== 'function') return true;
  return window.confirm(pergunta + '\n\nNão há como desfazer.');
};

// "1 item" / "3 itens" — usado nas mensagens de cascata.
App.plural = function (n, singular, plural) {
  return n + ' ' + (n === 1 ? singular : plural);
};

// Trecho curto do texto, para a pergunta não virar um parágrafo.
App.trechoCurto = function (texto, limite) {
  var t = (texto || '').trim().replace(/\s+/g, ' ');
  limite = limite || 60;
  return t.length > limite ? t.slice(0, limite) + '…' : t;
};

// Folhas: só pergunta se houver texto. Devolve true quando pode excluir.
App.confirmDeleteEntrada = function (texto, rotulo) {
  var t = (texto || '').trim();
  if (!t) return true;
  return App.confirmDelete('Excluir ' + rotulo + ' "' + App.trechoCurto(t) + '"?');
};

/* ---------- Heurística de auto-crescimento de textarea ---------- */
// Ver business-rules.md — nunca existiu no código original (item de checklist era
// <input> linha única); implementado agora seguindo a fórmula já documentada.
App.estimateRows = function (text) {
  return Math.max(1, Math.min(8, Math.ceil((text || '').length / 55)));
};

/* ==========================================================================
   Campo editável — padrão "lápis" (view ↔ edit)

   state.editingField guarda a key do único campo em modo edição no documento
   inteiro. key precisa ser única (ex: 'sec:'+sec.id+':title').

   IMPORTANTE sobre re-render: enquanto um campo está em modo edição, o
   onChange dele deve chamar App.updateSilent/App.setStateSilent (não
   App.update/App.setState) — isso evita reconstruir o nó do <input>/<textarea>
   a cada tecla, o que disparia um blur real e fecharia o modo de edição
   sozinho (ver decisão registrada na conversa: onStopEdit é um setState de
   verdade, não é inerte). O render só acontece de novo quando onStopEdit
   dispara (blur real) ou quando outra parte da UI muda por outro motivo.
   ========================================================================== */

App.editableField = function (key, value, opts) {
  opts = opts || {};
  var isEditing = App.state.editingField === key;
  var trimmed = (value || '').trim();
  var isEmpty = !trimmed;
  // Default igual ao original — campos que não passam viewTextStyle (decisões,
  // próximos passos, erros, melhorias) dependem deste valor, não só do itálico.
  var baseStyle = opts.viewTextStyle || 'font-family:var(--font-sans);font-size:var(--text-13);color:var(--gti-text);';
  return {
    key: key,
    value: value || '',
    isEditing: isEditing,
    isViewing: !isEditing,
    isEmpty: isEmpty,
    displayValue: isEmpty ? (opts.emptyLabel || 'Clique no lápis para preencher') : trimmed,
    viewTextStyle: baseStyle + (isEmpty ? 'font-style:italic;color:var(--gti-text3);' : ''),
    multiline: !!opts.multiline,
    onStartEdit: function (e) {
      if (e && e.stopPropagation) e.stopPropagation();
      App.setState({ editingField: key }); // troca view→edit muda estrutura do DOM: render normal
    },
    onStopEdit: function () {
      App.setState({ editingField: null }); // blur real: fecha edição, render normal
    }
  };
};

/* ---------- Limpeza de editingField órfão ---------- */
// Roda no início de todo render() (ver render.js). Resolve a key de volta pro
// dado que ela referencia; se não existir mais (troca de aba no meio de uma
// edição, exclusão do item/etapa/fase/registro em edição), limpa o campo em
// vez de deixar um nó de input órfão preservado sem dono.
App.LIST_DRAFT_PATHS = {
  ov_decisions:      ['overview', 'decisions'],
  ov_apis:           ['overview', 'apis'],
  resumo_next:       ['resumo', 'nextSteps'],
  resumo_repos:      ['resumo', 'repos'],
  testes_errors:     ['testes', 'errors'],
  testes_improvements: ['testes', 'improvements']
};

App.editingFieldExists = function (state, key) {
  if (!key) return false;
  if (key === 'overview:scope' || key === 'overview:architecture') return true;

  var m;
  if ((m = /^item:(.+):(text|meta)$/.exec(key))) {
    var itemId = m[1];
    return state.tabs.some(function (t) { return t.sections.some(function (sec) { return sec.items.some(function (it) { return it.id === itemId; }); }); });
  }
  if ((m = /^sec:(.+):(title|subtitle)$/.exec(key))) {
    var secId = m[1];
    return state.tabs.some(function (t) { return t.sections.some(function (sec) { return sec.id === secId; }); });
  }
  if ((m = /^tests:(.+)$/.exec(key))) {
    var testId = m[1];
    return state.testes.tests.some(function (x) { return x.id === testId; });
  }
  if ((m = /^risks:(.+)$/.exec(key))) {
    var riskId = m[1];
    return state.testes.risks.some(function (x) { return x.id === riskId; });
  }
  if ((m = /^list:([^:]+):([^:]+)(?::(label|url))?$/.exec(key))) {
    var draftKey = m[1], id = m[2];
    var path = App.LIST_DRAFT_PATHS[draftKey];
    if (!path) return false;
    var arr = state[path[0]][path[1]];
    return arr.some(function (x) { return x.id === id; });
  }
  return false;
};

App.pruneEditingField = function (state) {
  if (state.editingField && !App.editingFieldExists(state, state.editingField)) {
    state.editingField = null;
  }
};

/* ==========================================================================
   Fábricas de lista genérica — reaproveitadas por decisions/apis/nextSteps/
   repos/errors/improvements — a forma de cada lista está comentada no
   App.seedState (state.js).
   tests/risks NÃO passam por aqui — têm campos extras (status/severity) e
   construção própria em render.js.
   ========================================================================== */

App.simpleListVals = function (pathArr, draftKey) {
  var s = App.state;
  var arr = pathArr.reduce(function (o, k) { return o[k]; }, s);
  var items = arr.map(function (it) {
    return {
      id: it.id,
      text: it.text,
      field: App.editableField('list:' + draftKey + ':' + it.id, it.text),
      onTextChange: function (v) {
        App.updateSilent(function (next) {
          var a = pathArr.reduce(function (o, k) { return o[k]; }, next);
          a.find(function (y) { return y.id === it.id; }).text = v;
        });
      },
      onDelete: function () {
        if (!App.confirmDeleteEntrada(it.text, 'esta linha')) return;
        App.update(function (next) {
          var a = pathArr.reduce(function (o, k) { return o[k]; }, next);
          var idx = a.findIndex(function (y) { return y.id === it.id; });
          a.splice(idx, 1);
        });
      }
    };
  });
  return {
    items: items,
    draft: (s.listDrafts || {})[draftKey] || '',
    draftKey: draftKey,
    isEmpty: items.length === 0,
    onDraftChange: function (v) {
      var ld = Object.assign({}, s.listDrafts || {});
      ld[draftKey] = v;
      App.setState({ listDrafts: ld });
    },
    onAdd: function () {
      var text = (((s.listDrafts || {})[draftKey]) || '').trim();
      if (!text) return;
      App.update(function (next) {
        var a = pathArr.reduce(function (o, k) { return o[k]; }, next);
        a.push({ id: App.uid(), text: text });
        next.listDrafts = next.listDrafts || {};
        next.listDrafts[draftKey] = '';
      });
    }
  };
};

App.twoFieldListVals = function (pathArr, draftKey) {
  var s = App.state;
  var arr = pathArr.reduce(function (o, k) { return o[k]; }, s);
  var drafts = (s.listDrafts || {})[draftKey] || { label: '', url: '' };
  var items = arr.map(function (it) {
    return {
      id: it.id, label: it.label, url: it.url,
      labelField: App.editableField('list:' + draftKey + ':' + it.id + ':label', it.label, { emptyLabel: '(sem nome)' }),
      urlField: App.editableField('list:' + draftKey + ':' + it.id + ':url', it.url, {
        viewTextStyle: 'color:var(--brand-primary);', emptyLabel: '(sem url)'
      }),
      onLabelChange: function (v) {
        App.updateSilent(function (next) {
          var a = pathArr.reduce(function (o, k) { return o[k]; }, next);
          a.find(function (y) { return y.id === it.id; }).label = v;
        });
      },
      onUrlChange: function (v) {
        App.updateSilent(function (next) {
          var a = pathArr.reduce(function (o, k) { return o[k]; }, next);
          a.find(function (y) { return y.id === it.id; }).url = v;
        });
      },
      onDelete: function () {
        // Duas colunas: o nome identifica melhor; se não houver, cai na URL.
        if (!App.confirmDeleteEntrada(it.label || it.url, 'este registro')) return;
        App.update(function (next) {
          var a = pathArr.reduce(function (o, k) { return o[k]; }, next);
          var idx = a.findIndex(function (y) { return y.id === it.id; });
          a.splice(idx, 1);
        });
      }
    };
  });
  return {
    items: items, draftLabel: drafts.label || '', draftUrl: drafts.url || '', draftKey: draftKey,
    onDraftLabelChange: function (v) {
      var ld = Object.assign({}, s.listDrafts || {});
      ld[draftKey] = Object.assign({}, drafts, { label: v });
      App.setState({ listDrafts: ld });
    },
    onDraftUrlChange: function (v) {
      var ld = Object.assign({}, s.listDrafts || {});
      ld[draftKey] = Object.assign({}, drafts, { url: v });
      App.setState({ listDrafts: ld });
    },
    onAdd: function () {
      var d = (s.listDrafts || {})[draftKey] || {};
      var label = (d.label || '').trim(), url = (d.url || '').trim();
      if (!label && !url) return;
      App.update(function (next) {
        var a = pathArr.reduce(function (o, k) { return o[k]; }, next);
        a.push({ id: App.uid(), label: label, url: url });
        next.listDrafts = next.listDrafts || {};
        next.listDrafts[draftKey] = { label: '', url: '' };
      });
    }
  };
};
