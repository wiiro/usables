import type { Metadata } from "next";
import { PaginaTexto } from "@/components/texto/PaginaTexto";
import { FormContato } from "./FormContato";

export const metadata: Metadata = { title: "Contato" };

// Número do WhatsApp (somente dígitos, com DDI) vem de variável de ambiente.
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO;

export default function Contato() {
  return (
    <PaginaTexto titulo="Contato">
      <p>Dúvidas sobre uma peça, um pedido ou encomendas? Escreva pelo formulário.</p>
      {WHATSAPP ? (
        <p>
          Se preferir, fale pelo{" "}
          <a href={`https://wa.me/${encodeURIComponent(WHATSAPP)}`} rel="noopener noreferrer" target="_blank" className="underline underline-offset-4 hover:text-terracota">
            WhatsApp
          </a>.
        </p>
      ) : null}
      <FormContato />
    </PaginaTexto>
  );
}
