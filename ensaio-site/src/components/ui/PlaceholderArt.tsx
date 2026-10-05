/**
 * Imagem de placeholder gerada em SVG, inspirada no moodboard da marca:
 * Júpiter, Lua, gravuras de Saturno, ondas concêntricas, estrela e disco.
 * Determinística: o mesmo `seed` gera sempre a mesma arte.
 * Decorativa (aria-hidden): quem usa deve dar o rótulo acessível ao contêiner.
 * Substituir por fotos reais quando existirem.
 */

const TERRACOTA = "var(--color-terracota)";

function hash(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  return (h ^ (h >>> 13)) >>> 0;
}

/** Gerador pseudoaleatório determinístico (mulberry32). */
function aleatorio(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ctx = { rnd: () => number };

// 0: Júpiter (faixas onduladas ocre, mancha rubra e luas escuras)
function Jupiter({ rnd }: Ctx) {
  const cores = ["#ecd9b8", "#c98a52", "#f3e8d2", "#a8643a", "#dcae7c", "#8c5232", "#e6c79a"];
  let y = -10;
  const faixas: React.ReactNode[] = [];
  for (let i = 0; y < 520; i++) {
    const h = 34 + rnd() * 46;
    const o = 10 + rnd() * 16;
    faixas.push(
      <path
        key={i}
        d={`M0 ${y} C 90 ${y - o}, 170 ${y + o}, 230 ${y} S 340 ${y - o}, 400 ${y + o / 2} L400 ${y + h} L0 ${y + h} Z`}
        fill={cores[i % cores.length]}
        opacity={0.88}
      />,
    );
    y += h * 0.78;
  }
  return (
    <>
      <rect width="400" height="500" fill="#d9b88a" />
      {faixas}
      <ellipse cx="250" cy="310" rx="64" ry="34" fill="#b5532d" stroke="#ecd0a8" strokeWidth="5" />
      <ellipse cx="250" cy="310" rx="30" ry="14" fill="#8a3a1c" opacity="0.7" />
      <circle cx={90 + rnd() * 60} cy={150 + rnd() * 40} r="11" fill="#141210" />
      <circle cx="70" cy="395" r="9" fill="#efe6d4" />
    </>
  );
}

// 1: Lua (superfície cinza-azulada com crateras)
function Lua({ rnd }: Ctx) {
  const crateras = Array.from({ length: 26 }, (_, i) => {
    const r = 6 + rnd() * rnd() * 46;
    return { i, x: rnd() * 400, y: rnd() * 500, r };
  });
  return (
    <>
      <rect width="400" height="500" fill="#a9b2c4" />
      <ellipse cx="120" cy="150" rx="150" ry="110" fill="#8d99b2" opacity="0.5" />
      <ellipse cx="300" cy="360" rx="130" ry="100" fill="#8793ad" opacity="0.45" />
      {crateras.map((c) => (
        <g key={c.i}>
          <circle cx={c.x} cy={c.y} r={c.r} fill="#6f7b93" opacity="0.28" />
          <circle cx={c.x} cy={c.y} r={c.r} fill="none" stroke="#dfe4ee" strokeWidth={Math.max(1.5, c.r / 9)} opacity="0.8" />
          <circle cx={c.x + c.r * 0.18} cy={c.y + c.r * 0.18} r={c.r * 0.72} fill="none" stroke="#5f6b83" strokeWidth="1.2" opacity="0.35" />
        </g>
      ))}
      <circle cx="340" cy="60" r="7" fill={TERRACOTA} />
    </>
  );
}

// 2: gravura de Saturno (papel creme, dois quadros escuros)
function Gravura() {
  return (
    <>
      <rect width="400" height="500" fill="#efe6cf" />
      <rect x="40" y="52" width="320" height="180" fill="#2f3a33" />
      <ellipse cx="200" cy="142" rx="118" ry="22" fill="none" stroke="#efe6cf" strokeWidth="6" />
      <circle cx="200" cy="142" r="44" fill="#e8dfc8" />
      {[-24, -10, 4, 18].map((dy) => (
        <line key={dy} x1="164" y1={142 + dy} x2="236" y2={142 + dy} stroke="#b9ae92" strokeWidth="3" opacity="0.7" />
      ))}
      <rect x="40" y="262" width="320" height="180" fill="#2f3a33" />
      <circle cx="200" cy="352" r="78" fill="none" stroke="#efe6cf" strokeWidth="9" />
      <circle cx="200" cy="352" r="66" fill="none" stroke="#efe6cf" strokeWidth="2" />
      <circle cx="200" cy="352" r="38" fill="#e8dfc8" />
      <line x1="60" y1="244" x2="250" y2="244" stroke="#2f3a33" strokeWidth="2" opacity="0.5" />
      <line x1="60" y1="454" x2="300" y2="454" stroke="#2f3a33" strokeWidth="2" opacity="0.5" />
      <line x1="60" y1="464" x2="200" y2="464" stroke="#2f3a33" strokeWidth="2" opacity="0.35" />
    </>
  );
}

// 3: ondas concêntricas em oito, branco sobre preto
function Ondas() {
  const aneis = (cx: number, cy: number, giro: number) =>
    [118, 92, 66, 40, 18].map((r, i) => (
      <ellipse
        key={`${cx}-${cy}-${r}`}
        cx={cx}
        cy={cy}
        rx={r * 1.15}
        ry={r}
        transform={`rotate(${giro} ${cx} ${cy})`}
        fill="none"
        stroke="#f2f2ee"
        strokeWidth={4 + (i % 2) * 5}
        opacity={0.35 + i * 0.1}
        filter="url(#pa-borra)"
      />
    ));
  return (
    <>
      <defs>
        <filter id="pa-borra" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      <rect width="400" height="500" fill="#0c0c0e" />
      {aneis(200, 170, -16)}
      {aneis(200, 335, 14)}
    </>
  );
}

// 4: estrela de oito pontas sobre fundo escuro
function Estrela({ rnd }: Ctx) {
  const pontos = (cx: number, cy: number, longo: number, curto: number) =>
    Array.from({ length: 16 }, (_, i) => {
      const ang = (i * Math.PI) / 8 - Math.PI / 2;
      const r = i % 2 === 0 ? (i % 4 === 0 ? longo : curto) : 9;
      return `${(cx + r * Math.cos(ang)).toFixed(1)},${(cy + r * Math.sin(ang)).toFixed(1)}`;
    }).join(" ");
  const poeira = Array.from({ length: 34 }, (_, i) => ({ i, x: rnd() * 400, y: rnd() * 500, r: 0.6 + rnd() * 1.4 }));
  return (
    <>
      <rect width="400" height="500" fill="#16141b" />
      {poeira.map((p) => (
        <circle key={p.i} cx={p.x} cy={p.y} r={p.r} fill="#e9e2f2" opacity={0.35 + rnd() * 0.5} />
      ))}
      <circle cx="200" cy="250" r="46" fill="#b9a8d8" opacity="0.22" />
      <polygon points={pontos(200, 250, 190, 78)} fill="#e6dcf3" opacity="0.92" />
      <circle cx="200" cy="250" r="7" fill="#fff" />
    </>
  );
}

// 5: disco de linhas concêntricas com figura humana
function Disco() {
  const linhas = Array.from({ length: 24 }, (_, i) => 8 + i * 6);
  return (
    <>
      <rect width="400" height="500" fill="#bcc1cb" />
      <circle cx="200" cy="230" r="152" fill="#f4f1e8" />
      {linhas.map((r) => (
        <circle key={r} cx="200" cy="230" r={r} fill="none" stroke="#25232a" strokeWidth="0.9" opacity="0.7" />
      ))}
      <g fill="#111">
        <circle cx="200" cy="338" r="6" />
        <path d="M193 346 h14 l4 38 h-5 l-2 -16 l-2 16 h-6 l-2 -16 l-2 16 h-5 Z" />
      </g>
    </>
  );
}

const COMPOSICOES: ((ctx: Ctx) => React.ReactNode)[] = [
  (c) => <Jupiter {...c} />,
  (c) => <Lua {...c} />,
  () => <Gravura />,
  () => <Ondas />,
  (c) => <Estrela {...c} />,
  () => <Disco />,
];

type Props = {
  seed: string;
  /** Força a composição (0 a 5); sem isso, vem do seed. */
  variante?: number;
  className?: string;
};

export function PlaceholderArt({ seed, variante, className = "" }: Props) {
  const h = hash(seed);
  const indice = variante ?? h >>> 8;
  const composicao = COMPOSICOES[indice % COMPOSICOES.length] ?? COMPOSICOES[0]!;

  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      className={`block size-full ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {composicao({ rnd: aleatorio(h) })}
    </svg>
  );
}
