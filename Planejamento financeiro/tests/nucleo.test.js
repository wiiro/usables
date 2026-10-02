import test from 'node:test';
import assert from 'node:assert/strict';
import { brl, parseValor, parsePercentual } from '../js/format.js';
import { addMeses, addMesesData, inferirAno, parseDataTexto } from '../js/datas.js';
import { resolverData, parseValorBR, ehLinhaIgnorada } from '../js/pdf/parsers/comum.js';
import { detectarParcela, descricaoBase } from '../js/domain/parcelas.js';
import { sugerirPalavraChave, aplicarRegras } from '../js/domain/regras.js';
import { mascararTexto } from '../js/pdf/mascarar.js';
import { montarLinhas, linhasDaPagina } from '../js/pdf/linhas.js';

test('formato brasileiro de valores e parse', () => {
  assert.equal(brl(123456), 'R$ 1.234,56');
  assert.equal(brl(-5), '-R$ 0,05');
  assert.equal(parseValor('1.234,56'), 123456);
  assert.equal(parseValor('R$ 10'), 1000);
  assert.equal(parseValor('12.5'), 1250);
  assert.equal(parseValor('-3,5'), -350);
  assert.equal(parseValor('abc'), null);
  assert.equal(parsePercentual('12,5%'), 12.5);
});

test('datas: virada de ano e meses', () => {
  assert.equal(addMeses('2026-12', 1), '2027-01');
  assert.equal(addMeses('2026-01', -1), '2025-12');
  assert.equal(addMesesData('2026-01-31', 1), '2026-02-28');
  assert.equal(inferirAno(28, 12, '2027-01-15'), 2026);
  assert.equal(inferirAno(2, 1, '2027-01-15'), 2027);
  assert.equal(parseDataTexto('15/10/2026'), '2026-10-15');
  assert.equal(parseDataTexto('2026-10-15'), '2026-10-15');
  assert.equal(parseDataTexto('31/02/2026'), null);
});

test('datas "15 OUT" e "15/10" convertidas, inclusive na virada do ano', () => {
  assert.equal(resolverData('15 OUT', '2026-10-20'), '2026-10-15');
  assert.equal(resolverData('15/10', '2026-10-20'), '2026-10-15');
  assert.equal(resolverData('28 DEZ', '2027-01-15'), '2026-12-28');
  assert.equal(resolverData('28/12', '2027-01-15'), '2026-12-28');
  assert.equal(resolverData('02 JAN', '2027-01-15'), '2027-01-02');
  assert.equal(resolverData('15 OUT 2025', '2026-10-20'), '2025-10-15');
});

test('valores da fatura: formato BR, estorno e CR', () => {
  assert.equal(parseValorBR('1.234,56'), 123456);
  assert.equal(parseValorBR('-R$ 50,00'), -5000);
  assert.equal(parseValorBR('50,00-'), -5000);
  assert.equal(parseValorBR('50,00 CR'), -5000);
  assert.ok(ehLinhaIgnorada('Pagamento recebido'));
  assert.ok(ehLinhaIgnorada('SALDO ANTERIOR'));
  assert.ok(ehLinhaIgnorada('Total da fatura anterior'));
  assert.ok(!ehLinhaIgnorada('PADARIA SAO JOAO'));
});

test('parcelas: 03/10, PARC 03/10, Parcela 3/10', () => {
  assert.deepEqual(detectarParcela('MERCADO LIVRE 03/10'), { atual: 3, total: 10, descricao: 'MERCADO LIVRE' });
  assert.equal(detectarParcela('LOJA PARC 03/10').atual, 3);
  assert.equal(detectarParcela('Magazine Luiza - Parcela 3/10').descricao, 'Magazine Luiza');
  assert.equal(detectarParcela('COMPRA 13/10'), null); // 13 de 10 é inválido
  assert.equal(detectarParcela('PADARIA SAO JOAO'), null);
  assert.equal(descricaoBase('MERCADO LIVRE 03/10'), descricaoBase('Mercado Livre PARC 04/10'));
});

test('regras de categorização', () => {
  assert.equal(sugerirPalavraChave('PIX ENVIADO UBER *TRIP 123'), 'UBER');
  const regras = [{ id: 1, palavraChave: 'UBER', topicoId: 'T', usuarioId: null }, { id: 2, palavraChave: 'UBER EATS', topicoId: 'R', usuarioId: null }];
  assert.equal(aplicarRegras('Uber Eats pedido', null, regras).topicoId, 'R');
  assert.equal(aplicarRegras('Padaria', null, regras), null);
});

test('texto mascarado: remove CPF, nome e número de cartão (mantém os 4 últimos)', () => {
  const txt = 'Titular: MARIA DE SOUZA SILVA  CPF 123.456.789-00\nCartão 4111 1111 1111 5678\nMARIA DE SOUZA SILVA - cartão final 1234\nOlá, Maria. cpf 12345678900 email a@b.com\n15/09 PADARIA 45,90';
  const { texto } = mascararTexto(txt, { nomes: ['Maria de Souza Silva'] });
  assert.ok(!/123\.456\.789/.test(texto) && !/12345678900/.test(texto), 'CPF: ' + texto);
  assert.ok(!/MARIA DE SOUZA/i.test(texto), 'nome');
  assert.ok(!/4111 1111/.test(texto) && texto.includes('5678'), 'cartão');
  assert.ok(texto.includes('final 1234') && texto.includes('45,90'));
  assert.ok(!/a@b\.com/.test(texto));
  assert.ok(!/Olá, Maria/.test(texto));
});

test('linhas por coordenadas: junta itens da mesma linha na ordem x', () => {
  const it = (str, x, y, w) => ({ str, x, y, w, h: 10 });
  const l = montarLinhas([it('45,90', 500, 700, 30), it('15/09', 40, 700.4, 25), it('PADARIA', 100, 699.8, 40), it('OUTRA', 40, 680, 40)]);
  assert.deepEqual(l, ['15/09  PADARIA  45,90', 'OUTRA']);
});

test('duas colunas: lê a esquerda inteira e depois a direita', () => {
  const itens = [];
  const linha = (x, y, a, b, c) => { itens.push({ str: a, x, y, w: 25, h: 10 }, { str: b, x: x + 40, y, w: 70, h: 10 }, { str: c, x: x + 150, y, w: 30, h: 10 }); };
  for (let i = 0; i < 4; i++) { linha(40, 700 - i * 20, '0' + (i + 1) + '/10', 'LOJA ESQ ' + i, '10,0' + i); linha(320, 700 - i * 20, '2' + i + '/10', 'LOJA DIR ' + i, '20,0' + i); }
  const ls = linhasDaPagina(itens, 595);
  assert.equal(ls.length, 8);
  assert.ok(ls[0].includes('ESQ 0') && ls[3].includes('ESQ 3') && ls[4].includes('DIR 0') && ls[7].includes('DIR 3'));
});

test('tabela comum (descrição + valores à direita) NÃO é tratada como duas colunas', () => {
  const itens = [];
  for (let i = 0; i < 8; i++) itens.push({ str: '0' + i + '/09 LOJA ' + i, x: 40, y: 700 - i * 15, w: 120, h: 10 }, { str: '10,0' + i, x: 500, y: 700 - i * 15, w: 30, h: 10 });
  const ls = linhasDaPagina(itens, 595);
  assert.equal(ls.length, 8);
  assert.ok(/LOJA 0\s+10,00/.test(ls[0]));
});

test('duas colunas com tabela interna (coordenadas reais do PDF de exemplo)', () => {
  const dados = [['BANCO EXEMPLO - FATURA DO CARTÃO', 40, 785, 194], ['Total da fatura R$ 456,70', 40, 737, 112], ['Lançamentos do período de 09/10/2026 até 08/11/2026 conforme descrito abaixo para conferência do cliente', 40, 721, 484],
    ['02/10', 40, 693, 25], ['ACADEMIA FIT', 102, 693, 70], ['99,90', 255, 693, 25], ['05/10', 40, 677, 25], ['LIVRARIA CULTURA', 102, 677, 94], ['74,80', 255, 677, 25],
    ['09/10', 40, 661, 25], ['RESTAURANTE SABOR', 102, 661, 111], ['65,00', 255, 661, 25], ['12/10', 40, 645, 25], ['CINEMA CENTER', 102, 645, 83], ['48,00', 255, 645, 25],
    ['18/10', 320, 693, 25], ['FARMACIA SAUDE', 382, 693, 87], ['23,50', 530, 693, 25], ['21/10', 320, 677, 25], ['MERCADO BOM', 382, 677, 77], ['45,00', 530, 677, 25],
    ['25/10', 320, 661, 25], ['POSTO SHELL', 382, 661, 69], ['18,50', 530, 661, 25]];
  const itens = dados.map(([str, x, y, w]) => ({ str, x, y, w, h: 10 }));
  const ls = linhasDaPagina(itens, 595.28);
  assert.ok(ls.indexOf('02/10  ACADEMIA FIT  99,90') > ls.indexOf('Lançamentos do período de 09/10/2026 até 08/11/2026 conforme descrito abaixo para conferência do cliente'));
  assert.ok(ls.includes('12/10  CINEMA CENTER  48,00'), ls.join(' | '));
  assert.ok(ls.indexOf('12/10  CINEMA CENTER  48,00') < ls.indexOf('18/10  FARMACIA SAUDE  23,50'), 'esquerda inteira antes da direita');
});

test('percentuais que somam 100% somam exatamente a renda (sem sobrar centavo)', async () => {
  const { seedEstado } = await import('../js/modelo.js');
  const A = await import('../js/domain/acoes.js');
  const { resumoMes } = await import('../js/domain/orcamento.js');
  const s = seedEstado();
  A.criarUsuario(s, { nome: 'Ana', salarioLiquido: 600000 });
  A.criarUsuario(s, { nome: 'Bia', salarioLiquido: 400050 });
  A.garantirMes(s, '2026-10');
  A.aplicarTopicosSugeridos(s, A.TOPICOS_SUGERIDOS, '2026-10');
  const r = resumoMes(s, '2026-10');
  assert.equal(r.renda, 1000050);
  assert.equal(r.planejado, 1000050);
  assert.equal(r.faltaDistribuir, 0);
});
