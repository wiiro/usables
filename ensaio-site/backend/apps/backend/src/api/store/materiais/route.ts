import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTEUDO_MODULE } from "../../../modules/conteudo"
import type ConteudoModuleService from "../../../modules/conteudo/service"

// Materioteca pública: só materiais ativos, na ordem definida no painel.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const servico: ConteudoModuleService = req.scope.resolve(CONTEUDO_MODULE)
  const materiais = await servico.listMaterials({ ativo: true }, { order: { ordem: "ASC", nome: "ASC" } })
  res.json({ materiais })
}
