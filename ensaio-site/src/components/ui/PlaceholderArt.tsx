/**
 * Imagem de placeholder gerada em SVG, nas cores e formas da marca (arcos,
 * pontos, esferas). Determinística: o mesmo `seed` gera sempre a mesma arte.
 * Decorativa (aria-hidden): quem usa deve dar o rótulo acessível ao contêiner.
 * Substituir por fotos reais quando existirem.
 */

const FUNDOS = ["var(--color-agua)", "var(--color-gelo)", "#d9c7b0"] as const;
const TERRACOTA = "var(--color-terracota)";
const TINTA = "var(--color-tinta)";
const OURO = "var(--color-ouro)";

function hash(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const arco = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const rad = (g: number) => (g * Math.PI) / 180;
  const [x0, y0] = [cx + r * Math.cos(rad(a0)), cy + r * Math.sin(rad(a0))];
  const [x1, y1] = [cx + r * Math.cos(rad(a1)), cy + r * Math.sin(rad(a1))];
  const grande = a1 - a0 > 180 ? 1 : 0;
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${grande} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
};

const traco = (cor: string, largura = 14, opacidade = 1) => ({
  fill: "none",
  stroke: cor,
  strokeWidth: largura,
  strokeLinecap: "round" as const,
  opacity: opacidade,
});

const COMPOSICOES: ((fundo: string) => React.ReactNode)[] = [
  // 0: esferas sobre a água (moodboard)
  () => (
    <>
      <rect y="320" width="400" height="180" fill={TINTA} opacity="0.08" />
      <circle cx="140" cy="250" r="62" fill="#fff" opacity="0.85" />
      <ellipse cx="140" cy="390" rx="62" ry="40" fill="#fff" opacity="0.35" />
      <circle cx="285" cy="285" r="30" fill="#fff" opacity="0.8" />
      <ellipse cx="285" cy="355" rx="30" ry="18" fill="#fff" opacity="0.3" />
      <line x1="0" y1="320" x2="400" y2="320" stroke={TINTA} strokeWidth="1.5" opacity="0.3" />
    </>
  ),
  // 1: arcos concêntricos (túnel)
  () => (
    <>
      {[150, 112, 76, 44].map((r, i) => (
        <circle key={r} cx="200" cy="260" r={r} fill="none" stroke={TINTA} strokeWidth="5" opacity={0.18 + i * 0.1} />
      ))}
      <path d={arco(200, 260, 150, 200, 340)} {...traco(TERRACOTA)} />
    </>
  ),
  // 2: símbolo (arco + pontos)
  () => (
    <>
      <path d={arco(200, 250, 90, 190, 350)} {...traco(TERRACOTA, 22)} />
      <path d={arco(200, 300, 70, 10, 170)} {...traco(TERRACOTA, 22)} />
      <circle cx="70" cy="230" r="14" fill={TERRACOTA} />
      <circle cx="335" cy="345" r="14" fill={TERRACOTA} />
    </>
  ),
  // 3: círculo grande com horizonte
  () => (
    <>
      <circle cx="200" cy="230" r="120" fill="#fff" opacity="0.55" />
      <line x1="0" y1="330" x2="400" y2="330" stroke={TINTA} strokeWidth="1.5" opacity="0.35" />
      <circle cx="320" cy="120" r="10" fill={OURO} />
    </>
  ),
  // 4: arcos diagonais
  () => (
    <>
      <path d={arco(60, 440, 260, 270, 360)} {...traco(TINTA, 4, 0.4)} />
      <path d={arco(60, 440, 200, 270, 360)} {...traco(TERRACOTA, 14)} />
      <path d={arco(60, 440, 140, 270, 360)} {...traco(TINTA, 4, 0.4)} />
      <circle cx="330" cy="90" r="16" fill="#fff" opacity="0.8" />
    </>
  ),
  // 5: grade de pontos
  () => (
    <>
      {Array.from({ length: 5 }).flatMap((_, y) =>
        Array.from({ length: 4 }).map((__, x) => (
          <circle
            key={`${x}-${y}`}
            cx={80 + x * 80}
            cy={110 + y * 72}
            r={(x + y) % 3 === 0 ? 12 : 6}
            fill={(x + y) % 3 === 0 ? TERRACOTA : TINTA}
            opacity={(x + y) % 3 === 0 ? 1 : 0.35}
          />
        )),
      )}
    </>
  ),
];

type Props = {
  seed: string;
  /** Força a composição (0 a 5); sem isso, vem do seed. */
  variante?: number;
  className?: string;
};

export function PlaceholderArt({ seed, variante, className = "" }: Props) {
  const h = Math.imul(hash(seed) ^ (hash(seed) >>> 15), 2246822507) >>> 0;
  const fundo = FUNDOS[(h >>> 4) % FUNDOS.length] ?? FUNDOS[0];
  const indice = variante ?? (h >>> 8);
  const composicao = COMPOSICOES[indice % COMPOSICOES.length] ?? COMPOSICOES[0]!;

  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      className={`block size-full ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="400" height="500" fill={fundo} />
      {composicao(fundo)}
    </svg>
  );
}
