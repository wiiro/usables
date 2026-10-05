"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adicionarItem, aplicarCupom, atualizarQuantidade, removerCupom } from "@/lib/carrinho";
import { MedusaError } from "@/lib/medusa";
import { cupomValido, quantidadeValida, texto } from "@/lib/validacao";

export type ResultadoAdicionar = { ok: true } | { ok: false; erro: string };

/** Chamada pelo botão "Adicionar à sacola" (client). Não lança: devolve o erro. */
export async function adicionarAoCarrinho(variantId: string): Promise<ResultadoAdicionar> {
  if (!/^variant_[A-Za-z0-9]+$/.test(variantId)) return { ok: false, erro: "Peça inválida." };
  try {
    await adicionarItem(variantId, 1);
  } catch (erro) {
    console.error("[carrinho] adicionar falhou:", erro instanceof MedusaError ? erro.message : "erro desconhecido");
    return { ok: false, erro: "Não foi possível adicionar a peça. Tente novamente." };
  }
  revalidatePath("/carrinho");
  return { ok: true };
}

export async function alterarQuantidade(form: FormData): Promise<void> {
  const itemId = texto(form.get("item"), 80);
  const quantidade = quantidadeValida(texto(form.get("quantidade"), 3));
  if (!/^cali_[A-Za-z0-9]+$/.test(itemId) || quantidade === undefined) redirect("/carrinho?erro=quantidade");
  try {
    await atualizarQuantidade(itemId, quantidade);
  } catch (erro) {
    console.error("[carrinho] atualizar falhou:", erro instanceof MedusaError ? erro.message : "erro desconhecido");
    redirect("/carrinho?erro=atualizar");
  }
  revalidatePath("/carrinho");
  redirect("/carrinho");
}

export async function aplicarCupomAcao(form: FormData): Promise<void> {
  const codigo = cupomValido(texto(form.get("cupom"), 60));
  if (!codigo) redirect("/carrinho?erro=cupom");
  try {
    await aplicarCupom(codigo);
  } catch {
    redirect("/carrinho?erro=cupom");
  }
  revalidatePath("/carrinho");
  redirect("/carrinho");
}

export async function removerCupomAcao(form: FormData): Promise<void> {
  const codigo = cupomValido(texto(form.get("cupom"), 60));
  if (codigo) {
    try {
      await removerCupom(codigo);
    } catch (erro) {
      console.error("[carrinho] remover cupom falhou:", erro instanceof MedusaError ? erro.message : "erro desconhecido");
    }
  }
  revalidatePath("/carrinho");
  redirect("/carrinho");
}
