import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormAuth } from "@/components/conta/FormAuth";
import { obterCliente } from "@/lib/conta";
import { criarContaAcao } from "../actions";

export const metadata: Metadata = { title: "Criar conta", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Criar() {
  if (await obterCliente()) redirect("/conta");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-titulo text-3xl font-bold">Criar conta</h1>
      <p className="mt-3 text-sm text-tinta/70">
        Coletamos só o necessário: nome, e-mail e, na compra, endereço e telefone para a entrega.
      </p>
      <div className="mt-8">
        <FormAuth modo="criar" acao={criarContaAcao} />
      </div>
      <p className="mt-6 text-sm">
        Já tem conta? <Link href="/conta/entrar" className="underline underline-offset-4 hover:text-terracota">Entrar</Link>
      </p>
    </div>
  );
}
