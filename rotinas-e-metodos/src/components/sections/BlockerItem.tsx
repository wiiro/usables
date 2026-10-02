import { CheckCircle2, RotateCcw } from 'lucide-react';
import type { FormEvent } from 'react';
import { useId, useState } from 'react';
import { dateOfTimestamp, daysBetween, formatShortDate, toISODate } from '../../domain/dates';
import { useToday } from '../../hooks/useToday';
import { useSectionActions } from '../../store/actions/useSectionActions';
import type { Blocker } from '../../types/sections';
import { Button } from '../ui/Button';
import { DateInput, Field, TextArea } from '../ui/form';
import { cancelOnEscape } from './cancelOnEscape';
import { EntryCard } from './SectionParts';

const STATUS_STYLE = {
  active: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
};

const daysLabel = (days: number) => (days === 1 ? '1 dia' : `${days} dias`);

/** "Resolvido em 30 set · durou 2 dias" (ou "no mesmo dia"). */
function resolvedLabel(since: string, resolvedOn: string, today: Date): string {
  const duration = Math.max(0, daysBetween(since, resolvedOn));
  const how = duration === 0 ? 'no mesmo dia' : `durou ${daysLabel(duration)}`;
  return `Resolvido em ${formatShortDate(resolvedOn, today)} · ${how}`;
}

export function BlockerItem({ blocker }: { blocker: Blocker }) {
  const { setBlockerStatus, deleteBlocker } = useSectionActions();
  const today = useToday();
  const [editing, setEditing] = useState(false);
  const active = blocker.status === 'active';
  const since = dateOfTimestamp(blocker.createdAt);
  const age = daysBetween(since, toISODate(today));

  if (editing) return <BlockerEditForm blocker={blocker} onDone={() => setEditing(false)} />;

  const meta = (
    <>
      <span className={`rounded-md px-1.5 py-0.5 font-medium ${STATUS_STYLE[blocker.status]}`}>{active ? 'Ativo' : 'Resolvido'}</span>
      {active ? (
        <span>
          Desde {formatShortDate(since, today)} ({age === 0 ? 'registrado hoje' : `há ${daysLabel(age)}`})
        </span>
      ) : (
        blocker.resolvedOn && <span>{resolvedLabel(since, blocker.resolvedOn, today)}</span>
      )}
    </>
  );

  const toggle = (
    <Button size="sm" variant="ghost" onClick={() => setBlockerStatus(blocker.id, active ? 'resolved' : 'active')}>
      {active ? <CheckCircle2 className="size-4" aria-hidden /> : <RotateCcw className="size-4" aria-hidden />}
      {active ? 'Resolver' : 'Reabrir'}
    </Button>
  );

  return (
    <EntryCard
      tone={active ? 'alert' : 'default'}
      meta={meta}
      actions={toggle}
      onEdit={() => setEditing(true)}
      onDelete={() => deleteBlocker(blocker.id)}
      deleteWhat="este bloqueio"
    >
      <p className={`text-sm whitespace-pre-wrap ${active ? '' : 'text-fg-muted'}`}>{blocker.description}</p>
    </EntryCard>
  );
}

function BlockerEditForm({ blocker, onDone }: { blocker: Blocker; onDone: () => void }) {
  const { updateBlocker } = useSectionActions();
  const [description, setDescription] = useState(blocker.description);
  const [resolvedOn, setResolvedOn] = useState(blocker.resolvedOn);
  const id = useId();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!description.trim()) return;
    updateBlocker(blocker.id, { description: description.trim(), resolvedOn: blocker.status === 'resolved' ? resolvedOn : null });
    onDone();
  };

  return (
    <li>
      <form onSubmit={submit} onKeyDown={cancelOnEscape(onDone)} className="flex flex-col gap-3 rounded-xl border border-accent/40 bg-surface p-4">
        <Field label="Descrição" htmlFor={`${id}-description`}>
          <TextArea id={`${id}-description`} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} autoFocus />
        </Field>
        {blocker.status === 'resolved' && (
          <Field label="Resolvido em" htmlFor={`${id}-resolved`}>
            <DateInput id={`${id}-resolved`} value={resolvedOn} onChange={(date) => date && setResolvedOn(date)} className="max-w-48" />
          </Field>
        )}
        <div className="flex gap-2">
          <Button type="submit" variant="primary" disabled={!description.trim()}>
            Salvar
          </Button>
          <Button onClick={onDone}>Cancelar</Button>
        </div>
      </form>
    </li>
  );
}
