/**
 * "Vídeo simulado" da abertura: cena animada em SVG/CSS, em loop, nas cores da
 * marca (esferas sobre a água, arco do símbolo girando). É um placeholder:
 * quando houver o vídeo real, passe `videoSrc` ao <Hero /> e este componente
 * deixa de ser usado. Animações respeitam prefers-reduced-motion (globals.css).
 */
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
        <linearGradient id="ens-ceu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-agua)" />
          <stop offset="1" stopColor="var(--color-gelo)" />
        </linearGradient>
        <linearGradient id="ens-agua" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-agua)" />
          <stop offset="1" stopColor="#a9c6c2" />
        </linearGradient>
        <filter id="ens-borra" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <rect width="1600" height="560" fill="url(#ens-ceu)" />
      <rect y="560" width="1600" height="340" fill="url(#ens-agua)" />
      <line x1="0" y1="560" x2="1600" y2="560" stroke="var(--color-tinta)" strokeOpacity="0.25" />

      {/* Esferas e seus reflexos */}
      <g className="ens-flutua" style={{ animationDuration: "9s" }}>
        <circle cx="520" cy="470" r="86" fill="#fff" opacity="0.92" />
      </g>
      <ellipse className="ens-reflexo" cx="520" cy="660" rx="86" ry="52" fill="#fff" opacity="0.35" filter="url(#ens-borra)" />

      <g className="ens-flutua" style={{ animationDuration: "12s", animationDelay: "-4s" }}>
        <circle cx="940" cy="505" r="46" fill="#fff" opacity="0.9" />
      </g>
      <ellipse className="ens-reflexo" cx="940" cy="615" rx="46" ry="28" fill="#fff" opacity="0.3" filter="url(#ens-borra)" />

      <g className="ens-flutua" style={{ animationDuration: "7s", animationDelay: "-2s" }}>
        <circle cx="1230" cy="530" r="26" fill="#fff" opacity="0.88" />
      </g>

      {/* Arco do símbolo da marca girando devagar */}
      <g className="ens-gira" style={{ transformOrigin: "800px 330px" }}>
        <path
          d="M640 330 A160 160 0 1 1 800 490"
          fill="none"
          stroke="var(--color-terracota)"
          strokeWidth="26"
          strokeLinecap="round"
          opacity="0.9"
        />
      </g>
      <circle className="ens-pulsa" cx="1320" cy="190" r="16" fill="var(--color-terracota)" />
      <circle className="ens-pulsa" cx="250" cy="250" r="12" fill="var(--color-terracota)" style={{ animationDelay: "-3s" }} />

      {/* Brilhos na água */}
      {[620, 700, 780, 860].map((y, i) => (
        <line
          key={y}
          className="ens-brilho"
          x1={200 + i * 260}
          y1={y}
          x2={360 + i * 260}
          y2={y}
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.5"
          style={{ animationDelay: `${-i * 2.2}s` }}
        />
      ))}
    </svg>
  );
}
