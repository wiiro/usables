import { z } from "@medusajs/framework/zod"

// URLs aceitas: http(s) absolutas ou caminhos do próprio site ("/..."). Bloqueia javascript:, data: etc.
const urlSegura = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v) || /^\/[^\s/][^\s]*$/.test(v), {
    message: "URL inválida (use http(s):// ou um caminho iniciado por /)",
  })

const slug = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífens")

const textoLongo = z.string().trim().max(4000)

export const CriarMaterialSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  slug: slug.optional(),
  descricao: textoLongo.optional(),
  ingredientes: textoLongo.optional(),
  origem: z.string().trim().max(500).optional(),
  imagem_url: urlSegura.optional(),
  ordem: z.number().int().min(0).max(9999).optional(),
  ativo: z.boolean().optional(),
})
export type CriarMaterial = z.infer<typeof CriarMaterialSchema>

export const AtualizarMaterialSchema = CriarMaterialSchema.partial()
export type AtualizarMaterial = z.infer<typeof AtualizarMaterialSchema>

export const ConteudoSchema = z
  .object({
    hero_video_url: urlSegura,
    hero_poster_url: urlSegura,
    instagram_usuario: z.string().trim().max(60),
    instagram_url: urlSegura,
  })
  .partial()
  .strict()
export type Conteudo = z.infer<typeof ConteudoSchema>

/** Gera um slug a partir do nome ("Alga Marrom" vira "alga-marrom"). */
export function gerarSlug(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}
