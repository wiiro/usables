import { NextResponse } from "next/server";
import { obterCarrinho } from "@/lib/carrinho";

// Quantidade de itens da sacola para o ícone do cabeçalho. Nunca em cache:
// depende do cookie do visitante. Falha do backend não quebra o cabeçalho.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const carrinho = await obterCarrinho();
    return NextResponse.json({ quantidade: carrinho?.quantidadeTotal ?? 0 }, { headers: { "cache-control": "no-store" } });
  } catch (erro) {
    console.error("[api/carrinho/contagem]", erro instanceof Error ? erro.message : "erro desconhecido");
    return NextResponse.json({ quantidade: 0 }, { headers: { "cache-control": "no-store" } });
  }
}
