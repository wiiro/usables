import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analisarCSV, decodificar, detectarDelimitador, parseCSV } from '../js/csv/leitor.js';
import { sugerirColunas, converterLinhas, assinaturaLayout } from '../js/csv/mapeamento.js';

const ex = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'exemplos', 'csv');
const ler = (n) => new Uint8Array(fs.readFileSync(path.join(ex, n)));

function importar(nome, ajustes = {}) {
  const a = analisarCSV(ler(nome));
  const colunas = sugerirColunas(a);
  return { a, colunas, ...converterLinhas(a.dados, { colunas, formatoData: a.formatoData, separadorDecimal: a.separadorDecimal, inverterSinal: false, ...ajustes }) };
}

test('CSV ";" + vírgula decimal + dd/mm/aaaa (Latin-1) sem erros e com acentos corretos', () => {
  const { a, itens, erros } = importar('extrato-banco-a-latin1.csv');
  assert.equal(a.delimitador, ';');
  assert.equal(a.encoding, 'windows-1252');
  assert.equal(a.separadorDecimal, ',');
  assert.equal(a.formatoData, 'dd/mm/aaaa');
  assert.equal(erros.length, 0);
  assert.equal(itens.length, 8);
  assert.ok(itens.some((i) => i.descricao === 'Padaria São João'), 'acentos');
  assert.ok(itens.some((i) => i.descricao === 'Farmácia Saúde'));
  const sal = itens.find((i) => /SALARIO/.test(i.descricao));
  assert.deepEqual([sal.tipo, sal.valor, sal.data], ['entrada', 523045, '2026-10-01']);
  assert.equal(itens.find((i) => /FATURA/.test(i.descricao)).valor, 110884);
});

test('CSV com colunas separadas de débito e crédito (vírgula, ISO, ponto decimal, aspas)', () => {
  const { a, colunas, itens, erros } = importar('extrato-banco-b-debito-credito.csv');
  assert.equal(a.delimitador, ',');
  assert.equal(a.encoding, 'utf-8');
  assert.equal(a.separadorDecimal, '.');
  assert.equal(a.formatoData, 'aaaa-mm-dd');
  assert.ok(colunas.debito >= 0 && colunas.credito >= 0 && colunas.valor === -1, JSON.stringify(colunas));
  assert.equal(erros.length, 0);
  assert.equal(itens.length, 7);
  assert.ok(itens.some((i) => i.descricao === 'MERCADO, ESTRELA'));
  assert.ok(itens.some((i) => i.descricao === 'Posto "Ipiranga"'));
  assert.equal(itens.find((i) => i.descricao === 'Estorno Netflix').tipo, 'entrada');
  assert.equal(itens.find((i) => i.descricao === 'Netflix').tipo, 'saida');
});

test('inverter sinal troca entradas e saídas', () => {
  const normal = importar('extrato-banco-a-latin1.csv').itens;
  const inv = importar('extrato-banco-a-latin1.csv', { inverterSinal: true }).itens;
  assert.equal(normal.find((i) => /SALARIO/.test(i.descricao)).tipo, 'entrada');
  assert.equal(inv.find((i) => /SALARIO/.test(i.descricao)).tipo, 'saida');
});

test('detecção de encoding, delimitador e aspas', () => {
  assert.equal(decodificar(new Uint8Array([0x53, 0xe3, 0x6f])).encoding, 'windows-1252');
  assert.equal(decodificar(new TextEncoder().encode('São')).encoding, 'utf-8');
  assert.equal(detectarDelimitador('a;b;c\n1,5;2;3\n4,5;5;6'), ';');
  assert.equal(detectarDelimitador('a,b,c\n"1,5",2,3\n4,5,6'), ',');
  assert.deepEqual(parseCSV('a;"x;y";c\r\n1;2;3', ';'), [['a', 'x;y', 'c'], ['1', '2', '3']]);
});

test('assinatura do layout permite reaproveitar o mapeamento salvo', () => {
  const a1 = analisarCSV(ler('extrato-banco-a-latin1.csv'));
  const a2 = analisarCSV(ler('extrato-banco-a-latin1.csv'));
  assert.equal(assinaturaLayout(a1), assinaturaLayout(a2));
});
