import { describe, expect, it } from "vitest";
import { analisePermitida, lerConsentimento, montarCookie } from "./consentimento";

describe("consentimento de cookies", () => {
  it("sem cookie: ainda não escolheu e análise bloqueada", () => {
    expect(lerConsentimento("")).toBeUndefined();
    expect(lerConsentimento("a=1; b=2")).toBeUndefined();
    expect(analisePermitida("a=1")).toBe(false);
  });
  it("lê valores válidos entre outros cookies", () => {
    expect(lerConsentimento("a=1; ensaio_consent=essencial; b=2")).toBe("essencial");
    expect(lerConsentimento("ensaio_consent=analise")).toBe("analise");
  });
  it("só 'analise' libera scripts de análise", () => {
    expect(analisePermitida("ensaio_consent=essencial")).toBe(false);
    expect(analisePermitida("ensaio_consent=analise")).toBe(true);
  });
  it("valor inválido é tratado como não escolhido (falha segura)", () => {
    expect(lerConsentimento("ensaio_consent=tudo")).toBeUndefined();
    expect(analisePermitida("ensaio_consent=tudo")).toBe(false);
  });
  it("monta o cookie com validade, SameSite e Secure só em https", () => {
    const http = montarCookie("essencial", false);
    expect(http).toContain("ensaio_consent=essencial");
    expect(http).toContain("SameSite=Lax");
    expect(http).not.toContain("Secure");
    expect(montarCookie("analise", true)).toContain("; Secure");
  });
});
