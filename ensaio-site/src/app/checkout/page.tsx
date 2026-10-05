import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obterCarrinho, opcoesDeEnvio } from "@/lib/carrinho";
import { obterCliente } from "@/lib/conta";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Checkout() {
  const carrinho = await obterCarrinho();
  if (!carrinho || carrinho.itens.length === 0) redirect("/carrinho");
  const opcoes = await opcoesDeEnvio(carrinho.id);
  const cliente = await obterCliente().catch(() => undefined);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8">
      <h1 className="font-titulo text-3xl font-bold">Finalizar compra</h1>
      <p className="mt-2 text-sm">
        <Link href="/carrinho" className="underline underline-offset-4 hover:text-terracota">Voltar à sacola</Link>
      </p>
      <div className="mt-8">
        <CheckoutForm
          emailInicial={cliente?.email ?? carrinho.email ?? ""}
          inicial={{ nome: cliente?.nome ?? "", sobrenome: cliente?.sobrenome ?? "", telefone: cliente?.telefone ?? "" }}
          opcoesEnvio={opcoes}
          envioInicial={carrinho.envioSelecionadoId}
          subtotalCentavos={carrinho.subtotalCentavos}
          descontoCentavos={carrinho.descontoCentavos}
        />
      </div>
    </div>
  );
}
