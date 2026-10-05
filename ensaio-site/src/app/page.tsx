import { Hero } from "@/components/home/Hero";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import { PillarsGrid } from "@/components/home/PillarsGrid";
import { ProductStrip } from "@/components/home/ProductStrip";
import { listarProdutos } from "@/lib/catalogo";
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

export default async function Home() {
  return (
    <>
      <Hero />
      <ProductStrip produtos={await produtosDaHome()} />
      <PillarsGrid pilares={PILARES} />
      <InstagramFeed />
    </>
  );
}
