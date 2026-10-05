"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  EVENTO_PREFERENCIAS,
  lerConsentimento,
  montarCookie,
  type Consentimento,
} from "@/lib/consentimento";

// Estado externo (cookie + pedido de reabrir) lido com useSyncExternalStore:
// sem setState em efeito e sem divergência de hidratação (servidor sempre "oculto").
let reaberto = false;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());

function assinar(callback: () => void): () => void {
  ouvintes.add(callback);
  const reabrir = () => {
    reaberto = true;
    avisar();
  };
  window.addEventListener(EVENTO_PREFERENCIAS, reabrir);
  return () => {
    ouvintes.delete(callback);
    window.removeEventListener(EVENTO_PREFERENCIAS, reabrir);
  };
}
const instantaneo = (): boolean => reaberto || lerConsentimento(document.cookie) === undefined;
const instantaneoServidor = (): boolean => false;

/**
 * Aviso de cookies. Recusar é tão fácil quanto aceitar (mesmo destaque).
 * Hoje só há cookies essenciais; a escolha fica gravada para quando houver análise.
 */
export function BannerCookies() {
  const visivel = useSyncExternalStore(assinar, instantaneo, instantaneoServidor);

  const escolher = (valor: Consentimento) => {
    document.cookie = montarCookie(valor, window.location.protocol === "https:");
    reaberto = false;
    avisar();
  };

  if (!visivel) return null;

  const botao = "border border-tinta px-4 py-2 text-sm uppercase tracking-widest hover:bg-tinta hover:text-white";

  return (
    <section
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-tinta/20 bg-white p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
    >
      <div className="mx-auto flex max-w-[1100px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm">
          Usamos cookies essenciais para a sacola e o login. Cookies de análise de uso só serão ativados com a sua
          permissão. Saiba mais na <Link href="/politica-de-privacidade" className="underline">política de privacidade</Link>.
        </p>
        <div className="flex shrink-0 gap-3">
          <button type="button" className={botao} onClick={() => escolher("essencial")}>Só essenciais</button>
          <button type="button" className={botao} onClick={() => escolher("analise")}>Permitir análise</button>
        </div>
      </div>
    </section>
  );
}

/** Link do rodapé para reabrir as preferências. */
export function BotaoPreferenciasCookies({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(EVENTO_PREFERENCIAS))}>
      Preferências de cookies
    </button>
  );
}
