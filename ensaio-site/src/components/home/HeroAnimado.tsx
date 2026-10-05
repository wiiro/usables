/**
 * "Vídeo simulado" da abertura, inspirado no moodboard: ondas concêntricas
 * respirando, estrela de oito pontas cintilando, Lua e Júpiter à deriva sobre
 * fundo escuro. Animação em loop (SVG + CSS), não um arquivo de vídeo. Quando
 * houver o vídeo real, passe `videoSrc` ao <Hero /> e este componente deixa de
 * ser usado. Animações respeitam prefers-reduced-motion (globals.css).
 */

// Posições fixas (determinísticas) para não variar entre servidor e cliente.
const POEIRA = Array.from({ length: 46 }, (_, i) => ({
  i,
  x: (i * 347) % 1600,
  y: (i * 211 + 90) % 900,
  r: 0.8 + ((i * 7) % 5) * 0.35,
  atraso: -((i * 13) % 9),
}));

function aneis(cx: number, cy: number, giro: number, escala = 1) {
  return [300, 235, 170, 105, 48].map((r, i) => (
    <ellipse
      key={r}
      cx={cx}
      cy={cy}
      rx={r * 1.15 * escala}
      ry={r * escala}
      transform={`rotate(${giro} ${cx} ${cy})`}
      fill="none"
      stroke="#f2f2ee"
      strokeWidth={5 + (i % 2) * 7}
      opacity={0.3 + i * 0.09}
      filter="url(#ens-borra)"
    />
  ));
}

const estrela = (cx: number, cy: number, longo: number, curto: number) =>
  Array.from({ length: 16 }, (_, i) => {
    const ang = (i * Math.PI) / 8 - Math.PI / 2;
    const r = i % 2 === 0 ? (i % 4 === 0 ? longo : curto) : 14;
    return `${(cx + r * Math.cos(ang)).toFixed(1)},${(cy + r * Math.sin(ang)).toFixed(1)}`;
  }).join(" ");

export function HeroAnimado() {
  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id="ens-borra" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <filter id="ens-brilho-estrela" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <radialGradient id="ens-lua" cx="0.35" cy="0.35" r="0.85">
          <stop offset="0" stopColor="#d6dbe6" />
          <stop offset="1" stopColor="#7f8aa2" />
        </radialGradient>
        <linearGradient id="ens-jupiter" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9d3ae" />
          <stop offset="0.22" stopColor="#c58650" />
          <stop offset="0.4" stopColor="#f1e4cb" />
          <stop offset="0.6" stopColor="#a8643a" />
          <stop offset="0.8" stopColor="#dcae7c" />
          <stop offset="1" stopColor="#8c5232" />
        </linearGradient>
        <radialGradient id="ens-fundo" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0" stopColor="#1b1a22" />
          <stop offset="1" stopColor="#09090b" />
        </radialGradient>
      </defs>

      <rect width="1600" height="900" fill="url(#ens-fundo)" />

      {POEIRA.map((p) => (
        <circle
          key={p.i}
          className={p.i % 3 === 0 ? "ens-tremula" : undefined}
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill="#ece6f4"
          opacity="0.55"
          style={p.i % 3 === 0 ? { animationDelay: `${p.atraso}s` } : undefined}
        />
      ))}

      {/* Ondas concêntricas em oito, respirando em sentidos opostos */}
      <g className="ens-respira" style={{ animationDuration: "11s" }}>{aneis(560, 330, -16)}</g>
      <g className="ens-respira" style={{ animationDuration: "14s", animationDelay: "-5s" }}>{aneis(1010, 640, 14, 0.9)}</g>

      {/* Estrela de oito pontas */}
      <g className="ens-tremula" style={{ animationDuration: "5s" }}>
        <circle cx="300" cy="690" r="64" fill="#b9a8d8" opacity="0.3" filter="url(#ens-brilho-estrela)" />
        <polygon points={estrela(300, 690, 190, 78)} fill="#e6dcf3" opacity="0.95" />
      </g>

      {/* Lua */}
      <g className="ens-flutua" style={{ animationDuration: "13s" }}>
        <circle cx="1290" cy="230" r="118" fill="url(#ens-lua)" />
        {[[1250, 190, 26], [1330, 270, 19], [1235, 285, 14], [1345, 180, 11]].map(([x, y, r]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r={r} fill="#6f7b93" opacity="0.35" />
            <circle cx={x} cy={y} r={r} fill="none" stroke="#e8ecf4" strokeWidth="2.5" opacity="0.75" />
          </g>
        ))}
      </g>

      {/* Júpiter e sua lua escura */}
      <g className="ens-flutua" style={{ animationDuration: "10s", animationDelay: "-3s" }}>
        <circle cx="830" cy="150" r="64" fill="url(#ens-jupiter)" />
        <circle cx="900" cy="118" r="8" fill="#0a0a0b" />
      </g>

      <circle className="ens-pulsa" cx="1470" cy="560" r="14" fill="var(--color-terracota)" />
    </svg>
  );
}
