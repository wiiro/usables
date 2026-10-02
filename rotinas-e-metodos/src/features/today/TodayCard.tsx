import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface TodayCardProps {
  icon: LucideIcon;
  title: string;
  count?: number;
  /** Destaca o número em vermelho (atrasados, bloqueios). */
  alert?: boolean;
  children: ReactNode;
}

/** Bloco da tela Hoje. */
export function TodayCard({ icon: Icon, title, count, alert, children }: TodayCardProps) {
  return (
    <section className="flex flex-col rounded-xl border border-line bg-surface">
      <header className="flex items-center gap-2 border-b border-line px-5 py-3">
        <Icon className="size-4 text-fg-muted" aria-hidden />
        <h2 className="text-sm font-semibold">{title}</h2>
        {count !== undefined && count > 0 && (
          <span
            className={`ml-auto rounded-full px-2 text-xs font-semibold tabular-nums ${alert ? 'bg-red-600 text-white dark:bg-red-500 dark:text-red-950' : 'bg-surface-muted text-fg-muted'}`}
          >
            {count}
          </span>
        )}
      </header>
      <div className="flex-1 p-2">{children}</div>
    </section>
  );
}

export function CardEmpty({ children }: { children: ReactNode }) {
  return <p className="px-3 py-6 text-center text-sm text-fg-muted">{children}</p>;
}
