import type { Metadata } from "next";
import Link from "next/link";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import { listarMateriais, type Material } from "@/lib/conteudo";

export const metadata: Metadata = { title: "Materioteca" };
export const revalidate = 60;

async function carregar(): Promise<{ materiais: Material[]; indisponivel: boolean }> {
  try {
    return { materiais: await listarMateriais(), indisponivel: false };
  } catch (erro) {
    console.error("[materioteca] falha ao carregar:", erro instanceof Error ? erro.message : "erro");
    return { materiais: [], indisponivel: true };
  }
}

export default async function Materioteca() {
  const { materiais, indisponivel } = await carregar();

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-8">
      <h1 className="font-titulo text-3xl font-bold">Materioteca</h1>
      {indisponivel ? <p className="mt-6">A Materioteca está indisponível no momento. Volte em instantes.</p> : null}
      {!indisponivel && materiais.length === 0 ? <p className="mt-6">Em breve, os materiais da Ensaio estarão aqui.</p> : null}
      <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
        {materiais.map((m, i) => (
          <li key={m.id}>
            <Link href={`/materioteca/${m.slug}`} className="group block">
              <div className="aspect-square overflow-hidden">
                {m.imagem_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.imagem_url} alt={m.nome} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                ) : (
                  <PlaceholderArt seed={m.slug} variante={i} className="transition-transform duration-500 group-hover:scale-105" />
                )}
              </div>
              <p className="mt-2 font-bold group-hover:text-terracota">{m.nome}</p>
              {m.descricao ? <p className="line-clamp-2 text-sm text-tinta/70">{m.descricao}</p> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
