import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Link de volta mostrado no lugar do nome do app, ex.: "Projetos". */
  back?: { to: string; label: string };
  /** Quadradinho de cor antes do título (cor do projeto/matéria). */
  color?: string;
  /** Botões à direita do título. */
  actions?: ReactNode;
  /** Conteúdo extra abaixo do título (ex.: barra de progresso). */
  children?: ReactNode;
}

export function PageHeader({ title, description, back, color, actions, children }: PageHeaderProps) {
  return (
    <header className="border-b border-line bg-surface px-6 py-5 md:px-8">
      {back ? (
        <Link
          to={back.to}
          className="inline-flex items-center gap-0.5 text-xs font-medium text-fg-muted hover:text-fg"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          {back.label}
        </Link>
      ) : (
        <p className="text-xs font-medium uppercase tracking-wider text-fg-muted">Rotinas e Métodos</p>
      )}
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
            {color && <span className="size-3.5 shrink-0 rounded" style={{ backgroundColor: color }} aria-hidden />}
            <span className="truncate">{title}</span>
          </h1>
          {description && <div className="mt-1 text-sm text-fg-muted">{description}</div>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
