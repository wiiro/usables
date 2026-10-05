import { describe, expect, it } from "vitest";
import {
  caminhoInterno,
  cupomValido,
  emailValido,
  normalizarCep,
  normalizarTelefone,
  quantidadeValida,
  senhaValida,
  ufValida,
  validarCheckout,
} from "./validacao";

function form(campos: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
}

const valido = {
  email: "Maria@Exemplo.com",
  nome: "Maria",
  sobrenome: "Silva",
  telefone: "(41) 99999-9999",
  cep: "80010-000",
  rua: "Rua das Flores",
  numero: "45",
  complemento: "ap 2",
  bairro: "Centro",
  cidade: "Curitiba",
  uf: "pr",
  envio: "so_123",
};

describe("campos individuais", () => {
  it("emailValido", () => {
    expect(emailValido("a@b.co")).toBe(true);
    expect(emailValido("sem-arroba")).toBe(false);
    expect(emailValido("a@b")).toBe(false);
    expect(emailValido("a b@c.com")).toBe(false);
    expect(emailValido(`${"a".repeat(250)}@b.com`)).toBe(false);
  });
  it("normalizarCep", () => {
    expect(normalizarCep("80010000")).toBe("80010-000");
    expect(normalizarCep("80010-000")).toBe("80010-000");
    expect(normalizarCep("8001")).toBeUndefined();
    expect(normalizarCep("")).toBeUndefined();
  });
  it("normalizarTelefone aceita 10 ou 11 dígitos", () => {
    expect(normalizarTelefone("(41) 3333-4444")).toBe("4133334444");
    expect(normalizarTelefone("41999999999")).toBe("41999999999");
    expect(normalizarTelefone("999999")).toBeUndefined();
  });
  it("ufValida", () => {
    expect(ufValida("PR")).toBe(true);
    expect(ufValida("XX")).toBe(false);
    expect(ufValida("pr")).toBe(false);
  });
  it("quantidadeValida limita de 0 a 20 e só inteiros", () => {
    expect(quantidadeValida("0")).toBe(0);
    expect(quantidadeValida("20")).toBe(20);
    expect(quantidadeValida("21")).toBeUndefined();
    expect(quantidadeValida("-1")).toBeUndefined();
    expect(quantidadeValida("1.5")).toBeUndefined();
    expect(quantidadeValida("abc")).toBeUndefined();
    expect(quantidadeValida("")).toBeUndefined();
  });
  it("cupomValido normaliza e rejeita caracteres estranhos", () => {
    expect(cupomValido(" ensaio10 ")).toBe("ENSAIO10");
    expect(cupomValido("a")).toBeUndefined();
    expect(cupomValido("x'; drop")).toBeUndefined();
  });
  it("senhaValida: 8 a 128 caracteres", () => {
    expect(senhaValida("1234567")).toBe(false);
    expect(senhaValida("12345678")).toBe(true);
    expect(senhaValida("a".repeat(129))).toBe(false);
  });
  it("caminhoInterno bloqueia open redirect", () => {
    expect(caminhoInterno("/loja/colar")).toBe("/loja/colar");
    expect(caminhoInterno("//evil.com")).toBe("/conta");
    expect(caminhoInterno("https://evil.com")).toBe("/conta");
    expect(caminhoInterno("/../etc")).toBe("/conta");
    expect(caminhoInterno("javascript:alert(1)", "/x")).toBe("/x");
  });
});

describe("validarCheckout", () => {
  it("aceita dados válidos e normaliza", () => {
    const r = validarCheckout(form(valido));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.email).toBe("maria@exemplo.com");
    expect(r.endereco.address_1).toBe("Rua das Flores, 45");
    expect(r.endereco.address_2).toBe("Centro - ap 2");
    expect(r.endereco.province).toBe("PR");
    expect(r.endereco.postal_code).toBe("80010-000");
    expect(r.endereco.phone).toBe("41999999999");
    expect(r.endereco.country_code).toBe("br");
  });
  it("complemento é opcional", () => {
    const r = validarCheckout(form({ ...valido, complemento: "" }));
    expect(r.ok && r.endereco.address_2).toBe("Centro");
  });
  it.each([
    ["email", "x", "e-mail"],
    ["nome", "", "nome"],
    ["telefone", "123", "telefone"],
    ["cep", "123", "CEP"],
    ["rua", "", "rua"],
    ["bairro", "", "bairro"],
    ["uf", "ZZ", "estado"],
    ["envio", "", "envio"],
  ])("rejeita %s inválido", (campo, valor, trecho) => {
    const r = validarCheckout(form({ ...valido, [campo]: valor }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro.toLowerCase()).toContain(trecho.toLowerCase());
  });
  it("devolve os valores digitados para repreencher o formulário", () => {
    const r = validarCheckout(form({ ...valido, cep: "1" }));
    expect(!r.ok && r.valores.nome).toBe("Maria");
  });
  it("trunca entradas gigantes", () => {
    const r = validarCheckout(form({ ...valido, nome: "a".repeat(500) }));
    expect(r.ok && r.endereco.first_name.length).toBe(60);
  });
});
