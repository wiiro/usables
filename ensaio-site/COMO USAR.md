# Como usar (teste local)

## Em 3 passos

1. **Dê dois cliques em [`INICIAR.bat`](INICIAR.bat).** Ele confere o PostgreSQL, sobe o backend e o site, e abre o navegador sozinho. Na primeira vez pode levar 1 a 3 minutos.
2. **Teste.** O **site (a loja)** fica em http://localhost:3000 e o **painel de administração** em http://localhost:9000/app. Atenção: http://localhost:9000/ (sem /app) é só o backend e não tem página.
3. **Dê dois cliques em [`PARAR.bat`](PARAR.bat)** quando terminar.

Duas janelas pretas (`ensaio-backend` e `ensaio-site`) ficam abertas enquanto o ambiente roda. É normal; não feche, use o `PARAR.bat`.

## Como logar

### Painel de administração (cadastrar produtos, preços, pedidos)

| | |
|---|---|
| Endereço | http://localhost:9000/app |
| E-mail | `admin@ensaio.local` |
| Senha | Dê dois cliques em [`COPIAR-SENHA-ADMIN.bat`](COPIAR-SENHA-ADMIN.bat) e cole (Ctrl+V) no campo de senha |

A senha **não fica escrita neste arquivo** de propósito: ela está só em `backend/apps/backend/.env`, que o git ignora. Não envie esse arquivo nem a senha por chat ou e-mail.

Para o painel ficar em português: depois de entrar, **Settings > Profile > idioma > Português (Brasil)**.

### Site (loja)

O site ainda **não tem login de cliente**. Conta, carrinho e checkout entram nas fases 5 e 6. Por enquanto você só navega, busca e vê as peças.

## O que testar

- **Home**: passe o mouse no logo para a busca aparecer; role a faixa de peças; clique nos 6 quadrados.
- **Loja** (`/loja`): filtre por categoria e busque por "colar".
- **Produto**: abra uma peça e veja prazo de produção e "Transparência".
- **Painel**: Products > abra uma peça > mude o preço > salve. No site, recarregue `/loja` (até 60 s de cache).

Roteiro completo com resultados esperados: [docs/COMO-TESTAR.md](docs/COMO-TESTAR.md).

## Se algo der errado

| Sintoma | O que fazer |
|---|---|
| O painel abre mas o **site** (porta 3000) não | Veja a janela `ensaio-site`. Se ela não existir, rode `PARAR.bat` e `INICIAR.bat`; o passo a passo fica gravado em `iniciar.log` (mande esse arquivo se precisar de ajuda) |
| Mensagem "PostgreSQL nao esta rodando" | Abra o app **Serviços** do Windows, clique com o botão direito em `postgresql-x64-17` > **Iniciar**; rode `INICIAR.bat` de novo |
| "O backend nao respondeu em 3 minutos" | Veja o erro na janela `ensaio-backend`. Se citar `native binding` / `DACL`, confira se a pasta `%USERPROFILE%\.swc-cache` existe |
| Site abre mas a loja mostra erro | O backend caiu. Rode `PARAR.bat` e depois `INICIAR.bat` |
| Painel não aceita a senha | Rode `COPIAR-SENHA-ADMIN.bat` de novo e cole sem espaços extras |
| Porta 3000 ou 9000 em uso por outro programa | Rode `PARAR.bat` (ele encerra o que estiver nessas portas) e tente de novo |
| O navegador não abriu sozinho | Abra manualmente http://localhost:3000 |

## Observações

- Isto é um ambiente de **desenvolvimento**, só na sua máquina (`localhost`). Ninguém mais acessa.
- Os produtos são **fictícios**.
- Os arquivos `.bat` não instalam nada e não alteram o sistema; só iniciam e encerram os programas do projeto.
