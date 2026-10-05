"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { IconeBusca, IconeConta, IconeFavorito, IconeSacola } from "./Icons";

const NAV = [
  { href: "/loja", rotulo: "Loja" },
  { href: "/materioteca", rotulo: "Materioteca" },
  { href: "/processo", rotulo: "Processo" },
];

const ICONE = "p-2 text-tinta transition-colors hover:text-terracota";

/**
 * Cabeçalho NÃO fixo, com logo centralizado.
 * Busca (desktop): aparece ao passar o mouse ou focar o logo (group-hover /
 * group-focus-within), então também funciona por teclado.
 * Busca (mobile/touch): a lupa abre e fecha o campo.
 */
export function Header() {
  const [buscaMobile, setBuscaMobile] = useState(false);
  const painelId = useId();

  return (
    <header className="relative z-40 border-b border-tinta/10 bg-areia">
      <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center px-4 py-5 md:px-8">
        <nav aria-label="Principal" className="hidden gap-6 text-sm uppercase tracking-widest md:flex">
          {NAV.map((i) => (
            <Link key={i.href} href={i.href} className="hover:text-terracota">
              {i.rotulo}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className={`${ICONE} justify-self-start md:hidden`}
          aria-expanded={buscaMobile}
          aria-controls={painelId}
          aria-label="Buscar"
          onClick={() => setBuscaMobile((v) => !v)}
        >
          <IconeBusca />
        </button>

        <div className="group relative justify-self-center">
          <Link
            href="/"
            aria-label="ensaio, página inicial"
            className="flex items-center gap-2 px-6 py-2 font-titulo text-3xl font-bold lowercase tracking-tight text-terracota"
          >
            {/* Wordmark provisório em texto; trocar pelo logo oficial em /public/brand. */}
            ensaio
          </Link>
          <div
            id={painelId}
            className={[
              "absolute left-1/2 top-full w-[min(90vw,28rem)] -translate-x-1/2 pt-2 transition-opacity duration-200",
              "md:pointer-events-none md:opacity-0 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100 md:group-hover:pointer-events-auto md:group-hover:opacity-100",
              buscaMobile ? "opacity-100" : "pointer-events-none opacity-0",
            ].join(" ")}
          >
            <form action="/loja" role="search" className="flex items-center gap-2 border border-tinta/30 bg-gelo px-3 py-2">
              <IconeBusca className="shrink-0 text-tinta/60" />
              <input
                type="search"
                name="q"
                placeholder="Buscar peças e materiais"
                aria-label="Buscar"
                className="w-full bg-transparent text-sm outline-none placeholder:text-tinta/50"
              />
            </form>
          </div>
        </div>

        <div className="flex items-center justify-self-end">
          <Link href="/conta" aria-label="Minha conta" className={ICONE}><IconeConta /></Link>
          <Link href="/conta/favoritos" aria-label="Lista de desejos" className={`${ICONE} hidden sm:block`}><IconeFavorito /></Link>
          <Link href="/carrinho" aria-label="Sacola" className={ICONE}><IconeSacola /></Link>
        </div>
      </div>
    </header>
  );
}
