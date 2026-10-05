"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { EVENTO_CARRINHO } from "@/components/shop/AdicionarSacola";
import { IconeSacola } from "./Icons";

/**
 * Ícone da sacola com a quantidade de itens. Busca a contagem no cliente
 * (rota /api/carrinho/contagem) para as páginas continuarem estáticas/em cache.
 * Atualiza ao trocar de página e quando uma peça é adicionada.
 */
export function ContadorSacola({ className }: { className?: string }) {
  const [quantidade, setQuantidade] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      try {
        const r = await fetch("/api/carrinho/contagem", { cache: "no-store" });
        if (!r.ok || !ativo) return;
        const json = (await r.json()) as { quantidade?: number };
        if (ativo) setQuantidade(typeof json.quantidade === "number" ? json.quantidade : 0);
      } catch {
        // Sem rede ou backend fora do ar: o cabeçalho continua funcionando sem contador.
      }
    };
    const aoAdicionar = () => void carregar();
    void carregar();
    window.addEventListener(EVENTO_CARRINHO, aoAdicionar);
    return () => {
      ativo = false;
      window.removeEventListener(EVENTO_CARRINHO, aoAdicionar);
    };
  }, [pathname]);

  return (
    <Link
      href="/carrinho"
      aria-label={quantidade > 0 ? `Sacola, ${quantidade} ${quantidade === 1 ? "item" : "itens"}` : "Sacola"}
      className={`relative ${className ?? ""}`}
    >
      <IconeSacola />
      {quantidade > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-terracota text-[10px] font-bold text-white">
          {quantidade > 9 ? "9+" : quantidade}
        </span>
      ) : null}
    </Link>
  );
}
