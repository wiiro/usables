# Decisões do projeto

## Registradas

| Tema | Decisão |
|---|---|
| Modelo de venda | **Sob demanda**, com campo de prazo de produção no produto (v1) |
| Região e frete | Somente Brasil. Frete via **Melhor Envio** (Correios) |
| Pagamento | Mercado Pago (Pix + cartão) |
| Backend | **Medusa v2** (aprovado, ciente da responsabilidade de operação e LGPD). Plano B: Shopify headless, com o front desacoplado |
| Front | Next.js (App Router) + TypeScript strict + Tailwind v4 |
| Painel | Medusa Admin em pt-BR + telas extras para home e Materioteca (fase 3) |
| v1 | Conta, lista de desejos, cupons, guia de cuidados, contato, template de WhatsApp |
| Instagram | Manual (sem API) |
| Abertura | Vídeo mudo em loop com fallback estático. Ainda sem vídeo: usa gradiente |
| Busca | Hover/foco no logo (desktop); lupa (mobile). Header não fixo, logo centralizado |
| Textos | Lorem ipsum nos textos de marca. Persona de referência: **Ana** |
| Arquitetura futura | Preparada para personalização DIY e marketplace; não implementada |
| Fontes | Substitutas livres (Space Mono, Ubuntu Mono) até confirmar licença de Geometry Soft Pro e Telegrama |
| Logo | Símbolo em PNG (`assets/brand/simbolo.png`). Wordmark provisório em texto no header; trocar pelo logo extraído do PDF e depois pelo oficial |
| Banco | PostgreSQL 17.11 nativo no Windows (serviço `postgresql-x64-17`), banco `ensaio_dev`, usuário `ensaio_app` com acesso só a ele |
| Backend | Starter oficial do Medusa 2.21 em `backend/` (Turborepo), sem o storefront do starter |
| Seed de dev | `seed-ensaio.ts` converte o demo europeu para Brasil/BRL com 6 joias fictícias. O `initial-data-seed` do starter continua no repositório e já foi aplicado ao banco |

## Pendências

0. **Medusa**: o starter instalou `backend/node_modules` (cerca de 700 MB). Excluir `backend/node_modules` e `backend/apps/backend/.medusa` da sincronização do OneDrive, como já feito no front.

1. **Wordmark**: extrair do PDF de marca (69 MB; falta ferramenta de extração de imagem) ou receber arquivo melhor.
2. **Licença das fontes** Geometry Soft Pro e Telegrama.
3. **Vulnerabilidades**: `npm audit` aponta 2 (1 alta, 1 moderada) no Next 15.5 via PostCSS. A correção sugerida é Next 16 (mudança incompatível). Avaliar a migração antes do deploy.
4. **Página "Proposta de Valor"** do Notion está vazia.
5. **Contas**: Mercado Pago, Melhor Envio, hospedagem e domínio ainda não existem.
6. **Nota fiscal**: emissão fora do escopo da v1; definir com o contador.
7. Rotas ainda inexistentes (retornam 404): `/loja`, `/materioteca`, `/processo`, pilares, `/conta`, `/carrinho`, políticas.
