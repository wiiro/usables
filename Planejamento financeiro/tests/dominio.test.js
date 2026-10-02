import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedEstado, hidratar, montarSnapshot, snapshotParaEstado } from '../js/modelo.js';
import { resumoMes, rendaDoMes } from '../js/domain/orcamento.js';
import * as A from '../js/domain/acoes.js';
import { prepararLinhasCSV, prepararLinhasPDF, confirmarImportacao, cartoesNovos } from '../js/domain/importacao.js';
import { interpretarFatura } from '../js/pdf/interpretar.js';
import { analisarCSV } from '../js/csv/leitor.js';
import { sugerirColunas, converterLinhas } from '../js/csv/mapeamento.js';
import { chaveParcela } from '../js/domain/parcelas.js';
import { novaTransacao } from '../js/domain/transacoes.js';

const ex = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'exemplos');
const MES = '2026-10';

function base() {
  const s = seedEstado();
  A.criarUsuario(s, { nome: 'Ana', salarioLiquido: 600000 });
  A.criarUsuario(s, { nome: 'Bia', salarioLiquido: 400000, outrasRendas: 50000 });
  A.garantirMes(s, MES);
  return s;
}

test('renda total é a soma de todos; salário altera % e valores', () => {
  const s = base();
  assert.equal(rendaDoMes(s, MES).total, 1050000);
  const mor = A.criarTopico(s, { nome: 'Moradia', tipo: 'necessidade', mesId: MES, modoAlocacao: 'percentual', percentualPlanejado: 20 });
  assert.equal(resumoMes(s, MES).porTopico[mor.id].planejado, 210000);
  A.definirRenda(s, s.usuarios[0].id, 'salarioLiquido', 700000, MES);
  assert.equal(resumoMes(s, MES).renda, 1150000);
  assert.equal(resumoMes(s, MES).porTopico[mor.id].planejado, 230000);
});

test('banner "falta distribuir" e conversão % <-> R$', () => {
  const s = base();
  const t = A.criarTopico(s, { nome: 'Mercado', tipo: 'necessidade', mesId: MES, valorPlanejado: 105000 });
  assert.equal(resumoMes(s, MES).faltaDistribuir, 1050000 - 105000);
  A.definirAlocacao(s, MES, t.id, { modo: 'percentual' });
  assert.equal(s.meses[MES].alocacoes[t.id].percentualPlanejado, 10);
  A.definirAlocacao(s, MES, t.id, { percentual: 50 });
  assert.equal(resumoMes(s, MES).faltaDistribuir, 1050000 - 525000);
  A.definirAlocacao(s, MES, t.id, { valor: 2000000 });
  assert.ok(resumoMes(s, MES).faltaDistribuir < 0, 'planejou mais que a renda');
});

test('salário novo vale do mês atual em diante; meses passados mantêm o histórico', () => {
  const s = base();
  A.garantirMes(s, '2026-09');
  A.garantirMes(s, '2026-11');
  A.definirRenda(s, s.usuarios[0].id, 'salarioLiquido', 800000, MES);
  assert.equal(rendaDoMes(s, '2026-09').total, 1050000);
  assert.equal(rendaDoMes(s, MES).total, 1250000);
  assert.equal(rendaDoMes(s, '2026-11').total, 1250000);
});

test('subtópicos: o pai vira grupo e passa alocação e transações ao primeiro filho', () => {
  const s = base();
  const p = A.criarTopico(s, { nome: 'Casa', tipo: 'necessidade', mesId: MES, valorPlanejado: 100000 });
  s.transacoes.push(novaTransacao({ data: '2026-10-05', descricao: 'x', valor: 3000, topicoId: p.id }));
  const f = A.criarTopico(s, { nome: 'Luz', topicoPai: p.id, mesId: MES });
  A.criarTopico(s, { nome: 'Água', topicoPai: p.id, mesId: MES, valorPlanejado: 20000 });
  const r = resumoMes(s, MES);
  assert.equal(r.porTopico[p.id].planejado, 120000);
  assert.equal(r.porTopico[f.id].planejado, 100000);
  assert.equal(r.porTopico[p.id].gasto, 3000);
  assert.equal(r.planejado, 120000);
});

test('mover dinheiro, reordenar e copiar planejamento do mês anterior', () => {
  const s = base();
  const a = A.criarTopico(s, { nome: 'Lazer', tipo: 'desejo', mesId: MES, valorPlanejado: 50000 });
  const b = A.criarTopico(s, { nome: 'Mercado', tipo: 'necessidade', mesId: MES, valorPlanejado: 80000 });
  assert.ok(A.moverDinheiro(s, MES, a.id, b.id, 10000));
  assert.equal(s.meses[MES].alocacoes[a.id].valorPlanejado, 40000);
  assert.equal(s.meses[MES].alocacoes[b.id].valorPlanejado, 90000);
  assert.ok(!A.moverDinheiro(s, MES, a.id, b.id, 999999), 'não move mais do que há');
  const c = A.criarTopico(s, { nome: 'Cinema', tipo: 'desejo', mesId: MES });
  assert.ok(A.reposicionarTopico(s, c.id, a.id));
  assert.ok(c.ordem < a.ordem);
  A.garantirMes(s, '2026-11');
  assert.equal(A.copiarPlanoAnterior(s, '2026-11'), MES);
  assert.equal(s.meses['2026-11'].alocacoes[b.id].valorPlanejado, 90000);
});

test('gasto/planejado só do mês selecionado; previstas não contam como gasto', () => {
  const s = base();
  const t = A.criarTopico(s, { nome: 'Mercado', tipo: 'necessidade', mesId: MES, valorPlanejado: 100000 });
  s.transacoes.push(novaTransacao({ data: '2026-10-05', descricao: 'a', valor: 12000, topicoId: t.id }));
  s.transacoes.push(novaTransacao({ data: '2026-11-05', descricao: 'b', valor: 99999, topicoId: t.id }));
  s.transacoes.push(novaTransacao({ data: '2026-10-20', descricao: 'c', valor: 5000, topicoId: t.id, status: 'prevista' }));
  const r = resumoMes(s, MES);
  assert.equal(r.porTopico[t.id].gasto, 12000);
  assert.equal(r.previstas, 5000);
  assert.equal(r.porTopico[t.id].disponivel, 88000);
});

test('persistência: snapshot -> estado preserva tudo; hidratação defensiva', () => {
  const s = base();
  A.criarTopico(s, { nome: 'X', mesId: MES, valorPlanejado: 1 });
  const volta = snapshotParaEstado(JSON.parse(JSON.stringify(montarSnapshot(s))));
  assert.deepEqual(volta.usuarios, s.usuarios);
  assert.deepEqual(volta.meses, s.meses);
  assert.equal(hidratar(null).usuarios.length, 0);
  assert.equal(hidratar({ usuarios: 'lixo', topicos: [{ id: 'a', tipo: 'xx' }] }).topicos[0].tipo, 'necessidade');
  assert.throws(() => snapshotParaEstado({ formato: 'outro' }));
});

function csvItens(nome) {
  const a = analisarCSV(new Uint8Array(fs.readFileSync(path.join(ex, 'csv', nome))));
  return converterLinhas(a.dados, { colunas: sugerirColunas(a), formatoData: a.formatoData, separadorDecimal: a.separadorDecimal, inverterSinal: false }).itens;
}

test('importar o mesmo CSV duas vezes gera aviso de duplicatas', () => {
  const s = base();
  const mercado = A.criarTopico(s, { nome: 'Mercado', mesId: MES });
  s.regras.push({ id: 'r1', palavraChave: 'SUPERMERCADO', topicoId: mercado.id, usuarioId: null });
  const itens = csvItens('extrato-banco-a-latin1.csv');
  const l1 = prepararLinhasCSV(s, itens);
  assert.equal(l1.filter((l) => l.duplicata).length, 0);
  assert.equal(l1.find((l) => /SUPERMERCADO/.test(l.descricao)).topicoId, mercado.id, 'regra aplicada');
  assert.equal(l1.find((l) => /Padaria/.test(l.descricao)).topicoId, null, 'sem regra = não categorizado');
  const r = confirmarImportacao(s, { origem: 'csv', linhas: l1 });
  assert.equal(r.importadas, 8);
  const l2 = prepararLinhasCSV(s, itens);
  assert.equal(l2.filter((l) => l.duplicata === 'exata').length, 8);
  assert.ok(l2.every((l) => !l.sel), 'duplicatas começam desmarcadas');
  assert.equal(confirmarImportacao(s, { origem: 'csv', linhas: l2 }).importadas, 0);
});

test('linhas idênticas no mesmo arquivo não são confundidas com duplicata', () => {
  const s = base();
  const it = { data: '2026-10-01', descricao: 'CAFE', valor: 500, tipo: 'saida' };
  const l = prepararLinhasCSV(s, [it, it, it]);
  assert.equal(new Set(l.map((x) => x.hash)).size, 3);
  confirmarImportacao(s, { origem: 'csv', linhas: l });
  assert.equal(prepararLinhasCSV(s, [it, it, it]).filter((x) => x.duplicata === 'exata').length, 3);
  assert.equal(prepararLinhasCSV(s, [it, it, it, it]).filter((x) => x.duplicata === 'exata').length, 3, 'a 4ª é nova');
});

function importarFatura(s, nome) {
  const linhas = fs.readFileSync(path.join(ex, 'faturas', nome + '.txt'), 'utf8').split('\n');
  const i = interpretarFatura(linhas);
  const associacoes = {};
  cartoesNovos(s, i.resultado).forEach((f) => { associacoes[f] = s.usuarios[0].id; });
  const l = prepararLinhasPDF(s, i.resultado, associacoes);
  const fatura = { banco: i.resultado.banco, dataFechamento: i.resultado.dataFechamento, dataVencimento: i.resultado.dataVencimento, totalFatura: i.resultado.totalFatura, totalExtraido: i.validacao.totalExtraido, validada: i.validacao.bateu };
  return confirmarImportacao(s, { origem: 'pdf', linhas: l, fatura, futuras: i.resultado.futuras, associacoes, texto: linhas.join('\n') });
}

test('parcelas: projeta previstas e a parcela real da fatura seguinte substitui a prevista (sem duplicar)', () => {
  const s = base();
  const r1 = importarFatura(s, 'itau-2026-10');
  const ml = () => s.transacoes.filter((t) => /MERCADO LIVRE/.test(t.descricao));
  assert.equal(ml().length, 8, 'k=3 real + 4..10 previstas');
  assert.equal(ml().find((t) => t.parcelaAtual === 3).status, 'realizada');
  assert.equal(ml().find((t) => t.parcelaAtual === 4).status, 'prevista');
  assert.equal(ml().find((t) => t.parcelaAtual === 4).data, '2026-10-15');
  assert.equal(s.transacoes.filter((t) => /CASAS BAHIA/.test(t.descricao)).length, 6);
  assert.ok(r1.parcelas.criadas > 0);

  importarFatura(s, 'itau-2026-11');
  assert.equal(ml().length, 8, 'não duplicou');
  assert.equal(ml().find((t) => t.parcelaAtual === 4).status, 'realizada');
  assert.equal(ml().filter((t) => t.status === 'prevista').length, 6);
  const chaves = s.transacoes.filter((t) => t.parcelaTotal).map(chaveParcela);
  assert.equal(new Set(chaves).size, chaves.length, 'cada parcela aparece uma vez');
  assert.equal(s.transacoes.find((t) => /CASAS BAHIA/.test(t.descricao) && t.parcelaAtual === 2).status, 'realizada');
});

test('cartão: só 4 últimos dígitos; texto guardado só da última fatura do banco e mascarado', () => {
  const s = base();
  importarFatura(s, 'itau-2026-10');
  assert.deepEqual(s.cartoes.map((c) => c.finalCartao).sort(), ['1234', '5678']);
  assert.ok(s.cartoes.every((c) => /^\d{4}$/.test(c.finalCartao)));
  importarFatura(s, 'itau-2026-11');
  const comTexto = s.faturas.filter((f) => f.banco === 'itau' && f.textoExtraido);
  assert.equal(comTexto.length, 1);
  assert.equal(comTexto[0].dataFechamento, '2026-11-03');
  assert.ok(!/123\.456\.789/.test(comTexto[0].textoExtraido) && !/MARIA DE SOUZA/.test(comTexto[0].textoExtraido));
  assert.equal(s.faturas.length, 2);
  assert.ok(s.faturas.every((f) => f.validada));
});

test('mesma fatura importada duas vezes: nada é duplicado', () => {
  const s = base();
  importarFatura(s, 'nubank-2027-01');
  const n = s.transacoes.length;
  const r = importarFatura(s, 'nubank-2027-01');
  assert.equal(r.importadas, 0);
  assert.equal(s.transacoes.length, n);
});

test('IOF solto vira transação com tópico sugerido Tarifas/IOF', () => {
  const s = base();
  const iof = A.criarTopico(s, { nome: 'Tarifas/IOF', mesId: MES });
  importarFatura(s, 'nubank-2027-01');
  assert.equal(s.transacoes.find((t) => /IOF de compra/.test(t.descricao)).topicoId, iof.id);
});
