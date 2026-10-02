const MAX_TAG_LENGTH = 40;

/** Mesma etiqueta, sem diferenciar maiúsculas nem acentos ("Reunião" = "reuniao"). */
export const sameTag = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }) === 0;

/** Tira espaços extras e um "#" inicial: " #Back  end " → "Back end". */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, '').replace(/\s+/g, ' ').trim().slice(0, MAX_TAG_LENGTH);
}

/**
 * Nova lista com a etiqueta no fim, ou null se não há o que acrescentar:
 * texto vazio ou etiqueta que já existe (sem diferenciar maiúsculas nem acentos).
 */
export function addTag(tags: readonly string[], raw: string): string[] | null {
  const tag = normalizeTag(raw);
  if (!tag || tags.some((existing) => sameTag(existing, tag))) return null;
  return [...tags, tag];
}

/** Todas as etiquetas em uso, sem repetição, em ordem alfabética. */
export function collectTags(items: readonly { tags: readonly string[] }[]): string[] {
  const unique: string[] = [];
  for (const item of items) {
    for (const tag of item.tags) {
      if (!unique.some((existing) => sameTag(existing, tag))) unique.push(tag);
    }
  }
  return unique.sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
