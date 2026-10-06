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
| Instagram | Só o link no rodapé (a faixa de fotos da home foi removida) |
| Abertura | Vídeo mudo em loop com fallback estático. Ainda sem vídeo: usa gradiente |
| Busca | Barra de largura total sob o cabeçalho; abre no hover do logo ou da lupa (desktop) e ao toque na lupa (mobile). Header **fixo** (acompanha a rolagem), logo centralizado com os links ao redor |
| Textos | Lorem ipsum nos textos de marca. Persona de referência: **Ana** |
| Arquitetura futura | Preparada para personalização DIY e marketplace; não implementada |
| Fontes | Substitutas livres (Space Mono, Ubuntu Mono) até confirmar licença de Geometry Soft Pro e Telegrama |
| Logo | Símbolo e **wordmark oficial** em PNG transparente (`public/brand/simbolo.png` e `wordmark.png`, originais em `assets/brand/`). Se vier uma versão vetorial (SVG), trocar em `Header.tsx` e `Footer.tsx` |
| Banco | PostgreSQL 17.11 nativo no Windows (serviço `postgresql-x64-17`), banco `ensaio_dev`, usuário `ensaio_app` com acesso só a ele |
| Backend | Starter oficial do Medusa 2.21 em `backend/` (Turborepo), sem o storefront do starter |
| Seed de dev | `seed-ensaio.ts` converte o demo europeu para Brasil/BRL com 6 joias fictícias. O `initial-data-seed` do starter continua no repositório e já foi aplicado ao banco |
| Next.js | **16.3** (migrado do 15.5 para eliminar as vulnerabilidades do PostCSS embutido; `npm audit` com 0 vulnerabilidades) |
| Testes | `vitest` (devDependency): 49 testes unitários de lógica pura e da camada do backend. `npm run smoke` confere 26 rotas. Sem E2E de navegador (Playwright baixa navegadores) |
| Carrinho e checkout | Cookies httpOnly com id do carrinho e token do cliente; ações de servidor; validação própria em `src/lib/validacao.ts` (sem biblioteca extra) |
| Pagamento (atual) | Provider de teste do Medusa (`pp_system_default`): o pedido é registrado sem cobrança. Mercado Pago **não** integrado |
| Frete (atual) | "Envio provisório" fixo (R$ 25,00). Melhor Envio **não** integrado |
| Conta | Cadastro, login, dados, endereços, pedidos, favoritos (em `metadata.wishlist` do cliente) |
| LGPD no código | Rotas próprias no backend: exportar dados e excluir (anonimizar) a conta. Pedidos são mantidos (com e-mail e endereço da compra, por obrigação fiscal), desvinculados da conta |
| Cookies | Banner com recusa equivalente; hoje só existem cookies essenciais |
| Materioteca e conteúdo | Módulo próprio do Medusa (`conteudo`): materiais e conteúdo da home editáveis no painel (telas "Materioteca" e "Conteúdo do site") |
| Textos jurídicos | Rascunhos marcados "para revisão jurídica", com colchetes `[ ]` a preencher |
| Manifesto | Texto real fornecido pela marca (Notion). Demais textos continuam lorem ipsum |

## Pendências

**Dependem de você (contas, arquivos ou decisões):**

1. **Mercado Pago** e **Melhor Envio**: criar contas e credenciais de teste; só então implemento os providers (código de pagamento não deve ser escrito sem poder testar).
2. **Hospedagem, domínio e e-mail transacional** (Resend): contas ainda não existem. Ver `DEPLOY.md`.
3. **Revisão jurídica** das políticas, termos, trocas e envio, e preenchimento dos dados da empresa (razão social, CNPJ, encarregado/DPO).
4. **Wordmark** do logo (arquivo melhor ou extração do PDF de 69 MB, que exige ferramenta de imagem) e **licença das fontes** Geometry Soft Pro e Telegrama.
5. **Textos da marca**: página "Proposta de Valor" do Notion está vazia; guia de cuidados e páginas dos pilares seguem em lorem ipsum.
6. **Vídeo e fotos reais** (hoje: animação simulada e artes de placeholder). Enviáveis pelo painel em "Conteúdo do site" e "Materioteca".
7. **Nota fiscal**: definir com o contador.
8. Excluir `backend/node_modules` e `backend/apps/backend/.medusa` da sincronização do OneDrive.

**Técnicas, antes de produção (ver `DEPLOY.md`, seção 6):**

- Redis nos módulos do Medusa (event bus, locking, cache).
- CSP estrita; HSTS no host.
- Limite de tentativas de login (WAF/CDN).
- Provedor de notificações (e-mails de pedido e redefinição de senha).
- Testar os Dockerfiles (Docker não está instalado na máquina de desenvolvimento).
- E2E de navegador (Playwright), se desejado.
