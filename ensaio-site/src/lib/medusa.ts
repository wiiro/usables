// Cliente mínimo da Store API do Medusa, usado só no servidor.
// Variáveis: MEDUSA_BACKEND_URL e NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY (.env.local).

type Valor = string | number | string[] | undefined;

export class MedusaError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    /** Mensagem do backend, segura para exibir ao cliente (pode ser undefined). */
    readonly detalhe?: string,
  ) {
    super(message);
    this.name = "MedusaError";
  }
}

function configuracao() {
  const base = process.env.MEDUSA_BACKEND_URL;
  const chave = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  if (!base || !chave) {
    throw new MedusaError("MEDUSA_BACKEND_URL e NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY não configuradas");
  }
  return { base, chave };
}

type Opcoes = {
  metodo?: "GET" | "POST" | "DELETE";
  params?: Record<string, Valor>;
  corpo?: unknown;
  /** JWT do cliente logado (Authorization: Bearer). */
  token?: string;
  /** Só para GET público; escritas e dados do cliente nunca usam cache. */
  revalidarSegundos?: number;
};

/**
 * Requisição à API do Medusa. GET sem token usa cache (revalidarSegundos);
 * qualquer outra chamada é `no-store`, para nunca misturar dados de clientes.
 */
export async function medusaFetch<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const { base, chave } = configuracao();
  const { metodo = "GET", params = {}, corpo, token, revalidarSegundos = 60 } = opcoes;

  const url = new URL(caminho, base);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    if (Array.isArray(v)) v.forEach((item) => url.searchParams.append(k, item));
    else url.searchParams.set(k, String(v));
  }

  const headers: Record<string, string> = { "x-publishable-api-key": chave };
  if (corpo !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;

  const cacheavel = metodo === "GET" && !token;
  let resposta: Response;
  try {
    resposta = await fetch(url, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      ...(cacheavel ? { next: { revalidate: revalidarSegundos } } : { cache: "no-store" as const }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (erro) {
    throw new MedusaError(`Falha ao contatar o backend: ${(erro as Error).message}`);
  }

  if (!resposta.ok) {
    let detalhe: string | undefined;
    try {
      const json = (await resposta.json()) as { message?: string };
      detalhe = json.message;
    } catch {
      detalhe = undefined;
    }
    throw new MedusaError(`Backend respondeu ${resposta.status} em ${caminho}`, resposta.status, detalhe);
  }
  if (resposta.status === 204) return undefined as T;
  return (await resposta.json()) as T;
}

/** Atalho para GET público com cache. */
export function medusaGet<T>(
  caminho: string,
  params: Record<string, Valor> = {},
  revalidarSegundos = 60,
): Promise<T> {
  return medusaFetch<T>(caminho, { params, revalidarSegundos });
}
