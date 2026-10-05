"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { EstadoForm } from "@/app/conta/actions";

type Props = {
  modo: "entrar" | "criar";
  acao: (estado: EstadoForm, form: FormData) => Promise<EstadoForm>;
  voltar?: string;
};

const CAMPO = "w-full border border-tinta/30 bg-white px-3 py-2";

export function FormAuth({ modo, acao, voltar }: Props) {
  const [estado, enviar, pendente] = useActionState<EstadoForm, FormData>(acao, {});
  const criar = modo === "criar";

  return (
    <form action={enviar} className="space-y-4" noValidate>
      {estado.erro ? <p role="alert" className="border-l-2 border-terracota pl-3 text-sm">{estado.erro}</p> : null}
      {voltar ? <input type="hidden" name="voltar" value={voltar} /> : null}
      {criar ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nome" className="mb-1 block text-sm">Nome</label>
            <input id="nome" name="nome" autoComplete="given-name" defaultValue={estado.nome} className={CAMPO} required />
          </div>
          <div>
            <label htmlFor="sobrenome" className="mb-1 block text-sm">Sobrenome</label>
            <input id="sobrenome" name="sobrenome" autoComplete="family-name" defaultValue={estado.sobrenome} className={CAMPO} required />
          </div>
        </div>
      ) : null}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" defaultValue={estado.email} className={CAMPO} required />
      </div>
      <div>
        <label htmlFor="senha" className="mb-1 block text-sm">Senha{criar ? " (8 a 128 caracteres)" : ""}</label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete={criar ? "new-password" : "current-password"}
          minLength={criar ? 8 : undefined}
          maxLength={128}
          className={CAMPO}
          required
        />
      </div>
      {criar ? (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="aceite" className="mt-1" />
          <span>
            Li e aceito os <Link href="/termos-de-uso" className="underline">termos de uso</Link> e a{" "}
            <Link href="/politica-de-privacidade" className="underline">política de privacidade</Link>.
          </span>
        </label>
      ) : null}
      <button
        type="submit"
        disabled={pendente}
        className="w-full border border-terracota bg-terracota px-5 py-3 uppercase tracking-widest text-white hover:bg-terracota-vivo disabled:opacity-50"
      >
        {pendente ? "Aguarde..." : criar ? "Criar conta" : "Entrar"}
      </button>
    </form>
  );
}
