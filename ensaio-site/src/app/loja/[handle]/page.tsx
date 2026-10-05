import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdicionarSacola } from "@/components/shop/AdicionarSacola";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import { favoritoAcao } from "@/app/conta/actions";
import { obterCliente } from "@/lib/conta";
import { obterMaterial } from "@/lib/conteudo";
import { obterProduto, type Transparencia } from "@/lib/catalogo";
import { formatarPreco } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

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

  const cliente = await obterCliente().catch(() => undefined);
  const favorito = cliente?.favoritos.includes(produto.id) ?? false;
  const { transparencia: t } = produto;
  const materialExiste = t.material ? await obterMaterial(t.material).catch(() => undefined) : undefined;
  const itens = ROTULOS.filter(([chave]) => t[chave]);

  const dadosEstruturados = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: produto.nome,
    description: produto.descricao ?? undefined,
    url: `${SITE_URL}/loja/${handle}`,
    image: produto.thumbnail ?? undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (produto.precoCentavos / 100).toFixed(2),
      availability: "https://schema.org/PreOrder",
    },
  };

  return (
    <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-12 md:grid-cols-2 md:px-8">
      {/* JSON-LD: o "<" é escapado para o conteúdo nunca fechar a tag script. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados).replace(/</g, "\\u003c") }}
      />
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

        <AdicionarSacola variantes={produto.variantes} />

        {cliente ? (
          <form action={favoritoAcao} className="mt-3">
            <input type="hidden" name="produto" value={produto.id} />
            <input type="hidden" name="voltar" value={`/loja/${handle}`} />
            <button type="submit" aria-pressed={favorito} className="text-sm underline underline-offset-4 hover:text-terracota">
              {favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            </button>
          </form>
        ) : (
          <p className="mt-3 text-sm">
            <Link href={`/conta/entrar?voltar=/loja/${handle}`} className="underline underline-offset-4 hover:text-terracota">
              Entre para guardar nos favoritos
            </Link>
          </p>
        )}

        {itens.length > 0 ? (
          <section aria-label="Transparência" className="mt-10">
            <h2 className="font-titulo text-sm font-bold uppercase tracking-widest">Transparência</h2>
            <dl className="mt-3 divide-y divide-tinta/10">
              {itens.map(([chave, rotulo]) => (
                <div key={chave} className="grid grid-cols-[7rem_1fr] gap-4 py-3">
                  <dt className="text-sm uppercase tracking-wider text-tinta/60">{rotulo}</dt>
                  <dd>
                    {chave === "material" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t.material ?? "") && materialExiste ? (
                      <Link href={`/materioteca/${t.material}`} className="underline underline-offset-4 hover:text-terracota">
                        {materialExiste.nome}
                      </Link>
                    ) : (
                      t[chave]
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </div>
    </div>
  );
}
