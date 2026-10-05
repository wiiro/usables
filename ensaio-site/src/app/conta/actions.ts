"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  adicionarEndereco,
  alternarFavorito,
  criarConta,
  entrar,
  excluirConta,
  removerEndereco,
  salvarDados,
  sair,
} from "@/lib/conta";
import { MedusaError } from "@/lib/medusa";
import {
  caminhoInterno,
  emailValido,
  normalizarCep,
  normalizarTelefone,
  senhaValida,
  texto,
  ufValida,
} from "@/lib/validacao";

export type EstadoForm = { erro?: string; email?: string; nome?: string; sobrenome?: string };

/** Registra só o tipo do erro; nunca e-mail, senha ou outros dados pessoais. */
function registrar(contexto: string, erro: unknown): void {
  console.error(`[conta] ${contexto}:`, erro instanceof MedusaError ? erro.message : "erro desconhecido");
}

export async function entrarAcao(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const email = texto(form.get("email"), 254).toLowerCase();
  const senha = typeof form.get("senha") === "string" ? (form.get("senha") as string).slice(0, 128) : "";
  const voltar = caminhoInterno(texto(form.get("voltar"), 200));
  if (!emailValido(email) || !senha) return { erro: "Informe e-mail e senha.", email };
  try {
    await entrar(email, senha);
  } catch (erro) {
    registrar("login falhou", erro);
    // Mensagem única: não revela se o e-mail existe.
    return { erro: "E-mail ou senha incorretos.", email };
  }
  redirect(voltar);
}

export async function criarContaAcao(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const email = texto(form.get("email"), 254).toLowerCase();
  const nome = texto(form.get("nome"), 60);
  const sobrenome = texto(form.get("sobrenome"), 60);
  const senha = typeof form.get("senha") === "string" ? (form.get("senha") as string).slice(0, 128) : "";
  const base = { email, nome, sobrenome };
  if (!emailValido(email)) return { ...base, erro: "Informe um e-mail válido." };
  if (!nome || !sobrenome) return { ...base, erro: "Informe nome e sobrenome." };
  if (!senhaValida(senha)) return { ...base, erro: "A senha deve ter de 8 a 128 caracteres." };
  if (form.get("aceite") !== "on") {
    return { ...base, erro: "É necessário aceitar os termos de uso e a política de privacidade." };
  }
  try {
    await criarConta({ email, senha, nome, sobrenome });
  } catch (erro) {
    registrar("cadastro falhou", erro);
    return { ...base, erro: "Não foi possível criar a conta. Se você já tem cadastro, faça login." };
  }
  redirect("/conta");
}

export async function sairAcao(): Promise<void> {
  await sair();
  redirect("/");
}

export async function salvarDadosAcao(form: FormData): Promise<void> {
  const nome = texto(form.get("nome"), 60);
  const sobrenome = texto(form.get("sobrenome"), 60);
  const telefoneBruto = texto(form.get("telefone"), 20);
  const telefone = telefoneBruto ? normalizarTelefone(telefoneBruto) : "";
  if (!nome || !sobrenome || telefone === undefined) redirect("/conta?erro=dados");
  try {
    await salvarDados({ nome, sobrenome, telefone });
  } catch (erro) {
    registrar("salvar dados falhou", erro);
    redirect("/conta?erro=dados");
  }
  revalidatePath("/conta");
  redirect("/conta?ok=dados");
}

export async function adicionarEnderecoAcao(form: FormData): Promise<void> {
  const rua = texto(form.get("rua"), 120);
  const numero = texto(form.get("numero"), 10);
  const cep = normalizarCep(texto(form.get("cep"), 12));
  const uf = texto(form.get("uf"), 2).toUpperCase();
  const cidade = texto(form.get("cidade"), 60);
  const bairro = texto(form.get("bairro"), 60);
  const nome = texto(form.get("nome"), 60);
  const sobrenome = texto(form.get("sobrenome"), 60);
  if (!rua || !numero || !cep || !cidade || !bairro || !nome || !sobrenome || !ufValida(uf)) {
    redirect("/conta?erro=endereco");
  }
  const complemento = texto(form.get("complemento"), 60);
  try {
    await adicionarEndereco({
      nome,
      sobrenome,
      rua: `${rua}, ${numero}`,
      complemento: complemento ? `${bairro} - ${complemento}` : bairro,
      cidade,
      uf,
      cep,
    });
  } catch (erro) {
    registrar("adicionar endereço falhou", erro);
    redirect("/conta?erro=endereco");
  }
  revalidatePath("/conta");
  redirect("/conta?ok=endereco");
}

export async function removerEnderecoAcao(form: FormData): Promise<void> {
  const id = texto(form.get("id"), 80);
  if (/^cuaddr_[A-Za-z0-9]+$/.test(id)) {
    try {
      await removerEndereco(id);
    } catch (erro) {
      registrar("remover endereço falhou", erro);
    }
  }
  revalidatePath("/conta");
  redirect("/conta");
}

export async function favoritoAcao(form: FormData): Promise<void> {
  const produto = texto(form.get("produto"), 80);
  const voltar = caminhoInterno(texto(form.get("voltar"), 200), "/conta/favoritos");
  if (/^prod_[A-Za-z0-9]+$/.test(produto)) {
    try {
      await alternarFavorito(produto);
    } catch (erro) {
      registrar("favorito falhou", erro);
    }
  }
  revalidatePath(voltar);
  redirect(voltar);
}

export async function excluirContaAcao(form: FormData): Promise<void> {
  if (texto(form.get("confirmacao"), 20).toUpperCase() !== "EXCLUIR") redirect("/conta?erro=exclusao");
  try {
    await excluirConta();
  } catch (erro) {
    registrar("exclusão falhou", erro);
    redirect("/conta?erro=exclusao");
  }
  redirect("/?conta=excluida");
}
