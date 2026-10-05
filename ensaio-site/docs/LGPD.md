# LGPD (Lei 13.709/2018): checklist

Este documento é um guia técnico, **não** parecer jurídico. Políticas e termos finais precisam de revisão jurídica.

## Dados tratados

| Dado | Finalidade | Base legal | Observação |
|---|---|---|---|
| Nome, e-mail, telefone | Conta, contato, pedido | Execução de contrato | |
| Endereço | Entrega | Execução de contrato | Compartilhado com Melhor Envio |
| CPF | Pagamento, nota fiscal | Execução de contrato / obrigação legal | Só se exigido; nunca em log |
| Dados de pagamento | Cobrança | Execução de contrato | Ficam no Mercado Pago; o site não armazena cartão |
| E-mail (newsletter) | Marketing | Consentimento | Opt-in explícito, revogável |
| Cookies não essenciais | Analytics/marketing | Consentimento | Desligados por padrão |

## Requisitos para as fases futuras

- [~] Política de privacidade, termos de uso, trocas e envio: **rascunhos escritos**, aguardam revisão jurídica e dados da empresa
- [x] Banner de cookies com recusa tão fácil quanto aceitar (`BannerCookies`); preferências reabríveis no rodapé
- [x] Conta do cliente: acesso e correção (Minha conta), **exclusão** (anonimização), exportação em JSON (portabilidade)
- [~] Revogação de consentimento: cookies sim; newsletter ainda não existe
- [~] Prazo de retenção definido por tipo de dado: constam como `[...]` na política, a decidir com o jurídico
- [x] Logs só com identificadores e tipo de erro; nunca e-mail, CPF, telefone, senha ou token (conferido nas ações do servidor)
- [~] Lista de operadores e terceiros: na política, com colchetes a confirmar
- [ ] Dados de produção nunca em dev/staging sem anonimização (regra de processo; nenhum dado real foi usado)
- [ ] Dados pessoais sensíveis/financeiros criptografados em repouso (cartão fica no Mercado Pago; confirmar criptografia do banco no provedor)
- [ ] Canal do encarregado (DPO) publicado (precisa do nome e e-mail)
- [ ] Backups com política de retenção compatível com pedidos de exclusão (definir no provedor)

Legenda: [x] feito · [~] parcial · [ ] pendente.

## Como o código atende cada direito

| Direito (art. 18) | Onde |
|---|---|
| Acesso e portabilidade | `GET /store/customers/me/exportar` (backend) e o botão "Baixar meus dados" em `/conta` |
| Correção | Formulário de dados e de endereços em `/conta` |
| Eliminação | `POST /store/customers/me/excluir` (backend, exige `{"confirmar": true}`): remove credencial de login e endereços, anonimiza nome, e-mail e telefone, limpa favoritos. **Pedidos permanecem** com os dados da compra (e-mail e endereço de entrega), desvinculados da conta, por obrigação legal e fiscal (art. 16, I). Prazo de guarda a definir com o jurídico |
| Informação sobre compartilhamento | Política de privacidade, seção 3 |
| Revogação do consentimento | "Preferências de cookies" no rodapé |
