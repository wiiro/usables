# ensaio-site

E-commerce da **ensaio**, estúdio de design autoral de biomateriais (joias: brincos, earcuffs, pulseiras, colares).

Status: **fases 0 a 10 entregues no código e na documentação**, exceto o que depende de contas externas: **pagamento (Mercado Pago), frete (Melhor Envio) e publicação** ainda não existem. Hoje o checkout usa pagamento de teste e frete fixo. Ver [docs/PLANEJAMENTO.md](docs/PLANEJAMENTO.md) e as pendências em [docs/DECISOES.md](docs/DECISOES.md).

## Documentação

| Documento | Conteúdo |
|---|---|
| [COMO USAR.md](COMO%20USAR.md) | **Comece aqui:** iniciar com um clique (INICIAR.bat), como logar no painel e encerrar (PARAR.bat) |
| [docs/COMO-TESTAR.md](docs/COMO-TESTAR.md) | **Passo a passo para rodar e testar** (comece por aqui) |
| [docs/PLANEJAMENTO.md](docs/PLANEJAMENTO.md) | Arquitetura, páginas, fases e riscos |
| [docs/DECISOES.md](docs/DECISOES.md) | Decisões tomadas e pendências |
| [docs/DESIGN.md](docs/DESIGN.md) | Paleta, tipografia, layout |
| [docs/OPERACAO.md](docs/OPERACAO.md) | Uso do painel (produtos, pedidos, Materioteca, conteúdo) e rotina de manutenção |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Publicação, variáveis, rollback, backup, pendências de produção |
| [docs/LGPD.md](docs/LGPD.md) | Checklist de privacidade |

## Como o site lê os dados

`src/lib/medusa.ts` (cliente da Store API, só no servidor) → `src/lib/catalogo.ts` (converte produtos do Medusa para os tipos do site e preços para centavos) → páginas em `src/app/`. Cache de 60 s. Variáveis em `.env.local` (`MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`; modelo em `.env.example`).

Campos extras do produto vêm de `metadata` no Medusa: `material`, `origem`, `processo`, `cuidados`, `prazo_producao_dias`.

## Rodar localmente

Requisitos: Node 20+ (testado com 24), npm e PostgreSQL 17. O site precisa do backend no ar (ver [docs/COMO-TESTAR.md](docs/COMO-TESTAR.md)).

```bash
npm install
cp .env.example .env.local   # opcional na fase atual
npm run dev                  # http://localhost:3000
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (roda lint e checagem de tipos) |
| `npm run typecheck` | Só checagem de tipos |
| `npm run lint` | ESLint |
| `npm test` | Testes unitários (vitest) |
| `npm run smoke` | Teste de fumaça das rotas (site e backend no ar) |

## Backend (Medusa v2)

Fica em `backend/` (monorepo Turborepo do starter oficial; o app é `backend/apps/backend`). Banco: PostgreSQL 17 local, banco `ensaio_dev`, usuário `ensaio_app`.

```powershell
# 1x por terminal (o SWC recusa a pasta AppData\Local por causa da ACL dela)
$env:SWC_NATIVE_BINDING_CACHE = "$HOME\.swc-cache"
$env:MEDUSA_DISABLE_TELEMETRY = "1"

cd backend\apps\backend
npx medusa db:migrate                          # migrações
npx medusa exec ./src/scripts/seed-ensaio.ts   # dados fictícios (Brasil, BRL, joias); idempotente
npx medusa develop                             # API em :9000, painel em http://localhost:9000/app
```

- **Segredos**: `backend/apps/backend/.env` (DATABASE_URL, JWT, admin local) e `backend/.env.postgres.local` (superusuário do Postgres). Ambos ignorados pelo git. **Nunca versionar.**
- **Painel em português**: no painel, Settings > Profile > idioma "Português (Brasil)".
- **Chave publicável** do storefront: `.env.local` na raiz (`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`).
- **Preços**: o Medusa v2 guarda em unidade principal da moeda (189 = R$ 189,00), não em centavos. O adaptador do storefront converte.
- **Envio**: opção "Envio provisório" fixa até o provider do Melhor Envio (fase 5).
- **Sob demanda**: variantes com `manage_inventory: false` e `metadata.prazo_producao_dias`.
- `backend/AGENTS.md` e `backend/CLAUDE.md` vêm do starter da Medusa (convenções do framework).

## Estrutura

```
src/app/                 Rotas (App Router) e layout global
src/components/layout/   Header (logo centralizado, busca no hover), Footer, ícones
src/components/home/     Seções da home: Hero, ProductStrip, PillarsGrid, InstagramFeed
src/lib/                 Utilitários e dados placeholder (placeholders.ts)
public/brand/            Ativos da marca servidos pelo site
assets/brand/            Ativos originais da marca (fonte)
docs/                    Planejamento, decisões, design, LGPD
```

## Convenções

- TypeScript `strict`, sem `any`. Componentes funcionais.
- Cores e fontes só via tokens (`src/app/globals.css`), nunca valores soltos nos componentes (exceto os tons de placeholder).
- Preços sempre em **centavos inteiros** (`formatarPreco`).
- Texto de marca é **lorem ipsum** até a Brunna fornecer a copy. Não escrever texto institucional.
- Nenhum secret no código: usar `.env.local` (ignorado pelo git) e ver `.env.example`.
- `node_modules` e `.next` estão excluídos da sincronização do OneDrive.

## Pendências conhecidas

Ver [docs/DECISOES.md](docs/DECISOES.md), seção "Pendências".
