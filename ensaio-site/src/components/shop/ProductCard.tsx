import Link from "next/link";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import { formatarPreco } from "@/lib/format";
import type { ProdutoResumo } from "@/lib/placeholders";

export function ProductCard({ produto }: { produto: ProdutoResumo }) {
  return (
    <Link href={produto.href} className="group relative block">
      <div
        className="aspect-[4/5] w-full overflow-hidden transition-opacity group-hover:opacity-90"
        style={{ background: produto.cor }}
      >
        {produto.thumbnail ? (
          // Imagens vêm do storage do Medusa; trocar por next/image ao definir o domínio (fase 10).
          // eslint-disable-next-line @next/next/no-img-element
          <img src={produto.thumbnail} alt={produto.nome} className="size-full object-cover" loading="lazy" />
        ) : (
          <>
            <PlaceholderArt seed={produto.href} />
            <span className="sr-only">{`Imagem de ${produto.nome} (placeholder)`}</span>
          </>
        )}
      </div>
      <p className="mt-3 text-sm uppercase tracking-wider text-tinta/60">{produto.categoria}</p>
      <p className="font-bold">{produto.nome}</p>
      <p className="text-sm">{produto.precoCentavos > 0 ? formatarPreco(produto.precoCentavos) : "Sob consulta"}</p>
    </Link>
  );
}
