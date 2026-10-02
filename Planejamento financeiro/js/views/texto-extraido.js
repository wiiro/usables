/* "Ver texto extraído" + "Copiar texto mascarado" (para calibrar os parsers sem expor dados pessoais). */

import { esc } from '../format.js';
import { modal, toast } from '../ui.js';
import { mascararTexto } from '../pdf/mascarar.js';
import { App } from '../state.js';

export async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = texto; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
    ta.remove();
    return ok;
  }
}

/** `texto` = texto bruto (na importação) ou já mascarado (fatura guardada). Sempre copia a versão mascarada. */
export async function abrirTextoExtraido(texto, { titulo = 'Texto extraído', jaMascarado = false } = {}) {
  const nomes = App.state.usuarios.map((u) => u.nome);
  const mascarado = mascararTexto(texto, { nomes });
  const c = mascarado.substituicoes;
  const resumo = 'Mascarado: ' + c.cpf + ' CPF, ' + c.cnpj + ' CNPJ, ' + c.cartoes + ' nº de cartão, ' + c.nomes + ' nome(s), ' + c.emails + ' e-mail(s).';
  let mostrarBruto = false;
  const corpo = '<p class="suave">' + (jaMascarado ? 'Este é o texto guardado da última fatura deste banco (já mascarado). ' : '') +
    'Use <b>Copiar texto mascarado</b> para me enviar na calibração dos parsers: CPF, nome do titular e números de cartão (exceto os 4 últimos dígitos) são substituídos.</p>' +
    (jaMascarado ? '' : '<label style="display:flex;gap:6px;align-items:center;font-size:.88rem"><input type="checkbox" id="te-bruto"> Mostrar texto original (com dados pessoais)</label>') +
    '<p class="fraco" style="font-size:.82rem;margin:6px 0 0">' + esc(resumo) + '</p><pre class="texto-extraido" id="te-pre">' + esc(mascarado.texto) + '</pre>';
  await modal({
    titulo, corpo, largo: true,
    botoes: [{ rotulo: 'Fechar', id: 'fechar' }, { rotulo: 'Copiar texto mascarado', id: 'copiar', primario: true }],
    aoAbrir: (d) => {
      const cb = d.querySelector('#te-bruto');
      if (cb) cb.addEventListener('change', () => { mostrarBruto = cb.checked; d.querySelector('#te-pre').textContent = mostrarBruto ? texto : mascarado.texto; });
      const copiar = d.querySelector('[data-modal="copiar"]');
      copiar.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        const ok = await copiarTexto(mascarado.texto);
        toast(ok ? 'Texto mascarado copiado.' : 'Não foi possível copiar automaticamente — selecione o texto e copie.', { tipo: ok ? 'ok' : 'erro' });
      });
    }
  });
}
