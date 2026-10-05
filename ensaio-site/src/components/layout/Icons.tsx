type P = { className?: string };
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const IconeBusca = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
);
export const IconeConta = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.6 3.5-5.5 7-5.5s6.2 1.9 7 5.5" /></svg>
);
export const IconeFavorito = ({ className }: P) => (
  <svg {...base} className={className}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>
);
export const IconeSacola = ({ className }: P) => (
  <svg {...base} className={className}><path d="M5.5 8h13l-1 12h-11l-1-12Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
);
export const IconeSeta = ({ className, esquerda }: P & { esquerda?: boolean }) => (
  <svg {...base} className={className}><path d={esquerda ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"} /></svg>
);
export const IconeInstagram = ({ className }: P) => (
  <svg {...base} className={className}><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.5" /><circle cx="16.8" cy="7.2" r=".6" fill="currentColor" /></svg>
);
export const IconeWhatsapp = ({ className }: P) => (
  <svg {...base} className={className}><path d="M4 20l1.2-4A8 8 0 1 1 8 18.8L4 20Z" /><path d="M9.5 9c.3 2 2.5 4.2 5 5l1-1.3-1.8-1-.8.7c-.8-.3-1.6-1.1-2-2l.7-.8-1-1.8L9.5 9Z" /></svg>
);
