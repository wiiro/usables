import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTEUDO_MODULE } from "../../../../modules/conteudo"
import type ConteudoModuleService from "../../../../modules/conteudo/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const servico: ConteudoModuleService = req.scope.resolve(CONTEUDO_MODULE)
  const [material] = await servico.listMaterials({ slug: req.params.slug, ativo: true })
  if (!material) {
    res.status(404).json({ message: "Material não encontrado." })
    return
  }
  res.json({ material })
}
