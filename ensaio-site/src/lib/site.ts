/** URL pública do site (sem barra final). Defina NEXT_PUBLIC_SITE_URL em produção. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
export const NOME_SITE = "ensaio";
export const DESCRICAO_SITE = "Estúdio de design autoral de biomateriais: joias feitas sob demanda.";
