# Como rodar e testar

Cobre o site completo (fases 0 a 10, exceto pagamento real e frete real): home, loja, produto, busca, sacola, cupom, checkout, conta, favoritos, Materioteca, páginas institucionais e LGPD, lendo tudo do Medusa.

Os comandos são para PowerShell. Dois terminais: um para o backend, outro para o site.

## 0. Antes de começar

1. O PostgreSQL precisa estar rodando:
   ```powershell
   Get-Service postgresql-x64-17
   ```
   Se estiver `Stopped`, inicie pelo app **Serviços** do Windows (precisa de administrador).
2. As dependências já estão instaladas. Se clonou o projeto em outra máquina, rode `npm install` em `ensaio-site/` e em `ensaio-site/backend/`.
3. Os arquivos de segredo precisam existir (já criados nesta máquina, nunca versionados):
   - `ensaio-site/.env.local` (URL do backend e chave publicável)
   - `ensaio-site/backend/apps/backend/.env` (banco, segredos do Medusa, admin local)

## 1. Terminal 1: backend (Medusa)

```powershell
cd "C:\Users\willian.lima\OneDrive - SRM Asset\Área de Trabalho\Tracker 2.0\usables\ensaio-site\backend\apps\backend"
$env:SWC_NATIVE_BINDING_CACHE = "$HOME\.swc-cache"
$env:MEDUSA_DISABLE_TELEMETRY = "1"
npx medusa develop
```

Pronto quando aparecer `Admin URL → http://localhost:9000/app`. Teste rápido: abrir http://localhost:9000/health deve responder `OK`.

## 2. Terminal 2: site (Next.js)

```powershell
cd "C:\Users\willian.lima\OneDrive - SRM Asset\Área de Trabalho\Tracker 2.0\usables\ensaio-site"
npm run dev
```

Abra http://localhost:3000.

## 3. Roteiro de teste manual (site)

| # | O que fazer | Resultado esperado |
|---|---|---|
| 1 | Abrir `/` | Header com logo "ensaio" centralizado, abertura em gradiente, faixa de peças, grade de 6 pilares, Instagram, rodapé |
| 2 | Passar o mouse sobre o logo (desktop) | Campo de busca aparece abaixo do logo; some ao tirar o mouse |
| 3 | Navegar com Tab até o logo | A busca também aparece (acessibilidade) |
| 4 | Reduzir a janela para largura de celular (ou F12 > modo dispositivo) | Lupa à esquerda abre e fecha a busca; menu lateral some |
| 5 | Faixa de peças: setas ou arrastar | Rola de lado, com encaixe (snap) |
| 6 | Clicar em "Ver tudo" ou `/loja` | Grade com as 6 peças e preços em R$ (ex.: R$ 189,00) |
| 7 | Clicar em "Brincos" | Só as 2 peças da categoria; URL `?categoria=brincos` |
| 8 | Buscar "colar" pelo campo do logo | Só "Colar Exemplo 03" |
| 9 | Buscar algo inexistente (ex.: "zzz") | Mensagem "Nenhuma peça encontrada" |
| 10 | Abrir uma peça | Nome, preço, prazo de produção (15 dias úteis), bloco Transparência; botão da sacola desativado |
| 11 | Abrir `/loja/qualquer-coisa` | Página 404 |
| 12 | Clicar nos 6 quadrados da home | Todos abrem uma página (Materioteca tem layout próprio, os outros são lorem ipsum) |
| 13 | Rodapé: Instagram | Abre instagram.com em outra aba |



## 3b. Roteiro: compra, conta, LGPD e conteúdo

| # | O que fazer | Resultado esperado |
|---|---|---|
| 1 | Em uma peça, "Adicionar à sacola" | Mensagem "Adicionado"; o ícone da sacola no topo mostra o número |
| 2 | `/carrinho`: mudar quantidade, remover, voltar | Totais atualizam; sacola vazia mostra "Sua sacola está vazia" |
| 3 | Cupom `ENSAIO10` (10%) | Desconto aparece no resumo; código inválido mostra erro |
| 4 | "Finalizar compra" sem preencher nada | Mensagem de erro em português, sem perder o que foi digitado |
| 5 | Preencher o checkout, escolher envio, concluir | Página "Pedido recebido" com o número; frete de R$ 25,00 (provisório); pagamento é de teste |
| 6 | `/conta/criar`: tentar sem marcar o aceite | Erro pedindo o aceite dos termos |
| 7 | Criar conta completa | Cai em "Minha conta" com seu nome |
| 8 | Favoritar uma peça; abrir `/conta/favoritos` | Peça aparece; "Remover dos favoritos" funciona |
| 9 | Comprar logado; abrir `/conta/pedidos` | Pedido listado com o total certo; checkout vem preenchido com seus dados |
| 10 | Minha conta: editar dados, adicionar e remover endereço | Mensagens de confirmação |
| 11 | "Baixar meus dados (JSON)" | Baixa `meus-dados-ensaio.json` com cadastro, endereços e pedidos |
| 12 | "Excluir minha conta" digitando `EXCLUIR` | Volta à home; login com a mesma senha deixa de funcionar |
| 13 | Banner de cookies: "Só essenciais" | Banner some e não volta; "Preferências de cookies" no rodapé o reabre |
| 14 | `/manifesto`, `/politica-de-privacidade`, `/termos-de-uso`, `/envio`, `/trocas-e-devolucoes`, `/cuidados`, `/contato` | Abrem; os jurídicos mostram o aviso "Rascunho para revisão jurídica" |
| 15 | `/contato`: enviar o formulário | Sem Resend configurado, mostra "indisponível no momento" (esperado em desenvolvimento) |
| 16 | `/materioteca` e um material | Materiais criados no painel aparecem; detalhe abre |
| 17 | Painel > "Conteúdo do site": colocar usuário e imagens do Instagram, salvar | Em até 1 minuto o rodapé da home mostra os dados |
| 18 | Painel > "Materioteca": criar, editar, ocultar e excluir | Reflete no site |

## 4. Testar o painel (Medusa Admin)

1. Abrir http://localhost:9000/app
2. Entrar com `admin@ensaio.local`. A senha está em `backend/apps/backend/.env`, no campo `ADMIN_PASSWORD`.
3. Trocar o idioma: Settings > Profile > idioma "Português (Brasil)".
4. Ir em **Products**, abrir "Colar Exemplo 03", mudar o preço da variante e salvar.
5. Voltar ao site e recarregar `/loja`: o novo preço aparece em até **60 segundos** (cache). Para ver na hora, reinicie o `npm run dev`.
6. Criar um produto novo (título, categoria, uma variante com preço em BRL, canal de venda "Default Sales Channel", status Published). Ele deve aparecer na loja. Em Metadata, use as chaves `material`, `origem`, `processo`, `cuidados` e `prazo_producao_dias` (número) para preencher o bloco Transparência.
7. No Medusa o preço é em reais, não em centavos: `189` = R$ 189,00.

## 5. Testar a falha do backend

1. No Terminal 1, `Ctrl+C` para parar o Medusa.
2. Recarregar `/`: a home continua e mostra placeholders (o erro vai para o log do Terminal 2).
3. Abrir `/loja`: aparece "Não foi possível carregar a loja" com botão "Tentar de novo".
4. Subir o backend de novo e clicar no botão.

## 6. Testes automáticos (checagens)

No diretório `ensaio-site/`:

```powershell
npm run typecheck   # tipos
npm run lint        # ESLint
npm test            # testes unitários (vitest)
npm run build       # build de produção (também roda lint e tipos); precisa do backend no ar para gerar a home com dados reais
```

Testes automáticos: `npm test` (49 testes unitários) e, com o site e o backend no ar, `npm run smoke` (26 rotas). Ainda **não há E2E de navegador**.

## 7. Restaurar os dados de desenvolvimento

O seed é idempotente: remove o demo do starter e recria só o que faltar.

```powershell
cd ...\ensaio-site\backend\apps\backend
$env:SWC_NATIVE_BINDING_CACHE = "$HOME\.swc-cache"
npx medusa exec ./src/scripts/seed-ensaio.ts
```

Atenção: produtos criados manualmente **sem** `metadata.ensaio_seed` são tratados como demo e removidos pelo seed. Não rode em um banco com dados reais.

## 8. Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| `Failed to load native binding` / `DACL grants replacement rights` | O SWC recusa a pasta `AppData\Local`. Definir `$env:SWC_NATIVE_BINDING_CACHE = "$HOME\.swc-cache"` no terminal |
| `ECONNREFUSED` ou `connection refused` no backend | PostgreSQL parado. Ver passo 0 |
| Loja mostra erro ou home só com placeholders | Backend fora do ar, ou `.env.local` sem `MEDUSA_BACKEND_URL` / chave publicável |
| 401 ou 403 da Store API | Chave publicável errada. Buscar a atual em `api_key` (tipo `publishable`) e atualizar `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` |
| Porta 3000 ou 9000 ocupada | Há outra instância rodando. Fechar a anterior |
| Build falha com erro de tipos em `backend/` | O `tsconfig.json` do site deve ter `"exclude": ["node_modules", "backend"]` |
| OneDrive travando ou conflitando | Excluir `node_modules`, `.next` e `backend/apps/backend/.medusa` da sincronização |
| Preço aparece 100x maior ou menor | Mistura de unidades: Medusa usa reais, o site converte para centavos em `src/lib/catalogo.ts` |
