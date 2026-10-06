import { medusaGet, MedusaError } from "./medusa";
import type { ProdutoResumo } from "./placeholders";

type PrecoCalculado = { calculated_amount: number | null; currency_code: string | null };
type VarianteApi = { id: string; title: string; calculated_price?: PrecoCalculado };
type CategoriaApi = { id: string; name: string; handle: string };
type ProdutoApi = {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  thumbnail: string | null;
  images?: { url: string }[];
  metadata: Record<string, unknown> | null;
  categories?: CategoriaApi[];
  variants?: VarianteApi[];
};

export type Categoria = { id: string; nome: string; handle: string };

export type Transparencia = {
  material?: string;
  origem?: string;
  processo?: string;
  cuidados?: string;
  prazoProducaoDias?: number;
};

export type VarianteResumo = { id: string; titulo: string; precoCentavos: number };

export type ProdutoDetalhe = ProdutoResumo & {
  descricao: string | null;
  transparencia: Transparencia;
  variantes: VarianteResumo[];
};

const CAMPOS = "id,title,handle,description,thumbnail,metadata,*categories,*images,*variants,*variants.calculated_price";
const CORES = ["var(--color-agua)", "var(--color-gelo)", "#d9c7b0"];

let regiaoEmCache: Promise<string> | undefined;

/** Região única (Brasil) usada para calcular preços. */
function regiaoId(): Promise<string> {
  regiaoEmCache ??= medusaGet<{ regions: { id: string }[] }>("/store/regions", {}, 300)
    .then(({ regions }) => {
      const primeira = regions[0];
      if (!primeira) throw new MedusaError("Nenhuma região configurada no backend");
      return primeira.id;
    })
    .catch((erro: unknown) => {
      regiaoEmCache = undefined;
      throw erro;
    });
  return regiaoEmCache;
}

function corDe(handle: string): string {
  let h = 0;
  for (const c of handle) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CORES[h % CORES.length] ?? CORES[0]!;
}

/** Menor preço entre as variantes, em centavos inteiros (Medusa devolve unidade principal). */
export function precoEmCentavos(variantes: VarianteApi[] = []): number {
  const valores = variantes
    .map((v) => v.calculated_price?.calculated_amount)
    .filter((n): n is number => typeof n === "number");
  return valores.length ? Math.round(Math.min(...valores) * 100) : 0;
}

function texto(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}

/** Imagem principal: a miniatura ou, na falta dela, a primeira foto. */
export function imagemPrincipal(p: Pick<ProdutoApi, "thumbnail" | "images">): string | null {
  return p.thumbnail ?? p.images?.[0]?.url ?? null;
}

/** Primeira imagem diferente da principal (usada no hover do card); undefined se não houver. */
export function segundaImagem(p: Pick<ProdutoApi, "thumbnail" | "images">): string | undefined {
  const principal = imagemPrincipal(p);
  return (p.images ?? []).map((i) => i.url).find((url) => url && url !== principal);
}

function paraResumo(p: ProdutoApi): ProdutoResumo {
  return {
    id: p.id,
    nome: p.title,
    categoria: p.categories?.[0]?.name ?? "",
    precoCentavos: precoEmCentavos(p.variants),
    href: `/loja/${p.handle}`,
    cor: corDe(p.handle),
    thumbnail: imagemPrincipal(p),
    imagemHover: segundaImagem(p),
    material: texto(p.metadata?.material),
  };
}

export async function listarCategorias(): Promise<Categoria[]> {
  const { product_categories } = await medusaGet<{ product_categories: CategoriaApi[] }>(
    "/store/product-categories",
    { fields: "id,name,handle", limit: 50 },
  );
  return product_categories.map((c) => ({ id: c.id, nome: c.name, handle: c.handle }));
}

export async function listarProdutos(
  opcoes: { q?: string; categoriaId?: string; limite?: number } = {},
): Promise<ProdutoResumo[]> {
  const { products } = await medusaGet<{ products: ProdutoApi[] }>("/store/products", {
    fields: CAMPOS,
    region_id: await regiaoId(),
    q: opcoes.q?.slice(0, 80),
    category_id: opcoes.categoriaId ? [opcoes.categoriaId] : undefined,
    limit: opcoes.limite ?? 48,
  });
  return products.map(paraResumo);
}

export async function obterProduto(handle: string): Promise<ProdutoDetalhe | null> {
  const { products } = await medusaGet<{ products: ProdutoApi[] }>("/store/products", {
    fields: CAMPOS,
    region_id: await regiaoId(),
    handle,
    limit: 1,
  });
  const produto = products[0];
  if (!produto) return null;
  const m = produto.metadata ?? {};
  return {
    ...paraResumo(produto),
    descricao: produto.description,
    variantes: (produto.variants ?? []).map((v) => ({
      id: v.id,
      titulo: v.title,
      precoCentavos: precoEmCentavos([v]),
    })),
    transparencia: {
      material: texto(m.material),
      origem: texto(m.origem),
      processo: texto(m.processo),
      cuidados: texto(m.cuidados),
      prazoProducaoDias: typeof m.prazo_producao_dias === "number" ? m.prazo_producao_dias : undefined,
    },
  };
}

/** Produtos por id (lista de desejos). Ids inexistentes são ignorados. */
export async function listarProdutosPorIds(ids: string[]): Promise<ProdutoResumo[]> {
  if (ids.length === 0) return [];
  const { products } = await medusaGet<{ products: ProdutoApi[] }>(
    "/store/products",
    { fields: CAMPOS, region_id: await regiaoId(), id: ids.slice(0, 100), limit: 100 },
    0,
  );
  return products.map(paraResumo);
}
