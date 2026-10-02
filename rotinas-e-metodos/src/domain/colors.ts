/**
 * Cores para projetos (e, na Etapa 5, matérias). Tons médios, que funcionam
 * como fundo de evento no calendário e como barra de progresso nos dois temas.
 */
export const ITEM_COLORS = [
  { value: '#2563eb', name: 'Azul' },
  { value: '#4f46e5', name: 'Índigo' },
  { value: '#7c3aed', name: 'Violeta' },
  { value: '#c026d3', name: 'Magenta' },
  { value: '#db2777', name: 'Rosa' },
  { value: '#dc2626', name: 'Vermelho' },
  { value: '#ea580c', name: 'Laranja' },
  { value: '#ca8a04', name: 'Amarelo' },
  { value: '#16a34a', name: 'Verde' },
  { value: '#0d9488', name: 'Verde-água' },
  { value: '#0891b2', name: 'Ciano' },
  { value: '#64748b', name: 'Cinza' },
] as const;

/** Luminância relativa (WCAG) de uma cor '#rrggbb'. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const DARK_TEXT = '#111827';
const LIGHT_TEXT = '#ffffff';

/** Texto branco ou escuro, o que tiver mais contraste sobre a cor de fundo (ex.: amarelo pede texto escuro). */
export function readableTextColor(background: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(background)) return LIGHT_TEXT;
  const bg = luminance(background);
  const contrastWithWhite = 1.05 / (bg + 0.05);
  const contrastWithDark = (bg + 0.05) / (luminance(DARK_TEXT) + 0.05);
  return contrastWithWhite >= contrastWithDark ? LIGHT_TEXT : DARK_TEXT;
}

export const DEFAULT_PROJECT_COLOR = ITEM_COLORS[0].value;
export const DEFAULT_SUBJECT_COLOR = ITEM_COLORS[8].value; // verde
