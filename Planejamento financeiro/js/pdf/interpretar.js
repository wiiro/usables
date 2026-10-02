/* Do texto extraído (linhas) ao resultado validado. Puro — roda no navegador e no Node (testes).
   Parsers plugáveis: para adicionar um banco, crie parsers/<banco>.js e registre em PARSERS. */

import itau from './parsers/itau.js';
import nubank from './parsers/nubank.js';
import generico from './parsers/generico.js';
import { validarFatura, pontuacao } from './validar.js';

export const PARSERS = [itau, nubank];
const LIMITE_DETECCAO = 0.4;

export function detectarBanco(texto) {
  const ranking = PARSERS.map((p) => ({ parser: p, confianca: p.detectar(texto) })).sort((a, b) => b.confianca - a.confianca);
  const topo = ranking[0];
  return { parser: topo && topo.confianca >= LIMITE_DETECCAO ? topo.parser : null, confianca: topo ? topo.confianca : 0, ranking };
}

function tentar(parser, linhas) {
  try {
    const resultado = parser.extrair(linhas);
    return { resultado, validacao: validarFatura(resultado), erro: null };
  } catch (e) {
    return { resultado: null, validacao: null, erro: e };
  }
}

/** Interpreta uma fatura. Se o parser do banco falhar ou não validar, tenta o genérico e avisa. */
export function interpretarFatura(linhas) {
  const texto = linhas.join('\n');
  const { parser, confianca, ranking } = detectarBanco(texto);
  const avisos = [];
  let escolhido = null;
  let parserUsado = generico;

  if (parser) {
    const a = tentar(parser, linhas);
    parserUsado = parser;
    escolhido = a;
    const ok = a.resultado && a.validacao.bateu && a.resultado.transacoes.length > 0;
    if (!ok) {
      const g = tentar(generico, linhas);
      const pa = a.resultado ? pontuacao(a.resultado, a.validacao) : -Infinity;
      const pg = g.resultado ? pontuacao(g.resultado, g.validacao) : -Infinity;
      if (a.erro) avisos.push('O parser ' + parser.nome + ' falhou; usando o genérico.');
      else avisos.push('O parser ' + parser.nome + ' não validou o total' + (parser.preliminar ? ' (parser PRELIMINAR — layout ainda não calibrado)' : '') + '.');
      if (pg > pa) { escolhido = g; parserUsado = generico; avisos.push('Usado o parser genérico, que chegou mais perto do total.'); }
      else if (g.resultado) avisos.push('O parser genérico também foi testado e não foi melhor.');
    } else if (parser.preliminar) avisos.push('Parser ' + parser.nome + ' é PRELIMINAR: confira os lançamentos.');
  } else {
    escolhido = tentar(generico, linhas);
    avisos.push('Banco não identificado; usando o parser genérico.');
  }

  const { resultado, validacao } = escolhido;
  if (!resultado) return { ok: false, avisos: avisos.concat('Não foi possível interpretar a fatura.'), confianca, ranking, parserId: parserUsado.id };
  resultado.avisos.forEach((a) => avisos.push(a));
  if (resultado.banco === 'outro' && parser && parserUsado === generico) resultado.banco = parser.id;
  return { ok: true, resultado, validacao, avisos, confianca, ranking, parserId: parserUsado.id, bancoDetectado: parser ? parser.id : null };
}
