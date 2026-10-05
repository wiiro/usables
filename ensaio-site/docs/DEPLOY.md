# Publicação (deploy)

Este guia leva o site do ambiente local para a internet. **Nada aqui foi executado**: as contas (hospedagem, domínio, Mercado Pago, Melhor Envio, e-mail) ainda não existem. Os Dockerfiles não foram testados (não há Docker na máquina de desenvolvimento).

## 1. Visão geral

```
Cliente ──HTTPS──> Site (Next.js)  ──HTTPS──> Backend Medusa ──> PostgreSQL
                       │                          │
                       │                          ├──> Redis (eventos, cache, bloqueios)
                       │                          ├──> Mercado Pago (pagamento)
                       └──> Resend (contato)      └──> Melhor Envio (frete)
Admin (Brunna) ──HTTPS──> Backend Medusa (/app)
```

Sugestão de hospedagem (confirmar custos nas páginas dos provedores antes de contratar):

| Peça | Opção | Observação |
|---|---|---|
| Site | Vercel | Deploy a partir do GitHub, HTTPS automático |
| Backend + Redis + Postgres | Railway ou Render | Postgres gerenciado com backup diário |
| Domínio | Registro.br (`.com.br`) | Aponta o DNS para Vercel (site) e para o backend (subdomínio `api.`) |
| E-mail transacional | Resend | Verificar o domínio de envio (SPF/DKIM) |

## 2. Contas e credenciais necessárias

| Serviço | O que criar | Onde a credencial entra |
|---|---|---|
| Mercado Pago | Conta de vendedor, aplicação, credenciais de **teste** e depois de **produção** | Backend: `MERCADOPAGO_ACCESS_TOKEN` |
| Melhor Envio | Conta, token (sandbox e produção), dados do remetente | Backend: `MELHOR_ENVIO_TOKEN` |
| Resend | Conta, domínio verificado, API key | Site: `RESEND_API_KEY`, `CONTACT_FROM`, `CONTACT_TO` |
| Hospedagem | Contas Vercel e Railway/Render | Variáveis de ambiente do painel de cada uma |

Credenciais ficam **só** nas variáveis de ambiente do provedor ou em um cofre. Nunca no git, nunca em chat ou e-mail. Use credenciais separadas para teste e produção.

## 3. Variáveis de ambiente

**Backend** (`apps/backend`):

| Variável | Valor em produção |
|---|---|
| `DATABASE_URL` | URL do Postgres gerenciado (com SSL) |
| `JWT_SECRET`, `COOKIE_SECRET` | Aleatórios e longos (32+ bytes), **diferentes** dos de desenvolvimento |
| `AUTH_MFA_ENCRYPTION_KEY` | Chave aleatória de 64 hex |
| `STORE_CORS` | `https://seudominio.com.br` |
| `ADMIN_CORS`, `AUTH_CORS` | `https://api.seudominio.com.br` (e o do site, se o login do painel vier de lá) |
| `REDIS_URL` | URL do Redis (ver seção 6) |
| `MERCADOPAGO_ACCESS_TOKEN`, `MELHOR_ENVIO_TOKEN` | Quando as integrações existirem |

**Site**:

| Variável | Valor | Tipo |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://seudominio.com.br` | Embutida no build |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Chave publicável do backend de **produção** | Embutida no build |
| `MEDUSA_BACKEND_URL` | `https://api.seudominio.com.br` | Runtime |
| `NEXT_PUBLIC_WHATSAPP_NUMERO` | Só dígitos, com DDI (ex.: `5541999999999`) | Embutida no build |
| `RESEND_API_KEY`, `CONTACT_FROM`, `CONTACT_TO` | E-mail de contato | Runtime, segredo |

## 4. Passo a passo

1. **Banco**: criar o Postgres gerenciado e anotar a `DATABASE_URL`. Ative backup diário.
2. **Backend**: publicar `backend/` (Dockerfile de exemplo em `backend/Dockerfile`, ou o guia oficial do Medusa para o provedor escolhido). Definir as variáveis da seção 3.
3. **Migrações**: `npx medusa db:migrate` (o Dockerfile já faz ao subir).
4. **Usuário admin**: `npx medusa user -e <email> -p <senha forte>` rodado uma vez, no ambiente de produção. **Não** reutilizar o `admin@ensaio.local` de desenvolvimento.
5. **Dados iniciais**: **não rodar** `seed-ensaio.ts` nem `seed-cupons.ts` em produção (são de desenvolvimento, criam produtos fictícios e apagam produtos sem a marca de seed). Em produção, cadastrar região Brasil/BRL, local de estoque, opções de envio e produtos pelo painel.
6. **Chave publicável**: no painel, Settings > Publishable API Keys, ligar ao canal de vendas, copiar a chave para o site.
7. **Site**: importar o repositório na Vercel, **Root Directory = `ensaio-site`**, definir variáveis e publicar. (Com Docker: `docker build --build-arg NEXT_PUBLIC_SITE_URL=... .`.)
8. **Domínio**: apontar o DNS (`@`/`www` para a Vercel, `api` para o backend). Aguardar o HTTPS.
9. **Pagamento e frete**: integrar Mercado Pago e Melhor Envio (ainda **não implementados**, ver `DECISOES.md`), primeiro em sandbox.
10. **Verificação final**: seção 5.

## 5. Checklist pós-deploy

- [ ] `npm run smoke` apontando para a URL pública (`SITE_URL=https://... npm run smoke`)
- [ ] Compra de teste completa em **sandbox** (Pix e cartão), pedido aparece no painel
- [ ] Login do admin funciona; senha forte; admin local de dev não existe em produção
- [ ] HTTPS ativo, redirecionamento de `http` para `https`, HSTS ligado no host/CDN
- [ ] `/robots.txt` e `/sitemap.xml` com o domínio correto
- [ ] Formulário de contato entrega o e-mail
- [ ] Políticas de privacidade, termos, trocas e envio **revisadas por advogado** e sem colchetes `[ ]`
- [ ] Banner de cookies aparece; recusar funciona
- [ ] "Baixar meus dados" e "Excluir minha conta" testados com uma conta de teste
- [ ] Backup do banco rodando e **restauração testada** uma vez
- [ ] Monitoramento ativo (seção 8)
- [ ] Logs não mostram e-mail, CPF, telefone, senha ou token

## 6. Pendências técnicas antes de produção

- **Redis**: o backend avisa "Local Event Bus installed. This is not recommended for production". Em produção, configurar os módulos de Redis do Medusa (event bus, locking e cache) em `medusa-config.ts` com `REDIS_URL`. **Ainda não feito.**
- **Armazenamento de arquivos**: o upload do painel usa o disco local do backend. Em produção, configurar o módulo de arquivos do Medusa com S3 (ou compatível), senão os arquivos enviados (vídeo, fotos) são perdidos a cada deploy. **Ainda não feito.**
- **CSP**: o site envia `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e `Permissions-Policy`. Falta uma Content-Security-Policy estrita (exige nonce no Next).
- **Limite de tentativas de login**: o Medusa não limita tentativas. Ligar rate limiting no host/CDN (Vercel Firewall, Cloudflare) para `/auth/*` e `/store/customers`.
- **Redefinição de senha**: o endpoint existe, mas sem provedor de notificação não há e-mail. Implementar um subscriber de e-mail com Resend.
- **E-mails de pedido**: confirmação, envio e cancelamento também dependem desse provedor de notificação.
- **Nota fiscal**: fora do escopo; definir com o contador.

## 7. Rollback

- **Site**: na Vercel, "Promote to Production" em um deploy anterior (instantâneo). Com Docker, reimplantar a tag anterior.
- **Backend**: reimplantar a imagem/commit anterior. **Cuidado com migrações**: elas só avançam; antes de um deploy com migração, faça um backup manual e saiba restaurá-lo.
- **Banco**: restaurar o backup do provedor em uma instância nova, apontar `DATABASE_URL` para ela. Registrar o horário do incidente.
- **Regra**: nunca fazer `git push --force` em `main`.

## 8. Monitoramento

- Verificação de disponibilidade a cada minuto em `https://api.../health` e `https://.../` (UptimeRobot, Better Stack ou similar), com aviso por e-mail.
- Logs do provedor, revisados quando houver erro; nunca registrar dados pessoais.
- Opcional: Sentry no site e no backend (**analisar a LGPD** antes: erros podem conter dados pessoais; configurar para não enviá-los).

## 9. Backup

- Postgres: backup automático diário, retenção mínima de 7 dias.
- Teste de restauração: pelo menos uma vez antes de lançar e a cada trimestre.
- Arquivos de mídia (quando houver upload de imagens): backup do storage.

## 10. Proposta de integração contínua

Não foi criada (mudança de pipeline exige aprovação). Sugestão de workflow do GitHub Actions para `ensaio-site/`: `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, em cada pull request.
