import { model } from "@medusajs/framework/utils"

// Item da Materioteca (catálogo de biomateriais). Editado pelo painel.
const Material = model.define("material", {
  id: model.id().primaryKey(),
  nome: model.text(),
  slug: model.text().unique(),
  descricao: model.text().nullable(),
  ingredientes: model.text().nullable(),
  origem: model.text().nullable(),
  imagem_url: model.text().nullable(),
  ordem: model.number().default(0),
  ativo: model.boolean().default(true),
})

export default Material
