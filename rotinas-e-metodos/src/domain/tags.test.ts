import { describe, expect, it } from 'vitest';
import { addTag, collectTags, normalizeTag } from './tags';

describe('normalizeTag', () => {
  it('tira espaços extras e o # inicial', () => {
    expect(normalizeTag('  #Back   end ')).toBe('Back end');
  });

  it('limita o tamanho', () => {
    expect(normalizeTag('x'.repeat(100))).toHaveLength(40);
  });
});

describe('addTag', () => {
  it('acrescenta no fim', () => {
    expect(addTag(['api'], 'front')).toEqual(['api', 'front']);
  });

  it('ignora vazia e repetida, mesmo com maiúsculas ou acentos diferentes', () => {
    expect(addTag(['Reunião'], '   ')).toBeNull();
    expect(addTag(['Reunião'], 'reuniao')).toBeNull();
    expect(addTag(['API'], '#api')).toBeNull();
  });
});

describe('collectTags', () => {
  it('junta as etiquetas de todos os itens, sem repetir, em ordem alfabética', () => {
    const items = [{ tags: ['zeta', 'API'] }, { tags: ['api', 'Ética'] }, { tags: [] }];
    expect(collectTags(items)).toEqual(['API', 'Ética', 'zeta']);
  });
});
