import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MedusaError, medusaFetch } from "./medusa";

const fetchMock = vi.fn();

beforeEach(() => {
  process.env.MEDUSA_BACKEND_URL = "http://backend.test";
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = "pk_test";
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  delete process.env.MEDUSA_BACKEND_URL;
  delete process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
});

const resposta = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { "content-type": "application/json" } });

describe("medusaFetch", () => {
  it("envia a chave publicável e monta a query string (arrays repetidos)", async () => {
    fetchMock.mockResolvedValue(resposta({ ok: true }));
    await medusaFetch("/store/products", { params: { q: "colar", id: ["a", "b"], vazio: "", nada: undefined } });
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("http://backend.test/store/products?q=colar&id=a&id=b");
    expect((init.headers as Record<string, string>)["x-publishable-api-key"]).toBe("pk_test");
  });

  it("GET público usa cache; escrita e dados do cliente nunca", async () => {
    // Uma Response nova por chamada (o corpo só pode ser lido uma vez).
    fetchMock.mockImplementation(() => Promise.resolve(resposta({})));
    await medusaFetch("/a");
    await medusaFetch("/b", { metodo: "POST", corpo: {} });
    await medusaFetch("/c", { token: "jwt" });
    const init = (i: number) => fetchMock.mock.calls[i]?.[1] as RequestInit & { next?: unknown };
    expect(init(0).next).toEqual({ revalidate: 60 });
    expect(init(1).cache).toBe("no-store");
    expect(init(2).cache).toBe("no-store");
    expect((init(2).headers as Record<string, string>).authorization).toBe("Bearer jwt");
  });

  it("serializa o corpo como JSON", async () => {
    fetchMock.mockResolvedValue(resposta({}));
    await medusaFetch("/x", { metodo: "POST", corpo: { a: 1 } });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.body).toBe('{"a":1}');
    expect((init.headers as Record<string, string>)["content-type"]).toBe("application/json");
  });

  it("resposta de erro vira MedusaError com status e detalhe", async () => {
    fetchMock.mockResolvedValue(resposta({ message: "invalid code" }, 400));
    await expect(medusaFetch("/x")).rejects.toMatchObject({ name: "MedusaError", status: 400, detalhe: "invalid code" });
  });

  it("erro de rede vira MedusaError sem status", async () => {
    fetchMock.mockRejectedValue(new Error("boom"));
    const erro = await medusaFetch("/x").catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(MedusaError);
    expect((erro as MedusaError).status).toBeUndefined();
  });

  it("falha claramente quando a configuração está ausente", async () => {
    delete process.env.MEDUSA_BACKEND_URL;
    await expect(medusaFetch("/x")).rejects.toThrow(/não configuradas/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("204 retorna undefined", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(medusaFetch("/x", { metodo: "DELETE" })).resolves.toBeUndefined();
  });
});
