"use server";

import { emailValido, texto } from "@/lib/validacao";

export type EstadoContato = { ok?: boolean; erro?: string; valores?: Record<string, string> };

/**
 * Envia a mensagem de contato por e-mail (Resend, via REST, sem dependência).
 * Variáveis: RESEND_API_KEY, CONTACT_FROM (remetente verificado), CONTACT_TO.
 * Sem elas o formulário informa indisponibilidade. A mensagem NUNCA é gravada
 * em log (contém dados pessoais); só o resultado do envio.
 */
export async function enviarContato(_: EstadoContato, form: FormData): Promise<EstadoContato> {
  // Honeypot: campo invisível que humanos não preenchem.
  if (texto(form.get("site"), 100)) return { ok: true };

  const valores = {
    nome: texto(form.get("nome"), 80),
    email: texto(form.get("email"), 254).toLowerCase(),
    assunto: texto(form.get("assunto"), 120),
    mensagem: texto(form.get("mensagem"), 3000),
  };
  if (!valores.nome) return { erro: "Informe seu nome.", valores };
  if (!emailValido(valores.email)) return { erro: "Informe um e-mail válido.", valores };
  if (valores.mensagem.length < 10) return { erro: "Escreva uma mensagem com pelo menos 10 caracteres.", valores };
  if (form.get("aceite") !== "on") {
    return { erro: "Autorize o uso dos seus dados para responder esta mensagem.", valores };
  }

  const chave = process.env.RESEND_API_KEY;
  const de = process.env.CONTACT_FROM;
  const para = process.env.CONTACT_TO;
  if (!chave || !de || !para) {
    console.error("[contato] envio não configurado (RESEND_API_KEY, CONTACT_FROM, CONTACT_TO)");
    return { erro: "O formulário está indisponível no momento. Fale com a gente pelo WhatsApp.", valores };
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${chave}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: de,
        to: [para],
        reply_to: valores.email,
        subject: `[Site] ${valores.assunto || "Contato"}`.slice(0, 150),
        text: `Nome: ${valores.nome}\nE-mail: ${valores.email}\n\n${valores.mensagem}`,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) {
      console.error(`[contato] provedor de e-mail respondeu ${r.status}`);
      return { erro: "Não foi possível enviar agora. Tente novamente em instantes.", valores };
    }
  } catch (erro) {
    console.error("[contato] falha de rede ao enviar:", erro instanceof Error ? erro.name : "erro");
    return { erro: "Não foi possível enviar agora. Tente novamente em instantes.", valores };
  }
  return { ok: true };
}
