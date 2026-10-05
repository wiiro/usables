import Link from "next/link";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import type { Pilar } from "@/lib/placeholders";

export function PillarsGrid({ pilares }: { pilares: Pilar[] }) {
  return (
    <section aria-label="Pilares da marca" className="mx-auto max-w-[1400px] px-4 pb-14 md:px-8">
      <h2 className="mb-6 font-titulo text-xl font-bold uppercase tracking-widest">Ensaio</h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {pilares.map((p, i) => (
          <li key={p.slug}>
            <Link href={`/${p.slug}`} className="group relative block aspect-square overflow-hidden">
              <PlaceholderArt seed={`pilar-${p.slug}`} variante={i + 2} className="transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute bottom-3 left-3 bg-areia/85 px-2 py-1 font-titulo text-base font-bold text-tinta group-hover:underline group-hover:underline-offset-4">
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
