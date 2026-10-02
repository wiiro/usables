# Tracker 2.0 — Guia de Tarefas Interativo

Documento de acompanhamento de tarefas que roda inteiro no navegador. Sem
backend, sem build, sem dependências: cinco arquivos `.js`, um `.css` e um
`.html` em escopo global simples, que qualquer editor de texto abre e entende.

Cada pasta na raiz é **um documento independente**. `Template/` é o molde a
copiar; as demais são documentos em uso.

| Pasta | Documento | `DOC_ID` |
|---|---|---|
| `Template/` | O molde a copiar | `template` |
| `Lana-Solutions/` | LANA · Solution & ALM | `lana-solutions-alm` |
| `bugs/` | Bugs em acompanhamento | `bugs` |
| `guia-tarefas-notificacoes/` | Notificações e assinaturas | `notificacoes-assinaturas` |

`Lana-Solutions/` foi convertido de um formato antigo em 21/09/2026 e guarda,
em `docs/`, o briefing que originou seu conteúdo — ver o README de lá.

---

## Como abrir

**Duplo clique em `abrir.cmd`** dentro da pasta do documento. Ele sobe um
servidor local na pasta e abre o navegador em `http://localhost:8778/`.

Para usar outra porta: `abrir.cmd 8899`.

Para parar: feche a janela preta.

### Por que não dá para abrir o `index.html` direto

Abrir `index.html` por duplo clique usa o protocolo `file://`, e nesse modo o
carregamento dos scripts irmãos (`state.js`, `render.js`, …) não é confiável —
o sintoma é **a página abrir em branco**. O `abrir.cmd` existe só para servir
os mesmos arquivos por HTTP, onde funcionam.

Isso é consequência direta da decisão de **não ter build step** (ver
`Template/ARCHITECTURE.md`): os arquivos ficam separados e legíveis, e o preço
é precisar de um servidor local para abrir. A alternativa seria empacotar tudo
num `index.html` único, o que tornaria o código bem menos editável.

### Requisitos

Python **ou** Node.js instalado. O `abrir.cmd` procura, nesta ordem: `py`,
`python` (rodando `_serve.py`), depois `node` (rodando `_serve.js`). Se não
achar nenhum dos três, avisa na tela.

Os dois servidores fazem a mesma coisa: servem só a pasta onde estão, escutam
apenas em `127.0.0.1` (nada exposto na rede) e enviam `Cache-Control:
no-store`.

O `no-store` não é detalhe. Dois documentos abertos na mesma porta respondem
pelas mesmas URLs (`localhost:8778/state.js`), e sem ele o navegador reaproveita
o `state.js` de um documento no outro — o `DOC_ID` errado é carregado e um
documento passa a gravar por cima do outro. É também por isso que o launcher
não usa `python -m http.server`, que não envia esse cabeçalho.

### "Editei um arquivo e o navegador não mostra a mudança"

Recarregue com **`Ctrl + Shift + R`** (recarregamento forçado). Uma vez resolve.

O motivo: se a página já foi aberta alguma vez por um servidor que não enviava
`Cache-Control` — `python -m http.server`, por exemplo — o navegador guardou os
`.js` em cache e aplicou *heurística de frescor*: sem instrução explícita, ele
assume que arquivo velho continua válido por mais alguns dias e **nem pergunta
ao servidor**. O sintoma é exatamente esse: o servidor entrega o código novo, a
página executa o antigo.

Os servidores deste projeto enviam `no-store` justamente para isso não
acontecer, mas o cabeçalho só vale para respostas novas — um cache já
contaminado precisa de um recarregamento forçado para sair.

Se o `Ctrl + Shift + R` não resolver, confira se você abriu a pasta certa: cada
pasta é um documento independente e uma alteração no `Template/` **não** chega
sozinha aos documentos já criados a partir dele.

---

## Criar um novo documento

1. Copie a pasta `Template/` e renomeie.
2. **Abra `state.js` e altere `App.DOC_ID`** para um identificador curto e
   único em kebab-case (`extrato-533`, `onboarding-q4`).
3. Duplo clique em `abrir.cmd`.

O passo 2 não é opcional. O `DOC_ID` é a **única** coisa que separa os dados de
um documento dos de outro:

- Em `file://`, todos os arquivos locais dividem a mesma origem de navegador.
- Via `abrir.cmd`, dois documentos servidos na mesma porta dividem a origem
  `localhost:8778`.

Em nenhum dos dois casos o caminho da pasta separa os dados. Dois documentos
com o mesmo `DOC_ID` gravam na mesma chave e **se sobrescrevem** — foi o que
aconteceu entre `Template/` e `bugs/` até 2026-09-18, quando `bugs/` ainda
carregava o `DOC_ID` herdado da cópia.

Se esquecer, o console do navegador (F12) avisa.

---

## Onde os dados ficam

No `localStorage` do navegador, na chave `gti_state_v1__<DOC_ID>`.

Consequências que valem para o time:

- Os dados são **por pessoa e por navegador**. Não vão para o Git e não são
  compartilhados: o repositório versiona o *documento*, não o preenchimento.
- Limpar dados de navegação apaga o conteúdo preenchido.
- Para compartilhar um documento preenchido, use os botões **Exportar HTML**
  ou **Exportar PDF**.
- O conteúdo inicial de um documento (o que todo mundo vê ao abrir pela
  primeira vez) é o que está em `App.seedState()`, dentro do `state.js` — esse
  sim é versionado.

### Recuperar dados da chave antiga

Até 2026-09-18, `Template/` e `bugs/` dividiam o `DOC_ID` `template` e gravavam
os dois em `gti_state_v1__template`. O `bugs/` passou a ter chave própria
(`gti_state_v1__bugs`) e agora começa do seed.

A chave antiga **não foi apagada**. Não há migração automática de propósito:
ela guarda o que o `Template` **ou** o `bugs` salvou por último, sem como
distinguir, e copiar às cegas traria o conteúdo errado.

Para inspecionar o que sobrou, abra qualquer documento, tecle F12 e rode no
console:

```js
JSON.parse(localStorage.getItem('gti_state_v1__template'))
```

Se aquilo for mesmo o conteúdo do `bugs`, adote com:

```js
localStorage.setItem('gti_state_v1__bugs', localStorage.getItem('gti_state_v1__template'))
```

e recarregue a página.

---

## Estrutura de uma pasta

| Arquivo | Papel |
|---|---|
| `index.html` | Casca. Carrega os scripts na ordem — a ordem importa |
| `state.js` | `DOC_ID`, modelo de dados, seed e persistência |
| `logic.js` | Regras puras: estimativas, impacto, atraso, campos editáveis |
| `render.js` | Monta todo o DOM a cada mudança de estado |
| `export.js` | Exportação para HTML e PDF |
| `styles.css` | Estilos, incluindo tema claro/escuro |
| `abrir.cmd` | Launcher: sobe o servidor local e abre o navegador |
| `_serve.py` | Servidor estático mínimo (Python) |
| `_serve.js` | Mesmo servidor em Node, para máquinas sem Python |

Documentação de apoio em `Template/`: `ARCHITECTURE.md` e `business-rules.md`.
