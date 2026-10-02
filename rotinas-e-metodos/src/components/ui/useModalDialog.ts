import type { MouseEvent, SyntheticEvent } from 'react';
import { useEffect, useRef } from 'react';

/**
 * Liga um <dialog> nativo em modo modal enquanto o componente estiver montado.
 * O navegador cuida de prender o foco, do Esc e do fundo escurecido; aqui só
 * abrimos, tratamos o clique fora e devolvemos o foco a quem abriu.
 * Para fechar, quem usa desmonta o componente (onClose avisa quando pedir).
 */
export function useModalDialog(onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  // Só fecha se o clique começou E terminou no fundo: arrastar uma seleção
  // de texto de dentro para fora do painel não deve fechá-lo.
  const pressedOnBackdrop = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    // O autoFocus do React roda antes do showModal, que depois move o foco
    // para o primeiro botão. Quem quiser foco inicial marca com data-autofocus.
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => {
      // No StrictMode o efeito roda duas vezes com o dialog ainda na página;
      // só devolve o foco quando ele saiu de fato.
      if (!dialog.isConnected) opener?.focus();
    };
  }, []);

  return {
    ref,
    // Esc dispara "cancel": deixamos quem usa decidir e desmontar.
    // No React, cancel/close de um dialog filho (ex.: a confirmação dentro do
    // painel) também chegam aos handlers do pai; a checagem de target evita
    // que um Esc na confirmação feche o painel junto.
    onCancel: (event: SyntheticEvent<HTMLDialogElement>) => {
      if (event.target !== event.currentTarget) return;
      event.preventDefault();
      onClose();
    },
    // O Chrome não deixa cancelar um segundo Esc seguido e fecha o dialog por
    // conta própria; nesse caso, avisa para quem usa desmontar também.
    onClose: (event: SyntheticEvent<HTMLDialogElement>) => {
      if (event.target === event.currentTarget) onClose();
    },
    onMouseDown: (event: MouseEvent<HTMLDialogElement>) => {
      pressedOnBackdrop.current = event.target === event.currentTarget;
    },
    onClick: (event: MouseEvent<HTMLDialogElement>) => {
      if (pressedOnBackdrop.current && event.target === event.currentTarget) onClose();
      pressedOnBackdrop.current = false;
    },
  };
}
