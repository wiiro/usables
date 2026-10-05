import type { Metadata } from "next";
import Link from "next/link";
import { PaginaTexto, Secao } from "@/components/texto/PaginaTexto";

export const metadata: Metadata = { title: "Trocas e devoluções" };

export default function Trocas() {
  return (
    <PaginaTexto titulo="Trocas e devoluções" rascunho atualizadoEm="[data de publicação]">
      <Secao titulo="Direito de arrependimento">
        <p>
          Em compras feitas pela internet, você pode desistir da compra em até <strong>7 dias corridos</strong> após o
          recebimento do produto, sem precisar justificar (Código de Defesa do Consumidor, art. 49). O produto deve ser
          devolvido sem uso e na embalagem original, e o valor pago é reembolsado integralmente. [Confirmar com o
          jurídico como isso se aplica a peças feitas sob demanda e a eventuais personalizações.]
        </p>
      </Secao>
      <Secao titulo="Defeito de fabricação">
        <p>
          Se a peça chegar com defeito, entre em contato em até [30 dias] pela página{" "}
          <Link href="/contato" className="underline">Contato</Link>, com fotos. Avaliaremos reparo, troca ou reembolso.
        </p>
      </Secao>
      <Secao titulo="Como solicitar">
        <p>
          Escreva pela página <Link href="/contato" className="underline">Contato</Link> informando o número do pedido.
          Orientamos o envio da devolução. [Definir quem arca com o frete de devolução.]
        </p>
      </Secao>
      <Secao titulo="Variações naturais do material">
        <p>
          Biomateriais têm variações próprias de cor e textura. Elas não configuram defeito. Veja os{" "}
          <Link href="/cuidados" className="underline">cuidados e manutenção</Link>.
        </p>
      </Secao>
    </PaginaTexto>
  );
}
