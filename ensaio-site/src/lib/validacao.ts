// Validação de entrada (funções puras, sem I/O): tudo que vem de formulário é
// tratado como não confiável. Mensagens em português para exibir ao cliente.

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function texto(valor: FormDataEntryValue | null | undefined, max = 200): string {
  return typeof valor === "string" ? valor.trim().slice(0, max) : "";
}

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function emailValido(email: string): boolean {
  return email.length <= 254 && EMAIL.test(email);
}

/** Retorna o CEP no formato 00000-000, ou undefined se inválido. */
export function normalizarCep(cep: string): string | undefined {
  const d = somenteDigitos(cep);
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : undefined;
}

/** Telefone brasileiro com DDD: 10 ou 11 dígitos. Retorna só os dígitos. */
export function normalizarTelefone(tel: string): string | undefined {
  const d = somenteDigitos(tel);
  return d.length === 10 || d.length === 11 ? d : undefined;
}

export function ufValida(uf: string): uf is (typeof UFS)[number] {
  return (UFS as readonly string[]).includes(uf);
}

export type EnderecoForm = {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string;
  city: string;
  province: string;
  postal_code: string;
  country_code: string;
  phone: string;
};

export type ResultadoCheckout =
  | { ok: true; email: string; endereco: EnderecoForm; envioId: string }
  | { ok: false; erro: string; valores: Record<string, string> };

/** Valida o formulário de checkout. `valores` volta ao formulário em caso de erro. */
export function validarCheckout(form: FormData): ResultadoCheckout {
  const v = {
    email: texto(form.get("email"), 254).toLowerCase(),
    nome: texto(form.get("nome"), 60),
    sobrenome: texto(form.get("sobrenome"), 60),
    telefone: texto(form.get("telefone"), 20),
    cep: texto(form.get("cep"), 12),
    rua: texto(form.get("rua"), 120),
    numero: texto(form.get("numero"), 10),
    complemento: texto(form.get("complemento"), 60),
    bairro: texto(form.get("bairro"), 60),
    cidade: texto(form.get("cidade"), 60),
    uf: texto(form.get("uf"), 2).toUpperCase(),
    envioId: texto(form.get("envio"), 80),
  };
  const falha = (erro: string): ResultadoCheckout => ({ ok: false, erro, valores: v });

  if (!emailValido(v.email)) return falha("Informe um e-mail válido.");
  if (!v.nome || !v.sobrenome) return falha("Informe nome e sobrenome.");
  const telefone = normalizarTelefone(v.telefone);
  if (!telefone) return falha("Informe o telefone com DDD (10 ou 11 dígitos).");
  const cep = normalizarCep(v.cep);
  if (!cep) return falha("Informe um CEP válido (8 dígitos).");
  if (!v.rua || !v.numero) return falha("Informe rua e número.");
  if (!v.bairro || !v.cidade) return falha("Informe bairro e cidade.");
  if (!ufValida(v.uf)) return falha("Selecione o estado (UF).");
  if (!v.envioId) return falha("Escolha uma forma de envio.");

  return {
    ok: true,
    email: v.email,
    envioId: v.envioId,
    endereco: {
      first_name: v.nome,
      last_name: v.sobrenome,
      address_1: `${v.rua}, ${v.numero}`,
      address_2: v.complemento ? `${v.bairro} - ${v.complemento}` : v.bairro,
      city: v.cidade,
      province: v.uf,
      postal_code: cep,
      country_code: "br",
      phone: telefone,
    },
  };
}

/** Quantidade de item no carrinho: inteiro entre 0 e 20. Inválido vira undefined. */
export function quantidadeValida(valor: string): number | undefined {
  if (!/^\d{1,2}$/.test(valor)) return undefined;
  const n = Number(valor);
  return n <= 20 ? n : undefined;
}

/** Código de cupom: letras, números, hífen e sublinhado, até 40 caracteres. */
export function cupomValido(codigo: string): string | undefined {
  const c = codigo.trim().toUpperCase();
  return /^[A-Z0-9_-]{2,40}$/.test(c) ? c : undefined;
}

/** Senha: 8 a 128 caracteres (sem regras de composição forçadas; ver NIST 800-63B). */
export function senhaValida(senha: string): boolean {
  return senha.length >= 8 && senha.length <= 128;
}

/** Caminho interno seguro para redirecionar (evita open redirect). */
export function caminhoInterno(valor: string, padrao = "/conta"): string {
  return /^\/(?!\/)[A-Za-z0-9\-._~/?=&%]*$/.test(valor) && !valor.includes("..") ? valor : padrao;
}
