# Planejamento financeiro

Site de planejamento financeiro pessoal/familiar, **100% local**: nada é enviado para a internet e nenhuma biblioteca, fonte ou ícone vem de CDN (tudo em `vendor/`; funciona offline).

## Como abrir

Dê **duplo clique em `abrir.cmd`**. Ele sobe um servidor local em `http://localhost:8795` (porta fixa, diferente da do Template, 8778) e abre o navegador. Feche a janela preta para parar o servidor. Precisa de Python **ou** Node.js (usa `py`, depois `python`, depois `node`, como o Template).

> A porta é fixa de propósito: o navegador prende os dados ao endereço. Abrir em outra porta mostra o app vazio (o app então oferece restaurar o arquivo de backup).

Primeira abertura: um onboarding guia **pessoas → salários → tópicos** (um conjunto sugerido, inspirado em 50/30/20, que você edita ou apaga).

## Onde ficam os dados

| Camada | O quê |
|---|---|
| **IndexedDB** (principal) | stores `estado` (usuários, tópicos, planejamento por mês, cartões, regras, mapeamentos, preferências), `transacoes` e `faturas`. Gravado a cada alteração. O app pede `navigator.storage.persist()`. |
| **`data/estado.json`** (espelho) | gravado pelo servidor local ≈2 s depois de cada alteração (escrita atômica: arquivo temporário + rename). Snapshots datados em `data/backups/` (últimos 10). |
| **localStorage** | só tema e último mês aberto. |

- **Pasta de dados**: edite `config.json` (`"pastaDados": "./data"`) para apontar para fora do OneDrive, ex. `"C:/Dados/planejamento"`. Também: `maxBackups` e `intervaloMinimoSnapshotMin` (0 = um snapshot a cada gravação, como pedido; use p. ex. `10` para que os 10 backups cubram mais tempo).
- Segurança do endpoint: só aceita cliente `127.0.0.1`, `Host` `localhost`/`127.0.0.1:8795` e `Origin` `http://localhost:8795`.
- Servidor fora do ar? O app continua só com IndexedDB e avisa na tela; reconecta sozinho.
- Banco vazio + arquivo existente ⇒ o app oferece **restaurar**.
- **Configurações**: espaço usado, data/hora do último salvamento em arquivo, *Salvar agora*, *Restaurar backup* (lista os snapshots), *Exportar/Importar JSON* (a importação baixa um backup do estado atual antes de substituir tudo).

### Fazer backup
Copie `data/estado.json` (ou a pasta `data`), ou use **Configurações → Exportar JSON**.

## Formato do CSV

Qualquer extrato com uma linha por lançamento. O app **detecta** e você confere/ajusta na tela de mapeamento:

- separador `;` `,` tab ou `|`; encoding UTF-8 ou Latin-1/Windows-1252;
- datas `dd/mm/aaaa`, `aaaa-mm-dd`, `dd-mm-aaaa`, `dd/mm/aa`; decimal `1.234,56` ou `1,234.56`;
- colunas: data, descrição e **ou** uma coluna de valor (negativo = saída; "inverter sinal" troca) **ou** débito + crédito separados.

Marque *Salvar mapeamento* para reconhecer o mesmo layout nas próximas importações. Exemplos em `exemplos/csv/`.

Categorização por **regras de palavra-chave** (Configurações → Regras, ou "criar regra" na revisão / ao reclassificar uma transação). Sem regra = "Não categorizado". Duplicatas (data + valor + descrição) vêm desmarcadas e avisadas — inclusive entre CSV e PDF.

## Importar fatura de cartão (PDF)

**Importar → Fatura de cartão (PDF)** e arraste o arquivo.

1. PDF com senha: o app pergunta **a cada importação** (a senha nunca é guardada). PDF nunca é guardado.
2. Texto via pdf.js usando coordenadas (layouts de duas colunas tratados); sem camada de texto ⇒ **OCR local** (Tesseract, idioma `por`) com barra de progresso.
3. Banco detectado por palavras-chave; parser do banco → se falhar ou não validar, tenta o **genérico** e avisa.
4. **Validação**: soma dos lançamentos × total da fatura ("✔ bateu" ou "diferença de R$ X"), subtotais por cartão e linhas suspeitas (parecem lançamento, mas não foram capturadas).
5. Cartão novo ⇒ pergunta de quem é (só os 4 últimos dígitos são guardados).
6. Revisão (mesma tela do CSV) e confirmação.

Parcelas ("03/10", "PARC 03/10", "Parcela 3/10"): a parcela atual é registrada e as seguintes são projetadas como **previstas** nos meses futuros; ao importar a fatura seguinte, a parcela real **substitui** a prevista (sem duplicar). Estornos são valores negativos; "pagamento recebido", "saldo anterior" etc. são ignorados. Compra internacional: valor em moeda estrangeira, cotação e IOF (o IOF é somado à compra; IOF solto vira transação sugerida em "Tarifas/IOF").

**Texto extraído**: só o da **última fatura de cada banco** é guardado, e já **mascarado**. "Ver texto extraído" → **Copiar texto mascarado** (troca CPF, CNPJ, e-mail, nome do titular e números de cartão, exceto os 4 últimos dígitos). É esse texto que você me envia para calibrar os parsers.

## Calibrar / adicionar um parser de banco

Os parsers do **Itaú** e do **Nubank** são **PRELIMINARES** (escritos a partir de suposições; ver abaixo).

1. Importe a fatura real, abra **Ver texto extraído → Copiar texto mascarado** e salve em `exemplos/faturas/<nome>.txt` (opcional: `<nome>.esperado.json` com `banco`, `totalFatura` (centavos), `nTransacoes`, `somaTransacoes`, `bateu`, `dataFechamento`, `dataVencimento`…).
2. `npm test` (Node 20+): o teste lê **todos** os `.txt` da pasta. Sem `.esperado.json` ele só imprime o diagnóstico (banco, nº de transações, "bateu" ou diferença, linhas suspeitas); com `.esperado.json` valida estritamente.
3. Ajuste `js/pdf/parsers/<banco>.js` até bater.
4. Novo banco: crie `js/pdf/parsers/<banco>.js` exportando `{ id, nome, preliminar, detectar(texto) → 0..1, extrair(linhas) → { banco, dataFechamento, dataVencimento, totalFatura, transacoes[], futuras[], subtotais, suspeitas[], avisos[] } }` e registre em `PARSERS` (`js/pdf/interpretar.js`). Helpers em `parsers/comum.js`.

### Suposições a confirmar com fatura real
**Itaú** — seções "Lançamentos: compras e saques", "Lançamentos internacionais" e "Compras parceladas - próximas faturas"; total em "Total desta fatura"; datas `dd/mm`; fechamento em "Data de fechamento: dd/mm/aaaa" (senão, vencimento − 7 dias); cartões identificados por "cartão final 1234" (titular e adicionais); subtotal "Total dos lançamentos no cartão final 1234"; parcela como `03/10` na descrição; internacional `dd/mm DESCRIÇÃO USD 10,00 5,40 54,00` com IOF em linha própria; linhas de "próximas faturas" não entram no total; o cartão dessas linhas é incerto (casamos por descrição + total + parcela); a data exibida de uma parcela >1 pode ser a da compra original (tratamos como cobrança no fechamento); senha do PDF.
**Nubank** — datas `15 OUT` (ou `dd/mm`); período "TRANSAÇÕES DE 16 DEZ A 15 JAN" dá o fechamento e o ano vem do vencimento ("Data de vencimento: 22 JAN 2027"); total em "Total a pagar"; lançamento `15 OUT [•••• 1234] DESCRIÇÃO R$ 45,90`; estorno com sinal de menos; "Pagamento recebido" ignorado; parcela "Parcela 3/10" na descrição; internacional com linha de apoio (`USD 10,00 · Cotação R$ 5,40`) e IOF em linha logo abaixo ou como lançamento próprio.

## Exemplos (todos FICTÍCIOS)

`exemplos/csv/` (2 layouts, um em Latin-1, um com débito/crédito), `exemplos/faturas/` (textos + `.esperado.json`) e `exemplos/pdf/` (digital, **com senha `12345`**, **escaneado** para OCR, duas colunas). Servem para testar a infraestrutura, **não** provam que o layout real dos bancos é este. Para regenerar: `cd tools && npm install && node gerar-exemplos.js`.

## Estrutura

```
abrir.cmd  _serve.js  _serve.py  config.json  index.html
css/        tokens + estilos (tema claro/escuro por variáveis)
js/         main, state (loadState/persist/update), storage (IndexedDB), sync (arquivo), modelo (dados)
js/domain/  orçamento, ações, transações, parcelas, regras, importação (puro, testado)
js/csv/     leitor e mapeamento
js/pdf/     extrair (pdf.js), ocr, linhas, mascarar, validar, interpretar, parsers/
js/views/   telas        js/charts/  ECharts (Sankey etc.)
vendor/     echarts, pdfjs (+worker, cmaps, fontes), tesseract (+core WASM, idioma por)
tests/      node --test (npm test)       tools/  geração de exemplos (dev)
```

## Privacidade
Dados só neste computador; sem CDN; PDFs e senhas nunca guardados; nada de CPF, nº de cartão ou senha em console/log; o texto guardado da fatura é mascarado.
