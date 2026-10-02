import { format } from 'date-fns';
import type { FormEvent } from 'react';
import { useId, useMemo, useState } from 'react';
import { formatDayLabel, toISODate } from '../../domain/dates';
import { itemsOf, sortProgressLogs } from '../../domain/sections';
import { useToday } from '../../hooks/useToday';
import type { ProgressLogFields } from '../../store/actions/sections';
import { useSectionActions } from '../../store/actions/useSectionActions';
import { useAppState } from '../../store/StoreContext';
import type { OwnerRef } from '../../types/common';
import type { ProgressLog } from '../../types/sections';
import { Button } from '../ui/Button';
import { DateInput, TextArea } from '../ui/form';
import { cancelOnEscape } from './cancelOnEscape';
import { MarkdownView } from './MarkdownView';
import { EmptyHint, EntryCard, SectionHeader } from './SectionParts';

/** "Avanços": diário do que foi feito/estudado, agrupado por dia (mais recente primeiro). */
export function ProgressLogSection({ owner }: { owner: OwnerRef }) {
  const { progressLogs } = useAppState();
  const { addProgressLog } = useSectionActions();
  const today = useToday();
  const [formKey, setFormKey] = useState(0);
  const groups = useMemo(() => groupByDate(sortProgressLogs(itemsOf(progressLogs, owner))), [progressLogs, owner]);

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title="Avanços" summary="O que você avançou, dia a dia." />
      <ProgressLogForm
        // Trocar a key limpa o formulário depois de registrar.
        key={formKey}
        initial={{ date: toISODate(today), content: '' }}
        submitLabel="Registrar avanço"
        onSubmit={(fields) => {
          addProgressLog(owner, fields);
          setFormKey((k) => k + 1);
        }}
      />
      {groups.length === 0 && <EmptyHint>Nenhum avanço registrado ainda.</EmptyHint>}
      {groups.map(([date, logs]) => (
        <div key={date} className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold tracking-wide text-fg-muted uppercase">{formatDayLabel(date, today)}</h3>
          <ul className="flex flex-col gap-2">
            {logs.map((log) => (
              <ProgressLogItem key={log.id} log={log} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

/** Junta registros já ordenados em grupos de mesma data, mantendo a ordem. */
function groupByDate(logs: ProgressLog[]): [string, ProgressLog[]][] {
  const groups: [string, ProgressLog[]][] = [];
  for (const log of logs) {
    const last = groups.at(-1);
    if (last && last[0] === log.date) last[1].push(log);
    else groups.push([log.date, [log]]);
  }
  return groups;
}

function ProgressLogItem({ log }: { log: ProgressLog }) {
  const { updateProgressLog, deleteProgressLog } = useSectionActions();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li>
        <ProgressLogForm
          initial={log}
          submitLabel="Salvar"
          onSubmit={(fields) => {
            updateProgressLog(log.id, fields);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }
  return (
    <EntryCard
      meta={`Registrado às ${format(new Date(log.createdAt), 'HH:mm')}`}
      onEdit={() => setEditing(true)}
      onDelete={() => deleteProgressLog(log.id)}
      deleteWhat="este avanço"
    >
      <MarkdownView source={log.content} />
    </EntryCard>
  );
}

interface ProgressLogFormProps {
  initial: ProgressLogFields;
  submitLabel: string;
  onSubmit: (fields: ProgressLogFields) => void;
  onCancel?: () => void;
}

function ProgressLogForm({ initial, submitLabel, onSubmit, onCancel }: ProgressLogFormProps) {
  const [draft, setDraft] = useState<ProgressLogFields>({ date: initial.date, content: initial.content });
  const id = useId();
  const canSubmit = draft.content.trim() !== '';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (canSubmit) onSubmit({ ...draft, content: draft.content.trim() });
  };

  return (
    <form
      onSubmit={submit}
      onKeyDown={onCancel ? cancelOnEscape(onCancel) : undefined}
      className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
    >
      <TextArea
        id={`${id}-content`}
        rows={3}
        value={draft.content}
        onChange={(e) => setDraft({ ...draft, content: e.target.value })}
        aria-label="O que você avançou"
        placeholder="O que você avançou? (aceita Markdown)"
        autoFocus={Boolean(onCancel)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <DateInput
          value={draft.date}
          onChange={(date) => date && setDraft({ ...draft, date })}
          aria-label="Dia do avanço"
          className="max-w-48"
        />
        <Button type="submit" variant="primary" disabled={!canSubmit}>
          {submitLabel}
        </Button>
        {onCancel && <Button onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
}
