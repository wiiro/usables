import "server-only";
import { cookies } from "next/headers";

// Cookies de sessão: httpOnly (inacessíveis ao JavaScript do navegador),
// SameSite=Lax e Secure em produção. Guardam apenas ids/tokens, nunca dados pessoais.
const COOKIE_CARRINHO = "ensaio_cart";
const COOKIE_TOKEN = "ensaio_auth";

const base = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
});

export async function lerCarrinhoId(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE_CARRINHO)?.value;
}
export async function gravarCarrinhoId(id: string): Promise<void> {
  (await cookies()).set(COOKIE_CARRINHO, id, { ...base(), maxAge: 60 * 60 * 24 * 30 });
}
export async function limparCarrinhoId(): Promise<void> {
  (await cookies()).delete(COOKIE_CARRINHO);
}

export async function lerToken(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE_TOKEN)?.value;
}
export async function gravarToken(token: string): Promise<void> {
  (await cookies()).set(COOKIE_TOKEN, token, { ...base(), maxAge: 60 * 60 * 24 * 7 });
}
export async function limparToken(): Promise<void> {
  (await cookies()).delete(COOKIE_TOKEN);
}
