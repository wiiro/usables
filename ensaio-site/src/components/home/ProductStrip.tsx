"use client";

import Link from "next/link";
import { useRef } from "react";
import { IconeSeta } from "@/components/layout/Icons";
import { ProductCard } from "@/components/shop/ProductCard";
import type { ProdutoResumo } from "@/lib/placeholders";

export function ProductStrip({ produtos }: { produtos: ProdutoResumo[] }) {
  const trilho = useRef<HTMLUListElement>(null);

  const rolar = (direcao: 1 | -1) => {
    const el = trilho.current;
    if (!el) return;
    el.scrollBy({ left: direcao * el.clientWidth * 0.8, behavior: "smooth" });
  };

  if (produtos.length === 0) return null;

  return (
    <section aria-label="Novidades" className="relative mx-auto max-w-[1400px] px-4 py-14 md:px-8">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-titulo text-xl font-bold uppercase tracking-widest">Peças</h2>
        <Link href="/loja" className="text-sm underline underline-offset-4 hover:text-terracota">Ver tudo</Link>
      </div>
      <div className="relative">
        <ul ref={trilho} className="sem-barra flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth">
          {produtos.map((p) => (
            <li key={p.id} className="w-[70%] shrink-0 snap-start sm:w-[40%] md:w-[28%] lg:w-[23%]">
              <ProductCard produto={p} />
            </li>
          ))}
        </ul>
        <SetaBotao rotulo="Anterior" esquerda onClick={() => rolar(-1)} />
        <SetaBotao rotulo="Próximo" onClick={() => rolar(1)} />
      </div>
    </section>
  );
}

function SetaBotao({ rotulo, esquerda, onClick }: { rotulo: string; esquerda?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      className={`absolute top-[38%] hidden size-10 items-center justify-center rounded-full bg-tinta/80 text-areia hover:bg-terracota md:flex ${esquerda ? "-left-3" : "-right-3"}`}
    >
      <IconeSeta esquerda={esquerda} />
    </button>
  );
}
