import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * LGPD Art. 18 (acesso e portabilidade): devolve, em JSON estruturado, os dados
 * do cliente autenticado: cadastro, endereços e pedidos. Nunca expõe dados de
 * outras pessoas: o id vem do token, não da requisição.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id;
  if (!customerId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: clientes } = await query.graph({
    entity: "customer",
    fields: [
      "id", "email", "first_name", "last_name", "phone", "company_name",
      "created_at", "updated_at", "metadata", "addresses.*",
    ],
    filters: { id: customerId },
  });
  const cliente = clientes[0];
  if (!cliente) {
    res.status(404).json({ message: "Customer not found" });
    return;
  }

  const { data: pedidos } = await query.graph({
    entity: "order",
    fields: [
      "id", "display_id", "status", "email", "currency_code", "created_at",
      "items.title", "items.variant_title", "items.quantity", "items.unit_price",
      "shipping_address.*", "billing_address.*",
    ],
    filters: { customer_id: customerId },
  });

  res.setHeader("Content-Disposition", 'attachment; filename="meus-dados-ensaio.json"');
  res.json({
    exportado_em: new Date().toISOString(),
    base_legal: "LGPD, Lei 13.709/2018, Art. 18 (acesso e portabilidade)",
    cliente,
    pedidos,
  });
}
