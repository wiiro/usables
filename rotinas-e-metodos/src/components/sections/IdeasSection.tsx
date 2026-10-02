import { Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { useId, useMemo, useState } from 'react';
import { formatLongDate, toISODate } from '../../domain/dates';
import { itemsOf, sortIdeas } from '../../domain/sections';
import { useToday } from '../../hooks/useToday';
import type { IdeaFields } from '../../store/actions/sections';
import { useSectionActions } from '../../store/actions/useSectionActions';
import { useAppState } from '../../store/StoreContext';
import type { OwnerRef } from '../../types/common';
import type { Idea } from '../../types/sections';
import { Button } from '../ui/Button';
import { DateInput, Field, TextArea, TextInput } from '../ui/form';
import { cancelOnEscape } from './cancelOnEscape';
import { MarkdownView } from './MarkdownView';
import { EmptyHint, EntryCard, SectionHeader } from './SectionParts';

/** "Ideias": insights, conexões e coisas para aplicar, com data. */
export function IdeasSection({ owner }: { owner: OwnerRef }) {
  const { ideas } = useAppState();
  const { addIdea } = useSectionActions();
  const today = useToday();
  const [adding, setAdding] = useState(false);
  const list = useMemo(() => sortIdeas(itemsOf(ideas, owner)), [ideas, owner]);

  const addButton = !adding && (
    <Button size="sm" onClick={() => setAdding(true)}>
      <Plus className="size-4" aria-hidden />
      Nova ideia
    </Button>
  );

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="Ideias" summary="Insights, conexões e coisas para aplicar." action={addButton} />
      {adding && (
        <IdeaForm
          initial={{ title: '', description: '', date: toISODate(today) }}
          submitLabel="Adicionar ideia"
          onSubmit={(fields) => {
            addIdea(owner, fields);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}
      {list.length === 0 && !adding && <EmptyHint>Nenhuma ideia registrada ainda.</EmptyHint>}
      <ul className="flex flex-col gap-2">
        {list.map((idea) => (
          <IdeaItem key={idea.id} idea={idea} />
        ))}
      </ul>
    </section>
  );
}

function IdeaItem({ idea }: { idea: Idea }) {
  const { updateIdea, deleteIdea } = useSectionActions();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li>
        <IdeaForm
          initial={idea}
          submitLabel="Salvar"
          onSubmit={(fields) => {
            updateIdea(idea.id, fields);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }
  return (
    <EntryCard
      meta={formatLongDate(idea.date)}
      title={idea.title}
      onEdit={() => setEditing(true)}
      onDelete={() => deleteIdea(idea.id)}
      deleteWhat="esta ideia"
    >
      {idea.description && <MarkdownView source={idea.description} className="text-fg-muted" />}
    </EntryCard>
  );
}

interface IdeaFormProps {
  initial: IdeaFields;
  submitLabel: string;
  onSubmit: (fields: IdeaFields) => void;
  onCancel: () => void;
}

function IdeaForm({ initial, submitLabel, onSubmit, onCancel }: IdeaFormProps) {
  const [draft, setDraft] = useState<IdeaFields>({ title: initial.title, description: initial.description, date: initial.date });
  const id = useId();
  const canSubmit = draft.title.trim() !== '';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (canSubmit) onSubmit({ ...draft, title: draft.title.trim() });
  };

  return (
    <form onSubmit={submit} onKeyDown={cancelOnEscape(onCancel)} className="flex flex-col gap-3 rounded-xl border border-accent/40 bg-surface p-4">
      <Field label="Título" htmlFor={`${id}-title`}>
        <TextInput id={`${id}-title`} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} autoFocus />
      </Field>
      <Field label="Descrição" htmlFor={`${id}-description`} hint="Opcional. Aceita Markdown.">
        <TextArea
          id={`${id}-description`}
          rows={3}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
      </Field>
      <Field label="Data" htmlFor={`${id}-date`}>
        <DateInput id={`${id}-date`} value={draft.date} onChange={(date) => date && setDraft({ ...draft, date })} className="max-w-48" />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={!canSubmit}>
          {submitLabel}
        </Button>
        <Button onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
