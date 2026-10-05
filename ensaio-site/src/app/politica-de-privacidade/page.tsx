import type { Metadata } from "next";
import Link from "next/link";
import { PaginaTexto, Secao } from "@/components/texto/PaginaTexto";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function Privacidade() {
  return (
    <PaginaTexto titulo="Política de privacidade" rascunho atualizadoEm="[data de publicação]">
      <p>
        Esta política explica como a <strong>[RAZÃO SOCIAL] (&ldquo;ensaio&rdquo;)</strong>, CNPJ [CNPJ], com sede em
        [ENDEREÇO], trata dados pessoais de quem visita o site e compra nele, em conformidade com a Lei Geral de
        Proteção de Dados (Lei 13.709/2018, &ldquo;LGPD&rdquo;).
      </p>

      <Secao titulo="1. Quem é o controlador e o encarregado">
        <p>
          O controlador é a [RAZÃO SOCIAL]. O encarregado pelo tratamento de dados (DPO) é [NOME DO ENCARREGADO],
          contato: [E-MAIL DO ENCARREGADO].
        </p>
      </Secao>

      <Secao titulo="2. Quais dados coletamos e para quê">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Cadastro e conta:</strong> nome, e-mail e senha (armazenada de forma protegida, nunca em texto
            aberto). Finalidade: criar e manter sua conta. Base legal: execução de contrato (LGPD, art. 7º, V).
          </li>
          <li>
            <strong>Compra e entrega:</strong> nome, e-mail, telefone, endereço de entrega e itens do pedido.
            Finalidade: processar o pedido, calcular frete e entregar. Base legal: execução de contrato (art. 7º, V).
          </li>
          <li>
            <strong>Pagamento:</strong> os dados de cartão ou Pix são tratados diretamente pelo provedor de pagamento
            ([Mercado Pago]). O site não armazena número de cartão.
          </li>
          <li>
            <strong>Nota fiscal e obrigações legais:</strong> dados do pedido e, quando exigido, CPF/CNPJ. Base legal:
            cumprimento de obrigação legal (art. 7º, II).
          </li>
          <li>
            <strong>Mensagens de contato:</strong> nome, e-mail e conteúdo da mensagem. Finalidade: responder você. Base
            legal: consentimento (art. 7º, I) e procedimentos preliminares a contrato (art. 7º, V).
          </li>
          <li>
            <strong>Cookies essenciais:</strong> mantêm sua sacola e sua sessão. Base legal: legítimo interesse e
            execução de contrato. Cookies de análise ou marketing só são usados com seu consentimento (veja a seção 6).
          </li>
          <li>
            <strong>Lista de favoritos:</strong> peças que você marca, associadas à sua conta, para oferecer a
            funcionalidade.
          </li>
        </ul>
        <p>Não coletamos dados pessoais sensíveis (LGPD, art. 5º, II).</p>
      </Secao>

      <Secao titulo="3. Com quem compartilhamos">
        <p>Compartilhamos apenas o necessário com operadores que nos prestam serviço:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>[Mercado Pago]: processamento de pagamentos.</li>
          <li>[Melhor Envio / Correios]: cálculo de frete e entrega (nome, endereço e telefone).</li>
          <li>[Provedor de hospedagem e banco de dados]: armazenamento da loja.</li>
          <li>[Provedor de e-mail]: envio de mensagens do site.</li>
          <li>Autoridades, quando houver obrigação legal ou ordem judicial.</li>
        </ul>
        <p>Não vendemos dados pessoais.</p>
      </Secao>

      <Secao titulo="4. Transferência internacional">
        <p>
          Alguns provedores podem armazenar dados fora do Brasil. Nesses casos, adotamos as salvaguardas previstas nos
          arts. 33 a 36 da LGPD. [Confirmar a localização dos servidores contratados.]
        </p>
      </Secao>

      <Secao titulo="5. Por quanto tempo guardamos">
        <ul className="list-disc space-y-2 pl-6">
          <li>Conta e favoritos: enquanto a conta existir. Ao excluí-la, o cadastro é anonimizado.</li>
          <li>
            Pedidos e notas fiscais: [5 anos], por obrigação legal e fiscal. Após a exclusão da conta, o pedido
            permanece com os dados da compra (como e-mail e endereço de entrega), mas sem vínculo com a conta.
          </li>
          <li>Mensagens de contato: [12 meses] ou até você pedir a eliminação.</li>
        </ul>
      </Secao>

      <Secao titulo="6. Cookies">
        <p>
          Usamos cookies essenciais (sessão e sacola), que não dependem de consentimento. Cookies de análise e de
          marketing, se um dia forem usados, ficam desligados até você aceitar no aviso de cookies, e você pode mudar
          de ideia a qualquer momento em &ldquo;Preferências de cookies&rdquo; no rodapé.
        </p>
      </Secao>

      <Secao titulo="7. Seus direitos (LGPD, art. 18)">
        <p>Você pode, a qualquer momento:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>confirmar que tratamos seus dados e ter <strong>acesso</strong> a eles;</li>
          <li><strong>corrigir</strong> dados incompletos ou desatualizados (em <Link href="/conta" className="underline">Minha conta</Link>);</li>
          <li>receber uma cópia em formato estruturado (<strong>portabilidade</strong>): botão &ldquo;Baixar meus dados&rdquo; em Minha conta;</li>
          <li><strong>excluir</strong> sua conta e anonimizar seu cadastro: botão &ldquo;Excluir minha conta&rdquo; em Minha conta;</li>
          <li>revogar o consentimento e pedir informações sobre compartilhamento;</li>
          <li>apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).</li>
        </ul>
        <p>Para qualquer pedido, escreva ao encarregado: [E-MAIL DO ENCARREGADO]. Respondemos em até [15 dias].</p>
      </Secao>

      <Secao titulo="8. Segurança">
        <p>
          Usamos conexão criptografada (HTTPS), senhas protegidas, acesso restrito aos sistemas e registros sem dados
          pessoais. Nenhum sistema é totalmente imune; em caso de incidente com risco relevante, comunicaremos você e a
          ANPD, conforme a lei.
        </p>
      </Secao>

      <Secao titulo="9. Crianças e adolescentes">
        <p>O site não é direcionado a menores de 18 anos, e não coletamos seus dados intencionalmente.</p>
      </Secao>

      <Secao titulo="10. Mudanças nesta política">
        <p>Podemos atualizar esta política. A data de atualização fica no topo da página.</p>
      </Secao>
    </PaginaTexto>
  );
}
