import type { Metadata } from "next";
import { PaginaTexto } from "@/components/texto/PaginaTexto";

export const metadata: Metadata = { title: "Manifesto" };

// Texto fornecido pela marca (Notion "Fundamentos da marca > Manifesto"). Não editar sem aprovação.
export default function Manifesto() {
  return (
    <PaginaTexto titulo="Manifesto">
      <p>A Ensaio é um estúdio de design que existe para explorar as possibilidades da matéria.</p>
      <p>
        Aqui, o design expande seu campo de atuação: do desenvolvimento à transformação e aplicação de materiais
        autorais, cuidadosamente formulados com respeito à natureza e aos seus ciclos.
      </p>
      <p>
        Pesquisa e prática caminham juntas. Cada experimento, cada material e cada objeto fazem parte de um mesmo
        processo de investigação, que caminha entre o fazer manual, a ciência, a observação da natureza e a
        experimentação constante.
      </p>
      <p>
        Tudo é feito por mim, Brunna. Assumo a autoria de todas as etapas - da formulação dos biomateriais ao
        desenvolvimento dos produtos - experimentando, errando, aprendendo e refinando cada processo até que ele
        chegue às suas mãos.
      </p>
      <p>Espero que gostem.</p>
      <p>Brunna.</p>
    </PaginaTexto>
  );
}
