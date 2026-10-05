import { describe, expect, it } from "vitest";
import { formatarPreco } from "./format";

describe("formatarPreco", () => {
  it("formata centavos em reais", () => {
    expect(formatarPreco(18900).replace(/\s/g, " ")).toBe("R$ 189,00");
    expect(formatarPreco(5).replace(/\s/g, " ")).toBe("R$ 0,05");
  });
  it("aceita zero", () => {
    expect(formatarPreco(0).replace(/\s/g, " ")).toBe("R$ 0,00");
  });
  it("rejeita valores negativos, NaN e infinito", () => {
    expect(() => formatarPreco(-1)).toThrow(RangeError);
    expect(() => formatarPreco(Number.NaN)).toThrow(RangeError);
    expect(() => formatarPreco(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
