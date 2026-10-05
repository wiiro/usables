import type { Metadata } from "next";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import { LOREM_CURTO } from "@/lib/placeholders";

export const metadata: Metadata = { title: "Materioteca" };

// Placeholder. O catálogo real de materiais virá do painel (módulo próprio no Medusa).
const MATERIAIS = [
  { slug: "material-01", nome: "Material 01", cor: "var(--color-agua)" },
  { slug: "material-02", nome: "Material 02", cor: "#d9c7b0" },
  { slug: "material-03", nome: "Material 03", cor: "var(--color-gelo)" },
  { slug: "material-04", nome: "Material 04", cor: "var(--color-agua)" },
];

export default function Materioteca() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-8">
      <h1 className="font-titulo text-3xl font-bold">Materioteca</h1>
      <p className="mt-4 max-w-2xl">{LOREM_CURTO}</p>
      <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {MATERIAIS.map((m) => (
          <li key={m.slug}>
            <div className="aspect-square overflow-hidden" role="img" aria-label={`${m.nome} (placeholder)`}>
              <PlaceholderArt seed={m.slug} />
            </div>
            <p className="mt-2 font-bold">{m.nome}</p>
            <p className="text-sm text-tinta/70">{LOREM_CURTO}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
