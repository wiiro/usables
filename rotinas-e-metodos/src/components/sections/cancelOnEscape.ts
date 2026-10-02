import type { KeyboardEvent } from 'react';

/**
 * Esc dentro de um formulário de seção cancela só o formulário. Sem isso, o
 * Esc chegaria ao painel lateral em volta e fecharia o painel inteiro.
 */
export function cancelOnEscape(onCancel: () => void) {
  return (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    onCancel();
  };
}
