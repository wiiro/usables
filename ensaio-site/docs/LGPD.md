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

- [ ] Política de privacidade, termos de uso, trocas e envio (rascunhos na fase 8, revisão jurídica)
- [ ] Banner de cookies com recusa tão fácil quanto aceitar
- [ ] Conta do cliente: acesso, correção, **exclusão**, exportação (portabilidade), revogação de consentimento
- [ ] Prazo de retenção definido por tipo de dado
- [ ] Logs só com identificadores, nunca CPF, e-mail, token ou dados de pagamento
- [ ] Lista de operadores e terceiros (Mercado Pago, Melhor Envio, e-mail transacional, hospedagem)
- [ ] Dados de produção nunca em dev/staging sem anonimização
- [ ] Dados pessoais sensíveis/financeiros criptografados em repouso
- [ ] Canal do encarregado (DPO) publicado
- [ ] Backups com política de retenção compatível com pedidos de exclusão
