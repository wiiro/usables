# Planejamento

Decisões em [DECISOES.md](DECISOES.md). Design em [DESIGN.md](DESIGN.md). LGPD em [LGPD.md](LGPD.md).

## Marca (resumo do Notion e do PDF)

- Estúdio de design autoral que pesquisa biomateriais; a loja nasce da pesquisa.
- Tom: primeira pessoa, sincero, sem discurso de marketing, transparente sobre processo.
- Valores: Experimentação, Autoralidade, Responsabilidade, Cuidado.
- Persona de referência: Ana, 30, área criativa; compra pouco, valoriza durabilidade, manutenção e transparência.

## Arquitetura

| Camada | Escolha |
|---|---|
| Storefront | Next.js 15 (App Router), TypeScript strict, Tailwind v4 |
| Loja | Medusa v2 (Node + Postgres), Medusa Admin em pt-BR |
| Pagamento | Mercado Pago (provider customizado) |
| Frete | Melhor Envio (fulfillment provider customizado) |
| E-mail | Resend ou SES |
| Hospedagem sugerida | Vercel (front), Railway/Render (Medusa + Postgres), domínio `.com.br` |

## Mapa de páginas

Home · Loja (categorias: Brincos, Earcuffs, Colares, Pulseiras, Joias) · Produto · Carrinho/Checkout · Conta (pedidos, endereços, lista de desejos) · Materioteca · Processo · Páginas de pilar · Manifesto · Cuidados e manutenção · Contato · Políticas.

## Dados específicos

- Produto: material (liga à Materioteca), origem, processo, cuidados, prazo de produção, número da edição (se limitada).
- Materioteca: nome, descrição, ingredientes, origem, fotos, produtos relacionados.
- Conteúdo editável: vídeo da abertura e link do Instagram.
- Futuro (só preparado): personalização DIY por metadados na linha do pedido; canais de venda para marketplace.

## Fases

| Fase | Entrega | Status |
|---|---|---|
| 0 | Repositório, README, convenções | Feito |
| 1 | Design tokens e fontes substitutas | Feito (fontes oficiais pendentes) |
| 2 | Home com placeholders | Feito |
| 3 | Backend Medusa, produtos de exemplo, painel pt-BR | Feito |
| 4 | Loja, produto, busca, Materioteca | Feito (Materioteca lê do painel) |
| 5 | Carrinho, checkout, pagamento, frete | **Parcial**: carrinho, cupom, checkout e pedido funcionam (pagamento de teste, frete fixo). Mercado Pago e Melhor Envio aguardam credenciais |
| 6 | Conta, lista de desejos, cupons | Feito |
| 7 | Institucionais, guia de cuidados, contato, WhatsApp | Feito (textos em lorem ipsum, exceto o Manifesto; contato depende do Resend) |
| 8 | LGPD: políticas, cookies, exportar/excluir dados | Feito no código; textos jurídicos são rascunhos |
| 9 | Acessibilidade, performance, SEO, testes | Feito (SEO, cabeçalhos de segurança, 49 testes, smoke). Sem E2E de navegador |
| 10 | Deploy, domínio, monitoramento, runbook | Documentação e Dockerfiles prontos; **nada publicado** (faltam contas) |

## Riscos

Licença de fontes · vídeo pesado no mobile · operação do Medusa (backup, atualização, segurança) · nota fiscal fora do escopo · escopo (DIY e marketplace só como arquitetura).
