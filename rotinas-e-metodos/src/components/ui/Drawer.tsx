import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { useModalDialog } from './useModalDialog';

interface DrawerProps {
  title: string;
  /** Linha pequena acima do título, ex.: "Tarefa · Projeto A". */
  eyebrow?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/** Painel lateral à direita. Fica aberto enquanto estiver montado. */
export function Drawer({ title, eyebrow, onClose, children, footer }: DrawerProps) {
  const dialogProps = useModalDialog(onClose);
  const titleId = useId();

  return (
    <dialog
      {...dialogProps}
      aria-labelledby={titleId}
      className="fixed inset-y-0 right-0 left-auto m-0 h-full max-h-none w-full max-w-xl border-l border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/40"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-start gap-3 border-b border-line px-6 py-4">
          <div className="min-w-0 flex-1">
            {eyebrow && <div className="text-xs font-medium text-fg-muted">{eyebrow}</div>}
            <h2 id={titleId} className="truncate text-lg font-semibold">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-fg-muted hover:bg-surface-muted hover:text-fg"
            aria-label="Fechar painel"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex items-center gap-2 border-t border-line px-6 py-3">{footer}</footer>}
      </div>
    </dialog>
  );
}
