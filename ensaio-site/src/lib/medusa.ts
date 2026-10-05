// Cliente mínimo da Store API do Medusa (somente leitura, no servidor).
// Variáveis: MEDUSA_BACKEND_URL e NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY (.env.local).

type Valor = string | number | string[] | undefined;

export class MedusaError extends Error {
  constructor(
    message: string,
    readonly status?: number,
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

export async function medusaGet<T>(
  caminho: string,
  params: Record<string, Valor> = {},
  revalidarSegundos = 60,
): Promise<T> {
  const { base, chave } = configuracao();
  const url = new URL(caminho, base);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    if (Array.isArray(v)) v.forEach((item) => url.searchParams.append(k, item));
    else url.searchParams.set(k, String(v));
  }

  let resposta: Response;
  try {
    resposta = await fetch(url, {
      headers: { "x-publishable-api-key": chave },
      next: { revalidate: revalidarSegundos },
      signal: AbortSignal.timeout(8000),
    });
  } catch (erro) {
    throw new MedusaError(`Falha ao contatar o backend: ${(erro as Error).message}`);
  }
  if (!resposta.ok) {
    throw new MedusaError(`Backend respondeu ${resposta.status} em ${caminho}`, resposta.status);
  }
  return (await resposta.json()) as T;
}
