"use client";

import Link from "next/link";
import { useActionState } from "react";
import { enviarContato, type EstadoContato } from "./actions";

const CAMPO = "w-full border border-tinta/30 bg-white px-3 py-2";

export function FormContato() {
  const [estado, enviar, pendente] = useActionState<EstadoContato, FormData>(enviarContato, {});
  const v = estado.valores ?? {};

  if (estado.ok) {
    return <p role="status" className="border-l-2 border-terracota pl-3">Mensagem enviada. Obrigada! Respondemos por e-mail.</p>;
  }

  return (
    <form action={enviar} className="space-y-4" noValidate>
      {estado.erro ? <p role="alert" className="border-l-2 border-terracota pl-3 text-sm">{estado.erro}</p> : null}
      {/* Honeypot anti-spam: escondido de pessoas e de leitores de tela. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="site">Não preencha</label>
        <input id="site" name="site" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nome" className="mb-1 block text-sm">Nome</label>
          <input id="nome" name="nome" autoComplete="name" defaultValue={v.nome} className={CAMPO} required />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm">E-mail</label>
          <input id="email" name="email" type="email" autoComplete="email" defaultValue={v.email} className={CAMPO} required />
        </div>
      </div>
      <div>
        <label htmlFor="assunto" className="mb-1 block text-sm">Assunto (opcional)</label>
        <input id="assunto" name="assunto" defaultValue={v.assunto} className={CAMPO} />
      </div>
      <div>
        <label htmlFor="mensagem" className="mb-1 block text-sm">Mensagem</label>
        <textarea id="mensagem" name="mensagem" rows={6} maxLength={3000} defaultValue={v.mensagem} className={CAMPO} required />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="aceite" className="mt-1" />
        <span>
          Autorizo o uso dos meus dados apenas para responder esta mensagem, conforme a{" "}
          <Link href="/politica-de-privacidade" className="underline">política de privacidade</Link>.
        </span>
      </label>
      <button
        type="submit"
        disabled={pendente}
        className="border border-terracota bg-terracota px-6 py-3 uppercase tracking-widest text-white hover:bg-terracota-vivo disabled:opacity-50"
      >
        {pendente ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}
