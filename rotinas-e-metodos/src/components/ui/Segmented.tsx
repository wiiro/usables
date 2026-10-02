import type { LucideIcon } from 'lucide-react';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedProps<T extends string> {
  /** Nome do grupo para o leitor de tela, ex.: "Visualização". */
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Botões lado a lado, um ativo por vez (Kanban | Lista, Escrever | Visualizar). */
export function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-line bg-surface p-0.5">
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
        <button
          key={optionValue}
          type="button"
          aria-pressed={value === optionValue}
          onClick={() => onChange(optionValue)}
          className={[
            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition',
            value === optionValue ? 'bg-accent-soft text-accent' : 'text-fg-muted hover:text-fg',
          ].join(' ')}
        >
          {Icon && <Icon className="size-3.5" aria-hidden />}
          {optionLabel}
        </button>
      ))}
    </div>
  );
}
