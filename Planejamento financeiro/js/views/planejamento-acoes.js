/* Ações e edições da tela Planejamento (clique, edição na linha, arrastar). */

import { App, update, restaurarEstado } from '../state.js';
import { esc, brl, parseValor, parsePercentual } from '../format.js';
import { modal, toast, confirmar } from '../ui.js';
import { comDesfazer } from '../nav.js';
import * as A from '../domain/acoes.js';
import { alocacaoDe, rendaDoMes, valoresPlanejados } from '../domain/orcamento.js';
import { folhasOrdenadas, nomeTopico } from './comum.js';

export const EMOJIS = ['', '🏠', '🛒', '💡', '🚗', '🩺', '📚', '🧾', '🎉', '🍽️', '🛍️', '📺', '✈️', '🛟', '📈', '🐶', '👶', '🎁', '💳', '📱', '💪', '🧹', '🔧', '⛽', '☕', '🎓', '🏖️'];

function focarDepois(fk) {
  setTimeout(() => { const el = document.querySelector('[data-fk="' + fk + '"]'); if (el) { el.focus(); if (el.select) el.select(); } }, 60);
}

async function moverDinheiro(el) {
  const s = App.state;
  const mes = App.ui.mes;
  const folhas = folhasOrdenadas(s);
  if (folhas.length < 2) { toast('Crie pelo menos dois tópicos para mover dinheiro entre eles.', { tipo: 'info' }); return; }
  const renda = rendaDoMes(s, mes).total;
  const plan = valoresPlanejados(s, mes, renda);
  const opcoes = (sel) => folhas.map((t) => '<option value="' + esc(t.id) + '"' + (t.id === sel ? ' selected' : '') + '>' + esc(nomeTopico(s, t.id)) + ' — planejado ' + esc(brl(plan[t.id])) + '</option>').join('');
  const de0 = (el && el.dataset && el.dataset.id) || folhas[0].id;
  const para0 = (folhas.find((t) => t.id !== de0) || folhas[0]).id;
  let dados = null;
  const r = await modal({
    titulo: 'Mover dinheiro entre tópicos',
    corpo: '<label class="campo"><span>Tirar de</span><select id="md-de">' + opcoes(de0) + '</select></label><label class="campo"><span>Passar para</span><select id="md-para">' + opcoes(para0) + '</select></label>' +
      '<label class="campo"><span>Valor (R$)</span><input type="text" inputmode="decimal" id="md-valor" placeholder="100,00"></label><p id="md-erro" role="alert" style="color:var(--erro);min-height:1.2em;margin:8px 0 0"></p>' +
      '<p class="fraco" style="font-size:.82rem">Os dois tópicos passam a ter valor fixo em R$.</p>',
    botoes: [{ rotulo: 'Cancelar', id: 'cancelar' }, { rotulo: 'Mover', id: 'mover', primario: true }],
    validar: (d) => {
      const v = parseValor(d.querySelector('#md-valor').value);
      const de = d.querySelector('#md-de').value, para = d.querySelector('#md-para').value;
      const erro = (m) => { d.querySelector('#md-erro').textContent = m; return false; };
      if (de === para) return erro('Escolha tópicos diferentes.');
      if (v === null || v <= 0) return erro('Informe um valor maior que zero.');
      if (v > plan[de]) return erro('O tópico de origem não tem esse valor planejado.');
      dados = { de, para, v };
      return true;
    }
  });
  if (r !== 'mover' || !dados) return;
  comDesfazer('Movi ' + brl(dados.v) + ' de ' + nomeTopico(s, dados.de) + ' para ' + nomeTopico(s, dados.para) + '.', (st) => { A.moverDinheiro(st, mes, dados.de, dados.para, dados.v); });
}

export const acoes = {
  'us-adicionar': () => {
    let novo = null;
    update((s) => { novo = A.criarUsuario(s, { nome: 'Nova pessoa' }); A.garantirMes(s, App.ui.mes).rendas[novo.id] = { salarioLiquido: 0, outrasRendas: 0 }; });
    focarDepois('us-n-' + novo.id);
  },
  'us-remover': (el) => comDesfazer('Pessoa removida.', (s) => { A.removerUsuario(s, el.dataset.id); }),
  'pl-modo': (el) => update((s) => { const a = alocacaoDe(s, App.ui.mes, el.dataset.id); A.definirAlocacao(s, App.ui.mes, el.dataset.id, { modo: a && a.modoAlocacao === 'percentual' ? 'valorFixo' : 'percentual' }); }),
  'tp-novo': (el) => {
    let novo = null;
    update((s) => { novo = A.criarTopico(s, { nome: 'Novo tópico', tipo: el.dataset.tipo, mesId: App.ui.mes }); });
    App.ui.editandoTopico = novo.id; App.render();
    focarDepois('tp-nome-' + novo.id);
  },
  'tp-sub': async (el) => {
    const s = App.state;
    const t = s.topicos.find((x) => x.id === el.dataset.id);
    const primeiro = !s.topicos.some((x) => x.topicoPai === t.id);
    if (primeiro && !(await confirmar('"' + t.nome + '" vai virar um grupo: o valor planejado e as transações dele passam para o primeiro subtópico.', { titulo: 'Criar subtópico', rotulo: 'Criar subtópico' }))) return;
    let novo = null;
    update((st) => { novo = A.criarTopico(st, { nome: 'Novo subtópico', topicoPai: t.id, mesId: App.ui.mes }); });
    App.ui.editandoTopico = novo.id; App.render();
    focarDepois('tp-nome-' + novo.id);
  },
  'tp-editar': (el) => { App.ui.editandoTopico = App.ui.editandoTopico === el.dataset.id ? null : el.dataset.id; App.render(); focarDepois('tp-nome-' + el.dataset.id); },
  'tp-remover': (el) => {
    const n = App.state.transacoes.filter((t) => t.topicoId === el.dataset.id).length;
    comDesfazer('Tópico excluído' + (n ? '; ' + n + ' transação(ões) ficaram sem tópico.' : '.'), (s) => { A.removerTopico(s, el.dataset.id); });
  },
  'tp-subir': (el) => update((s) => { A.deslocarTopico(s, el.dataset.id, -1); }),
  'tp-descer': (el) => update((s) => { A.deslocarTopico(s, el.dataset.id, 1); }),
  'mover-dinheiro': (el) => moverDinheiro(el),
  'copiar-anterior': async () => {
    const mes = App.ui.mes;
    const tem = Object.keys((App.state.meses[mes] || { alocacoes: {} }).alocacoes).length > 0;
    if (tem && !(await confirmar('Este mês já tem valores planejados. Substituir pelos do mês anterior?', { titulo: 'Copiar planejamento', rotulo: 'Substituir' }))) return;
    let origem = null;
    const antes = App.state;
    update((s) => { origem = A.copiarPlanoAnterior(s, mes); });
    if (!origem) toast('Nenhum mês anterior tem planejamento para copiar.', { tipo: 'erro' });
    else toast('Planejamento copiado de ' + origem + '.', { desfazer: () => restaurarEstado(antes) });
  },

  'arrastar-topico': (el, ev, tipo) => {
    const linhaEl = el.closest('.topico-linha');
    if (tipo === 'dragstart') {
      App.ui.arrastando = el.dataset.id;
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('text/plain', el.dataset.id);
      if (linhaEl) setTimeout(() => linhaEl.classList.add('arrastando'), 0);
    } else if (tipo === 'dragover' && App.ui.arrastando && linhaEl) {
      const alvo = App.state.topicos.find((t) => t.id === linhaEl.dataset.id);
      const orig = App.state.topicos.find((t) => t.id === App.ui.arrastando);
      if (alvo && orig && alvo.id !== orig.id && alvo.topicoPai === orig.topicoPai) { ev.preventDefault(); linhaEl.classList.add('alvo'); }
    } else if (tipo === 'dragleave' && linhaEl) linhaEl.classList.remove('alvo');
    else if (tipo === 'drop' && App.ui.arrastando && linhaEl) {
      ev.preventDefault();
      const de = App.ui.arrastando, para = linhaEl.dataset.id;
      App.ui.arrastando = null;
      update((s) => { A.reposicionarTopico(s, de, para); });
    } else if (tipo === 'dragend') {
      App.ui.arrastando = null;
      document.querySelectorAll('.arrastando, .alvo').forEach((x) => x.classList.remove('arrastando', 'alvo'));
    }
  }
};

function avisoInvalido(el, msg) {
  el.classList.add('invalido');
  toast(msg, { tipo: 'erro' });
  setTimeout(() => App.render(), 0);
}

export const edicoes = {
  'us-nome': (el) => update((s) => { const u = s.usuarios.find((x) => x.id === el.dataset.id); if (u) u.nome = el.value.trim() || u.nome; }),
  'us-cor': (el) => update((s) => { const u = s.usuarios.find((x) => x.id === el.dataset.id); if (u) u.cor = el.value; }),
  'us-salario': (el) => {
    const v = parseValor(el.value);
    if (v === null || v < 0) return avisoInvalido(el, 'Valor inválido. Use o formato 1.234,56.');
    update((s) => { A.definirRenda(s, el.dataset.id, 'salarioLiquido', v, App.ui.mes); });
  },
  'us-outras': (el) => {
    const v = parseValor(el.value);
    if (v === null || v < 0) return avisoInvalido(el, 'Valor inválido. Use o formato 1.234,56.');
    update((s) => { A.definirRenda(s, el.dataset.id, 'outrasRendas', v, App.ui.mes); });
  },
  'pl-valor': (el) => {
    const txt = el.value.trim();
    const aloc = alocacaoDe(App.state, App.ui.mes, el.dataset.id);
    const comoPct = txt.includes('%') || (aloc && aloc.modoAlocacao === 'percentual');
    if (comoPct) {
      const p = parsePercentual(txt);
      if (p === null || p < 0 || p > 1000) return avisoInvalido(el, 'Percentual inválido. Ex.: 12,5%');
      update((s) => { A.definirAlocacao(s, App.ui.mes, el.dataset.id, { percentual: p }); });
    } else {
      const v = parseValor(txt);
      if (v === null || v < 0) return avisoInvalido(el, 'Valor inválido. Use R$ (1.234,56) ou % (12,5%).');
      update((s) => { A.definirAlocacao(s, App.ui.mes, el.dataset.id, { valor: v }); });
    }
  },
  'pl-ref': (el) => update((s) => { s.preferencias.referencia503020 = el.checked; }),
  'tp-nome': (el) => update((s) => { A.editarTopico(s, el.dataset.id, { nome: el.value.trim() || 'Sem nome' }); }),
  'tp-cor': (el) => update((s) => { A.editarTopico(s, el.dataset.id, { cor: el.value }); }),
  'tp-icone': (el) => update((s) => { A.editarTopico(s, el.dataset.id, { icone: el.value }); }),
  'tp-tipo': (el) => update((s) => { A.editarTopico(s, el.dataset.id, { tipo: el.value }); })
};
