import { toPercent } from '../../domain/progress';

interface ProgressBarProps {
  /** Fração de 0 a 1; null quando não há itens para medir. */
  value: number | null;
  /** Nome lido pelo leitor de tela, ex.: "Progresso do projeto". */
  label: string;
  color?: string;
  size?: 'sm' | 'md';
}

export function ProgressBar({ value, label, color, size = 'md' }: ProgressBarProps) {
  const percent = value === null ? 0 : toPercent(value);

  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value === null ? undefined : percent}
        aria-valuetext={value === null ? 'Sem itens' : `${percent}%`}
        className={`flex-1 overflow-hidden rounded-full bg-surface-muted ${size === 'sm' ? 'h-1.5' : 'h-2'}`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${percent}%`, backgroundColor: color ?? 'var(--app-accent)' }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-fg-muted">
        {value === null ? '—' : `${percent}%`}
      </span>
    </div>
  );
}
