import type { ReactNode } from 'react';
import { useId } from 'react';
import { Button } from './Button';
import { useModalDialog } from './useModalDialog';

interface ConfirmDialogProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Pergunta de confirmação para ações que não têm volta (excluir). */
export function ConfirmDialog({ title, children, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogProps = useModalDialog(onCancel);
  const titleId = useId();

  return (
    <dialog
      {...dialogProps}
      role="alertdialog"
      aria-labelledby={titleId}
      className="m-auto w-full max-w-md rounded-xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/40"
    >
      <div className="px-6 py-5">
        <h2 id={titleId} className="text-base font-semibold">
          {title}
        </h2>
        <div className="mt-2 text-sm text-fg-muted">{children}</div>
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-6 py-3">
        {/* Foco inicial em Cancelar: um Enter distraído não exclui nada. */}
        <Button onClick={onCancel} data-autofocus>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
