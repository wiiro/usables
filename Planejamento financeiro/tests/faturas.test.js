/* Lê TODOS os .txt de exemplos/faturas. Para adicionar uma fatura real calibrada:
   salve o "texto mascarado" como exemplos/faturas/<nome>.txt (e, se quiser verificação
   estrita, um <nome>.esperado.json com banco, totalFatura, nTransacoes...). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { interpretarFatura } from '../js/pdf/interpretar.js';

const pasta = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'exemplos', 'faturas');
const arquivos = fs.readdirSync(pasta).filter((n) => n.endsWith('.txt'));

arquivos.forEach((nome) => {
  const base = nome.replace(/\.txt$/, '');
  const esperadoPath = path.join(pasta, base + '.esperado.json');
  const esperado = fs.existsSync(esperadoPath) ? JSON.parse(fs.readFileSync(esperadoPath, 'utf8')) : null;

  test('fatura ' + base, () => {
    const linhas = fs.readFileSync(path.join(pasta, nome), 'utf8').split(/\r?\n/);
    const r = interpretarFatura(linhas);
    assert.ok(r.ok, 'interpretação falhou: ' + r.avisos.join(' | '));
    assert.ok(r.resultado.transacoes.length > 0, 'nenhuma transação extraída');
    if (!esperado) {
      // Fatura sem .esperado.json (ex.: real, ainda em calibração): só diagnóstico, sem falhar o teste.
      const v = r.validacao;
      console.log('  [sem .esperado.json] ' + base + ': banco=' + r.resultado.banco + ', transações=' + r.resultado.transacoes.length + ', ' + v.mensagem + ', suspeitas=' + r.resultado.suspeitas.length);
      return;
    }
    const res = r.resultado;
    assert.equal(res.banco, esperado.banco, 'banco');
    assert.equal(res.totalFatura, esperado.totalFatura, 'total da fatura');
    assert.equal(res.transacoes.length, esperado.nTransacoes, 'nº de transações');
    assert.equal(r.validacao.totalExtraido, esperado.somaTransacoes, 'soma extraída');
    assert.equal(r.validacao.bateu, esperado.bateu, 'validação do total');
    assert.equal(res.dataFechamento, esperado.dataFechamento);
    assert.equal(res.dataVencimento, esperado.dataVencimento);
    assert.equal(res.suspeitas.length, 0, 'linhas suspeitas: ' + res.suspeitas.join(' | '));
    if (esperado.futuras !== undefined) assert.equal(res.futuras.length, esperado.futuras, 'parcelas futuras');
    (esperado.parcelas || []).forEach((p) => {
      const t = res.transacoes.find((x) => x.descricao.toUpperCase() === p.descricao.toUpperCase());
      assert.ok(t, 'parcela ' + p.descricao);
      assert.equal(t.parcelaAtual, p.atual); assert.equal(t.parcelaTotal, p.total);
    });
    if (esperado.internacional) {
      const t = res.transacoes.find((x) => x.moedaOriginal);
      assert.ok(t, 'compra internacional');
      assert.equal(t.moedaOriginal, esperado.internacional.moeda);
      assert.equal(t.valorOriginal, esperado.internacional.valorOriginal);
      assert.equal(t.iof, esperado.internacional.iof);
    }
    Object.entries(esperado.datas || {}).forEach(([desc, iso]) => {
      assert.equal(res.transacoes.find((x) => x.descricao === desc).data, iso, 'data de ' + desc);
    });
    res.transacoes.forEach((t) => assert.match(t.data, /^\d{4}-\d{2}-\d{2}$/));
  });
});
