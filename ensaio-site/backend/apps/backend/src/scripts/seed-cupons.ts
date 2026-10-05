import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createPromotionsWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Cupom de DESENVOLVIMENTO para testar o desconto no carrinho.
 * Idempotente. Uso: npx medusa exec ./src/scripts/seed-cupons.ts
 */
export default async function seedCupons({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: existentes } = await query.graph({ entity: "promotion", fields: ["id", "code"] });
  if (existentes.some((p) => p.code === "ENSAIO10")) {
    logger.info("Cupom ENSAIO10 já existe.");
    return;
  }

  await createPromotionsWorkflow(container).run({
    input: {
      promotionsData: [
        {
          code: "ENSAIO10",
          type: "standard",
          status: "active",
          is_automatic: false,
          application_method: {
            type: "percentage",
            target_type: "order",
            value: 10,
            currency_code: "brl",
          },
        },
      ],
    },
  });
  logger.info("Cupom ENSAIO10 (10% no pedido) criado.");
}
