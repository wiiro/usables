import "server-only";
import { MedusaError, medusaFetch } from "./medusa";
import { gravarCarrinhoId, lerCarrinhoId, limparCarrinhoId, lerToken } from "./sessao";

// ---- Tipos expostos ao site (valores monetários em CENTAVOS inteiros) ----

export type ItemCarrinho = {
  id: string;
  variantId: string;
  titulo: string;
  variante: string;
  handle: string;
  thumbnail: string | null;
  quantidade: number;
  precoUnitarioCentavos: number;
  totalCentavos: number;
};

export type OpcaoEnvio = { id: string; nome: string; precoCentavos: number };

export type Endereco = {
  first_name?: string;
  last_name?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country_code?: string;
  phone?: string;
};

export type Carrinho = {
  id: string;
  email: string | null;
  itens: ItemCarrinho[];
  quantidadeTotal: number;
  subtotalCentavos: number;
  descontoCentavos: number;
  freteCentavos: number;
  totalCentavos: number;
  cupons: string[];
  envioSelecionadoId: string | null;
  enderecoEntrega: Endereco | null;
};

// ---- Tipos da API (parciais) ----

type ItemApi = {
  id: string;
  variant_id: string;
  product_title: string;
  variant_title: string | null;
  product_handle: string | null;
  thumbnail: string | null;
  quantity: number;
  unit_price: number;
  total: number;
};
type CarrinhoApi = {
  id: string;
  email: string | null;
  items?: ItemApi[];
  item_subtotal: number;
  discount_total: number;
  shipping_total: number;
  total: number;
  promotions?: { code?: string }[];
  shipping_methods?: { shipping_option_id: string }[];
  shipping_address?: Endereco | null;
};

const CAMPOS = "*items,*promotions,*shipping_methods,+items.product_handle,+items.variant_title,+items.thumbnail";

/** Medusa v2 usa a unidade principal da moeda (R$ 189 = 189). O site usa centavos. */
export function paraCentavos(valor: number): number {
  return Math.round((Number.isFinite(valor) ? valor : 0) * 100);
}

export function mapearCarrinho(c: CarrinhoApi): Carrinho {
  const itens = (c.items ?? []).map((i) => ({
    id: i.id,
    variantId: i.variant_id,
    titulo: i.product_title,
    variante: i.variant_title ?? "",
    handle: i.product_handle ?? "",
    thumbnail: i.thumbnail,
    quantidade: i.quantity,
    precoUnitarioCentavos: paraCentavos(i.unit_price),
    totalCentavos: paraCentavos(i.total),
  }));
  return {
    id: c.id,
    email: c.email,
    itens,
    quantidadeTotal: itens.reduce((soma, i) => soma + i.quantidade, 0),
    subtotalCentavos: paraCentavos(c.item_subtotal),
    descontoCentavos: paraCentavos(c.discount_total),
    freteCentavos: paraCentavos(c.shipping_total),
    totalCentavos: paraCentavos(c.total),
    cupons: (c.promotions ?? []).map((p) => p.code).filter((x): x is string => Boolean(x)),
    envioSelecionadoId: c.shipping_methods?.[0]?.shipping_option_id ?? null,
    enderecoEntrega: c.shipping_address ?? null,
  };
}

// ---- Operações ----

async function regiaoBrasilId(): Promise<string> {
  const { regions } = await medusaFetch<{ regions: { id: string }[] }>("/store/regions", { revalidarSegundos: 300 });
  const regiao = regions[0];
  if (!regiao) throw new MedusaError("Nenhuma região configurada no backend");
  return regiao.id;
}

/** Carrinho atual do visitante, ou undefined se não houver (ou se já foi finalizado/expirou). */
export async function obterCarrinho(): Promise<Carrinho | undefined> {
  const id = await lerCarrinhoId();
  if (!id) return undefined;
  try {
    const { cart } = await medusaFetch<{ cart: CarrinhoApi }>(`/store/carts/${id}`, { params: { fields: CAMPOS } });
    return mapearCarrinho(cart);
  } catch (erro) {
    if (erro instanceof MedusaError && (erro.status === 404 || erro.status === 400)) {
      await limparCarrinhoId();
      return undefined;
    }
    throw erro;
  }
}

async function garantirCarrinhoId(): Promise<string> {
  const existente = await lerCarrinhoId();
  if (existente) return existente;
  const token = await lerToken();
  const { cart } = await medusaFetch<{ cart: CarrinhoApi }>("/store/carts", {
    metodo: "POST",
    corpo: { region_id: await regiaoBrasilId() },
    token,
  });
  await gravarCarrinhoId(cart.id);
  return cart.id;
}

export async function adicionarItem(variantId: string, quantidade = 1): Promise<void> {
  const id = await garantirCarrinhoId();
  await medusaFetch(`/store/carts/${id}/line-items`, {
    metodo: "POST",
    corpo: { variant_id: variantId, quantity: quantidade },
  });
}

export async function atualizarQuantidade(itemId: string, quantidade: number): Promise<void> {
  const id = await lerCarrinhoId();
  if (!id) return;
  if (quantidade <= 0) {
    await medusaFetch(`/store/carts/${id}/line-items/${itemId}`, { metodo: "DELETE" });
    return;
  }
  await medusaFetch(`/store/carts/${id}/line-items/${itemId}`, { metodo: "POST", corpo: { quantity: quantidade } });
}

export async function aplicarCupom(codigo: string): Promise<void> {
  const id = await lerCarrinhoId();
  if (!id) throw new MedusaError("Carrinho vazio");
  await medusaFetch(`/store/carts/${id}/promotions`, { metodo: "POST", corpo: { promo_codes: [codigo] } });
}

export async function removerCupom(codigo: string): Promise<void> {
  const id = await lerCarrinhoId();
  if (!id) return;
  await medusaFetch(`/store/carts/${id}/promotions`, { metodo: "DELETE", corpo: { promo_codes: [codigo] } });
}

export async function opcoesDeEnvio(carrinhoId: string): Promise<OpcaoEnvio[]> {
  const { shipping_options } = await medusaFetch<{ shipping_options: { id: string; name: string; amount: number }[] }>(
    "/store/shipping-options",
    { params: { cart_id: carrinhoId } },
  );
  return shipping_options.map((o) => ({ id: o.id, nome: o.name, precoCentavos: paraCentavos(o.amount) }));
}

export type DadosCheckout = { email: string; endereco: Required<Omit<Endereco, "address_2">> & { address_2: string }; envioId: string };

/**
 * Finaliza a compra: endereço, frete, pagamento e conclusão.
 * Pagamento: provider de teste do Medusa (pp_system_default) até o Mercado Pago ser integrado.
 * Retorna o número do pedido.
 */
export async function finalizarPedido(dados: DadosCheckout): Promise<number> {
  const id = await lerCarrinhoId();
  if (!id) throw new MedusaError("Carrinho vazio");
  const token = await lerToken();

  await medusaFetch(`/store/carts/${id}`, {
    metodo: "POST",
    corpo: { email: dados.email, shipping_address: dados.endereco, billing_address: dados.endereco },
    token,
  });
  await medusaFetch(`/store/carts/${id}/shipping-methods`, { metodo: "POST", corpo: { option_id: dados.envioId } });
  const { payment_collection } = await medusaFetch<{ payment_collection: { id: string } }>("/store/payment-collections", {
    metodo: "POST",
    corpo: { cart_id: id },
  });
  await medusaFetch(`/store/payment-collections/${payment_collection.id}/payment-sessions`, {
    metodo: "POST",
    corpo: { provider_id: "pp_system_default" },
  });
  const resultado = await medusaFetch<{ type: string; order?: { display_id: number }; error?: { message?: string } }>(
    `/store/carts/${id}/complete`,
    { metodo: "POST", corpo: {}, token },
  );
  if (resultado.type !== "order" || !resultado.order) {
    throw new MedusaError("Não foi possível concluir o pedido", 409, resultado.error?.message);
  }
  await limparCarrinhoId();
  return resultado.order.display_id;
}
