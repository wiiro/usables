/* Modal "+ Nova transação" (lançamento manual). */

import { App, update } from '../state.js';
import { esc, parseValor } from '../format.js';
import { hojeISO, mesAtual } from '../datas.js';
import { parseDataTexto } from '../datas.js';
import { modal, toast } from '../ui.js';
import { novaTransacao } from '../domain/transacoes.js';
import { opcoesTopico, opcoesUsuario } from './comum.js';

export async function abrirNovaTransacao(base = {}) {
  const s = App.state;
  const mes = App.ui.mes;
  const dataPadrao = base.data || (mes === mesAtual() ? hojeISO() : mes + '-01');
  const corpo =
    '<div class="linha-form">' +
    '<label class="campo"><span>Tipo</span><select id="nt-tipo"><option value="saida"' + (base.tipo !== 'entrada' ? ' selected' : '') + '>Saída (gasto)</option><option value="entrada"' + (base.tipo === 'entrada' ? ' selected' : '') + '>Entrada</option></select></label>' +
    '<label class="campo"><span>Data</span><input type="date" id="nt-data" value="' + esc(dataPadrao) + '"></label></div>' +
    '<label class="campo"><span>Descrição</span><input type="text" id="nt-desc" placeholder="Ex.: Mercado do mês" maxlength="120" value="' + esc(base.descricao || '') + '"></label>' +
    '<div class="linha-form"><label class="campo"><span>Valor (R$)</span><input type="text" inputmode="decimal" id="nt-valor" placeholder="0,00" value="' + esc(base.valorTexto || '') + '"></label>' +
    '<label class="campo"><span>Pessoa</span><select id="nt-usuario">' + opcoesUsuario(s, base.usuarioId || '') + '</select></label></div>' +
    '<label class="campo" id="nt-topico-campo"' + (base.tipo === 'entrada' ? ' hidden' : '') + '><span>Tópico</span><select id="nt-topico">' + opcoesTopico(s, base.topicoId || '') + '</select></label>' +
    '<p class="erro-inline" id="nt-erro" role="alert" style="color:var(--erro);min-height:1.2em;margin:8px 0 0"></p>';

  let dados = null;
  const r = await modal({
    titulo: base.id ? 'Editar transação' : 'Nova transação', corpo,
    botoes: [{ rotulo: 'Cancelar', id: 'cancelar' }, { rotulo: 'Salvar', id: 'salvar', primario: true }],
    aoAbrir: (d) => {
      const tipo = d.querySelector('#nt-tipo');
      tipo.addEventListener('change', () => { d.querySelector('#nt-topico-campo').hidden = tipo.value === 'entrada'; });
    },
    validar: (d) => {
      const get = (id) => d.querySelector(id).value;
      const erro = (m) => { d.querySelector('#nt-erro').textContent = m; return false; };
      const valor = parseValor(get('#nt-valor'));
      const data = parseDataTexto(get('#nt-data'));
      if (!get('#nt-desc').trim()) return erro('Informe uma descrição.');
      if (valor === null || valor <= 0) return erro('Informe um valor maior que zero (ex.: 45,90).');
      if (!data) return erro('Data inválida.');
      dados = { tipo: get('#nt-tipo'), data, descricao: get('#nt-desc').trim(), valor, usuarioId: get('#nt-usuario') || null, topicoId: get('#nt-tipo') === 'saida' ? (get('#nt-topico') || null) : null };
      return true;
    }
  });
  if (r !== 'salvar' || !dados) return;
  if (base.id) {
    update((st) => { const t = st.transacoes.find((x) => x.id === base.id); if (t) Object.assign(t, dados); });
    toast('Transação atualizada.');
  } else {
    update((st) => { st.transacoes.push(novaTransacao({ ...dados, origem: 'manual' })); });
    toast('Transação salva.');
  }
}

export const acoes = {
  'nova-transacao': () => abrirNovaTransacao()
};
