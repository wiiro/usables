import type { KeyboardEvent, ReactNode } from 'react';
import { useId } from 'react';
import { CountBadge } from './CountBadge';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  /** Número ao lado do nome (ex.: bloqueios ativos). 0 ou ausente = não mostra. */
  count?: number;
  /** Destaca o número em vermelho (ex.: há bloqueio ativo). */
  alert?: boolean;
}

interface TabsProps<T extends string> {
  label: string;
  items: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Conteúdo da aba ativa. */
  children: ReactNode;
}

/** Abas com o padrão de acessibilidade de tablist: setas, Home e End trocam de aba. */
export function Tabs<T extends string>({ label, items, value, onChange, children }: TabsProps<T>) {
  const baseId = useId();
  const tabId = (id: T) => `${baseId}-tab-${id}`;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.id === value);
    const targets: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: items.length - 1 };
    if (!(event.key in targets)) return;
    event.preventDefault();
    const next = items[(targets[event.key] + items.length) % items.length];
    onChange(next.id);
    document.getElementById(tabId(next.id))?.focus();
  };

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line">
        {items.map((item) => {
          const selected = item.id === value;
          return (
            <button
              key={item.id}
              id={tabId(item.id)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.id)}
              className={[
                '-mb-px inline-flex items-center gap-1.5 border-b-2 px-2.5 pb-2 text-sm font-medium whitespace-nowrap transition-colors',
                selected ? 'border-accent text-accent' : 'border-transparent text-fg-muted hover:text-fg',
              ].join(' ')}
            >
              {item.label}
              <CountBadge count={item.count} alert={item.alert} />
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={tabId(value)}>
        {children}
      </div>
    </div>
  );
}
