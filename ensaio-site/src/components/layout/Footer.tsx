import Link from "next/link";
import { BotaoPreferenciasCookies } from "@/components/privacidade/BannerCookies";
import { obterConteudoSite, type ConteudoSite } from "@/lib/conteudo";
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

export async function Footer() {
  const conteudo = await obterConteudoSite().catch(() => ({}) as ConteudoSite);
  const usuario = conteudo.instagramUsuario ?? INSTAGRAM_PLACEHOLDER.usuario;
  const perfil = conteudo.instagramUrl ?? INSTAGRAM_PLACEHOLDER.href;
  return (
    <footer className="border-t border-tinta/10 bg-white text-tinta">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-14 md:grid-cols-4 md:px-8">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark.png" alt="ensaio" width={468} height={106} className="h-7 w-auto" />
          <p className="mt-3 text-sm text-tinta/70">Lorem ipsum dolor sit amet.</p>
        </div>
        <FooterLista titulo="Ensaio" itens={INSTITUCIONAL} />
        <FooterLista titulo="Políticas" itens={POLITICAS} />
        <div>
          <h2 className="font-titulo text-sm uppercase tracking-widest">Siga</h2>
          <a
            href={perfil}
            className="mt-3 inline-flex items-center gap-2 text-sm hover:text-terracota"
            rel="noopener noreferrer"
            target="_blank"
          >
            <IconeInstagram /> {usuario}
          </a>
        </div>
      </div>
      <div className="border-t border-tinta/10 px-4 py-5 text-center text-xs text-tinta/60">
        © {new Date().getFullYear()} ensaio ·{" "}
        <BotaoPreferenciasCookies className="underline underline-offset-4 hover:text-terracota" />
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
      <ul className="mt-3 space-y-2 text-sm text-tinta/80">
        {itens.map((i) => (
          <li key={i.href}><Link href={i.href} className="hover:text-terracota">{i.rotulo}</Link></li>
        ))}
      </ul>
    </nav>
  );
}
