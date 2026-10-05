import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/shop/ProductCard";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import { listarProdutos } from "@/lib/catalogo";
import { obterMaterial } from "@/lib/conteudo";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const material = await obterMaterial(slug).catch(() => undefined);
  return { title: material?.nome ?? "Material" };
}

export default async function MaterialPagina({ params }: Props) {
  const { slug } = await params;
  const material = await obterMaterial(slug);
  if (!material) notFound();

  // Peças que usam este material (metadata.material = slug no Medusa).
  const produtos = (await listarProdutos({ limite: 100 }).catch(() => [])).filter((p) => p.material === slug);
  const detalhes: [string, string | null][] = [
    ["Ingredientes", material.ingredientes],
    ["Origem", material.origem],
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-8">
      <p className="text-sm uppercase tracking-wider text-tinta/60">
        <Link href="/materioteca" className="hover:text-terracota">Materioteca</Link>
      </p>
      <div className="mt-4 grid gap-10 md:grid-cols-2">
        <div className="aspect-square overflow-hidden">
          {material.imagem_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={material.imagem_url} alt={material.nome} className="size-full object-cover" />
          ) : (
            <PlaceholderArt seed={material.slug} />
          )}
        </div>
        <div>
          <h1 className="font-titulo text-3xl font-bold">{material.nome}</h1>
          {material.descricao ? <p className="mt-4 whitespace-pre-line">{material.descricao}</p> : null}
          <dl className="mt-6 divide-y divide-tinta/10">
            {detalhes.filter(([, v]) => v).map(([rotulo, valor]) => (
              <div key={rotulo} className="grid grid-cols-[8rem_1fr] gap-4 py-3">
                <dt className="text-sm uppercase tracking-wider text-tinta/60">{rotulo}</dt>
                <dd className="whitespace-pre-line">{valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {produtos.length > 0 ? (
        <section aria-label="Peças feitas com este material" className="mt-16">
          <h2 className="font-titulo text-xl font-bold uppercase tracking-widest">Peças com este material</h2>
          <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {produtos.map((p) => (
              <li key={p.id}><ProductCard produto={p} /></li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
