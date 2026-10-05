import { IconeInstagram } from "@/components/layout/Icons";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import { INSTAGRAM_PLACEHOLDER } from "@/lib/placeholders";

/** Feed manual (v1): imagens cadastradas no painel, sem API do Instagram. */
export function InstagramFeed() {
  const { usuario, href, cores } = INSTAGRAM_PLACEHOLDER;
  return (
    <section aria-label="Instagram" className="mx-auto max-w-[1400px] px-4 pb-16 pt-12 md:px-8">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-6 flex items-center justify-center gap-2 font-titulo hover:text-terracota"
      >
        <IconeInstagram /> {usuario}
      </a>
      <ul className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {cores.map((_, i) => (
          <li key={i} className="aspect-square overflow-hidden" role="img" aria-label={`Foto ${i + 1} do Instagram (placeholder)`}>
            <PlaceholderArt seed={`insta-${i}`} variante={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}
