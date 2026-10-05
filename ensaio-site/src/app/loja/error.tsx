"use client";

import { useEffect } from "react";

export default function ErroLoja({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[loja]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-titulo text-2xl font-bold">Não foi possível carregar a loja</h1>
      <p className="mt-3">Tente novamente em instantes.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 border border-terracota bg-terracota px-5 py-2 text-areia hover:bg-terracota-vivo"
      >
        Tentar de novo
      </button>
    </div>
  );
}
