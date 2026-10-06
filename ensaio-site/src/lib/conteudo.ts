import { medusaGet } from "./medusa";

// Conteúdo editável pelo painel (Materioteca e conteúdo da home). Falhas do
// backend nunca derrubam a página: quem chama decide o fallback.

export type Material = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  ingredientes: string | null;
  origem: string | null;
  imagem_url: string | null;
};

export type ConteudoSite = {
  heroVideoUrl?: string;
  heroPosterUrl?: string;
  instagramUsuario?: string;
  instagramUrl?: string;
};

/** Aceita só http(s) absoluta ou caminho do próprio site; qualquer outra coisa é descartada. */
export function urlSegura(valor: unknown): string | undefined {
  if (typeof valor !== "string") return undefined;
  const v = valor.trim();
  return /^https?:\/\/\S+$/i.test(v) || /^\/[^\s/]\S*$/.test(v) ? v : undefined;
}

function texto(valor: unknown, max = 100): string | undefined {
  return typeof valor === "string" && valor.trim() ? valor.trim().slice(0, max) : undefined;
}

export function mapearConteudo(bruto: Record<string, unknown>): ConteudoSite {
  return {
    heroVideoUrl: urlSegura(bruto.hero_video_url),
    heroPosterUrl: urlSegura(bruto.hero_poster_url),
    instagramUsuario: texto(bruto.instagram_usuario, 60),
    instagramUrl: urlSegura(bruto.instagram_url),
  };
}

export async function obterConteudoSite(): Promise<ConteudoSite> {
  const { conteudo } = await medusaGet<{ conteudo: Record<string, unknown> }>("/store/conteudo");
  return mapearConteudo(conteudo ?? {});
}

export async function listarMateriais(): Promise<Material[]> {
  const { materiais } = await medusaGet<{ materiais: Material[] }>("/store/materiais");
  return materiais;
}

/** Retorna undefined se o material não existir (404). */
export async function obterMaterial(slug: string): Promise<Material | undefined> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return undefined;
  try {
    const { material } = await medusaGet<{ material: Material }>(`/store/materiais/${slug}`);
    return material;
  } catch (erro) {
    if (erro instanceof Error && "status" in erro && (erro as { status?: number }).status === 404) return undefined;
    throw erro;
  }
}
