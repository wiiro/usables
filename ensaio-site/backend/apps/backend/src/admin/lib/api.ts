// Cliente mínimo para as rotas /admin/* do painel (usa a sessão do admin logado).

export class ErroApi extends Error {
  constructor(
    mensagem: string,
    readonly status: number,
  ) {
    super(mensagem)
    this.name = "ErroApi"
  }
}

export async function api<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const cabecalhos: Record<string, string> = {}
  if (typeof init.body === "string") cabecalhos["content-type"] = "application/json"
  const r = await fetch(caminho, { credentials: "include", ...init, headers: { ...cabecalhos, ...(init.headers as Record<string, string>) } })
  if (!r.ok) {
    let mensagem = `Erro ${r.status}`
    try {
      const json = (await r.json()) as { message?: string }
      if (json.message) mensagem = json.message.replace(/^Invalid request: /, "")
    } catch {
      // corpo vazio ou não-JSON: mantém a mensagem padrão
    }
    throw new ErroApi(mensagem, r.status)
  }
  return (await r.json()) as T
}

/** Envia um arquivo ao armazenamento do Medusa e devolve a URL pública. */
export async function enviarArquivo(arquivo: File): Promise<string> {
  const form = new FormData()
  form.append("files", arquivo)
  const r = await api<{ files: { url: string }[] }>("/admin/uploads", { method: "POST", body: form })
  const url = r.files[0]?.url
  if (!url) throw new ErroApi("O envio não devolveu uma URL.", 502)
  return url
}
