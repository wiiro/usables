import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTEUDO_MODULE } from "../../../../modules/conteudo"
import type ConteudoModuleService from "../../../../modules/conteudo/service"
import type { AtualizarMaterial } from "../../../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const servico: ConteudoModuleService = req.scope.resolve(CONTEUDO_MODULE)
  const [material] = await servico.listMaterials({ id: req.params.id })
  if (!material) {
    res.status(404).json({ message: "Material não encontrado." })
    return
  }
  res.json({ material })
}

export async function POST(req: MedusaRequest<AtualizarMaterial>, res: MedusaResponse) {
  const servico: ConteudoModuleService = req.scope.resolve(CONTEUDO_MODULE)
  const [existente] = await servico.listMaterials({ id: req.params.id })
  if (!existente) {
    res.status(404).json({ message: "Material não encontrado." })
    return
  }
  const dados = req.validatedBody
  if (dados.slug && dados.slug !== existente.slug) {
    const duplicado = await servico.listMaterials({ slug: dados.slug })
    if (duplicado.length) {
      res.status(409).json({ message: `Já existe um material com o identificador "${dados.slug}".` })
      return
    }
  }
  const material = await servico.updateMaterials({ id: req.params.id, ...dados })
  res.json({ material })
}

// Exclusão lógica (soft delete): some do site e do painel, mas o registro pode ser recuperado no banco.
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const servico: ConteudoModuleService = req.scope.resolve(CONTEUDO_MODULE)
  const [existente] = await servico.listMaterials({ id: req.params.id })
  if (!existente) {
    res.status(404).json({ message: "Material não encontrado." })
    return
  }
  await servico.softDeleteMaterials(req.params.id)
  res.json({ id: req.params.id, excluido: true })
}
