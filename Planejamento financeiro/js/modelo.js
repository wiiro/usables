/* Modelo de dados — FONTE DA VERDADE (mesma função do state.js do Template).

   Usuario    { id, nome, cor, salarioLiquido, outrasRendas }                     (centavos)
   Topico     { id, nome, cor, icone, tipo: necessidade|desejo|poupanca,
                topicoPai (id|null), ordem }
   MesRef     meses['AAAA-MM'] = { id, alocacoes: { [topicoId]: Alocacao },
                                   rendas: { [usuarioId]: { salarioLiquido, outrasRendas } } }
   Alocacao   { modoAlocacao: valorFixo|percentual, valorPlanejado (centavos),
                percentualPlanejado (número, ex. 12.5) }
              -> o planejamento é POR MÊS (permite copiar o mês anterior); o Topico guarda só
                 identidade (nome, cor, tipo, hierarquia).
   Transacao  { id, data 'AAAA-MM-DD', descricao, valor (centavos; saída positiva = gasto,
                negativa = estorno), tipo: entrada|saida, topicoId|null, usuarioId|null,
                origem: manual|csv|pdf, idImportacao, hash, parcelaAtual, parcelaTotal,
                moedaOriginal, valorOriginal, iof, finalCartao, status: realizada|prevista,
                chaveParcela? }
   Cartao     { id, banco: itau|nubank|outro, finalCartao (4 dígitos), usuarioId, apelido,
                diaFechamento, diaVencimento }       (nunca o número completo)
   Fatura     { id, banco, cartaoId, dataFechamento, dataVencimento, totalFatura, totalExtraido,
                validada, idImportacao, textoExtraido }   (texto só da última fatura de cada banco)
   Regra      { id, palavraChave, topicoId, usuarioId|null }
   MapeamentoCSV { id, nomeBanco, delimitador, encoding, formatoData, separadorDecimal,
                colunas: { data, descricao, valor | debito+credito }, inverterSinal, assinatura }
   Preferencias { tema: claro|escuro|sistema, referencia503020: bool }

   Armazenamento: IndexedDB com 3 stores — 'estado' (tudo, exceto as duas listas abaixo),
   'transacoes' e 'faturas' —, espelhado em data/estado.json pelo servidor local. */

export const VERSAO = 1;
export const FORMATO = 'planejamento-financeiro';

export const TIPOS_TOPICO = {
  necessidade: { nome: 'Necessidades', ref: 50 },
  desejo: { nome: 'Desejos', ref: 30 },
  poupanca: { nome: 'Poupança e investimentos', ref: 20 }
};

export function seedEstado() {
  return {
    versao: VERSAO,
    onboardingConcluido: false,
    usuarios: [],
    topicos: [],
    cartoes: [],
    regras: [],
    mapeamentos: [],
    meses: {},
    preferencias: { tema: 'sistema', referencia503020: false },
    transacoes: [],
    faturas: []
  };
}

const arr = (v) => (Array.isArray(v) ? v : []);
const int = (v, padrao = 0) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : padrao);

/** Hidratação defensiva: aceita dados antigos/incompletos e devolve um estado válido. */
export function hidratar(bruto) {
  const s = seedEstado();
  if (!bruto || typeof bruto !== 'object') return s;
  s.onboardingConcluido = !!bruto.onboardingConcluido;
  s.usuarios = arr(bruto.usuarios).filter((u) => u && u.id).map((u) => ({
    id: u.id, nome: String(u.nome || 'Pessoa'), cor: u.cor || '#4f7cac',
    salarioLiquido: int(u.salarioLiquido), outrasRendas: int(u.outrasRendas)
  }));
  s.topicos = arr(bruto.topicos).filter((t) => t && t.id).map((t, i) => ({
    id: t.id, nome: String(t.nome || 'Tópico'), cor: t.cor || '#8d99ae', icone: t.icone || '',
    tipo: ['necessidade', 'desejo', 'poupanca'].includes(t.tipo) ? t.tipo : 'necessidade',
    topicoPai: t.topicoPai || null, ordem: Number.isFinite(t.ordem) ? t.ordem : i
  }));
  s.cartoes = arr(bruto.cartoes).filter((c) => c && c.id);
  s.regras = arr(bruto.regras).filter((r) => r && r.id && r.palavraChave);
  s.mapeamentos = arr(bruto.mapeamentos).filter((m) => m && m.id);
  s.meses = {};
  Object.keys(bruto.meses || {}).forEach((k) => {
    const m = bruto.meses[k] || {};
    s.meses[k] = { id: k, alocacoes: m.alocacoes || {}, rendas: m.rendas || {} };
  });
  const p = bruto.preferencias || {};
  s.preferencias = {
    tema: ['claro', 'escuro', 'sistema'].includes(p.tema) ? p.tema : 'sistema',
    referencia503020: !!p.referencia503020
  };
  s.transacoes = arr(bruto.transacoes).filter((t) => t && t.id);
  s.faturas = arr(bruto.faturas).filter((f) => f && f.id);
  return s;
}

/** Parte do estado que vai no store 'estado' (tudo menos as listas grandes). */
export function parteEstado(s) {
  const { transacoes, faturas, ...resto } = s;
  return resto;
}

/** Arquivo/backup JSON completo (formato de data/estado.json e de "exportar"). */
export function montarSnapshot(s, agora = new Date()) {
  return { formato: FORMATO, versao: VERSAO, salvoEm: agora.toISOString(), estado: parteEstado(s), transacoes: s.transacoes, faturas: s.faturas };
}

/** Valida e converte um snapshot em estado hidratado. Lança Error com mensagem legível. */
export function snapshotParaEstado(obj) {
  if (!obj || obj.formato !== FORMATO) throw new Error('Este arquivo não é um backup do Planejamento financeiro.');
  if (Number(obj.versao) > VERSAO) throw new Error('Backup de uma versão mais nova do app.');
  return hidratar({ ...obj.estado, transacoes: obj.transacoes, faturas: obj.faturas });
}
