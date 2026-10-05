import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTEUDO_MODULE } from "../../../modules/conteudo"
import type ConteudoModuleService from "../../../modules/conteudo/service"

// Conteúdo público editável (abertura, Instagram). Objeto { chave: valor }.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const servico: ConteudoModuleService = req.scope.resolve(CONTEUDO_MODULE)
  const itens = await servico.listConfigSites({})
  res.json({ conteudo: Object.fromEntries(itens.map((i) => [i.chave, i.valor])) })
}
