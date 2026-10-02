/* Navegação (hash) e seleção de mês. Compartilhado por main.js e pelas telas. */

import { App, update, restaurarEstado, gravarPrefsLeves } from './state.js';
import { toast } from './ui.js';
import { garantirMes } from './domain/acoes.js';
import { addMeses } from './datas.js';

export const ROTAS = ['dashboard', 'planejamento', 'transacoes', 'cartoes', 'importar', 'configuracoes'];

export function parseHash() {
  const [caminho, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const params = {};
  new URLSearchParams(query).forEach((v, k) => { params[k] = v; });
  return { rota: ROTAS.includes(caminho) ? caminho : 'dashboard', params };
}

export function navegar(rota, params = {}) {
  const q = new URLSearchParams(params).toString();
  const alvo = '#/' + rota + (q ? '?' + q : '');
  if (location.hash === alvo) App.render(); else location.hash = alvo;
}

/** Vai para um mês (id 'AAAA-MM') ou desloca (número). Cria o registro do mês com a renda atual. */
export function irParaMes(alvo) {
  const mes = typeof alvo === 'number' ? addMeses(App.ui.mes, alvo) : alvo;
  App.ui.mes = mes;
  gravarPrefsLeves({ ultimoMes: mes });
  if (App.state.usuarios.length && !App.state.meses[mes]) update((s) => { garantirMes(s, mes); });
  else App.render();
}

export const filtrosPadrao = () => ({ busca: '', usuarioId: '', topicoId: '', finalCartao: '', origem: '', status: 'todas', ordem: 'data', dir: 'desc', todosMeses: false });

/** Abre a tela de Transações já filtrada (usado ao clicar em gráficos). */
export function verTransacoes(filtro = {}) {
  App.ui.filtros = { ...filtrosPadrao(), ...filtro };
  App.ui.selecionadas = new Set();
  navegar('transacoes');
}

/** Aplica a mutação e mostra um aviso com "Desfazer" (volta ao estado anterior). */
export function comDesfazer(mensagem, mutator) {
  const antes = App.state;
  update(mutator);
  toast(mensagem, { desfazer: () => restaurarEstado(antes) });
}
