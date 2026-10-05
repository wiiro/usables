import { MedusaService } from "@medusajs/framework/utils"
import ConfigSite from "./models/config-site"
import Material from "./models/material"

class ConteudoModuleService extends MedusaService({ Material, ConfigSite }) {}

export default ConteudoModuleService
