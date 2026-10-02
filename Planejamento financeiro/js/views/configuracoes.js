/* Configurações: tema, espaço usado, salvamento em arquivo, backup/restauração,
   regras de categorização e mapeamentos de CSV. */

import { App, update, substituirEstado, Sync, SyncStatus, gravarPrefsLeves } from '../state.js';
import { montarSnapshot, snapshotParaEstado } from '../modelo.js';
import { espacoUsado } from '../storage.js';
import { esc, uid } from '../format.js';
import { icone } from '../icons.js';
import { modal, toast, confirmar } from '../ui.js';
import { comDesfazer } from '../nav.js';
import { opcoesTopico, nomeTopico, usuarioDe } from './comum.js';

export const titulo = 'Configurações';

const fmtBytes = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
const fmtQuando = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—');
const stampArquivo = () => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, (c) => (c === 'T' ? '-' : '')).replace(/-/g, '');

function baixarJSON(nome) {
  const blob = new Blob([JSON.stringify(montarSnapshot(App.state), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function render({ state }) {
  const t = state.preferencias.tema;
  const regras = state.regras.map((r) => {
    const u = r.usuarioId ? usuarioDe(state, r.usuarioId) : null;
    return '<tr><td><b>' + esc(r.palavraChave) + '</b></td><td>' + esc(nomeTopico(state, r.topicoId)) + '</td><td>' + (u ? esc(u.nome) : '<span class="fraco">todos</span>') + '</td><td class="dir"><button class="icone-btn peq" data-acao="regra-remover" data-id="' + r.id + '" aria-label="Remover regra" title="Remover">' + icone('trash', 16) + '</button></td></tr>';
  }).join('');

  return '<div class="pilha" style="max-width:920px">' +
    '<section class="card"><header><h2>Aparência</h2></header><div class="abas" role="radiogroup" aria-label="Tema">' +
    [['sistema', 'Automático (do sistema)'], ['claro', 'Claro'], ['escuro', 'Escuro']].map(([v, n]) => '<button class="aba" role="radio" aria-selected="' + (t === v) + '" data-acao="cfg-tema" data-tema="' + v + '">' + n + '</button>').join('') + '</div></section>' +

    '<section class="card"><header><h2>Salvamento e backup</h2></header>' +
    '<div class="linha-form" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">' +
    '<div class="campo"><span>Espaço usado no navegador</span><b id="cfg-espaco" style="color:var(--texto)">calculando…</b></div>' +
    '<div class="campo"><span>Último salvamento em arquivo</span><b id="cfg-ultimo" style="color:var(--texto)">' + esc(fmtQuando(SyncStatus.ultimoSalvamento)) + '</b></div>' +
    '<div class="campo"><span>Pasta de dados</span><b id="cfg-pasta" style="color:var(--texto);word-break:break-all;font-weight:600">…</b></div>' +
    '<div class="campo"><span>Backups guardados</span><b id="cfg-backups" style="color:var(--texto)">…</b></div></div>' +
    '<p id="cfg-estado-arquivo" class="suave" style="margin:10px 0 0"></p>' +
    '<div class="filtros" style="margin-top:14px"><button class="btn btn-primario" data-acao="cfg-salvar-agora">' + icone('save', 18) + ' Salvar agora</button>' +
    '<button class="btn btn-sec" data-acao="cfg-restaurar">' + icone('undo', 18) + ' Restaurar backup</button>' +
    '<button class="btn btn-sec" data-acao="cfg-exportar">' + icone('download', 18) + ' Exportar JSON</button>' +
    '<button class="btn btn-sec" data-acao="cfg-importar">' + icone('importar', 18) + ' Importar JSON</button>' +
    '<input type="file" id="cfg-arquivo" hidden accept=".json,application/json" data-ed="cfg-arquivo"></div>' +
    '<p class="fraco" style="font-size:.82rem;margin:8px 0 0">Os dados ficam no navegador (IndexedDB) e são espelhados em <code>data/estado.json</code> a cada alteração (≈2 s depois). Para mudar a pasta, edite <code>config.json</code>.</p></section>' +

    '<section class="card"><header><h2>Regras de categorização</h2></header>' +
    (state.regras.length ? '<div class="tabela-wrap"><table class="tabela"><thead><tr><th>Se a descrição contém</th><th>Tópico</th><th>Pessoa</th><th></th></tr></thead><tbody>' + regras + '</tbody></table></div>' : '<p class="suave">Nenhuma regra ainda. Elas nascem quando você classifica uma transação e aceita "criar regra".</p>') +
    '<div class="linha-form" style="margin-top:14px;grid-template-columns:1fr 1fr auto"><label class="campo"><span>Palavra-chave</span><input id="regra-palavra" placeholder="Ex.: UBER" maxlength="40"></label>' +
    '<label class="campo"><span>Tópico</span><select id="regra-topico">' + opcoesTopico(state, '', 'Escolher…') + '</select></label><button class="btn btn-sec" data-acao="regra-adicionar">' + icone('plus', 16) + ' Adicionar</button></div></section>' +

    '<section class="card"><header><h2>Mapeamentos de CSV salvos</h2></header>' +
    (state.mapeamentos.length ? '<div class="tabela-wrap"><table class="tabela"><thead><tr><th>Banco</th><th>Separador</th><th>Data</th><th>Decimal</th><th></th></tr></thead><tbody>' + state.mapeamentos.map((m) => '<tr><td><b>' + esc(m.nomeBanco) + '</b></td><td>' + (m.delimitador === '\t' ? 'tab' : esc(m.delimitador)) + '</td><td>' + esc(m.formatoData) + '</td><td>' + esc(m.separadorDecimal) + '</td><td class="dir"><button class="icone-btn peq" data-acao="map-remover" data-id="' + m.id + '" aria-label="Remover mapeamento" title="Remover">' + icone('trash', 16) + '</button></td></tr>').join('') + '</tbody></table></div>' : '<p class="suave">Nenhum mapeamento salvo. Ao importar um CSV, marque "Salvar mapeamento" para reaproveitar depois.</p>') + '</section>' +

    '<section class="card"><header><h2>Privacidade</h2></header><p class="suave" style="margin:0">' + icone('lock', 16) + ' Seus dados financeiros ficam só neste computador. Nenhum arquivo, PDF ou valor é enviado para a internet, e o app não carrega bibliotecas, fontes ou ícones de servidores externos (funciona offline). PDFs nunca são guardados; senhas de PDF nunca são guardadas.</p></section></div>';
}

export async function montar() {
  const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  const { usado, cota } = await espacoUsado();
  set('cfg-espaco', usado ? fmtBytes(usado) + (cota ? ' de ' + fmtBytes(cota) : '') : 'indisponível');
  const info = await Sync.infoArquivo();
  if (info) {
    set('cfg-pasta', info.pastaDados);
    set('cfg-backups', info.backups + ' de ' + info.maxBackups);
    if (info.ultimoSalvamento) set('cfg-ultimo', fmtQuando(SyncStatus.ultimoSalvamento || info.ultimoSalvamento));
    set('cfg-estado-arquivo', info.existe ? 'Arquivo de dados: ' + fmtBytes(info.bytes) + '.' : 'Ainda não há arquivo de dados — clique em "Salvar agora".');
  } else {
    set('cfg-pasta', 'servidor local indisponível');
    set('cfg-backups', '—');
    set('cfg-estado-arquivo', 'O servidor local não respondeu: abra o app pelo atalho abrir.cmd para ativar o arquivo de segurança.');
  }
}

const nomeDoBackup = (n) => {
  const m = /estado-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/.exec(n);
  return m ? m[3] + '/' + m[2] + '/' + m[1] + ' ' + m[4] + ':' + m[5] + ':' + m[6] : n;
};

async function restaurarBackup() {
  let lista = [];
  try { lista = await Sync.listarBackups(); } catch (e) { toast('Servidor local indisponível: não consigo listar os backups.', { tipo: 'erro' }); return; }
  if (!lista.length) { toast('Ainda não há backups datados.', { tipo: 'info' }); return; }
  let escolhido = null;
  const r = await modal({
    titulo: 'Restaurar backup',
    corpo: '<p class="suave">Escolha um backup. Os dados atuais serão substituídos (o estado atual continua no histórico de backups enquanto couber nos últimos ' + lista.length + ').</p>' +
      '<div class="pilha">' + lista.map((b, i) => '<label style="display:flex;gap:10px;align-items:center;padding:6px 4px;border-bottom:1px solid var(--borda)"><input type="radio" name="bk" value="' + esc(b.nome) + '"' + (i === 0 ? ' checked' : '') + '><span class="num">' + esc(nomeDoBackup(b.nome)) + '</span><span class="fraco" style="margin-left:auto">' + fmtBytes(b.bytes) + '</span></label>').join('') + '</div>',
    botoes: [{ rotulo: 'Cancelar', id: 'cancelar' }, { rotulo: 'Restaurar', id: 'ok', primario: true }],
    validar: (d) => { const x = d.querySelector('input[name="bk"]:checked'); escolhido = x ? x.value : null; return !!escolhido; }
  });
  if (r !== 'ok' || !escolhido) return;
  try {
    await substituirEstado(snapshotParaEstado(await Sync.lerBackup(escolhido)));
    toast('Backup de ' + nomeDoBackup(escolhido) + ' restaurado.');
  } catch (e) { toast('Não foi possível restaurar: ' + e.message, { tipo: 'erro' }); }
}

export const acoes = {
  'cfg-tema': (el) => {
    const t = el.dataset.tema;
    gravarPrefsLeves({ tema: t });
    if (t === 'claro' || t === 'escuro') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
    update((s) => { s.preferencias.tema = t; });
  },
  'cfg-salvar-agora': async () => {
    const ok = await Sync.salvarAgora();
    toast(ok ? 'Salvo em arquivo.' : 'Não foi possível salvar em arquivo (servidor local indisponível).', { tipo: ok ? 'ok' : 'erro' });
    App.render();
  },
  'cfg-restaurar': restaurarBackup,
  'cfg-exportar': () => { baixarJSON('planejamento-financeiro-' + stampArquivo() + '.json'); toast('Backup exportado.'); },
  'cfg-importar': () => document.getElementById('cfg-arquivo').click(),
  'regra-remover': (el) => comDesfazer('Regra removida.', (s) => { s.regras = s.regras.filter((r) => r.id !== el.dataset.id); }),
  'regra-adicionar': () => {
    const palavra = document.getElementById('regra-palavra').value.trim();
    const topicoId = document.getElementById('regra-topico').value;
    if (!palavra || !topicoId) { toast('Informe a palavra-chave e o tópico.', { tipo: 'erro' }); return; }
    update((s) => { s.regras.push({ id: uid(), palavraChave: palavra, topicoId, usuarioId: null }); });
    toast('Regra adicionada.');
  },
  'map-remover': (el) => comDesfazer('Mapeamento removido.', (s) => { s.mapeamentos = s.mapeamentos.filter((m) => m.id !== el.dataset.id); })
};

export const edicoes = {
  'cfg-arquivo': async (el) => {
    const f = el.files && el.files[0];
    el.value = '';
    if (!f) return;
    let novo;
    try { novo = snapshotParaEstado(JSON.parse(await f.text())); } catch (e) { toast(e instanceof SyntaxError ? 'Arquivo JSON inválido.' : e.message, { tipo: 'erro' }); return; }
    if (!(await confirmar('Importar "' + f.name + '" substitui TODOS os dados atuais (' + novo.transacoes.length + ' transações no arquivo). Vou baixar um backup do estado atual antes. Continuar?', { titulo: 'Importar backup', rotulo: 'Substituir tudo', perigo: true }))) return;
    baixarJSON('planejamento-financeiro-antes-da-importacao-' + stampArquivo() + '.json');
    await substituirEstado(novo);
    toast('Dados importados.');
  }
};
