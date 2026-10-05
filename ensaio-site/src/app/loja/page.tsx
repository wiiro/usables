import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/shop/ProductCard";
import { listarCategorias, listarProdutos } from "@/lib/catalogo";

export const metadata: Metadata = { title: "Loja" };

type Props = { searchParams: Promise<{ q?: string; categoria?: string }> };

function filtroClasse(ativo: boolean) {
  return `border px-3 py-1 text-sm uppercase tracking-wider transition-colors ${
    ativo ? "border-terracota bg-terracota text-areia" : "border-tinta/30 hover:border-terracota hover:text-terracota"
  }`;
}

export default async function Loja({ searchParams }: Props) {
  const { q, categoria } = await searchParams;
  const termo = q?.trim() || undefined;
  const categorias = await listarCategorias();
  const atual = categorias.find((c) => c.handle === categoria);
  const produtos = await listarProdutos({ q: termo, categoriaId: atual?.id });

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-8">
      <h1 className="font-titulo text-3xl font-bold">
        {termo ? `Busca: ${termo}` : (atual?.nome ?? "Loja")}
      </h1>

      <nav aria-label="Categorias" className="mt-6 flex flex-wrap gap-2">
        <Link href={termo ? `/loja?q=${encodeURIComponent(termo)}` : "/loja"} className={filtroClasse(!atual)}>
          Tudo
        </Link>
        {categorias.map((c) => (
          <Link
            key={c.id}
            href={`/loja?categoria=${c.handle}${termo ? `&q=${encodeURIComponent(termo)}` : ""}`}
            className={filtroClasse(c.id === atual?.id)}
            aria-current={c.id === atual?.id ? "page" : undefined}
          >
            {c.nome}
          </Link>
        ))}
      </nav>

      {produtos.length === 0 ? (
        <p className="mt-12">Nenhuma peça encontrada. <Link href="/loja" className="underline">Ver tudo</Link></p>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {produtos.map((p) => (
            <li key={p.id}><ProductCard produto={p} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}
