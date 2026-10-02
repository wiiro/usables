# Rotinas e Métodos

Organizador pessoal de trabalho e estudos. Roda no navegador, sem servidor
de dados e sem login. Os dados ficam no próprio navegador, como nos
documentos do `Template/`.

## Como abrir

**Dê dois cliques em `abrir.cmd`.** Ele sobe um servidor local e abre o
navegador em `http://localhost:8790/`. Para parar, feche a janela preta.

Na primeira vez, se ainda não houver a pasta `dist\`, o `abrir.cmd` instala
as dependências e compila o app sozinho (leva um ou dois minutos). Nas
próximas vezes ele só serve o que já está compilado.

Requisito: Node.js instalado.

## O que tem no app

| Tela | O que faz |
|---|---|
| **Hoje** | O que vence hoje (inclusive ocorrências de itens recorrentes), o que está atrasado, bloqueios ativos e o progresso de projetos e matérias. As caixinhas marcam como feito ali mesmo |
| **Trabalho › Projetos** | Projetos com barra de progresso (média das tarefas). Cada projeto tem as abas Tarefas, Anotações, Ideias, Bloqueios e Avanços |
| **Trabalho › Tarefas** | Todas as tarefas em **Kanban** (arrastar entre colunas, também pelo teclado: Espaço pega, setas movem, Espaço solta) ou **Lista** (ordenar clicando no cabeçalho; filtros por projeto, status, prioridade, prazo e etiqueta) |
| **Estudos** | Matérias com progresso (tópicos concluídos ÷ total) e tópicos com Anotações, Avanços, Ideias e Dúvidas |
| **Calendário** | Mês, semana e dia, com Trabalho e Estudos juntos (filtro na própria tela) ou separados (aba Calendário de cada área). Arrastar muda a data; clicar num dia vazio cria um item; itens recorrentes aparecem em todas as ocorrências |
| **Backup** (barra lateral) | Exportar tudo em JSON e importar de volta |
| **Tema** (barra lateral) | Claro ou escuro; a escolha fica salva |

Regras que valem em todo o app:

- **Progresso** é sempre calculado, nunca digitado: tarefa = subtarefas
  concluídas ÷ total (sem subtarefas: 0% ou 100% conforme "Feito").
- **Status e progresso são independentes**: concluir todas as subtarefas não
  muda o status sozinho. Quando bloqueios e status se contradizem, o painel da
  tarefa sugere o ajuste com um clique.
- **Repetição** (diária, semanal em dias escolhidos, mensal) começa na data do
  item. Cada ocorrência é marcada como feita separadamente (no calendário ou
  na tela Hoje). Mensal no dia 29–31 cai no último dia dos meses mais curtos.
  Itens recorrentes não são arrastados no calendário e nunca contam como
  atrasados.
- **Excluir** sempre pede confirmação e leva junto o que pertence ao item
  (excluir um projeto exclui as tarefas dele e todas as seções).

### A porta é sempre 8790

Os dados ficam no `localStorage`, que o navegador separa por endereço
(`localhost:8790` é um endereço, `localhost:5173` é outro). Se o app abrir em
outra porta, ele aparece vazio. Os dados não somem: continuam no endereço
antigo. Por isso a porta é fixa no `abrir.cmd` e no `vite.config.ts`.

## Onde os dados ficam

No `localStorage` do navegador, na chave `rotinas_state_v1`: um único JSON
com tudo (projetos, tarefas, matérias, tópicos e as seções de cada um),
salvo a cada alteração.

- Os dados ficam **neste navegador, neste computador**. O OneDrive não faz
  backup deles. O backup é o botão **Backup › Exportar**, na barra lateral.
  Vale exportar de vez em quando e guardar o arquivo no OneDrive.
- Limpar os dados de navegação apaga o conteúdo.
- O limite do `localStorage` é de cerca de 5 milhões de caracteres. Se um
  dia encher, o app avisa na hora. Ele não falha em silêncio.
- Com o app aberto em duas abas, uma acompanha o que a outra salva.

Para olhar os dados pelo console (F12):

```js
JSON.parse(localStorage.getItem('rotinas_state_v1'))
```

### Exportar e importar

- **Exportar** baixa `rotinas-e-metodos-backup-AAAA-MM-DD.json` com tudo.
- **Importar** substitui **todos** os dados atuais pelos do arquivo. Antes de
  substituir, o app mostra o que o arquivo contém, pede confirmação e baixa
  automaticamente um backup do que existe hoje.
- O arquivo é conferido antes: JSON válido, formato do app e vínculos
  íntegros (nenhuma tarefa sem projeto, nenhuma seção sem dono). Se algo
  falhar, nada é alterado e a mensagem diz o motivo.

### Se os dados salvos estiverem ilegíveis

O app não grava por cima. Antes, guarda uma cópia do conteúdo numa chave
`rotinas_state_v1__ilegivel_<data>`, começa do zero e mostra um aviso com o
nome da chave. Se não houver espaço nem para a cópia, o salvamento é
desligado e o aviso diz isso.

## Estrutura

| Pasta | Papel |
|---|---|
| `src/types/` | Modelos de dados. É a referência do formato do estado |
| `src/store/` | Estado em memória, gravação no `localStorage`, validação ao carregar, backup |
| `src/store/actions/` | Todas as alterações do estado (funções puras, testadas) e os hooks que as ligam às telas |
| `src/domain/` | Regras puras (progresso, datas, recorrência, filtros, Kanban, calendário, tela Hoje), com testes ao lado |
| `src/hooks/` | Hooks reutilizáveis (`useToday`, `useItemDrawer`) |
| `src/components/` | Layout, componentes visuais e as seções reaproveitadas (Anotações, Ideias, Bloqueios, Avanços, Dúvidas) |
| `src/features/` | Uma pasta por tela: today, work, study, calendar, backup |
| `abrir.cmd`, `serve.js` | Atalho e servidor local da pasta `dist\` (só em `127.0.0.1`) |

Para mudar o formato dos dados, altere juntos `src/types/` e
`src/store/stateSchema.ts`. O TypeScript acusa se os dois ficarem diferentes.
Campo novo precisa de valor padrão no schema, para os dados já salvos
continuarem abrindo.

## Desenvolvimento

```powershell
npm install        # dependências
npm run dev        # servidor de desenvolvimento em http://localhost:8790
npm test           # testes (Vitest)
npm run lint       # lint (Oxlint)
npm run build      # checa tipos e compila para dist\ (o que o abrir.cmd serve)
```

O `npm run dev` e o `abrir.cmd` usam a mesma porta, então não rodam ao mesmo
tempo. Como ficam no mesmo endereço, os dois enxergam os mesmos dados.
