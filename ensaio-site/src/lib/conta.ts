import "server-only";
import { redirect } from "next/navigation";
import { paraCentavos } from "./carrinho";
import { MedusaError, medusaFetch } from "./medusa";
import { gravarToken, lerCarrinhoId, lerToken, limparCarrinhoId, limparToken } from "./sessao";

export type EnderecoSalvo = {
  id: string;
  nome: string;
  rua: string;
  complemento: string;
  cidade: string;
  uf: string;
  cep: string;
};

export type Cliente = {
  id: string;
  email: string;
  nome: string;
  sobrenome: string;
  telefone: string;
  favoritos: string[];
  enderecos: EnderecoSalvo[];
};

export type Pedido = {
  id: string;
  numero: number;
  status: string;
  criadoEm: string;
  totalCentavos: number;
  itens: { titulo: string; quantidade: number }[];
};

type ClienteApi = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  metadata: Record<string, unknown> | null;
  addresses?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    address_1: string | null;
    address_2: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
  }[];
};

function mapearCliente(c: ClienteApi): Cliente {
  const bruto = c.metadata?.wishlist;
  return {
    id: c.id,
    email: c.email,
    nome: c.first_name ?? "",
    sobrenome: c.last_name ?? "",
    telefone: c.phone ?? "",
    favoritos: Array.isArray(bruto) ? bruto.filter((x): x is string => typeof x === "string") : [],
    enderecos: (c.addresses ?? []).map((a) => ({
      id: a.id,
      nome: `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim(),
      rua: a.address_1 ?? "",
      complemento: a.address_2 ?? "",
      cidade: a.city ?? "",
      uf: a.province ?? "",
      cep: a.postal_code ?? "",
    })),
  };
}

// ---- Sessão ----

/** Login. Em seguida, associa o carrinho de visitante (se houver) ao cliente. */
export async function entrar(email: string, senha: string): Promise<void> {
  const { token } = await medusaFetch<{ token: string }>("/auth/customer/emailpass", {
    metodo: "POST",
    corpo: { email, password: senha },
  });
  await gravarToken(token);
  const carrinhoId = await lerCarrinhoId();
  if (carrinhoId) {
    try {
      await medusaFetch(`/store/carts/${carrinhoId}/customer`, { metodo: "POST", corpo: {}, token });
    } catch (erro) {
      // Carrinho expirado/finalizado não impede o login.
      console.error("[conta] não foi possível associar o carrinho:", erro instanceof MedusaError ? erro.message : "erro");
      await limparCarrinhoId();
    }
  }
}

/** Cadastro: credencial, perfil e login (nesta ordem; o token só ganha o vínculo após o perfil existir). */
export async function criarConta(d: { email: string; senha: string; nome: string; sobrenome: string }): Promise<void> {
  const { token } = await medusaFetch<{ token: string }>("/auth/customer/emailpass/register", {
    metodo: "POST",
    corpo: { email: d.email, password: d.senha },
  });
  await medusaFetch("/store/customers", {
    metodo: "POST",
    corpo: { email: d.email, first_name: d.nome, last_name: d.sobrenome },
    token,
  });
  await entrar(d.email, d.senha);
}

export async function sair(): Promise<void> {
  await limparToken();
}

/** Cliente logado, ou undefined (sem token ou token expirado). */
export async function obterCliente(): Promise<Cliente | undefined> {
  const token = await lerToken();
  if (!token) return undefined;
  try {
    const { customer } = await medusaFetch<{ customer: ClienteApi }>("/store/customers/me", {
      params: { fields: "id,email,first_name,last_name,phone,metadata,*addresses" },
      token,
    });
    return mapearCliente(customer);
  } catch (erro) {
    if (erro instanceof MedusaError && (erro.status === 401 || erro.status === 404)) {
      await limparToken();
      return undefined;
    }
    throw erro;
  }
}

/** Para páginas que exigem login: redireciona para a entrada. */
export async function exigirCliente(): Promise<Cliente> {
  const cliente = await obterCliente();
  if (!cliente) redirect("/conta/entrar");
  return cliente;
}

async function tokenObrigatorio(): Promise<string> {
  const token = await lerToken();
  if (!token) redirect("/conta/entrar");
  return token;
}

// ---- Dados ----

export async function salvarDados(d: { nome: string; sobrenome: string; telefone: string }): Promise<void> {
  const token = await tokenObrigatorio();
  await medusaFetch("/store/customers/me", {
    metodo: "POST",
    corpo: { first_name: d.nome, last_name: d.sobrenome, phone: d.telefone },
    token,
  });
}

export async function adicionarEndereco(e: {
  nome: string;
  sobrenome: string;
  rua: string;
  complemento: string;
  cidade: string;
  uf: string;
  cep: string;
}): Promise<void> {
  const token = await tokenObrigatorio();
  await medusaFetch("/store/customers/me/addresses", {
    metodo: "POST",
    corpo: {
      first_name: e.nome,
      last_name: e.sobrenome,
      address_1: e.rua,
      address_2: e.complemento,
      city: e.cidade,
      province: e.uf,
      postal_code: e.cep,
      country_code: "br",
    },
    token,
  });
}

export async function removerEndereco(id: string): Promise<void> {
  const token = await tokenObrigatorio();
  await medusaFetch(`/store/customers/me/addresses/${id}`, { metodo: "DELETE", token });
}

export async function alternarFavorito(produtoId: string): Promise<void> {
  const token = await tokenObrigatorio();
  const cliente = await obterCliente();
  if (!cliente) redirect("/conta/entrar");
  const atual = new Set(cliente.favoritos);
  if (atual.has(produtoId)) atual.delete(produtoId);
  else atual.add(produtoId);
  await medusaFetch("/store/customers/me", {
    metodo: "POST",
    corpo: { metadata: { wishlist: [...atual].slice(0, 200) } },
    token,
  });
}

export async function listarPedidos(): Promise<Pedido[]> {
  const token = await tokenObrigatorio();
  const { orders } = await medusaFetch<{
    orders: {
      id: string;
      display_id: number;
      status: string;
      created_at: string;
      total: number;
      items?: { title: string; quantity: number }[];
    }[];
  }>("/store/orders", {
    params: { fields: "id,display_id,status,created_at,total,*items", order: "-created_at", limit: 50 },
    token,
  });
  return orders.map((o) => ({
    id: o.id,
    numero: o.display_id,
    status: o.status,
    criadoEm: o.created_at,
    totalCentavos: paraCentavos(o.total),
    itens: (o.items ?? []).map((i) => ({ titulo: i.title, quantidade: i.quantity })),
  }));
}

// ---- LGPD ----

/** JSON com todos os dados do titular (acesso e portabilidade). */
export async function exportarDados(): Promise<string> {
  const token = await tokenObrigatorio();
  const dados = await medusaFetch<unknown>("/store/customers/me/exportar", { token });
  return JSON.stringify(dados, null, 2);
}

/** Anonimiza o cadastro e encerra a sessão. Irreversível. */
export async function excluirConta(): Promise<void> {
  const token = await tokenObrigatorio();
  await medusaFetch("/store/customers/me/excluir", { metodo: "POST", corpo: { confirmar: true }, token });
  await limparToken();
  await limparCarrinhoId();
}
