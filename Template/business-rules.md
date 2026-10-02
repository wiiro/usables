# Regras de negócio

## Ciclo de vida de um item

Um item de checklist tem exatamente três estados, mutuamente exclusivos:

| `status` | Significado | Visual |
|---|---|---|
| `pending` | Ainda não feito (padrão ao criar) | Checkbox vazio, texto normal |
| `done` | Concluído | Checkbox preenchido com ✓, texto riscado (`text-decoration:line-through`), fundo levemente verde |
| `blocked` | Bloqueado, impedindo progresso | Ícone de alerta, botão "Bloqueio" destacado em vermelho, fundo levemente vermelho, placeholder do campo de observação muda para "Motivo do bloqueio..." |

Transições:
- `onToggleDone` alterna apenas entre `pending` ⇄ `done` (não sai de `blocked` por aqui).
- `onToggleBlocked` alterna apenas entre `pending` ⇄ `blocked`.
- Não existe um estado "done E blocked" simultâneo — são exclusivos por construção (cada toggle simplesmente sobrescreve `status`, não combina flags).

## Marcador de progresso da etapa (`sectionMarkerState`)

Cada etapa (não cada item) tem um marcador visual na linha do tempo, calculado a partir do conjunto de itens dela:

| Situação dos itens | Estado do marcador |
|---|---|
| Nenhum item | `pending` |
| Algum item `blocked` | `blocked` (bloqueio de qualquer item prevalece sobre tudo) |
| Todos os itens `done` | `done` |
| Ao menos um `done`, mas nem todos | `active` (em andamento) |
| Nenhum `done`, nenhum `blocked` | `pending` |

A ordem de verificação importa: **bloqueio sempre vence** — mesmo que 9 de 10 itens estejam concluídos, se 1 estiver bloqueado, a etapa inteira aparece como bloqueada na timeline. A lógica dá prioridade a chamar atenção para o impedimento, não a comemorar o progresso parcial.

## Impacto (`impact`)

Cada etapa tem um nível de impacto: `baixo` | `medio` | `alto`. O impacto **da fase inteira**, mostrado no topo (badge "Impacto geral"), é o **maior** valor de impacto entre todas as suas etapas — não uma média, não o da última etapa:

```js
var impactRank = {baixo:0, medio:1, alto:2};
var maxImpact = 'baixo';
tab.sections.forEach(function(sec){
  if (sec.impact && impactRank[sec.impact] > impactRank[maxImpact]) maxImpact = sec.impact;
});
```

## Prazo (estimado vs. real)

`estimate` e `actual` são textos livres (forma do modelo em `App.seedState`, `state.js`), convertidos em minutos por `parseMinutes()`:

```
"1h 10min" → 70
"45 min"   → 45
"90"       → 90   (número puro = minutos)
```

Uma etapa é considerada **"com prazo definido"** (`hasLate`) somente quando **ambos** `estimate` e `actual` estão preenchidos e pelo menos um deles é maior que zero depois do parse. Está **atrasada** (`isLate`) quando `actual > estimate`. O mesmo cálculo é feito por fase inteira, somando o tempo de todas as etapas dela.

Esta é uma decisão deliberada: **não existe alerta de atraso antes do tempo real ser preenchido** — o sistema não tenta prever atraso comparando com "agora", só compara estimado vs. realizado depois do fato. Se o objetivo futuro for alertar durante a execução (antes de preencher o tempo real), isso é uma mudança de regra, não um bug a corrigir — documente a decisão se for alterá-la.

## Tipos de anotação (`ANN_TYPES`)

| `type` | Rótulo exibido | Variante visual |
|---|---|---|
| `nota` | Nota | info |
| `decisao` | Decisão | neutro |
| `bloqueio` | Bloqueio | erro |
| `insight` | Insight | sucesso |
| `bug` | Bug | aviso |

Anotações são um registro de auditoria — tipo + título + descrição + timestamp no momento da criação. Diferente de todo o resto do documento, **não são editáveis depois de criadas**, só excluíveis. Isso é intencional: uma anotação representa "o que se sabia/decidiu naquele momento" — editá-la depois destruiria o valor histórico do registro.

**Título e descrição**: basta um dos dois estar preenchido para salvar. Exigir os dois atrapalharia o registro rápido durante a execução da tarefa, que é quando a anotação costuma nascer.

**Histórico (2026-09-18)**: até essa data a página Progresso & Relatório tinha *duas* áreas de texto livre — "Notas" (um único `textarea` solto no estado, campo `notes`) e "Anotações". A sobreposição entre as duas era ambígua. O campo `notes` foi removido e as anotações ganharam título próprio, cobrindo os dois usos. No mesmo passo saiu o campo `section` (um `<select>` com "Geral" + o nome de cada fase), que na prática duplicava o que o título diz melhor. `App.loadState()` normaliza anotações antigas na leitura: `section` vira o título quando era diferente de "Geral", e é descartado quando não era.

## Exclusão

Não existe desfazer: `App.update` grava no `localStorage` na mesma chamada em
que muta o estado. Por isso toda exclusão que leva **conteúdo** junto passa por
uma confirmação (`App.confirmDelete`, em `logic.js`).

| O que | Pergunta? | Mensagem |
|---|---|---|
| Fase | **sempre** | nomeia a fase e diz quantas etapas e itens vão junto |
| Etapa | **sempre** | nomeia a etapa e diz quantos itens vão junto |
| Item de checklist | só se tiver texto | mostra o começo do texto |
| Teste, risco | só se tiver texto | mostra o começo do texto |
| Linha de lista (decisões, próximos passos, erros, melhorias) | só se tiver texto | mostra o começo do texto |
| API / repositório | só se tiver nome ou URL | mostra o nome, ou a URL se não houver nome |
| Anotação | **sempre**, mesmo vazia | identifica pelo timestamp |

Duas decisões por trás dessa tabela:

**Linha vazia sai sem perguntar.** Confirmar a exclusão de uma linha em branco
treinaria o usuário a clicar "OK" sem ler — que é exatamente o oposto da
proteção que a confirmação deveria dar. Quem apaga uma linha vazia está
limpando um engano, não arriscando nada.

**Container pergunta sempre, mesmo vazio.** Fase e etapa arrastam tudo que
está dentro, e criar uma é um ato deliberado — a assimetria em relação à regra
acima é proposital.

**Anotação pergunta sempre.** É registro histórico, não é editável depois de
criada (ver acima), e não dá para recriar o que ela dizia.

**Histórico (2026-10-01)**: até essa data nenhuma exclusão pedia confirmação —
um clique no `×` da fase apagava fase, etapas e itens, já persistido. A
ausência de `confirm()` não estava registrada como decisão em lugar nenhum, o
que impedia saber se era escolha ou esquecimento.

## Convenção de edição: quem usa prompt, quem usa lápis, quem é sempre-editável

> **Nota de atualização (migração para pasta de arquivos):**
> esta tabela estava desatualizada — descrevia a convenção anterior ("todo campo
> editável é sempre um `<input>`/`<textarea>` visível, com borda tracejada").
> O código real usa o padrão "lápis" (`editableField`/`state.editingField`) para a
> maior parte dos campos de conteúdo — só um campo no documento inteiro fica em
> modo edição por vez; o resto aparece como texto com um ícone de lápis até ser
> clicado. A tabela abaixo reflete o comportamento real, com uma extensão
> deliberada em relação ao `.html` original: o `.html` só tinha `<textarea>`
> auto-crescente no texto do item (correção de uma spec documentada e nunca
> implementada); nesta versão, o mesmo tratamento foi estendido a todo campo de
> lista de tamanho variável (subtítulo da etapa, decisões, próximos passos,
> testes, erros, riscos, melhorias), por consistência. Isso não existe no `.html`
> de origem — não é regressão se divergir dele ao comparar lado a lado.

Existem três mecanismos, não dois:

| Campo | Mecanismo |
|---|---|
| Título / subtítulo do documento | `window.prompt()` |
| Nome da fase | `window.prompt()` — **só na criação** (`onAddTab`). Não existe forma de renomear uma fase já criada hoje (recurso nunca implementado, apesar de ter sido planejado). |
| Título da etapa | Padrão lápis (`editableField`), linha única |
| Subtítulo da etapa | Padrão lápis, `<textarea>` auto-crescente (`estimateRows()`) |
| Texto do item de checklist | Padrão lápis, `<textarea>` auto-crescente; o modo visualização mostra riscado (`text-decoration:line-through`) quando `status==='done'` |
| Observação do item (`meta`) | Padrão lápis, linha única |
| Decisões, próximos passos, testes, erros, riscos, melhorias | Padrão lápis, `<textarea>` auto-crescente (via `simpleListVals`, ou construção própria para testes/riscos, que têm campos extras de status/severidade) |
| Nome e URL/referência de API/repositório | Padrão lápis, linha única, dois campos independentes (`labelField`/`urlField`, via `twoFieldListVals`) |
| Escopo / Arquitetura (Visão Geral) | Padrão lápis, `<textarea>` de tamanho fixo (não auto-cresce — já nasce grande o suficiente) |
| Estimativa / tempo real da etapa | **Sempre-editável, sem lápis** — `<input>` de linha única, direto |
| Data de referência (Resumo Executivo) | Sempre-editável, sem lápis — `<input type="date">` |
| Rascunho de "adicionar novo item" (qualquer lista, incluindo checklist) | Sempre-editável, sem lápis, linha única — **não** auto-cresce, mesmo quando o campo salvo correspondente usa `<textarea>` |
| Formulário de nova anotação (tipo, título, descrição) | Sempre-editável, sem lápis — `<select>` para o tipo, `<input>` de linha única para o título, `<textarea>` para a descrição |

**Regra de auto-crescimento**: todo campo de padrão lápis que guarda **conteúdo de trabalho de tamanho variável** usa `<textarea>` auto-crescente (`estimateRows()`) — isso inclui texto do item, subtítulo da etapa, e todo item de lista (decisões, próximos passos, testes, erros, riscos, melhorias). Ficam de fora dessa regra: identificadores curtos por natureza (título da etapa, nome/URL de API), campos de tamanho fixo generoso (escopo, arquitetura — já nascem grandes o suficiente), e observação do item (`meta`, tipicamente curta).

A regra geral não é mais "prompt vs. inline" — é: **prompt() é só para os 2 identificadores estruturais do documento** (título/subtítulo do documento; nome de fase é meio-caminho, só no nascimento). **O padrão lápis é a norma** para conteúdo de trabalho que já existe e pode ser revisitado (protege contra apagar sem querer, ver justificativa abaixo). **Sempre-editável sem lápis** fica reservado a campos de preenchimento rápido/pontual — estimativas, datas, e qualquer rascunho de "adicionar novo" — onde não faz sentido proteger um valor que ainda não existe.

### Por que o padrão lápis existe

Um único campo em modo edição por vez (`state.editingField`) força o usuário a "confirmar a intenção" de editar (clicar no lápis) antes de qualquer tecla alterar o conteúdo — protege contra apagar/sobrescrever texto por engano ao clicar em algum lugar sem querer. `onStopEdit` (que fecha o modo edição) é um `setState` real, disparado no `blur` — não é decorativo; ver `ARCHITECTURE.md` (na pasta do projeto reestruturado) para a implicação disso na arquitetura de re-render.

## Heurística de auto-crescimento de texto (`estimateRows`)

Campos de texto que podem ficar longos (item, decisão, url, etc.) são `<textarea>` com a altura (`rows`) calculada a partir do tamanho do texto, não um valor fixo:

```js
estimateRows(text) {
  return Math.max(1, Math.min(8, Math.ceil((text || '').length / 55)));
}
```

- Textos curtos (até ~55 caracteres) ficam em 1 linha — sem desperdiçar espaço vertical em itens curtos, que são a maioria.
- Cresce aproximadamente 1 linha a cada ~55 caracteres adicionais.
- Nunca passa de 8 linhas — acima disso, o campo ganha rolagem interna (`overflow:auto`) e uma alça de redimensionamento manual (`resize:vertical`) como válvula de escape, em vez de crescer indefinidamente e distorcer o layout da página.
- Esse cálculo roda a **cada render** — como o documento re-renderiza a cada tecla digitada (todo `onChange` passa por `setState`), a altura do campo acompanha o texto em tempo real, sem precisar de nenhuma lógica extra de "auto-grow" via manipulação direta do DOM.
- O divisor `55` é uma aproximação (não mede a largura real em pixels do container) — é "bom o suficiente" para não fazer texto sumir, não uma quebra de linha pixel-perfeita. Se o campo estiver visualmente muito estreito ou muito largo em relação ao padrão, ajustar esse divisor é a forma mais simples de recalibrar.
