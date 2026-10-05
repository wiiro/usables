import type { Metadata } from "next";
import Link from "next/link";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import { obterCarrinho } from "@/lib/carrinho";
import { formatarPreco } from "@/lib/format";
import { aplicarCupomAcao, alterarQuantidade, removerCupomAcao } from "./actions";

export const metadata: Metadata = { title: "Sacola" };
export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  cupom: "Cupom inválido ou não aplicável a esta sacola.",
  quantidade: "Quantidade inválida.",
  atualizar: "Não foi possível atualizar a sacola. Tente novamente.",
};

type Props = { searchParams: Promise<{ erro?: string }> };

export default async function Carrinho({ searchParams }: Props) {
  const { erro } = await searchParams;
  const carrinho = await obterCarrinho();

  if (!carrinho || carrinho.itens.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-titulo text-3xl font-bold">Sua sacola está vazia</h1>
        <Link href="/loja" className="mt-8 inline-block border border-terracota bg-terracota px-6 py-3 uppercase tracking-widest text-white hover:bg-terracota-vivo">
          Ver peças
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8">
      <h1 className="font-titulo text-3xl font-bold">Sacola</h1>
      {erro && ERROS[erro] ? (
        <p role="alert" className="mt-4 border-l-2 border-terracota pl-3 text-sm">{ERROS[erro]}</p>
      ) : null}

      <ul className="mt-8 divide-y divide-tinta/10">
        {carrinho.itens.map((item) => (
          <li key={item.id} className="grid grid-cols-[88px_1fr_auto] items-center gap-4 py-5">
            <Link href={`/loja/${item.handle}`} className="block aspect-[4/5] overflow-hidden">
              {item.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnail} alt={item.titulo} className="size-full object-cover" />
              ) : (
                <PlaceholderArt seed={`/loja/${item.handle}`} />
              )}
            </Link>
            <div>
              <Link href={`/loja/${item.handle}`} className="font-bold hover:text-terracota">{item.titulo}</Link>
              {item.variante && item.variante !== "Único" ? <p className="text-sm text-tinta/60">{item.variante}</p> : null}
              <p className="text-sm">{formatarPreco(item.precoUnitarioCentavos)}</p>
              <form action={alterarQuantidade} className="mt-2 flex items-center gap-2">
                <input type="hidden" name="item" value={item.id} />
                <label htmlFor={`q-${item.id}`} className="sr-only">Quantidade de {item.titulo}</label>
                <input
                  id={`q-${item.id}`}
                  name="quantidade"
                  type="number"
                  min={1}
                  max={20}
                  defaultValue={item.quantidade}
                  className="w-16 border border-tinta/30 bg-white px-2 py-1"
                />
                <button type="submit" className="text-sm underline underline-offset-4 hover:text-terracota">Atualizar</button>
              </form>
              <form action={alterarQuantidade} className="mt-1">
                <input type="hidden" name="item" value={item.id} />
                <input type="hidden" name="quantidade" value="0" />
                <button type="submit" className="text-sm text-tinta/60 underline underline-offset-4 hover:text-terracota">Remover</button>
              </form>
            </div>
            <p className="font-bold">{formatarPreco(item.totalCentavos)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <section aria-label="Cupom">
          <h2 className="font-titulo text-sm font-bold uppercase tracking-widest">Cupom</h2>
          {carrinho.cupons.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {carrinho.cupons.map((c) => (
                <li key={c} className="flex items-center justify-between border border-tinta/20 px-3 py-2">
                  <span>{c}</span>
                  <form action={removerCupomAcao}>
                    <input type="hidden" name="cupom" value={c} />
                    <button type="submit" className="text-sm underline underline-offset-4 hover:text-terracota">Remover</button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <form action={aplicarCupomAcao} className="mt-3 flex gap-2">
              <label htmlFor="cupom" className="sr-only">Código do cupom</label>
              <input id="cupom" name="cupom" maxLength={40} placeholder="Código" className="w-full border border-tinta/30 bg-white px-3 py-2" />
              <button type="submit" className="border border-tinta px-4 py-2 uppercase tracking-widest hover:bg-tinta hover:text-white">Aplicar</button>
            </form>
          )}
        </section>

        <section aria-label="Resumo">
          <h2 className="font-titulo text-sm font-bold uppercase tracking-widest">Resumo</h2>
          <dl className="mt-3 space-y-2">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatarPreco(carrinho.subtotalCentavos)}</dd></div>
            {carrinho.descontoCentavos > 0 ? (
              <div className="flex justify-between"><dt>Desconto</dt><dd>- {formatarPreco(carrinho.descontoCentavos)}</dd></div>
            ) : null}
            <div className="flex justify-between text-sm text-tinta/60"><dt>Frete</dt><dd>calculado no checkout</dd></div>
          </dl>
          <Link
            href="/checkout"
            className="mt-6 block border border-terracota bg-terracota px-6 py-3 text-center uppercase tracking-widest text-white hover:bg-terracota-vivo"
          >
            Finalizar compra
          </Link>
        </section>
      </div>
    </div>
  );
}
