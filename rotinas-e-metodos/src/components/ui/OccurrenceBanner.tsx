import { Repeat } from 'lucide-react';
import { formatDayLabel } from '../../domain/dates';
import { occursOn } from '../../domain/recurrence';
import { useToday } from '../../hooks/useToday';
import type { ISODate, Recurrence } from '../../types/common';

interface OccurrenceBannerProps {
  /** Data da ocorrência clicada (vem do calendário ou da tela Hoje). */
  date: ISODate | null;
  recurrence: Recurrence | null;
  startDate: ISODate | null;
  completedOccurrences: ISODate[];
  onToggle: (date: ISODate, done: boolean) => void;
}

/**
 * Item recorrente aberto a partir de uma ocorrência: permite marcar só aquele
 * dia como feito (a série continua). Não aparece se a data não for mais uma
 * ocorrência (ex.: a regra mudou depois do clique).
 */
export function OccurrenceBanner({ date, recurrence, startDate, completedOccurrences, onToggle }: OccurrenceBannerProps) {
  const today = useToday();
  if (!date || !recurrence || !startDate || !occursOn(recurrence, startDate, date)) return null;
  const done = completedOccurrences.includes(date);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-line bg-surface-muted/60 px-3 py-2 text-sm">
      <Repeat className="size-4 text-fg-muted" aria-hidden />
      <span>
        Ocorrência de <strong>{formatDayLabel(date, today)}</strong>
      </span>
      <label className="ml-auto inline-flex cursor-pointer items-center gap-2 font-medium">
        <input
          type="checkbox"
          checked={done}
          onChange={(event) => onToggle(date, event.target.checked)}
          className="size-4 accent-accent"
        />
        Feita nesta data
      </label>
    </div>
  );
}
