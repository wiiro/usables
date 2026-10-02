/* ==========================================================================
   Guia de Tarefas Interativo — state.js
   Modelo de dados + persistência. ESTE ARQUIVO É A FONTE DA VERDADE do
   modelo de dados: a forma de cada nível está comentada em App.seedState
   abaixo, e as formas de Fase/Etapa/Item logo depois dele. Não existe um
   data-model.md separado — ele existia no repositório de origem e foi
   deliberadamente não recriado aqui, para não haver duas descrições do
   mesmo modelo divergindo com o tempo.

   Para o comportamento que o modelo sustenta, ver business-rules.md; para
   a arquitetura de render/persistência, ver ARCHITECTURE.md.

   Namespace único global (App) — sem módulos ES, sem build step, de
   propósito: qualquer editor de texto comum abre e entende este arquivo
   inteiro sem ferramental especial.
   ========================================================================== */

var App = {};

/* ---------- Identidade do documento (isola o localStorage) ---------- */

// >>> ALTERE ESTE VALOR AO CRIAR UM NOVO DOCUMENTO A PARTIR DESTE TEMPLATE <<<
// O DOC_ID é o que separa o localStorage de um documento do de outro. Dois
// documentos com o mesmo DOC_ID gravam na MESMA chave e se sobrescrevem —
// foi o que aconteceu entre 'Template' e 'bugs' até 2026-09-18.
//
// Isso vale tanto em file:// (todos os arquivos locais dividem uma origem)
// quanto via abrir.cmd (dois documentos servidos na mesma porta dividem a
// origem localhost:PORTA). Em nenhum dos dois casos o caminho da pasta
// separa os dados — só o DOC_ID separa.
//
// Use algo curto e único, no formato kebab-case: 'extrato-533', 'onboarding'.
App.DOC_ID = 'template';
App.SK = 'gti_state_v1__' + App.DOC_ID;

// Guarda advisória: esperado dentro da própria pasta Template, mas em
// qualquer cópia significa que o passo acima foi esquecido.
if (App.DOC_ID === 'template' && typeof console !== 'undefined') {
  console.warn(
    '[Guia de Tarefas] DOC_ID ainda é "template". Se esta NÃO é a pasta ' +
    'Template, altere App.DOC_ID em state.js — senão este documento vai ' +
    'sobrescrever o estado salvo do template.'
  );
}

App.uid = function () {
  return '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
};

App.ts = function () {
  var d = new Date();
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

/* ---------- Estado inicial (documento em branco) ---------- */

App.seedState = function () {
  return {
    theme: 'light',
    title: 'Guia de Tarefas',
    subtitle: 'Documentação de processo · v1',
    activeTab: '__overview',
    sidebarCollapsed: false,
    sidebarWidth: 236,
    editingField: null,   // key do campo em modo edição (padrão "lápis"), ou null
    tabs: [],              // Fase[] — ver App.seedTab()/estrutura abaixo
    annotations: [],       // { id, type, title, text, ts } — ver App.ANN_TYPES
    itemDrafts: {},        // rascunho de "novo item" por seção, chave = section.id
    annFormOpen: false,
    annDraft: { type: 'nota', title: '', text: '' },
    overview: {
      scope: '',
      architecture: '',
      decisions: [],        // { id, text }
      apis: []               // { id, label, url }
    },
    resumo: {
      statusDate: new Date().toISOString().slice(0, 10),
      nextSteps: [],         // { id, text }
      repos: []               // { id, label, url }
    },
    testes: {
      tests: [],              // { id, text, status: 'pending'|'pass'|'fail' }
      errors: [],             // { id, text }
      risks: [],              // { id, text, severity: 'baixo'|'medio'|'alto' }
      improvements: []        // { id, text }
    },
    listDrafts: {}
  };
};

/* Fase / Etapa / Item — formas de referência (não chamadas diretamente,
   documentam a forma esperada de cada nível; ver business-rules.md):

   Fase   { id, label, color, sections: Etapa[] }
   Etapa  { id, title, subtitle, estimate, actual, impact: 'baixo'|'medio'|'alto', items: Item[] }
   Item   { id, text, meta, status: 'pending'|'done'|'blocked' }
*/

/* ---------- Carregar do localStorage (com hidratação defensiva) ---------- */

App.loadState = function () {
  try {
    var raw = localStorage.getItem(App.SK);
    if (raw) {
      var s = JSON.parse(raw);
      s.itemDrafts = s.itemDrafts || {};
      s.annFormOpen = false; // nunca persiste aberto entre sessões
      s.annDraft = s.annDraft || { type: 'nota', title: '', text: '' };
      s.annotations = s.annotations || [];
      // Anotações gravadas antes de 2026-09-18 não tinham título e carregavam um
      // campo 'section' (Geral / nome da fase) que saiu do formulário. Normaliza
      // na leitura: o texto é preservado e a antiga seção vira o título, que era
      // o único rótulo livre que aquela anotação tinha.
      s.annotations = s.annotations.map(function (a) {
        if (typeof a.title === 'string') return a;
        var herdado = (a.section && a.section !== 'Geral') ? a.section : '';
        return { id: a.id, type: a.type, title: herdado, text: a.text, ts: a.ts };
      });
      s.sidebarCollapsed = !!s.sidebarCollapsed;
      s.sidebarWidth = Math.max(200, Math.min(420, Number(s.sidebarWidth) || 236));
      s.sidebarResizing = false;   // estado transitório de interação, nunca persiste
      s.editingField = null;       // idem — nenhum campo começa "em edição" ao recarregar
      s.overview = s.overview || { scope: '', architecture: '', decisions: [], apis: [] };
      s.resumo = s.resumo || { statusDate: new Date().toISOString().slice(0, 10), nextSteps: [], repos: [] };
      s.testes = s.testes || { tests: [], errors: [], risks: [], improvements: [] };
      s.listDrafts = s.listDrafts || {};
      var fixedTabs = ['__overview', '__resumo', '__testes', '__progress'];
      if (!s.activeTab || (fixedTabs.indexOf(s.activeTab) === -1 && !s.tabs.find(function (t) { return t.id === s.activeTab; }))) {
        s.activeTab = '__overview';
      }
      return s;
    }
  } catch (e) { /* localStorage indisponível ou JSON corrompido — cai no seed */ }
  var seed = App.seedState();
  seed.activeTab = '__overview';
  return seed;
};

/* ---------- Persistir (só os campos que fazem sentido guardar) ---------- */

App.persist = function () {
  try {
    var s = App.state;
    localStorage.setItem(App.SK, JSON.stringify({
      theme: s.theme, title: s.title, subtitle: s.subtitle, activeTab: s.activeTab,
      sidebarCollapsed: s.sidebarCollapsed, sidebarWidth: s.sidebarWidth,
      tabs: s.tabs, annotations: s.annotations,
      overview: s.overview, resumo: s.resumo, testes: s.testes
      // Deliberadamente fora: editingField, sidebarResizing, itemDrafts, listDrafts,
      // annFormOpen, annDraft — todo estado transitório de interação/rascunho.
    }));
  } catch (e) { /* localStorage indisponível (modo privado cheio, etc.) — falha silenciosa */ }
};

/* ---------- Mutação central ---------- */

// Uso: App.update(function(next){ next.tabs.push(...); })
// Clona o estado, aplica a mutação, persiste e re-renderiza.
App.update = function (mutator) {
  var next = JSON.parse(JSON.stringify(App.state));
  mutator(next);
  App.state = next;
  App.persist();
  App.render();
};

// Atalho para trocas simples de nível superior (ex: App.setState({activeTab:'__testes'})).
App.setState = function (patch) {
  App.state = Object.assign({}, App.state, patch);
  App.persist();
  App.render();
};

// Variante que NÃO re-renderiza — usada pelos campos sob edição ativa (ver logic.js
// editableField) para atualizar o valor no estado a cada tecla sem reconstruir o DOM.
App.setStateSilent = function (patch) {
  App.state = Object.assign({}, App.state, patch);
  App.persist();
};

App.updateSilent = function (mutator) {
  var next = JSON.parse(JSON.stringify(App.state));
  mutator(next);
  App.state = next;
  App.persist();
};
