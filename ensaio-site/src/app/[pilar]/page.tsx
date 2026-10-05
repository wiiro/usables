import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PILARES } from "@/lib/placeholders";

// Páginas dos pilares da home. Conteúdo é lorem ipsum até a marca fornecer a copy;
// "materioteca" tem rota própria (src/app/materioteca).
export const dynamicParams = false;

const PAGINAS = PILARES.filter((p) => p.slug !== "materioteca" && p.slug !== "manifesto");

type Props = { params: Promise<{ pilar: string }> };

export function generateStaticParams() {
  return PAGINAS.map((p) => ({ pilar: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pilar } = await params;
  return { title: PAGINAS.find((p) => p.slug === pilar)?.titulo };
}

export default async function Pilar({ params }: Props) {
  const { pilar } = await params;
  const pagina = PAGINAS.find((p) => p.slug === pilar);
  if (!pagina) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 md:px-8">
      <h1 className="font-titulo text-3xl font-bold">{pagina.titulo}</h1>
      <p className="mt-6">{pagina.descricao}</p>
      <p className="mt-4">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </p>
    </article>
  );
}
