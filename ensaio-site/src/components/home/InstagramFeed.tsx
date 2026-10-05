import { IconeInstagram } from "@/components/layout/Icons";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import { INSTAGRAM_PLACEHOLDER } from "@/lib/placeholders";

type Props = {
  usuario?: string;
  href?: string;
  /** Imagens cadastradas no painel. Sem elas, usa as artes de placeholder. */
  imagens?: string[];
};

/** Feed manual (v1): imagens cadastradas no painel, sem API do Instagram. */
export function InstagramFeed({ usuario, href, imagens = [] }: Props) {
  const nome = usuario ?? INSTAGRAM_PLACEHOLDER.usuario;
  const link = href ?? INSTAGRAM_PLACEHOLDER.href;
  const itens: (string | number)[] = imagens.length > 0 ? imagens : INSTAGRAM_PLACEHOLDER.cores.map((_, i) => i);

  return (
    <section aria-label="Instagram" className="mx-auto max-w-[1400px] px-4 pb-16 pt-12 md:px-8">
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-6 flex items-center justify-center gap-2 font-titulo hover:text-terracota"
      >
        <IconeInstagram /> {nome}
      </a>
      <ul className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {itens.map((item, i) => (
          <li key={`${i}-${item}`} className="aspect-square overflow-hidden">
            <a href={link} target="_blank" rel="noopener noreferrer" aria-label={`Foto ${i + 1} no Instagram de ${nome}`} className="block size-full">
              {typeof item === "string" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item} alt="" className="size-full object-cover" loading="lazy" />
              ) : (
                <PlaceholderArt seed={`insta-${i}`} variante={i} />
              )}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
