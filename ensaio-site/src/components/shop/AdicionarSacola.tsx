"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { adicionarAoCarrinho } from "@/app/carrinho/actions";
import type { VarianteResumo } from "@/lib/catalogo";
import { formatarPreco } from "@/lib/format";

export const EVENTO_CARRINHO = "ensaio:carrinho";

export function AdicionarSacola({ variantes }: { variantes: VarianteResumo[] }) {
  const [variante, setVariante] = useState(variantes[0]?.id ?? "");
  const [pendente, iniciar] = useTransition();
  const [estado, setEstado] = useState<"idle" | "ok" | "erro">("idle");
  const [mensagem, setMensagem] = useState("");

  if (variantes.length === 0) {
    return <p className="mt-8 text-sm">Esta peça não está disponível no momento.</p>;
  }

  const adicionar = () => {
    setEstado("idle");
    iniciar(async () => {
      const r = await adicionarAoCarrinho(variante);
      if (r.ok) {
        setEstado("ok");
        window.dispatchEvent(new Event(EVENTO_CARRINHO));
      } else {
        setEstado("erro");
        setMensagem(r.erro);
      }
    });
  };

  return (
    <div className="mt-8 space-y-3">
      {variantes.length > 1 ? (
        <div>
          <label htmlFor="variante" className="mb-1 block text-sm">Opção</label>
          <select
            id="variante"
            value={variante}
            onChange={(e) => setVariante(e.target.value)}
            className="w-full border border-tinta/30 bg-white px-3 py-2"
          >
            {variantes.map((v) => (
              <option key={v.id} value={v.id}>{`${v.titulo} - ${formatarPreco(v.precoCentavos)}`}</option>
            ))}
          </select>
        </div>
      ) : null}
      <button
        type="button"
        onClick={adicionar}
        disabled={pendente}
        className="w-full border border-terracota bg-terracota px-5 py-3 uppercase tracking-widest text-white hover:bg-terracota-vivo disabled:opacity-50"
      >
        {pendente ? "Adicionando..." : "Adicionar à sacola"}
      </button>
      <p role="status" aria-live="polite" className="min-h-6 text-sm">
        {estado === "ok" ? (
          <>Adicionado. <Link href="/carrinho" className="underline underline-offset-4 hover:text-terracota">Ver sacola</Link></>
        ) : null}
        {estado === "erro" ? mensagem : null}
      </p>
    </div>
  );
}
