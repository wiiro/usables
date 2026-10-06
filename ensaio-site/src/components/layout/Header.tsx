"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ContadorSacola } from "./ContadorSacola";
import { IconeBusca, IconeConta, IconeFavorito, IconeFechar } from "./Icons";

// Links ao redor do logo: metade à esquerda, metade à direita.
const NAV_ESQUERDA = [
  { href: "/loja", rotulo: "Loja" },
  { href: "/materioteca", rotulo: "Materioteca" },
];
const NAV_DIREITA = [
  { href: "/processo", rotulo: "Processo" },
  { href: "/manifesto", rotulo: "Manifesto" },
];

const ICONE = "p-2 text-tinta transition-colors hover:text-terracota";
const LINK = "text-sm uppercase tracking-widest hover:text-terracota";

/**
 * Cabeçalho FIXO no topo (altura 5rem), logo centralizado e links ao redor.
 *
 * Busca: uma barra de largura total desce sob o cabeçalho (lupa, campo e botão
 * de fechar). Abre ao passar o mouse no logo ou na lupa da direita, ou ao
 * clicar/tocar na lupa (celular). Fecha com o X, com Esc, ao tirar o mouse ou o
 * foco do cabeçalho (se o campo estiver vazio) e ao enviar a busca.
 */
export function Header() {
  const [aberta, setAberta] = useState(false);
  const painelId = useId();
  const campo = useRef<HTMLInputElement>(null);

  const abrir = () => setAberta(true);
  const fechar = useCallback(() => {
    if (campo.current) campo.current.value = "";
    setAberta(false);
  }, []);

  useEffect(() => {
    if (!aberta) return;
    // Logo depois: no instante em que abre, a barra ainda está `invisible` e não aceitaria foco.
    const espera = setTimeout(() => campo.current?.focus(), 50);
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => {
      clearTimeout(espera);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberta, fechar]);
  /** Fecha por saída do mouse/foco, mas preserva o que a pessoa já digitou. */
  const fecharSeVazio = () => {
    if (!campo.current?.value.trim()) setAberta(false);
  };

  return (
    <header
      className="sticky top-0 z-40 h-20 border-b border-tinta/10 bg-white"
      onMouseLeave={fecharSeVazio}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) fecharSeVazio();
      }}
    >
      <div className="relative mx-auto flex h-full max-w-[1400px] items-center justify-center px-4 md:px-8">
        <nav aria-label="Principal, parte 1" className="hidden items-center gap-8 pr-10 md:flex">
          {NAV_ESQUERDA.map((i) => (
            <Link key={i.href} href={i.href} className={LINK}>{i.rotulo}</Link>
          ))}
        </nav>

        <Link
          href="/"
          aria-label="ensaio, página inicial"
          className="block px-2 py-2"
          onMouseEnter={abrir}
          onFocus={abrir}
        >
          {/* Wordmark oficial em PNG transparente (public/brand/wordmark.png). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark.png" alt="ensaio" width={468} height={106} className="h-6 w-auto sm:h-8 md:h-9" />
        </Link>

        <nav aria-label="Principal, parte 2" className="hidden items-center gap-8 pl-10 md:flex">
          {NAV_DIREITA.map((i) => (
            <Link key={i.href} href={i.href} className={LINK}>{i.rotulo}</Link>
          ))}
        </nav>

        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center md:right-8">
          <button
            type="button"
            className={ICONE}
            aria-label="Buscar"
            aria-expanded={aberta}
            aria-controls={painelId}
            onMouseEnter={abrir}
            onClick={() => (aberta ? fechar() : abrir())}
          >
            <IconeBusca />
          </button>
          <Link href="/conta" aria-label="Minha conta" className={ICONE}><IconeConta /></Link>
          <Link href="/conta/favoritos" aria-label="Lista de desejos" className={`${ICONE} hidden sm:block`}><IconeFavorito /></Link>
          <ContadorSacola className={ICONE} />
        </div>
      </div>

      {/* Barra de busca de largura total. `invisible` tira o campo da ordem de tabulação quando fechada. */}
      <div
        id={painelId}
        className={[
          "absolute inset-x-0 top-full border-b border-tinta/10 bg-white transition-[opacity,transform,visibility] duration-200",
          aberta ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
        ].join(" ")}
      >
        <form
          action="/loja"
          role="search"
          className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 md:px-8"
          onSubmit={() => setAberta(false)}
        >
          <IconeBusca className="shrink-0 text-tinta/70" />
          <input
            ref={campo}
            type="search"
            name="q"
            placeholder="Buscar peças e materiais..."
            aria-label="Buscar"
            autoComplete="off"
            maxLength={80}
            className="h-full w-full bg-transparent text-lg outline-none placeholder:text-tinta/45"
          />
          <button type="button" aria-label="Fechar busca" className={ICONE} onClick={fechar}>
            <IconeFechar />
          </button>
        </form>
      </div>
    </header>
  );
}
