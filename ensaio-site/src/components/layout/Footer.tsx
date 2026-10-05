import Link from "next/link";
import { INSTAGRAM_PLACEHOLDER } from "@/lib/placeholders";
import { IconeInstagram, IconeWhatsapp } from "./Icons";

const INSTITUCIONAL = [
  { href: "/manifesto", rotulo: "Manifesto" },
  { href: "/cuidados", rotulo: "Cuidados e manutenção" },
  { href: "/contato", rotulo: "Contato" },
];
const POLITICAS = [
  { href: "/politica-de-privacidade", rotulo: "Privacidade" },
  { href: "/termos-de-uso", rotulo: "Termos de uso" },
  { href: "/trocas-e-devolucoes", rotulo: "Trocas e devoluções" },
  { href: "/envio", rotulo: "Envio" },
];

// Número do WhatsApp vem de variável de ambiente; sem ela o botão não aparece.
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO;

export function Footer() {
  return (
    <footer className="bg-tinta text-areia">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-14 md:grid-cols-4 md:px-8">
        <div>
          <p className="font-titulo text-2xl font-bold lowercase text-areia">ensaio</p>
          <p className="mt-3 text-sm text-areia/70">Lorem ipsum dolor sit amet.</p>
        </div>
        <FooterLista titulo="Ensaio" itens={INSTITUCIONAL} />
        <FooterLista titulo="Políticas" itens={POLITICAS} />
        <div>
          <h2 className="font-titulo text-sm uppercase tracking-widest">Siga</h2>
          <a
            href={INSTAGRAM_PLACEHOLDER.href}
            className="mt-3 inline-flex items-center gap-2 text-sm hover:text-agua"
            rel="noopener noreferrer"
            target="_blank"
          >
            <IconeInstagram /> {INSTAGRAM_PLACEHOLDER.usuario}
          </a>
        </div>
      </div>
      <div className="border-t border-areia/15 px-4 py-5 text-center text-xs text-areia/60">
        © {new Date().getFullYear()} ensaio
      </div>
      {WHATSAPP ? (
        <a
          href={`https://wa.me/${encodeURIComponent(WHATSAPP)}`}
          aria-label="Falar pelo WhatsApp"
          className="fixed bottom-5 right-5 z-30 rounded-full bg-terracota p-3 text-areia shadow-lg hover:bg-terracota-vivo"
          rel="noopener noreferrer"
          target="_blank"
        >
          <IconeWhatsapp className="size-6" />
        </a>
      ) : null}
    </footer>
  );
}

function FooterLista({ titulo, itens }: { titulo: string; itens: { href: string; rotulo: string }[] }) {
  return (
    <nav aria-label={titulo}>
      <h2 className="font-titulo text-sm uppercase tracking-widest">{titulo}</h2>
      <ul className="mt-3 space-y-2 text-sm text-areia/80">
        {itens.map((i) => (
          <li key={i.href}><Link href={i.href} className="hover:text-agua">{i.rotulo}</Link></li>
        ))}
      </ul>
    </nav>
  );
}
