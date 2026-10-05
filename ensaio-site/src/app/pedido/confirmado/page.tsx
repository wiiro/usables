import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Pedido recebido", robots: { index: false } };

type Props = { searchParams: Promise<{ n?: string }> };

export default async function PedidoConfirmado({ searchParams }: Props) {
  const { n } = await searchParams;
  // O número vem da URL: só exibimos se for um inteiro curto.
  const numero = n && /^\d{1,9}$/.test(n) ? n : undefined;

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-titulo text-3xl font-bold">Pedido recebido</h1>
      {numero ? <p className="mt-4 text-lg">Número do pedido: <strong>#{numero}</strong></p> : null}
      <p className="mt-4">Guarde este número. Se tiver conta, você acompanha o pedido em &ldquo;Minha conta&rdquo;.</p>
      <Link href="/loja" className="mt-8 inline-block border border-terracota bg-terracota px-6 py-3 uppercase tracking-widest text-white hover:bg-terracota-vivo">
        Continuar comprando
      </Link>
    </div>
  );
}
