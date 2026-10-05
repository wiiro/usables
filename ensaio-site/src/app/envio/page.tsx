import type { Metadata } from "next";
import { PaginaTexto, Secao } from "@/components/texto/PaginaTexto";

export const metadata: Metadata = { title: "Envio" };

export default function Envio() {
  return (
    <PaginaTexto titulo="Envio" rascunho atualizadoEm="[data de publicação]">
      <Secao titulo="Onde entregamos">
        <p>Entregamos em todo o Brasil, pelos Correios.</p>
      </Secao>
      <Secao titulo="Prazo">
        <p>
          O prazo total é a soma do <strong>prazo de produção</strong> da peça (informado na página do produto, pois
          tudo é feito sob demanda) com o <strong>prazo de entrega</strong> da modalidade escolhida no checkout.
          [Detalhar prazos médios.]
        </p>
      </Secao>
      <Secao titulo="Frete">
        <p>
          O frete é calculado no checkout conforme o endereço e a modalidade. [Informar regras de frete grátis, se
          houver.]
        </p>
      </Secao>
      <Secao titulo="Rastreamento">
        <p>Enviamos o código de rastreamento por e-mail assim que o pedido for postado. [Confirmar.]</p>
      </Secao>
      <Secao titulo="Endereço incorreto ou entrega não realizada">
        <p>Confira o endereço antes de concluir. [Definir a política para reenvio e devolução ao remetente.]</p>
      </Secao>
    </PaginaTexto>
  );
}
