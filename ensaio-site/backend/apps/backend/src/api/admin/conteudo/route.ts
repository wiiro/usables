import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTEUDO_MODULE } from "../../../modules/conteudo"
import type ConteudoModuleService from "../../../modules/conteudo/service"
import type { Conteudo } from "../../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const servico: ConteudoModuleService = req.scope.resolve(CONTEUDO_MODULE)
  const itens = await servico.listConfigSites({})
  res.json({ conteudo: Object.fromEntries(itens.map((i) => [i.chave, i.valor])) })
}

// Atualiza apenas as chaves enviadas (upsert por chave).
export async function POST(req: MedusaRequest<Conteudo>, res: MedusaResponse) {
  const servico: ConteudoModuleService = req.scope.resolve(CONTEUDO_MODULE)
  const dados = req.validatedBody
  const atuais = await servico.listConfigSites({})
  for (const [chave, valor] of Object.entries(dados)) {
    const existente = atuais.find((i) => i.chave === chave)
    if (existente) await servico.updateConfigSites({ id: existente.id, valor: valor as never })
    else await servico.createConfigSites({ chave, valor: valor as never })
  }
  const itens = await servico.listConfigSites({})
  res.json({ conteudo: Object.fromEntries(itens.map((i) => [i.chave, i.valor])) })
}
