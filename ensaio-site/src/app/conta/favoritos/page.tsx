import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/shop/ProductCard";
import { listarProdutosPorIds } from "@/lib/catalogo";
import { exigirCliente } from "@/lib/conta";
import { favoritoAcao } from "../actions";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Favoritos() {
  const cliente = await exigirCliente();
  const produtos = await listarProdutosPorIds(cliente.favoritos);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-8">
      <h1 className="font-titulo text-3xl font-bold">Favoritos</h1>
      <p className="mt-2 text-sm"><Link href="/conta" className="underline underline-offset-4 hover:text-terracota">Voltar à conta</Link></p>
      {produtos.length === 0 ? (
        <p className="mt-10">Nenhuma peça favorita ainda. <Link href="/loja" className="underline">Ver a loja</Link></p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {produtos.map((p) => (
            <li key={p.id}>
              <ProductCard produto={p} />
              <form action={favoritoAcao} className="mt-2">
                <input type="hidden" name="produto" value={p.id} />
                <input type="hidden" name="voltar" value="/conta/favoritos" />
                <button type="submit" className="text-sm underline underline-offset-4 hover:text-terracota">Remover dos favoritos</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
