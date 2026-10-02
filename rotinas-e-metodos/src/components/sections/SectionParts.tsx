import { Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { IconButton } from '../ui/IconButton';

// Peças comuns às seções em lista (ideias, bloqueios, avanços, dúvidas).

export function SectionHeader({ title, summary, action }: { title: string; summary?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {summary && <p className="text-xs text-fg-muted">{summary}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-fg-muted">{children}</p>;
}

interface EntryCardProps {
  meta?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
  /** Botões extras antes de editar/excluir (ex.: "Resolver"). */
  actions?: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  /** Como o item aparece na pergunta de confirmação: "esta ideia". */
  deleteWhat: string;
  tone?: 'default' | 'alert';
}

/** Um item da seção, com editar e excluir (excluir pede confirmação). */
export function EntryCard({ meta, title, children, actions, onEdit, onDelete, deleteWhat, tone = 'default' }: EntryCardProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li
      className={[
        'rounded-xl border bg-surface p-4',
        tone === 'alert' ? 'border-red-300 dark:border-red-900' : 'border-line',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {meta && <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">{meta}</div>}
          {title && <h3 className="mt-1 font-medium">{title}</h3>}
          {children && <div className="mt-1">{children}</div>}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {actions}
          <IconButton label="Editar" onClick={onEdit}>
            <Pencil className="size-4" aria-hidden />
          </IconButton>
          <IconButton label="Excluir" onClick={() => setConfirming(true)} className="hover:text-red-600">
            <Trash2 className="size-4" aria-hidden />
          </IconButton>
        </div>
      </div>
      {confirming && (
        <ConfirmDialog
          title={`Excluir ${deleteWhat}?`}
          confirmLabel="Excluir"
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            onDelete();
          }}
        >
          Não dá para desfazer.
        </ConfirmDialog>
      )}
    </li>
  );
}
