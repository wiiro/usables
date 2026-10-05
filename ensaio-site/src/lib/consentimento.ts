// Preferência de cookies (LGPD). Funções puras, seguras para uso no cliente e nos testes.
// "essencial": só cookies de sessão/sacola. "analise": também medição de uso (quando existir).

export const COOKIE_CONSENTIMENTO = "ensaio_consent";
export const EVENTO_PREFERENCIAS = "ensaio:preferencias-cookies";
export const VALIDADE_SEGUNDOS = 60 * 60 * 24 * 180;

export type Consentimento = "essencial" | "analise";

/** Lê o consentimento de uma string de cookies. Valor ausente ou inválido = undefined (ainda não escolheu). */
export function lerConsentimento(cookies: string): Consentimento | undefined {
  const par = cookies.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE_CONSENTIMENTO}=`));
  const valor = par?.slice(COOKIE_CONSENTIMENTO.length + 1);
  return valor === "essencial" || valor === "analise" ? valor : undefined;
}

/** Monta o Set-Cookie (via document.cookie) do consentimento. */
export function montarCookie(valor: Consentimento, https: boolean): string {
  return `${COOKIE_CONSENTIMENTO}=${valor}; Max-Age=${VALIDADE_SEGUNDOS}; Path=/; SameSite=Lax${https ? "; Secure" : ""}`;
}

/** Scripts de análise/marketing só podem rodar com consentimento explícito. */
export function analisePermitida(cookies: string): boolean {
  return lerConsentimento(cookies) === "analise";
}
