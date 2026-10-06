import Link from "next/link";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import { formatarPreco } from "@/lib/format";
import type { ProdutoResumo } from "@/lib/placeholders";

const CAMADA = "absolute inset-0 transition-[opacity,transform] duration-700 ease-out";

/**
 * Card de peça. Ao passar o mouse (ou focar por teclado) a imagem dá zoom e é
 * trocada por outra: a segunda foto da peça ou, nos placeholders, uma arte
 * bem diferente. Peça com uma só foto apenas dá zoom.
 * (Imagens vêm do storage do Medusa; trocar por next/image ao definir o domínio.)
 */
export function ProductCard({ produto }: { produto: ProdutoResumo }) {
  const placeholder = !produto.thumbnail;
  const temSegunda = placeholder || Boolean(produto.imagemHover);

  return (
    <Link href={produto.href} className="group relative block">
      <div className="relative aspect-[4/5] w-full overflow-hidden" style={{ background: produto.cor }}>
        <div
          className={`${CAMADA} group-hover:scale-110 group-focus-visible:scale-110 ${
            temSegunda ? "group-hover:opacity-0 group-focus-visible:opacity-0" : ""
          }`}
        >
          {produto.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={produto.thumbnail} alt={produto.nome} className="size-full object-cover" loading="lazy" />
          ) : (
            <PlaceholderArt seed={produto.href} />
          )}
        </div>
        {temSegunda ? (
          <div
            aria-hidden="true"
            className={`${CAMADA} scale-100 opacity-0 group-hover:scale-110 group-hover:opacity-100 group-focus-visible:scale-110 group-focus-visible:opacity-100`}
          >
            {produto.imagemHover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={produto.imagemHover} alt="" className="size-full object-cover" loading="lazy" />
            ) : (
              <PlaceholderArt seed={produto.href} alternativa />
            )}
          </div>
        ) : null}
        {placeholder ? <span className="sr-only">{`Imagem de ${produto.nome} (placeholder)`}</span> : null}
      </div>
      <p className="mt-3 text-sm uppercase tracking-wider text-tinta/60">{produto.categoria}</p>
      <p className="font-bold">{produto.nome}</p>
      <p className="text-sm">{produto.precoCentavos > 0 ? formatarPreco(produto.precoCentavos) : "Sob consulta"}</p>
    </Link>
  );
}
