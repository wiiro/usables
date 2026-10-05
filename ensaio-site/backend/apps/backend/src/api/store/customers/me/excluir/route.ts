import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { updateCustomersWorkflow } from "@medusajs/medusa/core-flows";

/**
 * LGPD Art. 18, IV (eliminação): anonimiza o cadastro do cliente autenticado e
 * remove a credencial de acesso. Os PEDIDOS são mantidos (obrigação legal e
 * fiscal, LGPD Art. 16, I), com os dados da compra (e-mail e endereço de entrega),
 * mas deixam de estar ligados à conta do cliente.
 * Exige corpo { "confirmar": true }. Irreversível.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id;
  if (!customerId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const corpo = (req.body ?? {}) as { confirmar?: unknown };
  if (corpo.confirmar !== true) {
    res.status(400).json({ message: "Confirmação obrigatória: envie { \"confirmar\": true }" });
    return;
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const auth = req.scope.resolve(Modules.AUTH);
  const customerModule = req.scope.resolve(Modules.CUSTOMER);

  const { data: clientes } = await query.graph({
    entity: "customer",
    fields: ["id", "metadata", "addresses.id"],
    filters: { id: customerId },
  });
  const cliente = clientes[0];
  if (!cliente) {
    res.status(404).json({ message: "Customer not found" });
    return;
  }

  // 1. Remove a credencial de login (identidades ligadas a este cliente).
  const identidades = await auth.listAuthIdentities({}, { select: ["id", "app_metadata"], take: 10000 });
  const idsIdentidade = identidades
    .filter((i) => (i.app_metadata as { customer_id?: string } | null)?.customer_id === customerId)
    .map((i) => i.id);
  if (idsIdentidade.length) await auth.deleteAuthIdentities(idsIdentidade);

  // 2. Remove endereços salvos.
  const idsEndereco = (cliente.addresses ?? []).map((a) => a?.id).filter((x): x is string => Boolean(x));
  if (idsEndereco.length) await customerModule.deleteCustomerAddresses(idsEndereco);

  // 3. Anonimiza o cadastro (nunca loga os valores originais).
  await updateCustomersWorkflow(req.scope).run({
    input: {
      selector: { id: customerId },
      update: {
        email: `excluido-${customerId}@anonimizado.invalid`,
        first_name: null,
        last_name: null,
        phone: null,
        company_name: null,
        // O Medusa mescla metadata por chave: é preciso anular cada chave existente.
        metadata: {
          ...Object.fromEntries(Object.keys(cliente.metadata ?? {}).map((k) => [k, null])),
          excluido_em: new Date().toISOString(),
        },
      },
    },
  });

  logger.info(`[lgpd] cliente ${customerId} anonimizado; ${idsIdentidade.length} credencial(is) removida(s)`);
  res.json({ anonimizado: true });
}
