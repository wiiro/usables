import type { Metadata } from "next";
import { Space_Mono, Ubuntu_Mono } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BannerCookies } from "@/components/privacidade/BannerCookies";
import { DESCRICAO_SITE, NOME_SITE, SITE_URL } from "@/lib/site";
import "./globals.css";

// Substitutas livres das fontes da marca (Geometry Soft Pro / Telegrama)
// até a licença web ser confirmada. Ver docs/DESIGN.md.
const corpo = Ubuntu_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-ubuntu-mono",
  display: "swap",
});
const titulo = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: NOME_SITE, template: `%s | ${NOME_SITE}` },
  description: DESCRICAO_SITE,
  openGraph: { type: "website", siteName: NOME_SITE, locale: "pt_BR", description: DESCRICAO_SITE },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${corpo.variable} ${titulo.variable}`}>
      <body>
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-2"
        >
          Ir para o conteúdo
        </a>
        <Header />
        <main id="conteudo">{children}</main>
        <Footer />
        <BannerCookies />
      </body>
    </html>
  );
}
