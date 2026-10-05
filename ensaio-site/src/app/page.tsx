import { Hero } from "@/components/home/Hero";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import { PillarsGrid } from "@/components/home/PillarsGrid";
import { ProductStrip } from "@/components/home/ProductStrip";
import { listarProdutos } from "@/lib/catalogo";
import { obterConteudoSite, type ConteudoSite } from "@/lib/conteudo";
import { PILARES, PRODUTOS_PLACEHOLDER, type ProdutoResumo } from "@/lib/placeholders";

export const revalidate = 60;

async function produtosDaHome(): Promise<ProdutoResumo[]> {
  try {
    const produtos = await listarProdutos({ limite: 12 });
    return produtos.length ? produtos : PRODUTOS_PLACEHOLDER;
  } catch (erro) {
    // Home nunca fica vazia por falha do backend; o erro é registrado.
    console.error("[home] falha ao carregar produtos, usando placeholders:", erro);
    return PRODUTOS_PLACEHOLDER;
  }
}

async function conteudoDaHome(): Promise<ConteudoSite> {
  try {
    return await obterConteudoSite();
  } catch (erro) {
    console.error("[home] falha ao carregar o conteúdo editável, usando o padrão:", erro);
    return { instagramImagens: [] };
  }
}

export default async function Home() {
  const [produtos, conteudo] = await Promise.all([produtosDaHome(), conteudoDaHome()]);
  return (
    <>
      <Hero videoSrc={conteudo.heroVideoUrl} posterSrc={conteudo.heroPosterUrl} />
      <ProductStrip produtos={produtos} />
      <PillarsGrid pilares={PILARES} />
      <InstagramFeed usuario={conteudo.instagramUsuario} href={conteudo.instagramUrl} imagens={conteudo.instagramImagens} />
    </>
  );
}
