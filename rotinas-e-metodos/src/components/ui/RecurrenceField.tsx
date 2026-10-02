import { useId } from 'react';
import type { ISODate, Recurrence, Weekday } from '../../types/common';
import { WEEKDAYS } from '../../types/common';
import { WEEKDAY_LABELS } from '../../domain/labels';
import type { RecurrenceFreq } from '../../domain/recurrence';
import { describeRecurrence, recurrenceFor } from '../../domain/recurrence';
import { Field, Select } from './form';

const FREQ_OPTIONS: { value: RecurrenceFreq | 'none'; label: string }[] = [
  { value: 'none', label: 'Não repete' },
  { value: 'daily', label: 'Diariamente' },
  { value: 'weekly', label: 'Semanalmente' },
  { value: 'monthly', label: 'Mensalmente' },
];

interface RecurrenceFieldProps {
  value: Recurrence | null;
  /** Data em que a série começa; sem ela, o campo fica desabilitado. */
  startDate: ISODate | null;
  /** Como a data se chama na tela: "data de entrega", "data planejada". */
  dateLabel: string;
  onChange: (recurrence: Recurrence | null) => void;
}

/** Repetição de tarefas e (na Etapa 5) tópicos. */
export function RecurrenceField({ value, startDate, dateLabel, onChange }: RecurrenceFieldProps) {
  const id = useId();

  const onFreqChange = (freq: string) => {
    if (freq === 'none' || !startDate) onChange(null);
    else onChange(recurrenceFor(freq as RecurrenceFreq, startDate));
  };

  const toggleDay = (day: Weekday) => {
    if (value?.freq !== 'weekly') return;
    const has = value.weekdays.includes(day);
    // A semanal precisa de pelo menos um dia: o último não desmarca.
    if (has && value.weekdays.length === 1) return;
    onChange({ freq: 'weekly', weekdays: has ? value.weekdays.filter((d) => d !== day) : [...value.weekdays, day] });
  };

  const hint = !startDate
    ? `Defina a ${dateLabel} para poder repetir.`
    : value
      ? describeRecurrence(value, startDate)
      : undefined;

  return (
    <Field label="Repetição" htmlFor={id} hint={hint}>
      <Select id={id} value={value?.freq ?? 'none'} disabled={!startDate} onChange={(e) => onFreqChange(e.target.value)}>
        {FREQ_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {value?.freq === 'weekly' && (
        <div role="group" aria-label="Dias da semana" className="flex gap-1">
          {WEEKDAYS.map((day) => {
            const pressed = value.weekdays.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={pressed}
                aria-label={WEEKDAY_LABELS[day].long}
                title={WEEKDAY_LABELS[day].long}
                onClick={() => toggleDay(day)}
                className={[
                  'size-8 rounded-full text-xs font-semibold transition',
                  pressed ? 'bg-accent text-accent-fg' : 'bg-surface-muted text-fg-muted hover:text-fg',
                ].join(' ')}
              >
                {WEEKDAY_LABELS[day].short}
              </button>
            );
          })}
        </div>
      )}
    </Field>
  );
}
