import { Module } from "@medusajs/framework/utils"
import ConteudoModuleService from "./service"

export const CONTEUDO_MODULE = "conteudo"

export default Module(CONTEUDO_MODULE, { service: ConteudoModuleService })
