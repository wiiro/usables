import Link from "next/link";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import type { Pilar } from "@/lib/placeholders";

/**
 * Colagem assimétrica com espaço entre os quadrados e margens laterais.
 * Desktop: grade de 12 colunas, 2 linhas de alturas diferentes, larguras
 * variando por quadrado. Mobile: 2 colunas. Os spans são literais para o
 * Tailwind enxergá-los; a ordem segue a lista de pilares (6 itens).
 * Para voltar a quadrados iguais: trocar o LAYOUT por "aspect-square" e a
 * grade por `md:grid-cols-3`.
 */
const LAYOUT = [
  "col-span-2 aspect-[2/1] md:col-span-5 md:aspect-auto",
  "col-span-1 aspect-square md:col-span-4 md:aspect-auto",
  "col-span-1 aspect-square md:col-span-3 md:aspect-auto",
  "col-span-1 aspect-square md:col-span-3 md:aspect-auto",
  "col-span-1 aspect-square md:col-span-5 md:aspect-auto",
  "col-span-2 aspect-[2/1] md:col-span-4 md:aspect-auto",
];

export function PillarsGrid({ pilares }: { pilares: Pilar[] }) {
  return (
    <section aria-label="Pilares da marca" className="mx-auto max-w-[1400px] px-4 pb-14 md:px-8">
      <h2 className="mb-6 font-titulo text-xl font-bold uppercase tracking-widest">Ensaio</h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-12 md:grid-rows-[clamp(220px,30vw,460px)_clamp(190px,24vw,380px)]">
        {pilares.map((p, i) => (
          <li key={p.slug} className={LAYOUT[i % LAYOUT.length]}>
            <Link href={`/${p.slug}`} className="group relative block size-full overflow-hidden">
              <PlaceholderArt
                seed={`pilar-${p.slug}`}
                variante={i}
                className="transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute bottom-3 left-3 bg-white/90 px-2 py-1 font-titulo text-base font-bold text-tinta group-hover:underline group-hover:underline-offset-4">
                {p.titulo}
              </span>
              <span className="sr-only">{p.descricao}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
