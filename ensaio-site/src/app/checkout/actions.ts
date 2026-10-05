"use server";

import { redirect } from "next/navigation";
import { finalizarPedido } from "@/lib/carrinho";
import { MedusaError } from "@/lib/medusa";
import { validarCheckout } from "@/lib/validacao";

export type EstadoCheckout = { erro?: string; valores?: Record<string, string> };

export async function finalizarCompra(_anterior: EstadoCheckout, form: FormData): Promise<EstadoCheckout> {
  const validado = validarCheckout(form);
  if (!validado.ok) return { erro: validado.erro, valores: validado.valores };

  let numero: number;
  try {
    numero = await finalizarPedido({ email: validado.email, endereco: validado.endereco, envioId: validado.envioId });
  } catch (erro) {
    // Nunca registrar dados pessoais: só o tipo do erro e o status HTTP.
    console.error("[checkout] falha ao finalizar:", erro instanceof MedusaError ? `${erro.message}` : "erro desconhecido");
    return {
      erro: "Não foi possível concluir o pedido agora. Confira os dados e tente novamente.",
      valores: Object.fromEntries(
        [...form.entries()].filter(([, v]) => typeof v === "string").map(([k, v]) => [k, String(v)]),
      ),
    };
  }
  redirect(`/pedido/confirmado?n=${numero}`);
}
