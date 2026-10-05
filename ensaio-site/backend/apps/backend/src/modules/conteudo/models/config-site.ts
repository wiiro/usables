import { model } from "@medusajs/framework/utils"

// Conteúdo editável do site em pares chave/valor (ex.: vídeo da abertura, Instagram).
const ConfigSite = model.define("config_site", {
  id: model.id().primaryKey(),
  chave: model.text().unique(),
  valor: model.json().nullable(),
})

export default ConfigSite
