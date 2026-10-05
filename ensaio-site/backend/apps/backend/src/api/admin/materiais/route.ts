import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTEUDO_MODULE } from "../../../modules/conteudo"
import type ConteudoModuleService from "../../../modules/conteudo/service"
import { gerarSlug, type CriarMaterial } from "../../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const servico: ConteudoModuleService = req.scope.resolve(CONTEUDO_MODULE)
  const materiais = await servico.listMaterials({}, { order: { ordem: "ASC", nome: "ASC" } })
  res.json({ materiais })
}

export async function POST(req: MedusaRequest<CriarMaterial>, res: MedusaResponse) {
  const servico: ConteudoModuleService = req.scope.resolve(CONTEUDO_MODULE)
  const dados = req.validatedBody
  const slug = dados.slug || gerarSlug(dados.nome)
  if (!slug) {
    res.status(400).json({ message: "Não foi possível gerar o identificador (slug) a partir do nome." })
    return
  }
  const existente = await servico.listMaterials({ slug })
  if (existente.length) {
    res.status(409).json({ message: `Já existe um material com o identificador "${slug}".` })
    return
  }
  const material = await servico.createMaterials({ ...dados, slug })
  res.status(201).json({ material })
}
