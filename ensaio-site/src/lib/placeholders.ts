// Dados temporários da home. Serão substituídos por conteúdo do Medusa/painel
// (fase 3). Textos de marca são lorem ipsum de propósito: a copy é da marca.

export const LOREM_CURTO = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

export type ProdutoResumo = {
  id: string;
  nome: string;
  categoria: string;
  precoCentavos: number;
  href: string;
  cor: string;
  thumbnail?: string | null;
  /** Segunda imagem mostrada ao passar o mouse (cards). Sem ela, o card só dá zoom. */
  imagemHover?: string | null;
  /** Slug do material (metadata.material no Medusa), para ligar à Materioteca. */
  material?: string;
};

// Fallback usado só quando o backend está fora do ar.
export const PRODUTOS_PLACEHOLDER: ProdutoResumo[] = [
  { id: "p1", nome: "Brinco Exemplo 01", categoria: "Brincos", precoCentavos: 18900, href: "/loja/brinco-exemplo-01", cor: "var(--color-agua)" },
  { id: "p2", nome: "Earcuff Exemplo 02", categoria: "Earcuffs", precoCentavos: 14900, href: "/loja/earcuff-exemplo-02", cor: "var(--color-gelo)" },
  { id: "p3", nome: "Colar Exemplo 03", categoria: "Colares", precoCentavos: 24900, href: "/loja/colar-exemplo-03", cor: "#d9c7b0" },
  { id: "p4", nome: "Pulseira Exemplo 04", categoria: "Pulseiras", precoCentavos: 19900, href: "/loja/pulseira-exemplo-04", cor: "var(--color-agua)" },
  { id: "p5", nome: "Brinco Exemplo 05", categoria: "Brincos", precoCentavos: 17900, href: "/loja/brinco-exemplo-05", cor: "var(--color-gelo)" },
  { id: "p6", nome: "Joia Exemplo 06", categoria: "Joias", precoCentavos: 32900, href: "/loja/joia-exemplo-06", cor: "#d9c7b0" },
];

export type Pilar = { slug: string; titulo: string; descricao: string; cor: string };

export const PILARES: Pilar[] = [
  { slug: "biomateriais", titulo: "Biomateriais", descricao: LOREM_CURTO, cor: "var(--color-agua)" },
  { slug: "materioteca", titulo: "Materioteca", descricao: LOREM_CURTO, cor: "#d9c7b0" },
  { slug: "processo", titulo: "Processo", descricao: LOREM_CURTO, cor: "var(--color-gelo)" },
  { slug: "sustentabilidade", titulo: "Sustentabilidade", descricao: LOREM_CURTO, cor: "var(--color-agua)" },
  { slug: "manifesto", titulo: "Manifesto", descricao: LOREM_CURTO, cor: "var(--color-terracota)" },
  { slug: "comunidade", titulo: "Comunidade", descricao: LOREM_CURTO, cor: "#d9c7b0" },
];

export const INSTAGRAM_PLACEHOLDER = {
  usuario: "@ensaio",
  href: "https://www.instagram.com/",
};
