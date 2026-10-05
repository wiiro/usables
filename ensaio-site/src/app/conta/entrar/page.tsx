import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormAuth } from "@/components/conta/FormAuth";
import { obterCliente } from "@/lib/conta";
import { caminhoInterno } from "@/lib/validacao";
import { entrarAcao } from "../actions";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ voltar?: string }> };

export default async function Entrar({ searchParams }: Props) {
  const { voltar } = await searchParams;
  if (await obterCliente()) redirect("/conta");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-titulo text-3xl font-bold">Entrar</h1>
      <div className="mt-8">
        <FormAuth modo="entrar" acao={entrarAcao} voltar={voltar ? caminhoInterno(voltar) : undefined} />
      </div>
      <p className="mt-6 text-sm">
        Ainda não tem conta? <Link href="/conta/criar" className="underline underline-offset-4 hover:text-terracota">Criar conta</Link>
      </p>
      <p className="mt-2 text-sm text-tinta/60">
        Esqueceu a senha? A redefinição por e-mail ainda não está disponível; <Link href="/contato" className="underline">fale com a gente</Link>.
      </p>
    </div>
  );
}
