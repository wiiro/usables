import type { Metadata } from "next";
import Link from "next/link";
import { PaginaTexto, Secao } from "@/components/texto/PaginaTexto";

export const metadata: Metadata = { title: "Termos de uso" };

export default function Termos() {
  return (
    <PaginaTexto titulo="Termos de uso" rascunho atualizadoEm="[data de publicação]">
      <p>
        Ao usar este site e comprar nele, você concorda com estes termos. Eles são oferecidos pela [RAZÃO SOCIAL]
        (&ldquo;ensaio&rdquo;), CNPJ [CNPJ].
      </p>

      <Secao titulo="1. O site e a conta">
        <p>
          Você pode navegar sem cadastro. Para acompanhar pedidos e guardar favoritos, crie uma conta com informações
          verdadeiras e mantenha sua senha em sigilo. Você é responsável pelo que ocorre na sua conta.
        </p>
      </Secao>

      <Secao titulo="2. Produtos">
        <p>
          As peças são de design autoral e feitas sob demanda. Por serem produzidas artesanalmente com biomateriais,
          pequenas variações de cor, textura e acabamento são características do material, não defeitos. Fotos são
          ilustrativas.
        </p>
        <p>O prazo de produção informado em cada peça soma-se ao prazo de entrega.</p>
      </Secao>

      <Secao titulo="3. Preços e pagamento">
        <p>
          Os preços estão em reais (R$) e podem mudar sem aviso prévio, sem afetar pedidos já confirmados. O pedido é
          confirmado após a aprovação do pagamento. Formas de pagamento disponíveis: [Pix, cartão de crédito].
        </p>
      </Secao>

      <Secao titulo="4. Entrega, trocas e devoluções">
        <p>
          Veja as páginas <Link href="/envio" className="underline">Envio</Link> e{" "}
          <Link href="/trocas-e-devolucoes" className="underline">Trocas e devoluções</Link>.
        </p>
      </Secao>

      <Secao titulo="5. Propriedade intelectual">
        <p>
          Textos, imagens, vídeos, marca e design do site pertencem à ensaio ou a seus autores. É proibido copiar ou
          reproduzir sem autorização.
        </p>
      </Secao>

      <Secao titulo="6. Dados pessoais">
        <p>
          O tratamento de dados segue a <Link href="/politica-de-privacidade" className="underline">política de privacidade</Link>.
        </p>
      </Secao>

      <Secao titulo="7. Limitação de responsabilidade">
        <p>
          Empenhamo-nos para manter o site disponível e correto, mas podem ocorrer instabilidades ou erros. [Ajustar
          conforme orientação jurídica, respeitando o Código de Defesa do Consumidor.]
        </p>
      </Secao>

      <Secao titulo="8. Lei aplicável e foro">
        <p>Estes termos seguem as leis brasileiras. Fica eleito o foro do domicílio do consumidor. [Revisar.]</p>
      </Secao>
    </PaginaTexto>
  );
}
