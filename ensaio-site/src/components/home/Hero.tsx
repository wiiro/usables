import { HeroAnimado } from "./HeroAnimado";

type HeroProps = {
  /** Vídeo mudo em loop (mp4/webm). Sem ele, usa a animação simulada. */
  videoSrc?: string;
  posterSrc?: string;
  legenda?: string;
};

/**
 * Abertura em tela cheia. Vídeo decorativo: mudo, sem controles, e com
 * fallback estático (poster ou cor) para conexões lentas e prefers-reduced-motion.
 * Sem `videoSrc`, mostra <HeroAnimado /> (vídeo simulado em SVG/CSS).
 */
export function Hero({ videoSrc, posterSrc, legenda = "ensaio" }: HeroProps) {
  return (
    <section aria-label="Abertura" className="relative h-[calc(100svh-5.5rem)] min-h-[420px] w-full overflow-hidden bg-agua">
      {videoSrc ? (
        <video
          className="absolute inset-0 size-full object-cover motion-reduce:hidden"
          src={videoSrc}
          poster={posterSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      ) : (
        <HeroAnimado />
      )}
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-titulo text-xs uppercase tracking-[0.3em] text-tinta/70">
        {legenda}
      </p>
      {!videoSrc && process.env.NODE_ENV !== "production" ? (
        <p className="absolute right-4 top-4 bg-tinta/70 px-2 py-1 text-xs text-areia">
          vídeo simulado (placeholder)
        </p>
      ) : null}
    </section>
  );
}
