import { NextResponse } from "next/server";
import { exportarDados, obterCliente } from "@/lib/conta";

// Download dos dados do titular (LGPD, acesso e portabilidade). Só para quem está logado.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cliente = await obterCliente();
  if (!cliente) return NextResponse.redirect(new URL("/conta/entrar", request.url));

  try {
    const json = await exportarDados();
    return new NextResponse(json, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": 'attachment; filename="meus-dados-ensaio.json"',
        "cache-control": "no-store",
      },
    });
  } catch (erro) {
    console.error("[conta/exportar] falhou:", erro instanceof Error ? erro.message : "erro desconhecido");
    return NextResponse.json({ erro: "Não foi possível exportar agora." }, { status: 502 });
  }
}
