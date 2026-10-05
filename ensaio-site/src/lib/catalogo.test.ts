import { describe, expect, it } from "vitest";
import { precoEmCentavos } from "./catalogo";

describe("precoEmCentavos", () => {
  const v = (n: number | null | undefined) => ({
    id: "v",
    title: "t",
    calculated_price: n === undefined ? undefined : { calculated_amount: n, currency_code: "brl" },
  });

  it("usa o menor preço entre as variantes", () => {
    expect(precoEmCentavos([v(249), v(189), v(329)])).toBe(18900);
  });
  it("ignora variantes sem preço calculado", () => {
    expect(precoEmCentavos([v(null), v(undefined), v(149)])).toBe(14900);
  });
  it("sem variantes ou sem preço: zero", () => {
    expect(precoEmCentavos([])).toBe(0);
    expect(precoEmCentavos()).toBe(0);
    expect(precoEmCentavos([v(null)])).toBe(0);
  });
  it("arredonda frações de centavo", () => {
    expect(precoEmCentavos([v(10.005)])).toBe(1001);
  });
});
