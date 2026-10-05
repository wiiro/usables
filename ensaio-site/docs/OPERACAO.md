# Operação do dia a dia

Guia para quem administra a loja (cadastro de produtos, pedidos) e para quem mantém o sistema. Painel: `/app` no endereço do backend.

## Para quem cuida da loja (painel Medusa)

### Cadastrar uma peça
1. **Products > Create**. Título, descrição, **Status = Published**.
2. Em **Categories**, escolha Brincos, Earcuffs, Colares, Pulseiras ou Joias.
3. Em **Variants**, crie ao menos uma (ex.: título "Único"), com **SKU** e **preço em BRL** (em reais: `189` = R$ 189,00).
4. Como a venda é **sob demanda**, desmarque **Manage inventory** na variante (assim a peça nunca fica "sem estoque").
5. Em **Sales channels**, mantenha "Default Sales Channel".
6. Em **Metadata**, preencha: `material`, `origem`, `processo`, `cuidados` (textos) e `prazo_producao_dias` (**número**, ex.: `15`). Eles aparecem no bloco "Transparência" da página.
7. Envie as fotos em **Media**; a primeira vira a miniatura.
8. O site atualiza em até 60 segundos.

### Mudar preço ou tirar uma peça do ar
- Preço: abra a peça, edite a variante, salve.
- Tirar do ar: mude o status para **Draft**.

### Materioteca (menu "Materioteca" no painel)
1. **Novo material**: nome (o endereço da página é gerado sozinho), descrição, ingredientes, origem e imagem (botão **Enviar arquivo** ou cole um endereço).
2. **Ordem**: número menor aparece primeiro. **Mostrar no site** desligado esconde sem apagar.
3. Para ligar uma **peça** a um material, abra a peça, vá em **Metadata** e preencha `material` com o **identificador** do material (aparece na tabela da Materioteca, ex.: `casca-de-laranja`). A peça passa a aparecer na página do material, e o nome do material vira link na página da peça.
4. Excluir é reversível pelo banco (exclusão lógica), mas some do painel e do site.

### Conteúdo do site (menu "Conteúdo do site")
- **Vídeo da abertura**: envie um mp4 curto, sem áudio (até uns 5 MB). Sem vídeo, o site mostra a animação padrão. Capa opcional.
- **Instagram**: usuário, endereço do perfil e as imagens (uma por linha, até 12). O site **não** busca o Instagram sozinho; você cola as imagens.
- Salvar e esperar até 1 minuto.
- Em desenvolvimento, arquivos enviados ficam no disco do backend. **Em produção é preciso configurar armazenamento (S3 ou similar)**, senão os arquivos se perdem a cada publicação. Ver `DEPLOY.md`.

### Pedidos
- **Orders** lista os pedidos. Abra um pedido para ver itens, endereço e pagamento.
- Fluxo manual enquanto Mercado Pago e Melhor Envio não estão integrados: confira o pagamento no Mercado Pago, produza a peça, poste pelos Correios e registre o envio no pedido (**Create fulfillment**).
- Cancelamento e reembolso: pelo pedido, seguindo a política de trocas e devoluções.

### Cupons
**Promotions > Create**: código (ex.: `PRIMEIRA10`), tipo percentual ou valor fixo, aplicação ao pedido, datas de validade. O cliente digita o código na sacola.

### Clientes
**Customers** lista contas. Para atender um pedido de **eliminação de dados** (LGPD), o cliente mesmo pode usar "Excluir minha conta" em Minha conta. Se ele pedir por e-mail, oriente a usar o botão, ou peça ajuda técnica (a função está em `backend/apps/backend/src/api/store/customers/me/excluir`).

## Para quem mantém o sistema

### Rotina
| Quando | O quê |
|---|---|
| Toda semana | Ver `npm audit` do site e do backend; conferir se o backup do banco rodou |
| Todo mês | Atualizar dependências (patch/minor), rodar `npm test`, `npm run build` |
| Todo trimestre | Testar a **restauração** do backup; revisar acessos ao painel e à hospedagem |
| A cada mudança nas leis ou no fluxo de dados | Revisar `docs/LGPD.md` e a política de privacidade |

### Trocar segredos
Trocar `JWT_SECRET`, `COOKIE_SECRET` e tokens de integração a cada 6 a 12 meses, ou na hora, se houver suspeita de vazamento. Trocar `JWT_SECRET` desloga todos os usuários.

### Incidente de segurança com dados pessoais
1. Conter: revogar credenciais envolvidas, tirar o recurso do ar se necessário.
2. Registrar o que aconteceu, quando e quais dados foram afetados.
3. Avisar o encarregado (DPO) imediatamente. A LGPD (art. 48) exige comunicar a ANPD e os titulares quando há risco ou dano relevante; o prazo regulamentado é curto (conferir a Resolução CD/ANPD nº 15/2024 com o jurídico).
4. Corrigir a causa e documentar a lição aprendida.

### Dados de desenvolvimento
- `seed-ensaio.ts` e `seed-cupons.ts` são **só para desenvolvimento**. Nunca rodar em produção.
- Nunca copiar dados reais de clientes para o ambiente local (LGPD).
- Os pedidos #1 a #4 do banco local são testes.

### Comandos úteis (desenvolvimento)
Ver `COMO-TESTAR.md`. Testes: `npm test`. Fumaça: `npm run smoke`.
