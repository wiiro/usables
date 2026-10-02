# Arquitetura — Guia de Tarefas Interativo (versão pasta de arquivos)

Este documento resume as decisões tomadas na migração do arquivo `.html` único
(formato "bundler" + DSL `x-dc`) para esta pasta de arquivos comuns. É o
complemento de `business-rules.md` — aquele descreve
**o que** o produto faz; este descreve **como** o código está organizado e
por quê, para que uma manutenção futura (com ou sem ajuda de LLM) não precise
redescobrir essas decisões do zero.

## Arquivos

```
index.html   shell — sem lógica, só a estrutura mínima e os <script src>
styles.css   tokens (design system embutido, portado 1:1) + classes visuais
state.js     seedState/loadState/persist, App.update/setState (mutação central)
logic.js     regras de negócio puras + fábricas de campo/lista reaproveitáveis
render.js    as 6 views + os dois mecanismos de foco + delegação de eventos
export.js    os 3 mecanismos de exportação (PDF/HTML/Markdown)
app.js       bootstrap — só isso: carrega estado, registra eventos, primeiro render
```

Namespace único global (`App`), sem módulos ES, sem build step — a ordem dos
`<script src>` no `index.html` importa (cada arquivo depende do anterior).

## Renderização: rebuild total, não virtual DOM

`App.render()` reconstrói o `innerHTML` de `#app` inteiro a cada mudança de
estado (`App.update`/`App.setState`). Não há diffing — é a abordagem mais
simples de ler e editar num arquivo comum, e o documento não é grande o
suficiente pra isso ser um problema de performance perceptível.

O preço de rebuild total: qualquer `<input>`/`<textarea>` focado é destruído e
recriado a cada render, o que naturalmente perderia foco/cursor/seleção. Dois
mecanismos resolvem isso, para dois grupos de campos diferentes:

### Mecanismo 1 — campos do padrão "lápis" (`state.editingField`)

Título/subtítulo de etapa, texto/observação de item, itens de lista
(decisões, testes, riscos, etc.) — qualquer campo que passa por
`App.editableField(key, value, opts)`.

**Ponto-chave que não é óbvio**: enquanto um campo está em edição, digitar
**não dispara `render()`** — o `onChange` desse campo chama
`App.updateSilent`/`App.setStateSilent` (persiste, não renderiza). O nó do
`<input>`/`<textarea>` fica parado o tempo todo enquanto o usuário digita; só
uma ação **de outro lugar** do documento (ou a própria abertura/fechamento do
campo) dispara um render de verdade.

Quando esse render "de outro lugar" acontece com um campo ainda em edição,
`App._preserveEditingNode`/`App._restoreEditingNode` entram em ação: extraem o
nó real do DOM antes de reconstruir o `innerHTML` (`el.remove()` mantém a
referência JS viva), e depois localizam o placeholder novo (mesmo
`data-focus-key`) e o substituem pelo nó preservado (`replaceWith`) — não por
uma cópia. É isso que preserva seleção de texto, undo history e composição de
IME: é literalmente o mesmo nó, só realocado.

`onStopEdit` (dispara no `blur` real, via delegação de `focusout` — `blur` não
borbulha, `focusout` sim) é o que de fato fecha o modo de edição. Não é
decorativo: se algo reconstruísse esse campo enquanto ele está focado sem
passar pelo Mecanismo 1, o `blur` sintético fecharia a edição sozinho.

### Mecanismo 2 — campos sempre-editáveis, sem toggle

Estimativa/tempo real da etapa, data de status, todos os rascunhos de
"adicionar novo", formulário de anotação. Esses **disparam render normal a
cada tecla** (não têm modo edição pra proteger). `App._captureFocus`/
`_restoreFocus` capturam `document.activeElement` + seleção antes do rebuild
e restauram depois, usando o mesmo atributo `data-focus-key` como chave de
busca — mas aqui reconstruindo um nó novo (não preservando o antigo), porque
não há nada de especial (IME, undo) que precise sobreviver além da posição
do cursor.

### Mecanismo 3 — foco na abertura do campo (`App._focusEditingField`)

Os dois mecanismos acima cobrem renders que acontecem **com** um campo já em
edição. Falta o momento em que a edição **começa**: o usuário clica no lápis,
`onStartEdit` faz `setState({editingField: key})`, e o `<input>`/`<textarea>`
nasce dentro do `innerHTML` novo — sem nó preservado (não estava em edição
antes) e sem foco capturado (o clique foi num `<div>`, não num campo).

O atributo `autofocus` **não resolve isso**, e essa é a parte que não é óbvia:
o navegador só processa `autofocus` para elementos inseridos durante o
carregamento da página. Num `innerHTML` atribuído depois do load, o atributo é
ignorado em silêncio. Até 01/10/2026 o código confiava nele, e o efeito era:
clicar no lápis abria o campo mas deixava o foco no `<body>` — o usuário
digitava e nada acontecia até clicar de novo dentro do campo.

`App._focusEditingField(container)` roda no fim de `render()`, **só quando
nenhum dos outros dois mecanismos reclamou o foco** (`if (!preserved &&
!captured)`), e só age se nada dentro de `#app` estiver focado — essa guarda é
o que impede o campo recém-aberto de roubar o cursor de um campo
sempre-editável que o usuário esteja usando. O caret vai para o fim do texto:
abrir um campo preenchido é para revisar, não para sobrescrever do início.

### `App.pruneEditingField` — órfão descartado, não vazado

Se `state.editingField` apontar para uma key que não existe mais (o usuário
trocou de fase no meio de uma edição, ou o item/etapa/fase em edição foi
excluído), o Mecanismo 1 simplesmente não encontra o placeholder e descarta o
nó preservado — mas isso por si só não limpa `state.editingField`. Por isso
`App.pruneEditingField(state)` roda no início de **todo** `render()`: resolve
a key de volta pro dado que ela referencia (via os prefixos `item:`, `sec:`,
`list:`, `tests:`, `risks:`, `overview:`) e zera o campo se não
resolver mais nada. Um ponto de verificação só, não espalhado pelos handlers
de exclusão.

## Delegação de eventos

Um único listener por tipo (`click`, `input`, `change`, `focusout`,
`mousedown`) registrado uma vez em `#app` (`App.initEvents()`, chamado pelo
`app.js`). Cada elemento clicável/editável carrega um atributo (`data-h`,
`data-hi`, `data-hc` ou `data-hblur`) com uma chave que aponta pra uma função
no registro `App._h` — reconstruído do zero a cada `render()` (`App._h = {}`
no início da montagem do HTML). Não há acúmulo de listeners entre renders, e
não há necessidade de anexar/desanexar handler por nó individual.

## Sidebar: arraste sem re-render por movimento

O redimensionamento por arraste muta `sidebar.style.width` **diretamente no
DOM**, fora do ciclo de `render()`, a cada `mousemove` — só um `App.setState`
(e portanto um único `render()`) acontece no `mouseup`, comitando a largura
final. Evita reconstruir o `innerHTML` inteiro dezenas de vezes por segundo
durante o arraste.

## Relatório de impressão: seção própria, não "a tela atual"

`App._buildPrintReport()` gera uma seção (`.gti-print-report`) sempre presente
no DOM, escondida por CSS (`display:none`) e só visível via `@media print`
(que ao mesmo tempo esconde `.gti-shell`, o app interativo). Mostra **todas as
fases de uma vez** (não só a aba ativa), bloqueios em destaque, e as
anotações em ordem cronológica — é isso que "Exportar PDF"
(`window.print()`) efetivamente imprime.

## Divergências intencionais em relação ao `.html` original

- **Texto de conteúdo em campos de tamanho variável**: `<textarea>` auto-crescente
  (`estimateRows()`) em vez do `<input>` de linha única do original. No `.html`
  original, isso só existia (documentado, nunca implementado) para o texto do
  item de checklist — corrigido nesta migração. Nesta versão, o mesmo tratamento
  foi **estendido por consistência** a todo campo de lista de conteúdo variável:
  subtítulo da etapa, decisões, próximos passos, testes, erros, riscos,
  melhorias. Ficam de fora (permanecem `<input>` linha única, igual ao
  original): título da etapa, nome/URL de API-repositório, observação do item
  (`meta`). Não é regressão se esses campos aparecerem diferentes do `.html`
  original ao comparar lado a lado — ver `business-rules.md` para a tabela
  completa.
- **Renomear fase**: não existe no original (só nomeação na criação, via
  `window.prompt()`) e não foi adicionado aqui — decisão deliberada, ver
  discussão de escopo da migração.
- **Ícones**: glifos unicode (✓, !, ×, ☰, ☾/☀) em vez dos SVGs do design
  system embutido — visualmente equivalente, sem precisar gerar/embutir SVG.

## Validação em navegador (01/10/2026)

Até 01/10/2026 esta seção dizia que nada disso tinha sido validado num
navegador de verdade — o ambiente de desenvolvimento só alcançava sintaxe
(`node --check`), lógica isolada em `vm` do Node, e um dry-run de `render()`
com DOM falso. Validado desde então, servindo a pasta em `localhost` e
dirigindo a página:

| O que | Resultado |
|---|---|
| Mecanismo 1 — nó preservado ao digitar | passa: o mesmo nó sobrevive, foco e seleção mantidos, estado e `localStorage` gravados |
| Mecanismo 2 — captura/restauração de foco | passa: nó recriado, foco e caret restaurados na posição |
| Mecanismo 3 — foco na abertura | **falhava** (era o bug do `autofocus`); corrigido e revalidado |
| Arraste da sidebar | passa: largura muda no DOM durante o movimento, estado comita só no `mouseup` |
| Ciclo de `localStorage` entre reloads | passa |

O "debounce das notas", que esta seção citava, deixou de existir: o campo
`notes` foi removido do produto em 18/09 (ver `business-rules.md`).

## Onde está cada coisa

Este projeto tem só dois documentos, de propósito — um terceiro descrevendo o
modelo de dados existia no repositório de origem e **não** foi recriado aqui,
para não haver duas descrições do mesmo modelo divergindo com o tempo.

| Pergunta | Onde responde |
|---|---|
| Qual a forma do estado? | comentários de `App.seedState` e as formas de Fase/Etapa/Item logo abaixo, em `state.js` |
| O que persiste e o que não persiste? | `App.persist`/`App.loadState`, em `state.js` |
| Como o produto se comporta? | `business-rules.md` |
| Como o código está organizado e por quê? | este arquivo |
| Como exportar / o que cada export faz? | `export.js`, e "Relatório de impressão" acima |
