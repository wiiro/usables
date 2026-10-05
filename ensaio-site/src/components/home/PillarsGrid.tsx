import Link from "next/link";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import type { Pilar } from "@/lib/placeholders";

/**
 * Colagem assimétrica, sem espaço entre os quadrados (como nas referências).
 * Desktop: grade de 12 colunas, 2 linhas de alturas diferentes, larguras
 * variando por quadrado. Mobile: 2 colunas. Os spans são literais para o
 * Tailwind enxergá-los; a ordem segue a lista de pilares (6 itens).
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
    <section aria-label="Pilares da marca" className="w-full">
      <h2 className="sr-only">Ensaio</h2>
      <ul className="grid grid-cols-2 gap-0 md:grid-cols-12 md:grid-rows-[clamp(240px,36vw,540px)_clamp(200px,28vw,430px)]">
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
