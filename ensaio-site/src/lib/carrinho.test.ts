import { describe, expect, it } from "vitest";
import { mapearCarrinho, paraCentavos } from "./carrinho";

describe("paraCentavos", () => {
  it("converte unidade principal em centavos sem erro de ponto flutuante", () => {
    expect(paraCentavos(189)).toBe(18900);
    expect(paraCentavos(0.1 + 0.2)).toBe(30);
    expect(paraCentavos(170.1)).toBe(17010);
    expect(paraCentavos(18.9)).toBe(1890);
  });
  it("valores inválidos viram zero", () => {
    expect(paraCentavos(Number.NaN)).toBe(0);
    expect(paraCentavos(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("mapearCarrinho", () => {
  const api = {
    id: "cart_1",
    email: null,
    items: [
      { id: "cali_1", variant_id: "variant_1", product_title: "Colar", variant_title: "Único", product_handle: "colar", thumbnail: null, quantity: 2, unit_price: 249, total: 498 },
      { id: "cali_2", variant_id: "variant_2", product_title: "Brinco", variant_title: null, product_handle: null, thumbnail: "http://x/y.png", quantity: 1, unit_price: 189, total: 189 },
    ],
    item_subtotal: 687,
    discount_total: 68.7,
    shipping_total: 25,
    total: 643.3,
    promotions: [{ code: "ENSAIO10" }, {}],
    shipping_methods: [{ shipping_option_id: "so_1" }],
    shipping_address: null,
  };

  it("converte valores para centavos e soma a quantidade", () => {
    const c = mapearCarrinho(api);
    expect(c.quantidadeTotal).toBe(3);
    expect(c.subtotalCentavos).toBe(68700);
    expect(c.descontoCentavos).toBe(6870);
    expect(c.freteCentavos).toBe(2500);
    expect(c.totalCentavos).toBe(64330);
    expect(c.itens[0]?.precoUnitarioCentavos).toBe(24900);
  });
  it("trata campos ausentes com valores seguros", () => {
    const c = mapearCarrinho(api);
    expect(c.itens[1]?.variante).toBe("");
    expect(c.itens[1]?.handle).toBe("");
    expect(c.cupons).toEqual(["ENSAIO10"]);
    expect(c.envioSelecionadoId).toBe("so_1");
  });
  it("carrinho sem itens nem promoções", () => {
    const c = mapearCarrinho({ id: "c", email: "a@b.co", item_subtotal: 0, discount_total: 0, shipping_total: 0, total: 0 });
    expect(c.itens).toEqual([]);
    expect(c.quantidadeTotal).toBe(0);
    expect(c.cupons).toEqual([]);
    expect(c.envioSelecionadoId).toBeNull();
  });
});
