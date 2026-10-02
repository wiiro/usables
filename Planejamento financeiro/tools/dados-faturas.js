/* Faturas FICTÍCIAS (nomes, CPFs e cartões inventados) usadas só para testar a
   infraestrutura. NÃO provam que o layout real do Itaú/Nubank é este.
   Cada linha usa TAB entre colunas (no PDF viram posições x; no .txt viram 2 espaços). */

const T = '\t';

export const FATURAS = [
  {
    id: 'itau-2026-10',
    banco: 'itau',
    linhas: [
      'ITAÚ UNIBANCO S.A.',
      'itaucard Visa Platinum',
      'Titular: MARIA DE SOUZA SILVA' + T + 'CPF 123.456.789-00',
      'Vencimento: 10/10/2026',
      'Data de fechamento: 03/10/2026',
      'Total desta fatura' + T + 'R$ 1.108,84',
      'Pagamento mínimo' + T + 'R$ 166,33',
      'Pagamentos e créditos',
      '10/09' + T + 'PAGAMENTO EFETUADO' + T + '-1.200,00',
      'Lançamentos: compras e saques',
      'MARIA DE SOUZA SILVA - cartão final 1234',
      '05/09' + T + 'PADARIA SAO JOAO' + T + '45,90',
      '12/09' + T + 'SUPERMERCADO ESTRELA' + T + '312,45',
      '15/09' + T + 'MERCADO LIVRE 03/10' + T + '150,00',
      '20/09' + T + 'UBER *TRIP' + T + '23,90',
      '25/09' + T + 'FARMACIA SAUDE' + T + '89,90',
      '28/09' + T + 'ESTORNO LOJA XYZ' + T + '-35,00',
      '30/09' + T + 'CASAS BAHIA 01/06' + T + '199,90',
      'Total dos lançamentos no cartão final 1234' + T + 'R$ 787,05',
      'JOAO PEDRO SILVA (adicional) - cartão final 5678',
      '02/09' + T + 'POSTO IPIRANGA' + T + '210,00',
      '10/09' + T + 'NETFLIX.COM' + T + '55,90',
      'Total dos lançamentos no cartão final 5678' + T + 'R$ 265,90',
      'Lançamentos internacionais',
      'MARIA DE SOUZA SILVA - cartão final 1234',
      '18/09' + T + 'AMAZON US' + T + 'USD 10,00 5,40 54,00',
      '18/09' + T + 'IOF COMPRA INTERNACIONAL' + T + '1,89',
      'Total dos lançamentos no cartão final 1234' + T + 'R$ 55,89',
      'Compras parceladas - próximas faturas',
      'MERCADO LIVRE 04/10' + T + '150,00',
      'MERCADO LIVRE 05/10' + T + '150,00',
      'CASAS BAHIA 02/06' + T + '199,90',
      'CASAS BAHIA 03/06' + T + '199,90',
      'Em caso de dúvidas ligue 4004 4828'
    ],
    esperado: { banco: 'itau', totalFatura: 110884, nTransacoes: 10, somaTransacoes: 110884, bateu: true, dataFechamento: '2026-10-03', dataVencimento: '2026-10-10', futuras: 4, parcelas: [{ descricao: 'MERCADO LIVRE', atual: 3, total: 10 }, { descricao: 'CASAS BAHIA', atual: 1, total: 6 }], internacional: { moeda: 'USD', valorOriginal: 1000, iof: 189 } }
  },
  {
    id: 'itau-2026-11',
    banco: 'itau',
    linhas: [
      'ITAÚ UNIBANCO S.A.',
      'itaucard Visa Platinum',
      'Titular: MARIA DE SOUZA SILVA' + T + 'CPF 123.456.789-00',
      'Vencimento: 10/11/2026',
      'Data de fechamento: 03/11/2026',
      'Total desta fatura' + T + 'R$ 751,30',
      'Pagamentos e créditos',
      '10/10' + T + 'PAGAMENTO EFETUADO' + T + '-1.108,84',
      'Lançamentos: compras e saques',
      'MARIA DE SOUZA SILVA - cartão final 1234',
      '03/10' + T + 'PADARIA SAO JOAO' + T + '38,40',
      '10/10' + T + 'SUPERMERCADO ESTRELA' + T + '276,10',
      '15/10' + T + 'MERCADO LIVRE 04/10' + T + '150,00',
      '22/10' + T + 'UBER *TRIP' + T + '31,00',
      '30/10' + T + 'CASAS BAHIA 02/06' + T + '199,90',
      'Total dos lançamentos no cartão final 1234' + T + 'R$ 695,40',
      'JOAO PEDRO SILVA (adicional) - cartão final 5678',
      '05/10' + T + 'NETFLIX.COM' + T + '55,90',
      'Total dos lançamentos no cartão final 5678' + T + 'R$ 55,90',
      'Compras parceladas - próximas faturas',
      'MERCADO LIVRE 05/10' + T + '150,00',
      'CASAS BAHIA 03/06' + T + '199,90'
    ],
    esperado: { banco: 'itau', totalFatura: 75130, nTransacoes: 6, somaTransacoes: 75130, bateu: true, dataFechamento: '2026-11-03', dataVencimento: '2026-11-10', futuras: 2 }
  },
  {
    id: 'nubank-2027-01',
    banco: 'nubank',
    linhas: [
      'Nu Pagamentos S.A. - Nubank',
      'Olá, Maria. Esta é a sua fatura de janeiro.',
      'Fatura fecha em 15 JAN',
      'Data de vencimento: 22 JAN 2027',
      'Total a pagar' + T + 'R$ 413,49',
      'TRANSAÇÕES DE 16 DEZ A 15 JAN',
      '17 DEZ' + T + 'Mercado Bom Preço' + T + 'R$ 210,30',
      '20 DEZ' + T + 'Magazine Luiza - Parcela 3/10' + T + 'R$ 89,90',
      '28 DEZ' + T + 'Uber *Trip' + T + 'R$ 18,40',
      '02 JAN' + T + 'Spotify' + T + 'R$ 21,90',
      '05 JAN' + T + 'Amazon US' + T + 'R$ 54,00',
      'USD 10,00 · Cotação R$ 5,40',
      'IOF de R$ 1,89',
      '06 JAN' + T + 'IOF de compra internacional' + T + 'R$ 3,00',
      '08 JAN' + T + '•••• 4321 Padaria São João' + T + 'R$ 32,50',
      '10 JAN' + T + 'Estorno Uber' + T + '−R$ 18,40',
      '12 JAN' + T + 'Pagamento recebido' + T + '−R$ 1.500,00'
    ],
    esperado: { banco: 'nubank', totalFatura: 41349, nTransacoes: 8, somaTransacoes: 41349, bateu: true, dataFechamento: '2027-01-15', dataVencimento: '2027-01-22', parcelas: [{ descricao: 'Magazine Luiza', atual: 3, total: 10 }], internacional: { moeda: 'USD', valorOriginal: 1000, iof: 189 }, datas: { 'Mercado Bom Preço': '2026-12-17', Spotify: '2027-01-02' } }
  },
  {
    id: 'generico-duas-colunas',
    banco: 'outro',
    colunas: true,
    cabecalho: [
      'BANCO EXEMPLO - FATURA DO CARTÃO',
      'Vencimento: 15/11/2026',
      'Fechamento: 08/11/2026',
      'Total da fatura R$ 456,70',
      'Lançamentos do período de 09/10/2026 até 08/11/2026 conforme descrito abaixo para conferência do cliente'
    ],
    esquerda: [
      '02/10' + T + 'ACADEMIA FIT' + T + '99,90',
      '05/10' + T + 'LIVRARIA CULTURA' + T + '74,80',
      '09/10' + T + 'RESTAURANTE SABOR' + T + '65,00',
      '12/10' + T + 'CINEMA CENTER' + T + '48,00',
      '15/10' + T + 'PET SHOP AMIGO' + T + '82,00'
    ],
    direita: [
      '18/10' + T + 'FARMACIA SAUDE' + T + '23,50',
      '21/10' + T + 'MERCADO BOM' + T + '45,00',
      '25/10' + T + 'POSTO SHELL' + T + '18,50'
    ],
    esperado: { banco: 'outro', totalFatura: 45670, nTransacoes: 8, somaTransacoes: 45670, bateu: true, dataFechamento: '2026-11-08', dataVencimento: '2026-11-15' }
  }
];

// linhas lógicas (ordem de leitura) das faturas de duas colunas
export function linhasLogicas(f) {
  return f.colunas ? [...f.cabecalho, ...f.esquerda, ...f.direita] : f.linhas;
}

/** PDFs de exemplo: arquivo, fatura de origem e variação. */
export const PDFS = [
  { arquivo: 'itau-2026-10-digital.pdf', fatura: 'itau-2026-10' },
  { arquivo: 'itau-2026-11-digital.pdf', fatura: 'itau-2026-11' },
  { arquivo: 'itau-2026-10-com-senha.pdf', fatura: 'itau-2026-10', senha: '12345' },
  { arquivo: 'nubank-2027-01-digital.pdf', fatura: 'nubank-2027-01' },
  { arquivo: 'nubank-2027-01-escaneado.pdf', fatura: 'nubank-2027-01', escaneado: true },
  { arquivo: 'generico-duas-colunas.pdf', fatura: 'generico-duas-colunas' }
];
