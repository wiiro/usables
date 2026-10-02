/* ==========================================================================
   Guia de Tarefas Interativo — app.js
   Ponto de entrada. Carrega o estado, registra a delegação de eventos, e
   faz o primeiro render. Sem isso, nada na página aparece — render.js só
   define App.render(), não o chama por conta própria.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  App.state = App.loadState();
  App.initEvents();
  App.render();
});
