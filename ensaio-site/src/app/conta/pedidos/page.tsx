import type { Metadata } from "next";
import Link from "next/link";
import { exigirCliente, listarPedidos } from "@/lib/conta";
import { formatarPreco } from "@/lib/format";

export const metadata: Metadata = { title: "Meus pedidos", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  pending: "Recebido",
  completed: "Concluído",
  canceled: "Cancelado",
  requires_action: "Requer ação",
  archived: "Arquivado",
};

export default async function Pedidos() {
  await exigirCliente();
  const pedidos = await listarPedidos();

  return (
    <div className="mx-auto max-w-[900px] px-4 py-12 md:px-8">
      <h1 className="font-titulo text-3xl font-bold">Meus pedidos</h1>
      <p className="mt-2 text-sm"><Link href="/conta" className="underline underline-offset-4 hover:text-terracota">Voltar à conta</Link></p>
      {pedidos.length === 0 ? (
        <p className="mt-10">Você ainda não tem pedidos feitos com esta conta.</p>
      ) : (
        <ul className="mt-8 divide-y divide-tinta/10">
          {pedidos.map((p) => (
            <li key={p.id} className="py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <strong>Pedido #{p.numero}</strong>
                <span className="text-sm">{new Date(p.criadoEm).toLocaleDateString("pt-BR")}</span>
              </div>
              <p className="text-sm text-tinta/70">{STATUS[p.status] ?? p.status} · {formatarPreco(p.totalCentavos)}</p>
              <p className="mt-1 text-sm">{p.itens.map((i) => `${i.quantidade}x ${i.titulo}`).join(", ")}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
