import type { ReactNode } from "react";

type Props = {
  titulo: string;
  /** Exibe o aviso de rascunho (textos jurídicos ainda sem revisão). */
  rascunho?: boolean;
  atualizadoEm?: string;
  children: ReactNode;
};

/** Layout de páginas de texto (institucionais e jurídicas). */
export function PaginaTexto({ titulo, rascunho = false, atualizadoEm, children }: Props) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 md:px-8">
      <h1 className="font-titulo text-3xl font-bold">{titulo}</h1>
      {atualizadoEm ? <p className="mt-2 text-sm text-tinta/60">Atualizado em {atualizadoEm}</p> : null}
      {rascunho ? (
        <p role="note" className="mt-6 border-l-2 border-terracota bg-tinta/5 p-4 text-sm">
          <strong>Rascunho para revisão jurídica.</strong> Este texto foi preparado como ponto de partida técnico e
          ainda não foi validado por um advogado. Os trechos entre colchetes [ ] precisam ser preenchidos pela empresa.
        </p>
      ) : null}
      <div className="mt-8 space-y-5 leading-relaxed">{children}</div>
    </article>
  );
}

export function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-titulo text-lg font-bold">{titulo}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
