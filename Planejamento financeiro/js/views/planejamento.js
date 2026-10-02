/* Planejamento (padrão YNAB / orçamento base zero): renda, tópicos por tipo,
   edição direto na linha, "falta distribuir" sempre visível. */

import { App } from '../state.js';
import { esc, brl, pct } from '../format.js';
import { icone } from '../icons.js';
import { TIPOS_TOPICO } from '../modelo.js';
import { campoValor, estadoVazio } from '../ui.js';
import { alocacaoDe, ehGrupo, percentualDe } from '../domain/orcamento.js';
import { mesAnteriorComPlano } from '../domain/acoes.js';
import { nomeMes } from '../datas.js';
import { TIPOS, raizes, filhos, barraProgresso } from './comum.js';

export { acoes, edicoes, EMOJIS } from './planejamento-acoes.js';
import { EMOJIS } from './planejamento-acoes.js';

export const titulo = 'Planejamento';

function banner(r) {
  const f = r.faltaDistribuir;
  if (f === 0) return '<div class="banner ok" role="status">' + icone('check', 22) + '<span class="grande num">Tudo distribuído!</span><span>Cada real da renda tem um destino.</span></div>';
  if (f > 0) return '<div class="banner aviso" role="status">' + icone('info', 22) + '<span class="grande num">Falta distribuir ' + brl(f) + '</span><span>de ' + brl(r.renda) + ' de renda — dê um destino para cada real.</span></div>';
  return '<div class="banner erro" role="alert">' + icone('alert', 22) + '<span class="grande num">Planejou ' + brl(-f) + ' a mais que a renda</span><span>Reduza algum tópico ou mova dinheiro entre eles.</span></div>';
}

function blocoUsuarios(state, r) {
  const linhas = state.usuarios.map((u) => {
    const v = r.rendaPorUsuario[u.id];
    return '<div class="usuario-linha"><input type="color" value="' + esc(u.cor) + '" data-ed="us-cor" data-id="' + u.id + '" aria-label="Cor de ' + esc(u.nome) + '">' +
      '<input class="ed" type="text" value="' + esc(u.nome) + '" data-ed="us-nome" data-id="' + u.id + '" data-fk="us-n-' + u.id + '" aria-label="Nome" maxlength="40">' +
      campoValor({ centavos: v.salario, data: { ed: 'us-salario', id: u.id }, rotulo: 'Salário líquido de ' + u.nome, fk: 'us-s-' + u.id }) +
      '<span class="col-outras">' + campoValor({ centavos: v.outras, data: { ed: 'us-outras', id: u.id }, rotulo: 'Outras rendas de ' + u.nome, fk: 'us-o-' + u.id }) + '</span>' +
      '<span class="num col-pct dir"><b>' + pct(r.renda ? (v.total / r.renda) * 100 : 0) + '</b></span>' +
      '<span class="acoes-linha"><button class="icone-btn peq" data-acao="us-remover" data-id="' + u.id + '" aria-label="Remover ' + esc(u.nome) + '" title="Remover">' + icone('trash', 16) + '</button></span></div>';
  }).join('');
  return '<section class="card"><header><h2>Renda da casa</h2><span class="num suave">Total: <b style="color:var(--texto)">' + brl(r.renda) + '</b></span></header>' +
    (state.usuarios.length
      ? '<div class="usuarios-lista"><div class="usuario-linha cab-linha"><span></span><span>Pessoa</span><span class="dir">Salário líquido</span><span class="dir">Outras rendas</span><span class="dir">% da renda</span><span></span></div>' + linhas + '</div>'
      : '<p class="suave">Nenhuma pessoa cadastrada ainda.</p>') +
    '<p style="margin:10px 0 0"><button class="btn btn-sec btn-pequeno" data-acao="us-adicionar">' + icone('plus', 16) + ' Adicionar pessoa</button></p></section>';
}

function celulaPlanejado(state, mes, t, r) {
  if (ehGrupo(state, t.id)) return '<span class="num dir" style="padding-right:8px">' + brl(r.porTopico[t.id].planejado) + '</span>';
  const a = alocacaoDe(state, mes, t.id);
  const pctModo = a && a.modoAlocacao === 'percentual';
  const valor = r.porTopico[t.id].planejado;
  const campo = pctModo
    ? '<input type="text" inputmode="decimal" class="ed ed-valor" value="' + String(a.percentualPlanejado).replace('.', ',') + '" data-ed="pl-valor" data-id="' + t.id + '" data-fk="pl-' + t.id + '" aria-label="Percentual planejado de ' + esc(t.nome) + '" autocomplete="off">'
    : campoValor({ centavos: valor, data: { ed: 'pl-valor', id: t.id }, rotulo: 'Valor planejado de ' + t.nome, fk: 'pl-' + t.id });
  return '<div><div class="planejado-cel">' + campo + '<button class="modo-btn" data-acao="pl-modo" data-id="' + t.id + '" title="Alternar entre R$ e %" aria-label="Alternar entre reais e percentual">' + (pctModo ? '%' : 'R$') + '</button></div>' +
    '<small class="fraco num" style="display:block;text-align:right;margin-right:42px">' + (pctModo ? '= ' + brl(valor) : '= ' + pct(percentualDe(valor, r.renda), 2) + ' da renda') + '</small></div>';
}

function painelEdicao(t, ehRaiz) {
  return '<div class="painel-edicao"><label class="campo"><span>Nome</span><input type="text" value="' + esc(t.nome) + '" data-ed="tp-nome" data-id="' + t.id + '" data-fk="tp-nome-' + t.id + '" maxlength="40"></label>' +
    '<label class="campo"><span>Cor</span><input type="color" value="' + esc(t.cor) + '" data-ed="tp-cor" data-id="' + t.id + '"></label>' +
    '<label class="campo"><span>Ícone</span><select data-ed="tp-icone" data-id="' + t.id + '">' + EMOJIS.map((e) => '<option value="' + e + '"' + (e === t.icone ? ' selected' : '') + '>' + (e || '(nenhum)') + '</option>').join('') + '</select></label>' +
    (ehRaiz ? '<label class="campo"><span>Tipo</span><select data-ed="tp-tipo" data-id="' + t.id + '">' + TIPOS.map((k) => '<option value="' + k + '"' + (k === t.tipo ? ' selected' : '') + '>' + TIPOS_TOPICO[k].nome + '</option>').join('') + '</select></label>' : '') +
    '<button class="btn btn-sec btn-pequeno" data-acao="tp-editar" data-id="' + t.id + '">Pronto</button></div>';
}

function linha(state, mes, r, t, ehFilho) {
  const grupo = ehGrupo(state, t.id);
  const p = r.porTopico[t.id];
  const disp = p.disponivel;
  const edit = App.ui.editandoTopico === t.id;
  return '<div class="topico-linha ' + (ehFilho ? 'filho' : '') + (grupo ? ' grupo' : '') + '" data-arrastar="topico" data-id="' + t.id + '" data-pai="' + esc(t.topicoPai || '') + '">' +
    '<button class="alca" draggable="true" data-arrastar="topico" data-id="' + t.id + '" aria-label="Arrastar para reordenar ' + esc(t.nome) + '" title="Arraste para reordenar">' + icone('drag', 16) + '</button>' +
    '<div class="topico-nome"><i class="cor-bolinha" style="background:' + esc(t.cor) + '"></i><span class="emoji">' + esc(t.icone) + '</span><span>' + esc(t.nome) + '</span></div>' +
    celulaPlanejado(state, mes, t, r) +
    '<span class="num dir col-gasto">' + (p.gasto ? '<button class="link-card num" data-acao="ver-topico" data-id="' + t.id + '" title="Ver transações">' + brl(p.gasto) + '</button>' : brl(0)) + '</span>' +
    '<span class="num dir col-disp ' + (disp < 0 ? 'disp-neg' : '') + '">' + brl(disp) + '</span>' +
    '<span class="barra-cel">' + (p.planejado > 0 || p.gasto > 0 ? barraProgresso(p.uso === Infinity ? 2 : p.uso) : '') + '</span>' +
    '<span class="acoes-linha">' +
    '<button class="icone-btn peq" data-acao="tp-subir" data-id="' + t.id + '" aria-label="Subir ' + esc(t.nome) + '" title="Subir">' + icone('arrowUp', 16) + '</button>' +
    '<button class="icone-btn peq" data-acao="tp-descer" data-id="' + t.id + '" aria-label="Descer ' + esc(t.nome) + '" title="Descer">' + icone('arrowDown', 16) + '</button>' +
    (!ehFilho ? '<button class="icone-btn peq" data-acao="tp-sub" data-id="' + t.id + '" aria-label="Novo subtópico de ' + esc(t.nome) + '" title="Novo subtópico">' + icone('plus', 16) + '</button>' : '') +
    (!grupo ? '<button class="icone-btn peq" data-acao="mover-dinheiro" data-id="' + t.id + '" aria-label="Mover dinheiro de ' + esc(t.nome) + '" title="Mover dinheiro">' + icone('swap', 16) + '</button>' : '') +
    '<button class="icone-btn peq" data-acao="tp-editar" data-id="' + t.id + '" aria-label="Editar ' + esc(t.nome) + '" title="Editar nome, cor e ícone">' + icone('edit', 16) + '</button>' +
    '<button class="icone-btn peq" data-acao="tp-remover" data-id="' + t.id + '" aria-label="Excluir ' + esc(t.nome) + '" title="Excluir">' + icone('trash', 16) + '</button></span>' +
    (edit ? painelEdicao(t, !ehFilho) : '') + '</div>';
}

function grupoTipo(state, mes, r, tipo) {
  const info = TIPOS_TOPICO[tipo];
  const tp = r.porTipo[tipo];
  const lista = raizes(state, tipo);
  let corpo = '<div class="topico-linha cab-linha" style="border-top:0"><span></span><span>Tópico</span><span class="dir" style="padding-right:42px">Planejado</span><span class="dir col-gasto">Gasto</span><span class="dir col-disp">Disponível</span><span class="barra-cel">Uso</span><span></span></div>';
  lista.forEach((t) => { corpo += linha(state, mes, r, t, false); filhos(state, t.id).forEach((f) => { corpo += linha(state, mes, r, f, true); }); });
  if (!lista.length) corpo += '<p class="suave" style="padding:8px 4px">Nenhum tópico aqui ainda.</p>';
  return '<section class="card grupo-tipo"><div class="grupo-cab"><h2>' + info.nome + '</h2><span class="suave num">' + pct(r.renda ? (tp.planejado / r.renda) * 100 : 0) + ' da renda</span>' +
    '<span class="tot num">Planejado <b>' + brl(tp.planejado) + '</b> · Gasto <b>' + brl(tp.gasto) + '</b></span></div>' + corpo +
    '<p style="margin:10px 0 0"><button class="btn btn-sec btn-pequeno" data-acao="tp-novo" data-tipo="' + tipo + '">' + icone('plus', 16) + ' Novo tópico</button></p></section>';
}

function referencia(state, r) {
  const cores = { necessidade: '#4f7cac', desejo: '#e0a458', poupanca: '#81b29a' };
  const barra = (valores) => '<div class="ref-barra">' + TIPOS.map((k) => '<div style="width:' + valores[k] + '%;background:' + cores[k] + '">' + (valores[k] >= 8 ? pct(valores[k], 0) : '') + '</div>').join('') + '</div>';
  const seu = {};
  const total = r.renda || 1;
  TIPOS.forEach((k) => { seu[k] = Math.round((r.porTipo[k].planejado / total) * 1000) / 10; });
  const ref = { necessidade: 50, desejo: 30, poupanca: 20 };
  return '<section class="card"><header><h3>Referência 50/30/20</h3><span class="suave">Só uma referência — cada família tem a sua realidade</span></header>' +
    '<div class="suave" style="font-size:.85rem">Seu plano</div>' + barra(seu) + '<div class="suave" style="font-size:.85rem">Referência</div>' + barra(ref) +
    '<div class="num suave" style="font-size:.85rem;display:flex;gap:16px;flex-wrap:wrap;margin-top:6px">' + TIPOS.map((k) => '<span><i class="cor-bolinha" style="background:' + cores[k] + '"></i> ' + TIPOS_TOPICO[k].nome + ': <b style="color:var(--texto)">' + pct(seu[k]) + '</b> (ref. ' + ref[k] + '%)</span>').join('') + '</div></section>';
}

export function render({ state, mes, resumo: r }) {
  const anterior = mesAnteriorComPlano(state, mes);
  const temPlano = Object.keys((state.meses[mes] || { alocacoes: {} }).alocacoes).length > 0;

  const barra = '<div class="filtros" style="margin-top:16px"><button class="btn btn-sec" data-acao="mover-dinheiro">' + icone('swap') + ' Mover dinheiro</button>' +
    '<button class="btn btn-sec" data-acao="copiar-anterior"' + (anterior ? '' : ' disabled title="Nenhum mês anterior com planejamento"') + '>' + icone('copy') + ' Copiar planejamento do mês anterior' + (anterior ? ' (' + esc(nomeMes(anterior, false)) + ')' : '') + '</button>' +
    '<label style="margin-left:auto;display:flex;gap:8px;align-items:center;font-weight:600"><input type="checkbox" data-ed="pl-ref" ' + (state.preferencias.referencia503020 ? 'checked' : '') + '> Mostrar referência 50/30/20</label></div>';

  const vazio = !state.topicos.length ? '<div class="card" style="margin-top:16px">' + estadoVazio({ icone: 'planejamento', titulo: 'Nenhum tópico ainda', texto: 'Crie tópicos como Moradia, Mercado ou Lazer e distribua a renda entre eles.', acao: { acao: 'tp-novo', rotulo: 'Criar primeiro tópico', data: ' data-tipo="necessidade"' } }) + '</div>' : '';
  const aviso = (state.topicos.length && !temPlano && anterior)
    ? '<div class="alerta-caixa info" style="margin-top:16px">' + icone('info') + '<span>Este mês ainda não tem planejamento. Use <b>Copiar planejamento do mês anterior</b> para começar com os mesmos valores.</span></div>' : '';

  return banner(r) + '<div class="pilha" style="margin-top:16px">' + blocoUsuarios(state, r) + '</div>' + barra + aviso + vazio +
    (state.topicos.length ? '<div class="pilha">' + TIPOS.map((k) => grupoTipo(state, mes, r, k)).join('') + (state.preferencias.referencia503020 ? referencia(state, r) : '') + '</div>' : '');
}
