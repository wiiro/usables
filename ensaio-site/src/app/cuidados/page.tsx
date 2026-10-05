import type { Metadata } from "next";
import { PaginaTexto, Secao } from "@/components/texto/PaginaTexto";
import { LOREM_CURTO } from "@/lib/placeholders";

export const metadata: Metadata = { title: "Cuidados e manutenção" };

// Estrutura do guia; o conteúdo (lorem ipsum) deve ser substituído pela marca.
const TOPICOS = ["Armazenamento", "Limpeza", "Contato com água e produtos químicos", "Manutenção e reparo"];

export default function Cuidados() {
  return (
    <PaginaTexto titulo="Cuidados e manutenção">
      <p>{LOREM_CURTO}</p>
      {TOPICOS.map((t) => (
        <Secao key={t} titulo={t}>
          <p>{LOREM_CURTO}</p>
        </Secao>
      ))}
    </PaginaTexto>
  );
}
