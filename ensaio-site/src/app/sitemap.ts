import type { MetadataRoute } from "next";
import { listarProdutos } from "@/lib/catalogo";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

const ESTATICAS = [
  "", "/loja", "/materioteca", "/manifesto", "/cuidados", "/contato", "/envio",
  "/trocas-e-devolucoes", "/termos-de-uso", "/politica-de-privacidade",
  "/biomateriais", "/processo", "/sustentabilidade", "/comunidade",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paginas = ESTATICAS.map((caminho) => ({ url: `${SITE_URL}${caminho}`, changeFrequency: "monthly" as const }));
  try {
    const produtos = await listarProdutos({ limite: 200 });
    return [
      ...paginas,
      ...produtos.map((p) => ({ url: `${SITE_URL}${p.href}`, changeFrequency: "weekly" as const })),
    ];
  } catch (erro) {
    // Sem backend, o sitemap segue com as páginas estáticas.
    console.error("[sitemap] produtos indisponíveis:", erro instanceof Error ? erro.message : "erro");
    return paginas;
  }
}
