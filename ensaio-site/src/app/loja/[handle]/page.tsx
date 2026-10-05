import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import { obterProduto, type Transparencia } from "@/lib/catalogo";
import { formatarPreco } from "@/lib/format";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const produto = await obterProduto(handle).catch(() => null);
  return { title: produto?.nome ?? "Peça" };
}

const ROTULOS: [keyof Omit<Transparencia, "prazoProducaoDias">, string][] = [
  ["material", "Material"],
  ["origem", "Origem"],
  ["processo", "Processo"],
  ["cuidados", "Cuidados"],
];

export default async function Produto({ params }: Props) {
  const { handle } = await params;
  const produto = await obterProduto(handle);
  if (!produto) notFound();

  const { transparencia: t } = produto;
  const itens = ROTULOS.filter(([chave]) => t[chave]);

  return (
    <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-12 md:grid-cols-2 md:px-8">
      <div className="aspect-[4/5] w-full overflow-hidden" style={{ background: produto.cor }}>
        {produto.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={produto.thumbnail} alt={produto.nome} className="size-full object-cover" />
        ) : (
          <>
            <PlaceholderArt seed={produto.href} />
            <span className="sr-only">{`Imagem de ${produto.nome} (placeholder)`}</span>
          </>
        )}
      </div>

      <div>
        <nav aria-label="Trilha" className="text-sm uppercase tracking-wider text-tinta/60">
          <Link href="/loja" className="hover:text-terracota">Loja</Link>
          {produto.categoria ? <> / {produto.categoria}</> : null}
        </nav>
        <h1 className="mt-3 font-titulo text-3xl font-bold">{produto.nome}</h1>
        <p className="mt-2 text-xl">
          {produto.precoCentavos > 0 ? formatarPreco(produto.precoCentavos) : "Sob consulta"}
        </p>
        {produto.descricao ? <p className="mt-6">{produto.descricao}</p> : null}

        {t.prazoProducaoDias ? (
          <p className="mt-6 border-l-2 border-terracota pl-3 text-sm">
            Feito sob demanda. Prazo de produção: {t.prazoProducaoDias} dias úteis.
          </p>
        ) : null}

        {/* Carrinho entra na fase 5. */}
        <button
          type="button"
          disabled
          className="mt-8 w-full border border-tinta/30 px-5 py-3 uppercase tracking-widest text-tinta/50"
        >
          Adicionar à sacola (em breve)
        </button>

        {itens.length > 0 ? (
          <section aria-label="Transparência" className="mt-10">
            <h2 className="font-titulo text-sm font-bold uppercase tracking-widest">Transparência</h2>
            <dl className="mt-3 divide-y divide-tinta/10">
              {itens.map(([chave, rotulo]) => (
                <div key={chave} className="grid grid-cols-[7rem_1fr] gap-4 py-3">
                  <dt className="text-sm uppercase tracking-wider text-tinta/60">{rotulo}</dt>
                  <dd>{t[chave]}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </div>
    </div>
  );
}
