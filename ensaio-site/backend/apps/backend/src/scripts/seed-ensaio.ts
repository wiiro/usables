import type { ExecArgs } from "@medusajs/framework/types";
import { CONTEUDO_MODULE } from "../modules/conteudo";
import type ConteudoModuleService from "../modules/conteudo/service";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createShippingOptionsWorkflow,
  createTaxRegionsWorkflow,
  deleteProductCategoriesWorkflow,
  deleteProductsWorkflow,
  deleteShippingOptionsWorkflow,
  deleteTaxRegionsWorkflow,
  updateRegionsWorkflow,
  updateStockLocationsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

/**
 * Seed de DESENVOLVIMENTO da ensaio: converte o demo do starter (Europa, EUR,
 * camisetas) para Brasil, BRL e joias fictícias. Idempotente: produtos e
 * categorias do demo são removidos; os da ensaio (metadata.ensaio_seed) são
 * preservados na reexecução.
 *
 * Uso: npx medusa exec ./src/scripts/seed-ensaio.ts
 *
 * ATENÇÃO: no Medusa v2 os preços são em unidade principal da moeda
 * (189 = R$ 189,00), diferente de centavos. A camada do storefront converte.
 */

const CATEGORIAS = ["Brincos", "Earcuffs", "Colares", "Pulseiras", "Joias"];

const PRODUTOS = [
  { titulo: "Brinco Exemplo 01", handle: "ensaio-brinco-exemplo-01", categoria: "Brincos", preco: 189, sku: "ENS-BRI-001" },
  { titulo: "Earcuff Exemplo 02", handle: "ensaio-earcuff-exemplo-02", categoria: "Earcuffs", preco: 149, sku: "ENS-EAR-002" },
  { titulo: "Colar Exemplo 03", handle: "ensaio-colar-exemplo-03", categoria: "Colares", preco: 249, sku: "ENS-COL-003" },
  { titulo: "Pulseira Exemplo 04", handle: "ensaio-pulseira-exemplo-04", categoria: "Pulseiras", preco: 199, sku: "ENS-PUL-004" },
  { titulo: "Brinco Exemplo 05", handle: "ensaio-brinco-exemplo-05", categoria: "Brincos", preco: 179, sku: "ENS-BRI-005" },
  { titulo: "Joia Exemplo 06", handle: "ensaio-joia-exemplo-06", categoria: "Joias", preco: 329, sku: "ENS-JOI-006" },
];

export default async function seedEnsaio({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillment = container.resolve(ModuleRegistrationName.FULFILLMENT);

  // 1. Remove o demo do starter (preserva o que já é da ensaio).
  const { data: produtos } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata"],
  });
  const demoProdutos = produtos.filter((p) => !p.metadata?.ensaio_seed).map((p) => p.id);
  if (demoProdutos.length) {
    await deleteProductsWorkflow(container).run({ input: { ids: demoProdutos } });
    logger.info(`Removidos ${demoProdutos.length} produtos de demo.`);
  }

  const { data: categoriasAtuais } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });
  const demoCategorias = categoriasAtuais.filter((c) => !CATEGORIAS.includes(c.name)).map((c) => c.id);
  if (demoCategorias.length) {
    await deleteProductCategoriesWorkflow(container).run({ input: demoCategorias });
    logger.info(`Removidas ${demoCategorias.length} categorias de demo.`);
  }

  // 2. Loja e região: Brasil / BRL.
  const { data: [store] } = await query.graph({ entity: "store", fields: ["id"] });
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        name: "ensaio",
        supported_currencies: [{ currency_code: "brl", is_default: true }],
      },
    },
  });

  const { data: regioes } = await query.graph({ entity: "region", fields: ["id", "name", "currency_code"] });
  const regiaoExistente = regioes[0];
  if (!regiaoExistente) throw new Error("Nenhuma região encontrada; rode as migrações primeiro.");
  await updateRegionsWorkflow(container).run({
    input: {
      selector: { id: regiaoExistente.id },
      update: { name: "Brasil", currency_code: "brl", countries: ["br"] },
    },
  });

  const { data: taxRegions } = await query.graph({ entity: "tax_region", fields: ["id", "country_code"] });
  const antigas = taxRegions.filter((t) => t.country_code !== "br").map((t) => t.id);
  if (antigas.length) await deleteTaxRegionsWorkflow(container).run({ input: { ids: antigas } });
  if (!taxRegions.some((t) => t.country_code === "br")) {
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: "br", provider_id: "tp_system" }],
    });
  }

  // 3. Ateliê (estoque) e envio.
  const { data: [local] } = await query.graph({ entity: "stock_location", fields: ["id"] });
  await updateStockLocationsWorkflow(container).run({
    input: {
      selector: { id: local.id },
      update: { name: "Ateliê ensaio", address: { city: "Curitiba", country_code: "BR", address_1: "" } },
    },
  });

  const { data: zonas } = await query.graph({ entity: "service_zone", fields: ["id", "name"] });
  const zona = zonas[0];
  if (!zona) throw new Error("Service zone não encontrada.");
  const { data: geoZonas } = await query.graph({ entity: "geo_zone", fields: ["id", "country_code"] });
  const geoAntigas = geoZonas.filter((g) => g.country_code !== "br").map((g) => g.id);
  if (geoAntigas.length) await fulfillment.deleteGeoZones(geoAntigas);
  if (!geoZonas.some((g) => g.country_code === "br")) {
    await fulfillment.createGeoZones([{ type: "country", country_code: "br", service_zone_id: zona.id }]);
  }
  await fulfillment.updateServiceZones(zona.id, { name: "Brasil" });

  const { data: opcoes } = await query.graph({ entity: "shipping_option", fields: ["id", "name"] });
  const opcoesDemo = opcoes.filter((o) => o.name !== "Envio provisório").map((o) => o.id);
  if (opcoesDemo.length) await deleteShippingOptionsWorkflow(container).run({ input: { ids: opcoesDemo } });
  const { data: [perfil] } = await query.graph({ entity: "shipping_profile", fields: ["id"] });
  const { data: [regiao] } = await query.graph({ entity: "region", fields: ["id"] });
  if (!opcoes.some((o) => o.name === "Envio provisório")) {
    // Provisório até o provider do Melhor Envio (fase 5).
    await createShippingOptionsWorkflow(container).run({
      input: [{
        name: "Envio provisório",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: zona.id,
        shipping_profile_id: perfil.id,
        type: { label: "Padrão", description: "Valor fixo provisório.", code: "padrao" },
        prices: [{ currency_code: "brl", amount: 25 }, { region_id: regiao.id, amount: 25 }],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      }],
    });
  }

  // 4. Categorias e produtos fictícios (sob demanda: sem controle de estoque).
  const existentes = new Set(categoriasAtuais.map((c) => c.name));
  const novas = CATEGORIAS.filter((c) => !existentes.has(c));
  if (novas.length) {
    await createProductCategoriesWorkflow(container).run({
      input: { product_categories: novas.map((name) => ({ name, is_active: true })) },
    });
  }
  const { data: categorias } = await query.graph({ entity: "product_category", fields: ["id", "name"] });
  const { data: [canal] } = await query.graph({ entity: "sales_channel", fields: ["id"] });

  const handlesExistentes = new Set(produtos.filter((p) => p.metadata?.ensaio_seed).map((p) => p.handle));
  const aCriar = PRODUTOS.filter((p) => !handlesExistentes.has(p.handle));
  if (aCriar.length) {
    await createProductsWorkflow(container).run({
      input: {
        products: aCriar.map((p) => ({
          title: p.titulo,
          handle: p.handle,
          status: ProductStatus.PUBLISHED,
          description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          category_ids: [categorias.find((c) => c.name === p.categoria)!.id],
          shipping_profile_id: perfil.id,
          sales_channels: [{ id: canal.id }],
          options: [{ title: "Tamanho", values: ["Único"] }],
          metadata: {
            ensaio_seed: true,
            material: "Lorem ipsum",
            origem: "Lorem ipsum",
            processo: "Lorem ipsum",
            cuidados: "Lorem ipsum",
            prazo_producao_dias: 15,
          },
          variants: [{
            title: "Único",
            sku: p.sku,
            manage_inventory: false,
            options: { Tamanho: "Único" },
            prices: [{ currency_code: "brl", amount: p.preco }],
          }],
        })),
      },
    });
  }

  // 5. Materioteca de exemplo (só se estiver vazia). Textos são lorem ipsum.
  const conteudo: ConteudoModuleService = container.resolve(CONTEUDO_MODULE);
  const jaTemMateriais = (await conteudo.listMaterials({})).length > 0;
  if (!jaTemMateriais) {
    await conteudo.createMaterials(
      [1, 2, 3, 4].map((n) => ({
        nome: `Material Exemplo 0${n}`,
        slug: `material-exemplo-0${n}`,
        descricao: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        ingredientes: "Lorem ipsum",
        origem: "Lorem ipsum",
        ordem: n,
      })),
    );
    logger.info("Materioteca de exemplo criada (4 materiais).");
  }
  logger.info(`Seed ensaio concluído: ${aCriar.length} produtos criados.`);
}
