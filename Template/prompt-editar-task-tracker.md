# Contexto: editando o Task Tracker

Isto é um "Guia de Tarefas Interativo" — um tracker de tarefas single-page, 100% client-side. Sem servidor, sem build step, sem framework, sem dependências externas. Abre direto no navegador.

**Antes de editar qualquer coisa, leia estes dois arquivos primeiro (anexados):**

1. `ARCHITECTURE.md` — estrutura geral, fluxo de render, decisões de arquitetura (por que o render reconstrói o HTML do zero, os mecanismos de preservação de foco, etc.)
2. `business-rules.md` — regras de negócio (ciclo de vida do item, cálculo de impacto, atraso por etapa vs. por fase, convenções de edição, etc.) — é a fonte da verdade de comportamento. Não invente ou altere uma regra de negócio sem perguntar antes.

Não pule esses dois achando "é só mudar uma linha" — mudanças pequenas em `render.js` frequentemente têm efeito colateral em alguma regra documentada ali.

## Estrutura dos arquivos (todos anexados)

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Shell da página, sem lógica |
| `styles.css` | Tokens de design (cores, tipografia, espaçamento, raio) + classes visuais |
| `state.js` | Modelo de dados, `seedState`/`loadState`/`persist`, `App.update`/`App.setState` (+ variantes `Silent`) |
| `logic.js` | Regras de negócio puras (`parseMinutes`, `sectionMarkerState`, `maxImpact`, `tabLateness`, `estimateRows`), o padrão de campo editável (`editableField`), e as fábricas de lista genérica |
| `render.js` | Constrói o HTML de cada view a partir do estado, delegação de eventos, mecanismos de preservação de foco/nó durante edição |
| `export.js` | Os 3 mecanismos de exportação (PDF, HTML, Markdown) |
| `app.js` | Ponto de entrada |

Sem módulos ES, sem `import`/`export`, sem build step — tudo em escopo global via um namespace único (`App`). Isso é **intencional** (qualquer editor de texto comum abre e entende o projeto inteiro sem ferramental especial) — não "corrija" isso introduzindo bundler, transpiler ou sistema de módulos, mesmo que pareça mais moderno.

## Regras que não podem ser quebradas silenciosamente

- **Padrão "lápis":** campos de texto com conteúdo existente mostram o texto numa caixa com ícone de lápis; só viram campo editável de verdade ao clicar no lápis, e voltam a ficar só-leitura ao clicar fora. Não é um `<input>` sempre aberto. Ver `editableField()` em `logic.js`.
- **Enquanto um campo está em modo edição** (`state.editingField` apontando pra ele), o `render()` não pode reconstruir o nó DOM daquele campo especificamente — só quando ele perde o foco de verdade. Isso é tratado extraindo/reinserindo o nó real via `data-focus-key`. Se isso for contornado com um rebuild ingênuo, o campo se autofecha a cada tecla digitada.
- **Campos sem esse toggle** (estimativa/tempo real, data de status, rascunhos de "adicionar novo") não têm modo edição, mas ainda precisam de preservação de foco/seleção via `document.activeElement`.
- **São três mecanismos de foco, não dois** — preservação do nó em edição, captura/restauração dos sempre-editáveis, e o foco na abertura do campo (`App._focusEditingField`). Não confundir nem unificar: o terceiro existe porque `autofocus` é ignorado em elemento inserido via `innerHTML` depois do load. Ver `ARCHITECTURE.md`.
- **Nenhuma exclusão com conteúdo acontece sem confirmação** — não há desfazer, `App.update` persiste na mesma chamada. A tabela de o que pergunta e o que não pergunta está em `business-rules.md`, seção "Exclusão". Linha vazia sai sem perguntar, de propósito.
- Bloqueio de qualquer item sempre "vence" no marcador de progresso da etapa, mesmo com outros itens concluídos.
- Impacto da fase = o **maior** valor entre as etapas, nunca uma média.
- Atraso por etapa e atraso agregado por fase usam **fórmulas diferentes** — não reaproveite uma função genérica pras duas (ver `App.lateness` vs. `App.tabLateness`).
- Anotações (view Progresso & Relatório) não são editáveis depois de criadas — só excluíveis.
- Todo o estado vive em `localStorage`, chave `gti_state_v1__<DOC_ID>` (`App.DOC_ID` em `state.js`). Sem backend, sem colaboração multi-usuário — isso não muda sem eu pedir explicitamente.

## Como quero que você trabalhe

- Se o que eu pedir conflitar com algo documentado em `ARCHITECTURE.md`/`business-rules.md` ou com as regras acima, **pergunte antes de decidir sozinho qual prevalece.**
- Depois de qualquer edição, descreva (ou execute, se puder) um teste manual rápido cobrindo especificamente o que mudou, antes de considerar a tarefa concluída.
- Se a mudança for estrutural (não só visual/cosmética), atualize `business-rules.md`/`ARCHITECTURE.md` de volta — não deixe a documentação ficar desatualizada em relação ao código (isso já causou confusão antes neste projeto).
